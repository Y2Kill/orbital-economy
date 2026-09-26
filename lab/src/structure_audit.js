import { auditAlgebraicLoops } from './loop_audit.js';

// Static structure audits (pre-simulation), declared as validation plugins:
//
//   open_boundaries  — every FLOW whose `from` or `to` is null crosses the model boundary.
//                      Each such flow is classified by an ordered category list. Categories carry a
//                      `closed_world` flag: the "planet is self-contained" criterion is
//                      "no open flows outside closed_world categories". The audit is a progress meter
//                      toward that criterion and (in `classify` mode) a guard that every new boundary
//                      flow is consciously classified.
//
//   colony_symmetry  — the model is built from mirrored colony blocks (A/B). For every element whose
//                      name contains a colony token, the mirrored element must exist with the same
//                      type, mirrored formula and mirrored flow endpoints. Pure numeric parameters may
//                      differ (reported, not failed). Known asymmetries are listed as exceptions.
//
// Both audits are name/topology based. They never evaluate formulas.

function pass(name, details = {}) { return { status: 'PASS', name, ...details }; }
function fail(name, message, details = {}) { return { status: 'FAIL', name, message, ...details }; }
function warn(name, message, details = {}) { return { status: 'WARN', name, message, ...details }; }
function note(name, message, details = {}) { return { status: 'NOTE', name, message, ...details }; }

function arr(v) { return v == null ? [] : Array.isArray(v) ? v : [v]; }

function globRegex(pattern) {
  let out = '^';
  const special = new Set('\\^$.+?()[]{}|'.split(''));
  for (const ch of String(pattern)) {
    if (ch === '*') out += '.*';
    else if (ch === '?') out += '.';
    else out += special.has(ch) ? `\\${ch}` : ch;
  }
  return new RegExp(out + '$', 'i');
}

function globMatch(name, patterns) {
  return arr(patterns).some(p => globRegex(p).test(String(name ?? '')));
}

// ---------------------------------------------------------------- open_boundaries

export function validateOpenBoundariesSpec(plugin) {
  const errors = [];
  const mode = plugin.enforce ?? 'classify';
  if (!['report', 'classify', 'closed_world'].includes(mode)) errors.push(`open_boundaries.enforce must be report | classify | closed_world (got ${mode})`);
  const ids = new Set();
  for (const [i, c] of (plugin.categories || []).entries()) {
    const p = `categories[${i}]`;
    if (!c?.id) errors.push(`${p}.id is required`);
    else if (ids.has(c.id)) errors.push(`duplicate category id ${c.id}`);
    else ids.add(c.id);
    if (typeof c?.closed_world !== 'boolean') errors.push(`${p}.closed_world must be boolean`);
    if (!arr(c?.name).length) errors.push(`${p}.name (glob or list) is required`);
    if (c?.direction != null && !['source', 'sink'].includes(c.direction)) errors.push(`${p}.direction must be source | sink`);
    if (c?.requires_pair != null && typeof c.requires_pair !== 'boolean') errors.push(`${p}.requires_pair must be boolean`);
  }
  for (const [i, tp] of (plugin.transformation_pairs || []).entries()) {
    if (!tp?.source || typeof tp.source !== 'string') errors.push(`transformation_pairs[${i}].source (flow name) is required`);
    if (!Array.isArray(tp?.sinks) || !tp.sinks.length) errors.push(`transformation_pairs[${i}].sinks (non-empty list of flow names) is required`);
  }
  return errors;
}

