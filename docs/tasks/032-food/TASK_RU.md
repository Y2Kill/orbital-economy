# Задание 032 — v7.7.12: еда и фермы (Planet v2, шаг 2)

Ветка: `task/032-food` · Scope: `scope.json` рядом · Правила: контракт 1.9 — §3–§5, §7, §8, §9 и §9.4 (п. 5 — поставка через `candidate/`), §9.2 п. 9 (контрольные точки и журнал) · Порядок работы: `docs/tasks/README_RU.md`

Второй шаг Planet v2: решения владельца от 2026-10-04/05, прототип — `docs/research/FOOD_PROTOTYPE_2026-10-05_RU.md`.
- У регионов появляется еда.
- Фермы — капитал на земле, им нужны оборудование, труд и энергия.
- Регионы торгуют едой по потребности.
- Нехватка еды бьёт по людям.

Всё это делает узел `food` (задача 031) под переключателем `Food Enabled`. В Modes 0–48 переключатель равен 0, и они не меняются. Новые Modes: 49 — еда, 50 — всплеск транспорта с едой, 51 — земля поровну, пробный.

## 1. Что прочитать

1. `V7_7_12_ARCHITECTURE_SPEC.md` — что меняется (§1), декларация (§2), сценарии (§3), граница (§4), наблюдения (§5).
2. `lab/docs/NODES_RU.md` (раздел `food`), `lab/docs/MODEL_PATCH_RU.md` (секции `nodes`, `replace_formulas`, `add_scenarios`), `lab/docs/VALIDATION_FORMAT_RU.md` (плагин `food`, категория `agriculture`, раздел «Схема»).
3. `V7_7_12_TEST_PLAN.md` — все проверки выражены типами языка validation и исполнены нами на skeleton, включая контроль.
4. Черновики — **проверены нами на полном skeleton**:
   - `draft/food.json` — декларация узла; байт в байт фикстура задачи 031 (раунд 2);
   - `draft/skeleton-patch.json` — наш патч skeleton: узел, замена всплеска, сценарии 49–51;
   - `draft/validation-v7.7.12-draft.json`:
     - структурная часть получена `expand-nodes --validation`;
     - добавлены проверки Modes 49–51;
     - `regression_modes` 0–48;
   - `draft/change-policy-v7.7.12-draft.json`.

   Финализация: `validation_sha256` в policy = SHA твоей validation (из лога `candidate.yml`). Изменения правил и декларации — только с обоснованием.
5. Для образца — поставки задач 026 (переключатель и новые Modes) и 030 (`REPORT_RU.md`, `ACCEPTANCE_RU.md`). Черновики можно поставить как есть, если первый прогон `candidate.yml` их подтверждает.

**Стенд v0.9.17 (задача 031).** Узел `food` раскрывается сам: запасы, потоки, параметры, замены в обёртке переключателя, фрагменты validation. Руками в патче этого делать не нужно и нельзя. Самотесты стенда мы прогнали со skeleton в роли принятой модели до выдачи (шаг 0a) — см. спецификацию §6.

**Полная validation с включённой едой прогнана нами до выдачи** (урок задачи 031): все плагины проходят в Modes 49–51.

## 2. Что поставить

В `docs/tasks/032-food/candidate/`:
- `model-patch.json`:
  - к v7.7.11 r1, `base_sha256` = `dbe824b34ad41b5b7d50a6df096b59268198dd4c02c2b36aba5645b24809f0d2`;
  - `name` = `Orbital Economy v7.7.12 Food candidate rN`;
  - **узел — секцией `nodes`** (декларация из `draft/food.json`), а не раскрытыми элементами;
  - `replace_formulas` — только `Test 2 Transport Surge Active` по спецификации §1 п. 2;
  - `add_scenarios` — Modes 49–51 по спецификации §3;
  - `modify_scenarios` — пусто;
