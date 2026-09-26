#!/usr/bin/env node
// Prototype of the planet_closure audit (task 011). NOT normative, NOT part of the bench: it produced
// the reference numbers in TASK_RU.md.
// Claims are checked on SHORT reference paths (max_hops): a full dependency closure is too broad, because
// demand chains connect every process to every capacity (ore mining 'reads' the refinery through ore demand). Run from lab/ so that the bench's open_boundaries audit is importable:
//
//   cd lab && node ../docs/tasks/011-planet-closure/reference/planet_closure_prototype.mjs <model.json> <validation.json> <declaration.json>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [modelFile, validationFile, declFile] = process.argv.slice(2);
const raw = JSON.parse(fs.readFileSync(modelFile, 'utf8'));
const validation = JSON.parse(fs.readFileSync(validationFile, 'utf8'));
const decl = JSON.parse(fs.readFileSync(declFile, 'utf8'));
const { auditOpenBoundaries } = await import(pathToFileURL(path.resolve('src/structure_audit.js')).href);

const key = s => String(s ?? '').trim().toLowerCase();
const byKey = new Map(raw.elements.filter(e => e.name && e.type !== 'LINK').map(e => [key(e.name), e]));
const el = n => byKey.get(key(n));
const refs = e => [...String(e?.behavior?.value ?? '').matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);

// Dependency closure of an element: everything its formula reaches through VARIABLE/FLOW;
// a STOCK is included but not traversed (it is read from the previous step).
function closure(name) {
  const out = new Set(); const stack = [name];
  while (stack.length) {
    const e = el(stack.pop()); if (!e) continue;
    for (const r of refs(e)) {
      const t = el(r); if (!t || out.has(t.name)) continue;
      out.add(t.name);
      if (t.type === 'VARIABLE' || t.type === 'FLOW') stack.push(t.name);
    }
  }
  return out;
}
// Shortest reference path from -> to, traversing only VARIABLE/FLOW (the target may be a STOCK). null if none.
function refPath(from, to) {
  const start = el(from)?.name, goal = el(to)?.name; if (!start || !goal) return null;
  const prev = new Map([[start, null]]); const q = [start];
  while (q.length) {
    const v = q.shift(); if (v === goal) break;
    const t = el(v)?.type; if (v !== start && t !== 'VARIABLE' && t !== 'FLOW') continue;
    for (const r of refs(el(v))) { const n = el(r)?.name; if (n && !prev.has(n)) { prev.set(n, v); q.push(n); } }
  }
  if (!prev.has(goal)) return null;
  const path = []; for (let x = goal; x != null; x = prev.get(x)) path.unshift(x); return path;
}
// Elements within `hops` references of `from` that have a formula with references (not bare constants).
function near(from, hops) {
  const out = new Set(); let frontier = [el(from)?.name].filter(Boolean);
  for (let h = 0; h < hops; h++) {
    const next = [];
    for (const v of frontier) { const t = el(v)?.type; if (h > 0 && t !== 'VARIABLE' && t !== 'FLOW') continue;
      for (const r of refs(el(v))) { const n = el(r)?.name; if (n && !out.has(n)) { out.add(n); next.push(n); } } }
    frontier = next;
  }
  return new Set([...out].filter(n => refs(el(n)).length && el(n).type !== 'STOCK'));
}
const MAX = decl.max_hops ?? 4;
const within = (from, to) => { const p = refPath(from, to); return p && p.length - 1 <= MAX ? p : null; };
const paths = [];
const hasStock = set => [...set].some(n => el(n)?.type === 'STOCK');
const readers = name => raw.elements.filter(e => e.name && refs(e).some(r => key(r) === key(name))).map(e => e.name);

const expand = (s, c) => String(s).replaceAll('{C}', c);
const instances = [];
for (const p of decl.processes) {
  const cols = String(p.output).includes('{C}') ? decl.colonies : [null];
  for (const c of cols) instances.push({ p, c, x: s => (c == null ? s : expand(s, c)) });
}

const errors = []; const notes = [];
const err = (i, m) => errors.push(`${i.p.id}${i.c ? `[${i.c}]` : ''}: ${m}`);
const counters = { processes: 0, legacy: 0,
  P2: { kernel: 0, exceptions: 0, undeclared: 0 }, P3: { requests: 0, producer: 0, exceptions: 0, undeclared: 0 },
  P4: { with_deposit: 0, without_deposit: 0 }, P5: { declared: 0, undeclared: 0 }, P6: { drivers: 0 } };

// completeness against open_boundaries classification
const ob = auditOpenBoundaries(raw, validation.plugins.find(p => p.type === 'open_boundaries'));
const expected = new Set();
for (const id of decl.process_categories) for (const n of ob.byCategory[id]?.flows || []) if (el(n)?.from == null) expected.add(n);
const declaredOutputs = new Map();
for (const i of instances) {
  const o = el(i.x(i.p.output));
  if (!o) { err(i, `output ${i.x(i.p.output)} missing`); continue; }
  declaredOutputs.set(o.name, (declaredOutputs.get(o.name) || 0) + 1);
}
for (const n of expected) if (!declaredOutputs.has(n)) errors.push(`undeclared process: ${n}`);
for (const [n, k] of declaredOutputs) if (k > 1) errors.push(`output declared ${k} times: ${n}`);