export function auditOpenBoundaries(raw, plugin) {
  const specErrors = validateOpenBoundariesSpec(plugin);
  if (specErrors.length) return { type: 'open_boundaries', status: 'FAIL', specErrors, flows: [], byCategory: {}, unclassified: [], closedWorldViolations: [] };
  const mode = plugin.enforce ?? 'classify';
  const categories = plugin.categories || [];
  const flows = [];
  for (const el of raw?.elements || []) {
    if (el?.type !== 'FLOW') continue;
    const src = el.from == null, sink = el.to == null;
    if (!src && !sink) continue;
    const direction = src && sink ? 'both' : src ? 'source' : 'sink';
    let category = null;
    for (const c of categories) {
      if (c.direction && c.direction !== direction) continue;
      if (globMatch(el.name, c.name)) { category = c; break; }
    }
    flows.push({
      name: el.name, direction,
      from: el.from ?? null, to: el.to ?? null,
      category: category?.id ?? null,
      closedWorld: category ? category.closed_world === true : null
    });
  }
  // Declared unit-transformation pairs: a source flow (∅ -> stock) physically backed by sink flows (stock -> ∅).
  // Flows in a category with requires_pair must belong to a declared pair; the pair's numeric identity is a runtime check.
  const flowNames = new Set(flows.map(f => f.name));
  const paired = new Set();
  const pairs = (plugin.transformation_pairs || []).map(tp => {
    const missing = [tp.source, ...tp.sinks].filter(n => !flowNames.has(n));
    for (const n of [tp.source, ...tp.sinks]) paired.add(n);
    return { source: tp.source, sinks: tp.sinks, identity: tp.identity || null, missing };
  });
  const byCategory = {};
  for (const c of categories) byCategory[c.id] = { closed_world: c.closed_world, reason: c.reason || null, requires_pair: c.requires_pair === true, count: 0, flows: [] };
  const unclassified = [];
  const unpaired = [];
  const closedWorldViolations = [];
  for (const f of flows) {
    if (!f.category) { unclassified.push(f); continue; }
    byCategory[f.category].count++;
    byCategory[f.category].flows.push(f.name);
    if (f.closedWorld === false) closedWorldViolations.push(f);
    if (byCategory[f.category].requires_pair && !paired.has(f.name)) { unpaired.push(f); f.unpaired = true; }
  }
  const checks = [];
  const pairMissing = pairs.filter(p => p.missing.length);
  if (pairs.length) checks.push(pairMissing.length
    ? fail('transformation pairs reference existing flows', pairMissing.map(p => `${p.source}: missing ${p.missing.join(', ')}`).join('; '))
    : pass('transformation pairs reference existing flows', { pairs: pairs.length }));
  checks.push(unpaired.length
    ? (mode === 'report' ? warn : fail)('transformation flows are paired', `${unpaired.length} flow(s) in a requires_pair category without a declared pair: ${unpaired.slice(0, 8).map(f => f.name).join('; ')}`)
    : pass('transformation flows are paired', { unpaired: 0 }));
  checks.push(unclassified.length
    ? (mode === 'report' ? warn : fail)('open boundaries classified', `${unclassified.length} unclassified boundary flow(s): ${unclassified.slice(0, 8).map(f => f.name).join('; ')}${unclassified.length > 8 ? '; …' : ''}`)
    : pass('open boundaries classified', { openFlows: flows.length }));
  // Until the project switches enforce to `closed_world`, violations are a progress meter (NOTE), not a warning.
  checks.push(closedWorldViolations.length
    ? (mode === 'closed_world' ? fail : note)('closed-world criterion', `${closedWorldViolations.length} boundary flow(s) not allowed in a self-contained planet: ${closedWorldViolations.map(f => f.name).join('; ')}`)
    : pass('closed-world criterion', { violations: 0 }));
  const status = checks.some(c => c.status === 'FAIL') ? 'FAIL' : 'PASS';
  return {
    type: 'open_boundaries', status, mode,
    summary: { flowsTotal: (raw?.elements || []).filter(e => e?.type === 'FLOW').length, openFlows: flows.length, classified: flows.length - unclassified.length, unclassified: unclassified.length, closedWorldViolations: closedWorldViolations.length, pairs: pairs.length, unpaired: unpaired.length },
    checks, byCategory, unclassified, closedWorldViolations, pairs, unpaired, flows
  };
}

// ---------------------------------------------------------------- colony_symmetry

function tokenSwapper(tokens) {
  const [a, b] = tokens;
  const re = new RegExp(`\\b(${a}|${b})\\b`, 'g');
  return text => String(text ?? '').replace(re, t => (t === a ? b : a));
}

function normFormula(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

const REF_RE = /\[([^\]]+)\]/;

export function validateColonySymmetrySpec(plugin) {
  const errors = [];
  const tokens = plugin.tokens || ['A', 'B'];
  if (!Array.isArray(tokens) || tokens.length !== 2 || tokens.some(t => typeof t !== 'string' || !t.length)) errors.push('colony_symmetry.tokens must be two non-empty strings');
  for (const [i, e] of (plugin.exceptions || []).entries()) {
    if (!e?.name) errors.push(`exceptions[${i}].name (glob) is required`);
    if (!e?.reason) errors.push(`exceptions[${i}].reason is required — undocumented asymmetry is not accepted`);
  }
  return errors;
}

