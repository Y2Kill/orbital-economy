# Отчёт кандидата — задача 017, v7.7.5 Regolith Capital

## Журнал

Работа начата с `main@4bd2699f1c80fcd0a7684b4e59fc6499d01b5167`. Ветка `task/017-regolith-capital` создана от этой же головы; предыдущей ветки и журнала не было.

Первый candidate r1 собран как структурная поставка и калибровочный прогон для КТ1–КТ3. Декларация `draft/regolith-mine.json` перенесена в `model-patch.json` секцией `nodes` без изменения семантики; `add_elements` пуст. В `replace_formulas` находится только `Test 2 Transport Surge Active`, как требует спецификация.

Числовые ожидания `[calib]` в Modes 38–39 представлены диагностическими зондами с заведомо невозможными порогами. Их цель — получить фактические значения первого полного `candidate.yml`, после чего заменить только эти пороги округлёнными семантическими значениями с запасом. Структурные правила owner-validation и правила owner-policy не ослаблялись. `validation_sha256` в policy намеренно остаётся непривязанным до фиксации калиброванной validation.

### Состояние до первого CI

- Modes 0–37 получают `Regolith Capital Enabled = 0`.
- Mode 38 повторяет значения Mode 37, меняя `Timed Test Mode` на 38 и включая Regolith Capital.
- Mode 39 делает то же для 39; `Test 2 Transport Surge Active` получает дополнительную ветку Mode 39.
- Validation добавляет switch-off проверки в Modes 0–37, исключая legacy-capacity identity только в Mode 29; Modes 38–39 наследуют identity-проверки v7.7.4 и добавляют три identity на колонию для Regolith Mine.
- `metric`-окна записаны только через `window`; `event_absent` использует вложенный `event`.

## Реализация кандидата

Новые модельные элементы руками не раскрывались: вся шахта задаётся одной декларацией `simple_capital`. Параметры и несимметричная начальная мощность A/B = 7/5 перечислены в `PARAMETER_ANNOTATIONS_fragment.json`.

Противоречий между TASK_RU.md, V7_7_5_ARCHITECTURE_SPEC.md, V7_7_5_TEST_PLAN.md, `simple_capital` в NODES_RU.md, MODEL_PATCH_RU.md и контрактом §8–§9 не обнаружено.

## Что не запускалось локально

У агента нет локального checkout/Node-стенда. Локально не запускались `check_branch`, `build_sums`, bench/selftests, `APPLY_PATCH`, `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT`, `RUN_LAB`, `CHECK_CANDIDATE`, `candidate.yml` и канонический Windows-прогон. Это заменяется чтением accepted-модели и нормативных файлов, статической сборкой артефактов и GitHub Actions по §9.4. `SHA256SUMS` не пересобираются, поскольку `sums_by: reviewer`.

После первого push отдельной записью в журнал будут зафиксированы конкретные run ID, которые ожидаются; результат будет проверен отдельным шагом, без одного длинного ожидания.


### Ожидаемые прогоны после candidate r1

После push кандидата `09368265c5fe7f74f44014d1f8d9f2ee1ffa1018` зафиксированы отдельные запуски:
- Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36410009451 — первый полный `candidate.yml`; ожидается, что apply/conformance/audit пройдут, validation упадёт только на калибровочных зондовых порогах, а policy может дополнительно упасть на непривязанном `validation_sha256`.
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36410009560 — общий guard/selftests Linux для головы r1.

Результаты этих запусков проверяются отдельным шагом; один длинный polling/wait не используется.


## Журнал — продолжение

### КТ1 — закрыта по candidate r1

Доказательство: Candidate acceptance run https://github.com/Y2Kill/orbital-economy/actions/runs/36410009451 для candidate-коммита `09368265c5fe7f74f44014d1f8d9f2ee1ffa1018`.

- apply-patch: PASS; candidate SHA-256 `2f7c7e4654e972842eaa8f53064997045bbb22a742f4b7097dba24864f7ad2ca`.
- conformance: PASS; `A Regolith Mine CONFORMING (23/23 checks)`, `B Regolith Mine CONFORMING (23/23 checks)`.
- structure audit: PASS.
- open boundaries: `168`; unclassified=0; closed-world violations=0; transformation pairs=21, unpaired=0.
- Planet closure: `P2=11/2/4/0` (kernel/simple/exceptions/undeclared).
- algebraic loops: switches=11; combinations=2048; with loops=0; Modes=none.

Тем самым требования КТ1 выполнены; узел применён стендом именно из секции `nodes`.

### КТ2 — закрыта по candidate r1

В том же run policy-сравнение дало `Observed=1451`, `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`. `COMPARISON RESULT=OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED`: изменения сценарного контракта — ожидаемые новые Modes 38–39 и переключатель. Два hard blocker относятся не к регрессии: r1 validation содержит намеренные калибровочные FAIL, а `validation_sha256` policy ещё не привязан.

Следовательно неожиданных изменений в Modes 0–37 нет; КТ2 выполнена.

### Первый калибровочный прогон для КТ3

Validation r1 закономерно `OVERALL: FAIL`; фактические значения зондов:

- Mode 38: `A Regolith Mine Capacity max = 8.83297336437531`;
- Mode 38: `A Regolith Mine Capacity change 0→1080 = -4.70803287983692`;
- Mode 38: `B Regolith Mine Expansion max <= 1e-6` — PASS;
- Mode 39, окно 360→720: `B Regolith Mine Expansion max = 0.0437738174128435`;
- Mode 39: `B Regolith Mine Capacity change 360→720 = +6.09084223078142`;
- Mode 39: `B Regolith Mine Capital Goods Consumption max > 0` — PASS;
- Mode 39, окно 360→720: `B Regolith Extraction Rate max = 3.54295805117321`;
- Mode 39: до дня 360 expansion отсутствует — `event_absent` PASS.

Дополнительно обнаружена ошибка моей сборки validation r1: при формировании Modes 38–39 я копировал identity-проверки из уже дополненного Mode 37, поэтому вместе с legacy-парами ошибочно скопировалось новое switch-off тождество `Regolith Extraction Capacity = Regolith Base Extraction Capacity`. В Modes 38–39 оно по определению ложно, поскольку там switch=1 и правильное тождество — `Extraction Capacity = Mine Capacity`. Исправление r2: наследовать legacy identity до добавления regolith switch-off identity либо явно исключить эту проверку; проверки Modes 0–37 не ослабляются.

### Замечание по scope/guard

CI run https://github.com/Y2Kill/orbital-economy/actions/runs/36410037014 выявил операционное несоответствие: pretty-printed `candidate/validation.json` r1 имеет 1,082,826 байт, а `scope.json` содержит `allow_binary: []`; guard трактует любой файл >1 MiB как запрещённый. Scope изменять нельзя и не нужно. r2 будет содержать тот же JSON семантически в компактном представлении с LF, чтобы остаться ниже 1 MiB. Это изменение форматирования, а не ослабление validation.

Следующий шаг: собрать r2 с исправленным наследованием identities, округлёнными порогами по значениям выше и компактным JSON; затем отдельно зафиксировать и проверить новый candidate.yml.
