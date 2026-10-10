# Задание 033 — отчёт исполнителя

Ветка: `task/033-labor-market-node` от `main@6e10dcd60030ad6024e23e2fbec4af7d411afbcc`.

## Среда и ограничения

Исполнение через GitHub API-коннектор, без локального checkout/стенда. Поэтому локальный `check_branch` и Windows-стенд не запускаются; проверки фиксируются по GitHub Actions. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не меняются (`sums_by=reviewer`). Accepted model, validation, policy и `model/nodes/*` не меняются.

## Журнал

### Старт — 2026-10-10
Прочитаны `TASK_RU.md`, fixture `labor_market.json`, reference `labor_market_node_prototype.mjs` и `add_lm_modes.mjs`. Ветка создана строго от `6e10dcd60030ad6024e23e2fbec4af7d411afbcc`.

### КТ1 — 2026-10-10 — генератор, strip/rebuild и schema
Сделано: генератор `labor_market`, строгая схема и fixture; cases 53/57/58.
Доказательство: [ci.yml run 38040788876](https://github.com/Y2Kill/orbital-economy/actions/runs/38040788876), bench job `114180444028`: строка 536 — case 53 PASS, **31 elements / 24 replacements / 108 links**, fingerprint `8ac752ca9a1175e4`; строка 540 — case 57 PASS, прежние wage/demand числа восстановлены и rebuild имеет 0 differences; строка 541 — case 58 PASS по пяти обязательным negatives.

### КТ2 — 2026-10-10 — fragments/P6, plugin и runtime
Сделано: plugin `labor_market`, идемпотентный semantic merge, `information_signal`, переобъявление P6, cases 54–56 и QA 47.
Доказательство: тот же [run 38040788876](https://github.com/Y2Kill/orbital-economy/actions/runs/38040788876): строка 250 — **QA 47/47**; строка 537 — case 54 PASS: 2 CONFORMING, boundary **254→262**, symmetry=0, P6=4, loops=0; строка 538 — case 55 PASS: **all merged runtime plugins PASS**, availability [0,1], wage movement observed; строка 539 — case 56 PASS: 3-region, 3 CONFORMING instances.

Промежуточный [run 38040104129](https://github.com/Y2Kill/orbital-economy/actions/runs/38040104129) корректно поймал два дефекта тестовой обвязки: строка 539 — synthetic C не содержала транзитивный `C Mining Pre Energy Rate`; строка 542 — case 59 не мог определить layering. Первый дефект исправлен копированием требуемых транзитивных C-зависимостей для синтетического региона.

### КТ3 — 2026-10-10 — labor_market поверх всех узлов
Сделано: case 59 строит модель «accepted + labor_market», снимает `labor_market` первым и затем проверяет все прежние node layers; P6 для нижних слоёв возвращается к прежним drivers.
Промежуточный [run 38040527371](https://github.com/Y2Kill/orbital-economy/actions/runs/38040527371) показал оставшийся дефект порядка: строка 480 — общий layering не мог выбрать внешний слой среди прежних declarations. Исправление: при модели с `labor_market` внешний слой приоритизируется перед зависимыми нижними слоями, после чего обычный dependency-based peeling продолжает работу.
Доказательство: [run 38040788876](https://github.com/Y2Kill/orbital-economy/actions/runs/38040788876), строка 542 — case 59 PASS: `labor_market peeled first; 11 node layers rebuildable; P6 old drivers restored`; строка 544 — **NODE 59/59**; строка 1646 — **OVERALL: PASS**. Guard и tools-selftest на этой голове также success.

### КТ4 — ожидается финальный CI
Документация и Lab v0.9.18 готовятся отдельным содержательным коммитом; после его зелёного CI КТ4 будет записана отдельным journal-only коммитом.

## Устройство

`labor_market` замыкает Planet v2 step 3 тремя механизмами под `Labor Market Enabled`: demand per capita × Population, гибкая зарплата по labor tightness и guard выпуска через Labor Availability. Спрос на труд берётся при неурезанном выпуске через деление наблюдаемого requirement на availability и сглаживается 10-дневным STOCK-сигналом.

Числовые старые ветви Wage и внешнего demand не встраиваются литералами в `IfThenElse`: они вынесены в именованные `X Initial Wage` / `X External …`, поэтому A/B-формулы остаются зеркальными. При strip эти ссылки восстанавливаются обратно в прежние числовые значения.

## Отличия

От reference-прототипа для нормативной fixture отличий в порядке, формулах, стартовых значениях и раскрытии нет: **31/24/108**, fingerprint `8ac752ca9a1175e4`.

Дополнения стенда, не меняющие эталон fixture:
- строгая декларативная схема с ошибками по пути/имени;
- для формульного старого demand-target допускается сохранение исходной формулы непосредственно в old branch вместо создания `External …`; fixture задачи использует числовые targets и поэтому совпадает с reference;
- node QA обобщён для будущего accepted-состояния: верхний `labor_market` снимается раньше `food` и остальных зависимых слоёв, затем нижние declarations восстанавливаются обычным алгоритмом;
- synthetic three-region test копирует транзитивные зависимости rates, необходимые созданным C-формулам.

Модельные данные, accepted validation/policy и раскрытие существующих типов узлов не менялись.

## Ограничения

Household-income demand намеренно не добавлен — он отложен до финансового слоя. Модельные данные и accepted validation/policy не изменяются.
