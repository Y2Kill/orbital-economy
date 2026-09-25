// Exogenous parameter registry.
//
// Everything the model does not derive itself is set "from outside": numeric VARIABLE constants,
// numeric STOCK initial values, switches and test-harness multipliers. The registry is generated
// from the ModelJSON (so it cannot go stale) and merged with a hand-maintained annotations file
// that records, per parameter, its role, what it changes in behaviour and the evidence for that.
// Unannotated parameters are listed as coverage debt; asymmetric A/B pairs are singled out because
// they are what defines comparative advantage between the colonies.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, sha256File, nowIso, writeJson, ensureDir } from './util.js';

const NUM_RE = /^\s*-?\d+(\.\d+)?([eE][-+]?\d+)?\s*$/;
export function isNumeric(v) { return typeof v === 'number' || (typeof v === 'string' && NUM_RE.test(v)); }

const SECTOR_RULES = [
  ['Test', /^(Test |Timed Test|v7\.\d |Reverse |Priority Stress |Cheap Energy |Legacy |Two Good |Two Industry |Transport Demand Surge|Low Demand Multiplier|Electronics Demand Surge Multiplier|Generation Capacity Shock)/],
  ['Switch', /(Enabled)$/],
  ['Electronics', /Electronics|Feedstock/],
  ['Power', /Power|Energy|Generation/],
  ['Transport', /Transport|Freight|Cargo|Travel|Shipment|Load/],
  ['Trade', /Import|Export|Trade|Landed|Contract/],
  ['Metal', /Metal|Ore|Mining|Smelt|Refinery/],
  ['Labor', /Wage|Labor/]
];
function sector(name) { for (const [s, re] of SECTOR_RULES) if (re.test(name)) return s; return 'Other'; }
function colony(name) { return /^A /.test(name) ? 'A' : /^B /.test(name) ? 'B' : 'global'; }
function mirrorName(name) { return /^A /.test(name) ? 'B ' + name.slice(2) : /^B /.test(name) ? 'A ' + name.slice(2) : null; }

export function inventory(raw, { scenarioKeys = null } = {}) {
  const els = (raw.elements || []).filter(e => e && e.type !== 'LINK' && e.name);
  const byName = new Map(els.map(e => [e.name, e]));
  const switchKeys = new Set(scenarioKeys || []);
  for (const s of raw.scenarios || []) for (const k of Object.keys(s.values || {})) switchKeys.add(k);
  const items = [];
  for (const e of els) {
    let kind = null, value = null;
    if (e.type === 'VARIABLE' && isNumeric(e.behavior?.value)) { kind = 'constant'; value = Number(e.behavior.value); }
    else if (e.type === 'STOCK' && isNumeric(e.behavior?.initial_value)) { kind = 'initial_stock'; value = Number(e.behavior.initial_value); }
    else continue;
    if (switchKeys.has(e.name)) kind = 'switch';
    const sec = sector(e.name);
    if (sec === 'Test' && kind === 'constant') kind = 'test_wiring';
    items.push({ name: e.name, kind, value, colony: colony(e.name), sector: sec, description: e.description || null });
  }
  // A/B pairing
  const byN = new Map(items.map(i => [i.name, i]));
  for (const i of items) {
    const m = mirrorName(i.name);
    if (!m) continue;
    const mi = byN.get(m);
    i.mirror = m;
    i.mirror_value = mi ? mi.value : null;
    i.asymmetric = mi ? mi.value !== i.value : null;
  }
  // scenario-set values
  const scenarioValues = {};
  for (const s of raw.scenarios || []) for (const [k, v] of Object.entries(s.values || {})) { (scenarioValues[k] = scenarioValues[k] || {})[s.values?.['Timed Test Mode'] ?? s.name] = v; }
  for (const i of items) if (scenarioValues[i.name]) i.scenario_values = scenarioValues[i.name];
  items.sort((a, b) => a.sector.localeCompare(b.sector) || a.name.localeCompare(b.name));
  return items;
}

export function validateAnnotations(ann) {
  const errors = [];
  if (!ann || typeof ann !== 'object' || Array.isArray(ann)) return ['annotations must be an object'];
  if (ann.format !== 'orbital-economy-parameter-annotations-v1') errors.push('format must be orbital-economy-parameter-annotations-v1');
  if (!ann.parameters || typeof ann.parameters !== 'object') errors.push('parameters must be an object keyed by primitive name');
  for (const [i, e] of (ann.embedded_literals || []).entries()) {
    for (const f of ['element', 'literal', 'role', 'effect']) if (e?.[f] == null) errors.push(`embedded_literals[${i}]: "${f}" is required`);
  }
  for (const [name, a] of Object.entries(ann.parameters || {})) {
    if (!a || typeof a !== 'object') { errors.push(`${name}: annotation must be an object`); continue; }
    for (const f of ['role', 'effect']) if (!a[f] || typeof a[f] !== 'string') errors.push(`${name}: "${f}" (string) is required`);
  }
  return errors;
}

