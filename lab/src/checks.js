import { validateWagePricingSpec, validateMoneySpec } from './lifecycle_conformance.js';

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
const STATIC_ONLY_PLUGINS = new Set(['open_boundaries', 'colony_symmetry', 'planet_closure']);

export function checkPlugin(plugin, ctx) {
  const results = [];
  if (STATIC_ONLY_PLUGINS.has(plugin.type)) return results;
  if (plugin.type === 'money') {
    const specErrors = validateMoneySpec(plugin);
    if (specErrors.length) return specErrors.map(error => fail('money spec', error));
    const absTol = plugin.abs_tol ?? 1e-6;
    const relTol = plugin.rel_tol ?? 1e-9;
    const times = ctx.times;
    const safe = (name, work) => {
      try { return work(); }
      catch (error) { return fail(name, error.message || String(error)); }
    };
    const series = name => {
      const values = ctx.get(name);
      if (!times.length || values.length !== times.length) {
        throw new Error(name + ': series length differs from time axis');
      }
      return values;
    };
    const bound = (inst, name, column) => safe(inst.name + ': ' + name + ' ' + column, () => {
      const data = series(column);
      const bad = data.findIndex(value => !Number.isFinite(value) || value < 0);
      return bad < 0
        ? pass(inst.name + ': ' + name + ' ' + column)
        : fail(inst.name + ': ' + name + ' ' + column,
          column + '=' + data[bad] + ' at day ' + times[bad]);
    });
    for (const inst of plugin.instances) {
      const title = inst.name + ': income identity ' + inst.income;
      results.push(safe(title, () => {
        const actual = series(inst.income);
        const columns = [inst.wage_bill, inst.rent, inst.dividends, inst.transport_income]
          .map(series);
        let maxError = 0, at = null;
        for (let i = 0; i < times.length; i++) {
          const expected = columns.reduce((sum, values) => sum + values[i], 0);
          const error = Math.abs(actual[i] - expected) / Math.max(1, Math.abs(expected));
          if (!Number.isFinite(error) || error > maxError) {
            maxError = error;
            at = times[i];
          }
        }
        return maxError <= relTol
          ? pass(title, { maxRelativeError: maxError })
          : fail(title, `relative error ${maxError} > ${relTol} at day ${at}`);
      }));
      results.push(bound(inst, 'nonnegative dividends', inst.dividends));
      results.push(bound(inst, 'nonnegative budget factor', inst.budget_factor));
    }
    results.push(safe('money: exports equal imports', () => {
      const exports = plugin.instances.map(inst => series(inst.exports));
      const imports = plugin.instances.map(inst => series(inst.imports));
      for (let i = 0; i < times.length; i++) {
        const out = exports.reduce((sum, v) => sum + v[i], 0);
        const incoming = imports.reduce((sum, v) => sum + v[i], 0);
        const error = Math.abs(out - incoming) / Math.max(1, Math.abs(out), Math.abs(incoming));
        if (!Number.isFinite(error) || error > relTol) {
          return fail('money: exports equal imports',
            `sum exports ${out} differs from sum imports ${incoming} at day ${times[i]}`);
        }
      }
      return pass('money: exports equal imports');
    }));
    results.push(safe('money: total money conserved', () => {
      const balances = plugin.instances.flatMap(inst =>
        [series(inst.household_money), series(inst.firm_money)]);
      balances.push(series(plugin.transport.money));
      const issued = plugin.issued === undefined ? null : series(plugin.issued);
      const total = i => balances.reduce((sum, v) => sum + v[i], 0) -
        (issued ? issued[i] : 0);
      const initial = total(0);
      const allowed = absTol * Math.max(1, Math.abs(initial));
      let worst = 0, at = null;
      for (let i = 0; i < times.length; i++) {
        const drift = Math.abs(total(i) - initial);
        if (!Number.isFinite(drift) || drift > worst) {
          worst = drift;
          at = times[i];
        }
      }
      return worst <= allowed
        ? pass('money: total money conserved', { initial, maxAbsDrift: worst })
        : fail('money: total money conserved',
          `total drift ${worst} > ${allowed} at day ${at}`);
    }));
    return results;
  }

  if (plugin.type === 'cost_pricing') {
    const tol = plugin.rel_tol ?? 1e-9;
    const safe = (name, fn) => {
      try { return fn(); }
      catch (error) { return fail(name, error.message || String(error)); }
    };
    const nonnegative = (label, column, strictlyPositive) => safe(`${label}: ${column}`, () => {
      const values = ctx.get(column);
      const bad = values.findIndex(v => !Number.isFinite(v) || (strictlyPositive ? v <= 0 : v < 0));
      return bad < 0
        ? pass(`${label}: ${column}`, { points: values.length })
        : fail(`${label}: ${column}`, `${column} = ${values[bad]} at day ${ctx.times[bad]}`);
    });
    const markup = ctx.get(plugin.markup);
    for (const inst of plugin.instances || []) {
      const label = inst.name || inst.colony || 'cost_pricing';
      for (const sig of inst.signals || []) {
        results.push(nonnegative(label, sig.signal, false));
      }
      for (const item of inst.prices || []) {
        results.push(nonnegative(label, item.full_cost, true));
        results.push(nonnegative(label, item.target, true));
      }
      for (const item of inst.cost_prices || []) {
        results.push(nonnegative(label, item.full_cost, true));
        results.push(safe(`${label}: cost price ${item.target}`, () => {
          const actual = ctx.get(item.target), full = ctx.get(item.full_cost);
          let worst = 0, at = null;
          for (let i = 0; i < ctx.times.length; i++) {
            const expected = full[i] * (1 + markup[i]);
            const err = Math.abs(actual[i] - expected) / Math.max(1, Math.abs(expected));
            if (!Number.isFinite(err) || err > worst) {
              worst = err;
              at = ctx.times[i];
            }
          }
          return worst <= tol
            ? pass(`${label}: cost price ${item.target}`, { worstRelativeError: worst })
            : fail(`${label}: cost price ${item.target}`, `relative error ${worst} > ${tol} at day ${at}`);
        }));
      }
    }
    return results;
  }

  if (plugin.type === 'wage_pricing') {
    const specErrors = validateWagePricingSpec(plugin);
    if (specErrors.length) return specErrors.map(e => fail('wage_pricing spec', e));
    const tol = plugin.rel_tol ?? 1e-9;
    const safe = (name, fn) => { try { return fn(); } catch (e) { return fail(name, e.message || String(e)); } };
    for (const inst of plugin.instances || []) {
      const label = inst.name || inst.colony || 'wage_pricing';
      const bound = (column, valid, title) => safe(label + ': ' + title + ' ' + column, () => {
        const values = ctx.get(column);
        if (values.length !== ctx.times.length || !values.length) return fail(label + ': ' + title + ' ' + column, 'series length does not match non-empty time axis');
        const i = values.findIndex(v => !Number.isFinite(v) || !valid(v));
        return i < 0 ? pass(label + ': ' + title + ' ' + column) : fail(label + ': ' + title + ' ' + column, column + ' = ' + values[i] + ' at day ' + ctx.times[i]);
      });
      for (const p of inst.prices) results.push(bound(p.labor_share,v=>v>=0&&v<=1,'labor share in [0,1]'));
      for (const d of inst.demand) {
        results.push(bound(d.reference_price,v=>v>0,'positive reference price'));
        results.push(bound(d.elasticity,v=>v>0,'positive elasticity'));
      }
      const identity = (column, expectedAt, title) => safe(`${label}: ${title} ${column}`, () => {
        const actual = ctx.get(column), inputs = expectedAt.inputs.map(n => ctx.get(n));
        if (!ctx.times.length || [actual,...inputs].some(a=>a.length!==ctx.times.length)) return fail(label + ': ' + title + ' ' + column, 'series length does not match non-empty time axis');
        let worst = 0, when = null;
        for (let i=0; i<ctx.times.length; i++) {
          const expected = expectedAt.fn(...inputs.map(a=>a[i]));
          const err = Math.abs(actual[i]-expected) / Math.max(1, Math.abs(expected));
          if (!Number.isFinite(err) || err>worst) { worst=err; when=ctx.times[i]; }
        }
        return worst<=tol ? pass(`${label}: ${title} ${column}`, {worstRelativeError:worst})
          : fail(`${label}: ${title} ${column}`, `relative error ${worst} > ${tol} at day ${when}`);
      });
      results.push(identity(inst.relative_wage_change, {inputs:[inst.wage,inst.initial_wage],fn:(w,w0)=>w/Math.max(w0,1e-6)-1},'relative wage'));
      for (const q of inst.demand || []) {
        results.push(identity(q.factor,{inputs:[q.price,q.reference_price,q.elasticity],fn:(pr,ref,eta)=>Math.pow(Math.max(pr/ref,1e-6),-eta)},'demand factor'));
      }
      for (const q of inst.prices) results.push(bound(q.target,v=>v>0,'positive price'));
    }
    return results;
  }

  if (plugin.type === 'labor_market') {
    const absTol = plugin.abs_tol ?? 1e-9, relTol = plugin.rel_tol ?? 1e-9;
    const safe = (name, fn) => { try { return fn(); } catch (e) { return fail(name, e.message || String(e)); } };
    const sw = ctx.get(plugin.switch), floor = ctx.get(plugin.floor);
    for (const inst of plugin.instances || []) {
      const label = inst.name || inst.colony || 'labor_market';
      results.push(safe(`${label}: availability in [0,1]`, () => {
        const a=ctx.get(inst.availability); let bad=null;
        for(let i=0;i<ctx.times.length;i++) if(a[i] < -absTol || a[i] > 1 + absTol){bad={time:ctx.times[i],value:a[i]};break;}
        return bad ? fail(`${label}: availability in [0,1]`,`${inst.availability} = ${bad.value} at day ${bad.time}`,bad)
          : pass(`${label}: availability in [0,1]`,{points:ctx.times.length});
      }));
      results.push(safe(`${label}: wage above floor`, () => {
        const w=ctx.get(inst.wage),w0=ctx.get(inst.initial_wage); let bad=null;
        for(let i=0;i<ctx.times.length;i++){const min=floor[i]*w0[i]; if(w[i] < min - absTol){bad={time:ctx.times[i],value:w[i],min};break;}}
        return bad ? fail(`${label}: wage above floor`,`${inst.wage} = ${bad.value} < ${bad.min} at day ${bad.time}`,bad)
          : pass(`${label}: wage above floor`,{points:ctx.times.length});
      }));
      results.push(safe(`${label}: switch-off availability = 1`, () => {
        const a=ctx.get(inst.availability); let worst=0,when=null;
        for(let i=0;i<ctx.times.length;i++) if(sw[i] <= 0.5){const e=Math.abs(a[i]-1);if(e>worst){worst=e;when=ctx.times[i];}}
        return worst <= absTol ? pass(`${label}: switch-off availability = 1`,{maxAbsError:worst,maxTime:when})
          : fail(`${label}: switch-off availability = 1`,`abs error ${worst} > ${absTol} at day ${when}`,{maxAbsError:worst,maxTime:when});
      }));
      for (const d of inst.demand || []) results.push(safe(`${label}: demand identity ${d.target}`, () => {
        const target=ctx.get(d.target),per=ctx.get(d.per_capita),pop=ctx.get(d.population); let worst=0,absWorst=0,when=null;
        for(let i=0;i<ctx.times.length;i++) if(sw[i] > 0.5){const expected=per[i]*pop[i],a=Math.abs(target[i]-expected),r=a/Math.max(Math.abs(expected),1e-12);if(r>worst){worst=r;absWorst=a;when=ctx.times[i];}}
        const name=`${label}: demand identity ${d.target}`;
        return worst <= relTol ? pass(name,{worstRelativeError:worst,worstAbsError:absWorst,worstTime:when})
          : fail(name,`relative error ${worst} > ${relTol} at day ${when}`,{worstRelativeError:worst,worstAbsError:absWorst,worstTime:when});
      }));
    }
    return results;
  }

  if (plugin.type === 'food') {
    const tol = plugin.abs_tol ?? 1e-8;
    const safe = (name, fn) => { try { return fn(); } catch (e) { return fail(name, e.message || String(e)); } };
    for (const inst of plugin.instances || []) {
      const label = inst.name || inst.colony || 'food';
      results.push(safe(`${label}: inventory and flows >= 0`, () => checkNonNegativeColumns(ctx, {
        name: `${label}: inventory and flows >= 0`, abs_tol: tol,
        columns: [inst.inventory, inst.production, inst.consumption, ...(inst.dispatch || []), ...(inst.arrival || [])]
      })));
      results.push(safe(`${label}: fulfillment in [0,1]`, () => {
        const a = ctx.get(inst.fulfillment); let bad = null;
        for (let i = 0; i < ctx.times.length; i++) if (a[i] < -tol || a[i] > 1 + tol) { bad = { time: ctx.times[i], value: a[i] }; break; }
        return bad ? fail(`${label}: fulfillment in [0,1]`, `${inst.fulfillment} = ${bad.value} at day ${bad.time}`, bad)
          : pass(`${label}: fulfillment in [0,1]`, { points: ctx.times.length });
      }));
      results.push(safe(`${label}: consumption <= demand`, () => checkRelation(ctx, {
        name: `${label}: consumption <= demand`, left: inst.consumption, right: inst.demand, op: '<=', abs_tol: tol
      })));
      results.push(safe(`${label}: farm effective capacity <= land`, () => checkRelation(ctx, {
        name: `${label}: farm effective capacity <= land`, left: inst.farm_effective_capacity, right: inst.land, op: '<=', abs_tol: tol
      })));
      results.push(safe(`${label}: production <= farm effective capacity`, () => checkRelation(ctx, {
        name: `${label}: production <= farm effective capacity`, left: inst.production, right: inst.farm_effective_capacity, op: '<=', abs_tol: tol
      })));
    }
    if (plugin.transport) results.push(safe('food: transport load <= max share * capacity', () => {
      const load = ctx.get(plugin.transport.load), capacity = ctx.get(plugin.transport.capacity), share = ctx.get(plugin.transport.max_share);
      let maxError = 0, maxTime = null, bad = null;
      for (let i = 0; i < ctx.times.length; i++) {
        const limit = share[i] * capacity[i], err = load[i] - limit;
        if (err > maxError) { maxError = err; maxTime = ctx.times[i]; }
        if (err > tol && !bad) bad = { time: ctx.times[i], load: load[i], limit };
      }
      return bad ? fail('food: transport load <= max share * capacity', `load ${bad.load} > limit ${bad.limit} at day ${bad.time}`, { maxError, maxTime })
        : pass('food: transport load <= max share * capacity', { maxError, maxTime });
    }));
    return results;
  }

  if (plugin.type === 'population') {
    const tol = plugin.abs_tol ?? 1e-9;
    const safe = (name, fn) => { try { return fn(); } catch (e) { return fail(name, e.message || String(e)); } };
    for (const inst of plugin.instances || []) {
      const label = inst.name || inst.colony || 'population';
      results.push(safe(`${label}: population and demographic flows >= 0`, () => checkNonNegativeColumns(ctx, {
        name: `${label}: population and demographic flows >= 0`, abs_tol: tol,
        columns: [inst.population, inst.births, inst.deaths, ...(inst.immigration || []), ...(inst.emigration || [])]
      })));
      results.push(safe(`${label}: employment <= labor force`, () => checkRelation(ctx, {
        name: `${label}: employment <= labor force`, left: inst.employment, right: inst.labor_force, op: '<=', abs_tol: tol
      })));
      results.push(safe(`${label}: employment <= labor requirement`, () => checkRelation(ctx, {
        name: `${label}: employment <= labor requirement`, left: inst.employment, right: inst.labor_requirement, op: '<=', abs_tol: tol
      })));
      results.push(safe(`${label}: labor force identity`, () => {
        const pop=ctx.get(inst.population), share=ctx.get(inst.participation), lf=ctx.get(inst.labor_force);
        let worst=0,absWorst=0,when=null;
        for(let i=0;i<ctx.times.length;i++){const expected=pop[i]*share[i],a=Math.abs(lf[i]-expected),rel=a/Math.max(Math.abs(expected),1e-12);if(rel>worst){worst=rel;absWorst=a;when=ctx.times[i];}}
        const name=`${label}: labor force identity`;
        return worst<=tol?pass(name,{worstRelativeError:worst,worstAbsError:absWorst,worstTime:when}):fail(name,`relative error ${worst} > ${tol} at day ${when}`,{worstRelativeError:worst,worstAbsError:absWorst,worstTime:when});
      }));
    }
    results.push((() => {
      const name='population: migration conservation';
      try {
        const em=(plugin.instances||[]).flatMap(x=>x.emigration||[]).map(n=>ctx.get(n));
        const im=(plugin.instances||[]).flatMap(x=>x.immigration||[]).map(n=>ctx.get(n));
        let worst=0,when=null,outValue=0,inValue=0;
        for(let i=0;i<ctx.times.length;i++){const a=em.reduce((s,x)=>s+x[i],0),b=im.reduce((s,x)=>s+x[i],0),d=Math.abs(a-b);if(d>worst){worst=d;when=ctx.times[i];outValue=a;inValue=b;}}
        return worst<=tol?pass(name,{maxAbsError:worst,maxTime:when}):fail(name,`migration out ${outValue} != in ${inValue}; abs error ${worst} > ${tol} at day ${when}`,{maxAbsError:worst,maxTime:when});
      } catch(e) { return fail(name,e.message||String(e)); }
    })());
    return results;
  }

  if (plugin.type === 'labor') {
    const tol = plugin.abs_tol ?? 1e-9;
    const safe = (name, fn) => { try { return fn(); } catch (e) { return fail(name, e.message || String(e)); } };
    for (const inst of plugin.instances || []) {
      const label = inst.name || inst.requirement || 'labor';
      results.push(safe(`${label}: automation level in [0,1]`, () => {
        const a=ctx.get(inst.automation_level); let bad=null;
        for(let i=0;i<ctx.times.length;i++) if(a[i]<-tol||a[i]>1+tol){bad={time:ctx.times[i],value:a[i]};break;}
        return bad?fail(`${label}: automation level in [0,1]`,`${inst.automation_level} = ${bad.value} at day ${bad.time}`,bad):pass(`${label}: automation level in [0,1]`,{points:ctx.times.length});
      }));
      results.push(safe(`${label}: automation factor in [min human share,1]`, () => {
        const f=ctx.get(inst.automation_factor),h=ctx.get(plugin.min_human_share);let bad=null;
        for(let i=0;i<ctx.times.length;i++)if(f[i]<h[i]-tol||f[i]>1+tol){bad={time:ctx.times[i],value:f[i],min:h[i]};break;}
        return bad?fail(`${label}: automation factor in [min human share,1]`,`${inst.automation_factor} = ${bad.value} at day ${bad.time}; min=${bad.min}`,bad):pass(`${label}: automation factor in [min human share,1]`,{points:ctx.times.length});
      }));
      results.push(safe(`${label}: labor requirement >= 0`,()=>checkNonNegativeColumns(ctx,{name:`${label}: labor requirement >= 0`,abs_tol:tol,columns:[inst.requirement]})));
      results.push(safe(`${label}: labor product identity`,()=>{
        const o=ctx.get(inst.output),q=ctx.get(inst.intensity),f=ctx.get(inst.automation_factor),r=ctx.get(inst.requirement);let worst=0,absWorst=0,when=null;
        for(let i=0;i<ctx.times.length;i++){const e=o[i]*q[i]*f[i],a=Math.abs(r[i]-e),rel=a/Math.max(1,Math.abs(e));if(rel>worst){worst=rel;absWorst=a;when=ctx.times[i];}}
        const name=`${label}: labor product identity`;return worst<=tol?pass(name,{worstRelativeError:worst,worstAbsError:absWorst,worstTime:when}):fail(name,`relative error ${worst} > ${tol} at day ${when}`,{worstRelativeError:worst,worstAbsError:absWorst,worstTime:when});
      }));
    }
    return results;
  }

  if (plugin.type === 'energy_balance') {
    const tol = plugin.abs_tol ?? 1e-8;
    // consumers: energy users sharing the colony allocator; default = the two v7.2 industries.
    const consumers = plugin.consumers || ['Metal', 'Electronics'];
    for (const c of plugin.colonies || ['A', 'B']) {
      const supply = `${c} Energy Supply`;
      const total = `${c} Total Requested Energy`;
      const unserved = `${c} Energy Unserved Demand`;
      const active = `${c} Power Active Generation Capacity`;
      for (const k of consumers) {
        results.push(checkRelation(ctx, { name: `${c} ${k} allocated <= requested`, left: `${c} ${k} Allocated Energy`, right: `${c} ${k} Requested Energy`, op: '<=', abs_tol: tol }));
      }
      for (const k of plugin.priority || []) {
        results.push(checkRelation(ctx, {
          name: `${c} ${k} priority fulfillment >= general fulfillment`,
          left: `${c} ${k} Energy Fulfillment Ratio`,
          right: `${c} Energy Fulfillment Ratio`,
          op: '>=',
          abs_tol: tol
        }));
      }
      results.push(checkRelation(ctx, { name: `${c} Energy supply <= active generation`, left: supply, right: active, op: '<=', abs_tol: tol }));
      results.push(checkLinearIdentity(ctx, { name: `${c} supply allocation identity`, abs_tol: tol, terms: [
        { column: supply, coef: 1 }, ...consumers.map(k => ({ column: `${c} ${k} Allocated Energy`, coef: -1 }))
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


  if (plugin.type === 'simple_capital') {
    const tol = plugin.abs_tol ?? 1e-8;
    const safe = (name, fn) => { try { return fn(); } catch (e) { return fail(name, e.message || String(e)); } };
    for (const inst of plugin.instances || []) {
      const r = inst.roles || {};
      results.push(safe(`${inst.name}: simple capacity >= 0`, () => checkNonNegativeColumns(ctx, {
        name: `${inst.name}: simple capacity >= 0`, abs_tol: tol, columns: [r.capacity].filter(Boolean)
      })));
      results.push(safe(`${inst.name}: simple flows >= 0`, () => checkNonNegativeColumns(ctx, {
        name: `${inst.name}: simple flows >= 0`, abs_tol: tol,
        columns: [r.expansion, r.depreciation, r.retirement, ...(inst.consumption || [])].filter(Boolean)
      })));
    }
    return results;
  }

  if (plugin.type === 'deposit') {
    const tol = plugin.abs_tol ?? 1e-8;
    const safe = (name, fn) => { try { return fn(); } catch (e) { return fail(name, e.message || String(e)); } };
    for (const inst of plugin.instances || []) {
      results.push(safe(`${inst.name}: deposit stocks >= 0`, () => checkNonNegativeColumns(ctx, { name: `${inst.name}: deposit stocks >= 0`, abs_tol: tol, columns: [inst.undiscovered, inst.proven] })));
      results.push(safe(`${inst.name}: deposit flows >= 0`, () => checkNonNegativeColumns(ctx, { name: `${inst.name}: deposit flows >= 0`, abs_tol: tol, columns: [inst.exploration, ...(inst.consumption || [])] })));
      const prefix = `${inst.name.slice(0, -' Deposit'.length)} Exploration `;
      for (const consumption of inst.consumption || []) {
        const good = consumption.startsWith(prefix) && consumption.endsWith(' Consumption') ? consumption.slice(prefix.length, -' Consumption'.length) : null;
        const parameter = good ? `${inst.resource} Deposit ${good} per Discovery` : null;
        results.push(safe(`${inst.name}: ${good || consumption} consumption identity`, () => {
          if (!parameter) throw new Error(`cannot derive per-Discovery parameter from ${consumption}`);
          const exploration = ctx.get(inst.exploration), expense = ctx.get(consumption), rate = ctx.get(parameter);
          let maxAbs = 0, maxTime = null;
          for (let i = 0; i < ctx.times.length; i++) {
            const err = Math.abs(expense[i] - exploration[i] * rate[i]);
            if (err > maxAbs) { maxAbs = err; maxTime = ctx.times[i]; }
          }
          const name = `${inst.name}: ${good} consumption identity`;
          return maxAbs <= tol ? pass(name, { maxAbsError: maxAbs, maxTime }) : fail(name, `max abs error ${maxAbs} > ${tol} at day ${maxTime}`);
        }));
      }
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
