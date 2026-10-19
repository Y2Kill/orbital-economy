# v7.7.18 — перекалибровка на затратные цены — спецификация

Статус: **r1** (2026-10-18). База: accepted **v7.7.17 r1** (SHA `43625d45…`). Стенд: **Lab v0.9.22** (задача 042).

## Основание

- **Опыты** — `docs/research/RECALIBRATION_PREP_2026-10-18_RU.md`:
  - затратные цены и деньги во всех 60 Modes роняют 156 проверок;
  - деньги в «лестничных» Modes 0–48 душат B: равновесный старт денег — это старт полной экономики;
  - затратные цены считали статьи затрат несуществующих слоёв — исправлено привязками (задача 042).
- **Решение владельца (2026-10-18), вариант А:**
  - затратные цены — система цен всех Modes;
  - деньги — только в полных Modes 52–55;
  - «лестница» проверяет физику, деньги в ней не включаются.

## 0. Не-регрессия — в Modes 56–59

Modes 0–55 меняются: это перекалибровка, `regression_modes` = [].

Modes 56–59 входов не меняют, и все привязки там равны 1. Поскольку x · 1 = x точно, они воспроизводят v7.7.17 бит в бит. Исключение — 8 рядов, которые там никто не читает (§1.2): опорные цены спроса `wage_pricing` и их ценовые множители, по 2 на регион. Policy это и закрепляет.

Почему Modes 58–59 не превращены в контроль прежних цен, как предполагалось вначале: патч не меняет имена и описания сценариев. Контроль с именем «v7.7.17 Money» вводил бы в заблуждение. Modes 58–59 остаются затратными ценами с деньгами; по содержанию они почти совпадают с новыми 52–53, но несут проверки денег из задачи 041.

## 1. Что меняется

### 1.1 Привязка затрат к слоям (20 формул, 64 связи)

Слой `cost_pricing` принятой модели получает привязки Lab v0.9.22: декларация `lab/fixtures/nodes/cost_pricing_gated.json`. В модели это 20 замен и 64 связи:
- `{C} Ore / Regolith / Power Resource / Energy / Capital Goods / Construction Materials / Food Full Cost` — 14 формул;
- `{C} Metal / Electronics Capital Wear` — 4 формулы;
- `{C} Power Resource Price` — 2 формулы.

Формулы и связи — ровно те, что даёт раскрытие привязанной декларации вместо прежней. Вывод — `docs/tasks/042-cost-pricing-gates/reference/make_gated.mjs`: разница двух раскрытий над v7.7.15, применённая к v7.7.17.

### 1.2 Опорные цены спроса `wage_pricing` (4 константы)

Ценовой спрос `wage_pricing` (η = 0.5, только при `Wage Pricing Enabled = 1`, Modes 54–55) читает `{C} Metal / Electronics Demand Reference Price`. Это средние цены первого года Mode 52 в мире **прежних** цен. На затратных ценах множитель спроса (59 / 25.9)^−0.5 ≈ 0.66 срезал спрос на треть. Константы пересчитаны: прежнее значение × масштаб опорной цены того же товара из `cost_pricing` — одно правило для всех опорных цен товара.

| Константа | Было | Масштаб | Стало |
|---|---|---|---|
| `A Metal Demand Reference Price` | 25.9 | 2.254 | **58.38** |
| `B Metal Demand Reference Price` | 34.46 | 2.028 | **69.89** |
| `A Electronics Demand Reference Price` | 23.1 | 1.972 | **45.55** |
| `B Electronics Demand Reference Price` | 21.91 | 2.027 | **44.41** |

Спрос на старте Mode 54 вернулся в пределы ±6 % от v7.7.17 (было −26…−34 %).

Опорные цены остаются числовыми константами, как требует conformance `wage_pricing`. При продвижении мы меняем их и в декларации `model/nodes/wage_pricing.json`; исполнитель `model/nodes/` не трогает.

## 2. Сценарии (`modify_scenarios`)

