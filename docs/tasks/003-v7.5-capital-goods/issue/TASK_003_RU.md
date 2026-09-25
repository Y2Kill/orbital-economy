# Задание 003 — Orbital Economy v7.5 Capital Goods (kernel-v2)

> Статус 2026-09-22: candidate r1 прошёл приёмку с замечаниями → **r2**. Требования r2 и готовые драфты validation/policy — `../task_003_feedback_1/` (ACCEPTANCE_R1_RU.md §5). Спецификация — с erratum в шапке.

Дата выдачи: 2026-09-21. База: accepted **v7.4.1 r1** (SHA `07ce33e0…`), стенд Orbital Economy Lab v0.9.0 — в `baseline/`. Реализуемость проверена skeleton-патчем (`skeleton/`): петель нет, Modes 0/12/17 точны при выключенном переключателе.

## 1. Цель

Капитал перестаёт возникать «из ничего»: в каждой колонии появляется сектор **Capital Goods** (агрегатное «оборудование» из металла и электроники), а строительство мощностей Refinery / Electronics / Power его потребляет. Kernel-v2: `expansion = desired expansion × capital goods fulfillment` + поток потребления оборудования (пара преобразования). Transport — вне задачи (v7.5.1). Счётчик closed-world: 7 → **1**.

Спецификация — `V7_5_ARCHITECTURE_SPEC.md` (§2 — все элементы с формулами, §3 — единственные шесть изменяемых потоков, §4 — сценарии 21–23). Проверки — `V7_5_TEST_PLAN.md`. Дословные формулы — `V7_5_WORKING_CONTEXT.md`.

## 2. Как устроена работа

Как в задачах 001/002: патч → мы прогоняем → отчёты. Пороги EXPECTATION Modes 21–23 в первой итерации не нужны — только HARD/REGRESSION и качественные проверки из драфта; числа — во второй итерации по нашим отчётам.

Порядок чтения: `V7_5_ARCHITECTURE_SPEC.md` → `V7_5_WORKING_CONTEXT.md` → `skeleton/skeleton-patch-A-only.json` (образец для A: Refinery + Power + сектор Capital Goods; вам — обе колонии, три сектора, тестовая обвязка) → `V7_5_TEST_PLAN.md` → драфты policy/validation → `baseline/lab/docs/MODEL_PATCH_RU.md`, `STRUCTURE_AUDIT_RU.md` (§ о парах преобразования), `LIFECYCLE_CONFORMANCE_RU.md`.

## 3. Что вернуть (`delivery_rN/`)

| # | Артефакт | Требование |
|---|---|---|
| 1 | `model-patch.json` | `base_sha256 = 07ce33e0…`; `name = "Orbital Economy v7.5 Capital Goods candidate rN"`; `modify_scenarios` 0–20: `Capital Goods Enabled: 0`; `add_scenarios` 21–23 |
| 2 | `validation-v7.5.json` | = draft + коэффициенты в identity-проверках пар приведены к вашим константам; в r1 `calib_todo` можно оставить |
| 3 | `change-policy-v7.5-capital-goods-rN.json` | = draft + `validation_sha256` |
| 4 | `CANDIDATE_REPORT.md` | что сделано; выбранные константы и почему (§2 спецификации даёт старт); ожидаемое поведение Modes 21–23; известные ограничения |
| 5 | `PARAMETER_ANNOTATIONS_fragment.json` | аннотации всех новых констант (роль / что меняет / доказательство или «калибровочный, без физического обоснования»), тег `capital-goods` |
| 6 | `QUESTIONS.md` при необходимости | до реализации спорного места |

## 4. Критерий приёмки

```text
APPLY_PATCH                 OK
LIFECYCLE_CONFORMANCE.cmd   PASS; 6 экземпляров kernel-v2 (+ Transport v1), 0 NON_CONFORMING
STRUCTURE_AUDIT.cmd         PASS; unclassified 0; unpaired 0; closed-world violations = 1 (Transport Capacity Expansion);
                            colony symmetry mismatches 0, исключений не больше, чем в baseline
RUN_LAB.cmd                 OVERALL: PASS (Modes 0–23)
CHECK_CANDIDATE.cmd         Modes 0–20: 21 × changed = 0, maxAbs = 0
                            POLICY RESULT: PASS (Unexpected 0, Forbidden 0, Required missing 0, Hard blockers 0)
```

Содержательно: Mode 21 — going concern относительно Mode 17 (±15 % по планетарным итогам), Mode 22 кусается (fulfillment A < 0.7), Mode 23 показывает конкуренцию за оборудование.

## 5. Чек-лист самопроверки

- [ ] шесть `X <Sector> Desired Expansion` — **дословно** прежние формулы expansion (для Electronics/Power — с множителем `[Capital Lifecycle Enabled]`);
- [ ] шесть потоков expansion — `IfThenElse([Capital Goods Enabled] = 1, [X <Sector> Desired Expansion] * [X Capital Goods Fulfillment], <old verbatim>)`;
- [ ] `X Capital Goods Production Rate` при switch = 0 равен 0; `Fulfillment` при switch = 0 равен 1;
- [ ] потребление оборудования не добавлено в `Desired Smelting Rate` / `Desired Electronics Production Rate` (спецификация §3 — петля);
- [ ] потоки потребления: `X Capital Goods Metal Consumption` из `X Metal Inventory`, `… Electronics …` из `X Electronics Inventory`, `X <Sector> Capital Goods Consumption` из `X Capital Goods Inventory` — все в ∅; `X Capital Goods Production` из ∅ в `X Capital Goods Inventory`;
- [ ] пары в validation: 6 capital + 2 production (по колонии); коэффициенты identity = вашим константам;
- [ ] kernel-плагин: 6 экземпляров `kernel_version: 2` с ролями `desired_expansion`, `capital_goods_consumption` (в драфте уже есть — имена должны совпасть с вашими);
- [ ] Test 22/23 — по образцу задачи 002 (флаги применимости, общие множители); Test 23 ветвь — снаружи существующего IfThenElse в `X Effective Electronics Local Base Demand`;
- [ ] A и B зеркальны; `Capital Goods Buffer = 0.5` (не 2);
- [ ] каждая ссылка имеет LINK; каждая новая константа аннотирована.

## 6. Что запрещено

Менять что-либо сверх §3 спецификации; Transport; торговля оборудованием; энергия для оборудования; удаления/переименования; ослабление validation; новые исключения симметрии.
