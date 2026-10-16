// Cost pricing node generator (task 038).
// The element, replacement and link order follows the reference expansion.
// Declaration validation is separate from expansion, as with labor_market.

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isString = value => typeof value === 'string' && value.trim().length > 0;
const isPositive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
const fold = value => String(value).toLowerCase();
const substitute = (template, colony) => template.replaceAll('{C}', colony);

function unknownFields(value, allowed, path, errors) {
  if (!isObject(value)) return;
  for (const field of Object.keys(value)) {
    if (!allowed.includes(field)) errors.push(`${path}.${field}: unknown field`);
  }
}

function requiredString(value, field, path, errors) {
  if (!isObject(value) || !Object.hasOwn(value, field)) {
    errors.push(`${path}.${field}: required field is missing`);
  } else if (!isString(value[field])) {
    errors.push(`${path}.${field}: must be a non-empty string`);
  }
}

function colonyValues(value, colonies, path, errors) {
  if (!isObject(value)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  unknownFields(value, colonies, path, errors);
  for (const colony of colonies) {
    if (!isPositive(value[colony])) errors.push(`${path}.${colony}: must be finite and > 0`);
  }
}

function uniqueName(value, seen, path, errors) {
  if (!isString(value)) return;
  const key = fold(value);
  if (seen.has(key)) errors.push(`${path}: duplicate "${value}"`);
  seen.add(key);
}

export function validateCostPricingDeclaration(decl, path, errors) {
  const top = ['type','version','colonies','switch','parameters','inputs','signals',
    'wear_signals','costs','prices','markups','references','price_index'];
  unknownFields(decl, top, path, errors);
  for (const field of top) {
    if (!Object.hasOwn(decl, field)) errors.push(`${path}.${field}: required field is missing`);
  }
  if (decl.version !== 1) errors.push(`${path}.version: must be 1`);
  requiredString(decl, 'switch', path, errors);

  const colonies = Array.isArray(decl.colonies) ? decl.colonies : [];
  if (colonies.length < 2) errors.push(`${path}.colonies: must have at least 2 regions`);
  const colonyNames = new Set();
  for (const [i, colony] of colonies.entries()) {
    if (!isString(colony)) errors.push(`${path}.colonies[${i}]: must be a non-empty string`);
    else uniqueName(colony, colonyNames, `${path}.colonies[${i}]`, errors);
  }

  const parameters = ['Universal Markup', 'Cost Price Signal Time'];
  if (!isObject(decl.parameters)) errors.push(`${path}.parameters: expected object`);
  else {
    unknownFields(decl.parameters, parameters, `${path}.parameters`, errors);
    for (const name of parameters) {
      if (!isPositive(decl.parameters[name])) errors.push(`${path}.parameters.${name}: must be finite and > 0`);
    }
  }
  if (!isObject(decl.inputs)) errors.push(`${path}.inputs: expected object`);
  else {
    unknownFields(decl.inputs, ['wage'], `${path}.inputs`, errors);
    requiredString(decl.inputs, 'wage', `${path}.inputs`, errors);
  }

  const signalNames = new Set();
  if (!Array.isArray(decl.signals) || !decl.signals.length) errors.push(`${path}.signals: non-empty array required`);
  else for (const [i, item] of decl.signals.entries()) {
    const p = `${path}.signals[${i}]`;
    if (!isObject(item)) { errors.push(`${p}: expected object`); continue; }
    unknownFields(item, ['name','source','initial'], p, errors);
    requiredString(item, 'name', p, errors);
    requiredString(item, 'source', p, errors);
    uniqueName(item.name, signalNames, `${p}.name`, errors);
    colonyValues(item.initial, colonies, `${p}.initial`, errors);
  }

  if (!isObject(decl.wear_signals)) errors.push(`${path}.wear_signals: expected object`);
  else {
    unknownFields(decl.wear_signals, ['capital_goods','construction_materials'], `${path}.wear_signals`, errors);
    for (const k of ['capital_goods','construction_materials']) {
      requiredString(decl.wear_signals, k, `${path}.wear_signals`, errors);
      if (isString(decl.wear_signals[k]) && !signalNames.has(fold(decl.wear_signals[k])))
        errors.push(`${path}.wear_signals.${k}: unknown signal "${decl.wear_signals[k]}"`);
    }
  }

  const costNames = new Set();
  if (!Array.isArray(decl.costs) || !decl.costs.length) errors.push(`${path}.costs: non-empty array required`);
  else for (const [i, item] of decl.costs.entries()) {
    const p = `${path}.costs[${i}]`;
    if (!isObject(item)) { errors.push(`${p}: expected object`); continue; }
    unknownFields(item, ['name','extend','cost_price','inputs','labor','automation','wear','rent'], p, errors);
    requiredString(item, 'name', p, errors);
    uniqueName(item.name, costNames, `${p}.name`, errors);
    if (item.cost_price !== undefined && item.cost_price !== true) errors.push(`${p}.cost_price: must be true`);
    if (item.extend !== undefined) {
      requiredString(item, 'extend', p, errors);
      for (const k of ['inputs','labor','automation','rent','cost_price']) {
        if (k in item) errors.push(`${p}.${k}: forbidden with extend`);
      }
      if (!item.wear) errors.push(`${p}.wear: required with extend`);
    } else {
      if (!Array.isArray(item.inputs)) errors.push(`${p}.inputs: expected array`);
      else for (const [j, q] of item.inputs.entries()) {
        const qp = `${p}.inputs[${j}]`;
        if (!isObject(q)) { errors.push(`${qp}: expected object`); continue; }
        unknownFields(q, ['per_unit','signal'], qp, errors);
        requiredString(q, 'per_unit', qp, errors);
        requiredString(q, 'signal', qp, errors);
        if (isString(q.signal) && !signalNames.has(fold(q.signal))) errors.push(`${qp}.signal: unknown signal "${q.signal}"`);
      }
      for (const k of ['labor','automation','rent']) {
        if (item[k] !== undefined) requiredString(item, k, p, errors);
      }
    }
    if (item.wear !== undefined) {
      const wp = `${p}.wear`;
      unknownFields(item.wear, ['capital_goods','construction_materials','depreciation'], wp, errors);
      requiredString(item.wear, 'capital_goods', wp, errors);
      requiredString(item.wear, 'depreciation', wp, errors);
      if (item.wear.construction_materials !== undefined) requiredString(item.wear, 'construction_materials', wp, errors);
    }
  }

  const targets = new Set();
  if (!Array.isArray(decl.prices) || !decl.prices.length) errors.push(`${path}.prices: non-empty array required`);
  else for (const [i, item] of decl.prices.entries()) {
    const p = `${path}.prices[${i}]`;
    if (!isObject(item)) { errors.push(`${p}: expected object`); continue; }
    unknownFields(item, ['target','cost','scarcity'], p, errors);
    for (const k of ['target','cost','scarcity']) requiredString(item,k,p,errors);
    uniqueName(item.target, targets, `${p}.target`, errors);
    const cost = (decl.costs || []).find(c => c.name === item.cost);
    if (!cost || cost.extend) errors.push(`${p}.cost: must name a non-extend cost`);
  }
  if (!Array.isArray(decl.markups) || !decl.markups.length) errors.push(`${path}.markups: non-empty array required`);
  else for (const [i, name] of decl.markups.entries()) {
    if (!isString(name)) errors.push(`${path}.markups[${i}]: non-empty string required`);
    else uniqueName(name, targets, `${path}.markups[${i}]`, errors);
  }
  if (!Array.isArray(decl.references) || !decl.references.length) errors.push(`${path}.references: non-empty array required`);
  else for (const [i, item] of decl.references.entries()) {
    const p = `${path}.references[${i}]`;
    if (!isObject(item)) { errors.push(`${p}: expected object`); continue; }
    unknownFields(item, ['name','target','scale'], p, errors);
    requiredString(item,'name',p,errors);
    requiredString(item,'target',p,errors);
    uniqueName(item.target,targets,`${p}.target`,errors);
    colonyValues(item.scale,colonies,`${p}.scale`,errors);
  }
  if (!isObject(decl.price_index)) errors.push(`${path}.price_index: expected object`);
  else {
    unknownFields(decl.price_index,['target','reference','scale'],`${path}.price_index`,errors);
    requiredString(decl.price_index,'target',`${path}.price_index`,errors);
    requiredString(decl.price_index,'reference',`${path}.price_index`,errors);
    uniqueName(decl.price_index.target,targets,`${path}.price_index.target`,errors);
    colonyValues(decl.price_index.scale,colonies,`${path}.price_index.scale`,errors);
  }
}

export function expandCostPricing(decl, base) {
  const byName = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  const C = decl.colonies, SW = decl.switch, ON = `[${SW}] = 1`, I = decl.inputs, P = decl.parameters;
  const MARKUP = 'Universal Markup', TIME = 'Cost Price Signal Time';
  const sub = (t, X) => t.replaceAll('{C}', X);
  const must = n => { const e = byName.get(n); if (!e) throw new Error(`cost_pricing: base element missing: ${n}`); return e; };
  const val = n => String(must(n).behavior.value);
  const add = [], rep = [];
  const V = (name, value, note) => add.push({ type: 'VARIABLE', name, behavior: { value }, description: `Cost pricing node: ${note || name}.` });
  const S = (name, initial, note) => add.push({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: true }, description: `Cost pricing node: ${note || name}.` });
  const F = (name, from, to, value, note) => add.push({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true }, description: `Cost pricing node: ${note || name}.` });
  const wrap = (name, fresh, oldRef) => { const old = oldRef ?? val(name); rep.push({ name, value: `IfThenElse(${ON}, ${fresh(`(${old})`)}, ${old})` }); };
  if (byName.has(SW)) throw new Error(`cost_pricing: switch "${SW}" already exists in base`);
  const refsOf = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];

  V(SW, 0, 'switch of cost pricing (0 = every earlier series unchanged)');
  for (const [k, v] of Object.entries(P)) V(k, v, `parameter ${k}`);
  const MU = `(1 + [${MARKUP}])`;
  for (const X of C) {
    const sig = n => `[${X} ${n} Cost Price Signal]`, W = `[${sub(I.wage, X)}]`;
    for (const s of decl.signals) {
      const name = `${X} ${s.name} Cost Price Signal`, src = sub(s.source, X);
      if (!byName.has(src) && !decl.costs.some(c => c.cost_price && `${X} ${c.name} Cost Price` === src)) throw new Error(`cost_pricing: signal source missing: ${src}`);
      S(name, s.initial[X], `${s.name.toLowerCase()} price seen by the cost formulas, smoothed`);
      F(`${name} Increase`, null, name, `IfThenElse(${ON}, Max([${src}] - [${name}], 0) / [${TIME}], 0)`);
      F(`${name} Decrease`, name, null, `IfThenElse(${ON}, Max([${name}] - [${src}], 0) / [${TIME}], 0)`);
    }
    for (const c of decl.costs) {
      const terms = [];
      for (const q of c.inputs || []) terms.push(`[${sub(q.per_unit, X)}] * ${sig(q.signal)}`);
      if (c.labor) terms.push(`[${sub(c.labor, X)}]${c.automation ? ` * [${sub(c.automation, X)}]` : ''} * ${W}`);
      const wear = c.wear ? `(${[`[${sub(c.wear.capital_goods, X)}] * ${sig(decl.wear_signals.capital_goods)}`,
                                ...(c.wear.construction_materials ? [`[${sub(c.wear.construction_materials, X)}] * ${sig(decl.wear_signals.construction_materials)}`] : [])].join(' + ')}) * [${sub(c.wear.depreciation, X)}]` : null;   // construction materials optional (farms use none)
      if (c.extend) {
        const wn = `${X} ${c.name} Capital Wear`;
        V(wn, wear, `${c.name.toLowerCase()} capital wear per unit`);
        wrap(sub(c.extend, X), o => `${o} + [${wn}]`);
        continue;
      }
      if (wear) terms.push(wear);
      if (c.rent) terms.push(`[${sub(c.rent, X)}]`);
      V(`${X} ${c.name} Full Cost`, terms.join(' + '), `full unit cost of ${c.name.toLowerCase()} (materials, energy, labor, capital wear, rent)`);
      if (c.cost_price) V(`${X} ${c.name} Cost Price`, `[${X} ${c.name} Full Cost] * ${MU}`, `cost price of ${c.name.toLowerCase()} (no market)`);
    }
    for (const p of decl.prices) {
      const scarcity = sub(p.scarcity, X);
      for (const r of refsOf(scarcity)) must(r);
      wrap(sub(p.target, X), () => `[${X} ${p.cost} Full Cost] * ${MU} * ${scarcity}`);
    }
    for (const m of decl.markups) wrap(sub(m, X), () => `[${MARKUP}]`);
    for (const r of decl.references) {
      const t = sub(r.target, X), init = `${X} Initial ${r.name}`, scale = `${X} ${r.name} Cost Scale`;
      V(init, Number(val(t)), `${r.name.toLowerCase()} before cost pricing`);
      V(scale, r.scale[X], `${r.name.toLowerCase()} scale: start price under cost pricing / start price`);
      wrap(t, () => `[${init}] * [${scale}]`, `[${init}]`);
    }
    const pi = decl.price_index, fr = `${X} Food Index Reference`, fs_ = `${X} Food Index Cost Scale`;
    V(fs_, pi.scale[X], 'food reference scale of the price index');
    V(fr, `[${pi.reference}] * [${fs_}]`, 'regional food reference of the price index');
    const piName = sub(pi.target, X), piOld = val(piName);
    if (!piOld.includes(`[${pi.reference}]`)) throw new Error(`cost_pricing: ${piName} does not read [${pi.reference}]`);
    wrap(piName, () => `(${piOld.replaceAll(`[${pi.reference}]`, `[${fr}]`)})`);
  }

  for (const e of add) if (byName.has(e.name)) throw new Error(`cost_pricing: generated name conflicts with base element "${e.name}"`);
  const added = new Map(add.map(e => [e.name, e]));
  const resolve = n => added.get(n) || byName.get(n);
  const have = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const links = [];
  for (const [to, v] of [...add.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...rep.map(r => [r.name, r.value])]) {
    for (const r of refsOf(v)) {
      const src = resolve(r); if (!src) throw new Error(`cost_pricing: ${to}: unresolved [${r}]`);
      const k = `${src.name}|${to}`; if (!have.has(k)) { have.add(k); links.push({ from: src.name, to }); }
    }
  }
  const validation = {
    cost_pricing_instances: C.map(X => ({
      name: `${X} cost pricing`, colony: X, wage: sub(I.wage, X),
      signals: decl.signals.map(s => ({ signal: `${X} ${s.name} Cost Price Signal`, source: sub(s.source, X) })),
      prices: decl.prices.map(p => ({ target: sub(p.target, X), full_cost: `${X} ${p.cost} Full Cost` })),
      cost_prices: decl.costs.filter(c => c.cost_price).map(c => ({ target: `${X} ${c.name} Cost Price`, full_cost: `${X} ${c.name} Full Cost` }))
    })),
    cost_pricing_switch: SW, cost_pricing_markup: MARKUP,
    information_signal_names: decl.signals.flatMap(s => [`? ${s.name} Cost Price Signal Increase`, `? ${s.name} Cost Price Signal Decrease`])
  };
  return { patch: { add_elements: add, replace_formulas: rep, add_links: links }, validation };
}

