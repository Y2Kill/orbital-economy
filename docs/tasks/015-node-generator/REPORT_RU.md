# Отчст по заданию 015 — генератор узлов

## Журнал

### КТ1 — 2026-09-27 — генератор `capital_lifecycle` и воспроизведение двух деклараций
Сделано: реализован `lab/src/nodes/capital_lifecycle.js` по формулам эталонного прототипа; добавлен первый случай `lab/src/node_qa.js`, который из текущей accepted-модели в обратном порядке вырезает два сгенерированных узла и собирает каждый заново. Сравниваются определения без `description`, замены, точный набор новых LINK и фрагменты принятой validation без `policy_notes`.
Доказательство: код и журнал отправлены в ветку; CI `bench-selftests` с новым шагом `Node self-test` ожидается после этого push. Ожидаемые диагностические числа из задания: Construction Materials Plant 69/6/126, Capital Goods Plant 76/6/138; тест не фиксирует их как version-dependent константы.
Не подтвердилось: пока ничего; локально стенд и самотесты не запускались по условиям задания.
Дальше: отдельным шагом проверить CI этой головы; после зелёного КТ1 перейти к строгой схеме декларации и секции `nodes` в `APPLY_PATCH`.
Ожидаемый запуск после push КТ1: CI run 36343421041 (голова `c2c2a2930f3475d3f4dc292b666664e308fd710d`); результат будет проверен отдельным шагом.
Результат КТ1: первый run 36343421041 был отменён journal-push из-за `concurrency.cancel-in-progress`; доказательство — следующий run [36343437733](https://github.com/Y2Kill/orbital-economy/actions/runs/36343437733) на голове `78aede2bc764ff950a2f8ed3df392c33761c58e1`: `bench-selftests` SUCCESS. В логе Node self-test: Construction Materials Plant — 69 элементов / 6 замен / 126 связей / validation=equal; Capital Goods Plant — 76 / 6 / 138 / validation=equal; `NODE SELF-TEST: 1 passed, 0 failed`.

## Что не запускалось

Локально не запускались `check_branch`, стенд, самотесты и Node-команды. В этой среде работа ведётся только через GitHub API; проверки выполняются GitHub Actions согласно §9.4. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не пересобирались (`sums_by: reviewer`).
