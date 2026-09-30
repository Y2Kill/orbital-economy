# v7.7.7 — Power Resource Capital — test plan

Статус: **r1** (2026-09-30). К `V7_7_7_ARCHITECTURE_SPEC.md`. Пороги **[calib]** — по первому прогону `candidate.yml`, с запасом и обоснованием в отчёте.

**Исполнимость проверена исполнением.** Черновик `draft/validation-v7.7.7-draft.json` содержит все проверки ниже с порогами от skeleton; прогнан стендом на skeleton во всех 44 Modes (итог — в спецификации §6), прошёл `check-validation` с 0 ошибок. Перед push прогоняй свою validation через `node src/cli.js check-validation <validation.json> <candidate.json>`. Validation — многострочный JSON.

## 1. HARD и REGRESSION

- все проверки v7.7.6 сохраняются без ослабления;
- `regression_modes` = 0–41 (`changed = 0`, `maxAbs = 0`);
- плагин `simple_capital` (6 экземпляров, уже в черновике) — статика и прогон во **всех** Modes.

## 2. Механика выключена — Modes 0–41

Для A и B:
- `X Power Resource Mine Expansion`, `… Desired Expansion`, `… Capital Goods Consumption`, `… Construction Materials Consumption`, `… Capacity Depreciation`, `… Capacity Retirement` — max ≤ 0 (`metric`, `tolerance: 0`);
- `X Power Resource Extraction Rate − X Power Resource Mine Uncapped Output = 0` (`identity`, `abs_tol: 0`) — **во всех Modes 0–41, включая Mode 25**: при выключенном переключателе скорость и есть прежняя формула, а шок Mode 25 сидит внутри неё.

## 3. Тождества и границы — Modes 42–43

Для A и B:
- `X Power Resource Mine Capital Goods Consumption − 0.02 × X Power Resource Mine Expansion = 0` и то же для стройматериалов (`identity`);
- `X Power Resource Extraction Rate ≤ X Power Resource Mine Uncapped Output` (`relation`, `abs_tol: 1e-9`) — потолок только срезает;
- `X Power Resource Extraction Rate ≤ X Power Resource Mine Capacity` (`relation`, `abs_tol: 0.0011`) — мягкий потолок не выше мощности (формула даёт ≤ C + 0.001);
- все тождества Modes 40–41 — в Modes 42–43 тоже (в черновике перенесены).

## 4. Сценарные ожидания

### Mode 42 — baseline

- шахта A растёт сверх стартовой: `A Power Resource Mine Capacity` max > **[calib]** (`metric`; skeleton ≈ 1890 при старте 1750);
- шахта B сворачивается: изменение `0 → 1080` < −**[calib]** (`change`; skeleton ≈ −179).

### Mode 43 — transport surge

- **B строит шахту заново** — главная проверка: `B Power Resource Mine Expansion` max в `window [360, 720]` > **[calib]** (`metric`; skeleton ≈ 0.52) и `B Power Resource Mine Capacity` изменение `360 → 720` > **[calib]** (`change`; skeleton ≈ +76);
- расход реален: `B Power Resource Mine Capital Goods Consumption` max в окне > 0 (`metric`);
- запас энергоресурса B проседает, пока шахта растёт: `B Power Resource Inventory` min в окне < **[calib]** (`metric`; skeleton ≈ 1606; в v7.7.6 Mode 41 ≈ 2153);
- перед окном шахта B не строится: `event_absent`, `event: {column: "B Power Resource Mine Expansion", op: ">", value: 1e-6, window: [250, 359.75]}`. Окно начинается с дня 250, а не с 1: в первые ~200 дней B достраивает шахту под свой растущий стартовый спрос (спецификация §5).

**Контроль (сделан нами).** Та же модель, но в Mode 43 переключатель выключен: проверки этого раздела про расширение, рост мощности, расход и просадку запаса обязаны упасть — и падают.

## 5. Что не проверяется

- сравнения между Modes и с v7.7.6 — в отчёте числами.
