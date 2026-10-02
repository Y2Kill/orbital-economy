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