export function auditColonySymmetry(raw, plugin) {
  const specErrors = validateColonySymmetrySpec(plugin);
  if (specErrors.length) return { type: 'colony_symmetry', status: 'FAIL', specErrors, checks: [], mismatches: [], parameterDifferences: [], exceptionsApplied: [] };
  const tokens = plugin.tokens || ['A', 'B'];
  const mirror = tokenSwapper(tokens);
  const exceptions = plugin.exceptions || [];
  const enforce = plugin.enforce !== false;

  const byName = new Map();
  const links = new Set();
  for (const el of raw?.elements || []) {
    if (!el) continue;
    if (el.type === 'LINK') { links.add(`${el.from}|${el.to}`); continue; }
    if (el.name) byName.set(el.name, el);
  }

  const mismatches = [];          // hard: missing mirror, type, structural formula, endpoints, links
  const parameterDifferences = []; // soft: numeric constants that differ between colonies
  const exceptionsApplied = [];
  let pairsChecked = 0, linksChecked = 0;

  const exceptionFor = name => exceptions.find(e => globMatch(name, e.name)) || null;

  for (const [name, el] of byName) {
    const mname = mirror(name);
    if (mname === name) continue;               // no colony token in this name
    const ex = exceptionFor(name);
    if (ex) { exceptionsApplied.push({ name, reason: ex.reason }); continue; }
    pairsChecked++;
    const mel = byName.get(mname);
    if (!mel) { mismatches.push({ kind: 'missing_mirror', name, expected: mname }); continue; }
    if (mel.type !== el.type) { mismatches.push({ kind: 'type', name, mirror: mname, a: el.type, b: mel.type }); continue; }

    for (const field of ['value', 'initial_value']) {
      const av = el.behavior?.[field], bv = mel.behavior?.[field];
      if (av == null && bv == null) continue;
      const mirrored = normFormula(mirror(av));
      const actual = normFormula(bv);
      if (mirrored === actual) continue;
      const structural = REF_RE.test(String(av ?? '')) || REF_RE.test(String(bv ?? ''));
      if (structural) mismatches.push({ kind: 'formula', field, name, mirror: mname, expected: mirrored, actual });
      else parameterDifferences.push({ field, name, mirror: mname, a: av, b: bv });
    }

    if (el.type === 'FLOW') {
      const ef = el.from == null ? null : mirror(el.from), et = el.to == null ? null : mirror(el.to);
      const mf = mel.from ?? null, mt = mel.to ?? null;
      if (ef !== mf || et !== mt) mismatches.push({ kind: 'endpoints', name, mirror: mname, expected: `${ef ?? '∅'} -> ${et ?? '∅'}`, actual: `${mf ?? '∅'} -> ${mt ?? '∅'}` });
    }
  }

  for (const key of links) {
    const [from, to] = key.split('|');
    const mf = mirror(from), mt = mirror(to);
    if (mf === from && mt === to) continue;
    if (exceptionFor(from) || exceptionFor(to)) continue;
    linksChecked++;
    if (!links.has(`${mf}|${mt}`)) mismatches.push({ kind: 'link', name: `${from} -> ${to}`, expected: `${mf} -> ${mt}` });
  }

  const checks = [];
  checks.push(mismatches.length
    ? (enforce ? fail : warn)('colony symmetry', `${mismatches.length} asymmetry(ies): ${mismatches.slice(0, 6).map(m => `${m.kind}: ${m.name}`).join('; ')}${mismatches.length > 6 ? '; …' : ''}`)
    : pass('colony symmetry', { pairsChecked, linksChecked }));
  if (parameterDifferences.length) checks.push({ status: 'NOTE', name: 'colony parameter differences', message: `${parameterDifferences.length} numeric parameter(s) differ between colonies (allowed)` });
  const status = checks.some(c => c.status === 'FAIL') ? 'FAIL' : 'PASS';
  return {
    type: 'colony_symmetry', status, tokens,
    summary: { pairsChecked, linksChecked, mismatches: mismatches.length, parameterDifferences: parameterDifferences.length, exceptions: exceptionsApplied.length },
    checks, mismatches, parameterDifferences, exceptionsApplied
  };
}

// ---------------------------------------------------------------- entry point

