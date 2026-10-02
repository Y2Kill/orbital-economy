# Отчёт по заданию 024 — energy_consumer

## Журнал

### КТ1 — 2026-10-02 — генератор energy_consumer и базовые QA
Сделано:
- добавлен тип узла `energy_consumer` со строгой схемой декларации;
- добавлена фикстура `lab/fixtures/nodes/process-energy.json`;
- добавлены случаи node QA 28, 32 и 33;
- случай 28 проверяет 71 добавленный элемент / 14 заменённых элементов / 232 связи и отпечаток `fe5f022b5d81ec3b`;
- случай 32 проверяет пять обязательных ошибок: лишнее поле, отсутствующая колония в `signal.initial`, `energy_per_unit = 0`, отсутствующий `allocator.available`, уже подключённый потребитель;
- случай 33 проверяет отсутствие замены общей доли при отсутствии приоритетных потребителей (12 замен вместо 14).

Доказательство:
- коммит КТ1: `8fadea5382f3d5eff974dc31bc1a14200191327b`;
- ожидается CI для головы `8fadea5382f3d5eff974dc31bc1a14200191327b`; результат будет проверен отдельным шагом.

Не запускалось:
- локальный `check_branch` и локальный стенд: среда не имеет сетевого git checkout; работа ведётся через GitHub API по §9.4;
- SHA256SUMS не пересобирались: `sums_by: reviewer`.

Не подтвердилось:
- пока нет; CI ещё не проверен.

Дальше:
- проверить CI КТ1 отдельно;
- КТ2: validation fragments/merge, `planet_closure energy.signal/fulfillment`, `energy_balance priority`, QA 29–31, planet 17–18 и QA 43.

### Перенос ветки — 2026-10-02 — новый main и лимит CI
Ветка перенесена владельцем на новый `main` `beeeff0d5b298cfddc1a1282e16c62a8a06199e3`; продолжение начинается с головы `c62ec8daad3460d373d11cd2708178d9d888cb5a`. Старые SHA выше сохранены как исторические записи журнала. Лимит `bench-selftests` в CI поднят до 60 минут и манифесты пересобраны владельцем. Предыдущий длинный прогон был остановлен таймаутом CI, а не диагностированным дефектом кода.

Уточнение приёмочного oracle для case 29/N3: `Process Energy Enabled` ещё не проводится сценариями принятой модели (это задача 025), поэтому аудит петель не добавляет новую перебираемую ось. Case 29 должен требовать `combinationsWithLoops === 0` и `combinations === baselineAudits.algebraicLoops.combinations` того же случая, без константы 32768.


### КТ2 — 2026-10-02 — validation fragments и расширения энергетических проверок
Сделано:
- generated validation fragment `energy_consumer` добавляет потребителей в `energy_balance.consumers`, приоритетных потребителей в `energy_balance.priority`, signal-flow patterns в `open_boundaries.information_signal` и per-process `planet_closure.energy`;
- merge идемпотентен и сохраняет прежнее поведение существующих типов узлов;
- `planet_closure` поддерживает `energy.signal` как строго ограниченный мост через объявленный STOCK-сигнал и его boundary FLOW, а также per-process `energy.fulfillment`;
- `energy_balance.priority` проверяет `X K Energy Fulfillment Ratio >= X Energy Fulfillment Ratio` с `abs_tol`;
- добавлены node QA 29–31, Planet QA 17–18 и QA 43;
- oracle case 29 исправлен после уточнения N3: число комбинаций сравнивается с базовым аудитом того же случая, `combinationsWithLoops === 0`; `Process Energy Enabled` не добавляет сценарную ось до задачи 025.

Доказательство:
- кодовая голова КТ2: `c88433963aee8795810a5cf15db9937688cb2253`;
- GitHub Actions CI run: https://github.com/Y2Kill/orbital-economy/actions/runs/37006501565 — `completed / success`;
- в этом run: QA 43/43, Planet 18/18, Structure 21/21, Loop 15/15, Conformance 18/18, Policy 10/10, Compare PASS, Bench Modes 0,12 `OVERALL: PASS`;
- case 29 подтверждает loops = 0 и число combinations, равное baseline-аудиту; на текущей принятой базе это 16384.

Не запускалось:
- локальный `check_branch` и локальный Windows acceptance: работа через GitHub API по §9.4; строгий branch guard и Linux CI выполнены самим Actions;
- SHA256SUMS не пересобирались: `sums_by: reviewer`.

