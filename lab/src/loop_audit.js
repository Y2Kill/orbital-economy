// Switch-aware static algebraic-loop audit.
//
// The same-step dependency graph contains VARIABLE and FLOW elements only.
// STOCK values are read from the previous integration step and therefore cut
// algebraic dependencies. Formula references, not visual LINK elements, define
// graph edges.
//
// IfThenElse branches are pruned only when their condition can be decided from
// substituted scenario/switch values and numeric literals. Otherwise both
// branches remain, deliberately making the audit conservative.

const IF_CALL = 'IfThenElse(';
const REF_RE = /\[([^\]]+)\]/g;

function nameKey(name) {
  return String(name ?? '').trim().toLowerCase();
}

function literal01(value) {
  if (value === 0 || value === 1) return value;
  if (typeof value === 'string') {
    const s = value.trim();
    if (s === '0' || s === '1') return Number(s);
  }
  return null;
}

function numericLiteral(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function validateDelimiters(text) {
  const stack = [];
  const pair = { ')': '(', ']': '[' };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(' || c === '[') stack.push({ c, i });
    else if (c === ')' || c === ']') {
      const top = stack.pop();
      if (!top || top.c !== pair[c]) throw new Error(`unbalanced delimiter ${c} at offset ${i}`);
    }
  }
  if (stack.length) {
    const top = stack[stack.length - 1];
    throw new Error(`unbalanced delimiter ${top.c} at offset ${top.i}`);
  }
}

function splitCallArgs(text, start) {
  const args = [];
  let paren = 0;
  let bracket = 0;
  let argStart = start;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '(') paren++;
    else if (c === ')') {
      if (paren === 0 && bracket === 0) {
        args.push(text.slice(argStart, i));
        return { args, end: i };
      }
      paren--;
      if (paren < 0) throw new Error(`unbalanced ')' at offset ${i}`);
    } else if (c === '[') bracket++;
    else if (c === ']') {
      bracket--;
      if (bracket < 0) throw new Error(`unbalanced ']' at offset ${i}`);
    } else if (c === ',' && paren === 0 && bracket === 0) {
      args.push(text.slice(argStart, i));
      argStart = i + 1;
    }
  }
  throw new Error('unclosed IfThenElse');
}

function parseTemplate(text) {
  validateDelimiters(text);
  const parts = [];
  let pos = 0;
  for (;;) {
    const at = text.indexOf(IF_CALL, pos);
    if (at < 0) {
      if (pos < text.length) parts.push(text.slice(pos));
      break;
    }
    if (at > pos) parts.push(text.slice(pos, at));
    const { args, end } = splitCallArgs(text, at + IF_CALL.length);
    if (args.length !== 3) throw new Error(`IfThenElse requires 3 arguments, got ${args.length}`);
    parts.push({
      type: 'if',
      condition: parseTemplate(args[0]),
      yes: parseTemplate(args[1]),
      no: parseTemplate(args[2])
    });
    pos = end + 1;
  }
  return parts;
}

function renderTemplate(parts, env) {
  let out = '';
  for (const part of parts) {
    if (typeof part === 'string') {
      out += part;
      continue;
    }
    const condition = renderTemplate(part.condition, env);
    const decision = decideCondition(condition, env);
    if (decision === true) out += renderTemplate(part.yes, env);
    else if (decision === false) out += renderTemplate(part.no, env);
    else {
      // Keep condition dependencies as well as both possible branches.
      out += '(' + condition + '|'
        + renderTemplate(part.yes, env) + '|'
        + renderTemplate(part.no, env) + ')';
    }
  }
  return out;
}

function decideCondition(condition, env) {
  let unknown = false;
  const replaced = condition.replace(/\[([^\]]+)\]/g, (_m, name) => {
    const key = nameKey(name);
    if (!env.has(key)) {
      unknown = true;
      return '@';
    }
    const v = numericLiteral(env.get(key));
    if (v === undefined) {
      unknown = true;
      return '@';
    }
    return String(v);
  });
  if (unknown || replaced.includes('@')) return undefined;

  // Task 010 deliberately allows only comparisons of substituted numeric
  // values/literals and parentheses. Unsupported state/functions stay
  // undecidable and therefore retain both branches.
  if (!/^[\s0-9eE.+\-<>=()]+$/.test(replaced)) return undefined;
  const js = replaced.replace(/(^|[^<>=!])=([^=])/g, '$1==$2');
  try {
    // Input is restricted by the whitelist above to numbers/comparators.
    // eslint-disable-next-line no-new-func
    return Boolean(Function(`"use strict"; return (${js});`)());
  } catch {
    return undefined;
  }
}

