# v7.4 — Intermediate Inputs / Input-Output Coupling — architecture specification

Статус: **ревизия r1.1** (2026-09-21) — после приёмочного прогона candidate r1. Изменения относительно r1 помечены **[r1.1]**; они обязательны для candidate r2.
База: accepted **v7.3 r2 Generalized Capital Lifecycle** (SHA `57a2a102…`), стенд Orbital Economy Lab v0.7.0.
Сопутствующие документы: `V7_4_TEST_PLAN.md` (r1.1), `change-policy-v7.4-intermediate-inputs-draft-r1.1.json`, `validation-v7.4-draft-r1.1.json`.

## 0. Правило не-регрессии (не обсуждается)

Modes **0–16** обязаны воспроизводить accepted v7.3 r2 **точно**: все 827 существующих временных рядов, `max abs diff = 0`, на всех 4321 шагах. Новая механика включается переключателем и проверяется только новыми Modes 17–20. Это тот же приём, которым v7.3 ввёл `Capital Lifecycle Enabled`.

Следствие для реализации: любая правка **существующей** формулы допускается только в форме

```text
IfThenElse([Intermediate Inputs Enabled] = 1, <новое выражение>, <старое выражение без изменений>)
```

Форма `старое + [switch] * новое` запрещена (она тоже даёт точный ноль при конечном `новое`, но делает старую ветку нечитаемой и хрупкой при NaN). Стоки не меняются; новые притоки/оттоки к существующим стокам — только новыми FLOW, чья формула умножена на переключатель или обёрнута IfThenElse.

## 1. Что меняется по существу

В v7.3 Electronics потребляет экзогенный **Feedstock**: он добывается «из ничего» (`X Electronics Feedstock Extraction`, ∅ → Feedstock Inventory) по экзогенной цене (`X Electronics Feedstock Base Cost` = 18 у A, 3 у B). Межотраслевой связи нет.

v7.4 делает Metal физическим промежуточным входом Electronics. Feedstock Inventory становится **буфером металла, принадлежащим сектору Electronics**, наполняемым поставками из `X Metal Inventory`. Пять слоёв, которые требовал план продолжения, реализуются как явные, отдельно наблюдаемые величины:

| Слой | Величина (каноническое имя, X ∈ {A, B}) | Тип | Смысл |
|---|---|---|---|
| physical input demand | `X Electronics Metal Input Demand` | VARIABLE | сколько металла сектор Electronics хочет получить в день |
| available input | `X Metal Available for Intermediate Use` | VARIABLE | сколько металла `X Metal Inventory` может отдать на промежуточное использование в день |
| fulfillment | `X Electronics Metal Input Delivery` (FLOW) и `X Electronics Metal Input Fulfillment` | FLOW, VARIABLE | фактическая поставка и её доля от спроса ∈ [0, 1] |
| unit-cost effect | `X Electronics Feedstock Price` (изменяется) | VARIABLE | цена входа = buyer-facing цена металла `X Market Price` |
| production limitation | существующий фактор `[Feedstock Inventory] / ([Feedstock Inventory] + Buffer)` в `X Pre Energy Electronics Production Rate` | — | не меняется; ограничение выпуска через физический буфер сохраняется |

**[r1.1]** Причинность на шаге: спрос на вход строится от **планируемого** выпуска (`X Pre Energy Electronics Production Rate`), а не от фактического потребления. Причина: фактический выпуск зависит от энергетического нормирования, которое в тот же шаг зависит от плавки, которая (через `X Desired Smelting Rate`) зависит от поставки входа — алгебраическая петля `Desired Smelting Rate → Smelting Rate → Metal Requested Energy → Energy Fulfillment → Electronics Production Rate → Feedstock Consumption Rate → Metal Input Demand → Delivery → Desired Smelting Rate`. Движок обнаруживает её динамически (в Modes 0–16 ветка выключена, поэтому r1 прошёл regression, но Modes 17–20 не стартовали). Фактическое потребление (`X Electronics Feedstock Consumption Rate = Production Rate × Metal per Electronics`) остаётся как есть; планирование входа — от pre-energy выпуска. Обратная связь (электроника → спрос на металл → плавка → мощность refinery → энергия) идёт через существующие механизмы плюс одно слагаемое в `X Desired Smelting Rate`.

