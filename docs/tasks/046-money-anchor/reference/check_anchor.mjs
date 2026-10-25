// Feasibility check of task 046 (run from the repository root):
//   1. without the anchor the prototype expands byte-identically to lab/src/nodes/money.js (v7.7.16 and v7.7.19 bases);
//   2. the anchor fixture: counts, fingerprint, generated names;
//   3. builds "v7.7.19 + anchor" (and optionally elasticity 0) as a model patch would: add_elements + replace_formulas
//      + add_links; writes the model and the patch parts.
// Usage: node check_anchor.mjs <v7.7.16 model.json> <out dir>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
const lab = p => import(pathToFileURL(path.resolve('lab/src', p)));
const bench = await lab('nodes/money.js');
const proto = await import(new URL('./money_anchor_prototype.mjs', import.meta.url));
const { applyPatch, PATCH_FORMAT } = await lab('patch.js');
const [v716, outDir] = process.argv.slice(2);
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const fingerprint = m => {
  const key = e => e.type === 'LINK' ? `L|${e.from}|${e.to}` : `${e.type}|${e.name}`;
  const def = e => JSON.stringify({ t: e.type, f: e.from ?? null, to: e.to ?? null, b: e.behavior });
  return crypto.createHash('sha256').update(m.elements.map(e => `${key(e)}=${def(e)}`).sort().join('\n')).digest('hex').slice(0, 16);
};
// the same as stripMoneyNode in lab/src/node_qa.js
const strip = (raw, decl) => {
  const out = structuredClone(raw), gen = new Set(bench.moneyGeneratedNames(decl));
  const byName = new Map(out.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  for (const name of bench.moneyReplacementNames(decl)) {
    const prefix = name.slice(0, name.indexOf(' ')), unscaled = prefix + ' Unscaled ' + name.slice(prefix.length + 1);
    byName.get(name).behavior.value = byName.get(unscaled).behavior.value;
  }
  out.elements = out.elements.filter(e => e.type === 'LINK' ? !gen.has(e.from) && !gen.has(e.to) : !gen.has(e.name));
  for (const sc of out.scenarios || []) if (sc.values) delete sc.values[decl.switch];
  return out;
};
const plain = read('model/nodes/money.json'), anchored = read('docs/tasks/046-money-anchor/fixtures/money_anchor.json');
const accepted = read('model/orbital_economy_v7_7_19_r1_modeljson.json');
const bases = { 'v7.7.16': read(v716), 'v7.7.19 without money': strip(accepted, plain) };
const counts = x => [x.patch.add_elements.length, x.patch.replace_formulas.length, x.patch.add_links.length].join('/');
const apply = (base, x) => applyPatch(base, { format: PATCH_FORMAT, ...x.patch }).model;

for (const [label, base] of Object.entries(bases)) {
  const a = bench.expandMoney(plain, base), b = proto.expandMoney(plain, base);
  const same = JSON.stringify(a) === JSON.stringify(b);
  console.log(`${label}: plain ${counts(a)}, prototype byte-identical: ${same}, fingerprint ${fingerprint(apply(base, b))}`);
  if (!same) process.exit(1);
  const c = proto.expandMoney(anchored, base);
  console.log(`${label}: anchored ${counts(c)}, fingerprint ${fingerprint(apply(base, c))}`);
}
const errors = [];
proto.validateMoneyDeclaration(anchored, 'decl', errors);
console.log('anchored declaration errors:', errors.length ? errors : 'none');
console.log('accepted v7.7.19 fingerprint', fingerprint(accepted), '= strip + plain expansion:',
  fingerprint(accepted) === fingerprint(apply(bases['v7.7.19 without money'], bench.expandMoney(plain, bases['v7.7.19 without money']))));

// v7.7.19 + anchor, as a model patch over the accepted model
const base = bases['v7.7.19 without money'];
const g = proto.expandMoney(anchored, base), p = bench.expandMoney(plain, base);
const value = e => e.behavior.value ?? e.behavior.initial_value;
const pv = new Map([...p.patch.add_elements.map(e => [e.name, value(e)]), ...p.patch.replace_formulas.map(r => [r.name, r.value])]);
const m = structuredClone(accepted), byName = new Map(m.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));
const addEl = [], replace = [];
for (const e of g.patch.add_elements) {
  if (!pv.has(e.name)) { addEl.push(e); m.elements.push(structuredClone(e)); continue; }
  if (JSON.stringify(value(e)) === JSON.stringify(pv.get(e.name))) continue;
  const t = byName.get(e.name);
  if (JSON.stringify(value(t)) !== JSON.stringify(pv.get(e.name))) throw new Error(`${e.name}: accepted formula is not the plain expansion`);
  t.behavior.value = e.behavior.value; replace.push({ name: e.name, value: e.behavior.value });
}
const have = new Set(m.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
const links = [];
for (const l of g.patch.add_links) if (!have.has(`${l.from}|${l.to}`)) { have.add(`${l.from}|${l.to}`); links.push(l); m.elements.push({ type: 'LINK', ...l }); }
m.name += ' — monetary anchor';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'v7719_anchor.json'), JSON.stringify(m));
fs.writeFileSync(path.join(outDir, 'v7719_anchor.patch-parts.json'), JSON.stringify({ add_elements: addEl, replace_formulas: replace, add_links: links }, null, 2));
fs.writeFileSync(path.join(outDir, 'v7719_anchor.validation-fragment.json'), JSON.stringify(g.validation, null, 2));
console.log(`v7.7.19 + anchor: added ${addEl.length}, replaced ${replace.length}, links +${links.length}, fingerprint ${fingerprint(m)}`);
