// Reference expansion of the `food` node (task 031, Planet v2 step 2). Not normative as code; the bench generator
// must reproduce its result (same definition fingerprint at the same base). Every replaced formula is wrapped as
// IfThenElse([<switch>] = 1, <new>, <old>), so the switch off reproduces the base exactly and the layer peels like
// every switched node. Usage: node food_node_prototype.mjs <lab> <food.json> <base.json> <base validation.json> <out dir>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function expandFood(decl, base) {
  const byName = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  const C = decl.colonies, SW = decl.switch, ON = `[${SW}] = 1`;
  const sub = (t, X) => t.replaceAll('{C}', X);
  const must = n => { const e = byName.get(n); if (!e) throw new Error(`food: base element missing: ${n}`); return e; };
  const val = n => { const e = must(n); return e.type === 'STOCK' ? String(e.behavior.initial_value) : String(e.behavior.value); };
  const num = n => { const v = Number(val(n)); if (!Number.isFinite(v)) throw new Error(`food: ${n} is not a number`); return v; };
  const add = [], rep = [];
  const V = (name, value, note) => add.push({ type: 'VARIABLE', name, behavior: { value }, description: `Food node: ${note || name}.` });
  const S = (name, initial, note) => add.push({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true }, description: `Food node: ${note || name}.` });
  const F = (name, from, to, value, note) => add.push({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true }, description: `Food node: ${note || name}.` });
  const wrap = (name, fresh) => rep.push({ name, value: `IfThenElse(${ON}, ${fresh(`(${val(name)})`)}, ${val(name)})` });
  const P = decl.parameters, I = decl.inputs, T = decl.transport, H = decl.people;

  // parameters, switch and land
  V(SW, 0, 'switch of the food layer (0 = every earlier series unchanged)');
  for (const [k, v] of Object.entries(P)) V(k, v, `parameter ${k}`);
  for (const X of C) V(`${X} Farm Land Capacity`, decl.land[X], `farm land of region ${X} (soft cap of its farms)`);

  // start state: each region farms toward its need; the land-limited shortfall is shipped by the region with room
  const pop0 = Object.fromEntries(C.map(X => [X, num(sub(I.population_initial, X))]));
  const eff = (c, l) => c / (1 + (c / l) ** 8) ** 0.125;
  const farm0 = {}, prod0 = {}, short0 = {};
  for (const X of C) { farm0[X] = Math.min(pop0[X] * 1.05, decl.land[X]); prod0[X] = eff(farm0[X], decl.land[X]); short0[X] = Math.max(pop0[X] - prod0[X], 0); }
  const totalShort = C.reduce((s, X) => s + short0[X], 0);
  const room = Object.fromEntries(C.map(X => [X, short0[X] > 0 ? 0 : decl.land[X] - farm0[X]]));
  const totalRoom = C.reduce((s, X) => s + room[X], 0) || 1;
  const exp0 = Object.fromEntries(C.map(X => [X, totalShort * room[X] / totalRoom]));   // what X ships at start
  for (const X of C) if (exp0[X] > 0) { farm0[X] = Math.min((pop0[X] + exp0[X]) * 1.05, decl.land[X]); prod0[X] = pop0[X] + exp0[X]; }
  const TT = num(I.travel_time);

  for (const X of C) {
    const pop = `[${sub(I.population, X)}]`;
    V(`${X} Food Demand`, `IfThenElse(${ON}, ${pop} * [Food Need per Capita], 0)`, 'population x need per capita');
    S(`${X} Food Inventory`, pop0[X] * P['Food Target Coverage Days']);
    S(`${X} Food Demand Signal`, pop0[X]);
    F(`${X} Food Demand Signal Increase`, null, `${X} Food Demand Signal`, `Max([${X} Food Demand] - [${X} Food Demand Signal], 0) / [Food Demand Signal Time]`);
    F(`${X} Food Demand Signal Decrease`, `${X} Food Demand Signal`, null, `Max([${X} Food Demand Signal] - [${X} Food Demand], 0) / [Food Demand Signal Time]`);
    V(`${X} Food Coverage Days`, `[${X} Food Inventory] / ([${X} Food Demand] + 0.000001)`);
    V(`${X} Food Fulfillment`, `IfThenElse(${ON}, Min([${X} Food Coverage Days] / [Food Buffer Days], 1), 1)`, 'share of the need served (buffer days of stock = 1)');
    F(`${X} Food Consumption`, `${X} Food Inventory`, null, `[${X} Food Demand] * [${X} Food Fulfillment]`, 'food eaten');
    S(`${X} Food Production Signal`, prod0[X], 'smoothed production plan (energy request signal)');
    F(`${X} Food Production Signal Increase`, null, `${X} Food Production Signal`, `Max([${X} Desired Food Production] - [${X} Food Production Signal], 0) / [Food Production Signal Time]`);
    F(`${X} Food Production Signal Decrease`, `${X} Food Production Signal`, null, `Max([${X} Food Production Signal] - [${X} Desired Food Production], 0) / [Food Production Signal Time]`);
    S(`${X} Farm Capacity`, farm0[X], 'farm capacity (capital)');
    V(`${X} Farm Effective Capacity`, `[${X} Farm Capacity] / (1 + ([${X} Farm Capacity] / ([${X} Farm Land Capacity] + 0.001)) ^ 8) ^ 0.125`, 'farm capacity softly capped by land');
    V(`${X} Farm Desired Capacity`, `Min([${X} Food Production Signal] * [Farm Desired Capacity Margin], [${X} Farm Land Capacity])`);
    V(`${X} Farm Desired Expansion`, `IfThenElse(${ON}, Max([${X} Farm Desired Capacity] - [${X} Farm Capacity], 0) / [Farm Capacity Adjustment Time], 0)`);
    F(`${X} Farm Expansion`, null, `${X} Farm Capacity`, `[${X} Farm Desired Expansion] * [${sub(I.capital_goods.fulfillment, X)}]`, 'farm capacity built from capital goods');
    F(`${X} Farm Capital Goods Consumption`, sub(I.capital_goods.inventory, X), null, `[${X} Farm Expansion] * [Farm Capital Goods per Capacity]`, 'capital goods used to build farms');
    F(`${X} Farm Depreciation`, `${X} Farm Capacity`, null, `IfThenElse(${ON}, [${X} Farm Capacity] * [Farm Depreciation Rate], 0)`);
    V(`${X} Farming Requested Energy`, `IfThenElse(${ON}, [${X} Food Production Signal] * [Food Energy per Unit], 0)`, 'energy request of farms, served in the priority group');
    V(`${X} Farming Allocated Energy`, `[${X} Farming Requested Energy] * [${sub(I.energy.priority_fulfillment, X)}]`);
    V(`${X} Farming Energy Fulfillment`, `IfThenElse([${X} Farming Requested Energy] > 0.001, [${X} Farming Allocated Energy] / [${X} Farming Requested Energy], 1)`);
    F(`${X} Food Production`, null, `${X} Food Inventory`, `IfThenElse(${ON}, Min([${X} Desired Food Production], [${X} Farm Effective Capacity]) * [${X} Farming Energy Fulfillment], 0)`, 'food grown');
    V(`${X} Farming Labor Requirement`, `[${X} Food Production] * [Food Labor per Unit]`);
    V(`${X} Food Price`, `[Food Price Reference] * ([Food Target Coverage Days] / Max([${X} Food Coverage Days], 1)) ^ [Food Price Elasticity]`, 'scarcity price of food');
  }
  // trade by need between every ordered pair
  for (const X of C) {
    const others = C.filter(Y => Y !== X);
    const exportSignals = others.map(Y => `[${X} to ${Y} Food Export Signal]`).join(' + ');
    V(`${X} Desired Food Production`, `IfThenElse(${ON}, Max([${X} Food Demand Signal] + ${exportSignals} + ([Food Target Coverage Days] * [${X} Food Demand Signal] - [${X} Food Inventory]) / [Food Inventory Adjustment Time], 0), 0)`, 'own need + partners\' orders + stock correction');
    const inbound = others.map(Y => `[Food Cargo ${Y} to ${X}]`).join(' - ');
    V(`${X} Food Import Need`, `IfThenElse(${ON}, Max([${X} Food Demand Signal] - [${X} Farm Effective Capacity] + ([Food Target Coverage Days] * [${X} Food Demand Signal] - [${X} Food Inventory] - ${inbound}) / [Food Inventory Adjustment Time], 0), 0)`, 'what the region lacks');
    V(`${X} Food Exportable`, `Max([${X} Food Inventory] - 0.5 * [Food Target Coverage Days] * [${X} Food Demand Signal], 0) / [Food Export Release Time]`, 'stock above half the target, released over the export time');
  }
  const pairs = C.flatMap(X => C.filter(Y => Y !== X).map(Y => [X, Y]));
  const share = n => C.length === 2 ? `[${n} Food Import Need]` : `[${n} Food Import Need] / ${C.length - 1}`;
  for (const [X, Y] of pairs) {
    S(`${X} to ${Y} Food Export Signal`, exp0[X] && short0[Y] ? exp0[X] * short0[Y] / totalShort : 0, `orders of ${Y} seen by ${X}`);
    F(`${X} to ${Y} Food Export Signal Increase`, null, `${X} to ${Y} Food Export Signal`, `Max(${share(Y)} - [${X} to ${Y} Food Export Signal], 0) / [Food Production Signal Time]`);
    F(`${X} to ${Y} Food Export Signal Decrease`, `${X} to ${Y} Food Export Signal`, null, `Max([${X} to ${Y} Food Export Signal] - ${share(Y)}, 0) / [Food Production Signal Time]`);
    V(`Food Requested Dispatch ${X} to ${Y}`, `Min(${share(Y)}, [${X} Food Exportable] / ${C.length - 1})`);
    S(`Food Cargo ${X} to ${Y}`, (exp0[X] && short0[Y] ? exp0[X] * short0[Y] / totalShort : 0) * TT, `food in transit ${X} -> ${Y}`);
  }
  V('Food Transport Capacity', `[Food Transport Max Share] * [${T.capacity}] / [Food Freight Weight per Unit]`, 'food may take up to this share of the shared transport');
  V('Food Transport Scale', `Min(1, [Food Transport Capacity] / (${pairs.map(([X, Y]) => `[Food Requested Dispatch ${X} to ${Y}]`).join(' + ')} + 0.000001))`);
  for (const [X, Y] of pairs) {
    F(`Food Dispatch ${X} to ${Y}`, `${X} Food Inventory`, `Food Cargo ${X} to ${Y}`, `[Food Requested Dispatch ${X} to ${Y}] * [Food Transport Scale]`);
    F(`Food Arrival ${X} to ${Y}`, `Food Cargo ${X} to ${Y}`, `${Y} Food Inventory`, `[Food Cargo ${X} to ${Y}] / [${I.travel_time}]`);
  }
  V('Food Transport Load', `(${pairs.map(([X, Y]) => `[Food Dispatch ${X} to ${Y}]`).join(' + ')}) * [Food Freight Weight per Unit]`, 'shared-transport load of food (goes first)');
  V('Transport Goods Capacity', `Max([${T.capacity}] - [Food Transport Load], 0)`, 'shared transport left for goods after food');
  V('Planet Food Production', C.map(X => `[${X} Food Production]`).join(' + '));

  // replacements, all switch-wrapped
  for (const X of C) {
    wrap(sub(I.energy.total_request, X), o => `${o} + [${X} Farming Requested Energy]`);
    wrap(sub(I.energy.supply, X), o => `${o} + [${X} Farming Allocated Energy]`);
    wrap(sub(I.energy.priority_request, X), o => `${o} + [${X} Farming Requested Energy]`);
    wrap(sub(I.capital_goods.demand, X), o => `${o} + [${X} Farm Desired Expansion] * [Farm Capital Goods per Capacity]`);
    wrap(sub(I.labor_total, X), o => `${o} + [${X} Farming Labor Requirement]`);
    wrap(sub(H.living, X), () => [`Max([${X} Food Fulfillment], 0.000001) ^ [Living Food Weight]`, ...H.living_columns.map(c => `Max([${sub(c.column, X)}], 0.000001) ^ [${c.weight}]`)].join(' * '));
    wrap(sub(H.deaths, X), o => `${o} * Max([${X} Food Fulfillment], 0.05) ^ (-[Famine Death Sensitivity])`);
    wrap(sub(H.births, X), o => `${o} * [${X} Food Fulfillment]`);
    wrap(sub(H.price_index.name, X), o => `(${o} * ${H.price_index.terms} + [${X} Food Price] / [Food Price Reference]) / ${H.price_index.terms + 1}`);
  }
  for (const n of T.capacity_readers) { if (!val(n).includes(`[${T.capacity}]`)) throw new Error(`food: ${n} does not read ${T.capacity}`); wrap(n, o => o.replaceAll(`[${T.capacity}]`, '[Transport Goods Capacity]')); }
  for (const r of T.load_readers) { if (!val(r.name).includes(r.term)) throw new Error(`food: ${r.name} does not read ${r.term}`); wrap(r.name, o => o.replaceAll(r.term, `(${r.term} + [Food Transport Load])`)); }

  // links: every reference of added and replaced formulas, without duplicates or existing links
  const added = new Map(add.map(e => [e.name, e]));
  for (const e of add) if (byName.has(e.name)) throw new Error(`food: generated name conflicts with base element "${e.name}"`);
  const resolve = n => added.get(n) || byName.get(n);
  const have = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const links = [];
  const refs = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  for (const [to, v] of [...add.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...rep.map(r => [r.name, r.value])]) {
    for (const r of refs(v)) { const src = resolve(r); if (!src) throw new Error(`food: ${to}: unresolved [${r}]`); const k = `${src.name}|${to}`; if (!have.has(k)) { have.add(k); links.push({ from: src.name, to }); } }
  }

  // validation fragments
  const validation = {
    food_instances: C.map(X => ({
      name: `${X} food`, colony: X, inventory: `${X} Food Inventory`, production: `${X} Food Production`, consumption: `${X} Food Consumption`,
      demand: `${X} Food Demand`, fulfillment: `${X} Food Fulfillment`, farm_capacity: `${X} Farm Capacity`, farm_effective_capacity: `${X} Farm Effective Capacity`,
      land: `${X} Farm Land Capacity`, dispatch: C.filter(Y => Y !== X).map(Y => `Food Dispatch ${X} to ${Y}`), arrival: C.filter(Y => Y !== X).map(Y => `Food Arrival ${Y} to ${X}`)
    })),
    food_transport: { load: 'Food Transport Load', capacity: T.capacity, max_share: 'Food Transport Max Share' },
    agriculture_names: ['? Food Production'],
    final_consumption_names: ['? Food Consumption'],
    capital_transformation_names: ['? Farm Expansion', '? Farm Capital Goods Consumption'],
    capital_retirement_names: ['? Farm Depreciation'],
    transformation_pairs: C.map(X => ({ source: `${X} Farm Expansion`, sinks: [`${X} Farm Capital Goods Consumption`], identity: `${X} Farm capital goods pair identity` })),
    planet_process: {
      id: 'farming', kind: 'transformation', output: '{C} Food Production',
      capacity: { kind: 'simple', stock: '{C} Farm Capacity' },
      energy: { kind: 'requests', request: '{C} Farming Requested Energy', signal: '{C} Food Production Signal', fulfillment: I.energy.priority_fulfillment },
      labor: { kind: 'declared', intensity: 'Food Labor per Unit', requirement: '{C} Farming Labor Requirement' }
    },
    planet_process_category: 'agriculture'
  };
  return { patch: { add_elements: add, replace_formulas: rep, add_links: links }, validation };
}

