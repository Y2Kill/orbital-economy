import fs from 'node:fs';
import path from 'node:path';
import { readJson, sha256File, nowIso, writeJson, ensureDir, fmtNum } from './util.js';

export const POLICY_FORMAT = 'orbital-economy-change-policy-v1';

const EVENT_TYPES = new Set([
  'element_added',
  'element_removed',
  'definition_changed',
  'type_changed',
  'link_added',
  'link_removed',
  'simulation_changed',
  'mode_added',
  'mode_removed',
  'scenario_input_changed',
  'scenario_renamed',
  'time_axis_changed',
  'series_added',
  'series_removed',
  'series_changed'
]);

function arr(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function parseModeSelector(selector) {
  if (selector == null || selector === '*' || selector === 'all') return null;
  const out = new Set();
  const add = x => {
    if (typeof x === 'number' && Number.isFinite(x)) { out.add(x); return; }
    if (typeof x !== 'string') throw new Error(`Invalid mode selector value: ${String(x)}`);
    for (const raw of x.split(',')) {
      const p = raw.trim();
      if (!p) continue;
      if (p === '*' || p === 'all') return null;
      const m = p.match(/^(-?\d+)\s*-\s*(-?\d+)$/);
      if (m) {
        const a = Number(m[1]), b = Number(m[2]);
        const step = a <= b ? 1 : -1;
        for (let n = a; ; n += step) { out.add(n); if (n === b) break; }
      } else if (/^-?\d+$/.test(p)) out.add(Number(p));
      else throw new Error(`Invalid mode selector token: ${p}`);
    }
  };
  if (Array.isArray(selector)) {
    for (const x of selector) {
      const one = parseModeSelector(x);
      if (one == null) return null;
      for (const n of one) out.add(n);
    }
    return out;
  }
  const r = add(selector);
  if (r === null) return null;
  return out;
}

function globRegex(pattern) {
  const s = String(pattern);
  let out = '^';
  const special = new Set('\\^$.*+?()[]{}|'.split(''));
  for (const ch of s) {
    if (ch === '*') out += '.*';
    else if (ch === '?') out += '.';
    else out += special.has(ch) ? `\\${ch}` : ch;
  }
  out += '$';
  return new RegExp(out);
}

function nameMatches(name, matcher) {
  if (matcher == null) return true;
  return arr(matcher).some(p => globRegex(p).test(String(name ?? '')));
}

function eventTypeMatches(type, matcher) {
  if (matcher == null || matcher === '*') return true;
  return arr(matcher).includes(type);
}

function modeMatches(mode, selector) {
  const set = parseModeSelector(selector);
  if (set == null) return true;
  return mode != null && set.has(mode);
}

function thresholdFailure(rule, event) {
  const failures = [];
  if (rule.max_abs != null) {
    if (event.maxAbs == null || event.maxAbs > Number(rule.max_abs)) failures.push(`max_abs ${event.maxAbs ?? 'N/A'} > ${rule.max_abs}`);
  }
  if (rule.max_rel != null) {
    if (event.maxRel == null || event.maxRel > Number(rule.max_rel)) failures.push(`max_rel ${event.maxRel ?? 'N/A'} > ${rule.max_rel}`);
  }
  if (rule.max_changed_points != null) {
    if (event.changedPoints == null || event.changedPoints > Number(rule.max_changed_points)) failures.push(`changed_points ${event.changedPoints ?? 'N/A'} > ${rule.max_changed_points}`);
  }
  return failures;
}

function ruleFieldMatches(rule, event) {
  return eventTypeMatches(event.type, rule.event)
    && modeMatches(event.mode, rule.modes)
    && nameMatches(event.name, rule.name);
}

export function validatePolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) errors.push('Policy must be a JSON object.');
  if (policy?.format !== POLICY_FORMAT) errors.push(`format must be "${POLICY_FORMAT}".`);
  if (!/^[0-9a-f]{64}$/i.test(policy?.accepted_model_sha256 || '')) errors.push('accepted_model_sha256 must be a 64-character SHA-256 hex string.');
  if (policy?.validation_sha256 != null && !/^[0-9a-f]{64}$/i.test(policy.validation_sha256)) errors.push('validation_sha256 must be null/omitted or a 64-character SHA-256 hex string.');
  if (!['allow', 'deny'].includes(policy?.default_action || 'deny')) errors.push('default_action must be "allow" or "deny".');
  if (policy?.require_full_mode_coverage != null && typeof policy.require_full_mode_coverage !== 'boolean') errors.push('require_full_mode_coverage must be boolean.');
  if (policy?.engine != null) {
    if (typeof policy.engine !== 'object' || Array.isArray(policy.engine)) errors.push('engine must be an object.');
    else {
      if (policy.engine.package != null && typeof policy.engine.package !== 'string') errors.push('engine.package must be a string.');
      if (policy.engine.version != null && typeof policy.engine.version !== 'string') errors.push('engine.version must be a string.');
    }
  }
  if (policy?.comparison != null) {
    const c = policy.comparison;
    if (typeof c !== 'object' || Array.isArray(c)) errors.push('comparison must be an object.');
    else {
      if (c.abs_tolerance != null && (!Number.isFinite(Number(c.abs_tolerance)) || Number(c.abs_tolerance) < 0)) errors.push('comparison.abs_tolerance must be a non-negative number.');
      if (c.rel_tolerance != null && (!Number.isFinite(Number(c.rel_tolerance)) || Number(c.rel_tolerance) < 0)) errors.push('comparison.rel_tolerance must be null or a non-negative number.');
      if (c.rel_floor != null && (!Number.isFinite(Number(c.rel_floor)) || Number(c.rel_floor) <= 0)) errors.push('comparison.rel_floor must be a positive number.');
    }
  }

  if (!Array.isArray(policy?.rules || [])) errors.push('rules must be an array.');
  const ids = new Set();
  for (const [i, r] of (policy?.rules || []).entries()) {
    const p = `rules[${i}]`;
    if (!r || typeof r !== 'object' || Array.isArray(r)) { errors.push(`${p} must be an object.`); continue; }
    if (!r.id || typeof r.id !== 'string') errors.push(`${p}.id must be a non-empty string.`);
    else if (ids.has(r.id)) errors.push(`Duplicate rule id: ${r.id}`);
    else ids.add(r.id);
    if (!['allow', 'deny'].includes(r.action)) errors.push(`${p}.action must be "allow" or "deny".`);
    if (r.event == null || (Array.isArray(r.event) && r.event.length === 0)) errors.push(`${p}.event is required; use "*" explicitly to match every event type.`);
    for (const e of arr(r.event)) {
      if (typeof e !== 'string') errors.push(`${p}.event entries must be strings.`);
      else if (e !== '*' && !EVENT_TYPES.has(e)) errors.push(`${p}.event contains unsupported event type: ${e}`);
    }
    if (r.name != null) {
      const names = arr(r.name);
      if (!names.length || names.some(x => typeof x !== 'string' || !x.length)) errors.push(`${p}.name must be a non-empty string or array of non-empty strings.`);
    }
    try { parseModeSelector(r.modes); } catch (e) { errors.push(`${p}.modes: ${e.message}`); }
    for (const key of ['max_abs', 'max_rel', 'max_changed_points']) {
      if (r[key] != null && (!Number.isFinite(Number(r[key])) || Number(r[key]) < 0)) errors.push(`${p}.${key} must be a non-negative number.`);
    }
    if ((r.max_abs != null || r.max_rel != null || r.max_changed_points != null) && !arr(r.event).some(e => e === 'series_changed' || e === '*')) {
      errors.push(`${p}: numeric thresholds are only meaningful for series_changed rules.`);
    }
    if ((r.max_abs != null || r.max_rel != null || r.max_changed_points != null) && r.action !== 'allow') errors.push(`${p}: numeric thresholds are only supported on allow rules.`);
    if (r.required != null && typeof r.required !== 'boolean') errors.push(`${p}.required must be boolean.`);
    if (r.required && r.action !== 'allow') errors.push(`${p}: required=true is only supported for allow rules.`);
  }
  return errors;
}

