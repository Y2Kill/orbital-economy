// Runtime check of the task-046 anchor on one Mode: the money balance minus Money Issued Total is conserved, the
// income identity still holds (issuance enters only the income flow), and the anchor actually issues money.
// Usage: node runtime_anchor.mjs <lab dir> <model.json> <mode>   — prints one JSON line
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [labDir, modelFile, modeArg] = process.argv.slice(2);
const { loadModelJSON } = await import(pathToFileURL(path.join(labDir, 'src', 'engine.js')));
const { listScenarios, modelJsonForScenario } = await import(pathToFileURL(path.join(labDir, 'src', 'model.js')));
const raw = JSON.parse(fs.readFileSync(modelFile, 'utf8'));
const mode = Number(modeArg);
const sc = listScenarios(raw).find(s => s.mode === mode);
const m = loadModelJSON(modelJsonForScenario(raw, sc)), r = m.simulate();
const byName = new Map(m.find().filter(p => p?.name).map(p => [p.name, p]));
const s = n => r.series(byName.get(n)).map(Number);
const C = ['A', 'B'], t = r.times();
const stocks = [...C.flatMap(X => [s(`${X} Household Money`), s(`${X} Firm Money`)]), s('Transport Money')];
const issued = s('Money Issued Total');
const total = i => stocks.reduce((a, v) => a + v[i], 0);
let drift = 0, identity = 0;
for (let i = 0; i < t.length; i++) drift = Math.max(drift, Math.abs(total(i) - issued[i] - total(0)));
for (const X of C) {
  const inc = s(`${X} Household Income`), parts = ['Wage Bill', 'Rent Payments', 'Dividends', 'Transport Income'].map(n => s(`${X} ${n}`));
  for (let i = 0; i < t.length; i++) identity = Math.max(identity, Math.abs(inc[i] - parts.reduce((a, v) => a + v[i], 0)) / Math.max(1, Math.abs(inc[i])));
}
const gap = s('Union Price Gap');
console.log(JSON.stringify({ mode, days: t.at(-1), money: s('Money Enabled')[0], start: total(0), end: total(t.length - 1),
  issuedEnd: issued.at(-1), relDriftOfMoneyMinusIssued: drift / Math.max(1, Math.abs(total(0))), incomeIdentityMaxRel: identity,
  gapMin: Math.min(...gap), gapMax: Math.max(...gap) }));
