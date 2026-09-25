import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse';
import { readJson, sha256File } from './util.js';

export async function detectModeFromCsv(file, modeColumn = 'Timed Test Mode') {
  const parser = fs.createReadStream(file).pipe(parse({ bom: true, relax_quotes: true }));
  let header = null;
  try {
    for await (const rec of parser) {
      if (!header) { header = rec; continue; }
      const i = header.indexOf(modeColumn);
      if (i < 0) return { mode: null, error: `Column "${modeColumn}" not found` };
      const v = Number(rec[i]);
      return Number.isFinite(v) ? { mode: v, error: null } : { mode: null, error: `Non-numeric ${modeColumn}: ${rec[i]}` };
    }
  } finally {
    parser.destroy();
  }
  return { mode: null, error: 'CSV contains no data rows' };
}

export async function inspectWebReferenceBatch({ referenceDir, currentModelFile, currentValidationFile, modeColumn = 'Timed Test Mode' }) {
  const result = {
    status: 'SKIPPED',
    present: false,
    referenceDir: path.resolve(referenceDir),
    manifest: null,
    files: [],
    byMode: new Map(),
    errors: [],
    warnings: [],
    missingModes: [],
    extraModes: []
  };
  if (!fs.existsSync(referenceDir)) return result;
  const csvNames = fs.readdirSync(referenceDir).filter(n => n.toLowerCase().endsWith('.csv'));
  if (!csvNames.length) return result;
  result.present = true;

  const manifestFile = path.join(referenceDir, 'web_batch_manifest.json');
  if (!fs.existsSync(manifestFile)) {
    result.errors.push('web_batch_manifest.json is missing. Use PREPARE_WEB_CHECK.cmd before collecting browser CSV files so the model ownership is explicit.');
  } else {
    try {
      result.manifest = readJson(manifestFile);
      const expectedModelSha = result.manifest?.model?.sha256;
      const actualModelSha = sha256File(currentModelFile);
      if (!expectedModelSha) result.errors.push('Manifest does not contain model.sha256.');
      else if (expectedModelSha !== actualModelSha) result.errors.push(`Web batch belongs to another model: manifest SHA-256=${expectedModelSha}, active model SHA-256=${actualModelSha}.`);
      if (currentValidationFile && result.manifest?.validation?.sha256) {
        const actualValidationSha = sha256File(currentValidationFile);
        if (result.manifest.validation.sha256 !== actualValidationSha) {
          result.warnings.push(`Validation file differs from the one used to prepare the web batch: manifest=${result.manifest.validation.sha256}, active=${actualValidationSha}.`);
        }
      }
    } catch (e) {
      result.errors.push(`Cannot read web_batch_manifest.json: ${e.message || e}`);
    }
  }

  const seen = new Map();
  for (const name of csvNames) {
    const file = path.join(referenceDir, name);
    try {
      const detected = await detectModeFromCsv(file, modeColumn);
      const entry = { file, name, mode: detected.mode, error: detected.error, sha256: sha256File(file) };
      result.files.push(entry);
      if (detected.mode == null) {
        result.errors.push(`${name}: cannot determine Mode (${detected.error}).`);
        continue;
      }
      if (seen.has(detected.mode)) {
        result.errors.push(`Duplicate web result for Mode ${detected.mode}: ${seen.get(detected.mode).name} and ${name}.`);
        continue;
      }
      seen.set(detected.mode, entry);
      result.byMode.set(detected.mode, file);
    } catch (e) {
      result.files.push({ file, name, mode: null, error: e.message || String(e) });
      result.errors.push(`${name}: ${e.message || e}`);
    }
  }

  const expectedModes = Array.isArray(result.manifest?.expected_modes)
    ? [...result.manifest.expected_modes].map(Number).filter(Number.isFinite).sort((a,b)=>a-b)
    : null;
  if (expectedModes) {
    const found = new Set(result.byMode.keys());
    result.missingModes = expectedModes.filter(m => !found.has(m));
    const expected = new Set(expectedModes);
    result.extraModes = [...found].filter(m => !expected.has(m)).sort((a,b)=>a-b);
    if (result.missingModes.length) result.errors.push(`Missing expected web Modes: ${result.missingModes.join(', ')}.`);
    if (result.extraModes.length) result.errors.push(`Unexpected web Modes: ${result.extraModes.join(', ')}.`);
  }

  result.status = result.errors.length ? 'FAIL' : result.warnings.length ? 'WARN' : 'PASS';
  return result;
}

