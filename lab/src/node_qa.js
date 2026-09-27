#!/usr/bin/env node
// QA for declarative node generators. Case 1 deliberately derives its fixture from the current
// accepted model instead of pinning a historical model version or hard-coded element counts.
import fs from 'node:fs';
import path from 'node:path';
import { discoverSingleJson } from './workspace.js';
import { readJson } from './util.js';
import {
  capitalLifecycleGeneratedNames,
  capitalLifecycleReplacementNames,
  expandCapitalLifecycle
} from './nodes/capital_lifecycle.js';

const root = path.resolve(process.cwd());
const modelFile = discoverSingleJson(path.join(root, 'reference', 'accepted', 'model'), 'accepted ModelJSON');
const validationFile = discoverSingleJson(path.join(root, 'input', 'validation'), 'validation JSON');
const nodeDir = path.resolve(root, '..', 'model', 'nodes');
const declarationFiles = [
  path.join(nodeDir, 'construction-materials-plant.json'),
  path.join(nodeDir, 'capital-goods-plant.json')
];
for (const f of [modelFile, validationFile, ...declarationFiles]) {
  if (!fs.existsSync(f)) {
    console.error(`[FAIL] Required node QA input is missing: ${f}`);
    process.exit(2);
  }
}

const accepted = readJson(modelFile);
const validation = readJson(validationFile);
const declarations = declarationFiles.map(readJson);

let passed = 0, failed = 0;
function mark(ok, name, detail = '') {
  if (ok) { passed++; console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`); }
  else { failed++; console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`); }
}
async function expect(name, fn) {
  try {
    const v = await fn();
    mark(v !== false, name, typeof v === 'string' ? v : '');
  } catch (e) {
    mark(false, name, e.message || String(e));
  }
}

function splitTopLevelArgs(inner) {
  const out = [];
  let depth = 0, start = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(inner.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(inner.slice(start).trim());
  return out;
}

function oldBranch(value, switchName, targetName) {
  const text = String(value);
  if (!text.startsWith('IfThenElse(') || !text.endsWith(')')) {
    throw new Error(`${targetName}: expected outer IfThenElse for ${switchName}`);
  }
  const args = splitTopLevelArgs(text.slice('IfThenElse('.length, -1));
  if (args.length !== 3 || args[0] !== `[${switchName}] = 1`) {
    throw new Error(`${targetName}: outer switch is not ${switchName}`);
  }
  return args[2];
}

function stripNode(raw, decl) {
  const out = structuredClone(raw);
  const generated = new Set(capitalLifecycleGeneratedNames(decl));
  const targets = capitalLifecycleReplacementNames(decl);
  for (const name of targets) {
    const e = out.elements.find(x => x.type !== 'LINK' && x.name === name);
    if (!e) throw new Error(`${decl.sector}: replacement target missing while stripping: ${name}`);
    e.behavior.value = oldBranch(e.behavior.value, decl.switch, name);
  }
  out.elements = out.elements.filter(e => {
    if (e.type === 'LINK') return !generated.has(e.from) && !generated.has(e.to);
    return !generated.has(e.name);
  });
  return out;
}

function def(e) {
  return JSON.stringify({
    type: e.type,
    from: e.from ?? null,
    to: e.to ?? null,
    behavior: e.behavior
  });
}
function linkSet(raw) {
  return new Set(raw.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
}
function sameSet(a, b) {
  return a.size === b.size && [...a].every(x => b.has(x));
}
function validationMatches(fragment) {
  const kernel = validation.plugins.find(p => p.type === 'capital_lifecycle_kernel');
  const boundaries = validation.plugins.find(p => p.type === 'open_boundaries');
  const planet = validation.plugins.find(p => p.type === 'planet_closure');
  if (!kernel || !boundaries || !planet) throw new Error('accepted validation lacks required node fragment plugins');
  const stripInstance = i => JSON.stringify({
    name: i.name, sector: i.sector, switch_gated: i.switch_gated,
    roles: i.roles, kernel_version: i.kernel_version
  });
  if (!fragment.kernel_instances.every(g => kernel.instances.some(a => stripInstance(a) === stripInstance(g)))) return false;
  const names = boundaries.categories.find(c => c.id === 'capital_transformation')?.name || [];
  if (!fragment.capital_transformation_names.every(n => names.includes(n))) return false;
  if (!fragment.transformation_pairs.every(g => boundaries.transformation_pairs.some(a => JSON.stringify(a) === JSON.stringify(g)))) return false;
  const proc = planet.processes.find(p => p.id === fragment.planet_closure.process);
  return !!proc && JSON.stringify(proc.capacity) === JSON.stringify(fragment.planet_closure.capacity);
}

// Build the historical state immediately before/after each declared node by peeling later generated
// nodes from the current accepted model in reverse declaration order. This keeps the fixture valid
// when the accepted model version advances without pinning old tags or model filenames.
const states = new Array(declarations.length);
let target = structuredClone(accepted);
for (let i = declarations.length - 1; i >= 0; i--) {
  const base = stripNode(target, declarations[i]);
  states[i] = { base, target };
  target = base;
}

console.log('Orbital Economy Lab node-generator QA');
console.log('Case 1: strip generated nodes from the current accepted model and rebuild them.\n');

await expect('1. strip and regenerate both capital_lifecycle declarations', () => {
  const details = [];
  for (let i = 0; i < declarations.length; i++) {
    const decl = declarations[i];
    const { base, target: expected } = states[i];
    const out = expandCapitalLifecycle(decl, base);
    const expectedByName = new Map(expected.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));
    const baseByName = new Map(base.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));

    for (const a of out.patch.add_elements) {
      const e = expectedByName.get(a.name);
      if (!e) throw new Error(`${decl.sector}: generated element absent from accepted state: ${a.name}`);
      if (def(e) !== def(a)) throw new Error(`${decl.sector}: definition differs: ${a.name}`);
    }
    const acceptedAdded = new Set([...expectedByName.keys()].filter(n => !baseByName.has(n)));
    const generatedAdded = new Set(out.patch.add_elements.map(e => e.name));
    if (!sameSet(acceptedAdded, generatedAdded)) {
      throw new Error(`${decl.sector}: generated element set differs (accepted ${acceptedAdded.size}, generated ${generatedAdded.size})`);
    }

    for (const r of out.patch.replace_formulas) {
      const e = expectedByName.get(r.name);
      if (!e || e.behavior.value !== r.value) throw new Error(`${decl.sector}: replacement differs: ${r.name}`);
    }

    const beforeLinks = linkSet(base), afterLinks = linkSet(expected);
    const acceptedLinks = new Set([...afterLinks].filter(x => !beforeLinks.has(x)));
    const generatedLinks = new Set(out.patch.add_links.map(l => `${l.from}|${l.to}`));
    if (!sameSet(acceptedLinks, generatedLinks)) {
      throw new Error(`${decl.sector}: link set differs (accepted ${acceptedLinks.size}, generated ${generatedLinks.size})`);
    }
    if (!validationMatches(out.validation)) throw new Error(`${decl.sector}: validation fragment differs from accepted validation`);

    const line = `${decl.sector}: elements=${out.patch.add_elements.length}, replacements=${out.patch.replace_formulas.length}, links=${out.patch.add_links.length}, validation=equal`;
    console.log(`  ${line}`);
    details.push(line);
  }
  return `${declarations.length} declarations rebuilt with 0 definition/link/validation differences`;
});

console.log(`\nNODE SELF-TEST: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
