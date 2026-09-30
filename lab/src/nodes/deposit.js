// Generator for node type `deposit` (task 022).
// Definitions and formula ordering follow docs/tasks/022-deposit-node/reference/deposit_prototype.mjs.
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const isString = x => typeof x === 'string' && x.length > 0;
const isNumber = x => typeof x === 'number' && Number.isFinite(x);
const key = s => String(s).toLowerCase();
const X_ = (s, c) => String(s).replaceAll('{C}', c);
const mx = (a, b) => `((${a} - ${b}) + (((${a} - ${b}) ^ 2) ^ 0.5)) / 2`;

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

export function validateDepositDeclaration(decl, path, errors) {
  const top = new Set(['type','version','colonies','switch','resources']);
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

  if (!Array.isArray(decl.resources) || decl.resources.length === 0) {
    errors.push(`${path}.resources: must be a non-empty array`);
    return;
  }
  const resourceNames = new Set();
  for (const [i, r] of decl.resources.entries()) {
    const rp = `${path}.resources[${i}]`;
    if (!isObj(r)) { errors.push(`${rp}: must be an object`); continue; }
    const fields = new Set(['resource','extraction','initial','parameters','signal','backing','planet_process']);
    unknownFields(r, fields, rp, errors);
    for (const k of fields) required(r, k, rp, errors);
    for (const k of ['resource','planet_process']) if (k in r && !isString(r[k])) errors.push(`${rp}.${k}: must be a non-empty string`);
    if (isString(r.resource)) {
      if (resourceNames.has(key(r.resource))) errors.push(`${rp}.resource: duplicate resource "${r.resource}"`);
      resourceNames.add(key(r.resource));
    }

    if (!isObj(r.extraction)) errors.push(`${rp}.extraction: must be an object`);
    else {
      unknownFields(r.extraction, new Set(['flow','rate']), `${rp}.extraction`, errors);
      stringField(r.extraction, 'flow', `${rp}.extraction`, errors);
      stringField(r.extraction, 'rate', `${rp}.extraction`, errors);
    }

    if (!isObj(r.initial)) errors.push(`${rp}.initial: must be an object`);
    else {
      unknownFields(r.initial, new Set(['undiscovered','proven']), `${rp}.initial`, errors);
      required(r.initial, 'undiscovered', `${rp}.initial`, errors);
      required(r.initial, 'proven', `${rp}.initial`, errors);
      colonyNumbers(r.initial.undiscovered, colonies, `${rp}.initial.undiscovered`, errors);
      colonyNumbers(r.initial.proven, colonies, `${rp}.initial.proven`, errors);
    }

    const backingGoods = [];
    if (!Array.isArray(r.backing) || r.backing.length === 0) errors.push(`${rp}.backing: must be a non-empty array`);
    else {
      const seenGoods = new Set();
      for (const [bi, b] of r.backing.entries()) {
        const bp = `${rp}.backing[${bi}]`;
        if (!isObj(b)) { errors.push(`${bp}: must be an object`); continue; }
        unknownFields(b, new Set(['good','fulfillment','inventory','demand']), bp, errors);
        for (const k of ['good','fulfillment','inventory','demand']) stringField(b, k, bp, errors);
        if (isString(b.good)) {
          if (seenGoods.has(key(b.good))) errors.push(`${bp}.good: duplicate backing good "${b.good}"`);
          else { seenGoods.add(key(b.good)); backingGoods.push(b.good); }
        }
      }
    }

    if (!isObj(r.parameters)) errors.push(`${rp}.parameters: must be an object`);
    else {
      const expected = new Set(['Target Reserve Life','Exploration Time','Depletion Buffer Days', ...backingGoods.map(g => `${g} per Discovery`)]);
      unknownFields(r.parameters, expected, `${rp}.parameters`, errors);
      for (const k of expected) numberField(r.parameters, k, `${rp}.parameters`, errors);
    }

    if (!isObj(r.signal)) errors.push(`${rp}.signal: must be an object`);
    else {
      unknownFields(r.signal, new Set(['name','initial','adjustment_time']), `${rp}.signal`, errors);
      stringField(r.signal, 'name', `${rp}.signal`, errors);
      required(r.signal, 'initial', `${rp}.signal`, errors);
      colonyNumbers(r.signal.initial, colonies, `${rp}.signal.initial`, errors);
      required(r.signal, 'adjustment_time', `${rp}.signal`, errors);
      if (!isObj(r.signal.adjustment_time)) errors.push(`${rp}.signal.adjustment_time: must be an object`);
      else {
        unknownFields(r.signal.adjustment_time, new Set(['name','value']), `${rp}.signal.adjustment_time`, errors);
        stringField(r.signal.adjustment_time, 'name', `${rp}.signal.adjustment_time`, errors);
        numberField(r.signal.adjustment_time, 'value', `${rp}.signal.adjustment_time`, errors);
      }
    }
  }
}

