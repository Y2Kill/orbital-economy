# Статус проверок Orbital Economy Lab v0.9.4 — baseline v7.7 r1

## Принятая основа

- Модель: **Orbital Economy v7.7 r1 — Construction Materials** — ACCEPTED 2026-09-26.
- SHA-256: `5bbc29b6e18caa64ec22267892b6cd0669649722c8fc029d8dba43a77a34d5a1`.
- Validation: `validation/validation-v7.7.json`.
- Policy: `policy/change-policy-v7.7-strict.json` (default deny, rules: []).
- Engine: `simulation@9.0.0` pinned; каноническая платформа Windows x64 · Node 24.11.1 (`../../docs/VERSIONING_AND_AUTHORITY.md` §8), эталон `reference/accepted/series-digest.windows.json`.
- Scenarios: Modes 0–29.
- Предшественник: v7.6.1 r1 (`16e8ca6c5719e67422e16a6ec1ea2724b6121a062200eaf91e81389a2a180cd1`), лежит в `reference/v7.6.1/`.

## Проверки promotion v7.7 (прогон 2026-09-26, каноническая платформа)

| Проверка | Результат |
|---|---|
| Validation Modes 0–29 | **PASS** — 30/30, 4719 проверок |
| Capital Lifecycle conformance | **PASS** — 7 instances, 0 NON_CONFORMING; все kernel-v2 |
| Structure audit | **PASS** — 151 FLOW, 120 boundary, unclassified 0, closed-world 0, пары 15 (unpaired 0) |
| A/B symmetry | **PASS** — mismatches 0, exceptions 0 |
| Parameter registry | 353 параметра; 187 аннотировано; 45 несимметричных пар; 0 без аннотации |
| Regression Modes 0–26 vs v7.6.1 r1 | **IDENTICAL** — 27 × `common=1004, changed=0, added=66, maxAbs=0` |
| Policy задачи 008 | **PASS** — 2016 событий, неожиданных 0 |
| Self-policy (accepted = candidate) | см. `../../docs/ACCEPTANCE_STATUS.md` |

Прежние приёмки (v7.6.1, v7.6 r2) — `../../docs/ACCEPTANCE_STATUS.md`, раздел «Previous acceptances».

## Self-tests стенда

Полный прогон Lab v0.9.3 на чистом checkout при приёмке задачи 004 (2026-09-25, офлайн-установка из `vendor/`): результаты те же, что на v0.9.2, плюс новый случай QA. Там же: `RUN_LAB` Modes 0–26 `OVERALL: PASS`, `CHECK_CANDIDATE` `BYTE_IDENTICAL` + `POLICY RESULT: PASS` — см. `docs/tasks/004-vendor-dependencies/ACCEPTANCE_RU.md`.

| Скрипт | Результат |
|---|---|
| `SELF_TEST.cmd` (Modes 0, 12) | **PASS** |
| `QA_SELF_TEST.cmd` | **PASS** 30/30 (новый случай: подменённая версия движка отвергается) |
| `POLICY_SELF_TEST.cmd` | **PASS** 10/10 |
| `CONFORMANCE_SELF_TEST.cmd` | **PASS** 18/18 |
| `STRUCTURE_SELF_TEST.cmd` | **PASS** 21/21 |
| `COMPARE_SELF_TEST.cmd` | **PASS** |

## Рабочая область

`input/model`, `input/validation`, `input/policy` и `reference/accepted/model` содержат принятые артефакты v7.7 r1, поэтому `RUN_LAB.cmd` и `CHECK_CANDIDATE.cmd` запускаются без аргументов; `CHECK_CANDIDATE` на нетронутой области даёт `BYTE_IDENTICAL`. Отчёты предыдущих прогонов в `output/` не входят в поставку: актуальные копии лежат в `docs/CAPITAL_LIFECYCLE_CONFORMANCE_REPORT.md`, `docs/STRUCTURE_AUDIT_REPORT.md`, `docs/PARAMETER_REGISTRY.md` пакета.

Канонический разбор дефектов r1 и того, что именно изменено в r2, — `docs/V7_6_R1_TO_R2_FIX_REPORT.md`; порядок команд воспроизведения — `docs/ACCEPTANCE_STATUS.md`.

`closed-world = 0` относится к объявленному контракту границы расширения капитала и не означает, что Planet v1 закончена.
