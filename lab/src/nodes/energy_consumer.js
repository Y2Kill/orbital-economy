// Generator for node type `energy_consumer` (task 024).
// One declaration connects several process rates to the colony energy allocator through
// smoothed request signals. Priority consumers (energy-sector own use) are served first.
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const isString = x => typeof x === 'string' && x.length > 0;
const isNumber = x => typeof x === 'number' && Number.isFinite(x);
const key = s => String(s).toLowerCase();
const X_ = (s, c) => String(s).replaceAll('{C}', c);

function unknownFields(obj, allowed, path, errors) {
  if (!isObj(obj)) return;
  for (const k of Object.keys(obj)) if (!allowed.has(k)) errors.push(`${path}.${k}: unknown field`);
}
function required(obj, k, path, errors) {
  if (!isObj(obj) || !(k in obj)) errors.push(`${path}.${k}: required field is missing`);
}
function stringField(obj, k, path, errors) {
  required(obj, k, path, errors);
  if (isObj(obj) && k in obj && !isString(obj[k])) errors.push(`${path}.${k}: must be a non-empty string`);
}
function numberField(obj, k, path, errors) {
  required(obj, k, path, errors);
  if (isObj(obj) && k in obj && !isNumber(obj[k])) errors.push(`${path}.${k}: must be a finite number`);
}
function colonyNumbers(obj, colonies, path, errors) {
  if (!isObj(obj)) { errors.push(`${path}: must be an object`); return; }
  const allowed = new Set(colonies.filter(isString));
  unknownFields(obj, allowed, path, errors);
  for (const c of allowed) {
    if (!(c in obj)) errors.push(`${path}.${c}: required field is missing`);
    else if (!isNumber(obj[c])) errors.push(`${path}.${c}: must be a finite number`);
  }
}

export function validateEnergyConsumerDeclaration(decl, path, errors) {
  const top = new Set(['type','version','colonies','switch','allocator','consumers']);
  unknownFields(decl, top, path, errors);
  for (const k of top) required(decl, k, path, errors);
  if ('version' in decl && decl.version !== 1) errors.push(`${path}.version: must be 1`);
  if ('switch' in decl && !isString(decl.switch)) errors.push(`${path}.switch: must be a non-empty string`);

  if (!Array.isArray(decl.colonies) || decl.colonies.length === 0) errors.push(`${path}.colonies: must be a non-empty array`);
  else {
    const seen = new Set();
    for (const [i, c] of decl.colonies.entries()) {
      if (!isString(c)) errors.push(`${path}.colonies[${i}]: must be a non-empty string`);
      else if (seen.has(key(c))) errors.push(`${path}.colonies[${i}]: duplicate colony "${c}"`);
      else seen.add(key(c));
    }
  }
  const colonies = Array.isArray(decl.colonies) ? decl.colonies.filter(isString) : [];

  if (!isObj(decl.allocator)) errors.push(`${path}.allocator: must be an object`);
  else {
    const fields = new Set(['total','available','supply','ratio']);
    unknownFields(decl.allocator, fields, `${path}.allocator`, errors);
    for (const k of fields) stringField(decl.allocator, k, `${path}.allocator`, errors);
  }

  if (!Array.isArray(decl.consumers) || decl.consumers.length === 0) {
    errors.push(`${path}.consumers: must be a non-empty array`);
    return;
  }
  const names = new Set();
  for (const [i, c] of decl.consumers.entries()) {
    const cp = `${path}.consumers[${i}]`;
    if (!isObj(c)) { errors.push(`${cp}: must be an object`); continue; }
    const fields = new Set(['consumer','rate','energy_per_unit','priority','signal','planet_process']);
    unknownFields(c, fields, cp, errors);
    for (const k of ['consumer','rate','energy_per_unit','signal','planet_process']) required(c, k, cp, errors);
    for (const k of ['consumer','rate','planet_process']) if (k in c && !isString(c[k])) errors.push(`${cp}.${k}: must be a non-empty string`);
    if (isString(c.consumer)) {
      if (names.has(key(c.consumer))) errors.push(`${cp}.consumer: duplicate consumer "${c.consumer}"`);
      else names.add(key(c.consumer));
    }
    if ('energy_per_unit' in c) {
      if (!isNumber(c.energy_per_unit)) errors.push(`${cp}.energy_per_unit: must be a finite number`);
      else if (!(c.energy_per_unit > 0)) errors.push(`${cp}.energy_per_unit: must be > 0`);
    }
    if ('priority' in c && typeof c.priority !== 'boolean') errors.push(`${cp}.priority: must be boolean`);

    if (!isObj(c.signal)) errors.push(`${cp}.signal: must be an object`);
    else {
      unknownFields(c.signal, new Set(['initial','adjustment_time']), `${cp}.signal`, errors);
      required(c.signal, 'initial', `${cp}.signal`, errors);
      colonyNumbers(c.signal.initial, colonies, `${cp}.signal.initial`, errors);
      required(c.signal, 'adjustment_time', `${cp}.signal`, errors);
      if (!isObj(c.signal.adjustment_time)) errors.push(`${cp}.signal.adjustment_time: must be an object`);
      else {
        unknownFields(c.signal.adjustment_time, new Set(['name','value']), `${cp}.signal.adjustment_time`, errors);
        stringField(c.signal.adjustment_time, 'name', `${cp}.signal.adjustment_time`, errors);
        numberField(c.signal.adjustment_time, 'value', `${cp}.signal.adjustment_time`, errors);
      }
    }
  }
}