export function depositGeneratedNames(decl) {
  const names = [decl.switch];
  for (const r of decl.resources || []) {
    const R = r.resource;
    const P = n => `${R} Deposit ${n}`;
    for (const k of Object.keys(r.parameters || {})) names.push(P(k));
    if (r.signal?.adjustment_time?.name) names.push(r.signal.adjustment_time.name);
    for (const X of decl.colonies || []) {
      const U = `${X} ${R} Undiscovered Resource`, Pr = `${X} ${R} Proven Reserves`;
      const sig = r.signal ? X_(r.signal.name, X) : '';
      names.push(`${U} Initial`, `${Pr} Initial`, U, Pr, sig, `${sig} Increase`, `${sig} Decrease`);
      names.push(`${X} ${R} Target Proven Reserves`, `${X} ${R} Reserve Gap`, `${X} ${R} Discovery Factor`, `${X} ${R} Desired Exploration`, `${X} ${R} Exploration`);
      for (const b of r.backing || []) names.push(`${X} ${R} Exploration ${b.good} Consumption`);
      names.push(`${X} ${R} Deposit Unlimited Rate`);
    }
  }
  return names;
}

export function depositReplacementNames(decl) {
  const out = [];
  const seen = new Set();
  const add = n => { const k = key(n); if (!seen.has(k)) { seen.add(k); out.push(n); } };
  for (const r of decl.resources || []) for (const X of decl.colonies || []) {
    for (const b of r.backing || []) add(X_(b.demand, X));
    add(X_(r.extraction.rate, X));
  }
  return out;
}

export function depositRetargetFlowNames(decl) {
  const out = [];
  for (const r of decl.resources || []) for (const X of decl.colonies || []) out.push(X_(r.extraction.flow, X));
  return out;
}

