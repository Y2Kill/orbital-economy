#!/usr/bin/env node
// QA for the Capital Lifecycle Kernel conformance layer.
// Every negative case mutates a COPY of the real accepted model, never a synthetic toy,
// so the checker is proven against the actual ModelJSON structure it must protect.
import { discoverSingleJson } from './workspace.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadModelJSON } from 'simulation';
import { runLifecycleConformance, findKernelPlugin } from './lifecycle_conformance.js';
import { checkPlugin, seriesContext } from './checks.js';
import { listScenarios, modelJsonForScenario } from './model.js';
import { compareModels } from './compare_models.js';
import { readJson, writeJson, ensureDir } from './util.js';

const root = path.resolve(process.cwd());
const modelFile = discoverSingleJson(path.join(root, 'reference', 'accepted', 'model'), 'accepted ModelJSON');
const validationFile = discoverSingleJson(path.join(root, 'input', 'validation'), 'validation JSON');
if (!fs.existsSync(modelFile) || !fs.existsSync(validationFile)) {
  console.error('[FAIL] Required accepted model or validation file is missing.');
  process.exit(2);
}

const baseRaw = readJson(modelFile);
const baseValidation = readJson(validationFile);

let passed = 0, failed = 0;
function mark(ok, name, detail = '') {
  if (ok) { passed++; console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`); }
  else { failed++; console.error(`[FAIL] ${name}${detail ? ` — ${detail}` : ''}`); }
}
async function expect(name, fn) {
  try { const v = await fn(); mark(v !== false, name, typeof v === 'string' ? v : ''); }
  catch (e) { mark(false, name, e.message || String(e)); }
}

const el = (raw, name) => raw.elements.find(x => x?.type !== 'LINK' && x?.name === name);
const cls = (r, name) => r.instances.find(i => i.name === name)?.classification;
const failuresOf = (r, name) => r.instances.find(i => i.name === name)?.failures || [];
function run(raw, validation = baseValidation) { return runLifecycleConformance(raw, validation); }

console.log('Orbital Economy Lab lifecycle-conformance QA');
console.log('Static negative tests on mutated copies of the accepted model + runtime kernel identities (Mode 0).');
console.log('Production input/output is not modified.\n');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-conformance-qa-'));
try {
  await expect('accepted baseline: all seven instances conform', () => {
    const r = run(baseRaw);
    const ok = r.status === 'PASS' && r.summary.instances === 7 && r.summary.nonConforming === 0
      && cls(r, 'A Refinery') === 'CONFORMING_WITH_VARIATION' && cls(r, 'B Refinery') === 'CONFORMING_WITH_VARIATION' && cls(r, 'Transport') === 'CONFORMING_WITH_VARIATION'
      && cls(r, 'A Electronics') === 'CONFORMING_WITH_VARIATION' && cls(r, 'B Power') === 'CONFORMING_WITH_VARIATION';
    return ok ? `conforming=${r.summary.conforming}, with-variation=${r.summary.conformingWithVariation}` : false;
  });

  await expect('missing required flow is NON_CONFORMING (B Refinery Dismantling Completion removed)', () => {
    const raw = structuredClone(baseRaw);
    raw.elements = raw.elements.filter(x => !(x.type === 'FLOW' && x.name === 'B Refinery Dismantling Completion'));
    const r = run(raw);
    return r.status === 'FAIL' && cls(r, 'B Refinery') === 'NON_CONFORMING' && cls(r, 'A Refinery') === 'CONFORMING_WITH_VARIATION'
      && failuresOf(r, 'B Refinery').some(f => f.includes('role dismantling_completion') && f.includes('not found'));
  });

  await expect('wrong flow topology is NON_CONFORMING (A Power Generation Depreciation no longer ends in Retired)', () => {
    const raw = structuredClone(baseRaw);
    el(raw, 'A Power Generation Depreciation').to = null;
    const r = run(raw);
    return r.status === 'FAIL' && cls(r, 'A Power') === 'NON_CONFORMING'
      && failuresOf(r, 'A Power').some(f => f.startsWith('flow installed_depreciation'));
  });

  await expect('missing LINK is NON_CONFORMING (Installed -> Inactive link removed for A Electronics)', () => {
    const raw = structuredClone(baseRaw);
    raw.elements = raw.elements.filter(x => !(x.type === 'LINK' && x.from === 'A Electronics Installed Factory Capacity' && x.to === 'A Electronics Inactive Factory Capacity'));
    const r = run(raw);
    return r.status === 'FAIL' && cls(r, 'A Electronics') === 'NON_CONFORMING'
      && failuresOf(r, 'A Electronics').some(f => f.includes('missing LINK'))
      && r.modelWide.some(c => c.name === 'formula dependencies without LINK' && c.status === 'FAIL');
  });

  await expect('wrong primitive type is NON_CONFORMING (A Refinery Inactive Capacity turned into a STOCK)', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'A Refinery Inactive Capacity');
    e.type = 'STOCK';
    e.behavior = { initial_value: '0' };
    const r = run(raw);
    return r.status === 'FAIL' && cls(r, 'A Refinery') === 'NON_CONFORMING'
      && failuresOf(r, 'A Refinery').some(f => f.includes('expected VARIABLE, found STOCK'));
  });

  await expect('sector parameterization is NOT a violation (Transport Activation Time 7 -> 30 stays CONFORMING_WITH_VARIATION)', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'Transport Activation Time');
    if (String(e.behavior.value) !== '7') throw new Error(`fixture expects Transport Activation Time = 7, found ${e.behavior.value}`);
    e.behavior.value = '30';
    const r = run(raw);
    return r.status === 'PASS' && cls(r, 'Transport') === 'CONFORMING_WITH_VARIATION';
  });

  await expect('sector policy formula change is NOT a violation (Refinery Required Active factor 1.10 -> 1.25 stays CONFORMING_WITH_VARIATION)', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'A Refinery Required Active Capacity');
    e.behavior.value = String(e.behavior.value).replace('1.1', '1.25');
    const r = run(raw);
    return r.status === 'PASS' && cls(r, 'A Refinery') === 'CONFORMING_WITH_VARIATION';
  });

  await expect('legacy switch added to a non-gated sector is NON_CONFORMING (Transport Capacity Activation gated by Capital Lifecycle Enabled)', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'Transport Capacity Activation');
    e.behavior.value = `[Capital Lifecycle Enabled] * (${e.behavior.value})`;
    raw.elements.push({ type: 'LINK', from: 'Capital Lifecycle Enabled', to: 'Transport Capacity Activation' });
    const r = run(raw);
    return r.status === 'FAIL' && cls(r, 'Transport') === 'NON_CONFORMING'
      && failuresOf(r, 'Transport').some(f => f.includes('references the legacy switch'));
  });

  await expect('gated sector with one ungated flow is NON_CONFORMING (switch removed from B Electronics Factory Mothballing)', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'B Electronics Factory Mothballing');
    e.behavior.value = String(e.behavior.value).replace('[Capital Lifecycle Enabled] * ', '');
    const r = run(raw);
    return r.status === 'FAIL' && cls(r, 'B Electronics') === 'NON_CONFORMING'
      && failuresOf(r, 'B Electronics').some(f => f.includes('ungated flows: mothballing'));
  });

  await expect('dangling reference inside a kernel element is NON_CONFORMING', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'A Refinery Lifetime Capacity Account');
    e.behavior.value = `${e.behavior.value} + [A Refinery Ghost Capacity]`;
    const r = run(raw);
    return r.status === 'FAIL' && cls(r, 'A Refinery') === 'NON_CONFORMING'
      && failuresOf(r, 'A Refinery').some(f => f.includes('unknown primitive'))
      && r.modelWide.some(c => c.name === 'unresolved formula references' && c.status === 'FAIL');
  });

  await expect('kernel-v2: instance declaring kernel_version 2 without v2 roles is a spec error; with roles it conforms (stock -> ∅ topology, deps)', () => {
    const raw = structuredClone(baseRaw);
    raw.elements.push({ type: 'STOCK', name: 'QA Capital Goods Inventory', behavior: { initial_value: 10 } });
    raw.elements.push({ type: 'VARIABLE', name: 'QA Refinery Desired Expansion', behavior: { value: '[A Refinery Gap Limited Construction]' } });
    raw.elements.push({ type: 'LINK', from: 'A Refinery Gap Limited Construction', to: 'QA Refinery Desired Expansion' });
    raw.elements.push({ type: 'FLOW', name: 'QA Refinery Capital Goods Consumption', from: 'QA Capital Goods Inventory', to: null, behavior: { value: '[A Refinery Expansion] * 17' } });
    raw.elements.push({ type: 'LINK', from: 'A Refinery Expansion', to: 'QA Refinery Capital Goods Consumption' });
    const v1 = structuredClone(baseValidation);
    const inst = findKernelPlugin(v1).instances.find(i => i.name === 'A Refinery');
    inst.kernel_version = 2;
    delete inst.roles.desired_expansion; delete inst.roles.capital_goods_consumption;   // v2 declared without v2 roles
    const specErr = runLifecycleConformance(raw, v1);
    inst.roles.desired_expansion = 'QA Refinery Desired Expansion';
    inst.roles.capital_goods_consumption = 'QA Refinery Capital Goods Consumption';
    const ok = runLifecycleConformance(raw, v1);
    const inst2 = structuredClone(inst); inst2.roles.capital_goods_consumption = 'A Refinery Expansion'; // wrong topology (∅ -> stock)
    const v2 = structuredClone(v1); Object.assign(findKernelPlugin(v2).instances.find(i => i.name === 'A Refinery'), inst2);
    const badTopo = runLifecycleConformance(raw, v2);
    const good = specErr.status === 'FAIL' && (specErr.specErrors || []).some(e => e.includes('kernel_version 2 requires role'))
      && ok.status === 'PASS' && cls(ok, 'A Refinery') === 'CONFORMING_WITH_VARIATION' && ok.instances.find(i => i.name === 'A Refinery').variations.some(v => v.includes('kernel-v2'))
      && badTopo.status === 'FAIL' && failuresOf(badTopo, 'A Refinery').some(f => f.startsWith('flow capital_goods_consumption'));
    if (!good) throw new Error(JSON.stringify([specErr.status, ok.status, cls(ok, 'A Refinery'), badTopo.status]));
    return 'spec error / conform / wrong topology all detected';
  });

  await expect('mapping to a nonexistent primitive is reported, not crashed', () => {
    const validation = structuredClone(baseValidation);
    findKernelPlugin(validation).instances.find(i => i.name === 'Transport').roles.surplus = 'Transport Surplus Capacity (renamed)';
    const r = run(baseRaw, validation);
    return r.status === 'FAIL' && cls(r, 'Transport') === 'NON_CONFORMING'
      && failuresOf(r, 'Transport').some(f => f.includes('primitive not found'));
  });

  await expect('kernel spec with an unmapped required role is rejected before checking', () => {
    const validation = structuredClone(baseValidation);
    delete findKernelPlugin(validation).instances[0].roles.lifetime;
    const r = run(baseRaw, validation);
    return r.status === 'FAIL' && Array.isArray(r.specErrors) && r.specErrors.some(e => e.includes('required role "lifetime"'));
  });

  await expect('validation without kernel plugin is SKIPPED, not failed', () => {
    const validation = structuredClone(baseValidation);
    validation.plugins = validation.plugins.filter(p => p.type !== 'capital_lifecycle_kernel');
    return run(baseRaw, validation).status === 'SKIPPED';
  });

  await expect('COMPARE_MODELS rejects a non-conforming candidate at the static gate (engine loads it, kernel does not; NOT_COMPARED)', async () => {
    // The engine happily accepts a flow that ends outside the model boundary; only the kernel contract rejects it.
    const raw = structuredClone(baseRaw);
    el(raw, 'A Power Generation Depreciation').to = null;
    raw.name = `${raw.name} [CONFORMANCE QA broken candidate]`;
    const candidateFile = path.join(tmp, 'candidate-broken.json');
    writeJson(candidateFile, raw);
    const origLog = console.log, origErr = console.error; console.log = () => {}; console.error = () => {};
    let cmp;
    try {
      cmp = await compareModels({ acceptedFile: modelFile, candidateFile, validationFile, modes: new Set([0]), outDir: ensureDir(path.join(tmp, 'compare-broken')) });
    } finally { console.log = origLog; console.error = origErr; }
    return cmp.result === 'NOT_COMPARED' && cmp.static.candidate.status === 'FAIL' && cmp.static.accepted.status === 'PASS'
      && cmp.static.candidate.errors.some(e => e.includes('kernel A Power'))
      && cmp.static.candidate.conformance?.status === 'FAIL' && cmp.scenarios.length === 0;
  });

  // ---- runtime half: simulate Mode 0 once for the accepted model and once for a broken identity
  const plugin = findKernelPlugin(baseValidation);
  const mode0 = listScenarios(baseRaw, baseValidation.mode_variable || 'Timed Test Mode').find(s => s.mode === 0);
  if (!mode0) throw new Error('Mode 0 scenario not found');

  function runtimeChecks(raw) {
    const model = loadModelJSON(modelJsonForScenario(raw, mode0));
    const errs = model.check();
    if (errs.length) throw new Error(errs.map(e => e.message || e).join('; '));
    const results = model.simulate();
    const ctx = seriesContext(model, results);
    return checkPlugin(plugin, ctx);
  }

  await expect('runtime kernel identities pass on accepted Mode 0 for all seven instances', () => {
    const checks = runtimeChecks(baseRaw);
    const fails = checks.filter(c => c.status === 'FAIL');
    if (fails.length || checks.length < 7 * 7) throw new Error(`${checks.length} checks; failures: ${fails.map(f => `${f.name}: ${f.message}`).join('; ')}`);
    return `${checks.length} checks`;
  });

  await expect('runtime Inactive identity violation is caught (A Refinery Inactive Capacity formula shifted by +1)', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'A Refinery Inactive Capacity');
    e.behavior.value = `(${e.behavior.value}) + 1`;
    const checks = runtimeChecks(raw);
    const target = checks.find(c => c.name === 'A Refinery: Inactive identity');
    const others = checks.filter(c => c.status === 'FAIL' && c.name !== 'A Refinery: Inactive identity');
    return target?.status === 'FAIL' && others.length === 0 ? target.message : `target=${target?.status}; other failures=${others.map(o => o.name).join(', ')}`;
  });

  await expect('runtime check with a missing mapped column reports FAIL instead of crashing', () => {
    const p2 = structuredClone(plugin);
    p2.instances = [{ name: 'Ghost', roles: { installed: 'Nope Installed', active: 'Nope Active', inactive: 'Nope Inactive' } }];
    const model = loadModelJSON(modelJsonForScenario(baseRaw, mode0));
    const results = model.simulate();
    const checks = checkPlugin(p2, seriesContext(model, results));
    const mustFail = ['Ghost: Active <= Installed', 'Ghost: Inactive identity', 'Ghost: Target Active <= Installed', 'Ghost: kernel stocks >= 0'];
    return mustFail.every(n => checks.find(c => c.name === n)?.status === 'FAIL');
  });
} catch (e) {
  console.error('[FAIL] conformance QA crashed:', e.message || e);
  failed++;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\nCONFORMANCE QA RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed} passed, ${failed} failed)`);
process.exitCode = failed === 0 ? 0 : 2;
