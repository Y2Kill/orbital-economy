import fs from 'node:fs';
import path from 'node:path';
import { readJson, sha256File, nowIso, writeJson, ensureDir } from './util.js';
import { runStructureAudits, printStructureAudits } from './structure_audit.js';
import { auditAlgebraicLoops } from './loop_audit.js';

function esc(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' '); }

export function writeAuditReports(outDir, report) {
  ensureDir(outDir);
  writeJson(path.join(outDir, 'structure-audit.json'), report);
  const l = [];
  l.push('# Orbital Economy Lab — structure audit');
  l.push('');
  l.push(`- generated: ${report.generated}`);
  l.push(`- model: ${esc(report.model.name || report.model.file)}`);
  l.push(`- model SHA-256: \`${report.model.sha256}\``);
  l.push(`- validation: ${esc(report.validation.name || report.validation.file)}`);
  l.push(`- validation SHA-256: \`${report.validation.sha256}\``);
  l.push(`- status: **${report.status}**`);
  l.push('');
  if (report.status === 'SKIPPED') {
    l.push(`- ${esc(report.message)}`);
    l.push('');
  }

  const ob = report.openBoundaries;
  l.push('## Open boundaries (declared physical-boundary meter)');
  l.push('');
  if (!ob) l.push('- not configured');
  else if (ob.specErrors?.length) for (const e of ob.specErrors) l.push(`- FAIL spec: ${esc(e)}`);
  else {
    l.push(`- flows total: ${ob.summary.flowsTotal}; crossing the model boundary: ${ob.summary.openFlows}; classified: ${ob.summary.classified}; unclassified: ${ob.summary.unclassified}`);
    l.push(`- closed-world violations: **${ob.summary.closedWorldViolations}** (mode: \`${ob.mode}\`) — zero means the currently declared closed-world boundary contract is satisfied; it is not a Planet v1 completeness claim`);
    l.push(`- declared transformation pairs: ${ob.summary.pairs ?? 0}; transformation flows without a pair: ${ob.summary.unpaired ?? 0}`);
    l.push('');
    l.push('| Category | closed-world | Flows | Reason |');
    l.push('|---|:---:|---:|---|');
    for (const [id, c] of Object.entries(ob.byCategory)) l.push(`| ${esc(id)} | ${c.closed_world ? 'yes' : '**no**'} | ${c.count} | ${esc(c.reason || '')} |`);
    l.push('');
    for (const c of ob.checks) if (c.status !== 'PASS') l.push(`- **${c.status}** ${esc(c.name)} — ${esc(c.message)}`);
    if (ob.closedWorldViolations.length) {
      l.push('');
      l.push('Flows to close before the planet counts as self-contained:');
      for (const f of ob.closedWorldViolations) l.push(`- ${esc(f.name)} (${f.direction}: ${esc(f.from ?? '∅')} → ${esc(f.to ?? '∅')})`);
    }
    if (ob.pairs?.length) {
      l.push('');
      l.push('Declared unit-transformation pairs (source flow physically backed by sink flows; numeric identity is a runtime check):');
      l.push('');
      l.push('| Source (∅ → stock) | Sinks (stock → ∅) | Identity check | Status |');
      l.push('|---|---|---|---|');
      for (const p of ob.pairs) l.push(`| ${esc(p.source)} | ${p.sinks.map(esc).join(', ')} | ${esc(p.identity || '—')} | ${p.missing.length ? '**missing: ' + esc(p.missing.join(', ')) + '**' : 'ok'} |`);
    }
    if (ob.unpaired?.length) {
      l.push('');
      l.push('Transformation flows without a declared pair:');
      for (const f of ob.unpaired) l.push(`- ${esc(f.name)} (${f.direction})`);
    }
    if (ob.unclassified.length) {
      l.push('');
      l.push('Unclassified boundary flows (classify them in the open_boundaries plugin):');
      for (const f of ob.unclassified) l.push(`- ${esc(f.name)} (${f.direction}: ${esc(f.from ?? '∅')} → ${esc(f.to ?? '∅')})`);
    }
    l.push('');
    l.push('<details><summary>All boundary flows by category</summary>');
    l.push('');
    for (const [id, c] of Object.entries(ob.byCategory)) {
      l.push(`**${esc(id)}** (${c.count})`);
      l.push('');
      for (const n of c.flows) l.push(`- ${esc(n)}`);
      l.push('');
    }
    l.push('</details>');
  }
  l.push('');

  const cs = report.colonySymmetry;
  l.push('## Colony symmetry');
  l.push('');
  if (!cs) l.push('- not configured');
  else if (cs.specErrors?.length) for (const e of cs.specErrors) l.push(`- FAIL spec: ${esc(e)}`);
  else {
    l.push(`- tokens: ${cs.tokens.join(' ↔ ')}`);
    l.push(`- mirrored pairs checked: ${cs.summary.pairsChecked}; mirrored links checked: ${cs.summary.linksChecked}`);
    l.push(`- structural mismatches: **${cs.summary.mismatches}**; numeric parameter differences (allowed): ${cs.summary.parameterDifferences}; elements under exceptions: ${cs.summary.exceptions}`);
    if (cs.mismatches.length) {
      l.push('');
      l.push('| Kind | Element | Expected | Actual |');
      l.push('|---|---|---|---|');
      for (const m of cs.mismatches) l.push(`| ${m.kind} | ${esc(m.name)} | ${esc(m.expected ?? (m.a != null ? m.a : ''))} | ${esc(m.actual ?? (m.b != null ? m.b : ''))} |`);
    }
    if (cs.exceptionsApplied.length) {
      l.push('');
      l.push('<details><summary>Documented exceptions applied</summary>');
      l.push('');
      l.push('| Element | Reason |');
      l.push('|---|---|');
      for (const e of cs.exceptionsApplied) l.push(`| ${esc(e.name)} | ${esc(e.reason)} |`);
      l.push('');
      l.push('</details>');
    }
    if (cs.parameterDifferences.length) {
      l.push('');
      l.push('<details><summary>Numeric parameter differences between colonies (allowed)</summary>');
      l.push('');
      l.push('| Field | Element | Value | Mirror | Value |');
      l.push('|---|---|---|---|---|');
      const seen = new Set();
      for (const p of cs.parameterDifferences) {
        const key = [p.name, p.mirror].sort().join('|') + p.field;
        if (seen.has(key)) continue;
        seen.add(key);
        l.push(`| ${p.field} | ${esc(p.name)} | ${esc(p.a)} | ${esc(p.mirror)} | ${esc(p.b)} |`);
      }
      l.push('');
      l.push('</details>');
    }
  }
  l.push('');
  l.push('## Planet closure (per-process Planet v1 contract)');
  l.push('');
  const pc = report.planetClosure;
  if (!pc) l.push('- not configured');
  else {
    const c = pc.counters;
    l.push(`- status: **${pc.status}**; mode: \`${pc.mode}\``);
    l.push(`- processes: ${c.processes}; legacy: ${c.legacy}; expected source outputs: ${c.expected_process_outputs}; undeclared outputs: ${pc.undeclared.length}`);
    l.push(`- P2 capacity: kernel **${c.P2.kernel}** / exceptions **${c.P2.exceptions}** / undeclared **${c.P2.undeclared}**`);
    l.push(`- P3 energy: requests **${c.P3.requests}** / producer **${c.P3.producer}** / exceptions **${c.P3.exceptions}** / undeclared **${c.P3.undeclared}**`);
    l.push(`- P4 deposits: with **${c.P4.with_deposit}** / without **${c.P4.without_deposit}**`);
    l.push(`- P5 labor: declared **${c.P5.declared}** / undeclared **${c.P5.undeclared}**`);
    l.push(`- P6 demand drivers: **${c.P6.drivers}**`);
    l.push(`- reversibility violations: **${pc.reversibility.length}**`);
    if (pc.exceptions.length) {
      l.push('');
      l.push('| Dimension | Process | Kind | Value | Reason |');
      l.push('|---|---|---|---|---|');
      for (const e of pc.exceptions) l.push(`| ${esc(e.dimension)} | ${esc(e.instance)} | ${esc(e.kind)} | ${esc(e.value || '—')} | ${esc(e.reason)} |`);
    }
    if (pc.undeclared.length) {
      l.push('');
      l.push('Undeclared process outputs:');
      for (const e of pc.undeclared) l.push(`- ${esc(e.output)}`);
    }
    if (pc.reversibility.length) {
      l.push('');
      l.push('Reversibility violations:');
      for (const e of pc.reversibility) l.push(`- ${esc(e.instance)}: constant ${esc(e.parameter)} is also read by ${esc(e.reader)}`);
    }
    if (pc.errors.length || pc.modeFailures.length) {
      l.push('');
      for (const e of pc.errors) l.push(`- **FAIL** ${esc(e.instance || 'declaration')} — ${esc(e.message)}`);
      for (const e of pc.modeFailures) l.push(`- **FAIL mode** ${esc(e.dimension)} — ${esc(e.message)} (${e.count})`);
    }
    l.push('');
    l.push('<details><summary>Process paths</summary>');
    l.push('');
    for (const p of pc.processes) {
      const entries = Object.entries(p.paths || {});
      if (!entries.length) continue;
      l.push(`**${esc(p.instance)}**`);
      for (const [kind, value] of entries) {
        if (Array.isArray(value)) l.push(`- ${esc(kind)}: ${value.map(esc).join(' → ')}`);
        else if (value?.element) {
          l.push(`- ${esc(kind)}: shared ${esc(value.element)}`);
          if (value.request) l.push(`  - request: ${value.request.map(esc).join(' → ')}`);
          if (value.output) l.push(`  - output: ${value.output.map(esc).join(' → ')}`);
        }
      }
      l.push('');
    }
    l.push('</details>');
  }
  l.push('');

  l.push('## Algebraic loops (switch-aware, unconditional static audit)');
  l.push('');
  const al = report.algebraicLoops;
  if (!al) l.push('- not available');
  else {
    l.push(`- status: **${al.status}**`);
    l.push(`- switches: ${al.switches.length} — ${al.switches.map(esc).join(', ') || 'none'}`);
    l.push(`- combinations: ${al.combinations}; with loops: **${al.combinationsWithLoops}**`);
    l.push(`- Modes with loops: ${al.modesWithLoops.join(', ') || 'none'}`);
    for (const e of al.errors || []) l.push(`- **FAIL parser** ${esc(e.element)} — ${esc(e.message)}`);
    if (al.loops?.length) {
      l.push('');
      l.push('| SCC size | Combinations | Example enabled switches | Shortest cycle |');
      l.push('|---:|---:|---|---|');
      for (const x of al.loops) l.push(`| ${x.size} | ${x.combinations} | ${esc(x.example.join(', ') || 'none')} | ${esc(x.shortestCycle.join(' → '))} |`);
      l.push('');
      l.push('<details><summary>Loop component members</summary>');
      l.push('');
      for (const [i, x] of al.loops.entries()) l.push(`- #${i + 1} (${x.size}): ${x.members.map(esc).join(', ')}`);
      l.push('');
      l.push('</details>');
    }
  }
  l.push('');
  fs.writeFileSync(path.join(outDir, 'structure-audit.md'), l.join('\n'), 'utf8');
}

