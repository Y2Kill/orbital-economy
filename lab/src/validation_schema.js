const COMMENT_FIELDS = new Set(['note', 'notes']);
const OPS = new Set(['>', '>=', '<', '<=', '==', '!=']);
const METRICS = new Set(['max', 'min', 'mean', 'last', 'first']);

const TOP_FIELDS = {
  name: 'string',
  mode_variable: 'string',
  expected_time_step: 'number',
  time_step_tolerance: 'number',
  finite_all: 'boolean',
  non_negative_regex: 'object',
  regression_modes: 'array',
  regression_tolerance: 'number',
  plugins: 'array',
  scenarios: 'object',
  global_checks: 'array',
  web_crosscheck_abs_tolerance: 'number',
  web_crosscheck_rel_tolerance: 'number|null',
  web_crosscheck_rel_floor: 'number',
  note: 'any',
  notes: 'any'
};

const CHECK_SPECS = {
  metric:       { required: ['column', 'metric', 'op', 'value'], optional: ['tolerance', 'window'] },
  change:       { required: ['column', 'from_day', 'to_day', 'op', 'value'], optional: ['tolerance'] },
  event_exists: { required: ['event'], optional: [] },
  event_absent: { required: ['event'], optional: [] },
  event_order:  { required: ['events'], optional: [] },
  relation:     { required: ['left', 'op', 'right'], optional: ['abs_tol', 'window'] },
  identity:     { required: ['terms'], optional: ['abs_tol', 'window'] },
  bounded:      { required: ['column'], optional: ['min', 'max', 'tolerance', 'window'] }
};

const EVENT_FIELDS = new Set(['column', 'op', 'value', 'tolerance', 'window', 'name']);
const PLUGIN_FIELDS = {
  energy_balance: ['colonies', 'abs_tol', 'consumers', 'priority'],
  capital_lifecycle: ['abs_tol', 'items'],
  capital_lifecycle_kernel: ['format', 'legacy_switch', 'abs_tol', 'instances'],
  simple_capital: ['abs_tol', 'instances'],
  deposit: ['abs_tol', 'instances'],
  labor: ['abs_tol', 'min_human_share', 'instances'],
  population: ['abs_tol', 'instances'],
  food: ['abs_tol', 'instances', 'transport'],
  labor_market: ['abs_tol', 'rel_tol', 'switch', 'floor', 'instances'],
  transport_allocator: ['abs_tol'],
  open_boundaries: ['enforce', 'categories', 'transformation_pairs'],
  colony_symmetry: ['tokens', 'enforce', 'exceptions'],
  planet_closure: ['enforce', 'colonies', 'max_hops', 'process_categories', 'energy', 'processes', 'demand_drivers']
};

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function typeMatches(expected, value) {
  if (expected === 'any') return true;
  if (expected === 'number|null') return value === null || isNumber(value);
  if (expected === 'number') return isNumber(value);
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return isObject(value);
  return typeof value === expected;
}

function normalizedModes(modes) {
  if (modes == null) return null;
  const out = new Set();
  for (const mode of modes) {
    const n = Number(mode);
    if (Number.isFinite(n)) out.add(n);
  }
  return out;
}

