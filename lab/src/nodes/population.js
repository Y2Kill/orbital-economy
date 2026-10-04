// Generator for node type `population` (task 029).
// Population is accounting-only in Planet v2 step 1: the economy drives demography,
// while population does not limit output or feed demand back into the economy.
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const isString = x => typeof x === 'string' && x.length > 0;
const isNumber = x => typeof x === 'number' && Number.isFinite(x);
const key = s => String(s).toLowerCase();
const X_ = (s, c) => String(s).replaceAll('{C}', c);

const PARAMETER_NAMES = [
  'Population Birth Rate',
  'Population Base Death Rate',
  'Death Living Standard Sensitivity',
  'Labor Participation Share',
  'Migration Max Rate',
  'Migration Gap Sensitivity',
  'Attractiveness Perception Time',
  'Attractiveness Wage Weight',
  'Attractiveness Jobs Weight',
  'Attractiveness Living Weight',
  'Reference Real Wage'
];
const NON_NEGATIVE_PARAMETERS = new Set([
  'Attractiveness Wage Weight',
  'Attractiveness Jobs Weight',
  'Attractiveness Living Weight'
]);

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
function finiteField(obj, k, path, errors) {
  required(obj, k, path, errors);
  if (isObj(obj) && k in obj && !isNumber(obj[k])) errors.push(path + '.' + k + ': must be a finite number');
}

export function validatePopulationDeclaration(decl, path, errors) {
  const top = new Set(['type', 'version', 'colonies', 'initial', 'parameters', 'inputs']);
  unknownFields(decl, top, path, errors);
  for (const k of top) required(decl, k, path, errors);
  if ('version' in decl && decl.version !== 1) errors.push(path + '.version: must be 1');

  if (!Array.isArray(decl.colonies) || decl.colonies.length < 2) {
    errors.push(path + '.colonies: must contain at least 2 regions');
  } else {
    const seen = new Set();
    for (const [i, c] of decl.colonies.entries()) {
      if (!isString(c)) errors.push(path + '.colonies[' + i + ']: must be a non-empty string');
      else if (seen.has(key(c))) errors.push(path + '.colonies[' + i + ']: duplicate colony "' + c + '"');
      else seen.add(key(c));
    }
  }
  const colonies = Array.isArray(decl.colonies) ? decl.colonies.filter(isString) : [];

  if (!isObj(decl.initial)) errors.push(path + '.initial: must be an object');
  else {
    const allowed = new Set(colonies);
    unknownFields(decl.initial, allowed, path + '.initial', errors);
    for (const c of colonies) {
      if (!(c in decl.initial)) errors.push(path + '.initial.' + c + ': required field is missing');
      else if (!isNumber(decl.initial[c])) errors.push(path + '.initial.' + c + ': must be a finite number');
      else if (!(decl.initial[c] > 0)) errors.push(path + '.initial.' + c + ': must be > 0');
    }
  }

  if (!isObj(decl.parameters)) errors.push(path + '.parameters: must be an object');
  else {
    const allowed = new Set(PARAMETER_NAMES);
    unknownFields(decl.parameters, allowed, path + '.parameters', errors);
    for (const name of PARAMETER_NAMES) {
      if (!(name in decl.parameters)) {
        errors.push(path + '.parameters.' + name + ': required field is missing');
        continue;
      }
      const value = decl.parameters[name];
      if (!isNumber(value)) errors.push(path + '.parameters.' + name + ': must be a finite number');
      else if (NON_NEGATIVE_PARAMETERS.has(name) ? value < 0 : value <= 0) {
        errors.push(path + '.parameters.' + name + ': must be ' + (NON_NEGATIVE_PARAMETERS.has(name) ? '>= 0' : '> 0'));
      }
    }
  }

  const ip = path + '.inputs';
  if (!isObj(decl.inputs)) {
    errors.push(ip + ': must be an object');
    return;
  }
  unknownFields(decl.inputs, new Set(['wage', 'labor_requirement', 'prices', 'living']), ip, errors);
  stringField(decl.inputs, 'wage', ip, errors);
  stringField(decl.inputs, 'labor_requirement', ip, errors);

  if (!Array.isArray(decl.inputs.prices) || decl.inputs.prices.length === 0) {
    errors.push(ip + '.prices: must be a non-empty array');
  } else {
    for (const [i, p] of decl.inputs.prices.entries()) {
      const pp = ip + '.prices[' + i + ']';
      if (!isObj(p)) { errors.push(pp + ': must be an object'); continue; }
      unknownFields(p, new Set(['price', 'reference']), pp, errors);
      stringField(p, 'price', pp, errors);
      stringField(p, 'reference', pp, errors);
    }
  }

  if (!Array.isArray(decl.inputs.living) || decl.inputs.living.length === 0) {
    errors.push(ip + '.living: must be a non-empty array');
  } else {
    const names = new Set();
    for (const [i, l] of decl.inputs.living.entries()) {
      const lp = ip + '.living[' + i + ']';
      if (!isObj(l)) { errors.push(lp + ': must be an object'); continue; }
      unknownFields(l, new Set(['name', 'column', 'weight']), lp, errors);
      stringField(l, 'name', lp, errors);
      stringField(l, 'column', lp, errors);
      finiteField(l, 'weight', lp, errors);
      if (isNumber(l.weight) && l.weight < 0) errors.push(lp + '.weight: must be >= 0');
      if (isString(l.name)) {
        const nk = key(l.name);
        if (names.has(nk)) errors.push(lp + '.name: duplicate living name "' + l.name + '"');
        else names.add(nk);
      }
    }
  }
}