export function comparisonToPolicyEvents(report) {
  const events = [];
  const s = report.structure || {};
  const typeChangedNames = new Set((s.typeChanges || []).map(x => x.name));

  for (const name of s.addedElements || []) events.push({ type: 'element_added', name });
  for (const name of s.removedElements || []) events.push({ type: 'element_removed', name });
  for (const x of s.typeChanges || []) events.push({ type: 'type_changed', name: x.name, accepted: x.accepted, candidate: x.candidate });
  for (const name of s.changedDefinitions || []) if (!typeChangedNames.has(name)) events.push({ type: 'definition_changed', name });
  for (const name of s.addedLinks || []) events.push({ type: 'link_added', name });
  for (const name of s.removedLinks || []) events.push({ type: 'link_removed', name });
  if (s.simulationChanged) events.push({ type: 'simulation_changed', name: 'simulation', accepted: s.acceptedSimulation, candidate: s.candidateSimulation });
  for (const mode of s.addedModes || []) events.push({ type: 'mode_added', mode, name: String(mode) });
  for (const mode of s.removedModes || []) events.push({ type: 'mode_removed', mode, name: String(mode) });
  for (const x of s.changedScenarioInputs || []) events.push({ type: 'scenario_input_changed', mode: x.mode, name: String(x.mode), accepted: x.accepted, candidate: x.candidate });
  for (const x of s.renamedScenarios || []) events.push({ type: 'scenario_renamed', mode: x.mode, name: String(x.mode), accepted: x.accepted, candidate: x.candidate });

  for (const sc of report.scenarios || []) {
    const c = sc.comparison;
    if (!c) continue;
    if (!c.time?.exact) events.push({ type: 'time_axis_changed', mode: sc.mode, name: 'time', maxAbs: c.time?.maxAbsDiff ?? null, acceptedRows: c.time?.acceptedRows, candidateRows: c.time?.candidateRows });
    for (const name of c.addedSeries || []) events.push({ type: 'series_added', mode: sc.mode, name });
    for (const name of c.removedSeries || []) events.push({ type: 'series_removed', mode: sc.mode, name });
    for (const x of c.changedSeries || []) events.push({
      type: 'series_changed', mode: sc.mode, name: x.column,
      maxAbs: x.maxAbs, maxRel: x.maxRel, changedPoints: x.changedPoints,
      time: x.time, accepted: x.accepted, candidate: x.candidate
    });
  }
  return events;
}

