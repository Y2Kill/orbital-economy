import { runDepositConformance } from './deposit.js';

// Static (pre-simulation) conformance check of Capital Lifecycle Kernel instances.
//
// The kernel is a topology + dependency contract over ModelJSON, not a formula contract.
// It checks that a sector instance HAS the kernel parts wired the kernel way; it does not
// parse or evaluate formulas and does not require equal coefficients between sectors.
// Numeric identities (Active <= Installed, Inactive identity, Lifetime identity, ...) are
// verified at runtime by the `capital_lifecycle_kernel` plugin branch in checks.js.

export const KERNEL_FORMAT = 'orbital-economy-capital-lifecycle-kernel-v1';

// Role catalogue. `deps` = roles whose primitive MUST be referenced in this role's formula
// (and be connected by a LINK). Extra references (time constants, switches, sector policy)
// are allowed: that is where sector policy lives.
export const KERNEL_ROLES = {
  // physical stocks
  installed:        { kind: 'STOCK' },
  active:           { kind: 'STOCK' },
  decommissioning:  { kind: 'STOCK' },
  retired:          { kind: 'STOCK' },
  // sector policy inputs (must exist; how they are computed is NOT kernel)
  required_active:  { kind: 'VARIABLE', policy: true },
  desired_installed:{ kind: 'VARIABLE', policy: true },
  strategic_reserve_target: { kind: 'VARIABLE', policy: true },
  // derived kernel quantities
  inactive:         { kind: 'VARIABLE', deps: ['installed', 'active'] },
  target_active:    { kind: 'VARIABLE', deps: ['required_active', 'installed'] },
  activation_gap:   { kind: 'VARIABLE', deps: ['target_active', 'active'] },
  mothball_gap:     { kind: 'VARIABLE', deps: ['active', 'target_active'] },
  installed_shortage: { kind: 'VARIABLE', deps: ['desired_installed', 'installed'] },
  installed_excess: { kind: 'VARIABLE', deps: ['installed', 'desired_installed'] },
  gap_limited_construction: { kind: 'VARIABLE', deps: ['installed_shortage'] },
  activation_queue: { kind: 'VARIABLE', deps: ['inactive', 'activation_gap'] },
  inactive_after_activation_queue: { kind: 'VARIABLE', deps: ['inactive', 'activation_queue'] },
  strategic_reserve: { kind: 'VARIABLE', deps: ['inactive_after_activation_queue', 'strategic_reserve_target'] },
  surplus:          { kind: 'VARIABLE', deps: ['inactive_after_activation_queue', 'strategic_reserve'] },
  lifetime:         { kind: 'VARIABLE', deps: ['installed', 'decommissioning', 'retired'] },
  // physical flows: from/to are kernel topology (null = outside the model boundary)
  activation:       { kind: 'FLOW', from: null, to: 'active', deps: ['activation_gap'] },
  mothballing:      { kind: 'FLOW', from: 'active', to: null, deps: ['mothball_gap'] },
  active_depreciation: { kind: 'FLOW', from: 'active', to: null, deps: ['active'] },
  expansion:        { kind: 'FLOW', from: null, to: 'installed', deps: ['gap_limited_construction'] },
  decommissioning_initiation: { kind: 'FLOW', from: 'installed', to: 'decommissioning', deps: ['surplus'] },
  installed_depreciation: { kind: 'FLOW', from: 'installed', to: 'retired', deps: ['installed'] },
  dismantling_completion: { kind: 'FLOW', from: 'decommissioning', to: 'retired', deps: ['decommissioning'] },
  // optional sector policy parts (presence is a documented variation, never a failure)
  finance_limited_construction: { kind: 'VARIABLE', optional: true, policy: true },
  // kernel-v2 (v7.5): expansion is physically backed by capital goods. Both roles are optional for a v1 instance
  // and REQUIRED when the instance declares kernel_version: 2. `from: '*'` = any STOCK (the capital-goods inventory
  // is not a kernel role); the pair identity (consumption = expansion × coefficient) is a runtime check.
  desired_expansion: { kind: 'VARIABLE', optional: true, v2: true, policy: true },
  capital_goods_consumption: { kind: 'FLOW', optional: true, v2: true, from: '*', to: null, deps: ['expansion'] },
  // optional second physical draw for shared infrastructure (v7.5.1 Transport); not required by kernel-v2 generally.
  capital_goods_consumption_secondary: { kind: 'FLOW', optional: true, from: '*', to: null, deps: ['expansion'] }
};

export const KERNEL_FLOWS = Object.keys(KERNEL_ROLES).filter(r => KERNEL_ROLES[r].kind === 'FLOW');
export const KERNEL_STOCKS = Object.keys(KERNEL_ROLES).filter(r => KERNEL_ROLES[r].kind === 'STOCK');
export const REQUIRED_ROLES = Object.keys(KERNEL_ROLES).filter(r => !KERNEL_ROLES[r].optional);

const REF_RE = /\[([^\]]+)\]/g;

export function formulaRefs(el) {
  const out = new Set();
  const b = el?.behavior || {};
  for (const text of [b.value, b.initial_value]) {
    if (typeof text !== 'string') continue;
    for (const m of text.matchAll(REF_RE)) out.add(m[1].trim().toLowerCase());
  }
  return out;
}

export function indexModel(raw) {
  const byName = new Map();      // lower-case name -> element (non-LINK)
  const duplicates = [];
  const links = new Set();       // "from|to" lower-case
  for (const el of raw?.elements || []) {
    if (!el) continue;
    if (el.type === 'LINK') {
      links.add(`${String(el.from ?? '').toLowerCase()}|${String(el.to ?? '').toLowerCase()}`);
      continue;
    }
    if (!el.name) continue;
    const key = el.name.toLowerCase();
    if (byName.has(key)) duplicates.push(el.name);
    byName.set(key, el);
  }
  return {
    byName, duplicates, links,
    get(name) { return name == null ? null : byName.get(String(name).toLowerCase()) || null; },
    hasLink(from, to) { return links.has(`${String(from).toLowerCase()}|${String(to).toLowerCase()}`); }
  };
}

function pass(name, details = {}) { return { status: 'PASS', name, ...details }; }
function fail(name, message, details = {}) { return { status: 'FAIL', name, message, ...details }; }
function note(name, message, details = {}) { return { status: 'NOTE', name, message, ...details }; }

