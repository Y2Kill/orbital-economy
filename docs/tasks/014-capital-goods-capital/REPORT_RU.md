# Отчёт кандидата — задача 014, v7.7.4 Capital Goods Capital

## Журнал

Работа начата с `main@6daeb43b930a6db56ae11d479c101d26d761e485`. Ветка `task/014-capital-goods-capital` создана от этой же головы; предыдущей ветки и журнала не было.

Первый candidate r1 собран как структурная поставка для КТ1/КТ2. Числовые ожидания `[calib]` в Modes 36–37 представлены диагностическими зондами с заведомо невозможными порогами: их цель — получить фактические значения первого `candidate.yml`, после чего заменить их округлёнными порогами с запасом согласно test plan. Owner-rules в change-policy не ослаблялись; `validation_sha256` намеренно остаётся непривязанным до PASS калиброванной validation.

## Реализация кандидата

Патч следует исчерпывающему списку V7_7_4_ARCHITECTURE_SPEC.md: 76 новых элементов, 7 замен формул, 138 новых LINK, 36 legacy-сценариев с `Capital Goods Capital Enabled = 0` и два новых Mode 36–37.

Ключевая причинностная развязка соблюдена: `X Capital Goods Plant Required Active Capacity` читает только новый сток `X Capital Goods Demand Signal`, а не мгновенный спрос и не `X Desired Capital Goods Production`. Сигнал имеет время подстройки 3 дня и начальное значение 0.13; завод — kernel-v2, `switch_gated: false`, без `finance_limited_construction`.

## Замечания и неясности

На старте противоречий между TASK_RU.md, V7_7_4_ARCHITECTURE_SPEC.md, V7_7_4_TEST_PLAN.md, CAPITAL_LIFECYCLE_KERNEL_SPEC.md и CONTRACTOR_DELIVERY_CONTRACT_RU.md не обнаружено. Требование о demand-signal трактуется буквально во всех комбинациях переключателей: мгновенный Capital Goods Demand не используется для Required Active Capacity.

## Что не запускалось локально

У агента нет локального checkout/Node-стенда. Локально не запускались `check_branch`, bench/selftests, `APPLY_PATCH`, `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT`, `RUN_LAB`, `CHECK_CANDIDATE`, `candidate.yml` и канонический Windows-прогон. Это заменяется чтением accepted-модели и контрактов, статической сборкой/проверкой патча и GitHub Actions по §9.4. `SHA256SUMS` не пересобираются, поскольку `sums_by: reviewer`.
