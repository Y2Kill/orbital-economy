// Prototype of layer gates for node type 'cost_pricing' (task 042; owner decision 2026-10-18, option A:
// cost pricing becomes the price system of every Mode, money only in the full Modes).
// Research reference for the bench task: the bench implementation must reproduce this expansion.
//
// The accepted generator (task 038) counts every cost term in every Mode. In a Mode where a physical layer is off,
// the full cost then holds an input that does not exist there: the power resource in the energy cost while
// Power Resource Enabled = 0, process energy while Process Energy Enabled = 0, the wear of a mine that has no
// capital lifecycle. Optional gates name the switch that turns the physical flow on, exactly as the model does:
//   costs[].inputs[].gate   — the input term is multiplied by [gate];
//   costs[].wear.gate       — the whole wear term (… ) * [depreciation] is multiplied by [gate];
//   wear_gates              — { capital_goods, construction_materials }: each wear component is multiplied by [gate];
//   prices[].gate           — the price condition becomes IfThenElse([switch] * [gate] = 1, new, old).
// x * 1 is exact in IEEE arithmetic, so where every gate is 1 the series are bit-identical to the ungated expansion.
// Without gates the expansion is the accepted one, byte for byte.
// Usage as a library: expandCostPricing(decl, base) -> { patch: { add_elements, replace_formulas, add_links }, validation }
// Usage as a script:  node cost_pricing_gates_prototype.mjs <decl.json> <base.json> <out.json>
import fs from 'node:fs';

