# Отчёт по заданию 007 — приёмочный цикл кандидата модели в CI

## Журнал

Работа начата с `main@d37bbbe72a44fab720f41a95cfdac28fb245e89f`.

### КТ1 — 2026-09-25 21:53 EEST — workflow запускается, install/apply-patch доказаны

Сделано: добавлены `.github/workflows/candidate.yml` и положительная проба `candidate/model-patch.json`; workflow запустился на push candidate-папки, офлайн-установка зависимостей и `apply-patch` завершились PASS.

Доказательство:
- Candidate acceptance run: https://github.com/Y2Kill/orbital-economy/actions/runs/36174828543
- CI после добавления обязательной документации: https://github.com/Y2Kill/orbital-economy/actions/runs/36174982197 — success.
- Из лога `apply-patch`: `Validation SHA-256: 1970aaea988ece5ba2524e0ca79b68a0c48864c8bf6d7e458c336b718c209ddc`.
- Из того же лога: `Candidate SHA-256: 16e8ca6c5719e67422e16a6ec1ea2724b6121a062200eaf91e81389a2a180cd1` — точно равен accepted model SHA.

Не подтвердилось:
- Изначально документацию планировалось отложить до КТ4, но guard run https://github.com/Y2Kill/orbital-economy/actions/runs/36174828455 показал, что `README.md` и `lab/docs/MODEL_PATCH_RU.md` входят в `required_changes` и должны уже присутствовать в ветке. Исправлено без обхода guard.
- Первая финальная сводка имеет дефект: строки Candidate/Validation SHA пусты из-за backticks в bash. Gate-лог SHA печатает правильно, поэтому КТ1 доказана, но КТ2 до исправления сводки не закрывается.

Дальше: исправить формирование финальной сводки (SHA без shell command substitution), сделать её действительно последним шагом job, затем повторить положительную пробу для КТ2.

### КТ2 — 2026-09-25 22:10 EEST — положительная проба полностью PASS

Сделано: исправлено формирование финальной сводки (SHA больше не интерпретируются shell как command substitution), сводка объединена с финальным verdict в последний содержательный шаг job; положительная проба повторена на всех Modes.

Доказательство:
- Candidate acceptance run: https://github.com/Y2Kill/orbital-economy/actions/runs/36176629922 — success.
- CI того же commit: https://github.com/Y2Kill/orbital-economy/actions/runs/36176629881 — success.
- Финальная сводка:
  - `apply-patch PASS (1s)`
  - `conformance PASS (0s)`
  - `audit PASS (0s)`
  - `validation PASS (259s)`
  - `policy PASS (521s)`
  - `Candidate SHA-256: 16e8ca6c5719e67422e16a6ec1ea2724b6121a062200eaf91e81389a2a180cd1`
  - `Validation SHA-256: 1970aaea988ece5ba2524e0ca79b68a0c48864c8bf6d7e458c336b718c209ddc`
  - `COMPARISON RESULT: BYTE_IDENTICAL`
  - `POLICY RESULT: PASS`
  - `Observed: 0; Expected: 0; Unexpected: 0; Forbidden: 0; Threshold exceed: 0; Required missing: 0; Hard blockers: 0`.
- Полный job от старта workflow до завершения занял примерно 13 мин 15 с; основное время — validation и policy.

Не подтвердилось: дефект первой положительной пробы с пустыми SHA в Markdown-сводке после исправления не воспроизводится. Других расхождений с ожидаемым результатом КТ2 нет.

Дальше: заменить положительную пробу на отрицательную `Power Resource Shock Factor: 0.5 → 0.6`, без собственной policy; проверить, что conformance/audit/validation PASS, а policy FAIL именно на ожидаемых событиях, затем записать КТ3.


### КТ3 — 2026-09-25 22:35 EEST — отрицательная проба отклонена policy как ожидается

Сделано: использован уже запушенный commit `a40bc721951f42565bd72da5eed461447d079954` с единственной заменой `Power Resource Shock Factor: 0.5 → 0.6`, без собственной policy. Повторный запуск отрицательной пробы не выполнялся.

Доказательство:
- Candidate acceptance run: https://github.com/Y2Kill/orbital-economy/actions/runs/36178357637 — итог job **failure**, что является ожидаемым результатом отрицательной пробы.
- CI того же commit: https://github.com/Y2Kill/orbital-economy/actions/runs/36178357463 — **success**.
- Гейты из финальной сводки:
  - `apply-patch PASS (0s)`
  - `conformance PASS (0s)`
  - `audit PASS (1s)`
  - `validation PASS (272s)`
  - `policy FAIL (519s)`
