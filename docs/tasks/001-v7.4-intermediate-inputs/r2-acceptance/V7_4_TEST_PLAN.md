# v7.4 — Intermediate Inputs — test plan (r1.2)

Связан с `V7_4_ARCHITECTURE_SPEC.md` (r1.1). Исполняемая форма — `validation-v7.4-draft-r1.1.json`; пороги Modes 17–18 в r1.1 выставлены по приёмочному прогону r1 (вариант с поправками r1.1) и являются **[fix]**, если не указано иное; этот документ объясняет, **почему** каждая проверка такая, и какие пороги исполнитель обязан заполнить и обосновать.

Три категории проверок (как в стенде): **HARD** — физика/учёт, всегда FAIL; **REGRESSION** — Modes 0–16 идентичны accepted; **EXPECTATION** — причинно-следственные ожидания новых сценариев.

## 1. REGRESSION — Modes 0–16

Проверяется `CHECK_CANDIDATE.cmd` (accepted v7.3 r2 ↔ candidate, все Modes):

```text
для каждого Mode 0–16:  827 common series, changed = 0, maxAbs = 0
                        added series = только новые элементы v7.4 (policy: series_added в разрешённом пространстве имён)
```

Policy-draft запрещает `series_changed` для Modes 0–16 явным deny-правилом — это regression-guard, а не default deny.

## 2. HARD — все Modes 0–20 (`global_checks`)

| # | Проверка | Тип | Обоснование |
|---|---|---|---|
| H1 | `X Electronics Metal Input Fulfillment ∈ [0, 1]` | bounded | доля поставки — доля |
| H2 | `X Electronics Metal Input Delivery ≤ X Electronics Metal Input Demand` | relation | нельзя поставить больше, чем просили |
| H3 | `X Electronics Metal Input Delivery ≤ X Metal Available for Intermediate Use` | relation | нельзя поставить больше, чем доступно |
| H4 | `X Electronics Metal Input Delivery ≥ 0`, `Demand ≥ 0` | bounded | физические потоки неотрицательны |
| H5 | `X Metal Inventory ≥ 0`, `X Electronics Feedstock Inventory ≥ 0`, `X Electronics Inventory ≥ 0` | bounded | запасы — не источники вещества |
| H6 | прежние плагины: `energy_balance`, `capital_lifecycle_kernel`, `transport_allocator` | plugins | v7.3 без изменений |
| H7 | статика: kernel conformance 7/7; `open_boundaries` unclassified = 0; `colony_symmetry` mismatches = 0, исключений ровно 18 (r1.1: + `A Effective Mining Capacity`) | plugins | новые элементы обязаны быть зеркальными |

Для Modes 0–16 дополнительно (в `scenarios.<mode>`): `X Electronics Metal Input Delivery` max = 0 и `Fulfillment` min = 1 — переключатель действительно выключает механику.

## 3. EXPECTATION — новые Modes

Все четыре: `Capital Lifecycle Enabled = 1`, `Intermediate Inputs Enabled = 1`, горизонт 0…1080, dt 0.25.

Пороги в таблицах помечены: **[fix]** — задан здесь и не меняется; **[calib]** — исполнитель ставит значение после калибровки и **обосновывает в CANDIDATE_REPORT.md**; порог не должен быть тавтологией наблюдённого результата (правило: если бы провал этой проверки ничего не значил — она не нужна).

### Mode 17 — v7.4 Intermediate Inputs Baseline

Цель: связанная экономика без шоков — устойчива, физически замкнута по металлу в Electronics, остаётся going concern.

