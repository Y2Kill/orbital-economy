#!/usr/bin/env node
import { discoverSingleJson } from './workspace.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverWorkspace, prepareWebBatch, archiveProcessedWebBatch } from './workspace.js';
import { inspectWebReferenceBatch } from './regression.js';
import { ensureDir, readJson, writeJson } from './util.js';
import { compareModelStructure } from './compare_models.js';
import { runGenericCheck } from './checks.js';
import { applyPatch, validatePatch, PATCH_FORMAT } from './patch.js';
import { inventory, buildRegistry, validateAnnotations } from './parameters.js';
import { loadModelJSON, assertEngineVersion } from './engine.js';

const root = path.resolve(process.cwd());
const sourceModel = discoverSingleJson(path.join(root, 'input', 'model'), 'accepted ModelJSON');
const sourceValidation = discoverSingleJson(path.join(root, 'input', 'validation'), 'validation JSON');

let passed = 0;
let failed = 0;

function mark(ok, name, detail = '') {
  if (ok) {
    passed++;
    console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function expect(name, fn) {
  try {
    const v = await fn();
    mark(v !== false, name, v && typeof v === 'string' ? v : '');
  } catch (e) {
    mark(false, name, e.message || String(e));
  }
}

async function expectThrows(name, fn, contains = null) {
  try {
    await fn();
    mark(false, name, 'expected an error, but operation succeeded');
  } catch (e) {
    const msg = e.message || String(e);
    mark(!contains || msg.includes(contains), name, msg);
  }
}

function copyFile(src, dst) {
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function makeWorkspace(base) {
  const input = path.join(base, 'input');
  const model = path.join(input, 'model', 'model.json');
  const validation = path.join(input, 'validation', 'validation.json');
  copyFile(sourceModel, model);
  copyFile(sourceValidation, validation);
  ensureDir(path.join(input, 'web_reference', 'pending'));
  return { input, model, validation, pending: path.join(input, 'web_reference', 'pending') };
}

function csv(file, mode, modeColumn = 'Timed Test Mode') {
  fs.writeFileSync(file, `Time,${modeColumn}\r\n0,${mode}\r\n`, 'utf8');
}

async function inspect(ws) {
  return inspectWebReferenceBatch({
    referenceDir: ws.pending,
    currentModelFile: ws.model,
    currentValidationFile: ws.validation,
    modeColumn: 'Timed Test Mode'
  });
}

if (!fs.existsSync(sourceModel) || !fs.existsSync(sourceValidation)) {
  console.error('QA_SELF_TEST requires the standard input/model and input/validation files shipped with the lab.');
  process.exit(2);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-lab-qa-'));
console.log('Orbital Economy Lab QA self-test');
console.log(`Temporary workspace: ${tmp}`);
console.log('No production input/output files will be modified.\n');

try {
  await expect('workspace discovery: exactly one model + validation', async () => {
    const ws = makeWorkspace(path.join(tmp, 'discover-ok'));
    const d = discoverWorkspace(ws.input);
    return path.resolve(d.modelFile) === path.resolve(ws.model) && path.resolve(d.validationFile) === path.resolve(ws.validation);
  });

  await expectThrows('workspace discovery rejects multiple models', async () => {
    const ws = makeWorkspace(path.join(tmp, 'discover-multi-model'));
    copyFile(ws.model, path.join(ws.input, 'model', 'second.json'));
    discoverWorkspace(ws.input);
  }, 'Multiple JSON files');

  await expectThrows('workspace discovery rejects multiple validation files', async () => {
    const ws = makeWorkspace(path.join(tmp, 'discover-multi-validation'));
    copyFile(ws.validation, path.join(ws.input, 'validation', 'second.json'));
    discoverWorkspace(ws.input);
  }, 'Multiple JSON files');

  await expect('empty web-reference folder is SKIPPED', async () => {
    const ws = makeWorkspace(path.join(tmp, 'empty'));
    const r = await inspect(ws);
    return r.status === 'SKIPPED' && r.present === false;
  });

  await expect('complete prepared web batch passes preflight', async () => {
    const ws = makeWorkspace(path.join(tmp, 'valid'));
    const prep = prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
    for (const mode of prep.manifest.expected_modes) csv(path.join(ws.pending, `mode-${mode}.csv`), mode);
    const r = await inspect(ws);
    return r.status === 'PASS' && r.missingModes.length === 0 && r.extraModes.length === 0 && r.byMode.size === prep.manifest.expected_modes.length;
  });

  await expect('missing Mode is detected as FAIL', async () => {
    const ws = makeWorkspace(path.join(tmp, 'missing'));
    const prep = prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
    const missing = prep.manifest.expected_modes.at(-1);
    for (const mode of prep.manifest.expected_modes) if (mode !== missing) csv(path.join(ws.pending, `mode-${mode}.csv`), mode);
    const r = await inspect(ws);
    return r.status === 'FAIL' && r.missingModes.includes(missing);
  });

  await expect('duplicate Mode is detected as FAIL', async () => {
    const ws = makeWorkspace(path.join(tmp, 'duplicate'));
    const prep = prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
    for (const mode of prep.manifest.expected_modes) csv(path.join(ws.pending, `mode-${mode}.csv`), mode);
    csv(path.join(ws.pending, 'duplicate.csv'), prep.manifest.expected_modes[0]);
    const r = await inspect(ws);
    return r.status === 'FAIL' && r.errors.some(x => x.includes('Duplicate web result'));
  });

  await expect('unexpected extra Mode is detected as FAIL', async () => {
    const ws = makeWorkspace(path.join(tmp, 'extra'));
    const prep = prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
    for (const mode of prep.manifest.expected_modes) csv(path.join(ws.pending, `mode-${mode}.csv`), mode);
    const extra = Math.max(...prep.manifest.expected_modes) + 100;
    csv(path.join(ws.pending, 'extra.csv'), extra);
    const r = await inspect(ws);
    return r.status === 'FAIL' && r.extraModes.includes(extra);
  });

  await expect('CSV without Timed Test Mode is detected as FAIL', async () => {
    const ws = makeWorkspace(path.join(tmp, 'bad-csv'));
    prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
    fs.writeFileSync(path.join(ws.pending, 'broken.csv'), 'Time,Wrong Column\r\n0,0\r\n', 'utf8');
    const r = await inspect(ws);
    return r.status === 'FAIL' && r.errors.some(x => x.includes('cannot determine Mode'));
  });

  await expect('missing web manifest is detected as FAIL', async () => {
    const ws = makeWorkspace(path.join(tmp, 'no-manifest'));
    csv(path.join(ws.pending, 'mode-0.csv'), 0);
    const r = await inspect(ws);
    return r.status === 'FAIL' && r.errors.some(x => x.includes('web_batch_manifest.json is missing'));
  });

  await expect('model SHA mismatch is detected as FAIL', async () => {
    const ws = makeWorkspace(path.join(tmp, 'wrong-sha'));
    const prep = prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
    for (const mode of prep.manifest.expected_modes) csv(path.join(ws.pending, `mode-${mode}.csv`), mode);
    fs.appendFileSync(ws.model, '\n'); // valid JSON, different byte-level SHA-256
    const r = await inspect(ws);
    return r.status === 'FAIL' && r.errors.some(x => x.includes('belongs to another model'));
  });

  await expectThrows('PREPARE refuses to overwrite a pending CSV batch', async () => {
    const ws = makeWorkspace(path.join(tmp, 'prepare-refuse'));
    prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
    csv(path.join(ws.pending, 'mode-0.csv'), 0);
    prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
  }, 'already contains');

  await expect('processed web batch is archived and pending is reset', async () => {
    const ws = makeWorkspace(path.join(tmp, 'archive'));
    prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
    csv(path.join(ws.pending, 'mode-0.csv'), 0);
    const out = path.join(tmp, 'archive', 'output-run');
    ensureDir(out);
    const dst = archiveProcessedWebBatch({ pendingDir: ws.pending, outDir: out });
    return !!dst && fs.existsSync(path.join(dst, 'mode-0.csv')) && fs.existsSync(ws.pending) && !fs.readdirSync(ws.pending).some(n => n.toLowerCase().endsWith('.csv'));
  });

  await expect('manifest ownership remains explicit (model + validation SHA stored)', async () => {
    const ws = makeWorkspace(path.join(tmp, 'manifest'));
    prepareWebBatch({ modelFile: ws.model, validationFile: ws.validation, pendingDir: ws.pending });
    const m = readJson(path.join(ws.pending, 'web_batch_manifest.json'));
    return typeof m?.model?.sha256 === 'string' && m.model.sha256.length === 64 && typeof m?.validation?.sha256 === 'string' && m.validation.sha256.length === 64;
  });


  await expect('engine pin rejects a substituted installed version', async () => {
    const fakePackage = path.join(tmp, 'engine-pin', 'package.json');
    ensureDir(path.dirname(fakePackage));
    writeJson(fakePackage, { name: 'simulation', version: '9.0.1' });
    try {
      assertEngineVersion(fakePackage);
      return false;
    } catch (e) {
      return String(e?.message || e).includes('requires simulation@9.0.0') && String(e?.message || e).includes('found 9.0.1');
    }
  });

  await expect('model diff: identical model has no semantic structural changes', async () => {
    const raw = readJson(sourceModel);
    const d = compareModelStructure(raw, structuredClone(raw), 'Timed Test Mode');
    return d.addedElements.length === 0 && d.removedElements.length === 0 && d.changedDefinitions.length === 0 && d.addedLinks.length === 0 && d.removedLinks.length === 0 && d.changedScenarioInputs.length === 0;
  });

  await expect('model diff: changed behavior is detected', async () => {
    const a = readJson(sourceModel);
    const b = structuredClone(a);
    const el = b.elements.find(x => x?.name === 'A Wage');
    if (!el) return false;
    el.behavior.value = Number(el.behavior.value) + 1;
    const d = compareModelStructure(a, b, 'Timed Test Mode');
    return d.changedDefinitions.includes('A Wage');
  });

  await expect('model diff: added scenario Mode is detected', async () => {
    const a = readJson(sourceModel);
    const b = structuredClone(a);
    const extra = structuredClone(b.scenarios[0]);
    extra.name = 'QA added scenario';
    extra.values['Timed Test Mode'] = 999;
    b.scenarios.push(extra);
    const d = compareModelStructure(a, b, 'Timed Test Mode');
    return d.addedModes.includes(999);
  });

  // ---- declarative HARD invariants (v0.6.1) on a synthetic series context
  const ctx = { times: [0, 1, 2, 3], has: () => true, get(name) {
    const table = { a: [1, 2, 3, 4], b: [1, 2, 3, 5], sum: [2, 4, 6, 10], frac: [0, 0.5, 1, 1.0000000001], bad: [0, 0.5, 1.2, 1] };
    if (!(name in table)) throw new Error(`no series ${name}`);
    return table[name];
  } };
  await expect('generic relation check passes and fails correctly', async () => {
    const ok = runGenericCheck({ type: 'relation', name: 'a <= b', left: 'a', right: 'b', op: '<=' }, ctx);
    const bad = runGenericCheck({ type: 'relation', name: 'b <= a', left: 'b', right: 'a', op: '<=' }, ctx);
    const badOp = runGenericCheck({ type: 'relation', name: 'x', left: 'a', right: 'b', op: '==' }, ctx);
    return ok.status === 'PASS' && bad.status === 'FAIL' && bad.message.includes('day 3') && badOp.status === 'FAIL';
  });
  await expect('generic identity check passes and fails correctly', async () => {
    const ok = runGenericCheck({ type: 'identity', name: 'sum = a + b', terms: [{ column: 'sum', coef: 1 }, { column: 'a', coef: -1 }, { column: 'b', coef: -1 }], window: [0, 2] }, ctx);
    const bad = runGenericCheck({ type: 'identity', name: 'sum = a + b (all)', terms: [{ column: 'sum', coef: 1 }, { column: 'a', coef: -1 }, { column: 'b', coef: -1 }] }, ctx);
    return ok.status === 'PASS' && bad.status === 'FAIL' && bad.message.includes('day 3');
  });
  await expect('generic bounded check honours min/max with tolerance', async () => {
    const ok = runGenericCheck({ type: 'bounded', name: 'frac in [0,1]', column: 'frac', min: 0, max: 1, tolerance: 1e-8 }, ctx);
    const bad = runGenericCheck({ type: 'bounded', name: 'bad in [0,1]', column: 'bad', min: 0, max: 1 }, ctx);
    const missing = runGenericCheck({ type: 'bounded', name: 'nope', column: 'nope', min: 0 }, ctx);
    return ok.status === 'PASS' && bad.status === 'FAIL' && bad.message.includes('day 2') && missing.status === 'FAIL';
  });

  // ---- model patch (v0.7.0)
  await expect('model patch: additive patch applies, loads and checks; base untouched', async () => {
    const base = readJson(sourceModel);
    const before = JSON.stringify(base);
    const patch = { format: PATCH_FORMAT, name: 'QA patched candidate',
      add_elements: [
        { type: 'VARIABLE', name: 'QA Switch', behavior: { value: 1 } },
        { type: 'STOCK', name: 'QA Buffer', behavior: { initial_value: 5, non_negative: true } },
        { type: 'FLOW', name: 'QA Transfer', from: 'A Metal Inventory', to: 'QA Buffer', behavior: { value: '[QA Switch] * 0' } }
      ],
      replace_formulas: [{ name: 'A Electronics Feedstock Price', value: 'IfThenElse([QA Switch] = 2, 0, [A Effective Electronics Feedstock Base Cost] * (1 + [A Electronics Feedstock Scarcity Strength] * [A Electronics Feedstock Shortage] / [A Electronics Feedstock Target Inventory]))' }],
      add_links: [{ from: 'QA Switch', to: 'QA Transfer' }, { from: 'QA Switch', to: 'A Electronics Feedstock Price' }],
      modify_scenarios: [{ mode: 0, set: { 'QA Switch': 1 } }],
      add_scenarios: [{ name: 'QA Mode', values: { 'Timed Test Mode': 99, 'QA Switch': 1 } }]
    };
    const { model, log } = applyPatch(base, patch);
    const errs = loadModelJSON(model).check();
    return JSON.stringify(base) === before && errs.length === 0 && model.name === 'QA patched candidate'
      && model.elements.length === base.elements.length + 5 && model.scenarios.length === base.scenarios.length + 1 && log.length === 8;
  });
  await expectThrows('model patch: existing name cannot be re-added', async () => {
    applyPatch(readJson(sourceModel), { format: PATCH_FORMAT, add_elements: [{ type: 'VARIABLE', name: 'A Wage', behavior: { value: 1 } }] });
  }, 'already exists');
  await expectThrows('model patch: replacing a missing element is an error', async () => {
    applyPatch(readJson(sourceModel), { format: PATCH_FORMAT, replace_formulas: [{ name: 'Nope', value: '1' }] });
  }, 'does not exist');
  await expectThrows('model patch: FLOW endpoints must be existing STOCKs', async () => {
    applyPatch(readJson(sourceModel), { format: PATCH_FORMAT, add_elements: [{ type: 'FLOW', name: 'QA Bad', from: 'A Wage', to: null, behavior: { value: '0' } }] });
  }, 'is not a STOCK');
  await expectThrows('model patch: base SHA mismatch is refused', async () => {
    applyPatch(readJson(sourceModel), { format: PATCH_FORMAT, base_sha256: '0'.repeat(64) }, { baseSha256: '1'.repeat(64) });
  }, 'written against base');
  await expect('model patch: schema validation catches malformed entries', async () => {
    const e = validatePatch({ format: PATCH_FORMAT, add_elements: [{ type: 'FLOW', name: 'X', behavior: { value: 1 } }], add_links: [{ from: 'A' }], modify_scenarios: [{ mode: 'x' }] });
    return e.length >= 3;
  });

  // ---- parameter registry (v0.8.0)
  await expect('parameter registry: inventory equals numeric constants + numeric stock initials; switches detected', async () => {
    const raw = readJson(sourceModel);
    const items = inventory(raw);
    const els = raw.elements.filter(e => e.type !== 'LINK');
    const isNum = v => typeof v === 'number' || (typeof v === 'string' && /^\s*-?\d+(\.\d+)?([eE][-+]?\d+)?\s*$/.test(v));
    const expected = els.filter(e => (e.type === 'VARIABLE' && isNum(e.behavior?.value)) || (e.type === 'STOCK' && isNum(e.behavior?.initial_value))).length;
    const sw = items.filter(i => i.kind === 'switch').map(i => i.name);
    const wage = items.find(i => i.name === 'A Wage');
    return items.length === expected && sw.includes('Capital Lifecycle Enabled') && wage && wage.mirror === 'B Wage' && wage.asymmetric === true ? `${items.length} items, switches: ${sw.join(', ')}` : false;
  });
  await expect('parameter registry: annotations merge, mirror propagation and unknown-name warning', async () => {
    const raw = readJson(sourceModel);
    const ann = { format: 'orbital-economy-parameter-annotations-v1', parameters: {
      'A Ore Base Cost': { role: 'r', effect: 'e', applies_to_mirror: true },
      'Travel Time': { role: 'r', effect: 'e' },
      'No Such Parameter': { role: 'r', effect: 'e' } } };
    if (validateAnnotations(ann).length) return false;
    const reg = buildRegistry(raw, ann);
    const a = reg.items.find(i => i.name === 'A Ore Base Cost'), b = reg.items.find(i => i.name === 'B Ore Base Cost'), t = reg.items.find(i => i.name === 'Travel Time');
    return !!a.annotation && !!b.annotation && !!t.annotation && reg.summary.annotated === 3 && reg.unknownAnnotations.includes('No Such Parameter') && reg.asymmetricPairs.some(p => p.name === 'Ore Base Cost' && p.annotated);
  });
  await expect('parameter registry: malformed annotations are rejected', async () => {
    return validateAnnotations({ format: 'x', parameters: { 'A Wage': { role: 'only role' } } }).length >= 2;
  });

} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\nQA RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed} passed, ${failed} failed)`);
process.exitCode = failed === 0 ? 0 : 2;
