# v7.7 — Construction Materials — архитектурная спецификация

Статус: **r1** (2026-09-25). База: accepted **v7.6.1 r1** (SHA `16e8ca6c…`), стенд Orbital Economy Lab v0.9.4. Реализуемость проверена нами полным skeleton-патчем на **обеих колониях** до выдачи (§8).

**Решения владельца проекта (2026-09-25):**

1. Строительные материалы делаются из **нового сырья — реголита** (сыпучий грунт), а не из руды: второй класс сырья появляется естественно (ROADMAP п. 2), связь с металлургией — только через капитал.
2. Производство строительных материалов в v7.7 **энергию не потребляет** — как сектор Capital Goods в v7.5. Энергетический распределитель не трогаем; связь с энергией — отдельный шаг.
3. Строительные материалы потребляют **только колониальные стройки** — Refinery, Electronics, Power в A и B. Общий Transport — отдельной версией v7.7.1 по образцу v7.5.1 (две «ноги» из запасов A и B).

## 0. Правило не-регрессии

Modes **0–26** воспроизводят accepted v7.6.1 r1 **точно** (`maxAbs = 0` на канонической платформе — `docs/VERSIONING_AND_AUTHORITY.md` §8). Переключатель `Construction Materials Enabled` = 1 в сыром файле; сценарии 0–26 задают 0 явно; новые 27–29 — 1. Правки существующих формул — только `IfThenElse([Construction Materials Enabled] = 1, new, old)` с **дословным** `old`.

## 1. Что меняется по существу

Сейчас установленная мощность секторов физически обеспечена только оборудованием (Capital Goods, v7.5): `expansion = desired × CG fulfillment`, и стройка списывает оборудование из запаса. v7.7 добавляет второй физический вход стройки — **строительные материалы** («конструкции»: фундаменты, корпуса, сооружения):

```text
REGOLITH (добыча) → CONSTRUCTION MATERIALS (переработка) ─┐
                                                          ├→ expansion Refinery / Electronics / Power
METAL + ELECTRONICS → CAPITAL GOODS ──────────────────────┘
```

Стройка требует **обоих**: `expansion = desired × Min(CG fulfillment, CM fulfillment)` — строить нельзя, пока не хватает хотя бы одного (лимитирующий фактор, а не произведение: произведение наказывало бы дважды за один и тот же дефицит). Стройка списывает и оборудование, и строительные материалы.

## 2. Добыча реголита и сектор Construction Materials (X ∈ {A, B}, зеркально)

| Элемент | Тип | Определение |
|---|---|---|
| `X Regolith Inventory` | STOCK | запас реголита; initial **[calib]** (skeleton 40) |
| `X Regolith Base Extraction Capacity` | VARIABLE | **[calib]** (skeleton A 7, B 5) |
| `X Regolith Extraction Capacity` | VARIABLE | base × множитель шока Mode 29 (флаг применимости, см. §4) |
| `X Regolith Requirement` | VARIABLE | `[X Desired Construction Materials Production] × [Regolith per Construction Materials Unit]` |
| `X Regolith Target Inventory` | VARIABLE | `Requirement × Regolith Target Days` |
| `X Desired Regolith Extraction` | VARIABLE | `Max(0, Requirement + (Target − Inventory) / Regolith Adjustment Time)` |
| `X Regolith Extraction Rate` | VARIABLE | `IfThenElse(switch, soft-cap(Desired, Capacity), 0)` |
| `X Regolith Extraction` | FLOW ∅ → Regolith Inventory | `= Extraction Rate` — первичная добыча, граница модели |
| `X Construction Materials Inventory` | STOCK | запас стройматериалов; initial **[calib]** (skeleton 30) |
| `X Construction Materials Base Production Capacity` | VARIABLE | **[calib]** (skeleton A 3, B 2) |
| `X Construction Materials Production Capacity` | VARIABLE | base × множитель шока Mode 28 |
| `X Construction Materials Demand` | VARIABLE | `Σ_sectors [X <Sector> Desired Expansion] × [X <Sector> Construction Materials per Capacity]` |
| `X Construction Materials Target Inventory` | VARIABLE | `Demand × Construction Materials Target Days` |
| `X Desired Construction Materials Production` | VARIABLE | `Max(0, Demand + (Target − Inventory) / Construction Materials Adjustment Time)` |
| `X Construction Materials Production Rate` | VARIABLE | `IfThenElse(switch, soft-cap(Desired, Capacity) × [X Regolith Inventory] / ([X Regolith Inventory] + [Regolith Buffer Days] × Max([X Regolith Requirement], 1e-9)), 0)` |
| `X Construction Materials Production` | FLOW ∅ → CM Inventory | `= Production Rate` (пара, см. ниже) |
| `X Construction Materials Regolith Consumption` | FLOW Regolith Inventory → ∅ | `Production Rate × Regolith per Construction Materials Unit` |
| `X Construction Materials Fulfillment` | VARIABLE | `IfThenElse(switch, Inventory / (Inventory + Construction Materials Buffer Days × Max(Demand, 1e-9)), 1)` |
| `X <Sector> Construction Materials Consumption` (×3) | FLOW CM Inventory → ∅ | `IfThenElse(switch, [X <Sector> Expansion] × [X <Sector> Construction Materials per Capacity], 0)`; для Electronics и Power — с множителем `[Capital Lifecycle Enabled]`, как у потребления оборудования |

