# Orbital Economy Lab v0.9.4

Локальный стенд для запуска, проверки, regression-анализа, policy-gating, проверки соответствия Capital Lifecycle Kernel и статических аудитов структуры (открытые границы, A/B-симметрия) для ModelJSON экономической модели Orbital Economy. v0.9.4 добавляет `node src/cli.js series` для бит-точной межплатформенной диагностики рядов.

## Подтверждённая база

Текущий accepted baseline стенда — **Orbital Economy v7.7 r1 — Construction Materials**, SHA `5bbc29b6e18caa64ec22267892b6cd0669649722c8fc029d8dba43a77a34d5a1`, Modes 0–29. Engine `simulation@9.0.0` pinned.

На promotion v7.6 подтверждено:

- validation Modes 0–26 — PASS (27/27);
- Capital Lifecycle conformance — PASS, 7 instances, 0 NON_CONFORMING (все kernel-v2);
- structure audit — PASS, 108 граничных потоков, unclassified 0, closed-world violations 0, пары 13 (unpaired 0);
- A/B symmetry — mismatches 0, exceptions 0;
- parameter registry — 325 parameters, 159 annotated, asymmetric unannotated 0;
- v7.7: Modes 0–26 воспроизводят accepted v7.6.1 r1 бит-в-бит на канонической платформе; Modes 27–29 — стройматериалы (`../docs/tasks/008-construction-materials/`);
- v7.6.1: Modes 0–24 и 26 воспроизводят accepted v7.6 r2 точно во всех рядах, кроме ряда самой изменённой константы `Power Resource Shock Factor`; Mode 25 откалиброван (`../docs/V7_6_1_CALIBRATION_REPORT.md`);
- v7.6 r2: legacy Modes 0–24 — exact regression against accepted v7.5.1 r1 (`changed=0`, `maxAbs=0`, added 41);
- self-policy на нетронутой области — `BYTE_IDENTICAL`, 1004 ряда × 27 Modes, blockers 0.

Подробности приёмки и воспроизведение — `../docs/ACCEPTANCE_STATUS.md`; что было сломано в v7.6 r1 — `../docs/V7_6_R1_TO_R2_FIX_REPORT.md`.

Исторических моделей в стенде нет: самотесты работают на текущем accepted (`reference/accepted/`, `input/`), предыдущий accepted лежит в `../reference/`, более ранние — в архиве проекта (вне git).

---

# 0c. Что изменилось в v0.7.1 / v0.8.0

- v0.7.1: comparator — добавленные ряды не считаются отличием выходов (`OUTPUTS_IDENTICAL_WITH_NEW_SERIES`).
- v0.8.0 (историческая точка): `PARAMETER_REGISTRY.cmd` — реестр всего, что задано извне (на v7.4 было 245 величин), с ручными аннотациями «роль / что меняет / доказательство», несимметричными парами A/B и встроенными литералами (`docs\PARAMETER_REGISTRY_RU.md`); QA-скрипты находят model/validation через workspace, а не по именам файлов.

---

# 0b. Что изменилось в v0.6.1 / v0.7.0

- v0.6.1: generic checks `relation` / `identity` / `bounded` — HARD-инварианты задаются в validation JSON без кода (`docs\VALIDATION_FORMAT_RU.md`).
- v0.7.0: `APPLY_PATCH.cmd` — сборка candidate из декларативного патча к accepted-модели; формат поставки для исполнителя без стенда (`docs\MODEL_PATCH_RU.md`).

---

# 0a. Что изменилось в v0.6.0

```cmd
STRUCTURE_AUDIT.cmd        открытые границы + A/B-симметрия, без simulation
STRUCTURE_SELF_TEST.cmd    QA аудитов (20 случаев)
```

`open_boundaries`: каждый FLOW из ∅ / в ∅ классифицируется; категории с `closed_world: false` — то, что должно исчезнуть к «планете». В current v7.7 r1: 120 граничных потоков, все классифицированы, **0 нарушений declared closed-world expansion contract**. Неклассифицированный поток = FAIL. Нулевой счётчик относится только к объявленным физическим boundary-contracts и не означает завершённую Planet v1.

`colony_symmetry`: для каждого элемента с токеном колонии проверяется зеркальный элемент (тип, формула, endpoints, LINK). Числовые параметры могут отличаться (в v7.7 r1 — 102 различия, все в реестре). Исключений с v7.4.1 нет: тестовая обвязка выражена флагами применимости. Структурных расхождений: 0.