function prepare(raw) {
  const elements = Array.isArray(raw?.elements) ? raw.elements : [];
  const byKey = new Map();
  const order = new Map();
  for (let i = 0; i < elements.length; i++) {
    const e = elements[i];
    if (!e?.name || e.type === 'LINK') continue;
    const key = nameKey(e.name);
    if (!byKey.has(key)) {
      byKey.set(key, e);
      order.set(e.name, i);
    }
  }

  const sameStepNames = [];
  const sameStepByKey = new Map();
  const formulas = new Map();
  const errors = [];
  for (const e of elements) {
    if (!e?.name || (e.type !== 'VARIABLE' && e.type !== 'FLOW')) continue;
    const key = nameKey(e.name);
    if (!sameStepByKey.has(key)) {
      sameStepNames.push(e.name);
      sameStepByKey.set(key, e.name);
    }

    const text = String(e.behavior?.value ?? '');
    try {
      formulas.set(e.name, parseTemplate(text));
    } catch (err) {
      errors.push({ element: e.name, message: err?.message || String(err) });
    }

    const unresolved = new Set();
    REF_RE.lastIndex = 0;
    for (const match of text.matchAll(REF_RE)) {
      const reference = match[1];
      const refKey = nameKey(reference);
      if (byKey.has(refKey) || unresolved.has(refKey)) continue;
      unresolved.add(refKey);
      errors.push({
        element: e.name,
        reference,
        message: `unresolved reference [${reference}]`
      });
    }
  }

  const scenarioKeys = [];
  const scenarioSeen = new Set();
  const scenarioValues = new Map();
  for (const scenario of raw?.scenarios || []) {
    for (const [name, value] of Object.entries(scenario?.values || {})) {
      const key = nameKey(name);
      if (!byKey.has(key)) continue;
      if (!scenarioSeen.has(key)) {
        scenarioSeen.add(key);
        scenarioKeys.push(key);
      }
      if (!scenarioValues.has(key)) scenarioValues.set(key, []);
      scenarioValues.get(key).push(value);
    }
  }

  const switches = [];
  for (const e of elements) {
    if (e?.type !== 'VARIABLE' || !e.name) continue;
    const key = nameKey(e.name);
    if (!scenarioValues.has(key)) continue;
    if (literal01(e.behavior?.value) == null) continue;
    const values = scenarioValues.get(key);
    if (values.length > 0 && values.every(v => literal01(v) != null)) switches.push(e.name);
  }

  return { byKey, order, sameStepNames, sameStepByKey, formulas, errors, scenarioKeys, switches };
}

function graphForEnv(prepared, env) {
  const adj = new Map(prepared.sameStepNames.map(name => [name, []]));
  const edgeSets = new Map(prepared.sameStepNames.map(name => [name, new Set()]));

  for (const target of prepared.sameStepNames) {
    const template = prepared.formulas.get(target);
    if (!template) continue;
    const pruned = renderTemplate(template, env);
    REF_RE.lastIndex = 0;
    for (const match of pruned.matchAll(REF_RE)) {
      const source = prepared.sameStepByKey.get(nameKey(match[1]));
      if (!source) continue;
      edgeSets.get(source).add(target);
    }
  }

  for (const source of prepared.sameStepNames) {
    const list = [...edgeSets.get(source)];
    list.sort((a, b) => prepared.order.get(a) - prepared.order.get(b));
    adj.set(source, list);
  }
  return adj;
}

function stronglyConnected(adj, names) {
  let next = 0;
  const index = new Map();
  const low = new Map();
  const stack = [];
  const onStack = new Set();
  const out = [];

  function visit(v) {
    index.set(v, next);
    low.set(v, next);
    next++;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v) || []) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), index.get(w)));
      }
    }

    if (low.get(v) === index.get(v)) {
      const component = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        component.push(w);
      } while (w !== v);
      const self = component.length === 1 && (adj.get(component[0]) || []).includes(component[0]);
      if (component.length > 1 || self) out.push(component);
    }
  }

  for (const v of names) if (!index.has(v)) visit(v);
  return out;
}

function compareIndexPath(a, b, order) {
  if (a.length !== b.length) return a.length - b.length;
  for (let i = 0; i < a.length; i++) {
    const d = order.get(a[i]) - order.get(b[i]);
    if (d) return d;
  }
  return 0;
}

function shortestCycle(component, adj, order) {
  const members = [...component].sort((a, b) => order.get(a) - order.get(b));
  const allowed = new Set(members);
  let best = null;

  for (const start of members) {
    for (const first of (adj.get(start) || []).filter(n => allowed.has(n))) {
      if (first === start) {
        const candidate = [start, start];
        if (!best || compareIndexPath(candidate, best, order) < 0) best = candidate;
        continue;
      }

      const queue = [first];
      let qi = 0;
      const parent = new Map([[first, null]]);
      let end = null;
      while (qi < queue.length && end == null) {
        const v = queue[qi++];
        for (const w of adj.get(v) || []) {
          if (!allowed.has(w)) continue;
          if (w === start) {
            end = v;
            break;
          }
          if (!parent.has(w)) {
            parent.set(w, v);
            queue.push(w);
          }
        }
      }
      if (end == null) continue;

      const rev = [];
      for (let cur = end; cur != null; cur = parent.get(cur)) rev.push(cur);
      rev.reverse();
      const candidate = [start, ...rev, start];
      if (!best || compareIndexPath(candidate, best, order) < 0) best = candidate;
    }
  }
  return best || members;
}

