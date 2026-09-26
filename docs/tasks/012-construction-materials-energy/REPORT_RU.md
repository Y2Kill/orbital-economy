# Отчёт кандидата — задача 012, v7.7.2 Construction Materials use Energy

## Журнал

Работа начата с `main@ebee3cf7435887fe6c30f921390561d9e91d7b33`. Ветка `task/012-construction-materials-energy` создана от этой же головы; предыдущего журнала в ветке не было. Контрольные точки пока не закрыты.

### КТ1 — 2026-09-27 01:25 EEST — patch/conformance/audit PASS

Сделано: candidate r1 применился к accepted v7.7.1 r1; conformance и structure audit прошли. Структурный объём совпал с исчерпывающей спецификацией: 17 новых элементов, 9 замен формул, 58 LINK, явный switch-off в Modes 0–31 и два новых Mode 32–33.

Доказательство — первый полный Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36275212947, кандидат-коммит `8c7fb46c8fa2500c9a052a4920baa8b6854dca3f`.
- `Gate 1 - apply-patch` — PASS.
- `Gate 2 - conformance` — PASS.
- `Gate 3 - audit` — PASS.
- Audit: `open boundaries: 126 of 157`, `unclassified=0`, `closed-world violations=0`, transformation pairs=15, `unpaired=0`.
- Planet closure: `P3 energy: requests=6; producer=2; exceptions=9; undeclared=0`; итоговая строка `P3=6/2/9/0`.
- Loop audit: `switches=8; combinations=256; with loops=0; Modes=none`.
- `STRUCTURE AUDIT RESULT: PASS`.

Не подтвердилось:
- Не обнаружено структурной петли, которую должна была предотвращать схема с `X Construction Materials Demand Signal`.
- Не обнаружено незаявленных границ или нарушений closed-world/Planet closure.
- Общий r1 run ожидаемо не является финальным PASS: три намеренных `[calib probe]` дают validation FAIL, после чего policy имеет два hard blocker от Modes 32–33. Это не относится к КТ1.

Дальше: зафиксировать КТ2 по уже завершившемуся comparator/policy для Modes 0–31, затем заменить `[calib probe]` измеренными порогами с запасом для КТ3.



### КТ2 — 2026-09-27 01:26 EEST — Modes 0–31 воспроизводятся точно, неожиданных policy-событий нет

Доказательство — тот же первый полный Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36275212947.

- Comparator для каждого Mode 0–31: `common=1082, changed=0, added=17, removed=0, maxAbs=0`.
- Все 32 legacy Mode дают `Output comparison: IDENTICAL`.
- Итог comparator: `COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED` — ожидаемо, потому что в legacy-сценарии добавлен только явный `Construction Materials Energy Enabled = 0`.
- Policy: `Observed changes=662`, `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`.
- Два `Hard blockers` относятся только к ожидаемо падающим калибровочным проверкам новых Modes 32 и 33; сами Modes 0–31 прошли candidate validation PASS.
- Параллельный CI первого candidate-коммита https://github.com/Y2Kill/orbital-economy/actions/runs/36275212946 — guard, tools-selftest и bench-selftests PASS.

Не подтвердилось:
- Ни одной legacy-series, требующей расширения owner policy, не найдено.
- Новый signal-stock не изменяет accepted outputs при switch-off: его наличие добавляет 17 новых series, но общие 1082 series в каждом legacy Mode совпадают точно.

Дальше: калибровать только три заранее объявленных `[calib]` ожидания по первому Linux-run, не меняя модельные константы.

### КТ3 — 2026-09-27 01:48 EEST — validation PASS 34/34, энергетическое ограничение Construction Materials подтверждено

Сделано: три r1 `[calib probe]` заменены на округлённые пороги с запасом; модельные формулы и константы не менялись. Validation r2 проверяет все legacy Modes 0–31 и новые Modes 32–33.

Доказательство — Candidate acceptance r2: https://github.com/Y2Kill/orbital-economy/actions/runs/36276471073, commit `502fdf2cd9b1ab847f196f3660879be971ecb58e`.
- `OVERALL: PASS`; summary: `validation | PASS`; пройдены все 34 Mode.
- Validation SHA-256: `0a61e3cffedcb9b2ded506f321526221e52d315dc7afe38dbdf91177883c4f54`.
- Candidate SHA-256 неизменён относительно r1: `a993dbb5966eebc36c1a7a4a468c1debf0dcecbaba5012a08b8e246889042795`.
- Mode 32: requested-energy identity, allocated-energy/actual-production consequence, `actual <= pre-energy plan`, Regolith pair identity — PASS для A и B; A requests energy — PASS; A fulfillment `<0.95` — PASS; terminal signal tracking error `<=0.002` — PASS.
- Mode 33: те же энергетические/материальные инварианты — PASS; B requests energy — PASS; B CM energy fulfillment `<0.80` — PASS; B CM production active — PASS; B Power Generation Expansion active — PASS.
- Mode 33: отсутствие B energy-scarcity до shock — PASS; event-order `capacity shock -> B Construction Materials energy scarcity` — PASS.
- Policy/comparator той же итерации снова подтверждает Modes 0–31 точно: `common=1082, changed=0, added=17, removed=0, maxAbs=0`; `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`, `Hard blockers=0`.