Оба аудита — HARD-блокеры в `RUN_LAB` / `COMPARE_MODELS` / `CHECK_CANDIDATE`. Подробно: `docs\STRUCTURE_AUDIT_RU.md`.

Поставка:

```text
input\validation\validation-v7.7.json            (kernel-v2 + open_boundaries + пары + colony_symmetry + Modes 0-29)
input\policy\change-policy-v7.7-strict.json     (привязана к SHA модели и validation-v7.7)
```

---

# 0. Что изменилось в v0.5.0

Аудит v7.3 показал, что все четыре сектора уже используют один lifecycle-паттерн. v0.5.0 превращает это наблюдение в контракт и проверяет его автоматически, **не меняя модель**:

```text
ModelJSON + validation (plugin capital_lifecycle_kernel)
        ↓                          ↓
  static conformance         runtime identities
  (топология, LINK, switch)  (на каждом Mode)
        ↓                          ↓
 CONFORMING / CONFORMING_WITH_VARIATION / NON_CONFORMING
```

Новые команды:

```cmd
LIFECYCLE_CONFORMANCE.cmd
CONFORMANCE_SELF_TEST.cmd
```

Conformance также встроен в `RUN_LAB.cmd`, `COMPARE_MODELS.cmd` и `CHECK_CANDIDATE.cmd` как HARD-блокер: policy не может разрешить `NON_CONFORMING`.

Что контракт проверяет и что намеренно **не** проверяет (отраслевые формулы, времена, коэффициенты) — `docs\LIFECYCLE_CONFORMANCE_RU.md`; спецификация kernel — `..\docs\CAPITAL_LIFECYCLE_KERNEL_SPEC.md`.

Поставка обновлена:

```text
input\validation\validation-v7.3.1.json          (kernel-плагин, 7 экземпляров; в v0.6.0 → v7.3.2)
input\policy\change-policy-v7.3-strict-r2.json   (в v0.6.0 → r3)
```

Accepted-модель и её SHA не изменились.

---

# 1. Что изменилось в v0.4.0

Раньше `COMPARE_MODELS.cmd` объективно показывал, что изменилось, но не мог решить, является ли изменение допустимым.

Теперь добавлен второй слой:

```text
accepted ↔ candidate factual comparison
                 ↓
        explicit policy JSON
                 ↓
     POLICY PASS / POLICY FAIL
```

Новые основные команды:

```cmd
CHECK_CANDIDATE.cmd
EVALUATE_POLICY.cmd
POLICY_SELF_TEST.cmd
```

`COMPARE_MODELS.cmd` сохраняется как независимый factual comparator.

---

# 2. Установка

Требуется Node.js 20+.

На новой распакованной копии выполнить:

```cmd
INSTALL.cmd
```

`INSTALL.cmd` не обращается к npm registry: он создаёт отдельный временный npm-кэш, заполняет его только поставляемыми `vendor\simulation-9.0.0.tgz` и `vendor\csv-parse-5.6.0.tgz`, затем выполняет `npm ci --offline` строго по `package-lock.json`. Пользовательский npm-кэш для установки не используется.

Зафиксированные зависимости:

```text
simulation 9.0.0
csv-parse 5.6.0
```

При запуске стенд читает фактическую версию из `node_modules\simulation\package.json` и отказывается работать, если она не равна `9.0.0`; та же фактическая версия попадает в отчёты.

Не выполнять без отдельного решения:

```text
npm audit fix --force
```

Принудительное обновление может нарушить воспроизводимость.

После установки для проверки стенда рекомендуется:

```cmd
SELF_TEST.cmd
QA_SELF_TEST.cmd
COMPARE_SELF_TEST.cmd
POLICY_SELF_TEST.cmd
CONFORMANCE_SELF_TEST.cmd
STRUCTURE_SELF_TEST.cmd
```

COMPARE / POLICY / CONFORMANCE реально запускают simulation, поэтому занимают некоторое время.

Точные числа принятой модели определены на канонической платформе Windows x64 · Node 24.11.1 (`../docs/VERSIONING_AND_AUTHORITY.md` §8): на Linux ряды отличаются в последних битах. Сверка машины с эталоном: `node --expose-gc src\cli.js series --modes=all --out=output\series`, затем из корня `node tools\verify_series.mjs lab\output\series\series-digest.json`.