| Modes | `Cost Pricing Enabled` | `Money Enabled` |
|---|---|---|
| 0–51 | 1 | — (0 по умолчанию) |
| 52–55 | 1 | 1 |
| 56–59 | без изменений (1) | без изменений (56–57: 0; 58–59: 1) |

Значения по умолчанию у переключателей не меняются (0). Имена и описания сценариев — тоже.

## 3. Что меняется в рядах (skeleton против v7.7.17)

- **Modes 0–55:** меняются 703–1259 рядов из 1931 — цены, спрос, производство, торговля, капитал; в 52–55 ещё и деньги.
- **Modes 56–59:** 8 рядов (§0).

Поведение:
- **уровень цен** — примерно ×2, механизмы шоков те же (Mode 18: истощение руды → цена A → себестоимость B; пороги пересчитаны от новых уровней до шока);
- **ранние Modes 14–23:** спрос на старте выше на 16–47 %. Привязки убрали статьи затрат отсутствующих слоёв, товары дешевле — это последовательная экономика модели, а не артефакт. В Modes 25–53, где слои есть, — в пределах ±4 %;
- **Mode 21:** B больше не сжимается. В первые два года он вкладывает стартовый запас оборудования (30 → 0.55) в генерацию, на третий год не строит ничего. Отсюда же Modes 22–23: буфера у B нет, шок оборудования задевает его мягко (0.81 / 0.76);
- **всплески 35/37/39/43:** B получает меньше заказов — в его затратной цене зарплата 140. Отклик 50–65 % от прежнего, механизм жив;
- **Mode 25:** нормирование энергии A при шоке энергоресурса глубже (минимум 395 против 599), но это нормирование, а не отключение;
- **Modes 52–55:** деньги ведут себя как в 58–59. Бюджет держит спрос B, дефицит B закрыт, A укомплектован во всплеске; ограничитель рынка труда по-прежнему проверяет Mode 57;
- **Modes 54–55** почти неотличимы от 52–53: затратная цена перекрывает ценовой канал `wage_pricing`, а ценовой спрос рядом с бюджетом мало что добавляет. Вывод `wage_pricing` из модели — отдельное решение, не этой задачи.

Структура: граничных 302, симметрия 0, петель 0 из 1048576, `planet_v1` PASS — как у v7.7.17.

## 4. Проверки, пересмотренные под новую калибровку

**Правило:** порог, записанный от уровня мира прежних цен или от уровня другого Mode, пересчитан от уровня skeleton **с тем же множителем**. Это касается и проверок, которые не падали: на затратных ценах они проходили бы, ничего не проверяя (Mode 18: «цена A выросла на 25 %» с порогом 42.45 при цене до шока 60.2).

Множитель меняется в двух местах, причина указана в строке:
- Mode 23 генерация ×1.3 — как Mode 19 в v7.7.14;
- Mode 18 событие себестоимости B ×1.25 — себестоимость B реагирует быстрее.

Проверки исчезнувшего механизма переформулированы:
- Mode 54 — ценовой канал зарплаты: цены идут за зарплатой через трудовые затраты;
- Modes 53/55 — ограничитель труда: с деньгами A укомплектован, как в Mode 59.

Проверки денег Modes 58–59 добавлены в 52–53.

**Mode 23 — от средних за дни 300–360 (раунд 2).** Спрос и производство оборудования в Mode 23 дребезжат вокруг начала бума: в соседних шагах 0.67 → 0.87 → 0.70 → 0, до шока бывают пики до 1.9. Мгновенное значение в день 359.75 оказалось всплеском, и пики легли по-разному на Windows и Linux — канонический прогон уронил порядок событий. Пороги Mode 23 считаются от средних за дни 300–360: спрос 0.889, производство 0.810, генерация 0.663, переработка 0.0311. Средние одинаковы на обеих платформах, порядок событий 367 → 383.5 → 608, запас всех проверок ≥ 4 %.