Не подтвердилось:
- Не понадобилась подгонка `Construction Materials Energy per Unit=10`, signal adjustment time=3 или начальных signals=0.14.
- Policy r2 ещё FAIL, но не из-за содержательного расхождения: финальная validation имеет новый SHA, который ещё не записан в `change-policy.json.validation_sha256`. Это последний ожидаемый технический шаг перед КТ4.

Дальше: привязать owner policy к финальному SHA validation без изменения rules и получить финальный candidate 5/5 PASS + зелёный CI.

## Реализация кандидата

Candidate r1 следует исчерпывающей спецификации: переработка реголита в Construction Materials становится третьим потребителем общего энергетического аллокатора колонии, а план, питающий запрос энергии, читает сглаженный сток `X Construction Materials Demand Signal`, а не мгновенный спрос.

Статическая самопроверка перед первым push: **17 новых элементов, 9 замен формул, 58 новых LINK, 32 legacy-сценария с явным `Construction Materials Energy Enabled = 0` и 2 новых Mode**. Новые имена не пересекаются с accepted v7.7.1 r1; среди 58 LINK нет ни дубликатов существующих LINK, ни внутренних дублей, все endpoints существуют или добавляются тем же патчем.

Старые ветки изменяемых формул извлечены дословно из accepted v7.7.1 r1. `X Pre Energy Construction Materials Production Rate` также получает дословную прежнюю формулу `X Construction Materials Production Rate`.

## Замечания к исполнимости test plan

В `V7_7_2_TEST_PLAN.md` §3 требуются два построчных нелинейных тождества: `Production Rate = Pre Energy Rate × CM Energy Fulfillment Ratio` и `Allocated Energy = Requested Energy × Energy Fulfillment Ratio`. Текущий общий DSL validation поддерживает линейный `identity` и двухрядный `relation`, но не произведение двух временных рядов. Расширение стенда находится вне scope задачи 012, поэтому это ограничение не обходится молча.

В candidate r1:
- обе требуемые нелинейные зависимости записаны **буквально** в формулах `model-patch.json`; их ссылки проверяются conformance/audit;
- исполнимо проверяется точное `Requested Energy = 10 × Pre Energy Production Rate`;
- исполнимо проверяется точное линейное следствие `Allocated Energy = 10 × Actual Production Rate`, которое следует из обеих продуктовых формул при `Construction Materials Energy per Unit = 10` и остаётся истинным при нулевом запросе;
- отдельно проверяется `Actual Production Rate <= Pre Energy Production Rate`;
- `energy_balance` проверяет третьего потребителя, `allocated <= requested`, сумму allocations и энергетический баланс;
- пара Regolith → Construction Materials остаётся точным тождеством.

Если приёмка требует именно общего построчного product-check независимо от буквальной формулы модели, для этого нужен новый тип validation-check/plugin за пределами разрешённого scope; кандидат самовольно стенд не расширяет.

## Калибровка

Первый полный Linux-run: https://github.com/Y2Kill/orbital-economy/actions/runs/36275212947. Три заранее объявленных r1 `[calib probe]` дали измерения, после чего validation r2 использует округлённые смысловые границы с запасом; модельные константы не менялись.

| Проверка | Наблюдение r1 | Порог r2 | Запас / смысл |
|---|---:|---:|---|
| Mode 32 A CM energy fulfillment min | 0.9263883515 | < 0.95 | ≈0.0236; фиксирует минимум 5% энергетического дефицита |
| Mode 32 terminal \|A signal − A demand\| | 0.0008954554 | <= 0.002 | >2× наблюдаемой ошибки; проверяет фактическое слежение, не численный ноль |
| Mode 33 B CM energy fulfillment min [360,720] | 0.7147017290 | < 0.80 | ≈0.0853; фиксирует минимум 20% дефицита в shock-window |

Наблюдения практически совпадают с owner skeleton (≈0.926 и ≈0.715), поэтому оснований менять `Construction Materials Energy per Unit = 10`, signal adjustment time или начальные signal stocks нет.

## Известные ограничения

- В Mode 33 спецификация ожидает, что стройки A в окне стоят; обязательная демонстрация энергетического ограничения поэтому выполняется на B.
- Сигнальные stocks/flows живут и в Modes 0–31, но новый energy switch там явно равен 0, поэтому они не должны влиять на legacy outputs.
- Канонические числовые эталоны снимаются reviewer на Windows; Linux Actions используется для гейтов и калибровочных ориентиров.

## Что не запускалось локально

У агента нет локального checkout/Node-стенда. Локально не запускались `check_branch`, bench/selftests, `APPLY_PATCH`, `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT`, `RUN_LAB`, `CHECK_CANDIDATE`, `candidate.yml` и канонический Windows-прогон. Это заменяется чтением accepted-модели и кода стенда, статической проверкой структуры патча и GitHub Actions согласно контракту §9.4. `SHA256SUMS` не пересобираются, поскольку `sums_by: reviewer`.
