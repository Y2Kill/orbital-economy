#!/usr/bin/env node
import { discoverSingleJson } from './workspace.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compareModels } from './compare_models.js';
import { readJson, writeJson, ensureDir } from './util.js';

const root = path.resolve(process.cwd());
const accepted = discoverSingleJson(path.join(root, 'reference', 'accepted', 'model'), 'accepted ModelJSON');
const validation = discoverSingleJson(path.join(root, 'input', 'validation'), 'validation JSON');
if (!fs.existsSync(accepted) || !fs.existsSync(validation)) {
  console.error('[FAIL] Required accepted model or validation file is missing.');
  process.exit(2);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-compare-qa-'));
let failed = 0;
function mark(ok, text) {
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${text}`);
  if (!ok) failed++;
}

console.log('Orbital Economy Lab model-comparison integration self-test');
console.log(`Temporary workspace: ${tmp}`);
console.log('Runs Mode 0 only. Production input/output is not modified.\n');

try {
  const r1 = await compareModels({
    acceptedFile: accepted,
    candidateFile: accepted,
    validationFile: validation,
    modes: new Set([0]),
    outDir: ensureDir(path.join(tmp, 'identical'))
  });
  mark(r1.overall === 'COMPLETE' && r1.result === 'BYTE_IDENTICAL' && r1.scenarios[0]?.comparison?.result === 'IDENTICAL',
       'identical accepted/candidate produces BYTE_IDENTICAL with identical Mode 0 output');

  const changedFile = path.join(tmp, 'candidate-changed.json');
  const changed = readJson(accepted);
  const el = changed.elements.find(x => x?.name === 'A Local Base Demand');
  if (!el) throw new Error('QA fixture element A Local Base Demand not found');
  el.behavior.value = Number(el.behavior.value) + 1;
  changed.name = `${changed.name} [QA changed candidate]`;
  writeJson(changedFile, changed);

  const r2 = await compareModels({
    acceptedFile: accepted,
    candidateFile: changedFile,
    validationFile: validation,
    modes: new Set([0]),
    outDir: ensureDir(path.join(tmp, 'changed'))
  });
  mark(r2.overall === 'COMPLETE' && r2.result === 'DIFFERENT_OUTPUTS' && r2.scenarios[0]?.comparison?.changedSeriesCount > 0,
       'controlled parameter change produces DIFFERENT_OUTPUTS and changed time series');
  mark(r2.structure.changedDefinitions.includes('A Local Base Demand'),
       'controlled parameter change is reported in structural/behavioral definition diff');
} catch (e) {
  console.error('[FAIL] compare integration self-test crashed:', e.message || e);
  failed++;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\nCOMPARE QA RESULT: ${failed === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failed === 0 ? 0 : 2;