export function expandDeposit(decl, base) {
  const byName = new Map((base.elements || []).filter(e => e.type !== 'LINK' && e.name).map(e => [key(e.name), e]));
  const linkKeys = new Set((base.elements || []).filter(e => e.type === 'LINK').map(e => `${key(e.from)}|${key(e.to)}`));
  const added = [];
  const need = (name, why) => {
    const e = byName.get(key(name));
    if (!e) throw new Error(`${why} references missing base element "${name}"`);
    return e;
  };
  const add = el => {
    if (byName.has(key(el.name))) throw new Error(`deposit generated name conflicts with base element "${el.name}"`);
    const copy = { ...el, description: `Generated deposit element for ${el.name}.` };
    added.push(copy);
    byName.set(key(copy.name), copy);
    return copy;
  };
  const V = (name, value) => add({ type: 'VARIABLE', name, behavior: { value } });
  const S = (name, initial_value) => add({ type: 'STOCK', name, behavior: { initial_value, non_negative: true } });
  const F = (name, from, to, value) => add({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true } });

  const replacementByKey = new Map();
  const replacementOrder = [];
  const currentValue = name => {
    const k = key(name);
    if (replacementByKey.has(k)) return replacementByKey.get(k).value;
    const e = need(name, 'replacement target');
    if (e.type === 'STOCK' || !e.behavior || e.behavior.value == null) throw new Error(`replacement target "${e.name}" must have behavior.value`);
    return e.behavior.value;
  };
  const replace = (name, value) => {
    const e = need(name, 'replacement target');
    const k = key(e.name);
    if (!replacementByKey.has(k)) replacementOrder.push(k);
    replacementByKey.set(k, { name: e.name, value });
  };

  V(decl.switch, 1);
  const retarget_flows = [];
  const retargetSeen = new Set();
  const validation = { deposit_instances: [], planet_deposits: [], exploration_expenditure_names: [], information_signal_names: [] };

  for (const r of decl.resources) {
    const R = r.resource;
    const P = n => `${R} Deposit ${n}`;
    for (const [k, v] of Object.entries(r.parameters)) V(P(k), v);
    V(r.signal.adjustment_time.name, r.signal.adjustment_time.value);

    for (const X of decl.colonies) {
      const rate = X_(r.extraction.rate, X), flowName = X_(r.extraction.flow, X);
      const flow = need(flowName, `${r.resource}.extraction.flow[${X}]`);
      if (flow.type !== 'FLOW' || flow.from != null) throw new Error(`${flowName} must be a FLOW from ∅`);
      const fk = key(flow.name);
      if (retargetSeen.has(fk)) throw new Error(`${flowName} is selected for retargeting more than once`);
      retargetSeen.add(fk);

      const oldRate = currentValue(rate);
      const U = `${X} ${R} Undiscovered Resource`, Pr = `${X} ${R} Proven Reserves`;
      V(`${U} Initial`, r.initial.undiscovered[X]);
      V(`${Pr} Initial`, r.initial.proven[X]);
      S(U, `[${U} Initial]`);
      S(Pr, `[${Pr} Initial]`);

      const sig = X_(r.signal.name, X), adj = r.signal.adjustment_time.name;
      S(sig, r.signal.initial[X]);
      F(`${sig} Increase`, null, sig, `IfThenElse([${rate}] > [${sig}], ([${rate}] - [${sig}]) / [${adj}], 0)`);
      F(`${sig} Decrease`, sig, null, `IfThenElse([${sig}] > [${rate}], ([${sig}] - [${rate}]) / [${adj}], 0)`);
      for (const pattern of [`? ${R} Extraction Signal Increase`, `? ${R} Extraction Signal Decrease`]) {
        if (!validation.information_signal_names.includes(pattern)) validation.information_signal_names.push(pattern);
      }
      V(`${X} ${R} Target Proven Reserves`, `[${sig}] * [${P('Target Reserve Life')}]`);
      V(`${X} ${R} Reserve Gap`, mx(`[${X} ${R} Target Proven Reserves]`, `[${Pr}]`));
      V(`${X} ${R} Discovery Factor`, `[${U}] / [${U} Initial]`);
      V(`${X} ${R} Desired Exploration`, `IfThenElse([${decl.switch}] = 1, [${X} ${R} Reserve Gap] / [${P('Exploration Time')}] * [${X} ${R} Discovery Factor], 0)`);

      const fulfillments = r.backing.map(b => {
        const name = X_(b.fulfillment, X);
        need(name, `backing fulfillment ${R}[${X}]`);
        return `[${name}]`;
      });
      const exploration = `${X} ${R} Exploration`;
      F(exploration, U, Pr, `IfThenElse([${decl.switch}] = 1, [${X} ${R} Desired Exploration] * Min(${fulfillments.join(', ')}), 0)`);

      const consumption = [];
      for (const b of r.backing) {
        const inv = X_(b.inventory, X), dem = X_(b.demand, X);
        const invEl = need(inv, `backing.inventory ${R}[${X}]`);
        if (invEl.type !== 'STOCK') throw new Error(`backing.inventory ${R}[${X}] "${inv}" must be a STOCK`);
        const consumptionName = `${X} ${R} Exploration ${b.good} Consumption`;
        F(consumptionName, invEl.name, null, `IfThenElse([${decl.switch}] = 1, [${exploration}] * [${P(`${b.good} per Discovery`)}], 0)`);
        consumption.push(consumptionName);
        const oldDemand = currentValue(dem);
        replace(dem, `IfThenElse([${decl.switch}] = 1, ${oldDemand} + [${X} ${R} Desired Exploration] * [${P(`${b.good} per Discovery`)}], ${oldDemand})`);
      }

      const unlimited = `${X} ${R} Deposit Unlimited Rate`;
      V(unlimited, oldRate);
      replace(rate, `IfThenElse([${decl.switch}] = 1, [${unlimited}] / (1 + ([${unlimited}] / ([${Pr}] / [${P('Depletion Buffer Days')}] + 0.001)) ^ 8) ^ 0.125, ${oldRate})`);

      retarget_flows.push({ name: flow.name, from: Pr, to: flow.to ?? null });
      validation.deposit_instances.push({
        name: `${X} ${R} Deposit`,
        resource: R,
        undiscovered: U,
        proven: Pr,
        exploration,
        extraction: flow.name,
        signal: sig,
        consumption
      });
    }

    validation.planet_deposits.push({
      process: r.planet_process,
      deposit: { kind: 'stock', stock: `{C} ${R} Proven Reserves` }
    });
    for (const b of r.backing) {
      const pattern = `? ${R} Exploration ${b.good} Consumption`;
      if (!validation.exploration_expenditure_names.includes(pattern)) validation.exploration_expenditure_names.push(pattern);
    }
  }

  const replace_formulas = replacementOrder.map(k => replacementByKey.get(k));
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
  for (const r of replace_formulas) for (const ref of refs(r.value)) addLink(ref, r.name);

  return { patch: { add_elements: added, replace_formulas, retarget_flows, add_links }, validation };
}