`soft-cap(d, c)` — идиома модели: `d / (1 + (d / (c + 0.001)) ^ 8) ^ 0.125`.

Мягкое нормирование **безмасштабное** (урок задачи 003, контракт §8 п. 7): и доступность реголита для переработки, и fulfillment стройматериалов — через буфер в **днях** спроса, а не в единицах.

Глобальные константы: `Construction Materials Enabled` (1), `Regolith per Construction Materials Unit` (**[calib]**, skeleton 2), `Construction Materials Target Days` (30), `Construction Materials Adjustment Time` (20), `Construction Materials Buffer Days` (1), `Regolith Target Days` (10), `Regolith Adjustment Time` (10), `Regolith Buffer Days` (1). Колониальные нормы `X <Sector> Construction Materials per Capacity` (**[calib]**, skeleton: Refinery 20, Electronics 12, Power 1 — по порядку величины как нормы оборудования 17 / 11.5 / 0.5: сооружение и оборудование сопоставимы по массе).

Все коэффициенты — внешние параметры, аннотируются исполнителем (роль / что меняет / доказательство) с тегом `construction-materials` и пометкой «калибровочный, без физического обоснования на этом этапе».

## 3. Изменяемые существующие элементы (исчерпывающий список)

Только шесть FLOW: `X Refinery Expansion`, `X Electronics Factory Expansion`, `X Power Generation Expansion` (X ∈ {A, B}):

```text
IfThenElse([Construction Materials Enabled] = 1,
           [X <Sector> Desired Expansion] * Min([X Capital Goods Fulfillment], [X Construction Materials Fulfillment]),
           <old verbatim>)
```

`<old verbatim>` — **вся** нынешняя формула, включая её собственный `IfThenElse([Capital Goods Enabled] = 1, …)`. Новые Modes 27–29 включают все переключатели, поэтому ветка «CM включены, CG выключены» не используется и не проверяется.

Всё остальное — запрещено. Как и в v7.5, **не** добавлять спрос на реголит или стройматериалы в формулы желаемого выпуска других секторов: реакция идёт через запасы (члены `(Target − Inventory) / Adjustment Time`), иначе замыкается алгебраическая петля через `Desired Expansion`.

## 4. Сценарии

Все три новых Mode включают **всю** модель: `Capital Lifecycle Enabled`, `Intermediate Inputs Enabled`, `Capital Goods Enabled`, `Transport Capital Goods Enabled`, `Power Resource Enabled`, `Construction Materials Enabled` = 1.

| Mode | Имя | Что происходит |
|---|---|---|
| 27 | `v7.7 Construction Materials Baseline` | полная модель со стройматериалами, без шоков |
| 28 | `v7.7 Construction Materials Supply Shock` | переработка в A: мощность × `v7.7 Construction Materials Shock Multiplier` (**[calib]**, skeleton 0.1) в стандартном окне `[Temporary Test Window]` |
| 29 | `v7.7 Regolith Supply Shock` | добыча реголита в A × `v7.7 Regolith Shock Multiplier` (**[calib]**, skeleton 0.1) в том же окне |

Пара 28/29 — по образцу 25/26: дефицит переработки против дефицита сырья. Тестовая обвязка — **симметричные флаги применимости** `X Test 28 Construction Materials Shock Applies`, `X Test 29 Regolith Shock Applies` (A = 1, B = 0) и `Test 28 … Active` / `Test 29 … Active` = `IfThenElse([Timed Test Mode] = N, [Temporary Test Window], 0)` — как в v7.4.1 и v7.6: A/B-симметрия структуры без исключений.

