# Отчёт по заданию 025 — точное ускорение algebraic-loop audit

## Журнал

### КТ1 — 2026-10-02 — быстрый точный путь + exhaustive reference
Сделано:
- `lab/src/loop_audit.js`: четыре точных сокращения §2 — candidate SCC nodes, cache решений условий, static formula/component cache, projection по значимым переключателям;
- `auditAlgebraicLoops(raw, { exhaustive: true })` и `algebraicLoopCombinationDetails(raw, { exhaustive: true })` используют изолированную копию прежнего полного алгоритма из `main=258002e`;
- default остаётся синхронным быстрым путём; формат результата и порядок полей не менялись;
- `loops <model.json> --exhaustive` проводит CLI к полному эталонному пути;
- LOOP QA расширен cases 16–19 без изменения ожиданий cases 1–15:
  - 16: fast/exhaustive audit + details byte-identical на accepted, v7.6 r1 и mutation 001;
  - 17: синтетика с 6 switches, двумя независимыми loop conditions и нерелевантными switches;
  - 18: консервативное неразрешимое условие по non-switch variable + switch;
  - 19: детерминизм двух последовательных fast-прогонов с прогретым глобальным condition cache.

Доказательство:
- КТ1 основана строго на `main 258002e40c1bd7f17727a24626277b103881786a`;
- reference-прототип и compare script: `docs/tasks/025-loop-audit-speed/reference/`;
- GitHub Actions CI: https://github.com/Y2Kill/orbital-economy/actions/runs/37037789516 — `completed / success`;
- `Loop self-test`: 19/19 PASS, 17:02:12–17:05:11 UTC = **2:59**; baseline main run 37027025364: 15/15 PASS, 15:30:17–15:46:51 UTC = **16:34**;
- весь `bench-selftests` КТ1: 17:01:52–17:08:20 UTC = **6:28** против baseline 36:36.

Не запускалось:
- локальный `check_branch` и Windows acceptance: работа через GitHub API по §9.4;
- SHA256SUMS не пересобирались (`sums_by: reviewer`).

Дальше:
- проверить CI КТ1 отдельно и записать время шага Loop self-test;
- после зелёной КТ1 перейти к КТ2: Lab 0.9.14, документация и финальная таблица времени CI.

## Устройство ускорения

Быстрый путь сохраняет прежнюю модель зависимостей: same-step граф состоит только из VARIABLE/FLOW, STOCK разрывает алгебраическую зависимость, а неразрешимые `IfThenElse` консервативно сохраняют условие и обе ветки.

Ускорение состоит из четырёх независимых точных сокращений:
1. union graph при пустом env определяет candidate SCC nodes, вне которых петля невозможна ни при какой комбинации;
2. решение `decideCondition` кэшируется по уже подставленной строке;
3. формулы без `IfThenElse` рендерятся один раз, а SCC/shortest-cycle результат кэшируется по подписи switch-зависимого candidate graph;
4. перебор switch-масок проектируется на переключатели, реально читаемые условиями candidate formulas; вес каждой projected mask точно восстанавливает число исходных комбинаций.

`algebraicLoopCombinationDetails` сохраняет полный список масок, а компоненты переиспользует по projection. Scenario/Modes используют тот же component cache, но env включает все scenario numeric values.

Полный алгоритм до v0.9.14 сохранён внутри модуля как изолированный `EXHAUSTIVE` и вызывается только при `{ exhaustive: true }`. Он не использует candidate/relevant/cache сокращения и служит встроенным oracle.

## Отличия

От reference-прототипа алгоритм fast path содержательно не отличается. Добавлено требуемое заданием:
- встроенный прежний exhaustive path;
- options-параметр у двух публичных функций;
- CLI `loops --exhaustive`;
- cases 16–19.

Reference-прототип остаётся только проверочным материалом задачи и не импортируется production-кодом.

## Ограничения и замечания

