# Отчёт задания 026 — v7.7.9: энергия процессов

Исполнитель: GPT-5.6 Sol (API-коннектор GitHub).
База работы: `main` @ `cd7a931d119863c98b9b69fca06d2d5b75c5b88b`.
Ветка: `task/026-process-energy`.

## Поставка

Подготовлена первая поставка r1 в `candidate/`:
- `model-patch.json` — декларация `energy_consumer` из `draft/process-energy.json` без изменения полей и значений; `add_elements` и `add_links` пусты; явная `replace_formulas` содержит только `Test 2 Transport Surge Active`; Modes 0–45 получают `Process Energy Enabled = 0`, Modes 46–47 включают слой;
- `validation.json` — owner `draft/validation-v7.7.9-draft.json` тем же git blob, без изменения байтов; пороги skeleton до первого candidate-run не менялись;
- `change-policy.json` — rules owner draft не менялись; финализированы только `name` и `description`; `validation_sha256 = 03a732ce96cf39a17064233c463a873505c3c510892ac216cae3d42a8ae8529b` оставлен из проверенного owner draft и должен быть подтверждён `candidate.yml`;
- `PARAMETER_ANNOTATIONS_fragment.json` — аннотации switch, четырёх `Energy per Unit`, четырёх времён подстройки и всех стартовых сигналов A/B.

## Отличия

От архитектурной спецификации и декларации `draft/process-energy.json` содержательных отклонений нет. Validation не редактировалась; rules change-policy не расширялись и не ослаблялись.

Есть неточность формулировки задания, оставленная без скрытой подмены: `TASK_RU.md` §2 говорит «Сигналы — несимметричные пары», однако `V7_7_9_ARCHITECTURE_SPEC.md` §1 и `draft/process-energy.json` задают Regolith Extraction и Capital Goods как `0 / 0`. В поставке сохранены нормативные значения `0/0`; обе стороны каждой пары аннотированы.

## Что локально не запускалось

Согласно §9.4 и режиму API-коннектора локально не запускались:
- `tools/check_branch.mjs`;
- локальные `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT`, `RUN_LAB`, `CHECK_CANDIDATE`;
- канонический Windows-стенд и `bench-full`;
- `tools/build_sums.mjs` и пересборка `SHA256SUMS` (в `scope.json`: `"sums_by": "reviewer"`).

Замена локальной проверки: GitHub Actions `candidate.yml` и `ci.yml`; фактические результаты фиксируются в журнале отдельными шагами. Непроверенное локально не считается подтверждённым.

## Журнал

### Рабочая запись — 2026-10-03 — первая поставка перед КТ1

Сделано: собрана candidate r1 строго в пределах задания; ветка создана от `main` `cd7a931d119863c98b9b69fca06d2d5b75c5b88b`. Декларация узла перенесена без ручного раскрытия; вручную проведён только Mode 47 через `Test 2 Transport Surge Active`.
Проверено чтением спецификации: ожидаются 71 generated element, 14 replace targets, 232 links, boundaries 224, loops 0/32768 и Planet P3 14/2/1/0; это пока owner-skeleton ожидания, не результат текущего прогона.
Не запускалось: локальный guard и стенд, перечисленные выше.
Дальше: после push зафиксировать конкретные запуски `candidate.yml` и `ci.yml`, затем отдельным шагом прочитать их результат и закрывать КТ только по фактическим логам.

### Ожидаемые прогоны после candidate r1

Для candidate-коммита `e3102703f8872e0ac49a9eddb829541dbd0a0a1b` зафиксированы:
- Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/37108034775 — ожидаются apply-patch, conformance, audit, validation и policy;
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/37108034807 — ожидаются guard и самотесты на Linux.

На момент записи Candidate acceptance был `in_progress`, CI — `pending`. Результаты проверяются отдельным шагом; один длинный polling/wait не используется.

### КТ1 — достигнута по Gate 1–3 candidate r1

Доказательство: Candidate acceptance https://github.com/Y2Kill/orbital-economy/actions/runs/37108034775 для candidate-коммита `e3102703f8872e0ac49a9eddb829541dbd0a0a1b`.

На момент записи три требуемых структурных gate завершены `success`:
- Gate 1 `apply-patch`;
- Gate 2 `conformance`;
- Gate 3 `audit`.

Это подтверждает, что delivered patch с `nodes` применяется и structural/conformance gates проходят. Точные строки со счётчиками boundaries, loops и Planet P3 будут внесены только из завершённого job log; owner-skeleton числа не выдаются за текущий run.

### КТ3 — достигнута по Gate 4 candidate r1

Candidate acceptance https://github.com/Y2Kill/orbital-economy/actions/runs/37108034775: Gate 4 `validation` завершён `success` на candidate-коммите `e3102703f8872e0ac49a9eddb829541dbd0a0a1b`.

Это подтверждает прохождение delivered `candidate/validation.json` на полном наборе Modes, включая Modes 46–47. Таблица «проверка → значение → порог → запас», итог 48/48 и точные значения приоритетной доли / отсутствия топливного коллапса будут внесены по завершённому validation log, а не по owner-skeleton.

