# Задание 001 — Orbital Economy v7.4 Intermediate Inputs / Input-Output Coupling

Дата выдачи: 2026-09-21. База: accepted v7.3 r2 (SHA `57a2a102…`), стенд Orbital Economy Lab v0.7.1 — всё в `baseline/`. **Ревизия r1.1** (после приёмки candidate r1): актуальны `V7_4_ARCHITECTURE_SPEC.md` (r1.1), `V7_4_TEST_PLAN.md` (r1.1), `change-policy-…-draft-r1.1.json`, `validation-v7.4-draft-r1.1.json`; разбор r1 — в `../task_001_v7.4_feedback_1/FEEDBACK_R1_RU.md`.

## 1. Цель

Сделать Metal физическим промежуточным входом сектора Electronics, заменив экзогенный Feedstock, — так, чтобы:

- в Modes 0–16 модель воспроизводила accepted v7.3 r2 **точно** (все 827 существующих рядов, `maxAbs = 0`);
- в новых Modes 17–20 связь была видна как пять явных величин: спрос на вход, доступность, поставка/fulfillment, эффект на себестоимость, ограничение выпуска;
- все инварианты стенда проходили, а новые инварианты v7.4 были заданы декларативно в validation JSON.

Что именно менять и что запрещено — `V7_4_ARCHITECTURE_SPEC.md` (§3, §4 — исчерпывающие списки). Какие проверки и почему — `V7_4_TEST_PLAN.md`. Точные имена и формулы всего, что вы трогаете, — `V7_4_WORKING_CONTEXT.md` (и то же машинно-читаемо в `v7_4_working_context.json`).

## 2. Как устроена работа: вы строите — мы проверяем

Вы **не запускаете стенд**. Цикл такой:

```text
   вы                                                     мы
──────────────────────────────────────────────    ──────────────────────────────────────────────
1. читаете spec / test plan / working context
2. пишете model-patch.json (не полную модель!)
   + validation-v7.4.json + policy r1 + отчёт    ─►  3. APPLY_PATCH → candidate ModelJSON
                                                      4. LIFECYCLE_CONFORMANCE, STRUCTURE_AUDIT,
                                                         RUN_LAB (Modes 0–20), CHECK_CANDIDATE
                                                 ◄─  5. возвращаем пакет отчётов (Markdown):
                                                         apply-patch log, lifecycle-conformance.md,
                                                         structure-audit.md, report.md,
                                                         model-comparison.md, change-policy.md
6. разбираете каждый FAIL / UNEXPECTED /
   NON_CONFORMING / mismatch, правите патч      ─►  повтор с шага 3
```

Одна итерация с нашей стороны — около 10 минут машинного времени. Отчёты стенда написаны для чтения человеком и LLM: в них точные имена элементов, номера Modes, дни и величины отклонений. Ожидаемое число итераций — 2–4; первую делайте максимально аккуратно по чек-листу §5.

Порядок чтения перед началом:

```text
README_RU.md → baseline\README_RU.md → baseline\docs\CONTRACTOR_DELIVERY_CONTRACT_RU.md (§7 — вариант без стенда)
→ V7_4_ARCHITECTURE_SPEC.md → V7_4_TEST_PLAN.md → V7_4_WORKING_CONTEXT.md
→ baseline\lab\docs\MODEL_PATCH_RU.md (формат вашей поставки)
→ change-policy-v7.4-intermediate-inputs-draft-r1.1.json, validation-v7.4-draft-r1.1.json
Для понимания модели: baseline\docs\model_v7_3\V7_3_ARCHITECTURE_SPEC.md, V7_3_R2_VALIDATION_REPORT.md,
V7_3_CAPITAL_LIFECYCLE_AUDIT_2026-09-21.md; baseline\docs\CAPITAL_LIFECYCLE_KERNEL_SPEC.md;
baseline\lab\docs\STRUCTURE_AUDIT_RU.md; reference\simulation-equations.md (язык формул движка).
```

## 3. Что вернуть (папка `delivery_rN/`)

| # | Артефакт | Требование |
|---|---|---|
| 1 | **`model-patch.json`** | формат `orbital-economy-model-patch-v1` (`baseline\lab\docs\MODEL_PATCH_RU.md`); `base_sha256 = 57a2a102…`; `name = "Orbital Economy v7.4 Intermediate Inputs candidate rN"`. Только `add_elements` / `replace_formulas` / `add_links` / `modify_scenarios` / `add_scenarios`. Полную модель **не присылать** |
| 2 | **`validation-v7.4.json`** | = `validation-v7.4-draft-r1.1.json` + заполненные пороги `[calib]` из test plan; ничего из v7.3.2 не ослаблено и не удалено; в первой итерации `[calib]`-проверки можно оставить незаполненными — они появятся после того, как вы увидите числа в наших отчётах |
| 3 | **`change-policy-v7.4-intermediate-inputs-rN.json`** | = draft + `validation_sha256` артефакта 2 (мы посчитаем и сообщим SHA, если вы не можете); любое добавленное правило — с `note`, почему оно необходимо по спецификации |
| 4 | **`CANDIDATE_REPORT.md`** | по структуре `V7_4_TEST_PLAN.md` §5. В первой итерации — «что сделано и почему, ожидаемое поведение, открытые вопросы»; числа и таблицы Mode 12 vs 17 / 14 vs 19 / 16 vs 20 заполняются из наших отчётов на следующих итерациях |
| 5 | **`QUESTIONS.md`** (если есть) | вопросы к спецификации с номерами пунктов — **до** реализации спорного места |