export function expandCostPricing(decl, base) {
  const byName = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  const C = decl.colonies, SW = decl.switch, ON = `[${SW}] = 1`, I = decl.inputs, P = decl.parameters;
  const MARKUP = 'Universal Markup', TIME = 'Cost Price Signal Time';
  const sub = (t, X) => t.replaceAll('{C}', X);
  const must = n => { const e = byName.get(n); if (!e) throw new Error(`cost_pricing: base element missing: ${n}`); return e; };
  const val = n => String(must(n).behavior.value);
  const add = [], rep = [];
  const V = (name, value, note) => add.push({ type: 'VARIABLE', name, behavior: { value }, description: `Cost pricing node: ${note || name}.` });
  const S = (name, initial, note) => add.push({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true }, description: `Cost pricing node: ${note || name}.` });
  const F = (name, from, to, value, note) => add.push({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true }, description: `Cost pricing node: ${note || name}.` });
  const wrap = (name, fresh, oldRef, on = ON) => { const old = oldRef ?? val(name); rep.push({ name, value: `IfThenElse(${on}, ${fresh(`(${old})`)}, ${old})` }); };
  if (byName.has(SW)) throw new Error(`cost_pricing: switch "${SW}" already exists in base`);
  const refsOf = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  // a gate is an existing 0/1 switch of the base model
  const gate = g => {
    if (g === undefined) return '';
    const e = must(g);
    if (e.type !== 'VARIABLE' || (e.behavior.value !== 0 && e.behavior.value !== 1)) throw new Error(`cost_pricing: gate "${g}" is not a 0/1 switch`);
    return ` * [${g}]`;
  };
  const WG = decl.wear_gates || {};

  V(SW, 0, 'switch of cost pricing (0 = every earlier series unchanged)');
  for (const [k, v] of Object.entries(P)) V(k, v, `parameter ${k}`);
  const MU = `(1 + [${MARKUP}])`;
  for (const X of C) {
    const sig = n => `[${X} ${n} Cost Price Signal]`, W = `[${sub(I.wage, X)}]`;
    for (const s of decl.signals) {
      const name = `${X} ${s.name} Cost Price Signal`, src = sub(s.source, X);
      if (!byName.has(src) && !decl.costs.some(c => c.cost_price && `${X} ${c.name} Cost Price` === src)) throw new Error(`cost_pricing: signal source missing: ${src}`);
      S(name, s.initial[X], `${s.name.toLowerCase()} price seen by the cost formulas, smoothed`);
      F(`${name} Increase`, null, name, `IfThenElse(${ON}, Max([${src}] - [${name}], 0) / [${TIME}], 0)`);
      F(`${name} Decrease`, name, null, `IfThenElse(${ON}, Max([${name}] - [${src}], 0) / [${TIME}], 0)`);
    }
    for (const c of decl.costs) {
      const terms = [];
      for (const q of c.inputs || []) terms.push(`[${sub(q.per_unit, X)}] * ${sig(q.signal)}${gate(q.gate)}`);
      if (c.labor) terms.push(`[${sub(c.labor, X)}]${c.automation ? ` * [${sub(c.automation, X)}]` : ''} * ${W}`);
      const wear = c.wear ? `(${[`[${sub(c.wear.capital_goods, X)}] * ${sig(decl.wear_signals.capital_goods)}${gate(WG.capital_goods)}`,
                                ...(c.wear.construction_materials ? [`[${sub(c.wear.construction_materials, X)}] * ${sig(decl.wear_signals.construction_materials)}${gate(WG.construction_materials)}`] : [])].join(' + ')}) * [${sub(c.wear.depreciation, X)}]${gate(c.wear.gate)}` : null;   // construction materials optional (farms use none)
      if (c.extend) {
        const wn = `${X} ${c.name} Capital Wear`;
        V(wn, wear, `${c.name.toLowerCase()} capital wear per unit`);
        wrap(sub(c.extend, X), o => `${o} + [${wn}]`);
        continue;
      }
      if (wear) terms.push(wear);
      if (c.rent) terms.push(`[${sub(c.rent, X)}]`);
      V(`${X} ${c.name} Full Cost`, terms.join(' + '), `full unit cost of ${c.name.toLowerCase()} (materials, energy, labor, capital wear, rent)`);
      if (c.cost_price) V(`${X} ${c.name} Cost Price`, `[${X} ${c.name} Full Cost] * ${MU}`, `cost price of ${c.name.toLowerCase()} (no market)`);
    }
    for (const p of decl.prices) {
      const scarcity = sub(p.scarcity, X);
      for (const r of refsOf(scarcity)) must(r);
      const on = p.gate === undefined ? ON : `[${SW}]${gate(p.gate)} = 1`;
      wrap(sub(p.target, X), () => `[${X} ${p.cost} Full Cost] * ${MU} * ${scarcity}`, undefined, on);
    }
    for (const m of decl.markups) wrap(sub(m, X), () => `[${MARKUP}]`);
    for (const r of decl.references) {
      const t = sub(r.target, X), init = `${X} Initial ${r.name}`, scale = `${X} ${r.name} Cost Scale`;
      V(init, Number(val(t)), `${r.name.toLowerCase()} before cost pricing`);
      V(scale, r.scale[X], `${r.name.toLowerCase()} scale: start price under cost pricing / start price`);
      wrap(t, () => `[${init}] * [${scale}]`, `[${init}]`);
    }
    const pi = decl.price_index, fr = `${X} Food Index Reference`, fs_ = `${X} Food Index Cost Scale`;
    V(fs_, pi.scale[X], 'food reference scale of the price index');
    V(fr, `[${pi.reference}] * [${fs_}]`, 'regional food reference of the price index');
    const piName = sub(pi.target, X), piOld = val(piName);
    if (!piOld.includes(`[${pi.reference}]`)) throw new Error(`cost_pricing: ${piName} does not read [${pi.reference}]`);
    wrap(piName, () => `(${piOld.replaceAll(`[${pi.reference}]`, `[${fr}]`)})`);
  }

  for (const e of add) if (byName.has(e.name)) throw new Error(`cost_pricing: generated name conflicts with base element "${e.name}"`);
  const added = new Map(add.map(e => [e.name, e]));
  const resolve = n => added.get(n) || byName.get(n);
  const have = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const links = [];
  for (const [to, v] of [...add.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...rep.map(r => [r.name, r.value])]) {
    for (const r of refsOf(v)) {
      const src = resolve(r); if (!src) throw new Error(`cost_pricing: ${to}: unresolved [${r}]`);
      const k = `${src.name}|${to}`; if (!have.has(k)) { have.add(k); links.push({ from: src.name, to }); }
    }
  }
  const validation = {
    cost_pricing_instances: C.map(X => ({
      name: `${X} cost pricing`, colony: X, wage: sub(I.wage, X),
      signals: decl.signals.map(s => ({ signal: `${X} ${s.name} Cost Price Signal`, source: sub(s.source, X) })),
      prices: decl.prices.map(p => ({ target: sub(p.target, X), full_cost: `${X} ${p.cost} Full Cost` })),
      cost_prices: decl.costs.filter(c => c.cost_price).map(c => ({ target: `${X} ${c.name} Cost Price`, full_cost: `${X} ${c.name} Full Cost` }))
    })),
    cost_pricing_switch: SW, cost_pricing_markup: MARKUP,
    information_signal_names: decl.signals.flatMap(s => [`? ${s.name} Cost Price Signal Increase`, `? ${s.name} Cost Price Signal Decrease`])
  };
  return { patch: { add_elements: add, replace_formulas: rep, add_links: links }, validation };
}

if (process.argv[1] && process.argv[1].endsWith('cost_pricing_gates_prototype.mjs') && process.argv.length >= 5) {
  const [declFile, baseFile, outFile] = process.argv.slice(2);
  const decl = JSON.parse(fs.readFileSync(declFile, 'utf8')), base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const { patch } = expandCostPricing(decl, base);
  const model = structuredClone(base);
  const idx = new Map(model.elements.map((e, i) => [e.type !== 'LINK' && e.name, i]));
  for (const r of patch.replace_formulas) model.elements[idx.get(r.name)].behavior.value = r.value;
  model.elements.push(...patch.add_elements, ...patch.add_links.map(l => ({ type: 'LINK', ...l })));
  model.name = 'Orbital Economy v7.7.15 cost pricing gates prototype';
  fs.writeFileSync(outFile, JSON.stringify(model));
  console.log(`added ${patch.add_elements.length} elements, ${patch.replace_formulas.length} replacements, ${patch.add_links.length} links`);
}
