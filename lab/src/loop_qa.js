#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { auditAlgebraicLoops, algebraicLoopCombinationDetails } from './loop_audit.js';
import { runStructureAudits } from './structure_audit.js';
import { compareModels } from './compare_models.js';
import { loadModelJSON } from './engine.js';
import { listScenarios, modelJsonForScenario } from './model.js';
import { ensureDir, writeJson } from './util.js';
import { runAuditCommand } from './audit_run.js';

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

function mutation001(raw0) {
  const raw = structuredClone(raw0);
  const target = raw.elements.find(e => e?.name === 'A Electronics Metal Input Target Inventory' && e.type !== 'LINK');
  if (!target) throw new Error('fixture element not found: A Electronics Metal Input Target Inventory');
  target.behavior = target.behavior || {};
  target.behavior.value = '[A Electronics Feedstock Consumption Rate] * [Metal Input Target Days]';
  raw.elements.push({
    type: 'LINK',
    from: 'A Electronics Feedstock Consumption Rate',
    to: 'A Electronics Metal Input Target Inventory'
  });
  raw.name = `${raw.name} [QA mutation 001 r1]`;
  return raw;
}

function pinSwitches(raw0, budget, mandatory = []) {
  const raw = structuredClone(raw0);
  const switches = auditAlgebraicLoops(raw0).switches;
  const required = new Set(mandatory);
  for (const name of required) {
    if (!switches.includes(name)) throw new Error(`mandatory switch not found: ${name}`);
  }
  if (!Number.isInteger(budget) || budget < required.size) {
    throw new Error(`switch budget ${budget} is smaller than mandatory set ${required.size}`);
  }

  const keep = new Set(required);
  for (const name of switches) {
    if (keep.size >= budget) break;
    keep.add(name);
  }
  const drop = switches.filter(name => !keep.has(name));
  for (const scenario of raw.scenarios || []) {
    if (!scenario?.values) continue;
    for (const name of drop) delete scenario.values[name];
  }
  return raw;
}

function addVariable(raw, name, value) {
  raw.elements.push({ type: 'VARIABLE', name, behavior: { value } });
}
function addStock(raw, name, initial = 0) {
  raw.elements.push({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true } });
}
function addFlow(raw, name, value, from = null, to = null) {
  raw.elements.push({ type: 'FLOW', name, from, to, behavior: { value } });
}

const acceptedFile = singleJson(path.resolve('reference', 'accepted', 'model'));
const validationFile = singleJson(path.resolve('input', 'validation'));
const v76r1File = path.resolve('..', 'docs', 'model_v7_6_r1', 'orbital_economy_v7_6_r1_modeljson.json');
const accepted = readJson(acceptedFile);
const validation = readJson(validationFile);
const v76r1 = readJson(v76r1File);
const mut001 = mutation001(accepted);
// Expectations that depend on the accepted model are derived from it, so the self-test survives promotions:
// N = accepted switch count (at least the 7 of v7.7.1); a switch-gated loop must appear in exactly half of the
// 2^N combinations and in exactly the Modes whose scenario turns that switch on (read from scenario values,
// not from the audit under test).
const ACC_SWITCHES = auditAlgebraicLoops(accepted).switches;
const N = ACC_SWITCHES.length;
const COMBOS = 2 ** N;
const modesWith = (raw, sw) => raw.scenarios.map((s, i) => [Number(s.values?.['Timed Test Mode'] ?? i), Number(s.values?.[sw] ?? 0)])
  .filter(([, v]) => v === 1).map(([m]) => m).sort((a, b) => a - b).join(',');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-loop-qa-'));

console.log('Orbital Economy Lab algebraic-loop QA');
console.log('19 switch-aware static-audit cases.\n');