Для быстрых проверок веток те же self-tests запускаются на Linux через GitHub Actions (`.github/workflows/ci.yml`); полный 27-Mode прогон доступен отдельным `bench-full` workflow. CI помогает исполнителю увидеть проблему раньше, но не заменяет локальную приёмку владельцами проекта.

---

# 3. Основные папки

```text
input\
  model\
      <ровно один текущий candidate ModelJSON>
  validation\
      <ровно один validation JSON>
  policy\
      <ровно один change-policy JSON>
  web_reference\
      pending\

reference\
  accepted\
      manifest.json
      model\
          <замороженный accepted ModelJSON>

output\
```

В текущем accepted baseline:

```text
Orbital Economy v7.7 r1 — Construction Materials
SHA-256 5bbc29b6e18caa64ec22267892b6cd0669649722c8fc029d8dba43a77a34d5a1
```

`reference\accepted\model\` нельзя автоматически заменять текущим candidate. Это проектная контрольная точка.

Поставляемая baseline policy:

```text
input\policy\change-policy-v7.7-strict.json
```

Она привязана к принятой v7.7 r1, использует `default_action: deny` и требует **полного покрытия всех Modes**. Для новой задачи исполнитель должен получить отдельную explicit change-policy, сформированную до реализации.

---

# 4. Обычная локальная проверка модели

Положить candidate в:

```text
input\model\
```

Там должен находиться **ровно один JSON**.

Запустить:

```cmd
RUN_LAB.cmd
```

Стенд:

1. загружает ModelJSON;
2. выполняет schema/import validation;
3. выполняет `model.check()`;
4. выполняет статический Capital Lifecycle Kernel conformance;
4a. выполняет статические structure audits (открытые границы, A/B-симметрия);
5. запускает все выбранные Modes;
6. проверяет physics/accounting/kernel/scenario expectations;
7. пишет результат в консоль;
8. сохраняет `report.md` и `report.json`.

Web CSV не обязательны.

Если `input\web_reference\pending\` пуст:

```text
Web cross-check: SKIPPED
```

и локальная validation выполняется полностью.

---

# 5. Factual comparison accepted ↔ candidate

Запуск:

```cmd
COMPARE_MODELS.cmd
```

По умолчанию:

```text
accepted   = reference\accepted\model\
candidate  = input\model\
validation = input\validation\
Modes      = all
```

Comparator показывает:

- SHA accepted/candidate;
- статическую валидность;
- добавленные/удалённые элементы;
- изменённые semantic definitions;
- type/LINK changes;
- simulation-setting changes;
- added/removed Modes;
- changed scenario inputs;
- временную сетку;
- added/removed output series;
- changed output series;
- max absolute / relative difference;
- точную series + time максимального отличия;
- candidate validation.

Отчёты:

```text
output\compare-<timestamp>\model-comparison.md
output\compare-<timestamp>\model-comparison.json
```

Основные factual results:

```text
BYTE_IDENTICAL
OUTPUTS_IDENTICAL
OUTPUTS_IDENTICAL_BUT_SCENARIO_CONTRACT_CHANGED
COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES
OUTPUTS_IDENTICAL_WITH_NEW_SERIES
DIFFERENT_OUTPUTS
NOT_FULLY_COMPARABLE
ERROR
```

`DIFFERENT_OUTPUTS` само по себе не означает, что candidate плохой. Это факт изменения.

Подробно: `docs\MODEL_COMPARISON_RU.md`.

---

# 6. Главная новая команда: CHECK_CANDIDATE.cmd

Для новой версии модели рекомендуется использовать:

```cmd
CHECK_CANDIDATE.cmd
```

Она в одном запуске выполняет:

```text
accepted model
      +
candidate model
      ↓
model comparison
      ↓
candidate HARD validation
      ↓
change-policy evaluation
      ↓
POLICY PASS / FAIL
```

По умолчанию policy автоматически берётся из:

```text
input\policy\
```

Для финальной проверки оставляйте `Modes=all`. Частичный прогон удобен для диагностики factual diff, но strict policy с `require_full_mode_coverage=true` его отклонит как неполный.

Там должен находиться ровно один JSON.

Результаты:

```text
output\policy-<timestamp>\
    model-comparison.md
    model-comparison.json
    change-policy.md
    change-policy.json
