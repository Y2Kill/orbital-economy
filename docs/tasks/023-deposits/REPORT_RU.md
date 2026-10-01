# Отчёт задания 023 — v7.7.8: месторождения, разведанные запасы и разведка

Исполнитель: GPT-5.6 Sol (API-коннектор GitHub).
База работы: `main` @ `e622357c28badc0bb102981f7ba1ada1cd35df25`.
Ветка: `task/023-deposits`.

## Поставка

Подготовлена первая поставка r1 в `candidate/`:
- `model-patch.json` — декларация `deposit` из `draft/deposits.json` без изменения полей и значений; `add_elements` пуст; вручную добавлена только проводка `Test 2 Transport Surge Active` для Mode 45; Modes 0–43 получают `Deposits Enabled = 0`, Modes 44–45 включают слой;
- `validation.json` — owner `draft/validation-v7.7.8-draft.json` тем же git blob, без изменения байтов; пороги skeleton не перекалибровывались до первого candidate-run;
- `change-policy.json` — owner draft-policy с неизменными rules; финализированы только `name` и `description`; `validation_sha256 = bda42a20d8dd545a4befd2e5d02516315a9e47ccee0c5305ece7c838c17bdac3` оставлен из проверенного owner draft и должен быть подтверждён `candidate.yml`;
- `PARAMETER_ANNOTATIONS_fragment.json` — аннотации числовых констант узла, включая начальные undiscovered/proven A/B и стартовые extraction signals.

## Отличия

От архитектурной спецификации и декларации `draft/deposits.json` содержательных отклонений нет. Validation не редактировалась; rules change-policy не расширялись и не ослаблялись.

Есть две неточности исходных материалов, оставленные без скрытой подмены:
1. `TASK_RU.md` §2 называет стартовые сигналы A/B несимметричными парами, однако `V7_7_8_ARCHITECTURE_SPEC.md` §1 и `draft/deposits.json` задают для Regolith `0 / 0`. В поставке сохранены нормативные значения `0/0`; обе стороны пары аннотированы.
2. В owner `draft/change-policy-v7.7.8-draft.json`, rule `add-deposits`, поле `note` содержит остаточный текст про «capacity stocks, roles, CG and CM consumption». Реальный deposit-узел не создаёт capacity stocks и Construction Materials consumption; сами event/name patterns правила соответствуют deposit-механике. Чтобы не менять проверенный owner contract без необходимости, enforcement-правило и его note оставлены как в draft; неточность зафиксирована здесь.

## Что локально не запускалось

Согласно §9.4 и выдаче задачи агентом не запускались:
- `tools/check_branch.mjs`;
- локальные `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT`, `RUN_LAB`, `CHECK_CANDIDATE`;
- канонический Windows-стенд и `bench-full`;
- `tools/build_sums.mjs` и пересборка `SHA256SUMS` (в `scope.json`: `"sums_by": "reviewer"`).

Замена локальной проверки: GitHub Actions `candidate.yml` и `ci.yml`; их фактические результаты фиксируются в журнале отдельными шагами. Непроверенное локально не считается подтверждённым.

## Журнал

### Рабочая запись — 2026-10-01 — первая поставка перед КТ1

Сделано: собрана candidate r1 строго в пределах задания; ветка создана от текущего `main` `e622357c28badc0bb102981f7ba1ada1cd35df25`.
Проверено чтением кода и спецификации: `deposit` раскрывает 100 add / 8 unique replace / 6 retarget / 212 LINK; explicit `replace_formulas` поставки содержит только `Test 2 Transport Surge Active`; `retarget_flows` вручную не добавлялись, их создаёт node-expansion.
Не запускалось: локальный guard и стенд, перечисленные выше.
Дальше: после push зафиксировать конкретные запуски `candidate.yml` и `ci.yml`, затем отдельным шагом прочитать их результат и закрывать КТ только по фактическим логам.
