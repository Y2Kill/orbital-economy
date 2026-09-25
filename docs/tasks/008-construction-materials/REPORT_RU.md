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

## Реализация кандидата

Кандидат r1 следует исчерпывающей спецификации: Regolith → Construction Materials → физическое ограничение расширения Refinery / Electronics / Power через `Min(CG fulfillment, CM fulfillment)`. Transport и энергетический allocator не изменяются. Существующие шесть expansion-FLOW получают только внешний `IfThenElse([Construction Materials Enabled] = 1, new, old-verbatim)`.

Структурная самопроверка при генерации патча: owner-skeleton часть = 64 новых элемента / 128 LINK; test plan дополнительно требует два `X Refinery Construction Materials Expansion Ratio`, поэтому итог = **66 новых элементов / 132 LINK**, 6 replace-formulas, 27 scenario switch-off изменений и 3 новых Modes.

Первая validation намеренно содержит `[calib probe]` с невозможными порогами в Modes 27–29: они нужны, чтобы первый Linux-run напечатал фактические значения. Эти probes не являются приёмочными порогами и будут заменены после наблюдения — контракт §8 п.2.

## Отклонения от спецификации

На старте отклонений нет.

## Калибровка

Пока используются skeleton-значения спецификации. Числовое обоснование каждого `[calib]` будет добавлено после первого `candidate.yml` run; до этого значения не объявляются принятыми.

## Известные ограничения

- B по известной accepted-динамике не строит; проверки требуют покоя B, а не искусственного производства.
- Энергопотребление Construction Materials, межколониальная торговля, lifecycle самого сектора и Transport находятся вне v7.7.
- Денежная стоимость строительства не меняется.

## Что не запускалось локально

Локального git/Node у агента нет. Проверки выполняются через `candidate.yml` и обычный CI; SHA256SUMS не пересобираются (`sums_by: reviewer`).
