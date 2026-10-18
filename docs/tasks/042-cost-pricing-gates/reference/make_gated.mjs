// Applies the gated cost_pricing expansion (task 042 prototype) to an accepted model that already carries the
// ungated layer: the formulas that differ are replaced and the missing links added (the same as a model patch with
// replace_formulas + add_links). Optionally rewrites the scenarios to the option-A layout of the recalibration.
// Usage: node make_gated.mjs <accepted.json> <pre-cost base.json> <gated decl.json> <plain decl.json> <out.json> [--layout=A]
import fs from 'node:fs';
const [acc, preBase, gatedDecl, plainDecl, out, ...flags] = process.argv.slice(2);
const proto = await import(new URL('./cost_pricing_gates_prototype.mjs', import.meta.url));
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const m = read(acc), base = read(preBase);
const g = proto.expandCostPricing(read(gatedDecl), base), p = proto.expandCostPricing(read(plainDecl), base);
const formulas = x => new Map([...x.patch.add_elements.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...x.patch.replace_formulas.map(r => [r.name, r.value])]);
const gv = formulas(g), pv = formulas(p);
const byName = new Map(m.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));
const replace = [];
for (const [n, v] of gv) {
  if (pv.get(n) === v) continue;
  const e = byName.get(n);
  if (String(e.behavior.value) !== pv.get(n)) throw new Error(`${n}: accepted formula is not the plain expansion`);
  e.behavior.value = v; replace.push({ name: n, value: v });
}
const have = new Set(m.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
const links = [];
for (const l of g.patch.add_links) if (!have.has(`${l.from}|${l.to}`)) { have.add(`${l.from}|${l.to}`); links.push(l); m.elements.push({ type: 'LINK', ...l }); }
let modify = [];
if (flags.includes('--layout=A')) {
  // option A (owner 2026-10-18): cost pricing in every Mode; money in the full Modes 52-55;
  // 56-57 stay (cost pricing without money); 58-59 become the old-price controls (both switches 0).
  m.scenarios.forEach((s, i) => {
    const v = s.values, before = JSON.stringify(v);
    if (i <= 55) v['Cost Pricing Enabled'] = 1;
    if (i >= 52 && i <= 55) v['Money Enabled'] = 1;
    if (i >= 58) { v['Cost Pricing Enabled'] = 0; v['Money Enabled'] = 0; }
    if (JSON.stringify(v) !== before) modify.push({ mode: i, values: { ...v } });
  });
}
m.name += ' — gated cost terms' + (flags.includes('--layout=A') ? ', layout A' : '');
fs.writeFileSync(out, JSON.stringify(m));
fs.writeFileSync(out.replace(/\.json$/, '.patch-parts.json'), JSON.stringify({ replace_formulas: replace, add_links: links, modified_modes: modify.map(x => x.mode) }, null, 2));
console.log(`replaced ${replace.length}, links +${links.length}, modes modified ${modify.length}`);
