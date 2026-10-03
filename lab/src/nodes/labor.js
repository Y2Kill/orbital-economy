// Generator for node type `labor` (task 027).
// One declaration adds labor intensity/automation/requirement for every process.
// Formula and element ordering intentionally match docs/tasks/027-labor-node/reference/labor_prototype.mjs.
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
function namedNumber(obj, path, errors, predicate, message) {
  if (!isObj(obj)) { errors.push(`${path}: must be an object`); return; }
  unknownFields(obj, new Set(['name','value']), path, errors);
  stringField(obj, 'name', path, errors);
  required(obj, 'value', path, errors);
  if ('value' in obj && !isNumber(obj.value)) errors.push(`${path}.value: must be a finite number`);
  else if ('value' in obj && !predicate(obj.value)) errors.push(`${path}.value: ${message}`);
}

export function validateLaborDeclaration(decl, path, errors) {
  const top = new Set(['type','version','colonies','automation','processes']);
  unknownFields(decl, top, path, errors);
  for (const k of top) required(decl, k, path, errors);
  if ('version' in decl && decl.version !== 1) errors.push(`${path}.version: must be 1`);

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

  if (!isObj(decl.automation)) errors.push(`${path}.automation: must be an object`);
  else {
    unknownFields(decl.automation, new Set(['min_human_share','exponent']), `${path}.automation`, errors);
    required(decl.automation, 'min_human_share', `${path}.automation`, errors);
    required(decl.automation, 'exponent', `${path}.automation`, errors);
    if ('min_human_share' in decl.automation) namedNumber(decl.automation.min_human_share, `${path}.automation.min_human_share`, errors, v => v > 0 && v < 1, 'must be > 0 and < 1');
    if ('exponent' in decl.automation) namedNumber(decl.automation.exponent, `${path}.automation.exponent`, errors, v => v > 0, 'must be > 0');
  }

  if (!Array.isArray(decl.processes) || decl.processes.length === 0) {
    errors.push(`${path}.processes: must be a non-empty array`);
    return;
  }
  const seenProcesses = new Set();
  for (const [i, p] of decl.processes.entries()) {
    const pp = `${path}.processes[${i}]`;
    if (!isObj(p)) { errors.push(`${pp}: must be an object`); continue; }
    unknownFields(p, new Set(['process','scope','output','intensity','automation','cost','planet_process']), pp, errors);
    for (const k of ['process','output','intensity','automation','planet_process']) required(p, k, pp, errors);
    for (const k of ['process','output','planet_process']) if (k in p && !isString(p[k])) errors.push(`${pp}.${k}: must be a non-empty string`);
    if ('scope' in p && p.scope !== 'shared') errors.push(`${pp}.scope: must be "shared" when present`);
    if (isString(p.process)) {
      const pk = key(p.process);
      if (seenProcesses.has(pk)) errors.push(`${pp}.process: duplicate process "${p.process}"`);
      else seenProcesses.add(pk);
    }
    if (isString(p.output)) {
      if (p.scope === 'shared' && p.output.includes('{C}')) errors.push(`${pp}.output: shared process output must not contain {C}`);
      if (p.scope !== 'shared' && !p.output.includes('{C}')) errors.push(`${pp}.output: colony process output must contain {C}`);
    }

    if (!isObj(p.intensity)) errors.push(`${pp}.intensity: must be an object`);
    else {
      unknownFields(p.intensity, new Set(['existing','value']), `${pp}.intensity`, errors);
      const hasExisting = Object.hasOwn(p.intensity, 'existing');
      const hasValue = Object.hasOwn(p.intensity, 'value');
      if (hasExisting === hasValue) errors.push(`${pp}.intensity: exactly one of existing or value is required`);
      if (hasExisting && !isString(p.intensity.existing)) errors.push(`${pp}.intensity.existing: must be a non-empty string`);
      if (hasValue) {
        if (!isNumber(p.intensity.value)) errors.push(`${pp}.intensity.value: must be a finite number`);
        else if (!(p.intensity.value > 0)) errors.push(`${pp}.intensity.value: must be > 0`);
      }
    }

    if (!isObj(p.automation)) errors.push(`${pp}.automation: must be an object`);
    else {
      const expected = p.scope === 'shared' ? ['shared'] : colonies;
      unknownFields(p.automation, new Set(expected), `${pp}.automation`, errors);
      for (const token of expected) {
        if (!(token in p.automation)) errors.push(`${pp}.automation.${token}: required field is missing`);
        else if (!isNumber(p.automation[token])) errors.push(`${pp}.automation.${token}: must be a finite number`);
        else if (p.automation[token] < 0 || p.automation[token] > 1) errors.push(`${pp}.automation.${token}: must be in [0, 1]`);
      }
    }

    if (p.cost != null) {
      if (!Array.isArray(p.cost)) errors.push(`${pp}.cost: must be an array`);
      else for (const [ci, c] of p.cost.entries()) if (!isString(c)) errors.push(`${pp}.cost[${ci}]: must be a non-empty string`);
    }
  }
}