- exhaustive path намеренно медленный и предназначен для проверки эквивалентности/диагностики;
- глобальный condition cache безопасен только потому, что ключ — полностью подставленная строка и решение зависит только от неё;
- worker_threads/async не вводились: публичный audit остаётся синхронным;
- model, validation, policy, engine, tools, vendor, `model/nodes/*` и `.github` не меняются;
- SHA256SUMS не пересобираются: `sums_by: reviewer`.

### КТ2 — 2026-10-02 — Lab v0.9.14, документация и финальный implementation CI
Сделано:
- версия стенда поднята до 0.9.14 в `package.json`, `package-lock.json` и CLI;
- `package.json` сохранён CRLF без завершающего перевода строки;
- `STRUCTURE_AUDIT_RU.md` документирует четыре точных сокращения, доказательство точности и `--exhaustive`;
- обновлены HARNESS_QA, TEST_STATUS, README и CHANGELOG;
- scope-diff относительно `main=258002e40…` содержит только разрешённые task-025 файлы плюс обязательный `REPORT_RU.md`; model/validation/policy не менялись.

Доказательство:
- implementation head: `48e07b2b1b8058aeec1113917236f6cd96fb4a65`;
- GitHub Actions: https://github.com/Y2Kill/orbital-economy/actions/runs/37038865059 — `completed / success`;
- guard PASS; tools-selftest PASS; полный `bench-selftests` PASS.

## Время bench-selftests: main → v0.9.14

Источник baseline: main `06ca7ad1dc51d5fa026abc57200bbae59da9b3e0`, CI run https://github.com/Y2Kill/orbital-economy/actions/runs/37027025364.
Источник v0.9.14: implementation head `48e07b2b1b8058aeec1113917236f6cd96fb4a65`, CI run https://github.com/Y2Kill/orbital-economy/actions/runs/37038865059.

| Шаг | main | v0.9.14 | Ускорение |
|---|---:|---:|---:|
| QA self-test | 0:04 | 0:04 | ×1.00 |
| Structure self-test | 3:13 | 0:05 | ×38.60 |
| Loop self-test | 16:34 | 3:52 | ×4.28 |
| Planet self-test | 1:34 | 0:02 | ×47.00 |
| Conformance self-test | 2:10 | 0:42 | ×3.10 |
| Policy self-test | 2:03 | 0:34 | ×3.62 |
| Compare self-test | 4:15 | 1:07 | ×3.81 |
| Node self-test | 5:08 | 1:04 | ×4.81 |
| Bench self-test (Modes 0,12) | 1:24 | 0:33 | ×2.55 |
| **bench-selftests job** | **36:36** | **8:15** | **×4.44** |

`Loop self-test` v0.9.14 намеренно включает cases 16–18 с полным exhaustive oracle, поэтому его собственное ускорение существенно меньше, чем у обычных потребителей fast audit. В КТ1 тот же loop self-test занял 2:59; разброс runner допустим.

### Проверка N3 и ограничения исполнения

- cases 16–18 подтверждают byte-identical `JSON.stringify` fast/exhaustive для audit и details на accepted v7.7.8, v7.6 r1, mutation 001 и двух синтетических моделях;
- supplied `reference/compare_loop_audit.mjs` и skeleton/stress модели не запускались отдельно в локальном checkout: работа выполнялась через GitHub API по §9.4, а skeleton v7.7.9 не хранится отдельным ModelJSON в task-025 tree;
- поэтому четыре-model reference script остаётся дополнительной reviewer-проверкой N3; production fast path при этом буквально основан на supplied prototype, а exhaustive path — на прежнем `main` модуле;
- отдельное измерение CLI `loops accepted <= 5 s` вне CI не выполнялось; косвенно fast audit подтверждён резким сокращением всех вызывающих его self-tests, но это не подменяется числом в отчёте.

Не запускалось:
- канонический Windows acceptance;
- SHA256SUMS не пересобирались (`sums_by: reviewer`).

Финал:
- после этой report-only записи проверяется CI точной финальной головы;
- код/документация КТ2 остаются на `48e07b2b…`; финальный commit меняет только `REPORT_RU.md`.
