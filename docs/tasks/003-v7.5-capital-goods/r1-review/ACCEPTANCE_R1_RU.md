# Задание 003 / v7.5 Capital Goods — приёмка candidate r1

Дата прогона: 2026-09-21/22. Стенд: Orbital Economy Lab v0.9.0, чистая копия baseline v7.4.1. Патч r1 (SHA `943c20bd…`) применён к accepted v7.4.1 r1 (`07ce33e0…`) → candidate SHA `919d0bfc…` (2748 элементов, 24 Mode). Контрольные суммы поставки сошлись.

## 1. Вердикт

**Candidate r1 не принят — нужна итерация r2.** Механика реализована по спецификации и работает: regression Modes 0–20 бит-в-бит, статика чистая, closed-world 7 → 1. Из четырёх причин r2 **три — на нашей стороне** (тест-план, драфт policy, спецификация fulfillment) и одна — калибровка тестового параметра, предусмотренная планом (§4). Дефектов реализации не найдено.

| Гейт | Результат |
|---|---|
| `APPLY_PATCH` | OK: 56 элементов, 8 замен, 124 LINK, Modes 0–20 `Capital Goods Enabled = 0`, Modes 21–23 добавлены |
| `LIFECYCLE_CONFORMANCE` | **PASS**: 7 экземпляров, 6 × kernel-v2 (`CONFORMING_WITH_VARIATION`), Transport v1, 0 NON_CONFORMING |
| `STRUCTURE_AUDIT` | **PASS**: 102 граничных потока, unclassified 0, пары преобразования 12 (unpaired 0), **closed-world violations 1** (Transport Capacity Expansion); симметрия mismatches 0, exceptions 0 |
| `RUN_LAB` Modes 0–23 | **FAIL**: 22/24 PASS; Mode 21 — 1 проверка, Mode 22 — 1 проверка (§3) |
| `CHECK_CANDIDATE` | Modes 0–20: **21 × `common = 894, changed = 0, added = 56, maxAbs = 0`** — regression чистый; POLICY FAIL: unexpected 0, forbidden 0, required missing 1 (наш драфт, §3.3), hard blockers 2 (= FAIL Modes 21/22) |
| Аннотации | фрагмент валиден: 22 новых параметра / 22 аннотированы |

## 2. Замечание исполнителя — принято

Множитель `[Capital Lifecycle Enabled]` в `X Electronics/Power Capital Goods Consumption` — избыточен численно, но требуется контрактом conformance (switch-gated экземпляр: каждый kernel-FLOW ссылается на switch). Принято; в r2 сохранить.

## 3. Причины r2

### 3.1 Mode 21: «B производит оборудование» — дефект тест-плана (наш)

B в accepted baseline v7.4.1 **не расширяется** ни в одном секторе (Refinery Installed 28 → 8.2, Power 550 → 487 в Mode 17): `B Capital Goods Demand = 0` весь горизонт → производство 0, запас 30 не тронут. Проверка 21.1 для B неверна по построению. В r2-драфте validation заменена на «B demand = 0, запас = 30».

### 3.2 Mode 22: шок ×0.3 не кусается — калибровка тестового параметра (план §4)

`A Capital Goods Base Production Capacity = 2` при спросе после warm-up 0.34–0.61/день: capacity ×0.3 = 0.6 ≈ спрос → производство почти не режется (0.55 → 0.51), запас 18 → 14, fulfillment min 0.963. Чувствительность (стенд):

| Вариант | A fulfillment min [360,720] | восстановление min [900,1080] | A Refinery Installed @720 (Mode 21: 57.88) | A Power @720 (1503.8) | Mode 21 затронут |
|---|---:|---:|---:|---:|---|
| r1: cap 2, ×0.3 | 0.963 | 0.953 | 57.87 | 1503.7 | — |
| **cap 2, ×0.1** | **0.297** | 0.961 | 54.68 (−5.5 %) | 1435 (−4.6 %) | нет (test-only) |
| cap 1, ×0.3 | 0.413 | 0.961 | 54.50 | 1438 | да: warm-up fulfillment 0.56–0.59 (стартовый пик спроса 1.65 > cap) |
| cap 0.8, ×0.3 | 0.244 | 0.966 | 51.26 | 1394 | да, сильнее |

Решение: **`v7.5 Capital Goods Shock Multiplier = 0.1`**, capacity не трогать (2 ≈ 1.2 × стартового пика спроса 1.65; в равновесии загрузка сектора 20–30 % — зафиксировать в аннотации). Это единственная калибровка, и она тестовая.

### 3.3 Policy: `link-into-changed-definitions` required, но matched 0 — дефект драфта (наш)

Первое совпадение: LINK `Capital Goods Enabled -> A Refinery Expansion` перехватывался более ранним правилом `link-from-new-elements` (`Capital Goods Enabled -> *`). Исправлено в r1.1: required-правило поставлено перед wildcard-правилами, fallback `link-from-new-elements` — не required. На вашей стороне ничего.

### 3.4 Спецификация fulfillment — два дефекта (наши), исправить в r2

**(a) Потоки потребления не выключаются переключателем.** `X <Sector> Capital Goods Consumption = Expansion × coef` активны при `Capital Goods Enabled = 0`: в Mode 17 `A Capital Goods Inventory` 30 → 0 к ~дню 20 при производстве 0 — запас «съедается из ничего» (при `non_negative` stock поток отчётно > 0 из пустого запаса). На старые ряды не влияет (fulfillment = 1), но это ложь в балансе массы. r2: обернуть шесть потоков в `IfThenElse([Capital Goods Enabled] = 1, <как в r1>, 0)` (+ 6 LINK от переключателя); identity-проверки шести пар перенесены из `global_checks` в Modes 21–23 (в r2-драфте уже сделано); в Modes 0–20 добавлена проверка «запас = 30 (dead stock)».

