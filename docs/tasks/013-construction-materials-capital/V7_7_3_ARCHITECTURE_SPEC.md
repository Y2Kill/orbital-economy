# v7.7.3 — Construction Materials Capital — архитектурная спецификация

Статус: **r1** (2026-09-27). База: accepted **v7.7.2 r1** (SHA `9bd5c956…`). Реализуемость проверена нами полным skeleton-патчем до выдачи (§7). Место в плане: шаг модели под счётчиком Planet v1 — **P2** (`docs/PLANET_V1_CONTRACT_RU.md`): мощность переработки стройматериалов перестаёт быть константой и становится капиталом.

## 0. Правило не-регрессии

Modes **0–33** воспроизводят accepted v7.7.2 r1 **точно** (`maxAbs = 0` на канонической платформе). Переключатель `Construction Materials Capital Enabled` = 1 в сыром файле; сценарии 0–33 задают 0 явно; новые 34–35 — 1. Правки существующих формул — только `IfThenElse([Construction Materials Capital Enabled] = 1, new, old)` с **дословным** `old`.

## 1. Что меняется

В каждой колонии появляется **завод стройматериалов** — новый экземпляр ядра жизненного цикла капитала (kernel v2, `docs/CAPITAL_LIFECYCLE_KERNEL_SPEC.md` §8 «Как подключить новый сектор»): установленная / активная / выводимая / выбывшая мощность, активация, консервация, износ, вывод излишка, расширение. При включённом переключателе:

```text
X Construction Materials Production Capacity = X Construction Materials Plant Active Capacity   (с прежним множителем шока Mode 28)
X Construction Materials Plant Expansion     = Gap Limited Construction × Min(X Capital Goods Fulfillment, X Construction Materials Fulfillment)
```

Расширение завода, как и всех колониальных секторов с v7.7, расходует **оборудование и сами стройматериалы**; его желаемое расширение добавляется к спросу на оба.

**Отличия от Refinery (образец клона):**

- **нет финансового ограничения** (`finance_limited_construction`): у стройматериалов нет цены и рынка. Это задокументированная вариация ядра (так же у Power), экземпляр — `CONFORMING_WITH_VARIATION`. Без финансового ограничения желаемое расширение = строительство по разрыву, и расширение читает роль `gap_limited_construction` напрямую;
- **`switch_gated: false`** — legacy-переключатель `Capital Lifecycle Enabled` не используется (спецификация ядра §5). Точный fallback даёт собственный переключатель: при 0 расширение = 0 (оборудование и стройматериалы не расходуются), мощность выпуска читает прежнюю константу. Остальные потоки ядра живут во всех Modes, но на выходы Modes 0–33 не влияют (новые ряды);
- **требуемая активная мощность — от сглаженного сигнала спроса** `X Construction Materials Demand Signal` (сток v7.7.2), а не от плана выпуска.

**Причинность на шаге.** Первый skeleton брал требуемую мощность из `X Desired Construction Materials Production` — аудит `loops` нашёл петлю в **128 из 512** комбинаций: при `Construction Materials Energy Enabled = 0` план читает мгновенный спрос, и `CM Demand → план → требуемая мощность завода → желаемое расширение завода → CM Demand` (стройматериалы нужны для постройки самого завода). Ни один Mode эту комбинацию не задаёт, но правило аудита — петля в **любой** комбинации = FAIL. Сигнал спроса — сток и существует при любых переключателях; петли 0 из 512.

## 2. Новые элементы