export function runStructureAudits(raw, validation) {
  const plugins = validation?.plugins || [];
  const ob = plugins.find(p => p?.type === 'open_boundaries');
  const cs = plugins.find(p => p?.type === 'colony_symmetry');
  const openBoundaries = ob ? auditOpenBoundaries(raw, ob) : null;
  const colonySymmetry = cs ? auditColonySymmetry(raw, cs) : null;

  // Algebraic loops are a model property, not a validation plugin: always run.
  const algebraicLoops = auditAlgebraicLoops(raw);
  const configured = [openBoundaries, colonySymmetry].filter(Boolean);

  // Backward compatibility for structure_qa: a validation without the two
  // legacy structure plugins remains SKIPPED only when the unconditional loop
  // audit itself passes. A loop or parser failure always makes the gate FAIL.
  if (!configured.length && algebraicLoops.status !== 'FAIL') {
    return {
      status: 'SKIPPED',
      message: 'validation has no open_boundaries / colony_symmetry plugin; algebraic loop audit PASS',
      openBoundaries, colonySymmetry, algebraicLoops
    };
  }

  const parts = [...configured, algebraicLoops];
  const status = parts.some(p => p?.status === 'FAIL') ? 'FAIL' : 'PASS';
  return { status, openBoundaries, colonySymmetry, algebraicLoops };
}

export function structureAuditErrors(audit) {
  const out = [];
  for (const part of [audit?.openBoundaries, audit?.colonySymmetry]) {
    if (!part) continue;
    for (const e of part.specErrors || []) out.push(`${part.type} spec: ${e}`);
    for (const c of part.checks || []) if (c.status === 'FAIL') out.push(`${part.type}: ${c.name}: ${c.message}`);
  }
  const loops = audit?.algebraicLoops;
  if (loops?.status === 'FAIL') {
    for (const e of loops.errors || []) out.push(`algebraic_loops parser: ${e.element}: ${e.message}`);
    for (const x of loops.loops || []) {
      out.push(`algebraic_loops: size=${x.size}, combinations=${x.combinations}, cycle=${x.shortestCycle.join(' -> ')}`);
    }
  }
  return out;
}

export function printStructureAudits(audit, log = console.log) {
  if (!audit || audit.status === 'SKIPPED') { log(`[SKIP] Structure audits: ${audit?.message || 'not configured'}`); return; }
  log(`Structure audits: ${audit.status}`);
  const ob = audit.openBoundaries;
  if (ob) {
    if (ob.specErrors?.length) { log('    [FAIL] open_boundaries spec: ' + ob.specErrors.join('; ')); }
    else {
      log(`    open boundaries: ${ob.summary.openFlows} of ${ob.summary.flowsTotal} flows cross the model boundary; unclassified=${ob.summary.unclassified}; closed-world violations=${ob.summary.closedWorldViolations}; transformation pairs=${ob.summary.pairs} (unpaired=${ob.summary.unpaired}) (mode: ${ob.mode})`);
      for (const [id, c] of Object.entries(ob.byCategory)) log(`        ${c.closed_world ? ' ' : '!'} ${id.padEnd(26)} ${String(c.count).padStart(3)}${c.closed_world ? '' : '   (not allowed in a self-contained planet)'}`);
      for (const c of ob.checks) if (c.status !== 'PASS') log(`    [${c.status}] ${c.name}: ${c.message}`);
    }
  }
  const cs = audit.colonySymmetry;
  if (cs) {
    if (cs.specErrors?.length) { log('    [FAIL] colony_symmetry spec: ' + cs.specErrors.join('; ')); }
    else {
      log(`    colony symmetry (${cs.tokens.join('↔')}): pairs=${cs.summary.pairsChecked}, links=${cs.summary.linksChecked}, mismatches=${cs.summary.mismatches}, parameter differences=${cs.summary.parameterDifferences}, exceptions=${cs.summary.exceptions}`);
      for (const m of cs.mismatches.slice(0, 20)) log(`        - ${m.kind}: ${m.name}${m.expected ? ` | expected ${m.expected}` : ''}${m.actual ? ` | actual ${m.actual}` : ''}`);
      if (cs.mismatches.length > 20) log(`        … ${cs.mismatches.length - 20} more`);
    }
  }
  const al = audit.algebraicLoops;
  if (al) {
    log(`    algebraic loops: switches=${al.switches.length}; combinations=${al.combinations}; with loops=${al.combinationsWithLoops}; Modes=${al.modesWithLoops.join(',') || 'none'}`);
    for (const e of al.errors || []) log(`        [FAIL] parser ${e.element}: ${e.message}`);
    for (const x of al.loops || []) {
      log(`        [FAIL] size=${x.size}; combinations=${x.combinations}; example=[${x.example.join(', ')}]; cycle=${x.shortestCycle.join(' -> ')}`);
    }
  }
}
