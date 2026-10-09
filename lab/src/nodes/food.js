// Generator for node type 'food' (task 031, Planet v2 step 2).
// Expansion formulas and ordering intentionally reproduce docs/tasks/031-food-node/reference/food_node_prototype.mjs.
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const isString = x => typeof x === 'string' && x.length > 0;
const isNumber = x => typeof x === 'number' && Number.isFinite(x);
const key = s => String(s).toLowerCase();

const PARAMETER_NAMES = [
  'Food Need per Capita',
  'Food Energy per Unit',
  'Food Labor per Unit',
  'Food Freight Weight per Unit',
  'Food Transport Max Share',
  'Farm Capital Goods per Capacity',
  'Farm Depreciation Rate',
  'Farm Capacity Adjustment Time',
  'Farm Desired Capacity Margin',
  'Food Target Coverage Days',
  'Food Inventory Adjustment Time',
  'Food Buffer Days',
  'Food Demand Signal Time',
  'Food Production Signal Time',
  'Food Export Release Time',
  'Food Price Reference',
  'Food Price Elasticity',
  'Famine Death Sensitivity',
  'Living Food Weight',
  'Living Energy Weight With Food'
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
function objectField(obj, k, path, errors) {
  required(obj, k, path, errors);
  if (!isObj(obj?.[k])) errors.push(path + '.' + k + ': must be an object');
}
function stringArray(value, path, errors, { nonEmpty = true } = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0)) {
    errors.push(path + ': must be ' + (nonEmpty ? 'a non-empty array' : 'an array'));
    return;
  }
  for (const [i, v] of value.entries()) if (!isString(v)) errors.push(path + '[' + i + ']: must be a non-empty string');
}

