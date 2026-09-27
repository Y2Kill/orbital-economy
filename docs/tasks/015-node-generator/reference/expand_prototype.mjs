#!/usr/bin/env node
// Prototype node expander (task 015). NOT normative: it produced the reference result in TASK_RU.md.
// Expands a `capital_lifecycle` node declaration against a base model into a model-patch fragment
// (add_elements, replace_formulas, add_links) and validation fragments (kernel instance, boundary names, pairs,
// planet_closure capacity), then — with --compare — checks the result against an accepted model.
//
//   node expand_prototype.mjs <node.json> <base-model.json> [--compare=<accepted-model.json>] [--compare-validation=<accepted-validation.json>]
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=') || null;
const [declFile, baseFile] = args.filter(a => !a.startsWith('--'));
const decl = JSON.parse(fs.readFileSync(declFile, 'utf8'));
const base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
if (decl.type !== 'capital_lifecycle') throw new Error(`unsupported node type ${decl.type}`);

const baseEl = new Map(base.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));
const baseLinks = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
const P = decl.sector, SW = decl.switch;
const X_ = (s, X) => String(s).replaceAll('{C}', X);
const add = [], replace = [];
const V = (name, value) => add.push({ type: 'VARIABLE', name, behavior: { value } });
const S = (name, v) => add.push({ type: 'STOCK', name, behavior: { initial_value: v, non_negative: true } });
const F = (name, from, to, value) => add.push({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true } });
const mx = (a, b) => `((${a} - ${b}) + (((${a} - ${b}) ^ 2) ^ 0.5)) / 2`;
const mn = (a, b) => `((${a}) + (${b}) - ((((${a}) - (${b})) ^ 2) ^ 0.5)) / 2`;
const old = name => { const e = baseEl.get(name); if (!e) throw new Error(`base has no ${name}`); return e.behavior.value; };

