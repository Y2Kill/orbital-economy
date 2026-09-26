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


## Устройство модуля и отличия от прототипа

Будет дополнено после завершения интеграции.

## Правки декларации

На КТ1 декларация не менялась.

## Ограничения и замечания к заданию

Будут дополнены после негативных тестов и интеграции.

## Что не запускалось локально

У агента нет локального git/Node checkout. Локально не запускались `check_branch`, стенд, self-tests, Windows-команды или simulation engine. На КТ1 это заменено GitHub Actions `ci.yml` на Linux: guard, tools-selftest и полный `bench-selftests`. Каноническая Windows-приёмка остаётся за reviewer. `SHA256SUMS` не пересобираются, поскольку `sums_by: reviewer`.
