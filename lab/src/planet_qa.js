#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditPlanetClosure } from './planet_closure.js';
import { runStructureAudits } from './structure_audit.js';
import { checkPlugin } from './checks.js';

let passed = 0;
let failed = 0;
const started = process.hrtime.bigint();

function mark(ok, name, detail = '') {
  if (ok) {
    passed++;
    console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function expect(name, fn) {
  try {
    const value = await fn();
    if (value === false) mark(false, name);
    else mark(true, name, typeof value === 'string' ? value : '');
  } catch (e) {
    mark(false, name, e?.message || String(e));
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function singleJson(dir) {
  const files = fs.readdirSync(dir).filter(n => n.toLowerCase().endsWith('.json')).sort();
  if (files.length !== 1) throw new Error(`expected one JSON in ${dir}, got ${files.length}`);
  return path.join(dir, files[0]);
}

function proc(decl, id) {
  const p = decl.processes.find(x => x?.id === id);
  if (!p) throw new Error(`declaration process not found: ${id}`);
  return p;
}

function audit(raw, decl) {
  return auditPlanetClosure(raw, decl, openBoundaries);
}

function mustFailFor(result, id, colony = undefined) {
  if (result.status !== 'FAIL') throw new Error('expected FAIL, got ' + result.status);
  const hit = result.errors.find(e => e.process === id && (colony === undefined || e.colony === colony));
  if (!hit) throw new Error(`missing error for ${id}${colony === undefined ? '' : `[${colony}]`}: ${JSON.stringify(result.errors)}`);
  return hit;
}

function weirdName(template) {
  const marker = '__COLONY_TOKEN__';
  return '  ' + String(template).replaceAll('{C}', marker).toLowerCase().replaceAll(marker.toLowerCase(), '{C}') + '  ';
}

function mutateDeclarationNames(decl) {
  const out = structuredClone(decl);
  if (out.energy) {
    out.energy.total_request = weirdName(out.energy.total_request);
    out.energy.fulfillment = weirdName(out.energy.fulfillment);
  }
  for (const p of out.processes || []) {
    p.output = weirdName(p.output);
    if (p.legacy?.switch) p.legacy.switch = weirdName(p.legacy.switch);
    if (p.capacity?.stock) p.capacity.stock = weirdName(p.capacity.stock);
    if (p.capacity?.parameter) p.capacity.parameter = weirdName(p.capacity.parameter);
    if (p.energy?.request) p.energy.request = weirdName(p.energy.request);
    if (p.deposit?.stock) p.deposit.stock = weirdName(p.deposit.stock);
    if (p.labor?.intensity) p.labor.intensity = weirdName(p.labor.intensity);
  }
  if (out.demand_drivers) {
    out.demand_drivers.parameters = out.demand_drivers.parameters.map(weirdName);
    out.demand_drivers.consumption = out.demand_drivers.consumption.map(weirdName);
  }
  return out;
}

const acceptedFile = singleJson(path.resolve('reference', 'accepted', 'model'));
const validationFile = singleJson(path.resolve('input', 'validation'));
const accepted = readJson(acceptedFile);
const validation = readJson(validationFile);
const embedded = (validation.plugins || []).find(p => p?.type === 'planet_closure');
const fallbackFile = path.resolve('..', 'docs', 'tasks', '011-planet-closure', 'planet_closure-v7.7.1.json');
const declaration = embedded || readJson(fallbackFile);
const declarationSource = embedded ? `accepted validation: ${validationFile}` : `task declaration: ${fallbackFile}`;
const openBoundaries = (validation.plugins || []).find(p => p?.type === 'open_boundaries');

// Expected counters are computed from the declaration's own kinds (an oracle independent of the model checks):
// when every declaration is verified (0 errors), the audit's counters must equal these. The accepted declaration
// moves with each Planet v1 step, so the self-test follows it instead of pinning one model version.
function declaredCounters(d) {
  const cols = (d.colonies || []).length;
  const n = s => (String(s).includes('{C}') ? cols : 1);
  const c = { processes: 0, legacy: 0, P2: { kernel: 0, simple: 0, exceptions: 0, undeclared: 0 }, P3: { requests: 0, producer: 0, exceptions: 0, undeclared: 0 },
    P4: { with_deposit: 0, without_deposit: 0 }, P5: { declared: 0, undeclared: 0 }, P6: { drivers: 0 } };
  for (const p of d.processes || []) {
    const k = n(p.output);
    if (p.legacy) { c.legacy += k; continue; }
    c.processes += k;
    const cap = p.capacity?.kind; if (cap === 'kernel') c.P2.kernel += k; else if (cap === 'simple') c.P2.simple += k; else if (cap === 'constant' || cap === 'unbounded') c.P2.exceptions += k; else c.P2.undeclared += k;
    const en = p.energy?.kind; if (en === 'requests') c.P3.requests += k; else if (en === 'producer') c.P3.producer += k; else if (en === 'none') c.P3.exceptions += k; else c.P3.undeclared += k;
    if (p.kind === 'extraction') { if (p.deposit?.kind === 'stock') c.P4.with_deposit += k; else c.P4.without_deposit += k; }
    if (p.labor?.kind === 'declared') c.P5.declared += k; else c.P5.undeclared += k;
  }
  for (const s of d.demand_drivers?.parameters || []) c.P6.drivers += n(s);
  return c;
}
const EXP = declaredCounters(declaration);
const sig = c => `P2=${c.P2.kernel}/${c.P2.simple}/${c.P2.exceptions}/${c.P2.undeclared}; P3=${c.P3.requests}/${c.P3.producer}/${c.P3.exceptions}/${c.P3.undeclared}; P4=${c.P4.with_deposit}/${c.P4.without_deposit}; P5=${c.P5.declared}/${c.P5.undeclared}; P6=${c.P6.drivers}`;

console.log('Orbital Economy Lab Planet v1 closure QA');
console.log('Declaration source: ' + declarationSource);
console.log('16 static-audit cases through checkpoint KT3.\n');

try {
  await expect('1 accepted model matches the counters of its own declaration exactly', () => {
    const r = auditPlanetClosure(accepted, declaration, openBoundaries);
    const got = { processes: r.counters.processes, legacy: r.counters.legacy, P2: r.counters.P2, P3: r.counters.P3, P4: r.counters.P4, P5: r.counters.P5, P6: r.counters.P6 };
    const ok = r.status === 'PASS'
      && r.mode === 'report'
      && r.errors.length === 0
      && JSON.stringify(got) === JSON.stringify(EXP)
      && EXP.processes === 17 && EXP.legacy === 2
      && r.reversibility.length === 0
      && r.undeclared.length === 0
      && r.processes.length === 19
      && r.exceptions.filter(x => x.dimension === 'P2').length === EXP.P2.exceptions
      && r.exceptions.filter(x => x.dimension === 'P3').length === EXP.P3.exceptions;
    if (!ok) throw new Error(JSON.stringify({ expected: EXP, audit: r }));
    return `PASS; processes=17 legacy=2 expected=${r.counters.expected_process_outputs}; ${sig(EXP)}; reversibility=0`;
  });

  await expect('2 L1 mining cannot claim Refinery kernel capacity within max_hops', () => {
    const d = structuredClone(declaration);
    proc(d, 'mining').capacity = { kind: 'kernel', stock: '{C} Refinery Active Capacity' };
    const r = audit(accepted, d);
    mustFailFor(r, 'mining', 'A');
    mustFailFor(r, 'mining', 'B');
    const a = r.processes.find(x => x.instance === 'mining[A]');
    const path = a?.paths?.capacity_shortest;
    if (!path || path.length - 1 <= d.max_hops) throw new Error('missing >max shortest path: ' + JSON.stringify(a));
    return `mining[A] shortest=${path.length - 1} hops: ${path.join(' -> ')}`;
  });

  await expect('3 L2 construction materials cannot borrow Metal energy request', () => {
    const d = structuredClone(declaration);
    proc(d, 'construction_materials').energy = { kind: 'requests', request: '{C} Metal Requested Energy' };
    const r = audit(accepted, d);
    const a = mustFailFor(r, 'construction_materials', 'A');
    mustFailFor(r, 'construction_materials', 'B');
    return `construction_materials[A]: ${a.message}`;
  });

  await expect('4 L3 shared transport cannot claim A Power kernel capacity within max_hops', () => {
    const d = structuredClone(declaration);
    proc(d, 'transport').capacity = { kind: 'kernel', stock: 'A Power Active Generation Capital' };
    const r = audit(accepted, d);
    const e = mustFailFor(r, 'transport');
    const p = r.processes.find(x => x.instance === 'transport')?.paths?.capacity_shortest;
    if (!p || p.length - 1 <= d.max_hops) throw new Error('missing >max transport path');
    return `transport shortest=${p.length - 1} hops: ${p.join(' -> ')}; ${e.message}`;
  });

  await expect('5 L4 smelting cannot use Electronics energy request without shared planned rate', () => {
    const d = structuredClone(declaration);
    proc(d, 'smelting').energy = { kind: 'requests', request: '{C} Electronics Requested Energy' };
    const r = audit(accepted, d);
    const a = mustFailFor(r, 'smelting', 'A');
    mustFailFor(r, 'smelting', 'B');
    if (!/shares no planned-rate/i.test(a.message)) throw new Error('unexpected L4 error: ' + a.message);
    return `smelting[A]: ${a.message}`;
  });

  await expect('6 L5 electronics cannot claim Refinery kernel capacity within max_hops', () => {
    const d = structuredClone(declaration);
    proc(d, 'electronics').capacity = { kind: 'kernel', stock: '{C} Refinery Active Capacity' };
    const r = audit(accepted, d);
    mustFailFor(r, 'electronics', 'A');
    mustFailFor(r, 'electronics', 'B');
    const p = r.processes.find(x => x.instance === 'electronics[A]')?.paths?.capacity_shortest;
    if (!p || p.length - 1 <= d.max_hops) throw new Error('missing >max electronics path');
    return `electronics[A] shortest=${p.length - 1} hops: ${p.join(' -> ')}`;
  });

  await expect('7 missing process declaration is metric in report and FAIL in classify', () => {
    // The removed process must have a source output (a flow from the void): extractions stop being source outputs
    // once they draw from deposits (v7.7.8), so the process is chosen from the model, not named.
    const sourceFlow = n => accepted.elements.some(e => e.type === 'FLOW' && e.name === n && e.from == null);
    const victim = declaration.processes.find(p => !p.legacy && String(p.output).includes('{C}')
      && ['A', 'B'].every(c => sourceFlow(String(p.output).replaceAll('{C}', c))));
    if (!victim) throw new Error('no per-colony process with a source output left — rewrite this fixture');
    const d = structuredClone(declaration);
    d.processes = d.processes.filter(p => p.id !== victim.id);
    d.enforce = 'report';
    const report = audit(accepted, d);
    const names = report.undeclared.map(x => x.output).sort();
    const want = ['A', 'B'].map(c => String(victim.output).replaceAll('{C}', c)).sort();
    if (!(report.status === 'PASS' && report.undeclared.length === 2
      && names.join('|') === want.join('|'))) {
      throw new Error('report mismatch: ' + JSON.stringify({ status: report.status, undeclared: report.undeclared }));
    }
    d.enforce = 'classify';
    const classify = audit(accepted, d);
    return classify.status === 'FAIL' && classify.modeFailures.some(x => x.dimension === 'processes' && x.count === 2);
  });

  await expect('8 constant capacity without reason is declaration FAIL', () => {
    const d = structuredClone(declaration);
    // Declared constant without a reason; built explicitly because mining itself is capital since v7.7.6 and its
    // old parameter survives only in the switched-off branch.
    proc(d, 'mining').capacity = { kind: 'constant', parameter: '{C} Mining Capacity' };
    const r = audit(accepted, d);
    if (r.status !== 'FAIL' || !r.errors.some(e => e.process === 'mining' && /reason/i.test(e.message))) {
      throw new Error(JSON.stringify(r.errors));
    }
    return 'missing reason rejected';
  });

  await expect('9 planet_v1 and planet_strict fail on exactly the intended dimensions', () => {
    const v1d = structuredClone(declaration);
    v1d.enforce = 'planet_v1';
    const v1 = audit(accepted, v1d);
    const v1sig = v1.modeFailures.map(x => `${x.dimension}:${x.count}`).join(',');
    // Expected failing dimensions are the non-zero debts only: a dimension that reaches zero (P2 exceptions
    // since v7.7.7) no longer fails, and with no debts left the mode passes.
    const sig = parts => parts.filter(([, n]) => n > 0).map(([d, n]) => `${d}:${n}`).join(',');
    const v1want = sig([['P4', EXP.P4.without_deposit], ['P5', EXP.P5.undeclared]]);
    if (!(v1.status === (v1want ? 'FAIL' : 'PASS') && v1sig === v1want)) throw new Error('planet_v1: ' + v1sig);

    const sd = structuredClone(declaration);
    sd.enforce = 'planet_strict';
    const strict = audit(accepted, sd);
    const ssig = strict.modeFailures.map(x => `${x.dimension}:${x.count}`).join(',');
    const swant = sig([['P4', EXP.P4.without_deposit], ['P5', EXP.P5.undeclared], ['P2 exceptions', EXP.P2.exceptions], ['P3 exceptions', EXP.P3.exceptions]]);
    if (!(strict.status === (swant ? 'FAIL' : 'PASS') && ssig === swant)) {
      throw new Error('planet_strict: ' + ssig);
    }
    return `planet_v1=${v1sig}; planet_strict=${ssig}`;
  });

  await expect('10 constant-capacity reversibility violation is reported and gates planet_v1', () => {
    const raw = structuredClone(accepted);
    // The constant is taken from the declaration (first constant-capacity process) and read by a probe variable
    // outside every process, so the case follows Planet v1 steps: capital goods, then regolith (v7.7.5) were
    // fixtures read by A Mining Rate until they moved to capital.
    // Once no process is on a constant any more (v7.7.6: ore, the last one, moved to simple capital), the fixture
    // declares mining as constant again: its old parameter still exists, read through the switched-off branch of
    // the effective mining capacity, so the capacity path proof holds and only the probe violates reversibility.
    const fixtureDecl = structuredClone(declaration);
    let constProc = (fixtureDecl.processes || []).find(p => p.capacity?.kind === 'constant');
    if (!constProc) {
      constProc = (fixtureDecl.processes || []).find(p => p.id === 'mining');
      if (!constProc || !raw.elements.some(e => e?.type === 'VARIABLE' && e.name === 'A Mining Capacity')) {
        throw new Error('no constant-capacity process is left and the mining fallback does not apply — rewrite this fixture');
      }
      constProc.capacity = { kind: 'constant', parameter: '{C} Mining Capacity', reason: 'planet QA case 10 fixture' };
    }
    const param = String(constProc.capacity.parameter).replaceAll('{C}', 'A');
    const probe = 'QA Reversibility Probe';
    raw.elements.push({ type: 'VARIABLE', name: probe, behavior: { value: `0 * [${param}]` } });
    raw.elements.push({ type: 'LINK', from: param, to: probe });

    const rd = structuredClone(fixtureDecl);
    rd.enforce = 'report';
    const report = audit(raw, rd);
    if (!(report.status === 'PASS' && report.reversibility.length === 1
      && report.reversibility[0].parameter === param
      && report.reversibility[0].reader === probe)) {
      throw new Error(JSON.stringify(report.reversibility));
    }
    const vd = structuredClone(fixtureDecl);
    vd.enforce = 'planet_v1';
    const v1 = audit(raw, vd);
    return v1.status === 'FAIL' && v1.modeFailures.some(x => x.dimension === 'reversibility' && x.count === 1)
      ? 'report reversibility=1; planet_v1 gated'
      : false;
  });

  await expect('11 deposit stocks close extractions; asymmetric deposit declaration fails', () => {
    const outFlow = (raw, p, c) => raw.elements.find(e => e?.type === 'FLOW' && e.name === String(p.output).replaceAll('{C}', c));
    const open = declaration.processes.find(p => p.kind === 'extraction' && !p.legacy && (p.deposit?.kind ?? 'none') === 'none'
      && ['A', 'B'].every(c => outFlow(accepted, p, c)?.from == null));
    if (open) {
      // A process still extracting from the void: give it deposit stocks in both colonies, then in A only.
      const stock = c => `${c} ${open.id} QA Deposit`;
      const raw = structuredClone(accepted);
      for (const c of ['A', 'B']) {
        raw.elements.push({ type: 'STOCK', name: stock(c), behavior: { initial_value: 1000000, non_negative: true } });
        outFlow(raw, open, c).from = stock(c);
      }
      const d = structuredClone(declaration);
      proc(d, open.id).deposit = { kind: 'stock', stock: `{C} ${open.id} QA Deposit` };
      const r = audit(raw, d);
      if (!(r.status === 'PASS' && r.counters.P4.with_deposit === EXP.P4.with_deposit + 2 && r.counters.P4.without_deposit === EXP.P4.without_deposit - 2)) {
        throw new Error(JSON.stringify({ status: r.status, P4: r.counters.P4, errors: r.errors }));
      }
      const one = structuredClone(accepted);
      one.elements.push({ type: 'STOCK', name: stock('A'), behavior: { initial_value: 1000000, non_negative: true } });
      outFlow(one, open, 'A').from = stock('A');
      const be = mustFailFor(audit(one, d), open.id, 'B');
      return `${open.id}: both deposits PASS; one-sided FAIL ${open.id}[B]: ${be.message}`;
    }
    // Every extraction already draws from its declared deposit (v7.7.8 on): send B's flow back to the void.
    const closed = declaration.processes.find(p => p.kind === 'extraction' && !p.legacy && p.deposit?.kind === 'stock');
    if (!closed) throw new Error('no extraction process with or without a deposit — rewrite this fixture');
    const r = audit(accepted, declaration);
    if (!(r.status === 'PASS' && r.counters.P4.with_deposit === EXP.P4.with_deposit)) throw new Error(JSON.stringify({ P4: r.counters.P4, errors: r.errors }));
    const one = structuredClone(accepted);
    outFlow(one, closed, 'B').from = null;
    const be = mustFailFor(audit(one, declaration), closed.id, 'B');
    return `${closed.id}: accepted deposits P4=${r.counters.P4.with_deposit}/${r.counters.P4.without_deposit} PASS; B flow back to the void FAIL: ${be.message}`;
  });

  await expect('12 demand driver that depends on a stock is declaration FAIL', () => {
    const d = structuredClone(declaration);
    d.demand_drivers.parameters[0] = '{C} Market Price';
    const r = audit(accepted, d);
    if (r.status !== 'FAIL' || !r.errors.some(e => /demand driver .*Market Price.*depends on a STOCK/i.test(e.message))) {
      throw new Error(JSON.stringify(r.errors));
    }
    return 'Market Price rejected as endogenous/state-dependent demand driver';
  });

  await expect('13 declared labor intensity must be read by a formula', () => {
    const raw = structuredClone(accepted);
    raw.elements.push({ type: 'VARIABLE', name: 'A QA Unused Labor', behavior: { value: 1 } });
    raw.elements.push({ type: 'VARIABLE', name: 'B QA Unused Labor', behavior: { value: 1 } });
    const d = structuredClone(declaration);
    proc(d, 'mining').labor = { kind: 'declared', intensity: '{C} QA Unused Labor' };
    const r = audit(raw, d);
    const a = mustFailFor(r, 'mining', 'A');
    mustFailFor(r, 'mining', 'B');
    return /not read by any formula/i.test(a.message);
  });

  await expect('14 declaration element names are case-insensitive and trim whitespace', () => {
    const d = mutateDeclarationNames(declaration);
    const a = audit(accepted, declaration);
    const b = audit(accepted, d);
    if (b.status !== 'PASS') throw new Error(JSON.stringify(b.errors));
    const project = r => ({
      status: r.status,
      counters: r.counters,
      undeclared: r.undeclared,
      reversibility: r.reversibility,
      exceptions: r.exceptions.map(x => ({ dimension: x.dimension, process: x.process, colony: x.colony, kind: x.kind, value: x.value }))
    });
    if (JSON.stringify(project(a)) !== JSON.stringify(project(b))) throw new Error('verdict/counters differ after name normalization');
    return 'same PASS and counters under lower-case + surrounding whitespace';
  });


  await expect('15 plugin integration, static-only runtime handling, and audit CLI override', () => {
    const v = structuredClone(validation);
    v.plugins = [...(v.plugins || []).filter(p => p?.type !== 'planet_closure'), structuredClone(declaration)];
    const st = runStructureAudits(accepted, v);
    if (!(st.status === 'PASS'
      && st.planetClosure?.status === 'PASS'
      && st.planetClosure.counters.processes === 17
      && st.planetClosure.counters.P2.kernel === EXP.P2.kernel
      && st.planetClosure.counters.P3.exceptions === EXP.P3.exceptions)) {
      throw new Error('runStructureAudits integration mismatch: ' + JSON.stringify(st.planetClosure));
    }
    const runtimeChecks = checkPlugin(declaration, null);
    if (!Array.isArray(runtimeChecks) || runtimeChecks.length !== 0) {
      throw new Error('planet_closure must be static-only: ' + JSON.stringify(runtimeChecks));
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-planet-cli-'));
    // The override is the current declaration written to a file, and the expected report lines come from its
    // own counters: the historical v7.7.1 declaration no longer fits a model whose extractions draw from deposits.
    const overrideFile = path.join(tmp, 'planet_closure.json');
    fs.writeFileSync(overrideFile, JSON.stringify(declaration, null, 2));
    const rc = audit(accepted, declaration).counters;
    try {
      const cli = spawnSync(process.execPath, [
        'src/cli.js', 'audit', acceptedFile, validationFile,
        `--planet-closure=${overrideFile}`,
        `--out=${tmp}`
      ], { cwd: process.cwd(), encoding: 'utf8' });
      if (cli.status !== 0) throw new Error(`audit CLI exit=${cli.status}; stderr=${cli.stderr}; stdout=${cli.stdout}`);
      const mdFile = path.join(tmp, 'structure-audit.md');
      if (!fs.existsSync(mdFile)) throw new Error('structure-audit.md missing');
      const md = fs.readFileSync(mdFile, 'utf8');
      for (const needle of [
        '## Planet closure',
        `processes: ${rc.processes}; legacy: ${rc.legacy}; expected source outputs: ${rc.expected_process_outputs}`,
        `P2 capacity: kernel **${rc.P2.kernel}** / simple **${rc.P2.simple ?? 0}** / exceptions **${rc.P2.exceptions}** / undeclared **${rc.P2.undeclared}**`,
        `P3 energy: requests **${rc.P3.requests}** / producer **${rc.P3.producer}** / exceptions **${rc.P3.exceptions}** / undeclared **${rc.P3.undeclared}**`,
        `P4 deposits: with **${rc.P4.with_deposit}** / without **${rc.P4.without_deposit}**`,
        `P5 labor: declared **${rc.P5.declared}** / undeclared **${rc.P5.undeclared}**`,
        `P6 demand drivers: **${rc.P6.drivers}**`
      ]) {
        if (!md.includes(needle)) throw new Error(`structure-audit.md missing: ${needle}`);
      }
      return 'structure gate PASS; checkPlugin=[]; audit --planet-closure exit=0 and report has P2-P6 counters';
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  await expect('16 audit JSON is deterministic for the same model and declaration', () => {
    const a = JSON.stringify(audit(accepted, declaration));
    const b = JSON.stringify(audit(accepted, declaration));
    if (a !== b) throw new Error('JSON output differs between identical runs');
    return 'byte-identical JSON.stringify output';
  });
} catch (e) {
  console.error('[FAIL] planet QA crashed:', e?.message || e);
  failed++;
}

const seconds = Number(process.hrtime.bigint() - started) / 1e9;
console.log(`\nPLANET QA RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed} passed, ${failed} failed) in ${seconds.toFixed(3)} s`);
process.exitCode = failed === 0 ? 0 : 2;