export function laborGeneratedNames(decl) {
  const names = [];
  if (decl.automation?.min_human_share?.name) names.push(decl.automation.min_human_share.name);
  if (decl.automation?.exponent?.name) names.push(decl.automation.exponent.name);
  const totals = Object.fromEntries((decl.colonies || []).map(c => [c, []]));
  const shared = [];
  for (const p of decl.processes || []) {
    const scopes = p.scope === 'shared' ? [null] : (decl.colonies || []);
    for (const X of scopes) {
      const pre = X ? `${X} ${p.process}` : p.process;
      if (p.intensity && Object.hasOwn(p.intensity, 'value')) names.push(`${pre} Labor per Unit`);
      names.push(`${pre} Automation Level`, `${pre} Automation Factor`, `${pre} Labor Requirement`);
      (X ? totals[X] : shared).push(pre);
    }
  }
  for (const X of decl.colonies || []) names.push(`${X} Total Labor Requirement`);
  if (shared.length) names.push('Shared Labor Requirement');
  return names;
}

export function laborReplacementNames(decl) {
  const out = [];
  for (const p of decl.processes || []) {
    const scopes = p.scope === 'shared' ? [null] : (decl.colonies || []);
    for (const X of scopes) for (const c of p.cost || []) out.push(X ? X_(c, X) : c);
  }
  return out;
}

function esc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function expandLabor(decl, base) {
  const byName = new Map((base.elements || []).filter(e => e.type !== 'LINK' && e.name).map(e => [key(e.name), e]));
  const linkKeys = new Set((base.elements || []).filter(e => e.type === 'LINK').map(e => `${key(e.from)}|${key(e.to)}`));
  const need = (name, why) => {
    const e = byName.get(key(name));
    if (!e) throw new Error(`${why}: missing ${name}`);
    return e;
  };
  const added = [];
  const add = (name, value) => {
    if (byName.has(key(name))) throw new Error(`labor generated name conflicts with base element "${name}"`);
    const el = { type: 'VARIABLE', name, description: `Generated labor element for ${name}.`, behavior: { value } };
    added.push(el);
    byName.set(key(name), el);
    return el;
  };

  const H = decl.automation.min_human_share, K = decl.automation.exponent;
  add(H.name, H.value);
  add(K.name, K.value);

  const colonyTotals = Object.fromEntries(decl.colonies.map(X => [X, []]));
  const shared = [];
  const labor_instances = [];
  const planet_labors = [];
  const replacements = [];

  for (const [pi, p] of decl.processes.entries()) {
    const scopes = p.scope === 'shared' ? [null] : decl.colonies;
    for (const X of scopes) {
      const pre = X ? `${X} ${p.process}` : p.process;
      const outputName = X ? X_(p.output, X) : p.output;
      const output = need(outputName, `processes[${pi}].output`).name;
      let intensity;
      if (p.intensity.existing != null) {
        intensity = need(X ? X_(p.intensity.existing, X) : p.intensity.existing, `processes[${pi}].intensity.existing`).name;
      } else {
        intensity = `${pre} Labor per Unit`;
        add(intensity, p.intensity.value);
      }
      const level = `${pre} Automation Level`;
      const factor = `${pre} Automation Factor`;
      const requirement = `${pre} Labor Requirement`;
      add(level, p.automation[X ?? 'shared']);
      add(factor, `1 - (1 - [${H.name}]) * (1 - (1 - [${level}]) ^ [${K.name}])`);
      add(requirement, `[${output}] * [${intensity}] * [${factor}]`);

      for (const target of p.cost || []) {
        const name = X ? X_(target, X) : target;
        const e = need(name, `processes[${pi}].cost`);
        if (e.type === 'STOCK' || !e.behavior || e.behavior.value == null) throw new Error(`cost ${e.name} must have behavior.value`);
        const re = new RegExp(`\\[${esc(intensity)}\\]`, 'g');
        const matches = e.behavior.value.match(re) || [];
        if (!matches.length) throw new Error(`cost ${e.name} does not read ${intensity}`);
        const value = e.behavior.value.replace(re, `([${intensity}] * [${factor}])`);
        replacements.push({ name: e.name, value });
      }

      (X ? colonyTotals[X] : shared).push(`[${requirement}]`);
      labor_instances.push({
        name: `${pre} labor`,
        output,
        intensity,
        automation_level: level,
        automation_factor: factor,
        requirement
      });
    }
    planet_labors.push({
      process: p.planet_process,
      labor: {
        kind: 'declared',
        intensity: p.scope === 'shared'
          ? (p.intensity.existing || `${p.process} Labor per Unit`)
          : (p.intensity.existing || `{C} ${p.process} Labor per Unit`),
        requirement: p.scope === 'shared' ? `${p.process} Labor Requirement` : `{C} ${p.process} Labor Requirement`
      }
    });
  }

  for (const X of decl.colonies) add(`${X} Total Labor Requirement`, colonyTotals[X].join(' + '));
  if (shared.length) add('Shared Labor Requirement', shared.join(' + '));

  const refs = value => [...new Set([...String(value).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  const add_links = [];
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
  for (const e of added) for (const ref of refs(e.behavior.value)) addLink(ref, e.name);
  for (const r of replacements) for (const ref of refs(r.value)) addLink(ref, r.name);

  return {
    patch: { add_elements: added, replace_formulas: replacements, retarget_flows: [], add_links },
    validation: {
      labor_abs_tol: 1e-9,
      labor_min_human_share: H.name,
      labor_instances,
      planet_labors
    }
  };
}
