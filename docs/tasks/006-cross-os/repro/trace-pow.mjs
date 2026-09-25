#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { discoverWorkspace } from '../../../../lab/src/workspace.js';
import { readJson } from '../../../../lab/src/util.js';
import { listScenarios, modelJsonForScenario } from '../../../../lab/src/model.js';
import { loadModelJSON } from '../../../../lab/src/engine.js';

const mode = Number(process.argv[2] ?? 0);
const out = process.argv[3] || 'pow-trace.json';
const limit = Number(process.argv[4] ?? 500000);

const hex = value => {
  const b = Buffer.allocUnsafe(8);
  b.writeDoubleBE(Number(value), 0);
  return b.toString('hex');
};

const originalPow = Math.pow;
const calls = [];
Math.pow = function tracedPow(base, exponent) {
  const result = originalPow(base, exponent);
  if (calls.length < limit) {
    calls.push([hex(base), hex(exponent), hex(result)]);
  }
  return result;
};

try {
  const ws = discoverWorkspace(path.resolve('lab/input'));
  const raw = readJson(ws.modelFile);
  const scenario = listScenarios(raw, 'Timed Test Mode').find(s => s.mode === mode);
  if (!scenario) throw new Error(`Mode ${mode} not found`);
  const model = loadModelJSON(modelJsonForScenario(raw, scenario));
  const errors = model.check();
  if (errors.length) throw new Error(`model.check failed: ${errors.length}`);
  model.simulate();
} finally {
  Math.pow = originalPow;
}

fs.writeFileSync(out, JSON.stringify({ format:'orbital-economy-pow-trace-v1', mode, calls }));
console.log(`Mode ${mode}: captured ${calls.length} Math.pow calls -> ${out}`);