export function runAuditCommand({ modelFile, validationFile, outDir, planetClosureFile = null }) {
  const raw = readJson(modelFile);
  const validation = readJson(validationFile);
  let planetClosureOverride = null;
  if (planetClosureFile) {
    planetClosureOverride = readJson(planetClosureFile);
    if (planetClosureOverride?.type !== 'planet_closure') throw new Error('--planet-closure file must contain a planet_closure declaration');
    validation.plugins = Array.isArray(validation.plugins) ? [...validation.plugins] : [];
    const at = validation.plugins.findIndex(p => p?.type === 'planet_closure');
    if (at >= 0) validation.plugins[at] = planetClosureOverride;
    else validation.plugins.push(planetClosureOverride);
  }
  console.log('Orbital Economy Lab - structure audit (static)');
  console.log(`Model:      ${raw.name || path.basename(modelFile)}`);
  console.log(`  SHA-256:  ${sha256File(modelFile)}`);
  console.log(`Validation: ${validation.name || path.basename(validationFile)}`);
  if (planetClosureFile) console.log(`Planet decl: ${path.resolve(planetClosureFile)}`);
  console.log('');
  const result = runStructureAudits(raw, validation);
  printStructureAudits(result);
  const report = {
    generated: nowIso(),
    model: { file: path.resolve(modelFile), name: raw.name || null, sha256: sha256File(modelFile) },
    validation: { file: path.resolve(validationFile), name: validation.name || null, sha256: sha256File(validationFile) },
    planetClosureOverride: planetClosureFile ? { file: path.resolve(planetClosureFile), sha256: sha256File(planetClosureFile) } : null,
    ...result
  };
  writeAuditReports(outDir, report);
  console.log('');
  console.log('============================================================');
  console.log(`STRUCTURE AUDIT RESULT: ${report.status}`);
  if (report.openBoundaries?.summary) console.log(`Open boundaries: ${report.openBoundaries.summary.openFlows}; unclassified=${report.openBoundaries.summary.unclassified}; closed-world violations=${report.openBoundaries.summary.closedWorldViolations}`);
  if (report.colonySymmetry?.summary) console.log(`Colony symmetry: mismatches=${report.colonySymmetry.summary.mismatches}; parameter differences=${report.colonySymmetry.summary.parameterDifferences}; exceptions=${report.colonySymmetry.summary.exceptions}`);
  if (report.planetClosure) {
    const c = report.planetClosure.counters;
    console.log(`Planet closure: mode=${report.planetClosure.mode}; processes=${c.processes}; legacy=${c.legacy}; P2=${c.P2.kernel}/${c.P2.exceptions}/${c.P2.undeclared}; P3=${c.P3.requests}/${c.P3.producer}/${c.P3.exceptions}/${c.P3.undeclared}; P4=${c.P4.with_deposit}/${c.P4.without_deposit}; P5=${c.P5.declared}/${c.P5.undeclared}; P6=${c.P6.drivers}; reversibility=${report.planetClosure.reversibility.length}`);
  }
  if (report.algebraicLoops) console.log(`Algebraic loops: switches=${report.algebraicLoops.switches.length}; combinations=${report.algebraicLoops.combinations}; with loops=${report.algebraicLoops.combinationsWithLoops}; Modes=${report.algebraicLoops.modesWithLoops.join(',') || 'none'}`);
  console.log(`Report: ${path.join(outDir, 'structure-audit.md')}`);
  console.log('============================================================');
  return report;
}


