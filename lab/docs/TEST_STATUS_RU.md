# Статус проверок Orbital Economy Lab v0.9.1 — baseline v7.6 r2

## Принятая основа

- Модель: **Orbital Economy v7.6 r2 — Energy Kernel v2** — ACCEPTED 2026-09-25.
- SHA-256: `a9573f5afe43d2ae2bf12fdc3066c983c264eba162e1d3fc1d5f11e3872f9e91`.
- Validation: `validation/validation-v7.6.json`, SHA-256 `cbd3ff4b115b3a025e2cb54f9cbd3436ca11a5dcebdebb10cf094bfa2963acaf`.
- Policy: `policy/change-policy-v7.6-strict.json` (default deny, rules: []).
- Engine: `simulation@9.0.0` pinned.
- Scenarios: Modes 0–26.
- Предшественник: v7.5.1 r1 (`299216122552a6819e5ef6432f8dc51197cde7c0862de7a43edd8eef359aeeda`).

## Проверки promotion (прогон 2026-09-25)

| Проверка | Результат |
|---|---|
| Validation Modes 0–26 | **PASS** — 27/27 |
| Capital Lifecycle conformance | **PASS** — 7 instances, 0 NON_CONFORMING; все kernel-v2 |
| Structure audit | **PASS** — 139 FLOW, 108 boundary, unclassified 0, closed-world 0, пары 13 (unpaired 0) |
| A/B symmetry | **PASS** — mismatches 0, exceptions 0 |
| Parameter registry | 325 параметров; 159 аннотировано; 41 несимметричная пара; 0 без аннотации |
| Legacy regression Modes 0–24 vs v7.5.1 r1 | **IDENTICAL** — 25 × `common=963, changed=0, added=41, maxAbs=0` |
| Modes 25–26 | **PASS** — Energy Resource Supply Shock / Energy Capacity-Only Control Shock |
| Self-policy (accepted = candidate) | **PASS** — `BYTE_IDENTICAL`, 1004 ряда × 27 Modes, unexpected/forbidden/missing/hard blockers 0 |

## Self-tests стенда

| Скрипт | Результат |
|---|---|
| `QA_SELF_TEST.cmd` | **PASS** 29/29 |
| `POLICY_SELF_TEST.cmd` | **PASS** 10/10 |
| `CONFORMANCE_SELF_TEST.cmd` | **PASS** 18/18 |
| `STRUCTURE_SELF_TEST.cmd` | **PASS** 21/21 |
| `COMPARE_SELF_TEST.cmd` | **PASS** |

## Рабочая область

`input/model`, `input/validation`, `input/policy` и `reference/accepted/model` содержат принятые артефакты v7.6 r2, поэтому `RUN_LAB.cmd` и `CHECK_CANDIDATE.cmd` запускаются без аргументов; `CHECK_CANDIDATE` на нетронутой области даёт `BYTE_IDENTICAL`. Отчёты предыдущих прогонов в `output/` не входят в поставку: актуальные копии лежат в `docs/CAPITAL_LIFECYCLE_CONFORMANCE_REPORT.md`, `docs/STRUCTURE_AUDIT_REPORT.md`, `docs/PARAMETER_REGISTRY.md` пакета.

Канонический разбор дефектов r1 и того, что именно изменено в r2, — `docs/V7_6_R1_TO_R2_FIX_REPORT.md`; порядок команд воспроизведения — `docs/ACCEPTANCE_STATUS.md`.

`closed-world = 0` относится к объявленному контракту границы расширения капитала и не означает, что Planet v1 закончена.