function relDiff(actual, expected, floor = 1e-12) {
  const denom = Math.max(Math.abs(actual), Math.abs(expected), floor);
  return Math.abs(actual - expected) / denom;
}

export async function compareResultsToCsv({ model, results, csvFile, absTolerance = 0, relTolerance = null, relFloor = 1e-12 }) {
  const primitiveMap = new Map();
  for (const p of model.find()) {
    if (!p?.name || p.constructor?.name === 'Link') continue;
    primitiveMap.set(p.name, p);
  }
  const times = results.times();
  let headers = null;
  let current = null;
  let row = 0;
  let maxAbs = 0;
  let maxAbsWhere = null;
  let maxRel = 0;
  let maxRelWhere = null;
  let changedPoints = 0;
  let changedSeries = new Map();
  const webOnlyColumns = [];
  let columnsCompared = 0;
  let exactTime = true;
  let maxTimeAbs = 0;

  const parser = fs.createReadStream(csvFile).pipe(parse({ bom: true, relax_quotes: true }));
  for await (const rec of parser) {
    if (!headers) {
      headers = rec;
      if (!headers.includes('Time')) return { status: 'FAIL', message: 'Web CSV has no Time column' };
      current = headers.map(h => {
        if (h === 'Time') return { type: 'time', data: times };
        const p = primitiveMap.get(h);
        if (!p) { webOnlyColumns.push(h); return null; }
        let series;
        try { series = results.series(p); } catch { webOnlyColumns.push(h); return null; }
        columnsCompared++;
        return { type: 'series', data: series };
      });
      continue;
    }
    if (row >= times.length) return { status: 'FAIL', message: 'Web reference has more rows than local result', rowsCompared: row, webOnlyColumns };
    for (let c = 0; c < headers.length; c++) {
      const holder = current[c];
      if (!holder) continue;
      const expected = Number(rec[c]);
      if (!Number.isFinite(expected)) continue;
      const actual = holder.data[row];
      if (holder.type === 'time') {
        if (typeof actual !== 'number' || !Number.isFinite(actual)) continue;
        const d = Math.abs(actual - expected);
        if (d !== 0) exactTime = false;
        if (d > maxTimeAbs) maxTimeAbs = d;
        continue;
      }
      if (typeof actual !== 'number' || !Number.isFinite(actual)) continue;
      const d = Math.abs(actual - expected);
      const rd = relDiff(actual, expected, relFloor);
      if (d > maxAbs) { maxAbs = d; maxAbsWhere = { row, time: times[row], column: headers[c], actual, expected }; }
      if (rd > maxRel) { maxRel = rd; maxRelWhere = { row, time: times[row], column: headers[c], actual, expected }; }
      if (d > absTolerance && (relTolerance == null || rd > relTolerance)) {
        changedPoints++;
        const prev = changedSeries.get(headers[c]);
        if (!prev || d > prev.maxAbs) changedSeries.set(headers[c], { column: headers[c], maxAbs: d, maxRel: rd, time: times[row], actual, expected });
      }
    }
    row++;
  }

  if (row !== times.length) return { status: 'FAIL', message: `Row count differs: web ${row}, local ${times.length}`, rowsCompared: row, webOnlyColumns };
  const localOnlyColumns = [...primitiveMap.keys()].filter(n => !headers.includes(n)).sort();
  const changed = [...changedSeries.values()].sort((a,b) => b.maxAbs - a.maxAbs);
  const numericPass = maxAbs <= absTolerance || (relTolerance != null && maxRel <= relTolerance);
  const status = numericPass && exactTime && webOnlyColumns.length === 0 ? 'PASS' : 'FAIL';
  let message = null;
  if (!exactTime) message = `Time axis differs (max abs time diff ${maxTimeAbs})`;
  else if (webOnlyColumns.length) message = `Web CSV contains ${webOnlyColumns.length} column(s) not available locally`;
  else if (!numericPass) message = `max abs diff ${maxAbs} > ${absTolerance}${relTolerance != null ? ` and max rel diff ${maxRel} > ${relTolerance}` : ''}`;

  return {
    status,
    message,
    file: path.resolve(csvFile),
    rowsCompared: row,
    columnsCompared,
    webColumnCount: headers.length - 1,
    localSeriesCount: primitiveMap.size,
    localOnlyColumns,
    webOnlyColumns,
    exactTime,
    maxTimeAbs,
    maxAbs,
    maxAbsWhere,
    maxRel,
    maxRelWhere,
    changedPoints,
    changedSeriesCount: changed.length,
    changedSeries: changed.slice(0, 50)
  };
}