function comparisonHardBlockers(report) {
  const blockers = [];
  if (report?.static?.accepted?.status === 'FAIL') blockers.push('Accepted model static validation failed.');
  if (report?.static?.candidate?.status === 'FAIL') blockers.push('Candidate model static validation failed.');
  for (const sc of report?.scenarios || []) {
    if (sc.status === 'ERROR') blockers.push(`Mode ${sc.mode}: simulation error${sc.reason ? ` — ${sc.reason}` : ''}`);
    if (sc.status === 'VALIDATION_FAIL' || sc.candidateValidation?.status === 'FAIL') blockers.push(`Mode ${sc.mode}: candidate HARD/validation checks failed.`);
  }
  return [...new Set(blockers)];
}

function compareSettingMismatch(policy, report) {
  const errors = [];
  const want = policy.comparison || {};
  if (Object.keys(want).length > 0 && !report.comparisonSettings) {
    errors.push('Comparison report does not record comparator tolerance settings. Re-run comparison with Orbital Economy Lab v0.4.0+ before applying this policy.');
    return errors;
  }
  const got = report.comparisonSettings || { absTolerance: 0, relTolerance: null, relFloor: 1e-12 };
  if (want.abs_tolerance != null && Number(want.abs_tolerance) !== Number(got.absTolerance)) errors.push(`Comparator abs tolerance mismatch: policy=${want.abs_tolerance}, report=${got.absTolerance}.`);
  if (Object.prototype.hasOwnProperty.call(want, 'rel_tolerance')) {
    const a = want.rel_tolerance == null ? null : Number(want.rel_tolerance);
    const b = got.relTolerance == null ? null : Number(got.relTolerance);
    if (a !== b) errors.push(`Comparator rel tolerance mismatch: policy=${a}, report=${b}.`);
  }
  if (want.rel_floor != null && Number(want.rel_floor) !== Number(got.relFloor)) errors.push(`Comparator rel floor mismatch: policy=${want.rel_floor}, report=${got.relFloor}.`);
  return errors;
}

