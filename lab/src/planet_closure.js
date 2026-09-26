import { auditOpenBoundaries } from './structure_audit.js';

const REF_RE = /\[([^\]]+)\]/g;
const PROCESS_KINDS = new Set(['extraction', 'transformation', 'service']);
const CAPACITY_KINDS = new Set(['kernel', 'constant', 'unbounded']);
const ENERGY_KINDS = new Set(['requests', 'none', 'producer']);
const DEPOSIT_KINDS = new Set(['stock', 'none']);
const LABOR_KINDS = new Set(['declared', 'undeclared']);
const MODES = new Set(['report', 'classify', 'planet_v1', 'planet_strict']);

function key(name) {
  return String(name ?? '').trim().toLowerCase();
}

function expand(template, colony) {
  const text = String(template ?? '');
  return colony == null ? text : text.replaceAll('{C}', colony);
}

function buildIndex(raw) {
  const elements = Array.isArray(raw?.elements) ? raw.elements : [];
  const byKey = new Map();
  const order = new Map();
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (!el?.name || el.type === 'LINK') continue;
    const k = key(el.name);
    if (!byKey.has(k)) {
      byKey.set(k, el);
      order.set(el.name, i);
    }
  }
  return { elements, byKey, order };
}

function refsOf(el) {
  const out = [];
  const text = String(el?.behavior?.value ?? '');
  REF_RE.lastIndex = 0;
  for (const m of text.matchAll(REF_RE)) out.push(m[1]);
  return out;
}

function makeGraph(index) {
  const refs = new Map();
  const readers = new Map();
  for (const el of index.elements) {
    if (!el?.name || el.type === 'LINK') continue;
    const list = [];
    for (const rawName of refsOf(el)) {
      const target = index.byKey.get(key(rawName));
      if (!target) continue;
      list.push(target.name);
      const k = key(target.name);
      if (!readers.has(k)) readers.set(k, []);
      readers.get(k).push(el.name);
    }
    refs.set(el.name, list);
  }
  return { refs, readers };
}

function shortestPath(index, graph, fromName, toName, maxHops = Infinity) {
  const startEl = index.byKey.get(key(fromName));
  const goalEl = index.byKey.get(key(toName));
  if (!startEl || !goalEl) return null;
  const start = startEl.name, goal = goalEl.name;
  const prev = new Map([[start, null]]);
  const depth = new Map([[start, 0]]);
  const queue = [start];
  let qi = 0;
  while (qi < queue.length) {
    const v = queue[qi++];
    const d = depth.get(v);
    if (v === goal) break;
    if (d >= maxHops) continue;
    const t = index.byKey.get(key(v))?.type;
    if (v !== start && t !== 'VARIABLE' && t !== 'FLOW') continue;
    for (const n of graph.refs.get(v) || []) {
      if (prev.has(n)) continue;
      prev.set(n, v);
      depth.set(n, d + 1);
      queue.push(n);
    }
  }
  if (!prev.has(goal)) return null;
  const path = [];
  for (let cur = goal; cur != null; cur = prev.get(cur)) path.unshift(cur);
  return path;
}

function closure(index, graph, fromName) {
  const start = index.byKey.get(key(fromName))?.name;
  const out = new Set();
  const stack = start ? [start] : [];
  while (stack.length) {
    const v = stack.pop();
    const t = index.byKey.get(key(v));
    if (!t) continue;
    for (const n of graph.refs.get(v) || []) {
      if (out.has(n)) continue;
      out.add(n);
      const nt = index.byKey.get(key(n))?.type;
      if (nt === 'VARIABLE' || nt === 'FLOW') stack.push(n);
    }
  }
  return out;
}

function hasStock(index, names) {
  return [...names].some(n => index.byKey.get(key(n))?.type === 'STOCK');
}

