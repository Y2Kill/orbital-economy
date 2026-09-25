# v7.5 — Capital Goods / kernel-v2 — architecture specification

Статус: **r1 + erratum r2** (2026-09-22). Erratum по итогам приёмки candidate r1 (`task_003_feedback_1/ACCEPTANCE_R1_RU.md` §3.4): (a) шесть потоков `X <Sector> Capital Goods Consumption` оборачиваются в `IfThenElse([Capital Goods Enabled] = 1, …, 0)`; identity пар — только Modes 21–23; (b) `Capital Goods Buffer` (0.5, единицы) заменяется на **`Capital Goods Buffer Days` = 1** (дни спроса): `Fulfillment = Inv / (Inv + Buffer Days × Max(Demand, 1e-9))` — безмасштабно (при `Inv/(Inv+0.5)` колония с малым спросом недообслужена в равновесии: D = 0.08 → 0.83); (c) `v7.5 Capital Goods Shock Multiplier` = 0.1 (при capacity 2 и ×0.3 шок не кусается). Ниже — текст r1 без правок.

Статус r1: (2026-09-21). База: accepted **v7.4.1 r1** (SHA `07ce33e0…`), стенд Orbital Economy Lab v0.9.0. Реализуемость проверена skeleton-патчем (`skeleton/`): петель нет, Modes 0/12/17 точны при выключенном переключателе, Mode 21 считается.

Решения владельца проекта (2026-09-21): «оборудование» — один абстрактный агрегат («от тостера до самолёта», заглушка для многих будущих отраслей); норма расхода оборудования на единицу мощности по секторам — ещё один настраиваемый параметр (в реестр); дефицит оборудования задерживает строительство через fulfillment, как в v7.4.

## 0. Правило не-регрессии

Modes **0–20** воспроизводят accepted v7.4.1 r1 **точно** (852 ряда, `maxAbs = 0`). Переключатель `Capital Goods Enabled` (1 в сыром файле; сценарии 0–20 задают 0 явно; новые 21–23 — 1). Правки существующих формул — только `IfThenElse([Capital Goods Enabled] = 1, new, old)` с дословным `old`.

## 1. Что меняется по существу

В v7.4 все семь kernel-экземпляров расширяют установленный капитал потоком `expansion: ∅ → Installed` — капитал возникает без физических товаров (7 нарушений closed-world). v7.5 вводит в каждой колонии сектор **Capital Goods**: производит агрегатное «оборудование» из металла и электроники, держит его запас, а строительство мощностей его потребляет. Kernel-v2: `expansion` становится

```text
expansion = desired expansion × capital goods fulfillment
desired expansion = прежняя формула (gap-limited ∧ finance-limited)     ← без изменений
capital goods fulfillment = CG Inventory / (CG Inventory + Capital Goods Buffer)   ← мягкое нормирование, общее для всех секторов колонии
```

и сопровождается потоком потребления `X <Sector> Capital Goods Consumption: X Capital Goods Inventory → ∅ = expansion × X <Sector> Capital Goods per Capacity`. Пара «∅ → Installed» + «CG Inventory → ∅ × коэффициент» — это **преобразование единиц** (оборудование → мощность), как руда → металл; аудит `open_boundaries` получает для таких пар декларацию (см. §6), и категория `external_capital` пустеет.

**Область v7.5: шесть колониальных экземпляров** — Refinery, Electronics, Power × A/B. **Transport (глобальный) — не входит** (счётчик 7 → 1): его оборудование пришлось бы делить между колониями — отдельное решение для v7.5.1. Торговли оборудованием между A и B нет (v8).

## 2. Сектор Capital Goods (X ∈ {A, B}, зеркально)