// merge of the structural fragments into a validation (the bench does this in mergeNodeValidation; the `food`
// plugin itself is new in task 031 and is left out here)
export function mergeFoodStructure(v0, frag) {
  const v = structuredClone(v0);
  const ob = v.plugins.find(p => p.type === 'open_boundaries'), pc = v.plugins.find(p => p.type === 'planet_closure');
  const cat = id => ob.categories.find(c => c.id === id);
  if (!cat('agriculture')) ob.categories.push({ id: 'agriculture', closed_world: true, direction: 'source', name: [], reason: 'food grows on regional land with energy, labor and farm capital (Planet v2)' });
  const push = (id, names) => { const c = cat(id); for (const n of names) if (!c.name.includes(n)) c.name.push(n); };
  push('agriculture', frag.agriculture_names); push('final_consumption', frag.final_consumption_names);
  push('capital_transformation', frag.capital_transformation_names); push('capital_retirement', frag.capital_retirement_names);
  for (const p of frag.transformation_pairs) if (!ob.transformation_pairs.some(x => x.source === p.source)) ob.transformation_pairs.push(p);
  if (!pc.process_categories.includes(frag.planet_process_category)) pc.process_categories.push(frag.planet_process_category);
  if (!pc.processes.some(p => p.id === frag.planet_process.id)) pc.processes.push(frag.planet_process);
  return v;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [lab, declFile, baseFile, valFile, outDir] = process.argv.slice(2);
  const { applyPatch, PATCH_FORMAT } = await import(pathToFileURL(path.join(lab, 'src', 'patch.js')));
  const decl = JSON.parse(fs.readFileSync(declFile, 'utf8')), base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const out = expandFood(decl, base);
  const model = applyPatch(base, { format: PATCH_FORMAT, ...out.patch }).model;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'food-model.json'), JSON.stringify(model, null, 2));
  fs.writeFileSync(path.join(outDir, 'food-validation.json'), JSON.stringify(mergeFoodStructure(JSON.parse(fs.readFileSync(valFile, 'utf8')), out.validation), null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'food-fragment.json'), JSON.stringify(out.validation, null, 2) + '\n');
  console.log(`${out.patch.add_elements.length} elements / ${out.patch.replace_formulas.length} replacements / ${out.patch.add_links.length} links`);
}
