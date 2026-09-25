# QA самого Orbital Economy Lab v0.9.2

## 1. Operational QA

Запуск:

```text
QA_SELF_TEST.cmd
```

QA создаёт одноразовые временные рабочие каталоги в системной temp-папке и не изменяет рабочие `input/`, `reference/` и `output/`.

Проверяются прежние operational cases:

- ровно одна model JSON и одна validation JSON;
- отказ при нескольких model/validation JSON;
- отсутствие web CSV → `SKIPPED`;
- корректная web партия → `PASS`;
- missing / duplicate / extra Mode → `FAIL`;
- CSV без `Timed Test Mode` → `FAIL`;
- отсутствующий manifest → `FAIL`;
- model SHA mismatch → `FAIL`;
- защита pending batch от перезаписи;
- архивирование партии и очистка pending;
- явное хранение model + validation SHA;
- identical model → нет semantic structural changes;
- изменение `behavior` обнаруживается;
- добавленный Mode обнаруживается;
- generic checks `relation` / `identity` / `bounded` (v0.6.1) проходят и падают корректно на синтетических рядах;
- model patch (v0.7.0): аддитивный патч применяется, загружается и проходит `model.check()`, база не изменяется; повторное имя, отсутствующая цель, не-STOCK endpoint у FLOW, несовпадение base SHA и malformed-записи отклоняются.

- parameter registry (v0.8.0): инвентарь = все числовые константы + начальные запасы, переключатели распознаны, аннотации сливаются (в т.ч. на зеркало), неизвестные имена — предупреждение, malformed-файл отклоняется.

Ожидаемый итог: **29 passed, 0 failed**.

## 2. Integration QA factual comparator

Запуск:

```text
COMPARE_SELF_TEST.cmd
```

В disposable temp-папке реально выполняется Mode 0:

1. accepted vs accepted → `BYTE_IDENTICAL`;
2. accepted vs временный candidate с контролируемым изменением `A Local Base Demand` → `DIFFERENT_OUTPUTS`;
3. structural diff должен указать изменённое definition.

Это тестирует связку:

```text
ModelJSON → scenario application → simulation@9.0.0 → validation → series comparison → report
```

## 3. Change-policy QA

Запуск:

```text
POLICY_SELF_TEST.cmd
```

Тестируются policy semantics и один реальный changed-candidate Mode 0.

Ожидаемые проверки:

- strict policy PASS при отсутствии изменений;
- default-deny отклоняет незаявленное изменение;
- explicit allow принимает заявленное изменение;
- required expected change должен действительно произойти;
- numerical threshold применяется;
- accepted SHA binding применяется;
- pinned engine version binding применяется;
- full Mode coverage gate отклоняет частичный comparison;
- реальный изменённый candidate отклоняется strict policy;
- тот же diff проходит при полном явном покрытии rules.

Ожидаемый итог: **10 passed, 0 failed**.

## 3a. Lifecycle conformance QA (v0.5.0)

Запуск:

```text
CONFORMANCE_SELF_TEST.cmd
```

14 статических негативных/позитивных случаев на мутированных копиях **реальной** accepted-модели + 3 runtime-случая на реальном Mode 0. Включает два принципиальных «не-нарушения»: изменение времени активации Transport и изменение коэффициента policy-формулы Refinery должны оставаться `CONFORMING`. Полный список — `LIFECYCLE_CONFORMANCE_RU.md`, §5.

Ожидаемый итог: **18 passed, 0 failed** (v0.9.0: + kernel-v2).

## 3b. Structure audit QA (v0.6.0)

Запуск:

```text
STRUCTURE_SELF_TEST.cmd
```

20 случаев на мутированных копиях реальной модели: классификация границ и режимы `enforce`; счётчик closed-world (accepted 0; добавление одного искусственного unbacked Expansion даёт 0 → 1); зеркальность — формула/тип/endpoints/LINK/отсутствие зеркала как mismatch, числовой параметр — нет; исключения без reason отклоняются; асимметричный candidate → `NOT_COMPARED`. Полный список — `STRUCTURE_AUDIT_RU.md`, §3.

Ожидаемый итог: **21 passed, 0 failed** (v0.9.0: + пары преобразования).

## 4. Fail-fast

Если web-reference batch не проходит preflight, длительные simulation не запускаются.

Если accepted или candidate не проходит static validation в model comparator, numerical comparison не запускается. С v0.5.0 в static validation входит Capital Lifecycle Kernel conformance, с v0.6.0 — structure audits: неконформный или асимметричный candidate даёт `NOT_COMPARED` без единой симуляции.

Policy preflight отдельно проверяет:

- format policy;
- accepted-model SHA;
- validation SHA;
- comparator tolerance contract.

Static/HARD/physics failure нельзя превратить в PASS через policy allow-rule.