## 2. Переключатель

`Intermediate Inputs Enabled` — VARIABLE, значение в «сыром» ModelJSON = **1** (полная модель), сценарии Modes 0–16 задают **0** явно (как `Capital Lifecycle Enabled` в v7.3), Modes 17–20 — **1**.

Ссылаться на переключатель могут только: новые элементы v7.4 и те существующие элементы, которые перечислены в §4. Добавлять его в kernel-потоки капитала или куда-либо ещё запрещено.

## 3. Новые элементы (обязательные, канонические имена)

Глобальные:

| Имя | Тип | Значение |
|---|---|---|
| `Intermediate Inputs Enabled` | VARIABLE | 1 |
| `Metal per Electronics` | VARIABLE | физический коэффициент, единиц металла на единицу электроники; **стартовое предложение 0.25**, калибруется (§6) |
| `Metal Input Target Days` | VARIABLE | целевой запас буфера в днях потребления; стартовое предложение 20 |
| `Metal Input Adjustment Time` | VARIABLE | время подстройки буфера, дней; стартовое предложение 20 |

Для каждой колонии X ∈ {A, B} (все — зеркально симметричны, аудит `colony_symmetry` обязан дать 0 расхождений без новых исключений):

| Имя | Тип | Определение (обязательная семантика; точная форма — на усмотрение исполнителя в рамках §5) |
|---|---|---|
| `X Electronics Metal Input Target Inventory` | VARIABLE | **[r1.1]** `[X Pre Energy Electronics Production Rate] × [Metal per Electronics] × [Metal Input Target Days]` |
| `X Electronics Metal Input Demand` | VARIABLE | **[r1.1]** `Max(0, [X Pre Energy Electronics Production Rate] × [Metal per Electronics] + (target − [X Electronics Feedstock Inventory]) / [Metal Input Adjustment Time])` |
| `X Metal Available for Intermediate Use` | VARIABLE | `Demand × [X Metal Inventory] / ([X Metal Inventory] + [X Metal Buffer])` — **тот же фактор доступности, что у `X Local Sales`**; это и есть правило пропорционального нормирования при дефиците (прецедент: энергетика v7.2) |
| `X Electronics Metal Input Delivery` | FLOW `X Metal Inventory → X Electronics Feedstock Inventory` | `IfThenElse(switch = 1, [X Metal Available for Intermediate Use], 0)` |
| `X Electronics Metal Input Fulfillment` | VARIABLE | `IfThenElse(Demand > 0.001, Delivery / Demand, 1)` |

Тестовые переключатели новых сценариев (по образцу `Test 14 … Active`): `Test 18 Metal Supply Shock Active`, `Test 19 Coupled Electronics Growth Active`, `Test 20 Coupled Metal Demand Growth Active`, множители `v7.4 Metal Supply Shock Multiplier` (0.5), `v7.4 Coupled Electronics Growth Multiplier` (4), `v7.4 Coupled Metal Demand Growth Multiplier` (2). Окна — существующие `Temporary Test Window` (360–720) и `Reverse Advantage Window` (≥ 360).

**[r1.1]** Дополнительные обязательные элементы:

