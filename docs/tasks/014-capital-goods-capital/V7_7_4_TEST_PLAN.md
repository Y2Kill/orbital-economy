# v7.7.4 — Capital Goods Capital — test plan

Статус: **r1** (2026-09-27). К `V7_7_4_ARCHITECTURE_SPEC.md`. Пороги **[calib]** — по первому прогону `candidate.yml`, с запасом и обоснованием в отчёте («зонды → пороги», как в 008–012).

**Исполнимость проверена до выдачи** (урок задачи 012): каждая проверка ниже выражается типом, который есть в языке validation (`lab/docs/VALIDATION_FORMAT_RU.md`), — тип указан в скобках. Произведений рядов нет: коэффициенты норм (5) — известные константы, тождества линейны. **Проверено исполнением:** все проверки §2–§4 с порогами, взятыми с запасом от skeleton, собраны в validation и прогнаны стендом на skeleton в Modes 0, 22, 36, 37 (`ARCHIVE/evidence/014-skeleton/validation-test-plan-probe.json` у владельца) — `OVERALL: PASS`.

## 1. HARD и REGRESSION

- все проверки v7.7.3 сохраняются без ослабления;
- `regression_modes` = 0–35 (`changed = 0`, `maxAbs = 0`);
- плагин `capital_lifecycle_kernel` с 11 экземплярами (уже в черновике) — runtime-тождества ядра во **всех** Modes.

## 2. Механика выключена — Modes 0–35

Для A и B:

- `X Capital Goods Plant Expansion`, `X … Desired Expansion`, `X … Capital Goods Consumption`, `X … Construction Materials Consumption` — max ≤ 0 (`metric`);
- мощность выпуска = прежняя константа: `X Capital Goods Production Capacity − X Capital Goods Base Production Capacity = 0` (`identity`) — во всех Modes 0–35, **кроме 22** (там шок Mode 22 умножает мощность в окне).

## 3. Тождества — Modes 36–37

Для A и B (`identity`):

- **пара, оборудование:** `X … Capital Goods Consumption − 5 × X … Expansion = 0`;
- **пара, стройматериалы:** `X … Construction Materials Consumption − 5 × X … Expansion = 0`;
- **мощность выпуска = активная мощность завода:** `X Capital Goods Production Capacity − X Capital Goods Plant Active Capacity = 0` (в Modes 36–37 шока Mode 22 нет);
- все парные тождества v7.7.3 (в том числе заводов стройматериалов) — в Modes 36–37 тоже.

## 4. Сценарные ожидания

### Mode 36 — baseline

- **завод растёт сверх стартовой мощности:** `A … Plant Installed Capacity` max > **[calib]** (`metric`; skeleton ≈ 2.09 при старте 2);
- **затем сворачивает излишек:** `A … Plant Installed Capacity` изменение `0 → 1080` < −**[calib]** (`change`; skeleton ≈ −1.49);
- выпуск идёт: `A Capital Goods Production Rate` max > **[calib]** (`metric`; skeleton ≈ 1.74);
- B не строит: `B … Plant Expansion` max ≤ **[calib]** (`metric`; skeleton 0).

### Mode 37 — transport surge

- **B строит завод заново** — главная проверка задачи: `B … Plant Expansion` max в `[360, 720]` > **[calib]** (`metric`; skeleton ≈ 0.009) и `B … Plant Installed Capacity` изменение `360 → 720` > **[calib]** (`change`; skeleton ≈ +0.88);
- расход реален: `B … Plant Construction Materials Consumption` и `… Capital Goods Consumption` max в окне > 0 (`metric`);
- B производит оборудование: `B Capital Goods Production Rate` max в окне > **[calib]** (`metric`; skeleton ≈ 1.02);
- **инерция видна:** `B Capital Goods Fulfillment` min в окне < **[calib]** (`metric`; skeleton ≈ 0.19);
- до окна B завод не строит: `B … Plant Expansion` > 1e-6 **не** появляется в `[0, 360)` (`event_absent`).

## 5. Что не проверяется

- стартовый переходный процесс A (консервация под малый начальный сигнал и реактивация) — описан в спецификации §6, пороги на нём не ставим;
- сравнения между Modes и с v7.7.3 — в отчёте числами.
