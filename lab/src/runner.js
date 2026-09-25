import fs from 'node:fs';
import path from 'node:path';
import { loadModelJSON } from 'simulation';
const ENGINE_VERSION = '9.0.0';
import { modelJsonForScenario, listScenarios } from './model.js';
import { checkFiniteAll, checkNonNegativeRegex, checkPlugin, checkTimeAxis, runGenericCheck, seriesContext } from './checks.js';
import { compareResultsToCsv, inspectWebReferenceBatch } from './regression.js';
import { nowIso, readJson, sha256File } from './util.js';
import { summarizeStatus, writeReports } from './report.js';
import { archiveProcessedWebBatch } from './workspace.js';
import { runLifecycleConformance, printConformance } from './lifecycle_conformance.js';
import { runStructureAudits, printStructureAudits } from './structure_audit.js';

function printCheck(c) {
  const marker = c.status === 'PASS' ? '[PASS]' : c.status === 'WARN' ? '[WARN]' : '[FAIL]';
  console.log(`    ${marker} ${c.name}${c.message ? `: ${c.message}` : ''}`);
}

function scenarioSpecificChecks(validation, mode) {
  return validation?.scenarios?.[String(mode)]?.checks || [];
}

export async function inspectModel(modelFile) {
  const raw = readJson(modelFile);
  console.log(`ModelJSON: ${modelFile}`);
  console.log(`SHA-256:   ${sha256File(modelFile)}`);
  let model;
  try {
    model = loadModelJSON(raw);
  } catch (e) {
    console.error('\n[FAIL] ModelJSON schema/import');
    if (Array.isArray(e.errors)) for (const x of e.errors) console.error('  - ' + x);
    else console.error(e.message);
    return { status: 'FAIL', errors: e.errors || [e.message] };
  }
  const errors = model.check();

  const scenarioErrors = [];
  const seenModes = new Map();
  const seenSignatures = new Map();
  const modeVariable = 'Timed Test Mode';
  for (const [i, sc] of (raw.scenarios || []).entries()) {
    const mode = sc?.values?.[modeVariable];
    if (typeof mode === 'number') {
      if (seenModes.has(mode)) scenarioErrors.push(`Duplicate ${modeVariable}=${mode}: ${seenModes.get(mode)} / ${sc.name || i}`);
      else seenModes.set(mode, sc.name || String(i));
    }
    const sig = JSON.stringify(Object.entries(sc?.values || {}).sort(([a],[b]) => a.localeCompare(b)));
    if (seenSignatures.has(sig)) scenarioErrors.push(`Duplicate scenario values: ${seenSignatures.get(sig)} / ${sc.name || i}`);
    else seenSignatures.set(sig, sc.name || String(i));
  }
  for (const msg of scenarioErrors) errors.push({ message: msg });
  if (errors.length) {
    console.error(`\n[FAIL] model.check(): ${errors.length} error(s)`);
    for (const e of errors) console.error(`  - ${e.message || e}`);
    return { status: 'FAIL', errors: errors.map(e => e.message || String(e)) };
  }
  console.log('\n[PASS] loadModelJSON()');
  console.log('[PASS] model.check()');
  console.log(`Elements:  ${model.find().length}`);
  console.log(`Scenarios: ${(raw.scenarios || []).length}`);
  return { status: 'PASS', errors: [] };
}

function serializableWebInfo(web) {
  if (!web) return null;
  return {
    status: web.status,
    present: web.present,
    referenceDir: web.referenceDir,
    manifest: web.manifest,
    files: web.files,
    errors: web.errors,
    warnings: web.warnings,
    missingModes: web.missingModes,
    extraModes: web.extraModes,
    foundModes: [...web.byMode.keys()].sort((a,b)=>a-b)
  };
}

