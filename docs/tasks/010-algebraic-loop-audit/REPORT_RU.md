# Отчёт исполнителя — задача 010: статический аудит алгебраических петель

## Журнал

Работа начата с `main@38940b78194168b45bb76e1160af11c2d20a7cc8`. Контрольные точки пока не закрыты.

### КТ1 — 2026-09-26 14:44 EEST — loop audit cases 1–3 и CI PASS

Сделано: добавлен switch-aware `loop_audit.js`, начальный `loop_qa.js` со случаями 1–3 и шаг `Loop self-test` после `Structure self-test` в `ci.yml`.

Доказательство:
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36239642926 — **success**.
- Accepted v7.7.1 r1: `7` переключателей, `128` комбинаций, **0** комбинаций с петлями, Modes — none.
- v7.6 r1: `5` переключателей, `32` комбинации, **16/32** с петлёй; все с `Power Resource Enabled = 1`; Modes **25,26**.
- Мутация «001 r1»: `7` переключателей, `128` комбинаций, **64/128** с петлёй; все с `Intermediate Inputs Enabled = 1`; Modes **17–31**.
- `LOOP QA RESULT: PASS (3 passed, 0 failed)`.
- Остальные шаги `bench-selftests` также PASS.

Не подтвердилось:
- Принятая модель скрытых алгебраических петель не содержит.
- Эталонные числа прототипа воспроизведены без специальных исключений или привязки к именам переключателей.

Дальше: расширить самотест до всех 13 случаев, включая runtime-согласие с движком, parser failure, STOCK/FLOW/self-loop и статический блок compare.

### КТ2 — 2026-09-26 14:48 EEST — все 13 QA-случаев PASS, включая согласие с движком

Сделано: `loop_qa.js` расширен до полного набора 13 случаев; algebraic-loop audit подключён к статическому structure gate так, чтобы петля блокировала compare до симуляции.

Доказательство:
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36239874393 — **success**.
- `LOOP QA RESULT: PASS (13 passed, 0 failed) in 17.063 s`.
- Case 4: Mode 16 на мутации 001 считается; Mode 17 движок бросает `Circular equation loop`; аудит предсказывает петлю в 17 и не предсказывает в 16.
- Cases 5–9: безусловная петля, условие от STOCK, разрыв через STOCK, петля через FLOW и self-reference распознаются согласно заданию.
- Case 10: переменная 0/1 со scenario-value `2` и неиспользуемая scenario-переменная не признаются переключателями.
- Case 11: несбалансированная формула даёт `FAIL` с именем элемента без исключения наружу.
- Case 12: `runStructureAudits` на мутации 001 → `FAIL`; `compare` → `NOT_COMPARED`, сценарные симуляции не запускаются.
- Case 13: два вызова дают побайтно одинаковый `JSON.stringify(auditAlgebraicLoops(...))`.
- Все остальные шаги `bench-selftests` — PASS.

Не подтвердилось:
- Расхождений с эталонными verdicts прототипа и с runtime-поведением движка не обнаружено.
- Для распознавания переключателей не потребовались правила по именам `* Enabled`.

Дальше: завершить пользовательскую обвязку — `audit`/RUN_LAB reports, отдельную CLI-команду `loops`, markdown/json вывод и package/cmd wiring; затем доказать это на мутации 001 (КТ3).

### КТ3 — 2026-09-26 14:55 EEST — audit/RUN_LAB/compare/loops интегрированы, CI PASS

Сделано:
- algebraic-loop audit встроен в `runStructureAudits` как безусловная статическая проверка;
- `structureAuditErrors` передаёт loop/parser FAIL в comparator, поэтому `compare` блокируется до simulation;
- `structure-audit.md/.json` и RUN_LAB `report.md` получили раздел Algebraic loops;
- добавлена отдельная команда `node src/cli.js loops <model.json> [--out=DIR]`, JSON/Markdown отчёты и exit code 1 при найденных петлях;
- Lab поднят до v0.9.5; добавлены package scripts `loops`, `loop-qa` и `LOOP_SELF_TEST.cmd`;
- `lab/package.json` сохранён как CRLF без завершающего перевода строки.

Доказательство:
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36240233643 — **success**; `bench-selftests` полностью PASS.
- `LOOP QA RESULT: PASS (13 passed, 0 failed) in 17.386 s`.
- Case 12: `compare → NOT_COMPARED`, CLI `loops` → exit code 1, `structure-audit.md` содержит shortest cycle.
- Выдержка shortest cycle из отчёта на мутации 001 r1:
  `A Desired Smelting Rate -> A Positive Desired Smelting Rate -> A Pre Energy Smelting Rate -> A Metal Requested Energy -> A Total Requested Energy -> A Energy Fulfillment Ratio -> A Electronics Allocated Energy -> A Electronics Energy Fulfillment Ratio -> A Electronics Production Rate -> A Electronics Feedstock Consumption Rate -> A Electronics Metal Input Target Inventory -> A Electronics Metal Input Demand -> A Metal Available for Intermediate Use -> A Electronics Metal Input Delivery -> A Desired Smelting Rate`
- Это 15 уникальных участников до возврата в начало, а не полный большой SCC; требование «короткий цикл» выполнено.

Не подтвердилось:
- После интеграции не возникло регрессий в Structure/Conformance/Policy/Compare/Bench self-tests.
- Для отдельной CLI-команды validation не нужен; accepted model даёт PASS, loop mutation — FAIL/exit 1.

Дальше: обновить документацию v0.9.5 и итоговый отчёт, затем дождаться зелёного CI финальной головы (КТ4).


### КТ4 — 2026-09-26 15:03 EEST — документация v0.9.5 завершена, полная голова CI PASS

