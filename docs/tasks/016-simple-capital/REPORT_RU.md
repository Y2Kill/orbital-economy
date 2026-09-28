# Отчёт по задаче 016 — simple_capital

## 1. Журнал

### КТ1 — 2026-09-28 — генератор и строгая декларация
Сделано: добавлен тип `simple_capital`, регистрация в node registry, строгая схема декларации с теми же закрытыми полями, что у эталонной фикстуры, копия `regolith-mine-simple.json` в `lab/fixtures/nodes/`, самотесты 13–15. Генератор воспроизводит набор прототипа: 34 добавляемых элемента, 6 замен формул и 78 LINK; формулы и generated validation fragment перенесены из reference-прототипа без смысловых изменений.
Доказательство: implementation commit `67e9959f2dd7aba9d34c1b2853e6f81b4f8f5b24`; ожидаемый после push CI run 36396890642 — https://github.com/Y2Kill/orbital-economy/actions/runs/36396890642. Числовая проверка 34 / 6 / 78 встроена в case 15; итог run проверяется отдельным шагом.
Не подтвердилось: локальный стенд и `check_branch` не запускались — среда работы только через GitHub API, как §9.4; `SHA256SUMS` намеренно не пересобраны (`sums_by: reviewer`).
Дальше: отдельно проверить Actions для этой головы; затем КТ2 — статический и runtime conformance плагина `simple_capital`.

### КТ2 — 2026-09-28 — conformance `simple_capital`
Сделано: generated validation fragment подключён к semantic merge как плагин `simple_capital`; статическая часть в общем lifecycle-conformance gate проверяет восемь ролей, топологию, обязательные зависимости, consumption-потоки, тип `sizing_signal = STOCK` и прямую ссылку Desired Capacity на signal. Runtime-ветка `checkPlugin` проверяет `capacity >= 0` и неотрицательность Expansion / Depreciation / Retirement / всех consumption FLOW. Case 10 проверяет полный generated fixture: 2 simple instances CONFORMING, algebraic loops 0, `planet_closure P2.simple = 2`, open boundaries unclassified = 0. Case 12 строит декларацию с `{C} Regolith Requirement` как sizing signal и требует `NON_CONFORMING` с объяснением `expected STOCK, found VARIABLE`.
Доказательство: implementation head `d2bbd1e836c25ea2644a08216dfbc60fffad1d74`; после push ожидаются CI runs 36397546216 / 36397577554 для этой головы (GitHub создал два запуска; итог проверяется отдельным шагом).
Не подтвердилось: локальный запуск cases 10/12 и runtime симуляции не выполнялся по §9.4; результаты считаются подтверждёнными только после Actions. Предыдущие КТ1 runs были отменены concurrency последующими обязательными journal/KT2 push; код КТ1 входит без изменений в текущую голову и будет покрыт текущим `bench-selftests`.
Дальше: проверить Actions отдельно; КТ3 — закончить `capital_retirement`/вид `simple`, case 11 и добиться зелёного полного `bench-selftests`.

### КТ3 — 2026-09-28 — boundary / Planet v1 / rebuild / полный self-test
Сделано: generated fragment создаёт и идемпотентно наполняет `capital_retirement` (`sink`, `closed_world: true`), `planet_closure.capacity.kind = "simple"` поддерживается как STOCK-capacity с тем же `max_hops` правилом, P2 счётчик имеет форму `kernel / simple / exceptions / undeclared`; case 11 динамически вырезает/собирает все будущие `simple_capital` declarations из `model/nodes/` и модель case 10. Исправлен вывод P2 в structure report. Дополнительно закрыт HARD-путь comparator: failures `simple_capital` теперь формируют static hard errors, а не теряются за общим status.
Доказательство: CI run 36397985918 — https://github.com/Y2Kill/orbital-economy/actions/runs/36397985918, head `94a395531d1300dd6d685cb5d8ca21aee8f68b89`, workflow **success**. `bench-selftests`: QA 32/32 PASS; Structure 21/21 PASS; Loop 15/15 PASS; Planet 16/16 PASS; Conformance 18/18 PASS; Policy 10/10 PASS; Compare PASS; **NODE SELF-TEST 15/15 PASS**; финальный `OVERALL: PASS`.
Не подтвердилось локально: ничего не запускалось вне CI (§9.4). Первый полный run 36397681856 выявил устаревший Markdown-формат P2 и закономерно упал в Planet case 15; после исправления следующий полный run 36397985918 зелёный.
Дальше: КТ4 — версия 0.9.9, вся требуемая документация и финальная зелёная голова.

## 2. Устройство `simple_capital`, validation и `planet_closure`

На КТ1 реализован генератор. Для каждой колонии он создаёт STOCK мощности, сглаженный sizing signal при `create: true`, desired/shortage/excess/desired expansion, физически обеспеченный Expansion, depreciation, retirement и consumption-потоки backing-благ. Подмена output-мощности switch-gated и сохраняет старую ветку дословно; backing demand получает добавку от Desired Expansion.

Generated validation fragment имеет форму прототипа (`simple_capital_instances`, transformation/retirement names, pairs, `planet_closure.capacity.kind = "simple"`). Semantic merge создаёт отсутствующие plugin `simple_capital` и boundary category `capital_retirement`; повторный merge требует семантического совпадения. `simple` в Planet P2 проверяет путь output → capacity STOCK тем же алгоритмом/max_hops, что `kernel`, и считается отдельным видом капитала.

Отличие от reference-прототипа только инфраструктурное: generated ModelJSON elements получают человекочитаемый `description`, как тип `capital_lifecycle`; oracle сравнивает type/endpoints/behavior, replacements и LINK, а набор элементов, формулы и validation fragment перенесены без смысловых изменений. Case 15 фиксирует 34 / 6 / 78 и byte-determinism. Case 10 выполняет static integration и runtime Mode 38 probe; численные проверки заданы широким envelope вокруг опубликованных значений прототипа, чтобы ловить изменение поведения, а не FP-шум.

## 3. Ограничения и замечания к заданию

- Локальный стенд не запускается по условиям выдачи и §9.4. Проверки заменяются чтением кода и CI `bench-selftests`; непроверенное локально не считается проверенным.
- `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не изменяются: `scope.json` задаёт `sums_by: reviewer`.
- Историческая запись КТ1 описывает состояние именно той контрольной точки; к финалу plugin conformance, `capital_retirement` и `planet_closure.simple` подключены и покрыты CI.
- Формулировка «фикстура `fixtures/regolith-mine-simple.json`» в краткой выдаче трактуется как путь внутри каталога задачи, что подтверждается фактическим расположением `docs/tasks/016-simple-capital/fixtures/regolith-mine-simple.json`.

- По J4 отдельного Mode-38 файла в reference-каталоге нет. Поэтому self-test не вводит независимую придуманную конфигурацию: он клонирует текущий accepted Mode 37, меняет `Timed Test Mode` на 38 и включает только generated `Regolith Mine Capital Enabled`. Это воспроизводит смысл пробы из §1 и остаётся привязанным к актуальной accepted-модели.
