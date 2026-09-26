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


### КТ3 — 2026-09-26 13:00 EEST — validation PASS 32/32, B производит стройматериалы в Mode 31

Сделано: три intentional `[calib probe]` первого run заменены округлёнными содержательными порогами с запасом; модельные константы не менялись. Validation r2 проверяет все прежние условия, switch-off 0–29, тождества 30–31 и сценарное поведение.

Доказательство:
- Candidate acceptance run: https://github.com/Y2Kill/orbital-economy/actions/runs/36233604832.
- `OVERALL: PASS`; в summary `validation | PASS`; пройдены Modes 0–31, то есть validation **32/32**.
- Validation SHA-256: `5aba67ef5ef4b60a095ffe2005112de13cf04feafcdce3fa30ce018016116daa`.
- Mode 31: `B Construction Materials Production > 1.5` — PASS; первый run измерил max `1.85361612493811`.
- Mode 31: `B Regolith Extraction > 0` — PASS.
- Mode 31: `B Power Generation Expansion > 0` — PASS; тем самым выполнен test-plan дизъюнкт «B Refinery или B Power строится».
- Mode 31: `B Construction Materials Fulfillment < 0.95` — PASS; первый run измерил min `0.926415559897726`.
- Проверка порядка — производство B отсутствует до окна и начинается после старта transport surge — PASS.
- Mode 30: обе транспортные CM-ноги работают и fulfillment `>=0.98` — PASS; первый run измерил min `0.990737111465802`.
- Все новые/legacy парные тождества и сумма source shares в Modes 30–31 — PASS.

Не подтвердилось:
- Оснований менять `Transport Construction Materials per Capacity = 3` нет: первый run практически воспроизвёл skeleton-ориентиры спецификации.
- Policy этого run ещё FAIL только из-за непривязанного `validation_sha256`: `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`, `Hard blockers=0`.

Дальше: привязать `change-policy.json.validation_sha256` к SHA validation без изменения rules и добиться 5/5 PASS + зелёного CI (КТ4).

### КТ4 — 2026-09-26 13:18 EEST — поставка полная, candidate 5/5 PASS и CI зелёный

Сделано:
- `change-policy.json.validation_sha256` привязан к финальной validation SHA `5aba67ef5ef4b60a095ffe2005112de13cf04feafcdce3fa30ce018016116daa` отдельным коммитом `580c8f37e933cb1dd84ea80d3db915eed621c862`; rules не менялись.
- Финальная поставка содержит полный candidate r1, validation r2 с калиброванными порогами, owner-policy с привязанной validation и аннотации новых параметров.
- Новых модельных правок после КТ3 не потребовалось.

Доказательство:
- Финальный Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36234471956 — **success**.
- Все пять гейтов: `apply-patch PASS`, `conformance PASS`, `audit PASS`, `validation PASS`, `policy PASS`.
- Candidate SHA-256: `a3c371395bd930a865359da6c8a0a0c8eb6a29736056651492211d4dacc6f60a`.
- Validation SHA-256: `5aba67ef5ef4b60a095ffe2005112de13cf04feafcdce3fa30ce018016116daa`.
- `POLICY RESULT: PASS`: `Observed=441`, `Expected=441`, `Unexpected=0`, `Forbidden=0`, `Threshold exceed=0`, `Required missing=0`, `Hard blockers=0`.
- Итог лога: `All five candidate gates PASS.`
- CI той же головы: https://github.com/Y2Kill/orbital-economy/actions/runs/36234471931 — **success**.

Не подтвердилось:
- После привязки validation SHA не появилось ни одного нового policy-расхождения; предыдущий POLICY FAIL действительно был только следствием непривязанного SHA.
- Дополнительная корректировка калибровки или модельной константы `Transport Construction Materials per Capacity = 3` не потребовалась.

Дальше: поставка задачи 009 завершена со стороны исполнителя. Канонический Windows-прогон и решение о приёмке остаются за reviewer по контракту.

## Реализация кандидата

Candidate r1 следует исчерпывающей спецификации: shared Transport получает второй физический ресурс — Construction Materials — по дословной схеме принятого Transport Capital Goods: половинное планирование спроса по A/B, фактическое списание пропорционально текущим региональным запасам.

Структурная самопроверка перед первым push: **12 новых элементов, 4 replace-formulas, 33 новых LINK, 30 scenario switch-off изменений и 2 новых Modes**. `old`-ветки трёх изменяемых экономических формул извлечены дословно из accepted v7.7 r1; `Test 2 Transport Surge Active` расширен только веткой Mode 31.

Validation сохраняет draft/accepted v7.7 без ослабления. В r1 были добавлены switch-off проверки Modes 0–29, тождества Modes 30–31 и три намеренно невозможных `[calib probe]`; после первого полного прогона они заменены в r2 на обоснованные пороги с запасом. Финальная validation проходит 32/32, включая обязательное производство Construction Materials в B в Mode 31.

## Отклонения от спецификации

Отклонений от спецификации не выявлено. В Mode 31 для требования «B строит Refinery или Power» executable-проверка использует `B Power Generation Expansion > 0`; skeleton спецификации подтверждает этот путь (≈0.45/день), поэтому это более конкретная, не более слабая проверка исходного дизъюнкта.

## Калибровка

Первый полный Linux-run: https://github.com/Y2Kill/orbital-economy/actions/runs/36232699114. Три r1-проверки были намеренно невозможными `[calib probe]`; r2 использует не значения «впритык», а округлённые смысловые границы:

| Проверка | Наблюдение r1 | Порог r2 | Запас / смысл |
|---|---:|---:|---|
| Mode 30 Transport CM fulfillment min | 0.9907371115 | >= 0.98 | ≈0.0107; транспорт остаётся хорошо обеспечен стройматериалами |
| Mode 31 B CM production max [360,720] | 1.8536161249 | > 1.5 | ≈0.3536; явное ненулевое производство B с существенным запасом |
| Mode 31 B CM fulfillment min [360,720] | 0.9264155599 | < 0.95 | ≈0.0236; дефицит как минимум 5%, а не численный шум |

`Transport Construction Materials per Capacity = 3` оставлена ровно на skeleton-значении владельца. Измерения практически совпали с skeleton-ориентирами (≈0.991, ≈1.85, ≈0.93), поэтому оснований подгонять константу нет.

## Известные ограничения

- Mode 30 не требует производства Construction Materials в B: по спецификации ей хватает стартового запаса.
- Energy, торговля Construction Materials и lifecycle новых секторов остаются вне v7.7.1.
- Канонические числовые значения снимаются reviewer на Windows; Linux CI используется для гейтов и калибровочных ориентиров, не для бит-в-бит эталона.

## Итог поставки

Финальная голова кандидата перед отчётным коммитом — `580c8f37e933cb1dd84ea80d3db915eed621c862`. На ней `candidate.yml` полностью зелёный (5/5 PASS, POLICY PASS), `ci.yml` зелёный, validation 32/32, а Modes 0–29 сохраняют accepted v7.7 r1 точно (`changed=0`, `maxAbs=0`). Поставка готова к канонической приёмке reviewer.

## Что не запускалось локально

У агента нет локального checkout/Node-стенда. Локально не запускались `check_branch`, bench/selftests, `candidate.yml` и канонический Windows-прогон; это заменяется GitHub Actions по §9.4. SHA256SUMS не пересобираются, поскольку `sums_by: reviewer`.
