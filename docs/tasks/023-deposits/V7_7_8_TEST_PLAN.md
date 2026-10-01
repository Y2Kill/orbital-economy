# v7.7.8 — Deposits — test plan

Статус: **r1** (2026-10-01). К `V7_7_8_ARCHITECTURE_SPEC.md`. Пороги **[calib]** — по первому прогону `candidate.yml`, с запасом и обоснованием в отчёте.

**Исполнимость проверена исполнением.** Черновик `draft/validation-v7.7.8-draft.json` содержит все проверки ниже с порогами от skeleton; прогнан стендом на skeleton во всех 46 Modes (итог — в спецификации §6), прошёл `check-validation` с 0 ошибок. Validation — многострочный JSON.

## 1. HARD и REGRESSION

- все проверки v7.7.7 сохраняются без ослабления;
- `regression_modes` = 0–43 (`changed = 0`, `maxAbs = 0`);
- плагин `deposit` (6 экземпляров, уже в черновике) — статика и прогон во **всех** Modes.

## 2. Слой выключен — Modes 0–43

Для каждого ресурса R и колонии X (имена проверок помечены `(switch off)`):
- `X R Exploration`, `X R Exploration Capital Goods Consumption` — max ≤ 0 (`metric`, `tolerance: 0`);
- скорость добычи (`X Mining Rate`, `X Regolith Extraction Rate`, `X Power Resource Extraction Rate`) − `X R Deposit Unlimited Rate` = 0 (`identity`, `abs_tol: 0`) — во всех Modes 0–43, включая шоки 18, 25, 29.

## 3. Тождества и границы — Modes 44–45

- `X R Exploration Capital Goods Consumption − норма × X R Exploration = 0` (`identity`; нормы — из декларации);
- скорость добычи ≤ `X R Deposit Unlimited Rate` (`relation`, `abs_tol: 1e-9`) — потолок истощения только срезает;
- все тождества Modes 42–43, **кроме помеченных `(switch off)`**, — в Modes 44–45 тоже (в черновике перенесены с этим фильтром; урок задач 017 и 021: тождество выключенного слоя ложно при включённом).

## 4. Сценарные ожидания

### Mode 44 — baseline

- разведка руды A реальна: `A Ore Exploration` max > **[calib]** (skeleton ≈ 67);
- разведанные запасы руды B **растут** выше стартовых 36 000: max > **[calib]** (skeleton ≈ 37 050);
- реголит B не разведывается (у B нет спроса на реголит): `B Regolith Exploration` max ≤ 1e-9.

### Mode 45 — transport surge

- разведка реголита B начинается во всплеске: max в `window [360, 720]` > **[calib]** (skeleton ≈ 2.35);
- разведка энергоресурса B растёт во всплеске: max в окне > **[calib]** (skeleton ≈ 885);
- разведанная руда B > **[calib]** (skeleton ≈ 38 140);
- **разведка конкурирует со стройкой за оборудование**: `B Capital Goods Fulfillment` min в окне < **[calib]** (skeleton ≈ 0.123; в v7.7.7 Mode 43 ≈ 0.167).

**Контроль (сделан нами).** Та же модель, но в Mode 45 переключатель выключен: проверки этого раздела про разведку и покрытие оборудованием обязаны упасть — и падают.

## 5. Что не проверяется

- потолок истощения в работе (на горизонте не срабатывает — разведанного на годы); его форма проверена самотестом стенда (задача 022);
- сравнения между Modes и с v7.7.7 — в отчёте числами.