export function checkValidationSchema(validation, { modes } = {}) {
  const errors = [];
  const add = (path, message) => errors.push({ path, message });
  const knownModes = normalizedModes(modes);

  const checkWindow = (path, value) => {
    if (!Array.isArray(value) || value.length !== 2 || !value.every(isNumber) || value[0] > value[1]) {
      add(path, 'window must be [from_day, to_day] with from_day <= to_day');
      return false;
    }
    return true;
  };

  const checkOp = (path, value) => {
    if (!OPS.has(value)) {
      add(path, 'op must be one of > >= < <= == !=');
      return false;
    }
    return true;
  };

  const checkEvent = (path, event) => {
    if (!isObject(event)) {
      add(path, 'expected an event object {column, op, value, window}');
      return;
    }
    for (const [key, value] of Object.entries(event)) {
      if (!EVENT_FIELDS.has(key) && !COMMENT_FIELDS.has(key)) {
        add(`${path}.${key}`, 'unknown event field');
        continue;
      }
      if (key === 'column' && typeof value !== 'string') add(`${path}.column`, 'expected string');
      else if (key === 'op') checkOp(`${path}.op`, value);
      else if ((key === 'value' || key === 'tolerance') && !isNumber(value)) add(`${path}.${key}`, 'expected number');
      else if (key === 'window') checkWindow(`${path}.window`, value);
      else if (key === 'name' && typeof value !== 'string') add(`${path}.name`, 'expected string');
    }
    if (!Object.hasOwn(event, 'column')) add(`${path}.column`, 'required');
  };

  const checkTerm = (path, term) => {
    if (!isObject(term)) {
      add(path, 'term must be an object {column, coef}');
      return;
    }
    for (const key of Object.keys(term)) {
      if (key !== 'column' && key !== 'coef') add(`${path}.${key}`, 'unknown term field');
    }
    if (!Object.hasOwn(term, 'column')) add(`${path}.column`, 'required');
    else if (typeof term.column !== 'string') add(`${path}.column`, 'expected string');
    if (!Object.hasOwn(term, 'coef')) add(`${path}.coef`, 'required');
    else if (!isNumber(term.coef)) add(`${path}.coef`, 'expected number');
  };

  const checkCheck = (path, check) => {
    if (!isObject(check)) {
      add(path, 'check is not an object');
      return;
    }
    const spec = CHECK_SPECS[check.type];
    if (!spec) {
      add(`${path}.type`, `unknown check type "${check.type}" (known: ${Object.keys(CHECK_SPECS).join(', ')})`);
      return;
    }

    const allowed = new Set(['type', 'name', ...COMMENT_FIELDS, ...spec.required, ...spec.optional]);
    for (const key of Object.keys(check)) {
      if (allowed.has(key)) continue;
      const hint = (key === 'from_day' || key === 'to_day') && check.type !== 'change'
        ? ' (a window is "window": [from, to])'
        : (['column', 'op', 'value'].includes(key) && check.type.startsWith('event_'))
          ? ' (event fields go inside "event": {...})'
          : '';
      add(`${path}.${key}`, `unknown field for ${check.type}${hint}`);
    }

    if (!Object.hasOwn(check, 'name')) add(`${path}.name`, `required for ${check.type}`);
    for (const key of spec.required) {
      if (!Object.hasOwn(check, key)) add(`${path}.${key}`, `required for ${check.type}`);
    }

    if (Object.hasOwn(check, 'name') && typeof check.name !== 'string') add(`${path}.name`, 'expected string');
    if (Object.hasOwn(check, 'column') && typeof check.column !== 'string') add(`${path}.column`, 'expected string');
    if (Object.hasOwn(check, 'left') && typeof check.left !== 'string') add(`${path}.left`, 'expected string');
    if (Object.hasOwn(check, 'right') && typeof check.right !== 'string') add(`${path}.right`, 'expected string');

    for (const key of ['value', 'tolerance', 'from_day', 'to_day', 'abs_tol', 'min', 'max']) {
      if (Object.hasOwn(check, key) && !isNumber(check[key])) add(`${path}.${key}`, 'expected number');
    }

    if (Object.hasOwn(check, 'window')) checkWindow(`${path}.window`, check.window);
    if (Object.hasOwn(check, 'op')) checkOp(`${path}.op`, check.op);

    if (check.type === 'relation' && Object.hasOwn(check, 'op') && !new Set(['<=', '>=']).has(check.op)) {
      add(`${path}.op`, 'relation op must be <= or >=');
    }
    if (check.type === 'metric' && Object.hasOwn(check, 'metric') && !METRICS.has(check.metric)) {
      add(`${path}.metric`, 'metric must be max|min|mean|last|first');
    }

    if (Object.hasOwn(check, 'event')) checkEvent(`${path}.event`, check.event);
    if (Object.hasOwn(check, 'events')) {
      if (!Array.isArray(check.events)) add(`${path}.events`, 'expected array of events');
      else check.events.forEach((event, i) => checkEvent(`${path}.events[${i}]`, event));
    }
    if (Object.hasOwn(check, 'terms')) {
      if (!Array.isArray(check.terms)) add(`${path}.terms`, 'expected array of terms');
      else {
        if (check.terms.length < 2) add(`${path}.terms`, 'identity requires at least 2 terms');
        check.terms.forEach((term, i) => checkTerm(`${path}.terms[${i}]`, term));
      }
    }
  };

  if (!isObject(validation)) {
    add('$', 'validation is not an object');
    return { status: 'FAIL', errors };
  }

  for (const [key, value] of Object.entries(validation)) {
    if (!Object.hasOwn(TOP_FIELDS, key)) add(`$.${key}`, 'unknown top-level field');
    else if (!typeMatches(TOP_FIELDS[key], value)) add(`$.${key}`, `expected ${TOP_FIELDS[key]}`);
  }

  if (isObject(validation.non_negative_regex)) {
    for (const key of Object.keys(validation.non_negative_regex)) {
      if (key !== 'pattern' && key !== 'tolerance') add(`$.non_negative_regex.${key}`, 'unknown field for non_negative_regex');
    }
    if (Object.hasOwn(validation.non_negative_regex, 'pattern') && typeof validation.non_negative_regex.pattern !== 'string') {
      add('$.non_negative_regex.pattern', 'expected string');
    }
    if (Object.hasOwn(validation.non_negative_regex, 'tolerance') && !isNumber(validation.non_negative_regex.tolerance)) {
      add('$.non_negative_regex.tolerance', 'expected number');
    }
  }

  if (Array.isArray(validation.global_checks)) {
    validation.global_checks.forEach((check, i) => checkCheck(`$.global_checks[${i}]`, check));
  }

  if (isObject(validation.scenarios)) {
    for (const [mode, scenario] of Object.entries(validation.scenarios)) {
      const path = `$.scenarios["${mode}"]`;
      if (!/^\d+$/.test(mode)) add(path, 'scenario key must be a Mode number');
      else if (knownModes && !knownModes.has(Number(mode))) add(path, `Mode ${mode} is not a scenario of the model — its checks would never run`);

      if (!isObject(scenario)) {
        add(path, 'scenario must be an object');
        continue;
      }
      for (const key of Object.keys(scenario)) {
        if (!['name', 'checks', 'note', 'notes'].includes(key)) add(`${path}.${key}`, 'unknown scenario field');
      }
      if (Object.hasOwn(scenario, 'name') && typeof scenario.name !== 'string') add(`${path}.name`, 'expected string');
      if (Object.hasOwn(scenario, 'checks')) {
        if (!Array.isArray(scenario.checks)) add(`${path}.checks`, 'expected array');
        else scenario.checks.forEach((check, i) => checkCheck(`${path}.checks[${i}]`, check));
      }
    }
  }

  if (Array.isArray(validation.plugins)) {
    validation.plugins.forEach((plugin, i) => {
      const path = `$.plugins[${i}]`;
      if (!isObject(plugin)) {
        add(path, 'plugin must be an object');
        return;
      }
      const fields = PLUGIN_FIELDS[plugin.type];
      if (!fields) {
        add(`${path}.type`, `unknown plugin type "${plugin.type}"`);
        return;
      }
      const allowed = new Set(['type', ...COMMENT_FIELDS, ...fields]);
      for (const key of Object.keys(plugin)) {
        if (!allowed.has(key)) add(`${path}.${key}`, `unknown field for plugin ${plugin.type}`);
      }
    });
  }

  return { status: errors.length ? 'FAIL' : 'PASS', errors };
}
