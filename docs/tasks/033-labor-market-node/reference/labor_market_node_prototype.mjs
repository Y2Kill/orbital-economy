// Reference expansion of the `labor_market` node (task 033, Planet v2 step 3). Not normative as code; the bench
// generator must reproduce its result (same definition fingerprint at the same base). Owner decisions 2026-10-10:
// demand per capita at A's level x population, a wage that follows labor tightness, output limited by labor (a guard);
// household-income demand is deferred to the finance layer. Every replaced formula is wrapped as
// IfThenElse([<switch>] = 1, <new>, <old>). Usage: node labor_market_node_prototype.mjs <lab> <decl.json> <base.json> <base validation.json> <out dir>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function expandLaborMarket(decl, base) {
  const byName = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  const C = decl.colonies, SW = decl.switch, ON = `[${SW}] = 1`, I = decl.inputs;
  const sub = (t, X) => t.replaceAll('{C}', X);
  const must = n => { const e = byName.get(n); if (!e) throw new Error(`labor_market: base element missing: ${n}`); return e; };
  const val = n => { const e = must(n); return String(e.type === 'STOCK' ? e.behavior.initial_value : e.behavior.value); };
  const num = n => { const v = Number(val(n)); if (!Number.isFinite(v)) throw new Error(`labor_market: ${n} is not a number`); return v; };
  const add = [], rep = [];
  const V = (name, value, note) => add.push({ type: 'VARIABLE', name, behavior: { value }, description: `Labor market node: ${note || name}.` });
  const S = (name, initial, note) => add.push({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true }, description: `Labor market node: ${note || name}.` });
  const F = (name, from, to, value, note) => add.push({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true }, description: `Labor market node: ${note || name}.` });
  const wrap = (name, fresh, oldRef) => { const old = oldRef ?? val(name); rep.push({ name, value: `IfThenElse(${ON}, ${fresh(`(${old})`)}, ${old})` }); };
  // A numeric constant must not be inlined into the wrapped formula (A/B formulas must mirror): it moves to a named
  // parameter and the old branch reads it.
  const P = decl.parameters;

  V(SW, 0, 'switch of the labor market (0 = every earlier series unchanged)');
  for (const [k, v] of Object.entries(P)) V(k, v, `parameter ${k}`);
  const part = num(I.participation);
  for (const X of C) {
    const lf = `[${sub(I.labor_force, X)}]`, req = `[${sub(I.labor_requirement, X)}]`;
    // labor demand = requirement at unconstrained output (the requirement divided by the availability that produced it)
    S(`${X} Labor Demand Signal`, num(sub(I.population_initial, X)) * part, 'smoothed labor demand at unconstrained output');
    V(`${X} Labor Availability`, `IfThenElse(${ON}, Min(1, ${lf} / Max([${X} Labor Demand Signal], 0.000001)), 1)`, 'share of the labor demand the labor force can staff');
    V(`${X} Labor Demand`, `${req} / Max([${X} Labor Availability], 0.000001)`);
    F(`${X} Labor Demand Signal Increase`, null, `${X} Labor Demand Signal`, `Max([${X} Labor Demand] - [${X} Labor Demand Signal], 0) / [Labor Demand Signal Time]`);
    F(`${X} Labor Demand Signal Decrease`, `${X} Labor Demand Signal`, null, `Max([${X} Labor Demand Signal] - [${X} Labor Demand], 0) / [Labor Demand Signal Time]`);
    V(`${X} Labor Tightness`, `[${X} Labor Demand Signal] / Max(${lf}, 0.000001)`, 'labor demand over labor force');
    // flexible wage: a stock that follows tightness toward the target, not below the floor
    const wageName = sub(I.wage, X), w0 = num(wageName);
    V(`${X} Initial Wage`, w0, 'wage at the start (floor reference)');
    S(`${X} Flexible Wage`, w0, 'wage that follows labor tightness');
    F(`${X} Wage Increase`, null, `${X} Flexible Wage`, `IfThenElse(${ON}, [${X} Flexible Wage] * [Wage Adjustment Rate] * Max([${X} Labor Tightness] - [Target Labor Tightness], 0) / [Target Labor Tightness], 0)`);
    F(`${X} Wage Decrease`, `${X} Flexible Wage`, null, `IfThenElse(${ON}, [${X} Flexible Wage] * [Wage Adjustment Rate] * Max([Target Labor Tightness] - [${X} Labor Tightness], 0) / [Target Labor Tightness] * Max([${X} Flexible Wage] - [Wage Floor Share] * [${X} Initial Wage], 0) / Max([${X} Flexible Wage], 0.000001), 0)`);
    wrap(wageName, () => `[${X} Flexible Wage]`, `[${X} Initial Wage]`);
    for (const d of decl.demand) {
      const t = sub(d.target, X), ext = `${X} External ${t.slice(X.length + 1)}`;
      V(ext, num(t), `former external driver ${t} (kept for the switch-off branch)`);
      wrap(t, () => `[${d.per_capita}] * [${sub(I.population, X)}]`, `[${ext}]`);
    }
    for (const r of decl.rates) wrap(sub(r, X), o => `${o} * [${X} Labor Availability]`);
  }

  for (const e of add) if (byName.has(e.name)) throw new Error(`labor_market: generated name conflicts with base element "${e.name}"`);
  const added = new Map(add.map(e => [e.name, e]));
  const resolve = n => added.get(n) || byName.get(n);
  const have = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const links = [];
  const refs = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  for (const [to, v] of [...add.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...rep.map(r => [r.name, r.value])]) {
    for (const r of refs(v)) { const src = resolve(r); if (!src) throw new Error(`labor_market: ${to}: unresolved [${r}]`); const k = `${src.name}|${to}`; if (!have.has(k)) { have.add(k); links.push({ from: src.name, to }); } }
  }
  const validation = {
    labor_market_instances: C.map(X => ({
      name: `${X} labor market`, colony: X, availability: `${X} Labor Availability`, labor_force: sub(I.labor_force, X),
      labor_demand_signal: `${X} Labor Demand Signal`, tightness: `${X} Labor Tightness`, wage: `${X} Flexible Wage`, initial_wage: `${X} Initial Wage`,
      rates: decl.rates.map(r => sub(r, X)), demand: decl.demand.map(d => ({ target: sub(d.target, X), per_capita: d.per_capita, population: sub(I.population, X) }))
    })),
    labor_market_switch: SW,
    labor_market_floor: 'Wage Floor Share',
    information_signal_names: ['? Wage Increase', '? Wage Decrease'],
    // Planet v2: final demand = per-capita norm x population; the external drivers (P6) become the per-capita norms
    demand_drivers: { parameters: decl.demand.map(d => d.per_capita), replaces: decl.demand.map(d => d.target),
      reason: 'Planet v2 (labor market): final demand = per-capita demand x population; the per-capita norms are the external drivers, population is endogenous' }
  };
  return { patch: { add_elements: add, replace_formulas: rep, add_links: links }, validation };
}

