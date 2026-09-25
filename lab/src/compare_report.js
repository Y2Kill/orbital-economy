import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, fmtNum, writeJson } from './util.js';

function esc(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' '); }
function listPreview(arr, n = 30) {
  if (!arr?.length) return 'none';
  const head = arr.slice(0, n).map(esc).join(', ');
  return arr.length > n ? `${head} … (+${arr.length - n})` : head;
}

export function writeModelComparisonReports(outDir, report) {
  ensureDir(outDir);
  writeJson(path.join(outDir, 'model-comparison.json'), report);
  const l = [];
  l.push('# Orbital Economy Lab — model-to-model comparison');
  l.push('');
  l.push(`- generated: ${report.generated}`);
  l.push(`- engine: simulation ${report.engine.version}; Node ${report.engine.node}`);
  l.push(`- run status: **${report.overall}**`);
  l.push(`- comparison result: **${report.result || 'pending'}**`);
  l.push(`- byte-identical: **${report.byteIdentical ? 'YES' : 'NO'}**`);
  l.push('');
  l.push('## Models');
  l.push('');
  l.push(`- accepted: ${esc(report.accepted.name || report.accepted.file)}`);
  l.push(`  - SHA-256: \`${report.accepted.sha256}\``);
  l.push(`  - file: ${esc(report.accepted.file)}`);
  l.push(`- candidate: ${esc(report.candidate.name || report.candidate.file)}`);
  l.push(`  - SHA-256: \`${report.candidate.sha256}\``);
  l.push(`  - file: ${esc(report.candidate.file)}`);
  if (report.validation) l.push(`- validation SHA-256: \`${report.validation.sha256}\``);
  if (report.comparisonSettings) l.push(`- comparison settings: absTolerance=${report.comparisonSettings.absTolerance}; relTolerance=${report.comparisonSettings.relTolerance == null ? 'disabled' : report.comparisonSettings.relTolerance}; relFloor=${report.comparisonSettings.relFloor}`);
  l.push('');

  l.push('## Static validation');
  l.push('');
  l.push(`- accepted: **${report.static.accepted.status}**`);
  for (const e of report.static.accepted.errors || []) l.push(`  - FAIL: ${esc(e)}`);
  l.push(`- candidate: **${report.static.candidate.status}**`);
  for (const e of report.static.candidate.errors || []) l.push(`  - FAIL: ${esc(e)}`);
  for (const side of ['accepted', 'candidate']) {
    const c = report.static[side]?.conformance;
    if (!c) continue;
    l.push(`- ${side} kernel conformance: **${c.status}** — ${(c.instances || []).map(i => `${esc(i.name)}=${i.classification}`).join(', ')}`);
  }
  for (const side of ['accepted', 'candidate']) {
    const st = report.static[side]?.structure;
    if (!st) continue;
    l.push(`- ${side} structure audits: **${st.status}** — open boundaries ${st.openBoundaries?.openFlows ?? '-'} (unclassified ${st.openBoundaries?.unclassified ?? '-'}, closed-world violations ${st.openBoundaries?.closedWorldViolations ?? '-'}); colony symmetry mismatches ${st.colonySymmetry?.mismatches ?? '-'}`);
  }
  l.push('');

  const s = report.structure || {};
  l.push('## Structural / behavioral definition diff');
  l.push('');
  l.push(`- named elements: accepted ${s.elementCounts?.accepted ?? '-'}, candidate ${s.elementCounts?.candidate ?? '-'}`);
  l.push(`- added elements (${s.addedElements?.length || 0}): ${listPreview(s.addedElements)}`);
  l.push(`- removed elements (${s.removedElements?.length || 0}): ${listPreview(s.removedElements)}`);
  l.push(`- changed semantic definitions (${s.changedDefinitions?.length || 0}): ${listPreview(s.changedDefinitions)}`);
  l.push(`- type changes (${s.typeChanges?.length || 0}): ${s.typeChanges?.length ? s.typeChanges.slice(0,20).map(x => `${esc(x.name)}: ${esc(x.accepted)}→${esc(x.candidate)}`).join(', ') : 'none'}`);
  l.push(`- added LINK pairs (${s.addedLinks?.length || 0}): ${listPreview(s.addedLinks)}`);
  l.push(`- removed LINK pairs (${s.removedLinks?.length || 0}): ${listPreview(s.removedLinks)}`);
  l.push(`- simulation settings changed: **${s.simulationChanged ? 'YES' : 'NO'}**`);
  l.push(`- added Modes: ${s.addedModes?.join(', ') || 'none'}`);
  l.push(`- removed Modes: ${s.removedModes?.join(', ') || 'none'}`);
  l.push(`- changed scenario inputs: ${s.changedScenarioInputs?.length || 0}`);
  if (s.changedScenarioInputs?.length) {
    for (const x of s.changedScenarioInputs.slice(0,20)) l.push(`  - Mode ${x.mode}: accepted=${esc(JSON.stringify(x.accepted))}; candidate=${esc(JSON.stringify(x.candidate))}`);
  }
  l.push('');

  l.push('## Scenario comparison');
  l.push('');
  l.push('| Mode | Candidate scenario | Candidate validation | Output | Common | Changed | Added | Removed | Max abs diff |');
  l.push('|---:|---|:---:|:---:|---:|---:|---:|---:|---:|');
  for (const x of report.scenarios || []) {
    const c = x.comparison;
    l.push(`| ${x.mode} | ${esc(x.candidateName || x.acceptedName || '-')} | ${x.candidateValidation?.status || '-'} | ${c?.result || x.status} | ${c?.commonSeriesCount ?? '-'} | ${c?.changedSeriesCount ?? '-'} | ${c?.addedSeries?.length ?? '-'} | ${c?.removedSeries?.length ?? '-'} | ${c?.maxAbs != null ? fmtNum(c.maxAbs) : '-'} |`);
  }
  l.push('');

  for (const x of report.scenarios || []) {
    l.push(`### Mode ${x.mode} — ${esc(x.candidateName || x.acceptedName || '')}`);
    l.push('');
    if (x.reason) l.push(`- status: **${x.status}** — ${esc(x.reason)}`);
    else l.push(`- status: **${x.status}**`);
    l.push(`- scenario inputs equal: **${x.scenarioInputsEqual ? 'YES' : 'NO'}**`);
    if (x.acceptedRuntimeSeconds != null) l.push(`- runtime: accepted ${fmtNum(x.acceptedRuntimeSeconds)} s; candidate ${fmtNum(x.candidateRuntimeSeconds)} s`);
    if (x.candidateValidation) {
      l.push(`- candidate validation: **${x.candidateValidation.status}**`);
      const failed = x.candidateValidation.checks.filter(c => c.status !== 'PASS');
      for (const c of failed) l.push(`  - ${c.status}: ${esc(c.name)}${c.message ? ` — ${esc(c.message)}` : ''}`);
    }
    const c = x.comparison;
    if (c) {
      l.push(`- output: **${c.result}**`);
      l.push(`- time axis exact: ${c.time.exact}; rows accepted/candidate: ${c.time.acceptedRows}/${c.time.candidateRows}; max time diff: ${fmtNum(c.time.maxAbsDiff)}`);
      l.push(`- series: accepted ${c.acceptedSeriesCount}; candidate ${c.candidateSeriesCount}; common ${c.commonSeriesCount}; comparable ${c.comparableSeriesCount}`);
      l.push(`- changed series: ${c.changedSeriesCount}; changed points: ${c.changedPoints}`);
      l.push(`- added series (${c.addedSeries.length}): ${listPreview(c.addedSeries)}`);
      l.push(`- removed series (${c.removedSeries.length}): ${listPreview(c.removedSeries)}`);
      l.push(`- max abs diff: ${fmtNum(c.maxAbs)}; max rel diff: ${fmtNum(c.maxRel)}`);
      if (c.maxAbsWhere) l.push(`- max abs location: ${esc(c.maxAbsWhere.column)} @ day ${fmtNum(c.maxAbsWhere.time)}; accepted=${fmtNum(c.maxAbsWhere.accepted)}, candidate=${fmtNum(c.maxAbsWhere.candidate)}`);
      if (c.changedSeries?.length) {
        l.push('- largest changed series:');
        for (const y of c.changedSeries.slice(0,20)) l.push(`  - ${esc(y.column)}: abs=${fmtNum(y.maxAbs)}, rel=${fmtNum(y.maxRel)}, changed points=${y.changedPoints}, day=${fmtNum(y.time)}`);
      }
    }
    l.push('');
  }

  l.push('## Interpretation');
  l.push('');
  l.push('- `BYTE_IDENTICAL`: files have the same SHA-256 and compared outputs are identical.');
  l.push('- `OUTPUTS_IDENTICAL`: ModelJSON files differ, but all compared scenario outputs are identical at the selected tolerance.');
  l.push('- `DIFFERENT_OUTPUTS`: at least one common scenario produces a changed time series, time axis, or added/removed output series. This is a factual diff, not an automatic judgment that the change is wrong.');
  l.push('- `COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES`: all common Modes are output-identical and candidate only adds new Modes; candidate-only Modes are still simulated and validated.');
  l.push('- `NOT_FULLY_COMPARABLE`: candidate is missing at least one Mode that exists in accepted.');
  l.push('- Candidate HARD/physics validation failures are reported separately and make the comparison run FAILED.');
  l.push('');

  fs.writeFileSync(path.join(outDir, 'model-comparison.md'), l.join('\n'), 'utf8');
}
