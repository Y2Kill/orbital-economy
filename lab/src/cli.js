#!/usr/bin/env node
import path from 'node:path';
import { readJson, parseArgs, parseModeList, ensureDir, writeJson, sha256File } from './util.js';
import { listScenarios } from './model.js';
import { inspectModel, runValidation } from './runner.js';
import { discoverWorkspace, prepareWebBatch, discoverSingleJson } from './workspace.js';
import { compareModels } from './compare_models.js';
import { evaluatePolicyFiles } from './policy.js';
import { runCandidatePolicyCheck } from './policy_run.js';
import { runConformanceCommand } from './conformance_run.js';
import { runAuditCommand, runLoopsCommand } from './audit_run.js';
import { applyPatch } from './patch.js';
import { runParametersCommand } from './parameters.js';
import { runSeriesCommand } from './series.js';

function defaultOutDir() {
  return path.resolve('output', `run-${new Date().toISOString().replace(/[:.]/g, '-')}`);
}

function usage() {
  console.log(`
Orbital Economy Lab v0.9.5

Recommended workspace commands:
  lab [--input=input] [--modes=all] [--out=DIR]
  prepare-web [--input=input] [--force]
  compare [accepted.json] [candidate.json] [validation.json] [--modes=all] [--out=DIR]
  policy [accepted.json] [candidate.json] [validation.json] [policy.json] [--modes=all] [--out=DIR]
  evaluate-policy <model-comparison.json> [policy.json] [--out=DIR]
  conformance [model.json] [validation.json] [--out=DIR]
  audit [model.json] [validation.json] [--out=DIR]
  apply-patch <patch.json> [base.json] [--out=candidate.json]
  parameters [model.json] [--annotations=file.json] [--out=DIR]
  series [model.json] [--modes=all] [--out=DIR] [--dump=MODE] [--plan=file.json]

Advanced commands:
  inspect <model.json>
  list <model.json> [--mode-variable=Timed Test Mode]
  test <model.json> [validation.json] [--modes=0,12-16] [--web-reference=DIR] [--out=DIR]

Examples:
  node src/cli.js lab
  node src/cli.js prepare-web
  node src/cli.js compare
  node src/cli.js compare accepted.json candidate.json validation.json --modes=0,12-16
  node src/cli.js policy
  node src/cli.js evaluate-policy output/compare-.../model-comparison.json
  node src/cli.js conformance
  node src/cli.js audit
  node src/cli.js apply-patch delivery/model-patch.json --out=input/model/candidate.json
  node src/cli.js parameters --annotations=../docs/PARAMETER_ANNOTATIONS.json
  node src/cli.js series --modes=all --out=output/series
  node src/cli.js inspect input/model/orbital_economy_v7_3_modeljson.json
  node src/cli.js test model.json validation.json --modes=all --web-reference=input/web_reference/pending
`);
}

const { positional, options } = parseArgs(process.argv.slice(2));
const cmd = positional[0];
if (!cmd || cmd === 'help' || options.help) { usage(); process.exit(0); }