for (const i of instances) {
  const { p } = i; const out = el(i.x(p.output)); if (!out) continue;
  const depositStock = p.deposit?.kind === 'stock' ? el(i.x(p.deposit.stock))?.name : null;
  if (p.kind !== 'service' && !(out.type === 'FLOW' && (out.from == null || (depositStock && key(out.from) === key(depositStock)))))
    err(i, 'output must be a FLOW from ∅ (or, for an extraction with deposit: stock, from that deposit)');
  if (p.legacy) { if (!el(p.legacy.switch)) err(i, 'legacy switch missing'); counters.legacy++; continue; }
  counters.processes++;
  const cl = closure(out.name);

  const cap = p.capacity || {};
  if (cap.kind === 'kernel') {
    const s = el(i.x(cap.stock));
    if (s?.type !== 'STOCK') err(i, `capacity stock ${i.x(cap.stock)} is not a STOCK`);
    else { const pa = within(out.name, s.name); if (!pa) err(i, `output does not read capacity stock ${s.name} within ${MAX} references`); else { counters.P2.kernel++; paths.push(pa.join(' > ')); } }
  } else if (cap.kind === 'constant') {
    const v = el(i.x(cap.parameter));
    if (v?.type !== 'VARIABLE') err(i, `capacity parameter ${i.x(cap.parameter)} is not a VARIABLE`);
    else if (hasStock(closure(v.name))) err(i, `capacity parameter ${v.name} depends on a stock (not constant)`);
    else if (!within(out.name, v.name)) err(i, `output does not read capacity parameter ${v.name} within ${MAX} references`);
    else {
      paths.push(within(out.name, v.name).join(' > '));
      counters.P2.exceptions++;
      const own = new Set([...cl, out.name]);
      const outside = [];
      for (const r of readers(v.name)) if (!own.has(r)) outside.push(r);
      if (outside.length) notes.push(`${p.id}${i.c ? `[${i.c}]` : ''}: constant ${v.name} also read by ${outside.join(', ')}`);
    }
    if (!cap.reason) err(i, 'constant capacity needs a reason');
  } else if (cap.kind === 'unbounded') { counters.P2.exceptions++; if (!cap.reason) err(i, 'unbounded capacity needs a reason'); }
  else counters.P2.undeclared++;

  const en = p.energy || {};
  if (en.kind === 'requests') {
    const r = el(i.x(en.request)); const tot = i.x(decl.energy.total_request).replaceAll('{C}', i.c ?? '');
    const ful = i.x(decl.energy.fulfillment);
    if (r?.type !== 'VARIABLE') err(i, `energy request ${i.x(en.request)} missing`);
    else if (!within(tot, r.name)) err(i, `${r.name} is not part of ${tot} within ${MAX} references`);
    else if (!within(out.name, ful)) err(i, `output does not read ${ful} within ${MAX} references`);
    else {
      const shared = [...near(r.name, MAX)].filter(n => near(out.name, MAX).has(n));
      if (!shared.length) err(i, `energy request ${r.name} shares no planned-rate element with the output`);
      else { counters.P3.requests++; paths.push(`${r.name} ~ ${out.name} via ${shared[0]}`); }
    }
  } else if (en.kind === 'producer') { if (p.kind !== 'service') err(i, 'producer only for a service'); counters.P3.producer++; }
  else if (en.kind === 'none') { counters.P3.exceptions++; if (!en.reason) err(i, 'energy none needs a reason'); }
  else counters.P3.undeclared++;

  if (p.kind === 'extraction') {
    const d = p.deposit || {};
    if (d.kind === 'stock') { const s = el(i.x(d.stock)); if (s?.type !== 'STOCK' || key(out.from) !== key(s.name)) err(i, 'deposit stock must be the source of the output flow'); else counters.P4.with_deposit++; }
    else counters.P4.without_deposit++;
  }

  const lb = p.labor || {};
  if (lb.kind === 'declared') { const v = el(i.x(lb.intensity)); if (!v || !readers(v.name).length) err(i, `labor intensity ${i.x(lb.intensity)} missing or unused`); else counters.P5.declared++; }
  else counters.P5.undeclared++;
}

for (const c of decl.colonies) {
  const cons = decl.demand_drivers.consumption.map(s => expand(s, c));
  const reach = new Set(cons.flatMap(n => [...closure(n)]));
  for (const pName of decl.demand_drivers.parameters.map(s => expand(s, c))) {
    const v = el(pName);
    if (v?.type !== 'VARIABLE') errors.push(`demand driver ${pName} missing`);
    else if (hasStock(closure(v.name))) errors.push(`demand driver ${pName} depends on a stock`);
    else if (!reach.has(v.name)) errors.push(`demand driver ${pName} does not reach final consumption`);
    else counters.P6.drivers++;
  }
}

console.log(JSON.stringify({ expectedProcessOutputs: expected.size, counters, errors, notes, paths }, null, 2));
