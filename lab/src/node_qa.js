#!/usr/bin/env node
// QA for declarative node generators. Case 1 deliberately derives its fixture from the current
// accepted model instead of pinning a historical model version or hard-coded element counts.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { discoverSingleJson } from './workspace.js';
import { readJson } from './util.js';
import { PATCH_FORMAT, applyPatch } from './patch.js';
import { loadModelJSON } from './engine.js';
import { modelJsonForScenario } from './model.js';
import { checkFiniteAll, checkNonNegativeRegex, checkPlugin, checkTimeAxis, runGenericCheck, seriesContext } from './checks.js';
import { expandNode, mergeNodeValidation } from './nodes/index.js';
import {
  capitalLifecycleGeneratedNames,
  capitalLifecycleReplacementNames,
  expandCapitalLifecycle
} from './nodes/capital_lifecycle.js';
import {
  simpleCapitalGeneratedNames,
  simpleCapitalReplacementNames
} from './nodes/simple_capital.js';
import { runLifecycleConformance } from './lifecycle_conformance.js';
import { runStructureAudits } from './structure_audit.js';

const root = path.resolve(process.cwd());
const modelFile = discoverSingleJson(path.join(root, 'reference', 'accepted', 'model'), 'accepted ModelJSON');
const validationFile = discoverSingleJson(path.join(root, 'input', 'validation'), 'validation JSON');
const nodeDir = path.resolve(root, '..', 'model', 'nodes');
const declarationFiles = [
  path.join(nodeDir, 'construction-materials-plant.json'),
  path.join(nodeDir, 'capital-goods-plant.json')
];
const simpleFixtureFile = path.join(root, 'fixtures', 'nodes', 'regolith-mine-simple.json');
const powerFixtureFile = path.join(root, 'fixtures', 'nodes', 'power-resource-mine-simple.json');
for (const f of [modelFile, validationFile, simpleFixtureFile, powerFixtureFile, ...declarationFiles]) {
  if (!fs.existsSync(f)) {
    console.error(`[FAIL] Required node QA input is missing: ${f}`);
    process.exit(2);
  }
}

const accepted = readJson(modelFile);
const validation = readJson(validationFile);
const declarations = declarationFiles.map(readJson);
const simpleFixture = readJson(simpleFixtureFile);
const powerFixture = readJson(powerFixtureFile);
const simpleDeclarations = fs.readdirSync(nodeDir)
  .filter(name => name.endsWith('.json'))
  .map(name => path.join(nodeDir, name))
  .map(file => ({ file, decl: readJson(file) }))
  .filter(x => x.decl?.type === 'simple_capital');

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

async function expectThrows(name, fn, pattern) {
  try {
    await fn();
    mark(false, name, 'expected an exception');
  } catch (e) {
    const message = e?.message || String(e);
    mark(pattern.test(message), name, message);
  }
}

