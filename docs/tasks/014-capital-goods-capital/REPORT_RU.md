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

### Ожидаемые прогоны после candidate r1

После push кандидата `e33ff96ebf22998641c28ffc30653d7d9ddd31ab` зафиксированы отдельные запуски:
- Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36329067162 — ожидается результат первого полного candidate.yml; по плану validation/policy могут быть красными только из-за калибровочных зондов и непривязанного validation_sha256.
- CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36329067243 — ожидается общий guard/selftest Linux для этой головы.

Результаты этих запусков будут прочитаны отдельным шагом; длительное ожидание одним вызовом не используется.


## Журнал — продолжение

### КТ1 — закрыта по candidate r1

Проверен завершённый Candidate acceptance run 36329067162 для `e33ff96ebf22998641c28ffc30653d7d9ddd31ab`.

- apply-patch: PASS.
- conformance: PASS; `Instances: 11; conforming=0; with-variation=11; non-conforming=0`.
- `A Capital Goods Plant CONFORMING_WITH_VARIATION (69/69 checks)`.
- `B Capital Goods Plant CONFORMING_WITH_VARIATION (69/69 checks)`.
- structure audit: PASS.
- open boundaries: `154`; unclassified=0; closed-world violations=0.
- P2 capacity: `kernel=11; exceptions=6; undeclared=0`.
- algebraic loops: `switches=10; combinations=1024; with loops=0; Modes=none`.
- candidate SHA-256: `b5c12954861c651d254feeb4b6d8011c9de7b272f4cd21c708cffb0940dcef1d`.
- r1 validation SHA-256: `daa07690459cf51590d7ebd37f0c5884947e50d319cef184654ee8c759633ce1`.

Таким образом требования КТ1 из TASK_RU.md выполнены.

### КТ2 — закрыта по candidate r1

В policy-сравнении Modes 0–35 дали `Output comparison: IDENTICAL` (включая Modes 34–35); для каждого legacy Mode добавленные 76 series не меняют общие accepted series: `changed=0`, `maxAbs=0`. Итог policy r1: `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`; два hard blocker ожидаемы на этой стадии — validation с калибровочными зондами ещё FAIL и validation hash ещё не привязан. Это не маскирует регрессию: неожиданных изменений нет.

CI run 36329094918 для текущей на тот момент головы `1b1e381779a67411caf1b3296c9f6762a3249446` завершён `success`; guard, tools-selftest и bench-selftests PASS, integrity корректно skipped при `sums_by: reviewer`. Старый CI 36329067243 был отменён concurrency после report-only push и не используется как результат.

### Калибровочные значения первого полного прогона

Mode 36:
- A CG Plant Installed Capacity max = `2.08805191453971`;
- A CG Plant Installed Capacity change 0→1080 = `-1.491001998582788`;
- A Capital Goods Production Rate max = `1.74059930593874`;
- B CG Plant Expansion max = `0`.

Mode 37, окно 360→720:
- B CG Plant Expansion max = `0.00885222467202124`;
- B CG Plant Installed Capacity change 360→720 = `0.8803454850179351`;
- B Capital Goods Production Rate max = `1.0179022127517`;
- B Capital Goods Fulfillment min = `0.193467789511843`.

Следующий шаг: заменить только диагностические невозможные пороги округлёнными семантическими порогами с запасом; owner-rules не ослаблять. После нового candidate push отдельно зафиксировать и проверить его run.


### Ожидаемые прогоны после candidate r2

После push калиброванной validation в `3705d16070968d95d0edd70e90b57576745f725d` ожидаются и проверяются отдельными шагами:
- Candidate acceptance run 36330596753 — должен подтвердить validation 38/38 и выдать новый validation SHA-256; policy на этой итерации ожидаемо может оставаться FAIL только из-за ещё не привязанного hash.
- CI run 36330596867 — общий CI для candidate r2.

Пороговые правила owner-policy не менялись; изменение этой итерации ограничено `candidate/validation.json`.