export function validateKernelSpec(plugin) {
  const errors = [];
  if (!plugin || typeof plugin !== 'object') { errors.push('kernel plugin must be an object'); return errors; }
  if (!Array.isArray(plugin.instances) || plugin.instances.length === 0) errors.push('kernel plugin needs a non-empty "instances" array');
  const names = new Set();
  for (const [i, inst] of (plugin.instances || []).entries()) {
    const p = `instances[${i}]`;
    if (!inst?.name) errors.push(`${p}.name is required`);
    else if (names.has(inst.name)) errors.push(`duplicate instance name: ${inst.name}`);
    else names.add(inst.name);
    if (!inst?.roles || typeof inst.roles !== 'object') { errors.push(`${p}.roles is required`); continue; }
    for (const role of Object.keys(inst.roles)) if (!KERNEL_ROLES[role]) errors.push(`${p}.roles: unknown role "${role}"`);
    for (const role of REQUIRED_ROLES) if (!inst.roles[role]) errors.push(`${p}.roles: required role "${role}" is not mapped`);
    if (inst.kernel_version != null && ![1, 2].includes(inst.kernel_version)) errors.push(`${p}.kernel_version must be 1 or 2`);
    if (inst.kernel_version === 2) for (const role of Object.keys(KERNEL_ROLES).filter(r => KERNEL_ROLES[r].v2)) if (!inst.roles[role]) errors.push(`${p}.roles: kernel_version 2 requires role "${role}"`);
    if (inst.switch_gated != null && typeof inst.switch_gated !== 'boolean') errors.push(`${p}.switch_gated must be boolean`);
  }
  if (plugin.legacy_switch != null && typeof plugin.legacy_switch !== 'string') errors.push('legacy_switch must be a string');
  return errors;
}

// Checks one instance against the kernel. Returns { name, sector, classification, checks, variations }.
export function checkInstance(index, inst, plugin) {
  const checks = [];
  const variations = [];
  const roles = inst.roles || {};
  const legacySwitch = plugin.legacy_switch || 'Capital Lifecycle Enabled';
  const resolved = new Map(); // role -> element

  // 1. role presence + primitive type
  for (const role of Object.keys(KERNEL_ROLES)) {
    const spec = KERNEL_ROLES[role];
    const name = roles[role];
    if (!name) {
      if (spec.v2) { if (inst.kernel_version === 2) checks.push(fail(`role ${role}`, 'kernel_version 2 requires this role')); }  // v2 roles are simply not expected on a v1 instance
      else if (spec.optional) variations.push(`optional role "${role}" not present`);
      else checks.push(fail(`role ${role}`, 'required role is not mapped'));
      continue;
    }
    const el = index.get(name);
    if (!el) { checks.push(fail(`role ${role}`, `primitive not found: ${name}`)); continue; }
    if (el.type !== spec.kind) { checks.push(fail(`role ${role}`, `${name}: expected ${spec.kind}, found ${el.type}`)); continue; }
    resolved.set(role, el);
    checks.push(pass(`role ${role}`, { primitive: name, type: el.type }));
  }

  // 2. flow topology
  for (const role of KERNEL_FLOWS) {
    const el = resolved.get(role);
    if (!el) continue;
    const spec = KERNEL_ROLES[role];
    const gotFrom = el.from ?? null, gotTo = el.to ?? null;
    const eq = (a, b) => (a == null && b == null) || (a != null && b != null && String(a).toLowerCase() === String(b).toLowerCase());
    if (spec.from === '*') {
      // any STOCK as source (capital goods inventory), sink must be ∅
      const src = gotFrom ? index.get(gotFrom) : null;
      const label = `flow ${role}: <stock> -> ∅`;
      if (src && src.type === 'STOCK' && gotTo == null) checks.push(pass(label, { from: src.name }));
      else checks.push(fail(label, `${el.name} is wired ${gotFrom ?? '∅'} -> ${gotTo ?? '∅'}`));
      continue;
    }
    const wantFrom = spec.from ? roles[spec.from] : null;
    const wantTo = spec.to ? roles[spec.to] : null;
    const label = `flow ${role}: ${wantFrom ?? '∅'} -> ${wantTo ?? '∅'}`;
    if (eq(gotFrom, wantFrom) && eq(gotTo, wantTo)) checks.push(pass(label));
    else checks.push(fail(label, `${el.name} is wired ${gotFrom ?? '∅'} -> ${gotTo ?? '∅'}`));
  }

  // 3. dependency wiring: formula reference + LINK for every kernel dependency
  for (const role of Object.keys(KERNEL_ROLES)) {
    const spec = KERNEL_ROLES[role];
    const el = resolved.get(role);
    if (!el || !spec.deps) continue;
    const refs = formulaRefs(el);
    for (const dep of spec.deps) {
      const depName = roles[dep];
      const label = `dep ${role} <- ${dep}`;
      if (!depName) { checks.push(fail(label, `dependency role ${dep} is not mapped`)); continue; }
      if (!refs.has(depName.toLowerCase())) { checks.push(fail(label, `${el.name} does not reference [${depName}]`)); continue; }
      if (!index.hasLink(depName, el.name)) { checks.push(fail(label, `missing LINK ${depName} -> ${el.name}`)); continue; }
      checks.push(pass(label));
    }
  }

  // 4. dangling references inside kernel elements (any ref must resolve and be linked)
  for (const [role, el] of resolved) {
    for (const ref of formulaRefs(el)) {
      const target = index.get(ref);
      if (!target) checks.push(fail(`refs ${role}`, `${el.name} references unknown primitive [${ref}]`));
      else if (!index.hasLink(target.name, el.name)) checks.push(fail(`refs ${role}`, `${el.name} references [${target.name}] without a LINK`));
    }
  }

  // 5. legacy lifecycle switch semantics
  const gated = inst.switch_gated === true;
  const switchKey = legacySwitch.toLowerCase();
  const gatedFlows = [], ungatedFlows = [], gatedOther = [];
  for (const [role, el] of resolved) {
    const uses = formulaRefs(el).has(switchKey);
    if (KERNEL_ROLES[role].kind === 'FLOW') (uses ? gatedFlows : ungatedFlows).push(role);
    else if (uses) gatedOther.push(role);
  }
  if (gated) {
    if (ungatedFlows.length) checks.push(fail(`switch ${legacySwitch}`, `switch_gated instance has ungated flows: ${ungatedFlows.join(', ')}`));
    else checks.push(pass(`switch ${legacySwitch}`, { gatedFlows: gatedFlows.length }));
    variations.push(`all kernel flows are gated by [${legacySwitch}] (v7.3 regression switch)`);
  } else {
    const offenders = [...gatedFlows, ...gatedOther];
    if (offenders.length) checks.push(fail(`switch ${legacySwitch}`, `instance is not declared switch_gated but references the legacy switch in: ${offenders.join(', ')}`));
    else checks.push(pass(`switch ${legacySwitch}`, { gatedFlows: 0 }));
  }

  // 6. informative: policy roles + parameter descriptors are never judged
  if (inst.policy_notes) for (const n of [].concat(inst.policy_notes)) variations.push(String(n));
  if (inst.kernel_version === 2) variations.push('kernel-v2: expansion physically backed by capital goods');

  const failed = checks.filter(c => c.status === 'FAIL');
  const classification = failed.length ? 'NON_CONFORMING' : variations.length ? 'CONFORMING_WITH_VARIATION' : 'CONFORMING';
  return { name: inst.name, sector: inst.sector || null, classification, checks, variations, failures: failed.map(c => `${c.name}: ${c.message}`) };
}

