# Отчст по заданию 015 — генератор узлов

## Журнал

### КТ1 — 2026-09-27 — генератор `capital_lifecycle` и воспроизведение двух деклараций
Сделано: реализован `lab/src/nodes/capital_lifecycle.js` по формулам эталонного прототипа; добавлен первый случай `lab/src/node_qa.js`, который из текущей accepted-модели в обратном порядке вырезает два сгенерированных узла и собирает каждый заново. Сравниваются определения без `description`, замены, точный набор новых LINK и фрагменты принятой validation без `policy_notes`.
Доказательство: код и журнал отправлены в ветку; CI `bench-selftests` с новым шагом `Node self-test` ожидается после этого push. Ожидаемые диагностические числа из задания: Construction Materials Plant 69/6/126, Capital Goods Plant 76/6/138; тест не фиксирует их как version-dependent константы.
Не подтвердилось: пока ничего; локально стенд и самотесты не запускались по условиям задания.
Дальше: отдельным шагом проверить CI этой головы; после зелёного КТ1 перейти к строгой схеме декларации и секции `nodes` в `APPLY_PATCH`.
Ожидаемый запуск после push КТ1: CI run 36343421041 (голова `c2c2a2930f3475d3f4dc292b666664e308fd710d`); результат будет проверен отдельным шагом.
Результат КТ1: первый run 36343421041 был отменён journal-push из-за `concurrency.cancel-in-progress`; доказательство — следующий run [36343437733](https://github.com/Y2Kill/orbital-economy/actions/runs/36343437733) на голове `78aede2bc764ff950a2f8ed3df392c33761c58e1`: `bench-selftests` SUCCESS. В логе Node self-test: Construction Materials Plant — 69 элементов / 6 замен / 126 связей / validation=equal; Capital Goods Plant — 76 / 6 / 138 / validation=equal; `NODE SELF-TEST: 1 passed, 0 failed`.

### КТ2 — 2026-09-27 — строгая декларация и секция `nodes` в `APPLY_PATCH`
Сделано: добавлен реестр `lab/src/nodes/index.js` с проверкой неизвестных/обязательных полей и путями ошибок; `applyPatch` принимает `nodes`, последовательно раскрывает их против рабочей модели от базы патча и запрещает пересечение с явными `add_elements` / `replace_formulas`. В `node_qa.js` добавлены случаи 2–8: эквивалентность nodes/expanded, неизвестное поле, неизвестный тип, отсутствующая подменяемая ссылка, конфликт node/explicit, отсутствующая ссылка декларации, детерминированность.
Доказательство: код и запись КТ2 отправляются этим push; ожидается отдельный CI run новой головы, после чего будут проверены `Node self-test` и весь `bench-selftests`.
Ожидаемый запуск после push КТ2: CI run 36343947368 (голова `d511e48bf56e3e8a2d9a126d75c1dde6f749c0b7`); результат проверяется отдельным шагом.
Результат КТ2: run 36343947368 был отменён journal-push по concurrency; доказательство — [CI run 36343958755](https://github.com/Y2Kill/orbital-economy/actions/runs/36343958755) на голове `4f2a335e9cd6bc2ef12ae4ef87551406165e74e7`: `bench-selftests` SUCCESS. Случаи 2–8 — PASS; детерминированность: 52585 JSON bytes stable; итог `NODE SELF-TEST: 8 passed, 0 failed`. Случай 1 сохранил 69/6/126 и 76/6/138.
Не запускалось локально: Node-команды, стенд и самотесты.
Дальше: после зелёного КТ2 — CLI `expand-nodes`, merge validation и случай 9.

### КТ3 — 2026-09-27 — CLI `expand-nodes`, merge validation и полный node self-test
Сделано: добавлен `expand-nodes <node-or-patch.json> <base-model.json> [--out=DIR] [--validation=file]`; он пишет `patch.expanded.json`, `validation.fragments.json`, а с `--validation` — `validation.merged.json`. Повторно присутствующие kernel instances сравниваются без `policy_notes`; пары и capacity процесса обязаны совпадать. Если merge не меняет validation семантически, исходный файл копируется побайтно. Добавлен случай 9, который запускает CLI в CI и сравнивает Buffer принятой и merged validation. Lab поднят до 0.9.8; добавлены npm script `node-qa` и `NODE_SELF_TEST.cmd`.
Байтовые ограничения: `lab/package.json` сохранён CRLF без завершающего перевода строки; новые файлы — LF. `SHA256SUMS` не трогались.
Доказательство: реализация и запись КТ3 отправляются этим push; ожидается отдельный CI run текущей головы с `NODE SELF-TEST: 9 passed, 0 failed` и зелёным `bench-selftests`.
Не запускалось локально: CLI, Node-команды, стенд и self-tests.
Дальше: после зелёного КТ3 — документация/финальный аудит и КТ4.

## Что не запускалось

Локально не запускались `check_branch`, стенд, самотесты и Node-команды. В этой среде работа ведётся только через GitHub API; проверки выполняются GitHub Actions согласно §9.4. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не пересобирались (`sums_by: reviewer`).
