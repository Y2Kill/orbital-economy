# Отчёт исполнителя — задача 004, раунд 1

## 1. Что сделано

Выполнены пункты 2.2–2.4 редакции 2 задания.

### 2.2 — установка из vendor без сети

Выбран способ A: `package.json` и `package-lock.json` сохраняют исходные registry metadata и integrity, а `INSTALL.cmd`:

1. создаёт отдельный временный npm-кэш в `%TEMP%`;
2. добавляет в него только `vendor\simulation-9.0.0.tgz` и `vendor\csv-parse-5.6.0.tgz`;
3. выполняет `npm ci --offline --cache <временный-кэш>`;
4. удаляет временный кэш.

Причина выбора: этот вариант не требует менять `resolved` в lock и не переводит зависимости на `file:`-семантику; lock остаётся источником версии и integrity, а vendor tarball'ы — источником байтов. Пользовательский npm-кэш не используется.

`lab/vendor/` не изменялся. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не пересобирались согласно `sums_by: reviewer`.

### 2.3 — обеспеченный engine pin

Добавлен общий модуль `lab/src/engine.js`.

Он содержит единственную ожидаемую версию `EXPECTED_ENGINE_VERSION = '9.0.0'`, читает фактическую версию из `lab/node_modules/simulation/package.json` и прекращает запуск с диагностикой, если версия отличается или metadata нельзя прочитать. Экспортируемый `ENGINE_VERSION` — фактически прочитанная версия; её используют runtime-отчёты.

Прямые импорты `simulation` в `runner.js`, `compare_models.js`, `model.js`, `qa.js` и `conformance_qa.js` переведены через общий модуль. `policy_qa.js` также использует фактический `ENGINE_VERSION` вместо литерала.

Поскольку `cli.js` статически импортирует engine-backed модули, проверка выполняется до командных путей `RUN_LAB` / `RUN_TESTS`, `COMPARE_MODELS`, `CHECK_CANDIDATE`, `APPLY_PATCH` и прочих CLI-команд. Самотесты, которые загружают движок напрямую или через comparator, проходят через тот же модуль; `POLICY_SELF_TEST` явно импортирует его для engine metadata.

В `QA_SELF_TEST` добавлен negative case: создаётся временный `package.json` с `simulation 9.0.1`, после чего `assertEngineVersion` обязан бросить исключение с ожидаемой и найденной версиями. Рабочий `node_modules` не изменяется. Если pin-check перестанет отвергать неправильную версию, тест возвращает `false`.

### 2.4 — версия и документация

Lab поднят до v0.9.3:
- версия package/lock;
- текущие баннеры `lab/*.cmd`;
- banner в `src/cli.js`;
- текущие заголовки lab docs, где был v0.9.2;
- `CHANGELOG.md`, `README_RU.md`, `QUICK_START_RU.txt`, `ENGINE_PIN.md`, `LICENSE-NOTICE.md`;
- Quick start в корневом `README.md`;
- строка v0.9.3 в `docs/HISTORY_RU.md`.

Исторические упоминания прежних версий не переписывались.

## 2. Что не запускалось

В соответствии с §9.4 и редакцией 2 задания не запускались:

- `node tools/check_branch.mjs ...`;
- `INSTALL.cmd`;
- `SELF_TEST.cmd`;
- `QA_SELF_TEST.cmd`;
- `POLICY_SELF_TEST.cmd`;
- `CONFORMANCE_SELF_TEST.cmd`;
- `STRUCTURE_SELF_TEST.cmd`;
- `COMPARE_SELF_TEST.cmd`;
- `RUN_LAB.cmd`;
- `CHECK_CANDIDATE.cmd`;
- любые A1–A7 acceptance-прогоны.

Вместо запуска выполнены чтение и трассировка путей импорта/запуска, проверка единственности прямых импортов `simulation` в `lab/src`, сохранение общего enforcement point и negative-case логики. Фактический первый guard/bench run остаётся владельцам проекта как раунд 1 приёмки.

## 3. Замечания к заданию

После редакции 2 невыполнимых для API-агента требований не обнаружено.

Осознанное следствие выбранного размещения pin-check: из-за статических импортов `cli.js` проверка версии срабатывает для всех CLI-команд, включая те, которым сам simulation логически мог бы не требоваться. Это строже минимального требования, но соответствует явному требованию покрыть `APPLY_PATCH` и даёт одно место контроля вместо набора обходных путей.

Также `lab/docs/TEST_STATUS_RU.md` не утверждает, что v0.9.3 уже прошёл стенд: сохранён последний подтверждённый статус v0.9.2 и явно указано, что v0.9.3 подтверждается владельцами при приёмке.