| Mode | Проверка (прежнее имя) | Было | Стало | Причина / skeleton |
|---|---|---|---|---|
| 18 | A metal price rises >= 25% (pre-shock 33.96) | max >= 42.45 на [360, 720] | max >= 75.2 на [360, 720] | rebased on the cost-price pre-shock level |
| 18 | shock propagates through trade — B metal price rises >= 25% (pre-shock 40.44) | max >= 50.55 на [360, 720] | max >= 83.6 на [360, 720] | rebased on the cost-price pre-shock level |
| 18 | cost channel — B electronics unit cost rises >= 15% (pre-shock 17.47) | max >= 20.09 на [360, 720] | max >= 29.98 на [360, 720] | rebased on the cost-price pre-shock level |
| 18 | B electronics output falls to <= 70% (pre-shock 16.59) | min <= 11.6 на [360, 720] | min <= 13.89 на [360, 720] | rebased on the cost-price pre-shock level |
| 18 | ore depletion -> A price -> B electronics cost | < 500 → > 42.45 → > 20.09 | < 500 → > 75.2 → > 32.59 | rebased on the cost-price pre-shock level |
| 18 | recovery — A metal price back within 5% by day 1080 | last <= 35.66 на [1080, 1080] | last <= 63.18 на [1080, 1080] | rebased on the cost-price pre-shock level |
| 18 | recovery — B electronics output >= 85% of pre-shock (16.27) by day 1080 | last >= 13.8 на [1080, 1080] | last >= 16.86 на [1080, 1080] | rebased on the cost-price pre-shock level |
| 19 | A metal input demand at day 1080 >= 1.5 x pre-shock | last >= 7.303 на [1080, 1080] | last >= 8.28 на [1080, 1080] | rebased on the cost-price pre-shock level |
| 19 | input demand rise precedes generation build-up | > 6.09 → > 0.82 | > 6.62 → > 0.923 | rebased on the cost-price pre-shock level |
| 19 | generation expansion accelerates >= 1.5 x pre-shock (r1.2) | max >= 0.5864 на [360, 1080] | max >= 0.923 на [360, 1080] | rebased on the cost-price pre-shock level |
| 19 | A input fulfillment dips under sustained growth (< pre-shock 0.9664) (r1.2) | min < 0.9664 на [360, 1080] | min < 0.9652 на [360, 1080] | rebased on the cost-price pre-shock level |
| 21 | B has no expansion demand after the first year (B contracts) | max <= 0 на [360, 1080] | max <= 0 на [720, 1080] | on cost prices B spends its starting capital goods on power in years 1-2, then builds nothing |
| 21 | B capital goods inventory stays flat after the first year (contracting B builds nothing) | min >= 25.6 на [360, 1080] | min >= 0.5 на [720, 1080] | on cost prices B spends its starting capital goods on power in years 1-2, then builds nothing (stock 0.551 from 30) |
| 21 | going concern - planet electronics production @1080 within +-15% of Mode 17 (37.04) | last >= 31.5 на [1080, 1080] | last >= 38.1 на [1080, 1080] | Mode 17 on cost prices |
| 21 | going concern - planet electronics production @1080 not above +15% of Mode 17 | last <= 42.6 на [1080, 1080] | last <= 51.55 на [1080, 1080] | Mode 17 on cost prices |
| 21 | going concern - planet smelting @1080 within +-15% of Mode 17 (50.09) | last >= 42.6 на [1080, 1080] | last >= 49.7 на [1080, 1080] | Mode 17 on cost prices |
| 21 | going concern - planet smelting @1080 not above +15% of Mode 17 | last <= 57.6 на [1080, 1080] | last <= 67.24 на [1080, 1080] | Mode 17 on cost prices |
| 21 | A refinery capital @1080 within 0.9..1.0 x Mode 17 (61.28) | last >= 55.2 на [1080, 1080] | last >= 62.3 на [1080, 1080] | Mode 17 on cost prices |
| 21 | A refinery capital @1080 not above Mode 17 (64.27) | last <= 64.3 на [1080, 1080] | last <= 69.3 на [1080, 1080] | Mode 17 on cost prices |
| 21 | A power capital @1080 within 0.9..1.0 x Mode 17 (1610.1) | last >= 1449 на [1080, 1080] | last >= 1729.9 на [1080, 1080] | Mode 17 on cost prices |
| 21 | A power capital @1080 not above Mode 17 (1815.5) | last <= 1815 на [1080, 1080] | last <= 1922.2 на [1080, 1080] | Mode 17 on cost prices |
| 21 | B capital goods inventory stays flat after the first year (upper) | max <= 25.8 на [360, 1080] | max <= 0.6 на [720, 1080] | on cost prices B spends its starting capital goods on power in years 1-2, then builds nothing |
| 22 | A capital goods fulfillment stays above 0.2 (no total collapse) | min >= 0.2 на [360, 720] | min >= 0.15 на [360, 720] | skeleton min 0.197 |
| 22 | A refinery capital @720 lags Mode 21 (57.88) by >= 3% | last <= 56.1 на [720, 720] | last <= 60.86 на [720, 720] |  |
| 22 | A power capital @720 lags Mode 21 (1647.2) by >= 3% | last <= 1597 на [720, 720] | last <= 1658.2 на [720, 720] |  |
| 22 | B unaffected | min >= 0.85 на [0, 1080] | min >= 0.75 на [0, 1080] | B spent its capital goods buffer on power in years 1-2 (Mode 21), skeleton min 0.81 |
| 23 | A capital goods demand rises >= 1.2 x pre-shock (0.602 @359.75) | max >= 0.72 на [360, 1080] | max >= 1.066 на [360, 1080] | rebased on the cost-price pre-shock mean (days 300-360) |
| 23 | A capital goods production follows demand (>= 1.2 x pre-shock 0.552) | max >= 0.72 на [360, 1080] | max >= 0.972 на [360, 1080] | rebased on the cost-price pre-shock mean (days 300-360) |
| 23 | demand rise -> fulfillment dip -> production rise | > 0.98 → < 0.95 → > 0.907 | > 1.066 → < 0.95 → > 0.972 | rebased on the cost-price pre-shock mean (days 300-360) |
| 23 | A power expansion >= 1.5 x pre-shock (0.356 @359.75) | max >= 0.534 на [360, 1080] | max >= 0.862 на [360, 1080] | rebased on the cost-price pre-shock mean (days 300-360) |
| 23 | A refinery expansion holds (>= 0.9 x pre-shock 0.024) | max >= 0.0216 на [360, 1080] | max >= 0.028 на [360, 1080] | rebased on the cost-price pre-shock mean (days 300-360) |
| 23 | B capital goods fulfillment stays >= 0.85 (scale-free buffer) | min >= 0.85 на [0, 1080] | min >= 0.7 на [0, 1080] | B spent its capital goods buffer on power in years 1-2 (Mode 21), skeleton min 0.764 |
| 25 | A energy is rationed, not cut off (v7.6.1 calibration) | min >= 400 на [360, 720] | min >= 350 на [360, 720] | deeper on cost prices, skeleton min 394.5 (v7.7.17: 599) |
| 31 | B construction-materials production absent before surge | нет события > 0 на [0, 359.75] | max <= 0.05 на [0, 359.75] | from day 226 at most 0.02 |
| 35 | B CM plant expansion during surge | max > 0.007 на [360, 720] | max > 0.003 на [360, 720] | B wins fewer surge orders on cost prices, skeleton 0.0039 (v7.7.17: 0.0083) |
| 35 | B CM plant installed capacity grows during surge | Δ [360, 720] > 0.8 | Δ [360, 720] > 0.4 | B wins fewer surge orders on cost prices, skeleton +0.49 (v7.7.17: +0.84) |
| 35 | B Construction Materials production rate is active | max > 0.9 на [360, 720] | max > 0.8 на [360, 720] | B wins fewer surge orders on cost prices, skeleton 0.89 (v7.7.17: 1.03) |
| 37 | B CG plant expansion responds during surge | max > 0.005 на [360, 720] | max > 0.0025 на [360, 720] | B wins fewer surge orders on cost prices, skeleton 0.0034 (v7.7.17: 0.0082) |
| 37 | B CG plant installed capacity rebuilds during surge | Δ [360, 720] > 0.5 | Δ [360, 720] > 0.4 | B wins fewer surge orders on cost prices, skeleton +0.47 (v7.7.17: +0.75) |
| 37 | B Capital Goods production rate recovers | max > 0.9 на [360, 720] | max > 0.7 на [360, 720] | B wins fewer surge orders on cost prices, skeleton 0.76 (v7.7.17: 0.96) |
| 38 | A Regolith Mine Capacity declines materially by day 1080 | Δ [0, 1080] < -4 | Δ [0, 1080] < -3.5 | skeleton -3.98 (v7.7.17: -4.17) |
| 39 | B Regolith Mine expansion responds during surge | max > 0.03 на [360, 720] | max > 0.02 на [360, 720] | B wins fewer surge orders on cost prices, skeleton 0.025 (v7.7.17: 0.039) |
| 39 | B Regolith Mine Capacity rebuilds during surge | Δ [360, 720] > 5 | Δ [360, 720] > 2.5 | B wins fewer surge orders on cost prices, skeleton +3.24 (v7.7.17: +5.29) |
| 43 | B power resource inventory is drawn down while the mine rebuilds | min < 1900 на [360, 720] | min < 1950 на [360, 720] | B wins fewer surge orders on cost prices, skeleton min 1908 from 5000 (v7.7.17: 1553) |
| 48 | A labor requirement falls with automation (Mode 46 mean 13.45) | mean < 10 | mean < 10 |  |
| 48 | A metal unit cost falls with automation (Mode 46 mean 20.59) | mean < 18.7 | mean < 42.7 | Mode 46 on cost prices, same ratio |
| 48 | A electronics unit cost falls with automation (Mode 46 mean 16.16) | mean < 14.9 | mean < 30.5 | Mode 46 on cost prices, same ratio |
| 48 | A metal price follows the lower cost (Mode 46 mean 36.98) | mean < 36 | mean < 76.6 | Mode 46 on cost prices, same ratio |
| 48 | A metal production rises a little (Mode 46 mean 36.71) | mean > 37.1 | mean > 39.4 | skeleton 40.68 |
| 49 | A food price stays near its reference 10 | max < 11 | max < 19.35 | skeleton max 18.57 |
| 52 | A metal price falls with less export demand | mean < 30 | mean < 63.9 | skeleton mean 58.84 (Mode 49: 79.27) |
| 52 | **новая:** with money B households stay out of debt | — | min > 30000 | skeleton min 37537 |
| 52 | **новая:** with money the trade deficit of B is gone | — | last > -120 | skeleton end -37 |
| 52 | **новая:** with money A households hold money near their target | — | min > 140000 | skeleton min 162778 |
| 52 | **новая:** with money A real wage keeps its level | — | mean > 115 | skeleton mean 118.4 |
| 52 | **новая:** with money the budget holds B demand to its income | — | last < 4 | skeleton end 3.40 (v7.7.17: 5.64) |
| 53 | the labor guard bites during the transport surge | min < 0.98 | min > 0.99 | with money the budget keeps A staffed (as Mode 59); the labor guard stays tested in Mode 57, skeleton min 0.9986 |
| 53 | A labor runs tight during the surge | max > 1.02 | max < 1.01 | with money the budget keeps A staffed (as Mode 59); the labor guard stays tested in Mode 57, skeleton max 1.0014 |
| 53 | **новая:** with money B households stay out of debt | — | min > 30000 | skeleton min 37537 |
| 53 | **новая:** with money the trade deficit of B is gone | — | last > -120 | skeleton end -33 |
| 53 | **новая:** with money A households hold money near their target | — | min > 140000 | skeleton min 162778 |
| 53 | **новая:** with money A real wage keeps its level | — | mean > 115 | skeleton mean 118.4 |
| 54 | B ore gets cheaper as B wage falls | min < 13.9 | min < 24.85 | on cost prices the wage reaches prices through the labor cost, skeleton min 24.66 |
| 54 | B food gets cheaper in the third year | max < 9.95 на [720, 1080] | max < 24.4 на [720, 1080] | on cost prices the wage reaches prices through the labor cost, skeleton max 24.20 |
| 54 | B energy gets cheaper | min < 0.0695 | min < 0.67 | on cost prices the wage reaches prices through the labor cost, skeleton min 0.658 |
| 54 | A prices move with A wage only slightly | max < 4.2 | max < 11.2 | on cost prices the wage reaches prices through the labor cost, skeleton max 11.09 |
| 55 | the labor guard still bites in the surge | min < 0.98 | min > 0.99 | with money the budget keeps A staffed (as Mode 59); the labor guard stays tested in Mode 57, skeleton min 1.00 |
| 55 | the labor guard bites less than without wage pricing | min > 0.955 | min > 0.9986 |  |
| 55 | price demand damps the A metal price peak | max < 35 | max < 60.5 | with budgets price demand adds little, skeleton max 60.30 |
| 55 | A ore follows A wage up in the surge | max > 4.05 | max > 11.05 | on cost prices the wage reaches prices through the labor cost, skeleton max 11.10 |

