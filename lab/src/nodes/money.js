// Strict v1 declaration for household, firm and transport money accounting.
// Names and expression order in expandMoney follow the approved reference.
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isString = value => typeof value === 'string' && value.trim().length > 0;
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);
const substitute = (text, from, to) => text.replaceAll('{C}', from)
  .replaceAll('{from}', from).replaceAll('{to}', to ?? '');

function unknownFields(value, allowed, path, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${path}.${key}: unknown field`);
  }
}

function requiredString(value, key, path, errors) {
  if (!isObject(value) || !(key in value)) {
    errors.push(`${path}.${key}: required field is missing`);
  } else if (!isString(value[key])) {
    errors.push(`${path}.${key}: must be a non-empty string`);
  }
}

function regionalNumbers(value, colonies, path, errors) {
  if (!isObject(value)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  unknownFields(value, colonies, path, errors);
  for (const colony of colonies) {
    if (!isFiniteNumber(value[colony])) {
      errors.push(`${path}.${colony}: required finite number`);
    }
  }
}

function template(value, keys, path, errors) {
  if (!isString(value)) {
    errors.push(`${path}: non-empty template required`);
    return;
  }
  for (const key of keys) {
    if (!value.includes(`{${key}}`)) errors.push(`${path}: must include {${key}}`);
  }
}

export function validateMoneyDeclaration(decl, path, errors) {
  const fields = ['type', 'version', 'colonies', 'switch', 'parameters',
    'inputs', 'rents', 'purchases', 'trade', 'initial'];
  unknownFields(decl, fields, path, errors);
  for (const key of fields) {
    if (!(key in decl)) errors.push(`${path}.${key}: required field is missing`);
  }
  if (decl.version !== 1) errors.push(`${path}.version: must be 1`);
  requiredString(decl, 'switch', path, errors);

  const colonies = Array.isArray(decl.colonies) ? decl.colonies : [];
  if (colonies.length < 2) errors.push(`${path}.colonies: at least two colonies required`);
  const seen = new Set();
  for (const [i, colony] of colonies.entries()) {
    if (!isString(colony)) {
      errors.push(`${path}.colonies[${i}]: non-empty string required`);
    } else if (seen.has(colony.toLowerCase())) {
      errors.push(`${path}.colonies[${i}]: duplicate colony ${colony}`);
    } else seen.add(colony.toLowerCase());
  }

  const parameters = ['Firm Money Target Days', 'Dividend Payout Time',
    'Transport Payout Time', 'Household Income Smoothing Time',
    'Household Money Target Days', 'Household Money Adjustment Time'];
  if (!isObject(decl.parameters)) {
    errors.push(`${path}.parameters: object required`);
  } else {
    unknownFields(decl.parameters, parameters, `${path}.parameters`, errors);
    for (const name of parameters) {
      if (!isFiniteNumber(decl.parameters[name]) || decl.parameters[name] <= 0) {
        errors.push(`${path}.parameters.${name}: finite number > 0 required`);
      }
    }
  }

  if (!isObject(decl.inputs)) {
    errors.push(`${path}.inputs: object required`);
  } else {
    unknownFields(decl.inputs, ['wage', 'employment'], `${path}.inputs`, errors);
    for (const key of ['wage', 'employment']) requiredString(decl.inputs, key, `${path}.inputs`, errors);
  }

  for (const key of ['rents', 'purchases']) {
    if (!Array.isArray(decl[key]) || !decl[key].length) {
      errors.push(`${path}.${key}: non-empty array required`);
      continue;
    }
    const targets = new Set();
    for (const [i, item] of decl[key].entries()) {
      const p = `${path}.${key}[${i}]`;
      if (!isObject(item)) { errors.push(`${p}: object required`); continue; }
      unknownFields(item, key === 'rents' ? ['price', 'quantity'] :
        ['price', 'quantity', 'budget'], p, errors);
      for (const name of ['price', 'quantity']) requiredString(item, name, p, errors);
      if (key === 'purchases' && 'budget' in item) {
        requiredString(item, 'budget', p, errors);
        if (isString(item.budget)) {
          const folded = item.budget.toLowerCase();
          if (targets.has(folded)) errors.push(`${p}.budget: duplicate target ${item.budget}`);
          targets.add(folded);
        }
      }
    }
    if (key === 'purchases' && targets.size === 0) {
      errors.push(`${path}.purchases: at least one budget target required`);
    }
  }

  if (!isObject(decl.trade)) {
    errors.push(`${path}.trade: object required`);
  } else {
    unknownFields(decl.trade, ['goods', 'freight', 'food'], `${path}.trade`, errors);
    for (const key of ['goods', 'freight']) {
      const list = decl.trade[key];
      if (!Array.isArray(list) || !list.length) {
        errors.push(`${path}.trade.${key}: non-empty array required`);
        continue;
      }
      for (const [i, item] of list.entries()) {
        template(item, ['from', 'to'], `${path}.trade.${key}[${i}]`, errors);
      }
    }
    const food = decl.trade.food, foodPath = `${path}.trade.food`;
    if (!isObject(food)) errors.push(`${foodPath}: object required`);
    else {
      unknownFields(food, ['arrival', 'price', 'freight_weight', 'freight_price'],
        foodPath, errors);
      template(food.arrival, ['from', 'to'], `${foodPath}.arrival`, errors);
      template(food.price, ['from'], `${foodPath}.price`, errors);
      for (const key of ['freight_weight', 'freight_price']) {
        requiredString(food, key, foodPath, errors);
      }
    }
  }

  if (!isObject(decl.initial)) {
    errors.push(`${path}.initial: object required`);
  } else {
    const initial = decl.initial, p = `${path}.initial`;
    unknownFields(initial,
      ['household_money', 'firm_money', 'smoothed_income', 'transport_money'], p, errors);
    for (const key of ['household_money', 'firm_money', 'smoothed_income']) {
      regionalNumbers(initial[key], colonies, `${p}.${key}`, errors);
    }
    if (!isFiniteNumber(initial.transport_money) || initial.transport_money < 0) {
      errors.push(`${p}.transport_money: finite number >= 0 required`);
    }
  }
}


export function moneyGeneratedNames(decl) {
  const names = [decl.switch, ...Object.keys(decl.parameters || {})];
  for (const colony of decl.colonies || []) {
    const common = ['Wage Bill', 'Rent Payments', 'Household Purchases',
      'Export Goods Revenue', 'Import Goods Payments', 'Import Freight Payments',
      'Firm Target Money', 'Dividends', 'Firm Net Cash Flow', 'Balance of Payments',
      'Trade Share', 'Transport Income', 'Household Income', 'Household Saving',
      'Household Money', 'Firm Money', 'Smoothed Household Income',
      'Household Income Flow', 'Household Purchases Flow', 'Firm Cash Flow',
      'Dividend Flow', 'Smoothed Income Change', 'Household Spending Plan',
      'First Spending', 'Norm Goods Cost', 'Budget Factor'];
    names.push(...common.map(name => `${colony} ${name}`));
    for (const item of decl.purchases || []) {
      if (item.budget) {
        const name = substitute(item.budget, colony);
        names.push(`${colony} Unscaled ${name.slice(colony.length + 1)}`);
      }
    }
  }
  names.push('Total Trade Value', 'Transport Payout', 'Transport Money',
    'Transport Freight Income', 'Transport Payout Flow');
  return names;
}

export function moneyReplacementNames(decl) {
  return (decl.colonies || []).flatMap(colony =>
    (decl.purchases || [])
      .filter(item => item.budget)
      .map(item => substitute(item.budget, colony)));
}

export function expandMoney(decl, base) {
  const byName = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  const C = decl.colonies;
  const SW = decl.switch;
  const ON = `[${SW}] = 1`;
  const I = decl.inputs;
  const T = decl.trade;
  const sub = (template, from, to) => template
    .replaceAll('{C}', from)
    .replaceAll('{from}', from)
    .replaceAll('{to}', to ?? '');
  const must = name => {
    const element = byName.get(name);
    if (!element) throw new Error(`money: base element missing: ${name}`);
    return element;
  };
  const val = name => String(must(name).behavior.value);
  const add = [];
  const rep = [];
  const note = n => `Money node: ${n}.`;
  const V = (name, value, description) => {
    add.push({ type: 'VARIABLE', name, behavior: { value },
      description: note(description || name) });
  };
  const S = (name, initial, description) => {
    add.push({ type: 'STOCK', name,
      behavior: { initial_value: initial, non_negative: false },
      description: note(description || name) });
  };
  const F = (name, from, to, value, description) => {
    add.push({ type: 'FLOW', name, from, to,
      behavior: { value: `IfThenElse(${ON}, ${value}, 0)`, non_negative: false },
      description: note(description || name) });
  };
  const wrap = (name, fresh, oldRef) => {
    const old = oldRef ?? val(name);
    rep.push({ name, value: `IfThenElse(${ON}, ${fresh}, ${old})` });
  };
  if (byName.has(SW)) throw new Error(`money: switch "${SW}" already exists in base`);
  const pairs = C.flatMap(from => C
    .filter(to => to !== from)
    .map(to => [from, to]));
  const refsOf = value => [...new Set(
    [...String(value).matchAll(/\[([^\]]+)\]/g)].map(match => match[1])
  )];
  for (const X of C) {
    must(sub(I.wage, X)); must(sub(I.employment, X));
    for (const r of decl.rents) { must(sub(r.price, X)); must(sub(r.quantity, X)); }
    for (const p of decl.purchases) { must(sub(p.quantity, X)); must(sub(p.price, X)); if (p.budget) { const e = must(sub(p.budget, X)); if (e.type !== 'VARIABLE') throw new Error(`money: ${e.name} must be a VARIABLE`); } }
  }
  for (const [X, Y] of pairs) {
    for (const g of [...T.goods, ...T.freight]) must(sub(g, X, Y));
    must(sub(T.food.arrival, X, Y));
  }
  must(T.food.freight_weight); must(T.food.freight_price);

  V(SW, 0, 'switch of money accounting and household budgets (0 = every earlier series unchanged)');
  for (const [k, v] of Object.entries(decl.parameters)) V(k, v, `parameter ${k}`);
  const goodsValue = (X, Y) => [...T.goods.map(g => `[${sub(g, X, Y)}]`), `[${sub(T.food.arrival, X, Y)}] * [${sub(T.food.price, X)}]`].join(' + ');
  const freightValue = (X, Y) => [...T.freight.map(g => `[${sub(g, X, Y)}]`), `[${sub(T.food.arrival, X, Y)}] * [${T.food.freight_weight}] * [${T.food.freight_price}]`].join(' + ');
  for (const X of C) {
    const others = C.filter(Y => Y !== X);
    V(`${X} Wage Bill`, `[${sub(I.wage, X)}] * [${sub(I.employment, X)}]`, 'wages paid by the firms of the region');
    V(`${X} Rent Payments`, decl.rents.map(r => `[${sub(r.price, X)}] * [${sub(r.quantity, X)}]`).join(' + '), 'rent paid to the households (the old base prices)');
    V(`${X} Household Purchases`, decl.purchases.map(p => `[${sub(p.quantity, X)}] * [${sub(p.price, X)}]`).join(' + '), 'household purchases at market prices');
    V(`${X} Export Goods Revenue`, others.map(Y => goodsValue(X, Y)).join(' + '), 'value of goods delivered to other regions');
    V(`${X} Import Goods Payments`, others.map(Y => goodsValue(Y, X)).join(' + '), 'value of goods delivered from other regions');
    V(`${X} Import Freight Payments`, others.map(Y => freightValue(Y, X)).join(' + '), 'freight on goods delivered from other regions');
    V(`${X} Firm Target Money`, `[${X} Wage Bill] * [Firm Money Target Days]`);
    V(`${X} Dividends`, `Max(0, [${X} Firm Money] - [${X} Firm Target Money]) / [Dividend Payout Time]`, 'dividends paid to the households');
    V(`${X} Firm Net Cash Flow`, `[${X} Household Purchases] + [${X} Export Goods Revenue] - [${X} Wage Bill] - [${X} Rent Payments] - [${X} Import Goods Payments] - [${X} Import Freight Payments]`);
    V(`${X} Balance of Payments`, `[${X} Export Goods Revenue] - [${X} Import Goods Payments] - [${X} Import Freight Payments]`);
  }
  V('Total Trade Value', C.map(X => `[${X} Export Goods Revenue] + [${X} Import Goods Payments]`).join(' + '));
  V('Transport Payout', '[Transport Money] / [Transport Payout Time]', 'freight paid out to the households');
  for (const X of C) {
    V(`${X} Trade Share`, `IfThenElse([Total Trade Value] > 0.000001, ([${X} Export Goods Revenue] + [${X} Import Goods Payments]) / [Total Trade Value], 1 / ${C.length})`);
    V(`${X} Transport Income`, `[Transport Payout] * [${X} Trade Share]`);
    V(`${X} Household Income`, `[${X} Wage Bill] + [${X} Rent Payments] + [${X} Dividends] + [${X} Transport Income]`);
    V(`${X} Household Saving`, `[${X} Household Income] - [${X} Household Purchases]`);
  }
  for (const X of C) {
    const init = decl.initial;
    S(`${X} Household Money`, init.household_money[X], 'money held by the households');
    S(`${X} Firm Money`, init.firm_money[X], 'money held by the consolidated firms');
    S(`${X} Smoothed Household Income`, init.smoothed_income[X], 'household income seen by the spending plan');
    F(`${X} Household Income Flow`, null, `${X} Household Money`, `[${X} Household Income]`);
    F(`${X} Household Purchases Flow`, `${X} Household Money`, null, `[${X} Household Purchases]`);
    F(`${X} Firm Cash Flow`, null, `${X} Firm Money`, `[${X} Firm Net Cash Flow]`);
    F(`${X} Dividend Flow`, `${X} Firm Money`, null, `[${X} Dividends]`);
    F(`${X} Smoothed Income Change`, null, `${X} Smoothed Household Income`, `([${X} Household Income] - [${X} Smoothed Household Income]) / [Household Income Smoothing Time]`);
  }
  S('Transport Money', decl.initial.transport_money, 'freight held by the shared transport');
  F('Transport Freight Income', null, 'Transport Money', C.map(X => `[${X} Import Freight Payments]`).join(' + '));
  F('Transport Payout Flow', 'Transport Money', null, '[Transport Payout]');
  for (const X of C) {
    V(`${X} Household Spending Plan`, `Max(0, [${X} Smoothed Household Income] + ([${X} Household Money] - [${X} Smoothed Household Income] * [Household Money Target Days]) / [Household Money Adjustment Time])`);
    const first = decl.purchases.filter(p => !p.budget), scaled = decl.purchases.filter(p => p.budget);
    V(`${X} First Spending`, first.length ? first.map(p => `[${sub(p.quantity, X)}] * [${sub(p.price, X)}]`).join(' + ') : '0', 'purchases paid before the budgeted goods (need)');
    for (const p of scaled) V(`${X} Unscaled ${sub(p.budget, X).slice(X.length + 1)}`, val(sub(p.budget, X)), `${sub(p.budget, X)} before the budget`);
    V(`${X} Norm Goods Cost`, scaled.map(p => `[${X} Unscaled ${sub(p.budget, X).slice(X.length + 1)}] * [${sub(p.price, X)}]`).join(' + '), 'cost of the unscaled budgeted demand');
    V(`${X} Budget Factor`, `Max(0, [${X} Household Spending Plan] - [${X} First Spending]) / Max([${X} Norm Goods Cost], 0.000001)`);
    for (const p of scaled) {
      const t = sub(p.budget, X), u = `${X} Unscaled ${t.slice(X.length + 1)}`;
      wrap(t, `[${u}] * [${X} Budget Factor]`, `[${u}]`);
    }
  }

  for (const e of add) if (byName.has(e.name)) throw new Error(`money: generated name conflicts with base element "${e.name}"`);
  const added = new Map(add.map(e => [e.name, e]));
  const resolve = n => added.get(n) || byName.get(n);
  const have = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const links = [];
  for (const [to, v] of [...add.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...rep.map(r => [r.name, r.value])]) {
    for (const r of refsOf(v)) {
      const src = resolve(r); if (!src) throw new Error(`money: ${to}: unresolved [${r}]`);
      const k = `${src.name}|${to}`; if (!have.has(k)) { have.add(k); links.push({ from: src.name, to }); }
    }
  }
  const validation = {
    money_instances: C.map(X => ({
      name: `${X} money`, colony: X, wage_bill: `${X} Wage Bill`, rent: `${X} Rent Payments`, dividends: `${X} Dividends`, transport_income: `${X} Transport Income`,
      income: `${X} Household Income`, purchases: `${X} Household Purchases`, household_money: `${X} Household Money`, firm_money: `${X} Firm Money`,
      exports: `${X} Export Goods Revenue`, imports: `${X} Import Goods Payments`, import_freight: `${X} Import Freight Payments`, budget_factor: `${X} Budget Factor`
    })),
    money_switch: SW, money_transport: { money: 'Transport Money', payout: 'Transport Payout' },
    money_boundary_flows: [...C.flatMap(X => [`${X} Household Income Flow`, `${X} Household Purchases Flow`, `${X} Firm Cash Flow`, `${X} Dividend Flow`, `${X} Smoothed Income Change`]), 'Transport Freight Income', 'Transport Payout Flow']
  };
  return { patch: { add_elements: add, replace_formulas: rep, add_links: links }, validation };
}