V(SW, 1);
const sig = decl.sizing.signal;
if (sig.create) V(sig.adjustment_time.name, sig.adjustment_time.value);
for (const [k, v] of Object.entries(decl.parameters)) V(`${P} ${k}`, v);
for (const X of decl.colonies) {
  const p = `${X} ${P}`;
  const signal = X_(sig.name, X);
  if (sig.create) {
    const demand = X_(sig.demand, X), adj = sig.adjustment_time.name;
    S(signal, sig.initial);
    F(`${signal} Increase`, null, signal, `IfThenElse([${demand}] > [${signal}], ([${demand}] - [${signal}]) / [${adj}], 0)`);
    F(`${signal} Decrease`, signal, null, `IfThenElse([${signal}] > [${demand}], ([${signal}] - [${demand}]) / [${adj}], 0)`);
  }
  S(`${p} Installed Capacity`, decl.initial_capacity[X]); S(`${p} Active Capacity`, decl.initial_capacity[X]);
  S(`${p} Decommissioning Capacity`, 0); S(`${p} Retired Capacity`, 0);
  V(`${p} Required Active Capacity`, `[${signal}] * [${P} Operating Reserve Factor]`);
  V(`${p} Desired Installed Capacity`, `[${p} Required Active Capacity] * [${P} Installed Reserve Factor]`);
  V(`${p} Inactive Capacity`, mx(`[${p} Installed Capacity]`, `[${p} Active Capacity]`));
  V(`${p} Target Active Capacity`, mn(`[${p} Required Active Capacity]`, `[${p} Installed Capacity]`));
  V(`${p} Activation Gap`, mx(`[${p} Target Active Capacity]`, `[${p} Active Capacity]`));
  V(`${p} Mothball Gap`, mx(`[${p} Active Capacity]`, `[${p} Target Active Capacity]`));
  V(`${p} Installed Capacity Shortage`, mx(`[${p} Desired Installed Capacity]`, `[${p} Installed Capacity]`));
  V(`${p} Installed Capacity Excess`, mx(`[${p} Installed Capacity]`, `[${p} Desired Installed Capacity]`));
  V(`${p} Gap Limited Construction`, `[${p} Installed Capacity Shortage] / [${P} Construction Time]`);
  V(`${p} Desired Expansion`, `IfThenElse([${SW}] = 1, [${p} Gap Limited Construction], 0)`);
  V(`${p} Activation Queue Capacity`, mn(`[${p} Inactive Capacity]`, `[${p} Activation Gap]`));
  V(`${p} Strategic Reserve Target`, mx(`[${p} Desired Installed Capacity]`, `[${p} Required Active Capacity]`));
  V(`${p} Inactive After Activation Queue`, mx(`[${p} Inactive Capacity]`, `[${p} Activation Queue Capacity]`));
  V(`${p} Strategic Reserve Capacity`, mn(`[${p} Inactive After Activation Queue]`, `[${p} Strategic Reserve Target]`));
  V(`${p} Surplus Capacity`, mx(`[${p} Inactive After Activation Queue]`, `[${p} Strategic Reserve Capacity]`));
  V(`${p} Lifetime Capacity Account`, `[${p} Installed Capacity] + [${p} Decommissioning Capacity] + [${p} Retired Capacity]`);
  const backing = decl.backing.map(b => ({ ...b, fulfillment: X_(b.fulfillment, X), inventory: X_(b.inventory, X), demand: X_(b.demand, X) }));
  F(`${p} Expansion`, null, `${p} Installed Capacity`,
    `IfThenElse([${SW}] = 1, [${p} Gap Limited Construction] * Min(${backing.map(b => `[${b.fulfillment}]`).join(', ')}), 0)`);
  F(`${p} Activation`, null, `${p} Active Capacity`, `[${p} Activation Gap] / [${P} Activation Time]`);
  F(`${p} Mothballing`, `${p} Active Capacity`, null, `[${p} Mothball Gap] / [${P} Mothball Time]`);
  F(`${p} Active Depreciation`, `${p} Active Capacity`, null, `[${p} Active Capacity] * [${P} Depreciation Rate]`);
  F(`${p} Decommissioning Initiation`, `${p} Installed Capacity`, `${p} Decommissioning Capacity`, `[${p} Surplus Capacity] / [${P} Surplus Disposal Decision Time]`);
  F(`${p} Depreciation`, `${p} Installed Capacity`, `${p} Retired Capacity`, `[${p} Installed Capacity] * [${P} Depreciation Rate]`);
  F(`${p} Dismantling Completion`, `${p} Decommissioning Capacity`, `${p} Retired Capacity`, `[${p} Decommissioning Capacity] / [${P} Decommissioning Time]`);
  for (const b of backing)
    F(`${p} ${b.good} Consumption`, b.inventory, null, `IfThenElse([${SW}] = 1, [${p} Expansion] * [${P} ${b.good} per Capacity], 0)`);
  // existing formulas, old branch verbatim
  const cap = X_(decl.capacity_output.variable, X), baseRef = `[${X_(decl.capacity_output.replaces, X)}]`;
  const oc = old(cap); if (oc.split(baseRef).length - 1 < 1) throw new Error(`${cap} does not read ${baseRef}`);
  replace.push({ name: cap, value: `IfThenElse([${SW}] = 1, ${oc.replaceAll(baseRef, `[${p} Active Capacity]`)}, ${oc})` });
  for (const b of backing) {
    const od = old(b.demand);
    replace.push({ name: b.demand, value: `IfThenElse([${SW}] = 1, ${od} + [${p} Desired Expansion] * [${P} ${b.good} per Capacity], ${od})` });
  }
}
// links: every reference in a new or replaced formula that the base does not already link
const names = new Set([...baseEl.keys(), ...add.map(a => a.name)]);
const links = [], seen = new Set(baseLinks);
for (const [tgt, val] of [...add.map(a => [a.name, a.behavior.value ?? a.behavior.initial_value]), ...replace.map(r => [r.name, r.value])])
  for (const r of [...new Set([...String(val).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))].sort()) {
    if (!names.has(r)) throw new Error(`${tgt} references unknown ${r}`);
    if (!seen.has(`${r}|${tgt}`)) { seen.add(`${r}|${tgt}`); links.push({ from: r, to: tgt }); }
  }

// validation fragments
const ROLES = { installed: 'Installed Capacity', active: 'Active Capacity', inactive: 'Inactive Capacity', decommissioning: 'Decommissioning Capacity', retired: 'Retired Capacity',
  lifetime: 'Lifetime Capacity Account', required_active: 'Required Active Capacity', target_active: 'Target Active Capacity', desired_installed: 'Desired Installed Capacity',
  activation_gap: 'Activation Gap', mothball_gap: 'Mothball Gap', installed_shortage: 'Installed Capacity Shortage', installed_excess: 'Installed Capacity Excess',
  gap_limited_construction: 'Gap Limited Construction', activation_queue: 'Activation Queue Capacity', inactive_after_activation_queue: 'Inactive After Activation Queue',
  strategic_reserve_target: 'Strategic Reserve Target', strategic_reserve: 'Strategic Reserve Capacity', surplus: 'Surplus Capacity', activation: 'Activation',
  mothballing: 'Mothballing', active_depreciation: 'Active Depreciation', expansion: 'Expansion', decommissioning_initiation: 'Decommissioning Initiation',
  installed_depreciation: 'Depreciation', dismantling_completion: 'Dismantling Completion', desired_expansion: 'Desired Expansion', capital_goods_consumption: 'Capital Goods Consumption' };
