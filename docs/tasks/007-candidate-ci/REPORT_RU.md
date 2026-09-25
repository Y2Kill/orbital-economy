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

## Устройство workflow

Будет заполнено после КТ2–КТ4 по фактическим запускам.

## Время полного запуска

Будет заполнено по фактическим логам Actions.

## Что не запускалось / ограничения среды

Исполнитель работает через GitHub API-коннектор без локального checkout. Локальный `check_branch` и стенд до push не запускались; по контракту §9.4 их заменяет CI ветки. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не изменяются (`sums_by: reviewer`).
