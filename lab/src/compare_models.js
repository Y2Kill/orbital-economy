import fs from 'node:fs';
import path from 'node:path';
import { loadModelJSON, ENGINE_VERSION } from './engine.js';
import { readJson, sha256File, nowIso } from './util.js';
import { listScenarios, modelJsonForScenario } from './model.js';
import { checkFiniteAll, checkNonNegativeRegex, checkPlugin, checkTimeAxis, runGenericCheck, seriesContext } from './checks.js';
import { summarizeStatus } from './report.js';
import { writeModelComparisonReports } from './compare_report.js';
import { runLifecycleConformance } from './lifecycle_conformance.js';
import { runStructureAudits, structureAuditErrors } from './structure_audit.js';


function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = stable(value[k]);
    return out;
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stable(value));
}

function semanticElement(el) {
  return {
    type: el?.type ?? null,
    from: el?.from ?? null,
    to: el?.to ?? null,
    behavior: el?.behavior ?? null
  };
}

function namedElementMap(raw) {
  const out = new Map();
  for (const el of raw?.elements || []) {
    if (!el?.name || el.type === 'LINK') continue;
    out.set(el.name, el);
  }
  return out;
}

function linkSet(raw) {
  const out = new Set();
  for (const el of raw?.elements || []) {
    if (el?.type !== 'LINK') continue;
    out.add(`${el.from ?? ''} -> ${el.to ?? ''}`);
  }
  return out;
}

function scenarioMap(raw, modeVariable) {
  return new Map(listScenarios(raw, modeVariable).map(s => [s.mode, s]));
}

export function compareModelStructure(acceptedRaw, candidateRaw, modeVariable = 'Timed Test Mode') {
  const a = namedElementMap(acceptedRaw);
  const b = namedElementMap(candidateRaw);
  const aNames = new Set(a.keys());
  const bNames = new Set(b.keys());
  const addedElements = [...bNames].filter(n => !aNames.has(n)).sort();
  const removedElements = [...aNames].filter(n => !bNames.has(n)).sort();
  const changedDefinitions = [];
  const typeChanges = [];
  for (const name of [...aNames].filter(n => bNames.has(n)).sort()) {
    const ae = a.get(name), be = b.get(name);
    if (ae.type !== be.type) typeChanges.push({ name, accepted: ae.type, candidate: be.type });
    if (stableStringify(semanticElement(ae)) !== stableStringify(semanticElement(be))) {
      changedDefinitions.push(name);
    }
  }

  const al = linkSet(acceptedRaw), bl = linkSet(candidateRaw);
  const addedLinks = [...bl].filter(x => !al.has(x)).sort();
  const removedLinks = [...al].filter(x => !bl.has(x)).sort();

  const as = scenarioMap(acceptedRaw, modeVariable), bs = scenarioMap(candidateRaw, modeVariable);
  const aModes = new Set(as.keys()), bModes = new Set(bs.keys());
  const addedModes = [...bModes].filter(x => !aModes.has(x)).sort((x,y)=>x-y);
  const removedModes = [...aModes].filter(x => !bModes.has(x)).sort((x,y)=>x-y);
  const changedScenarioInputs = [];
  const renamedScenarios = [];
  for (const mode of [...aModes].filter(x => bModes.has(x)).sort((x,y)=>x-y)) {
    const aa = as.get(mode), bb = bs.get(mode);
    if (stableStringify(aa.values || {}) !== stableStringify(bb.values || {})) {
      changedScenarioInputs.push({ mode, accepted: aa.values || {}, candidate: bb.values || {} });
    }
    if (aa.name !== bb.name) renamedScenarios.push({ mode, accepted: aa.name, candidate: bb.name });
  }

  const simulationChanged = stableStringify(acceptedRaw?.simulation || null) !== stableStringify(candidateRaw?.simulation || null);
  return {
    byteComparable: true,
    elementCounts: { accepted: a.size, candidate: b.size },
    addedElements,
    removedElements,
    changedDefinitions,
    typeChanges,
    addedLinks,
    removedLinks,
    scenarioCounts: { accepted: as.size, candidate: bs.size },
    acceptedModes: [...aModes].sort((x,y)=>x-y),
    candidateModes: [...bModes].sort((x,y)=>x-y),
    addedModes,
    removedModes,
    changedScenarioInputs,
    renamedScenarios,
    simulationChanged,
    acceptedSimulation: acceptedRaw?.simulation || null,
    candidateSimulation: candidateRaw?.simulation || null
  };
}

