# task_002_symmetry — пакет задания для исполнителя

Задача v7.4.1: симметризация тестовой обвязки A/B (behavior-preserving). Исполнитель без стенда — цикл как в задаче 001: патч → мы прогоняем → отчёты.

```text
task_002_symmetry/
├── README_RU.md
├── TASK_002_RU.md                          задание, критерий приёмки, чек-лист
├── V7_4_1_SYMMETRY_SPEC.md                 что и как менять (§3 — исчерпывающий список), приём «флаги применимости»
├── V7_4_1_WORKING_CONTEXT.md               дословные формулы и LINK всех затрагиваемых элементов
├── change-policy-v7.4.1-symmetry-draft.json   контракт (dry-run: 942 события идеального candidate — все ожидаемы; дрейф 1e-12 → FORBIDDEN)
├── validation-v7.4.1-symmetry-draft.json   = validation-v7.4.2 с colony_symmetry.exceptions = []
├── skeleton/
│   ├── skeleton-patch-partial.json         проверенный на стенде образец: A Effective Wage, A Metal Unit Cost, X Power Active Generation Capacity
│   └── skeleton-compare-console.txt        доказательство: 21 Mode, changed = 0, maxAbs = 0
├── reference/simulation-equations.md       язык формул движка
└── baseline/                               копия orbital-economy-baseline-v7.4 (модель v7.4 r2 + Lab v0.8.1 + docs)
```

Skeleton покрывает самые рискованные места (вложенные IfThenElse с флагами и общими множителями, отсутствующие LINK на одной стороне); остальное — та же схема, применённая к цепочкам спроса (§3.4–3.5) и добыче (§3.2).

Для нас: `cd baseline\lab` → `APPLY_PATCH` → `LIFECYCLE_CONFORMANCE` → `STRUCTURE_AUDIT` (с validation исполнителя) → `RUN_LAB` → `CHECK_CANDIDATE`.
