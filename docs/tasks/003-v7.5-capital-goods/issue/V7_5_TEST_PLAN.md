# v7.5 — Capital Goods — test plan (r0)

Связан с `V7_5_ARCHITECTURE_SPEC.md`. Исполняемая форма — `validation-v7.5-draft.json`. По уроку задачи 001: **HARD и REGRESSION — финальны; пороги EXPECTATION Modes 21–23 ставятся после первого приёмочного прогона** (в драфте — только качественные проверки и `calib_todo`).

## 1. REGRESSION — Modes 0–20

`CHECK_CANDIDATE`: 21 × `common = 852, changed = 0, maxAbs = 0`; policy — explicit deny на `series_changed` Modes 0–20.

## 2. HARD — все Modes 0–23 (`global_checks`, 40 проверок)

| # | Проверка | Тип |
|---|---|---|
| H1 | `X Capital Goods Fulfillment ∈ [0, 1]` | bounded |
| H2 | `X Capital Goods Inventory ≥ 0`; `X Capital Goods Production Rate ≥ 0` | bounded |
| H3 | `X <Sector> Expansion ≤ X <Sector> Desired Expansion` (×3 сектора) | relation |
| H4 | пары преобразования: `X <Sector> Capital Goods Consumption − X <Sector> Expansion × coef = 0` (×3); `X Capital Goods Metal Consumption − Production × 1 = 0`; `… Electronics … − Production × 0.5 = 0` | identity — **коэффициенты в проверках исполнитель приводит в соответствие со своими константами** |
| H5 | прежние (v7.4.2): energy, kernel (теперь kernel-v2 для 6 экземпляров: `Expansion ≤ Desired Expansion` внутри плагина), transport allocator, intermediate inputs, пары руда→металл и feedstock→электроника | plugins |
| H6 | статика: kernel conformance 7/7 (6 × kernel-v2 + Transport v1); `open_boundaries`: unclassified 0, **unpaired 0**, closed-world violations **1** (Transport); `colony_symmetry`: mismatches 0, исключения как в baseline (18 или 0, если задача 002 принята раньше) | plugins |

Modes 0–20 дополнительно: `X Capital Goods Production Rate` max = 0, `X Capital Goods Fulfillment` min = 1 (переключатель выключает механику).

## 3. EXPECTATION — новые Modes (все: lifecycle 1, intermediate inputs 1, capital goods 1)

### Mode 21 — Capital Goods Baseline

| # | Ожидание | Проверка | Порог |
|---|---|---|---|
| 21.1 | оборудование производится | min `X Capital Goods Production Rate` [60,1080] > 0 | [fix] |
| 21.2 | строительство обслуживается | min `X Capital Goods Fulfillment` [200,1080] ≥ 0.9 (skeleton при buffer 2: 0.86; при 0.5 ожидается ≥ 0.95) | [fix 0.9; calib 0.95] |
| 21.3 | going concern vs Mode 17 | `Planet Electronics Production Rate`, `Planet Smelting Rate` @1080 в ±15 % от Mode 17 (37.04 / 50.09 → [31.5, 42.6] / [42.6, 57.6]) | [fix] |
| 21.4 | капитал строится чуть медленнее, не останавливается | `A Refinery Installed Capacity` @1080 ∈ [0.9, 1.0] × Mode 17 (61.28 → [55.2, 61.3]); то же `A Power Installed Generation Capital` (1610 → [1449, 1610]) | [fix] |
| 21.5 | энергетика как в Mode 17 | B late unserved = 0; A unserved declining (change 720→1080 ≤ −20) | [fix] |
| 21.6 | отчёт: доля металла/электроники, уходящая на оборудование (skeleton: ~0.3–1.9 металла/день против плавки ~45) | отчёт |

### Mode 22 — Capital Goods Supply Shock (A)

`A Capital Goods Production Capacity` × 0.3 в окне 360–720.

| # | Ожидание | Проверка | Порог |
|---|---|---|---|
| 22.1 | дефицит оборудования | min `A Capital Goods Fulfillment` [360,720] < 0.7 | [fix] |
| 22.2 | строительство замедляется | max over window of `A Refinery Expansion / A Refinery Desired Expansion` ≤ 0.5 — через relation `A Refinery Expansion ≤ 0.5 × Desired` невыразимо напрямую (нет коэффициента у relation); исполнитель добавляет helper `A Refinery Expansion Ratio` = Expansion / Max(Desired, 1e-9) и metric max [400,720] ≤ 0.5 | [calib] |
| 22.3 | капитал отстаёт | `A Refinery Installed Capacity` @720 ≤ 0.97 × Mode 21 @720; то же Power | [calib, число после прогона] |
| 22.4 | B не затронута | min `B Capital Goods Fulfillment` [0,1080] ≥ 0.85 | [fix] |
| 22.5 | восстановление | min `A Capital Goods Fulfillment` [900,1080] ≥ 0.9 | [fix] |

### Mode 23 — Investment Boom (A electronics demand ×4 с дня 360)

| # | Ожидание | Проверка | Порог |
|---|---|---|---|
| 23.1 | спрос на оборудование растёт | max `A Capital Goods Demand` [360,1080] ≥ 1.5 × @359.75 | [calib число] |
| 23.2 | порядок: спрос → дефицит → производство | event_order: `A Capital Goods Demand` > 1.5× → `A Capital Goods Fulfillment` < 0.8 → `A Capital Goods Production Rate` > 1.5× | [calib] |
| 23.3 | все три сектора A расширяются | max `A <Sector> Expansion` [360,1080] > pre-shock для Refinery, Electronics, Power | [calib] |
| 23.4 | конкуренция за оборудование пропорциональна | identity: у всех секторов один `A Capital Goods Fulfillment` — тавтология по построению; вместо этого отчёт: доли потребления оборудования по секторам до/после | отчёт |
| 23.5 | сравнение с Mode 19 | таблица @720/1080: A Refinery/Power Installed, A Electronics Production, A Energy Unserved | отчёт |

## 4. Провал версии vs калибровки

- любой FAIL §1–§2; петля при switch = 1; `unpaired > 0`;
- Mode 21 не going concern при `Capital Goods per Capacity` в диапазоне ×0.5…×2 от стартовых — дефект механики;
- Mode 22 не кусается при множителе 0.3 → сначала проверить `A Capital Goods Production Capacity` (должен быть близок к baseline-спросу), сообщить числа, не подгонять.

## 5. Отчётность

`CANDIDATE_REPORT.md` по образцу задачи 001 r2 + раздел «внешние параметры v7.5» (все новые константы с ролью/эффектом — фрагмент аннотаций) + таблицы Mode 17 vs 21, 19 vs 23.
