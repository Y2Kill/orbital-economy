# Архитектура Orbital Economy Lab v0.9.1

## 1. Основной локальный путь

```text
input/model/*.json
      ↓
ровно одна активная ModelJSON
      ↓
loadModelJSON()
      ↓
model.check()
      ↓
Capital Lifecycle Kernel conformance (static)      ← v0.5.0
      ↓
structure audits: open boundaries + colony symmetry ← v0.6.0
      ↓
для каждого scenario: свежая копия ModelJSON + scenario values
      ↓
model.simulate()
      ↓
Results в памяти
      ↓
validation checks
      ↓
console + report.json + report.md
```

Сценарии выполняются последовательно. Состояние одного scenario не переносится в следующий. Полные CSV локального расчёта в обычном режиме не создаются.

## 2. Accepted ↔ candidate factual comparison

```text
reference/accepted/model/*.json      input/model/*.json
              │                           │
              └────────────┬──────────────┘
                           ↓
                    static validation
                           ↓
                  structural/model diff
                           ↓
             одинаковые Modes запускаются
                   одним pinned engine
                           ↓
           all common series compared exactly
                           ↓
              model-comparison.md/.json
```

Accepted reference — отдельная замороженная контрольная точка. Candidate — текущая рабочая модель.

Comparator разделяет:

- факт изменения ModelJSON;
- изменения структуры/behavior;
- изменения scenario contract;
- изменения результатов simulation;
- candidate validation failures.

Comparator остаётся **фактическим** слоем. `DIFFERENT_OUTPUTS` не означает автоматически «ошибка».

## 3. Change-policy gate

v0.4.0 добавляет отдельный слой намерения:

```text
model-comparison.json       input/policy/*.json
         │                         │
         └──────────┬──────────────┘
                    ↓
             normalized change events
                    ↓
          ordered explicit policy rules
                    ↓
        EXPECTED / UNEXPECTED / FORBIDDEN
                    ↓
          change-policy.md/.json
                    ↓
               POLICY PASS/FAIL
```

Policy привязана к SHA-256 accepted-модели и, при необходимости, validation contract. Она также может фиксировать tolerance comparator.

Рекомендуемый режим — `default_action: deny`: всё неразрешённое явно считается FAIL.

HARD/static/physics/accounting failures находятся ниже policy-слоя и не могут быть разрешены policy-rule.

## 4. Полный candidate gate одной командой

```text
CHECK_CANDIDATE.cmd
       ↓
accepted ↔ candidate comparison
       ↓
candidate HARD validation
       ↓
change policy evaluation
       ↓
model-comparison.* + change-policy.*
```

Это основной путь для будущих v7.4+ candidates.

## 5. Повторная policy-оценка без simulation

```text
existing model-comparison.json
             +
changed policy.json
             ↓
      EVALUATE_POLICY.cmd
             ↓
       change-policy.*
```

Это позволяет корректировать contract без повторного расчёта всех Modes.

## 5a. Capital Lifecycle Kernel conformance (v0.5.0)

```text
ModelJSON + validation.json (capital_lifecycle_kernel)
              │
   ┌──────────┴──────────┐
   ▼                     ▼
static layer          runtime layer
(lifecycle_           (checks.js plugin,
 conformance.js)       на каждом Mode)
   │                     │
   └──────────┬──────────┘
              ▼
   CONFORMING / CONFORMING_WITH_VARIATION / NON_CONFORMING
              ▼
   NON_CONFORMING = HARD-блокер для RUN_LAB, COMPARE_MODELS, CHECK_CANDIDATE
```

Контракт описывает физический kernel (стоки, потоки, топология, derived-величины, тождества) и намеренно **не** описывает отраслевую policy (формулы `Required Active` / `Desired Installed` / `Strategic Reserve Target`, времена, коэффициенты). Отдельная команда `LIFECYCLE_CONFORMANCE.cmd` выполняет только статический слой. Подробно: `LIFECYCLE_CONFORMANCE_RU.md`.

## 5b. Structure audits (v0.6.0)

```text
ModelJSON + validation.json
        │
   ┌────┴─────────────────┐
   ▼                      ▼
open_boundaries        colony_symmetry
FLOW из ∅ / в ∅        A X  ↔  B X
по категориям          тип, формула, endpoints, LINK
closed_world: yes/no   параметры — свободны
   │                      │
   └────┬─────────────────┘
        ▼
  FAIL = HARD-блокер (RUN_LAB, COMPARE_MODELS, CHECK_CANDIDATE)
  closed-world violations = прогресс-метрика к «планете» (NOTE, пока enforce ≠ closed_world)
```

Подробно: `STRUCTURE_AUDIT_RU.md`.

## 5c. Реестр внешних параметров (v0.8.0)

```text
ModelJSON ──► инвентарь (константы, начальные запасы, переключатели, тестовые множители; пары A/B)
                    +
docs/PARAMETER_ANNOTATIONS.json ──► роль / что меняет / доказательство; embedded_literals
                    ▼
parameter-registry.md/.json: покрытие, несимметричные пары без аннотации, WARN на несуществующие имена
```

Информационный слой (не гейт). Подробно: `PARAMETER_REGISTRY_RU.md`.

## 6. Optional web-reference path

```text
PREPARE_WEB_CHECK.cmd
      ↓
manifest(model SHA-256, validation SHA-256, expected modes)
      ↓
свежие browser CSV
      ↓
Mode detection by Timed Test Mode
      ↓
preflight
      ↓
local Results vs web CSV
      ↓
report
      ↓
archive batch under output/run-.../web_reference/
```

CSV не считается самодостаточным доказательством происхождения. Принадлежность партии модели фиксируется manifest + SHA-256 до получения web результатов.

## 7. Поведение при отсутствии web CSV

```text
web cross-check = SKIPPED
local validation = выполняется полностью
```

Web остаётся периодическим контрольным каналом, а не зависимостью разработки.

## 8. Отчёты

Обычный runner:

```text
report.json
report.md
```

Factual comparator:

```text
model-comparison.json
model-comparison.md
```

Policy layer:

```text
change-policy.json
change-policy.md
```

Kernel conformance (standalone):

```text
lifecycle-conformance.json
lifecycle-conformance.md
```

Structure audit (standalone):

```text
structure-audit.json
structure-audit.md
```

JSON предназначен для машинного анализа/агентов, Markdown — для человека.