**(b) Fulfillment зависит от масштаба.** `Inv / (Inv + 0.5)` с целевым запасом 30 × спрос даёт в равновесии `30D / (30D + 0.5)`: A (D ≈ 0.5) → 0.97, но колония с D = 0.08 → 0.83, с D = 0.01 → 0.38 — медленно строящаяся колония «недообслужена» при полном покрытии. Проявилось в Mode 23: B втягивается в бум (B Power expansion 0.05–0.29 с дня 360 — само по себе правильное поведение), запас B сходится к 30 × 0.08 ≈ 2.4 → fulfillment 0.84. r2: буфер выражается **в днях спроса**:

```text
Capital Goods Buffer Days = 1            (вместо Capital Goods Buffer = 0.5; константу Buffer не добавлять)
X Capital Goods Fulfillment = IfThenElse([Capital Goods Enabled] = 1,
    [X Capital Goods Inventory] / ([X Capital Goods Inventory] + [Capital Goods Buffer Days] * Max([X Capital Goods Demand], 0.000000001)),
    1)
+ LINK X Capital Goods Demand -> X Capital Goods Fulfillment; LINK Capital Goods Buffer Days -> X Capital Goods Fulfillment
```

Петли нет (Demand ← Desired Expansion ← stocks). Проверено на стенде (вариант r1 + (a) + (b) + ×0.1): A-динамика неотличима от r1 (Mode 21: fulfillment 0.968 ровно, вместо 0.98 → 0.95; A Refinery @1080 60.62; Power 1590), B в Mode 23 — 0.96–0.99, шок Mode 22 — 0.294.

## 4. Содержательные результаты r1 (Modes 21–23)

**Mode 21 vs Mode 17 (@1080):** Planet Electronics 36.87 / 37.04 (−0.5 %), Planet Smelting 49.93 / 50.09 (−0.3 %), A Refinery Installed 60.61 / 61.28 (0.989), A Power 1590 / 1610 (0.988), A Energy Unserved 75.0 / 72.4, B late unserved 0. Going concern подтверждён. Оборудование: A производство 1.78/день на старте → 0.32 к 1080; металл на оборудование 0.7–5 % от плавки A; fulfillment 0.98 → 0.95.

**Mode 23 vs Mode 19 (@720 / @1080):** A Refinery Installed 58.66 / 63.02 vs 59.68 / 64.02; A Power 1585 / 1778 vs 1610 / 1808 (−1.7 %); A Electronics Production 32.49 / 36.66 vs 32.70 / 37.14; A Energy Unserved 259.9 / 179.9 vs 256.4 / 163.8 (+10 % — медленнее строится генерация). Спрос на оборудование A 0.60 → max 0.79 (×1.30; порог плана ×1.5 недостижим — в драфте ×1.2), fulfillment min 0.94, все три сектора A расширяются (Electronics expansion появляется с дня ~617). Новое: B втягивается в бум через спрос на металл (B Power expansion до 0.29).

Наблюдение для реестра: переходный провал на дне 360.25 (`A Energy Unserved` → 0, desired expansion → 0 на 1–2 шага) — унаследован от ступеньки спроса v7.4 (Mode 19), не v7.5.

## 5. Что вернуть в r2 (`delivery_r2/`)

1. `model-patch.json` — полный патч против того же base `07ce33e0…` (не против r1), `name = "… candidate r2"`: r1 + (3.4a) гейт шести потоков потребления, (3.4b) `Capital Goods Buffer Days = 1` и новая формула fulfillment, (3.2) `v7.5 Capital Goods Shock Multiplier = 0.1`. Всё остальное — без изменений.
2. `validation-v7.5.json` = `r2_drafts/validation-v7.5-r2-draft.json` **без правок** (пороги и переносы identity уже проверены на стенде; при отклонении — `QUESTIONS.md`, не правка).
3. `change-policy-v7.5-capital-goods-r2.json` = `r2_drafts/change-policy-v7.5-capital-goods-r1.1-draft.json` (уже содержит `Capital Goods Buffer Days` и SHA validation-драфта; менять только если validation изменился).
4. `CANDIDATE_REPORT.md` — что изменилось r1 → r2; `PARAMETER_ANNOTATIONS_fragment.json` — заменить `Capital Goods Buffer` на `Capital Goods Buffer Days` (дни спроса; калибровочный), обновить `v7.5 Capital Goods Shock Multiplier` (0.1) и `A/B Test 22 … Applies` (упоминают 0.3), в `X Capital Goods Base Production Capacity` добавить: «≈ 1.2 × стартовый пик спроса; загрузка в равновесии 20–30 %».

Ожидаемый гейт r2: conformance PASS 6 × v2 + Transport; audit closed-world 1, exceptions 0; RUN_LAB 24/24; CHECK_CANDIDATE 21 × changed = 0, POLICY PASS (observed = expected 1396, unexpected 0, required missing 0) — ровно такой результат получен на стенде для варианта r1 + §3.4 + ×0.1 (`reports/variant/`).

## 6. Артефакты

- `reports/r1/` — прогон r1 как поставлено: apply-patch.log, lifecycle-conformance.md, structure-audit.md, report.md (RUN_LAB), model-comparison.md, change-policy.md, parameter-registry.md.
- `reports/variant/` — прогон проверочного варианта (r1 + §3.4 + ×0.1) с r2-драфтами: model-comparison.md, change-policy.md (PASS).
- `r2_drafts/` — validation r2 draft, policy r1.1 draft, `r2_formula_reference.json` (дословные формулы и LINK изменений §3.2/§3.4 — как реализовано в проверочном варианте).
