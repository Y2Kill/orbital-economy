// Prototype of node type `deposit` (task 022 reference; not normative code).
// One declaration = the deposit layer of a planet for several resources, one switch.
// Per resource R and colony X it adds: undiscovered resource and proven reserves stocks (initial values from
// named parameters), a smoothed extraction signal, capital-backed exploration from undiscovered to proven,
// a smooth depletion cap on the extraction rate, and re-sources the extraction flow from ∅ to proven reserves.
// Usage: node deposit_prototype.mjs <base.json> <declaration.json> <validation.json> <out-model.json> <out-validation.json>
import fs from 'node:fs';

const [baseFile, declFile, valFile, outModel, outVal] = process.argv.slice(2);
const base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
const decl = JSON.parse(fs.readFileSync(declFile, 'utf8'));
const validation = JSON.parse(fs.readFileSync(valFile, 'utf8'));

const key = s => String(s).toLowerCase();
const X_ = (s, c) => String(s).replaceAll('{C}', c);
const mx = (a, b) => `((${a} - ${b}) + (((${a} - ${b}) ^ 2) ^ 0.5)) / 2`;
const model = structuredClone(base);
const byName = new Map(model.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [key(e.name), e]));
const links = new Set(model.elements.filter(e => e.type === 'LINK').map(e => `${key(e.from)}|${key(e.to)}`));
const added = [];
const need = (n, why) => { const e = byName.get(key(n)); if (!e) throw new Error(`${why}: missing ${n}`); return e; };
const add = (el) => {
  if (byName.has(key(el.name))) throw new Error(`conflict with base element "${el.name}"`);
  el.description = `Generated deposit element for ${el.name}.`;
  model.elements.push(el); byName.set(key(el.name), el); added.push(el);
};
const V = (name, value) => add({ type: 'VARIABLE', name, behavior: { value } });
const S = (name, initial) => add({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true } });
const F = (name, from, to, value) => add({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true } });
const replaced = [];
const replace = (name, value) => { const e = need(name, 'replace'); replaced.push({ name, old: e.behavior.value }); e.behavior.value = value; };

const SW = decl.switch;
V(SW, 1);
const fragments = { deposit_instances: [], planet: [], exploration_names: [] };

