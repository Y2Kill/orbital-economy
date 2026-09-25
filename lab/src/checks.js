function pass(name, details = {}) { return { status: 'PASS', name, ...details }; }
function fail(name, message, details = {}) { return { status: 'FAIL', name, message, ...details }; }
function warn(name, message, details = {}) { return { status: 'WARN', name, message, ...details }; }

export function seriesContext(model, results) {
  const byName = new Map();
  for (const p of model.find()) if (p?.name) byName.set(p.name, p);
  const cache = new Map();
  const times = results.times();
  return {
    times,
    has(name) { return byName.has(name); },
    get(name) {
      if (!byName.has(name)) throw new Error(`Нет элемента/серии: ${name}`);
      if (!cache.has(name)) cache.set(name, results.series(byName.get(name)));
      return cache.get(name);
    }
  };
}

function indicesInWindow(times, window) {
  if (!window) return times.map((_, i) => i);
  const [a, b] = window;
  const ids = [];
  for (let i = 0; i < times.length; i++) if (times[i] >= a && times[i] <= b) ids.push(i);
  return ids;
}

function cmp(value, op, expected, tol = 0) {
  switch (op) {
    case '>': return value > expected;
    case '>=': return value >= expected - tol;
    case '<': return value < expected;
    case '<=': return value <= expected + tol;
    case '==': return Math.abs(value - expected) <= tol;
    case '!=': return Math.abs(value - expected) > tol;
    default: throw new Error(`Неизвестный operator: ${op}`);
  }
}

function firstEvent(ctx, ev) {
  const s = ctx.get(ev.column);
  const ids = indicesInWindow(ctx.times, ev.window);
  const op = ev.op || '>';
  const threshold = ev.value ?? 0;
  const tol = ev.tolerance ?? 0;
  for (const i of ids) if (cmp(s[i], op, threshold, tol)) return { time: ctx.times[i], value: s[i], index: i };
  return null;
}

export function runGenericCheck(check, ctx) {
  const name = check.name || `${check.type}: ${check.column || ''}`.trim();
  try {
    if (check.type === 'metric') {
      const s = ctx.get(check.column);
      const ids = indicesInWindow(ctx.times, check.window);
      if (!ids.length) return fail(name, 'Пустое временное окно');
      let value;
      if (check.metric === 'max') value = Math.max(...ids.map(i => s[i]));
      else if (check.metric === 'min') value = Math.min(...ids.map(i => s[i]));
      else if (check.metric === 'mean') value = ids.reduce((a, i) => a + s[i], 0) / ids.length;
      else if (check.metric === 'last') value = s[ids.at(-1)];
      else if (check.metric === 'first') value = s[ids[0]];
      else return fail(name, `Неизвестная metric: ${check.metric}`);
      const ok = cmp(value, check.op || '>=', check.value, check.tolerance ?? 0);
      return ok ? pass(name, { value }) : fail(name, `Получено ${value}, ожидалось ${check.op} ${check.value}`, { value });
    }

    if (check.type === 'change') {
      const s = ctx.get(check.column);
      const t0 = check.from_day, t1 = check.to_day;
      const i0 = ctx.times.indexOf(t0), i1 = ctx.times.indexOf(t1);
      if (i0 < 0 || i1 < 0) return fail(name, `Нет точного времени ${i0 < 0 ? t0 : t1}`);
      const value = s[i1] - s[i0];
      const ok = cmp(value, check.op || '>=', check.value, check.tolerance ?? 0);
      return ok ? pass(name, { value }) : fail(name, `Изменение ${value}, ожидалось ${check.op} ${check.value}`, { value });
    }

    if (check.type === 'event_exists') {
      const ev = firstEvent(ctx, check.event);
      return ev ? pass(name, ev) : fail(name, 'Событие не найдено');
    }

    if (check.type === 'event_absent') {
      const ev = firstEvent(ctx, check.event);
      return !ev ? pass(name) : fail(name, `Нежелательное событие найдено в day ${ev.time}`, ev);
    }

    // Declarative HARD invariants (v0.6.1): expressible in validation JSON without lab code.
    if (check.type === 'relation') {
      // { left, op: '<=' | '>=', right, abs_tol, window }
      if (!['<=', '>='].includes(check.op)) return fail(name, `relation.op must be <= or >= (got ${check.op})`);
      return checkRelation(ctx, { name, left: check.left, right: check.right, op: check.op, abs_tol: check.abs_tol ?? 1e-9, window: check.window });
    }

    if (check.type === 'identity') {
      // { terms: [{column, coef}], abs_tol, window }  — sum(coef * column) must be 0
      if (!Array.isArray(check.terms) || check.terms.length < 2) return fail(name, 'identity needs at least two terms');
      return checkLinearIdentity(ctx, { name, terms: check.terms, abs_tol: check.abs_tol ?? 1e-9, window: check.window });
    }

    if (check.type === 'bounded') {
      // { column, min, max, tolerance, window } — every point within [min, max]
      const s = ctx.get(check.column);
      const ids = indicesInWindow(ctx.times, check.window);
      const tol = check.tolerance ?? 1e-9;
      let worst = null;
      for (const i of ids) {
        const v = s[i];
        if (typeof v !== 'number') continue;
        if (check.min != null && v < check.min - tol) { worst = { time: ctx.times[i], value: v, bound: 'min' }; break; }
        if (check.max != null && v > check.max + tol) { worst = { time: ctx.times[i], value: v, bound: 'max' }; break; }
      }
      return worst ? fail(name, `${check.column} = ${worst.value} at day ${worst.time} violates ${worst.bound} ${worst.bound === 'min' ? check.min : check.max}`, worst) : pass(name, { points: ids.length });
    }

    if (check.type === 'event_order') {
      const found = [];
      for (const ev of check.events || []) {
        const x = firstEvent(ctx, ev);
        if (!x) return fail(name, `Не найдено событие ${ev.name || ev.column}`);
        found.push({ name: ev.name || ev.column, ...x });
      }
      for (let i = 1; i < found.length; i++) {
        if (found[i].time < found[i - 1].time) return fail(name, `Неверный порядок: ${found[i].name} (${found[i].time}) раньше ${found[i - 1].name} (${found[i - 1].time})`, { events: found });
      }
      return pass(name, { events: found });
    }

    return warn(name, `Неизвестный generic check type: ${check.type}`);
  } catch (e) {
    return fail(name, e.message);
  }
}

