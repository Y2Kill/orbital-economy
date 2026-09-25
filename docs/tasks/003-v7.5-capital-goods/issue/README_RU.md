# task_003_v7.5 — пакет задания для исполнителя

Задача v7.5 Capital Goods / kernel-v2: капитал перестаёт возникать из ничего — сектор «оборудование» из металла и электроники, строительство мощностей его потребляет (Refinery / Electronics / Power × A/B; Transport — v7.5.1). Исполнитель без стенда — цикл как в задачах 001/002.

```text
task_003_v7.5/
├── README_RU.md
├── TASK_003_RU.md                          задание, приёмка, чек-лист
├── V7_5_ARCHITECTURE_SPEC.md               спецификация r1 (решения владельца проекта учтены; реализуемость проверена)
├── V7_5_TEST_PLAN.md                       HARD финальны; EXPECTATION Modes 21–23 — после первого прогона
├── V7_5_WORKING_CONTEXT.md                 дословные формулы expansion / finance / capacity, сценарии
├── change-policy-v7.5-capital-goods-draft.json
├── validation-v7.5-draft.json              v7.4.2 + kernel-v2 (6 экземпляров) + пары капитала + 40 HARD + Modes 21–23 (качественно)
├── skeleton/
│   ├── skeleton-patch-A-only.json          проверенный образец: A Refinery + Power + сектор Capital Goods (22 элемента)
│   └── skeleton-compare-modes-0-12-17.md   changed = 0, maxAbs = 0 при switch = 0
├── reference/simulation-equations.md
└── baseline/                               копия orbital-economy-baseline-v7.4 = v7.4.1 r1 (Lab v0.9.0: пары преобразования, kernel-v2; 0 исключений симметрии)
```

Ожидаемый счётчик closed-world после v7.5: **1** (Transport). Skeleton на драфт-validation даёт именно 1 (для колонии A; B в skeleton не реализована — поэтому там пары B «missing», это ожидаемо).

Задача 002 принята (baseline v7.4.1) — пакет перебазирован и готов к выдаче.
