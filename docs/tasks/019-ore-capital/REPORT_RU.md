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

### Ожидаемые прогоны после candidate r1

Для candidate-коммита `d1a7b82df33d7eec835b25f53444ff5d476a508e` зафиксированы:
- Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36577097529 — ожидаются apply-patch, conformance, audit, validation и policy;
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36577097498 — ожидаются guard и самотесты на Linux.

На момент записи Candidate acceptance был `queued`, CI — `in_progress`. Результаты проверяются отдельным шагом; один длинный polling/wait не используется.


### КТ1 — закрыта по candidate r1

Доказательство: Candidate acceptance https://github.com/Y2Kill/orbital-economy/actions/runs/36577097529 для candidate-коммита `d1a7b82df33d7eec835b25f53444ff5d476a508e`.

- apply-patch: PASS; candidate SHA-256 `ec7ff050042c0d42495b42fd072b0af1fba25100e8c3d940a1bdf6cb755342e0`;
- `A Ore Mine` и `B Ore Mine`: `CONFORMING (23/23 checks)` каждый; вместе с двумя шахтами реголита simple-capital экземпляров стало 4;
- structure audit: PASS;
- open boundaries: `182`; unclassified=`0`; closed-world violations=`0`;
- transformation pairs: `23`, unpaired=`0`;
- Planet closure: `P2=11/4/2/0` (kernel/simple/exceptions/undeclared);
- algebraic loops: switches=`12`; combinations=`4096`; with loops=`0`; Modes=none.

Узел применён стендом именно из секции `nodes`; ручного разворачивания декларации в `add_elements` нет.

### КТ2 — закрыта: Modes 0–39 воспроизводят принятую v7.7.5

В policy-сравнении для каждого из 40 прежних Modes:
`common=1278, changed=0, added=34, removed=0, maxAbs=0`.

То есть общие series принятой v7.7.5 не изменились; 34 добавленных ряда — новый выключенный по умолчанию ore-capital узел/сигналы. Итог policy:
- `Observed changes: 1521`;
- `Expected/allowed: 1521`;
- `Unexpected: 0`;
- `Forbidden: 0`;
- `Threshold exceed: 0`;
- `Required missing: 0`;
- `Hard blockers: 0`;
- `POLICY RESULT: PASS`.

`COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED` ожидаем: общие legacy series идентичны, сценарный контракт расширен Modes 40–41 и новым switch input.

### КТ3 — закрыта: validation 42 Modes PASS

Gate 4 того же Candidate acceptance завершён `OVERALL: PASS` на 42 сценариях. Validation SHA-256:
`f7f054d268baafd490f14a7b444232ea754e7edba1dc159ae8e31da987fce91b`.

Owner-пороги из `draft/validation-v7.7.6-draft.json` прошли без перекалибровки:
- Mode 40: A Ore Mine Capacity растёт выше 73 — PASS;
- Mode 40: B Ore Mine Capacity уменьшается более чем на 10 к дню 1080 — PASS;
- Mode 40: B Ore Mine Expansion после начального сигнального транзиента остаётся ≤1e-6 — PASS;
- Mode 41: B Ore Mine Expansion в окне 360–720 >0.02 — PASS;
- Mode 41: B Ore Mine Capacity растёт в окне 360–720 более чем на 5 — PASS;
- Mode 41: B Ore Mine Capital Goods Consumption >0 — PASS;
- Mode 41: B Mining Rate в окне 360–720 >18 — PASS;
- Mode 41: B Ore Inventory в окне 360–720 падает ниже 2450 — PASS;
- до окна surge B Ore Mine Expansion отсутствует по порогу 1e-6 — PASS.

Пороговые значения не подгонялись агентом по этому прогону: они уже были в owner-validation, который в задании указан как проверенный skeleton; доставка сохранила его побайтно.

Замечание по формально странному, но намеренно сохранённому месту: внутреннее поле `name` в `candidate/validation.json` всё ещё содержит слова `validation draft (owner skeleton)`. Оно не переименовывалось, потому что задача требует использовать проверенный owner draft, policy уже была привязана к его SHA-256, а косметическое изменение имени сломало бы эту побайтовую привязку без изменения смысла проверок.

### КТ4 — закрыта: поставка полная, candidate 5/5 PASS, CI зелёный

Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36577097529 — success.

Все пять гейтов PASS:
- apply-patch;
- conformance;
- audit;
- validation;
- policy.

Финальные идентификаторы:
- Candidate SHA-256: `ec7ff050042c0d42495b42fd072b0af1fba25100e8c3d940a1bdf6cb755342e0`;
- Validation SHA-256: `f7f054d268baafd490f14a7b444232ea754e7edba1dc159ae8e31da987fce91b`, совпадает с `change-policy.json`;
- model: 3895 elements, 42 scenarios.

Первый CI `36577097498` был вытеснен concurrency после report-only push. Заменивший его CI:
https://github.com/Y2Kill/orbital-economy/actions/runs/36577139035 — `success`.
В нём `guard`, `tools-selftest` и `bench-selftests` PASS; `integrity` штатно skipped при `sums_by: reviewer`.

На момент закрытия КТ:
- `main` остаётся на `62bf12187fa96540553e2f633905c18b1e9f1fe3`;
- ветка fast-forward от этого `main`, behind=0;
- изменены только 5 путей из разрешённого scope;
- `SHA256SUMS` не изменялись;
- локальные `check_branch`, стенд и канонический Windows acceptance агентом не запускались.
