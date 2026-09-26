# v7.7.2 — Construction Materials use Energy — test plan

Статус: **r1** (2026-09-26). К `V7_7_2_ARCHITECTURE_SPEC.md`. Пороги **[calib]** — по первому прогону `candidate.yml`, с запасом и обоснованием в отчёте (как в задачах 008–009: сначала «зонды», потом пороги).

## 1. HARD и REGRESSION

- все проверки v7.7.1 сохраняются без ослабления;
- `regression_modes` = 0–31 (`changed = 0`, `maxAbs = 0`);
- `energy_balance` с `consumers` = Metal, Electronics, Construction Materials (уже в черновике validation) — во **всех** Modes.

## 2. Механика выключена — Modes 0–31

Для A и B: `X Construction Materials Requested Energy` max ≤ 0; `X Construction Materials Allocated Energy` max ≤ 0; `X Construction Materials Energy Fulfillment Ratio` min ≥ 1.

## 3. Тождества — Modes 32–33

Для A и B:

- **выпуск:** `X CM Production Rate = X Pre Energy CM Production Rate × X CM Energy Fulfillment Ratio`;
- **распределение:** `X CM Allocated Energy = X CM Requested Energy × X Energy Fulfillment Ratio`;
- **запрос:** `X CM Requested Energy = X Pre Energy CM Production Rate × Construction Materials Energy per Unit`;
- **факт ≤ план:** `X CM Production Rate ≤ X Pre Energy CM Production Rate`;
- пара реголит → стройматериалы (v7.7) продолжает выполняться.

## 4. Сценарные ожидания

### Mode 32 — baseline

- стройматериалы A запрашивают энергию: `A CM Requested Energy` > 0 где-то в `[0, 360]`;
- энергия реально ограничивает: `A CM Energy Fulfillment Ratio` min < 1 − **[calib]** (skeleton ≈ 0.926);
- сигнал следует за спросом: `|A CM Demand Signal − A CM Demand|` в конце горизонта ≤ **[calib]**.

### Mode 33 — generation capacity shock

- **B производит стройматериалы под нехваткой энергии** — главная проверка задачи: `B CM Requested Energy` > 0 и `B CM Energy Fulfillment Ratio` < 1 − **[calib]** где-то в `[360, 720]` (skeleton min ≈ 0.715);
- выпуск B ограничен энергией: `B CM Production Rate` < `B Pre Energy CM Production Rate` где-то в окне;
- B строит: `B Refinery Expansion` или `B Power Generation Expansion` > 0 в `[360, 720]`;
- порядок: нехватка энергии у стройматериалов B начинается после начала окна (360).

## 5. Что не проверяется

- ограничение стройматериалов A в окне Mode 33 (стройки A стоят — спецификация §6);
- сравнения между Modes — в отчёте числами.