| Имя | Тип | Определение |
|---|---|---|
| `A Effective Mining Capacity` | VARIABLE | `IfThenElse([Intermediate Inputs Enabled] = 1, IfThenElse([Test 18 Metal Supply Shock Active] = 1, [A Mining Capacity] × [v7.4 Metal Supply Shock Multiplier], [A Mining Capacity]), [A Mining Capacity])` — шок Mode 18 применяется к **A** (в связанной экономике A — экспортёр металла; шок у B гасится импортом и буфером руды 2500 и не доходит до входа электроники — проверено в приёмочном прогоне r1). `B Effective Mining Capacity` **не изменяется**. Это одна новая, задокументированная асимметрия A/B — исключение `colony_symmetry` для `A Effective Mining Capacity` уже внесено в validation r1.1 |
| `Planet Electronics Production Rate` | VARIABLE | `[A Electronics Production Rate] + [B Electronics Production Rate]` — диагностический итог для критерия going concern |
| `Planet Smelting Rate` | VARIABLE | `[A Smelting Rate] + [B Smelting Rate]` — то же |

Вспомогательные элементы допускаются только в пространствах имён `* Metal Input *`, `* Intermediate *`, `Test 18|19|20 *`, `v7.4 *` — policy-draft разрешает `element_added` только там.

## 4. Изменяемые существующие элементы (исчерпывающий список)

Каждая правка — только в форме IfThenElse из §0.

| Элемент (X ∈ {A, B}) | Изменение при switch = 1 |
|---|---|
| `X Electronics Feedstock Extraction Rate` | 0 (экзогенная добыча выключена) |
| `X Electronics Feedstock Consumption Rate` | `Production Rate × Metal per Electronics` (вместо `× X Feedstock per Electronics`) |
| `X Electronics Feedstock Price` | `X Market Price` (buyer-facing цена металла, уже учитывает импорт) |
| `X Electronics Unit Cost` | `Metal per Electronics × X Electronics Feedstock Price + …` (вместо `X Feedstock per Electronics × …`); энергия и труд без изменений |
| `X Electronics Feedstock Target Inventory` | `X Electronics Metal Input Target Inventory` |
| `X Electronics Feedstock Buffer` | `Metal per Electronics × 40` (r1 выбрал переоценку в металлических единицах — принято) |
| `X Electronics Feedstock Inventory` (STOCK, **initial_value**) | **[r1.1]** `IfThenElse([Intermediate Inputs Enabled] = 1, [Metal per Electronics] × 1200, 1200)` — унаследованный запас feedstock переоценивается в металлические единицы; без этого спрос на вход равен нулю ~200 дней, пока 1200 единиц не израсходуются (обнаружено исполнителем в r1, подтверждено прогоном) |
| `A Mining Rate` | **[r1.1]** coupled-ветка читает `[A Effective Mining Capacity]` вместо `[A Mining Capacity]`; legacy-ветка дословно |
| `X Desired Smelting Rate` | `+ X Electronics Metal Input Delivery` (промежуточные поставки — часть спроса на плавку) |
| `A Effective Electronics Local Base Demand`, `B Effective Local Base Demand` | новые ветви IfThenElse для Test 19 / Test 20 (существующие ветви не трогать). **[r1.1]** `B Effective Mining Capacity` из списка исключён |

Всё остальное — **запрещено менять**: kernel-потоки капитала, энергетика, транспорт, торговые формулы, `X Local Sales`, `Exportable Metal X`, константы v7.3, сценарии 0–16 (кроме добавления `Intermediate Inputs Enabled: 0`).

Feedstock Extraction FLOW физически остаётся в модели (для Modes 0–16), поэтому аудит `open_boundaries` продолжит считать его `primary_extraction`; счётчик closed-world нарушений в v7.4 остаётся **7** (потоки `Expansion`). Это ожидаемо и не является целью v7.4.

## 5. Инварианты (HARD, проверяются на каждом Mode 0–20)

Для каждой X:

