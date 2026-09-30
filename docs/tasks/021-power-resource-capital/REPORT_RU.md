# Отчёт задания 021 — v7.7.7: добыча энергоресурса на простом капитале

Исполнитель: GPT-5.6 Sol (API-коннектор GitHub).
База работы: `main` @ `7c78c61314813b9dd5ac16d99f61d73bebc7f928`.
Ветка: `task/021-power-resource-capital`.

## Поставка

Подготовлены обязательные артефакты в `candidate/`:
- `model-patch.json` — декларация `simple_capital` из `draft/power-resource-mine.json` без изменений; вручную добавлены только проводка `Test 2 Transport Surge Active` для Mode 43 и сценарии 0–43 по спецификации;
- `validation.json` — `draft/validation-v7.7.7-draft.json` байт-в-байт, чтобы сохранить owner-проверки и уже откалиброванные на skeleton пороги;
- `change-policy.json` — owner draft-policy с неизменными rules, финализированы только name/description; `validation_sha256` оставлен `cd4a7f287d0fcea071e0e7228978b841a7da0f35c31144e78303e09fc520da43` и должен быть подтверждён `candidate.yml`;
- `PARAMETER_ANNOTATIONS_fragment.json` — аннотации всех числовых констант узла, включая несимметричные пары A/B мощностей 1750/650 и начальных сигналов 1350/182.656.

## Отличия

От архитектурной спецификации и owner-декларации узла отклонений нет. Validation не редактировалась: это сознательно сохраняет уже проверенный owner-skeleton artifact. В policy правила не расширялись и не ослаблялись; изменены только метаданные DRAFT → final.

## Что локально не запускалось

Согласно §9.4 и выдаче задачи агентом не запускались:
- `tools/check_branch.mjs`;
- локальные `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT`, `RUN_LAB`, `CHECK_CANDIDATE`;
- канонический Windows-стенд и `bench-full`;
- `tools/build_sums.mjs` и пересборка `SHA256SUMS` (в `scope.json`: `"sums_by": "reviewer"`).

Замена локальной проверки: `ci.yml` и `candidate.yml` GitHub Actions, результаты которых фиксируются в журнале отдельными шагами.

## Журнал

### Рабочая запись — 2026-09-30 — первая поставка перед КТ1

Сделано: собрана первая поставка r1 из owner-декларации и owner-validation, без расширения scope.
Проверено чтением: декларация `power-resource-mine` используется как `nodes[0]` без изменений; `replace_formulas` содержит только `Test 2 Transport Surge Active`; Modes 0–41 получают только `Power Resource Capital Enabled = 0`; Modes 42–43 включают узел.
Не запускалось: локальный guard и стенд, как перечислено выше.
Дальше: после push зафиксировать конкретные запуски `candidate.yml` и `ci.yml`, затем проверить их отдельным шагом и закрывать КТ по фактическим логам.


### Ожидаемые прогоны после candidate r1

Для candidate-коммита `fd7e4bdf0a569f722e3579707ca5e98e870cb5e9` зафиксированы:
- Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36689942663 — ожидаются apply-patch, conformance, audit, validation и policy;
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36689942654 — ожидаются guard и самотесты на Linux.

На момент записи Candidate acceptance был `in_progress`, CI — `pending`. Результаты проверяются отдельным шагом; один длинный polling/wait не используется.


### КТ1 — достигнута по candidate r1; детальные счётчики ожидают завершения job

Доказательство: Candidate acceptance https://github.com/Y2Kill/orbital-economy/actions/runs/36689942663 для candidate-коммита `fd7e4bdf0a569f722e3579707ca5e98e870cb5e9`.

На момент этой записи три требуемых структурных gate завершены `success`:
- Gate 1 `apply-patch`;
- Gate 2 `conformance`;
- Gate 3 `audit`.

Следовательно, патч с секцией `nodes` применяется, lifecycle conformance и structure audit приняты текущим `candidate.yml`. Точные строки со счётчиками (`simple_capital`, boundaries, loops, Planet closure) GitHub API до завершения job не отдаёт: download job logs возвращается только после окончания всего job. Их нельзя подменять числами owner-skeleton из спецификации; они будут дописаны отдельной записью после завершения run.

Gate 4 `validation` к этому моменту также уже завершён `success`; Gate 5 `policy` всё ещё выполняется. Workflow имеет штатный `timeout-minutes: 60` и Gate 5 запускает полный `policy ... --modes=all`.


### КТ1 — закрыта полностью по candidate r1