export function energyConsumerGeneratedNames(decl) {
  const names = [decl.switch];
  for (const c of decl.consumers || []) {
    names.push(`${c.consumer} Energy per Unit`);
    if (c.signal?.adjustment_time?.name) names.push(c.signal.adjustment_time.name);
  }
  const priority = (decl.consumers || []).some(c => c.priority === true);
  for (const X of decl.colonies || []) {
    for (const c of decl.consumers || []) {
      const K = c.consumer, sig = `${X} ${K} Energy Signal`;
      names.push(
        `${X} ${K} Pre Energy Rate`,
        sig,
        `${sig} Increase`,
        `${sig} Decrease`,
        `${X} ${K} Requested Energy`,
        `${X} ${K} Allocated Energy`,
        `${X} ${K} Energy Fulfillment Ratio`
      );
    }
    if (priority) names.push(`${X} Priority Requested Energy`, `${X} Priority Energy Fulfillment Ratio`, `${X} Priority Allocated Energy`);
  }
  return names;
}

export function energyConsumerReplacementNames(decl) {
  const out = [];
  for (const X of decl.colonies || []) {
    for (const c of decl.consumers || []) out.push(X_(c.rate, X));
    if ((decl.consumers || []).some(c => c.priority === true)) out.push(X_(decl.allocator.ratio, X));
    out.push(X_(decl.allocator.total, X), X_(decl.allocator.supply, X));
  }
  return out;
}