// Model-wide sanity relevant to any kernel: unresolved formula refs and refs without LINK.
export function checkModelWideReferences(index) {
  const unresolved = [];
  const unlinked = [];
  for (const el of index.byName.values()) {
    for (const ref of formulaRefs(el)) {
      const target = index.get(ref);
      if (!target) unresolved.push(`${el.name} -> [${ref}]`);
      else if (!index.hasLink(target.name, el.name)) unlinked.push(`${target.name} -> ${el.name}`);
    }
  }
  const checks = [];
  checks.push(index.duplicates.length ? fail('duplicate primitive names', index.duplicates.join(', ')) : pass('duplicate primitive names', { count: 0 }));
  checks.push(unresolved.length ? fail('unresolved formula references', `${unresolved.length}: ${unresolved.slice(0, 10).join('; ')}`) : pass('unresolved formula references', { count: 0 }));
  checks.push(unlinked.length ? fail('formula dependencies without LINK', `${unlinked.length}: ${unlinked.slice(0, 10).join('; ')}`) : pass('formula dependencies without LINK', { count: 0 }));
  return checks;
}

export function findKernelPlugin(validation) {
  return (validation?.plugins || []).find(p => p?.type === 'capital_lifecycle_kernel') || null;
}

export const SIMPLE_CAPITAL_ROLES = {
  capacity: { kind: 'STOCK' },
  desired_capacity: { kind: 'VARIABLE' },
  shortage: { kind: 'VARIABLE', deps: ['desired_capacity', 'capacity'] },
  excess: { kind: 'VARIABLE', deps: ['desired_capacity', 'capacity'] },
  desired_expansion: { kind: 'VARIABLE', deps: ['shortage'] },
  expansion: { kind: 'FLOW', from: null, to: 'capacity', deps: ['desired_expansion'] },
  depreciation: { kind: 'FLOW', from: 'capacity', to: null, deps: ['capacity'] },
  retirement: { kind: 'FLOW', from: 'capacity', to: null, deps: ['excess'] }
};

export function findSimpleCapitalPlugin(validation) {
  return (validation?.plugins || []).find(p => p?.type === 'simple_capital') || null;
}

export function validateSimpleCapitalSpec(plugin) {
  const errors = [];
  if (!plugin || typeof plugin !== 'object') return ['simple_capital plugin must be an object'];
  if (!Array.isArray(plugin.instances) || plugin.instances.length === 0) errors.push('simple_capital plugin needs a non-empty "instances" array');
  const names = new Set();
  for (const [i, inst] of (plugin.instances || []).entries()) {
    const p = `instances[${i}]`;
    if (!inst?.name) errors.push(`${p}.name is required`);
    else if (names.has(inst.name)) errors.push(`duplicate simple_capital instance name: ${inst.name}`);
    else names.add(inst.name);
    if (!inst?.sector) errors.push(`${p}.sector is required`);
    if (!inst?.sizing_signal || typeof inst.sizing_signal !== 'string') errors.push(`${p}.sizing_signal is required`);
    if (!inst?.roles || typeof inst.roles !== 'object') { errors.push(`${p}.roles is required`); continue; }
    for (const role of Object.keys(inst.roles)) if (!SIMPLE_CAPITAL_ROLES[role]) errors.push(`${p}.roles: unknown role "${role}"`);
    for (const role of Object.keys(SIMPLE_CAPITAL_ROLES)) if (!inst.roles[role]) errors.push(`${p}.roles: required role "${role}" is not mapped`);
    if (!Array.isArray(inst.consumption)) errors.push(`${p}.consumption must be an array`);
  }
  return errors;
}

