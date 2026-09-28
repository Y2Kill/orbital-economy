// Generator for node type `simple_capital`.
// Element set, formulas, ordering, and validation fragment intentionally follow
// docs/tasks/016-simple-capital/reference/expand_simple_prototype.mjs.
const ROLES = {
  capacity: 'Capacity',
  desired_capacity: 'Desired Capacity',
  shortage: 'Capacity Shortage',
  excess: 'Capacity Excess',
  desired_expansion: 'Desired Expansion',
  expansion: 'Expansion',
  depreciation: 'Capacity Depreciation',
  retirement: 'Capacity Retirement'
};

const X_ = (s, colony) => String(s).replaceAll('{C}', colony);
const key = s => String(s).toLowerCase();
const mx = (a, b) => `((${a} - ${b}) + (((${a} - ${b}) ^ 2) ^ 0.5)) / 2`;

function roleDescription(role, name) {
  return `Generated simple_capital ${role} for ${name}.`;
}

export function simpleCapitalGeneratedNames(decl) {
  const names = [];
  const P = decl.sector;
  const sig = decl.sizing.signal;
  names.push(decl.switch);
  if (sig.create) names.push(sig.adjustment_time.name);
  for (const k of Object.keys(decl.parameters)) names.push(`${P} ${k}`);
  for (const X of decl.colonies) {
    const p = `${X} ${P}`;
    if (sig.create) {
      const signal = X_(sig.name, X);
      names.push(signal, `${signal} Increase`, `${signal} Decrease`);
    }
    names.push(
      `${p} Capacity`,
      `${p} Desired Capacity`,
      `${p} Capacity Shortage`,
      `${p} Capacity Excess`,
      `${p} Desired Expansion`,
      `${p} Expansion`,
      `${p} Capacity Depreciation`,
      `${p} Capacity Retirement`
    );
    for (const b of decl.backing) names.push(`${p} ${b.good} Consumption`);
  }
  return names;
}

export function simpleCapitalReplacementNames(decl) {
  const out = [];
  for (const X of decl.colonies) {
    out.push(X_(decl.capacity_output.variable, X));
    for (const b of decl.backing) out.push(X_(b.demand, X));
  }
  return [...new Set(out)];
}