Gate 5 `policy` на момент записи выполняется, поэтому КТ2 ещё не закрыта. КТ4 также не закрыта.


### Детализация КТ1 по завершённому artifact

Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/37108034775, artifact `candidate-37108034775` (ID `11269186412`).

Фактические строки `audit.log`:
- open boundaries: **224** из 279 flows; unclassified = 0; closed-world violations = 0;
- Planet closure: **P3 = 14/2/1/0**; P2 = 11/6/0/0; P4 = 6/0;
- algebraic loops: switches = 15; combinations = **32768**; with loops = **0**; Modes = none.

Таким образом КТ1 закрыта полностью: apply-patch, conformance и audit — PASS; требуемые структурные счётчики совпали со спецификацией.

### КТ2 — policy/regression закрыта

Доказательство: тот же Candidate acceptance https://github.com/Y2Kill/orbital-economy/actions/runs/37108034775, Gate 5 `policy` = PASS.

Фактические результаты:
- Modes **0–45**: все **46** сравнений имеют `common=1448, changed=0, added=71, removed=0, maxAbs=0`, result = `IDENTICAL`;
- policy: observed = **3632**, expected/allowed = **3632**, unexpected = **0**, forbidden = **0**, threshold exceed = **0**, required missing = **0**, hard blockers = **0**;
- итог сравнения: `OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED` — ожидаемое изменение сценарного контракта за счёт нового switch и Modes 46–47.

Отрицательных результатов или неожиданных событий в Modes 0–45 нет.

### Детализация КТ3 — Modes 46–47

Gate 4 `validation` = PASS; фактически выбрано **48** сценариев, все **48 PASS**; `OVERALL: PASS`. Delivered validation SHA-256: `03a732ce96cf39a17064233c463a873505c3c510892ac216cae3d42a8ae8529b`, то есть owner draft SHA подтверждён первым candidate-run и policy менять не потребовалось.

| Проверка | Значение | Порог | Запас |
|---|---:|---:|---:|
| M46 A priority fulfillment min | 1.000000 | ≥ 0.999 | +0.001000 |
| M46 B priority fulfillment min | 1.000000 | ≥ 0.999 | +0.001000 |
| M46 A Total Requested Energy mean | 1619.389367 | > 1560 | +59.389367 |
| M46 B Total Requested Energy mean | 502.714488 | > 460 | +42.714488 |
| M46 A Energy Fulfillment Ratio mean | 0.919322 | < 0.935 | 0.015678 ниже потолка |
| M46 A Power Resource Extraction Requested Energy min | 67.742557 | > 50 | +17.742557 |
| M46 A Mining Requested Energy mean | 55.620436 | > 40 | +15.620436 |
| M46 A Capital Goods Requested Energy max | 82.431966 | > 40 | +42.431966 |
| M46 A Regolith Extraction Requested Energy max | 77.646080 | > 40 | +37.646080 |
| M46 B Energy Fulfillment Ratio min [360,1080] | 1.000000 | ≥ 0.95 | +0.050000 |
| M46 B Power Resource Inventory min | 1843.208985 | > 1000 | +843.208985 |
| M47 A priority fulfillment min | 1.000000 | ≥ 0.999 | +0.001000 |
| M47 B priority fulfillment min | 1.000000 | ≥ 0.999 | +0.001000 |
| M47 B Energy Fulfillment Ratio min [360,720], дефицит | 0.690727 | < 0.9 | 0.209273 ниже потолка |
| M47 B Energy Fulfillment Ratio min [360,720], без коллапса | 0.690727 | > 0.5 | +0.190727 |
| M47 A Energy Fulfillment Ratio min [360,720] | 0.808237 | > 0.7 | +0.108237 |
| M47 B Capital Goods Requested Energy max [360,720] | 54.036011 | > 20 | +34.036011 |
| M47 B Regolith Extraction Requested Energy max [360,720] | 37.305740 | > 15 | +22.305740 |
| M47 B Power Resource Inventory min | 1587.229049 | > 1000 | +587.229049 |

Приоритетная доля ровно 1 у A и B в обоих новых Modes. У B топливного коллапса нет: минимальный fulfillment в surge = 0.690727, минимальный Power Resource Inventory = 1587.229049.

### КТ4 — поставка полная

Candidate acceptance https://github.com/Y2Kill/orbital-economy/actions/runs/37108034775 завершён `success`: **5/5 PASS**:
- apply-patch PASS (0 s);
- conformance PASS (0 s);
- audit PASS (1 s);
- validation PASS (453 s);
- policy PASS (911 s).

Candidate SHA-256: `5964a0c3ef3f29c071a016d8cc75a74bc8a57d7bf4897682147af2f00ff8a335`.
Validation SHA-256: `03a732ce96cf39a17064233c463a873505c3c510892ac216cae3d42a8ae8529b`.

CI https://github.com/Y2Kill/orbital-economy/actions/runs/37108057223 завершён `success` после первой journal-записи; candidate-файлы после candidate-run не менялись. Последующие изменения ветки — только дополнение `REPORT_RU.md` доказательствами контрольных точек. После этой записи ожидается очередной CI на финальной голове; его результат проверяется отдельным шагом без изменения candidate.
