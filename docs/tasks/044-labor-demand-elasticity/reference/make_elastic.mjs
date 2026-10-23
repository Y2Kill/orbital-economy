// Applies the labor-demand elasticity of the task-044 prototype to an accepted model that already carries the plain
// labor_market layer: the expansions of the elastic and the plain declaration over the pre-labor-market base are
// compared; new elements are added, changed formulas replaced (the accepted formula must equal the plain expansion),
// missing links added — the same as a model patch with add_elements + replace_formulas + add_links.
// Usage: node make_elastic.mjs <accepted.json> <pre-labor-market base.json> <elastic decl.json> <plain decl.json> <out.json>
import fs from 'node:fs';
const proto = await import(new URL('./labor_market_elasticity_prototype.mjs', import.meta.url));
const [acc, preBase, elDecl, plainDecl, out] = process.argv.slice(2);
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const m = read(acc), base = read(preBase);
const g = proto.expandLaborMarket(read(elDecl), base), p = proto.expandLaborMarket(read(plainDecl), base);
const formulas = x => new Map([...x.patch.add_elements.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...x.patch.replace_formulas.map(r => [r.name, r.value])]);
const gv = formulas(g), pv = formulas(p);
const byName = new Map(m.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));
const addEl = [], replace = [];
for (const e of g.patch.add_elements) if (!pv.has(e.name)) { addEl.push(e); m.elements.push(structuredClone(e)); byName.set(e.name, e); }
const fresh = new Set(addEl.map(e => e.name));
for (const [n, v] of gv) {
  if (fresh.has(n) || pv.get(n) === v) continue;
  const e = byName.get(n);
  if (!pv.has(n)) {   // a target only the elastic declaration wraps: the accepted value must still be the base value
    const b = base.elements.find(x => x.type !== 'LINK' && x.name === n);
    if (!b || String(b.behavior.value) !== String(e.behavior.value)) throw new Error(`${n}: accepted value is not the base value`);
  } else if (String(e.behavior.value) !== pv.get(n)) throw new Error(`${n}: accepted formula is not the plain expansion`);
  e.behavior.value = v; replace.push({ name: n, value: v });
}
const have = new Set(m.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
const links = [];
for (const l of g.patch.add_links) if (!have.has(`${l.from}|${l.to}`)) { have.add(`${l.from}|${l.to}`); links.push(l); m.elements.push({ type: 'LINK', ...l }); }
m.name += ' — labor demand wage elasticity';
fs.writeFileSync(out, JSON.stringify(m));
fs.writeFileSync(out.replace(/\.json$/, '.patch-parts.json'), JSON.stringify({ add_elements: addEl, replace_formulas: replace, add_links: links }, null, 2));
console.log(`added ${addEl.length}, replaced ${replace.length}, links +${links.length}`);
