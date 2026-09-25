#!/usr/bin/env node
// QA for the static structure audits (open_boundaries, colony_symmetry).
// Negative cases mutate a COPY of the real accepted model.
import { discoverSingleJson } from './workspace.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runStructureAudits, auditOpenBoundaries, auditColonySymmetry } from './structure_audit.js';
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
const obPlugin = () => structuredClone(baseValidation.plugins.find(p => p.type === 'open_boundaries'));
const csPlugin = () => structuredClone(baseValidation.plugins.find(p => p.type === 'colony_symmetry'));

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

console.log('Orbital Economy Lab structure-audit QA');
console.log('open_boundaries + colony_symmetry on mutated copies of the accepted model.');
console.log('Production input/output is not modified.\n');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbital-economy-structure-qa-'));
try {
  // ---------------- open_boundaries
  await expect('accepted baseline: all boundary flows classified and declared external-capital violations are zero', () => {
    const r = auditOpenBoundaries(baseRaw, obPlugin());
    const ok = r.status === 'PASS' && r.summary.openFlows > 0 && r.summary.unclassified === 0 && r.summary.closedWorldViolations === 0
      && r.checks.find(c => c.name === 'closed-world criterion')?.status === 'PASS';
    if (!ok) throw new Error(JSON.stringify(r.summary));
    return `${r.summary.openFlows} open, ${r.summary.closedWorldViolations} violations`;
  });

  await expect('new unclassified boundary flow is FAIL in classify mode', () => {
    const raw = structuredClone(baseRaw);
    raw.elements.push({ type: 'FLOW', name: 'A Mystery Inflow', from: null, to: 'A Metal Inventory', behavior: { value: '0' } });
    const r = auditOpenBoundaries(raw, obPlugin());
    return r.status === 'FAIL' && r.unclassified.length === 1 && r.unclassified[0].name === 'A Mystery Inflow';
  });

  await expect('same flow is only WARN in report mode', () => {
    const raw = structuredClone(baseRaw);
    raw.elements.push({ type: 'FLOW', name: 'A Mystery Inflow', from: null, to: 'A Metal Inventory', behavior: { value: '0' } });
    const p = obPlugin(); p.enforce = 'report';
    const r = auditOpenBoundaries(raw, p);
    return r.status === 'PASS' && r.checks.find(c => c.name === 'open boundaries classified')?.status === 'WARN';
  });

  await expect('closed_world mode passes the accepted v7.5.1 expansion-boundary contract', () => {
    const p = obPlugin(); p.enforce = 'closed_world';
    const r = auditOpenBoundaries(baseRaw, p);
    return r.status === 'PASS' && r.checks.find(c => c.name === 'closed-world criterion')?.status === 'PASS';
  });

  await expect('adding a new unbacked external Expansion raises the meter 0 -> 1', () => {
    const raw = structuredClone(baseRaw);
    raw.elements.push({ type: 'FLOW', name: 'QA Expansion', from: null, to: 'Transport Installed Throughput Capacity', behavior: { value: '0' } });
    const r = auditOpenBoundaries(raw, obPlugin());
    return r.summary.closedWorldViolations === 1 && r.closedWorldViolations.some(f => f.name === 'QA Expansion');
  });

  await expect('direction-restricted category does not classify the opposite direction', () => {
    const raw = structuredClone(baseRaw);
    raw.elements.push({ type: 'FLOW', name: 'A Mining', from: 'A Ore Inventory', to: null, behavior: { value: '0' } }); // a "Mining" sink
    const r = auditOpenBoundaries(raw, obPlugin());
    return r.unclassified.some(f => f.name === 'A Mining' && f.direction === 'sink');
  });

  await expect('open_boundaries spec without closed_world flag is rejected', () => {
    const p = obPlugin(); delete p.categories[0].closed_world;
    const r = auditOpenBoundaries(baseRaw, p);
    return r.status === 'FAIL' && r.specErrors.some(e => e.includes('closed_world'));
  });

  await expect('transformation pairs: declared pair passes; unpaired requires_pair flow fails; missing flow in pair fails', () => {
    const p = obPlugin();
    const ut = p.categories.find(c => c.id === 'unit_transformation'); ut.requires_pair = true;
    // the declared pairs of the accepted validation are the fixture: the audit must accept them as they stand
    const ok = auditOpenBoundaries(baseRaw, p);
    const p2 = structuredClone(p); const dropped = p2.transformation_pairs.pop();   // its flows are now undeclared
    const bad = auditOpenBoundaries(baseRaw, p2);
    const expectedUnpaired = [dropped.source, ...dropped.sinks].sort().join(',');
    const p3 = structuredClone(p); p3.transformation_pairs[0].sinks = [...p3.transformation_pairs[0].sinks, 'Nope Flow'];
    const missing = auditOpenBoundaries(baseRaw, p3);
    const good = ok.status === 'PASS' && ok.summary.pairs === p.transformation_pairs.length && ok.summary.unpaired === 0
      && bad.status === 'FAIL' && bad.unpaired.map(f => f.name).sort().join(',') === expectedUnpaired
      && missing.status === 'FAIL' && missing.checks.some(c => c.name === 'transformation pairs reference existing flows' && c.status === 'FAIL');
    if (!good) throw new Error(JSON.stringify([ok.status, ok.summary, bad.status, bad.unpaired.map(f => f.name), missing.status]));
    return `pairs=${ok.summary.pairs}, dropping one leaves ${bad.summary.unpaired} unpaired`;
  });

  // ---------------- colony_symmetry
  await expect('accepted: colony symmetry has 0 structural mismatches with documented exceptions', () => {
    const r = auditColonySymmetry(baseRaw, csPlugin());
    const ok = r.status === 'PASS' && r.summary.mismatches === 0 && r.summary.pairsChecked > 600 && r.summary.parameterDifferences > 0;
    if (!ok) throw new Error(JSON.stringify(r.summary));
    return `pairs=${r.summary.pairsChecked}, links=${r.summary.linksChecked}, params=${r.summary.parameterDifferences}, exceptions=${r.summary.exceptions}`;
  });

  await expect('an exception hides a documented asymmetry; removing it surfaces the mismatch (not hidden)', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'B Ore Price'); e.behavior.value = `(${e.behavior.value}) * 1.05`;
    const p = csPlugin(); p.exceptions = [{ name: '? Ore Price', reason: 'QA: deliberately one-sided formula' }];
    const hidden = auditColonySymmetry(raw, p);
    const p2 = csPlugin(); p2.exceptions = [];
    const shown = auditColonySymmetry(raw, p2);
    return hidden.status === 'PASS' && hidden.summary.exceptions === 2 && shown.status === 'FAIL' && shown.mismatches.some(m => m.kind === 'formula' && /Ore Price$/.test(m.name));
  });

  await expect('structural formula change on one side is a mismatch (B Ore Price formula altered)', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'B Ore Price');
    e.behavior.value = `(${e.behavior.value}) * 1.05`;
    const r = auditColonySymmetry(raw, csPlugin());
    return r.status === 'FAIL' && r.mismatches.some(m => m.kind === 'formula' && (m.name === 'A Ore Price' || m.name === 'B Ore Price'));
  });

  await expect('numeric parameter change on one side is NOT a mismatch (B Refinery Installed Capacity 28 -> 30)', () => {
    const raw = structuredClone(baseRaw);
    el(raw, 'B Refinery Installed Capacity').behavior.initial_value = '30';
    const r = auditColonySymmetry(raw, csPlugin());
    return r.status === 'PASS' && r.parameterDifferences.some(p => p.name === 'B Refinery Installed Capacity' || p.mirror === 'B Refinery Installed Capacity');
  });

  await expect('missing mirrored element is a mismatch (B Wage removed)', () => {
    const raw = structuredClone(baseRaw);
    raw.elements = raw.elements.filter(x => !(x.type !== 'LINK' && x.name === 'B Wage'));
    const r = auditColonySymmetry(raw, csPlugin());
    return r.status === 'FAIL' && r.mismatches.some(m => m.kind === 'missing_mirror' && m.name === 'A Wage' && m.expected === 'B Wage');
  });

  await expect('mirrored flow endpoints must match (B Refinery Depreciation retargeted)', () => {
    const raw = structuredClone(baseRaw);
    el(raw, 'B Refinery Depreciation').to = null;
    const r = auditColonySymmetry(raw, csPlugin());
    return r.status === 'FAIL' && r.mismatches.some(m => m.kind === 'endpoints' && m.name === 'A Refinery Depreciation');
  });

  await expect('missing mirrored LINK is a mismatch', () => {
    const raw = structuredClone(baseRaw);
    const idx = raw.elements.findIndex(x => x.type === 'LINK' && x.from === 'B Ore Price' && x.to === 'B Metal Unit Cost');
    if (idx < 0) throw new Error('fixture LINK B Ore Price -> B Metal Unit Cost not found');
    raw.elements.splice(idx, 1);
    const p = csPlugin(); p.exceptions = p.exceptions.filter(e => e.name !== '? Metal Unit Cost'); // do not hide the target element
    const r = auditColonySymmetry(raw, p);
    return r.mismatches.some(m => m.kind === 'link' && m.name === 'A Ore Price -> A Metal Unit Cost');
  });

  await expect('type change on one side is a mismatch (B Ore Inventory turned into VARIABLE)', () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'B Ore Inventory'); e.type = 'VARIABLE'; e.behavior = { value: '0' };
    const r = auditColonySymmetry(raw, csPlugin());
    return r.mismatches.some(m => m.kind === 'type' && m.name === 'A Ore Inventory');
  });

  await expect('exception without a reason is rejected by the spec check', () => {
    const p = csPlugin(); p.exceptions.push({ name: 'A Wage' });
    const r = auditColonySymmetry(baseRaw, p);
    return r.status === 'FAIL' && r.specErrors.some(e => e.includes('reason is required'));
  });

  await expect('enforce:false downgrades mismatches to WARN', () => {
    const raw = structuredClone(baseRaw);
    raw.elements = raw.elements.filter(x => !(x.type !== 'LINK' && x.name === 'B Wage'));
    const p = csPlugin(); p.enforce = false;
    const r = auditColonySymmetry(raw, p);
    return r.status === 'PASS' && r.checks[0].status === 'WARN';
  });

  // ---------------- integration
  await expect('runStructureAudits combines both and is SKIPPED without plugins', () => {
    const v = structuredClone(baseValidation);
    const full = runStructureAudits(baseRaw, v);
    v.plugins = v.plugins.filter(p => p.type !== 'open_boundaries' && p.type !== 'colony_symmetry');
    const none = runStructureAudits(baseRaw, v);
    return full.status === 'PASS' && full.openBoundaries && full.colonySymmetry && none.status === 'SKIPPED';
  });

  await expect('static-only plugins produce no runtime check entries (no "unknown plugin" WARN)', async () => {
    const { checkPlugin } = await import('./checks.js');
    const fakeCtx = { times: [0], get() { throw new Error('must not be called'); }, has() { return false; } };
    return checkPlugin(obPlugin(), fakeCtx).length === 0 && checkPlugin(csPlugin(), fakeCtx).length === 0;
  });

  await expect('COMPARE_MODELS rejects an asymmetric candidate at the static gate (NOT_COMPARED, no simulation)', async () => {
    const raw = structuredClone(baseRaw);
    const e = el(raw, 'B Ore Price'); e.behavior.value = `(${e.behavior.value}) * 1.05`;
    raw.name = `${raw.name} [STRUCTURE QA asymmetric candidate]`;
    const candidateFile = path.join(tmp, 'candidate-asym.json');
    writeJson(candidateFile, raw);
    const ol = console.log, oe = console.error; console.log = () => {}; console.error = () => {};
    let cmp;
    try { cmp = await compareModels({ acceptedFile: modelFile, candidateFile, validationFile, modes: new Set([0]), outDir: ensureDir(path.join(tmp, 'cmp')) }); }
    finally { console.log = ol; console.error = oe; }
    return cmp.result === 'NOT_COMPARED' && cmp.static.candidate.status === 'FAIL' && cmp.static.accepted.status === 'PASS'
      && cmp.static.candidate.errors.some(x => x.includes('colony_symmetry')) && cmp.scenarios.length === 0
      && cmp.static.candidate.structure?.status === 'FAIL';
  });
} catch (e) {
  console.error('[FAIL] structure QA crashed:', e.message || e);
  failed++;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\nSTRUCTURE QA RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${passed} passed, ${failed} failed)`);
process.exitCode = failed === 0 ? 0 : 2;
