// Prototype of node type 'money' (full money accounting, step 2; owner decisions 2026-10-17: one consolidated firm
// sector per region, rent and dividends to the households of the same region, freight to the households of both
// regions by their share of trade, a household budget that scales final demand). Research reference for the bench task:
// the bench implementation must reproduce this expansion.
// One switch: every money flow is IfThenElse(SW = 1, flow, 0) — with the switch off the stocks stay at their start and
// no earlier series changes; the budget wraps the declared demand targets.
//   households X: + wages + rent + dividends + transport income; - purchases
//   firms X:      + purchases + export goods; - wages - rent - import goods - import freight - dividends
//                 dividends = Max(0, firm money - wage bill x target days) / payout time
//   transport:    + freight of both directions; - payout = money / payout time, shared by trade share
//   budget:       spending plan = Max(0, smoothed income + (household money - smoothed income x target days) / adjustment);
//                 purchases without "budget" are paid first; demand targets x Max(0, plan - first) / cost of the
//                 unscaled targets at their prices.
// Usage as a library: expandMoney(decl, base) -> { patch: { add_elements, replace_formulas, add_links }, validation }
// Usage as a script:  node money_node_prototype.mjs <decl.json> <base.json> <out.json>
import fs from 'node:fs';

export function expandMoney(decl, base) {
  const byName = new Map(base.elements.filter(e => e.type !== 'LINK' && e.name).map(e => [e.name, e]));
  const C = decl.colonies, SW = decl.switch, ON = `[${SW}] = 1`, I = decl.inputs, T = decl.trade;
  const sub = (t, X, Y) => t.replaceAll('{C}', X).replaceAll('{from}', X).replaceAll('{to}', Y ?? '');
  const must = n => { const e = byName.get(n); if (!e) throw new Error(`money: base element missing: ${n}`); return e; };
  const val = n => String(must(n).behavior.value);
  const add = [], rep = [];
  const note = n => `Money node: ${n}.`;
  const V = (name, value, d) => add.push({ type: 'VARIABLE', name, behavior: { value }, description: note(d || name) });
  const S = (name, initial, d) => add.push({ type: 'STOCK', name, behavior: { initial_value: initial, non_negative: false }, description: note(d || name) });
  const F = (name, from, to, value, d) => add.push({ type: 'FLOW', name, from, to, behavior: { value: `IfThenElse(${ON}, ${value}, 0)`, non_negative: false }, description: note(d || name) });
  const wrap = (name, fresh, oldRef) => { const old = oldRef ?? val(name); rep.push({ name, value: `IfThenElse(${ON}, ${fresh}, ${old})` }); };
  if (byName.has(SW)) throw new Error(`money: switch "${SW}" already exists in base`);
  const pairs = C.flatMap(X => C.filter(Y => Y !== X).map(Y => [X, Y]));
  const refsOf = v => [...new Set([...String(v).matchAll(/\[([^\]]+)\]/g)].map(m => m[1]))];
  for (const X of C) {
    must(sub(I.wage, X)); must(sub(I.employment, X));
    for (const r of decl.rents) { must(sub(r.price, X)); must(sub(r.quantity, X)); }
    for (const p of decl.purchases) { must(sub(p.quantity, X)); must(sub(p.price, X)); if (p.budget) { const e = must(sub(p.budget, X)); if (e.type !== 'VARIABLE') throw new Error(`money: ${e.name} must be a VARIABLE`); } }
  }
  for (const [X, Y] of pairs) {
    for (const g of [...T.goods, ...T.freight]) must(sub(g, X, Y));
    must(sub(T.food.arrival, X, Y));
  }
  must(T.food.freight_weight); must(T.food.freight_price);

  V(SW, 0, 'switch of money accounting and household budgets (0 = every earlier series unchanged)');
  for (const [k, v] of Object.entries(decl.parameters)) V(k, v, `parameter ${k}`);
  const goodsValue = (X, Y) => [...T.goods.map(g => `[${sub(g, X, Y)}]`), `[${sub(T.food.arrival, X, Y)}] * [${sub(T.food.price, X)}]`].join(' + ');
  const freightValue = (X, Y) => [...T.freight.map(g => `[${sub(g, X, Y)}]`), `[${sub(T.food.arrival, X, Y)}] * [${T.food.freight_weight}] * [${T.food.freight_price}]`].join(' + ');
  for (const X of C) {
    const others = C.filter(Y => Y !== X);
    V(`${X} Wage Bill`, `[${sub(I.wage, X)}] * [${sub(I.employment, X)}]`, 'wages paid by the firms of the region');
    V(`${X} Rent Payments`, decl.rents.map(r => `[${sub(r.price, X)}] * [${sub(r.quantity, X)}]`).join(' + '), 'rent paid to the households (the old base prices)');
    V(`${X} Household Purchases`, decl.purchases.map(p => `[${sub(p.quantity, X)}] * [${sub(p.price, X)}]`).join(' + '), 'household purchases at market prices');
    V(`${X} Export Goods Revenue`, others.map(Y => goodsValue(X, Y)).join(' + '), 'value of goods delivered to other regions');
    V(`${X} Import Goods Payments`, others.map(Y => goodsValue(Y, X)).join(' + '), 'value of goods delivered from other regions');
    V(`${X} Import Freight Payments`, others.map(Y => freightValue(Y, X)).join(' + '), 'freight on goods delivered from other regions');
    V(`${X} Firm Target Money`, `[${X} Wage Bill] * [Firm Money Target Days]`);
    V(`${X} Dividends`, `Max(0, [${X} Firm Money] - [${X} Firm Target Money]) / [Dividend Payout Time]`, 'dividends paid to the households');
    V(`${X} Firm Net Cash Flow`, `[${X} Household Purchases] + [${X} Export Goods Revenue] - [${X} Wage Bill] - [${X} Rent Payments] - [${X} Import Goods Payments] - [${X} Import Freight Payments]`);
    V(`${X} Balance of Payments`, `[${X} Export Goods Revenue] - [${X} Import Goods Payments] - [${X} Import Freight Payments]`);
  }
  V('Total Trade Value', C.map(X => `[${X} Export Goods Revenue] + [${X} Import Goods Payments]`).join(' + '));
  V('Transport Payout', '[Transport Money] / [Transport Payout Time]', 'freight paid out to the households');
  for (const X of C) {
    V(`${X} Trade Share`, `IfThenElse([Total Trade Value] > 0.000001, ([${X} Export Goods Revenue] + [${X} Import Goods Payments]) / [Total Trade Value], 1 / ${C.length})`);
    V(`${X} Transport Income`, `[Transport Payout] * [${X} Trade Share]`);
    V(`${X} Household Income`, `[${X} Wage Bill] + [${X} Rent Payments] + [${X} Dividends] + [${X} Transport Income]`);
    V(`${X} Household Saving`, `[${X} Household Income] - [${X} Household Purchases]`);
  }
  for (const X of C) {
    const init = decl.initial;
    S(`${X} Household Money`, init.household_money[X], 'money held by the households');
    S(`${X} Firm Money`, init.firm_money[X], 'money held by the consolidated firms');
    S(`${X} Smoothed Household Income`, init.smoothed_income[X], 'household income seen by the spending plan');
    F(`${X} Household Income Flow`, null, `${X} Household Money`, `[${X} Household Income]`);
    F(`${X} Household Purchases Flow`, `${X} Household Money`, null, `[${X} Household Purchases]`);
    F(`${X} Firm Cash Flow`, null, `${X} Firm Money`, `[${X} Firm Net Cash Flow]`);
    F(`${X} Dividend Flow`, `${X} Firm Money`, null, `[${X} Dividends]`);
    F(`${X} Smoothed Income Change`, null, `${X} Smoothed Household Income`, `([${X} Household Income] - [${X} Smoothed Household Income]) / [Household Income Smoothing Time]`);
  }
  S('Transport Money', decl.initial.transport_money, 'freight held by the shared transport');
  F('Transport Freight Income', null, 'Transport Money', C.map(X => `[${X} Import Freight Payments]`).join(' + '));
  F('Transport Payout Flow', 'Transport Money', null, '[Transport Payout]');
  for (const X of C) {
    V(`${X} Household Spending Plan`, `Max(0, [${X} Smoothed Household Income] + ([${X} Household Money] - [${X} Smoothed Household Income] * [Household Money Target Days]) / [Household Money Adjustment Time])`);
    const first = decl.purchases.filter(p => !p.budget), scaled = decl.purchases.filter(p => p.budget);
    V(`${X} First Spending`, first.length ? first.map(p => `[${sub(p.quantity, X)}] * [${sub(p.price, X)}]`).join(' + ') : '0', 'purchases paid before the budgeted goods (need)');
    for (const p of scaled) V(`${X} Unscaled ${sub(p.budget, X).slice(X.length + 1)}`, val(sub(p.budget, X)), `${sub(p.budget, X)} before the budget`);
    V(`${X} Norm Goods Cost`, scaled.map(p => `[${X} Unscaled ${sub(p.budget, X).slice(X.length + 1)}] * [${sub(p.price, X)}]`).join(' + '), 'cost of the unscaled budgeted demand');
    V(`${X} Budget Factor`, `Max(0, [${X} Household Spending Plan] - [${X} First Spending]) / Max([${X} Norm Goods Cost], 0.000001)`);
    for (const p of scaled) {
      const t = sub(p.budget, X), u = `${X} Unscaled ${t.slice(X.length + 1)}`;
      wrap(t, `[${u}] * [${X} Budget Factor]`, `[${u}]`);
    }
  }

  for (const e of add) if (byName.has(e.name)) throw new Error(`money: generated name conflicts with base element "${e.name}"`);
  const added = new Map(add.map(e => [e.name, e]));
  const resolve = n => added.get(n) || byName.get(n);
  const have = new Set(base.elements.filter(e => e.type === 'LINK').map(e => `${e.from}|${e.to}`));
  const links = [];
  for (const [to, v] of [...add.map(e => [e.name, e.behavior.value ?? e.behavior.initial_value]), ...rep.map(r => [r.name, r.value])]) {
    for (const r of refsOf(v)) {
      const src = resolve(r); if (!src) throw new Error(`money: ${to}: unresolved [${r}]`);
      const k = `${src.name}|${to}`; if (!have.has(k)) { have.add(k); links.push({ from: src.name, to }); }
    }
  }
  const validation = {
    money_instances: C.map(X => ({
      name: `${X} money`, colony: X, wage_bill: `${X} Wage Bill`, rent: `${X} Rent Payments`, dividends: `${X} Dividends`, transport_income: `${X} Transport Income`,
      income: `${X} Household Income`, purchases: `${X} Household Purchases`, household_money: `${X} Household Money`, firm_money: `${X} Firm Money`,
      exports: `${X} Export Goods Revenue`, imports: `${X} Import Goods Payments`, import_freight: `${X} Import Freight Payments`, budget_factor: `${X} Budget Factor`
    })),
    money_switch: SW, money_transport: { money: 'Transport Money', payout: 'Transport Payout' },
    money_boundary_flows: [...C.flatMap(X => [`${X} Household Income Flow`, `${X} Household Purchases Flow`, `${X} Firm Cash Flow`, `${X} Dividend Flow`, `${X} Smoothed Income Change`]), 'Transport Freight Income', 'Transport Payout Flow']
  };
  return { patch: { add_elements: add, replace_formulas: rep, add_links: links }, validation };
}

if (process.argv[1] && process.argv[1].endsWith('money_node_prototype.mjs') && process.argv.length >= 5) {
  const [declFile, baseFile, outFile] = process.argv.slice(2);
  const decl = JSON.parse(fs.readFileSync(declFile, 'utf8')), base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const { patch } = expandMoney(decl, base);
  const model = structuredClone(base);
  const idx = new Map(model.elements.map((e, i) => [e.type !== 'LINK' && e.name, i]));
  for (const r of patch.replace_formulas) model.elements[idx.get(r.name)].behavior.value = r.value;
  model.elements.push(...patch.add_elements, ...patch.add_links.map(l => ({ type: 'LINK', ...l })));
  model.name = 'Orbital Economy v7.7.16 money prototype';
  fs.writeFileSync(outFile, JSON.stringify(model));
  console.log(`added ${patch.add_elements.length} elements, ${patch.replace_formulas.length} replacements, ${patch.add_links.length} links`);
}