export async function runValidation({ modelFile, validationFile, webReferenceDir = null, modes, outDir, archiveWeb = false }) {
  const raw = readJson(modelFile);
  if (validationFile && !fs.existsSync(validationFile)) throw new Error(`Validation file not found: ${validationFile}`);
  const validation = validationFile ? readJson(validationFile) : {};
  const modeVariable = validation.mode_variable || 'Timed Test Mode';
  const scenarios = listScenarios(raw, modeVariable).filter(s => !modes || modes.has(s.mode));
  const staticResult = await inspectModel(modelFile);

  // Static Capital Lifecycle Kernel conformance (topology/wiring), before any simulation.
  const conformance = runLifecycleConformance(raw, validation);
  if (conformance.status !== 'SKIPPED') { console.log(''); printConformance(conformance); }

  // Static structure audits: open boundaries (planet meter) + colony symmetry.
  const structure = runStructureAudits(raw, validation);
  if (structure.status !== 'SKIPPED') { console.log(''); printStructureAudits(structure); }

  let web = null;
  if (webReferenceDir) {
    web = await inspectWebReferenceBatch({
      referenceDir: webReferenceDir,
      currentModelFile: modelFile,
      currentValidationFile: validationFile,
      modeColumn: modeVariable
    });
    console.log('');
    if (!web.present) {
      console.log('[SKIP] Web reference: no CSV files supplied. Local validation will continue normally.');
    } else {
      console.log(`Web reference folder: ${path.resolve(webReferenceDir)}`);
      console.log(`Web Modes detected: ${[...web.byMode.keys()].sort((a,b)=>a-b).join(', ') || 'none'}`);
      if (web.manifest?.model?.name) console.log(`Web batch model: ${web.manifest.model.name}`);
      for (const w of web.warnings) console.log(`[WARN] ${w}`);
      for (const e of web.errors) console.log(`[FAIL] ${e}`);
      console.log(`Web batch preflight: ${web.status}`);
    }
  }

  if (web?.present && web.status === 'FAIL') {
    const report = {
      generated: nowIso(), overall: 'FAIL',
      engine: { package: 'simulation', version: ENGINE_VERSION, node: process.version },
      model: { file: path.resolve(modelFile), name: raw.name, sha256: sha256File(modelFile) },
      validation: validationFile ? { file: path.resolve(validationFile), sha256: sha256File(validationFile) } : null,
      webReference: serializableWebInfo(web),
      static: staticResult, conformance, structure, scenarios: []
    };
    writeReports(outDir, report);
    console.error('\n[FAIL] Web-reference preflight failed. Simulation was not started. Fix the reference batch and run again.');
    console.log(`Report:  ${path.join(outDir, 'report.md')}`);
    return report;
  }

  if (staticResult.status === 'FAIL') {
    const report = {
      generated: nowIso(), overall: 'FAIL',
      engine: { package: 'simulation', version: ENGINE_VERSION, node: process.version },
      model: { file: path.resolve(modelFile), name: raw.name, sha256: sha256File(modelFile) },
      validation: validationFile ? { file: path.resolve(validationFile), sha256: sha256File(validationFile) } : null,
      webReference: serializableWebInfo(web),
      static: staticResult, conformance, structure, scenarios: []
    };
    writeReports(outDir, report);
    return report;
  }

  console.log(`\nEngine: simulation ${ENGINE_VERSION}`);
  console.log(`Selected scenarios: ${scenarios.length}`);
  console.log('');

  const reportScenarios = [];
  for (const s of scenarios) {
    console.log(`=== Mode ${s.mode}: ${s.name} ===`);
    const start = process.hrtime.bigint();
    let model, results;
    try {
      const data = modelJsonForScenario(raw, s);
      model = loadModelJSON(data);
      const checkErrors = model.check();
      if (checkErrors.length) throw new Error(`model.check() returned ${checkErrors.length}: ${checkErrors.map(e => e.message || e).join('; ')}`);
      results = model.simulate();
    } catch (e) {
      const runtimeSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      console.error(`  [FAIL] simulation: ${e.message || e}`);
      reportScenarios.push({ mode: s.mode, name: s.name, status: 'FAIL', runtimeSeconds, checks: [{ status: 'FAIL', name: 'simulation', message: e.message || String(e) }], webCrossCheck: null });
      continue;
    }

    const checks = [];
    checks.push(checkTimeAxis(results, validation.expected_time_step ?? raw.simulation?.time_step ?? null, validation.time_step_tolerance ?? 1e-12));
    if (validation.finite_all !== false) checks.push(checkFiniteAll(model, results));
    if (validation.non_negative_regex) checks.push(checkNonNegativeRegex(model, results, validation.non_negative_regex.pattern, validation.non_negative_regex.tolerance ?? 1e-10));

    const ctx = seriesContext(model, results);
    for (const plugin of validation.plugins || []) checks.push(...checkPlugin(plugin, ctx));
    for (const c of validation.global_checks || []) checks.push(runGenericCheck(c, ctx));
    for (const c of scenarioSpecificChecks(validation, s.mode)) checks.push(runGenericCheck(c, ctx));
    for (const c of checks) printCheck(c);

    let webCrossCheck = null;
    if (web?.present) {
      const ref = web.byMode.get(s.mode);
      if (!ref) {
        webCrossCheck = { status: 'FAIL', message: `No unique web CSV for Mode ${s.mode}` };
      } else {
        try {
          webCrossCheck = await compareResultsToCsv({
            model,
            results,
            csvFile: ref,
            absTolerance: validation.web_crosscheck_abs_tolerance ?? 0,
            relTolerance: validation.web_crosscheck_rel_tolerance ?? null,
            relFloor: validation.web_crosscheck_rel_floor ?? 1e-12
          });
        } catch (e) {
          webCrossCheck = { status: 'FAIL', message: `Cannot compare web CSV: ${e.message || e}`, file: ref };
        }
      }
      const extra = webCrossCheck.maxAbs != null ? ` maxAbs=${webCrossCheck.maxAbs} maxRel=${webCrossCheck.maxRel}` : '';
      console.log(`    [${webCrossCheck.status}] web cross-check${extra}${webCrossCheck.message ? `: ${webCrossCheck.message}` : ''}`);
    }

    const runtimeSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const status = summarizeStatus([...checks, ...(webCrossCheck ? [webCrossCheck] : [])]);
    console.log(`  => ${status} (${runtimeSeconds.toFixed(2)} s)\n`);
    reportScenarios.push({ mode: s.mode, name: s.name, status, runtimeSeconds, checks, webCrossCheck });
    model = null; results = null;
    if (global.gc) global.gc();
  }

  const overallItems = reportScenarios.map(s => ({ status: s.status }));
  if (web?.present) overallItems.push({ status: web.status === 'WARN' ? 'WARN' : web.status });
  if (conformance.status === 'FAIL') overallItems.push({ status: 'FAIL' });
  if (structure.status === 'FAIL') overallItems.push({ status: 'FAIL' });
  const overall = summarizeStatus(overallItems);
  const report = {
    generated: nowIso(), overall,
    engine: { package: 'simulation', version: ENGINE_VERSION, node: process.version },
    model: { file: path.resolve(modelFile), name: raw.name, sha256: sha256File(modelFile) },
    validation: validationFile ? { file: path.resolve(validationFile), sha256: sha256File(validationFile) } : null,
    webReference: serializableWebInfo(web),
    static: staticResult,
    conformance,
    structure,
    scenarios: reportScenarios
  };
  writeReports(outDir, report);

  if (archiveWeb && web?.present) {
    try {
      const archivedTo = archiveProcessedWebBatch({ pendingDir: webReferenceDir, outDir });
      if (archivedTo) {
        report.webReference.archivedTo = path.resolve(archivedTo);
        writeReports(outDir, report);
        console.log(`Web reference batch archived to: ${archivedTo}`);
      }
    } catch (e) {
      console.error(`[WARN] Could not archive web-reference batch: ${e.message || e}`);
      report.webReference.archiveWarning = e.message || String(e);
      writeReports(outDir, report);
    }
  }

  console.log(`OVERALL: ${overall}`);
  console.log(`Report:  ${path.join(outDir, 'report.md')}`);
  return report;
}
