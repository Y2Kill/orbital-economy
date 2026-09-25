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

// Entry point: raw ModelJSON + validation JSON -> conformance report object.
export function runLifecycleConformance(raw, validation) {
  const plugin = findKernelPlugin(validation);
  if (!plugin) return { status: 'SKIPPED', format: KERNEL_FORMAT, message: 'validation has no capital_lifecycle_kernel plugin', instances: [], modelWide: [] };
  const specErrors = validateKernelSpec(plugin);
  if (specErrors.length) return { status: 'FAIL', format: KERNEL_FORMAT, message: 'invalid kernel spec', specErrors, instances: [], modelWide: [] };

  const index = indexModel(raw);
  const modelWide = checkModelWideReferences(index);
  const instances = plugin.instances.map(inst => checkInstance(index, inst, plugin));
  const anyNonConforming = instances.some(i => i.classification === 'NON_CONFORMING');
  const modelWideFail = modelWide.some(c => c.status === 'FAIL');
  return {
    status: anyNonConforming || modelWideFail ? 'FAIL' : 'PASS',
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
    instances
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
}