export function buildRegistry(raw, annotations = null) {
  const items = inventory(raw);
  const ann = annotations?.parameters || {};
  const known = new Set(items.map(i => i.name));
  const unknownAnnotations = Object.keys(ann).filter(n => !known.has(n));
  for (const i of items) {
    const a = ann[i.name] || (i.mirror && ann[i.mirror]?.applies_to_mirror ? ann[i.mirror] : null);
    if (a) i.annotation = { role: a.role, effect: a.effect, evidence: a.evidence || null, since: a.since || null, tags: a.tags || [] };
  }
  // Literals embedded in formulas (e.g. a constant folded into an IfThenElse switch) are invisible to the
  // inventory; the annotations file lists them explicitly and the report checks that the element exists.
  const elNames = new Set((raw.elements || []).filter(e => e && e.type !== 'LINK' && e.name).map(e => e.name));
  const embeddedLiterals = (annotations?.embedded_literals || []).map(e => ({ ...e, element_exists: elNames.has(e.element) }));
  const annotated = items.filter(i => i.annotation).length;
  const asymmetric = items.filter(i => i.asymmetric === true && i.colony === 'A');
  return {
    format: 'orbital-economy-parameter-registry-v1',
    summary: {
      total: items.length,
      byKind: count(items, 'kind'),
      bySector: count(items, 'sector'),
      byColony: count(items, 'colony'),
      annotated, unannotated: items.length - annotated,
      asymmetricPairs: asymmetric.length,
      asymmetricUnannotated: asymmetric.filter(i => !i.annotation).length
    },
    unknownAnnotations,
    embeddedLiterals,
    asymmetricPairs: asymmetric.map(i => ({ name: i.name.slice(2), A: i.value, B: i.mirror_value, annotated: !!i.annotation, sector: i.sector })),
    items
  };
}
function count(items, key) { const o = {}; for (const i of items) o[i[key]] = (o[i[key]] || 0) + 1; return o; }

function esc(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' '); }
function fmt(v) { return typeof v === 'number' ? String(v) : esc(v); }