1. `0 ≤ Fulfillment ≤ 1`
2. `Delivery ≤ Demand` (с tolerance 1e-8)
3. `Delivery ≤ Available` — по построению, но проверяется
4. `Delivery ≥ 0`, `Demand ≥ 0`
5. `X Metal Inventory ≥ 0`, `X Electronics Feedstock Inventory ≥ 0`, `X Electronics Inventory ≥ 0` (новые `bounded`-проверки; раньше запасы не были покрыты `non_negative_regex`)
6. При switch = 0: `Delivery = 0` и `Fulfillment = 1` тождественно (Modes 0–16)
7. Все инварианты v7.3 (energy balance, kernel identities, transport allocator) — без изменений
8. Статические аудиты: kernel conformance 7/7, `open_boundaries` unclassified = 0, `colony_symmetry` mismatches = 0; **[r1.1]** ровно одно новое исключение — `A Effective Mining Capacity` (уже в validation r1.1); исключений всего 18

Формулировки в `validation-v7.4-draft.json` (типы `relation` / `identity` / `bounded`, Lab v0.6.1).

## 6. Калибровка и экономический смысл

`Metal per Electronics` определяет силу связи. При 1.0 и цене металла ~40 вход стоит вдвое дороже legacy-feedstock у A и в 13 раз у B — сравнительное преимущество B в электронике исчезает, спрос на металл удваивается. Это не «неправильно», но это уже другой мир. Требования:

- **[r1.1]** Mode 17 (coupled baseline, без шоков) должен оставаться **going concern** на уровне планеты: к дню 1080 `Planet Electronics Production Rate` и `Planet Smelting Rate` в пределах `[0.5, 2.0]` от сумм Mode 12 (42.06 и 44.78), выпуск электроники в каждой колонии ≥ 2.0; ни один запас не уходит в ноль надолго; направление торговли устойчиво (без смены знака чаще одного раза после дня 360). Per-colony критерий r1 (`[0.5, 2.0]`) отменён: при коэффициенте 0.25 связь **переворачивает специализацию** (Mode 12 → 17: электроника A 1.3 → 22, B 40.8 → 15; экспорт электроники B→A 21.7 → 0), и это следствие связи, а не дефект;
- исполнитель фиксирует выбранное значение коэффициента, приводит таблицу «Mode 12 vs Mode 17» по ключевым величинам (выпуск, цены, торговля, unserved energy) и объясняет, что изменилось и почему это следствие связи, а не ошибка;
- **запрещено** подгонять `Metal per Electronics` так, чтобы Mode 17 стал численно неотличим от Mode 12 — смысл версии в том, что связь есть.

## 6a. [r1.1] Известное поведение Mode 17, не являющееся дефектом

- Энергодефицит A в Mode 17 не исчезает к дню 1080 (в прогоне: 142 → 107 → 72/день на днях 360/720/1080), но монотонно снижается: связь делает baseline для A сценарием устойчивого роста спроса (плавка 39 → 45, генерация 1402 → 1610 при требуемых 1701), а 60-дневное сглаживание планирования мощности (ограничение v7.3 №2/№3) даёт медленную сходимость. Test plan r1.1 требует снижения, а не нуля.
- Физический канал нормирования слаб по построению: фактор `Inv/(Inv+Buffer)` с Buffer = 10 даёт fulfillment ≈ 0.93–0.98, пока запас не опустошён; дефицит проявляется прежде всего **ценой** (`X Market Price` → `Feedstock Price` → `Unit Cost`). Test plan r1.1 использует ценовой и выпускной каналы как основные индикаторы.

## 7. Что v7.4 не делает

- не закрывает `Expansion` (капитал из ∅) — это kernel-v2 / v7.5;
- не вводит потребление электроники или металла энергетикой;
- не вводит фирмы/финансы; `Operating Profit Proxy` остаётся;
- не меняет Refinery/Transport/Power kernel и их policy;
- не исправляет ограничения v7.3 (first-order construction, 60-дневное сглаживание Power, Mode 10);
- не переименовывает существующие примитивы (`Feedstock` остаётся `Feedstock`, даже если по смыслу это теперь металл — переименование = массовая регрессия для policy).

## 8. Артефакты поставки

См. `TASK_V7_4_RU.md` и `baseline/docs/CONTRACTOR_DELIVERY_CONTRACT_RU.md`.