// `hard`: kernel conformance / structure audits block the comparison (candidate). For the accepted model they are
// informational only — it was accepted under its own contract, and a structural task may legitimately tighten
// the contract (e.g. remove symmetry exceptions) so that the old accepted no longer satisfies the new validation.
function staticCheck(raw, modeVariable = 'Timed Test Mode', validation = null, { hard = true } = {}) {
  try {
    const model = loadModelJSON(raw);
    const errors = model.check().map(e => e.message || String(e));
    // Capital Lifecycle Kernel conformance is a static HARD gate: a candidate that breaks
    // the kernel topology is rejected before any output comparison, and policy cannot waive it.
    const conformance = validation ? runLifecycleConformance(raw, validation) : null;
    if (conformance?.status === 'FAIL' && hard) {
      for (const e of conformance.specErrors || []) errors.push(`kernel spec: ${e}`);
      for (const c of conformance.modelWide || []) if (c.status === 'FAIL') errors.push(`kernel model-wide: ${c.name}: ${c.message}`);
      for (const i of conformance.instances || []) for (const f of i.failures) errors.push(`kernel ${i.name}: ${f}`);
    }
    const seenModes = new Map();
    const seenSignatures = new Map();
    for (const [i, sc] of (raw.scenarios || []).entries()) {
      const mode = sc?.values?.[modeVariable];
      if (typeof mode === 'number' && Number.isFinite(mode)) {
        if (seenModes.has(mode)) errors.push(`Duplicate ${modeVariable}=${mode}: ${seenModes.get(mode)} / ${sc.name || i}`);
        else seenModes.set(mode, sc.name || String(i));
      }
      const sig = stableStringify(sc?.values || {});
      if (seenSignatures.has(sig)) errors.push(`Duplicate scenario values: ${seenSignatures.get(sig)} / ${sc.name || i}`);
      else seenSignatures.set(sig, sc.name || String(i));
    }
    // Structure audits (open boundaries classification, colony symmetry) are static HARD gates as well.
    const structure = validation ? runStructureAudits(raw, validation) : null;
    if (structure?.status === 'FAIL' && hard) for (const e of structureAuditErrors(structure)) errors.push(e);
    const structureSummary = structure && structure.status !== 'SKIPPED'
      ? { status: structure.status,
          openBoundaries: structure.openBoundaries ? structure.openBoundaries.summary : null,
          colonySymmetry: structure.colonySymmetry ? structure.colonySymmetry.summary : null }
      : null;
    const conformanceSummary = conformance && conformance.status !== 'SKIPPED'
      ? { status: conformance.status, instances: (conformance.instances || []).map(i => ({ name: i.name, classification: i.classification })) }
      : null;
    if (errors.length) return { status: 'FAIL', errors, conformance: conformanceSummary, structure: structureSummary };
    return { status: 'PASS', errors: [], elementCount: model.find().length, conformance: conformanceSummary, structure: structureSummary };
  } catch (e) {
    return { status: 'FAIL', errors: Array.isArray(e?.errors) ? e.errors.map(String) : [e?.message || String(e)] };
  }
}

function primitiveMap(model) {
  const out = new Map();
  for (const p of model.find()) {
    if (!p?.name || p.constructor?.name === 'Link') continue;
    out.set(p.name, p);
  }
  return out;
}

function relDiff(a, b, floor = 1e-12) {
  const denom = Math.max(Math.abs(a), Math.abs(b), floor);
  return Math.abs(a - b) / denom;
}