function componentsForEnv(prepared, env) {
  const adj = graphForEnv(prepared, env);
  const components = stronglyConnected(adj, prepared.sameStepNames);
  return components.map(component => {
    const members = [...component].sort((a, b) => prepared.order.get(a) - prepared.order.get(b));
    return { members, shortestCycle: shortestCycle(members, adj, prepared.order) };
  });
}

function scenarioValueMap(scenario) {
  const values = new Map();
  for (const [name, value] of Object.entries(scenario?.values || {})) {
    values.set(nameKey(name), value);
  }
  return values;
}

function scenarioEnv(prepared, scenario) {
  const values = scenarioValueMap(scenario);
  const env = new Map();
  for (const key of prepared.scenarioKeys) {
    if (values.has(key)) {
      env.set(key, values.get(key));
      continue;
    }
    const d = numericLiteral(prepared.byKey.get(key)?.behavior?.value);
    if (d !== undefined) env.set(key, d);
  }
  return env;
}

function modeOf(scenario, index) {
  const v = scenarioValueMap(scenario).get(nameKey('Timed Test Mode'));
  return typeof v === 'number' && Number.isFinite(v) ? v : index;
}

function analyzePrepared(raw, prepared) {
  const total = 2 ** prepared.switches.length;
  const merged = new Map();
  let combinationsWithLoops = 0;

  for (let mask = 0; mask < total; mask++) {
    const env = new Map();
    for (let i = 0; i < prepared.switches.length; i++) env.set(nameKey(prepared.switches[i]), (mask >> i) & 1);
    const components = componentsForEnv(prepared, env);
    if (components.length) combinationsWithLoops++;
    for (const c of components) {
      const key = c.members.join('\u0000');
      let item = merged.get(key);
      if (!item) {
        item = {
          size: c.members.length,
          members: c.members,
          shortestCycle: c.shortestCycle,
          combinations: 0,
          example: prepared.switches.filter(name => env.get(nameKey(name)) === 1)
        };
        merged.set(key, item);
      }
      item.combinations++;
    }
  }

  const loops = [...merged.values()];
  loops.sort((a, b) => {
    const ai = prepared.order.get(a.members[0]);
    const bi = prepared.order.get(b.members[0]);
    if (ai !== bi) return ai - bi;
    if (a.size !== b.size) return a.size - b.size;
    return a.members.join('\u0000').localeCompare(b.members.join('\u0000'));
  });

  const modesWithLoops = [];
  for (const [i, scenario] of (raw?.scenarios || []).entries()) {
    if (componentsForEnv(prepared, scenarioEnv(prepared, scenario)).length) modesWithLoops.push(modeOf(scenario, i));
  }

  return { total, combinationsWithLoops, loops, modesWithLoops };
}

export function auditAlgebraicLoops(raw) {
  const prepared = prepare(raw);
  const combinations = 2 ** prepared.switches.length;
  if (prepared.errors.length) {
    return {
      type: 'algebraic_loops',
      status: 'FAIL',
      switches: prepared.switches,
      combinations,
      combinationsWithLoops: 0,
      loops: [],
      modesWithLoops: [],
      errors: prepared.errors
    };
  }

  const result = analyzePrepared(raw, prepared);
  return {
    type: 'algebraic_loops',
    status: result.combinationsWithLoops > 0 ? 'FAIL' : 'PASS',
    switches: prepared.switches,
    combinations: result.total,
    combinationsWithLoops: result.combinationsWithLoops,
    loops: result.loops,
    modesWithLoops: result.modesWithLoops,
    errors: []
  };
}

// QA helper: returns the exact bad combinations without adding them to the
// stable public audit report. This lets the self-test prove that every bad
// combination has the expected enabling switch.
export function algebraicLoopCombinationDetails(raw) {
  const prepared = prepare(raw);
  if (prepared.errors.length) throw new Error(prepared.errors.map(e => `${e.element}: ${e.message}`).join('; '));
  const bad = [];
  const total = 2 ** prepared.switches.length;
  for (let mask = 0; mask < total; mask++) {
    const env = new Map();
    for (let i = 0; i < prepared.switches.length; i++) env.set(nameKey(prepared.switches[i]), (mask >> i) & 1);
    const components = componentsForEnv(prepared, env);
    if (components.length) bad.push({
      enabled: prepared.switches.filter(name => env.get(nameKey(name)) === 1),
      components: components.map(c => c.members)
    });
  }
  return { switches: prepared.switches, combinations: total, bad };
}