export function checkSimpleCapitalInstance(index, inst) {
  const checks = [];
  const roles = inst.roles || {};
  const resolved = new Map();
  const eq = (a, b) => (a == null && b == null) || (a != null && b != null && String(a).toLowerCase() === String(b).toLowerCase());

  for (const [role, spec] of Object.entries(SIMPLE_CAPITAL_ROLES)) {
    const name = roles[role];
    const el = name ? index.get(name) : null;
    if (!name) { checks.push(fail(`role ${role}`, 'required role is not mapped')); continue; }
    if (!el) { checks.push(fail(`role ${role}`, `primitive not found: ${name}`)); continue; }
    if (el.type !== spec.kind) { checks.push(fail(`role ${role}`, `${name}: expected ${spec.kind}, found ${el.type}`)); continue; }
    resolved.set(role, el);
    checks.push(pass(`role ${role}`, { primitive: name, type: el.type }));
  }

  for (const [role, spec] of Object.entries(SIMPLE_CAPITAL_ROLES)) {
    if (spec.kind !== 'FLOW') continue;
    const el = resolved.get(role);
    if (!el) continue;
    const wantFrom = spec.from ? roles[spec.from] : null;
    const wantTo = spec.to ? roles[spec.to] : null;
    const label = `flow ${role}: ${wantFrom ?? '∅'} -> ${wantTo ?? '∅'}`;
    if (eq(el.from ?? null, wantFrom) && eq(el.to ?? null, wantTo)) checks.push(pass(label));
    else checks.push(fail(label, `${el.name} is wired ${el.from ?? '∅'} -> ${el.to ?? '∅'}`));
  }

  for (const [role, spec] of Object.entries(SIMPLE_CAPITAL_ROLES)) {
    const el = resolved.get(role);
    if (!el || !spec.deps) continue;
    const refs = formulaRefs(el);
    for (const dep of spec.deps) {
      const depName = roles[dep];
      const label = `dep ${role} <- ${dep}`;
      if (!refs.has(String(depName).toLowerCase())) { checks.push(fail(label, `${el.name} does not reference [${depName}]`)); continue; }
      if (!index.hasLink(depName, el.name)) { checks.push(fail(label, `missing LINK ${depName} -> ${el.name}`)); continue; }
      checks.push(pass(label));
    }
  }

  const signal = index.get(inst.sizing_signal);
  if (!signal) checks.push(fail('sizing signal', `primitive not found: ${inst.sizing_signal}`));
  else if (signal.type !== 'STOCK') checks.push(fail('sizing signal', `${signal.name}: expected STOCK, found ${signal.type}`));
  else {
    checks.push(pass('sizing signal', { primitive: signal.name, type: signal.type }));
    const desired = resolved.get('desired_capacity');
    if (desired) {
      const refs = formulaRefs(desired);
      if (!refs.has(signal.name.toLowerCase())) checks.push(fail('desired_capacity <- sizing_signal', `${desired.name} does not directly reference [${signal.name}]`));
      else if (!index.hasLink(signal.name, desired.name)) checks.push(fail('desired_capacity <- sizing_signal', `missing LINK ${signal.name} -> ${desired.name}`));
      else checks.push(pass('desired_capacity <- sizing_signal'));
    }
  }

  for (const name of inst.consumption || []) {
    const el = index.get(name);
    const label = `consumption ${name}`;
    if (!el) { checks.push(fail(label, 'primitive not found')); continue; }
    if (el.type !== 'FLOW') { checks.push(fail(label, `expected FLOW, found ${el.type}`)); continue; }
    const src = el.from ? index.get(el.from) : null;
    if (!src || src.type !== 'STOCK' || el.to != null) checks.push(fail(label, `${el.name} must be wired <STOCK> -> ∅`));
    else if (!formulaRefs(el).has(String(roles.expansion).toLowerCase())) checks.push(fail(label, `${el.name} does not reference [${roles.expansion}]`));
    else if (!index.hasLink(roles.expansion, el.name)) checks.push(fail(label, `missing LINK ${roles.expansion} -> ${el.name}`));
    else checks.push(pass(label));
  }

  const failed = checks.filter(x => x.status === 'FAIL');
  return {
    name: inst.name,
    sector: inst.sector || null,
    classification: failed.length ? 'NON_CONFORMING' : 'CONFORMING',
    checks,
    variations: [],
    failures: failed.map(x => `${x.name}: ${x.message}`)
  };
}

export function runSimpleCapitalConformance(raw, validation, index = indexModel(raw)) {
  const plugin = findSimpleCapitalPlugin(validation);
  if (!plugin) return { status: 'SKIPPED', instances: [], summary: { instances: 0, conforming: 0, nonConforming: 0 } };
  const specErrors = validateSimpleCapitalSpec(plugin);
  if (specErrors.length) return { status: 'FAIL', specErrors, instances: [], summary: { instances: 0, conforming: 0, nonConforming: 0 } };
  const instances = plugin.instances.map(inst => checkSimpleCapitalInstance(index, inst));
  const nonConforming = instances.filter(i => i.classification === 'NON_CONFORMING').length;
  return {
    status: nonConforming ? 'FAIL' : 'PASS',
    instances,
    summary: { instances: instances.length, conforming: instances.length - nonConforming, nonConforming }
  };
}


