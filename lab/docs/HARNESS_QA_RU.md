# QA самого Orbital Economy Lab v0.9.12

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

Дополнительно v0.9.10 проверяет строгую схему validation (S1–S10):

- S1 — accepted validation против Modes accepted-модели: 0 ошибок;
- S2 — историческая выдержка 014 r2: 15 ошибок ровно в дефектных `checks[3..8]`, включая подсказки про `window` и вложенный `event`;
- S3 — незнакомый check `type` = schema error;
- S4 — три неверных формы `window` отвергаются;
- S5 — незнакомые поля top/scenario/event/term/plugin дают ошибки с JSON-путями;
- S6 — `note` / `notes` разрешены на всех поддержанных уровнях;
- S7 — отсутствующий в модели Mode отклоняется только при переданном наборе Modes;
- S8 — `runValidation` с schema mutation падает до simulation;
- S9 — comparator возвращает `NOT_COMPARED` до simulation;
- S10 — `check-validation` возвращает exit 1 на дефекте и 0 на accepted validation.

Ожидаемый итог v0.9.10: **42 passed, 0 failed**.

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


## 3c. Algebraic-loop QA (v0.9.5)

Запуск:

```text
LOOP_SELF_TEST.cmd
```

13 случаев на accepted и мутированных копиях:

- accepted (v7.7.7 r1): 13 переключателей, 8192 комбинации, 0 петель; с v7.7.2 ожидания для accepted выводятся из самой модели (2^N комбинаций; петля мутации — ровно в половине и ровно в Modes, где сценарий включает её переключатель), поэтому самотест не переписывается при каждом продвижении;
- исторический v7.6 r1: 16/32 комбинаций, только при `Power Resource Enabled=1`, Modes 25–26;
- мутация задачи 001 r1: половина комбинаций (128/256 на v7.7.2), только при `Intermediate Inputs Enabled=1`, Modes 17–33;
- runtime agreement: Mode 16 считается, Mode 17 падает у `simulation@9.0.0` с `Circular equation loop`;
- безусловная/условная петля, STOCK как разрыв, FLOW как same-step узел, self-reference;
- строгий parser failure с именем элемента;
- static integration: `runStructureAudits → FAIL`, comparator → `NOT_COMPARED` без simulation;
- детерминированность JSON и CLI `loops` с exit code 1 на петле.

Linux CI задачи 010: **13 passed, 0 failed**, около 17 s. Каноническая Windows-проверка выполняется владельцем при приёмке.

## 3d. Planet v1 closure QA (v0.9.6)

Запуск:

```text
PLANET_SELF_TEST.cmd
```

**16 случаев** на accepted модели и мутированных копиях:

- baseline: счётчики аудита точно равны счётчикам, посчитанным по видам объявлений самой декларации (с v7.7.2; оракул не зависит от проверок модели), при 0 ошибок; на v7.7.7 r1 — 17 process instances + 2 legacy; P2 11/6/0/0; P3 6/2/9/0; P4 0/6; P5 4/13; P6 4; reversibility 0;
- L1–L5: ложные capacity/energy declarations отвергаются; для далёких зависимостей сохраняется shortest path и число hops;
- completeness: удалённый process виден как undeclared в `report` и становится FAIL в `classify`;
- `planet_v1` / `planet_strict`: проверяются точные dimensions текущего долга;
- reversibility constant capacity (с v7.7.5 параметр читает отдельная переменная-зонд вне процессов: на константе осталась только руда), deposit closure, state-dependent demand driver и unread labor intensity;
- lower-case + whitespace в declaration names дают тот же verdict/counters;
- case 15: `runStructureAudits`, `STATIC_ONLY_PLUGINS` и `audit --planet-closure` интегрированы;
- case 16: JSON результата детерминирован.

Linux CI задачи 011: **16 passed, 0 failed**; каноническая Windows-проверка выполняется reviewer при приёмке.

## 3e. Node generator QA (v0.9.8)

Запуск:

```text
NODE_SELF_TEST.cmd
npm run node-qa
```

Девять случаев работают от **текущей** accepted-модели и двух деклараций `model/nodes/`, без привязки к историческому имени ModelJSON:

1. обе декларации вырезаются из accepted в обратном порядке (после принятых `simple_capital`, которые лежат поверх) и собираются заново; определения (кроме `description`), замены, новые LINK и generated validation совпадают; на baseline v7.7.7 r1 диагностика: Construction Materials Plant = 69/6/126, Capital Goods Plant = 76/6/138;
2. patch с `nodes` и предварительно раскрытый patch дают одинаковые определения модели;
3. неизвестное поле декларации отвергается с путём;
4. неизвестный тип узла отвергается;
5. отсутствующая ссылка, которую должна заменить capacity-formula, отвергается;
6. пересечение generated и explicit add/replace отвергается;
7. ссылка декларации на отсутствующий элемент base отвергается;
8. повторное раскрытие даёт byte-identical JSON;
9. CLI `expand-nodes --validation` на уже принятой validation возвращает `validation.merged.json`, побайтно равный входному файлу.

