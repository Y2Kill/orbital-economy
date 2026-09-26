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

console.log('Orbital Economy Lab Planet v1 closure QA');
console.log('Declaration source: ' + declarationSource);
console.log('16 static-audit cases through checkpoint KT3.\n');

try {
  await expect('1 accepted v7.7.1 matches Planet v1 reference counters exactly', () => {
    const r = auditPlanetClosure(accepted, declaration, openBoundaries);
    const ok = r.status === 'PASS'
      && r.mode === 'report'
      && r.errors.length === 0
      && r.counters.processes === 17
      && r.counters.legacy === 2
      && r.counters.expected_process_outputs === 16
      && r.counters.P2.kernel === 7
      && r.counters.P2.exceptions === 10
      && r.counters.P2.undeclared === 0
      && r.counters.P3.requests === 4
      && r.counters.P3.producer === 2
      && r.counters.P3.exceptions === 11
      && r.counters.P3.undeclared === 0
      && r.counters.P4.with_deposit === 0
      && r.counters.P4.without_deposit === 6
      && r.counters.P5.declared === 4
      && r.counters.P5.undeclared === 13
      && r.counters.P6.drivers === 4
      && r.reversibility.length === 0
      && r.undeclared.length === 0
      && r.processes.length === 19
      && r.exceptions.filter(x => x.dimension === 'P2').length === 10
      && r.exceptions.filter(x => x.dimension === 'P3').length === 11;
    if (!ok) throw new Error(JSON.stringify(r));
    return 'PASS; processes=17 legacy=2 expected=16; P2=7/10/0; P3=4/2/11/0; P4=0/6; P5=4/13; P6=4; reversibility=0';
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

  await expect('7 missing regolith declaration is metric in report and FAIL in classify', () => {
    const d = structuredClone(declaration);
    d.processes = d.processes.filter(p => p.id !== 'regolith');
    d.enforce = 'report';
    const report = audit(accepted, d);
    const names = report.undeclared.map(x => x.output).sort();
    if (!(report.status === 'PASS' && report.undeclared.length === 2
      && names.join('|') === ['A Regolith Extraction', 'B Regolith Extraction'].sort().join('|'))) {
      throw new Error('report mismatch: ' + JSON.stringify({ status: report.status, undeclared: report.undeclared }));
    }
    d.enforce = 'classify';
    const classify = audit(accepted, d);
    return classify.status === 'FAIL' && classify.modeFailures.some(x => x.dimension === 'processes' && x.count === 2);
  });

  await expect('8 constant capacity without reason is declaration FAIL', () => {
    const d = structuredClone(declaration);
    delete proc(d, 'mining').capacity.reason;
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
    if (!(v1.status === 'FAIL' && v1sig === 'P4:6,P5:13')) throw new Error('planet_v1: ' + v1sig);

    const sd = structuredClone(declaration);
    sd.enforce = 'planet_strict';
    const strict = audit(accepted, sd);
    const ssig = strict.modeFailures.map(x => `${x.dimension}:${x.count}`).join(',');
    if (!(strict.status === 'FAIL' && ssig === 'P4:6,P5:13,P2 exceptions:10,P3 exceptions:11')) {
      throw new Error('planet_strict: ' + ssig);
    }
    return `planet_v1=${v1sig}; planet_strict=${ssig}`;
  });

  await expect('10 constant-capacity reversibility violation is reported and gates planet_v1', () => {
    const raw = structuredClone(accepted);
    const miningRate = raw.elements.find(e => e?.name === 'A Mining Rate' && e.type === 'VARIABLE');
    if (!miningRate) throw new Error('A Mining Rate fixture missing');
    miningRate.behavior.value += ' + 0 * [A Capital Goods Base Production Capacity]';
    raw.elements.push({ type: 'LINK', from: 'A Capital Goods Base Production Capacity', to: 'A Mining Rate' });

    const rd = structuredClone(declaration);
    rd.enforce = 'report';
    const report = audit(raw, rd);
    if (!(report.status === 'PASS' && report.reversibility.length === 1
      && report.reversibility[0].parameter === 'A Capital Goods Base Production Capacity'
      && report.reversibility[0].reader === 'A Mining Rate')) {
      throw new Error(JSON.stringify(report.reversibility));
    }
    const vd = structuredClone(declaration);
    vd.enforce = 'planet_v1';
    const v1 = audit(raw, vd);
    return v1.status === 'FAIL' && v1.modeFailures.some(x => x.dimension === 'reversibility' && x.count === 1)
      ? 'report reversibility=1; planet_v1 gated'
      : false;
  });

  await expect('11 deposit stocks close two regolith extractions; asymmetric deposit declaration fails', () => {
    const raw = structuredClone(accepted);
    for (const c of ['A', 'B']) {
      raw.elements.push({ type: 'STOCK', name: `${c} Regolith Deposit`, behavior: { initial_value: 1000000, non_negative: true } });
      const flow = raw.elements.find(e => e?.name === `${c} Regolith Extraction` && e.type === 'FLOW');
      if (!flow) throw new Error(`${c} Regolith Extraction fixture missing`);
      flow.from = `${c} Regolith Deposit`;
    }
    const d = structuredClone(declaration);
    proc(d, 'regolith').deposit = { kind: 'stock', stock: '{C} Regolith Deposit' };
    const r = audit(raw, d);
    if (!(r.status === 'PASS' && r.counters.P4.with_deposit === 2 && r.counters.P4.without_deposit === 4)) {
      throw new Error(JSON.stringify({ status: r.status, P4: r.counters.P4, errors: r.errors }));
    }

    const one = structuredClone(accepted);
    one.elements.push({ type: 'STOCK', name: 'A Regolith Deposit', behavior: { initial_value: 1000000, non_negative: true } });
    const af = one.elements.find(e => e?.name === 'A Regolith Extraction' && e.type === 'FLOW');
    af.from = 'A Regolith Deposit';
    const bad = audit(one, d);
    const be = mustFailFor(bad, 'regolith', 'B');
    return `both deposits P4=2/4 PASS; one-sided FAIL regolith[B]: ${be.message}`;
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
      && st.planetClosure.counters.P2.kernel === 7
      && st.planetClosure.counters.P3.exceptions === 11)) {
      throw new Error('runStructureAudits integration mismatch: ' + JSON.stringify(st.planetClosure));
    }
    const runtimeChecks = checkPlugin(declaration, null);
    if (!Array.isArray(runtimeChecks) || runtimeChecks.length !== 0) {
      throw new Error('planet_closure must be static-only: ' + JSON.stringify(runtimeChecks));
    }

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-planet-cli-'));
    try {
      const cli = spawnSync(process.execPath, [
        'src/cli.js', 'audit', acceptedFile, validationFile,
        `--planet-closure=${fallbackFile}`,
        `--out=${tmp}`
      ], { cwd: process.cwd(), encoding: 'utf8' });
      if (cli.status !== 0) throw new Error(`audit CLI exit=${cli.status}; stderr=${cli.stderr}; stdout=${cli.stdout}`);
      const mdFile = path.join(tmp, 'structure-audit.md');
      if (!fs.existsSync(mdFile)) throw new Error('structure-audit.md missing');
      const md = fs.readFileSync(mdFile, 'utf8');
      for (const needle of [
        '## Planet closure',
        'processes: 17; legacy: 2; expected source outputs: 16',
        'P2 capacity: kernel **7** / exceptions **10** / undeclared **0**',
        'P3 energy: requests **4** / producer **2** / exceptions **11** / undeclared **0**',
        'P4 deposits: with **0** / without **6**',
        'P5 labor: declared **4** / undeclared **13**',
        'P6 demand drivers: **4**'
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