| Элемент | Тип | Определение |
|---|---|---|
| `Construction Materials Capital Enabled` | VARIABLE | 1 (switch) |
| `Construction Materials Plant <param>` | VARIABLE ×10 | Operating Reserve Factor 1.1, Installed Reserve Factor 1.15, Activation Time 20, Mothball Time 10, Surplus Disposal Decision Time 240, Construction Time 120, Decommissioning Time 540, Depreciation Rate 0.0001, Capital Goods per Capacity 5, Construction Materials per Capacity 5 |
| `X Construction Materials Plant Installed / Active Capacity` | STOCK | начальное = прежней базовой мощности: A 3, B 2 |
| `X Construction Materials Plant Decommissioning / Retired Capacity` | STOCK | 0 |
| `X … Required Active Capacity` | VARIABLE | `[X Construction Materials Demand Signal] × Operating Reserve Factor` |
| `X … Desired Installed Capacity` | VARIABLE | `Required Active × Installed Reserve Factor` |
| 12 производных ролей ядра | VARIABLE | как у Refinery (`inactive`, `target_active`, `activation_gap`, `mothball_gap`, `installed_shortage`, `installed_excess`, `gap_limited_construction`, `activation_queue`, `inactive_after_activation_queue`, `strategic_reserve_target`, `strategic_reserve`, `surplus`, `lifetime`) — идиома `(x + (x²)^0.5)/2` для max/min |
| `X … Desired Expansion` | VARIABLE | `IfThenElse(switch, [Gap Limited Construction], 0)` |
| 7 потоков ядра | FLOW | топология §2 спецификации ядра; `Expansion` = `IfThenElse(switch, [Gap Limited Construction] × Min(CG ful, CM ful), 0)` |
| `X … Capital Goods Consumption` | FLOW X CG Inventory → ∅ | `IfThenElse(switch, [X … Expansion] × CG per Capacity, 0)` |
| `X … Construction Materials Consumption` | FLOW X CM Inventory → ∅ | `IfThenElse(switch, [X … Expansion] × CM per Capacity, 0)` |

X ∈ {A, B}, зеркально; имена — `X Construction Materials Plant <роль>` (точный список — `draft/validation-v7.7.3-draft.json`, плагин `capital_lifecycle_kernel`, экземпляры `A/B Construction Materials Plant`). Константы аннотируются исполнителем (тег `construction-materials`); A/B начальные мощности — несимметричная пара (аннотация обязательна).

## 3. Изменяемые существующие элементы (исчерпывающий список)

| Элемент | Новая формула |
|---|---|
| `X Construction Materials Production Capacity` (×2) | `IfThenElse(switch, <old с [X CM Base Production Capacity] → [X CM Plant Active Capacity]>, <old verbatim>)` — шок Mode 28 сохраняется как множитель активной мощности |
| `X Capital Goods Demand` (×2) | `IfThenElse(switch, <old verbatim> + [X CM Plant Desired Expansion] × [CM Plant Capital Goods per Capacity], <old verbatim>)` |
| `X Construction Materials Demand` (×2) | `IfThenElse(switch, <old verbatim> + [X CM Plant Desired Expansion] × [CM Plant Construction Materials per Capacity], <old verbatim>)` |
| `Test 2 Transport Surge Active` | прежняя вложенная цепочка с добавленной веткой `IfThenElse([Timed Test Mode] = 35, [Temporary Test Window], 0)` вместо последнего `0` (как v7.5.1 и v7.7.1) |

Всё остальное — запрещено. `X Construction Materials Base Production Capacity` остаётся (его читает старая ветка).

## 4. Сценарии

| Mode | Имя | Что происходит |
|---|---|---|
| 34 | `v7.7.3 Construction Materials Capital Baseline` | всё включено, без стимулов |
| 35 | `v7.7.3 Transport Surge on Construction Materials Capital` | всплеск транспортного спроса в стандартном окне (`Test 2`) — как Modes 24 и 31 |

## 5. Граница модели, аудиты, стенд

- `capital_lifecycle_kernel`: **9 экземпляров** (+2), все не `NON_CONFORMING`; новые — `CONFORMING_WITH_VARIATION` (нет `finance_limited_construction`, одна physical leg).
- `open_boundaries`: граничных 138 (+12): активация, консервация, износ активной мощности — `capital_state_accounting` по существующим маскам; расширение и оба расхода — `capital_transformation` (добавлены в черновик); +2 пары преобразования (расширение завода ↔ расход оборудования и стройматериалов).
- `planet_closure`: процесс `construction_materials` — `capacity: kernel`, `{C} Construction Materials Plant Active Capacity` (путь: выпуск → темп → план до энергии → мощность выпуска → активная мощность, 4 шага). **P2: kernel 7 → 9, исключений 10 → 8.**
- `loops`: 0 из 512 (9 переключателей).

