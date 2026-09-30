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
