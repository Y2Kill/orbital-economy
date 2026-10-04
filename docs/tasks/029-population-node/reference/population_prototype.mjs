// Prototype of node type `population` (task 029 reference; not normative code). Planet v2, step 1.
// Population is accounted only: the economy drives births, deaths and migration; population does not drive the
// economy yet (no labor limit, demand stays the external P6 driver, wages fixed). No switch: no existing series
// changes. Living standard = weighted geometric mean of the declared living inputs (step 1: energy only).
// Usage: node population_prototype.mjs <base.json> <declaration.json> <validation.json> <out-model.json> <out-validation.json>
import fs from 'node:fs';

const [baseFile, declFile, valFile, outModel, outVal] = process.argv.slice(2);
const base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
const decl = JSON.parse(fs.readFileSync(declFile, 'utf8'));
const validation = JSON.parse(fs.readFileSync(valFile, 'utf8'));

const key = s => String(s).toLowerCase();
const X_ = (s, c) => String(s).replaceAll('{C}', c);
const model = structuredClone(base);
const byName = new Map(model.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [key(e.name), e]));
const links = new Set(model.elements.filter(e => e.type === 'LINK').map(e => `${key(e.from)}|${key(e.to)}`));
const added = [];
const need = (n, why) => { const e = byName.get(key(n)); if (!e) throw new Error(`${why}: missing ${n}`); return e; };
const add = el => {
  if (byName.has(key(el.name))) throw new Error(`conflict with base element "${el.name}"`);
  el.description = `Generated population element for ${el.name}.`;
  model.elements.push(el); byName.set(key(el.name), el); added.push(el);
};
const V = (name, value) => add({ type: 'VARIABLE', name, behavior: { value } });
const S = (name, initial) => add({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true } });
const F = (name, from, to, value) => add({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true } });

for (const [k, v] of Object.entries(decl.parameters)) V(k, v);
for (const l of decl.inputs.living) V(`Living ${l.name} Weight`, l.weight);
const C = decl.colonies;
const instances = [];
for (const X of C) {
  const pop = `${X} Population`;
  for (const n of [decl.inputs.wage, decl.inputs.labor_requirement, ...decl.inputs.prices.flatMap(p => [p.price, p.reference]), ...decl.inputs.living.map(l => l.column)]) need(X_(n, X), 'input');
  V(`${X} Population Initial`, decl.initial[X]);
  S(pop, `[${X} Population Initial]`);
  F(`${X} Births`, null, pop, `[${pop}] * [Population Birth Rate]`);
  F(`${X} Deaths`, pop, null, `[${pop}] * [Population Base Death Rate] * Max([${X} Living Standard], 0.05) ^ (-[Death Living Standard Sensitivity])`);
  V(`${X} Labor Force`, `[${pop}] * [Labor Participation Share]`);
  const req = X_(decl.inputs.labor_requirement, X);
  V(`${X} Employment`, `Min([${req}], [${X} Labor Force])`);
  V(`${X} Employment Rate`, `[${X} Employment] / ([${X} Labor Force] + 0.000001)`);
  V(`${X} Unemployment`, `Max([${X} Labor Force] - [${req}], 0)`);
  V(`${X} Labor Shortage`, `Max([${req}] - [${X} Labor Force], 0)`);
  V(`${X} Price Index`, '(' + decl.inputs.prices.map(p => `[${X_(p.price, X)}] / [${X_(p.reference, X)}]`).join(' + ') + `) / ${decl.inputs.prices.length}`);
  V(`${X} Real Wage`, `[${X_(decl.inputs.wage, X)}] / [${X} Price Index]`);
  V(`${X} Living Standard`, decl.inputs.living.map(l => `Max([${X_(l.column, X)}], 0.000001) ^ [Living ${l.name} Weight]`).join(' * '));
  V(`${X} Attractiveness`, `([${X} Real Wage] / [Reference Real Wage]) ^ [Attractiveness Wage Weight] * Max([${X} Employment Rate], 0.000001) ^ [Attractiveness Jobs Weight] * [${X} Living Standard] ^ [Attractiveness Living Weight]`);
  S(`${X} Perceived Attractiveness`, 1);
  F(`${X} Perceived Attractiveness Increase`, null, `${X} Perceived Attractiveness`, `Max([${X} Attractiveness] - [${X} Perceived Attractiveness], 0) / [Attractiveness Perception Time]`);
  F(`${X} Perceived Attractiveness Decrease`, `${X} Perceived Attractiveness`, null, `Max([${X} Perceived Attractiveness] - [${X} Attractiveness], 0) / [Attractiveness Perception Time]`);
}
// migration between every ordered pair of colonies (A/B: two flows)
const migrations = [];
for (const X of C) for (const Y of C) {
  if (X === Y) continue;
  const gap = `Attractiveness Gap ${X} to ${Y}`;
  V(gap, `([${Y} Perceived Attractiveness] - [${X} Perceived Attractiveness]) / Max(Max([${X} Perceived Attractiveness], [${Y} Perceived Attractiveness]), 0.000001)`);
  F(`Migration ${X} to ${Y}`, `${X} Population`, `${Y} Population`, `[${X} Population] * [Migration Max Rate] * Min(Max([${gap}], 0) * [Migration Gap Sensitivity], 1)`);
  migrations.push({ from: X, to: Y, flow: `Migration ${X} to ${Y}` });
}
V('Planet Population', C.map(X => `[${X} Population]`).join(' + '));

const refs = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
const addLink = (from, to) => { const k = `${key(from)}|${key(to)}`; if (links.has(k)) return; links.add(k); model.elements.push({ type: 'LINK', from: need(from, 'link').name, to }); };
for (const e of added) for (const r of refs(e.behavior.value ?? e.behavior.initial_value)) addLink(r, e.name);

// validation fragments: population plugin (balance), information_signal names, new boundary category
for (const X of C) instances.push({
  name: `${X} population`, colony: X, population: `${X} Population`, births: `${X} Births`, deaths: `${X} Deaths`,
  immigration: migrations.filter(m => m.to === X).map(m => m.flow), emigration: migrations.filter(m => m.from === X).map(m => m.flow),
  labor_force: `${X} Labor Force`, employment: `${X} Employment`, labor_requirement: X_(decl.inputs.labor_requirement, X), participation: 'Labor Participation Share'
});
const v = structuredClone(validation);
v.plugins.push({ type: 'population', abs_tol: 1e-9, instances });
const ob = v.plugins.find(p => p.type === 'open_boundaries');
const info = ob.categories.find(c => c.id === 'information_signal');
info.name = [...info.name, '? Perceived Attractiveness Increase', '? Perceived Attractiveness Decrease'];
ob.categories.push({ id: 'demography_births', closed_world: true, direction: 'source', name: ['? Births'], reason: 'people enter the model by birth (Planet v2 population)' });
ob.categories.push({ id: 'demography_deaths', closed_world: true, direction: 'sink', name: ['? Deaths'], reason: 'people leave the model by death (Planet v2 population)' });
fs.writeFileSync(outModel, JSON.stringify(model));
fs.writeFileSync(outVal, JSON.stringify(v, null, 2) + '\n');
console.log(`added ${added.length} elements, links ${model.elements.filter(e => e.type === 'LINK').length - base.elements.filter(e => e.type === 'LINK').length}, migration flows ${migrations.length}`);
