# task_001_v7.4 — пакет задания для исполнителя

Самодостаточный пакет для реализации Orbital Economy v7.4 Intermediate Inputs. Рассчитан на исполнителя, который **не запускает тестовый стенд** (например, чат-модель): он читает, строит патч и validation, мы прогоняем и возвращаем отчёты.

```text
task_001_v7.4/
├── README_RU.md                                   ← этот файл
├── TASK_V7_4_RU.md                                задание: цель, цикл работы, что вернуть, приёмка, чек-лист
├── V7_4_ARCHITECTURE_SPEC.md                      спецификация: что менять, что запрещено, инварианты, калибровка
├── V7_4_TEST_PLAN.md                              HARD / REGRESSION / EXPECTATION, Modes 17–20, пороги [fix]/[calib]
├── V7_4_WORKING_CONTEXT.md                        дословные имена, формулы и LINK всех затрагиваемых элементов
├── v7_4_working_context.json                      то же машинно-читаемо (288 элементов + все сценарии)
├── change-policy-v7.4-intermediate-inputs-draft-r1.1.json   контракт разрешённых изменений (АКТУАЛЬНЫЙ, r1.1)
├── validation-v7.4-draft-r1.1.json                стартовый validation (АКТУАЛЬНЫЙ, r1.1: пороги Modes 17–18 из приёмки r1)
├── change-policy-v7.4-intermediate-inputs-draft.json, validation-v7.4-draft.json   — r0, история
├── reference/
│   ├── simulation-equations.md                    справочник языка формул движка simulation@9.0.0
│   └── LICENSE-NOTICE.md
└── baseline/                                      копия orbital-economy-baseline-v7.3 (модель v7.3 r2 + Lab v0.7.1 + docs)
    ├── model/                                     accepted ModelJSON (584 КБ) — источник истины
    ├── lab/                                       стенд (для нас; исполнителю — docs/, особенно MODEL_PATCH_RU.md)
    └── docs/                                      kernel-контракт, аудиты, контракт поставки, roadmap, docs v7.3
```

## История ревизий

- r0 (2026-09-21) — выдача.
- r1.1 (2026-09-21) — после приёмки candidate r1: спрос на вход от pre-energy выпуска (снята алгебраическая петля), переоценка начального запаса feedstock, шок Mode 18 перенесён на A, going concern на уровне планеты, пороги Modes 17–18 из приёмочного эксперимента. Разбор: `../task_001_v7.4_feedback_1/FEEDBACK_R1_RU.md`.

## Как читать пакет, если вы — исполнитель

Достаточно шести файлов: `TASK_V7_4_RU.md` → `V7_4_ARCHITECTURE_SPEC.md` → `V7_4_TEST_PLAN.md` → `V7_4_WORKING_CONTEXT.md` → `baseline/lab/docs/MODEL_PATCH_RU.md` → оба draft-JSON. Остальное — справочное.

Вы отдаёте **патч**, а не модель. Формат патча одно-к-одному соответствует тому, что проверяет policy: каждый `add_elements` — это `element_added`, каждый `replace_formulas` — `definition_changed`, каждый `add_links` — `link_added`. Поэтому draft-policy можно читать как «список того, что патчу разрешено содержать».

## Что важно знать до старта

1. **Точность.** Modes 0–16 должны совпасть с accepted бит-в-бит по всем существующим рядам (`abs_tolerance = 0`). Достигается только формой `IfThenElse([Intermediate Inputs Enabled] = 1, new, old)` с дословным `old`.
2. **Policy написана до кода.** Dry-run на синтетическом «идеальном» candidate: `PASS`, 448 событий, unexpected 0, required missing 0. Лишний элемент или изменение ряда в Modes 0–16 → FAIL. Нужно что-то сверх draft — письменный вопрос, не правка policy.
3. **Validation-draft применим только к candidate** — на accepted v7.3 r2 он даст FAIL (нет новых рядов); так и задумано.
4. **Ссылка без LINK — ошибка модели.** Это самая частая ошибка при ручной сборке; чек-лист в `TASK_V7_4_RU.md` §5 начинается с неё.
5. **Ничего в `baseline/` не менять.** Замороженная контрольная точка.

## Для нас (владельцев): цикл проверки поставки

```cmd
cd baseline\lab
APPLY_PATCH.cmd "..\..\delivery_rN\model-patch.json" "input\model\candidate.json"
copy ..\..\delivery_rN\validation-v7.4.json input\validation\      (убрать validation-v7.3.2.json)
copy ..\..\delivery_rN\change-policy-v7.4-intermediate-inputs-rN.json input\policy\   (убрать r3)
LIFECYCLE_CONFORMANCE.cmd
STRUCTURE_AUDIT.cmd
RUN_LAB.cmd
CHECK_CANDIDATE.cmd
```

Исполнителю возвращаем: консольный лог `APPLY_PATCH`, `lifecycle-conformance.md`, `structure-audit.md`, `report.md`, `model-comparison.md`, `change-policy.md`. Длительность: статика — секунды; `RUN_LAB` (21 Mode) ≈ 3 мин; `CHECK_CANDIDATE` ≈ 6 мин.