export function compareSimulationResults({ acceptedModel, acceptedResults, candidateModel, candidateResults, absTolerance = 0, relTolerance = null, relFloor = 1e-12 }) {
  const at = acceptedResults.times();
  const bt = candidateResults.times();
  let timeExact = at.length === bt.length;
  let maxTimeAbs = 0;
  const timeN = Math.min(at.length, bt.length);
  for (let i = 0; i < timeN; i++) {
    const d = Math.abs(at[i] - bt[i]);
    if (d !== 0) timeExact = false;
    if (d > maxTimeAbs) maxTimeAbs = d;
  }

  const am = primitiveMap(acceptedModel), bm = primitiveMap(candidateModel);
  const an = new Set(am.keys()), bn = new Set(bm.keys());
  const addedSeries = [...bn].filter(n => !an.has(n)).sort();
  const removedSeries = [...an].filter(n => !bn.has(n)).sort();
  const common = [...an].filter(n => bn.has(n)).sort();

  let changedPoints = 0;
  let maxAbs = 0, maxAbsWhere = null;
  let maxRel = 0, maxRelWhere = null;
  const changed = [];
  let comparableSeries = 0;

  for (const name of common) {
    let as, bs;
    try {
      as = acceptedResults.series(am.get(name));
      bs = candidateResults.series(bm.get(name));
    } catch {
      continue;
    }
    if (!as || !bs || typeof as.length !== 'number' || typeof bs.length !== 'number') continue;
    comparableSeries++;
    const n = Math.min(as.length, bs.length);
    let seriesMaxAbs = 0, seriesMaxRel = 0, seriesWhere = null, seriesChangedPoints = 0;
    for (let i = 0; i < n; i++) {
      const av = as[i], bv = bs[i];
      if (typeof av !== 'number' || typeof bv !== 'number' || !Number.isFinite(av) || !Number.isFinite(bv)) continue;
      const d = Math.abs(av - bv);
      const rd = relDiff(av, bv, relFloor);
      if (d > maxAbs) { maxAbs = d; maxAbsWhere = { column: name, index: i, time: bt[i] ?? at[i], accepted: av, candidate: bv }; }
      if (rd > maxRel) { maxRel = rd; maxRelWhere = { column: name, index: i, time: bt[i] ?? at[i], accepted: av, candidate: bv }; }
      if (d > seriesMaxAbs) { seriesMaxAbs = d; seriesWhere = { index: i, time: bt[i] ?? at[i], accepted: av, candidate: bv }; }
      if (rd > seriesMaxRel) seriesMaxRel = rd;
      if (d > absTolerance && (relTolerance == null || rd > relTolerance)) {
        changedPoints++;
        seriesChangedPoints++;
      }
    }
    if (as.length !== bs.length) {
      seriesChangedPoints += Math.abs(as.length - bs.length);
      changedPoints += Math.abs(as.length - bs.length);
    }
    if (seriesChangedPoints > 0) {
      changed.push({ column: name, maxAbs: seriesMaxAbs, maxRel: seriesMaxRel, changedPoints: seriesChangedPoints, ...seriesWhere });
    }
  }

  changed.sort((x,y) => y.maxAbs - x.maxAbs || y.maxRel - x.maxRel || x.column.localeCompare(y.column));
  const numericDifferent = changed.length > 0;
  // Added series alone do not make the common outputs different (v0.7.1); they are reported separately
  // and still produce series_added policy events.
  const outputDifferent = !timeExact || removedSeries.length > 0 || numericDifferent;
  return {
    result: outputDifferent ? 'DIFFERENT' : 'IDENTICAL',
    addedSeriesOnly: !outputDifferent && addedSeries.length > 0,
    time: { acceptedRows: at.length, candidateRows: bt.length, exact: timeExact, maxAbsDiff: maxTimeAbs },
    acceptedSeriesCount: am.size,
    candidateSeriesCount: bm.size,
    commonSeriesCount: common.length,
    comparableSeriesCount: comparableSeries,
    addedSeries,
    removedSeries,
    changedSeriesCount: changed.length,
    changedPoints,
    maxAbs,
    maxAbsWhere,
    maxRel,
    maxRelWhere,
    changedSeries: changed
  };
}

function scenarioChecks(validation, mode) {
  return validation?.scenarios?.[String(mode)]?.checks || [];
}

