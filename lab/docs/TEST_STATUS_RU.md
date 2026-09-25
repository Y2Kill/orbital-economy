# Статус проверок Orbital Economy Lab v0.9.3 — baseline v7.6.1 r1

## Принятая основа

- Модель: **Orbital Economy v7.6.1 r1 — Energy Kernel v2, Mode 25 calibrated** — ACCEPTED 2026-09-25.
- SHA-256: `16e8ca6c5719e67422e16a6ec1ea2724b6121a062200eaf91e81389a2a180cd1`.
- Validation: `validation/validation-v7.6.1.json`, SHA-256 `1970aaea988ece5ba2524e0ca79b68a0c48864c8bf6d7e458c336b718c209ddc`.
- Policy: `policy/change-policy-v7.6.1-strict.json` (default deny, rules: []).
- Engine: `simulation@9.0.0` pinned.
- Scenarios: Modes 0–26.
- Предшественник: v7.6 r2 (`a9573f5afe43d2ae2bf12fdc3066c983c264eba162e1d3fc1d5f11e3872f9e91`), лежит в `reference/v7.6/`.

## Проверки promotion v7.6.1 (прогон 2026-09-25)

| Проверка | Результат |
|---|---|
| Validation Modes 0–26 | **PASS** — 27/27 (в Mode 25 новая проверка «энергия нормируется, а не отключается») |
| Контроль: v7.6 r2 на новой validation | новая проверка **падает** (81 < 400) — проверка не тавтология |
| Capital Lifecycle conformance | **PASS** — 7 instances, 0 NON_CONFORMING; все kernel-v2 |
| Structure audit | **PASS** — 139 FLOW, 108 boundary, unclassified 0, closed-world 0, пары 13 (unpaired 0) |
| A/B symmetry | **PASS** — mismatches 0, exceptions 0 |
| Parameter registry | 325 параметров; 159 аннотировано; 41 несимметричная пара; 0 без аннотации |
| Regression Modes 0–24, 26 vs v7.6 r2 | **IDENTICAL** во всех рядах, кроме ряда самой изменённой константы — 26 × `common=1004, changed=1` |
| Mode 25 vs v7.6 r2 | изменён по замыслу, 639 рядов; policy калибровки r1.1 — **PASS**, 667 событий, неожиданных 0 |
| Self-policy (accepted = candidate) | **PASS** — `BYTE_IDENTICAL`, 1004 ряда × 27 Modes |

Прежняя приёмка v7.6 r2 (Modes 0–24 = v7.5.1 r1 бит-в-бит) — `../../docs/ACCEPTANCE_STATUS.md`, раздел «Previous acceptance».

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

`input/model`, `input/validation`, `input/policy` и `reference/accepted/model` содержат принятые артефакты v7.6.1 r1, поэтому `RUN_LAB.cmd` и `CHECK_CANDIDATE.cmd` запускаются без аргументов; `CHECK_CANDIDATE` на нетронутой области даёт `BYTE_IDENTICAL`. Отчёты предыдущих прогонов в `output/` не входят в поставку: актуальные копии лежат в `docs/CAPITAL_LIFECYCLE_CONFORMANCE_REPORT.md`, `docs/STRUCTURE_AUDIT_REPORT.md`, `docs/PARAMETER_REGISTRY.md` пакета.

Канонический разбор дефектов r1 и того, что именно изменено в r2, — `docs/V7_6_R1_TO_R2_FIX_REPORT.md`; порядок команд воспроизведения — `docs/ACCEPTANCE_STATUS.md`.

`closed-world = 0` относится к объявленному контракту границы расширения капитала и не означает, что Planet v1 закончена.
