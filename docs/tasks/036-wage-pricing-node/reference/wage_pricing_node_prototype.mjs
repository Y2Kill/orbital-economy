// Prototype of node type 'wage_pricing' (finance layer, intermediate step; owner decisions 2026-10-12).
// Research reference for the bench task: the bench implementation must reproduce this expansion.
// One switch wraps:
//   prices[]  — a price with no labor in it follows the regional wage proportionally:
//               new = old x Max(1 + labor share x (wage / initial wage - 1), 1e-6); the labor share is declared per
//               colony (start labor cost / start price, at most 1), so the start prices are unchanged.
//   demand[]  — final demand responds to its market price: new = old x Max(price / reference, 1e-6) ^ (-elasticity),
//               the reference price declared per colony (year-1 mean of Mode 52 on v7.7.14).
// No stocks, no flows: the model boundary does not change.
// Usage as a library: expandWagePricing(decl, base) -> { patch: { add_elements, replace_formulas, add_links }, validation }
// Usage as a script:  node wage_pricing_node_prototype.mjs <decl.json> <base.json> <out.json>
//                     (applies the patch; trial Modes are added by add_wp_modes.mjs)
import fs from 'node:fs';

export function expandWagePricing(decl, base) {
  const byName = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  const C = decl.colonies, SW = decl.switch, ON = `[${SW}] = 1`, I = decl.inputs;
  const sub = (t, X) => t.replaceAll('{C}', X);
  const must = n => { const e = byName.get(n); if (!e) throw new Error(`wage_pricing: base element missing: ${n}`); return e; };
  const val = n => String(must(n).behavior.value);
  const add = [], rep = [];
  const V = (name, value, note) => add.push({ type: 'VARIABLE', name, behavior: { value }, description: `Wage pricing node: ${note || name}.` });
  const wrap = (name, fresh) => { const old = val(name); rep.push({ name, value: `IfThenElse(${ON}, ${fresh(`(${old})`)}, ${old})` }); };
  if (byName.has(SW)) throw new Error(`wage_pricing: switch "${SW}" already exists in base`);
  for (const X of C) {
    must(sub(I.wage, X)); must(sub(I.initial_wage, X));
    for (const p of decl.prices) { const e = must(sub(p.target, X)); if (e.type !== 'VARIABLE') throw new Error(`wage_pricing: ${e.name} must be a VARIABLE`); }
    for (const d of decl.demand) { const e = must(sub(d.target, X)); if (e.type !== 'VARIABLE') throw new Error(`wage_pricing: ${e.name} must be a VARIABLE`); must(sub(d.price, X)); }
  }

  V(SW, 0, 'switch of wage pricing (0 = every earlier series unchanged)');
  for (const [k, v] of Object.entries(decl.parameters)) V(k, v, `parameter ${k}`);
  for (const X of C) {
    V(`${X} Relative Wage Change`, `[${sub(I.wage, X)}] / Max([${sub(I.initial_wage, X)}], 0.000001) - 1`, 'wage relative to its start, minus one');
    for (const p of decl.prices) {
      const share = `${X} ${p.name} Labor Share`;
      V(share, p.labor_share[X], `share of labor in the start ${p.name.toLowerCase()} price (at most 1)`);
      wrap(sub(p.target, X), o => `${o} * Max(1 + [${share}] * [${X} Relative Wage Change], 0.000001)`);
    }
    for (const d of decl.demand) {
      const ref = `${X} ${d.name} Demand Reference Price`, f = `${X} ${d.name} Price Demand Factor`;
      V(ref, d.reference_price[X], `${d.name.toLowerCase()} price at which demand is the norm`);
      V(f, `Max([${sub(d.price, X)}] / [${ref}], 0.000001) ^ (-[${d.elasticity}])`, `${d.name.toLowerCase()} demand response to its price`);
      wrap(sub(d.target, X), o => `${o} * [${f}]`);
    }
  }

  for (const e of add) if (byName.has(e.name)) throw new Error(`wage_pricing: generated name conflicts with base element "${e.name}"`);
  const added = new Map(add.map(e => [e.name, e]));
  const resolve = n => added.get(n) || byName.get(n);
  const have = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const links = [];
  const refs = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  for (const [to, v] of [...add.map(e => [e.name, e.behavior.value]), ...rep.map(r => [r.name, r.value])]) {
    for (const r of refs(v)) {
      const src = resolve(r); if (!src) throw new Error(`wage_pricing: ${to}: unresolved [${r}]`);
      const k = `${src.name}|${to}`; if (!have.has(k)) { have.add(k); links.push({ from: src.name, to }); }
    }
  }
  const validation = {
    wage_pricing_instances: C.map(X => ({
      name: `${X} wage pricing`, colony: X, wage: sub(I.wage, X), initial_wage: sub(I.initial_wage, X), relative_wage_change: `${X} Relative Wage Change`,
      prices: decl.prices.map(p => ({ target: sub(p.target, X), labor_share: `${X} ${p.name} Labor Share` })),
      demand: decl.demand.map(d => ({ target: sub(d.target, X), price: sub(d.price, X), reference_price: `${X} ${d.name} Demand Reference Price`, factor: `${X} ${d.name} Price Demand Factor`, elasticity: d.elasticity }))
    })),
    wage_pricing_switch: SW
  };
  return { patch: { add_elements: add, replace_formulas: rep, add_links: links }, validation };
}

if (process.argv[1] && process.argv[1].endsWith('wage_pricing_node_prototype.mjs') && process.argv.length >= 5) {
  const [declFile, baseFile, outFile] = process.argv.slice(2);
  const decl = JSON.parse(fs.readFileSync(declFile, 'utf8')), base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const { patch } = expandWagePricing(decl, base);
  const model = structuredClone(base);
  const idx = new Map(model.elements.map((e, i) => [e.type !== 'LINK' && e.name, i]));
  for (const r of patch.replace_formulas) model.elements[idx.get(r.name)].behavior.value = r.value;
  model.elements.push(...patch.add_elements, ...patch.add_links.map(l => ({ type: 'LINK', ...l })));
  model.name = 'Orbital Economy v7.7.15 wage pricing prototype';
  fs.writeFileSync(outFile, JSON.stringify(model));
  console.log(`added ${patch.add_elements.length} elements, ${patch.replace_formulas.length} replacements, ${patch.add_links.length} links`);
}
