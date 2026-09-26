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

## Устройство модуля и отличия от прототипа

В работе. Для production-модуля выбран предварительный разбор формул в шаблон с узлами `IfThenElse`, чтобы не разбирать каждую формулу заново для каждой комбинации переключателей. Граф строится только по ссылкам `[Name]` в формулах VARIABLE/FLOW; LINK игнорируются, STOCK разрывает зависимость.

В отличие от прототипа production-вариант:
- валидирует баланс скобок и корректное закрытие/число аргументов `IfThenElse`, возвращая `FAIL` с именем элемента вместо молчаливого пропуска;
- объединяет одинаковые SCC между комбинациями;
- вычисляет детерминированный кратчайший цикл внутри SCC;
- фиксирует порядок узлов и результатов порядком элементов модели.

## Время

Полный `loop_qa.js` на Linux CI run 36240233643: **17.386 s** для всех 13 случаев. Из них case 4 включает две реальные попытки simulation (Mode 16 успешен, Mode 17 ожидаемо падает на circular loop), case 12 — полный static compare gate, генерацию structure-audit report и отдельный CLI `loops`.

## Ограничения и замечания к заданию

Текущий `lab/src/structure_qa.js` находится вне scope задачи 010, но его существующий тест ожидает `runStructureAudits(...).status === 'SKIPPED'` при отсутствии plugins `open_boundaries` и `colony_symmetry`. При КТ3 интеграция будет сделана совместимо: algebraic-loop audit выполняется всегда и любая найденная петля даёт общий `FAIL`; старый `SKIPPED` можно сохранить только для случая «старых plugins нет и loop audit PASS». Это не скрывает петли и не требует выхода за scope. Поведение будет проверено CI.

## Что не запускалось локально

У агента нет локального git/Node checkout. Локально не запускались `check_branch`, самотесты стенда, движок или Windows-команды. Проверка выполняется GitHub Actions `ci.yml` на Linux; каноническая Windows-проверка остаётся за reviewer. `SHA256SUMS` не пересобираются, поскольку `sums_by: reviewer`.
