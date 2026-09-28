# v7.7.5 — Regolith Capital — test plan

Статус: **r1** (2026-09-28). К `V7_7_5_ARCHITECTURE_SPEC.md`. Пороги **[calib]** — по первому прогону `candidate.yml`, с запасом и обоснованием в отчёте.

**Исполнимость проверена исполнением:** все проверки §2–§4 с порогами, взятыми с запасом от skeleton, собраны в validation и прогнаны стендом на skeleton в Modes 0, 29, 38, 39 — `OVERALL: PASS`. Типы проверок — только из языка validation (`lab/docs/VALIDATION_FORMAT_RU.md`); **окно у `metric` задаётся полем `window`** (урок задачи 014: `from_day`/`to_day` у `metric` не существуют).

## 1. HARD и REGRESSION

- все проверки v7.7.4 сохраняются без ослабления;
- `regression_modes` = 0–37 (`changed = 0`, `maxAbs = 0`);
- плагин `simple_capital` (уже в черновике) — статика и прогон во **всех** Modes.

## 2. Механика выключена — Modes 0–37

Для A и B: `X Regolith Mine Expansion`, `… Desired Expansion`, `… Capital Goods Consumption`, `… Construction Materials Consumption`, `… Capacity Depreciation`, `… Capacity Retirement` — max ≤ 0 (`metric`); `X Regolith Extraction Capacity − X Regolith Base Extraction Capacity = 0` (`identity`) во всех Modes 0–37, **кроме 29** (шок реголита умножает мощность в окне).

## 3. Тождества — Modes 38–39

Для A и B (`identity`):
- `X Regolith Mine Capital Goods Consumption − 2 × X Regolith Mine Expansion = 0`;
- `X Regolith Mine Construction Materials Consumption − 2 × X Regolith Mine Expansion = 0`;
- `X Regolith Extraction Capacity − X Regolith Mine Capacity = 0` (шока Mode 29 в 38–39 нет);
- все парные тождества v7.7.4 — в Modes 38–39 тоже.

## 4. Сценарные ожидания

### Mode 38 — baseline

- шахта A растёт сверх стартовой мощности: `A Regolith Mine Capacity` max > **[calib]** (`metric`; skeleton ≈ 8.83 при старте 7);
- затем выводит избыток: изменение `0 → 1080` < −**[calib]** (`change`; skeleton ≈ −4.71);
- B не строит: `B Regolith Mine Expansion` max ≤ 1e-6 (`metric`).

### Mode 39 — transport surge

- **B строит шахту заново** — главная проверка: `B Regolith Mine Expansion` max в `window [360, 720]` > **[calib]** (`metric`; skeleton ≈ 0.044) и `B Regolith Mine Capacity` изменение `360 → 720` > **[calib]** (`change`; skeleton ≈ +6.1);
- расход реален: `B Regolith Mine Capital Goods Consumption` max в окне > 0 (`metric`);
- B добывает: `B Regolith Extraction Rate` max в окне > **[calib]** (`metric`; skeleton ≈ 3.54);
- до окна шахта B не строится: `event_absent`, `event: {column: "B Regolith Mine Expansion", op: ">", value: 1e-6, window: [0, 359.75]}`.

## 5. Что не проверяется

- сравнения между Modes и с v7.7.4 — в отчёте числами.
