import fs from 'node:fs';
import path from 'node:path';
import { readJson, sha256File, nowIso, writeJson, ensureDir } from './util.js';
import { runLifecycleConformance, printConformance, KERNEL_ROLES, KERNEL_FLOWS } from './lifecycle_conformance.js';

function esc(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' '); }

export function writeConformanceReports(outDir, report) {
  ensureDir(outDir);
  writeJson(path.join(outDir, 'lifecycle-conformance.json'), report);
  const l = [];
  l.push('# Orbital Economy Lab — Capital Lifecycle Kernel conformance');
  l.push('');
  l.push(`- generated: ${report.generated}`);
  l.push(`- model: ${esc(report.model.name || report.model.file)}`);
  l.push(`- model SHA-256: \`${report.model.sha256}\``);
  l.push(`- validation: ${esc(report.validation.name || report.validation.file)}`);
  l.push(`- validation SHA-256: \`${report.validation.sha256}\``);
  l.push(`- kernel format: ${report.format}`);
  l.push(`- status: **${report.status}**`);
  l.push('');
  if (report.status === 'SKIPPED') {
    l.push(`- ${esc(report.message)}`);
    fs.writeFileSync(path.join(outDir, 'lifecycle-conformance.md'), l.join('\n'), 'utf8');
    return;
  }
  if (report.specErrors?.length) {
    l.push('## Kernel spec errors');
    l.push('');
    for (const e of report.specErrors) l.push(`- ${esc(e)}`);
    fs.writeFileSync(path.join(outDir, 'lifecycle-conformance.md'), l.join('\n'), 'utf8');
    return;
  }
  l.push('## Summary');
  l.push('');
  l.push(`- instances: ${report.summary.instances}`);
  l.push(`- CONFORMING: ${report.summary.conforming}`);
  l.push(`- CONFORMING_WITH_VARIATION: ${report.summary.conformingWithVariation}`);
  l.push(`- NON_CONFORMING: ${report.summary.nonConforming}`);
  l.push(`- kernel roles per instance: ${report.kernel.requiredRoles} required + ${report.kernel.roles - report.kernel.requiredRoles} optional; flows: ${report.kernel.flows}; stocks: ${report.kernel.stocks}`);
  l.push(`- legacy lifecycle switch: \`${esc(report.legacySwitch)}\``);
  l.push('');
  l.push('## Model-wide reference integrity');
  l.push('');
  for (const c of report.modelWide) l.push(`- **${c.status}** ${esc(c.name)}${c.message ? ` — ${esc(c.message)}` : ''}`);
  l.push('');
  l.push('## Instances');
  l.push('');
  l.push('| Instance | Sector | Classification | Checks passed | Failures |');
  l.push('|---|---|---|---:|---:|');
  for (const i of report.instances) l.push(`| ${esc(i.name)} | ${esc(i.sector || '-')} | **${i.classification}** | ${i.checks.length - i.failures.length}/${i.checks.length} | ${i.failures.length} |`);
  l.push('');
  for (const i of report.instances) {
    l.push(`### ${esc(i.name)} — ${i.classification}`);
    l.push('');
    if (i.failures.length) {
      l.push('Failures:');
      for (const f of i.failures) l.push(`- ${esc(f)}`);
      l.push('');
    }
    if (i.variations.length) {
      l.push('Sector-specific variation (informative, not a failure):');
      for (const v of i.variations) l.push(`- ${esc(v)}`);
      l.push('');
    }
    l.push('| Kernel role | Kind | Primitive |');
    l.push('|---|---|---|');
    for (const c of i.checks) if (c.name.startsWith('role ') && c.status === 'PASS') l.push(`| ${esc(c.name.slice(5))} | ${esc(c.type)} | ${esc(c.primitive)} |`);
    l.push('');
  }
  l.push('## Kernel contract (reference)');
  l.push('');
  l.push('Flows and their fixed topology (∅ = outside the model boundary):');
  l.push('');
  for (const f of KERNEL_FLOWS) { const s = KERNEL_ROLES[f]; l.push(`- \`${f}\`: ${s.from ?? '∅'} → ${s.to ?? '∅'}; must reference ${s.deps.join(', ')}`); }
  l.push('');
  l.push('Derived variables and required dependencies:');
  l.push('');
  for (const [r, s] of Object.entries(KERNEL_ROLES)) if (s.kind === 'VARIABLE' && s.deps) l.push(`- \`${r}\` ← ${s.deps.join(', ')}`);
  l.push('');
  l.push('Sector policy inputs (must exist; their formulas are sector policy, not kernel): `required_active`, `desired_installed`, `strategic_reserve_target`; optional `finance_limited_construction`.');
  l.push('');
  fs.writeFileSync(path.join(outDir, 'lifecycle-conformance.md'), l.join('\n'), 'utf8');
}

export function runConformanceCommand({ modelFile, validationFile, outDir }) {
  const raw = readJson(modelFile);
  const validation = readJson(validationFile);
  console.log('Orbital Economy Lab - Capital Lifecycle Kernel conformance (static)');
  console.log(`Model:      ${raw.name || path.basename(modelFile)}`);
  console.log(`  SHA-256:  ${sha256File(modelFile)}`);
  console.log(`Validation: ${validation.name || path.basename(validationFile)}`);
  console.log('');
  const result = runLifecycleConformance(raw, validation);
  printConformance(result);
  const report = {
    generated: nowIso(),
    model: { file: path.resolve(modelFile), name: raw.name || null, sha256: sha256File(modelFile) },
    validation: { file: path.resolve(validationFile), name: validation.name || null, sha256: sha256File(validationFile) },
    ...result
  };
  writeConformanceReports(outDir, report);
  console.log('');
  console.log('============================================================');
  console.log(`CONFORMANCE RESULT: ${report.status}`);
  if (report.summary) console.log(`Instances: ${report.summary.instances}; conforming=${report.summary.conforming}; with-variation=${report.summary.conformingWithVariation}; non-conforming=${report.summary.nonConforming}`);
  console.log(`Report: ${path.join(outDir, 'lifecycle-conformance.md')}`);
  console.log('============================================================');
  return report;
}