export function findLaborMarketPlugin(validation) { return (validation?.plugins || []).find(p => p?.type === 'labor_market') || null; }
export function validateLaborMarketSpec(plugin) {
  const errors=[];
  if(!plugin||typeof plugin!=='object') return ['labor_market plugin must be an object'];
  if(!(typeof plugin.abs_tol==='number'&&Number.isFinite(plugin.abs_tol)&&plugin.abs_tol>0)) errors.push('labor_market.abs_tol must be a finite number > 0');
  if(!(typeof plugin.rel_tol==='number'&&Number.isFinite(plugin.rel_tol)&&plugin.rel_tol>0)) errors.push('labor_market.rel_tol must be a finite number > 0');
  if(typeof plugin.switch!=='string'||!plugin.switch) errors.push('labor_market.switch is required');
  if(typeof plugin.floor!=='string'||!plugin.floor) errors.push('labor_market.floor is required');
  if(!Array.isArray(plugin.instances)||!plugin.instances.length) errors.push('labor_market plugin needs a non-empty instances array');
  const names=new Set(),colonies=new Set();
  const fields=['name','colony','availability','labor_force','labor_demand_signal','tightness','wage','initial_wage'];
  for(const [i,inst] of (plugin.instances||[]).entries()){
    const p=`instances[${i}]`;
    for(const k of fields) if(typeof inst?.[k]!=='string'||!inst[k]) errors.push(`${p}.${k} is required`);
    if(inst?.name){if(names.has(inst.name))errors.push(`duplicate labor_market instance name: ${inst.name}`);names.add(inst.name);}
    if(inst?.colony){if(colonies.has(inst.colony))errors.push(`duplicate labor_market colony: ${inst.colony}`);colonies.add(inst.colony);}
    if(!Array.isArray(inst?.rates)||!inst.rates.length) errors.push(`${p}.rates must be a non-empty array`);
    if(!Array.isArray(inst?.demand)||!inst.demand.length) errors.push(`${p}.demand must be a non-empty array`);
    for(const [j,d] of (inst?.demand||[]).entries()) for(const k of ['target','per_capita','population']) if(typeof d?.[k]!=='string'||!d[k]) errors.push(`${p}.demand[${j}].${k} is required`);
  }
  return errors;
}
export function checkLaborMarketInstance(index,inst,plugin){
  const checks=[],resolved={};
  const roles={availability:'VARIABLE',labor_demand_signal:'STOCK',tightness:'VARIABLE',wage:'STOCK',initial_wage:'VARIABLE'};
  for(const [role,kind] of Object.entries(roles)){
    const e=index.get(inst[role]);
    if(!e){checks.push(fail(`role ${role}`,`primitive not found: ${inst[role]}`));continue;}
    if(e.type!==kind){checks.push(fail(`role ${role}`,`${e.name}: expected ${kind}, found ${e.type}`));continue;}
    resolved[role]=e;checks.push(pass(`role ${role}`,{primitive:e.name,type:e.type}));
  }
  const availability=resolved.availability;
  if(availability){
    const refs=formulaRefs(availability);
    for(const [source,label] of [[inst.labor_force,'labor_force'],[inst.labor_demand_signal,'labor_demand_signal']]){
      if(!refs.has(String(source).toLowerCase())) checks.push(fail(`availability <- ${label}`,`${availability.name} does not reference [${source}]`));
      else if(!index.hasLink(source,availability.name)) checks.push(fail(`availability <- ${label}`,`missing LINK ${source} -> ${availability.name}`));
      else checks.push(pass(`availability <- ${label}`));
    }
  }
  const outerSwitch = e => String(e?.behavior?.value ?? '').trim().startsWith(`IfThenElse([${plugin.switch}] = 1,`);
  for(const rateName of inst.rates||[]){
    const e=index.get(rateName),label=`rate ${rateName} is switch-wrapped and reads availability`;
    if(!e){checks.push(fail(label,'primitive not found'));continue;}
    if(!outerSwitch(e))checks.push(fail(label,`${rateName} is not outer-wrapped by [${plugin.switch}] = 1`));
    else if(!formulaRefs(e).has(String(inst.availability).toLowerCase()))checks.push(fail(label,`${rateName} does not reference [${inst.availability}]`));
    else if(!index.hasLink(inst.availability,rateName))checks.push(fail(label,`missing LINK ${inst.availability} -> ${rateName}`));
    else checks.push(pass(label));
  }
  for(const d of inst.demand||[]){
    const e=index.get(d.target),label=`demand ${d.target} is switch-wrapped and reads per-capita and population`;
    if(!e){checks.push(fail(label,'primitive not found'));continue;}
    const refs=formulaRefs(e), missing=[d.per_capita,d.population].filter(x=>!refs.has(String(x).toLowerCase()));
    if(!outerSwitch(e))checks.push(fail(label,`${d.target} is not outer-wrapped by [${plugin.switch}] = 1`));
    else if(missing.length)checks.push(fail(label,`${d.target} does not reference ${missing.map(x=>'['+x+']').join(' and ')}`));
    else if(!index.hasLink(d.per_capita,d.target)||!index.hasLink(d.population,d.target))checks.push(fail(label,'required LINK is missing'));
    else checks.push(pass(label));
  }
  const failed=checks.filter(x=>x.status==='FAIL');
  return{name:inst.name,sector:inst.colony||null,classification:failed.length?'NON_CONFORMING':'CONFORMING',checks,variations:[],failures:failed.map(x=>`${x.name}: ${x.message}`)};
}
export function runLaborMarketConformance(raw,validation,index=indexModel(raw)){
  const plugin=findLaborMarketPlugin(validation);
  if(!plugin)return{status:'SKIPPED',instances:[],summary:{instances:0,conforming:0,nonConforming:0}};
  const specErrors=validateLaborMarketSpec(plugin);
  if(specErrors.length)return{status:'FAIL',specErrors,instances:[],summary:{instances:0,conforming:0,nonConforming:0}};
  const instances=plugin.instances.map(i=>checkLaborMarketInstance(index,i,plugin)),n=instances.filter(i=>i.classification==='NON_CONFORMING').length;
  return{status:n?'FAIL':'PASS',instances,summary:{instances:instances.length,conforming:instances.length-n,nonConforming:n}};
}

