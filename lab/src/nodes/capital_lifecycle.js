// Generator for node type `capital_lifecycle`.
// Formulas and ordering intentionally follow docs/tasks/015-node-generator/reference/expand_prototype.mjs.
const ROLES = {
  installed: 'Installed Capacity',
  active: 'Active Capacity',
  inactive: 'Inactive Capacity',
  decommissioning: 'Decommissioning Capacity',
  retired: 'Retired Capacity',
  lifetime: 'Lifetime Capacity Account',
  required_active: 'Required Active Capacity',
  target_active: 'Target Active Capacity',
  desired_installed: 'Desired Installed Capacity',
  activation_gap: 'Activation Gap',
  mothball_gap: 'Mothball Gap',
  installed_shortage: 'Installed Capacity Shortage',
  installed_excess: 'Installed Capacity Excess',
  gap_limited_construction: 'Gap Limited Construction',
  activation_queue: 'Activation Queue Capacity',
  inactive_after_activation_queue: 'Inactive After Activation Queue',
  strategic_reserve_target: 'Strategic Reserve Target',
  strategic_reserve: 'Strategic Reserve Capacity',
  surplus: 'Surplus Capacity',
  activation: 'Activation',
  mothballing: 'Mothballing',
  active_depreciation: 'Active Depreciation',
  expansion: 'Expansion',
  decommissioning_initiation: 'Decommissioning Initiation',
  installed_depreciation: 'Depreciation',
  dismantling_completion: 'Dismantling Completion',
  desired_expansion: 'Desired Expansion',
  capital_goods_consumption: 'Capital Goods Consumption'
};

const X_ = (s, colony) => String(s).replaceAll('{C}', colony);
const key = s => String(s).toLowerCase();
const mx = (a, b) => `((${a} - ${b}) + (((${a} - ${b}) ^ 2) ^ 0.5)) / 2`;
const mn = (a, b) => `((${a}) + (${b}) - ((((${a}) - (${b})) ^ 2) ^ 0.5)) / 2`;

function roleDescription(role, name) {
  return `Generated capital_lifecycle ${role} for ${name}.`;
}

export function capitalLifecycleGeneratedNames(decl) {
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
      `${p} Installed Capacity`, `${p} Active Capacity`, `${p} Decommissioning Capacity`, `${p} Retired Capacity`,
      `${p} Required Active Capacity`, `${p} Desired Installed Capacity`, `${p} Inactive Capacity`,
      `${p} Target Active Capacity`, `${p} Activation Gap`, `${p} Mothball Gap`,
      `${p} Installed Capacity Shortage`, `${p} Installed Capacity Excess`, `${p} Gap Limited Construction`,
      `${p} Desired Expansion`, `${p} Activation Queue Capacity`, `${p} Strategic Reserve Target`,
      `${p} Inactive After Activation Queue`, `${p} Strategic Reserve Capacity`, `${p} Surplus Capacity`,
      `${p} Lifetime Capacity Account`, `${p} Expansion`, `${p} Activation`, `${p} Mothballing`,
      `${p} Active Depreciation`, `${p} Decommissioning Initiation`, `${p} Depreciation`,
      `${p} Dismantling Completion`
    );
    for (const b of decl.backing) names.push(`${p} ${b.good} Consumption`);
  }
  return names;
}

export function capitalLifecycleReplacementNames(decl) {
  const out = [];
  for (const X of decl.colonies) {
    out.push(X_(decl.capacity_output.variable, X));
    for (const b of decl.backing) out.push(X_(b.demand, X));
  }
  return [...new Set(out)];
}