Linux CI задачи 015: **9 passed, 0 failed**; case 9 — 871633 bytes identical. Это проверка разработки, а не каноническая Windows-приёмка.

## 4. Fail-fast

Если web-reference batch не проходит preflight, длительные simulation не запускаются.

Если accepted или candidate не проходит static validation в model comparator, numerical comparison не запускается. С v0.5.0 в static validation входит Capital Lifecycle Kernel conformance, с v0.6.0 — structure audits, с v0.9.5 — безусловный switch-aware algebraic-loop audit, с v0.9.6 — декларативный `planet_closure`. Ложная Planet declaration или нарушение активного enforce-mode блокирует candidate до сценарной simulation.

Policy preflight отдельно проверяет:

- format policy;
- accepted-model SHA;
- validation SHA;
- comparator tolerance contract.

Static/HARD/physics failure нельзя превратить в PASS через policy allow-rule.

## 3f. Simple-capital node QA (v0.9.9)

Cases 1–9 задачи 015 сохранены. С v7.7.5 шахта фикстуры стоит в принятой модели: case 10 снимает её и собирает заново, cases 12, 13 и 15 раскрывают фикстуру на модели без неё, case 12 перед слиянием убирает из validation принятые A/B Regolith Mine. Cases 10–15 добавляют: интеграцию regolith fixture с merged validation (2 CONFORMING, loops=0, P2.simple=2, unclassified=0); strip/rebuild всех `simple_capital` из `model/nodes/` плюс временной модели case 10; запрет VARIABLE sizing signal; generated-name conflict; unknown-field path; byte-determinism 34/6/78.

Case 10 также клонирует текущий accepted Mode 37 в временный Mode 38, включает `Regolith Mine Capital Enabled`, выполняет real simulation, общие/runtime plugin checks и проверяет широкий численный envelope reference-прототипа.

Linux CI 36397985918 до добавления Mode 38 probe: `NODE SELF-TEST: 15 passed, 0 failed`, полный `bench-selftests` PASS. Финальная голова обязана пройти тот же набор уже с runtime probe.

Static fail-fast comparator включает failures `simple_capital` в hard-error list; policy не может их разрешить.


## 3g. Smooth-cap / per-colony signal QA (v0.9.11)

`NODE_SELF_TEST.cmd` расширен до **21** случаев. Новые cases 16–21 используют `power-resource-mine-simple.json` и работают от слоя без узла, если сектор уже присутствует в accepted.

- 16: 36/6/94, byte-determinism, дословный `Uncapped Output` и старая ветка;
- 17: все `simple_capital` CONFORMING, loops=0, unclassified=0, P2 +2 simple / −2 exceptions;
- 18: real simulation последнего Mode с включённым switch; `rate <= Uncapped Output + 1e-9` и `rate <= Capacity + 0.001 + 1e-9` во всех точках; runtime/plugin checks PASS;
- 19: strip/rebuild без отличий definitions/replacements/LINK;
- 20: отрицательные формы `capacity_output` отвергаются с путём;
- 21: object `initial` требует точные colony keys и задаёт разные A/B initial values.

## 3h. Deposit node + retarget QA (v0.9.12)

`NODE_SELF_TEST.cmd` расширен с 21 до **27** случаев. Cases 22–27:

- 22 — `deposits.json` раскрывается в 100 add / 8 replace / 6 retarget / 212 LINK; APPLY_PATCH даёт definition fingerprint `7d8fe41cc6df5c1a`;
- 23 — validation merge идемпотентен; 6 deposit instances CONFORMING; loops=0; Planet P4.with_deposit растёт на 6; open-boundary unclassified=0;
- 24 — real simulation клона последнего Mode с `Deposits Enabled=1`: общие/runtime plugin checks PASS, и хотя бы один Proven Reserves STOCK поднимается выше initial;
- 25 — deposit-слой снимается (включая возврат extraction FLOW в ∅) и собирается заново без различий definitions/endpoints/LINK;
- 26 — отвергаются extra parameter, отсутствующий colony-key, extraction FLOW уже не из ∅ и конфликт node-generated/explicit retarget;
- 27 — явный `retarget_flows` может сослаться на STOCK из того же `add_elements`, а comparator классифицирует изменение endpoint как `definition_changed`.

Фактический PASS для конкретной головы ветки фиксируется Actions/отчётом задачи; этот раздел описывает ожидаемый self-test contract, а не заменяет прогон.
