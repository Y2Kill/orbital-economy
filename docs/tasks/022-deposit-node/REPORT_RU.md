# Отчёт по заданию 022 — deposit node

## Журнал

### КТ1 — 2026-09-30 — deposit + retarget_flows
Сделано: добавлен генератор узла `deposit` со строгой декларацией; патч получил `retarget_flows` с проверками конфликтов и применением после `add_elements`; фикстура перенесена в `lab/fixtures/nodes/deposits.json`; в `node_qa` добавлены случаи 22, 26 и 27, включая отпечаток `7d8fe41cc6df5c1a` и ожидаемые числа 100/8/6/212.

Доказательство: статическое сопоставление формул с `reference/deposit_prototype.mjs`; локальные `check_branch` и стенд по §9.4 не запускались. После push ожидается CI `ci.yml` для головы КТ1; идентификатор запуска будет дописан отдельной записью после появления Actions.

Не подтвердилось: исполнение тестов в этой среде не проверялось; первый фактический прогон — CI/ревьюер.

Дальше: отдельно проверить результат CI КТ1, затем реализовать КТ2 (validation plugin `deposit`, merge-фрагменты, случаи 23–25).

## Не запускалось

- `node tools/check_branch.mjs ...` — не запускался согласно §9.4 и прямому указанию задания.
- локальный стенд / `node-qa` / `bench-selftests` — не запускались; среда исполнителя работает только через API-коннектор.
- `tools/build_sums.mjs` — не запускался; `scope.json` содержит `"sums_by": "reviewer"`.
- полный `bench-full` — не запускался; его запускает/оценивает ревьюер при необходимости.

## Журнал — продолжение

### КТ2 — 2026-09-30 — validation deposit и самотесты 23–25
Сделано: добавлен статический plugin `deposit` (типы ролей, топология extraction/exploration, STOCK-сигнал и зависимость цели, зависимости расходов), runtime-проверки неотрицательности и тождества расхода, merge-фрагменты для `deposit`, `exploration_expenditure`, `information_signal` и Planet P4; добавлены случаи 23–25, включая идемпотентное слияние, loops=0/P4 +6/0 unclassified, trial Mode и снятие/восстановление слоя с возвратом extraction flow в ∅.

Доказательство: код и тестовые условия сопоставлены с заданием и прототипом. Локальные стенд и `bench-selftests` не запускались. После push ожидается CI `ci.yml` головы КТ2; требование «`bench-selftests` зелёный целиком» в этой среде может быть подтверждено только Actions/ревьюером.

CI КТ1: при отдельной проверке сразу после push для `b4c439a6ee009b687280287ddcc5c36fa2c742b2` GitHub ещё не возвращал ни workflow run, ни commit status; это не засчитано как PASS.

Не подтвердилось: фактические runtime-числа и полный набор self-tests до CI не подтверждены.

Дальше: отдельно проверить CI КТ2; затем КТ3 — версия 0.9.12 и документация.

### КТ3 — 2026-09-30 — документация и Lab v0.9.12
Сделано: версия Lab поднята до 0.9.12 в package/package-lock/CLI; обновлены `NODES_RU.md`, `MODEL_PATCH_RU.md`, `VALIDATION_FORMAT_RU.md`, `HARNESS_QA_RU.md`, `TEST_STATUS_RU.md`, `README_RU.md`, `CHANGELOG.md`. Документированы deposit, `retarget_flows`, validation/runtime contract и cases 22–27.

CI: run КТ1 `36762213852` завершён как `cancelled` после публикации более новой головы КТ2; это отмена superseded-run, не PASS/FAIL реализации. Для КТ2 `8e991bcd3bea22b1d7dd0651c9a98cc0e3565620` ожидается run `36763097194`; на момент этой записи он `in_progress`. После push КТ3 будет отдельно проверен новый финальный run.

Не подтвердилось: финальный зелёный CI на момент записи КТ3 ещё отсутствует.

Дальше: проверить Actions финальной головы отдельным шагом; при FAIL разобрать конкретный job и исправить в той же ветке с новой записью журнала.

## Архитектура реализации

- `lab/src/nodes/deposit.js` — строгая декларация `deposit`, генерация 100/8/6/212 для эталонной fixture, последовательное оборачивание общих demand-formulas и generated validation fragment.
- `lab/src/patch.js` — новая секция `retarget_flows`; endpoints применяются после `add_elements`, до formula replacements, валидируются как FLOW → STOCK/null и участвуют в node/explicit conflict detection.
- `lab/src/deposit.js` + `lifecycle_conformance.js` — статический HARD conformance deposit; `checks.js` — runtime non-negative и backing-consumption identity.
- `mergeNodeValidation` — идемпотентное добавление plugin `deposit`, `exploration_expenditure`, patterns существующей `information_signal` и `planet_closure.process.deposit`.
- Comparator уже считает изменение `from/to` частью semantic definition; case 27 проверяет, что retarget существующего FLOW виден как `definition_changed`.

## Отличия / замечания к заданию

Фраза про `parameters` допускает двоякое чтение: «ровно четыре перечисленных, плюс `<good> per Discovery`». В reference fixture и прототипе для одного backing присутствуют три общих параметра (`Target Reserve Life`, `Exploration Time`, `Depletion Buffer Days`) плюс один `Capital Goods per Discovery`. Реализация трактует контракт как **три общих параметра + ровно по одному `<good> per Discovery` на каждый backing**. Это единственное чтение, согласованное одновременно с выданной fixture, reference-прототипом и требованием поддержать произвольный список backing.

Endpoint extraction FLOW намеренно не switch-gated: при выключенном `Deposits Enabled` старая rate-formula сохраняется дословно, но физический источник остаётся Proven Reserves, как прямо требует TASK_RU.

## Ограничения и не запускавшиеся проверки

Перечень из начальной секции «Не запускалось» остаётся в силе: локальные `check_branch`, `NODE_SELF_TEST`/`bench-selftests`, стенд и `bench-full` исполнителем не запускались. `SHA256SUMS` не пересобирался, потому что `scope.json` задаёт `"sums_by": "reviewer"`. Единственное исполняемое доказательство от исполнителя — GitHub Actions, результат финальной головы фиксируется отдельной записью после push.

### КТ3 — корректировка по CI run 36763668863
Финальный run головы `2b9e740c3ff7bc2796ad966378e8e546c2998183`: guard/tools/QA/Structure/Loop/Planet/Conformance/Policy/Compare — SUCCESS; `Node self-test` — FAIL, итог 25/27. Cases 22, 25, 26, 27 PASS; case 23 остановился на `validation fragment[0]: planet process "mining" deposit differs`, case 24 вследствие этого не запускал свою интеграцию.

Причина: accepted `planet_closure` уже содержит для `mining`, `regolith`, `power_resource` явный P4-placeholder `deposit: {"kind":"none"}`. Generated fragment должен заменять именно этот объявленный долг на `kind:"stock"`; прежняя реализация трактовала любой non-null deposit как содержательную конфликтующую декларацию.

Исправление: merge разрешает replacement только если deposit отсутствует либо `kind === "none"`; уже существующий содержательный deposit по-прежнему обязан совпадать byte-semantically, иначе HARD conflict. После push ожидается новый CI run головы корректирующего коммита; результат проверяется отдельно.
