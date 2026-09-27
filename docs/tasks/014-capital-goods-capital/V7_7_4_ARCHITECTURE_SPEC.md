# v7.7.4 — Capital Goods Capital — архитектурная спецификация

Статус: **r1** (2026-09-27). База: accepted **v7.7.3 r1** (SHA `a620cc65…`). Реализуемость проверена нами полным skeleton-патчем до выдачи (§7). Место в плане: шаг модели под счётчиком Planet v1 — **P2** (`docs/PLANET_V1_CONTRACT_RU.md`): мощность производства оборудования перестаёт быть константой (A 2, B 1) и становится капиталом. Это самое жёсткое ограничение роста модели: оборудование нужно для расширения всех секторов.

**Образец — задача 013** (`docs/tasks/013-construction-materials-capital/`): завод стройматериалов на ядре капитала. Здесь та же схема для оборудования, с одним дополнением — сигналом спроса на оборудование (§1).

## 0. Правило не-регрессии

Modes **0–35** воспроизводят accepted v7.7.3 r1 **точно** (`maxAbs = 0` на канонической платформе). Переключатель `Capital Goods Capital Enabled` = 1 в сыром файле; сценарии 0–35 задают 0 явно; новые 36–37 — 1. Правки существующих формул — только `IfThenElse([Capital Goods Capital Enabled] = 1, new, old)` с **дословным** `old`.

## 1. Что меняется

В каждой колонии появляется **завод оборудования** — новый экземпляр ядра жизненного цикла капитала (kernel v2) по образцу завода стройматериалов v7.7.3: без финансового ограничения (у оборудования нет рыночной цены — вариация ядра, как у Power), `switch_gated: false`, свой переключатель. При включённом переключателе:

```text
X Capital Goods Production Capacity = X Capital Goods Plant Active Capacity   (с прежним множителем шока Mode 22)
X Capital Goods Plant Expansion     = Gap Limited Construction × Min(X Capital Goods Fulfillment, X Construction Materials Fulfillment)
```

Завод оборудования строится **из оборудования** (и стройматериалов); его желаемое расширение добавляется к спросу на оба.

**Новое по сравнению с 013 — сигнал спроса на оборудование.** Завод стройматериалов в v7.7.3 взял готовый сглаженный сигнал спроса (сток v7.7.2). У оборудования такого стока нет, а читать мгновенный спрос нельзя: `CG Demand → требуемая мощность завода → желаемое расширение завода → CG Demand` — петля того же рода, что в 012 и 013 (расширение потребляет продукт плана). Поэтому в каждой колонии вводится сток `X Capital Goods Demand Signal` с потоками `… Increase / … Decrease` (идиома `Energy Demand Signal` и `Construction Materials Demand Signal`, время подстройки 3 дня, начальное значение 0.13 — спрос в день 0). Сигнал заложен в skeleton с первой версии: **аудит `loops` — 0 из 1024 с первой попытки**.

## 2. Новые элементы

| Элемент | Тип | Определение |
|---|---|---|
| `Capital Goods Capital Enabled` | VARIABLE | 1 (switch) |
| `Capital Goods Demand Signal Adjustment Time` | VARIABLE | 3 |
| `X Capital Goods Demand Signal` | STOCK, non-negative | начальное 0.13 |
| `X Capital Goods Demand Signal Increase / Decrease` | FLOW ∅ → Signal / Signal → ∅ | `IfThenElse(Demand > Signal, (Demand − Signal) / Adj, 0)` и зеркально |
| `Capital Goods Plant <param>` | VARIABLE ×10 | как у завода стройматериалов v7.7.3: Operating Reserve Factor 1.1, Installed Reserve Factor 1.15, Activation Time 20, Mothball Time 10, Surplus Disposal Decision Time 240, Construction Time 120, Decommissioning Time 540, Depreciation Rate 0.0001, Capital Goods per Capacity 5, Construction Materials per Capacity 5 |
| `X Capital Goods Plant Installed / Active Capacity` | STOCK | начальное = прежней базовой мощности: A 2, B 1 |
| `X Capital Goods Plant Decommissioning / Retired Capacity` | STOCK | 0 |
| `X … Required Active Capacity` | VARIABLE | `[X Capital Goods Demand Signal] × Operating Reserve Factor` |
| остальные роли ядра, 7 потоков, `Desired Expansion`, два расхода | — | **дословно по образцу** `X Construction Materials Plant …` v7.7.3 (accepted модель), с заменой `Construction Materials Plant` → `Capital Goods Plant` и переключателя |

X ∈ {A, B}, зеркально. Точный список имён — `draft/validation-v7.7.4-draft.json` (плагин `capital_lifecycle_kernel`, экземпляры `A/B Capital Goods Plant`). Константы аннотируются исполнителем; A/B начальные мощности — несимметричная пара.

## 3. Изменяемые существующие элементы (исчерпывающий список)

