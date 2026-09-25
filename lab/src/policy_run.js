import path from 'node:path';
import { readJson } from './util.js';
import { compareModels } from './compare_models.js';
import { evaluatePolicy, writePolicyReports } from './policy.js';

export async function runCandidatePolicyCheck({ acceptedFile, candidateFile, validationFile, policyFile, modes = null, outDir, absTolerance = 0, relTolerance = null, relFloor = 1e-12 }) {
  const comparison = await compareModels({
    acceptedFile,
    candidateFile,
    validationFile,
    modes,
    outDir,
    absTolerance,
    relTolerance,
    relFloor
  });
  const policy = readJson(policyFile);
  const result = evaluatePolicy({ comparisonReport: comparison, policy, policyFile });
  writePolicyReports(outDir, result);

  console.log('');
  console.log('============================================================');
  console.log(`POLICY RESULT:     ${result.result}`);
  console.log(`Observed changes:  ${result.counts.observedEvents}`);
  console.log(`Expected/allowed:  ${result.counts.expected}`);
  console.log(`Unexpected:        ${result.counts.unexpected}`);
  console.log(`Forbidden:         ${result.counts.forbidden}`);
  console.log(`Threshold exceed:  ${result.counts.thresholdExceeded}`);
  console.log(`Required missing:  ${result.counts.requiredMissing}`);
  console.log(`Hard blockers:     ${result.counts.hardBlockers}`);
  console.log(`Report: ${path.join(outDir, 'change-policy.md')}`);
  console.log('============================================================');

  return { comparison, policyResult: result };
}