export function findFoodPlugin(validation) { return (validation?.plugins || []).find(p => p?.type === 'food') || null; }
export function validateFoodSpec(plugin) {
  const errors = [];
  if (!plugin || typeof plugin !== 'object') return ['food plugin must be an object'];
  if (!(typeof plugin.abs_tol === 'number' && Number.isFinite(plugin.abs_tol) && plugin.abs_tol > 0)) errors.push('food.abs_tol must be a finite number > 0');
  if (!Array.isArray(plugin.instances) || !plugin.instances.length) errors.push('food plugin needs a non-empty instances array');
  const names = new Set(), colonies = new Set();
  const fields = ['name','colony','inventory','production','consumption','demand','fulfillment','farm_capacity','farm_effective_capacity','land'];
  for (const [i, inst] of (plugin.instances || []).entries()) {
    const p = `instances[${i}]`;
    for (const x of fields) if (typeof inst?.[x] !== 'string' || !inst[x]) errors.push(`${p}.${x} is required`);
    if (!Array.isArray(inst?.dispatch)) errors.push(`${p}.dispatch must be an array`);
    if (!Array.isArray(inst?.arrival)) errors.push(`${p}.arrival must be an array`);
    if (inst?.name) { if (names.has(inst.name)) errors.push(`duplicate food instance name: ${inst.name}`); names.add(inst.name); }
    if (inst?.colony) { if (colonies.has(inst.colony)) errors.push(`duplicate food colony: ${inst.colony}`); colonies.add(inst.colony); }
  }
  for (const x of ['load','capacity','max_share']) if (typeof plugin.transport?.[x] !== 'string' || !plugin.transport[x]) errors.push(`food.transport.${x} is required`);
  return errors;
}
export function checkFoodInstance(index, inst, plugin, allInstances) {
  const checks = [], resolved = {};
  const roles = { inventory:'STOCK', production:'FLOW', consumption:'FLOW', farm_capacity:'STOCK', farm_effective_capacity:'VARIABLE', land:'VARIABLE' };
  for (const [role, kind] of Object.entries(roles)) {
    const e = index.get(inst[role]);
    if (!e) { checks.push(fail(`role ${role}`, `primitive not found: ${inst[role]}`)); continue; }
    if (e.type !== kind) { checks.push(fail(`role ${role}`, `${e.name}: expected ${kind}, found ${e.type}`)); continue; }
    resolved[role] = e; checks.push(pass(`role ${role}`, { primitive:e.name, type:e.type }));
  }
  const eq=(a,b)=>(a==null&&b==null)||(a!=null&&b!=null&&String(a).toLowerCase()===String(b).toLowerCase());
  if (resolved.production) checks.push(resolved.production.from == null && eq(resolved.production.to, inst.inventory) ? pass('production topology') : fail('production topology', `${resolved.production.name} must be ∅ -> ${inst.inventory}`));
  if (resolved.consumption) checks.push(eq(resolved.consumption.from, inst.inventory) && resolved.consumption.to == null ? pass('consumption topology') : fail('consumption topology', `${resolved.consumption.name} must be ${inst.inventory} -> ∅`));
  const dep=(target,source,label)=>{const t=resolved[target];if(!t)return;if(!formulaRefs(t).has(String(source).toLowerCase()))checks.push(fail(label,`${t.name} does not reference [${source}]`));else if(!index.hasLink(source,t.name))checks.push(fail(label,`missing LINK ${source} -> ${t.name}`));else checks.push(pass(label));};
  dep('production',inst.farm_effective_capacity,'production <- farm_effective_capacity');
  dep('farm_effective_capacity',inst.farm_capacity,'farm_effective_capacity <- farm_capacity');
  dep('farm_effective_capacity',inst.land,'farm_effective_capacity <- land');
  for (const name of inst.dispatch || []) {
    const d=index.get(name), label=`dispatch ${name}`;
    if(!d){checks.push(fail(label,'primitive not found'));continue;}
    if(d.type!=='FLOW'){checks.push(fail(label,`expected FLOW, found ${d.type}`));continue;}
    if(!eq(d.from,inst.inventory)||!d.to){checks.push(fail(label,`must leave ${inst.inventory} into a cargo stock`));continue;}
    const cargo=index.get(d.to);
    if(!cargo||cargo.type!=='STOCK'){checks.push(fail(label,`destination ${d.to} is not a STOCK`));continue;}
    const paired=allInstances.some(other=>other!==inst&&(other.arrival||[]).some(aName=>{const a=index.get(aName);return a?.type==='FLOW'&&eq(a.from,d.to)&&eq(a.to,other.inventory);}));
    checks.push(paired?pass(label):fail(label,`no arrival carries ${d.to} into another declared food inventory`));
  }
  for(const name of inst.arrival||[]){
    const a=index.get(name),label=`arrival ${name}`;
    if(!a){checks.push(fail(label,'primitive not found'));continue;}
    if(a.type!=='FLOW'){checks.push(fail(label,`expected FLOW, found ${a.type}`));continue;}
    if(!a.from||!eq(a.to,inst.inventory)){checks.push(fail(label,`must arrive from cargo into ${inst.inventory}`));continue;}
    const cargo=index.get(a.from);checks.push(cargo?.type==='STOCK'?pass(label):fail(label,`source ${a.from} is not a STOCK`));
  }
  const failed=checks.filter(x=>x.status==='FAIL');
  return {name:inst.name,sector:inst.colony||null,classification:failed.length?'NON_CONFORMING':'CONFORMING',checks,variations:[],failures:failed.map(x=>`${x.name}: ${x.message}`)};
}
export function runFoodConformance(raw, validation, index=indexModel(raw)) {
  const plugin=findFoodPlugin(validation);
  if(!plugin)return{status:'SKIPPED',instances:[],summary:{instances:0,conforming:0,nonConforming:0}};
  const specErrors=validateFoodSpec(plugin);
  if(specErrors.length)return{status:'FAIL',specErrors,instances:[],summary:{instances:0,conforming:0,nonConforming:0}};
  const instances=plugin.instances.map(i=>checkFoodInstance(index,i,plugin,plugin.instances)), n=instances.filter(i=>i.classification==='NON_CONFORMING').length;
  return {status:n?'FAIL':'PASS',instances,summary:{instances:instances.length,conforming:instances.length-n,nonConforming:n}};
}

export function findPopulationPlugin(validation) { return (validation?.plugins || []).find(p => p?.type === 'population') || null; }
export function validatePopulationSpec(plugin) {
  const errors=[];
  if(!plugin||typeof plugin!=='object') return ['population plugin must be an object'];
  if(!(typeof plugin.abs_tol==='number'&&Number.isFinite(plugin.abs_tol)&&plugin.abs_tol>0)) errors.push('population.abs_tol must be a finite number > 0');
  if(!Array.isArray(plugin.instances)||plugin.instances.length<2) errors.push('population plugin needs at least two instances');
  const names=new Set(),colonies=new Set();
  const fields=['name','colony','population','births','deaths','labor_force','employment','labor_requirement','participation'];
  for(const [i,inst] of (plugin.instances||[]).entries()){
    const p=`instances[${i}]`;
    for(const f of fields) if(typeof inst?.[f]!=='string'||!inst[f]) errors.push(`${p}.${f} is required`);
    if(inst?.name){if(names.has(inst.name))errors.push(`duplicate population instance name: ${inst.name}`);names.add(inst.name);}
    if(inst?.colony){if(colonies.has(inst.colony))errors.push(`duplicate population colony: ${inst.colony}`);colonies.add(inst.colony);}
    for(const f of ['immigration','emigration']) if(!Array.isArray(inst?.[f])) errors.push(`${p}.${f} must be an array`);
  }
  return errors;
}
export function checkPopulationInstance(index,inst,plugin,popByName) {
  const checks=[], resolved={};
  const roles={population:['STOCK'],births:['FLOW'],deaths:['FLOW'],labor_force:['VARIABLE'],employment:['VARIABLE'],labor_requirement:['VARIABLE'],participation:['VARIABLE']};
  for(const [role,kinds] of Object.entries(roles)){const el=index.get(inst[role]);if(!el){checks.push(fail(`role ${role}`,`primitive not found: ${inst[role]}`));continue;}if(!kinds.includes(el.type)){checks.push(fail(`role ${role}`,`${el.name}: expected ${kinds.join(' or ')}, found ${el.type}`));continue;}resolved[role]=el;checks.push(pass(`role ${role}`,{primitive:el.name,type:el.type}));}
  const eq=(a,b)=>(a==null&&b==null)||(a!=null&&b!=null&&String(a).toLowerCase()===String(b).toLowerCase());
  if(resolved.births){if(resolved.births.from==null&&eq(resolved.births.to,inst.population))checks.push(pass('birth topology'));else checks.push(fail('birth topology',`${resolved.births.name} must be ∅ -> ${inst.population}`));}
  if(resolved.deaths){if(eq(resolved.deaths.from,inst.population)&&resolved.deaths.to==null)checks.push(pass('death topology'));else checks.push(fail('death topology',`${resolved.deaths.name} must be ${inst.population} -> ∅`));}
  const dep=(target,source,label)=>{const t=resolved[target];if(!t)return;if(!formulaRefs(t).has(String(source).toLowerCase()))checks.push(fail(label,`${t.name} does not reference [${source}]`));else if(!index.hasLink(source,t.name))checks.push(fail(label,`missing LINK ${source} -> ${t.name}`));else checks.push(pass(label));};
  dep('labor_force',inst.population,'labor_force <- population');dep('labor_force',inst.participation,'labor_force <- participation');dep('employment',inst.labor_force,'employment <- labor_force');dep('employment',inst.labor_requirement,'employment <- labor_requirement');
  for(const [kind,flows] of [['emigration',inst.emigration||[]],['immigration',inst.immigration||[]]]) for(const name of flows){
    const f=index.get(name),label=`${kind} ${name}`; if(!f){checks.push(fail(label,'primitive not found'));continue;} if(f.type!=='FLOW'){checks.push(fail(label,`expected FLOW, found ${f.type}`));continue;}
    const own=inst.population, otherName=kind==='emigration'?f.to:f.from, ownEnd=kind==='emigration'?f.from:f.to;
    if(!eq(ownEnd,own)){checks.push(fail(label,`wrong own-population endpoint: ${f.from??'∅'} -> ${f.to??'∅'}`));continue;}
    const other=popByName.get(String(otherName||'').toLowerCase()); if(!other||other===inst){checks.push(fail(label,`other endpoint is not another declared population: ${otherName??'∅'}`));continue;}
    const mirrorList=kind==='emigration'?other.immigration:other.emigration; if(!(mirrorList||[]).includes(name)){checks.push(fail(label,`missing mirrored ${kind==='emigration'?'immigration':'emigration'} record in ${other.name}`));continue;}
    checks.push(pass(label));
  }
  const failed=checks.filter(x=>x.status==='FAIL');return{name:inst.name,sector:inst.colony||null,classification:failed.length?'NON_CONFORMING':'CONFORMING',checks,variations:[],failures:failed.map(x=>`${x.name}: ${x.message}`)};
}
export function runPopulationConformance(raw,validation,index=indexModel(raw)){
  const plugin=findPopulationPlugin(validation);if(!plugin)return{status:'SKIPPED',instances:[],summary:{instances:0,conforming:0,nonConforming:0}};
  const specErrors=validatePopulationSpec(plugin);if(specErrors.length)return{status:'FAIL',specErrors,instances:[],summary:{instances:0,conforming:0,nonConforming:0}};
  const popByName=new Map(plugin.instances.map(i=>[String(i.population).toLowerCase(),i]));
  const instances=plugin.instances.map(i=>checkPopulationInstance(index,i,plugin,popByName)),n=instances.filter(i=>i.classification==='NON_CONFORMING').length;
  return{status:n?'FAIL':'PASS',instances,summary:{instances:instances.length,conforming:instances.length-n,nonConforming:n}};
}