try {
  if (cmd === 'inspect') {
    if (!positional[1]) throw new Error('Need a path to model.json');
    const r = await inspectModel(positional[1]);
    process.exitCode = r.status === 'PASS' ? 0 : 2;
  } else if (cmd === 'list') {
    if (!positional[1]) throw new Error('Need a path to model.json');
    const raw = readJson(positional[1]);
    const arr = listScenarios(raw, options['mode-variable'] || 'Timed Test Mode');
    for (const s of arr) console.log(`${String(s.mode).padStart(3)}  ${s.name}`);
  } else if (cmd === 'test') {
    if (!positional[1]) throw new Error('Need a path to model.json');
    const modelFile = positional[1];
    const validationFile = positional[2] || null;
    const modes = parseModeList(options.modes || 'all');
    const outDir = ensureDir(options.out || defaultOutDir());
    const report = await runValidation({
      modelFile,
      validationFile,
      webReferenceDir: options['web-reference'] || null,
      modes,
      outDir,
      archiveWeb: false
    });
    process.exitCode = report.overall === 'FAIL' ? 2 : 0;
  } else if (cmd === 'lab') {
    const ws = discoverWorkspace(options.input || path.resolve('input'));
    const modes = parseModeList(options.modes || 'all');
    const outDir = ensureDir(options.out || defaultOutDir());
    console.log('Workspace mode');
    console.log(`  Model:      ${ws.modelFile}`);
    console.log(`  Validation: ${ws.validationFile}`);
    console.log(`  Web pending:${ws.webPendingDir}`);
    console.log(`  Output:     ${outDir}`);
    console.log('');
    const report = await runValidation({
      modelFile: ws.modelFile,
      validationFile: ws.validationFile,
      webReferenceDir: ws.webPendingDir,
      modes,
      outDir,
      archiveWeb: true
    });
    process.exitCode = report.overall === 'FAIL' ? 2 : 0;
  } else if (cmd === 'compare') {
    let acceptedFile = positional[1] || null;
    let candidateFile = positional[2] || null;
    let validationFile = positional[3] || null;
    if (!acceptedFile) acceptedFile = discoverSingleJson(path.resolve('reference', 'accepted', 'model'), 'accepted ModelJSON');
    if (!candidateFile || !validationFile) {
      const ws = discoverWorkspace(options.input || path.resolve('input'));
      if (!candidateFile) candidateFile = ws.modelFile;
      if (!validationFile) validationFile = ws.validationFile;
    }
    const modes = parseModeList(options.modes || 'all');
    const outDir = ensureDir(options.out || path.resolve('output', `compare-${new Date().toISOString().replace(/[:.]/g, '-')}`));
    const report = await compareModels({
      acceptedFile, candidateFile, validationFile, modes, outDir,
      absTolerance: options['abs-tolerance'] != null ? Number(options['abs-tolerance']) : 0,
      relTolerance: options['rel-tolerance'] != null ? Number(options['rel-tolerance']) : null,
      relFloor: options['rel-floor'] != null ? Number(options['rel-floor']) : 1e-12
    });
    process.exitCode = report.overall === 'COMPLETE' ? 0 : 2;
  } else if (cmd === 'policy') {
    let acceptedFile = positional[1] || null;
    let candidateFile = positional[2] || null;
    let validationFile = positional[3] || null;
    let policyFile = positional[4] || null;
    if (!acceptedFile) acceptedFile = discoverSingleJson(path.resolve('reference', 'accepted', 'model'), 'accepted ModelJSON');
    if (!candidateFile || !validationFile) {
      const ws = discoverWorkspace(options.input || path.resolve('input'));
      if (!candidateFile) candidateFile = ws.modelFile;
      if (!validationFile) validationFile = ws.validationFile;
    }
    if (!policyFile) policyFile = discoverSingleJson(path.resolve('input', 'policy'), 'change policy JSON');
    const modes = parseModeList(options.modes || 'all');
    const outDir = ensureDir(options.out || path.resolve('output', `policy-${new Date().toISOString().replace(/[:.]/g, '-')}`));
    const result = await runCandidatePolicyCheck({
      acceptedFile, candidateFile, validationFile, policyFile, modes, outDir,
      absTolerance: options['abs-tolerance'] != null ? Number(options['abs-tolerance']) : 0,
      relTolerance: options['rel-tolerance'] != null ? Number(options['rel-tolerance']) : null,
      relFloor: options['rel-floor'] != null ? Number(options['rel-floor']) : 1e-12
    });
    process.exitCode = result.policyResult.result === 'PASS' ? 0 : 2;
  } else if (cmd === 'evaluate-policy') {
    if (!positional[1]) throw new Error('Need a path to model-comparison.json');
    const comparisonFile = positional[1];
    const policyFile = positional[2] || discoverSingleJson(path.resolve('input', 'policy'), 'change policy JSON');
    const outDir = ensureDir(options.out || path.dirname(path.resolve(comparisonFile)));
    const result = evaluatePolicyFiles({ comparisonFile, policyFile, outDir });
    console.log(`POLICY RESULT: ${result.result}`);
    console.log(`Observed=${result.counts.observedEvents}, expected=${result.counts.expected}, unexpected=${result.counts.unexpected}, forbidden=${result.counts.forbidden}, threshold=${result.counts.thresholdExceeded}, requiredMissing=${result.counts.requiredMissing}`);
    console.log(`Report: ${path.join(outDir, 'change-policy.md')}`);
    process.exitCode = result.result === 'PASS' ? 0 : 2;
  } else if (cmd === 'conformance') {
    let modelFile = positional[1] || null;
    let validationFile = positional[2] || null;
    if (!modelFile || !validationFile) {
      const ws = discoverWorkspace(options.input || path.resolve('input'));
      if (!modelFile) modelFile = ws.modelFile;
      if (!validationFile) validationFile = ws.validationFile;
    }
    const outDir = ensureDir(options.out || path.resolve('output', `conformance-${new Date().toISOString().replace(/[:.]/g, '-')}`));
    const report = runConformanceCommand({ modelFile, validationFile, outDir });
    process.exitCode = report.status === 'PASS' ? 0 : 2;
  } else if (cmd === 'loops') {
    if (!positional[1]) throw new Error('Need a path to model.json');
    const modelFile = positional[1];
    const outDir = ensureDir(options.out || path.resolve('output', `loops-${new Date().toISOString().replace(/[:.]/g, '-')}`));
    const report = runLoopsCommand({ modelFile, outDir });
    process.exitCode = report.status === 'FAIL' ? 1 : 0;
  } else if (cmd === 'audit') {
    let modelFile = positional[1] || null;
    let validationFile = positional[2] || null;
    if (!modelFile || !validationFile) {
      const ws = discoverWorkspace(options.input || path.resolve('input'));
      if (!modelFile) modelFile = ws.modelFile;
      if (!validationFile) validationFile = ws.validationFile;
    }
    const outDir = ensureDir(options.out || path.resolve('output', `audit-${new Date().toISOString().replace(/[:.]/g, '-')}`));
    const report = runAuditCommand({ modelFile, validationFile, outDir });
    process.exitCode = report.status === 'PASS' ? 0 : 2;
  } else if (cmd === 'parameters') {
    let modelFile = positional[1] || null;
    if (!modelFile) modelFile = discoverWorkspace(options.input || path.resolve('input')).modelFile;
    const annotationsFile = options.annotations ? path.resolve(options.annotations) : null;
    const outDir = ensureDir(options.out || path.resolve('output', `parameters-${new Date().toISOString().replace(/[:.]/g, '-')}`));
    runParametersCommand({ modelFile, annotationsFile, outDir });
  } else if (cmd === 'series') {
    let modelFile = positional[1] || null;
    if (!modelFile) modelFile = discoverWorkspace(options.input || path.resolve('input')).modelFile;
    const modes = parseModeList(options.modes || 'all');
    const outDir = ensureDir(options.out || path.resolve('output', `series-${new Date().toISOString().replace(/[:.]/g, '-')}`));
    const dumpModes = new Set();
    if (options.dump != null) {
      const parsed = parseModeList(String(options.dump));
      if (parsed) for (const x of parsed) dumpModes.add(x);
    }
    await runSeriesCommand({ modelFile, modes, outDir, dumpModes, dumpPlanFile: options.plan || null });
  } else if (cmd === 'apply-patch') {
    if (!positional[1]) throw new Error('Need a path to patch.json');
    const patchFile = positional[1];
    const baseFile = positional[2] || discoverSingleJson(path.resolve('reference', 'accepted', 'model'), 'accepted ModelJSON');
    const outFile = options.out || path.resolve('output', `candidate-from-patch-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    const base = readJson(baseFile);
    const patch = readJson(patchFile);
    const { model, log } = applyPatch(base, patch, { baseSha256: sha256File(baseFile) });
    ensureDir(path.dirname(path.resolve(outFile)));
    writeJson(outFile, model);
    console.log(`Base:  ${baseFile}\n  SHA-256: ${sha256File(baseFile)}`);
    console.log(`Patch: ${patchFile}`);
    for (const line of log) console.log(`  ${line}`);
    console.log(`Candidate written: ${path.resolve(outFile)}\n  SHA-256: ${sha256File(outFile)}`);
    console.log(`Elements: ${model.elements.length}; scenarios: ${(model.scenarios || []).length}`);
  } else if (cmd === 'prepare-web') {
    const ws = discoverWorkspace(options.input || path.resolve('input'));
    const result = prepareWebBatch({
      modelFile: ws.modelFile,
      validationFile: ws.validationFile,
      pendingDir: ws.webPendingDir,
      force: !!options.force
    });
    console.log('[OK] Web reference batch prepared.');
    console.log(`Model: ${result.manifest.model.name}`);
    console.log(`SHA-256: ${result.manifest.model.sha256}`);
    console.log(`Expected Modes: ${result.manifest.expected_modes.join(', ')}`);
    console.log(`Copy fresh browser CSV files into:\n${result.dir}`);
    console.log('Then run RUN_LAB.cmd.');
  } else {
    usage();
    throw new Error(`Unknown command: ${cmd}`);
  }
} catch (e) {
  console.error('\nERROR:', e.message || e);
  process.exitCode = 2;
}
