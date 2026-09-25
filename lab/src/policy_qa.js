#!/usr/bin/env node
import { ENGINE_VERSION, EXPECTED_ENGINE_VERSION } from './engine.js';
import { discoverSingleJson } from './workspace.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compareModels } from './compare_models.js';
import { evaluatePolicy, POLICY_FORMAT } from './policy.js';
import { readJson, writeJson, ensureDir, sha256File } from './util.js';

const root = path.resolve(process.cwd());
const accepted = discoverSingleJson(path.join(root, 'reference', 'accepted', 'model'), 'accepted ModelJSON');
const validation = discoverSingleJson(path.join(root, 'input', 'validation'), 'validation JSON');
if (!fs.existsSync(accepted) || !fs.existsSync(validation)) {
  console.error('[FAIL] Required accepted model or validation file is missing.');
  process.exit(2);
}

const acceptedSha = sha256File(accepted);
const validationSha = sha256File(validation);
const basePolicy = {
  format: POLICY_FORMAT,
  name: 'QA strict baseline',
  accepted_model_sha256: acceptedSha,
  validation_sha256: validationSha,
  comparison: { abs_tolerance: 0, rel_tolerance: null, rel_floor: 1e-12 },
  engine: { package: 'simulation', version: EXPECTED_ENGINE_VERSION },
  default_action: 'deny',
  require_full_mode_coverage: true,
  rules: []
};

function emptyComparison() {
  return {
    generated: new Date().toISOString(),
    overall: 'COMPLETE',
    result: 'OUTPUTS_IDENTICAL',
    engine: { package: 'simulation', version: ENGINE_VERSION, node: process.version },
    accepted: { sha256: acceptedSha, name: 'accepted' },
    candidate: { sha256: 'b'.repeat(64), name: 'candidate' },
    validation: { sha256: validationSha },
    comparisonSettings: { absTolerance: 0, relTolerance: null, relFloor: 1e-12 },
    static: { accepted: { status: 'PASS' }, candidate: { status: 'PASS' } },
    structure: {
      addedElements: [], removedElements: [], changedDefinitions: [], typeChanges: [],
      addedLinks: [], removedLinks: [], simulationChanged: false,
      acceptedModes: [], candidateModes: [],
      addedModes: [], removedModes: [], changedScenarioInputs: [], renamedScenarios: []
    },
    scenarios: []
  };
}