function writeLoopReports(outDir, report) {
  ensureDir(outDir);
  writeJson(path.join(outDir, 'algebraic-loops.json'), report);
  const l = [];
  l.push('# Orbital Economy Lab — algebraic loop audit');
  l.push('');
  l.push(`- generated: ${report.generated}`);
  l.push(`- model: ${esc(report.model.name || report.model.file)}`);
  l.push(`- model SHA-256: \`${report.model.sha256}\``);
  l.push(`- status: **${report.status}**`);
  l.push(`- switches: ${report.switches.length} — ${report.switches.map(esc).join(', ') || 'none'}`);
  l.push(`- combinations: ${report.combinations}; with loops: **${report.combinationsWithLoops}**`);
  l.push(`- Modes with loops: ${report.modesWithLoops.join(', ') || 'none'}`);
  for (const e of report.errors || []) l.push(`- **FAIL parser** ${esc(e.element)} — ${esc(e.message)}`);
  if (report.loops?.length) {
    l.push('');
    l.push('| SCC size | Combinations | Example enabled switches | Shortest cycle |');
    l.push('|---:|---:|---|---|');
    for (const x of report.loops) l.push(`| ${x.size} | ${x.combinations} | ${esc(x.example.join(', ') || 'none')} | ${esc(x.shortestCycle.join(' → '))} |`);
  }
  l.push('');
  fs.writeFileSync(path.join(outDir, 'algebraic-loops.md'), l.join('\n'), 'utf8');
}