export function checkTimeAxis(results, expectedStep = null, tolerance = 1e-12) {
  const t = results.times();
  if (!t.length) return fail('time_axis', 'Нет временных точек');
  let maxStepErr = 0;
  for (let i = 1; i < t.length; i++) {
    if (!(t[i] > t[i - 1])) return fail('time_axis', `Время не возрастает на индексе ${i}`);
    if (expectedStep != null) maxStepErr = Math.max(maxStepErr, Math.abs((t[i] - t[i - 1]) - expectedStep));
  }
  if (expectedStep != null && maxStepErr > tolerance) return fail('time_axis', `Максимальная ошибка шага ${maxStepErr}`, { maxStepErr });
  return pass('time_axis', { rows: t.length, start: t[0], end: t.at(-1), maxStepErr });
}

export function checkFiniteAll(model, results) {
  let checked = 0;
  for (const p of model.find()) {
    if (!p?.name || p.constructor?.name === 'Link') continue;
    let s;
    try { s = results.series(p); } catch { continue; }
    checked++;
    for (let i = 0; i < s.length; i++) {
      const v = s[i];
      if (typeof v === 'number' && !Number.isFinite(v)) return fail('finite_all', `${p.name}: ${v} at index ${i}`);
    }
  }
  return pass('finite_all', { seriesChecked: checked });
}

export function checkNonNegativeRegex(model, results, pattern, tolerance = 1e-10) {
  const re = new RegExp(pattern, 'i');
  let count = 0;
  let worst = { value: Infinity, name: null, time: null };
  const times = results.times();
  for (const p of model.find()) {
    if (!p?.name || !re.test(p.name)) continue;
    let s;
    try { s = results.series(p); } catch { continue; }
    count++;
    for (let i = 0; i < s.length; i++) {
      if (typeof s[i] === 'number' && s[i] < worst.value) worst = { value: s[i], name: p.name, time: times[i] };
    }
  }
  if (worst.value < -tolerance) return fail('non_negative_regex', `${worst.name} = ${worst.value} at day ${worst.time}`, { checkedSeries: count, worst });
  return pass('non_negative_regex', { checkedSeries: count, worst });
}

