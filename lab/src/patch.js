// Declarative model patch: the preferred delivery format for contractors who cannot run the lab.
// A patch is small, reviewable and applied deterministically to the frozen accepted model by the lab,
// so the candidate ModelJSON is never hand-edited (no lost elements, no reformatting, no stray edits).
//
// {
//   "format": "orbital-economy-model-patch-v1",
//   "base_sha256": "<sha of the accepted ModelJSON the patch was written against>",
//   "name": "<candidate model name>",
//   "description": "<optional>",
//   "add_elements":     [ { "type": "VARIABLE|STOCK|FLOW", "name": "...", "from": "...", "to": "...", "behavior": { ... }, "description": "..." } ],
//   "replace_formulas": [ { "name": "<existing>", "value": "<new formula>" } | { "name": "<existing STOCK>", "initial_value": ... } ],
//   "add_links":        [ { "from": "...", "to": "..." } ],
//   "modify_scenarios": [ { "mode": 0, "set": { "Intermediate Inputs Enabled": 0 } } ],
//   "add_scenarios":    [ { "name": "...", "description": "...", "values": { "Timed Test Mode": 17, ... } } ]
// }
//
// Everything is additive except replace_formulas / modify_scenarios, and every target must exist.
// Removals and renames are intentionally NOT supported: they are structural regressions the policy would reject anyway.

export const PATCH_FORMAT = 'orbital-economy-model-patch-v1';
const ELEMENT_TYPES = new Set(['VARIABLE', 'STOCK', 'FLOW']);

function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

export function validatePatch(patch) {
  const errors = [];
  if (!isObj(patch)) return ['patch must be a JSON object'];
  if (patch.format !== PATCH_FORMAT) errors.push(`format must be "${PATCH_FORMAT}"`);
  if (patch.base_sha256 != null && !/^[0-9a-f]{64}$/i.test(patch.base_sha256)) errors.push('base_sha256 must be a 64-hex SHA-256 or omitted');
  if (patch.name != null && typeof patch.name !== 'string') errors.push('name must be a string');
  for (const key of ['add_elements', 'replace_formulas', 'add_links', 'modify_scenarios', 'add_scenarios']) {
    if (patch[key] != null && !Array.isArray(patch[key])) errors.push(`${key} must be an array`);
  }
  for (const [i, el] of (patch.add_elements || []).entries()) {
    const p = `add_elements[${i}]`;
    if (!isObj(el)) { errors.push(`${p} must be an object`); continue; }
    if (!ELEMENT_TYPES.has(el.type)) errors.push(`${p}.type must be VARIABLE | STOCK | FLOW`);
    if (!el.name || typeof el.name !== 'string') errors.push(`${p}.name is required`);
    if (!isObj(el.behavior)) errors.push(`${p}.behavior is required`);
    else if (el.type === 'STOCK' ? el.behavior.initial_value == null : el.behavior.value == null) errors.push(`${p}.behavior needs ${el.type === 'STOCK' ? 'initial_value' : 'value'}`);
    if (el.type !== 'FLOW' && (el.from != null || el.to != null)) errors.push(`${p}: only FLOW may have from/to`);
    if (el.type === 'FLOW' && !('from' in el && 'to' in el)) errors.push(`${p}: FLOW must state from and to explicitly (null = model boundary)`);
    if (el.display != null) errors.push(`${p}: do not supply display; the lab omits display for patched elements`);
  }
  for (const [i, r] of (patch.replace_formulas || []).entries()) {
    const p = `replace_formulas[${i}]`;
    if (!isObj(r) || !r.name) { errors.push(`${p}.name is required`); continue; }
    if (r.value == null && r.initial_value == null) errors.push(`${p} needs value or initial_value`);
    if (r.value != null && r.initial_value != null) errors.push(`${p}: give either value or initial_value, not both`);
  }
  for (const [i, l] of (patch.add_links || []).entries()) {
    if (!isObj(l) || !l.from || !l.to) errors.push(`add_links[${i}] needs from and to`);
  }
  for (const [i, s] of (patch.modify_scenarios || []).entries()) {
    if (!isObj(s) || typeof s.mode !== 'number' || !isObj(s.set)) errors.push(`modify_scenarios[${i}] needs numeric mode and object set`);
  }
  for (const [i, s] of (patch.add_scenarios || []).entries()) {
    if (!isObj(s) || !s.name || !isObj(s.values)) errors.push(`add_scenarios[${i}] needs name and values`);
    else if (typeof s.values['Timed Test Mode'] !== 'number') errors.push(`add_scenarios[${i}].values must set a numeric "Timed Test Mode"`);
  }
  return errors;
}