| Элемент | Тип | Определение |
|---|---|---|
| `X Capital Goods Inventory` | STOCK | запас оборудования; initial **[calib]** (skeleton: 30) |
| `X Capital Goods Demand` | VARIABLE | `Σ_sectors X <Sector> Desired Expansion × X <Sector> Capital Goods per Capacity` |
| `X Capital Goods Target Inventory` | VARIABLE | `Demand × Capital Goods Target Days` |
| `X Desired Capital Goods Production` | VARIABLE | `Max(0, Demand + (Target − Inventory) / Capital Goods Adjustment Time)` |
| `X Capital Goods Production Rate` | VARIABLE | `IfThenElse(switch, soft-cap(Desired, X Capital Goods Production Capacity) × [X Metal Inventory]/([X Metal Inventory] + [X Metal Buffer]) × [X Electronics Inventory]/([X Electronics Inventory] + [X Electronics Buffer]), 0)` — soft-cap в стиле модели: `d / (1 + (d/(c+0.001))^8)^0.125` |
| `X Capital Goods Production` | FLOW ∅ → CG Inventory | `= Production Rate` (пара: см. потребление ниже) |
| `X Capital Goods Metal Consumption` | FLOW X Metal Inventory → ∅ | `Production Rate × Metal per Capital Goods Unit` |
| `X Capital Goods Electronics Consumption` | FLOW X Electronics Inventory → ∅ | `Production Rate × Electronics per Capital Goods Unit` |
| `X Capital Goods Fulfillment` | VARIABLE | `IfThenElse(switch, Inventory / (Inventory + Capital Goods Buffer), 1)` |
| `X <Sector> Desired Expansion` (×3) | VARIABLE | дословно прежняя формула `expansion` сектора (для Electronics/Power — включая множитель `[Capital Lifecycle Enabled]`) |
| `X <Sector> Capital Goods Consumption` (×3) | FLOW CG Inventory → ∅ | `[X <Sector> Expansion] × [X <Sector> Capital Goods per Capacity]` |

Глобальные константы: `Capital Goods Enabled` (1), `Metal per Capital Goods Unit` (1), `Electronics per Capital Goods Unit` (0.5), `Capital Goods Target Days` (30), `Capital Goods Adjustment Time` (20), `Capital Goods Buffer` (**0.5**, не 2: потолок fulfillment = T·D/(T·D + B); при D ≈ 0.4 и B = 2 он равен 0.86 — skeleton это показал). Колониальные: `X Capital Goods Production Capacity` (A 2, B 1 **[calib]**), `X <Sector> Capital Goods per Capacity` ×3 (**[calib]**, старт: Refinery 17, Electronics 11.5, Power 0.5 — выведено из `Capital Cost per Capacity` 900 / 600 при условной цене единицы оборудования ≈ 52 = 40 + 0.5 × 25; у Power capital cost нет — 0.5 подобран по масштабу expansion ~0.4/день).

Единица оборудования — абстрактная; её «содержание» — 1 металл + 0.5 электроники. Все коэффициенты — внешние параметры, аннотируются исполнителем (роль / что меняет / доказательство) с тегом `capital-goods` и пометкой «калибровочный, без физического обоснования на этом этапе».

## 3. Изменяемые существующие элементы (исчерпывающий список)

Только шесть FLOW: `X Refinery Expansion`, `X Electronics Factory Expansion`, `X Power Generation Expansion` (X ∈ {A, B}):

```text
IfThenElse([Capital Goods Enabled] = 1, [X <Sector> Desired Expansion] * [X Capital Goods Fulfillment], <old verbatim>)
```

Всё остальное — запрещено. В частности **не** добавлять потребление оборудования в `Desired Smelting Rate` / `Desired Electronics Production Rate`: это замыкает петлю `Desired Smelting → Required Active → Desired Installed → Shortage → Desired Expansion → CG Demand → CG Production → Metal Consumption → Desired Smelting`. Плавка и выпуск электроники реагируют на отбор металла/электроники оборудованием через **запасы** (члены `(Target Inventory − Inventory)/Adjustment Time` уже есть) — с лагом ~`Metal Adjustment Time`. Это известное ограничение v7.5, фиксируется в отчёте.

Финансовое ограничение строительства не меняется (деньги считаются по прежним `Capital Cost per Capacity`); согласование денежной цены оборудования с физической — v7.6.

## 4. Сценарии

Modes 0–20: `modify_scenarios` `Capital Goods Enabled: 0`. Новые (все три: `Capital Lifecycle Enabled 1, Intermediate Inputs Enabled 1, Capital Goods Enabled 1`):

| Mode | Имя | Шок | Смысл |
|---|---|---|---|
| 21 | v7.5 Capital Goods Baseline | нет | все связи включены; going concern; оборудование обслуживает строительство |
| 22 | v7.5 Capital Goods Supply Shock | `A Capital Goods Production Capacity` × `v7.5 Capital Goods Shock Multiplier` (0.3) в окне 360–720 (`Test 22 … Active`, флаг применимости `X Test 22 Capital Goods Shock Applies`: A 1, B 0 — по образцу задачи 002) | дефицит оборудования задерживает строительство refinery/power/electronics у A; после 720 — восстановление |
| 23 | v7.5 Investment Boom | `A Electronics` спрос × 4 с дня 360 (как Mode 19; `Test 23 …`, флаги для electronics demand chain) | electronics, refinery и power одновременно требуют оборудования — конкуренция за общий запас, проверка пропорционального нормирования и очерёдности |