## 4. Критерий приёмки

Наш прогон на чистой копии baseline с вашими артефактами 1–3:

```text
APPLY_PATCH                 применяется без ошибок
LIFECYCLE_CONFORMANCE.cmd   CONFORMANCE RESULT: PASS, 7 instances, 0 NON_CONFORMING
STRUCTURE_AUDIT.cmd         STRUCTURE AUDIT RESULT: PASS
                            unclassified = 0; colony symmetry mismatches = 0; exceptions = 18 (r1.1: + A Effective Mining Capacity);
                            closed-world violations = 7 (не больше, чем в baseline)
RUN_LAB.cmd                 OVERALL: PASS  (Modes 0–20)
CHECK_CANDIDATE.cmd         COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
                            (Modes 0–16: changed = 0, maxAbs = 0, added = новые ряды; сценарии 0–16 получили ключ
                             Intermediate Inputs Enabled = 0 — это и есть «scenario contract changed»; Modes 17–20: candidate-only)
                            POLICY RESULT: PASS
                            Unexpected: 0  Forbidden: 0  Threshold exceed: 0  Required missing: 0  Hard blockers: 0
```

Плюс содержательная приёмка `CANDIDATE_REPORT.md`: калибровка `Metal per Electronics` объяснена, Mode 17 — going concern, причинные цепочки Modes 18–20 подтверждены числами, ни один порог `[calib]` не является тавтологией.

## 5. Чек-лист самопроверки перед отправкой (компенсирует отсутствие стенда)

- [ ] каждая ссылка `[X]` в каждой новой/изменённой формуле имеет LINK `X → элемент` в `add_links` (кроме FLOW ↔ его STOCK); неизвестных имён нет — сверьтесь с `v7_4_working_context.json`;
- [ ] каждая изменённая существующая формула имеет вид `IfThenElse([Intermediate Inputs Enabled] = 1, new, old)`, где `old` — **дословно** текущая формула из working context;
- [ ] `Intermediate Inputs Enabled` в `replace_formulas` появляется только у элементов из спецификации §4;
- [ ] для каждого нового элемента `A …` есть зеркальный `B …` с зеркальной формулой (аудит симметрии); единственное разрешённое исключение — `A Effective Mining Capacity` (r1.1);
- [ ] новые FLOW: `from`/`to` — существующие STOCK или `null`; `X Electronics Metal Input Delivery` идёт `X Metal Inventory → X Electronics Feedstock Inventory`;
- [ ] `modify_scenarios` для всех Modes 0–16: `"Intermediate Inputs Enabled": 0`; `add_scenarios` для 17–20 с `Capital Lifecycle Enabled: 1`, `Intermediate Inputs Enabled: 1`;
- [ ] `Test 18/19/20 … Active` определены по образцу `Test 14 …` (через `[Timed Test Mode]` и окно); ветви добавлены в `A Effective Electronics Local Base Demand`, `B Effective Local Base Demand` **снаружи** существующих IfThenElse; Test 18 — через новый `A Effective Mining Capacity` и coupled-ветку `A Mining Rate` (r1.1), `B Effective Mining Capacity` не трогать;
- [ ] имена новых элементов — только канонические из спецификации §3 или в пространствах `* Metal Input *`, `* Intermediate *`, `Test 18|19|20 *`, `v7.4 *`;
- [ ] ни одного удаления, переименования, изменения типа, изменения `from`/`to` существующих FLOW;
- [ ] спрос на вход и целевой запас построены от `X Pre Energy Electronics Production Rate` (r1.1), не от фактического потребления — иначе алгебраическая петля через энергетический аллокатор;
- [ ] `initial_value` `X Electronics Feedstock Inventory` переоценён в металлические единицы через IfThenElse (r1.1);
- [ ] `Metal per Electronics` выбран и обоснован; вы ожидаете (и написали в отчёте), как изменится торговля Electronics между A и B.

## 6. Что будет отклонено

- любое ненулевое отличие в Modes 0–16 (даже 1e-15) — это нарушение формы IfThenElse из спецификации §0, а не «численный шум»;
- полная модель вместо патча; переименования; элементы вне разрешённых пространств имён;
- `Metal per Electronics`, подобранный так, чтобы Mode 17 стал неотличим от Mode 12;
- ослабление validation (tolerance, удаление проверок, `enforce` аудитов); новые исключения `colony_symmetry` сверх `A Effective Mining Capacity`;
- добавление `Intermediate Inputs Enabled` или `Capital Lifecycle Enabled` куда-либо, кроме перечисленного в спецификации §4.

## 7. Что можно и нужно предлагать

Если спецификация в каком-то месте не реализуема без нарушения §0 или §4 — остановиться и написать в `QUESTIONS.md`: что именно, почему, какой минимальный вариант вы предлагаете. Предложения по экономике (например, иная схема нормирования металла между конечным и промежуточным спросом) приветствуются **как отдельный раздел отчёта**, не как молчаливая реализация. Идеи для v7.5+ (capital goods, топливо для энергетики) — в раздел «предложения», не в патч.

Ответы на вопросы фиксируются как дополнение к спецификации (r1 → r1.1) и версионируются вместе с policy.
