# v7.7.2 — Construction Materials use Energy — архитектурная спецификация

Статус: **r1** (2026-09-26). База: accepted **v7.7.1 r1** (SHA `d53d014d…`). Реализуемость проверена нами полным skeleton-патчем до выдачи (§7). Место в плане: первый шаг модели под счётчиком Planet v1 — P3 (`docs/PLANET_V1_CONTRACT_RU.md`): 5 → 4 процесса без энергии на колонию.

## 0. Правило не-регрессии

Modes **0–31** воспроизводят accepted v7.7.1 r1 **точно** (`maxAbs = 0` на канонической платформе). Переключатель `Construction Materials Energy Enabled` = 1 в сыром файле; сценарии 0–31 задают 0 явно; новые 32–33 — 1. Правки существующих формул — только `IfThenElse([Construction Materials Energy Enabled] = 1, new, old)` с **дословным** `old`.

## 1. Что меняется

Переработка реголита в стройматериалы становится **третьим потребителем** общего энергетического аллокатора колонии — рядом с плавкой и электроникой, по их же образцу (v7.2):

```text
X Construction Materials Requested Energy = X Pre Energy Construction Materials Production Rate × Construction Materials Energy per Unit
X Total Requested Energy                 += X Construction Materials Requested Energy
X Construction Materials Production Rate  = X Pre Energy … Rate × X Construction Materials Energy Fulfillment Ratio
```

Аллокатор пропорциональный (один `X Energy Fulfillment Ratio` на всех потребителей) и **не меняется**.

**Причинность на шаге (главное).** План выпуска стройматериалов, который идёт в аллокатор, читает **сглаженный сигнал спроса** — сток `X Construction Materials Demand Signal`, а не мгновенный `X Construction Materials Demand`. Причина — алгебраическая петля, найденная аудитом `loops` на первом skeleton (64 из 256 комбинаций, Modes 32–33):

```text
X Smelting Rate → X Refinery Profit → … → X Refinery Desired Expansion → X Construction Materials Demand
→ X Desired Construction Materials Production → X Pre Energy CM Rate → X CM Requested Energy
→ X Total Requested Energy → X Energy Fulfillment Ratio → X Metal Allocated Energy → … → X Smelting Rate
```

Желаемое расширение считается от **фактической** прибыли этого шага; если план стройматериалов читает его напрямую, запрос энергии замыкается сам на себя. Это урок v7.6 (контракт §8 п. 10): то, что питает аллокатор или цену, читает сглаженное состояние. Идиома уже есть в модели — `X Energy Demand Signal`; сигнал спроса на стройматериалы устроен так же.

## 2. Новые элементы

| Элемент | Тип | Определение |
|---|---|---|
| `Construction Materials Energy Enabled` | VARIABLE | 1 (switch) |
| `Construction Materials Energy per Unit` | VARIABLE | 10 (энергия на единицу стройматериалов; плавка — 30, электроника — 12) |
| `Construction Materials Demand Signal Adjustment Time` | VARIABLE | 3 (как `Energy Demand Signal Adjustment Time`) |
| `X Construction Materials Demand Signal` | STOCK, non-negative | начальное 0.14 (спрос на стройматериалы в день 0 ≈ 0.137) |
| `X Construction Materials Demand Signal Increase` | FLOW ∅ → Signal | `IfThenElse([X CM Demand] > [Signal], ([X CM Demand] − [Signal]) / [Adjustment Time], 0)` |
| `X Construction Materials Demand Signal Decrease` | FLOW Signal → ∅ | `IfThenElse([Signal] > [X CM Demand], ([Signal] − [X CM Demand]) / [Adjustment Time], 0)` |
| `X Pre Energy Construction Materials Production Rate` | VARIABLE | **дословно** прежняя формула `X Construction Materials Production Rate` |
| `X Construction Materials Requested Energy` | VARIABLE | `IfThenElse(switch, [X Pre Energy CM Rate] × [Construction Materials Energy per Unit], 0)` |
| `X Construction Materials Allocated Energy` | VARIABLE | `[X CM Requested Energy] × [X Energy Fulfillment Ratio]` |
| `X Construction Materials Energy Fulfillment Ratio` | VARIABLE | `IfThenElse([X CM Requested Energy] > 0.001, [X CM Allocated Energy] / [X CM Requested Energy], 1)` |

X ∈ {A, B}, зеркально. Потоки сигнала попадают в категорию `information_signal` по уже существующим маскам (`* Signal Increase` / `* Signal Decrease`) — правка `open_boundaries` не нужна. Новые константы аннотируются исполнителем (тег `construction-materials`).

## 3. Изменяемые существующие элементы (исчерпывающий список)

