import { loadModelJSON } from './engine.js';
import { deepClone } from './util.js';

export function scenarioMode(scenario, index, modeVariable = 'Timed Test Mode') {
  const v = scenario?.values?.[modeVariable];
  return (typeof v === 'number' && Number.isFinite(v)) ? v : index;
}

export function listScenarios(rawModel, modeVariable = 'Timed Test Mode') {
  const scenarios = Array.isArray(rawModel.scenarios) ? rawModel.scenarios : [];
  return scenarios.map((s, i) => ({
    index: i,
    mode: scenarioMode(s, i, modeVariable),
    name: s.name || `Scenario ${i}`,
    description: s.description || '',
    values: s.values || {}
  }));
}

function applyValueToElement(el, value) {
  el.behavior = el.behavior || {};
  switch (el.type) {
    case 'VARIABLE':
    case 'FLOW':
    case 'TRANSITION':
      el.behavior.value = value;
      return;
    case 'STOCK':
    case 'STATE':
      el.behavior.initial_value = value;
      return;
    default:
      throw new Error(`Сценарий пытается изменить неподдерживаемый тип ${el.type} у элемента ${el.name}`);
  }
}

export function modelJsonForScenario(rawModel, scenario) {
  const data = deepClone(rawModel);
  if (!scenario) return data;
  const map = new Map();
  for (const el of data.elements || []) {
    if (el?.name && el.type !== 'LINK') map.set(el.name.toLowerCase(), el);
  }
  for (const [name, value] of Object.entries(scenario.values || {})) {
    const el = map.get(name.toLowerCase());
    if (!el) throw new Error(`Scenario value element not found: ${name}`);
    applyValueToElement(el, value);
  }
  return data;
}

export function loadAndCheck(modelJson) {
  const model = loadModelJSON(modelJson);
  const errors = model.check();
  return { model, errors };
}

export function valuedPrimitives(model) {
  const out = [];
  for (const p of model.find()) {
    const ctor = p?.constructor?.name;
    if (ctor === 'Link') continue;
    out.push(p);
  }
  return out;
}

export function primitiveMap(model) {
  const m = new Map();
  for (const p of model.find()) {
    if (p?.name) m.set(p.name, p);
  }
  return m;
}