function runCandidateChecks(validation, raw, model, results, mode) {
  const checks = [];
  checks.push(checkTimeAxis(results, validation.expected_time_step ?? raw.simulation?.time_step ?? null, validation.time_step_tolerance ?? 1e-12));
  if (validation.finite_all !== false) checks.push(checkFiniteAll(model, results));
  if (validation.non_negative_regex) checks.push(checkNonNegativeRegex(model, results, validation.non_negative_regex.pattern, validation.non_negative_regex.tolerance ?? 1e-10));
  const ctx = seriesContext(model, results);
  for (const plugin of validation.plugins || []) checks.push(...checkPlugin(plugin, ctx));
  for (const c of validation.global_checks || []) checks.push(runGenericCheck(c, ctx));
  for (const c of scenarioChecks(validation, mode)) checks.push(runGenericCheck(c, ctx));
  return checks;
}

function selectedModes(aScenarios, bScenarios, modes) {
  const union = new Set([...aScenarios.keys(), ...bScenarios.keys()]);
  const arr = [...union].filter(m => !modes || modes.has(m)).sort((a,b)=>a-b);
  return arr;
}

export async function compareModels({ acceptedFile, candidateFile, validationFile, modes = null, outDir, absTolerance = 0, relTolerance = null, relFloor = 1e-12 }) {
  const acceptedRaw = readJson(acceptedFile);
  const candidateRaw = readJson(candidateFile);
  const validation = validationFile ? readJson(validationFile) : {};
  const modeVariable = validation.mode_variable || 'Timed Test Mode';
  const acceptedSha = sha256File(acceptedFile), candidateSha = sha256File(candidateFile);
  const structure = compareModelStructure(acceptedRaw, candidateRaw, modeVariable);
  const acceptedStatic = staticCheck(acceptedRaw, modeVariable, validation, { hard: false });
  const candidateStatic = staticCheck(candidateRaw, modeVariable, validation, { hard: true });

  console.log('Orbital Economy Lab - model-to-model comparison');
  console.log(`Accepted:  ${acceptedRaw.name || path.basename(acceptedFile)}`);
  console.log(`  SHA-256: ${acceptedSha}`);
  console.log(`Candidate: ${candidateRaw.name || path.basename(candidateFile)}`);
  console.log(`  SHA-256: ${candidateSha}`);
  console.log(`Byte-identical: ${acceptedSha === candidateSha ? 'YES' : 'NO'}`);
  console.log(`Static accepted: ${acceptedStatic.status}; candidate: ${candidateStatic.status}`);
  if (candidateStatic.conformance) console.log(`Kernel conformance accepted: ${acceptedStatic.conformance?.status || 'n/a'}; candidate: ${candidateStatic.conformance.status}`);
  if (candidateStatic.structure) console.log(`Structure audits accepted: ${acceptedStatic.structure?.status || 'n/a'} (informational); candidate: ${candidateStatic.structure.status} (closed-world violations: ${candidateStatic.structure.openBoundaries?.closedWorldViolations ?? 'n/a'}; symmetry mismatches: ${candidateStatic.structure.colonySymmetry?.mismatches ?? 'n/a'})`);
  for (const e of candidateStatic.errors || []) console.log(`    [FAIL] candidate static: ${e}`);
  console.log('');

  const report = {
    generated: nowIso(),
    overall: 'COMPLETE',
    result: null,
    engine: { package: 'simulation', version: ENGINE_VERSION, node: process.version },
    accepted: { file: path.resolve(acceptedFile), name: acceptedRaw.name || null, sha256: acceptedSha },
    candidate: { file: path.resolve(candidateFile), name: candidateRaw.name || null, sha256: candidateSha },
    validation: validationFile ? { file: path.resolve(validationFile), sha256: sha256File(validationFile) } : null,
    comparisonSettings: { absTolerance, relTolerance, relFloor },
    static: { accepted: acceptedStatic, candidate: candidateStatic },
    byteIdentical: acceptedSha === candidateSha,
    structure,
    scenarios: []
  };

  if (acceptedStatic.status === 'FAIL' || candidateStatic.status === 'FAIL') {
    report.overall = 'FAILED';
    report.result = 'NOT_COMPARED';
    writeModelComparisonReports(outDir, report);
    console.error('[FAIL] Static validation failed. Simulation comparison was not started.');
    return report;
  }

  const am = scenarioMap(acceptedRaw, modeVariable), bm = scenarioMap(candidateRaw, modeVariable);
  const modeList = selectedModes(am, bm, modes);
  console.log(`Selected Modes: ${modeList.join(', ') || 'none'}`);
  console.log('');

  for (const mode of modeList) {
    const as = am.get(mode), bs = bm.get(mode);
    if (!as && bs) {
      console.log(`=== Mode ${mode}: ${bs.name} [CANDIDATE ONLY] ===`);
      let candidateModel, candidateResults;
      const startB = process.hrtime.bigint();
      try {
        candidateModel = loadModelJSON(modelJsonForScenario(candidateRaw, bs));
        const errs = candidateModel.check();
        if (errs.length) throw new Error(errs.map(e => e.message || e).join('; '));
        candidateResults = candidateModel.simulate();
        const candidateRuntimeSeconds = Number(process.hrtime.bigint() - startB) / 1e9;
        const checks = runCandidateChecks(validation, candidateRaw, candidateModel, candidateResults, mode);
        const candidateValidationStatus = summarizeStatus(checks);
        console.log(`    Candidate validation: ${candidateValidationStatus}`);
        console.log('    Baseline comparison:  N/A (new candidate Mode)\n');
        report.scenarios.push({
          mode, acceptedName: null, candidateName: bs.name,
          status: candidateValidationStatus === 'FAIL' ? 'VALIDATION_FAIL' : 'CANDIDATE_ONLY',
          reason: 'Mode exists only in candidate model; candidate validation was executed, but no accepted baseline exists.',
          scenarioInputsEqual: false,
          candidateRuntimeSeconds,
          candidateValidation: { status: candidateValidationStatus, checks },
          comparison: null
        });
      } catch (e) {
        console.log(`    [FAIL] Candidate-only simulation: ${e.message || e}\n`);
        report.scenarios.push({ mode, acceptedName: null, candidateName: bs.name, status: 'ERROR', reason: `Candidate simulation failed: ${e.message || e}`, scenarioInputsEqual: false, candidateValidation: null, comparison: null });
      }
      candidateModel = null; candidateResults = null;
      if (global.gc) global.gc();
      continue;
    }

    if (as && !bs) {
      console.log(`Mode ${mode}: [MISSING IN CANDIDATE] ${as.name}`);
      report.scenarios.push({
        mode,
        acceptedName: as.name,
        candidateName: null,
        status: 'ACCEPTED_ONLY',
        reason: 'Mode exists in accepted model but is missing in candidate model.',
        scenarioInputsEqual: false,
        candidateValidation: null,
        comparison: null
      });
      continue;
    }

    const inputsEqual = stableStringify(as.values || {}) === stableStringify(bs.values || {});
    console.log(`=== Mode ${mode}: ${bs.name}${as.name !== bs.name ? ` (accepted: ${as.name})` : ''} ===`);
    if (!inputsEqual) console.log('    [WARN] Scenario input values differ between accepted and candidate.');

    let acceptedModel, acceptedResults, candidateModel, candidateResults;
    const startA = process.hrtime.bigint();
    try {
      acceptedModel = loadModelJSON(modelJsonForScenario(acceptedRaw, as));
      const errs = acceptedModel.check();
      if (errs.length) throw new Error(errs.map(e => e.message || e).join('; '));
      acceptedResults = acceptedModel.simulate();
    } catch (e) {
      report.scenarios.push({ mode, acceptedName: as.name, candidateName: bs.name, status: 'ERROR', reason: `Accepted simulation failed: ${e.message || e}`, scenarioInputsEqual: inputsEqual, candidateValidation: null, comparison: null });
      console.log(`    [FAIL] Accepted simulation: ${e.message || e}`);
      continue;
    }
    const acceptedRuntimeSeconds = Number(process.hrtime.bigint() - startA) / 1e9;

    const startB = process.hrtime.bigint();
    try {
      candidateModel = loadModelJSON(modelJsonForScenario(candidateRaw, bs));
      const errs = candidateModel.check();
      if (errs.length) throw new Error(errs.map(e => e.message || e).join('; '));
      candidateResults = candidateModel.simulate();
    } catch (e) {
      report.scenarios.push({ mode, acceptedName: as.name, candidateName: bs.name, status: 'ERROR', reason: `Candidate simulation failed: ${e.message || e}`, scenarioInputsEqual: inputsEqual, acceptedRuntimeSeconds, candidateValidation: null, comparison: null });
      console.log(`    [FAIL] Candidate simulation: ${e.message || e}`);
      acceptedModel = null; acceptedResults = null;
      if (global.gc) global.gc();
      continue;
    }
    const candidateRuntimeSeconds = Number(process.hrtime.bigint() - startB) / 1e9;

    const checks = runCandidateChecks(validation, candidateRaw, candidateModel, candidateResults, mode);
    const candidateValidationStatus = summarizeStatus(checks);
    const comparison = compareSimulationResults({
      acceptedModel, acceptedResults, candidateModel, candidateResults,
      absTolerance, relTolerance, relFloor
    });
    const status = candidateValidationStatus === 'FAIL' ? 'VALIDATION_FAIL' : comparison.result;

    console.log(`    Candidate validation: ${candidateValidationStatus}`);
    console.log(`    Output comparison:    ${comparison.result}`);
    console.log(`    common=${comparison.commonSeriesCount}, changed=${comparison.changedSeriesCount}, added=${comparison.addedSeries.length}, removed=${comparison.removedSeries.length}, maxAbs=${comparison.maxAbs}`);
    if (comparison.maxAbsWhere) {
      console.log(`    maxAbs at ${comparison.maxAbsWhere.column} day ${comparison.maxAbsWhere.time}: accepted=${comparison.maxAbsWhere.accepted}, candidate=${comparison.maxAbsWhere.candidate}`);
    }
    console.log(`    runtime accepted=${acceptedRuntimeSeconds.toFixed(2)}s candidate=${candidateRuntimeSeconds.toFixed(2)}s\n`);

    report.scenarios.push({
      mode,
      acceptedName: as.name,
      candidateName: bs.name,
      status,
      scenarioInputsEqual: inputsEqual,
      acceptedScenarioValues: inputsEqual ? undefined : as.values,
      candidateScenarioValues: inputsEqual ? undefined : bs.values,
      acceptedRuntimeSeconds,
      candidateRuntimeSeconds,
      candidateValidation: { status: candidateValidationStatus, checks },
      comparison
    });

    acceptedModel = null; acceptedResults = null; candidateModel = null; candidateResults = null;
    if (global.gc) global.gc();
  }

  const errors = report.scenarios.some(s => s.status === 'ERROR');
  const validationFails = report.scenarios.some(s => s.status === 'VALIDATION_FAIL');
  const missingAcceptedModesInCandidate = report.scenarios.some(s => s.status === 'ACCEPTED_ONLY');
  const candidateOnlyModes = report.scenarios.some(s => s.status === 'CANDIDATE_ONLY');
  const anyDifferent = report.scenarios.some(s => s.comparison?.result === 'DIFFERENT');
  const anyAddedSeries = report.scenarios.some(s => (s.comparison?.addedSeries || []).length > 0);
  const scenarioInputChanges = structure.changedScenarioInputs.length > 0 || structure.removedModes.length > 0;

  if (errors || validationFails) report.overall = 'FAILED';
  else if (missingAcceptedModesInCandidate) report.overall = 'INCOMPLETE';
  else report.overall = 'COMPLETE';

  if (errors) report.result = 'ERROR';
  else if (missingAcceptedModesInCandidate) report.result = 'NOT_FULLY_COMPARABLE';
  else if (anyDifferent) report.result = 'DIFFERENT_OUTPUTS';
  else if (scenarioInputChanges) report.result = 'OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED';
  else if (candidateOnlyModes) report.result = 'COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES';
  else if (anyAddedSeries) report.result = 'OUTPUTS_IDENTICAL_WITH_NEW_SERIES';
  else if (acceptedSha === candidateSha) report.result = 'BYTE_IDENTICAL';
  else report.result = 'OUTPUTS_IDENTICAL';

  writeModelComparisonReports(outDir, report);
  console.log('============================================================');
  console.log(`COMPARISON RESULT: ${report.result}`);
  console.log(`RUN STATUS:        ${report.overall}`);
  console.log(`Report: ${path.join(outDir, 'model-comparison.md')}`);
  console.log('============================================================');
  return report;
}
