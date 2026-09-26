#!/usr/bin/env node
// Prototype of the switch-aware algebraic-loop audit (task 010). NOT normative, NOT part of the bench:
// a sketch that produced the reference numbers in TASK_RU.md. The bench module may be written differently,
// but it must reproduce these verdicts.
//
//   node loops_prototype.mjs <model.json>
//
// 1. Same-step graph: nodes are VARIABLE and FLOW (a STOCK is read from the previous step and cuts the graph);
//    an edge X -> Y exists when Y's formula references [X].
// 2. Switches: variables whose model value is literal 0 or 1, set by at least one scenario, and whose every
//    scenario value is 0 or 1. Other scenario variables (Timed Test Mode) are substituted only per scenario.
// 3. IfThenElse(cond, a, b): if cond references only substituted variables and literals, keep the taken branch;
//    otherwise keep both (conservative: extra warnings are possible, a missed loop is not).
// 4. Tarjan SCC; a component of size > 1 (or a self-reference) is an algebraic loop.
import fs from 'node:fs';

const m = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const E = m.elements;
const byName = new Map(E.filter(e => e.name).map(e => [e.name, e]));
const sameStep = n => ['VARIABLE', 'FLOW'].includes(byName.get(n)?.type);
const formula = new Map(E.filter(e => e.name && sameStep(e.name)).map(e => [e.name, String(e.behavior?.value ?? '')]));

const scenarioValues = new Map();
for (const s of m.scenarios || []) for (const [k, v] of Object.entries(s.values || {})) {
  if (!scenarioValues.has(k)) scenarioValues.set(k, []);
  scenarioValues.get(k).push(Number(v));
}
const switches = [...scenarioValues].filter(([k, vs]) => {
  const d = String(byName.get(k)?.behavior?.value);
  return (d === '0' || d === '1') && vs.every(v => v === 0 || v === 1);
}).map(([k]) => k);

// Split the argument list that starts at s[i] (just after '('); returns [args, index of closing ')'].
function splitArgs(s, i) {
  const out = []; let depth = 0, start = i;
  for (let k = i; k < s.length; k++) {
    const c = s[k];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') { if (depth === 0) { out.push(s.slice(start, k)); return [out, k]; } depth--; }
    else if (c === ',' && depth === 0) { out.push(s.slice(start, k)); start = k + 1; }
  }
  throw new Error('unbalanced formula');
}

// Decide a condition that uses only substituted variables and literals; undefined = undecidable.
function decide(cond, env) {
  const s = cond.replace(/\[([^\]]+)\]/g, (x, n) => (n in env ? String(env[n]) : '@'));
  if (s.includes('@') || !/^[\s\d.=<>()]+$/.test(s)) return undefined;
  try { return Boolean(Function(`return (${s.replace(/([^<>=])=([^=])/g, '$1==$2')})`)()); } catch { return undefined; }
}

function prune(s, env) {
  let out = '', i = 0;
  for (;;) {
    const j = s.indexOf('IfThenElse(', i);
    if (j < 0) return out + s.slice(i);
    out += s.slice(i, j);
    const [a, end] = splitArgs(s, j + 'IfThenElse('.length);
    const [c, t, f] = a.map(x => prune(x, env));
    const v = decide(c, env);
    out += v === undefined ? `(${c}|${t}|${f})` : (v ? t : f);
    i = end + 1;
  }
}

function loops(env) {
  const adj = new Map([...formula.keys()].map(k => [k, []]));
  for (const [n, q] of formula) for (const r of prune(q, env).matchAll(/\[([^\]]+)\]/g)) if (sameStep(r[1])) adj.get(r[1]).push(n);
  let idx = 0; const I = new Map(), low = new Map(), on = new Set(), stack = [], found = [];
  const visit = v => {
    I.set(v, idx); low.set(v, idx++); stack.push(v); on.add(v);
    for (const w of adj.get(v)) {
      if (!I.has(w)) { visit(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if (on.has(w)) low.set(v, Math.min(low.get(v), I.get(w)));
    }
    if (low.get(v) === I.get(v)) {
      const c = []; let w;
      do { w = stack.pop(); on.delete(w); c.push(w); } while (w !== v);
      if (c.length > 1 || adj.get(v).includes(v)) found.push(c);
    }
  };
  for (const v of adj.keys()) if (!I.has(v)) visit(v);
  return found;
}

console.log(`switches: ${switches.length} — ${switches.join(', ')}`);
let bad = 0;
for (let b = 0; b < 1 << switches.length; b++) {
  const env = {}; switches.forEach((n, i) => { env[n] = (b >> i) & 1; });
  const c = loops(env);
  if (c.length) { bad++; console.log(`  loop: on=[${switches.filter(n => env[n]).join(', ')}] sizes=${c.map(x => x.length).join('+')}`); }
}
console.log(`combinations: ${1 << switches.length}, with loops: ${bad}`);
const perMode = (m.scenarios || []).map((s, i) => {
  const env = {}; for (const k of scenarioValues.keys()) env[k] = Number(s.values?.[k] ?? byName.get(k)?.behavior?.value);
  return [i, loops(env).length];
}).filter(x => x[1]).map(x => x[0]);
console.log(`Modes with loops: ${perMode.join(',') || 'none'} of ${(m.scenarios || []).length}`);
