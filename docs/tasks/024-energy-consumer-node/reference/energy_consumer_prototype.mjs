// Prototype of node type `energy_consumer` (task 024 reference; not normative code).
// One declaration = several processes joining each colony's energy allocator, one switch.
// Per consumer K and colony X: the old rate is kept verbatim as `X K Pre Energy Rate`; a smoothed signal of it
// sizes the energy request (a same-step request loops through the allocator for every v7.7.8 consumer); the
// allocator grants request × ratio; the rate becomes pre-energy rate × the consumer's own fulfillment.
// Priority consumers (energy-sector own use) are served first; the rest share what is left.
// Usage: node energy_consumer_prototype.mjs <base.json> <declaration.json> <validation.json> <out-model.json> <out-validation.json>
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
const added = [];
const need = (n, why) => { const e = byName.get(key(n)); if (!e) throw new Error(`${why}: missing ${n}`); return e; };
const add = el => {
  if (byName.has(key(el.name))) throw new Error(`conflict with base element "${el.name}"`);
  el.description = `Generated energy_consumer element for ${el.name}.`;
  model.elements.push(el); byName.set(key(el.name), el); added.push(el);
};
const V = (name, value) => add({ type: 'VARIABLE', name, behavior: { value } });
const S = (name, initial) => add({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true } });
const F = (name, from, to, value) => add({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true } });
const replaced = [];
const replace = (name, value) => { const e = need(name, 'replace'); replaced.push(name); e.behavior.value = value; };

const SW = decl.switch;
V(SW, 1);
for (const c of decl.consumers) {
  V(`${c.consumer} Energy per Unit`, c.energy_per_unit);
  V(c.signal.adjustment_time.name, c.signal.adjustment_time.value);
}
const priority = decl.consumers.filter(c => c.priority).map(c => c.consumer);
const planetFragments = [];
for (const X of decl.colonies) {
  const total = X_(decl.allocator.total, X), avail = X_(decl.allocator.available, X);
  const supply = X_(decl.allocator.supply, X), ratio = X_(decl.allocator.ratio, X);
  need(avail, 'allocator.available'); need(ratio, 'allocator.ratio');
  const prioRatio = `${X} Priority Energy Fulfillment Ratio`;
  const req = [], alloc = [];
  for (const c of decl.consumers) {
    const K = c.consumer, rate = X_(c.rate, X);
    const old = need(rate, 'rate').behavior.value;
    const pre = `${X} ${K} Pre Energy Rate`, sig = `${X} ${K} Energy Signal`, adj = c.signal.adjustment_time.name;
    V(pre, old);
    S(sig, c.signal.initial[X]);
    F(`${sig} Increase`, null, sig, `IfThenElse([${pre}] > [${sig}], ([${pre}] - [${sig}]) / [${adj}], 0)`);
    F(`${sig} Decrease`, sig, null, `IfThenElse([${sig}] > [${pre}], ([${sig}] - [${pre}]) / [${adj}], 0)`);
    V(`${X} ${K} Requested Energy`, `IfThenElse([${SW}] = 1, [${sig}] * [${K} Energy per Unit], 0)`);
    V(`${X} ${K} Allocated Energy`, `[${X} ${K} Requested Energy] * [${c.priority ? prioRatio : ratio}]`);
    V(`${X} ${K} Energy Fulfillment Ratio`, `IfThenElse([${X} ${K} Requested Energy] > 0.001, [${X} ${K} Allocated Energy] / [${X} ${K} Requested Energy], 1)`);
    replace(rate, `IfThenElse([${SW}] = 1, [${pre}] * [${X} ${K} Energy Fulfillment Ratio], ${old})`);
    req.push(`[${X} ${K} Requested Energy]`); alloc.push(`[${X} ${K} Allocated Energy]`);
    if (X === decl.colonies[0]) planetFragments.push({ process: c.planet_process, energy: { kind: 'requests', request: `{C} ${K} Requested Energy`, signal: `{C} ${K} Energy Signal`, ...(c.priority ? { fulfillment: '{C} Priority Energy Fulfillment Ratio' } : {}) } });
  }
  if (priority.length) {
    // Proportional rationing of fuel extraction itself is a positive loop with an absorbing zero
    // (no energy -> no fuel -> no energy); energy-sector own use is therefore served first.
    const pr = `${X} Priority Requested Energy`, pa = `${X} Priority Allocated Energy`;
    V(pr, priority.map(K => `[${X} ${K} Requested Energy]`).join(' + '));
    V(prioRatio, `IfThenElse([${pr}] > [${avail}], [${avail}] / ([${pr}] + 0.001), 1)`);
    V(pa, `[${pr}] * [${prioRatio}]`);
    const or = need(ratio, 'allocator.ratio').behavior.value;
    replace(ratio, `IfThenElse([${SW}] = 1, IfThenElse([${total}] > [${avail}], Max(0, [${avail}] - [${pa}]) / ([${total}] - [${pr}] + 0.001), 1), ${or})`);
  }
  const ot = need(total, 'allocator.total').behavior.value, os = need(supply, 'allocator.supply').behavior.value;
  replace(total, `IfThenElse([${SW}] = 1, ${ot} + ${req.join(' + ')}, ${ot})`);
  replace(supply, `IfThenElse([${SW}] = 1, ${os} + ${alloc.join(' + ')}, ${os})`);
}

const refs = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
const addLink = (from, to) => { const k = `${key(from)}|${key(to)}`; if (links.has(k)) return; links.add(k); model.elements.push({ type: 'LINK', from: need(from, 'link').name, to }); };
for (const e of added) for (const ref of refs(e.behavior.value ?? e.behavior.initial_value)) addLink(ref, e.name);
for (const n of replaced) for (const ref of refs(need(n, 'replaced').behavior.value)) addLink(ref, n);

const v = structuredClone(validation);
const eb = v.plugins.find(p => p.type === 'energy_balance');
for (const c of decl.consumers) if (!eb.consumers.includes(c.consumer)) eb.consumers.push(c.consumer);
if (priority.length) eb.priority = [...new Set([...(eb.priority || []), ...priority])];
const planet = v.plugins.find(p => p.type === 'planet_closure');
for (const f of planetFragments) planet.processes.find(x => x.id === f.process).energy = f.energy;
fs.writeFileSync(outModel, JSON.stringify(model));
fs.writeFileSync(outVal, JSON.stringify(v, null, 2) + '\n');
console.log(`added ${added.length} elements, replaced ${new Set(replaced).size} elements, links ${model.elements.filter(e => e.type === 'LINK').length - base.elements.filter(e => e.type === 'LINK').length}, consumers ${decl.consumers.map(c => c.consumer).join(', ')}`);