- `Candidate SHA-256: 23f5aeee9937a8598e8c09d9bb02361338dd44570f4d154923e3b9d9c440b457`.
- `Validation SHA-256: 1970aaea988ece5ba2524e0ca79b68a0c48864c8bf6d7e458c336b718c209ddc`.
- `COMPARISON RESULT: DIFFERENT_OUTPUTS`; `POLICY RESULT: FAIL`.
- Счётчики: `Observed: 666; Expected: 0; Unexpected: 666; Forbidden: 0; Threshold exceed: 0; Required missing: 0; Hard blockers: 0`.
- Первое событие сводки: `UNEXPECTED_CHANGE: definition_changed mode=- name=Power Resource Shock Factor`, далее `series_changed` для этой константы по Modes.
- В подробном compare-логе Modes 0–24 и 26 имеют по `changed=1` — только ряд `Power Resource Shock Factor`; Mode 25 имеет `changed=639`, то есть ожидаемые downstream-изменения механики также реально обнаружены.
- Артефакт: https://github.com/Y2Kill/orbital-economy/actions/runs/36178357637/artifacts/10883563431, digest `sha256:46537cfd34c0d63804dc4138f19c6323fee495ded1836d3ea5d790854d3b4b32`.

Не подтвердилось: расхождений с ожидаемым результатом КТ3 нет. В частности, conformance/audit/validation не упали, policy не дала hard blockers и не пропустила незаявленную правку.

Дальше: вернуть `candidate/model-patch.json` к положительной пустой пробе, дождаться зелёных `candidate.yml` и `ci.yml`, завершить документацию/итоговые разделы отчёта и закрыть КТ4.

### КТ4 — 2026-09-25 22:55 EEST — финальная голова снова положительная, candidate.yml и CI зелёные

Сделано: `candidate/model-patch.json` возвращён байт-в-байт к положительной пустой пробе (только `name`, `format`, `base_sha256`). На commit `bca62f2ff23781401879d0fb920b328fe529b9de` завершились оба финальных запуска.

Доказательство:
- Candidate acceptance: https://github.com/Y2Kill/orbital-economy/actions/runs/36181187436 — **success**.
- Обычный CI: https://github.com/Y2Kill/orbital-economy/actions/runs/36181187361 — **success**; `guard`, `tools-selftest`, `bench-selftests` PASS, `integrity` ожидаемо skipped на task-ветке.
- Финальная candidate-сводка:
  - `apply-patch PASS (0s)`
  - `conformance PASS (1s)`
  - `audit PASS (0s)`
  - `validation PASS (261s)`
  - `policy PASS (511s)`
  - `Candidate SHA-256: 16e8ca6c5719e67422e16a6ec1ea2724b6121a062200eaf91e81389a2a180cd1`
  - `Validation SHA-256: 1970aaea988ece5ba2524e0ca79b68a0c48864c8bf6d7e458c336b718c209ddc`
  - `COMPARISON RESULT: BYTE_IDENTICAL`
  - `POLICY RESULT: PASS`
  - `Observed / Expected / Unexpected / Forbidden / Threshold exceed / Required missing / Hard blockers = 0`.
- Артефакт: https://github.com/Y2Kill/orbital-economy/actions/runs/36181187436/artifacts/10883784974, digest `sha256:c1e554480d3110a349efcdabfd71b1e7ff7fc50783bd9a01e16f928a5638cd2d`.
- Candidate run: 19:41:13Z → 19:54:24Z, примерно **13 мин 11 с**. CI: 19:41:13Z → 19:43:15Z, примерно **2 мин 02 с**.

Не подтвердилось: расхождений с ожидаемым результатом КТ4 нет. Отрицательная проба не осталась в финальной поставке; финальный `model-patch.json` снова пустой положительный патч.

Дальше: контрольные точки КТ1–КТ4 закрыты. После этой записи меняется только `REPORT_RU.md`, поэтому `candidate.yml` по своему path-filter повторно запускаться не должен; обычный CI этого journal commit используется как финальная проверка ветки.

## Устройство workflow

`.github/workflows/candidate.yml` имеет два входа:

