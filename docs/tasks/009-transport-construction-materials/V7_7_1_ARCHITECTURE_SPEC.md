# v7.7.1 — Transport on Construction Materials — архитектурная спецификация

Статус: **r1** (2026-09-26). База: accepted **v7.7 r1** (SHA `5bbc29b6…`). Реализуемость проверена нами полным skeleton-патчем до выдачи (§7).

## 0. Правило не-регрессии

Modes **0–29** воспроизводят accepted v7.7 r1 **точно** (`maxAbs = 0` на канонической платформе). Переключатель `Transport Construction Materials Enabled` = 1 в сыром файле; сценарии 0–29 задают 0 явно; новые 30–31 — 1. Правки существующих формул — только `IfThenElse([Transport Construction Materials Enabled] = 1, new, old)` с **дословным** `old`.

## 1. Что меняется

В v7.7 колониальные стройки требуют оборудования **и** стройматериалов; общий транспорт — пока только оборудования (из запасов A и B, две «ноги», v7.5.1). v7.7.1 закрывает это: расширение транспорта требует и стройматериалов, тоже из двух запасов:

```text
Transport Capacity Expansion = Transport Desired Expansion × Min(Transport Capital Goods Fulfillment, Transport Construction Materials Fulfillment)
```

Схема стройматериалов для транспорта — **дословный аналог** оборудования v7.5.1: планирование делит спрос поровну (половина добавляется к спросу на стройматериалы каждой колонии), фактическое списание — пропорционально текущим запасам A и B.

Второй результат: в v7.7 ни один новый Mode не стимулировал колонию B, поэтому её путь стройматериалов работал только на нулях (`docs/ARCHITECTURE.md` 4a). Mode 31 стимулирует B тем же всплеском транспортного спроса, что Mode 24, — B строит, добывает реголит и производит стройматериалы.

## 2. Новые элементы

| Элемент | Тип | Определение |
|---|---|---|
| `Transport Construction Materials Enabled` | VARIABLE | 1 (switch) |
| `Transport Construction Materials per Capacity` | VARIABLE | **[calib]**, skeleton 3 (оборудование — 2.83) |
| `Transport Construction Materials Demand` | VARIABLE | `IfThenElse(switch, [Transport Desired Expansion] × [Transport Construction Materials per Capacity], 0)` |
| `Transport Construction Materials Source Inventory` | VARIABLE | `[A Construction Materials Inventory] + [B Construction Materials Inventory]` |
| `Transport Construction Materials Fulfillment` | VARIABLE | `IfThenElse(switch, Source / (Source + [Construction Materials Buffer Days] × Max(Demand, 1e-9)), 1)` |
| `X Transport Construction Materials Source Share` | VARIABLE | `IfThenElse(Source > 1e-9, [X Construction Materials Inventory] / Source, 0.5)` |
| `X Transport Construction Materials Demand Allocation` | VARIABLE | `IfThenElse(switch, Demand × 0.5, 0)` |
| `X Transport Construction Materials Consumption` | FLOW X CM Inventory → ∅ | `IfThenElse(switch, [Transport Capacity Expansion] × [Transport Construction Materials per Capacity] × [X … Source Share], 0)` |
| `Transport Construction Materials Source Share Sum` | VARIABLE | `A Share + B Share` (диагностика: ≡ 1) |

X ∈ {A, B}, зеркально. Все новые константы аннотируются исполнителем (тег `construction-materials`).

## 3. Изменяемые существующие элементы (исчерпывающий список)

| Элемент | Новая формула |
|---|---|
| `Transport Capacity Expansion` | `IfThenElse(switch, [Transport Desired Expansion] × Min([Transport Capital Goods Fulfillment], [Transport Construction Materials Fulfillment]), <old verbatim>)` |
| `X Construction Materials Demand` (×2) | `IfThenElse(switch, <old verbatim> + [X Transport Construction Materials Demand Allocation], <old verbatim>)` |
| `Test 2 Transport Surge Active` | прежняя вложенная `IfThenElse` по Modes 2 и 24 с добавленной веткой `IfThenElse([Timed Test Mode] = 31, [Temporary Test Window], 0)` вместо последнего `0` — так же, как v7.5.1 добавил Mode 24 |

Всё остальное — запрещено. Не добавлять транспортный спрос в формулы желаемого выпуска: реакция — через запасы.

## 4. Сценарии

Оба включают всю модель (все прежние переключатели и `Transport Construction Materials Enabled` = 1).

| Mode | Имя | Что происходит |
|---|---|---|
| 30 | `v7.7.1 Transport Construction Materials Baseline` | без стимулов |
| 31 | `v7.7.1 Transport Surge on Construction Materials` | всплеск транспортного спроса в стандартном окне (`Test 2 Transport Surge Active`) — как Mode 24 |

## 5. Граница модели и аудит

`A/B Transport Construction Materials Consumption` — вторая пара «ног» существующей пары `Transport Capacity Expansion` в категории `capital_transformation` (как оборудование транспорта). Новых категорий нет. Kernel: транспорт остаётся `CONFORMING_WITH_VARIATION` (проверено), новые потоки ролями kernel не являются.

## 6. Известные ограничения

- В Mode 30 колония B стройматериалы **не производит**: транспорт берёт из её стартового запаса (30 → 13 к дню 1080), которого хватает. Производство B — только в Mode 31.
- Energy, торговля стройматериалами, жизненный цикл новых секторов — вне v7.7.1.

## 7. Проверка реализуемости (skeleton, до выдачи)

Полный skeleton (12 элементов, 4 замены, 33 LINK, переключатель в Modes 0–29, Modes 30–31), обе колонии:

| Проверка | Результат |
|---|---|
| `LIFECYCLE_CONFORMANCE` | PASS, 7/7; Transport — прежняя shared-infrastructure вариация |
| `STRUCTURE_AUDIT` с черновиком validation | PASS: граничных 122 из 153, неклассифицированных 0, пар 15, closed-world 0, A/B 0 расхождений |
| регрессия Modes 0–29 (полный `CHECK_CANDIDATE`) | 30 × `common = 1070, changed = 0, maxAbs = 0`, +12 рядов |
| черновик change-policy (`draft/`) на полном skeleton | `POLICY PASS` с первой попытки: 441 событие, неожиданных 0 |

Поведение (ориентиры, не пороги):

| | Mode 30 | Mode 31 |
|---|---|---|
| транспорт берёт стройматериалы из A и B, доли в сумме ≡ 1 | да | да |
| Transport CM fulfillment min | ≈ 0.991 | ≈ 0.988 |
| B производит стройматериалы (max) | 0 (хватает стартового запаса) | ≈ 1.85 в день |
| B добывает реголит (max) | 0 | ≈ 4.99 при мощности 5 — упирается в мощность |
| B строит (max): Refinery / Power | 0 / 0 | ≈ 0.087 / ≈ 0.45 в день |
| B CM fulfillment min | ≈ 0.99 | ≈ 0.93 |

Сам skeleton исполнителю не выдаётся.
