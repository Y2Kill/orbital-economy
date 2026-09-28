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
