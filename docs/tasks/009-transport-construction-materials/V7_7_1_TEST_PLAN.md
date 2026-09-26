# v7.7.1 — Transport on Construction Materials — test plan

Статус: **r1** (2026-09-26). К `V7_7_1_ARCHITECTURE_SPEC.md`. Пороги **[calib]** — по первому прогону `candidate.yml`, с запасом и обоснованием в отчёте (как в задаче 008: сначала «зонды», потом пороги).

## 1. HARD и REGRESSION

- все проверки v7.7 сохраняются без ослабления;
- `regression_modes` = 0–29 (`changed = 0`, `maxAbs = 0`).

## 2. Механика выключена — Modes 0–29

Для A и B: `X Transport Construction Materials Consumption` max ≤ 0. Глобально: `Transport Construction Materials Fulfillment` min ≥ 1, `Transport Construction Materials Demand` max ≤ 0.

## 3. Тождества — Modes 30–31

- **пара транспорта, стройматериалы:** `A Transport CM Consumption + B Transport CM Consumption = Transport Capacity Expansion × Transport Construction Materials per Capacity`;
- **пара транспорта, оборудование** (v7.5.1) продолжает выполняться;
- **доли:** `Transport Construction Materials Source Share Sum` = 1 (min и max, допуск как в v7.5.1);
- все парные тождества v7.7 для колоний (стройматериалы и оборудование) — в Modes 30–31 тоже.

## 4. Сценарные ожидания

### Mode 30 — baseline

- транспорт строится: `Transport Capacity Expansion` > 0 где-то в `[0, 360]`;
- обе «ноги» работают: `A Transport CM Consumption` > 0 и `B Transport CM Consumption` > 0 где-то в `[0, 360]`;
- стройматериалы не душат транспорт: `Transport Construction Materials Fulfillment` min ≥ **[calib]** (skeleton ≈ 0.99).

### Mode 31 — transport surge

- транспорт строится в окне: `Transport Capacity Expansion` > 0 где-то в `[360, 720]`;
- **B производит стройматериалы**: `B Construction Materials Production` > **[calib]** где-то в `[360, 720]` (skeleton max ≈ 1.85) — главная проверка задачи;
- B добывает реголит: `B Regolith Extraction` > 0 в `[360, 720]`;
- B строит: `B Refinery Expansion` или `B Power Generation Expansion` > 0 в `[360, 720]`;
- стройматериалы B реально нагружены: `B Construction Materials Fulfillment` < 1 − **[calib]** где-то в окне (skeleton min ≈ 0.93);
- порядок: производство B начинается после начала окна (360).

## 5. Что не проверяется

- производство стройматериалов B в Mode 30 (не должно быть: хватает стартового запаса — спецификация §6);
- сравнения между Modes — в отчёте числами.