Сделано:
- обновлены `STRUCTURE_AUDIT_RU.md`, `HARNESS_QA_RU.md`, `TEST_STATUS_RU.md`, `README_RU.md`, `CHANGELOG.md`;
- документация описывает правило переключателя, консервативное ветвление `IfThenElse`, два уровня анализа, shortest cycle, fail-fast и ограничения;
- после документации найден и закрыт edge case: при validation без старых structure plugins loop audit всё равно печатается в `structure-audit.md`; существующий aggregate `SKIPPED` сохраняется только при loop PASS;
- дополнительная проверка включена в case 12 без увеличения числа QA-случаев.

Доказательство:
- Полная кодовая+документационная голова перед этим journal-коммитом: `74dfd2dabadff727cbd297350cfab88cb2897887`.
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36240625420 — **success**.
- `guard` — PASS; `tools-selftest` — PASS; весь `bench-selftests` — PASS.
- `Loop self-test`: **PASS 13/13**; accepted = 7 switches / 128 combinations / 0 loops.
- Case 12 также подтверждает `NOT_COMPARED`, shortest-cycle report, CLI exit=1 и наличие loop PASS в no-plugin `structure-audit.md`.
- `lab/package.json`: 36 CRLF, 0 bare LF, без завершающего newline.
- Текущий `main` по-прежнему `38940b78194168b45bb76e1160af11c2d20a7cc8`; rebase не требуется.

Не подтвердилось:
- Регрессий существующих аудитов/самотестов после полной интеграции и документации нет.
- Accepted v7.7.1 r1 по-прежнему не содержит алгебраических петель ни в одной из 128 комбинаций.

Дальше: этот journal/report-коммит сам запускает CI, поскольку `[skip ci]` запрещён. Перед передачей результата исполнитель обязан дождаться его зелёного завершения; новых функциональных изменений после КТ4 не планируется.


## Устройство модуля и отличия от прототипа

Production-модуль предварительно разбирает каждую формулу в шаблон из текстовых фрагментов и узлов `IfThenElse`, после чего один и тот же шаблон рендерится для разных switch/scenario environments. Это уменьшает повторный parsing при переборе комбинаций.

Граф строится только по ссылкам `[Name]` в формулах VARIABLE/FLOW; визуальные LINK игнорируются. STOCK не входит в same-step graph и тем самым разрывает зависимость. Переключатели распознаются по фактическим model/scenario значениям 0/1, без проверки суффикса `Enabled`.

В отличие от прототипа production-вариант:
- валидирует баланс `()` / `[]`, закрытие и ровно три аргумента `IfThenElse`; ошибка возвращается как `FAIL` с именем элемента;
- неизвестное/state-dependent условие сохраняет обе ветви, а не угадывает;
- объединяет одинаковые SCC между комбинациями;
- вычисляет детерминированный кратчайший цикл внутри SCC;
- фиксирует порядок узлов, рёбер, SCC и результатов порядком элементов модели;
- имеет отдельный validation-независимый CLI `loops` и общую интеграцию через static structure gate.

## Время

На финальном Linux CI run 36240625420:
- аудит accepted v7.7.1 r1 занял примерно **0.338 s** по timestamp между стартом списка QA cases и строкой PASS case 1 (7 switches, 128 combinations, 0 loops);
- полный `loop_qa.js`: **18.214 s** для всех 13 случаев.

Полный self-test существенно длиннее самого аудита: case 4 включает реальные simulation Mode 16/17, а case 12 — static compare gate, генерацию двух audit reports и отдельный процесс CLI `loops`. Предыдущий интеграционный run 36240233643 дал 17.386 s; разница относится к обвязке/CI, не к изменению алгоритма.

## Ограничения и замечания к заданию

- Аудит — консервативный статический анализ, а не полный интерпретатор языка формул. Условие, которое нельзя безопасно решить после подстановки numeric scenario values, сохраняет обе ветви; возможны false positive, но условная петля не должна быть пропущена.
- Анализируется algebraic dependency одного шага. Динамические feedback loops через STOCK во времени здесь намеренно не считаются ошибкой.
- Стоимость полного поиска экспоненциальна по числу распознанных бинарных переключателей: `2^N`. На текущем accepted N=7 (128 комбинаций), фактическое время около 0.34 s на Linux CI; при заметном росте N потребуется отдельное решение по оптимизации, а не молчаливое урезание комбинаций.
- Поддерживаемый parser специально узкий: ссылки `[Name]`, вложенные `IfThenElse`, numeric comparisons. Неизвестная семантика условия означает «обе ветви», а структурно malformed формула — FAIL.
- Для совместимости существующий `structure_qa.js` вне scope сохраняет aggregate `SKIPPED`, когда validation не содержит `open_boundaries`/ `colony_symmetry` **и** безусловный loop audit PASS. При loop/parser FAIL результат всегда FAIL. Отчёт при SKIPPED всё равно содержит секцию algebraic loops; это проверено case 12.
- Validation, model, policy, engine и логика старых `open_boundaries` / `colony_symmetry` не менялись.

## Что не запускалось локально

У агента нет локального git/Node checkout. Локально не запускались `check_branch`, self-tests, simulation engine, `RUN_LAB.cmd`, `CHECK_CANDIDATE.cmd` или Windows-команды. Вместо этого все доступные проверки выполнялись GitHub Actions `ci.yml` на Linux: guard, tools-selftest, полный `bench-selftests`, включая реальный `simulation@9.0.0` внутри loop case 4 и обычного Bench self-test. Каноническая Windows-проверка, F2–F4 из раздела приёмки задания и пересборка SUMS остаются за reviewer. `SHA256SUMS` не пересобираются исполнителем, поскольку `sums_by: reviewer`.