export function evaluatePolicy({ comparisonReport, policy, policyFile = null }) {
  const policyErrors = validatePolicy(policy);
  const preflightErrors = [...policyErrors];
  if (!policyErrors.length) {
    if ((policy.accepted_model_sha256 || '').toLowerCase() !== (comparisonReport?.accepted?.sha256 || '').toLowerCase()) {
      preflightErrors.push(`Accepted model SHA mismatch: policy=${policy.accepted_model_sha256}, comparison=${comparisonReport?.accepted?.sha256 || 'missing'}.`);
    }
    if (policy.validation_sha256 != null) {
      const got = comparisonReport?.validation?.sha256 || null;
      if ((policy.validation_sha256 || '').toLowerCase() !== (got || '').toLowerCase()) preflightErrors.push(`Validation SHA mismatch: policy=${policy.validation_sha256}, comparison=${got || 'missing'}.`);
    }
    if (policy.engine?.package != null && policy.engine.package !== comparisonReport?.engine?.package) preflightErrors.push(`Engine package mismatch: policy=${policy.engine.package}, comparison=${comparisonReport?.engine?.package || 'missing'}.`);
    if (policy.engine?.version != null && policy.engine.version !== comparisonReport?.engine?.version) preflightErrors.push(`Engine version mismatch: policy=${policy.engine.version}, comparison=${comparisonReport?.engine?.version || 'missing'}.`);
    preflightErrors.push(...compareSettingMismatch(policy, comparisonReport));
    if (policy.require_full_mode_coverage !== false) {
      const acceptedModes = comparisonReport?.structure?.acceptedModes;
      const candidateModes = comparisonReport?.structure?.candidateModes;
      if (!Array.isArray(acceptedModes) || !Array.isArray(candidateModes)) {
        preflightErrors.push('Comparison report does not record the complete accepted/candidate Mode sets. Re-run comparison with Orbital Economy Lab v0.4.0+ before applying a full-coverage policy.');
      } else {
        const expected = new Set([...acceptedModes, ...candidateModes]);
        const got = new Set((comparisonReport?.scenarios || []).map(x => x.mode));
        const missing = [...expected].filter(x => !got.has(x)).sort((a,b)=>a-b);
        if (missing.length) preflightErrors.push(`Policy requires full Mode coverage, but comparison omitted Mode(s): ${missing.join(', ')}.`);
      }
    }
  }

  const hardBlockers = comparisonHardBlockers(comparisonReport);
  const events = comparisonToPolicyEvents(comparisonReport);
  const rules = policy?.rules || [];
  const ruleStats = new Map(rules.map(r => [r.id, { id: r.id, action: r.action, required: !!r.required, matched: 0, allowed: 0, denied: 0, thresholdFailed: 0, note: r.note || null }]));
  const classified = [];

  if (!preflightErrors.length) {
    for (const event of events) {
      let classification = null;
      for (const rule of rules) {
        if (!ruleFieldMatches(rule, event)) continue;
        const stat = ruleStats.get(rule.id);
        stat.matched++;
        const tf = thresholdFailure(rule, event);
        if (tf.length) {
          stat.thresholdFailed++;
          classification = { ...event, classification: 'THRESHOLD_EXCEEDED', ruleId: rule.id, ruleAction: rule.action, reasons: tf };
        } else if (rule.action === 'allow') {
          stat.allowed++;
          classification = { ...event, classification: 'EXPECTED_CHANGE', ruleId: rule.id, ruleAction: 'allow' };
        } else {
          stat.denied++;
          classification = { ...event, classification: 'FORBIDDEN_CHANGE', ruleId: rule.id, ruleAction: 'deny' };
        }
        break; // ordered first-match policy
      }
      if (!classification) {
        if ((policy.default_action || 'deny') === 'allow') classification = { ...event, classification: 'DEFAULT_ALLOWED', ruleId: null, ruleAction: 'allow' };
        else classification = { ...event, classification: 'UNEXPECTED_CHANGE', ruleId: null, ruleAction: 'deny' };
      }
      classified.push(classification);
    }
  }

  const missingRequired = [];
  if (!preflightErrors.length) {
    for (const r of rules) {
      if (!r.required) continue;
      const stat = ruleStats.get(r.id);
      if (!stat || stat.allowed === 0) missingRequired.push({ id: r.id, note: r.note || null, message: `Required expected change rule "${r.id}" matched no successfully allowed event.` });
    }
  }

  const counts = {
    observedEvents: events.length,
    expected: classified.filter(x => x.classification === 'EXPECTED_CHANGE' || x.classification === 'DEFAULT_ALLOWED').length,
    unexpected: classified.filter(x => x.classification === 'UNEXPECTED_CHANGE').length,
    forbidden: classified.filter(x => x.classification === 'FORBIDDEN_CHANGE').length,
    thresholdExceeded: classified.filter(x => x.classification === 'THRESHOLD_EXCEEDED').length,
    requiredMissing: missingRequired.length,
    hardBlockers: hardBlockers.length,
    preflightErrors: preflightErrors.length
  };

  const fail = preflightErrors.length || hardBlockers.length || counts.unexpected || counts.forbidden || counts.thresholdExceeded || missingRequired.length;
  return {
    generated: nowIso(),
    result: fail ? 'FAIL' : 'PASS',
    policy: {
      file: policyFile ? path.resolve(policyFile) : null,
      sha256: policyFile && fs.existsSync(policyFile) ? sha256File(policyFile) : null,
      format: policy?.format || null,
      name: policy?.name || null,
      defaultAction: policy?.default_action || 'deny',
      requireFullModeCoverage: policy?.require_full_mode_coverage !== false,
      acceptedModelSha256: policy?.accepted_model_sha256 || null,
      validationSha256: policy?.validation_sha256 || null,
      engine: policy?.engine || null
    },
    comparison: {
      generated: comparisonReport?.generated || null,
      result: comparisonReport?.result || null,
      runStatus: comparisonReport?.overall || null,
      accepted: comparisonReport?.accepted || null,
      candidate: comparisonReport?.candidate || null,
      validation: comparisonReport?.validation || null,
      settings: comparisonReport?.comparisonSettings || null
    },
    preflightErrors,
    hardBlockers,
    counts,
    ruleStats: [...ruleStats.values()],
    missingRequired,
    events: classified
  };
}

