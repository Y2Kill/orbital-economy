#!/usr/bin/env node
// Prototype expander for the `simple_capital` node type (task 016). NOT normative: it fixes the element set, formulas and
// validation fragments the bench implementation must reproduce, and it was run by the owner against the accepted model
// (regolith extraction as the fixture) before the task was issued.
//
//   node expand_simple_prototype.mjs <node.json> <base-model.json> [--out=<file>]
//
// A simple-capital node is capacity without the full lifecycle: one capacity stock that grows by physically backed
// expansion toward a desired level sized from a smoothed demand signal, and shrinks by depreciation and by slow
// retirement of capacity above the desired level. No activation, mothballing, strategic reserve or decommissioning.
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=') || null;
const [declFile, baseFile] = args.filter(a => !a.startsWith('--'));
const decl = JSON.parse(fs.readFileSync(declFile, 'utf8'));
const base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
if (decl.type !== 'simple_capital') throw new Error(`unsupported node type ${decl.type}`);

const baseEl = new Map(base.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));
const baseLinks = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
const P = decl.sector, SW = decl.switch;
const X_ = (s, X) => String(s).replaceAll('{C}', X);
const add = [], replace = [];
const V = (name, value) => add.push({ type: 'VARIABLE', name, behavior: { value } });
const S = (name, v) => add.push({ type: 'STOCK', name, behavior: { initial_value: v, non_negative: true } });
const F = (name, from, to, value) => add.push({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true } });
const mx = (a, b) => `((${a} - ${b}) + (((${a} - ${b}) ^ 2) ^ 0.5)) / 2`;       // max(a - b, 0), model idiom
const old = name => { const e = baseEl.get(name); if (!e) throw new Error(`base has no ${name}`); return e.behavior.value; };

V(SW, 1);
const sig = decl.sizing.signal;
if (sig.create) V(sig.adjustment_time.name, sig.adjustment_time.value);
for (const [k, v] of Object.entries(decl.parameters)) V(`${P} ${k}`, v);
for (const X of decl.colonies) {
  const p = `${X} ${P}`, signal = X_(sig.name, X);
  if (sig.create) {
    const demand = X_(sig.demand, X), adj = sig.adjustment_time.name;
    S(signal, sig.initial);
    F(`${signal} Increase`, null, signal, `IfThenElse([${demand}] > [${signal}], ([${demand}] - [${signal}]) / [${adj}], 0)`);
    F(`${signal} Decrease`, signal, null, `IfThenElse([${signal}] > [${demand}], ([${signal}] - [${demand}]) / [${adj}], 0)`);
  }
  S(`${p} Capacity`, decl.initial_capacity[X]);
  V(`${p} Desired Capacity`, `[${signal}] * [${P} Capacity Reserve Factor]`);
  V(`${p} Capacity Shortage`, mx(`[${p} Desired Capacity]`, `[${p} Capacity]`));
  V(`${p} Capacity Excess`, mx(`[${p} Capacity]`, `[${p} Desired Capacity]`));
  V(`${p} Desired Expansion`, `IfThenElse([${SW}] = 1, [${p} Capacity Shortage] / [${P} Construction Time], 0)`);
  const backing = decl.backing.map(b => ({ ...b, fulfillment: X_(b.fulfillment, X), inventory: X_(b.inventory, X), demand: X_(b.demand, X) }));
  F(`${p} Expansion`, null, `${p} Capacity`, `IfThenElse([${SW}] = 1, [${p} Desired Expansion] * Min(${backing.map(b => `[${b.fulfillment}]`).join(', ')}), 0)`);
  F(`${p} Capacity Depreciation`, `${p} Capacity`, null, `IfThenElse([${SW}] = 1, [${p} Capacity] * [${P} Depreciation Rate], 0)`);
  F(`${p} Capacity Retirement`, `${p} Capacity`, null, `IfThenElse([${SW}] = 1, [${p} Capacity Excess] / [${P} Retirement Time], 0)`);
  for (const b of backing)
    F(`${p} ${b.good} Consumption`, b.inventory, null, `IfThenElse([${SW}] = 1, [${p} Expansion] * [${P} ${b.good} per Capacity], 0)`);
  const cap = X_(decl.capacity_output.variable, X), baseRef = `[${X_(decl.capacity_output.replaces, X)}]`;
  const oc = old(cap); if (!oc.includes(baseRef)) throw new Error(`${cap} does not read ${baseRef}`);
  replace.push({ name: cap, value: `IfThenElse([${SW}] = 1, ${oc.replaceAll(baseRef, `[${p} Capacity]`)}, ${oc})` });
  for (const b of backing) {
    const od = old(b.demand);
    replace.push({ name: b.demand, value: `IfThenElse([${SW}] = 1, ${od} + [${p} Desired Expansion] * [${P} ${b.good} per Capacity], ${od})` });
  }
}
const names = new Set([...baseEl.keys(), ...add.map(a => a.name)]);
const links = [], seen = new Set(baseLinks);
for (const [tgt, val] of [...add.map(a => [a.name, a.behavior.value ?? a.behavior.initial_value]), ...replace.map(r => [r.name, r.value])])
  for (const r of [...new Set([...String(val).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))].sort()) {
    if (!names.has(r)) throw new Error(`${tgt} references unknown ${r}`);
    if (!seen.has(`${r}|${tgt}`)) { seen.add(`${r}|${tgt}`); links.push({ from: r, to: tgt }); }
  }
const ROLES = { capacity: 'Capacity', desired_capacity: 'Desired Capacity', shortage: 'Capacity Shortage', excess: 'Capacity Excess',
  desired_expansion: 'Desired Expansion', expansion: 'Expansion', depreciation: 'Capacity Depreciation', retirement: 'Capacity Retirement' };
const validation = {
  simple_capital_instances: decl.colonies.map(X => ({ name: `${X} ${P}`, sector: P, sizing_signal: X_(sig.name, X),
    roles: Object.fromEntries(Object.entries(ROLES).map(([r, s]) => [r, `${X} ${P} ${s}`])),
    consumption: decl.backing.map(b => `${X} ${P} ${b.good} Consumption`) })),
  capital_transformation_names: [`? ${P} Expansion`, ...decl.backing.map(b => `? ${P} ${b.good} Consumption`)],
  capital_retirement_names: [`? ${P} Capacity Depreciation`, `? ${P} Capacity Retirement`],
  transformation_pairs: decl.colonies.map(X => ({ source: `${X} ${P} Expansion`, sinks: decl.backing.map(b => `${X} ${P} ${b.good} Consumption`), identity: `${X} ${P} capital goods pair identity` })),
  planet_closure: { process: decl.planet_process, capacity: { kind: 'simple', stock: `{C} ${P} Capacity` } },
};
console.log(`expanded ${P}: elements ${add.length}, replacements ${replace.length}, links ${links.length}`);
if (opt('out')) fs.writeFileSync(opt('out'), JSON.stringify({ patch: { add_elements: add, replace_formulas: replace, add_links: links }, validation }, null, 2) + '\n');