- `validation.json` — **многострочный JSON** (`JSON.stringify(v, null, 2) + "\n"`);
- `change-policy.json`;
- `PARAMETER_ANNOTATIONS_fragment.json` — **все** новые параметры, которые создаёт узел (урок приёмки 030):
  - переключатель `Food Enabled`;
  - 20 параметров декларации: `Food Need per Capita`, `Food Energy per Unit`, `Food Labor per Unit`, `Food Freight Weight per Unit`, `Food Transport Max Share`, `Farm Capital Goods per Capacity`, `Farm Depreciation Rate`, `Farm Capacity Adjustment Time`, `Farm Desired Capacity Margin`, `Food Target Coverage Days`, `Food Inventory Adjustment Time`, `Food Buffer Days`, `Food Demand Signal Time`, `Food Production Signal Time`, `Food Export Release Time`, `Food Price Reference`, `Food Price Elasticity`, `Famine Death Sensitivity`, `Living Food Weight`, `Living Energy Weight With Food`;
  - **пять несимметричных пар A/B** — аннотация на имени A с `applies_to_mirror: true`; реестр должен показать 0 неаннотированных несимметричных пар:
    - `A Farm Land Capacity` (22 / 60 — плодородная B, решение владельца);
    - стартовые значения `A Farm Capacity`, `A Food Inventory`, `A Food Demand Signal`, `A Food Production Signal`;
  - стартовые значения торговли: `B to A Food Export Signal`, `Food Cargo B to A` — откуда берутся (старт: нехватка земли A уже в пути).

И `REPORT_RU.md` в папке задачи: журнал по КТ и отчёт кандидата, **с отдельным разделом «Отличия»** (даже если отличий нет — так и написать).

## 3. Контрольные точки

После каждой КТ сразу сделать запись в «Журнал» `REPORT_RU.md` и push. Запуск CI не ждать одним ожиданием: записать, какой ждёшь, и проверить отдельным шагом. Если журнал дописывается после зелёного CI — отдельным коммитом.

| КТ | Результат | Доказательство |
|---|---|---|
| КТ1 | патч применяется; отпечаток модели `c2ce1d6b11f56df8`; `conformance` PASS — `food` 2 CONFORMING; `audit` PASS — граничных **254**, неклассифицированных 0, **петель 0 из 65536**, `planet_closure` `planet_v1` PASS: P2 11/8/0/0, P3 16/2/1/0, P5 19/0 | ссылка на `candidate.yml`, строки |
| КТ2 | регрессия: `policy` — Modes 0–48 `changed = 0`, без неожиданных событий | ссылка, счётчики |
| КТ3 | validation Modes 49–51 по test plan; пороги по первому прогону, с обоснованием; validation PASS 52/52; **A сыта во всех трёх, в Mode 50 фермы сохраняют энергию, в Mode 51 торговля угасает** | ссылка, таблица «проверка → значение → порог → запас» |
| КТ4 | поставка полная; реестр параметров — 0 неаннотированных несимметричных пар; `candidate.yml` 5/5 PASS, `ci.yml` зелёный; **КТ4 записана в журнал** | ссылки |

## 4. Чего не делать

- Ничего сверх спецификации: узел — только декларацией; сценарии — только 49–51; замена — только всплеск.
- Не раскрывать узел руками в `add_elements`. Не менять параметры декларации без обоснования в «Отличиях».
- Не прописывать `Food Enabled` в сценарии 0–48.
- Не связывать население со спросом и зарплатой и не ограничивать выпуск трудом — это шаг 3, отдельная задача.
- Менять можно только `candidate/` и `REPORT_RU.md` в папке задачи.
- Не вставлять в отчёт персональные данные; на коммиты ссылаться по хешу. SHA256SUMS не трогать (`sums_by: reviewer`); `[skip ci]` не использовать.

## 5. Приёмка (наша, на канонической платформе)

Как в 030:
- строгий guard;
- полный цикл на Windows: validation 52/52; `CHECK_CANDIDATE` с твоей policy — `POLICY PASS`; Modes 0–48 `changed = 0, maxAbs = 0`;
- ревью патча против нашего skeleton;
- продвижение в v7.7.12 r1, декларация — в `model/nodes/`;
- после продвижения — все самотесты заново.