function esc(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' '); }

export function writePolicyReports(outDir, result) {
  ensureDir(outDir);
  writeJson(path.join(outDir, 'change-policy.json'), result);
  const l = [];
  l.push('# Orbital Economy Lab — change policy result');
  l.push('');
  l.push(`- generated: ${result.generated}`);
  l.push(`- policy: ${esc(result.policy.name || result.policy.file || '-')}`);
  if (result.policy.sha256) l.push(`- policy SHA-256: \`${result.policy.sha256}\``);
  l.push(`- comparison result: **${esc(result.comparison.result || '-')}**`);
  l.push(`- policy result: **${result.result}**`);
  l.push('');
  l.push('## Summary');
  l.push('');
  l.push(`- observed change events: ${result.counts.observedEvents}`);
  l.push(`- expected/allowed: ${result.counts.expected}`);
  l.push(`- unexpected: ${result.counts.unexpected}`);
  l.push(`- explicitly forbidden: ${result.counts.forbidden}`);
  l.push(`- threshold exceeded: ${result.counts.thresholdExceeded}`);
  l.push(`- required expected changes missing: ${result.counts.requiredMissing}`);
  l.push(`- hard blockers: ${result.counts.hardBlockers}`);
  l.push(`- preflight errors: ${result.counts.preflightErrors}`);
  l.push('');

  if (result.preflightErrors.length) {
    l.push('## Policy preflight failures'); l.push('');
    for (const x of result.preflightErrors) l.push(`- **FAIL** ${esc(x)}`);
    l.push('');
  }
  if (result.hardBlockers.length) {
    l.push('## HARD / validation blockers'); l.push('');
    for (const x of result.hardBlockers) l.push(`- **FAIL** ${esc(x)}`);
    l.push('');
  }
  if (result.missingRequired.length) {
    l.push('## Required changes not observed'); l.push('');
    for (const x of result.missingRequired) l.push(`- **FAIL** ${esc(x.id)}${x.note ? ` — ${esc(x.note)}` : ''}`);
    l.push('');
  }

  l.push('## Rule usage'); l.push('');
  l.push('| Rule | Action | Required | Matched | Allowed | Denied | Threshold fail |');
  l.push('|---|:---:|:---:|---:|---:|---:|---:|');
  for (const r of result.ruleStats) l.push(`| ${esc(r.id)} | ${r.action} | ${r.required ? 'yes' : 'no'} | ${r.matched} | ${r.allowed} | ${r.denied} | ${r.thresholdFailed} |`);
  if (!result.ruleStats.length) l.push('| _no explicit rules_ | - | - | 0 | 0 | 0 | 0 |');
  l.push('');

  const bad = result.events.filter(x => !['EXPECTED_CHANGE', 'DEFAULT_ALLOWED'].includes(x.classification));
  const good = result.events.filter(x => ['EXPECTED_CHANGE', 'DEFAULT_ALLOWED'].includes(x.classification));
  l.push('## Unapproved / failing changes'); l.push('');
  if (!bad.length) l.push('None.');
  else {
    l.push('| Class | Event | Mode | Name | Rule | Detail |');
    l.push('|---|---|---:|---|---|---|');
    for (const e of bad.slice(0, 200)) {
      const detail = e.reasons?.join('; ') || (e.maxAbs != null ? `maxAbs=${fmtNum(e.maxAbs)}, maxRel=${fmtNum(e.maxRel)}, points=${e.changedPoints}` : '');
      l.push(`| ${e.classification} | ${e.type} | ${e.mode ?? '-'} | ${esc(e.name ?? '-')} | ${esc(e.ruleId ?? '-')} | ${esc(detail)} |`);
    }
    if (bad.length > 200) l.push(`\n... ${bad.length - 200} more failing events are in change-policy.json.`);
  }
  l.push('');

  l.push('## Expected / allowed changes'); l.push('');
  if (!good.length) l.push('None.');
  else {
    l.push('| Event | Mode | Name | Rule | Max abs | Max rel |');
    l.push('|---|---:|---|---|---:|---:|');
    for (const e of good.slice(0, 200)) l.push(`| ${e.type} | ${e.mode ?? '-'} | ${esc(e.name ?? '-')} | ${esc(e.ruleId ?? '(default)')} | ${e.maxAbs != null ? fmtNum(e.maxAbs) : '-'} | ${e.maxRel != null ? fmtNum(e.maxRel) : '-'} |`);
    if (good.length > 200) l.push(`\n... ${good.length - 200} more allowed events are in change-policy.json.`);
  }
  l.push('');
  l.push('## Interpretation');
  l.push('');
  l.push('- This layer does not decide whether an economic design change is good. It checks whether observed differences conform to an explicit, versioned project contract.');
  l.push('- HARD/static/physics validation failures cannot be waived by change-policy rules.');
  l.push('- Rules are ordered: the first rule whose event/mode/name fields match owns the event.');
  l.push('- `required: true` means at least one event must be successfully allowed by that rule, otherwise the policy fails.');
  l.push('- With `default_action: deny`, every unlisted change is a policy failure. This is the recommended project default.');
  l.push('');
  fs.writeFileSync(path.join(outDir, 'change-policy.md'), l.join('\n'), 'utf8');
}

export function evaluatePolicyFiles({ comparisonFile, policyFile, outDir = null }) {
  const comparisonReport = readJson(comparisonFile);
  const policy = readJson(policyFile);
  const result = evaluatePolicy({ comparisonReport, policy, policyFile });
  if (outDir) writePolicyReports(outDir, result);
  return result;
}