## 6. Известные ограничения и наблюдения

- **Завод следует за сглаженным спросом и сворачивает излишек.** Стартовая мощность (A 3, B 2) больше спокойного спроса (≈ 0.5–0.8), поэтому завод консервирует и выводит лишнее, как ядро делает с любым избыточным капиталом (B в спокойных Modes, `ARCHITECTURE.md` 4a). В начале прогона сигнал спроса мал (0.14), и A быстро консервирует мощность, а затем реактивирует (20 дней) под пик спроса — стартовый переходный процесс; пиковый выпуск A ниже, чем в v7.7.2 (≈ 2.24 против ≈ 2.73).
- **Mode 35 — главное проявление P2:** к дню 360 завод B законсервирован до ≈ 0.47; во всплеске B **строит завод заново** (до ≈ 1.45) из оборудования и стройматериалов — и пока строит, стройматериалов B остро не хватает (fulfillment до ≈ 0.12 против ≈ 0.93 в v7.7.1 Mode 31 с константной мощностью). Инерция производства стройматериалов — прямое следствие P2.
- Устойчивые стимулы роста (Tests 14, 16, 19, 20, 23) спрос на стройматериалы выше стартовой мощности не поднимают — поэтому стимул Mode 35 — транспорт.
- Добыча реголита, руды и производство оборудования остаются на константах (следующие шаги P2).

## 7. Проверка реализуемости (skeleton, до выдачи)

Полный skeleton (69 элементов, 7 замен, 126 LINK, переключатель в Modes 0–33, Modes 34–35), обе колонии:

| Проверка | Результат |
|---|---|
| `loops` | первый skeleton (требуемая мощность от плана выпуска): **128 из 512** с петлёй (Modes — нет); с сигналом спроса: **0 из 512** |
| `LIFECYCLE_CONFORMANCE` | PASS, 9 экземпляров; новые — `CONFORMING_WITH_VARIATION` (69/69) |
| `STRUCTURE_AUDIT` с черновиком validation | PASS: граничных 138, неклассифицированных 0, closed-world 0, пар 17, A/B 0; Planet closure P2 = 9/8/0 |
| validation черновика (`draft/`) на всех 36 Modes | `OVERALL: PASS`, 0 FAIL; runtime-тождества ядра для 9 экземпляров верны во всех Modes |
| регрессия Modes 0–33 (полный `CHECK_CANDIDATE`) | 34 × `common = 1099, changed = 0, maxAbs = 0`, +69 рядов |
| черновик change-policy (`draft/`) на полном skeleton | `POLICY PASS` с первой попытки: 2584 события, неожиданных 0 |
| проверки test plan с порогами skeleton | исполнены на skeleton (Modes 0, 28, 34, 35) — `OVERALL: PASS` |

Поведение (ориентиры, не пороги):

| | Mode 34 | Mode 35 |
|---|---|---|
| A завод, установленная: старт → день 1080 | 3 → ≈ 0.74 | 3 → ≈ 0.77 |
| B завод, установленная: день 360 → max в окне | ≈ 0.47 → — | ≈ 0.47 → ≈ 1.45 |
| B расширение завода (max) | 0 | ≈ 0.009 в день |
| B расход завода: оборудование / стройматериалы (max) | 0 / 0 | ≈ 0.045 / ≈ 0.045 в день |
| B выпуск стройматериалов (max) | 0 | ≈ 1.03 |
| B CM fulfillment min | ≈ 0.99 | ≈ 0.12 |
| A выпуск стройматериалов (max) | ≈ 2.24 | ≈ 2.24 |

Сам skeleton исполнителю не выдаётся.
