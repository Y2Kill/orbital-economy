import { expandCapitalLifecycle } from './capital_lifecycle.js';

const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const isString = x => typeof x === 'string' && x.length > 0;
const isNumber = x => typeof x === 'number' && Number.isFinite(x);

function unknownFields(obj, allowed, path, errors) {
  if (!isObj(obj)) return;
  for (const key of Object.keys(obj)) if (!allowed.has(key)) errors.push(`${path}.${key}: unknown field`);
}
function required(obj, key, path, errors) {
  if (!isObj(obj) || !(key in obj)) errors.push(`${path}.${key}: required field is missing`);
}
function stringField(obj, key, path, errors) {
  required(obj, key, path, errors);
  if (isObj(obj) && key in obj && !isString(obj[key])) errors.push(`${path}.${key}: must be a non-empty string`);
}
function numberField(obj, key, path, errors) {
  required(obj, key, path, errors);
  if (isObj(obj) && key in obj && !isNumber(obj[key])) errors.push(`${path}.${key}: must be a finite number`);
}

function validateCapitalLifecycle(decl, path, errors) {
  const top = new Set(['type','version','sector','colonies','switch','initial_capacity','parameters','sizing','capacity_output','backing','planet_process']);
  unknownFields(decl, top, path, errors);
  for (const key of top) required(decl, key, path, errors);

  if ('version' in decl && decl.version !== 1) errors.push(`${path}.version: must be 1`);
  for (const key of ['sector','switch','planet_process']) if (key in decl && !isString(decl[key])) errors.push(`${path}.${key}: must be a non-empty string`);

  if (!Array.isArray(decl.colonies) || decl.colonies.length === 0) errors.push(`${path}.colonies: must be a non-empty array`);
  else {
    const seen = new Set();
    for (const [i, colony] of decl.colonies.entries()) {
      if (!isString(colony)) errors.push(`${path}.colonies[${i}]: must be a non-empty string`);
      else if (seen.has(colony.toLowerCase())) errors.push(`${path}.colonies[${i}]: duplicate colony "${colony}"`);
      else seen.add(colony.toLowerCase());
    }
  }

  if (!isObj(decl.initial_capacity)) errors.push(`${path}.initial_capacity: must be an object`);
  else if (Array.isArray(decl.colonies)) {
    const allowed = new Set(decl.colonies.filter(isString));
    unknownFields(decl.initial_capacity, allowed, `${path}.initial_capacity`, errors);
    for (const colony of allowed) {
      if (!(colony in decl.initial_capacity)) errors.push(`${path}.initial_capacity.${colony}: required field is missing`);
      else if (!isNumber(decl.initial_capacity[colony])) errors.push(`${path}.initial_capacity.${colony}: must be a finite number`);
    }
  }

  if (!isObj(decl.parameters)) errors.push(`${path}.parameters: must be an object`);
  else {
    if (Object.keys(decl.parameters).length === 0) errors.push(`${path}.parameters: must not be empty`);
    for (const [key, value] of Object.entries(decl.parameters)) if (!isNumber(value)) errors.push(`${path}.parameters.${key}: must be a finite number`);
  }

  if (!isObj(decl.sizing)) errors.push(`${path}.sizing: must be an object`);
  else {
    unknownFields(decl.sizing, new Set(['signal']), `${path}.sizing`, errors);
    required(decl.sizing, 'signal', `${path}.sizing`, errors);
    const signal = decl.sizing.signal;
    const sp = `${path}.sizing.signal`;
    if (!isObj(signal)) errors.push(`${sp}: must be an object`);
    else {
      unknownFields(signal, new Set(['name','create','demand','initial','adjustment_time']), sp, errors);
      stringField(signal, 'name', sp, errors);
      required(signal, 'create', sp, errors);
      if ('create' in signal && typeof signal.create !== 'boolean') errors.push(`${sp}.create: must be boolean`);
      if (signal.create === true) {
        stringField(signal, 'demand', sp, errors);
        numberField(signal, 'initial', sp, errors);
        required(signal, 'adjustment_time', sp, errors);
        const at = signal.adjustment_time;
        if (!isObj(at)) errors.push(`${sp}.adjustment_time: must be an object`);
        else {
          unknownFields(at, new Set(['name','value']), `${sp}.adjustment_time`, errors);
          stringField(at, 'name', `${sp}.adjustment_time`, errors);
          numberField(at, 'value', `${sp}.adjustment_time`, errors);
        }
      }
    }
  }

  const cp = `${path}.capacity_output`;
  if (!isObj(decl.capacity_output)) errors.push(`${cp}: must be an object`);
  else {
    unknownFields(decl.capacity_output, new Set(['variable','replaces']), cp, errors);
    stringField(decl.capacity_output, 'variable', cp, errors);
    stringField(decl.capacity_output, 'replaces', cp, errors);
  }

  if (!Array.isArray(decl.backing) || decl.backing.length === 0) errors.push(`${path}.backing: must be a non-empty array`);
  else for (const [i, backing] of decl.backing.entries()) {
    const bp = `${path}.backing[${i}]`;
    if (!isObj(backing)) { errors.push(`${bp}: must be an object`); continue; }
    unknownFields(backing, new Set(['good','fulfillment','inventory','demand']), bp, errors);
    for (const key of ['good','fulfillment','inventory','demand']) stringField(backing, key, bp, errors);
  }
}

