# Отчёт по задаче 016 — simple_capital

## 1. Журнал

### КТ1 — 2026-09-28 — генератор и строгая декларация
Сделано: добавлен тип `simple_capital`, регистрация в node registry, строгая схема декларации с теми же закрытыми полями, что у эталонной фикстуры, копия `regolith-mine-simple.json` в `lab/fixtures/nodes/`, самотесты 13–15. Генератор воспроизводит набор прототипа: 34 добавляемых элемента, 6 замен формул и 78 LINK; формулы и generated validation fragment перенесены из reference-прототипа без смысловых изменений.
Доказательство: implementation commit `67e9959f2dd7aba9d34c1b2853e6f81b4f8f5b24`; ожидаемый после push CI run 36396890642 — https://github.com/Y2Kill/orbital-economy/actions/runs/36396890642. Числовая проверка 34 / 6 / 78 встроена в case 15; итог run проверяется отдельным шагом.
Не подтвердилось: локальный стенд и `check_branch` не запускались — среда работы только через GitHub API, как §9.4; `SHA256SUMS` намеренно не пересобраны (`sums_by: reviewer`).
Дальше: отдельно проверить Actions для этой головы; затем КТ2 — статический и runtime conformance плагина `simple_capital`.

## 2. Устройство `simple_capital`, validation и `planet_closure`

На КТ1 реализован генератор. Для каждой колонии он создаёт STOCK мощности, сглаженный sizing signal при `create: true`, desired/shortage/excess/desired expansion, физически обеспеченный Expansion, depreciation, retirement и consumption-потоки backing-благ. Подмена output-мощности switch-gated и сохраняет старую ветку дословно; backing demand получает добавку от Desired Expansion.

Generated validation fragment уже имеет форму прототипа (`simple_capital_instances`, transformation/retirement names, pairs, `planet_closure.capacity.kind = "simple"`), но его semantic merge и исполняемый conformance будут подключены на следующих КТ.

Отличие от reference-прототипа только инфраструктурное: generated ModelJSON elements получают человекочитаемый `description`, как тип `capital_lifecycle`; oracle сравнивает type/endpoints/behavior, а формулы, имена, replacement и validation fragment совпадают.

## 3. Ограничения и замечания к заданию

- Локальный стенд не запускается по условиям выдачи и §9.4. Проверки заменяются чтением кода и CI `bench-selftests`; непроверенное локально не считается проверенным.
- `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не изменяются: `scope.json` задаёт `sums_by: reviewer`.
- На КТ1 плагин conformance, boundary category `capital_retirement` и поддержка `simple` в `planet_closure` ещё не подключены; это ожидаемое промежуточное состояние, а не обход требований.
- Формулировка «фикстура `fixtures/regolith-mine-simple.json`» в краткой выдаче трактуется как путь внутри каталога задачи, что подтверждается фактическим расположением `docs/tasks/016-simple-capital/fixtures/regolith-mine-simple.json`.
