# Отчёт исполнителя — задача 011: planet_closure

## Журнал

Работа начата с `main@b9c81e8fa2f2f43049c13ea7f4713c52a8241f86`. Ветка `task/011-planet-closure` создана от этого commit.

### КТ1 — 2026-09-26 16:38 EEST — базовый planet_closure и эталонный case 1 PASS

Сделано:
- добавлен `lab/src/planet_closure.js`: статический аудит декларации процессов Planet v1;
- имена разрешаются через `trim().toLowerCase()`, наружу сохраняются канонические имена ModelJSON;
- реализованы детерминированные dependency paths, полнота по классификации `open_boundaries`, счётчики P2–P6, exceptions, undeclared и reversibility;
- добавлен минимальный `planet_qa.js` с case 1 и отдельный шаг `Planet self-test` в `ci.yml`;
- декларация `planet_closure-v7.7.1.json` не менялась.

Доказательство:
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36245645611 — **success**; guard, tools-selftest и весь bench-selftests PASS.
- `PLANET QA RESULT: PASS (1 passed, 0 failed) in 0.037 s`.
- Accepted v7.7.1 r1: `processes=17`, `legacy=2`, ожидаемых source-output `16`.
- P2 capacity: **7 / 10 / 0** (kernel / exceptions / undeclared).
- P3 energy: **4 / 2 / 11 / 0** (requests / producer / exceptions / undeclared).
- P4 deposits: **0 / 6**.
- P5 labor: **4 / 13**.
- P6 demand drivers: **4**.
- reversibility violations: **0**.

Не подтвердилось:
- Расхождений декларации с эталонными числами §4 задания не обнаружено.
- Для воспроизведения эталона правки декларации не потребовались.

Дальше: добавить cases 2–14, включая L1–L5, режимы enforce, reversibility, deposits, demand/labor negatives и case-insensitive декларацию; довести их до зелёного CI (КТ2).


### КТ2 — 2026-09-26 16:44 EEST — cases 2–14 PASS, ложные декларации диагностируются путями

Сделано:
- `planet_qa.js` расширен до cases 1–14 без изменения case 1;
- L1–L5 проверяют заявленные в задании ложные декларации;
- для ложного утверждения «output читает X» аудит сохраняет полный кратчайший путь, даже если он длиннее `max_hops`, чтобы FAIL объяснял не только отсутствие допустимого пути, но и реальную дистанцию;
- проверены режимы `report/classify/planet_v1/planet_strict`, reversibility, deposits, demand drivers, labor и разрешение имён `trim().toLowerCase()`.

Доказательство:
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36245973496 — **success**; guard, tools-selftest и весь `bench-selftests` PASS.
- `PLANET QA RESULT: PASS (14 passed, 0 failed) in 0.253 s`.
- L1 `mining[A]`: shortest **7 hops**:
  `A Mining -> A Mining Rate -> A Positive Desired Mining Rate -> A Desired Mining Rate -> A Ore Consumption Rate -> A Smelting Rate -> A Pre Energy Smelting Rate -> A Refinery Active Capacity`.
- L2 `construction_materials[A]`: выпуск до `A Energy Fulfillment Ratio` имеет shortest **11 hops**, то есть > `max_hops=4`; ложная energy declaration отклонена.
- L3 `transport`: shortest до `A Power Active Generation Capital` — **13 hops**:
  `Capacity Limited Total Transport Load -> Total Requested Transport Load -> Requested Electronics Transport Load -> Requested Electronics Load B to A -> Requested Electronics Shipment B to A -> Desired Electronics Shipment B to A -> A Electronics Local Demand -> A Electronics Market Price -> A Electronics Domestic Offer Price -> A Electronics Unit Cost -> A Energy Price -> A Perceived Energy Scarcity Ratio -> A Power Active Generation Capacity -> A Power Active Generation Capital`.
- L4 `smelting[A]`: `A Electronics Requested Energy` не имеет общего planned-rate элемента с выпуском в пределах 4 ссылок.
- L5 `electronics[A]`: shortest до `A Refinery Active Capacity` — **8 hops**:
  `A Electronics Production -> A Electronics Production Rate -> A Electronics Energy Fulfillment Ratio -> A Electronics Allocated Energy -> A Energy Fulfillment Ratio -> A Total Requested Energy -> A Metal Requested Energy -> A Pre Energy Smelting Rate -> A Refinery Active Capacity`.
- Case 7: отсутствие `regolith` → report PASS с двумя undeclared outputs; classify FAIL.
- Case 9: `planet_v1` FAIL ровно `P4:6, P5:13`; `planet_strict` дополнительно `P2 exceptions:10, P3 exceptions:11`.
- Case 10: искусственное чтение чужой constant capacity → reversibility=1 в report и FAIL в `planet_v1`.
- Case 11: два deposit STOCK закрывают regolith и дают P4 **2/4**; односторонний STOCK даёт FAIL для `regolith[B]`.
- Cases 12–14: state-dependent demand driver, unused labor intensity и lower-case/trim declaration отрабатывают ожидаемо.

