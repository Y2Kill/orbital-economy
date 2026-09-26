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

Первая поставка использует намеренно невозможные `[calib probe]` только для трёх чисел, которые test plan предписывает определить по первому `candidate.yml`:
- минимум A Construction Materials Energy Fulfillment Ratio в Mode 32;
- терминальная ошибка `|A Construction Materials Demand Signal - A Construction Materials Demand|` в Mode 32;
- минимум B Construction Materials Energy Fulfillment Ratio в окне Mode 33.

После первого полного прогона probes будут заменены округлёнными содержательными порогами с запасом; модельные константы ради прохождения порогов подгоняться не будут.

## Известные ограничения

- В Mode 33 спецификация ожидает, что стройки A в окне стоят; обязательная демонстрация энергетического ограничения поэтому выполняется на B.
- Сигнальные stocks/flows живут и в Modes 0–31, но новый energy switch там явно равен 0, поэтому они не должны влиять на legacy outputs.
- Канонические числовые эталоны снимаются reviewer на Windows; Linux Actions используется для гейтов и калибровочных ориентиров.

## Что не запускалось локально

У агента нет локального checkout/Node-стенда. Локально не запускались `check_branch`, bench/selftests, `APPLY_PATCH`, `LIFECYCLE_CONFORMANCE`, `STRUCTURE_AUDIT`, `RUN_LAB`, `CHECK_CANDIDATE`, `candidate.yml` и канонический Windows-прогон. Это заменяется чтением accepted-модели и кода стенда, статической проверкой структуры патча и GitHub Actions согласно контракту §9.4. `SHA256SUMS` не пересобираются, поскольку `sums_by: reviewer`.