Не подтвердилось:
- дефектов КТ2 на зелёном CI не осталось;
- прежний timeout до переноса ветки не считается дефектом кода.

Дальше:
- КТ3 по §4: версия Lab 0.9.13, документация, статусные файлы и финальный отчёт.


## Устройство `energy_consumer`

Узел не создаёт новый производственный процесс: он оборачивает уже существующие process rates энергетическим контуром. Исходная формула каждой скорости сохраняется в `X K Pre Energy Rate`; сглаженный STOCK `X K Energy Signal` следует этой плановой скорости; запрос энергии считается как `signal × energy_per_unit`; allocation даёт собственный fulfillment, которым ограничивается реальная скорость. Switch сохраняет дословную старую ветку.

Такое разделение нужно, чтобы запрос не читал уже ограниченную энергией текущую скорость и не замыкал алгебраическую петлю. `planet_closure.energy.signal` формализует эту связь: разрешён только явно объявленный STOCK-сигнал, который request читает напрямую, а его FLOW обязаны быть boundary FLOW категории `information_signal`.

Для `priority:true` сначала вычисляются суммарный priority request, priority fulfillment и priority allocation. Общая allocator ratio получает только остаток доступной генерации после приоритетной доли. Runtime `energy_balance.priority` независимо проверяет, что fulfillment каждого приоритетного consumer не ниже общей доли. Если приоритетных consumer нет, общая ratio не заменяется.

Generated validation fragment несёт consumer list, priority list, information-signal patterns и per-process Planet energy declarations. Merge идемпотентен и не допускает молчаливой замены несовпадающей существующей Planet energy-role.

## Отличия

Единственное содержательное отличие от первоначально записанного N3 — число комбинаций algebraic-loop audit. В исходном тексте было `0/32768`, но `Process Energy Enabled` не задаётся сценариями принятой v7.7.8 и поэтому не входит в перебираемые switch combinations. По уточнению владельца case 29 проверяет `combinationsWithLoops === 0` и равенство `combinations` числу базового аудита того же случая; сейчас это **16384**.

Ветка была перенесена владельцем на новый `main` для увеличения timeout `bench-selftests` до 60 минут и пересборки манифестов. Старые SHA журнала сохранены как исторические. Предыдущие отменённые/таймаутные CI до переноса не трактуются как дефект реализации.

Других намеренных расхождений с прототипом нет: эталонные 71/14/232 и fingerprint `fe5f022b5d81ec3b` сохранены.

## Ограничения и замечания

- задача harness-only: accepted ModelJSON, validation и policy не изменяются;
- `Process Energy Enabled` пока не проведён через Modes; модельная интеграция отложена в задачу 025;
- priority — бинарная принадлежность consumer к единственной приоритетной группе, не многоуровневая очередь;
- special STOCK traversal разрешён только для объявленного `energy.signal`; это не общий механизм обхода stateful dependencies;
- канонический Windows acceptance и SHA256SUMS остаются за reviewer по `sums_by: reviewer`;
- локальный `check_branch` не запускался в API-режиме; branch guard выполняет CI.


### КТ3 — 2026-10-02 — версия 0.9.13 и документация
Сделано:
- версия Lab поднята до 0.9.13 в `package.json`, `package-lock.json` и строке CLI;
- `package.json` сохранён CRLF без завершающего перевода строки;
- документирован `energy_consumer`: декларация, раскрытие, signal, priority, отсутствие замены общей ratio без priority и пример;
- документированы `energy_balance.priority`, `planet_closure.energy.signal` и per-process `energy.fulfillment`;
- обновлены HARNESS_QA, TEST_STATUS, README и CHANGELOG;
- добавлены итоговые разделы отчёта «Устройство», «Отличия», «Ограничения и замечания».

Доказательство:
- КТ2 code/QA baseline: https://github.com/Y2Kill/orbital-economy/actions/runs/37006501565 — SUCCESS;
- финальная голова КТ3 проверяется полным Actions CI ветки; точный run будет добавлен после завершения.

Не запускалось:
- локальный Windows acceptance;
- SHA256SUMS не пересобирались (`sums_by: reviewer`).

Дальше:
- убедиться, что CI точной финальной головы `completed/success`;
- сверить финальный diff со scope и передать ветку reviewer.
