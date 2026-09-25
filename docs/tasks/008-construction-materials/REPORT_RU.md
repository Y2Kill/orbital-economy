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