const validation = {
  kernel_instances: decl.colonies.map(X => ({ name: `${X} ${P}`, sector: P, switch_gated: false,
    roles: Object.fromEntries(Object.entries(ROLES).map(([r, s]) => [r, `${X} ${P} ${s}`])), kernel_version: 2 })),
  capital_transformation_names: [`? ${P} Expansion`, ...decl.backing.map(b => `? ${P} ${b.good} Consumption`)],
  transformation_pairs: decl.colonies.map(X => ({ source: `${X} ${P} Expansion`, sinks: decl.backing.map(b => `${X} ${P} ${b.good} Consumption`), identity: `${X} ${P} capital goods pair identity` })),
  planet_closure: { process: decl.planet_process, capacity: { kind: 'kernel', stock: `{C} ${P} Active Capacity` } },
};
const out = { patch: { add_elements: add, replace_formulas: replace, add_links: links }, validation };
console.log(`expanded ${P}: elements ${add.length}, replacements ${replace.length}, links ${links.length}`);

// comparison with an accepted model: definitions (type, behavior, endpoints) and link set
const cmp = opt('compare');
if (cmp) {
  const acc = JSON.parse(fs.readFileSync(cmp, 'utf8'));
  const accEl = new Map(acc.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));
  const accLinks = new Set(acc.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const def = e => JSON.stringify({ t: e.type, b: e.behavior, f: e.from ?? null, to: e.to ?? null });
  let missing = 0, diff = 0; const eg = [];
  for (const a of add) { const e = accEl.get(a.name); if (!e) { missing++; eg.push(`missing ${a.name}`); } else if (def(e) !== def(a)) { diff++; eg.push(`diff ${a.name}`); } }
  // the accepted value of a replaced formula may have been wrapped again by a later step: compare against the accepted model of THIS step
  for (const r of replace) { const e = accEl.get(r.name); if (!e || e.behavior.value !== r.value) { diff++; eg.push(`replace ${r.name}`); } }
  const badLinks = links.filter(l => !accLinks.has(`${l.from}|${l.to}`));
  // elements the accepted model added for this node but the generator did not produce
  const produced = new Set(add.map(a => a.name));
  const extra = [...accEl.keys()].filter(n => !baseEl.has(n) && (n.includes(P) || n === SW || (sig.create && (n.startsWith(`${decl.colonies[0]} `) || n.startsWith(`${decl.colonies[1]} `)) && n.includes(X_(sig.name, '').trim()))) && !produced.has(n));
  console.log(`compare with ${cmp.split(/[\\/]/).pop()}: missing ${missing}, definition diffs ${diff}, links not in accepted ${badLinks.length}, accepted node elements not generated ${extra.length}`);
  if (eg.length) console.log('  e.g.', eg.slice(0, 6).join('; '));
  if (extra.length) console.log('  not generated:', extra.slice(0, 6).join('; '));
}
const cv = opt('compare-validation');
if (cv) {
  const v = JSON.parse(fs.readFileSync(cv, 'utf8'));
  const k = v.plugins.find(p => p.type === 'capital_lifecycle_kernel').instances;
  const strip = i => JSON.stringify({ name: i.name, sector: i.sector, switch_gated: i.switch_gated, roles: i.roles, kernel_version: i.kernel_version });
  const kOk = validation.kernel_instances.every(g => k.some(a => strip(a) === strip(g)));
  const ob = v.plugins.find(p => p.type === 'open_boundaries');
  const capNames = ob.categories.find(c => c.id === 'capital_transformation').name;
  const nOk = validation.capital_transformation_names.every(n => capNames.includes(n));
  const pOk = validation.transformation_pairs.every(g => ob.transformation_pairs.some(a => JSON.stringify(a) === JSON.stringify(g)));
  const pc = v.plugins.find(p => p.type === 'planet_closure').processes.find(p => p.id === decl.planet_process);
  const cOk = JSON.stringify(pc.capacity) === JSON.stringify(validation.planet_closure.capacity);
  console.log(`validation fragments vs ${cv.split(/[\\/]/).pop()}: kernel instances ${kOk}, boundary names ${nOk}, pairs ${pOk}, planet capacity ${cOk}`);
}
if (opt('out')) fs.writeFileSync(opt('out'), JSON.stringify(out, null, 2) + '\n');
