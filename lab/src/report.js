import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, fmtNum, writeJson } from './util.js';

function esc(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' '); }

export function summarizeStatus(items) {
  let fail = 0, warn = 0;
  for (const x of items) {
    if (!x || x.status === 'SKIPPED') continue;
    if (x.status === 'FAIL') fail++;
    else if (x.status === 'WARN') warn++;
  }
  return fail ? 'FAIL' : warn ? 'WARN' : 'PASS';
}

export function writeReports(outDir, report) {
  ensureDir(outDir);
  writeJson(path.join(outDir, 'report.json'), report);
  const lines = [];
  lines.push('# Orbital Economy Lab report');
  lines.push('');
  lines.push(`- generated: ${report.generated}`);
  lines.push(`- model: ${esc(report.model.name || report.model.file)}`);
  lines.push(`- model SHA-256: \`${report.model.sha256}\``);
  lines.push(`- engine: simulation ${report.engine.version}`);
  lines.push(`- overall: **${report.overall}**`);
  lines.push('');
  lines.push('## Static validation');
  lines.push('');
  lines.push(`- status: **${report.static.status}**`);
  for (const e of report.static.errors || []) lines.push(`- FAIL: ${esc(e)}`);
  lines.push('');

  lines.push('## Capital Lifecycle Kernel conformance (static)');
  lines.push('');
  const conf = report.conformance;
  if (!conf || conf.status === 'SKIPPED') {
    lines.push('- status: **SKIPPED** (validation has no capital_lifecycle_kernel plugin)');
  } else {
    lines.push(`- status: **${conf.status}**`);
    for (const e of conf.specErrors || []) lines.push(`- FAIL kernel spec: ${esc(e)}`);
    for (const c of conf.modelWide || []) lines.push(`- **${c.status}** ${esc(c.name)}${c.message ? ` — ${esc(c.message)}` : ''}`);
    if (conf.instances?.length) {
      lines.push('');
      lines.push('| Instance | Sector | Classification | Checks | Failures |');
      lines.push('|---|---|---|---:|---:|');
      for (const i of conf.instances) lines.push(`| ${esc(i.name)} | ${esc(i.sector || '-')} | **${i.classification}** | ${i.checks.length} | ${i.failures.length} |`);
      for (const i of conf.instances) {
        if (!i.failures.length && !i.variations.length) continue;
        lines.push('');
        lines.push(`- ${esc(i.name)}:`);
        for (const f of i.failures) lines.push(`  - FAIL ${esc(f)}`);
        for (const v of i.variations) lines.push(`  - variation: ${esc(v)}`);
      }
    }
  }
  lines.push('');

  lines.push('## Structure audits (static)');
  lines.push('');
  const st = report.structure;
  if (!st || st.status === 'SKIPPED') {
    lines.push('- status: **SKIPPED** (validation has no open_boundaries / colony_symmetry plugin)');
  } else {
    lines.push(`- status: **${st.status}**`);
    const ob = st.openBoundaries;
    if (ob) {
      if (ob.specErrors?.length) for (const e of ob.specErrors) lines.push(`- FAIL open_boundaries spec: ${esc(e)}`);
      else {
        lines.push(`- open boundaries: ${ob.summary.openFlows} of ${ob.summary.flowsTotal} flows cross the model boundary; unclassified: ${ob.summary.unclassified}; closed-world violations: **${ob.summary.closedWorldViolations}** (mode: ${ob.mode})`);
        lines.push('');
        lines.push('| Category | closed-world | Flows |');
        lines.push('|---|:---:|---:|');
        for (const [id, c] of Object.entries(ob.byCategory)) lines.push(`| ${esc(id)} | ${c.closed_world ? 'yes' : '**no**'} | ${c.count} |`);
        lines.push('');
        for (const c of ob.checks) if (c.status !== 'PASS') lines.push(`- **${c.status}** ${esc(c.name)} — ${esc(c.message)}`);
      }
    }
    const cs = st.colonySymmetry;
    if (cs) {
      if (cs.specErrors?.length) for (const e of cs.specErrors) lines.push(`- FAIL colony_symmetry spec: ${esc(e)}`);
      else {
        lines.push(`- colony symmetry (${cs.tokens.join('↔')}): pairs ${cs.summary.pairsChecked}, links ${cs.summary.linksChecked}, mismatches **${cs.summary.mismatches}**, parameter differences ${cs.summary.parameterDifferences}, exceptions ${cs.summary.exceptions}`);
        for (const m of cs.mismatches.slice(0, 30)) lines.push(`  - ${m.kind}: ${esc(m.name)}${m.expected ? ` — expected ${esc(m.expected)}` : ''}${m.actual ? `; actual ${esc(m.actual)}` : ''}`);
        if (cs.mismatches.length > 30) lines.push(`  - … ${cs.mismatches.length - 30} more (see report.json)`);
      }
    }
  }
  const al = st?.algebraicLoops;
  if (al) {
    lines.push('');
    lines.push('### Algebraic loops');
    lines.push('');
    lines.push(`- status: **${al.status}**`);
    lines.push(`- switches: ${al.switches.length}; combinations: ${al.combinations}; combinations with loops: **${al.combinationsWithLoops}**`);
    lines.push(`- Modes with loops: ${al.modesWithLoops.join(', ') || 'none'}`);
    for (const e of al.errors || []) lines.push(`- **FAIL parser** ${esc(e.element)} — ${esc(e.message)}`);
    for (const x of al.loops || []) {
      lines.push(`- **FAIL loop** size=${x.size}; combinations=${x.combinations}; example=[${esc(x.example.join(', ') || 'none')}]`);
      lines.push(`  - shortest cycle: ${esc(x.shortestCycle.join(' → '))}`);
    }
  }
  lines.push('');

  lines.push('## Web cross-check');
  lines.push('');
  if (!report.webReference || !report.webReference.present) {
    lines.push('- status: **SKIPPED**');
    lines.push('- no web CSV reference batch was supplied; local validation is independent of web exports.');
  } else {
    lines.push(`- preflight status: **${report.webReference.status}**`);
    if (report.webReference.manifest?.model?.name) lines.push(`- batch model: ${esc(report.webReference.manifest.model.name)}`);
    if (report.webReference.manifest?.model?.sha256) lines.push(`- batch model SHA-256: \`${report.webReference.manifest.model.sha256}\``);
    lines.push(`- detected Modes: ${(report.webReference.foundModes || []).join(', ') || 'none'}`);
    if (report.webReference.archivedTo) lines.push(`- archived to: ${esc(report.webReference.archivedTo)}`);
    for (const w of report.webReference.warnings || []) lines.push(`- WARN: ${esc(w)}`);
    for (const e of report.webReference.errors || []) lines.push(`- FAIL: ${esc(e)}`);
  }
  lines.push('');

  lines.push('## Scenario results');
  lines.push('');
  lines.push('| Mode | Scenario | Status | Runtime | Web cross-check | Max abs diff |');
  lines.push('|---:|---|:---:|---:|:---:|---:|');
  for (const s of report.scenarios) {
    lines.push(`| ${s.mode} | ${esc(s.name)} | **${s.status}** | ${fmtNum(s.runtimeSeconds)} s | ${s.webCrossCheck?.status || '-'} | ${s.webCrossCheck?.maxAbs != null ? fmtNum(s.webCrossCheck.maxAbs) : '-'} |`);
  }
  lines.push('');
  for (const s of report.scenarios) {
    lines.push(`### Mode ${s.mode} — ${esc(s.name)}`);
    lines.push('');
    for (const c of s.checks || []) {
      const suffix = c.message ? ` — ${esc(c.message)}` : '';
      lines.push(`- **${c.status}** ${esc(c.name)}${suffix}`);
    }
    if (s.webCrossCheck) {
      const r = s.webCrossCheck;
      lines.push(`- **${r.status}** web cross-check${r.message ? ` — ${esc(r.message)}` : ''}`);
      if (r.maxAbs != null) {
        lines.push(`  - rows: ${r.rowsCompared}; common data series: ${r.columnsCompared}; web series: ${r.webColumnCount}; local series: ${r.localSeriesCount}`);
        lines.push(`  - time axis exact: ${r.exactTime}; max time abs diff: ${fmtNum(r.maxTimeAbs)}`);
        lines.push(`  - max abs diff: ${fmtNum(r.maxAbs)}; max rel diff: ${fmtNum(r.maxRel)}`);
        if (r.maxAbsWhere) lines.push(`  - max abs: ${esc(r.maxAbsWhere.column)} @ day ${fmtNum(r.maxAbsWhere.time)}; local=${fmtNum(r.maxAbsWhere.actual)}, web=${fmtNum(r.maxAbsWhere.expected)}`);
        if (r.maxRelWhere) lines.push(`  - max rel: ${esc(r.maxRelWhere.column)} @ day ${fmtNum(r.maxRelWhere.time)}; local=${fmtNum(r.maxRelWhere.actual)}, web=${fmtNum(r.maxRelWhere.expected)}`);
        lines.push(`  - changed series: ${r.changedSeriesCount}; changed points: ${r.changedPoints}`);
        lines.push(`  - local-only series: ${r.localOnlyColumns?.length || 0}; web-only series: ${r.webOnlyColumns?.length || 0}`);
        if (r.webOnlyColumns?.length) lines.push(`  - web-only: ${r.webOnlyColumns.slice(0, 20).map(esc).join(', ')}`);
        if (r.changedSeries?.length) {
          lines.push('  - largest changed series:');
          for (const x of r.changedSeries.slice(0, 10)) lines.push(`    - ${esc(x.column)}: abs=${fmtNum(x.maxAbs)}, rel=${fmtNum(x.maxRel)}, day=${fmtNum(x.time)}`);
        }
      }
    }
    lines.push('');
  }
  fs.writeFileSync(path.join(outDir, 'report.md'), lines.join('\n'), 'utf8');
}
