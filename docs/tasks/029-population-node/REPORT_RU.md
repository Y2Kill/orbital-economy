# Отчёт по заданию 029 — population node

## Журнал

### КТ1 — 2026-10-04 — генератор `population` и строгая схема

Сделано: добавлен declarative node `population` для Planet v2 step 1; фикстура скопирована из задания; узел зарегистрирован в Lab. Реализованы строгая схема, проверка входов базы, генерация рождений/смертей/труда/привлекательности/миграции и детерминированных LINK. В NODE QA добавлены случаи 40, 44 и 45; поддержано снятие слоя после будущего продвижения задачи 030.

Ожидаемое доказательство после этого push: case 40 = **49 / 0 / 90**, 2 migration FLOW и fingerprint **35d24655fc422942**; case 44 = 0 отличий после strip/rebuild; case 45 = пять требуемых ошибок схемы/ссылок. GitHub Actions: https://github.com/Y2Kill/orbital-economy/actions/runs/37218981601 — run 328 для головы `49214b6`; при отдельной проверке `guard` и `tools-selftest` уже SUCCESS, `bench-selftests` продолжал выполняться.

Не запускалось локально: `check_branch` и стенд — работа идёт через API-коннектор, локальный сетевой checkout в среде недоступен. `SHA256SUMS` не пересобирался: `sums_by: reviewer`.

Не подтвердилось: пока нет отрицательных результатов.

Дальше: итоговый conclusion run 328 перепроверить на КТ3; реализовать semantic merge validation, static/runtime plugin `population` и cases 41–43 / QA 45.


### КТ2 — 2026-10-04 — validation merge, static/runtime plugin

Сделано: generated fragment теперь семантически и идемпотентно создаёт/дополняет plugin `population`, категории `demography_births` / `demography_deaths` и `information_signal`. Добавлены строгая validation schema, static conformance топологии ролей/миграции и runtime checks: неотрицательность, пределы занятости, относительное тождество рабочей силы и глобальное сохранение людей при миграции.

Самотесты: NODE cases 41–43 доводят целевой набор до 45 случаев; QA case 45 проверяет PASS, превышение занятости и нарушение миграционного баланса. Case 41 также требует 232 граничных FLOW, unclassified 0, loops 0 с тем же числом комбинаций и `planet_v1 PASS`.

GitHub Actions: https://github.com/Y2Kill/orbital-economy/actions/runs/37219274232 — **SUCCESS**. `QA RESULT: PASS (45 passed, 0 failed)`; `NODE SELF-TEST: 45 passed, 0 failed`; case 40 = **49 / 0 / 90**, migration flows 2, fingerprint **35d24655fc422942**; case 41 = population 2 CONFORMING, boundaries **232 / unclassified 0**, loops **0/32768**, `planet_v1 PASS`; Modes 0/12 `OVERALL: PASS`.

Не подтвердилось: функциональных/регрессионных отказов нет. КТ1 run 328 был автоматически `cancelled` concurrency-механизмом после push КТ2; до отмены его guard/tools и выполненные self-tests были зелёными. Полное доказательство функциональной головы даёт успешный run КТ2 выше.

Дальше: оформить Lab v0.9.16 и документацию, затем проверить CI финальной головы отдельным шагом.


### КТ3 — 2026-10-04 — Lab v0.9.16, документация, финальная голова

Сделано: версия стенда поднята до **0.9.16** в `package.json`, `package-lock.json` и CLI; `package.json` сохранён CRLF без завершающего перевода строки. Обновлены `NODES_RU.md`, `VALIDATION_FORMAT_RU.md`, `LIFECYCLE_CONFORMANCE_RU.md`, `HARNESS_QA_RU.md`, `TEST_STATUS_RU.md`, `README_RU.md`, `CHANGELOG.md`.

КТ2 доказательство: https://github.com/Y2Kill/orbital-economy/actions/runs/37219274232 — SUCCESS, NODE **45/45**, QA **45/45**, `OVERALL: PASS`.

Финальная CI-голова после этого push проверяется отдельным шагом. Стабильная страница workflow ветки: https://github.com/Y2Kill/orbital-economy/actions/workflows/ci.yml?query=branch%3Atask%2F029-population-node .

Модель, accepted validation, policy, `model/nodes/*`, tools, vendor, workflow и engine задачей не менялись. `SHA256SUMS` не пересобирался: `sums_by: reviewer`.

Не подтвердилось: отклонений от эталонного результата задачи 029 не обнаружено.

Дальше: отдельной проверкой подтвердить финальный CI run этой головы; Windows acceptance остаётся reviewer.

## Устройство `population`

Узел additive-only: он создаёт параметры, population STOCK каждого региона, рождения/смерти, показатели труда, цен/реальной зарплаты/уровня жизни, сглаженную привлекательность и направленные migration FLOW между каждой упорядоченной парой регионов. Переключателя нет; существующие формулы и сценарии не заменяются.

На шаге 1 связь однонаправленная: экономика определяет демографические показатели, но население не ограничивает выпуск и не создаёт спрос.

## Отличия

Отличий результата от требований задания и формул эталонного прототипа **нет**: раскрытие совпало по 49/0/90 и fingerprint `35d24655fc422942`; validation/static/runtime criteria выполнены. Исходный код генератора и проверок написан самостоятельно по спецификации; reference prototype использован как oracle результата, а не как копируемая реализация.

## Ограничения

Шаг 1 намеренно остаётся accounting-only: нет ограничения выпуска трудом, связи population → demand и гибкой зарплаты. Канонический Windows acceptance не выполнялся исполнителем и остаётся за reviewer.

## Замечания к заданию

Нет.
