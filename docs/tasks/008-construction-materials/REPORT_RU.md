# Отчёт кандидата — задача 008, v7.7 Construction Materials

## Журнал

Работа начата с `main@8c45f2649d6620025e8b2abb6f0104e2fc48a92d`. Контрольные точки пока не закрыты.

### КТ1 — 2026-09-26 00:19 EEST — патч применён, conformance и audit PASS

Сделано: candidate r1 собран строго из v7.7 spec: owner-skeleton часть 64 элемента / 128 LINK; два обязательных test-plan diagnostic ratio дают итог 66 новых элементов / 132 LINK. Существующие шесть expansion-FLOW изменены только внешним `IfThenElse([Construction Materials Enabled] = 1, new, old-verbatim)`.

Доказательство:
- Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36190086944.
- Обычный CI той же головы: https://github.com/Y2Kill/orbital-economy/actions/runs/36190086949 — **success**.
- `apply-patch` PASS; candidate SHA-256 `fe9f0f4a8cd82da0d6bac0598008f91a6605eb1f36ee2626c854d9cd2d9dd201`.
- validation SHA-256 первого раунда: `e037e767c1e1062a45dc4ac9d90f0b26809c8dfa20ff9cf0477b50fa2aaa183e`.
- `Lifecycle kernel conformance: PASS`; `CONFORMANCE RESULT: PASS`.
- `STRUCTURE AUDIT RESULT: PASS`.
- open boundaries: `120 of 151`, `unclassified=0`, `closed-world violations=0`.
- transformation pairs: `15`, `unpaired=0`.
- colony symmetry A↔B: `mismatches=0`, `exceptions=0`.

Не подтвердилось / ожидаемые отрицательные результаты:
- Первый validation содержит намеренно невозможные `[calib probe]` пороги; `OVERALL: FAIL` в этом раунде запланирован и используется для измерения, а не маскируется.
- Draft policy пока содержит placeholder `validation_sha256`; policy итогово FAIL с `Hard blockers: 3`, при этом `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`. До КТ2/КТ3 hard blockers будут разобраны и SHA policy будет привязан к финализируемой validation.

Дальше: зафиксировать КТ2 по compare/policy части этого же запуска (Modes 0–26), затем заменить calibration probes содержательными порогами по измеренным значениям и финализировать validation/policy для КТ3.

### КТ2 — 2026-09-26 00:22 EEST — Modes 0–26 воспроизводятся точно, неожиданных событий нет

Доказательство — тот же полный candidate run: https://github.com/Y2Kill/orbital-economy/actions/runs/36190086944.

- Comparator последовательно прогнал Modes 0–26; **каждый** дал `common=1004, changed=0, added=66, removed=0, maxAbs=0`.
- Это подтверждает требование спецификации: при `Construction Materials Enabled = 0` старые 1004 ряда v7.6.1 r1 не меняются; 66 новых рядов только добавлены.
- Итог policy-счётчиков первого раунда: `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`.
- `COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED` — ожидаемо: значения legacy outputs идентичны, но сценарии 0–26 получили новый выключенный switch, а Modes 27–29 добавлены.

Не подтвердилось / почему общий policy пока FAIL:
- `Hard blockers: 3` соответствуют Modes 27, 28, 29: `comparisonHardBlockers()` создаёт по blocker на Mode с `candidateValidation.status = FAIL`; эти три Mode намеренно содержат calibration probes первого раунда.
- `change-policy.json` r1 всё ещё содержит временный placeholder `validation_sha256`; он будет заменён SHA финальной validation, без расширения allow-rules.
- Неожиданных модельных событий policy не нашла; owner-draft rules расширять постфактум не требуется.

Дальше: заменить `[calib probe]` на содержательные пороги по значениям первого прогона, добавить проверки порядка событий и зафиксировать числовую калибровку; затем обновить `validation_sha256` policy и добиться validation PASS 30/30 (КТ3).

### КТ3 — 2026-09-26 00:30 EEST — validation PASS 30/30 после калибровки

