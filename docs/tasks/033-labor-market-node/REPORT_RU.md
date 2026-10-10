# Задание 033 — отчёт исполнителя

Ветка: `task/033-labor-market-node` от `main@6e10dcd60030ad6024e23e2fbec4af7d411afbcc`.

## Среда и ограничения

Исполнение через GitHub API-коннектор, без локального checkout/стенда. Поэтому локальный `check_branch` и Windows-стенд не запускаются; проверки фиксируются по GitHub Actions. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не меняются (`sums_by=reviewer`). Accepted model, validation, policy и `model/nodes/*` не меняются.

## Журнал

### Старт — 2026-10-10
Прочитаны `TASK_RU.md`, fixture `labor_market.json`, reference `labor_market_node_prototype.mjs` и `add_lm_modes.mjs`. Ветка создана строго от `6e10dcd60030ad6024e23e2fbec4af7d411afbcc`.

### КТ1 — ожидается CI
Сделано: добавлен генератор `labor_market` со строгой схемой, зарегистрирован тип, fixture скопирована в Lab; node_qa cases 53/57/58 проверяют oracle 31/24/108, fingerprint `8ac752ca9a1175e4`, strip/rebuild с восстановлением числовых старых ветвей и обязательные schema/base negatives.
Дальше: проверить первый `ci.yml`; после зелёного прогона записать run/строки отдельным journal-коммитом.

### КТ2 — ожидается
Фрагменты validation/P6, plugin `labor_market`, cases 54–56 и QA 47.

### КТ3 — ожидается
Case 59: `labor_market` как верхний слой над всеми прежними узлами; полный bench-selftests.

### КТ4 — ожидается
Документация Lab v0.9.18 и финальная зелёная голова.

## Устройство

`labor_market` замыкает Planet v2 step 3 тремя механизмами под `Labor Market Enabled`: demand per capita × Population, гибкая зарплата по labor tightness и guard выпуска через Labor Availability. Спрос на труд берётся при неурезанном выпуске через деление наблюдаемого requirement на availability и сглаживается 10-дневным STOCK-сигналом.

Числовые старые ветви Wage и внешнего demand не встраиваются литералами в `IfThenElse`: они вынесены в именованные `X Initial Wage` / `X External …`, поэтому A/B-формулы остаются зеркальными. При strip эти ссылки восстанавливаются обратно в прежние числовые значения.

## Отличия

От reference-прототипа для fixture отличий в порядке, формулах, стартовых значениях и ожидаемом раскрытии нет. Генератор дополнительно реализует строгую декларативную схему и допускает формульный старый demand-target: в таком случае отдельный `External …` не создаётся, а old branch сохраняет исходную формулу. Fixture задачи использует числовые demand-target и должна совпасть с reference точно.

## Ограничения

Household-income demand намеренно не добавлен — он отложен до финансового слоя. Модельные данные и accepted validation/policy не изменяются.