```

Консольный итог:

```text
POLICY RESULT: PASS
```

или:

```text
POLICY RESULT: FAIL
```

Exit code `0` = PASS, `2` = FAIL/ошибка.

---

# 7. Что делает change-policy

Policy не пытается угадать, хорошее ли изменение.

Она отвечает только на вопрос:

> Соответствуют ли обнаруженные отличия заранее записанному versioned contract?

Поставляемый strict baseline:

```json
{
  "default_action": "deny",
  "rules": []
}
```

В такой политике accepted == candidate проходит, а любое отличие становится `UNEXPECTED_CHANGE` и даёт FAIL.

Это безопасная исходная точка для следующей версии модели.

---

# 8. Policy привязана к accepted baseline

Policy содержит:

```text
accepted_model_sha256
validation_sha256
```

Поэтому контракт нельзя случайно применить к другой принятой модели или другой validation-схеме.

Дополнительно policy фиксирует engine (`simulation@9.0.0`) и режим comparator:

```json
"comparison": {
  "abs_tolerance": 0,
  "rel_tolerance": null,
  "rel_floor": 1e-12
}
```

Если factual comparison сделан с другой tolerance, policy FAIL выполняется ещё на preflight.

---

# 9. Expected change rules

Пример намеренного definition change:

```json
{
  "id": "change-input-demand",
  "action": "allow",
  "event": "definition_changed",
  "name": "A Electronics Input Demand"
}
```

Пример изменения output только Mode 14:

```json
{
  "id": "mode14-electronics-output",
  "action": "allow",
  "event": "series_changed",
  "modes": 14,
  "name": "A Electronics Production"
}
```

Поддерживаются glob patterns:

```text
* = любое количество символов
? = один символ
```

Пример:

```json
"name": "* Intermediate Input *"
```

Rules применяются сверху вниз; первое совпавшее правило владеет событием.

---

# 10. Required change

Если изменение не просто разрешено, а обязано присутствовать:

```json
{
  "id": "must-add-input-fulfillment",
  "action": "allow",
  "event": "series_added",
  "name": "A Intermediate Input Fulfillment",
  "required": true
}
```

Если series не появилась:

```text
REQUIRED_CHANGE_MISSING
POLICY RESULT: FAIL
```

Это позволяет использовать policy как часть acceptance criteria новой версии.

---

# 11. Bounded numerical change

Для `series_changed` можно ограничить размер допустимого изменения:

```json
{
  "id": "bounded-price-change",
  "action": "allow",
  "event": "series_changed",
  "modes": 17,
  "name": "A Market Price",
  "max_abs": 5,
  "max_rel": 0.25,
  "max_changed_points": 2000
}
```

При превышении bound:

```text
THRESHOLD_EXCEEDED
POLICY RESULT: FAIL
```

---

# 12. HARD validation policy не отключает

Policy не может разрешить:

- invalid ModelJSON;
- `model.check()` failure;
- `NON_CONFORMING` экземпляр Capital Lifecycle Kernel;
- FAIL structure audits (неклассифицированный граничный поток, A/B-асимметрия);
- simulation error;
- negative/invalid physical states, если это HARD validation;
- broken energy/capital/transport accounting;
- другие candidate validation failures.

Это принципиально:

```text
validation = корректность модели
policy     = разрешённость version changes
```

Даже широкое allow-rule не может превратить HARD failure в PASS.

---

# 13. Быстро изменить policy без повторного расчёта

Полный comparison всех Modes (сейчас 27) дорогой по времени. Поэтому policy можно переоценить отдельно.

Если уже есть:

```text
output\compare-...\model-comparison.json
```

выполнить:

```cmd
EVALUATE_POLICY.cmd "output\compare-...\model-comparison.json"
```

Simulation повторно не запускается.

Можно передать другой policy вторым аргументом:

```cmd
EVALUATE_POLICY.cmd "output\compare-...\model-comparison.json" "D:\path\new-policy.json"
```

Отчёт `change-policy.*` создаётся рядом с указанным comparison report.

---

# 14. Policy event types

Поддерживаются:

```text
element_added
element_removed
definition_changed
type_changed
link_added
link_removed
simulation_changed
mode_added
mode_removed
scenario_input_changed
scenario_renamed
time_axis_changed
series_added
series_removed
series_changed
```

Подробное описание и примеры: `docs\CHANGE_POLICY_RU.md`.

---

# 14a. Lifecycle conformance

Отдельный статический прогон:

```cmd
LIFECYCLE_CONFORMANCE.cmd
```

Ожидаемый итог на поставляемой модели:

```text
Lifecycle kernel conformance: PASS
    A Electronics    CONFORMING_WITH_VARIATION
    B Electronics    CONFORMING_WITH_VARIATION
    A Power          CONFORMING_WITH_VARIATION
    B Power          CONFORMING_WITH_VARIATION
    A Refinery       CONFORMING
    B Refinery       CONFORMING
    Transport        CONFORMING