// Returns { model, log } or throws with a precise message. `base` is not mutated.
export function applyPatch(base, patch, { baseSha256 = null, modeVariable = 'Timed Test Mode' } = {}) {
  const errors = validatePatch(patch);
  if (errors.length) throw new Error(`Invalid patch:\n  - ${errors.join('\n  - ')}`);
  if (patch.base_sha256 && baseSha256 && patch.base_sha256.toLowerCase() !== baseSha256.toLowerCase()) {
    throw new Error(`Patch was written against base ${patch.base_sha256.slice(0, 12)}… but the supplied base is ${baseSha256.slice(0, 12)}…`);
  }
  const model = structuredClone(base);
  const log = [];
  const byName = new Map();
  for (const el of model.elements) if (el.type !== 'LINK' && el.name) byName.set(el.name.toLowerCase(), el);
  const links = new Set(model.elements.filter(e => e.type === 'LINK').map(e => `${String(e.from).toLowerCase()}|${String(e.to).toLowerCase()}`));
  const has = n => byName.has(String(n).toLowerCase());

  for (const el of patch.add_elements || []) {
    if (has(el.name)) throw new Error(`add_elements: "${el.name}" already exists (renames/replacements are not supported)`);
    if (el.type === 'FLOW') {
      for (const end of ['from', 'to']) if (el[end] != null && !has(el[end])) throw new Error(`add_elements: FLOW "${el.name}" ${end} "${el[end]}" does not exist`);
      for (const end of ['from', 'to']) if (el[end] != null && byName.get(String(el[end]).toLowerCase()).type !== 'STOCK') throw new Error(`add_elements: FLOW "${el.name}" ${end} "${el[end]}" is not a STOCK`);
    }
    const out = { type: el.type, name: el.name };
    if (el.type === 'FLOW') { out.from = el.from ?? null; out.to = el.to ?? null; }
    out.behavior = structuredClone(el.behavior);
    if (el.type === 'FLOW' && out.behavior.non_negative == null) out.behavior.non_negative = true;
    if (el.description) out.description = el.description;
    model.elements.push(out);
    byName.set(el.name.toLowerCase(), out);
    log.push(`+ ${el.type} ${el.name}${el.type === 'FLOW' ? ` (${el.from ?? '∅'} -> ${el.to ?? '∅'})` : ''}`);
  }

  for (const r of patch.replace_formulas || []) {
    const el = byName.get(String(r.name).toLowerCase());
    if (!el) throw new Error(`replace_formulas: "${r.name}" does not exist`);
    if (r.value != null) {
      if (el.type === 'STOCK') throw new Error(`replace_formulas: "${r.name}" is a STOCK; use initial_value`);
      el.behavior.value = r.value;
      log.push(`~ ${el.type} ${r.name}: value replaced`);
    } else {
      if (el.type !== 'STOCK') throw new Error(`replace_formulas: "${r.name}" is not a STOCK; use value`);
      el.behavior.initial_value = r.initial_value;
      log.push(`~ STOCK ${r.name}: initial_value replaced`);
    }
  }

  for (const l of patch.add_links || []) {
    for (const end of ['from', 'to']) if (!has(l[end])) throw new Error(`add_links: ${end} "${l[end]}" does not exist`);
    const key = `${String(l.from).toLowerCase()}|${String(l.to).toLowerCase()}`;
    if (links.has(key)) throw new Error(`add_links: LINK ${l.from} -> ${l.to} already exists`);
    const from = byName.get(String(l.from).toLowerCase()).name, to = byName.get(String(l.to).toLowerCase()).name;
    model.elements.push({ type: 'LINK', from, to });
    links.add(key);
    log.push(`+ LINK ${from} -> ${to}`);
  }

  const scenarios = model.scenarios || (model.scenarios = []);
  const byMode = new Map(scenarios.map(s => [s?.values?.[modeVariable], s]));
  for (const m of patch.modify_scenarios || []) {
    const sc = byMode.get(m.mode);
    if (!sc) throw new Error(`modify_scenarios: Mode ${m.mode} does not exist`);
    for (const [k, v] of Object.entries(m.set)) {
      if (!has(k)) throw new Error(`modify_scenarios: Mode ${m.mode} sets unknown element "${k}"`);
      if (k === modeVariable) throw new Error(`modify_scenarios: changing "${modeVariable}" is not allowed`);
      sc.values[k] = v;
    }
    log.push(`~ scenario Mode ${m.mode}: set ${Object.keys(m.set).join(', ')}`);
  }
  for (const s of patch.add_scenarios || []) {
    const mode = s.values[modeVariable];
    if (byMode.has(mode)) throw new Error(`add_scenarios: Mode ${mode} already exists`);
    for (const k of Object.keys(s.values)) if (!has(k)) throw new Error(`add_scenarios: Mode ${mode} sets unknown element "${k}"`);
    const sc = { name: s.name, description: s.description || '', values: structuredClone(s.values) };
    scenarios.push(sc);
    byMode.set(mode, sc);
    log.push(`+ scenario Mode ${mode}: ${s.name}`);
  }

  if (patch.name) model.name = patch.name;
  if (patch.description) model.description = patch.description;
  return { model, log };
}