Не подтвердилось:
- Ни одна из L1–L5 не проходит из-за далёкой dependency chain; ограничение `max_hops=4` отсекает их как задумано.
- Дополнительных ошибок в исходной декларации v7.7.1 не найдено; правки декларации по-прежнему не нужны.

Дальше: интеграция `planet_closure` в structure gate/report/CLI, `STATIC_ONLY_PLUGINS`, cases 15–16, v0.9.6 и полный зелёный bench-selftests (КТ3).



### КТ3 — 2026-09-26 16:51 EEST — интеграция, CLI override и cases 15–16 PASS

Сделано:
- `planet_closure` встроен в `runStructureAudits`; его FAIL-пункты попадают в `structureAuditErrors`, а report-only метрики сами по себе hard FAIL не создают;
- `checks.js`: `planet_closure` добавлен в `STATIC_ONLY_PLUGINS`, поэтому runtime Modes не получают `Неизвестный plugin`;
- `structure-audit.md/.json`, console audit и RUN_LAB report показывают P2–P6, exceptions с причинами, undeclared, reversibility и dependency paths;
- команда `audit` получила `--planet-closure=<file>`: декларация заменяет плагин validation, если он есть, либо добавляется только в in-memory validation для этого запуска;
- добавлены `PLANET_SELF_TEST.cmd`, package script `planet-qa`, версия Lab поднята до **0.9.6**;
- cases 15–16 проверяют интеграцию и побайтовую детерминированность JSON.

Доказательство:
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36246369792 — **success**; guard, tools-selftest и весь `bench-selftests` PASS.
- `PLANET QA RESULT: PASS (16 passed, 0 failed) in 1.273 s`.
- Case 15: `runStructureAudits` с plugin → PASS и эталонные счётчики; `checkPlugin(planet_closure, null) → []`; `audit --planet-closure=...` → exit 0.
- Case 15 проверяет в созданном `structure-audit.md` как минимум:
  - `processes: 17; legacy: 2; expected source outputs: 16`;
  - `P2 capacity: kernel 7 / exceptions 10 / undeclared 0`;
  - `P3 energy: requests 4 / producer 2 / exceptions 11 / undeclared 0`;
  - `P4 deposits: with 0 / without 6`;
  - `P5 labor: declared 4 / undeclared 13`;
  - `P6 demand drivers: 4`.
- Case 16: два `JSON.stringify(auditPlanetClosure(...))` побайтно совпадают.
- Циклический ESM dependency `structure_audit.js ↔ planet_closure.js` проверен реальным Node CI и работает: `planet_closure` переиспользует экспортированную функцию `auditOpenBoundaries`, не выполняя её во время инициализации модуля.
- `lab/package.json`: **37 CRLF, 0 bare LF, без завершающего newline**.

Не подтвердилось:
- Интеграция нового static-only plugin не вызвала регрессий старых Structure/Loop/Conformance/Policy/Compare/Bench self-tests.
- Для CLI override не потребовалось менять accepted validation на ветке исполнителя.

Дальше: документация v0.9.6 и финализация отчёта; затем финальная голова должна пройти полный CI (КТ4).



### КТ4 — 2026-09-26 16:59 EEST — документация завершена, финальная содержательная голова CI PASS

Сделано:
- обновлены все шесть требуемых документов: `STRUCTURE_AUDIT_RU.md`, `VALIDATION_FORMAT_RU.md`, `HARNESS_QA_RU.md`, `TEST_STATUS_RU.md`, `README_RU.md`, `CHANGELOG.md`;
- описаны формат `planet_closure`, P2–P6, правило `reads = shortest path <= max_hops`, причины ограничения, enforce modes, counters/exceptions, CLI override и 16 QA cases;
- `REPORT_RU.md` завершён: устройство модуля, отличия от прототипа, декларация, ограничения и перечень не запущенного локально;
- accepted model/validation/policy и `planet_closure-v7.7.1.json` не менялись.

Доказательство:
- интеграционный CI КТ3: https://github.com/Y2Kill/orbital-economy/actions/runs/36246369792 — **success**, `PLANET QA RESULT: PASS (16 passed, 0 failed)`;
- документационная/содержательная голова: https://github.com/Y2Kill/orbital-economy/actions/runs/36246768662 — **success**; guard, tools-selftest и весь `bench-selftests` PASS;
- `lab/package.json`: 37 CRLF, 0 bare LF, без завершающего newline;
- `main` остаётся `b9c81e8fa2f2f43049c13ea7f4713c52a8241f86`, то есть ветка не требует перемещения на новый main.