async function requireThrow(fn, pattern, label) {
  try {
    await fn();
  } catch (e) {
    const message = e?.message || String(e);
    if (pattern.test(message)) return message;
    throw new Error(`${label}: wrong error: ${message}`);
  }
  throw new Error(`${label}: expected an exception`);
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

function stripSimpleNode(raw, decl) {
  const out = structuredClone(raw);
  const generated = new Set(simpleCapitalGeneratedNames(decl));
  const targets = simpleCapitalReplacementNames(decl);
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

function assertSimpleRebuild(decl, expected) {
  const base = stripSimpleNode(expected, decl);
  const out = expandNode(decl, base);
  const expectedByName = new Map(expected.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));
  const baseByName = new Map(base.elements.filter(e => e.type !== 'LINK').map(e => [e.name, e]));

  for (const a of out.patch.add_elements) {
    const e = expectedByName.get(a.name);
    if (!e) throw new Error(`${decl.sector}: regenerated element absent from target: ${a.name}`);
    if (def(e) !== def(a)) throw new Error(`${decl.sector}: regenerated definition differs: ${a.name}`);
  }
  const targetAdded = new Set([...expectedByName.keys()].filter(n => !baseByName.has(n)));
  const generatedAdded = new Set(out.patch.add_elements.map(e => e.name));
  if (!sameSet(targetAdded, generatedAdded)) {
    throw new Error(`${decl.sector}: regenerated element set differs (target ${targetAdded.size}, generated ${generatedAdded.size})`);
  }
  for (const r of out.patch.replace_formulas) {
    const e = expectedByName.get(r.name);
    if (!e || e.behavior.value !== r.value) throw new Error(`${decl.sector}: regenerated replacement differs: ${r.name}`);
  }
  const beforeLinks = linkSet(base), afterLinks = linkSet(expected);
  const targetLinks = new Set([...afterLinks].filter(x => !beforeLinks.has(x)));
  const generatedLinks = new Set(out.patch.add_links.map(l => `${l.from}|${l.to}`));
  if (!sameSet(targetLinks, generatedLinks)) {
    throw new Error(`${decl.sector}: regenerated link set differs (target ${targetLinks.size}, generated ${generatedLinks.size})`);
  }
  return out;
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

// Build the historical state immediately before/after each declared node by peeling generated nodes from the
// current accepted model, outermost first. Nodes that replace the same formula nest: the later node wraps the
// earlier one's IfThenElse. The peel order is therefore read from the model itself — the next node to peel is
// one whose switch is the outer switch of every formula it replaces — not from file names or declaration order.
// This keeps the fixture valid when the accepted model version advances without pinning old tags or filenames.
function outerSwitchIs(model, name, switchName) {
  const e = model.elements.find(x => x.type !== 'LINK' && x.name === name);
  if (!e) return false;
  try { oldBranch(e.behavior.value, switchName, name); return true; } catch { return false; }
}
const layeredNodes = [
  ...declarations.map(decl => ({ decl, strip: stripNode, targets: capitalLifecycleReplacementNames })),
  ...simpleDeclarations.map(({ decl }) => ({ decl, strip: stripSimpleNode, targets: simpleCapitalReplacementNames }))
];
const layers = new Map();
{
  let current = structuredClone(accepted);
  const remaining = [...layeredNodes];
  while (remaining.length) {
    const i = remaining.findIndex(n => n.targets(n.decl).every(t => outerSwitchIs(current, t, n.decl.switch)));
    if (i < 0) throw new Error(`cannot determine node layering: none of ${remaining.map(n => n.decl.sector).join(', ')} is outermost on all its replacement targets`);
    const [n] = remaining.splice(i, 1);
    const base = n.strip(current, n.decl);
    layers.set(n.decl, { base, target: current });
    current = base;
  }
}
const states = declarations.map(decl => layers.get(decl));

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


const decl = declarations[0];
const base = states[0].base;

await expect('2. patch nodes and pre-expanded patch produce the same model definitions', () => {
  const expanded = expandNode(decl, base);
  const fromNode = applyPatch(base, { format: PATCH_FORMAT, nodes: [decl] }).model;
  const fromExpanded = applyPatch(base, { format: PATCH_FORMAT, ...expanded.patch }).model;
  if (JSON.stringify(fromNode.elements) !== JSON.stringify(fromExpanded.elements)) {
    throw new Error('models differ after node expansion');
  }
  return 'definitions equal';
});

await expectThrows('3. unknown declaration field is rejected with its path', () => {
  const bad = structuredClone(decl);
  bad.backings = [];
  expandNode(bad, base);
}, /node\.backings: unknown field/);

await expectThrows('4. unknown node type is rejected', () => {
  const bad = structuredClone(decl);
  bad.type = 'not_a_node_type';
  expandNode(bad, base);
}, /node\.type: unknown node type/);

await expectThrows('5. missing capacity replacement reference is rejected', () => {
  const bad = structuredClone(decl);
  bad.capacity_output.replaces = '{C} Capital Goods Inventory';
  expandNode(bad, base);
}, /does not read \[A Capital Goods Inventory\]/);

await expectThrows('6. node and explicit replacement cannot touch the same element', () => {
  const target = decl.capacity_output.variable.replaceAll('{C}', decl.colonies[0]);
  applyPatch(base, {
    format: PATCH_FORMAT,
    nodes: [decl],
    replace_formulas: [{ name: target, value: '0' }]
  });
}, /nodes: generated element .* is also added or replaced explicitly/);

await expectThrows('7. declaration reference to a missing model element is rejected', () => {
  const bad = structuredClone(decl);
  bad.backing[0].fulfillment = '{C} Missing Fulfillment';
  expandNode(bad, base);
}, /backing\[0\]\.fulfillment\[A\] references missing base element/);

await expect('8. expansion is byte-deterministic', () => {
  const a = JSON.stringify(expandNode(decl, base));
  const b = JSON.stringify(expandNode(decl, base));
  if (a !== b) throw new Error('two expansions differ byte-for-byte');
  return `${a.length} JSON bytes stable`;
});


await expect('9. expand-nodes --validation preserves accepted validation byte-for-byte', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-node-qa-'));
  try {
    const nodeFile = path.join(tmp, 'node.json');
    const baseFile = path.join(tmp, 'base.json');
    const outDir = path.join(tmp, 'out');
    fs.writeFileSync(nodeFile, JSON.stringify(decl, null, 2), 'utf8');
    fs.writeFileSync(baseFile, JSON.stringify(base, null, 2), 'utf8');
    const run = spawnSync(process.execPath, [
      path.join(root, 'src', 'cli.js'),
      'expand-nodes',
      nodeFile,
      baseFile,
      `--out=${outDir}`,
      `--validation=${validationFile}`
    ], { cwd: root, encoding: 'utf8' });
    if (run.status !== 0) {
      throw new Error(`CLI exited ${run.status}: ${run.stderr || run.stdout}`);
    }
    const expected = fs.readFileSync(validationFile);
    const actual = fs.readFileSync(path.join(outDir, 'validation.merged.json'));
    if (!expected.equals(actual)) throw new Error(`merged validation differs byte-for-byte (${expected.length} vs ${actual.length})`);
    return `${actual.length} bytes identical`;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});



let simpleState = null;

await expect('10. simple_capital fixture integrates with validation and static audits', () => {
  const alreadyPresent = accepted.elements.some(e => e.type !== 'LINK' && e.name === `${simpleFixture.colonies[0]} ${simpleFixture.sector} Capacity`);
  // When the fixture's sector is an accepted node, peel it at its own layer (later nodes may wrap it).
  const acceptedLayer = alreadyPresent
    ? layers.get(simpleDeclarations.find(x => x.decl.sector === simpleFixture.sector)?.decl)
    : null;
  if (alreadyPresent && !acceptedLayer) throw new Error(`${simpleFixture.sector} is in the accepted model but not declared in model/nodes/`);
  const baseModel = alreadyPresent ? acceptedLayer.base : accepted;
  const expanded = expandNode(simpleFixture, baseModel);
  const model = alreadyPresent ? accepted : applyPatch(baseModel, { format: PATCH_FORMAT, ...expanded.patch }).model;
  const merged = mergeNodeValidation(validation, [expanded.validation]);
  const conformance = runLifecycleConformance(model, merged);
  const audits = runStructureAudits(model, merged);
  const simple = conformance.simpleCapital;
  // Expected counts come from the merged validation: the fixture's two instances plus any accepted simple nodes.
  const expectedSimple = (merged.plugins.find(p => p.type === 'simple_capital')?.instances || []).length;
  if (simple?.status !== 'PASS' || simple.summary.instances !== expectedSimple || simple.summary.nonConforming !== 0) {
    throw new Error(`simple conformance mismatch: ${JSON.stringify(simple?.summary || simple)}`);
  }
  if (audits.algebraicLoops?.status !== 'PASS' || audits.algebraicLoops.combinationsWithLoops !== 0) {
    throw new Error(`algebraic loops detected: ${audits.algebraicLoops?.combinationsWithLoops}`);
  }
  if (audits.planetClosure?.counters?.P2?.simple !== expectedSimple) {
    throw new Error(`planet_closure P2.simple = ${audits.planetClosure?.counters?.P2?.simple}, expected ${expectedSimple}`);
  }
  if (audits.openBoundaries?.summary?.unclassified !== 0) {
    throw new Error(`open_boundaries unclassified = ${audits.openBoundaries?.summary?.unclassified}`);
  }
  const mode37 = (model.scenarios || []).find(s => s?.values?.['Timed Test Mode'] === 37);
  if (!mode37) throw new Error('accepted model has no Mode 37 to derive the simple-capital runtime probe');
  const trial = structuredClone(mode37);
  trial.name = 'Node QA simple_capital Mode 38';
  trial.values = { ...trial.values, 'Timed Test Mode': 38, [simpleFixture.switch]: 1 };

  const simModel = loadModelJSON(modelJsonForScenario(model, trial));
  const modelErrors = simModel.check();
  if (modelErrors.length) throw new Error(`Mode 38 model.check() returned ${modelErrors.length}: ${modelErrors.map(e => e.message || e).join('; ')}`);
  const results = simModel.simulate();
  const ctx = seriesContext(simModel, results);
  const runtime = [
    checkTimeAxis(results, merged.expected_time_step ?? model.simulation?.time_step ?? null, merged.time_step_tolerance ?? 1e-12),
    checkFiniteAll(simModel, results)
  ];
  if (merged.non_negative_regex) runtime.push(checkNonNegativeRegex(simModel, results, merged.non_negative_regex.pattern, merged.non_negative_regex.tolerance ?? 1e-10));
  for (const plugin of merged.plugins || []) runtime.push(...checkPlugin(plugin, ctx));
  for (const check of merged.global_checks || []) runtime.push(runGenericCheck(check, ctx));
  const runtimeFail = runtime.filter(x => x.status === 'FAIL');
  if (runtimeFail.length) throw new Error(`Mode 38 runtime checks failed: ${runtimeFail.map(x => `${x.name}: ${x.message || 'FAIL'}`).join('; ')}`);

  const values = name => Array.from(ctx.get(name), Number);
  const aCap = values('A Regolith Mine Capacity'), bCap = values('B Regolith Mine Capacity');
  const aExpansion = values('A Regolith Mine Expansion');
  const peakA = Math.max(...aCap), maxExpansion = Math.max(...aExpansion);
  const finalA = aCap[aCap.length - 1], finalB = bCap[bCap.length - 1];
  if (Math.abs(aCap[0] - 7) > 1e-9 || Math.abs(bCap[0] - 5) > 1e-9) throw new Error(`Mode 38 initial capacities differ: A=${aCap[0]}, B=${bCap[0]}`);
  if (!(peakA > 8.5 && peakA < 9.2)) throw new Error(`Mode 38 A peak capacity ${peakA} outside prototype envelope 8.5..9.2`);
  if (!(maxExpansion > 0.05 && maxExpansion < 0.09)) throw new Error(`Mode 38 A Expansion max ${maxExpansion} outside prototype envelope 0.05..0.09`);
  if (!(finalA > 1.5 && finalA < 3.2 && finalB > 0.1 && finalB < 0.5)) throw new Error(`Mode 38 final capacities outside prototype envelope: A=${finalA}, B=${finalB}`);

  simpleState = { base: baseModel, model, rebuildTarget: alreadyPresent ? acceptedLayer.target : model, validation: merged, expanded };
  return `simple=${expectedSimple} CONFORMING; loops=0; P2.simple=${expectedSimple}; unclassified=0; Mode38 PASS; A peak=${peakA.toFixed(3)}, expansion max=${maxExpansion.toFixed(4)}, final A/B=${finalA.toFixed(3)}/${finalB.toFixed(3)}`;
});

await expect('11. strip and rebuild every simple_capital declaration and the case-10 model', () => {
  if (!simpleState) throw new Error('case 10 did not produce a simple-capital model');
  const rebuilt = [];
  for (const { file, decl } of simpleDeclarations) {
    assertSimpleRebuild(decl, layers.get(decl).target);
    rebuilt.push(path.basename(file));
  }
  assertSimpleRebuild(simpleFixture, simpleState.rebuildTarget);
  rebuilt.push('case10:regolith-mine-simple');
  return `${rebuilt.length} target(s) rebuilt with 0 definition/replacement/link differences: ${rebuilt.join(', ')}`;
});

await expect('12. instantaneous VARIABLE sizing signal is NON_CONFORMING', () => {
  const bad = structuredClone(simpleFixture);
  bad.sizing.signal = { name: '{C} Regolith Requirement', create: false };
  const baseModel = simpleState?.base || accepted;
  const expanded = expandNode(bad, baseModel);
  const model = applyPatch(baseModel, { format: PATCH_FORMAT, ...expanded.patch }).model;
  // Since v7.7.5 the accepted validation already holds the good A/B Regolith Mine instances; drop them so the
  // mutated definition is merged instead of rejected as a conflict.
  const baseValidation = structuredClone(validation);
  const accSimple = baseValidation.plugins.find(p => p.type === 'simple_capital');
  const mutated = new Set((expanded.validation.simple_capital_instances || []).map(x => x.name));
  if (accSimple) accSimple.instances = accSimple.instances.filter(x => !mutated.has(x.name));
  const merged = mergeNodeValidation(baseValidation, [expanded.validation]);
  const result = runLifecycleConformance(model, merged);
  const a = result.simpleCapital?.instances?.find(x => x.name === 'A Regolith Mine');
  if (result.status !== 'FAIL' || a?.classification !== 'NON_CONFORMING') {
    throw new Error(`expected NON_CONFORMING, got ${result.status}/${a?.classification}`);
  }
  const evidence = (a.failures || []).find(x => x.includes('sizing signal') && x.includes('expected STOCK') && x.includes('VARIABLE'));
  if (!evidence) throw new Error(`missing STOCK sizing explanation: ${JSON.stringify(a.failures)}`);
  return evidence;
});

await expectThrows('13. simple_capital generated name conflict reports the element name', () => {
  const bad = structuredClone(simpleFixture);
  bad.sector = 'Regolith Extraction';
  expandNode(bad, simpleState?.base || accepted);
}, /conflicts with base element "A Regolith Extraction Capacity"/);

await expectThrows('14. simple_capital unknown declaration field is rejected with its path', () => {
  const bad = structuredClone(simpleFixture);
  bad.backings = [];
  expandNode(bad, accepted);
}, /node\.backings: unknown field/);

await expect('15. simple_capital expansion is byte-deterministic and matches prototype counts', () => {
  // Expanded against the model without the fixture sector (case 10), which the accepted model holds since v7.7.5.
  const a = expandNode(simpleFixture, simpleState?.base || accepted);
  const b = expandNode(simpleFixture, simpleState?.base || accepted);
  const sa = JSON.stringify(a), sb = JSON.stringify(b);
  if (sa !== sb) throw new Error('two simple_capital expansions differ byte-for-byte');
  const counts = [a.patch.add_elements.length, a.patch.replace_formulas.length, a.patch.add_links.length];
  if (counts[0] !== 34 || counts[1] !== 6 || counts[2] !== 78) {
    throw new Error(`prototype count mismatch: got ${counts.join('/')}, expected 34/6/78`);
  }
  return `34 elements / 6 replacements / 78 links; ${sa.length} JSON bytes stable`;
});



let powerState = null;

await expect('16. smooth-cap fixture expands byte-deterministically with verbatim uncapped/old formulas', () => {
  const alreadyPresent = accepted.elements.some(e => e.type !== 'LINK' && e.name === `${powerFixture.colonies[0]} ${powerFixture.sector} Capacity`);
  const acceptedDecl = simpleDeclarations.find(x => x.decl.sector === powerFixture.sector)?.decl || null;
  const acceptedLayer = alreadyPresent && acceptedDecl ? layers.get(acceptedDecl) : null;
  if (alreadyPresent && !acceptedLayer) throw new Error(`${powerFixture.sector} is in the accepted model but its simple_capital layer cannot be identified`);
  const baseModel = alreadyPresent ? acceptedLayer.base : accepted;
  const a = expandNode(powerFixture, baseModel);
  const b = expandNode(powerFixture, baseModel);
  const sa = JSON.stringify(a), sb = JSON.stringify(b);
  if (sa !== sb) throw new Error('two power-resource expansions differ byte-for-byte');
  const counts = [a.patch.add_elements.length, a.patch.replace_formulas.length, a.patch.add_links.length];
  if (counts[0] !== 36 || counts[1] !== 6 || counts[2] !== 94) {
    throw new Error(`prototype count mismatch: got ${counts.join('/')}, expected 36/6/94`);
  }
  for (const X of powerFixture.colonies) {
    const target = powerFixture.capacity_output.variable.replaceAll('{C}', X);
    const original = baseModel.elements.find(e => e.type !== 'LINK' && e.name === target)?.behavior?.value;
    if (original == null) throw new Error(`missing base formula for ${target}`);
    const uncappedName = `${X} ${powerFixture.sector} Uncapped Output`;
    const uncapped = a.patch.add_elements.find(e => e.name === uncappedName);
    if (!uncapped || uncapped.behavior.value !== original) throw new Error(`${uncappedName}: formula is not verbatim base formula`);
    const replacement = a.patch.replace_formulas.find(r => r.name === target);
    if (!replacement) throw new Error(`missing replacement for ${target}`);
    if (oldBranch(replacement.value, powerFixture.switch, target) !== original) throw new Error(`${target}: old branch is not verbatim base formula`);
  }
  powerState = { base: baseModel, expanded: a, alreadyPresent, acceptedLayer };
  return `36 elements / 6 replacements / 94 links; ${sa.length} JSON bytes stable`;
});


function validationWithoutSimpleFragment(raw, fragment) {
  const out = structuredClone(raw);
  const names = new Set((fragment.simple_capital_instances || []).map(x => x.name));
  const simple = out.plugins?.find(p => p.type === 'simple_capital');
  if (simple?.instances) simple.instances = simple.instances.filter(x => !names.has(x.name));

  const boundaries = out.plugins?.find(p => p.type === 'open_boundaries');
  const transformation = boundaries?.categories?.find(c => c.id === 'capital_transformation');
  const retirement = boundaries?.categories?.find(c => c.id === 'capital_retirement');
  const removeTransformation = new Set(fragment.capital_transformation_names || []);
  const removeRetirement = new Set(fragment.capital_retirement_names || []);
  if (transformation?.name) transformation.name = transformation.name.filter(x => !removeTransformation.has(x));
  if (retirement?.name) retirement.name = retirement.name.filter(x => !removeRetirement.has(x));
  const pairSources = new Set((fragment.transformation_pairs || []).map(x => x.source));
  if (boundaries?.transformation_pairs) boundaries.transformation_pairs = boundaries.transformation_pairs.filter(x => !pairSources.has(x.source));

  if (fragment.planet_closure) {
    const planet = out.plugins?.find(p => p.type === 'planet_closure');
    const process = planet?.processes?.find(x => x.id === fragment.planet_closure.process);
    if (process) delete process.capacity;
  }
  return out;
}

await expect('17. smooth-cap fixture integrates with validation and closes two P2 exceptions', () => {
  if (!powerState) throw new Error('case 16 did not produce power-resource expansion');
  const baselineValidation = powerState.alreadyPresent
    ? validationWithoutSimpleFragment(validation, powerState.expanded.validation)
    : validation;
  const baselineModel = powerState.base;
  const baselineAudits = runStructureAudits(baselineModel, baselineValidation);

  const model = applyPatch(baselineModel, { format: PATCH_FORMAT, ...powerState.expanded.patch }).model;
  const merged = mergeNodeValidation(baselineValidation, [powerState.expanded.validation]);
  const conformance = runLifecycleConformance(model, merged);
  const audits = runStructureAudits(model, merged);
  const expectedSimple = (merged.plugins.find(p => p.type === 'simple_capital')?.instances || []).length;
  const simple = conformance.simpleCapital;
  if (conformance.status !== 'PASS' || simple?.status !== 'PASS' ||
      simple.summary.instances !== expectedSimple || simple.summary.nonConforming !== 0) {
    throw new Error(`simple conformance mismatch: ${JSON.stringify(simple?.summary || simple)}`);
  }
  if (audits.algebraicLoops?.status !== 'PASS' || audits.algebraicLoops.combinationsWithLoops !== 0) {
    throw new Error(`algebraic loops detected: ${audits.algebraicLoops?.combinationsWithLoops}`);
  }
  if (audits.openBoundaries?.summary?.unclassified !== 0) {
    throw new Error(`open_boundaries unclassified = ${audits.openBoundaries?.summary?.unclassified}`);
  }
  const beforeP2 = baselineAudits.planetClosure?.counters?.P2;
  const afterP2 = audits.planetClosure?.counters?.P2;
  if (!beforeP2 || !afterP2) throw new Error('planet_closure P2 counters are missing');
  if (afterP2.simple !== beforeP2.simple + powerFixture.colonies.length) {
    throw new Error(`P2.simple delta = ${afterP2.simple - beforeP2.simple}, expected +${powerFixture.colonies.length}`);
  }
  // When the node is already accepted, its layer is peeled together with the process's capacity declaration,
  // so before the node the process counts as undeclared rather than as an exception: compare the sum.
  const openBefore = beforeP2.exceptions + beforeP2.undeclared, openAfter = afterP2.exceptions + afterP2.undeclared;
  if (openAfter !== openBefore - powerFixture.colonies.length) {
    throw new Error(`P2 exceptions+undeclared delta = ${openAfter - openBefore}, expected -${powerFixture.colonies.length}`);
  }
  powerState.model = model;
  powerState.validation = merged;
  powerState.target = model;
  return `simple=${expectedSimple} CONFORMING; loops=0; P2 simple ${beforeP2.simple}->${afterP2.simple}, exceptions ${beforeP2.exceptions}->${afterP2.exceptions}; unclassified=0`;
});

await expect('18. smooth cap bounds runtime rate by uncapped output and capacity', () => {
  if (!powerState?.model || !powerState?.validation) throw new Error('case 17 did not produce integrated model/validation');
  const scenarios = powerState.model.scenarios || [];
  if (!scenarios.length) throw new Error('model has no scenarios');
  const source = scenarios[scenarios.length - 1];
  const trial = structuredClone(source);
  trial.name = `${source.name || 'last mode'} — Node QA power-resource smooth cap`;
  trial.values = { ...trial.values, [powerFixture.switch]: 1 };

  const simModel = loadModelJSON(modelJsonForScenario(powerState.model, trial));
  const modelErrors = simModel.check();
  if (modelErrors.length) throw new Error(`trial model.check() returned ${modelErrors.length}: ${modelErrors.map(e => e.message || e).join('; ')}`);
  const results = simModel.simulate();
  const ctx = seriesContext(simModel, results);
  const runtime = [
    checkTimeAxis(results, powerState.validation.expected_time_step ?? powerState.model.simulation?.time_step ?? null, powerState.validation.time_step_tolerance ?? 1e-12),
    checkFiniteAll(simModel, results)
  ];
  if (powerState.validation.non_negative_regex) {
    runtime.push(checkNonNegativeRegex(simModel, results, powerState.validation.non_negative_regex.pattern, powerState.validation.non_negative_regex.tolerance ?? 1e-10));
  }
  for (const plugin of powerState.validation.plugins || []) runtime.push(...checkPlugin(plugin, ctx));
  for (const check of powerState.validation.global_checks || []) runtime.push(runGenericCheck(check, ctx));
  const runtimeFail = runtime.filter(x => x.status === 'FAIL');
  if (runtimeFail.length) throw new Error(`runtime checks failed: ${runtimeFail.map(x => `${x.name}: ${x.message || 'FAIL'}`).join('; ')}`);

  let checked = 0;
  for (const X of powerFixture.colonies) {
    const rate = Array.from(ctx.get(`${X} Power Resource Extraction Rate`), Number);
    const uncapped = Array.from(ctx.get(`${X} Power Resource Mine Uncapped Output`), Number);
    const capacity = Array.from(ctx.get(`${X} Power Resource Mine Capacity`), Number);
    if (rate.length !== uncapped.length || rate.length !== capacity.length) throw new Error(`${X}: series length mismatch`);
    for (let i = 0; i < rate.length; i++) {
      if (rate[i] > uncapped[i] + 1e-9) throw new Error(`${X} point ${i}: rate ${rate[i]} > uncapped ${uncapped[i]}`);
      if (rate[i] > capacity[i] + 0.001 + 1e-9) throw new Error(`${X} point ${i}: rate ${rate[i]} > capacity+0.001 ${capacity[i] + 0.001}`);
      checked++;
    }
  }
  return `${checked} colony-time points satisfy both smooth-cap bounds; runtime plugins PASS`;
});

await expect('19. strip and rebuild smooth-cap case with zero definition/replacement/link differences', () => {
  if (!powerState?.target) throw new Error('case 17 did not produce rebuild target');
  const out = assertSimpleRebuild(powerFixture, powerState.target);
  return `${out.patch.add_elements.length} definitions, ${out.patch.replace_formulas.length} replacements, ${out.patch.add_links.length} links rebuilt exactly`;
});

await expect('20. capacity_output rejects replaces+cap, lifecycle cap, and unsupported cap value with paths', async () => {
  const both = structuredClone(powerFixture);
  both.capacity_output.replaces = '{C} Mining Capacity';
  await requireThrow(() => expandNode(both, powerState?.base || accepted), /node\.capacity_output: use either replaces or cap, not both/, 'replaces+cap');

  const lifecycleCap = structuredClone(decl);
  delete lifecycleCap.capacity_output.replaces;
  lifecycleCap.capacity_output.cap = 'smooth';
  await requireThrow(() => expandNode(lifecycleCap, base), /node\.capacity_output\.cap: only simple_capital supports cap/, 'capital_lifecycle cap');

  const hard = structuredClone(powerFixture);
  hard.capacity_output.cap = 'hard';
  await requireThrow(() => expandNode(hard, powerState?.base || accepted), /node\.capacity_output\.cap: must be "smooth"/, 'cap hard');
  return 'all three invalid forms rejected with declaration paths';
});

await expect('21. per-colony initial requires exact colony keys and initializes each signal stock separately', async () => {
  const missing = structuredClone(powerFixture);
  delete missing.sizing.signal.initial.B;
  await requireThrow(() => expandNode(missing, powerState?.base || accepted), /node\.sizing\.signal\.initial\.B: required field is missing/, 'missing B');

  const extra = structuredClone(powerFixture);
  extra.sizing.signal.initial.C = 1;
  await requireThrow(() => expandNode(extra, powerState?.base || accepted), /node\.sizing\.signal\.initial\.C: unknown field/, 'extra C');

  const good = expandNode(powerFixture, powerState?.base || accepted);
  const a = good.patch.add_elements.find(e => e.name === 'A Power Resource Demand Signal');
  const b = good.patch.add_elements.find(e => e.name === 'B Power Resource Demand Signal');
  if (a?.behavior?.initial_value !== powerFixture.sizing.signal.initial.A) throw new Error(`A initial = ${a?.behavior?.initial_value}`);
  if (b?.behavior?.initial_value !== powerFixture.sizing.signal.initial.B) throw new Error(`B initial = ${b?.behavior?.initial_value}`);
  return `A=${a.behavior.initial_value}, B=${b.behavior.initial_value}`;
});

console.log(`\nNODE SELF-TEST: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