export function findLaborPlugin(validation) { return (validation?.plugins || []).find(p => p?.type === 'labor') || null; }
export function validateLaborSpec(plugin) {
  const errors=[]; if(!plugin||typeof plugin!=='object') return ['labor plugin must be an object'];
  if(typeof plugin.min_human_share!=='string'||!plugin.min_human_share) errors.push('labor.min_human_share is required');
  if(!(typeof plugin.abs_tol==='number'&&Number.isFinite(plugin.abs_tol)&&plugin.abs_tol>0)) errors.push('labor.abs_tol must be a finite number > 0');
  if(!Array.isArray(plugin.instances)||!plugin.instances.length) errors.push('labor plugin needs a non-empty "instances" array');
  const names=new Set(),roles=['output','intensity','automation_level','automation_factor','requirement'];
  for(const [i,inst] of (plugin.instances||[]).entries()){const p=`instances[${i}]`;if(!inst?.name)errors.push(`${p}.name is required`);else if(names.has(inst.name))errors.push(`duplicate labor instance name: ${inst.name}`);else names.add(inst.name);for(const role of roles)if(typeof inst?.[role]!=='string'||!inst[role])errors.push(`${p}.${role} is required`);}
  return errors;
}
export function checkLaborInstance(index,inst,plugin){
  const checks=[],resolved={},roles={output:['VARIABLE','FLOW'],intensity:['VARIABLE'],automation_level:['VARIABLE'],automation_factor:['VARIABLE'],requirement:['VARIABLE']};
  for(const [role,kinds] of Object.entries(roles)){const el=index.get(inst[role]);if(!el){checks.push(fail(`role ${role}`,`primitive not found: ${inst[role]}`));continue;}if(!kinds.includes(el.type)){checks.push(fail(`role ${role}`,`${el.name}: expected ${kinds.join(' or ')}, found ${el.type}`));continue;}resolved[role]=el;checks.push(pass(`role ${role}`,{primitive:el.name,type:el.type}));}
  const h=index.get(plugin.min_human_share);if(!h)checks.push(fail('min_human_share',`primitive not found: ${plugin.min_human_share}`));else if(h.type!=='VARIABLE')checks.push(fail('min_human_share',`${h.name}: expected VARIABLE, found ${h.type}`));else checks.push(pass('min_human_share',{primitive:h.name,type:h.type}));
  const dep=(tr,sn,sl)=>{const t=resolved[tr];if(!t||!sn)return;const label=`dep ${tr} <- ${sl}`;if(!formulaRefs(t).has(String(sn).toLowerCase()))checks.push(fail(label,`${t.name} does not reference [${sn}]`));else if(!index.hasLink(sn,t.name))checks.push(fail(label,`missing LINK ${sn} -> ${t.name}`));else checks.push(pass(label));};
  dep('requirement',inst.output,'output');dep('requirement',inst.intensity,'intensity');dep('requirement',inst.automation_factor,'automation_factor');dep('automation_factor',inst.automation_level,'automation_level');dep('automation_factor',plugin.min_human_share,'min_human_share');
  const failed=checks.filter(x=>x.status==='FAIL');return{name:inst.name,classification:failed.length?'NON_CONFORMING':'CONFORMING',checks,variations:[],failures:failed.map(x=>`${x.name}: ${x.message}`)};
}
export function runLaborConformance(raw,validation,index=indexModel(raw)){const plugin=findLaborPlugin(validation);if(!plugin)return{status:'SKIPPED',instances:[],summary:{instances:0,conforming:0,nonConforming:0}};const specErrors=validateLaborSpec(plugin);if(specErrors.length)return{status:'FAIL',specErrors,instances:[],summary:{instances:0,conforming:0,nonConforming:0}};const instances=plugin.instances.map(i=>checkLaborInstance(index,i,plugin)),n=instances.filter(i=>i.classification==='NON_CONFORMING').length;return{status:n?'FAIL':'PASS',instances,summary:{instances:instances.length,conforming:instances.length-n,nonConforming:n}};}