Сделано: невозможные `[calib probe]` первого раунда заменены содержательными порогами по фактически измеренным значениям; добавлены проверки восстановления/event-order и явное доказательство сырьевого ограничения Mode 29 (production capacity остаётся 3, production rate < 1). Константы модели не подгонялись: оставлены skeleton-значения владельца.

Доказательство:
- Candidate acceptance run: https://github.com/Y2Kill/orbital-economy/actions/runs/36191322586.
- На момент закрытия КТ3 шаг `Gate 4 - validation` завершён **success**; проверены все Modes 0–29, то есть validation PASS 30/30. Policy того же run ещё выполняется и к КТ3 не относится.
- Обычный CI этой головы: https://github.com/Y2Kill/orbital-economy/actions/runs/36191322568 — **success**.
- Таблица `проверка → наблюдение r1 → порог r2 → запас` приведена ниже в разделе «Калибровка»; источник чисел — первый run 36190086944.
- Mode 27: A fulfillment 0.966918 → floor 0.94.
- Mode 28: A fulfillment/Refinery ratio 0.360445 → <0.50; CG fulfillment 0.968430 → >=0.95; recovery@900 0.967178 → >=0.94.
- Mode 29: Regolith min 0.871627 → <5; CM fulfillment min 0.475198 → <0.60; CM production-rate max 0.706065 при неизменной capacity=3 → <1.0; recovery@900 0.967141 → >=0.94.
- B idle fulfillment наблюдался 0.999999999966667; тест использует `>= 0.999999999`, то есть именно `1 - epsilon` из test plan, а не ложное точное равенство.

Не подтвердилось:
- Первоначальная r1-проверка `B fulfillment >= 1` оказалась численно слишком строгой из-за floating-point (`0.999999999966667`). Это не изменение поведения B; порог исправлен на спецификационную форму `1 - ε` с ε=1e-9.
- Других гипотез test plan после калибровки не пришлось отбрасывать: весь validation 30/30 PASS.

Дальше: получить SHA этой финализированной validation из завершившегося candidate-run, привязать его в `change-policy.json` без расширения allow-rules и добиться финальной головы с пятью PASS + POLICY PASS (КТ4).

### КТ4 — 2026-09-26 01:06 EEST — поставка полная, все candidate-гейты и CI зелёные

Сделано:
- В `candidate/change-policy.json` заменён только placeholder `validation_sha256` на `954b6b4d1bdaa198c7eed5e34ba9e7d3d39ad23d77cfe27b884962af73e54a42`; правила policy не менялись.
- Финальные candidate-артефакты, validation r2 и аннотации оставлены без иных изменений.
- Раздел «Что не запускалось локально» дополнен фактическими ограничениями среды и заменяющими CI-проверками.

Доказательство:
- Финальный Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36194034844 — **success**.
- Все пять гейтов: `apply-patch PASS`, `conformance PASS`, `audit PASS`, `validation PASS`, `policy PASS`.
- Candidate SHA-256: `fe9f0f4a8cd82da0d6bac0598008f91a6605eb1f36ee2626c854d9cd2d9dd201`.
- Validation SHA-256: `954b6b4d1bdaa198c7eed5e34ba9e7d3d39ad23d77cfe27b884962af73e54a42`.
- Policy: `Observed=2016`, `Expected=2016`, `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`, `Hard blockers=0`.
- Итог лога: `All five candidate gates PASS.`
- CI для той же головы с привязкой policy: https://github.com/Y2Kill/orbital-economy/actions/runs/36194034800 — **success**.

Не подтвердилось:
- После привязки validation SHA никаких дополнительных policy-расхождений не появилось; прежний FAIL действительно был только следствием placeholder-привязки.

Дальше: поставка КТ4 завершена; канонический Windows-прогон и решение о приёмке остаются за reviewer по контракту.

## Реализация кандидата

Кандидат r1 следует исчерпывающей спецификации: Regolith → Construction Materials → физическое ограничение расширения Refinery / Electronics / Power через `Min(CG fulfillment, CM fulfillment)`. Transport и энергетический allocator не изменяются. Существующие шесть expansion-FLOW получают только внешний `IfThenElse([Construction Materials Enabled] = 1, new, old-verbatim)`.