export function expandEnergyConsumer(decl, base) {
  const byName = new Map((base.elements || []).filter(e => e.type !== 'LINK' && e.name).map(e => [key(e.name), e]));
  const linkKeys = new Set((base.elements || []).filter(e => e.type === 'LINK').map(e => `${key(e.from)}|${key(e.to)}`));
  const need = (name, why) => {
    const e = byName.get(key(name));
    if (!e) throw new Error(`${why} references missing base element "${name}"`);
    return e;
  };

  // Validate all base references before generating anything. This also makes the
  // "already connected" error deterministic and names the offending consumer.
  for (const X of decl.colonies) {
    for (const [field, template] of Object.entries(decl.allocator)) need(X_(template, X), `allocator.${field}[${X}]`);
    for (const c of decl.consumers) {
      const existing = `${X} ${c.consumer} Requested Energy`;
      if (byName.has(key(existing))) throw new Error(`consumer "${c.consumer}" is already connected in base: "${existing}" exists`);
      const rate = need(X_(c.rate, X), `consumer "${c.consumer}" rate[${X}]`);
      if (rate.type === 'STOCK' || !rate.behavior || rate.behavior.value == null) throw new Error(`consumer "${c.consumer}" rate[${X}] "${rate.name}" must have behavior.value`);
    }
  }

  const added = [];
  const add = el => {
    if (byName.has(key(el.name))) throw new Error(`energy_consumer generated name conflicts with base element "${el.name}"`);
    const copy = { ...el, description: `Generated energy_consumer element for ${el.name}.` };
    added.push(copy);
    byName.set(key(copy.name), copy);
    return copy;
  };
  const V = (name, value) => add({ type: 'VARIABLE', name, behavior: { value } });
  const S = (name, initial_value) => add({ type: 'STOCK', name, behavior: { initial_value, non_negative: true } });
  const F = (name, from, to, value) => add({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true } });

  const replacements = [];
  const replace = (name, value) => {
    const e = need(name, 'replacement target');
    replacements.push({ name: e.name, value });
  };

  const SW = decl.switch;
  V(SW, 1);
  for (const c of decl.consumers) {
    V(`${c.consumer} Energy per Unit`, c.energy_per_unit);
    V(c.signal.adjustment_time.name, c.signal.adjustment_time.value);
  }

  const priority = decl.consumers.filter(c => c.priority === true).map(c => c.consumer);
  const validation = {
    energy_balance_consumers: decl.consumers.map(c => c.consumer),
    energy_balance_priority: priority,
    planet_energies: [],
    information_signal_names: []
  };

  for (const c of decl.consumers) {
    for (const pattern of [`? ${c.consumer} Energy Signal Increase`, `? ${c.consumer} Energy Signal Decrease`]) {
      if (!validation.information_signal_names.includes(pattern)) validation.information_signal_names.push(pattern);
    }
    validation.planet_energies.push({
      process: c.planet_process,
      energy: {
        kind: 'requests',
        request: `{C} ${c.consumer} Requested Energy`,
        signal: `{C} ${c.consumer} Energy Signal`,
        ...(c.priority === true ? { fulfillment: '{C} Priority Energy Fulfillment Ratio' } : {})
      }
    });
  }

  for (const X of decl.colonies) {
    const total = X_(decl.allocator.total, X);
    const available = X_(decl.allocator.available, X);
    const supply = X_(decl.allocator.supply, X);
    const ratio = X_(decl.allocator.ratio, X);
    const requests = [], allocations = [];

    for (const c of decl.consumers) {
      const K = c.consumer;
      const rate = X_(c.rate, X);
      const old = need(rate, `consumer "${K}" rate[${X}]`).behavior.value;
      const pre = `${X} ${K} Pre Energy Rate`;
      const sig = `${X} ${K} Energy Signal`;
      const adj = c.signal.adjustment_time.name;
      const req = `${X} ${K} Requested Energy`;
      const alloc = `${X} ${K} Allocated Energy`;
      const ownRatio = `${X} ${K} Energy Fulfillment Ratio`;
      const allocatorRatio = c.priority === true ? `${X} Priority Energy Fulfillment Ratio` : ratio;

      V(pre, old);
      S(sig, c.signal.initial[X]);
      F(`${sig} Increase`, null, sig, `IfThenElse([${pre}] > [${sig}], ([${pre}] - [${sig}]) / [${adj}], 0)`);
      F(`${sig} Decrease`, sig, null, `IfThenElse([${sig}] > [${pre}], ([${sig}] - [${pre}]) / [${adj}], 0)`);
      V(req, `IfThenElse([${SW}] = 1, [${sig}] * [${K} Energy per Unit], 0)`);
      V(alloc, `[${req}] * [${allocatorRatio}]`);
      V(ownRatio, `IfThenElse([${req}] > 0.001, [${alloc}] / [${req}], 1)`);
      replace(rate, `IfThenElse([${SW}] = 1, [${pre}] * [${ownRatio}], ${old})`);
      requests.push(`[${req}]`);
      allocations.push(`[${alloc}]`);
    }

    if (priority.length) {
      const pr = `${X} Priority Requested Energy`;
      const prioRatio = `${X} Priority Energy Fulfillment Ratio`;
      const pa = `${X} Priority Allocated Energy`;
      V(pr, priority.map(K => `[${X} ${K} Requested Energy]`).join(' + '));
      V(prioRatio, `IfThenElse([${pr}] > [${available}], [${available}] / ([${pr}] + 0.001), 1)`);
      V(pa, `[${pr}] * [${prioRatio}]`);
      const oldRatio = need(ratio, 'allocator.ratio').behavior.value;
      replace(ratio, `IfThenElse([${SW}] = 1, IfThenElse([${total}] > [${available}], Max(0, [${available}] - [${pa}]) / ([${total}] - [${pr}] + 0.001), 1), ${oldRatio})`);
    }

    const oldTotal = need(total, 'allocator.total').behavior.value;
    const oldSupply = need(supply, 'allocator.supply').behavior.value;
    replace(total, `IfThenElse([${SW}] = 1, ${oldTotal} + ${requests.join(' + ')}, ${oldTotal})`);
    replace(supply, `IfThenElse([${SW}] = 1, ${oldSupply} + ${allocations.join(' + ')}, ${oldSupply})`);
  }

  const add_links = [];
  const refs = value => [...new Set([...String(value).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  const addLink = (from, to) => {
    const source = byName.get(key(from));
    const target = byName.get(key(to));
    if (!source) throw new Error(`formula reference "${from}" for "${to}" does not resolve`);
    if (!target) throw new Error(`link target "${to}" does not resolve`);
    const lk = `${key(source.name)}|${key(target.name)}`;
    if (linkKeys.has(lk)) return;
    linkKeys.add(lk);
    add_links.push({ from: source.name, to: target.name });
  };
  for (const e of added) {
    const value = e.behavior.value ?? e.behavior.initial_value;
    for (const ref of refs(value)) addLink(ref, e.name);
  }
  for (const r of replacements) for (const ref of refs(r.value)) addLink(ref, r.name);

  return {
    patch: { add_elements: added, replace_formulas: replacements, retarget_flows: [], add_links },
    validation
  };
}