export function checkLinearIdentity(ctx, spec) {
  const tol = spec.abs_tol ?? 1e-9;
  const ids = indicesInWindow(ctx.times, spec.window);
  const terms = (spec.terms || []).map(t => ({ coef: t.coef ?? 1, name: t.column, series: ctx.get(t.column) }));
  let maxAbs = 0, maxTime = null;
  for (const i of ids) {
    let v = 0;
    for (const t of terms) v += t.coef * t.series[i];
    const a = Math.abs(v);
    if (a > maxAbs) { maxAbs = a; maxTime = ctx.times[i]; }
  }
  const name = spec.name || 'linear_identity';
  return maxAbs <= tol ? pass(name, { maxAbsError: maxAbs, maxTime }) : fail(name, `max abs error ${maxAbs} > ${tol} at day ${maxTime}`, { maxAbsError: maxAbs, maxTime });
}

export function checkRelation(ctx, spec) {
  const tol = spec.abs_tol ?? 1e-9;
  const ids = indicesInWindow(ctx.times, spec.window);
  const a = ctx.get(spec.left);
  const b = ctx.get(spec.right);
  let worst = -Infinity, worstTime = null;
  for (const i of ids) {
    const violation = spec.op === '<=' ? a[i] - b[i] : b[i] - a[i];
    if (violation > worst) { worst = violation; worstTime = ctx.times[i]; }
  }
  const name = spec.name || `${spec.left} ${spec.op} ${spec.right}`;
  return worst <= tol ? pass(name, { worstViolation: worst, worstTime }) : fail(name, `violation ${worst} > ${tol} at day ${worstTime}`, { worstViolation: worst, worstTime });
}

export function checkNonNegativeColumns(ctx, spec) {
  const tol = spec.abs_tol ?? 1e-9;
  const ids = indicesInWindow(ctx.times, spec.window);
  let worst = { value: Infinity, column: null, time: null };
  for (const column of spec.columns || []) {
    const s = ctx.get(column);
    for (const i of ids) if (typeof s[i] === 'number' && s[i] < worst.value) worst = { value: s[i], column, time: ctx.times[i] };
  }
  const name = spec.name || 'non_negative_columns';
  if (worst.value < -tol) return fail(name, `${worst.column} = ${worst.value} at day ${worst.time}`, { worst });
  return pass(name, { columns: (spec.columns || []).length, worst });
}

// Shared by `capital_lifecycle` (items) and `capital_lifecycle_kernel` (instances.roles):
// Active <= Installed; Inactive = Installed - Active; Lifetime = Installed + Decommissioning + Retired.
function lifecycleIdentityChecks(ctx, label, r, tol, safe = (_, fn) => fn()) {
  const out = [];
  out.push(safe(`${label}: Active <= Installed`, () => checkRelation(ctx, { name: `${label}: Active <= Installed`, left: r.active, right: r.installed, op: '<=', abs_tol: tol })));
  out.push(safe(`${label}: Inactive identity`, () => checkLinearIdentity(ctx, { name: `${label}: Inactive identity`, abs_tol: tol, terms: [
    { column: r.installed, coef: 1 }, { column: r.active, coef: -1 }, { column: r.inactive, coef: -1 }
  ]})));
  if (r.lifetime && r.decommissioning && r.retired) {
    out.push(safe(`${label}: Lifetime account identity`, () => checkLinearIdentity(ctx, { name: `${label}: Lifetime account identity`, abs_tol: tol, terms: [
      { column: r.lifetime, coef: 1 }, { column: r.installed, coef: -1 },
      { column: r.decommissioning, coef: -1 }, { column: r.retired, coef: -1 }
    ]})));
  }
  return out;
}

// Plugins evaluated only statically (before simulation) by lifecycle_conformance.js / structure_audit.js.
const STATIC_ONLY_PLUGINS = new Set(['open_boundaries', 'colony_symmetry']);