CONFORMANCE RESULT: PASS
```

`CONFORMING_WITH_VARIATION` — не предупреждение: это задокументированная отраслевая особенность (гейтирование legacy-switch, отсутствие финансового ограничения у Power).

QA checker'а:

```cmd
CONFORMANCE_SELF_TEST.cmd
```

Ожидается `CONFORMANCE QA RESULT: PASS (18 passed, 0 failed)`.

---

# 14b. Structure audits

```cmd
STRUCTURE_AUDIT.cmd
```

Ожидаемый итог на поставляемой модели (v7.7 r1):

```text
Open boundaries: 120; unclassified=0; closed-world violations=0
Colony symmetry: mismatches=0; parameter differences=102; exceptions=0
STRUCTURE AUDIT RESULT: PASS
```

`closed-world violations` — прогресс-метрика объявленного контракта границы расширения капитала: 7 (v7.4, все `Expansion` создавали капитал из ничего) → 1 (v7.5, оставался транспорт) → 0 (v7.5.1). Ноль не означает завершённую Planet v1: снаружи остаются руда, feedstock, рабочий ресурс энергетики и конечное потребление, каждый со своей категорией.

---

# 15. Policy QA

После установки выполнить:

```cmd
POLICY_SELF_TEST.cmd
```

Ожидаемый итог:

```text
POLICY QA RESULT: PASS (10 passed, 0 failed)
[OK] CHANGE POLICY QA PASSED
```

Тест проверяет:

- no-change strict PASS;
- default-deny;
- explicit allow;
- required changes;
- numerical thresholds;
- SHA + pinned engine binding;
- защита от частичного Mode comparison при финальном gate;
- реальный changed-candidate Mode 0;
- проход того же diff при полном явном разрешении.

QA использует временную папку и не меняет рабочие `input/`, `reference/`, `output/`.

---

# 16. Periodic web control

Web CSV остаются только внешней контрольной проверкой.

Подготовить партию:

```cmd
PREPARE_WEB_CHECK.cmd
```

Затем положить свежие browser CSV в:

```text
input\web_reference\pending\
```

И выполнить:

```cmd
RUN_LAB.cmd
```

Стенд сам определит Mode каждого CSV, проверит manifest/model SHA и после обработки архивирует партию в `output`.

Если CSV нет — локальная работа продолжается без них.

---

# 17. Явные пути

Factual compare произвольных файлов:

```cmd
COMPARE_MODELS.cmd "D:\accepted.json" "D:\candidate.json" "D:\validation.json" "0,12-16"
```

Policy check произвольных файлов:

```cmd
CHECK_CANDIDATE.cmd "D:\accepted.json" "D:\candidate.json" "D:\validation.json" "D:\change-policy.json" "0,12-16"
```

Для нормальной работы проекта явные пути обычно не нужны.

---

# 18. Рекомендуемый процесс разработки следующей версии модели

Для v7.4 и далее:

```text
1. Написать architecture spec.
2. Написать test plan.
3. На их основе создать change-policy.
4. Изменить candidate ModelJSON.
5. RUN_LAB.cmd.
6. CHECK_CANDIDATE.cmd.
7. Разобрать каждый UNEXPECTED/FORBIDDEN/THRESHOLD event.
8. Не расширять policy только ради зелёного отчёта без объяснения изменения.
9. После принятия новой модели отдельно обновить accepted checkpoint.
```

Policy должна описывать намерение **до** реализации либо быть выведена из явно утверждённой спецификации, а не подгоняться под фактический diff.

---

# 19. Что считать нормальным результатом

Неизменённая accepted v7.7 r1 + strict policy:

```text
COMPARISON RESULT: BYTE_IDENTICAL
POLICY RESULT: PASS
Observed changes: 0
```

Изменённый candidate без обновления policy:

```text
COMPARISON RESULT: DIFFERENT_OUTPUTS
POLICY RESULT: FAIL
Unexpected: >0
```

Намеренно изменённый candidate с корректным explicit contract:

```text
COMPARISON RESULT: DIFFERENT_OUTPUTS
POLICY RESULT: PASS
Expected/allowed: >0
Unexpected: 0
Forbidden: 0
Threshold exceed: 0
Required missing: 0
```

Именно третий случай станет нормальным путём для функциональных v7.4+ изменений.