| Элемент | Новая формула |
|---|---|
| `X Construction Materials Production Rate` (×2) | `IfThenElse(switch, [X Pre Energy CM Rate] × [X CM Energy Fulfillment Ratio], <old verbatim>)` |
| `X Desired Construction Materials Production` (×2) | `IfThenElse(switch, Max(0, [Signal] + ([Signal] × [Construction Materials Target Days] − [X CM Inventory]) / [Construction Materials Adjustment Time]), <old verbatim>)` — прежняя формула с сигналом вместо мгновенного спроса (и в целевом запасе тоже) |
| `X Total Requested Energy` (×2) | `IfThenElse(switch, <old verbatim> + [X CM Requested Energy], <old verbatim>)` |
| `X Energy Supply` (×2) | `IfThenElse(switch, <old verbatim> + [X CM Allocated Energy], <old verbatim>)` |
| `Test 26 Energy Kernel Capacity Shock Active` | `IfThenElse([Timed Test Mode] = 26, [Temporary Test Window], IfThenElse([Timed Test Mode] = 33, [Temporary Test Window], 0))` |

Всё остальное — запрещено. В частности: не менять аллокатор, `X Energy Fulfillment Ratio`, формулы плавки и электроники, `X Construction Materials Target Inventory` (его читают и другие элементы), расход реголита (он читает фактический выпуск — пара остаётся верной).

## 4. Сценарии

Оба включают всю модель (все прежние переключатели = 1 и `Construction Materials Energy Enabled` = 1).

| Mode | Имя | Что происходит |
|---|---|---|
| 32 | `v7.7.2 Construction Materials Energy Baseline` | без стимулов |
| 33 | `v7.7.2 Generation Capacity Shock with Construction Materials Energy` | шок мощности генерации в стандартном окне (`Test 26 …`, как Mode 26) |

## 5. Граница модели, аудиты, стенд

- `open_boundaries`: +4 потока сигнала (`information_signal`), итого 126 граничных; новых пар и категорий нет.
- `energy_balance` (Lab **v0.9.7**): `consumers` = `["Metal", "Electronics", "Construction Materials"]` — тождество `Supply = Σ Allocated` с третьим потребителем. В Modes 0–31 запрос стройматериалов 0, тождество верно и там.
- `planet_closure`: процесс `construction_materials` — `energy: requests`, `{C} Construction Materials Requested Energy`. Счётчик P3: запрашивают 4 → **6**, исключений 11 → **9**.
- `loops`: 0 петель в 256 комбинациях 8 переключателей.

## 6. Известные ограничения

- Колония A: энергия и без стройматериалов не покрыта полностью во всех связных Modes (`A Energy Fulfillment Ratio` ≈ 0.90–0.96), поэтому выпуск стройматериалов A ограничен энергией уже в baseline (~5–7 %).
- Mode 33: в окне шока стройки A встают (спрос на стройматериалы A → 0) — производство смещается в B, и ограничение энергией видно на **B**.
- Сигнал спроса живёт и в Modes 0–31 (новый ряд, на модель не влияет).
- Энергия добычи реголита, руды, оборудования и транспорта — следующие шаги P3.

## 7. Проверка реализуемости (skeleton, до выдачи)

Полный skeleton (17 элементов, 9 замен, 58 LINK, переключатель в Modes 0–31, Modes 32–33), обе колонии:

| Проверка | Результат |
|---|---|
| `loops` | первый skeleton (без сигнала): **64 из 256** комбинаций с петлёй, Modes 32–33 — петля выше; с сигналом: **0 из 256** |
| `LIFECYCLE_CONFORMANCE` | PASS |
| `STRUCTURE_AUDIT` с черновиком validation | PASS: граничных 126, неклассифицированных 0, closed-world 0, A/B 0; Planet closure P3 = 6/2/9/0 |
| validation черновика (`draft/`) на всех 34 Modes | `OVERALL: PASS`, 0 FAIL; `energy_balance` с тремя потребителями верен во всех Modes |
| регрессия Modes 0–31 (полный `CHECK_CANDIDATE`) | 32 × `common = 1082, changed = 0, maxAbs = 0`, +17 рядов |
| черновик change-policy (`draft/`) на полном skeleton | `POLICY PASS` с первой попытки: 662 события, неожиданных 0 |

Поведение (ориентиры, не пороги; `Construction Materials Energy per Unit` = 10):

| | Mode 32 | Mode 33 |
|---|---|---|
| A CM energy fulfillment min | ≈ 0.926 | ≈ 0.786 |
| A CM: план «до энергии» / факт (max) | 2.725 / 2.725; в среднем 0.815 / 0.778 | стройки A в окне стоят |
| B CM requested energy (max) | 0 | ≈ 13.8 (в окне) |
| B CM energy fulfillment min | 1 | ≈ 0.715 (в окне) |
| B CM: план / факт в окне (max) | 0 / 0 | ≈ 1.38 / ≈ 1.05 |
| B строит в окне (max): Refinery / Power | 0 / 0 | ≈ 0.053 / ≈ 0.465 |
| доля CM в запросе энергии A | ≈ 0.5 % (8 из 1500) | — |

Сам skeleton исполнителю не выдаётся.
