#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { auditAlgebraicLoops, algebraicLoopCombinationDetails } from './loop_audit.js';

let passed = 0;
let failed = 0;

function mark(ok, name, detail = '') {
  if (ok) {
    passed++;
    console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function expect(name, fn) {
  try {
    const value = fn();
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

const acceptedFile = singleJson(path.resolve('reference', 'accepted', 'model'));
const v76r1File = path.resolve('..', 'docs', 'model_v7_6_r1', 'orbital_economy_v7_6_r1_modeljson.json');
const accepted = readJson(acceptedFile);
const v76r1 = readJson(v76r1File);

console.log('Orbital Economy Lab algebraic-loop QA');
console.log('Cases 1-3: accepted model, v7.6 r1 regression, and task-001 r1 mutation.\n');

expect('1 accepted model has no algebraic loops', () => {
  const r = auditAlgebraicLoops(accepted);
  const ok = r.status === 'PASS'
    && r.switches.length === 7
    && r.combinations === 128
    && r.combinationsWithLoops === 0
    && r.loops.length === 0
    && r.modesWithLoops.length === 0;
  if (!ok) throw new Error(JSON.stringify(r));
  return `switches=7, combinations=128, with loops=0, Modes=none`;
});

expect('2 v7.6 r1 reproduces the hidden Power Resource loop', () => {
  const r = auditAlgebraicLoops(v76r1);
  const details = algebraicLoopCombinationDetails(v76r1);
  const modes = r.modesWithLoops.join(',');
  const everyPowerOn = details.bad.length === 16 && details.bad.every(x => x.enabled.includes('Power Resource Enabled'));
  const ok = r.status === 'FAIL'
    && r.switches.length === 5
    && r.combinations === 32
    && r.combinationsWithLoops === 16
    && modes === '25,26'
    && everyPowerOn;
  if (!ok) throw new Error(JSON.stringify({ audit: r, everyPowerOn, bad: details.bad.length }));
  return `switches=5, combinations=32, with loops=16, all Power Resource Enabled=1, Modes=25,26`;
});

expect('3 task-001 r1 mutation reproduces the Intermediate Inputs loop', () => {
  const raw = structuredClone(accepted);
  const target = raw.elements.find(e => e?.name === 'A Electronics Metal Input Target Inventory' && e.type !== 'LINK');
  if (!target) throw new Error('fixture element not found: A Electronics Metal Input Target Inventory');
  target.behavior = target.behavior || {};
  target.behavior.value = '[A Electronics Feedstock Consumption Rate] * [Metal Input Target Days]';
  raw.elements.push({
    type: 'LINK',
    from: 'A Electronics Feedstock Consumption Rate',
    to: 'A Electronics Metal Input Target Inventory'
  });

  const r = auditAlgebraicLoops(raw);
  const details = algebraicLoopCombinationDetails(raw);
  const expectedModes = Array.from({ length: 15 }, (_x, i) => i + 17).join(',');
  const everyIntermediateOn = details.bad.length === 64 && details.bad.every(x => x.enabled.includes('Intermediate Inputs Enabled'));
  const ok = r.status === 'FAIL'
    && r.switches.length === 7
    && r.combinations === 128
    && r.combinationsWithLoops === 64
    && r.modesWithLoops.join(',') === expectedModes
    && everyIntermediateOn;
  if (!ok) throw new Error(JSON.stringify({ audit: r, everyIntermediateOn, bad: details.bad.length }));
  return `switches=7, combinations=128, with loops=64, all Intermediate Inputs Enabled=1, Modes=17-31`;
});

console.log(`\nLOOP QA RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed} passed, ${failed} failed)`);
process.exitCode = failed === 0 ? 0 : 2;