for (const r of decl.resources) {
  const R = r.resource;
  const P = n => `${R} Deposit ${n}`;
  for (const [k, v] of Object.entries(r.parameters)) V(P(k), v);
  V(r.signal.adjustment_time.name, r.signal.adjustment_time.value);
  for (const X of decl.colonies) {
    const rate = X_(r.extraction.rate, X), flowName = X_(r.extraction.flow, X);
    const flow = need(flowName, 'extraction.flow');
    if (flow.type !== 'FLOW' || flow.from != null) throw new Error(`${flowName} must be a FLOW from ∅`);
    const oldRate = need(rate, 'extraction.rate').behavior.value;
    const U = `${X} ${R} Undiscovered Resource`, Pr = `${X} ${R} Proven Reserves`;
    V(`${U} Initial`, r.initial.undiscovered[X]);
    V(`${Pr} Initial`, r.initial.proven[X]);
    S(U, `[${U} Initial]`);
    S(Pr, `[${Pr} Initial]`);
    const sig = X_(r.signal.name, X), adj = r.signal.adjustment_time.name;
    S(sig, r.signal.initial[X]);
    F(`${sig} Increase`, null, sig, `IfThenElse([${rate}] > [${sig}], ([${rate}] - [${sig}]) / [${adj}], 0)`);
    F(`${sig} Decrease`, sig, null, `IfThenElse([${sig}] > [${rate}], ([${sig}] - [${rate}]) / [${adj}], 0)`);
    V(`${X} ${R} Target Proven Reserves`, `[${sig}] * [${P('Target Reserve Life')}]`);
    V(`${X} ${R} Reserve Gap`, mx(`[${X} ${R} Target Proven Reserves]`, `[${Pr}]`));
    V(`${X} ${R} Discovery Factor`, `[${U}] / [${U} Initial]`);
    V(`${X} ${R} Desired Exploration`, `IfThenElse([${SW}] = 1, [${X} ${R} Reserve Gap] / [${P('Exploration Time')}] * [${X} ${R} Discovery Factor], 0)`);
    const ful = r.backing.map(b => `[${X_(b.fulfillment, X)}]`);
    F(`${X} ${R} Exploration`, U, Pr, `IfThenElse([${SW}] = 1, [${X} ${R} Desired Exploration] * Min(${ful.join(', ')}), 0)`);
    for (const b of r.backing) {
      const inv = X_(b.inventory, X), dem = X_(b.demand, X);
      need(inv, 'backing.inventory'); need(X_(b.fulfillment, X), 'backing.fulfillment');
      F(`${X} ${R} Exploration ${b.good} Consumption`, inv, null, `IfThenElse([${SW}] = 1, [${X} ${R} Exploration] * [${P(`${b.good} per Discovery`)}], 0)`);
      const od = need(dem, 'backing.demand').behavior.value;
      replace(dem, `IfThenElse([${SW}] = 1, ${od} + [${X} ${R} Desired Exploration] * [${P(`${b.good} per Discovery`)}], ${od})`);
      fragments.exploration_names.push(`${X} ${R} Exploration ${b.good} Consumption`);
    }
    // depletion cap: extraction cannot run ahead of proven reserves (smooth, ore-mining saturation form)
    const Un = `${X} ${R} Deposit Unlimited Rate`;
    V(Un, oldRate);
    replace(rate, `IfThenElse([${SW}] = 1, [${Un}] / (1 + ([${Un}] / ([${Pr}] / [${P('Depletion Buffer Days')}] + 0.001)) ^ 8) ^ 0.125, ${oldRate})`);
    // re-source the extraction flow: from ∅ to proven reserves (endpoint is not switchable; while reserves last
    // the flow value is unchanged, so switched-off Modes stay exact)
    flow.from = Pr;
    fragments.planet.push({ process: r.planet_process, deposit: { kind: 'stock', stock: `{C} ${R} Proven Reserves` } });
    fragments.deposit_instances.push({ name: `${X} ${R} Deposit`, resource: R, undiscovered: U, proven: Pr, exploration: `${X} ${R} Exploration`, extraction: flowName });
  }
}

// links for every reference in added/replaced formulas (and stock initial values)
const refs = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
const addLink = (from, to) => { const k = `${key(from)}|${key(to)}`; if (links.has(k)) return; links.add(k); model.elements.push({ type: 'LINK', from: byName.get(key(from)).name, to }); };
for (const e of added) for (const ref of refs(e.behavior.value ?? e.behavior.initial_value)) addLink(ref, e.name);
for (const r of replaced) for (const ref of refs(byName.get(key(r.name)).behavior.value)) addLink(ref, r.name);

// validation fragments
const v = structuredClone(validation);
const planet = v.plugins.find(p => p.type === 'planet_closure');
for (const f of fragments.planet) { const p = planet.processes.find(x => x.id === f.process); p.deposit = f.deposit; }
const ob = v.plugins.find(p => p.type === 'open_boundaries');
let cat = ob.categories.find(c => c.id === 'exploration_expenditure');
if (!cat) ob.categories.push(cat = { id: 'exploration_expenditure', closed_world: true, direction: 'sink', name: [], reason: 'capital goods spent on resource exploration leave the economy' });
for (const n of fragments.exploration_names) { const pat = '? ' + n.slice(2); if (!cat.name.includes(pat)) cat.name.push(pat); }
fs.writeFileSync(outModel, JSON.stringify(model));
fs.writeFileSync(outVal, JSON.stringify(v, null, 2) + '\n');
fs.writeFileSync(outVal.replace(/\.json$/, '.fragments.json'), JSON.stringify(fragments, null, 2) + '\n');
console.log(`added ${added.length} elements, replaced ${replaced.length} formulas, re-sourced ${fragments.planet.length} flows`);