Структурная самопроверка при генерации патча: owner-skeleton часть = 64 новых элемента / 128 LINK; test plan дополнительно требует два `X Refinery Construction Materials Expansion Ratio`, поэтому итог = **66 новых элементов / 132 LINK**, 6 replace-formulas, 27 scenario switch-off изменений и 3 новых Modes.

Первая validation намеренно содержит `[calib probe]` с невозможными порогами в Modes 27–29: они нужны, чтобы первый Linux-run напечатал фактические значения. Эти probes не являются приёмочными порогами и будут заменены после наблюдения — контракт §8 п.2.

## Отклонения от спецификации

На старте отклонений нет.

## Калибровка

Первый полный Linux-run: https://github.com/Y2Kill/orbital-economy/actions/runs/36190086944. Пороговые проверки r1 были намеренно невозможными `[calib probe]`; стенд напечатал наблюдаемые значения. r2 использует не значения «впритык», а округлённые содержательные границы:

| Проверка | Наблюдение r1 | Порог r2 | Запас / смысл |
|---|---:|---:|---|
| Mode 27 A CM fulfillment min [200,1080] | 0.966918 | >= 0.94 | 0.0269; спокойная механика не душит стройку |
| Mode 28 A CM fulfillment min [360,720] | 0.360445 | < 0.50 | 0.1396; shock явно связывает |
| Mode 28 A refinery expansion ratio min | 0.360445 | < 0.50 | 0.1396; стройка тормозится CM |
| Mode 28 A CG fulfillment min | 0.968430 | >= 0.95 | 0.0184; CG не причина торможения |
| Mode 28 A CM fulfillment @900 | 0.967178 | >= 0.94 | 0.0272; восстановление после shock |
| Mode 29 A Regolith inventory min | 0.871627 | < 5 | большой запас от initial 40; сырьё почти исчерпано |
| Mode 29 A CM fulfillment min | 0.475198 | < 0.60 | 0.1248; сырьевой shock связывает |
| Mode 29 A CM production-rate max [360,720] | 0.706065 | < 1.0 | при capacity ровно 3; доказывает raw-material limitation |
| Mode 29 A CM fulfillment @900 | 0.967141 | >= 0.94 | 0.0271; восстановление |
| B CM fulfillment min Modes 27–29 | 0.999999999966667 | >= 0.999999999 | epsilon по test plan; B остаётся в покое |

[calib] константы модели пока оставлены ровно на skeleton-значениях владельца: Regolith/unit=2; initial inventories=40/30; extraction capacity A/B=7/5; CM production capacity A/B=3/2; CM-per-capacity 20/12/1; shock multipliers=0.1. Первый прогон воспроизвёл ориентиры skeleton практически буквально (0.967 / 0.360 / 0.475), поэтому оснований менять эти константы нет.

## Известные ограничения

- B по известной accepted-динамике не строит; проверки требуют покоя B, а не искусственного производства.
- Энергопотребление Construction Materials, межколониальная торговля, lifecycle самого сектора и Transport находятся вне v7.7.
- Денежная стоимость строительства не меняется.

## Что не запускалось локально

Локального git/Node у агента нет. Проверки выполняются через `candidate.yml` и обычный CI; SHA256SUMS не пересобираются (`sums_by: reviewer`).

Локально не запускались:
- `node tools/check_branch.mjs`, bench/selftests и полный стенд — вместо этого использованы GitHub Actions: финальный `candidate.yml` https://github.com/Y2Kill/orbital-economy/actions/runs/36194034844 и `ci.yml` https://github.com/Y2Kill/orbital-economy/actions/runs/36194034800;
- канонический Windows x64 прогон — Linux CI используется только для совпадающих вердиктов гейтов, без заявления о бит-в-бит совпадении чисел;
- пересборка `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` — намеренно не выполнялась, так как для задачи установлен `sums_by: reviewer`.

Непроверенное локально не выдаётся за локально проверенное; финальная каноническая приёмка остаётся за reviewer.
