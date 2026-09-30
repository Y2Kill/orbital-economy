// Static conformance for validation plugin `deposit` (task 022).
const REF_RE = /\[([^\]]+)\]/g;
const key = s => String(s ?? '').toLowerCase();
const eq = (a, b) => (a == null && b == null) || (a != null && b != null && key(a) === key(b));
const pass = (name, details = {}) => ({ status: 'PASS', name, ...details });
const fail = (name, message, details = {}) => ({ status: 'FAIL', name, message, ...details });

const INSTANCE_FIELDS = new Set(['name','resource','undiscovered','proven','exploration','extraction','signal','consumption']);

function formulaRefs(el) {
  const out = new Set();
  const behavior = el?.behavior || {};
  for (const text of [behavior.value, behavior.initial_value]) {
    if (typeof text !== 'string') continue;
    for (const match of text.matchAll(REF_RE)) out.add(match[1].trim().toLowerCase());
  }
  return out;
}

function indexModel(raw) {
  const byName = new Map();
  const links = new Set();
  for (const el of raw?.elements || []) {
    if (!el) continue;
    if (el.type === 'LINK') {
      links.add(`${key(el.from)}|${key(el.to)}`);
      continue;
    }
    if (el.name) byName.set(key(el.name), el);
  }
  return {
    get(name) { return name == null ? null : byName.get(key(name)) || null; },
    hasLink(from, to) { return links.has(`${key(from)}|${key(to)}`); }
  };
}

export function findDepositPlugin(validation) {
  return (validation?.plugins || []).find(p => p?.type === 'deposit') || null;
}

export function validateDepositPluginSpec(plugin) {
  const errors = [];
  if (!plugin || typeof plugin !== 'object' || Array.isArray(plugin)) return ['deposit plugin must be an object'];
  if (!Array.isArray(plugin.instances) || plugin.instances.length === 0) errors.push('deposit plugin needs a non-empty "instances" array');
  const names = new Set();
  for (const [i, inst] of (plugin.instances || []).entries()) {
    const p = `instances[${i}]`;
    if (!inst || typeof inst !== 'object' || Array.isArray(inst)) { errors.push(`${p} must be an object`); continue; }
    for (const field of Object.keys(inst)) if (!INSTANCE_FIELDS.has(field)) errors.push(`${p}.${field}: unknown field`);
    for (const field of ['name','resource','undiscovered','proven','exploration','extraction','signal']) {
      if (typeof inst[field] !== 'string' || !inst[field]) errors.push(`${p}.${field} is required`);
    }
    if (!Array.isArray(inst.consumption) || inst.consumption.length === 0 || inst.consumption.some(x => typeof x !== 'string' || !x)) {
      errors.push(`${p}.consumption must be a non-empty string array`);
    }
    if (inst.name) {
      if (names.has(key(inst.name))) errors.push(`duplicate deposit instance name: ${inst.name}`);
      names.add(key(inst.name));
    }
  }
  return errors;
}

export function checkDepositInstance(index, inst) {
  const checks = [];
  const get = (field, type) => {
    const name = inst[field];
    const el = index.get(name);
    if (!el) { checks.push(fail(`role ${field}`, `primitive not found: ${name}`)); return null; }
    if (el.type !== type) { checks.push(fail(`role ${field}`, `${name}: expected ${type}, found ${el.type}`)); return null; }
    checks.push(pass(`role ${field}`, { primitive: el.name, type: el.type }));
    return el;
  };

  const undiscovered = get('undiscovered', 'STOCK');
  const proven = get('proven', 'STOCK');
  const exploration = get('exploration', 'FLOW');
  const extraction = get('extraction', 'FLOW');
  const signal = get('signal', 'STOCK');

  if (exploration && undiscovered && proven) {
    const label = 'exploration topology';
    if (eq(exploration.from, undiscovered.name) && eq(exploration.to, proven.name)) checks.push(pass(label));
    else checks.push(fail(label, `${exploration.name} is wired ${exploration.from ?? '∅'} -> ${exploration.to ?? '∅'}, expected ${undiscovered.name} -> ${proven.name}`));
  }
  if (extraction && proven) {
    const label = 'extraction from proven';
    if (eq(extraction.from, proven.name)) checks.push(pass(label));
    else checks.push(fail(label, `${extraction.name} source is ${extraction.from ?? '∅'}, expected ${proven.name}`));
  }

  const suffix = ` ${inst.resource} Deposit`;
  const colony = String(inst.name).endsWith(suffix) ? String(inst.name).slice(0, -suffix.length) : null;
  const targetName = colony ? `${colony} ${inst.resource} Target Proven Reserves` : null;
  const target = targetName ? index.get(targetName) : null;
  if (!target) checks.push(fail('target proven reserves', `primitive not found: ${targetName || '(cannot derive from instance name)'}`));
  else if (target.type !== 'VARIABLE') checks.push(fail('target proven reserves', `${target.name}: expected VARIABLE, found ${target.type}`));
  else if (!signal || !formulaRefs(target).has(key(signal.name))) checks.push(fail('target proven reserves <- signal', `${target.name} does not reference [${inst.signal}]`));
  else if (!index.hasLink(signal.name, target.name)) checks.push(fail('target proven reserves <- signal', `missing LINK ${signal.name} -> ${target.name}`));
  else checks.push(pass('target proven reserves <- signal'));

  for (const name of inst.consumption || []) {
    const el = index.get(name);
    const label = `consumption ${name}`;
    if (!el) { checks.push(fail(label, 'primitive not found')); continue; }
    if (el.type !== 'FLOW') { checks.push(fail(label, `expected FLOW, found ${el.type}`)); continue; }
    const src = el.from ? index.get(el.from) : null;
    if (!src || src.type !== 'STOCK' || el.to != null) { checks.push(fail(label, `${el.name} must be wired <STOCK> -> ∅`)); continue; }
    if (!exploration || !formulaRefs(el).has(key(exploration.name))) { checks.push(fail(label, `${el.name} does not reference [${inst.exploration}]`)); continue; }
    if (!index.hasLink(exploration.name, el.name)) { checks.push(fail(label, `missing LINK ${exploration.name} -> ${el.name}`)); continue; }
    checks.push(pass(label));
  }

  const failed = checks.filter(x => x.status === 'FAIL');
  return {
    name: inst.name,
    resource: inst.resource,
    classification: failed.length ? 'NON_CONFORMING' : 'CONFORMING',
    checks,
    failures: failed.map(x => `${x.name}: ${x.message}`)
  };
}

export function runDepositConformance(raw, validation, index = indexModel(raw)) {
  const plugin = findDepositPlugin(validation);
  if (!plugin) return { status: 'SKIPPED', instances: [], summary: { instances: 0, conforming: 0, nonConforming: 0 } };
  const specErrors = validateDepositPluginSpec(plugin);
  if (specErrors.length) return { status: 'FAIL', specErrors, instances: [], summary: { instances: 0, conforming: 0, nonConforming: 0 } };
  const instances = plugin.instances.map(inst => checkDepositInstance(index, inst));
  const nonConforming = instances.filter(i => i.classification === 'NON_CONFORMING').length;
  return {
    status: nonConforming ? 'FAIL' : 'PASS',
    instances,
    summary: { instances: instances.length, conforming: instances.length - nonConforming, nonConforming }
  };
}
