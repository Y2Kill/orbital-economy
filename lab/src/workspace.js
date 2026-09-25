import fs from 'node:fs';
import path from 'node:path';
import { readJson, sha256File, writeJson, ensureDir, nowIso } from './util.js';
import { listScenarios } from './model.js';

function jsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.json'))
    .map(e => path.join(dir, e.name));
}


export function discoverSingleJson(dir, label = 'JSON file') {
  const files = jsonFiles(path.resolve(dir));
  if (files.length === 0) throw new Error(`No ${label} found in ${path.resolve(dir)}`);
  if (files.length > 1) throw new Error(`Multiple JSON files found in ${path.resolve(dir)}. Keep exactly one active ${label} there.`);
  return files[0];
}
export function discoverWorkspace(inputDir) {
  const root = path.resolve(inputDir);
  const modelDir = path.join(root, 'model');
  const validationDir = path.join(root, 'validation');
  const webPendingDir = path.join(root, 'web_reference', 'pending');

  const models = jsonFiles(modelDir);
  if (models.length === 0) throw new Error(`No ModelJSON file found in ${modelDir}`);
  if (models.length > 1) throw new Error(`Multiple JSON files found in ${modelDir}. Keep exactly one active ModelJSON there.`);

  const validations = jsonFiles(validationDir);
  if (validations.length === 0) throw new Error(`No validation JSON found in ${validationDir}`);
  if (validations.length > 1) throw new Error(`Multiple JSON files found in ${validationDir}. Keep exactly one active validation file there.`);

  return {
    root,
    modelFile: models[0],
    validationFile: validations[0],
    webPendingDir
  };
}

export function prepareWebBatch({ modelFile, validationFile, pendingDir, force = false }) {
  const dir = path.resolve(pendingDir);
  ensureDir(dir);
  const existingCsv = fs.readdirSync(dir).filter(n => n.toLowerCase().endsWith('.csv'));
  if (existingCsv.length && !force) {
    throw new Error(`Pending web-reference folder already contains ${existingCsv.length} CSV file(s). Run the current batch first or archive/remove them before preparing another batch.`);
  }
  if (force) {
    for (const n of fs.readdirSync(dir)) {
      const p = path.join(dir, n);
      if (fs.statSync(p).isFile()) fs.rmSync(p, { force: true });
    }
  }

  const modelRaw = readJson(modelFile);
  const validationRaw = readJson(validationFile);
  const modeVariable = validationRaw.mode_variable || 'Timed Test Mode';
  const scenarios = listScenarios(modelRaw, modeVariable);
  const expectedModes = scenarios.map(s => s.mode).sort((a,b) => a-b);
  const modelSha = sha256File(modelFile);
  const validationSha = sha256File(validationFile);

  fs.copyFileSync(modelFile, path.join(dir, 'source_model.json'));
  fs.copyFileSync(validationFile, path.join(dir, 'source_validation.json'));
  const manifest = {
    format: 'orbital-economy-web-reference-batch-v1',
    created: nowIso(),
    model: {
      name: modelRaw.name || path.basename(modelFile),
      sha256: modelSha,
      source_filename: path.basename(modelFile),
      simulation: modelRaw.simulation || null
    },
    validation: {
      name: validationRaw.name || path.basename(validationFile),
      sha256: validationSha,
      source_filename: path.basename(validationFile)
    },
    mode_variable: modeVariable,
    expected_modes: expectedModes,
    engine: {
      package: 'simulation',
      version: '9.0.0'
    },
    note: 'Copy fresh browser-export CSV files for this exact model into this folder, then run RUN_LAB.cmd.'
  };
  writeJson(path.join(dir, 'web_batch_manifest.json'), manifest);
  fs.writeFileSync(path.join(dir, 'PUT_WEB_CSV_HERE.txt'), [
    'Copy fresh browser EXPORT RESULTS*.csv files here.',
    'Filenames do not matter: Orbital Economy Lab detects Mode from the "Timed Test Mode" column.',
    'Do not mix exports from another model in this batch.',
    'When RUN_LAB.cmd processes a batch with CSV files, the batch is archived under that run in output/.',
    ''
  ].join('\r\n'), 'utf8');
  return { dir, manifest };
}

export function webBatchHasCsv(pendingDir) {
  if (!fs.existsSync(pendingDir)) return false;
  return fs.readdirSync(pendingDir).some(n => n.toLowerCase().endsWith('.csv'));
}

function copyRecursive(src, dst) {
  ensureDir(dst);
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyRecursive(s, d);
    else if (ent.isFile()) fs.copyFileSync(s, d);
  }
}

export function archiveProcessedWebBatch({ pendingDir, outDir }) {
  if (!webBatchHasCsv(pendingDir)) return null;
  const dst = path.join(outDir, 'web_reference');
  if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
  ensureDir(path.dirname(dst));
  try {
    // Fast path: input/ and output/ normally live on the same drive.
    fs.renameSync(pendingDir, dst);
  } catch (e) {
    // Fallback for a custom output directory on another volume.
    copyRecursive(pendingDir, dst);
    fs.rmSync(pendingDir, { recursive: true, force: true });
  }
  ensureDir(pendingDir);
  fs.writeFileSync(path.join(pendingDir, 'README.txt'), [
    'No pending web-reference batch.',
    'Run PREPARE_WEB_CHECK.cmd before creating the next browser cross-check batch.',
    ''
  ].join('\r\n'), 'utf8');
  return dst;
}
