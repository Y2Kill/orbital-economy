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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-loop-qa-'));

console.log('Orbital Economy Lab algebraic-loop QA');
console.log('13 switch-aware static-audit cases.\n');

try {
  await expect('1 accepted model has no algebraic loops', () => {
    const r = auditAlgebraicLoops(accepted);
    const ok = r.status === 'PASS' && r.switches.length === 7 && r.combinations === 128
      && r.combinationsWithLoops === 0 && r.loops.length === 0 && r.modesWithLoops.length === 0;
    if (!ok) throw new Error(JSON.stringify(r));
    return 'switches=7, combinations=128, with loops=0, Modes=none';
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
    const expectedModes = Array.from({ length: 15 }, (_x, i) => i + 17).join(',');
    const everyIntermediateOn = details.bad.length === 64 && details.bad.every(x => x.enabled.includes('Intermediate Inputs Enabled'));
    const ok = r.status === 'FAIL' && r.switches.length === 7 && r.combinations === 128
      && r.combinationsWithLoops === 64 && r.modesWithLoops.join(',') === expectedModes && everyIntermediateOn;
    if (!ok) throw new Error(JSON.stringify({ audit: r, everyIntermediateOn, bad: details.bad.length }));
    return 'switches=7, combinations=128, with loops=64, all Intermediate Inputs Enabled=1, Modes=17-31';
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
    return r.switches.length === 7
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
      || !noPluginsMd.includes('combinations: 128; with loops: **0**')) {
      throw new Error('validation-independent loop report is missing/incomplete');
    }

    return `NOT_COMPARED; shortest cycle: ${cycle.join(' -> ')}; loops CLI exit=1; no-plugin report includes loop PASS`;
  });

  await expect('13 audit JSON is deterministic for the same input', () => {
    const a = JSON.stringify(auditAlgebraicLoops(mut001));
    const b = JSON.stringify(auditAlgebraicLoops(mut001));
    return a === b;
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
