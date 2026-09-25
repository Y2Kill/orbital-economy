# Задание 001 / v7.4 — обратная связь по candidate r1

Дата прогона: 2026-09-21. Стенд: Orbital Economy Lab v0.7.1 (приёмочная копия baseline). Ваши артефакты применены как есть: `model-patch.json` → candidate SHA `5016d7b7…`; `validation-v7.4.json`; `change-policy-…-r1.json`.

## 1. Вердикт

**r1 не принят — по вине спецификации, не реализации.** Патч сделан дисциплинированно: 17/17 старых веток дословны (проверено автоматически), только разрешённые элементы, ноль структурных нарушений. Но при `switch = 1` модель не запускается: **алгебраическая петля**, которую спецификация r1 не предусмотрела. Спецификация исправлена (r1.1); прилагаются новые policy/validation drafts и numbers для порогов, полученные на экспериментальном варианте вашего же патча с поправками r1.1.

Ваш watch item про унаследованные 1200 единиц feedstock — верный, подтверждён прогоном (поставки начинались только на дни 228/188). Решение внесено в r1.1.

## 2. Результаты прогона r1

| Гейт | Результат |
|---|---|
| `APPLY_PATCH` | OK: 20 элементов, 17 замен, 69 LINK, 17 сценариев изменены, 4 добавлены → 2416 элементов, 21 Mode |
| `LIFECYCLE_CONFORMANCE` | **PASS**, 7 экземпляров, 0 NON_CONFORMING |
| `STRUCTURE_AUDIT` | **PASS**: 121 поток, 90 граничных, unclassified 0, closed-world 7; симметрия 656 пар / 1306 LINK, mismatches 0, exceptions 17 |
| `RUN_LAB` Modes 0–16 | **PASS** (все 17) |
| `RUN_LAB` Modes 17–20 | **FAIL — simulation: Circular equation loop** (все четыре) |
| `CHECK_CANDIDATE` Modes 0–16 | 17 × `changed = 0, maxAbs = 0, added = 20` — regression gate **чист** |
| `CHECK_CANDIDATE` policy | 467 событий, unexpected 0, forbidden 0, required missing 0; **hard blockers 4** (симуляция Modes 17–20) → FAIL |

## 3. Находка 1 — петля (дефект спецификации r1)

```text
X Desired Smelting Rate  ←(новое слагаемое §4)←  X Electronics Metal Input Delivery
        ↓                                                  ↑
X Smelting Rate → X Metal Requested Energy         X Electronics Metal Input Demand
        ↓                                                  ↑
X Energy Fulfillment Ratio → X Electronics Production Rate → X Electronics Feedstock Consumption Rate
```

Общий энергетический аллокатор делает фактический выпуск электроники функцией плавки **в тот же шаг**, а спецификация велела строить спрос на вход от фактического потребления. Движок ловит петли динамически — поэтому Modes 0–16 (ветка выключена) прошли.

**Исправление r1.1 (spec §3):** спрос на вход и целевой запас — от *планируемого* выпуска:

```text
X Electronics Metal Input Target Inventory = [X Pre Energy Electronics Production Rate] × [Metal per Electronics] × [Metal Input Target Days]
X Electronics Metal Input Demand = Max(0, [X Pre Energy Electronics Production Rate] × [Metal per Electronics]
                                          + (target − [X Electronics Feedstock Inventory]) / [Metal Input Adjustment Time])
```

`X Electronics Feedstock Consumption Rate` (фактическое) — без изменений. LINK от `Feedstock Consumption Rate` в эти два элемента убрать, добавить от `Pre Energy Electronics Production Rate` и `Metal per Electronics`. Проверено: петля исчезает, Modes 17–20 считаются.

## 4. Находка 2 — унаследованный запас 1200 (ваш watch item)

Подтверждено: с `Feedstock Inventory = 1200` спрос на вход равен нулю до дня 228 (A) / 188 (B). **r1.1 (spec §4):** `initial_value` стока `X Electronics Feedstock Inventory` = `IfThenElse([Intermediate Inputs Enabled] = 1, [Metal per Electronics] × 1200, 1200)` — переоценка унаследованного feedstock в металлические единицы. Это `replace_formulas` с `initial_value` (формат патча это поддерживает) + два LINK в сток. Policy r1.1 разрешает. С этим поставки начинаются на дне 0 (A) и ~25 (B).

## 5. Находка 3 — Mode 18 в связанном мире не кусается у B (дефект test plan r1)

С вашей реализацией шок `B Mining Capacity` 28 → 14 **не ограничивает даже собственную добычу B** (~11/день): в связанной экономике B плавит 5–8/день, импортирует металл из A и сидит на 2500 руды. `B Electronics Metal Input Fulfillment` = 0.979 всё окно; цена металла B даже падает.