export function runLoopsCommand({ modelFile, outDir }) {
  const raw = readJson(modelFile);
  const started = process.hrtime.bigint();
  const result = auditAlgebraicLoops(raw);
  const runtimeSeconds = Number(process.hrtime.bigint() - started) / 1e9;
  const report = {
    generated: nowIso(),
    model: { file: path.resolve(modelFile), name: raw.name || null, sha256: sha256File(modelFile) },
    runtimeSeconds,
    ...result
  };

  console.log('Orbital Economy Lab - algebraic loop audit (static)');
  console.log(`Model:       ${raw.name || path.basename(modelFile)}`);
  console.log(`  SHA-256:   ${report.model.sha256}`);
  console.log(`Switches:    ${report.switches.length} — ${report.switches.join(', ') || 'none'}`);
  console.log(`Combinations:${report.combinations}; with loops=${report.combinationsWithLoops}`);
  console.log(`Modes:       ${report.modesWithLoops.join(',') || 'none'}`);
  for (const e of report.errors || []) console.log(`  [FAIL] parser ${e.element}: ${e.message}`);
  for (const x of report.loops || []) {
    console.log(`  [FAIL] size=${x.size}; combinations=${x.combinations}; example=[${x.example.join(', ')}]`);
    console.log(`         shortest cycle: ${x.shortestCycle.join(' -> ')}`);
  }
  console.log(`Runtime:     ${runtimeSeconds.toFixed(3)} s`);
  writeLoopReports(outDir, report);
  console.log(`Report:      ${path.join(outDir, 'algebraic-loops.md')}`);
  return report;
}
