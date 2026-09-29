# Отчёт задания 019 — v7.7.6: добыча руды на простом капитале

Исполнитель: GPT-5.6 Sol (API-коннектор GitHub).
База работы: `main` @ `62bf12187fa96540553e2f633905c18b1e9f1fe3`.
Ветка: `task/019-ore-capital`.

## Поставка

Подготовлены обязательные артефакты в `candidate/`:
- `model-patch.json` — декларация `simple_capital` из `draft/ore-mine.json` без изменений; вручную добавлены только проводка `Test 2 Transport Surge Active` для Mode 41 и сценарии 0–41 по спецификации;
- `validation.json` — `draft/validation-v7.7.6-draft.json` байт-в-байт, чтобы сохранить owner-проверки и уже откалиброванные пороги;
- `change-policy.json` — owner draft-policy с неизменными rules, финализированы только name/description; `validation_sha256` оставлен `f7f054d268baafd490f14a7b444232ea754e7edba1dc159ae8e31da987fce91b` и должен быть подтверждён `candidate.yml`;
- `PARAMETER_ANNOTATIONS_fragment.json` — аннотации всех числовых констант узла, включая несимметричную пару A/B = 70/28 и общий начальный сигнал 25.

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

### Рабочая запись — 2026-09-29 — первая поставка перед КТ1

Сделано: собрана первая поставка r1 из owner-декларации и owner-validation, без расширения scope.
Проверено чтением: декларация `ore-mine` используется как `nodes[0]` без изменений; `replace_formulas` содержит только `Test 2 Transport Surge Active`; Modes 0–39 получают только `Ore Capital Enabled = 0`; Modes 40–41 включают узел.
Не запускалось: локальный guard и стенд, как перечислено выше.
Дальше: после push зафиксировать конкретные запуски `candidate.yml` и `ci.yml`, затем проверить их отдельным шагом и закрывать КТ по фактическим логам.
