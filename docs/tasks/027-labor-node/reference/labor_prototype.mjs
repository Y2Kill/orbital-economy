// Prototype of node type `labor` (task 027 reference; not normative code).
// One declaration = the labor requirement of every process, with an automation factor from the start.
// Per process P (and colony X unless the process is shared):
//   intensity — an existing parameter, or a new `X P Labor per Unit`;
//   `X P Automation Level` (named parameter, start 0);
//   `X P Automation Factor` = 1 - (1 - h) * (1 - (1 - level) ^ k)   — exactly 1 at level 0 for any h;
//   `X P Labor Requirement` = output * intensity * factor;
//   cost formulas listed in `cost` read intensity * factor instead of intensity (bit-identical at factor 1).
// Colony totals `X Total Labor Requirement`; `Shared Labor Requirement` for shared processes.
// No switch: at automation 0 no existing series changes.
// Usage: node labor_prototype.mjs <base.json> <declaration.json> <validation.json> <out-model.json> <out-validation.json>
import fs from 'node:fs';

const [baseFile, declFile, valFile, outModel, outVal] = process.argv.slice(2);
const base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
const decl = JSON.parse(fs.readFileSync(declFile, 'utf8'));
const validation = JSON.parse(fs.readFileSync(valFile, 'utf8'));

const key = s => String(s).toLowerCase();
const X_ = (s, c) => String(s).replaceAll('{C}', c);
const model = structuredClone(base);
const byName = new Map(model.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [key(e.name), e]));
const links = new Set(model.elements.filter(e => e.type === 'LINK').map(e => `${key(e.from)}|${key(e.to)}`));
const added = [], replaced = [];
const need = (n, why) => { const e = byName.get(key(n)); if (!e) throw new Error(`${why}: missing ${n}`); return e; };
const V = (name, value) => {
  if (byName.has(key(name))) throw new Error(`conflict with base element "${name}"`);
  const el = { type: 'VARIABLE', name, description: `Generated labor element for ${name}.`, behavior: { value } };
  model.elements.push(el); byName.set(key(name), el); added.push(el);
};
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const H = decl.automation.min_human_share, K = decl.automation.exponent;
V(H.name, H.value);
V(K.name, K.value);
const colonyTotals = Object.fromEntries(decl.colonies.map(X => [X, []]));
const shared = [];
const planet = [], instances = [];
for (const p of decl.processes) {
  const scopes = p.scope === 'shared' ? [null] : decl.colonies;
  for (const X of scopes) {
    const pre = X ? `${X} ${p.process}` : p.process;
    const output = need(X ? X_(p.output, X) : p.output, 'output').name;
    let intensity;
    if (p.intensity.existing) intensity = need(X_(p.intensity.existing, X), 'intensity.existing').name;
    else { intensity = `${pre} Labor per Unit`; V(intensity, p.intensity.value); }
    const level = `${pre} Automation Level`, factor = `${pre} Automation Factor`, req = `${pre} Labor Requirement`;
    V(level, p.automation[X ?? 'shared']);
    V(factor, `1 - (1 - [${H.name}]) * (1 - (1 - [${level}]) ^ [${K.name}])`);
    V(req, `[${output}] * [${intensity}] * [${factor}]`);
    for (const c of p.cost || []) {
      const e = need(X_(c, X), 'cost');
      const re = new RegExp(`\\[${esc(intensity)}\\]`, 'g');
      const n = (e.behavior.value.match(re) || []).length;
      if (!n) throw new Error(`cost ${e.name} does not read ${intensity}`);
      e.behavior.value = e.behavior.value.replace(re, `([${intensity}] * [${factor}])`);
      replaced.push(e.name);
    }
    (X ? colonyTotals[X] : shared).push(`[${req}]`);
    instances.push({ name: `${pre} labor`, output, intensity, automation_level: level, automation_factor: factor, requirement: req });
  }
  planet.push({ process: p.planet_process, labor: { kind: 'declared', intensity: p.scope === 'shared' ? (p.intensity.existing || `${p.process} Labor per Unit`) : (p.intensity.existing || `{C} ${p.process} Labor per Unit`), requirement: p.scope === 'shared' ? `${p.process} Labor Requirement` : `{C} ${p.process} Labor Requirement` } });
}
for (const X of decl.colonies) V(`${X} Total Labor Requirement`, colonyTotals[X].join(' + '));
if (shared.length) V('Shared Labor Requirement', shared.join(' + '));

const refs = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
const addLink = (from, to) => { const k = `${key(from)}|${key(to)}`; if (links.has(k)) return; links.add(k); model.elements.push({ type: 'LINK', from: need(from, 'link').name, to }); };
for (const e of added) for (const r of refs(e.behavior.value)) addLink(r, e.name);
for (const n of replaced) for (const r of refs(need(n, 'replaced').behavior.value)) addLink(r, n);

const v = structuredClone(validation);
const pc = v.plugins.find(p => p.type === 'planet_closure');
for (const f of planet) pc.processes.find(x => x.id === f.process).labor = f.labor;
v.plugins.push({ type: 'labor', abs_tol: 1e-9, min_human_share: H.name, instances });
fs.writeFileSync(outModel, JSON.stringify(model));
fs.writeFileSync(outVal, JSON.stringify(v, null, 2) + '\n');
console.log(`added ${added.length} elements, replaced ${new Set(replaced).size} elements, links ${model.elements.filter(e => e.type === 'LINK').length - base.elements.filter(e => e.type === 'LINK').length}, instances ${instances.length}`);
