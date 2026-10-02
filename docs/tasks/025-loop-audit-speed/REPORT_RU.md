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
- точный CI run головы КТ1 будет добавлен после завершения запуска.

Не запускалось:
- локальный `check_branch` и Windows acceptance: работа через GitHub API по §9.4;
- SHA256SUMS не пересобирались (`sums_by: reviewer`).

Дальше:
- проверить CI КТ1 отдельно и записать время шага Loop self-test;
- после зелёной КТ1 перейти к КТ2: Lab 0.9.14, документация и финальная таблица времени CI.