function near(index, graph, fromName, hops) {
  const start = index.byKey.get(key(fromName))?.name;
  const seen = new Set();
  let frontier = start ? [start] : [];
  for (let h = 0; h < hops; h++) {
    const next = [];
    for (const v of frontier) {
      const t = index.byKey.get(key(v))?.type;
      if (h > 0 && t !== 'VARIABLE' && t !== 'FLOW') continue;
      for (const n of graph.refs.get(v) || []) {
        if (seen.has(n)) continue;
        seen.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }
  return new Set([...seen].filter(n => {
    const e = index.byKey.get(key(n));
    return e && e.type !== 'STOCK' && (graph.refs.get(e.name) || []).length > 0;
  }));
}

function instanceLabel(process, colony) {
  return colony == null ? process.id : `${process.id}[${colony}]`;
}

function specError(errors, message, details = {}) {
  errors.push({ kind: 'declaration', message, ...details });
}

function processError(errors, record, message, details = {}) {
  const item = {
    kind: 'process',
    process: record.id,
    colony: record.colony,
    instance: record.instance,
    message,
    ...details
  };
  errors.push(item);
  record.errors.push(item);
}

function validateSpec(plugin) {
  const errors = [];
  const mode = plugin?.enforce ?? 'report';
  if (!MODES.has(mode)) specError(errors, `planet_closure.enforce must be report | classify | planet_v1 | planet_strict (got ${mode})`);
  if (!Array.isArray(plugin?.colonies) || plugin.colonies.length === 0) specError(errors, 'planet_closure.colonies must be a non-empty array');
  else {
    const seen = new Set();
    for (const [i, c] of plugin.colonies.entries()) {
      if (typeof c !== 'string' || !c.trim()) specError(errors, `colonies[${i}] must be a non-empty string`);
      const k = key(c);
      if (seen.has(k)) specError(errors, `duplicate colony token: ${c}`);
      seen.add(k);
    }
  }
  if (!Number.isInteger(plugin?.max_hops) || plugin.max_hops < 1) specError(errors, 'planet_closure.max_hops must be an integer >= 1');
  if (!Array.isArray(plugin?.process_categories) || plugin.process_categories.length === 0) specError(errors, 'planet_closure.process_categories must be a non-empty array');
  if (!Array.isArray(plugin?.processes)) specError(errors, 'planet_closure.processes must be an array');

  const ids = new Set();
  for (const [i, p] of (plugin?.processes || []).entries()) {
    const where = `processes[${i}]`;
    if (!p?.id || typeof p.id !== 'string') specError(errors, `${where}.id is required`);
    else if (ids.has(p.id)) specError(errors, `duplicate process id: ${p.id}`);
    else ids.add(p.id);
    if (!PROCESS_KINDS.has(p?.kind)) specError(errors, `${where}.kind must be extraction | transformation | service`, { process: p?.id ?? null });
    if (!p?.output || typeof p.output !== 'string') specError(errors, `${where}.output is required`, { process: p?.id ?? null });

    if (p?.legacy) {
      if (!p.legacy.switch || typeof p.legacy.switch !== 'string') specError(errors, `${where}.legacy.switch is required`, { process: p?.id ?? null });
      if (!p.legacy.reason) specError(errors, `${where}.legacy.reason is required`, { process: p?.id ?? null });
      continue;
    }

    if (p?.capacity?.kind != null && !CAPACITY_KINDS.has(p.capacity.kind)) specError(errors, `${where}.capacity.kind is invalid`, { process: p?.id ?? null });
    if (p?.capacity?.kind === 'kernel' && !p.capacity.stock) specError(errors, `${where}.capacity.stock is required`, { process: p?.id ?? null });
    if (p?.capacity?.kind === 'constant') {
      if (!p.capacity.parameter) specError(errors, `${where}.capacity.parameter is required`, { process: p?.id ?? null });
      if (!p.capacity.reason) specError(errors, `${where}.capacity.reason is required for constant capacity`, { process: p?.id ?? null });
    }
    if (p?.capacity?.kind === 'unbounded' && !p.capacity.reason) specError(errors, `${where}.capacity.reason is required for unbounded capacity`, { process: p?.id ?? null });

    if (p?.energy?.kind != null && !ENERGY_KINDS.has(p.energy.kind)) specError(errors, `${where}.energy.kind is invalid`, { process: p?.id ?? null });
    if (p?.energy?.kind === 'requests' && !p.energy.request) specError(errors, `${where}.energy.request is required`, { process: p?.id ?? null });
    if (p?.energy?.kind === 'none' && !p.energy.reason) specError(errors, `${where}.energy.reason is required for energy none`, { process: p?.id ?? null });

    if (p?.deposit != null && p.kind !== 'extraction') specError(errors, `${where}.deposit is only valid for extraction`, { process: p?.id ?? null });
    if (p?.deposit?.kind != null && !DEPOSIT_KINDS.has(p.deposit.kind)) specError(errors, `${where}.deposit.kind is invalid`, { process: p?.id ?? null });
    if (p?.deposit?.kind === 'stock' && !p.deposit.stock) specError(errors, `${where}.deposit.stock is required`, { process: p?.id ?? null });

    if (p?.labor?.kind != null && !LABOR_KINDS.has(p.labor.kind)) specError(errors, `${where}.labor.kind is invalid`, { process: p?.id ?? null });
    if (p?.labor?.kind === 'declared' && !p.labor.intensity) specError(errors, `${where}.labor.intensity is required`, { process: p?.id ?? null });
  }

  const dd = plugin?.demand_drivers;
  if (dd != null) {
    if (!Array.isArray(dd.parameters)) specError(errors, 'demand_drivers.parameters must be an array');
    if (!Array.isArray(dd.consumption)) specError(errors, 'demand_drivers.consumption must be an array');
    if (!dd.reason) specError(errors, 'demand_drivers.reason is required');
  }
  return errors;
}

export function auditPlanetClosure(raw, plugin, openBoundariesPlugin) {
  const mode = plugin?.enforce ?? 'report';
  const errors = validateSpec(plugin);
  const counters = {
    processes: 0,
    legacy: 0,
    expected_process_outputs: 0,
    P2: { kernel: 0, exceptions: 0, undeclared: 0 },
    P3: { requests: 0, producer: 0, exceptions: 0, undeclared: 0 },
    P4: { with_deposit: 0, without_deposit: 0 },
    P5: { declared: 0, undeclared: 0 },
    P6: { drivers: 0 }
  };
  const processes = [];
  const exceptions = [];
  const undeclared = [];
  const reversibility = [];
  const modeFailures = [];

  if (!plugin || typeof plugin !== 'object') {
    specError(errors, 'planet_closure plugin must be an object');
    return { type: 'planet_closure', status: 'FAIL', mode, counters, processes, exceptions, undeclared, reversibility, errors, modeFailures };
  }

  const index = buildIndex(raw);
  const graph = makeGraph(index);
  const maxHops = Number.isInteger(plugin.max_hops) ? plugin.max_hops : 4;
  const resolve = name => index.byKey.get(key(name)) || null;

  if (!openBoundariesPlugin) specError(errors, 'planet_closure requires open_boundaries from the same validation');
  const ob = openBoundariesPlugin ? auditOpenBoundaries(raw, openBoundariesPlugin) : null;
  if (ob?.specErrors?.length) {
    for (const e of ob.specErrors) specError(errors, `open_boundaries spec: ${e}`);
  }

  const instances = [];
  for (const p of plugin.processes || []) {
    const colonies = String(p?.output ?? '').includes('{C}') ? (plugin.colonies || []) : [null];
    for (const colony of colonies) instances.push({ p, colony });
  }

  const declaredOutputs = new Map();
  for (const { p, colony } of instances) {
    const requested = expand(p.output, colony);
    const output = resolve(requested);
    if (!output) {
      specError(errors, `unresolved output ${requested}`, { process: p.id ?? null, colony });
      continue;
    }
    const k = key(output.name);
    if (!declaredOutputs.has(k)) declaredOutputs.set(k, []);
    declaredOutputs.get(k).push(instanceLabel(p, colony));
  }
  for (const [k, labels] of declaredOutputs) {
    if (labels.length > 1) specError(errors, `output declared ${labels.length} times: ${resolve(k)?.name ?? k}`, { instances: labels });
  }

  const expected = [];
  if (ob && !ob.specErrors?.length) {
    for (const id of plugin.process_categories || []) {
      const category = ob.byCategory?.[id];
      if (!category) {
        specError(errors, `process category not found in open_boundaries: ${id}`);
        continue;
      }
      for (const name of category.flows || []) {
        const output = resolve(name);
        if (output?.type === 'FLOW' && output.from == null && !expected.some(x => key(x) === key(output.name))) expected.push(output.name);
      }
    }
  }
  counters.expected_process_outputs = expected.length;
  for (const name of expected) {
    if (!declaredOutputs.has(key(name))) undeclared.push({ kind: 'process', output: name });
  }

  const addPath = (record, field, path) => {
    if (path) record.paths[field] = path;
    return path;
  };
  const within = (from, to) => shortestPath(index, graph, from, to, maxHops);

  for (const { p, colony } of instances) {
    const record = {
      id: p.id ?? null,
      colony,
      instance: instanceLabel(p, colony),
      kind: p.kind ?? null,
      output: null,
      legacy: Boolean(p.legacy),
      declarations: {
        capacity: p.capacity ?? null,
        energy: p.energy ?? null,
        deposit: p.deposit ?? null,
        labor: p.labor ?? null
      },
      paths: {},
      errors: [],
      status: 'PASS'
    };
    processes.push(record);

    const outputName = expand(p.output, colony);
    const output = resolve(outputName);
    record.output = output?.name ?? outputName;
    if (!output) {
      processError(errors, record, `output does not resolve: ${outputName}`, { reference: outputName });
      record.status = 'FAIL';
      continue;
    }

    let depositStock = null;
    if (p.deposit?.kind === 'stock') {
      const depositName = expand(p.deposit.stock, colony);
      depositStock = resolve(depositName);
      if (!depositStock) processError(errors, record, `deposit stock does not resolve: ${depositName}`, { reference: depositName });
    }

    if (p.kind !== 'service') {
      const validSource = output.type === 'FLOW'
        && (output.from == null || (p.kind === 'extraction' && depositStock && key(output.from) === key(depositStock.name)));
      if (!validSource) processError(errors, record, 'output must be a FLOW from ∅, or extraction from its declared deposit stock');
    }

    if (p.legacy) {
      counters.legacy++;
      const switchName = expand(p.legacy.switch, colony);
      const sw = resolve(switchName);
      if (!sw) processError(errors, record, `legacy switch does not resolve: ${switchName}`, { reference: switchName });
      record.status = record.errors.length ? 'FAIL' : 'PASS';
      continue;
    }

    counters.processes++;
    const outputClosure = closure(index, graph, output.name);

    const cap = p.capacity || {};
    if (cap.kind === 'kernel') {
      const stockName = expand(cap.stock, colony);
      const stock = resolve(stockName);
      if (!stock) processError(errors, record, `capacity stock does not resolve: ${stockName}`, { reference: stockName });
      else if (stock.type !== 'STOCK') processError(errors, record, `capacity stock ${stock.name} is not a STOCK`);
      else {
        const path = addPath(record, 'capacity', within(output.name, stock.name));
        if (!path) processError(errors, record, `output does not read capacity stock ${stock.name} within ${maxHops} references`);
        else counters.P2.kernel++;
      }
    } else if (cap.kind === 'constant') {
      const parameterName = expand(cap.parameter, colony);
      const parameter = resolve(parameterName);
      if (!parameter) processError(errors, record, `capacity parameter does not resolve: ${parameterName}`, { reference: parameterName });
      else if (parameter.type !== 'VARIABLE') processError(errors, record, `capacity parameter ${parameter.name} is not a VARIABLE`);
      else if (hasStock(index, closure(index, graph, parameter.name))) processError(errors, record, `capacity parameter ${parameter.name} depends on a STOCK`);
      else {
        const path = addPath(record, 'capacity', within(output.name, parameter.name));
        if (!path) processError(errors, record, `output does not read capacity parameter ${parameter.name} within ${maxHops} references`);
        else {
          counters.P2.exceptions++;
          exceptions.push({ dimension: 'P2', process: record.id, colony, instance: record.instance, kind: 'constant', value: parameter.name, reason: cap.reason });
          const own = new Set([...outputClosure, output.name]);
          const outside = (graph.readers.get(key(parameter.name)) || []).filter(n => !own.has(n));
          for (const reader of outside) reversibility.push({
            process: record.id,
            colony,
            instance: record.instance,
            parameter: parameter.name,
            reader
          });
        }
      }
    } else if (cap.kind === 'unbounded') {
      counters.P2.exceptions++;
      exceptions.push({ dimension: 'P2', process: record.id, colony, instance: record.instance, kind: 'unbounded', value: null, reason: cap.reason });
    } else {
      counters.P2.undeclared++;
    }

    const en = p.energy || {};
    if (en.kind === 'requests') {
      const requestName = expand(en.request, colony);
      const request = resolve(requestName);
      const totalName = expand(plugin.energy?.total_request, colony);
      const total = resolve(totalName);
      const fulfillmentName = expand(plugin.energy?.fulfillment, colony);
      const fulfillment = resolve(fulfillmentName);
      if (!request) processError(errors, record, `energy request does not resolve: ${requestName}`, { reference: requestName });
      else if (request.type !== 'VARIABLE') processError(errors, record, `energy request ${request.name} is not a VARIABLE`);
      if (!total) processError(errors, record, `energy total_request does not resolve: ${totalName}`, { reference: totalName });
      if (!fulfillment) processError(errors, record, `energy fulfillment does not resolve: ${fulfillmentName}`, { reference: fulfillmentName });

      if (request && total && fulfillment) {
        const requestPath = addPath(record, 'energy_total_to_request', within(total.name, request.name));
        const fulfillmentPath = addPath(record, 'energy_output_to_fulfillment', within(output.name, fulfillment.name));
        if (!requestPath) processError(errors, record, `${request.name} is not read by ${total.name} within ${maxHops} references`);
        if (!fulfillmentPath) processError(errors, record, `output does not read ${fulfillment.name} within ${maxHops} references`);

        if (requestPath && fulfillmentPath) {
          const fromRequest = near(index, graph, request.name, maxHops);
          const fromOutput = near(index, graph, output.name, maxHops);
          const shared = [...fromRequest].filter(n => fromOutput.has(n));
          shared.sort((a, b) => (index.order.get(a) ?? Number.MAX_SAFE_INTEGER) - (index.order.get(b) ?? Number.MAX_SAFE_INTEGER));
          if (!shared.length) processError(errors, record, `energy request ${request.name} shares no planned-rate element with the output within ${maxHops} references`);
          else {
            const planned = shared[0];
            record.paths.energy_shared_planned = {
              element: planned,
              request: within(request.name, planned),
              output: within(output.name, planned)
            };
            counters.P3.requests++;
          }
        }
      }
    } else if (en.kind === 'producer') {
      if (p.kind !== 'service') processError(errors, record, 'energy producer is only valid for a service');
      else counters.P3.producer++;
    } else if (en.kind === 'none') {
      counters.P3.exceptions++;
      exceptions.push({ dimension: 'P3', process: record.id, colony, instance: record.instance, kind: 'none', value: null, reason: en.reason });
    } else {
      counters.P3.undeclared++;
    }

    if (p.kind === 'extraction') {
      const dep = p.deposit || {};
      if (dep.kind === 'stock') {
        if (!depositStock) {
          // The unresolved-name error above is sufficient.
        } else if (depositStock.type !== 'STOCK') {
          processError(errors, record, `deposit ${depositStock.name} is not a STOCK`);
        } else if (key(output.from) !== key(depositStock.name)) {
          processError(errors, record, `deposit stock ${depositStock.name} is not the source of ${output.name}`);
        } else {
          counters.P4.with_deposit++;
        }
      } else {
        counters.P4.without_deposit++;
      }
    }

    const labor = p.labor || {};
    if (labor.kind === 'declared') {
      const intensityName = expand(labor.intensity, colony);
      const intensity = resolve(intensityName);
      if (!intensity) processError(errors, record, `labor intensity does not resolve: ${intensityName}`, { reference: intensityName });
      else if (intensity.type !== 'VARIABLE') processError(errors, record, `labor intensity ${intensity.name} is not a VARIABLE`);
      else {
        const readers = graph.readers.get(key(intensity.name)) || [];
        if (!readers.length) processError(errors, record, `labor intensity ${intensity.name} is not read by any formula`);
        else {
          record.paths.labor_readers = readers;
          counters.P5.declared++;
        }
      }
    } else {
      counters.P5.undeclared++;
    }

    record.status = record.errors.length ? 'FAIL' : 'PASS';
  }

  const dd = plugin.demand_drivers;
  if (dd) {
    for (const colony of plugin.colonies || []) {
      const consumption = [];
      for (const template of dd.consumption || []) {
        const requested = expand(template, colony);
        const el = resolve(requested);
        if (!el) specError(errors, `demand consumption does not resolve: ${requested}`, { colony, reference: requested });
        else consumption.push(el);
      }
      for (const template of dd.parameters || []) {
        const requested = expand(template, colony);
        const parameter = resolve(requested);
        if (!parameter) {
          specError(errors, `demand driver does not resolve: ${requested}`, { colony, reference: requested });
          continue;
        }
        if (parameter.type !== 'VARIABLE') {
          specError(errors, `demand driver ${parameter.name} is not a VARIABLE`, { colony });
          continue;
        }
        if (hasStock(index, closure(index, graph, parameter.name))) {
          specError(errors, `demand driver ${parameter.name} depends on a STOCK`, { colony });
          continue;
        }
        let best = null;
        for (const flow of consumption) {
          const path = shortestPath(index, graph, flow.name, parameter.name, Infinity);
          if (path && (!best || path.length < best.path.length)) best = { consumption: flow.name, path };
        }
        if (!best) {
          specError(errors, `demand driver ${parameter.name} is not read by declared consumption in colony ${colony}`, { colony });
          continue;
        }
        counters.P6.drivers++;
      }
    }
  }

  if (mode === 'classify' && undeclared.length) modeFailures.push({ dimension: 'processes', count: undeclared.length, message: 'undeclared process outputs' });
  if (mode === 'planet_v1' || mode === 'planet_strict') {
    if (undeclared.length) modeFailures.push({ dimension: 'processes', count: undeclared.length, message: 'undeclared process outputs' });
    if (counters.P2.undeclared) modeFailures.push({ dimension: 'P2', count: counters.P2.undeclared, message: 'undeclared capacity roles' });
    if (counters.P3.undeclared) modeFailures.push({ dimension: 'P3', count: counters.P3.undeclared, message: 'undeclared energy roles' });
    if (counters.P4.without_deposit) modeFailures.push({ dimension: 'P4', count: counters.P4.without_deposit, message: 'extraction processes without deposit stocks' });
    if (counters.P5.undeclared) modeFailures.push({ dimension: 'P5', count: counters.P5.undeclared, message: 'undeclared labor roles' });
    if (!dd || !(dd.parameters || []).length || counters.P6.drivers === 0) modeFailures.push({ dimension: 'P6', count: 0, message: 'demand drivers are not declared' });
    if (reversibility.length) modeFailures.push({ dimension: 'reversibility', count: reversibility.length, message: 'constant-capacity reversibility violations' });
  }
  if (mode === 'planet_strict') {
    const p2 = exceptions.filter(x => x.dimension === 'P2').length;
    const p3 = exceptions.filter(x => x.dimension === 'P3').length;
    if (p2) modeFailures.push({ dimension: 'P2 exceptions', count: p2, message: 'capacity exceptions are not allowed in planet_strict' });
    if (p3) modeFailures.push({ dimension: 'P3 exceptions', count: p3, message: 'energy exceptions are not allowed in planet_strict' });
  }

  const status = errors.length || modeFailures.length ? 'FAIL' : 'PASS';
  return {
    type: 'planet_closure',
    status,
    mode,
    counters,
    processes,
    exceptions,
    undeclared,
    reversibility,
    errors,
    modeFailures
  };
}