| Элемент | Новая формула |
|---|---|
| `X Capital Goods Production Capacity` (×2) | `IfThenElse(switch, <old с [X CG Base Production Capacity] → [X CG Plant Active Capacity]>, <old verbatim>)` — шок Mode 22 сохраняется |
| `X Capital Goods Demand` (×2) | `IfThenElse(switch, <old verbatim> + [X CG Plant Desired Expansion] × [CG Plant Capital Goods per Capacity], <old verbatim>)` |
| `X Construction Materials Demand` (×2) | `IfThenElse(switch, <old verbatim> + [X CG Plant Desired Expansion] × [CG Plant Construction Materials per Capacity], <old verbatim>)` |
| `Test 2 Transport Surge Active` | прежняя вложенная цепочка + ветка `IfThenElse([Timed Test Mode] = 37, [Temporary Test Window], 0)` вместо последнего `0` |

Всё остальное — запрещено. `X Capital Goods Base Production Capacity` остаётся (его читает старая ветка). Желаемый выпуск оборудования (`X Desired Capital Goods Production`) не меняется: сигнал читает только завод.

## 4. Сценарии

| Mode | Имя | Что происходит |
|---|---|---|
| 36 | `v7.7.4 Capital Goods Capital Baseline` | всё включено (включая оба завода), без стимулов |
| 37 | `v7.7.4 Transport Surge on Capital Goods Capital` | всплеск транспортного спроса (`Test 2`), как Modes 24, 31, 35 |

## 5. Граница модели, аудиты

- `capital_lifecycle_kernel`: **11 экземпляров** (+2), новые — `CONFORMING_WITH_VARIATION`.
- `open_boundaries`: граничных 154 (+16): 4 потока сигнала — `information_signal`; активация/консервация/износ — `capital_state_accounting`; расширение и два расхода — `capital_transformation` (в черновике); +2 пары.
- `planet_closure`: процесс `capital_goods` — `capacity: kernel`, `{C} Capital Goods Plant Active Capacity`. **P2: kernel 9 → 11, исключений 8 → 6.**
- `loops`: 0 из 1024 (10 переключателей).

## 6. Наблюдения

- **Mode 36:** на раннем пике спроса завод A **впервые растёт сверх стартовой мощности** (2 → ≈ 2.09), затем, как и завод стройматериалов, сворачивает излишек (→ ≈ 0.51 к дню 1080); B сворачивает до ≈ 0.03.
- **Mode 37:** к дню 360 завод B законсервирован до ≈ 0.24; во всплеске B **строит его заново** (до ≈ 1.15) — и пока строит, оборудования B остро не хватает (fulfillment до ≈ 0.19 против ≈ 0.92 в v7.7.3 Mode 35). Одновременно не хватает и стройматериалов (≈ 0.13): оба завода B восстанавливаются из одних и тех же запасов.
- Производство руды, реголита и энергоресурса остаётся на константах (последние P2-исключения).

## 7. Проверка реализуемости (skeleton, до выдачи)

Полный skeleton (76 элементов, 7 замен, 138 LINK, переключатель в Modes 0–35, Modes 36–37), обе колонии:

| Проверка | Результат |
|---|---|
| `loops` | **0 из 1024** с первой попытки (сигнал заложен сразу) |
| `LIFECYCLE_CONFORMANCE` | PASS, 11 экземпляров; новые — `CONFORMING_WITH_VARIATION` (69/69) |
| `STRUCTURE_AUDIT` с черновиком validation | PASS: граничных 154, неклассифицированных 0, closed-world 0, A/B 0; Planet closure P2 = 11/6/0 |
| проверки test plan с порогами skeleton | исполнены на skeleton (Modes 0, 22, 36, 37) — `OVERALL: PASS` |
| validation черновика (`draft/`) на всех 38 Modes | `OVERALL: PASS`, 0 FAIL; runtime-тождества ядра для 11 экземпляров верны во всех Modes |
| регрессия Modes 0–35 (полный `CHECK_CANDIDATE`) | 36 × `common = 1168, changed = 0, maxAbs = 0`, +76 рядов |
| черновик change-policy (`draft/`) на полном skeleton | `POLICY PASS` с первой попытки: 2995 событий, неожиданных 0 |

Поведение (ориентиры, не пороги):

| | Mode 36 | Mode 37 |
|---|---|---|
| A завод: старт → max → день 1080 | 2 → ≈ 2.09 → ≈ 0.51 | 2 → ≈ 2.09 → ≈ 0.52 |
| B завод: день 360 → max в окне | ≈ 0.24 → — | ≈ 0.24 → ≈ 1.15 |
| B расширение завода (max) | 0 | ≈ 0.009 в день |
| B расход завода: оборудование (max) | 0 | ≈ 0.044 в день |
| B выпуск оборудования (max в окне) | 0 | ≈ 1.02 |
| B CG / CM fulfillment min | ≈ 0.99 / ≈ 0.99 | ≈ 0.19 / ≈ 0.13 |
| A выпуск оборудования (max) | ≈ 1.74 | ≈ 1.74 |

Сам skeleton исполнителю не выдаётся.