| # | Ожидание | Проверка | Порог |
|---|---|---|---|
| 17.1 | экзогенная добыча feedstock выключена | metric max `X Electronics Feedstock Extraction Rate` [0,1080] ≤ 0 | [fix] |
| 17.2 | поставки металла идут | metric min `X Electronics Metal Input Delivery` **[60,1080]** > 0 (r1.1: с переоценённым начальным запасом поставки начинаются на дне 0 у A и ~25 у B) | [fix] |
| 17.3 | буфер обслуживается | metric min `X Electronics Metal Input Fulfillment` [200,1080] ≥ 0.95 | [fix] |
| 17.4 | going concern (r1.1: на уровне планеты) | `Planet Electronics Production Rate` @1080 ∈ [21.0, 84.1] (= [0.5, 2.0] × 42.06 в Mode 12); `Planet Smelting Rate` @1080 ∈ [22.4, 89.6] (× 44.78); `X Electronics Production Rate` @1080 ≥ 2.0 для каждой колонии | [fix] |
| 17.5 | энергетика: B сходится; A снижает дефицит (r1.1) | B: metric max [900,1080] ≤ 1e-6; A: change(720 → 1080) ≤ −20/день **и** last @1080 ≤ 100 (в прогоне r1: 107 → 72). Ноль у A к 1080 недостижим из-за роста спроса A под связью + 60-дневного планирования мощности (ограничение v7.3) | [fix] |
| 17.6 | торговля когерентна | число смен знака чистого экспорта электроники после дня 360 ≤ 1 — проверяется вручную по нашим отчётам и описывается в отчёте. **Переворот специализации** (B→A электроника 21.7 → 0, A→B 0 → 1.25) — ожидаемое следствие связи | отчёт |
| 17.7 | спрос на плавку включает промежуточные поставки | identity: `X Desired Smelting Rate − (legacy-составляющие) − X Electronics Metal Input Delivery = 0` — если исполнитель выделит legacy-часть в отдельную переменную `X Desired Smelting Rate Excluding Intermediate`; иначе проверяется чтением формулы | рекомендуется |

### Mode 18 — v7.4 Temporary Metal Supply Shock (r1.1: шок у A)

Шок: `A Mining Capacity` × 0.5 в окне 360–720 (`Test 18 Metal Supply Shock Active` через новый `A Effective Mining Capacity`). **Почему A, а не B (r1):** в связанной экономике A — экспортёр металла (A→B ≈ 17–21/день), B плавит ~5–8/день и держит 2500 руды; шок добычи B (28 → 14) не ограничивал даже её собственную добычу (~11/день) и не доходил до входа электроники (fulfillment B 0.979 на всём окне). Шок у A иссушает руду A (2460 → 117 к дню 480), режет плавку 39 → 25, экспорт A→B 17 → 5, и через торговлю поднимает цену металла у B 40 → 57.

Пре-шоковые значения @359.75 (прогон r1, вариант r1.1): `A Market Price` 33.96; `B Market Price` 40.44; `B Electronics Unit Cost` 17.47; `B Electronics Production Rate` 16.59; `A Electronics Metal Input Fulfillment` 0.966.

| # | Ожидание | Проверка | Порог |
|---|---|---|---|
| 18.1 | шок физически связывает | metric min `A Ore Inventory` [360,720] < 500 | [fix] |
| 18.2 | ценовой канал у источника | metric max `A Market Price` [360,720] ≥ 42.45 (+25 %) | [fix] |
| 18.3 | шок проходит через торговлю | metric max `B Market Price` [360,720] ≥ 50.55 (+25 %) | [fix] |
| 18.4 | стоимостной канал в электронике | metric max `B Electronics Unit Cost` [360,720] ≥ 20.09 (+15 %) | [fix] |
| 18.5 | физический канал | metric min `A Electronics Metal Input Fulfillment` [360,720] < 0.95 (в прогоне 0.927) | [fix] |
| 18.6 | выпуск электроники B падает | metric min `B Electronics Production Rate` [360,720] ≤ 11.6 (≤ 70 %) | [fix] |
| 18.7 | причинный порядок | event_order: `A Ore Inventory` < 500 → `A Market Price` > 42.45 → `B Electronics Unit Cost` > 20.09 | [fix] |
| 18.8 | восстановление | `A Market Price` @1080 ≤ 35.66 (+5 %); `B Electronics Production Rate` @1080 ≥ 14.1 (85 %); `A Electronics Metal Input Fulfillment` min [900,1080] ≥ 0.95 | [fix] |
| 18.9 | шок не строит лишнего | max `A Refinery Expansion` [360,720] ≤ 1.5 × max за [0,360] (в прогоне: 0 во время шока) | [calib] — исполнитель добавляет проверку в r2 |

Пороги — абсолютные числа из приёмочного эксперимента r1; candidate r2, реализованный по spec r1.1, должен воспроизвести их близко. Небольшое расхождение — сообщить число, не подгонять порог.

### Mode 19 — v7.4 Sustained Electronics Growth with Input Coupling (r1.2)

Шок: `A Electronics` спрос × 4 постоянно с дня 360 (как Mode 14, но со связью). Ожидаемая цепочка: спрос на электронику ↑ → спрос Electronics на металл ↑ → плавка ↑ → refinery-капитал больше, чем без связи → энергия ↑ → ускорение строительства генерации.