**r1.1:** шок переносится на **A** — металлического экспортёра. Новый элемент `A Effective Mining Capacity` (coupled-ветка с Test 18, legacy-ветка `[A Mining Capacity]`), `A Mining Rate` в coupled-ветке читает его; `B Effective Mining Capacity` **не менять** (уберите из патча). Это одна документированная асимметрия A/B — исключение уже внесено в validation r1.1 (exceptions = 18). В эксперименте шок у A проходит по всей цепи: руда A 2460 → 117 к дню 480, плавка A 39 → 25, экспорт A→B 17 → 5, цена металла B 40 → 57, себестоимость электроники B +25 %, её выпуск −52 %; после дня 720 всё восстанавливается к 1080. Пороги Mode 18 в validation r1.1 — абсолютные числа из этого эксперимента (см. `V7_4_TEST_PLAN.md` r1.1).

## 6. Находка 4 — «going concern» per-colony невозможен (дефект test plan r1)

Связь при `Metal per Electronics = 0.25` **переворачивает специализацию** — вы это предсказали в отчёте §3, числа подтверждают:

| @1080 | Mode 12 | Mode 17 (эксперимент r1.1) |
|---|---:|---:|
| A Electronics Production | 1.29 | 22.07 |
| B Electronics Production | 40.77 | 14.98 |
| **Planet Electronics Production** | **42.06** | **37.04** |
| A Smelting | 43.40 | 44.66 |
| B Smelting | 1.38 | 5.42 |
| **Planet Smelting** | **44.78** | **50.09** |
| Electronics B→A / A→B | 21.68 / 0 | 0 / 1.25 |
| Metal A→B | 23.13 | 20.78 |
| A / B Electronics Unit Cost | 23.96 / 10.37 | 13.75 / 16.71 |
| A / B Market Price (metal) | 25.90 / 32.33 | 30.47 / 37.41 |
| A Energy Unserved | 0 | 72.4 (снижается: 142 → 107 → 72) |
| A Power Installed | 1328 | 1610 |

B теряла экзогенный дешёвый feedstock (3), A получает вход дешевле своего legacy (18): A становится производителем и металла, и электроники. Per-colony критерий [0.5, 2.0] для A даёт ×17 — бессмысленно. **r1.1:** going concern на уровне планеты (`Planet Electronics Production Rate`, `Planet Smelting Rate` — два новых диагностических элемента, суммы A + B) в [0.5, 2.0] от Mode 12, плюс выпуск электроники каждой колонии ≥ 2.0.

Энергодефицит A в Mode 17 не исчезает к 1080, но монотонно снижается — это ограничение v7.3 (60-дневное планирование мощности) при структурном росте спроса A. Test 17.5 r1.1 требует снижения (≥ 20/день за 720→1080) и ≤ 100 на 1080, не нуля.

## 7. Что сделать в r2 (чек-лист)

1. Demand / Target Inventory → от `Pre Energy Electronics Production Rate` (§3); поправить LINK.
2. `initial_value` `X Electronics Feedstock Inventory` → IfThenElse-переоценка (§4) + LINK от `Intermediate Inputs Enabled`, `Metal per Electronics`.
3. Mode 18 → A: добавить `A Effective Mining Capacity`; `A Mining Rate` coupled-ветка через него (legacy дословно); **вернуть** `B Effective Mining Capacity` к accepted (убрать из `replace_formulas` и его LINK).
4. Добавить `Planet Electronics Production Rate`, `Planet Smelting Rate` (+4 LINK).
5. Сценарий Mode 18: описание обновить («A metal supply shock»).
6. `validation-v7.4.json` r2 = `validation-v7.4-draft-r1.1.json` + ваши `[calib]` (18.9, 19.x, 20.x) с обоснованием по числам из приложенных отчётов.
7. Policy r2 = `change-policy-v7.4-intermediate-inputs-draft-r1.1.json` + `validation_sha256` (мы посчитаем при приёме, если не можете).
8. `CANDIDATE_REPORT.md` r2: заполнить таблицы Mode 12 vs 17 (числа выше), 14 vs 19, 16 vs 20 — по отчётам в `reports/`.

Ожидаемый результат r2 на нашем стенде (проверено на экспериментальном варианте с этими же поправками): все гейты PASS; `CHECK_CANDIDATE` → `OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED` (Modes 0–16: changed 0, maxAbs 0; ярлык — из-за добавленного ключа `Intermediate Inputs Enabled` в сценарии 0–16), policy PASS, 538 событий, unexpected 0.

## 8. Что не менять

Всё остальное в r1 корректно: switch-обёртки, `Feedstock Price = Market Price`, `Unit Cost`, `Feedstock Buffer = 0.25 × 40`, `Desired Smelting Rate + Delivery`, тестовая обвязка Test 19/20, сценарии, `Metal per Electronics = 0.25` (оставить; переворот специализации — ожидаемое следствие, задокументируйте его в отчёте, не «лечите» коэффициентом).

## 9. Приложения (`reports/`)

`apply-patch.log`, `lifecycle-conformance.md`, `structure-audit.md`, `report.md` (RUN_LAB, с текстом петли), `model-comparison.md`, `change-policy.md` — прогон вашего r1. Папка `experiment/` — прогон экспериментального варианта с поправками r1.1: `report-modes-0-12-17-20.md` (все PASS), `series-mode17.md`, `series-mode18.md`, `series-mode12-vs-17.md` — таблицы значений по дням для заполнения отчёта r2.
