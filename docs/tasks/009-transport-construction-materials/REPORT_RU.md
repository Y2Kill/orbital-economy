# Отчёт кандидата — задача 009, v7.7.1 Transport on Construction Materials

## Журнал

Работа начата с `main@ae7005158f8b9f6a9991064f74513e0da9b7e576`. Контрольные точки пока не закрыты.

### КТ1 — 2026-09-26 12:25 EEST — patch/conformance/audit PASS

Сделано: candidate r1 применился к accepted v7.7 r1; conformance и structure audit прошли без ошибок. Структурный объём кандидата соответствует skeleton-спецификации: 12 новых элементов, 4 замены формул, 33 LINK, 30 legacy-сценариев с явным switch-off и 2 новых Mode.

Доказательство:
- Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36232699114.
- `Gate 1 - apply-patch` — **success**.
- `Gate 2 - conformance` — **success**.
- `Gate 3 - audit` — **success**.
- Коммит кандидата: `5e15ca433d5784956f17f2d225eabf2a25d9d500`.

Не подтвердилось:
- Структурных ошибок, нарушений conformance или audit на первом кандидате не обнаружено.
- Полный лог job на момент закрытия КТ1 ещё не завершён, поэтому числовые audit-выдержки будут добавлены только если понадобятся в следующих КТ; статус трёх гейтов уже финальный `success`.

Дальше: дождаться полного первого candidate-run и проверить comparator/policy для Modes 0–29 (КТ2), затем использовать intentional calibration probes Modes 30–31 для порогов КТ3.


### КТ2 — 2026-09-26 12:42 EEST — Modes 0–29 воспроизводятся точно, неожиданных policy-событий нет

Доказательство — первый полный candidate run: https://github.com/Y2Kill/orbital-economy/actions/runs/36232699114.

- Comparator дал для **каждого** Mode 0–29: `common=1070, changed=0, added=12, removed=0, maxAbs=0`; проверены все 30 Mode без пропусков.
- `COMPARISON RESULT: OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED` — ожидаемо: legacy outputs идентичны, сценарии получили только явный `Transport Construction Materials Enabled = 0`.
- Policy наблюдает 441 изменение; `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`.
- `Hard blockers=2` относятся только к новым Modes 30 и 31, где intentional `[calib probe]` делает candidate validation FAIL.
- Дополнительные статические данные того же run: `CONFORMANCE RESULT: PASS`, 7/7 instances с допустимой variation; `STRUCTURE AUDIT RESULT: PASS`, open boundaries 122/153, `unclassified=0`, `closed-world violations=0`, transformation pairs 15, `unpaired=0`, colony symmetry `mismatches=0`.

Не подтвердилось:
- Не обнаружено ни одного изменения legacy-series, требующего расширения owner policy.
- Первый общий POLICY FAIL не является policy-дрейфом: все четыре счётчика нарушений нулевые; причина — два hard blocker от ожидаемо падающих новых Mode.

Дальше: заменить три `[calib probe]` содержательными порогами с запасом по измеренным значениям первого run и добиться validation PASS 32/32 (КТ3).

## Реализация кандидата

Candidate r1 следует исчерпывающей спецификации: shared Transport получает второй физический ресурс — Construction Materials — по дословной схеме принятого Transport Capital Goods: половинное планирование спроса по A/B, фактическое списание пропорционально текущим региональным запасам.

Структурная самопроверка перед первым push: **12 новых элементов, 4 replace-formulas, 33 новых LINK, 30 scenario switch-off изменений и 2 новых Modes**. `old`-ветки трёх изменяемых экономических формул извлечены дословно из accepted v7.7 r1; `Test 2 Transport Surge Active` расширен только веткой Mode 31.

Первая validation сохраняет draft/accepted v7.7 без ослабления, добавляет switch-off проверки Modes 0–29, тождества Modes 30–31 и три намеренно невозможных `[calib probe]`: Mode 30 Transport CM fulfillment; Mode 31 B Construction Materials Production; Mode 31 B Construction Materials Fulfillment. Пороговые значения будут выбраны только после первого полного `candidate.yml` по контракту §8.

## Отклонения от спецификации

На старте отклонений нет. В Mode 31 для требования «B строит Refinery или Power» executable-проверка использует `B Power Generation Expansion > 0`; skeleton спецификации подтверждает этот путь (≈0.45/день), поэтому это более конкретная, не более слабая проверка исходного дизъюнкта.

## Калибровка

Ожидается первый полный Linux-run. Константа `Transport Construction Materials per Capacity = 3` оставлена ровно на skeleton-значении владельца; до измерения не корректируется.

## Известные ограничения

- Mode 30 не требует производства Construction Materials в B: по спецификации ей хватает стартового запаса.
- Energy, торговля Construction Materials и lifecycle новых секторов остаются вне v7.7.1.
- Канонические числовые значения снимаются reviewer на Windows; Linux CI используется для гейтов и калибровочных ориентиров, не для бит-в-бит эталона.

## Что не запускалось локально

У агента нет локального checkout/Node-стенда. Локально не запускались `check_branch`, bench/selftests, `candidate.yml` и канонический Windows-прогон; это заменяется GitHub Actions по §9.4. SHA256SUMS не пересобираются, поскольку `sums_by: reviewer`.
