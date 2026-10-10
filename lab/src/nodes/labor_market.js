// Generator for node type 'labor_market' (task 033, Planet v2 step 3).
// Expansion ordering/formulas intentionally reproduce docs/tasks/033-labor-market-node/reference/labor_market_node_prototype.mjs.
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const isString = x => typeof x === 'string' && x.length > 0;
const isNumber = x => typeof x === 'number' && Number.isFinite(x);
const key = s => String(s).toLowerCase();

const PARAMETER_NAMES = [
  'Metal Demand per Capita',
  'Electronics Demand per Capita',
  'Wage Adjustment Rate',
  'Target Labor Tightness',
  'Wage Floor Share',
  'Labor Demand Signal Time'
];

function unknownFields(obj, allowed, path, errors) {
  if (!isObj(obj)) return;
  for (const k of Object.keys(obj)) if (!allowed.has(k)) errors.push(path + '.' + k + ': unknown field');
}
function required(obj, k, path, errors) {
  if (!isObj(obj) || !(k in obj)) errors.push(path + '.' + k + ': required field is missing');
}
function stringField(obj, k, path, errors) {
  required(obj, k, path, errors);
  if (isObj(obj) && k in obj && !isString(obj[k])) errors.push(path + '.' + k + ': must be a non-empty string');
}

export function validateLaborMarketDeclaration(decl, path, errors) {
  const top = new Set(['type','version','colonies','switch','parameters','inputs','demand','rates']);
  unknownFields(decl, top, path, errors);
  for (const k of top) required(decl, k, path, errors);
  if ('version' in decl && decl.version !== 1) errors.push(path + '.version: must be 1');
  stringField(decl, 'switch', path, errors);

  if (!Array.isArray(decl.colonies) || decl.colonies.length < 2) errors.push(path + '.colonies: must contain at least 2 regions');
  else {
    const seen = new Set();
    for (const [i, c] of decl.colonies.entries()) {
      if (!isString(c)) errors.push(path + '.colonies[' + i + ']: must be a non-empty string');
      else if (seen.has(key(c))) errors.push(path + '.colonies[' + i + ']: duplicate colony "' + c + '"');
      else seen.add(key(c));
    }
  }

  if (!isObj(decl.parameters)) errors.push(path + '.parameters: must be an object');
  else {
    const allowed = new Set(PARAMETER_NAMES);
    unknownFields(decl.parameters, allowed, path + '.parameters', errors);
    for (const name of PARAMETER_NAMES) {
      if (!(name in decl.parameters)) errors.push(path + '.parameters.' + name + ': required field is missing');
      else if (!isNumber(decl.parameters[name])) errors.push(path + '.parameters.' + name + ': must be a finite number');
      else if (!(decl.parameters[name] > 0)) errors.push(path + '.parameters.' + name + ': must be > 0');
    }
  }

  const ip = path + '.inputs';
  if (!isObj(decl.inputs)) errors.push(ip + ': must be an object');
  else {
    const allowed = new Set(['population','population_initial','participation','labor_force','labor_requirement','wage']);
    unknownFields(decl.inputs, allowed, ip, errors);
    for (const k of allowed) stringField(decl.inputs, k, ip, errors);
  }

  if (!Array.isArray(decl.demand) || decl.demand.length === 0) errors.push(path + '.demand: must be a non-empty array');
  else {
    const targets = new Set();
    for (const [i, d] of decl.demand.entries()) {
      const dp = path + '.demand[' + i + ']';
      if (!isObj(d)) { errors.push(dp + ': must be an object'); continue; }
      unknownFields(d, new Set(['target','per_capita']), dp, errors);
      stringField(d, 'target', dp, errors);
      stringField(d, 'per_capita', dp, errors);
      if (isString(d.per_capita) && !PARAMETER_NAMES.includes(d.per_capita)) errors.push(dp + '.per_capita: must name one of parameters');
      if (isString(d.target)) {
        const k = key(d.target);
        if (targets.has(k)) errors.push(dp + '.target: duplicate demand target "' + d.target + '"');
        targets.add(k);
      }
    }
  }

  if (!Array.isArray(decl.rates) || decl.rates.length === 0) errors.push(path + '.rates: must be a non-empty array');
  else {
    const seen = new Set();
    for (const [i, r] of decl.rates.entries()) {
      if (!isString(r)) errors.push(path + '.rates[' + i + ']: must be a non-empty string');
      else if (seen.has(key(r))) errors.push(path + '.rates[' + i + ']: duplicate rate "' + r + '"');
      else seen.add(key(r));
    }
  }
}