export function expandSimpleCapital(decl, base) {
  const baseEl = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [key(e.name), e]));
  const baseLinks = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${key(e.from)}|${key(e.to)}`));
  const generatedNames = simpleCapitalGeneratedNames(decl);
  const seenGenerated = new Set();
  for (const name of generatedNames) {
    const k = key(name);
    if (seenGenerated.has(k)) throw new Error(`node "${decl.sector}" generates duplicate element "${name}"`);
    if (baseEl.has(k)) throw new Error(`node "${decl.sector}" conflicts with base element "${name}"`);
    seenGenerated.add(k);
  }

  const P = decl.sector, SW = decl.switch;
  const add = [], replace = [];
  const added = new Set();
  const push = (el, role) => {
    const k = key(el.name);
    if (added.has(k)) throw new Error(`node "${P}" generates duplicate element "${el.name}"`);
    added.add(k);
    el.description = roleDescription(role, el.name);
    add.push(el);
  };
  const V = (name, value, role = 'variable') => push({ type: 'VARIABLE', name, behavior: { value } }, role);
  const S = (name, v, role = 'stock') => push({ type: 'STOCK', name, behavior: { initial_value: v, non_negative: true } }, role);
  const F = (name, from, to, value, role = 'flow') => push({ type: 'FLOW', name, from, to, behavior: { value, non_negative: true } }, role);
  const old = name => {
    const e = baseEl.get(key(name));
    if (!e) throw new Error(`node "${P}" references missing base element "${name}"`);
    if (e.type === 'STOCK' || e?.behavior?.value == null) throw new Error(`node "${P}" needs a formula value on "${name}"`);
    return e.behavior.value;
  };
  const requireBase = (name, field) => {
    if (!baseEl.has(key(name))) throw new Error(`${field} references missing base element "${name}"`);
  };

  V(SW, 1, 'switch');
  const sig = decl.sizing.signal;
  if (sig.create) {
    requireBase(X_(sig.demand, decl.colonies[0]), 'sizing.signal.demand');
    V(sig.adjustment_time.name, sig.adjustment_time.value, 'signal adjustment time');
  } else {
    for (const X of decl.colonies) requireBase(X_(sig.name, X), `sizing.signal.name[${X}]`);
  }
  for (const [k, v] of Object.entries(decl.parameters)) V(`${P} ${k}`, v, 'parameter');

  const replaced = new Set();
  const pushReplacement = (name, value) => {
    const k = key(name);
    if (replaced.has(k)) throw new Error(`node "${P}" replaces "${name}" more than once`);
    replaced.add(k);
    replace.push({ name, value });
  };

  for (const X of decl.colonies) {
    const p = `${X} ${P}`, signal = X_(sig.name, X);
    if (sig.create) {
      const demand = X_(sig.demand, X), adj = sig.adjustment_time.name;
      requireBase(demand, `sizing.signal.demand[${X}]`);
      S(signal, sig.initial, 'demand signal');
      F(`${signal} Increase`, null, signal, `IfThenElse([${demand}] > [${signal}], ([${demand}] - [${signal}]) / [${adj}], 0)`, 'demand signal increase');
      F(`${signal} Decrease`, signal, null, `IfThenElse([${signal}] > [${demand}], ([${signal}] - [${demand}]) / [${adj}], 0)`, 'demand signal decrease');
    }

    S(`${p} Capacity`, decl.initial_capacity[X], 'capacity');
    V(`${p} Desired Capacity`, `[${signal}] * [${P} Capacity Reserve Factor]`, 'desired capacity');
    V(`${p} Capacity Shortage`, mx(`[${p} Desired Capacity]`, `[${p} Capacity]`), 'capacity shortage');
    V(`${p} Capacity Excess`, mx(`[${p} Capacity]`, `[${p} Desired Capacity]`), 'capacity excess');
    V(`${p} Desired Expansion`, `IfThenElse([${SW}] = 1, [${p} Capacity Shortage] / [${P} Construction Time], 0)`, 'desired expansion');

    const backing = decl.backing.map((b, i) => ({
      ...b,
      fulfillment: X_(b.fulfillment, X),
      inventory: X_(b.inventory, X),
      demand: X_(b.demand, X),
      index: i
    }));
    for (const b of backing) {
      requireBase(b.fulfillment, `backing[${b.index}].fulfillment[${X}]`);
      requireBase(b.inventory, `backing[${b.index}].inventory[${X}]`);
      requireBase(b.demand, `backing[${b.index}].demand[${X}]`);
    }

    F(`${p} Expansion`, null, `${p} Capacity`,
      `IfThenElse([${SW}] = 1, [${p} Desired Expansion] * Min(${backing.map(b => `[${b.fulfillment}]`).join(', ')}), 0)`, 'expansion');
    F(`${p} Capacity Depreciation`, `${p} Capacity`, null,
      `IfThenElse([${SW}] = 1, [${p} Capacity] * [${P} Depreciation Rate], 0)`, 'capacity depreciation');
    F(`${p} Capacity Retirement`, `${p} Capacity`, null,
      `IfThenElse([${SW}] = 1, [${p} Capacity Excess] / [${P} Retirement Time], 0)`, 'capacity retirement');
    for (const b of backing) {
      F(`${p} ${b.good} Consumption`, b.inventory, null,
        `IfThenElse([${SW}] = 1, [${p} Expansion] * [${P} ${b.good} per Capacity], 0)`, `${b.good} consumption`);
    }

    const cap = X_(decl.capacity_output.variable, X);
    const baseRef = `[${X_(decl.capacity_output.replaces, X)}]`;
    const oc = old(cap);
    if (!oc.includes(baseRef)) throw new Error(`${cap} does not read ${baseRef}`);
    pushReplacement(cap, `IfThenElse([${SW}] = 1, ${oc.replaceAll(baseRef, `[${p} Capacity]`)}, ${oc})`);
    for (const b of backing) {
      const od = old(b.demand);
      pushReplacement(b.demand, `IfThenElse([${SW}] = 1, ${od} + [${p} Desired Expansion] * [${P} ${b.good} per Capacity], ${od})`);
    }
  }

  const names = new Map(baseEl);
  for (const a of add) names.set(key(a.name), a);
  const links = [], seen = new Set(baseLinks);
  const formulaEntries = [
    ...add.map(a => [a.name, a.behavior.value ?? a.behavior.initial_value]),
    ...replace.map(r => [r.name, r.value])
  ];
  for (const [target, value] of formulaEntries) {
    const refs = [...new Set([...String(value).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))].sort();
    for (const ref of refs) {
      if (!names.has(key(ref))) throw new Error(`${target} references unknown ${ref}`);
      const lk = `${key(ref)}|${key(target)}`;
      if (!seen.has(lk)) {
        seen.add(lk);
        links.push({ from: ref, to: target });
      }
    }
  }

  const validation = {
    simple_capital_instances: decl.colonies.map(X => ({
      name: `${X} ${P}`,
      sector: P,
      sizing_signal: X_(sig.name, X),
      roles: Object.fromEntries(Object.entries(ROLES).map(([r, s]) => [r, `${X} ${P} ${s}`])),
      consumption: decl.backing.map(b => `${X} ${P} ${b.good} Consumption`)
    })),
    capital_transformation_names: [`? ${P} Expansion`, ...decl.backing.map(b => `? ${P} ${b.good} Consumption`)],
    capital_retirement_names: [`? ${P} Capacity Depreciation`, `? ${P} Capacity Retirement`],
    transformation_pairs: decl.colonies.map(X => ({
      source: `${X} ${P} Expansion`,
      sinks: decl.backing.map(b => `${X} ${P} ${b.good} Consumption`),
      identity: `${X} ${P} capital goods pair identity`
    })),
    planet_closure: {
      process: decl.planet_process,
      capacity: { kind: 'simple', stock: `{C} ${P} Capacity` }
    }
  };

  return { patch: { add_elements: add, replace_formulas: replace, add_links: links }, validation };
}
