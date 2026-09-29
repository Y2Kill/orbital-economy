# v7.7.6 — Ore Capital — test plan

Статус: **r1** (2026-09-29). К `V7_7_6_ARCHITECTURE_SPEC.md`. Пороги **[calib]** — по первому прогону `candidate.yml`, с запасом и обоснованием в отчёте.

**Исполнимость проверена исполнением.** Черновик `draft/validation-v7.7.6-draft.json` содержит все проверки ниже с порогами, взятыми с запасом от skeleton; прогнан стендом на skeleton во всех 42 Modes (итог — в спецификации §6) и прошёл `check-validation` (Lab v0.9.10) с 0 ошибок. С v0.9.10 форма validation проверяется строго: незнакомое поле, окно не той формы, проверка без `name` — статическая ошибка до симуляции. Перед push прогоняй свою validation через `node src/cli.js check-validation <validation.json> <candidate.json>` (в CI это делает `candidate.yml` в составе стадии validation).

## 1. HARD и REGRESSION

- все проверки v7.7.5 сохраняются без ослабления;
- `regression_modes` = 0–39 (`changed = 0`, `maxAbs = 0`);
- плагин `simple_capital` (уже в черновике, 4 экземпляра) — статика и прогон во **всех** Modes.

## 2. Механика выключена — Modes 0–39

Для A и B: `X Ore Mine Expansion`, `… Desired Expansion`, `… Capital Goods Consumption`, `… Construction Materials Consumption`, `… Capacity Depreciation`, `… Capacity Retirement` — max ≤ 0 (`metric`, `tolerance: 0`).

Тождества «эффективная мощность = прежняя константа» в Modes 0–39 **не** ставятся: в Modes с шоком Test 18 и с «обратным преимуществом» Test 4 эффективная мощность отличается от `X Mining Capacity` по построению, а точность Modes 0–39 и так гарантирует регрессия.

## 3. Тождества — Modes 40–41

Для A и B (`identity`):
- `X Ore Mine Capital Goods Consumption − 0.5 × X Ore Mine Expansion = 0`;
- `X Ore Mine Construction Materials Consumption − 0.5 × X Ore Mine Expansion = 0`;
- `X Effective Mining Capacity − X Ore Mine Capacity = 0` (шоков Test 18 и Test 4 в 40–41 нет) — **только в Modes 40–41**, где переключатель включён (урок задачи 017: тождество включённого узла, перенесённое в Modes с выключенным, ложно по построению);
- все парные тождества Modes 38–39 — в Modes 40–41 тоже (в черновике перенесены).

## 4. Сценарные ожидания

### Mode 40 — baseline

- шахта A растёт сверх стартовой мощности: `A Ore Mine Capacity` max > **[calib]** (`metric`; skeleton ≈ 75.4 при старте 70);
- шахта B сворачивается: изменение `0 → 1080` < −**[calib]** (`change`; skeleton ≈ −16.1);
- B не строит после стартовой подстройки сигнала: `B Ore Mine Expansion` max в `window [1, 1080]` ≤ 1e-6 (`metric`).

### Mode 41 — transport surge

- **B строит шахту заново** — главная проверка: `B Ore Mine Expansion` max в `window [360, 720]` > **[calib]** (`metric`; skeleton ≈ 0.040) и `B Ore Mine Capacity` изменение `360 → 720` > **[calib]** (`change`; skeleton ≈ +8.2);
- расход реален: `B Ore Mine Capital Goods Consumption` max в окне > 0 (`metric`);
- B добывает на уровне всплеска: `B Mining Rate` max в окне > **[calib]** (`metric`; skeleton ≈ 23.1);
- запас руды B проседает, пока шахта растёт: `B Ore Inventory` min в окне < **[calib]** (`metric`; skeleton ≈ 2394; в v7.7.5 Mode 39 ≈ 2481);
- до окна шахта B не строится: `event_absent`, `event: {column: "B Ore Mine Expansion", op: ">", value: 1e-6, window: [1, 359.75]}`.

## 5. Что не проверяется

- сравнения между Modes и с v7.7.5 — в отчёте числами;
- стартовая подстройка сигнала (дни 0–1) — свойство генератора (спецификация §1).