export function laborMarketGeneratedNames(decl) {
  const names = [decl.switch, ...Object.keys(decl.parameters || {})];
  for (const X of decl.colonies || []) {
    names.push(
      X + ' Labor Demand Signal',
      X + ' Labor Availability',
      X + ' Labor Demand',
      X + ' Labor Demand Signal Increase',
      X + ' Labor Demand Signal Decrease',
      X + ' Labor Tightness',
      X + ' Initial Wage',
      X + ' Flexible Wage',
      X + ' Wage Increase',
      X + ' Wage Decrease'
    );
    for (const d of decl.demand || []) {
      const target = String(d.target || '').replaceAll('{C}', X);
      names.push(X + ' External ' + target.slice(X.length + 1));
    }
  }
  return names;
}

export function laborMarketReplacementNames(decl) {
  const out = [], sub = (s, X) => String(s).replaceAll('{C}', X);
  for (const X of decl.colonies || []) {
    out.push(sub(decl.inputs?.wage, X));
    for (const d of decl.demand || []) out.push(sub(d.target, X));
    for (const r of decl.rates || []) out.push(sub(r, X));
  }
  return out.filter(Boolean);
}

export function expandLaborMarket(decl, base) {
  const byName = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  const C = decl.colonies, SW = decl.switch, ON = `[${SW}] = 1`, I = decl.inputs;
  const sub = (t, X) => t.replaceAll('{C}', X);
  const must = n => { const e = byName.get(n); if (!e) throw new Error(`labor_market: base element missing: ${n}`); return e; };
  const val = n => { const e = must(n); return String(e.type === 'STOCK' ? e.behavior.initial_value : e.behavior.value); };
  const numericValue = n => {
    const e = must(n), raw = e.type === 'STOCK' ? e.behavior.initial_value : e.behavior.value, v = Number(raw);
    if (!Number.isFinite(v)) throw new Error(`labor_market: ${n} is not a number`);
    return v;
  };
  const add = [], rep = [];
  const V = (name, value, note) => add.push({ type: 'VARIABLE', name, behavior: { value }, description: `Labor market node: ${note || name}.` });
  const S = (name, initial, note) => add.push({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true }, description: `Labor market node: ${note || name}.` });
  const F = (name, from, to, value, note) => add.push({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true }, description: `Labor market node: ${note || name}.` });
  const wrap = (name, fresh, oldRef) => { const old = oldRef ?? val(name); rep.push({ name, value: `IfThenElse(${ON}, ${fresh(`(${old})`)}, ${old})` }); };
  const P = decl.parameters;

  if (byName.has(SW)) throw new Error(`labor_market: switch "${SW}" already exists in base`);
  const requireNumericVariable = (name, sourcePath) => {
    const e = must(name);
    if (e.type !== 'VARIABLE') throw new Error(`labor_market: ${sourcePath} "${name}" must be a VARIABLE`);
    const v = Number(e.behavior?.value);
    if (!Number.isFinite(v)) throw new Error(`labor_market: ${sourcePath} "${name}" is not a numeric constant`);
    return v;
  };
  requireNumericVariable(I.participation, 'inputs.participation');
  for (const X of C) {
    must(sub(I.population, X));
    requireNumericVariable(sub(I.population_initial, X), `inputs.population_initial[${X}]`);
    must(sub(I.labor_force, X));
    must(sub(I.labor_requirement, X));
    requireNumericVariable(sub(I.wage, X), `inputs.wage[${X}]`);
    for (const [i, d] of decl.demand.entries()) {
      const name = sub(d.target, X), e = must(name);
      if (e.type !== 'VARIABLE') throw new Error(`labor_market: demand[${i}].target[${X}] "${name}" must be a VARIABLE`);
      if (e.behavior?.value == null) throw new Error(`labor_market: demand[${i}].target[${X}] "${name}" has no formula/value`);
    }
    for (const [i, r] of decl.rates.entries()) must(sub(r, X));
  }

  V(SW, 0, 'switch of the labor market (0 = every earlier series unchanged)');
  for (const [k, v] of Object.entries(P)) V(k, v, `parameter ${k}`);
  const part = numericValue(I.participation);
  for (const X of C) {
    const lf = `[${sub(I.labor_force, X)}]`, req = `[${sub(I.labor_requirement, X)}]`;
    S(`${X} Labor Demand Signal`, numericValue(sub(I.population_initial, X)) * part, 'smoothed labor demand at unconstrained output');
    V(`${X} Labor Availability`, `IfThenElse(${ON}, Min(1, ${lf} / Max([${X} Labor Demand Signal], 0.000001)), 1)`, 'share of the labor demand the labor force can staff');
    V(`${X} Labor Demand`, `${req} / Max([${X} Labor Availability], 0.000001)`);
    F(`${X} Labor Demand Signal Increase`, null, `${X} Labor Demand Signal`, `Max([${X} Labor Demand] - [${X} Labor Demand Signal], 0) / [Labor Demand Signal Time]`);
    F(`${X} Labor Demand Signal Decrease`, `${X} Labor Demand Signal`, null, `Max([${X} Labor Demand Signal] - [${X} Labor Demand], 0) / [Labor Demand Signal Time]`);
    V(`${X} Labor Tightness`, `[${X} Labor Demand Signal] / Max(${lf}, 0.000001)`, 'labor demand over labor force');
    const wageName = sub(I.wage, X), w0 = numericValue(wageName);
    V(`${X} Initial Wage`, w0, 'wage at the start (floor reference)');
    S(`${X} Flexible Wage`, w0, 'wage that follows labor tightness');
    F(`${X} Wage Increase`, null, `${X} Flexible Wage`, `IfThenElse(${ON}, [${X} Flexible Wage] * [Wage Adjustment Rate] * Max([${X} Labor Tightness] - [Target Labor Tightness], 0) / [Target Labor Tightness], 0)`);
    F(`${X} Wage Decrease`, `${X} Flexible Wage`, null, `IfThenElse(${ON}, [${X} Flexible Wage] * [Wage Adjustment Rate] * Max([Target Labor Tightness] - [${X} Labor Tightness], 0) / [Target Labor Tightness] * Max([${X} Flexible Wage] - [Wage Floor Share] * [${X} Initial Wage], 0) / Max([${X} Flexible Wage], 0.000001), 0)`);
    wrap(wageName, () => `[${X} Flexible Wage]`, `[${X} Initial Wage]`);
    for (const d of decl.demand) {
      const t = sub(d.target, X), oldEl = must(t), raw = oldEl.behavior?.value, n = Number(raw);
      let oldRef = String(raw);
      if (Number.isFinite(n)) {
        const ext = `${X} External ${t.slice(X.length + 1)}`;
        V(ext, n, `former external driver ${t} (kept for the switch-off branch)`);
        oldRef = `[${ext}]`;
      }
      wrap(t, () => `[${d.per_capita}] * [${sub(I.population, X)}]`, oldRef);
    }
    for (const r of decl.rates) wrap(sub(r, X), o => `${o} * [${X} Labor Availability]`);
  }

  for (const e of add) if (byName.has(e.name)) throw new Error(`labor_market: generated name conflicts with base element "${e.name}"`);
  const added = new Map(add.map(e => [e.name, e]));
  const resolve = n => added.get(n) || byName.get(n);
  const have = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const links = [];
  const refs = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  for (const [to, v] of [...add.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...rep.map(r => [r.name, r.value])]) {
    for (const r of refs(v)) {
      const src = resolve(r);
      if (!src) throw new Error(`labor_market: ${to}: unresolved [${r}]`);
      const k = `${src.name}|${to}`;
      if (!have.has(k)) { have.add(k); links.push({ from: src.name, to }); }
    }
  }
  const validation = {
    labor_market_instances: C.map(X => ({
      name: `${X} labor market`, colony: X, availability: `${X} Labor Availability`, labor_force: sub(I.labor_force, X),
      labor_demand_signal: `${X} Labor Demand Signal`, tightness: `${X} Labor Tightness`, wage: `${X} Flexible Wage`, initial_wage: `${X} Initial Wage`,
      rates: decl.rates.map(r => sub(r, X)), demand: decl.demand.map(d => ({ target: sub(d.target, X), per_capita: d.per_capita, population: sub(I.population, X) }))
    })),
    labor_market_switch: SW,
    labor_market_floor: 'Wage Floor Share',
    information_signal_names: ['? Wage Increase', '? Wage Decrease'],
    demand_drivers: {
      parameters: decl.demand.map(d => d.per_capita),
      replaces: decl.demand.map(d => d.target),
      reason: 'Planet v2 (labor market): final demand = per-capita demand x population; the per-capita norms are the external drivers, population is endogenous'
    }
  };
  return { patch: { add_elements: add, replace_formulas: rep, add_links: links }, validation };
}