- push в `task/**`, но только при изменении `docs/tasks/*/candidate/**`;
- `workflow_dispatch` с явным `ref` и `modes` (по умолчанию `all`).

Папка задачи определяется по `NNN` из `task/NNN-name`. Обязателен `candidate/model-patch.json`; при отсутствии собственных `validation.json` и `change-policy.json` workflow использует единственные принятые JSON из корневых `validation/` и `policy/`.

Среда совпадает с остальным CI: `ubuntu-latest`, Node 24.11.1, `contents: read`, без secrets и npm/node_modules cache. `actions/checkout`, `actions/setup-node` и `actions/upload-artifact` закреплены теми же commit SHA, что действующие workflow. Зависимости устанавливаются офлайн из `lab/vendor/simulation-9.0.0.tgz` и `lab/vendor/csv-parse-5.6.0.tgz` через временный npm cache + `npm ci --offline`.

Пять приёмочных гейтов — отдельные steps: `apply-patch`, `conformance`, `audit`, `validation`, `policy`. Каждый сохраняет собственный outcome и время. Gate-steps используют `continue-on-error`, поэтому провал одного не скрывает информацию остальных; финальный step печатает сводку и завершает job с ошибкой, если хоть один gate не PASS. Отрицательная КТ3 доказала, что policy FAIL действительно делает job красным, хотя остальные гейты успевают завершиться.

Сводка содержит SHA кандидата и validation, `COMPARISON RESULT`, `POLICY RESULT`, счётчики Observed / Expected / Unexpected / Forbidden / Threshold exceed / Required missing / Hard blockers и первые failing events; та же сводка записывается в `GITHUB_STEP_SUMMARY`. `lab/output/` всегда загружается артефактом. При `modes != all` вывод явно помечается `DIAGNOSTIC RUN`; строгая policy при неполном покрытии ожидаемо может дать FAIL.

## Время полного запуска

Положительный полный прогон КТ2 (run https://github.com/Y2Kill/orbital-economy/actions/runs/36176629922) занял от создания run до завершения примерно **13 мин 18 с**. В самой сводке гейтов:

- apply-patch — 1 с;
- conformance — 0 с;
- audit — 0 с;
- validation всех 27 Modes — 259 с;
- policy accepted↔candidate по всем 27 Modes — 521 с.

Отрицательный полный прогон КТ3 (run https://github.com/Y2Kill/orbital-economy/actions/runs/36178357637) занял примерно **13 мин 30 с**; validation — 272 с, policy — 519 с.

Финальный положительный прогон КТ4 (run https://github.com/Y2Kill/orbital-economy/actions/runs/36181187436) занял примерно **13 мин 11 с**; validation — 261 с, policy — 511 с. Обычный CI той же головы занял примерно **2 мин 02 с**. Основная стоимость полного candidate-cycle стабильно приходится на два симуляционных этапа: validation и policy.

## Что не запускалось / ограничения среды

Исполнитель работает через GitHub API-коннектор без локального checkout. Локальный `check_branch` и стенд до push не запускались; по контракту §9.4 их заменял обычный CI ветки и собственный candidate workflow. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не изменялись (`sums_by: reviewer`).

Не выполнялась каноническая Windows-приёмка D4 и владельческая D3-проба с намеренно нарушенной validation — это явно оставлено стороне приёмки по заданию. `workflow_dispatch` отдельно не запускался: push-путь полностью проверен КТ1–КТ4; ручной вход будет дополнительно проверен владельцами в D3 после слияния.

Замечание к процессу: `scope.json.required_changes` потребовал README и MODEL_PATCH_RU.md уже на первом guard, поэтому документация была добавлена раньше КТ4. Это не меняет содержание КТ4: на финальной голове документация уже присутствует и проверяется вместе с положительной пробой.

## Итог

Задача 007 со стороны исполнителя завершена: КТ1–КТ4 закрыты доказательствами из GitHub Actions. Реализованный workflow проверен на положительной и отрицательной пробах, не маскирует policy-failure, сохраняет все отчёты и возвращает финальную ветку к положительному кандидату. Документация в `README.md` и `lab/docs/MODEL_PATCH_RU.md` обновлена. За пределами явно разрешённого scope изменения не вносились; model/validation/policy, `lab/src/`, существующие workflow и SHA256SUMS не изменялись.

Оставшиеся D3 (владельческая validation-failure probe) и D4 (канонический Windows verdict) относятся к стороне приёмки согласно заданию.