export function populationGeneratedNames(decl) {
  const names = [];
  for (const k of Object.keys(decl.parameters || {})) names.push(k);
  for (const l of decl.inputs?.living || []) if (l?.name) names.push('Living ' + l.name + ' Weight');
  for (const X of decl.colonies || []) {
    names.push(
      X + ' Population Initial',
      X + ' Population',
      X + ' Births',
      X + ' Deaths',
      X + ' Labor Force',
      X + ' Employment',
      X + ' Employment Rate',
      X + ' Unemployment',
      X + ' Labor Shortage',
      X + ' Price Index',
      X + ' Real Wage',
      X + ' Living Standard',
      X + ' Attractiveness',
      X + ' Perceived Attractiveness',
      X + ' Perceived Attractiveness Increase',
      X + ' Perceived Attractiveness Decrease'
    );
  }
  for (const X of decl.colonies || []) for (const Y of decl.colonies || []) {
    if (X === Y) continue;
    names.push('Attractiveness Gap ' + X + ' to ' + Y, 'Migration ' + X + ' to ' + Y);
  }
  names.push('Planet Population');
  return names;
}

export function populationReplacementNames() { return []; }

export function expandPopulation(decl, base) {
  const byName = new Map((base.elements || []).filter(e => e.type !== 'LINK' && e.name).map(e => [key(e.name), e]));
  const links = new Set((base.elements || []).filter(e => e.type === 'LINK').map(e => key(e.from) + '|' + key(e.to)));
  const added = [];
  const need = (name, why) => {
    const e = byName.get(key(name));
    if (!e) throw new Error(why + ' references missing base element "' + name + '"');
    return e;
  };
  const add = el => {
    if (byName.has(key(el.name))) throw new Error('population generated name conflicts with base element "' + el.name + '"');
    el.description = 'Generated population element for ' + el.name + '.';
    added.push(el);
    byName.set(key(el.name), el);
  };
  const V = (name, value) => add({ type: 'VARIABLE', name, behavior: { value } });
  const S = (name, initial) => add({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true } });
  const F = (name, from, to, value) => add({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true } });

  for (const [k, v] of Object.entries(decl.parameters)) V(k, v);
  for (const l of decl.inputs.living) V('Living ' + l.name + ' Weight', l.weight);

  const C = decl.colonies;
  const instances = [];
  for (const X of C) {
    const pop = X + ' Population';
    need(X_(decl.inputs.wage, X), 'inputs.wage[' + X + ']');
    need(X_(decl.inputs.labor_requirement, X), 'inputs.labor_requirement[' + X + ']');
    for (const [i, p] of decl.inputs.prices.entries()) {
      need(X_(p.price, X), 'inputs.prices[' + i + '].price[' + X + ']');
      need(X_(p.reference, X), 'inputs.prices[' + i + '].reference[' + X + ']');
    }
    for (const [i, l] of decl.inputs.living.entries()) need(X_(l.column, X), 'inputs.living[' + i + '].column[' + X + ']');

    V(X + ' Population Initial', decl.initial[X]);
    S(pop, '[' + X + ' Population Initial]');
    F(X + ' Births', null, pop, '[' + pop + '] * [Population Birth Rate]');
    F(X + ' Deaths', pop, null, '[' + pop + '] * [Population Base Death Rate] * Max([' + X + ' Living Standard], 0.05) ^ (-[Death Living Standard Sensitivity])');
    V(X + ' Labor Force', '[' + pop + '] * [Labor Participation Share]');
    const req = X_(decl.inputs.labor_requirement, X);
    V(X + ' Employment', 'Min([' + req + '], [' + X + ' Labor Force])');
    V(X + ' Employment Rate', '[' + X + ' Employment] / ([' + X + ' Labor Force] + 0.000001)');
    V(X + ' Unemployment', 'Max([' + X + ' Labor Force] - [' + req + '], 0)');
    V(X + ' Labor Shortage', 'Max([' + req + '] - [' + X + ' Labor Force], 0)');
    V(X + ' Price Index', '(' + decl.inputs.prices.map(p => '[' + X_(p.price, X) + '] / [' + X_(p.reference, X) + ']').join(' + ') + ') / ' + decl.inputs.prices.length);
    V(X + ' Real Wage', '[' + X_(decl.inputs.wage, X) + '] / [' + X + ' Price Index]');
    V(X + ' Living Standard', decl.inputs.living.map(l => 'Max([' + X_(l.column, X) + '], 0.000001) ^ [Living ' + l.name + ' Weight]').join(' * '));
    V(X + ' Attractiveness', '([' + X + ' Real Wage] / [Reference Real Wage]) ^ [Attractiveness Wage Weight] * Max([' + X + ' Employment Rate], 0.000001) ^ [Attractiveness Jobs Weight] * [' + X + ' Living Standard] ^ [Attractiveness Living Weight]');
    S(X + ' Perceived Attractiveness', 1);
    F(X + ' Perceived Attractiveness Increase', null, X + ' Perceived Attractiveness', 'Max([' + X + ' Attractiveness] - [' + X + ' Perceived Attractiveness], 0) / [Attractiveness Perception Time]');
    F(X + ' Perceived Attractiveness Decrease', X + ' Perceived Attractiveness', null, 'Max([' + X + ' Perceived Attractiveness] - [' + X + ' Attractiveness], 0) / [Attractiveness Perception Time]');
  }

  const migrations = [];
  for (const X of C) for (const Y of C) {
    if (X === Y) continue;
    const gap = 'Attractiveness Gap ' + X + ' to ' + Y;
    V(gap, '([' + Y + ' Perceived Attractiveness] - [' + X + ' Perceived Attractiveness]) / Max(Max([' + X + ' Perceived Attractiveness], [' + Y + ' Perceived Attractiveness]), 0.000001)');
    const flow = 'Migration ' + X + ' to ' + Y;
    F(flow, X + ' Population', Y + ' Population', '[' + X + ' Population] * [Migration Max Rate] * Min(Max([' + gap + '], 0) * [Migration Gap Sensitivity], 1)');
    migrations.push({ from: X, to: Y, flow });
  }
  V('Planet Population', C.map(X => '[' + X + ' Population]').join(' + '));

  const refs = value => [...new Set([...String(value).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  const add_links = [];
  const addLink = (from, to) => {
    const source = byName.get(key(from));
    if (!source) throw new Error('link references missing element "' + from + '"');
    const lk = key(source.name) + '|' + key(to);
    if (links.has(lk)) return;
    links.add(lk);
    add_links.push({ from: source.name, to });
  };
  for (const e of added) {
    const value = e.behavior.value ?? e.behavior.initial_value;
    for (const r of refs(value)) addLink(r, e.name);
  }

  for (const X of C) instances.push({
    name: X + ' population',
    colony: X,
    population: X + ' Population',
    births: X + ' Births',
    deaths: X + ' Deaths',
    immigration: migrations.filter(m => m.to === X).map(m => m.flow),
    emigration: migrations.filter(m => m.from === X).map(m => m.flow),
    labor_force: X + ' Labor Force',
    employment: X + ' Employment',
    labor_requirement: X_(decl.inputs.labor_requirement, X),
    participation: 'Labor Participation Share'
  });

  return {
    patch: { add_elements: added, replace_formulas: [], retarget_flows: [], add_links },
    validation: {
      population_abs_tol: 1e-9,
      population_instances: instances,
      information_signal_names: ['? Perceived Attractiveness Increase', '? Perceived Attractiveness Decrease'],
      demography_births_names: ['? Births'],
      demography_deaths_names: ['? Deaths']
    }
  };
}