export function mergeLaborMarketStructure(v0, frag) {
  const v = structuredClone(v0);
  const ob = v.plugins.find(p => p.type === 'open_boundaries');
  const info = ob.categories.find(c => c.id === 'information_signal');
  for (const n of frag.information_signal_names) if (!info.name.includes(n)) info.name.push(n);
  const pc = v.plugins.find(p => p.type === 'planet_closure');
  if (pc?.demand_drivers) { pc.demand_drivers.parameters = (pc.demand_drivers.parameters || []).filter(x => !frag.demand_drivers.replaces.includes(x));
    for (const x of frag.demand_drivers.parameters) if (!pc.demand_drivers.parameters.includes(x)) pc.demand_drivers.parameters.push(x);
    pc.demand_drivers.reason = frag.demand_drivers.reason; }
  return v;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [lab, declFile, baseFile, valFile, outDir] = process.argv.slice(2);
  const { applyPatch, PATCH_FORMAT } = await import(pathToFileURL(path.join(lab, 'src', 'patch.js')));
  const decl = JSON.parse(fs.readFileSync(declFile, 'utf8')), base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const out = expandLaborMarket(decl, base);
  const model = applyPatch(base, { format: PATCH_FORMAT, ...out.patch }).model;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'lm-model.json'), JSON.stringify(model, null, 2));
  fs.writeFileSync(path.join(outDir, 'lm-validation.json'), JSON.stringify(mergeLaborMarketStructure(JSON.parse(fs.readFileSync(valFile, 'utf8')), out.validation), null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'lm-fragment.json'), JSON.stringify(out.validation, null, 2) + '\n');
  console.log(`${out.patch.add_elements.length} elements / ${out.patch.replace_formulas.length} replacements / ${out.patch.add_links.length} links`);
}