const REGISTRY = new Map([
  ['capital_lifecycle', { validate: validateCapitalLifecycle, expand: expandCapitalLifecycle }]
]);

export function validateNodeDeclaration(decl, path = 'node') {
  const errors = [];
  if (!isObj(decl)) return [`${path}: must be an object`];
  if (!('type' in decl)) return [`${path}.type: required field is missing`];
  if (!isString(decl.type)) return [`${path}.type: must be a non-empty string`];
  const handler = REGISTRY.get(decl.type);
  if (!handler) return [`${path}.type: unknown node type "${decl.type}"`];
  handler.validate(decl, path, errors);
  return errors;
}

export function expandNode(decl, base, { path = 'node' } = {}) {
  const errors = validateNodeDeclaration(decl, path);
  if (errors.length) throw new Error(`Invalid node declaration:\n  - ${errors.join('\n  - ')}`);
  return REGISTRY.get(decl.type).expand(decl, base);
}

function applyGeneratedFragment(model, fragment) {
  const out = structuredClone(model);
  const byName = new Map(out.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [String(e.name).toLowerCase(), e]));
  for (const el of fragment.add_elements) {
    const copy = structuredClone(el);
    out.elements.push(copy);
    byName.set(copy.name.toLowerCase(), copy);
  }
  for (const r of fragment.replace_formulas) {
    const el = byName.get(String(r.name).toLowerCase());
    if (!el) throw new Error(`generated replacement target missing: ${r.name}`);
    if (r.value != null) el.behavior.value = r.value;
    else el.behavior.initial_value = r.initial_value;
  }
  for (const link of fragment.add_links) out.elements.push({ type: 'LINK', from: link.from, to: link.to });
  return out;
}

export function expandNodes(declarations, base, { path = 'nodes' } = {}) {
  if (!Array.isArray(declarations)) throw new Error(`${path}: must be an array`);
  const patch = { add_elements: [], replace_formulas: [], add_links: [] };
  const validation = [];
  let working = structuredClone(base);
  for (const [i, decl] of declarations.entries()) {
    const out = expandNode(decl, working, { path: `${path}[${i}]` });
    patch.add_elements.push(...out.patch.add_elements);
    patch.replace_formulas.push(...out.patch.replace_formulas);
    patch.add_links.push(...out.patch.add_links);
    validation.push(out.validation);
    working = applyGeneratedFragment(working, out.patch);
  }
  return { patch, validation };
}


function jsonEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function mergeNodeValidation(validation, fragments) {
  const out = structuredClone(validation);
  const kernel = out.plugins?.find(p => p.type === 'capital_lifecycle_kernel');
  const boundaries = out.plugins?.find(p => p.type === 'open_boundaries');
  const planet = out.plugins?.find(p => p.type === 'planet_closure');
  if (!kernel || !Array.isArray(kernel.instances)) throw new Error('validation: capital_lifecycle_kernel.instances is required');
  if (!boundaries || !Array.isArray(boundaries.categories) || !Array.isArray(boundaries.transformation_pairs)) {
    throw new Error('validation: open_boundaries categories and transformation_pairs are required');
  }
  if (!planet || !Array.isArray(planet.processes)) throw new Error('validation: planet_closure.processes is required');
  const category = boundaries.categories.find(x => x.id === 'capital_transformation');
  if (!category || !Array.isArray(category.name)) throw new Error('validation: open_boundaries capital_transformation category is required');

  for (const [fi, fragment] of fragments.entries()) {
    for (const generated of fragment.kernel_instances || []) {
      const existing = kernel.instances.find(x => x.name === generated.name);
      if (!existing) {
        kernel.instances.push(structuredClone(generated));
      } else {
        const comparable = structuredClone(existing);
        delete comparable.policy_notes;
        if (!jsonEqual(comparable, generated)) {
          throw new Error(`validation fragment[${fi}]: kernel instance "${generated.name}" already exists with a different definition`);
        }
      }
    }

    for (const name of fragment.capital_transformation_names || []) {
      if (!category.name.includes(name)) category.name.push(name);
    }

    for (const generated of fragment.transformation_pairs || []) {
      const existing = boundaries.transformation_pairs.find(x => x.source === generated.source);
      if (!existing) boundaries.transformation_pairs.push(structuredClone(generated));
      else if (!jsonEqual(existing, generated)) {
        throw new Error(`validation fragment[${fi}]: transformation pair "${generated.source}" already exists with a different definition`);
      }
    }

    if (fragment.planet_closure) {
      const generated = fragment.planet_closure;
      const process = planet.processes.find(x => x.id === generated.process);
      if (!process) throw new Error(`validation fragment[${fi}]: planet process "${generated.process}" does not exist`);
      if (process.capacity == null) process.capacity = structuredClone(generated.capacity);
      else if (!jsonEqual(process.capacity, generated.capacity)) {
        throw new Error(`validation fragment[${fi}]: planet process "${generated.process}" capacity differs`);
      }
    }
  }
  return out;
}