Доказательство: Candidate acceptance https://github.com/Y2Kill/orbital-economy/actions/runs/36689942663 — `success`, candidate-коммит `fd7e4bdf0a569f722e3579707ca5e98e870cb5e9`.

- candidate SHA-256: `8d3ddb4aed6e5e03999cf647b08b74ca74126a41b370d415819dbaf133e02211`;
- `A/B Regolith Mine`, `A/B Ore Mine`, `A/B Power Resource Mine`: все шесть экземпляров `simple_capital` — `CONFORMING (23/23 checks)`;
- `CONFORMANCE RESULT: PASS`;
- `STRUCTURE AUDIT RESULT: PASS`;
- open boundaries: `196`; unclassified=`0`; closed-world violations=`0`;
- transformation pairs: `25`, unpaired=`0`;
- Planet closure: `P2=11/6/0/0`;
- algebraic loops: switches=`13`; combinations=`8192`; with loops=`0`; Modes=`none`.

Тем самым подтверждены именно текущим candidate-run, а не перенесены из owner-skeleton, все счётчики КТ1.

### КТ2 — закрыта: Modes 0–41 без регрессии

В полном policy-сравнении каждый из 42 прежних Modes дал:
`common=1312, changed=0, added=36, removed=0, maxAbs=0`.

36 добавленных рядов — выключенный в legacy Modes новый узел/сигналы; общие series принятой v7.7.6 не изменились.

Итог Gate 5:
- `POLICY RESULT: PASS`;
- observed changes: `1693`;
- expected/allowed: `1693`;
- unexpected: `0`;
- forbidden: `0`;
- threshold exceed: `0`;
- required missing: `0`;
- hard blockers: `0`.

### КТ3 — закрыта: validation 44/44 PASS, B строит шахту заново

Gate 4 того же Candidate acceptance: `OVERALL: PASS` во всех 44 Modes, всего `11 531` сценарная проверка, FAIL = 0.

Validation SHA-256: `cd4a7f287d0fcea071e0e7228978b841a7da0f35c31144e78303e09fc520da43`; он совпадает с `candidate/change-policy.json`.

Owner-пороги из `draft/validation-v7.7.7-draft.json` не менялись и не подгонялись после этого прогона:

| Проверка | Значение | Порог | Запас |
|---|---:|---:|---:|
| Mode 42: A Power Resource Mine Capacity, max | 1889.690667 | > 1850 | +39.690667 |
| Mode 42: B Power Resource Mine Capacity, Δ day 0→1080 | -179.134638 | < -120 | 59.134638 в требуемую сторону |
| Mode 43: B Power Resource Mine Expansion, max [360,720] | 0.519443 | > 0.3 | +0.219443 |
| Mode 43: B Power Resource Mine Capacity, Δ day 360→720 | 76.024538 | > 40 | +36.024538 |
| Mode 43: B Power Resource Mine Capital Goods Consumption, max [360,720] | 0.010389 | > 0 | +0.010389 |
| Mode 43: B Power Resource Inventory, min [360,720] | 1605.656805 | < 1900 | 294.343195 ниже предела |
| Mode 43: expansion до surge, окно [250,359.75] | 0 событий | event > 1e-6 отсутствует | PASS; числовой запас для `event_absent` не определяется |

Главная проверка выполнена: в Mode 43 B заново расширяет шахту энергоресурса (`Expansion max = 0.519443`), а её мощность за окно 360→720 растёт на `76.024538`.

### КТ4 — закрыта: поставка полная

Candidate acceptance https://github.com/Y2Kill/orbital-economy/actions/runs/36689942663 — `success`, все пять gate:
- apply-patch — PASS;
- conformance — PASS;
- audit — PASS;
- validation — PASS;
- policy — PASS.

CI https://github.com/Y2Kill/orbital-economy/actions/runs/36689981294 — `success`: `guard`, `tools-selftest`, `bench-selftests` PASS; `integrity` штатно skipped при `sums_by: reviewer`.

Первый CI `36689942654` был отменён concurrency после report-only push; это не результат проверки кандидата. Следующий CI `36689981294` завершился зелёным.

Финальные идентификаторы поставки:
- candidate SHA-256: `8d3ddb4aed6e5e03999cf647b08b74ca74126a41b370d415819dbaf133e02211`;
- validation SHA-256: `cd4a7f287d0fcea071e0e7228978b841a7da0f35c31144e78303e09fc520da43`.

Локально по-прежнему не запускались `check_branch`, стенд, канонический Windows acceptance, `bench-full`, `build_sums`; `SHA256SUMS` не менялись. Это заменено указанными выше GitHub Actions в пределах §9.4.