// Entry point: raw ModelJSON + validation JSON -> conformance report object.
export function runLifecycleConformance(raw, validation) {
  const plugin = findKernelPlugin(validation);
  if (!plugin) return { status: 'SKIPPED', format: KERNEL_FORMAT, message: 'validation has no capital_lifecycle_kernel plugin', instances: [], modelWide: [] };
  const specErrors = validateKernelSpec(plugin);
  if (specErrors.length) return { status: 'FAIL', format: KERNEL_FORMAT, message: 'invalid kernel spec', specErrors, instances: [], modelWide: [] };

  const index = indexModel(raw);
  const modelWide = checkModelWideReferences(index);
  const instances = plugin.instances.map(inst => checkInstance(index, inst, plugin));
  const simpleCapital = runSimpleCapitalConformance(raw, validation, index);
  const deposit = runDepositConformance(raw, validation, index);
  const labor = runLaborConformance(raw, validation, index);
  const population = runPopulationConformance(raw, validation, index);
  const food = runFoodConformance(raw, validation, index);
  const laborMarket = runLaborMarketConformance(raw, validation, index);
  const anyNonConforming = instances.some(i => i.classification === 'NON_CONFORMING');
  const modelWideFail = modelWide.some(c => c.status === 'FAIL');
  return {
    status: anyNonConforming || modelWideFail || simpleCapital.status === 'FAIL' || deposit.status === 'FAIL' || labor.status === 'FAIL' || population.status === 'FAIL' || food.status === 'FAIL' || laborMarket.status === 'FAIL' ? 'FAIL' : 'PASS',
    format: KERNEL_FORMAT,
    kernel: { roles: Object.keys(KERNEL_ROLES).length, requiredRoles: REQUIRED_ROLES.length, flows: KERNEL_FLOWS.length, stocks: KERNEL_STOCKS.length },
    legacySwitch: plugin.legacy_switch || 'Capital Lifecycle Enabled',
    summary: {
      instances: instances.length,
      conforming: instances.filter(i => i.classification === 'CONFORMING').length,
      conformingWithVariation: instances.filter(i => i.classification === 'CONFORMING_WITH_VARIATION').length,
      nonConforming: instances.filter(i => i.classification === 'NON_CONFORMING').length
    },
    modelWide,
    instances,
    simpleCapital,
    deposit,
    labor,
    population,
    food,
    laborMarket
  };
}

export function printConformance(report, log = console.log) {
  if (report.status === 'SKIPPED') { log(`[SKIP] Lifecycle conformance: ${report.message}`); return; }
  if (report.specErrors?.length) {
    log('[FAIL] Lifecycle conformance: invalid kernel spec');
    for (const e of report.specErrors) log(`    - ${e}`);
    return;
  }
  log(`Lifecycle kernel conformance: ${report.status}`);
  for (const c of report.modelWide) log(`    [${c.status}] ${c.name}${c.message ? `: ${c.message}` : ''}`);
  for (const inst of report.instances) {
    const checked = inst.checks.length, failed = inst.failures.length;
    log(`    ${inst.name.padEnd(16)} ${inst.classification}  (${checked - failed}/${checked} checks)`);
    for (const f of inst.failures) log(`        - ${f}`);
    for (const v of inst.variations) log(`        ~ ${v}`);
  }
  if (report.simpleCapital?.status !== 'SKIPPED') {
    log(`Simple capital conformance: ${report.simpleCapital.status}`);
    for (const inst of report.simpleCapital.instances || []) {
      const checked = inst.checks.length, failed = inst.failures.length;
      log(`    ${inst.name.padEnd(16)} ${inst.classification}  (${checked - failed}/${checked} checks)`);
      for (const f of inst.failures) log(`        - ${f}`);
    }
    for (const e of report.simpleCapital.specErrors || []) log(`    - ${e}`);
  }
  if (report.labor?.status !== 'SKIPPED') {
    log(`Labor conformance: ${report.labor.status}`);
    for(const inst of report.labor.instances||[]){const checked=inst.checks.length,failed=inst.failures.length;log(`    ${inst.name.padEnd(32)} ${inst.classification}  (${checked-failed}/${checked} checks)`);for(const f of inst.failures)log(`        - ${f}`);}for(const e of report.labor.specErrors||[])log(`    - ${e}`);
  }
  if (report.population?.status !== 'SKIPPED') {
    log(`Population conformance: ${report.population.status}`);
    for(const inst of report.population.instances||[]){const checked=inst.checks.length,failed=inst.failures.length;log(`    ${inst.name.padEnd(32)} ${inst.classification}  (${checked-failed}/${checked} checks)`);for(const f of inst.failures)log(`        - ${f}`);}for(const e of report.population.specErrors||[])log(`    - ${e}`);
  }
  if (report.laborMarket?.status !== 'SKIPPED') {
    log(`Labor market conformance: ${report.laborMarket.status}`);
    for(const inst of report.laborMarket.instances||[]){const checked=inst.checks.length,failed=inst.failures.length;log(`    ${inst.name.padEnd(32)} ${inst.classification}  (${checked-failed}/${checked} checks)`);for(const f of inst.failures)log(`        - ${f}`);}for(const e of report.laborMarket.specErrors||[])log(`    - ${e}`);
  }
  if (report.food?.status !== 'SKIPPED') {
    log(`Food conformance: ${report.food.status}`);
    for(const inst of report.food.instances||[]){const checked=inst.checks.length,failed=inst.failures.length;log(`    ${inst.name.padEnd(32)} ${inst.classification}  (${checked-failed}/${checked} checks)`);for(const f of inst.failures)log(`        - ${f}`);}for(const e of report.food.specErrors||[])log(`    - ${e}`);
  }
  if (report.deposit?.status !== 'SKIPPED') {
    log(`Deposit conformance: ${report.deposit.status}`);
    for (const inst of report.deposit.instances || []) {
      const checked = inst.checks.length, failed = inst.failures.length;
      log(`    ${inst.name.padEnd(24)} ${inst.classification}  (${checked - failed}/${checked} checks)`);
      for (const f of inst.failures) log(`        - ${f}`);
    }
    for (const e of report.deposit.specErrors || []) log(`    - ${e}`);
  }
}
