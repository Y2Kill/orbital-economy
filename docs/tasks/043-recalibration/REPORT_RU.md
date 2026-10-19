# Задание 043 — v7.7.18 Recalibration candidate r1

Ветка `task/043-recalibration`, база v7.7.17 r1 (`43625d458d7bfc20e6b3a0868b4f3f2f503f249075e65c7afac9353ddca137c9`).

## Журнал

### Предварительная проверка — 2026-10-19: строгий guard не исполнялся
В начале проверена возможность запуска строгого guard: локального checkout нет; `git ls-remote https://github.com/Y2Kill/orbital-economy.git HEAD` возвращает `Could not resolve host: github.com`. Поэтому строгий `node tools/check_branch.mjs` без `--in-progress` **не исполнен и PASS не заявлен**. Работа идёт по API-исключению контракта §9.4; guard на полноценном checkout остаётся за владельцем.

Ветка создана от `main b92771f1b2f7e004d28fca421a7663a8c6583499`. Изучены TASK, scope, спецификация, исследования, четыре исходных источника. До записи в ветку статически сверены 24 формулы, 64 уникальные связи, 56 изменённых сценариев, Money Enabled в 52–55, validation 60 Modes, `regression_modes=[]`, policy SHA256 validation `79b4ab4f571b4a537f150c229c563779e097bdefa0a91fb0b24387040f660dde`.

### КТ1 — патч поставлен, CI-подтверждение ожидается
В `candidate/model-patch.json` 20 gated формул слоя cost_pricing, 4 опорные константы, 64 связи и изменения Modes 0–55. По предварительному прогону skeleton владельца ожидаются: definition fingerprint `024f99393d36e71e`, conformance/audit PASS, 302 границы, 0 симметрии, 0 петель из 1048576, planet_v1 PASS. **Не зачтена до зелёного candidate.yml.**

### КТ2 — policy поставлена, CI-подтверждение ожидается
В `candidate/change-policy.json` неизменные семь правил owner draft: 56–59 допускают только 8 мёртвых рядов; 0–55 — перекалибровку рядов; требуются 24 определения, сценарные входы, запрещён структурный дрейф. В owner draft проверено 56506 событий, неожиданных 0, POLICY PASS. **Это предварительное доказательство владельца, не зелёный текущий CI; КТ2 не зачтена.**

### КТ3 — validation поставлена, CI-подтверждение ожидается
В `candidate/validation.json` байтовая копия pretested owner draft (LF, trailing LF, `regression_modes=[]`; SHA256 тот же). Известная предварительная проверка skeleton: 60/60 PASS и 29229 проверок. **Это не результат текущего запуска; КТ3 не зачтена.**

Таблица ориентиров из §4 спецификации (`значение → порог → запас`) — значения округлены, относятся к исходному прогону skeleton, **не подменяют фактический результат candidate.yml**. Не все пересмотренные проверки имеют опубликованные наблюдаемые величины, поэтому полную подтверждённую таблицу можно закрыть только по фактическому прогону:

| Mode | Проверка | Значение skeleton ≈ | Порог | Запас ≈ |
|---:|---|---:|---|---:|
| 21 | B CG inventory | 0.551 | min ≥0.5 | +0.051 |
| 22 | A capital goods fulfillment | 0.197 | min ≥0.15 | +0.047 |
| 22 | B unaffected | 0.81 | min ≥0.75 | +0.06 |
| 23 | B capital goods fulfillment | 0.764 | min ≥0.7 | +0.064 |
| 25 | A energy rationing | 394.5 | min ≥350 | +44.5 |
| 31 | B CM before surge | 0.02 | max ≤0.05 | +0.03 |
| 35 | B CM expansion | 0.0039 | max >0.003 | +0.0009 |
| 35 | B CM capacity Δ | 0.49 | Δ >0.4 | +0.09 |
| 37 | B CG expansion | 0.0034 | max >0.0025 | +0.0009 |
| 37 | B CG capacity Δ | 0.47 | Δ >0.4 | +0.07 |
| 38 | A regolith mine Δ | −3.98 | Δ <−3.5 | +0.48 |
| 39 | B regolith mine expansion | 0.025 | max >0.02 | +0.005 |
| 39 | B regolith mine capacity Δ | 3.24 | Δ >2.5 | +0.74 |
| 43 | B power resource inventory | 1908 | min <1950 | +42 |
| 48 | A metal production | 40.68 | mean >39.4 | +1.28 |
| 49 | A food price | 18.57 | max <19.35 | +0.78 |
| 52 | A metal price | 58.84 | mean <63.9 | +5.06 |
| 52 | B household cash | 37537 | min >30000 | +7537 |
| 52 | B trade balance | −37 | last >−120 | +83 |
| 52 | A household cash | 162778 | min >140000 | +22778 |
| 52 | A real wage | 118.4 | mean >115 | +3.4 |
| 52 | B demand/income | 3.40 | last <4 | +0.60 |
| 53 | A labor guard | 0.9986 | min >0.99 | +0.0086 |
| 53 | A labor tightness | 1.0014 | max <1.01 | +0.0086 |
| 53 | B trade balance | −33 | last >−120 | +87 |
| 54 | B ore price | 24.66 | min <24.85 | +0.19 |
| 54 | B food price | 24.20 | max <24.4 | +0.20 |
| 54 | B energy price | 0.658 | min <0.67 | +0.012 |
| 54 | A price | 11.09 | max <11.2 | +0.11 |
| 55 | A metal price peak | 60.30 | max <60.5 | +0.20 |
| 55 | A ore price peak | 11.10 | max >11.05 | +0.05 |