export function checkPlugin(plugin, ctx) {
  const results = [];
  if (STATIC_ONLY_PLUGINS.has(plugin.type)) return results;
  if (plugin.type === 'energy_balance') {
    const tol = plugin.abs_tol ?? 1e-8;
    for (const c of plugin.colonies || ['A', 'B']) {
      const reqM = `${c} Metal Requested Energy`;
      const reqE = `${c} Electronics Requested Energy`;
      const allocM = `${c} Metal Allocated Energy`;
      const allocE = `${c} Electronics Allocated Energy`;
      const supply = `${c} Energy Supply`;
      const total = `${c} Total Requested Energy`;
      const unserved = `${c} Energy Unserved Demand`;
      const active = `${c} Power Active Generation Capacity`;
      results.push(checkRelation(ctx, { name: `${c} Metal allocated <= requested`, left: allocM, right: reqM, op: '<=', abs_tol: tol }));
      results.push(checkRelation(ctx, { name: `${c} Electronics allocated <= requested`, left: allocE, right: reqE, op: '<=', abs_tol: tol }));
      results.push(checkRelation(ctx, { name: `${c} Energy supply <= active generation`, left: supply, right: active, op: '<=', abs_tol: tol }));
      results.push(checkLinearIdentity(ctx, { name: `${c} supply allocation identity`, abs_tol: tol, terms: [
        { column: supply, coef: 1 }, { column: allocM, coef: -1 }, { column: allocE, coef: -1 }
      ]}));
      results.push(checkLinearIdentity(ctx, { name: `${c} unserved identity`, abs_tol: tol, terms: [
        { column: unserved, coef: 1 }, { column: total, coef: -1 }, { column: supply, coef: 1 }
      ]}));
    }
    return results;
  }

  if (plugin.type === 'capital_lifecycle') {
    // v0.3/v0.4 compact form: only the three core identities. Kept for compatibility.
    const tol = plugin.abs_tol ?? 1e-8;
    for (const item of plugin.items || []) results.push(...lifecycleIdentityChecks(ctx, item.name, item, tol));
    return results;
  }

  if (plugin.type === 'capital_lifecycle_kernel') {
    // Runtime half of the Capital Lifecycle Kernel contract (static half: lifecycle_conformance.js).
    const tol = plugin.abs_tol ?? 1e-8;
    const safe = (name, fn) => { try { return fn(); } catch (e) { return fail(name, e.message || String(e)); } };
    for (const inst of plugin.instances || []) {
      const r = inst.roles || {};
      for (const c of lifecycleIdentityChecks(ctx, inst.name, r, tol, safe)) results.push(c);
      results.push(safe(`${inst.name}: Target Active <= Installed`, () => checkRelation(ctx, { name: `${inst.name}: Target Active <= Installed`, left: r.target_active, right: r.installed, op: '<=', abs_tol: tol })));
      results.push(safe(`${inst.name}: Target Active <= Required Active`, () => checkRelation(ctx, { name: `${inst.name}: Target Active <= Required Active`, left: r.target_active, right: r.required_active, op: '<=', abs_tol: tol })));
      results.push(safe(`${inst.name}: kernel stocks >= 0`, () => checkNonNegativeColumns(ctx, { name: `${inst.name}: kernel stocks >= 0`, abs_tol: tol,
        columns: [r.installed, r.active, r.decommissioning, r.retired].filter(Boolean) })));
      results.push(safe(`${inst.name}: kernel flows >= 0`, () => checkNonNegativeColumns(ctx, { name: `${inst.name}: kernel flows >= 0`, abs_tol: tol,
        columns: [r.activation, r.mothballing, r.active_depreciation, r.expansion, r.decommissioning_initiation, r.installed_depreciation, r.dismantling_completion, r.capital_goods_consumption, r.capital_goods_consumption_secondary].filter(Boolean) })));
      if (r.desired_expansion) results.push(safe(`${inst.name}: Expansion <= Desired Expansion (kernel-v2)`, () => checkRelation(ctx, { name: `${inst.name}: Expansion <= Desired Expansion (kernel-v2)`, left: r.expansion, right: r.desired_expansion, op: '<=', abs_tol: tol })));
    }
    return results;
  }

  if (plugin.type === 'transport_allocator') {
    const tol = plugin.abs_tol ?? 1e-8;
    const total = plugin.total || 'Priority Allocated Total Load';
    const capacity = plugin.capacity_limited || 'Capacity Limited Total Transport Load';
    const parts = plugin.parts || [
      'Priority Allocated Load Metal A to B',
      'Priority Allocated Load Metal B to A',
      'Priority Allocated Load Electronics A to B',
      'Priority Allocated Load Electronics B to A'
    ];
    results.push(checkLinearIdentity(ctx, { name: 'Transport priority allocation identity', abs_tol: tol, terms: [
      { column: total, coef: 1 }, ...parts.map(column => ({ column, coef: -1 }))
    ]}));
    results.push(checkRelation(ctx, { name: 'Transport allocated <= capacity-limited load', left: total, right: capacity, op: '<=', abs_tol: tol }));
    return results;
  }

  return [warn(plugin.name || plugin.type, `Неизвестный plugin: ${plugin.type}`)];
}