export function writeRegistryReports(outDir, report) {
  ensureDir(outDir);
  writeJson(path.join(outDir, 'parameter-registry.json'), report);
  const l = [];
  l.push('# Orbital Economy — реестр внешних параметров');
  l.push('');
  l.push(`- generated: ${report.generated}`);
  l.push(`- model: ${esc(report.model.name)} — SHA-256 \`${report.model.sha256}\``);
  l.push(`- annotations: ${report.annotations ? `${esc(report.annotations.file)} (SHA-256 \`${report.annotations.sha256}\`)` : 'none'}`);
  l.push('');
  l.push('Всё, что модель не выводит сама: числовые константы, начальные запасы, переключатели, тестовые множители. Инвентарь сгенерирован из ModelJSON; аннотации («роль / что меняет / доказательство») ведутся вручную и версионируются вместе с baseline.');
  l.push('');
  const s = report.summary;
  l.push('## Сводка');
  l.push('');
  l.push(`- внешних величин: **${s.total}** (константы ${s.byKind.constant || 0}, начальные запасы ${s.byKind.initial_stock || 0}, переключатели ${s.byKind.switch || 0}, тестовая обвязка ${s.byKind.test_wiring || 0})`);
  l.push(`- по колониям: A ${s.byColony.A || 0}, B ${s.byColony.B || 0}, глобальные ${s.byColony.global || 0}`);
  l.push(`- аннотировано: **${s.annotated} / ${s.total}** (${(100 * s.annotated / Math.max(1, s.total)).toFixed(0)} %)`);
  l.push(`- несимметричных пар A/B: **${s.asymmetricPairs}**, из них без аннотации: **${s.asymmetricUnannotated}**`);
  if (report.unknownAnnotations.length) l.push(`- **WARN** аннотации на несуществующие примитивы: ${report.unknownAnnotations.map(esc).join(', ')}`);
  l.push('');
  l.push('## Несимметричные пары A/B — что задаёт различия колоний');
  l.push('');
  l.push('Это единственные внешние величины, в которых A и B отличаются; всё остальное различие поведения колоний — их следствие.');
  l.push('');
  l.push('| Параметр (без префикса) | Сектор | A | B | Аннотация |');
  l.push('|---|---|---:|---:|---|');
  const byName = new Map(report.items.map(i => [i.name, i]));
  for (const p of report.asymmetricPairs) {
    const a = byName.get('A ' + p.name)?.annotation;
    l.push(`| ${esc(p.name)} | ${p.sector} | ${fmt(p.A)} | ${fmt(p.B)} | ${a ? esc(a.effect) : '_нет_'} |`);
  }
  l.push('');
  if (report.embeddedLiterals?.length) {
    l.push('## Литералы, встроенные в формулы (не видны инвентарю)');
    l.push('');
    l.push('| Элемент | Литерал | Роль | Что меняет |');
    l.push('|---|---:|---|---|');
    for (const e of report.embeddedLiterals) l.push(`| ${esc(e.element)}${e.element_exists ? '' : ' **(нет в модели)**'} | ${esc(e.literal)} | ${esc(e.role)} | ${esc(e.effect)} |`);
    l.push('');
  }
  l.push('## Аннотированные параметры');
  l.push('');
  l.push('| Параметр | Вид | Значение | Роль | Что меняет в поведении | Доказательство |');
  l.push('|---|---|---:|---|---|---|');
  for (const i of report.items.filter(i => i.annotation)) l.push(`| ${esc(i.name)} | ${i.kind} | ${fmt(i.value)}${i.mirror_value != null && i.asymmetric ? ` / ${fmt(i.mirror_value)}` : ''} | ${esc(i.annotation.role)} | ${esc(i.annotation.effect)} | ${esc(i.annotation.evidence || '')} |`);
  l.push('');
  l.push('## Полный инвентарь по секторам');
  l.push('');
  const sectors = [...new Set(report.items.map(i => i.sector))];
  for (const sec of sectors) {
    l.push(`### ${sec}`);
    l.push('');
    l.push('| Параметр | Вид | Колония | Значение | Зеркало | Описание в модели | Аннотация |');
    l.push('|---|---|---|---:|---:|---|:---:|');
    for (const i of report.items.filter(i => i.sector === sec)) {
      const mirror = i.mirror ? (i.mirror_value == null ? '**нет пары**' : (i.asymmetric ? `**${fmt(i.mirror_value)}**` : '=')) : '';
      const sv = i.scenario_values ? ` (сценарии: ${esc(JSON.stringify(i.scenario_values)).slice(0, 60)}…)` : '';
      l.push(`| ${esc(i.name)} | ${i.kind} | ${i.colony} | ${fmt(i.value)}${sv} | ${mirror} | ${esc(i.description || '')} | ${i.annotation ? '✓' : ''} |`);
    }
    l.push('');
  }
  fs.writeFileSync(path.join(outDir, 'parameter-registry.md'), l.join('\n'), 'utf8');
}

export function runParametersCommand({ modelFile, annotationsFile = null, outDir }) {
  const raw = readJson(modelFile);
  let annotations = null;
  if (annotationsFile) {
    annotations = readJson(annotationsFile);
    const errs = validateAnnotations(annotations);
    if (errs.length) throw new Error(`Invalid annotations file:\n  - ${errs.join('\n  - ')}`);
  }
  const report = { generated: nowIso(), model: { file: path.resolve(modelFile), name: raw.name || null, sha256: sha256File(modelFile) },
    annotations: annotationsFile ? { file: path.resolve(annotationsFile), sha256: sha256File(annotationsFile) } : null,
    ...buildRegistry(raw, annotations) };
  writeRegistryReports(outDir, report);
  const s = report.summary;
  console.log('Orbital Economy Lab - exogenous parameter registry');
  console.log(`Model: ${raw.name}`);
  console.log(`Parameters: ${s.total} (constants ${s.byKind.constant || 0}, initial stocks ${s.byKind.initial_stock || 0}, switches ${s.byKind.switch || 0}, test wiring ${s.byKind.test_wiring || 0})`);
  console.log(`Annotated: ${s.annotated}/${s.total}; asymmetric A/B pairs: ${s.asymmetricPairs} (unannotated: ${s.asymmetricUnannotated})`);
  if (report.unknownAnnotations.length) console.log(`[WARN] annotations for unknown primitives: ${report.unknownAnnotations.join(', ')}`);
  console.log(`Report: ${path.join(outDir, 'parameter-registry.md')}`);
  return report;
}