let failed = 0;
function mark(ok, text) {
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${text}`);
  if (!ok) failed++;
}

console.log('Orbital Economy Lab change-policy QA');
console.log('Synthetic tests + one real Mode 0 changed-candidate comparison.');
console.log('Production input/output is not modified.\n');

try {
  let c = emptyComparison();
  let r = evaluatePolicy({ comparisonReport: c, policy: structuredClone(basePolicy) });
  mark(r.result === 'PASS' && r.counts.observedEvents === 0, 'strict policy passes when no changes exist');

  c = emptyComparison();
  c.structure.changedDefinitions = ['A Local Base Demand'];
  r = evaluatePolicy({ comparisonReport: c, policy: structuredClone(basePolicy) });
  mark(r.result === 'FAIL' && r.counts.unexpected === 1, 'strict default-deny policy rejects an unlisted structural change');

  let p = structuredClone(basePolicy);
  p.rules = [{ id: 'allow-demand-definition', action: 'allow', event: 'definition_changed', name: 'A Local Base Demand', required: true }];
  r = evaluatePolicy({ comparisonReport: c, policy: p });
  mark(r.result === 'PASS' && r.counts.expected === 1 && r.counts.requiredMissing === 0, 'explicit allow rule accepts the intended structural change');

  c = emptyComparison();
  r = evaluatePolicy({ comparisonReport: c, policy: p });
  mark(r.result === 'FAIL' && r.counts.requiredMissing === 1, 'required expected-change rule fails when the intended change is absent');

  c = emptyComparison();
  c.scenarios = [{ mode: 0, status: 'DIFFERENT', candidateValidation: { status: 'PASS' }, comparison: {
    time: { exact: true, acceptedRows: 2, candidateRows: 2, maxAbsDiff: 0 },
    addedSeries: [], removedSeries: [],
    changedSeries: [{ column: 'X', maxAbs: 11, maxRel: 0.5, changedPoints: 1, time: 1, accepted: 10, candidate: 21 }]
  }}];
  p = structuredClone(basePolicy);
  p.rules = [{ id: 'bounded-x', action: 'allow', event: 'series_changed', modes: 0, name: 'X', max_abs: 10 }];
  r = evaluatePolicy({ comparisonReport: c, policy: p });
  mark(r.result === 'FAIL' && r.counts.thresholdExceeded === 1, 'allow rule numeric threshold is enforced');

  c = emptyComparison();
  p = structuredClone(basePolicy);
  p.accepted_model_sha256 = '0'.repeat(64);
  r = evaluatePolicy({ comparisonReport: c, policy: p });
  mark(r.result === 'FAIL' && r.counts.preflightErrors > 0, 'policy is bound to the accepted-model SHA');

  c = emptyComparison();
  c.engine.version = '99.0.0';
  r = evaluatePolicy({ comparisonReport: c, policy: structuredClone(basePolicy) });
  mark(r.result === 'FAIL' && r.preflightErrors.some(x => x.includes('Engine version mismatch')), 'policy is bound to the pinned engine version');

  c = emptyComparison();
  c.structure.acceptedModes = [0, 1];
  c.structure.candidateModes = [0, 1];
  c.scenarios = [{ mode: 0, status: 'IDENTICAL', candidateValidation: { status: 'PASS' }, comparison: { time: { exact: true }, addedSeries: [], removedSeries: [], changedSeries: [] } }];
  r = evaluatePolicy({ comparisonReport: c, policy: structuredClone(basePolicy) });
  mark(r.result === 'FAIL' && r.preflightErrors.some(x => x.includes('omitted Mode(s): 1')), 'full-coverage policy rejects a partial Mode comparison');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-policy-qa-'));
  try {
    const changedFile = path.join(tmp, 'candidate-changed.json');
    const changed = readJson(accepted);
    const el = changed.elements.find(x => x?.name === 'A Local Base Demand');
    if (!el) throw new Error('QA fixture element A Local Base Demand not found');
    el.behavior.value = Number(el.behavior.value) + 1;
    changed.name = `${changed.name} [POLICY QA changed candidate]`;
    writeJson(changedFile, changed);

    const cmp = await compareModels({
      acceptedFile: accepted,
      candidateFile: changedFile,
      validationFile: validation,
      modes: new Set([0]),
      outDir: ensureDir(path.join(tmp, 'compare'))
    });
    const integrationPolicy = structuredClone(basePolicy);
    integrationPolicy.require_full_mode_coverage = false; // integration fixture intentionally runs only Mode 0
    r = evaluatePolicy({ comparisonReport: cmp, policy: integrationPolicy });
    mark(r.result === 'FAIL' && r.counts.unexpected > 0 && r.counts.preflightErrors === 0, 'real changed candidate is rejected by strict policy');

    p = structuredClone(integrationPolicy);
    p.rules = [
      { id: 'allow-one-definition', action: 'allow', event: 'definition_changed', name: 'A Local Base Demand', required: true },
      { id: 'allow-mode0-output-impact', action: 'allow', event: 'series_changed', modes: 0, name: '*', required: true }
    ];
    r = evaluatePolicy({ comparisonReport: cmp, policy: p });
    mark(r.result === 'PASS' && r.counts.unexpected === 0 && r.counts.requiredMissing === 0, 'real changed candidate passes when all observed changes are explicitly covered');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
} catch (e) {
  console.error('[FAIL] policy QA crashed:', e.message || e);
  failed++;
}

console.log(`\nPOLICY QA RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${failed === 0 ? '10 passed, 0 failed' : `${failed} failed`})`);
process.exitCode = failed === 0 ? 0 : 2;