Остальные проверки v7.7.17 проходят без изменений.

## 5. Аннотации

Обновить (`since` прежний, текст — под новую калибровку):
- `A Metal Demand Reference Price`, `A Electronics Demand Reference Price` (`applies_to_mirror: true`): новые значения §1.2 и правило «прежнее × масштаб товара»;
- `Cost Pricing Enabled`: 1 в Modes 0–59 (сценариями), система цен всей модели; привязки затрат к слоям;
- `Money Enabled`: 1 в Modes 52–55 и 58–59; почему не в «лестнице» (равновесный старт денег — старт полной экономики);
- `Wage Pricing Enabled`: в Modes 54–55 на затратных ценах ценовой канал перекрыт, остаётся ценовой спрос.

Ссылаться на `docs/research/RECALIBRATION_PREP_2026-10-18_RU.md` и эту спецификацию.

## 5.1 Проверка реализуемости (skeleton, до выдачи)

| Проверка | Результат |
|---|---|
| патч применяется (`APPLY_PATCH` v0.9.22) | skeleton `d82ef38f…`, 6267 элементов, 60 сценариев; отпечаток определений `024f99393d36e71e` |
| `check-validation` черновика против skeleton | 0 ошибок; черновик записан как `JSON.stringify(v, null, 2) + "
"` |
| validation черновика на всех 60 Modes | **PASS 60/60**, 29229 проверок (сервер, 30 кусков) |
| черновик policy против v7.7.17 | **POLICY PASS**: 56506 событий, все ожидаемые, неожиданных 0; Modes 56–59 — изменились ровно 8 мёртвых рядов (сервер: сравнение по кускам, объединено, `evaluate-policy`) |
| контроль: черновик validation на v7.7.17 | 17 пересчитанных проверок падают; остальные пересчитанные проходят и там — у них сдвинут центр, а не механизм |
| самотесты стенда со skeleton в роли принятой модели (шаг 0a), декларации `cost_pricing` (привязки) и `wage_pricing` (новые опорные цены), сервер | все PASS: qa 50, node_qa **87**, planet_qa 20, structure_qa 21, conformance_qa 18, compare_qa, policy_qa 10, loop_qa 19 — после исправлений `node_qa` в main (ниже) |

**Шаг 0a нашёл три допущения `node_qa`, привязанных к прежнему состоянию модели** (исправлены в main до выдачи; на v7.7.17 и на skeleton — node_qa 87/87):
- **случаи 60 и 64:** принятый слой `wage_pricing` пересобирался из фикстуры стенда (опорные цены спроса 25.9…), а не из принятой декларации (58.38…). Теперь, если узел уже в модели, берётся его декларация — правило случая 44 из задачи 035. На этом держались и вложенные 66, 73, 80;
- **случай 87** (задача 042) считал, что в принятой модели слой `cost_pricing` ещё без привязок, и накладывал их сам. Теперь он принимает оба состояния: без привязок (до 043) и с ними (после).
