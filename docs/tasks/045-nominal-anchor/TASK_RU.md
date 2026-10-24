# Задание 045 — v7.7.19: спрос на труд следует за зарплатой (номинальный якорь)

Ветка: `task/045-nominal-anchor` · Scope: `scope.json` рядом · Правила: контракт 1.9 — §3–§5, §7, §8, §9 и §9.4 (п. 5 — поставка через `candidate/`), §9.2 п. 9 (контрольные точки и журнал) · Порядок работы: `docs/tasks/README_RU.md`

Решение владельца от 2026-10-23: **номинальный якорь через спрос на труд**, эластичность 1.5. Основание — `docs/research/LONGRUN_V7_7_18_2026-10-23_RU.md` (дефляция без дна) и `docs/research/NOMINAL_ANCHOR_2026-10-23_RU.md` (прототипы). Стенд Lab v0.9.23 (задача 044) уже умеет раскрывать эту связь.

Изменение небольшое:
- в модель добавляется 1 параметр, заменяются 2 формулы и добавляются 8 связей;
- **Modes 0–51 воспроизводят v7.7.18 бит в бит**, Modes 52–59 меняются;
- пересмотрены 2 проверки Mode 55 и добавлены 3 проверки механизма.

## 1. Что прочитать

1. `V7_7_19_ARCHITECTURE_SPEC.md`:
   - что меняется (§1), регрессия (§2), поведение (§3);
   - **таблица проверок (§4)**;
   - аннотации (§5).
2. Черновики — **проверены нами на полном skeleton** (§6 спецификации):
   - `draft/skeleton-patch.json` — наш патч: 1 `add_elements`, 2 `replace_formulas`, 8 `add_links`;
   - `draft/validation-v7.7.19-draft.json` — validation v7.7.18 с правками по §4;
   - `draft/change-policy-v7.7.19-draft.json`:
     - Modes 0–51 — регрессия;
     - Modes 52–59 — изменение рядов разрешено;
     - параметр и 2 определения обязательны;
     - структурное запрещено.

   Финализация: `validation_sha256` в policy = SHA твоей validation. Изменения проверок и правил — только с обоснованием в «Отличиях».

## 2. Что поставить

В `docs/tasks/045-nominal-anchor/candidate/`:
- `model-patch.json`:
  - к v7.7.18 r1, `base_sha256` = `43034a2890e06c030b04433a3ed9cebf1961d4ccf9101766a8394d2033748b48`;
  - `name` = `Orbital Economy v7.7.19 Nominal Anchor candidate rN`;
  - ровно секции skeleton: `add_elements`, `replace_formulas`, `add_links`, без `nodes`;
  - элементы, формулы и связи — **ровно** вывод `docs/tasks/044-labor-demand-elasticity/reference/make_elastic.mjs`. Входы: v7.7.18, v7.7.12 из тега `v7.7.12-r1`, `lab/fixtures/nodes/labor_market_elastic.json`, `model/nodes/labor_market.json`;
- `validation.json` — **многострочный JSON** (`JSON.stringify(v, null, 2) + "\n"`);
- `change-policy.json`;
- `PARAMETER_ANNOTATIONS_fragment.json`:
  - **новая** аннотация `Labor Demand Wage Elasticity`;
  - **обновлённая** `Target Labor Tightness` (§5 спецификации).

И `REPORT_RU.md`: журнал по КТ и отчёт кандидата, **с отдельным разделом «Отличия»**.

## 3. Контрольные точки

После каждой КТ — запись в «Журнал» `REPORT_RU.md` и push. Один коммит на шаг, без повторов. КТ отмечается пройденной только со ссылкой на зелёный запуск; запуск, отменённый по времени, записывается как отмена.

| КТ | Результат | Доказательство |
|---|---|---|
| КТ1 | патч применяется; отпечаток определений = `4aa09d6a1d73caa3` (`docs/tasks/042-cost-pricing-gates/reference/definition_fingerprint.mjs`); `conformance` и `audit` PASS — граничных 302, симметрия 0, петель 0 из 1048576, `planet_v1` PASS | ссылка на `candidate.yml` |
| КТ2 | `policy` PASS: Modes 0–51 без изменений; Modes 52–59 — ряды; параметр и 2 определения; ничего структурного | ссылка, счётчики |
| КТ3 | validation 60/60 PASS; таблица по пяти проверкам §4 «проверка → значение → порог → запас» | ссылка, таблица |
| КТ4 | поставка полная; `candidate.yml` 5/5, `ci.yml` зелёный (`bench-selftests` и все блоки `node-selftests`) | ссылки |

## 4. Чего не делать

- Ничего сверх спецификации: сценарии, узлы, прочие элементы не трогать.
- Не менять `model/nodes/*`: декларацию `labor_market` с параметром обновим мы при продвижении.
- Не ослаблять проверки сверх таблицы §4 без обоснования в «Отличиях».
- Менять можно только `candidate/` и `REPORT_RU.md` в папке задачи.
- SHA256SUMS не трогать (`sums_by: reviewer`); `[skip ci]` не использовать.

## 5. Приёмка (наша, на канонической платформе)

- строгий guard;
- полный цикл на Windows: validation 60/60; `CHECK_CANDIDATE` с твоей policy — `POLICY PASS`;
- ревью патча против нашего skeleton;
- продвижение в v7.7.19 r1 вместе с декларацией `model/nodes/labor_market.json`;
- после продвижения — все самотесты заново.