Пре-шоковые значения @359.75 (прогон r2): `A Electronics Metal Input Demand` 4.869; `A Power Generation Expansion` 0.391; `A Refinery Installed Capacity` 54.01; `A Electronics Metal Input Fulfillment` 0.966. Mode 14 (без связи) @1080: `A Refinery Installed Capacity` 53.0.

| # | Ожидание | Проверка | Порог |
|---|---|---|---|
| 19.1 | промежуточный спрос растёт | metric last `A Electronics Metal Input Demand` @1080 ≥ 7.303 (1.5×; факт 9.50) | [fix] |
| 19.2 | причинный порядок спрос → генерация | event_order: `A Electronics Metal Input Demand` > 5.843 (1.2×) → `A Power Generation Expansion` > 0.5864 (1.5×) | [fix] r1.2 |
| 19.2a | строительство генерации ускоряется | metric max `A Power Generation Expansion` [360,1080] ≥ 0.5864 (факт 0.697) | [fix] r1.2 |
| 19.2b | связь добавляет refinery-капитал | `A Refinery Installed Capacity` @1080 ≥ 58.3 (Mode 14: 53.0 + 10 %; факт 64.0) | [fix] r1.2 |
| 19.3 | физический канал реагирует и восстанавливается | min `A Electronics Metal Input Fulfillment` [360,1080] < 0.9664 (пре-шок) и ≥ 0.90; change(720 → 1080) ≥ +0.005 (факт: min 0.949, +0.010) | [fix] r1.2 |
| 19.4 | нет взрыва мощностей | `A Refinery Installed Capacity` @1080 ≤ 162.1 (3 × 54.0) | [calib] исполнитель r2 |
| 19.5 | сравнение с Mode 14 | таблица в отчёте (сделано в r2) | отчёт |

Почему r1.2: формулировка r0/r1.1 «`A Refinery Expansion` > 1e-6 = старт строительства» была некорректна — в связанном baseline expansion у A ненулевой с дня ~3, событие срабатывало на дне 360 до роста спроса. Требование «восстановление ≥ 0.05» (19.3) нереалистично при мягком факторе нормирования (провал 0.966 → 0.949): заменено на «провал ниже пре-шокового + пол 0.90 + рост ≥ 0.005 за последние 360 дней». Оба изменения — определения тестов, не модели; внесены принимающей стороной в validation r2.1.

### Mode 20 — v7.4 Coupled Metal Demand Growth

Шок: `B` конечный спрос на металл × 2 постоянно с дня 360 (как Mode 16). Проверяет **конкуренцию конечного и промежуточного спроса** за один запас металла и правило пропорционального нормирования.

| # | Ожидание | Проверка | Порог |
|---|---|---|---|
| 20.1 | нормирование пропорционально | identity на [360,1080]: `B Electronics Metal Input Fulfillment − B Local Sales / B Local Demand = 0` (оба используют один фактор доступности) | [fix], tol 1e-6 |
| 20.2 | электроника страдает вместе с конечными покупателями, не вместо них | metric min `B Electronics Metal Input Fulfillment` [360,720] < 1; metric min `B Local Sales / B Local Demand`… — через identity 20.1 достаточно | [fix] |
| 20.3 | refinery расширяется | event_exists `B Refinery Expansion` > 0 [360,1080] | [fix] |
| 20.4 | восстановление | metric last `B Electronics Metal Input Fulfillment` @1080 ≥ 0.95 | [calib] |
| 20.5 | сравнение с Mode 16 | таблица: B installed refinery, B unserved energy, B electronics production @1080 в Mode 16 и Mode 20 | отчёт |

## 4. Что считать провалом версии, а не калибровки

- любой FAIL в §1 (REGRESSION) или §2 (HARD);
- Mode 17 не going concern (по планетарному критерию 17.4) при **любом** `Metal per Electronics` в диапазоне [0.1, 1.0] — значит, дефект механики, а не коэффициента;
- порог [calib], который не удаётся выставить без того, чтобы проверка стала бессмысленной, — сообщить, не подгонять;
- новые исключения `colony_symmetry` сверх одного предусмотренного (`A Effective Mining Capacity`) — новые элементы обязаны быть зеркальны.

## 5. Отчётность

`CANDIDATE_REPORT.md` — по образцу `baseline/docs/model_v7_3/V7_3_R2_VALIDATION_REPORT.md`: integrity → regression gate → HARD → по одному разделу на Mode 17–20 с числами → verdict → known limitations. Плюс раздел «калибровка `Metal per Electronics`» с таблицей Mode 12 vs Mode 17.