try {
  await expect('1 accepted model has no algebraic loops', () => {
    const r = auditAlgebraicLoops(accepted);
    const ok = r.status === 'PASS' && N >= 7 && r.combinations === COMBOS
      && r.combinationsWithLoops === 0 && r.loops.length === 0 && r.modesWithLoops.length === 0;
    if (!ok) throw new Error(JSON.stringify(r));
    return `switches=${N}, combinations=${COMBOS}, with loops=0, Modes=none`;
  });

  await expect('2 v7.6 r1 reproduces the hidden Power Resource loop', () => {
    const r = auditAlgebraicLoops(v76r1);
    const details = algebraicLoopCombinationDetails(v76r1);
    const everyPowerOn = details.bad.length === 16 && details.bad.every(x => x.enabled.includes('Power Resource Enabled'));
    const ok = r.status === 'FAIL' && r.switches.length === 5 && r.combinations === 32
      && r.combinationsWithLoops === 16 && r.modesWithLoops.join(',') === '25,26' && everyPowerOn;
    if (!ok) throw new Error(JSON.stringify({ audit: r, everyPowerOn, bad: details.bad.length }));
    return 'switches=5, combinations=32, with loops=16, all Power Resource Enabled=1, Modes=25,26';
  });

  await expect('3 task-001 r1 mutation reproduces the Intermediate Inputs loop', () => {
    const r = auditAlgebraicLoops(mut001);
    const details = algebraicLoopCombinationDetails(mut001);
    const expectedModes = modesWith(mut001, 'Intermediate Inputs Enabled');
    const everyIntermediateOn = details.bad.length === COMBOS / 2 && details.bad.every(x => x.enabled.includes('Intermediate Inputs Enabled'));
    const ok = r.status === 'FAIL' && r.switches.length === N && r.combinations === COMBOS
      && r.combinationsWithLoops === COMBOS / 2 && r.modesWithLoops.join(',') === expectedModes && expectedModes.startsWith('17,') && everyIntermediateOn;
    if (!ok) throw new Error(JSON.stringify({ audit: r, everyIntermediateOn, bad: details.bad.length, expectedModes }));
    return `switches=${N}, combinations=${COMBOS}, with loops=${COMBOS / 2}, all Intermediate Inputs Enabled=1, Modes=${expectedModes}`;
  });

  await expect('4 audit prediction agrees with simulation engine on mutation 001', () => {
    const scenarios = new Map(listScenarios(mut001).map(s => [s.mode, s]));
    const r = auditAlgebraicLoops(mut001);
    let mode16Ok = false;
    let mode17Loop = false;
    const m16 = loadModelJSON(modelJsonForScenario(mut001, scenarios.get(16)));
    const errs16 = m16.check();
    if (errs16.length) throw new Error('Mode 16 model.check failed: ' + errs16.map(e => e.message || e).join('; '));
    m16.simulate();
    mode16Ok = true;
    try {
      const m17 = loadModelJSON(modelJsonForScenario(mut001, scenarios.get(17)));
      const errs17 = m17.check();
      if (errs17.length) throw new Error('Mode 17 model.check failed: ' + errs17.map(e => e.message || e).join('; '));
      m17.simulate();
    } catch (e) {
      mode17Loop = /Circular equation loop/i.test(e?.message || String(e));
      if (!mode17Loop) throw e;
    }
    return mode16Ok && mode17Loop && !r.modesWithLoops.includes(16) && r.modesWithLoops.includes(17)
      ? 'Mode 16 simulates; Mode 17 throws Circular equation loop; audit predicts 17 only'
      : false;
  });

  await expect('5 unconditional two-variable loop is present in every combination', () => {
    const raw = structuredClone(accepted);
    addVariable(raw, 'QA Loop A', '[QA Loop B]');
    addVariable(raw, 'QA Loop B', '[QA Loop A]');
    const r = auditAlgebraicLoops(raw);
    return r.status === 'FAIL' && r.combinationsWithLoops === r.combinations
      && r.loops.some(x => x.members.includes('QA Loop A') && x.members.includes('QA Loop B'));
  });

  await expect('6 loop behind a STOCK condition is conservatively found', () => {
    const raw = structuredClone(accepted);
    addStock(raw, 'QA Condition Stock', 0);
    addVariable(raw, 'QA Branch A', 'IfThenElse([QA Condition Stock] > 0, [QA Branch B], 0)');
    addVariable(raw, 'QA Branch B', '[QA Branch A]');
    const r = auditAlgebraicLoops(raw);
    return r.status === 'FAIL' && r.combinationsWithLoops === r.combinations
      && r.loops.some(x => x.members.includes('QA Branch A') && x.members.includes('QA Branch B'));
  });

  await expect('7 STOCK cuts an otherwise apparent feedback loop', () => {
    const raw = structuredClone(accepted);
    addStock(raw, 'QA Cut Stock', 0);
    addVariable(raw, 'QA Cut Variable', '[QA Cut Stock]');
    addFlow(raw, 'QA Cut Flow', '[QA Cut Variable]', null, 'QA Cut Stock');
    const r = auditAlgebraicLoops(raw);
    return r.status === 'PASS' && r.combinationsWithLoops === 0;
  });

  await expect('8 FLOW participates in same-step algebraic loops', () => {
    const raw = structuredClone(accepted);
    addVariable(raw, 'QA Flow Variable', '[QA Loop Flow]');
    addFlow(raw, 'QA Loop Flow', '[QA Flow Variable]');
    const r = auditAlgebraicLoops(raw);
    return r.status === 'FAIL' && r.loops.some(x => x.members.includes('QA Flow Variable') && x.members.includes('QA Loop Flow'));
  });

  await expect('9 self-reference is an algebraic loop', () => {
    const raw = structuredClone(accepted);
    addVariable(raw, 'QA Self Loop', '[QA Self Loop] + 1');
    const r = auditAlgebraicLoops(raw);
    return r.status === 'FAIL' && r.loops.some(x => x.size === 1 && x.members[0] === 'QA Self Loop'
      && x.shortestCycle.join(' -> ') === 'QA Self Loop -> QA Self Loop');
  });

  await expect('10 switch recognition rejects scenario value 2 and unused 0/1 variables', () => {
    const raw = structuredClone(accepted);
    addVariable(raw, 'QA Not Binary Scenario Switch', 0);
    addVariable(raw, 'QA Unused Binary Variable', 1);
    for (let i = 0; i < raw.scenarios.length; i++) raw.scenarios[i].values['QA Not Binary Scenario Switch'] = i === 0 ? 2 : 0;
    const r = auditAlgebraicLoops(raw);
    return r.switches.length === N
      && !r.switches.includes('QA Not Binary Scenario Switch')
      && !r.switches.includes('QA Unused Binary Variable');
  });

  await expect('11 malformed formula is FAIL with the element name and no outward exception', () => {
    const raw = structuredClone(accepted);
    const e = raw.elements.find(x => x?.name === 'A Wage' && x.type === 'VARIABLE');
    if (!e) throw new Error('fixture A Wage not found');
    e.behavior.value = 'IfThenElse([Capital Lifecycle Enabled] = 1, 1, (0';
    const r = auditAlgebraicLoops(raw);
    return r.status === 'FAIL' && r.errors.some(x => x.element === 'A Wage' && /unbalanced|unclosed/i.test(x.message));
  });

  await expect('12 structure gate and compare reject mutation 001 before simulation', async () => {
    const st = runStructureAudits(mut001, validation);
    if (st.status !== 'FAIL' || st.algebraicLoops?.status !== 'FAIL') throw new Error('runStructureAudits did not fail');

    const candidateFile = path.join(tmp, 'candidate-mut001.json');
    writeJson(candidateFile, mut001);
    const outDir = ensureDir(path.join(tmp, 'compare'));
    const oldLog = console.log, oldErr = console.error;
    console.log = () => {};
    console.error = () => {};
    let cmp;
    try {
      cmp = await compareModels({
        acceptedFile,
        candidateFile,
        validationFile,
        modes: new Set([16, 17]),
        outDir
      });
    } finally {
      console.log = oldLog;
      console.error = oldErr;
    }
    if (!(cmp.result === 'NOT_COMPARED' && cmp.scenarios.length === 0
      && cmp.static.candidate.status === 'FAIL'
      && cmp.static.candidate.structure?.status === 'FAIL')) return false;

    const auditDir = ensureDir(path.join(tmp, 'audit'));
    let auditReport;
    console.log = () => {};
    console.error = () => {};
    try {
      auditReport = runAuditCommand({ modelFile: candidateFile, validationFile, outDir: auditDir });
    } finally {
      console.log = oldLog;
      console.error = oldErr;
    }
    const md = fs.readFileSync(path.join(auditDir, 'structure-audit.md'), 'utf8');
    const cycle = auditReport.algebraicLoops?.loops?.[0]?.shortestCycle || [];
    if (auditReport.status !== 'FAIL' || !cycle.length || !md.includes('## Algebraic loops') || !md.includes(cycle.join(' → '))) return false;

    const loopsDir = path.join(tmp, 'loops-cli');
    const cli = spawnSync(process.execPath, ['src/cli.js', 'loops', candidateFile, `--out=${loopsDir}`], {
      cwd: process.cwd(), encoding: 'utf8'
    });
    if (cli.status !== 1 || !fs.existsSync(path.join(loopsDir, 'algebraic-loops.json'))) {
      throw new Error(`loops CLI expected exit 1, got ${cli.status}; stderr=${cli.stderr}`);
    }

    // Validation plugins are not required for the unconditional loop audit;
    // the Markdown report must still show it even when the legacy structure
    // audits make the aggregate status SKIPPED.
    const noPluginsFile = path.join(tmp, 'validation-no-structure-plugins.json');
    writeJson(noPluginsFile, { name: 'QA no structure plugins', plugins: [] });
    const noPluginsDir = ensureDir(path.join(tmp, 'audit-no-plugins'));
    console.log = () => {};
    console.error = () => {};
    let noPluginsReport;
    try {
      noPluginsReport = runAuditCommand({ modelFile: acceptedFile, validationFile: noPluginsFile, outDir: noPluginsDir });
    } finally {
      console.log = oldLog;
      console.error = oldErr;
    }
    const noPluginsMd = fs.readFileSync(path.join(noPluginsDir, 'structure-audit.md'), 'utf8');
    if (noPluginsReport.status !== 'SKIPPED'
      || noPluginsReport.algebraicLoops?.status !== 'PASS'
      || !noPluginsMd.includes('## Algebraic loops')
      || !noPluginsMd.includes(`combinations: ${COMBOS}; with loops: **0**`)) {
      throw new Error('validation-independent loop report is missing/incomplete');
    }

    return `NOT_COMPARED; shortest cycle: ${cycle.join(' -> ')}; loops CLI exit=1; no-plugin report includes loop PASS`;
  });

  await expect('13 audit JSON is deterministic for the same input', () => {
    const a = JSON.stringify(auditAlgebraicLoops(mut001));
    const b = JSON.stringify(auditAlgebraicLoops(mut001));
    return a === b;
  });

  await expect('14 case-insensitive reference resolution matches engine on construction-materials loop', () => {
    const raw = structuredClone(accepted);
    const target = raw.elements.find(e => e?.name === 'B Construction Materials Fulfillment' && e.type === 'VARIABLE');
    if (!target) throw new Error('fixture B Construction Materials Fulfillment not found');
    target.behavior.value = target.behavior.value.replace(
      'Max([B Construction Materials Demand], 0.000000001)',
      'Max([b refinery construction materials consumption], 0.000000001)'
    );
    if (!target.behavior.value.includes('[b refinery construction materials consumption]')) {
      throw new Error('case 14 mutation was not applied');
    }
    raw.elements.push({
      type: 'LINK',
      from: 'B Refinery Construction Materials Consumption',
      to: 'B Construction Materials Fulfillment'
    });

    const r = auditAlgebraicLoops(raw);
    const details = algebraicLoopCombinationDetails(raw);
    const everyCmOn = details.bad.length === COMBOS / 2
      && details.bad.every(x => x.enabled.includes('Construction Materials Enabled'));
    const expectedModes = modesWith(raw, 'Construction Materials Enabled');
    if (!(r.status === 'FAIL'
      && expectedModes.startsWith('27,')
      && r.switches.length === N
      && r.combinations === COMBOS
      && r.combinationsWithLoops === COMBOS / 2
      && r.modesWithLoops.join(',') === expectedModes
      && everyCmOn
      && r.loops.some(x => x.members.includes('B Construction Materials Fulfillment')
        && x.members.includes('B Refinery Construction Materials Consumption')))) {
      throw new Error(JSON.stringify({ audit: r, everyCmOn, bad: details.bad.length }));
    }

    const scenarios = new Map(listScenarios(raw).map(s => [s.mode, s]));
    const m26 = loadModelJSON(modelJsonForScenario(raw, scenarios.get(26)));
    const errs26 = m26.check();
    if (errs26.length) throw new Error('Mode 26 model.check failed: ' + errs26.map(e => e.message || e).join('; '));
    m26.simulate();

    let mode27Loop = false;
    try {
      const m27 = loadModelJSON(modelJsonForScenario(raw, scenarios.get(27)));
      const errs27 = m27.check();
      if (errs27.length) throw new Error('Mode 27 model.check failed: ' + errs27.map(e => e.message || e).join('; '));
      m27.simulate();
    } catch (e) {
      mode27Loop = /Circular equation loop/i.test(e?.message || String(e));
      if (!mode27Loop) throw e;
    }
    if (!mode27Loop) return false;
    return `${COMBOS / 2}/${COMBOS}, all Construction Materials Enabled=1, Modes=${expectedModes}; Mode 26 simulates, Mode 27 throws Circular equation loop`;
  });

  await expect('15 unresolved formula reference is FAIL with element and reference, no outward exception', () => {
    const raw = structuredClone(accepted);
    const e = raw.elements.find(x => x?.name === 'A Wage' && x.type === 'VARIABLE');
    if (!e) throw new Error('fixture A Wage not found');
    e.behavior.value = '[ definitely missing element ] + 1';
    const r = auditAlgebraicLoops(raw);
    return r.status === 'FAIL'
      && r.errors.some(x => x.element === 'A Wage'
        && x.reference === ' definitely missing element '
        && /unresolved reference/i.test(x.message)
        && /definitely missing element/i.test(x.message));
  });

  await expect('16 fast path is byte-identical to exhaustive on pinned accepted/mutation and v7.6 r1', () => {
    const acceptedPinned = pinSwitches(accepted, 10, []);
    const mut001Pinned = pinSwitches(mut001, 10, ['Intermediate Inputs Enabled']);
    const pinned = [['accepted pinned', acceptedPinned], ['mutation 001 pinned', mut001Pinned]];

    for (const [label, raw] of pinned) {
      const shape = auditAlgebraicLoops(raw);
      if (shape.switches.length > 10 || shape.combinations > 1024) {
        throw new Error(`${label}: pinning failed, switches=${shape.switches.length}, combinations=${shape.combinations}`);
      }
    }

    for (const [label, raw] of [['accepted pinned', acceptedPinned], ['v7.6 r1', v76r1], ['mutation 001 pinned', mut001Pinned]]) {
      const fastAudit = JSON.stringify(auditAlgebraicLoops(raw));
      const exhaustiveAudit = JSON.stringify(auditAlgebraicLoops(raw, { exhaustive: true }));
      if (fastAudit !== exhaustiveAudit) throw new Error(`${label}: audit JSON differs`);
      const fastDetails = JSON.stringify(algebraicLoopCombinationDetails(raw));
      const exhaustiveDetails = JSON.stringify(algebraicLoopCombinationDetails(raw, { exhaustive: true }));
      if (fastDetails !== exhaustiveDetails) throw new Error(`${label}: details JSON differs`);
    }

    const mut = auditAlgebraicLoops(mut001Pinned);
    if (mut.combinationsWithLoops <= 0 || mut.loops.length === 0) {
      throw new Error('pinned mutation 001 comparison was not substantive');
    }
    return `pinned accepted/mutation <=10 switches and <=1024 combinations; v7.6 unchanged; mutation loops=${mut.loops.length}, combinationsWithLoops=${mut.combinationsWithLoops}`;
  });

  await expect('17 relevant-switch projection preserves counts and examples on six-switch synthetic model', () => {
    const raw = { name: 'QA relevant-switch projection', elements: [], scenarios: [{ name: 'Mode 0', values: {} }] };
    for (let i = 1; i <= 6; i++) {
      addVariable(raw, `S${i}`, 0);
      raw.scenarios[0].values[`S${i}`] = 0;
    }
    addVariable(raw, 'QA L1 A', 'IfThenElse([S1] = 1, [QA L1 B], 0)');
    addVariable(raw, 'QA L1 B', '[QA L1 A]');
    addVariable(raw, 'QA L2 A', 'IfThenElse([S2] = 1, IfThenElse([S3] = 0, [QA L2 B], 0), 0)');
    addVariable(raw, 'QA L2 B', '[QA L2 A]');
    addVariable(raw, 'QA Outside S4', 'IfThenElse([S4] = 1, 4, 0)');
    addVariable(raw, 'QA Outside S5', 'IfThenElse([S5] = 1, 5, 0)');
    addVariable(raw, 'QA Outside Sink', '[QA Outside S4] + [QA Outside S5]');

    const fast = auditAlgebraicLoops(raw);
    const exhaustive = auditAlgebraicLoops(raw, { exhaustive: true });
    const fastDetails = algebraicLoopCombinationDetails(raw);
    const exhaustiveDetails = algebraicLoopCombinationDetails(raw, { exhaustive: true });
    if (JSON.stringify(fast) !== JSON.stringify(exhaustive)) throw new Error('audit differs from exhaustive');
    if (JSON.stringify(fastDetails) !== JSON.stringify(exhaustiveDetails)) throw new Error('details differ from exhaustive');
    if (fast.switches.join(',') !== 'S1,S2,S3,S4,S5,S6' || fast.combinations !== 64) throw new Error(`switch shape mismatch: ${JSON.stringify(fast.switches)} / ${fast.combinations}`);
    const l1 = fast.loops.find(x => x.members.includes('QA L1 A'));
    const l2 = fast.loops.find(x => x.members.includes('QA L2 A'));
    if (!l1 || l1.combinations !== 32 || l1.example.join(',') !== 'S1') throw new Error(`L1 mismatch: ${JSON.stringify(l1)}`);
    if (!l2 || l2.combinations !== 16 || l2.example.join(',') !== 'S2') throw new Error(`L2 mismatch: ${JSON.stringify(l2)}`);
    return '64 combinations; L1=32 example S1; L2=16 example S2; audit/details identical';
  });

  await expect('18 undecidable non-switch condition remains conservative and byte-identical to exhaustive', () => {
    const raw = { name: 'QA undecidable condition', elements: [], scenarios: [{ name: 'Mode 0', values: { S1: 0 } }] };
    addVariable(raw, 'S1', 0);
    addVariable(raw, 'QA Non Switch Gate', 1);
    addVariable(raw, 'QA Unknown A', 'IfThenElse([QA Non Switch Gate] > 0, IfThenElse([S1] = 1, [QA Unknown B], 0), 0)');
    addVariable(raw, 'QA Unknown B', '[QA Unknown A]');
    const fast = auditAlgebraicLoops(raw);
    const exhaustive = auditAlgebraicLoops(raw, { exhaustive: true });
    const fastDetails = algebraicLoopCombinationDetails(raw);
    const exhaustiveDetails = algebraicLoopCombinationDetails(raw, { exhaustive: true });
    if (JSON.stringify(fast) !== JSON.stringify(exhaustive)) throw new Error('audit differs from exhaustive');
    if (JSON.stringify(fastDetails) !== JSON.stringify(exhaustiveDetails)) throw new Error('details differ from exhaustive');
    if (fast.combinations !== 2 || fast.combinationsWithLoops !== 1 || fast.loops.length !== 1) throw new Error(JSON.stringify(fast));
    if (fast.loops[0].example.join(',') !== 'S1') throw new Error(`unexpected example: ${JSON.stringify(fast.loops[0].example)}`);
    return 'undecidable gate retained conservatively; 1/2 combinations loop; identical to exhaustive';
  });

  await expect('19 fast path is deterministic across consecutive runs with warm caches', () => {
    const a1 = JSON.stringify(auditAlgebraicLoops(mut001));
    const d1 = JSON.stringify(algebraicLoopCombinationDetails(mut001));
    const a2 = JSON.stringify(auditAlgebraicLoops(mut001));
    const d2 = JSON.stringify(algebraicLoopCombinationDetails(mut001));
    if (a1 !== a2 || d1 !== d2) throw new Error('warm-cache fast results differ');
    return 'audit and details byte-identical across consecutive fast runs';
  });
} catch (e) {
  console.error('[FAIL] loop QA crashed:', e?.message || e);
  failed++;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

const seconds = Number(process.hrtime.bigint() - started) / 1e9;
console.log(`\nLOOP QA RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed} passed, ${failed} failed) in ${seconds.toFixed(3)} s`);
process.exitCode = failed === 0 ? 0 : 2;
