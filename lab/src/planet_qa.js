#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { auditPlanetClosure } from './planet_closure.js';

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
console.log('1 static-audit case for checkpoint KT1.\n');

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
} catch (e) {
  console.error('[FAIL] planet QA crashed:', e?.message || e);
  failed++;
}

const seconds = Number(process.hrtime.bigint() - started) / 1e9;
console.log(`\nPLANET QA RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed} passed, ${failed} failed) in ${seconds.toFixed(3)} s`);
process.exitCode = failed === 0 ? 0 : 2;