export function validateFoodDeclaration(decl, path, errors) {
  const top = new Set(['type','version','colonies','switch','land','parameters','inputs','transport','people']);
  unknownFields(decl, top, path, errors);
  for (const k of top) required(decl, k, path, errors);
  if ('version' in decl && decl.version !== 1) errors.push(path + '.version: must be 1');
  stringField(decl, 'switch', path, errors);

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

  if (!isObj(decl.land)) errors.push(path + '.land: must be an object');
  else {
    const allowed = new Set(colonies);
    unknownFields(decl.land, allowed, path + '.land', errors);
    for (const c of colonies) {
      if (!(c in decl.land)) errors.push(path + '.land.' + c + ': required field is missing');
      else if (!isNumber(decl.land[c])) errors.push(path + '.land.' + c + ': must be a finite number');
      else if (!(decl.land[c] > 0)) errors.push(path + '.land.' + c + ': must be > 0');
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
    unknownFields(decl.inputs, new Set(['population','population_initial','capital_goods','energy','labor_total','travel_time']), ip, errors);
    stringField(decl.inputs, 'population', ip, errors);
    stringField(decl.inputs, 'population_initial', ip, errors);
    stringField(decl.inputs, 'labor_total', ip, errors);
    stringField(decl.inputs, 'travel_time', ip, errors);
    objectField(decl.inputs, 'capital_goods', ip, errors);
    if (isObj(decl.inputs.capital_goods)) {
      const p = ip + '.capital_goods';
      unknownFields(decl.inputs.capital_goods, new Set(['inventory','demand','fulfillment']), p, errors);
      for (const k of ['inventory','demand','fulfillment']) stringField(decl.inputs.capital_goods, k, p, errors);
    }
    objectField(decl.inputs, 'energy', ip, errors);
    if (isObj(decl.inputs.energy)) {
      const p = ip + '.energy';
      unknownFields(decl.inputs.energy, new Set(['total_request','supply','priority_request','priority_fulfillment','fulfillment']), p, errors);
      for (const k of ['total_request','supply','priority_request','priority_fulfillment','fulfillment']) stringField(decl.inputs.energy, k, p, errors);
    }
  }

  const tp = path + '.transport';
  if (!isObj(decl.transport)) errors.push(tp + ': must be an object');
  else {
    unknownFields(decl.transport, new Set(['capacity','capacity_readers','load_readers']), tp, errors);
    stringField(decl.transport, 'capacity', tp, errors);
    stringArray(decl.transport.capacity_readers, tp + '.capacity_readers', errors);
    if (!Array.isArray(decl.transport.load_readers) || decl.transport.load_readers.length === 0) errors.push(tp + '.load_readers: must be a non-empty array');
    else for (const [i, r] of decl.transport.load_readers.entries()) {
      const rp = tp + '.load_readers[' + i + ']';
      if (!isObj(r)) { errors.push(rp + ': must be an object'); continue; }
      unknownFields(r, new Set(['name','term']), rp, errors);
      stringField(r, 'name', rp, errors);
      stringField(r, 'term', rp, errors);
    }
  }

  const hp = path + '.people';
  if (!isObj(decl.people)) errors.push(hp + ': must be an object');
  else {
    unknownFields(decl.people, new Set(['living','living_columns','deaths','births','price_index']), hp, errors);
    for (const k of ['living','deaths','births']) stringField(decl.people, k, hp, errors);
    if (!Array.isArray(decl.people.living_columns) || decl.people.living_columns.length === 0) errors.push(hp + '.living_columns: must be a non-empty array');
    else for (const [i, c] of decl.people.living_columns.entries()) {
      const cp = hp + '.living_columns[' + i + ']';
      if (!isObj(c)) { errors.push(cp + ': must be an object'); continue; }
      unknownFields(c, new Set(['column','weight']), cp, errors);
      stringField(c, 'column', cp, errors);
      stringField(c, 'weight', cp, errors);
      if (isString(c.weight) && !PARAMETER_NAMES.includes(c.weight)) errors.push(cp + '.weight: must name one of parameters');
    }
    objectField(decl.people, 'price_index', hp, errors);
    if (isObj(decl.people.price_index)) {
      const pp = hp + '.price_index';
      unknownFields(decl.people.price_index, new Set(['name','terms']), pp, errors);
      stringField(decl.people.price_index, 'name', pp, errors);
      required(decl.people.price_index, 'terms', pp, errors);
      if ('terms' in decl.people.price_index && (!Number.isInteger(decl.people.price_index.terms) || decl.people.price_index.terms < 1)) {
        errors.push(pp + '.terms: must be an integer >= 1');
      }
    }
  }
}

export function foodGeneratedNames(decl) {
  const names = [decl.switch, ...Object.keys(decl.parameters || {})];
  const C = decl.colonies || [];
  for (const X of C) names.push(X + ' Farm Land Capacity');
  for (const X of C) names.push(
    X + ' Food Demand',
    X + ' Food Inventory',
    X + ' Food Demand Signal',
    X + ' Food Demand Signal Increase',
    X + ' Food Demand Signal Decrease',
    X + ' Food Coverage Days',
    X + ' Food Fulfillment',
    X + ' Food Consumption',
    X + ' Food Production Signal',
    X + ' Food Production Signal Increase',
    X + ' Food Production Signal Decrease',
    X + ' Farm Capacity',
    X + ' Farm Effective Capacity',
    X + ' Farm Desired Capacity',
    X + ' Farm Desired Expansion',
    X + ' Farm Expansion',
    X + ' Farm Capital Goods Consumption',
    X + ' Farm Depreciation',
    X + ' Farming Requested Energy',
    X + ' Farming Allocated Energy',
    X + ' Farming Energy Fulfillment Ratio',
    X + ' Food Production',
    X + ' Farming Labor Requirement',
    X + ' Food Price',
    X + ' Desired Food Production',
    X + ' Food Import Need',
    X + ' Food Exportable'
  );
  const pairs = C.flatMap(X => C.filter(Y => Y !== X).map(Y => [X,Y]));
  for (const [X,Y] of pairs) names.push(
    X + ' to ' + Y + ' Food Export Signal',
    X + ' to ' + Y + ' Food Export Signal Increase',
    X + ' to ' + Y + ' Food Export Signal Decrease',
    'Food Requested Dispatch ' + X + ' to ' + Y,
    'Food Cargo ' + X + ' to ' + Y
  );
  names.push('Food Transport Capacity', 'Food Transport Scale');
  for (const [X,Y] of pairs) names.push('Food Dispatch ' + X + ' to ' + Y, 'Food Arrival ' + X + ' to ' + Y);
  names.push('Food Transport Load', 'Transport Goods Capacity', 'Planet Food Production');
  return names;
}

export function foodReplacementNames(decl) {
  const out = [];
  const I = decl.inputs || {}, H = decl.people || {}, T = decl.transport || {};
  const sub = (s, X) => String(s).replaceAll('{C}', X);
  for (const X of decl.colonies || []) {
    out.push(
      sub(I.energy?.total_request, X),
      sub(I.energy?.supply, X),
      sub(I.energy?.priority_request, X),
      sub(I.capital_goods?.demand, X),
      sub(I.labor_total, X),
      sub(H.living, X),
      sub(H.deaths, X),
      sub(H.births, X),
      sub(H.price_index?.name, X)
    );
  }
  out.push(...(T.capacity_readers || []), ...(T.load_readers || []).map(r => r.name));
  return out.filter(x => x && x !== 'undefined');
}

export function expandFood(decl, base) {
  const byName = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  const C = decl.colonies, SW = decl.switch, ON = `[${SW}] = 1`;
  const sub = (t, X) => t.replaceAll('{C}', X);
  const must = n => { const e = byName.get(n); if (!e) throw new Error(`food: base element missing: ${n}`); return e; };
  const val = n => { const e = must(n); return e.type === 'STOCK' ? String(e.behavior.initial_value) : String(e.behavior.value); };
  const num = n => { const v = Number(val(n)); if (!Number.isFinite(v)) throw new Error(`food: ${n} is not a number`); return v; };
  const add = [], rep = [];
  const V = (name, value, note) => add.push({ type: 'VARIABLE', name, behavior: { value }, description: `Food node: ${note || name}.` });
  const S = (name, initial, note) => add.push({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true }, description: `Food node: ${note || name}.` });
  const F = (name, from, to, value, note) => add.push({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true }, description: `Food node: ${note || name}.` });
  const wrap = (name, fresh) => rep.push({ name, value: `IfThenElse(${ON}, ${fresh(`(${val(name)})`)}, ${val(name)})` });
  const P = decl.parameters, I = decl.inputs, T = decl.transport, H = decl.people;
  const needPath = (name, sourcePath) => {
    const e = byName.get(name);
    if (!e) throw new Error('food: ' + sourcePath + ' references missing base element "' + name + '"');
    return e;
  };
  if (byName.has(SW)) throw new Error('food: switch "' + SW + '" already exists in base');
  for (const X of C) {
    needPath(sub(I.population, X), 'inputs.population[' + X + ']');
    needPath(sub(I.population_initial, X), 'inputs.population_initial[' + X + ']');
    needPath(sub(I.capital_goods.inventory, X), 'inputs.capital_goods.inventory[' + X + ']');
    needPath(sub(I.capital_goods.demand, X), 'inputs.capital_goods.demand[' + X + ']');
    needPath(sub(I.capital_goods.fulfillment, X), 'inputs.capital_goods.fulfillment[' + X + ']');
    needPath(sub(I.energy.total_request, X), 'inputs.energy.total_request[' + X + ']');
    needPath(sub(I.energy.supply, X), 'inputs.energy.supply[' + X + ']');
    needPath(sub(I.energy.priority_request, X), 'inputs.energy.priority_request[' + X + ']');
    needPath(sub(I.energy.priority_fulfillment, X), 'inputs.energy.priority_fulfillment[' + X + ']');
    needPath(sub(I.energy.fulfillment, X), 'inputs.energy.fulfillment[' + X + ']');
    needPath(sub(I.labor_total, X), 'inputs.labor_total[' + X + ']');
    needPath(sub(H.living, X), 'people.living[' + X + ']');
    needPath(sub(H.deaths, X), 'people.deaths[' + X + ']');
    needPath(sub(H.births, X), 'people.births[' + X + ']');
    needPath(sub(H.price_index.name, X), 'people.price_index.name[' + X + ']');
    for (const [i, col] of H.living_columns.entries()) needPath(sub(col.column, X), 'people.living_columns[' + i + '].column[' + X + ']');
  }
  needPath(I.travel_time, 'inputs.travel_time');
  needPath(T.capacity, 'transport.capacity');
  for (const [i, name] of T.capacity_readers.entries()) needPath(name, 'transport.capacity_readers[' + i + ']');
  for (const [i, r] of T.load_readers.entries()) needPath(r.name, 'transport.load_readers[' + i + '].name');

  // parameters, switch and land
  V(SW, 0, 'switch of the food layer (0 = every earlier series unchanged)');
  for (const [k, v] of Object.entries(P)) V(k, v, `parameter ${k}`);
  for (const X of C) V(`${X} Farm Land Capacity`, decl.land[X], `farm land of region ${X} (soft cap of its farms)`);

  // start state: each region farms toward its need; the land-limited shortfall is shipped by the region with room
  const pop0 = Object.fromEntries(C.map(X => [X, num(sub(I.population_initial, X))]));
  const eff = (c, l) => c / (1 + (c / l) ** 8) ** 0.125;
  const farm0 = {}, prod0 = {}, short0 = {};
  for (const X of C) { farm0[X] = Math.min(pop0[X] * 1.05, decl.land[X]); prod0[X] = eff(farm0[X], decl.land[X]); short0[X] = Math.max(pop0[X] - prod0[X], 0); }
  const totalShort = C.reduce((s, X) => s + short0[X], 0);
  const room = Object.fromEntries(C.map(X => [X, short0[X] > 0 ? 0 : decl.land[X] - farm0[X]]));
  const totalRoom = C.reduce((s, X) => s + room[X], 0) || 1;
  const exp0 = Object.fromEntries(C.map(X => [X, totalShort * room[X] / totalRoom]));   // what X ships at start
  for (const X of C) if (exp0[X] > 0) { farm0[X] = Math.min((pop0[X] + exp0[X]) * 1.05, decl.land[X]); prod0[X] = pop0[X] + exp0[X]; }
  const TT = num(I.travel_time);

  for (const X of C) {
    const pop = `[${sub(I.population, X)}]`;
    V(`${X} Food Demand`, `IfThenElse(${ON}, ${pop} * [Food Need per Capita], 0)`, 'population x need per capita');
    S(`${X} Food Inventory`, pop0[X] * P['Food Target Coverage Days']);
    S(`${X} Food Demand Signal`, pop0[X]);
    F(`${X} Food Demand Signal Increase`, null, `${X} Food Demand Signal`, `Max([${X} Food Demand] - [${X} Food Demand Signal], 0) / [Food Demand Signal Time]`);
    F(`${X} Food Demand Signal Decrease`, `${X} Food Demand Signal`, null, `Max([${X} Food Demand Signal] - [${X} Food Demand], 0) / [Food Demand Signal Time]`);
    V(`${X} Food Coverage Days`, `[${X} Food Inventory] / ([${X} Food Demand] + 0.000001)`);
    V(`${X} Food Fulfillment`, `IfThenElse(${ON}, Min([${X} Food Coverage Days] / [Food Buffer Days], 1), 1)`, 'share of the need served (buffer days of stock = 1)');
    F(`${X} Food Consumption`, `${X} Food Inventory`, null, `[${X} Food Demand] * [${X} Food Fulfillment]`, 'food eaten');
    S(`${X} Food Production Signal`, prod0[X], 'smoothed production plan (energy request signal)');
    F(`${X} Food Production Signal Increase`, null, `${X} Food Production Signal`, `Max([${X} Desired Food Production] - [${X} Food Production Signal], 0) / [Food Production Signal Time]`);
    F(`${X} Food Production Signal Decrease`, `${X} Food Production Signal`, null, `Max([${X} Food Production Signal] - [${X} Desired Food Production], 0) / [Food Production Signal Time]`);
    S(`${X} Farm Capacity`, farm0[X], 'farm capacity (capital)');
    V(`${X} Farm Effective Capacity`, `[${X} Farm Capacity] / (1 + ([${X} Farm Capacity] / ([${X} Farm Land Capacity] + 0.001)) ^ 8) ^ 0.125`, 'farm capacity softly capped by land');
    V(`${X} Farm Desired Capacity`, `Min([${X} Food Production Signal] * [Farm Desired Capacity Margin], [${X} Farm Land Capacity])`);
    V(`${X} Farm Desired Expansion`, `IfThenElse(${ON}, Max([${X} Farm Desired Capacity] - [${X} Farm Capacity], 0) / [Farm Capacity Adjustment Time], 0)`);
    F(`${X} Farm Expansion`, null, `${X} Farm Capacity`, `[${X} Farm Desired Expansion] * [${sub(I.capital_goods.fulfillment, X)}]`, 'farm capacity built from capital goods');
    F(`${X} Farm Capital Goods Consumption`, sub(I.capital_goods.inventory, X), null, `[${X} Farm Expansion] * [Farm Capital Goods per Capacity]`, 'capital goods used to build farms');
    F(`${X} Farm Depreciation`, `${X} Farm Capacity`, null, `IfThenElse(${ON}, [${X} Farm Capacity] * [Farm Depreciation Rate], 0)`);
    V(`${X} Farming Requested Energy`, `IfThenElse(${ON}, [${X} Food Production Signal] * [Food Energy per Unit], 0)`, 'energy request of farms, served in the priority group');
    V(`${X} Farming Allocated Energy`, `[${X} Farming Requested Energy] * [${sub(I.energy.priority_fulfillment, X)}]`);
    V(`${X} Farming Energy Fulfillment Ratio`, `IfThenElse([${X} Farming Requested Energy] > 0.001, [${X} Farming Allocated Energy] / [${X} Farming Requested Energy], 1)`);
    F(`${X} Food Production`, null, `${X} Food Inventory`, `IfThenElse(${ON}, Min([${X} Desired Food Production], [${X} Farm Effective Capacity]) * [${X} Farming Energy Fulfillment Ratio], 0)`, 'food grown');
    V(`${X} Farming Labor Requirement`, `[${X} Food Production] * [Food Labor per Unit]`);
    V(`${X} Food Price`, `[Food Price Reference] * ([Food Target Coverage Days] / Max([${X} Food Coverage Days], 1)) ^ [Food Price Elasticity]`, 'scarcity price of food');
  }
  // trade by need between every ordered pair
  for (const X of C) {
    const others = C.filter(Y => Y !== X);
    const exportSignals = others.map(Y => `[${X} to ${Y} Food Export Signal]`).join(' + ');
    V(`${X} Desired Food Production`, `IfThenElse(${ON}, Max([${X} Food Demand Signal] + ${exportSignals} + ([Food Target Coverage Days] * [${X} Food Demand Signal] - [${X} Food Inventory]) / [Food Inventory Adjustment Time], 0), 0)`, 'own need + partners\' orders + stock correction');
    const inbound = others.map(Y => `[Food Cargo ${Y} to ${X}]`).join(' - ');
    V(`${X} Food Import Need`, `IfThenElse(${ON}, Max([${X} Food Demand Signal] - [${X} Farm Effective Capacity] + ([Food Target Coverage Days] * [${X} Food Demand Signal] - [${X} Food Inventory] - ${inbound}) / [Food Inventory Adjustment Time], 0), 0)`, 'what the region lacks');
    V(`${X} Food Exportable`, `Max([${X} Food Inventory] - 0.5 * [Food Target Coverage Days] * [${X} Food Demand Signal], 0) / [Food Export Release Time]`, 'stock above half the target, released over the export time');
  }
  const pairs = C.flatMap(X => C.filter(Y => Y !== X).map(Y => [X, Y]));
  const share = n => C.length === 2 ? `[${n} Food Import Need]` : `[${n} Food Import Need] / ${C.length - 1}`;
  for (const [X, Y] of pairs) {
    S(`${X} to ${Y} Food Export Signal`, exp0[X] && short0[Y] ? exp0[X] * short0[Y] / totalShort : 0, `orders of ${Y} seen by ${X}`);
    F(`${X} to ${Y} Food Export Signal Increase`, null, `${X} to ${Y} Food Export Signal`, `Max(${share(Y)} - [${X} to ${Y} Food Export Signal], 0) / [Food Production Signal Time]`);
    F(`${X} to ${Y} Food Export Signal Decrease`, `${X} to ${Y} Food Export Signal`, null, `Max([${X} to ${Y} Food Export Signal] - ${share(Y)}, 0) / [Food Production Signal Time]`);
    V(`Food Requested Dispatch ${X} to ${Y}`, `Min(${share(Y)}, [${X} Food Exportable] / ${C.length - 1})`);
    S(`Food Cargo ${X} to ${Y}`, (exp0[X] && short0[Y] ? exp0[X] * short0[Y] / totalShort : 0) * TT, `food in transit ${X} -> ${Y}`);
  }
  V('Food Transport Capacity', `[Food Transport Max Share] * [${T.capacity}] / [Food Freight Weight per Unit]`, 'food may take up to this share of the shared transport');
  V('Food Transport Scale', `Min(1, [Food Transport Capacity] / (${pairs.map(([X, Y]) => `[Food Requested Dispatch ${X} to ${Y}]`).join(' + ')} + 0.000001))`);
  for (const [X, Y] of pairs) {
    F(`Food Dispatch ${X} to ${Y}`, `${X} Food Inventory`, `Food Cargo ${X} to ${Y}`, `[Food Requested Dispatch ${X} to ${Y}] * [Food Transport Scale]`);
    F(`Food Arrival ${X} to ${Y}`, `Food Cargo ${X} to ${Y}`, `${Y} Food Inventory`, `[Food Cargo ${X} to ${Y}] / [${I.travel_time}]`);
  }
  V('Food Transport Load', `(${pairs.map(([X, Y]) => `[Food Dispatch ${X} to ${Y}]`).join(' + ')}) * [Food Freight Weight per Unit]`, 'shared-transport load of food (goes first)');
  V('Transport Goods Capacity', `Max([${T.capacity}] - [Food Transport Load], 0)`, 'shared transport left for goods after food');
  V('Planet Food Production', C.map(X => `[${X} Food Production]`).join(' + '));

  // replacements, all switch-wrapped
  for (const X of C) {
    wrap(sub(I.energy.total_request, X), o => `${o} + [${X} Farming Requested Energy]`);
    wrap(sub(I.energy.supply, X), o => `${o} + [${X} Farming Allocated Energy]`);
    wrap(sub(I.energy.priority_request, X), o => `${o} + [${X} Farming Requested Energy]`);
    wrap(sub(I.capital_goods.demand, X), o => `${o} + [${X} Farm Desired Expansion] * [Farm Capital Goods per Capacity]`);
    wrap(sub(I.labor_total, X), o => `${o} + [${X} Farming Labor Requirement]`);
    wrap(sub(H.living, X), () => [`Max([${X} Food Fulfillment], 0.000001) ^ [Living Food Weight]`, ...H.living_columns.map(c => `Max([${sub(c.column, X)}], 0.000001) ^ [${c.weight}]`)].join(' * '));
    wrap(sub(H.deaths, X), o => `${o} * Max([${X} Food Fulfillment], 0.05) ^ (-[Famine Death Sensitivity])`);
    wrap(sub(H.births, X), o => `${o} * [${X} Food Fulfillment]`);
    wrap(sub(H.price_index.name, X), o => `(${o} * ${H.price_index.terms} + [${X} Food Price] / [Food Price Reference]) / ${H.price_index.terms + 1}`);
  }
  for (const n of T.capacity_readers) { if (!val(n).includes(`[${T.capacity}]`)) throw new Error(`food: ${n} does not read ${T.capacity}`); wrap(n, o => o.replaceAll(`[${T.capacity}]`, '[Transport Goods Capacity]')); }
  for (const r of T.load_readers) { if (!val(r.name).includes(r.term)) throw new Error(`food: ${r.name} does not read ${r.term}`); wrap(r.name, o => o.replaceAll(r.term, `(${r.term} + [Food Transport Load])`)); }

  // links: every reference of added and replaced formulas, without duplicates or existing links
  const added = new Map(add.map(e => [e.name, e]));
  for (const e of add) if (byName.has(e.name)) throw new Error(`food: generated name conflicts with base element "${e.name}"`);
  const resolve = n => added.get(n) || byName.get(n);
  const have = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const links = [];
  const refs = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  for (const [to, v] of [...add.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...rep.map(r => [r.name, r.value])]) {
    for (const r of refs(v)) { const src = resolve(r); if (!src) throw new Error(`food: ${to}: unresolved [${r}]`); const k = `${src.name}|${to}`; if (!have.has(k)) { have.add(k); links.push({ from: src.name, to }); } }
  }

  // validation fragments
  const validation = {
    food_instances: C.map(X => ({
      name: `${X} food`, colony: X, inventory: `${X} Food Inventory`, production: `${X} Food Production`, consumption: `${X} Food Consumption`,
      demand: `${X} Food Demand`, fulfillment: `${X} Food Fulfillment`, farm_capacity: `${X} Farm Capacity`, farm_effective_capacity: `${X} Farm Effective Capacity`,
      land: `${X} Farm Land Capacity`, dispatch: C.filter(Y => Y !== X).map(Y => `Food Dispatch ${X} to ${Y}`), arrival: C.filter(Y => Y !== X).map(Y => `Food Arrival ${Y} to ${X}`)
    })),
    food_transport: { load: 'Food Transport Load', capacity: T.capacity, max_share: 'Food Transport Max Share' },
    energy_balance_consumers: ['Farming'],
    energy_balance_priority: ['Farming'],
    agriculture_names: ['? Food Production'],
    final_consumption_names: ['? Food Consumption'],
    capital_transformation_names: ['? Farm Expansion', '? Farm Capital Goods Consumption'],
    capital_retirement_names: ['? Farm Depreciation'],
    transformation_pairs: C.map(X => ({ source: `${X} Farm Expansion`, sinks: [`${X} Farm Capital Goods Consumption`], identity: `${X} Farm capital goods pair identity` })),
    planet_process: {
      id: 'farming', kind: 'transformation', output: '{C} Food Production',
      capacity: { kind: 'simple', stock: '{C} Farm Capacity' },
      energy: { kind: 'requests', request: '{C} Farming Requested Energy', signal: '{C} Food Production Signal', fulfillment: I.energy.priority_fulfillment },
      labor: { kind: 'declared', intensity: 'Food Labor per Unit', requirement: '{C} Farming Labor Requirement' }
    },
    planet_process_category: 'agriculture'
  };
  return { patch: { add_elements: add, replace_formulas: rep, add_links: links }, validation };
}