Итог:
- эталон §4 воспроизводится точно;
- L1–L5 и все дополнительные негативные проверки работают;
- `planet_closure` встроен как static-only hard gate при соответствующем `enforce`;
- Planet v1 debt текущей accepted модели остаётся явно видимым, а не маскируется нулём старого closed-world boundary counter.

Дальше: этот journal-коммит запускает обязательный CI без `[skip ci]`. После его зелёного завершения поставка задачи 011 готова к reviewer acceptance/promotion.


## Устройство модуля и отличия от прототипа

Production-модуль разделён на четыре слоя:

1. Индексация ModelJSON по нормализованному ключу `trim().toLowerCase()` при сохранении канонических имён для отчёта.
2. Один reference graph по ссылкам `[Name]` с двумя направлениями: dependencies нужны для shortest paths/closure, readers — для labor и reversibility.
3. Проверка декларации и каждого process instance: expansion `{C}`, типы элементов, P2–P6, completeness через **переиспользование** `auditOpenBoundaries`.
4. Отдельное применение `enforce`: фактические ошибки декларации всегда FAIL, а долговые метрики становятся hard gate только в соответствующем режиме.

В отличие от reference-прототипа production-вариант:
- возвращает структурированный результат для общего structure gate, RUN_LAB и JSON/Markdown отчётов;
- сохраняет кратчайший реальный путь и при FAIL из-за `max_hops`, а не только факт отсутствия допустимого пути;
- выводит exceptions, undeclared и reversibility раздельно, чтобы «0 undeclared» не скрывал разрешённые P2/P3 exceptions;
- имеет validation-independent override `audit --planet-closure=<file>`;
- интегрирован как static-only plugin и поэтому не создаёт фиктивных runtime checks на каждом Mode;
- проверяет детерминированность результата self-test case 16.

`planet_closure.js` переиспользует `auditOpenBoundaries` из `structure_audit.js`, а `structure_audit.js` вызывает `auditPlanetClosure`. Это создаёт циклический ESM import, но не циклическое выполнение: imported function не читается при инициализации модуля, а вызывается только после загрузки обоих модулей. Case 15 и полный Node CI подтверждают работоспособность этой схемы. Причина оставить её — не дублировать уже принятую логику классификации границ.

## Правки декларации

`docs/tasks/011-planet-closure/planet_closure-v7.7.1.json` **не менялась**. Все эталонные числа §4 воспроизведены точно; cases 2–14 не выявили ошибки в исходной декларации. Accepted validation/policy/model также не менялись.

## Ограничения и замечания к заданию

- `max_hops=4` — локальная структурная эвристика, а не физический закон. На v7.7.1 она хорошо отделяет прямое технологическое ограничение от длинных market-feedback chains: контрольные ложные зависимости дают 7, 8, 11 и 13 hops. При росте модели честный прямой механизм может получить дополнительные промежуточные VARIABLE и перестать укладываться в 4. Поэтому лимит следует пересматривать только по конкретным shortest-path доказательствам при изменении архитектуры, а не автоматически увеличивать.
- Обратная сторона того же ограничения: короткий reference path доказывает структурную близость, но сам по себе не доказывает физическую причинность. Поэтому декларация остаётся ревьюируемым контрактом, а не автоматически выводимой классификацией.
- Reversibility для `capacity: constant` проверяется структурно по readers вне dependency closure собственного output. Нулевой коэффициент вроде `0 * [parameter]` всё равно считается зависимостью — намеренно: формула структурно связана и может быть изменена без изменения декларации.
- P4 проверяет наличие и wiring deposit STOCK, но не запас массы, истощение, восстановление или геологическую реалистичность.
- P5 проверяет объявление/использование labor intensity, но не баланс населения/рынок труда — это именно текущий уровень Planet v1 contract.
- P6 проверяет экзогенность и достижимость consumption через полное замыкание; он не оценивает качество функции спроса.
- `planet_closure` анализирует structure ModelJSON, а не численную динамику. Численные инварианты остаются responsibility validation/runtime checks.
- Замечаний, требующих обхода или изменения задания, не обнаружено. Эталонная декларация оказалась согласованной с accepted model.

## Что не запускалось локально

У агента нет локального git/Node checkout. Локально не запускались `check_branch`, `PLANET_SELF_TEST.cmd`, остальные .cmd self-tests, `RUN_LAB.cmd`, `CHECK_CANDIDATE.cmd`, Windows-команды или отдельный ручной simulation run. Проверки выполнялись GitHub Actions `ci.yml` на Linux: guard, tools-selftest и полный `bench-selftests`; Planet case 15 дополнительно запускает реальный CLI `audit --planet-closure`. Канонические Windows G2–G4 остаются за reviewer. `SHA256SUMS` не пересобираются исполнителем, поскольку `sums_by: reviewer`.
