# Отчёт по задаче 018 — строгая схема validation

## Журнал

### КТ1 — строгая схема и S1–S7

- Выполнено: добавлен `lab/src/validation_schema.js` с чистой функцией `checkValidationSchema(validation, { modes })`; добавлена фикстура 014 r2 в `lab/fixtures/validation/`; в `lab/src/qa.js` добавлены случаи S1–S7.
- Фикстура 014 r2: ожидаются 15 schema errors, затрагивающие ровно `checks[3..8]`; для `from_day`/`to_day` и плоского `event_absent` проверяются требуемые подсказки.
- Проверено чтением принятой validation/model: принятая validation содержит 40 сценарных Modes (0–39), и все её текущие типы/поля укладываются в нормативную схему.
- Не запускалось по условиям задания: `tools/check_branch.mjs`, стенд, локальный `qa.js` и любые локальные самотесты. Доказательство выполнения КТ будет дополнено результатом CI после push.
- Дальше: проверить CI отдельным шагом; затем КТ2 — встраивание в test/lab/compare/policy и CLI, S8–S10.

## 2. Устройство модуля схемы и места встраивания

`validation_schema.js` не запускает модель и не читает файлы. Он проверяет верхний уровень, сценарии, проверки, события, identity terms и верхний уровень плагинов; возвращает `{ status, errors: [{ path, message }] }`. Правило существования Mode применяется только при переданном `modes`.

`runner.js` вычисляет Modes модели и запускает схему до lifecycle/structure readers; при ошибке они помечаются SKIPPED, а simulation не запускается. `compare_models.js` проверяет схему относительно кандидата до numeric comparison; policy получает HARD blocker через `NOT_COMPARED`. CLI использует тот же чистый валидатор.

## 3. Ограничения и замечания к заданию

- Содержимое спецификаций плагинов глубже их верхнего уровня намеренно не проверяется: это оставлено существующим специализированным валидаторам, как требует задание.
- `regression_modes` и `regression_tolerance` пока только допускаются схемой; их описательный статус будет явно зафиксирован в документации на КТ3.
- Прототип ненормативен. Реализация сохраняет его ключевую совместимость (в частности, 15 ошибок на фикстуре 014 r2), но дополнительно проверяет очевидные типы полей, форму terms/events и `non_negative_regex`, не меняя runtime-семантику проверок.
- Неясностей, требующих выхода за scope или изменения модели/validation/policy, на КТ1 не обнаружено.

## Что не запускалось

По §9.4 и прямому указанию задачи исполнитель не запускал локально `check_branch`, стенд, `RUN_TESTS`, `RUN_LAB`, compare/policy или QA. Проверка заменяется CI GitHub Actions и чтением кода/данных; результаты CI фиксируются в журнале отдельными шагами.


### КТ2 — интеграция HARD-gate, CLI и S8–S10

- Выполнено: схема встроена в `test`/`lab` до специализированных readers и до симуляции; в `compare`/`policy` ошибка схемы даёт `NOT_COMPARED`, а правило существования Mode сверяется с кандидатом.
- Отчёты JSON/Markdown содержат отдельный `validationSchema` со списком `{path, message}`.
- Добавлены `check-validation <validation.json> [model.json]`, wrapper `CHECK_VALIDATION.cmd`, S8–S10 и версия стенда 0.9.10.
- S8 проверяет FAIL с пустым списком сценариев; S9 — `FAILED/NOT_COMPARED` с пустым списком сценариев; S10 — exit 1 на дефектной фикстуре и exit 0 на принятой validation.
- Локально не запускались `check_branch`, стенд и QA, как предписано заданием и §9.4.
- После этого push ожидается CI для головы ветки; результат проверяется отдельным шагом.
- Дальше: исправить возможные замечания CI, затем КТ3 — документация и финальная зелёная голова.


### КТ3 — документация и зелёная кандидатная голова

- Документация v0.9.10 обновлена: `VALIDATION_FORMAT_RU.md` содержит строгую схему/таблицы, правило существования Mode, описательный статус `regression_modes` / `regression_tolerance` и CLI; обновлены `HARNESS_QA_RU.md`, `TEST_STATUS_RU.md`, `README_RU.md`, `CHANGELOG.md`.
- Первый полный содержательный прогон документационной головы, CI run **36480791977**, выявил один дефект нового S8: schema gate корректно останавливал run, но synthetic `SKIPPED` conformance-result не содержал прежнюю форму `simpleCapital`, из-за чего Markdown reporter бросал исключение. Guard был PASS; QA: 41 PASS / 1 FAIL. Исправлено без ослабления схемы: SKIPPED-result сохраняет ожидаемую форму отчёта.
- После исправления commit `9f1a4914bb3a274fd42b180d3798f7905fe6f45e`: CI run **36480886573** — **SUCCESS**.
  - `guard`: SUCCESS;
  - `tools-selftest`: SUCCESS;
  - `bench-selftests`: SUCCESS;
  - QA: **42 passed, 0 failed**;
  - Structure: **21 passed, 0 failed**;
  - Loop: **15 passed, 0 failed**;
  - Planet: **16 passed, 0 failed**;
  - Conformance: **18 passed, 0 failed**;
  - Policy: **10 passed, 0 failed**;
  - Compare: **PASS**;
  - Node: **15 passed, 0 failed**;
  - bench Modes 0,12: **OVERALL: PASS**.
- Более ранние runs КТ1/КТ2 были отменены механизмом concurrency при последующих push, а не завершились тестовым FAIL; содержательная проверка всей накопленной ветки выполнена run 36480886573.
- Проверка байтов через GitHub contents подтвердила: `lab/package.json` сохранил CRLF и отсутствие завершающего newline; `package-lock.json` остался LF; новые файлы — LF.
- `SHA256SUMS` не пересобирались: `scope.json` задаёт `"sums_by": "reviewer"`.
- Локально не запускались `tools/check_branch.mjs`, стенд, QA или иные self-tests; результаты выше получены только GitHub Actions согласно §9.4 и прямому указанию задачи.
- После этого journal-only push ожидается отдельный CI финальной головы; его результат проверяется отдельным шагом.


## 4. Прототип и отличия реализации

Прототип из `reference/schema_prototype.mjs` использован как ориентир, но не как нормативный код. Реализация сохраняет требуемую наблюдаемую совместимость с фикстурой 014 r2 — **15 schema errors ровно в checks[3..8]** — и дополнительно централизует типовые проверки чисел, event/term shapes, top-level types и Mode existence. Семантика runtime checks/plugins не изменялась.

Schema gate расположен до specialized validation readers в runner и до static/numeric candidate comparison в comparator. В policy отдельного обхода нет: schema FAIL становится candidate static HARD blocker, поэтому policy result остаётся FAIL независимо от allow-rules.
