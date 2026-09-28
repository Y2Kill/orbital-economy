// Prototype of a strict validation schema (task 018 reference). Returns a list of errors with JSON paths.
// Usage: node schema_prototype.mjs <validation.json> [model.json]
import fs from 'node:fs';

const COMMENT = ['note', 'notes'];
const OPS = ['>', '>=', '<', '<=', '==', '!='];
const TOP = {
  name: 'string', mode_variable: 'string', expected_time_step: 'number', time_step_tolerance: 'number',
  finite_all: 'boolean', non_negative_regex: 'object', regression_modes: 'array', regression_tolerance: 'number',
  plugins: 'array', scenarios: 'object', global_checks: 'array',
  web_crosscheck_abs_tolerance: 'number', web_crosscheck_rel_tolerance: 'number|null', web_crosscheck_rel_floor: 'number',
  notes: 'any', note: 'any'
};
const WINDOW = ['window'];
const EVENT = { column: 'string', op: 'op', value: 'number', tolerance: 'number', window: 'window', name: 'string' };
const CHECKS = {
  metric:       { req: ['column', 'metric', 'op', 'value'], opt: ['tolerance', ...WINDOW] },
  change:       { req: ['column', 'from_day', 'to_day', 'op', 'value'], opt: ['tolerance'] },
  event_exists: { req: ['event'], opt: [] },
  event_absent: { req: ['event'], opt: [] },
  event_order:  { req: ['events'], opt: [] },
  relation:     { req: ['left', 'op', 'right'], opt: ['abs_tol', ...WINDOW] },
  identity:     { req: ['terms'], opt: ['abs_tol', ...WINDOW] },
  bounded:      { req: ['column'], opt: ['min', 'max', 'tolerance', ...WINDOW] },
};
const PLUGINS = {
  energy_balance: ['colonies', 'abs_tol', 'consumers'],
  capital_lifecycle: ['abs_tol', 'items'],
  capital_lifecycle_kernel: ['format', 'legacy_switch', 'abs_tol', 'instances'],
  simple_capital: ['abs_tol', 'instances'],
  transport_allocator: ['abs_tol'],
  open_boundaries: ['enforce', 'categories', 'transformation_pairs'],
  colony_symmetry: ['tokens', 'enforce', 'exceptions'],
  planet_closure: ['enforce', 'colonies', 'max_hops', 'process_categories', 'energy', 'processes', 'demand_drivers'],
};

export function checkSchema(v, modes = null) {
  const errors = [];
  const err = (p, m) => errors.push(`${p}: ${m}`);
  const isWin = w => Array.isArray(w) && w.length === 2 && w.every(x => typeof x === 'number') && w[0] <= w[1];
  const typeOk = (t, x) => t === 'any' || (t.endsWith('|null') && (x === null || typeOk(t.slice(0, -5), x))) || (t === 'array' ? Array.isArray(x) : t === 'object' ? x && typeof x === 'object' && !Array.isArray(x) : typeof x === t);
  if (!v || typeof v !== 'object') return ['$: validation is not an object'];
  for (const [k, x] of Object.entries(v)) {
    if (!(k in TOP)) err(`$.${k}`, 'unknown top-level field');
    else if (!typeOk(TOP[k], x)) err(`$.${k}`, `expected ${TOP[k]}`);
  }
  const event = (p, e) => {
    if (!e || typeof e !== 'object' || Array.isArray(e)) return err(p, 'expected an event object {column, op, value, window}');
    for (const [k, x] of Object.entries(e)) {
      if (!(k in EVENT) && !COMMENT.includes(k)) err(`${p}.${k}`, 'unknown event field');
      else if (EVENT[k] === 'window' && !isWin(x)) err(`${p}.${k}`, 'window must be [from_day, to_day]');
      else if (EVENT[k] === 'op' && !OPS.includes(x)) err(`${p}.${k}`, `op must be one of ${OPS.join(' ')}`);
    }
    if (typeof e.column !== 'string') err(`${p}.column`, 'required');
  };
  const check = (p, c) => {
    if (!c || typeof c !== 'object') return err(p, 'check is not an object');
    const spec = CHECKS[c.type];
    if (!spec) return err(`${p}.type`, `unknown check type "${c.type}" (known: ${Object.keys(CHECKS).join(', ')})`);
    const allowed = new Set(['type', 'name', ...COMMENT, ...spec.req, ...spec.opt]);
    for (const k of Object.keys(c)) if (!allowed.has(k)) {
      const hint = (k === 'from_day' || k === 'to_day') && c.type !== 'change' ? ' (a window is "window": [from, to])'
        : (['column', 'op', 'value'].includes(k) && c.type.startsWith('event_')) ? ' (event fields go inside "event": {...})' : '';
      err(`${p}.${k}`, `unknown field for ${c.type}${hint}`);
    }
    for (const k of spec.req) if (!(k in c)) err(`${p}.${k}`, `required for ${c.type}`);
    if ('window' in c && !isWin(c.window)) err(`${p}.window`, 'window must be [from_day, to_day]');
    if ('op' in c && !OPS.includes(c.op)) err(`${p}.op`, `op must be one of ${OPS.join(' ')}`);
    if (c.type === 'relation' && !['<=', '>='].includes(c.op)) err(`${p}.op`, 'relation op must be <= or >=');
    if (c.type === 'metric' && !['max', 'min', 'mean', 'last', 'first'].includes(c.metric)) err(`${p}.metric`, 'metric must be max|min|mean|last|first');
    if ('event' in c) event(`${p}.event`, c.event);
    if (c.type === 'event_order') (Array.isArray(c.events) ? c.events : []).forEach((e, i) => event(`${p}.events[${i}]`, e));
    if (c.type === 'identity') (Array.isArray(c.terms) ? c.terms : []).forEach((t, i) => {
      for (const k of Object.keys(t || {})) if (!['column', 'coef'].includes(k)) err(`${p}.terms[${i}].${k}`, 'unknown term field');
    });
  };
  (v.global_checks || []).forEach((c, i) => check(`$.global_checks[${i}]`, c));
  for (const [mode, s] of Object.entries(v.scenarios || {})) {
    const p = `$.scenarios["${mode}"]`;
    if (!/^\d+$/.test(mode)) err(p, 'scenario key must be a Mode number');
    else if (modes && !modes.has(+mode)) err(p, `Mode ${mode} is not a scenario of the model — its checks would never run`);
    for (const k of Object.keys(s || {})) if (!['name', 'checks', ...COMMENT].includes(k)) err(`${p}.${k}`, 'unknown scenario field');
    (s?.checks || []).forEach((c, i) => check(`${p}.checks[${i}]`, c));
  }
  (v.plugins || []).forEach((pl, i) => {
    const p = `$.plugins[${i}]`;
    const spec = PLUGINS[pl?.type];
    if (!spec) return err(`${p}.type`, `unknown plugin type "${pl?.type}"`);
    for (const k of Object.keys(pl)) if (!['type', ...COMMENT, ...spec].includes(k)) err(`${p}.${k}`, `unknown field for plugin ${pl.type}`);
  });
  return errors;
}

if (process.argv[1]?.endsWith('schema_prototype.mjs') && process.argv[2]) {
  const v = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  let modes = null;
  if (process.argv[3]) {
    const m = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    modes = new Set((m.scenarios || []).map(s => s?.values?.[v.mode_variable || 'Timed Test Mode']).filter(x => typeof x === 'number'));
  }
  const e = checkSchema(v, modes);
  console.log(`${e.length} error(s)`); for (const x of e) console.log('  ' + x);
  process.exitCode = e.length ? 1 : 0;
}
