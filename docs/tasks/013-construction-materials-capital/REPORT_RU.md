# Отчёт кандидата — задача 013, v7.7.3 Construction Materials Capital

## Журнал

Работа начата с `main@a897247a0d044a1b1f0b746ad76929e6e989b5b2`. Ветка `task/013-construction-materials-capital` создана от этой же головы; предыдущей ветки и журнала не было.

Первый candidate r1 собран как структурная поставка КТ1. Числовые ожидания `[calib]` в Modes 34–35 пока представлены диагностическими зондами с заведомо невозможными порогами: их единственная цель — получить фактические значения первого `candidate.yml`, после чего выставить округлённые пороги с запасом согласно test plan.

## Реализация кандидата

Патч следует исчерпывающему списку V7_7_3_ARCHITECTURE_SPEC.md: 69 новых элементов, 7 замен формул, 126 новых LINK, 34 legacy-сценария с `Construction Materials Capital Enabled = 0` и два новых Mode 34–35.

Ключевая причинностная развязка соблюдена: `X Construction Materials Plant Required Active Capacity` читает `X Construction Materials Demand Signal`, а не мгновенный спрос и не план выпуска. Завод — kernel-v2, `switch_gated: false`, без `finance_limited_construction`; собственный switch гейтит только новое расширение/его физические расходы и fallback изменяемых accepted-формул.

## Замечания и неясности

На старте противоречий между TASK_RU.md, архитектурной спецификацией, test plan и kernel-контрактом не обнаружено. Особое требование §1 о причинности трактуется буквально: demand-signal stock является единственным входом в Required Active, чтобы исключить петлю CM Demand → plan → required plant → desired expansion → CM Demand во всех комбинациях переключателей, а не только в имеющихся Modes.

## Что не запускалось локально

У агента нет локального checkout/Node-стенда. Локально не запускались `check_branch`, bench/selftests, `APPLY_PATCH`, `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT`, `RUN_LAB`, `CHECK_CANDIDATE`, `candidate.yml` и канонический Windows-прогон. Это заменяется чтением accepted-модели и кода/контрактов, статической проверкой структуры патча и GitHub Actions по §9.4. `SHA256SUMS` не пересобираются, поскольку `sums_by: reviewer`.