### КТ4 — комплект поставлен, CI-подтверждение ожидается
Четыре артефакта `candidate/` и `REPORT_RU.md` поставлены. **КТ4 не зачтена** без ссылок на зелёные `candidate.yml` 5/5 и `ci.yml`. Если запуски отменятся по времени, записать `CANCELLED`, не `PASS`.

## Устройство

Цены становятся затратными во всех Modes. Расходы увязаны с физическими слоями переключателями gate; в 56–59 все они равны 1. Четыре reference price нормируют ценовой спрос в 54–55. Деньги включены только в полных Modes 52–55 и остаются в существующих 58–59. Сценарные имена, типы и количество элементов не меняются.

## Отличия

- Патч скопирован семантически из skeleton, EOL CRLF нормализованы до LF как у нового файла; имя заменено на `Orbital Economy v7.7.18 Recalibration candidate r1`.
- Валидация скопирована **побайтно**: её поле `name` содержит `draft (owner skeleton)` намеренно, чтобы сохранить проверенный SHA256; проверок за пределами таблицы §4 не меняли.
- Policy: изменено только описательное `name` с DRAFT на candidate r1; структура и правила не менялись.
- Обновлены аннотации ровно пяти ключей с сохранением `since`, флага зеркала и тегов. Других отклонений от спецификации не вводили.

## Ограничения

В этой среде нельзя исполнить локально строгий guard, Node bench, APPLY_PATCH, fingerprint, 60 Modes и Windows приёмку. Их прохождение не заявляется до GitHub Actions и проверки владельца. Не затрагиваются `main`, `model/nodes/*`, `model/`, `validation/`, `policy/`, `tools/`, `.github/`, `SHA256SUMS.txt`. `sums_by: reviewer`; `[skip ci]` не использовать.


## Подтверждение CI — 2026-10-19

Кодовая голова кандидата: `17d7fb5ce65eae079db088989254839f1844e4ff`.

- **Candidate acceptance 39223272345 — SUCCESS:** https://github.com/Y2Kill/orbital-economy/actions/runs/39223272345 . Все 5 шагов зелёные: apply-patch, conformance, audit, validation и policy. Итоговый candidate SHA-256: `80a03e92aeccb9cae033be5eba08e64881002ebc496a6d5197f153760a69b04e`; validation SHA-256: `79b4ab4f571b4a537f150c229c563779e097bdefa0a91fb0b24387040f660dde`.
- **CI 39223272549 — SUCCESS:** https://github.com/Y2Kill/orbital-economy/actions/runs/39223272549 . Зелёные jobs guard, tools-selftest, bench-selftests; node_qa: **87 passed, 0 failed**; остальные selftests и короткий bench (Modes 0,12) — PASS. CI guard: `BRANCH CHECK: PASS (0 fail, 1 warn)`; предупреждение об устаревшем SHA256SUMS допустимо при `sums_by: reviewer` и не означает строгий guard.
- **КТ1:** apply-patch, conformance, audit подтверждены зелёным candidate.yml 39223272345. Из лога: граничных потоков **302**, `symmetry mismatches=0`, `algebraic loops=0/1048576`, `planet_v1=PASS`. Точное значение definition fingerprint `024f99393d36e71e` *не было напечатано CI*; оно подтверждалось предварительным skeleton владельца, но требует отдельной проверки по N1/ревью. Поэтому КТ1 **не отмечается полностью закрытой**.
- **КТ2 — PASS:** зелёный candidate.yml 39223272345; `POLICY RESULT: PASS`, **56506** событий, все **56506** разрешены, **0 unexpected**. В Modes 56–59 при сравнении изменены по **8 рядов**, прочих разрешений policy не добавлялось.
- **КТ3:** зелёный candidate.yml 39223272345; в логе **60 раз** `Candidate validation: PASS`, Modes 0–59, без ошибок. Приложенная выше таблица содержит известные ориентиры из skeleton, но не является полной подтверждённой таблицей всех пересмотренных проверок: КТ3 **по CI подтверждена, а табличная часть ещё не закрыта**.
- **КТ4 — CI-условия PASS:** на кодовом коммите `17d7fb5` candidate.yml **5/5 PASS** (39223272345), ci.yml **SUCCESS** (39223272549). Пять требуемых файлов, включая отчёт, уже присутствовали в этом коммите. Окончательная приёмка остаётся за владельцем (строгий guard, Windows N2, ревью 24 формул/64 связей/сценариев, подтверждение fingerprint и проверка таблицы).
- Отмены по лимиту времени у двух проверенных запусков **не было**. Строгий guard без `--in-progress` в Git checkout агентом не исполнялся; его PASS не заявляется.

Новые изменения в этой записи — только дополнение журнала; рабочие файлы `candidate/` после зелёных проверок не изменялись.