export function expandCapitalLifecycle(decl, base) {
  const baseEl = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [key(e.name), e]));
  const baseLinks = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${key(e.from)}|${key(e.to)}`));
  const generatedNames = capitalLifecycleGeneratedNames(decl);
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
    const p = `${X} ${P}`;
    const signal = X_(sig.name, X);
    if (sig.create) {
      const demand = X_(sig.demand, X), adj = sig.adjustment_time.name;
      requireBase(demand, `sizing.signal.demand[${X}]`);
      S(signal, sig.initial, 'demand signal');
      F(`${signal} Increase`, null, signal, `IfThenElse([${demand}] > [${signal}], ([${demand}] - [${signal}]) / [${adj}], 0)`, 'demand signal increase');
      F(`${signal} Decrease`, signal, null, `IfThenElse([${signal}] > [${demand}], ([${signal}] - [${demand}]) / [${adj}], 0)`, 'demand signal decrease');
    }

    S(`${p} Installed Capacity`, decl.initial_capacity[X], 'installed capacity');
    S(`${p} Active Capacity`, decl.initial_capacity[X], 'active capacity');
    S(`${p} Decommissioning Capacity`, 0, 'decommissioning capacity');
    S(`${p} Retired Capacity`, 0, 'retired capacity');
    V(`${p} Required Active Capacity`, `[${signal}] * [${P} Operating Reserve Factor]`, 'required active capacity');
    V(`${p} Desired Installed Capacity`, `[${p} Required Active Capacity] * [${P} Installed Reserve Factor]`, 'desired installed capacity');
    V(`${p} Inactive Capacity`, mx(`[${p} Installed Capacity]`, `[${p} Active Capacity]`), 'inactive capacity');
    V(`${p} Target Active Capacity`, mn(`[${p} Required Active Capacity]`, `[${p} Installed Capacity]`), 'target active capacity');
    V(`${p} Activation Gap`, mx(`[${p} Target Active Capacity]`, `[${p} Active Capacity]`), 'activation gap');
    V(`${p} Mothball Gap`, mx(`[${p} Active Capacity]`, `[${p} Target Active Capacity]`), 'mothball gap');
    V(`${p} Installed Capacity Shortage`, mx(`[${p} Desired Installed Capacity]`, `[${p} Installed Capacity]`), 'installed shortage');
    V(`${p} Installed Capacity Excess`, mx(`[${p} Installed Capacity]`, `[${p} Desired Installed Capacity]`), 'installed excess');
    V(`${p} Gap Limited Construction`, `[${p} Installed Capacity Shortage] / [${P} Construction Time]`, 'gap limited construction');
    V(`${p} Desired Expansion`, `IfThenElse([${SW}] = 1, [${p} Gap Limited Construction], 0)`, 'desired expansion');
    V(`${p} Activation Queue Capacity`, mn(`[${p} Inactive Capacity]`, `[${p} Activation Gap]`), 'activation queue');
    V(`${p} Strategic Reserve Target`, mx(`[${p} Desired Installed Capacity]`, `[${p} Required Active Capacity]`), 'strategic reserve target');
    V(`${p} Inactive After Activation Queue`, mx(`[${p} Inactive Capacity]`, `[${p} Activation Queue Capacity]`), 'inactive after activation queue');
    V(`${p} Strategic Reserve Capacity`, mn(`[${p} Inactive After Activation Queue]`, `[${p} Strategic Reserve Target]`), 'strategic reserve');
    V(`${p} Surplus Capacity`, mx(`[${p} Inactive After Activation Queue]`, `[${p} Strategic Reserve Capacity]`), 'surplus capacity');
    V(`${p} Lifetime Capacity Account`, `[${p} Installed Capacity] + [${p} Decommissioning Capacity] + [${p} Retired Capacity]`, 'lifetime capacity account');

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

    F(`${p} Expansion`, null, `${p} Installed Capacity`,
      `IfThenElse([${SW}] = 1, [${p} Gap Limited Construction] * Min(${backing.map(b => `[${b.fulfillment}]`).join(', ')}), 0)`, 'expansion');
    F(`${p} Activation`, null, `${p} Active Capacity`, `[${p} Activation Gap] / [${P} Activation Time]`, 'activation');
    F(`${p} Mothballing`, `${p} Active Capacity`, null, `[${p} Mothball Gap] / [${P} Mothball Time]`, 'mothballing');
    F(`${p} Active Depreciation`, `${p} Active Capacity`, null, `[${p} Active Capacity] * [${P} Depreciation Rate]`, 'active depreciation');
    F(`${p} Decommissioning Initiation`, `${p} Installed Capacity`, `${p} Decommissioning Capacity`, `[${p} Surplus Capacity] / [${P} Surplus Disposal Decision Time]`, 'decommissioning initiation');
    F(`${p} Depreciation`, `${p} Installed Capacity`, `${p} Retired Capacity`, `[${p} Installed Capacity] * [${P} Depreciation Rate]`, 'installed depreciation');
    F(`${p} Dismantling Completion`, `${p} Decommissioning Capacity`, `${p} Retired Capacity`, `[${p} Decommissioning Capacity] / [${P} Decommissioning Time]`, 'dismantling completion');
    for (const b of backing) {
      F(`${p} ${b.good} Consumption`, b.inventory, null,
        `IfThenElse([${SW}] = 1, [${p} Expansion] * [${P} ${b.good} per Capacity], 0)`, `${b.good} consumption`);
    }

    const cap = X_(decl.capacity_output.variable, X);
    const baseRef = `[${X_(decl.capacity_output.replaces, X)}]`;
    const oc = old(cap);
    if (oc.split(baseRef).length - 1 < 1) throw new Error(`${cap} does not read ${baseRef}`);
    pushReplacement(cap, `IfThenElse([${SW}] = 1, ${oc.replaceAll(baseRef, `[${p} Active Capacity]`)}, ${oc})`);
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
    kernel_instances: decl.colonies.map(X => ({
      name: `${X} ${P}`,
      sector: P,
      switch_gated: false,
      roles: Object.fromEntries(Object.entries(ROLES).map(([r, s]) => [r, `${X} ${P} ${s}`])),
      kernel_version: 2
    })),
    capital_transformation_names: [`? ${P} Expansion`, ...decl.backing.map(b => `? ${P} ${b.good} Consumption`)],
    transformation_pairs: decl.colonies.map(X => ({
      source: `${X} ${P} Expansion`,
      sinks: decl.backing.map(b => `${X} ${P} ${b.good} Consumption`),
      identity: `${X} ${P} capital goods pair identity`
    })),
    planet_closure: {
      process: decl.planet_process,
      capacity: { kind: 'kernel', stock: `{C} ${P} Active Capacity` }
    }
  };

  return { patch: { add_elements: add, replace_formulas: replace, add_links: links }, validation };
}