## 5. Граница модели и аудит

Новые граничные потоки (по 6 на колонию) классифицируются в `open_boundaries`:

- `X Regolith Extraction` — новая категория первичной добычи (`closed_world: true`, `direction: source`);
- `X Construction Materials Production` + `X Construction Materials Regolith Consumption` — пара преобразования (реголит → стройматериалы), новая категория с `requires_pair`;
- `X <Sector> Construction Materials Consumption` — второй сток существующих пар расширения секторов (капитал = оборудование + стройматериалы) в категории `capital_transformation`.

Счётчик closed-world нарушений остаётся **0**. Численные тождества пар — только в Modes, где потоки включены (27–29); в Modes 0–26 — проверки состояния «механика выключена» (контракт §8 п. 8).

## 6. Известные ограничения v7.7 (не дефекты)

- **B не строит.** В accepted-динамике колония B ни в одном сценарии не расширяет мощности (её Refinery выбывает 28 → 8.5 к дню 1080), поэтому спрос B на стройматериалы равен 0 во всех Modes 27–29 (skeleton). Сектор B существует и зеркален, но простаивает. Проверки вида «B производит стройматериалы» заведомо ложны (урок задачи 003, контракт §8 п. 6). Для B проверяется покой: fulfillment = 1, запасы нетронуты.
- Энергия, торговля стройматериалами между колониями, жизненный цикл капитала для самих секторов добычи реголита и переработки (фиксированные мощности, как у Capital Goods), Transport — вне v7.7.
- Денежная стоимость строительства не меняется (`Capital Cost per Capacity` прежний) — согласование денег с физикой, как и в v7.5, отдельный шаг.

## 7. Что не делать

- Не менять имена, типы, `from`/`to` существующих элементов, `simulation`, существующие сценарии сверх добавления переключателя.
- Не добавлять стройматериалы в Transport (v7.7.1) и в энергетику.
- Не подгонять validation под полученные числа: пороги новых проверок — после первого прогона, с обоснованием (контракт §8 п. 2).

## 8. Проверка реализуемости (skeleton, до выдачи)

Полный skeleton-патч по §2–§4 (64 элемента, 6 замен, 128 LINK, переключатель в Modes 0–26, Modes 27–29), обе колонии, применён к v7.6.1 r1:

| Проверка | Результат |
|---|---|
| `LIFECYCLE_CONFORMANCE` | PASS, 7/7 — второй сток расширения и `Min(…)` kernel не нарушают; изменений стенда не требуется |
| `STRUCTURE_AUDIT` с черновиком validation (`draft/`) | PASS: неклассифицированных 0, пар 15, closed-world 0, A/B-симметрия 0 расхождений |
| Регрессия Modes 0, 12, 17, 21, 24, 25, 26 | `common = 1004, changed = 0, maxAbs = 0`, +64 ряда в каждом |
| Modes 27–29 | считаются без петель (~10 с на Mode) |
| Все Modes 0–26 (полный `CHECK_CANDIDATE`) | 27 × `common = 1004, changed = 0, maxAbs = 0` |
| Черновик change-policy (`draft/`) на полном skeleton | `POLICY PASS`: 1956 событий, неожиданных 0. Первая версия черновика дала 84 неожиданных — глобальные константы `Construction Materials Target Days` / `Adjustment Time` / `Buffer Days` не попадали под шаблон `* Construction Materials *`; исправлено добавлением `Construction Materials *` |

Поведение skeleton в колонии A (окно шока — дни 360–720):

| | Mode 27 | Mode 28 (переработка ×0.1) | Mode 29 (реголит ×0.1) |
|---|---|---|---|
| CM fulfillment в окне | ≈ 0.967 (на уровне CG ≈ 0.968) | падает до ≈ 0.36 | падает до ≈ 0.48, запас реголита исчерпан |
| Refinery expansion / desired в окне | ≈ 0.97 | ≈ 0.36 | ≈ 0.48 |
| после окна | — | fulfillment возвращается к ≈ 0.967 | то же |
| Refinery Installed, день 1080 | 58.8 | 57.5 | 57.9 |

Это ориентиры реализуемости, не пороги приёмки. Сам skeleton исполнителю не выдаётся: реализация, калибровка и validation — работа задачи.
