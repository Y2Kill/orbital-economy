import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadModelJSON, ENGINE_VERSION } from './engine.js';
import { listScenarios, modelJsonForScenario, valuedPrimitives } from './model.js';
import { ensureDir, readJson, repoPath, sha256File, writeJson } from './util.js';

export const SERIES_FORMAT = 'orbital-economy-series-digest-v1';

export function float64BytesLE(values) {
  const out = Buffer.alloc(values.length * 8);
  for (let i = 0; i < values.length; i++) out.writeDoubleLE(Number(values[i]), i * 8);
  return out;
}
export function hashFloat64LE(values) {
  return crypto.createHash('sha256').update(float64BytesLE(values)).digest('hex');
}
export function doubleHex(value) {
  const b = Buffer.alloc(8);
  b.writeDoubleBE(Number(value), 0);
  return b.toString('hex');
}
function hashMode(timeHash, series) {
  const h = crypto.createHash('sha256');
  h.update('time\0'); h.update(timeHash); h.update('\n');
  for (const name of Object.keys(series).sort()) {
    h.update(name, 'utf8'); h.update('\0'); h.update(series[name]); h.update('\n');
  }
  return h.digest('hex');
}
function normalizePlan(plan) {
  if (!plan) return null;
  const src = plan.modes || plan;
  const out = new Map();
  for (const [mode, names] of Object.entries(src)) {
    if (!Array.isArray(names)) throw new Error(`series dump plan for Mode ${mode} must be an array`);
    out.set(Number(mode), new Set(names.map(String)));
  }
  return out;
}
function dumpObject(mode, scenario, times, selected) {
  const series = {};
  for (const [name, values] of selected) series[name] = values.map(doubleHex);
  return { format:'orbital-economy-series-dump-v1', mode, scenario, count:times.length, time_hex:times.map(doubleHex), series };
}
export async function runSeriesCommand({ modelFile, modes=null, outDir, dumpModes=new Set(), dumpPlanFile=null }) {
  const raw = readJson(modelFile);
  const scenarios = listScenarios(raw, 'Timed Test Mode').filter(s => !modes || modes.has(s.mode));
  if (!scenarios.length) throw new Error('No scenarios selected.');
  const plan = dumpPlanFile ? normalizePlan(readJson(dumpPlanFile)) : null;
  const result = {
    format: SERIES_FORMAT,
    engine: { package:'simulation', version:ENGINE_VERSION },
    model: { file:repoPath(modelFile), sha256:sha256File(modelFile), name:raw.name || null },
    modes: {}
  };
  ensureDir(outDir);
  for (const s of scenarios) {
    const model = loadModelJSON(modelJsonForScenario(raw, s));
    const errors = model.check();
    if (errors.length) throw new Error(`Mode ${s.mode}: model.check() returned ${errors.length}`);
    const sim = model.simulate();
    const times = Array.from(sim.times(), Number);
    const primitives = valuedPrimitives(model).filter(p=>p?.name).sort((a,b)=>a.name.localeCompare(b.name));
    const hashes = {};
    const valuesByName = new Map();
    for (const p of primitives) {
      const values = Array.from(sim.series(p), Number);
      hashes[p.name] = hashFloat64LE(values);
      if (dumpModes.has(s.mode) || plan?.has(s.mode)) valuesByName.set(p.name, values);
    }
    const timeHash = hashFloat64LE(times);
    result.modes[String(s.mode)] = { scenario:s.name, points:times.length, time_sha256:timeHash, series:hashes, mode_sha256:hashMode(timeHash, hashes) };
    if (dumpModes.has(s.mode)) writeJson(path.join(outDir,`mode-${s.mode}-dump.json`), dumpObject(s.mode,s.name,times,[...valuesByName]));
    if (plan?.has(s.mode)) {
      const wanted=plan.get(s.mode);
      const selected=[...valuesByName].filter(([name])=>wanted.has(name));
      const missing=[...wanted].filter(name=>!valuesByName.has(name));
      if(missing.length) throw new Error(`Mode ${s.mode}: dump plan names not found: ${missing.join(', ')}`);
      writeJson(path.join(outDir,`mode-${s.mode}-targeted.json`), dumpObject(s.mode,s.name,times,selected));
    }
    console.log(`Mode ${s.mode}: ${Object.keys(hashes).length} series, ${times.length} points, ${result.modes[String(s.mode)].mode_sha256}`);
    if(global.gc) global.gc();
  }
  const output=path.join(outDir,'series-digest.json');
  writeJson(output,result);
  console.log(`Series digest: ${output}`);
  return result;
}