Test wiring — по приёму задачи 002 (принята, baseline v7.4.1): флаги применимости `X Test 22 Capital Goods Shock Applies` (A 1, B 0), `X Test 23 Electronics Demand Applies` (A 1, B 0) при общих множителях `v7.5 Capital Goods Shock Multiplier` (0.3), `v7.5 Investment Boom Multiplier` (4); Test 23 добавляется в **обе** цепочки `X Effective Electronics Local Base Demand` первым элементом coupled-ветви (перед Test 19), под флагом. Шок Test 22: `X Capital Goods Production Capacity` становится формулой `IfThenElse([Test 22 …] = 1, [X Capital Goods Base Production Capacity] × IfThenElse([X Test 22 Capital Goods Shock Applies] = 1, [v7.5 Capital Goods Shock Multiplier], 1), [X Capital Goods Base Production Capacity])` — константа переезжает в `X Capital Goods Base Production Capacity` (A 2, B 1).

## 5. Инварианты (HARD, Modes 0–23)

Для каждой X:

1. `0 ≤ X Capital Goods Fulfillment ≤ 1`
2. `X <Sector> Expansion ≤ X <Sector> Desired Expansion` (×3), tolerance 1e-8
3. `X Capital Goods Inventory ≥ 0`; все CG-потоки ≥ 0
4. identity: `X Refinery Capital Goods Consumption − X Refinery Expansion × X Refinery Capital Goods per Capacity = 0` (×3, tolerance 1e-8) — декларация пары преобразования
5. identity: `X Capital Goods Metal Consumption − X Capital Goods Production Rate × Metal per Capital Goods Unit = 0`; то же для электроники
6. при switch = 0: `X Capital Goods Production Rate = 0`, `Fulfillment = 1`, `Expansion = Desired Expansion` (Modes 0–20)
7. все инварианты v7.4 без изменений; kernel conformance 7/7 (`expansion` по-прежнему `∅ → Installed`, kernel-v1 не меняется — см. §6); `colony_symmetry` без новых исключений

## 6. Kernel-v2 и аудит границ

Топология kernel-v1 (`expansion: ∅ → Installed`) **сохраняется**: SD-поток не может конвертировать единицы, поэтому «оборудование → мощность» — пара sink/source, как «руда → металл». Kernel-v2 = kernel-v1 + обязательная роль `capital_goods_consumption` (FLOW `CG Inventory → ∅`, `deps: [expansion]`) + `desired_expansion` (VARIABLE) + правило `expansion ≤ desired_expansion`. Ревизия спецификации kernel — наша часть (Lab v0.9: роли в `KERNEL_ROLES` как optional-with-flag; для Transport роль отсутствует до v7.5.1).

`open_boundaries`: категория `external_capital` (`* Expansion`, closed_world false) заменяется на `capital_transformation` (closed_world **true** при условии объявленной пары). Стенд получает в плагине секцию `transformation_pairs` — список `{source: "X Refinery Expansion", sinks: ["X Refinery Capital Goods Consumption"], identity: "<имя identity-проверки>"}`; поток категории `unit_transformation`/`capital_transformation` без пары → unclassified. То же задним числом для руды → металла и feedstock → электроники (сегодня не проверяются). Наша часть (Lab v0.9), исполнитель поставляет только identity-проверки §5 п.4–5.

Ожидаемый счётчик closed-world после v7.5: **1** (`Transport Capacity Expansion`).

## 7. Калибровка и going concern

- Mode 21 vs Mode 17 @1080: планетарный выпуск электроники и плавка в пределах ±15 % (оборудование — малая доля спроса: skeleton ≈ 0.3–1.9 металла/день против плавки 45); installed refinery/power A в пределах −10 %…0 % (строительство чуть медленнее из-за fulfillment < 1).
- `X Capital Goods Fulfillment` в стационаре Mode 21 ≥ 0.95 (буфер 0.5).
- Mode 22: fulfillment A < 0.7 в окне; `A Refinery Expansion`/`A Power Generation Expansion` в окне ≤ 0.5 × desired; восстановление к 1080.
- Пороги — после первого прогона (урок 001).

## 7a. Известное ограничение формата патча

При симметризации (v7.4.1) в модели остались два «висячих» LINK (`Intermediate Inputs Enabled -> A/B Mining Rate`): патч не умеет удалять связи. На поведение не влияют; удаление — при следующем ручном обслуживании модели.

## 8. Что v7.5 не делает

Transport; торговля оборудованием; энергия для производства оборудования; собственный kernel капитала у сектора Capital Goods (мощность — константа `X Capital Goods Production Capacity`, v7.5.1); согласование денежной и физической стоимости капитала; закрытие энергетического входа (v7.6).
