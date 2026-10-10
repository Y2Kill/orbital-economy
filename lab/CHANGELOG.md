## v0.9.18 — labor_market node

- новый declarative type `labor_market` (Planet v2 step 3): спрос = per-capita norm × Population, гибкая зарплата и labor-availability guard выпуска;
- fixture: **31 add / 24 replace / 108 LINK**, fingerprint `8ac752ca9a1175e4`; все 24 замены switch-wrapped через `Labor Market Enabled`, числовые old branches вынесены в именованные параметры;
- generated validation: plugin `labor_market`, wage information boundaries и переобъявление Planet P6 с population-dependent demand targets на per-capita norms;
- static HARD conformance + runtime invariants; QA case 47; NODE cases 53–59, включая all-plugin runtime при switch=1, numeric strip/rebuild и верхнюю слоистость над food/population/labor;
- node layering при синтетической «accepted + labor_market» модели приоритизирует внешний labor_market слой перед нижними node declarations;
- package/Lab version → v0.9.18; accepted model, validation, policy, engine и `model/nodes/*` не изменены.

## v0.9.17 — food node

- новый declarative type `food` (Planet v2 step 2): региональные запасы/потребление еды, фермы с землёй/капиталом/энергией/трудом и попарная торговля через общий транспорт;
- fixture: **96 add / 24 replace / 239 LINK**, fingerprint `c18a59dd39488c12`; все 24 замены switch-wrapped через `Food Enabled`;
- generated validation: plugin `food`, категории `agriculture` / `final_consumption`, capital transformation/retirement и процесс `farming` в `planet_closure`;
- static HARD food conformance и runtime invariants; node_qa cases 46–52, QA case 46;
- switchless layering предварительно снимает переключаемые узлы, которые читают или оборачивают элементы labor/population;
- package/Lab version → v0.9.17; accepted model, validation и policy не изменены.

## v0.9.16 — population node

- новый declarative type `population`: региональное население, рождения, смерти, учёт труда, воспринимаемая привлекательность и направленная миграция; без switch и без обратной связи населения на экономику;
- fixture задачи 029: 49 add / 0 replace / 90 LINK, 2 migration FLOW, fingerprint `35d24655fc422942`;
- generated validation: plugin `population`, `demography_births` / `demography_deaths` и расширение `information_signal`; semantic merge идемпотентен;
- static HARD conformance миграционной топологии и dependencies; runtime: неотрицательность, employment bounds, labor-force identity и conservation migration out=in;
- self-tests расширены до NODE 45 и QA 45;
- package/Lab version → v0.9.16; accepted model, validation, policy, engine, `model/nodes/*`, tools и vendor не изменены.

## v0.9.15 — labor node

- новый declarative type `labor`: labor requirement = output × intensity × automation factor, без switch; automation factor при уровне 0 равен ровно 1;
- process fixture задачи 027: 69 add / 4 replace / 123 LINK, 17 instances, fingerprint `8da2d7d17c679eda`;
- generated validation: plugin `labor` + `planet_closure.labor.requirement`, идемпотентный merge и conflict checks;
- static HARD conformance и runtime проверки диапазонов/неотрицательности/product identity;
- Planet P5 сохраняет старый `report`, но `planet_v1`/strict требуют requirement;
- self-tests расширены до QA 44, Planet 20, Node 39;
- package/Lab version → v0.9.15; accepted model, validation, policy и `model/nodes/*` не изменены.

# Changelog

## v0.9.14 — exact algebraic-loop audit speed-up

- default `auditAlgebraicLoops` использует четыре точных сокращения: candidate SCC nodes, condition cache, static formula/component cache, relevant-switch projection;
- прежний полный 2^n алгоритм сохранён как `{ exhaustive: true }`; CLI: `loops <model.json> --exhaustive`;
- публичная форма audit/details и порядок полей не меняются; основной oracle — byte-identical fast/exhaustive JSON;
- LOOP_SELF_TEST расширен с 15 до 19 cases: real-model equality, six-switch projection, undecidable non-switch condition, warm-cache determinism;
- алгоритм остаётся синхронным; worker threads не вводятся;
- Lab/package/CLI version → v0.9.14; accepted model, validation, policy, engine, `model/nodes/*`, tools и vendor не изменены.
- Round 2: case 16 pins accepted/mutation exhaustive checks to at most 10 scenario switches (mandatory `Intermediate Inputs Enabled` retained for mutation 001), keeping the oracle substantive while preventing QA time from doubling with every future model switch.


## v0.9.13 — energy_consumer node

- новый declarative type `energy_consumer`: process rates → smoothed energy signal → requested/allocated energy → fulfillment-limited rate;
- fixture `process-energy.json` = 71 add / 14 replace / 232 LINK, prototype fingerprint `fe5f022b5d81ec3b`;
- опциональный `priority:true`: priority allocation выполняется до общей доли; без priority общая ratio не заменяется;
- generated validation дополняет `energy_balance.consumers/priority`, `information_signal` и `planet_closure.processes[].energy`;
- `planet_closure.energy.signal` разрешает только declared signal STOCK bridge и проверяет boundary/information topology; per-process `energy.fulfillment` переопределяет глобальный;
- `energy_balance.priority` проверяет `priority fulfillment >= general fulfillment` с `abs_tol`;
- NODE_SELF_TEST 33, PLANET_SELF_TEST 18, QA_SELF_TEST 43; КТ2 CI run 37006501565 полностью PASS;
- Lab/package/CLI version → v0.9.13; accepted model, validation, policy, engine, `model/nodes/*` и vendor не изменены;
- N3 задачи 024 уточнён владельцем: loop combinations сравниваются с baseline-аудитом (v7.7.8: 16384), потому что `Process Energy Enabled` ещё не проводится Modes до задачи 025.


## v0.9.12 — deposit node + retarget_flows

- новый declarative type `deposit`: конечные undiscovered/proven запасы, smoothed extraction signal, exploration с physical backing и smooth depletion cap; fixture = 100 add / 8 replace / 6 retarget / 212 LINK, fingerprint `7d8fe41cc6df5c1a`;
- model patch v1 получил строгий `retarget_flows`; endpoints existing FLOW меняются после `add_elements`, ненулевые endpoints обязаны быть STOCK, double/generated+explicit retarget отвергаются;
- generated validation создаёт plugin `deposit`, `exploration_expenditure`, signal patterns `information_signal` и `planet_closure.deposit`; merge идемпотентен;
- static conformance проверяет типы/topology/dependencies; runtime — неотрицательность deposit stocks/flows и identity backing consumption;
- NODE_SELF_TEST расширен до 27 cases (22–27: prototype fingerprint/counts, validation/P4/loops, runtime growth, strip/rebuild, schema conflicts, explicit retarget comparator event);
- package/Lab version → v0.9.12; accepted model, validation, policy, engine и `model/nodes/*` не изменены.
- до выдачи задачи 023 (версия та же; найдено прогоном самотестов со skeleton v7.7.8 в роли принятой модели): `node_qa` — отпечаток месторождений сверяется, только пока слой не принят (после — снятие и пересборка, случай 25); случай 17 убирает из validation фрагменты слоёв, снятых выше шахты энергоресурса; пробный Mode случая 18 отбрасывает значения сценариев для переключателей снятых слоёв. `planet_qa` — случай 1 не держит число «expected source outputs» (добыча из месторождений перестаёт быть выходом из ∅); случай 7 выбирает удаляемый процесс по модели; случай 11 работает и когда все добычи уже из месторождений (односторонний возврат потока B в ∅); случай 15 даёт CLI текущую декларацию и сверяет отчёт с её счётчиками.

## v0.9.11 — simple_capital smooth cap + per-colony initial

- `capacity_output` требует ровно один из `replaces` / `cap`; `cap: "smooth"` разрешён только у `simple_capital`;
- smooth cap создаёт `X S Uncapped Output` с дословной прежней формулой и использует насыщение `U / (1 + (U / (C + 0.001)) ^ 8) ^ 0.125`;
- `sizing.signal.initial` принимает число либо объект с точными ключами `colonies`;
- power-resource fixture = 36 add / 6 replace / 94 LINK; NODE_SELF_TEST расширен до 21 случаев;
- package/Lab version → v0.9.11; accepted model, validation, policy, engine и `model/nodes/*` не изменены.
- до выдачи задачи 021 (версия та же; найдено прогоном самотестов со skeleton v7.7.7 в роли принятой модели): `node_qa` случай 17 сравнивает сумму «исключения + необъявленные» P2 — при уже принятом узле его слой снимается вместе с объявлением мощности процесса, и тот считается необъявленным; `planet_qa` случай 9 ждёт провала только по ненулевым долгам (P2 exceptions станут 0) и PASS, если долгов нет.

## v0.9.10 — strict validation schema

- новый `src/validation_schema.js`: строгая статическая форма validation с JSON-путями; неизвестные поля, check/plugin types, malformed windows и сценарии отсутствующих Modes — HARD errors;
- `RUN_LAB` / `test` блокируются до simulation; comparator / policy возвращают `NOT_COMPARED` до численного сравнения, schema error policy не разрешает;
- новый `check-validation <validation.json> [model.json]` и `CHECK_VALIDATION.cmd`; exit 1 при schema errors, 0 при корректной схеме;
- QA S1–S10: accepted validation = 0 errors; выдержка task 014 r2 = 15 errors ровно в checks 3–8; integration gates и CLI exit codes;
- отчёты RUN_LAB и comparator показывают отдельный список schema errors с путями;
- package/Lab version → v0.9.10; accepted model, validation, policy, engine, model nodes и plugin runtime semantics не изменены.
- до выдачи задачи 019 (версия та же): `node_qa` читает порядок снятия узлов из модели — следующим снимается узел, чей переключатель внешний на всех его заменах (узлы, дополняющие одни формулы, вкладываются друг в друга); ожидаемое число `simple_capital` в случае 10 берётся из validation; `planet_qa` случаи 8 и 10 сами объявляют добычу руды константой, когда в декларации констант не осталось. Проверено с skeleton v7.7.6 в роли принятой модели.

## v0.9.9 — simple capital node

- новый declarative type `simple_capital`: 8 capital roles, optional smoothed demand STOCK, physical backing consumption, switch-gated capacity/output/demand rewrites; fixture задачи 016 = 34 add / 6 replace / 78 LINK;
- generated validation: plugin `simple_capital`, `capital_transformation` + `capital_retirement`, transformation pairs, `planet_closure.capacity.kind=simple`; semantic merge создаёт отсутствующие plugin/category и остаётся идемпотентным;
- static conformance требует topology/dependencies и STOCK sizing signal; runtime проверяет capacity/flows >= 0; simple failures являются HARD для RUN_LAB и comparator/CHECK_CANDIDATE;
- Planet P2 расширен до kernel/simple/exceptions/undeclared; simple STOCK использует тот же max_hops proof, что kernel; structure reports обновлены;
- `NODE_SELF_TEST` 15 cases, включая strip/rebuild, strict schema/conflict/determinism и Mode 38 runtime probe;
- Lab/package version → v0.9.9; accepted model/validation/policy, model/nodes, tools, vendor и engine не изменены.
- при продвижении v7.7.5 r1 (задача 017, версия стенда та же): `node_qa` снимает принятые `simple_capital` раньше заводов (case 1), а фикстуру раскрывает на модели без неё (cases 12, 13, 15); `planet_qa` case 10 читает константу мощности отдельной переменной-зондом — на константе осталась только руда.

## v0.9.8 — declarative model node generator

- новый `src/nodes/`: строгий registry/schema и генератор `capital_lifecycle` v1; формулы совпадают с прототипом задачи 015, а ссылки, replacement target и конфликты имён проверяются до применения;
- model patch v1 получил необязательный `nodes`; узлы раскрываются последовательно относительно base, а пересечение generated и explicit add/replace — ошибка; патчи без `nodes` сохраняют прежнюю семантику;
- новый CLI `expand-nodes` пишет `patch.expanded.json`, `validation.fragments.json` и при `--validation` — идемпотентный `validation.merged.json`;
- generated validation включает kernel-v2 instances, open-boundary transformation names/pairs и planet capacity; повторно существующие записи обязаны совпадать (у kernel instance дополнительный `policy_notes` не считается различием);
- `NODE_SELF_TEST.cmd` / `node-qa`: 9 version-independent случаев; на accepted v7.7.4 r1 две декларации дают 69/6/126 и 76/6/138, merged validation — 871633 bytes identical;
- Lab/package version → v0.9.8; accepted model/validation/policy и существующие семь рукописных kernel-экземпляров не изменены.

## v0.9.7 — energy_balance: список потребителей энергии

- плагин validation `energy_balance` принимает `consumers` — потребителей общего аллокатора колонии (`X K Requested Energy` / `X K Allocated Energy`); по умолчанию `["Metal", "Electronics"]`, при котором проверки, их имена и порядок прежние;
- нужно для v7.7.2 (стройматериалы потребляют энергию): тождество `Supply = Σ Allocated` иначе ложно по построению;
- QA: +1 случай (три потребителя — PASS; по умолчанию на тех же данных тождество FAIL); QA 32/32.

## v0.9.6 — Planet v1 per-process closure audit

- new `src/planet_closure.js`: declarative static P2–P6 process audit over accepted ModelJSON, with canonical case-insensitive/trim name resolution and deterministic dependency paths;
- process completeness reuses the existing `open_boundaries` classification instead of maintaining a second source-flow list;
- capacity checks support kernel STOCK, documented constant/unbounded exceptions and constant-parameter reversibility; energy checks prove request aggregation, fulfillment and a shared planned-rate dependency;
- extraction deposits, labor intensity and external demand drivers are reported separately so Planet v1 debt is not hidden behind a single boundary counter;
- enforce modes: `report`, `classify`, `planet_v1`, `planet_strict`; current v7.7.1 r1 report is P2=7/10/0, P3=4/2/11/0, P4=0/6, P5=4/13, P6=4, reversibility=0;
- `audit --planet-closure=<file>` lets a declaration be tested before promotion into accepted validation; structure-audit and RUN_LAB reports include counters, exception reasons and paths;
- `planet_closure` is static-only in runtime checks and participates in the common structure gate when configured;
- `PLANET_SELF_TEST.cmd` / `planet-qa`: 16 cases, including L1–L5 false declarations, enforce modes, reversibility, deposits, demand/labor negatives, normalized names, CLI integration and deterministic JSON;
- package/Lab version bumped to v0.9.6; model, accepted validation, policy and simulation-engine behavior are unchanged.


## v0.9.5 — switch-aware static algebraic-loop audit

- new `src/loop_audit.js`: deterministic same-step dependency graph over VARIABLE/FLOW; STOCK cuts dependencies; Tarjan SCC plus deterministic shortest-cycle extraction;
- switch recognition is data-driven (model literal 0/1 + scenario coverage + only 0/1 scenario values); accepted v7.7.1 r1 has 7 switches / 128 combinations;
- round 2: formula/scenario names are resolved like the bench/engine with `trim().toLowerCase()` while reports retain canonical ModelJSON names; unresolved `[Name]` references are a static FAIL instead of being ignored;
- nested `IfThenElse` is pruned only for decidable substituted numeric conditions; state/time/unknown conditions conservatively retain both branches; malformed delimiters fail with the element name;
- audit runs unconditionally inside `runStructureAudits`; any possible loop is a HARD static failure and makes model comparison `NOT_COMPARED` before simulation;
- reports added to `structure-audit.md/.json`, RUN_LAB report, and standalone `loops` CLI (`algebraic-loops.md/.json`, exit 1 on loop);
- `LOOP_SELF_TEST.cmd` / `loop-qa`: 15 cases including v7.6 r1 (16/32), mutation 001 r1 (64/128), case-insensitive construction-materials mutation (64/128, Modes 27–31), unresolved-reference failure, runtime engine agreement, STOCK/FLOW/self-loop, parser failure, integration and determinism;
- package/lab version bumped to v0.9.5; model, validation, policy and engine behavior are unchanged.


## v0.9.4 — bit-exact series digest for cross-platform diagnosis

- new `series` CLI command hashes every simulated series as canonical little-endian Float64 bytes, hashes the time axis separately and emits a deterministic per-Mode digest;
- `--dump=MODE` writes exact IEEE-754 hexadecimal values; `--plan=file.json` dumps only selected differing series for diagnosis;
- QA contains a fixed SHA-256 vector for `[0, -0, 1, pi]`; changing byte order or value encoding makes the case fail;
- instrumentation only: model, validation, policy and simulation-engine behavior are unchanged.

## v0.9.3 — vendored offline install + enforced engine pin

- `INSTALL.cmd`: installation now uses only the repository's `vendor/*.tgz`: a separate temporary npm cache is seeded from the two tarballs, then `npm ci --offline` installs strictly from `package-lock.json`; the user's normal npm cache and network are not required;
- `src/engine.js`: single enforcement point for `simulation@9.0.0`; the installed version is read from `node_modules/simulation/package.json`, a mismatch aborts startup with a diagnostic, and reports receive the actual installed version instead of a display-only constant;
- all direct `simulation` imports used by the bench are routed through the engine-pin module; CLI paths and self-tests that load the engine therefore share the same check;
- `QA_SELF_TEST`: +1 negative case — a temporary fake `simulation/package.json` with version 9.0.1 must be rejected; failure of the pin check makes the QA case fail;
- package/lab version bumped to v0.9.3; install, pin and licence documentation updated for vendored dependencies.

## v0.9.2 — гигиена репозитория, без изменений поведения проверок

Первый коммит после нулевого (`v7.6-r2`). Модель, validation и policy не менялись.

- `PARAMETER_REGISTRY`: пути к модели и аннотациям в отчёте пишутся относительно корня репозитория (`util.repoPath`), файл вне репозитория — только именем. Раньше `path.resolve` записывал в версионируемый `docs/PARAMETER_REGISTRY.md` абсолютный локальный путь (к тому же устаревший — на старую папку проекта). Реестр перегенерирован; числа не изменились;
- удалён `examples/` (модель, validation и policy v7.4.1): ни стенд, ни самотесты его не читали, а README называл его «test fixtures для self-tests». v7.4.1 остаётся в архиве проекта;
- `README_RU.md`: утверждения о текущем состоянии приведены к v7.6 r2 (CONFORMANCE QA 18, число Modes, пример strict-результата); разделы «что изменилось в v0.x» не трогались — их числа верны для своей версии;
- `package-lock.json`: версия пакета выровнена с `package.json` (была 0.9.0 со времён v0.9.0); зависимости не менялись;
- корневой `SHA256SUMS.txt` теперь покрывает и `lab/SHA256SUMS.txt`;
- `.gitignore`: `*.log` сужено до `lab/**/*.log` — лог вне стенда может быть доказательством приёмки (`apply-patch.log` в пакетах задач).

## v0.9.1 — общая инфраструктура в kernel-v2 и честные самотесты

Изменения стенда, накопленные в версиях модели v7.5.1 и v7.6 (раньше не были записаны в этот файл).

- `capital_lifecycle_kernel`: необязательная роль `capital_goods_consumption_secondary` (FLOW `<любой STOCK> → ∅`, deps `[expansion]`). Нужна общей инфраструктуре: расширение транспорта v7.5.1 физически обеспечивается Capital Goods **из обоих** региональных запасов, поэтому у одного `expansion` две ноги потребления. Экземпляр с такой ролью получает вариацию, а не NON_CONFORMING; runtime-проверки неотрицательности учитывают второй поток;
- `audit_run.js`: формулировки отчёта о границах. `closed-world violations = 0` означает выполнение **объявленного** контракта границы расширения капитала, а не завершённость Planet v1 — прежний текст («планета самостоятельна при 0») читался как более сильное утверждение, чем даёт проверка;
- **самотесты перестали быть тавтологичными.** `expect(name, fn)` считает провалом только `v === false` или исключение, а пять проверок в `structure_qa.js` / `conformance_qa.js` были написаны как `condition ? 'детали' : JSON.stringify(...)` — то есть в ветке провала возвращали непустую строку и проходили всегда. Под этим скрывались устаревшие ожидания: 104 граничных потока (в v7.6 их 108) и фиксированный список из 4 пар преобразования (в accepted validation их 13). Ветка провала теперь бросает исключение с диагностикой;
- те же проверки перебазированы на **текущий** accepted вместо зашитых чисел: границы проверяются как «classified = all, unclassified 0, closed-world 0», пары — против объявленного в validation списка (выбросили пару → её потоки становятся unpaired), kernel-v2 spec-error воспроизводится удалением ролей v2 у экземпляра, который в production уже kernel-v2;
- QA после исправления: QA 29/29, POLICY 10/10, CONFORMANCE 18/18, STRUCTURE 21/21, COMPARE PASS — на accepted v7.6 r2.

Урок в контракт поставки (§8.11): проверка, которая не может провалиться, хуже отсутствующей — она создаёт ложную уверенность и консервирует устаревшие ожидания.

## v0.9.0 — transformation pairs + kernel-v2 roles (preparation for v7.5)

- `open_boundaries`: категория может требовать пару (`requires_pair: true`); плагин получает `transformation_pairs: [{source, sinks[], identity?}]` — поток-источник (∅ → сток), физически обеспеченный потоками-стоками (сток → ∅). Поток такой категории без объявленной пары = FAIL (classify), пара на несуществующий поток = FAIL. Численное тождество пары — обычный `identity`-check в validation;
- `capital_lifecycle_kernel`: роли kernel-v2 `desired_expansion` (VARIABLE) и `capital_goods_consumption` (FLOW `<любой STOCK> → ∅`, deps `[expansion]`); `instances[].kernel_version: 2` делает их обязательными; runtime `Expansion <= Desired Expansion`; v1-экземпляры без изменений;
- STRUCTURE QA 21/21, CONFORMANCE QA 18/18;
- baseline validation → `validation-v7.4.2.json`: объявлены пары руда → металл и feedstock → электроника (раньше численно не проверялись) + identity-проверки; policy → `change-policy-v7.4-strict-r2.json` (перепривязка).

Мотивация: в SD поток не конвертирует единицы, поэтому «оборудование → мощность» (v7.5), как и «руда → металл», — пара sink/source; критерий самостоятельности планеты должен считать такие пары закрытыми только при объявлении и численной проверке.

## v0.8.1 — comparator: static audits on the ACCEPTED side are informational

- `compareModels`: kernel conformance и structure audits остаются HARD для **candidate**, но для **accepted** только печатаются: accepted был принят под своим контрактом, а структурная задача может законно ужесточить validation (например, убрать исключения `colony_symmetry`), из-за чего старый accepted перестаёт удовлетворять новому контракту. Раньше это блокировало сравнение целиком (`NOT_COMPARED`);
- обнаружено на skeleton-патче задачи 002 (симметризация тестовой обвязки).

## v0.8.0 — exogenous parameter registry

- `src/parameters.js` + `node src/cli.js parameters [model] [--annotations=…]` + `PARAMETER_REGISTRY.cmd` — реестр всего, что задаётся извне: числовые константы, начальные запасы, переключатели (по ключам сценариев), тестовые множители; A/B-пары с флагом асимметрии; секторная группировка; слияние с ручным файлом аннотаций `orbital-economy-parameter-annotations-v1` (роль / что меняет / доказательство; `applies_to_mirror` распространяет аннотацию на пару); покрытие и список **несимметричных пар без аннотации** как долг;
- `QA_SELF_TEST`: +3 → **29 passed, 0 failed**;
- `docs\PARAMETER_REGISTRY_RU.md`.

Мотивация (решение владельца проекта, 2026-09-21): модель принимается такой, какое поведение она показывает, но каждый внешний параметр должен быть учтён — какой он и что именно меняет.

## v0.7.1 — comparator: added series are not an output difference

- `compareSimulationResults`: per-scenario `DIFFERENT` только при численном изменении, удалении рядов или несовпадении сетки; новые ряды — отдельно (`addedSeries`, `addedSeriesOnly`), события `series_added` для policy без изменений;
- новый общий результат `OUTPUTS_IDENTICAL_WITH_NEW_SERIES`; аддитивный candidate с новыми Modes теперь получает `COMMON_OUTPUTS_IDENTICAL_WITH_NEW_MODES`, как и обещает критерий приёмки, а не `DIFFERENT_OUTPUTS` при `changed = 0`;
- обнаружено на приёмке candidate r1 задачи 001 (v7.4).

## v0.7.0 — declarative model patch (delivery format for contractors without a bench)

База: Lab v0.6.1. Модель не изменена.

- `src/patch.js` + `node src/cli.js apply-patch <patch.json> [base.json] [--out=…]` + `APPLY_PATCH.cmd` — применение декларативного патча (`orbital-economy-model-patch-v1`: `add_elements`, `replace_formulas`, `add_links`, `modify_scenarios`, `add_scenarios`) к замороженной accepted-модели; результат — candidate ModelJSON. Удаления и переименования не поддерживаются намеренно;
- патч проверяется схемой и по существу: повторные имена, отсутствующие цели, FLOW с не-STOCK endpoints, дубликаты LINK, неизвестные элементы в сценариях, несовпадение `base_sha256` — отказ с точным сообщением;
- новым элементам `display` не добавляется (движок его не требует; v7.3 r2 сам удалял невалидные display у новых FLOW);
- `QA_SELF_TEST`: +6 случаев → **26 passed, 0 failed**;
- `docs\MODEL_PATCH_RU.md`.

Мотивация: исполнитель-LLM без возможности запускать стенд отдаёт маленький ревьюируемый патч, а не 584 КБ модели; candidate собирает стенд детерминированно.

## v0.6.1 — declarative HARD invariants in validation JSON

База: Lab v0.6.0. Модель не изменена.

- generic checks `relation` (поточечное `<=` / `>=` двух рядов), `identity` (линейное тождество), `bounded` (диапазон) — HARD-инварианты новой механики (v7.4+) теперь задаются в `validation.json` без правки кода стенда; работают в `global_checks` и `scenarios.<mode>.checks`;
- `QA_SELF_TEST`: +3 случая на синтетических рядах → **20 passed, 0 failed**;
- `docs\VALIDATION_FORMAT_RU.md` дополнен.

Мотивация: контракт поставки требует от исполнителя исполняемые критерии проверки; без этих типов любой новый инвариант требовал бы кода в `checks.js`.

## v0.6.0 — structure audits: open boundaries + colony symmetry

База: **Orbital Economy Lab v0.5.0**. Модель v7.3 r2 не изменена (SHA `57a2a102…`).

Добавлено:

- `src/structure_audit.js` — два статических плагина validation JSON:
  - `open_boundaries` — классификация всех FLOW, пересекающих границу модели (`from`/`to` = null), по категориям с флагом `closed_world`; режимы `report` / `classify` / `closed_world`; счётчик «closed-world violations» как прогресс-метрика к самостоятельной планете;
  - `colony_symmetry` — зеркальность A/B: существование зеркального элемента, тип, формула по модулю переименования ссылок, endpoints потоков, LINK; числовые параметры могут отличаться (перечисляются); исключения только с обязательным `reason`;
- `STRUCTURE_AUDIT.cmd` / `node src/cli.js audit` — отдельный прогон с отчётом `structure-audit.md/.json`;
- оба аудита встроены в `RUN_LAB` (раздел в `report.md`, FAIL → `OVERALL: FAIL`) и в static validation `COMPARE_MODELS` / `CHECK_CANDIDATE` (FAIL → `NOT_COMPARED`);
- `STRUCTURE_SELF_TEST.cmd` — 20 QA-случаев на мутированных копиях реальной модели;
- `input\validation\validation-v7.3.2.json` — добавлены оба плагина (7 категорий границ; 11 задокументированных исключений симметрии — все тестовая обвязка сценариев);
- `input\policy\change-policy-v7.3-strict-r3.json` — ревизия policy под SHA validation-v7.3.2;
- `docs\STRUCTURE_AUDIT_RU.md`; обновлены README, QUICK_START, `VALIDATION_FORMAT_RU.md`, `ARCHITECTURE_RU.md`, `HARNESS_QA_RU.md`, `CHANGE_POLICY_RU.md`, `TEST_STATUS_RU.md`.

Результат на baseline v7.3 r2:

```text
open boundaries: 90 of 119 flows; unclassified=0; closed-world violations=7 (семь потоков Expansion)
colony symmetry: pairs=646, links=1252, mismatches=0, parameter differences=42, exceptions=17
```

Подтверждено на Windows: QA 17/17 (20/20 c v0.6.1), COMPARE PASS, POLICY 10/10, CONFORMANCE 17/17, **STRUCTURE 20/20**; RUN_LAB Modes 0–16 PASS; CHECK_CANDIDATE `BYTE_IDENTICAL` / `POLICY PASS` (policy r3). См. `docs\TEST_STATUS_RU.md`.

## v0.6.0 — structure audits: open boundaries + colony symmetry

База: **Orbital Economy Lab v0.5.0**. Модель v7.3 r2 не изменена (SHA `57a2a102…`).

Добавлено:

- `src/structure_audit.js` — два статических плагина validation JSON:
  - `open_boundaries` — классификация всех FLOW, пересекающих границу модели (`from`/`to` = null), по категориям с флагом `closed_world`; режимы `report` / `classify` / `closed_world`; счётчик «closed-world violations» как прогресс-метрика к самостоятельной планете;
  - `colony_symmetry` — зеркальность A/B: существование зеркального элемента, тип, формула по модулю переименования ссылок, endpoints потоков, LINK; числовые параметры могут отличаться (перечисляются); исключения только с обязательным `reason`;
- `STRUCTURE_AUDIT.cmd` / `node src/cli.js audit` — отдельный прогон с отчётом `structure-audit.md/.json`;
- оба аудита встроены в `RUN_LAB` (раздел в `report.md`, FAIL → `OVERALL: FAIL`) и в static validation `COMPARE_MODELS` / `CHECK_CANDIDATE` (FAIL → `NOT_COMPARED`);
- `STRUCTURE_SELF_TEST.cmd` — 20 QA-случаев на мутированных копиях реальной модели;
- `input\validation\validation-v7.3.2.json` — добавлены оба плагина (7 категорий границ; 11 задокументированных исключений симметрии — все тестовая обвязка сценариев);
- `input\policy\change-policy-v7.3-strict-r3.json` — ревизия policy под SHA validation-v7.3.2;
- `docs\STRUCTURE_AUDIT_RU.md`; обновлены README, QUICK_START, `VALIDATION_FORMAT_RU.md`, `ARCHITECTURE_RU.md`, `HARNESS_QA_RU.md`, `CHANGE_POLICY_RU.md`, `TEST_STATUS_RU.md`.

Результат на baseline v7.3 r2:

```text
open boundaries: 90 of 119 flows; unclassified=0; closed-world violations=7 (семь потоков Expansion)
colony symmetry: pairs=646, links=1252, mismatches=0, parameter differences=42, exceptions=17
```

Подтверждено на Windows: QA 17/17 (20/20 c v0.6.1), COMPARE PASS, POLICY 10/10, CONFORMANCE 17/17, **STRUCTURE 20/20**; RUN_LAB Modes 0–16 PASS; CHECK_CANDIDATE `BYTE_IDENTICAL` / `POLICY PASS` (policy r3). См. `docs\TEST_STATUS_RU.md`.

## v0.6.0 — structure audits: open boundaries + colony symmetry

База: **Orbital Economy Lab v0.5.0**. Модель v7.3 r2 не изменена (SHA `57a2a102…`).

Добавлено:

- `src/structure_audit.js` — два статических плагина validation JSON:
  - `open_boundaries` — классификация всех FLOW, пересекающих границу модели (`from`/`to` = null), по категориям с флагом `closed_world`; режимы `report` / `classify` / `closed_world`; счётчик «closed-world violations» как прогресс-метрика к самостоятельной планете;
  - `colony_symmetry` — зеркальность A/B: существование зеркального элемента, тип, формула по модулю переименования ссылок, endpoints потоков, LINK; числовые параметры могут отличаться (перечисляются); исключения только с обязательным `reason`;
- `STRUCTURE_AUDIT.cmd` / `node src/cli.js audit` — отдельный прогон с отчётом `structure-audit.md/.json`;
- оба аудита встроены в `RUN_LAB` (раздел в `report.md`, FAIL → `OVERALL: FAIL`) и в static validation `COMPARE_MODELS` / `CHECK_CANDIDATE` (FAIL → `NOT_COMPARED`);
- `STRUCTURE_SELF_TEST.cmd` — 20 QA-случаев на мутированных копиях реальной модели;
- `input\validation\validation-v7.3.2.json` — добавлены оба плагина (7 категорий границ; 11 задокументированных исключений симметрии — все тестовая обвязка сценариев);
- `input\policy\change-policy-v7.3-strict-r3.json` — ревизия policy под SHA validation-v7.3.2;
- `docs\STRUCTURE_AUDIT_RU.md`; обновлены README, QUICK_START, `VALIDATION_FORMAT_RU.md`, `ARCHITECTURE_RU.md`, `HARNESS_QA_RU.md`, `CHANGE_POLICY_RU.md`, `TEST_STATUS_RU.md`.

Результат на baseline v7.3 r2:

```text
open boundaries: 90 of 119 flows; unclassified=0; closed-world violations=7 (семь потоков Expansion)
colony symmetry: pairs=646, links=1252, mismatches=0, parameter differences=42, exceptions=17
```

Подтверждено на Windows: QA 17/17 (20/20 c v0.6.1), COMPARE PASS, POLICY 10/10, CONFORMANCE 17/17, **STRUCTURE 20/20**; RUN_LAB Modes 0–16 PASS; CHECK_CANDIDATE `BYTE_IDENTICAL` / `POLICY PASS` (policy r3). См. `docs\TEST_STATUS_RU.md`.

## v0.6.0 — structure audits: open boundaries + colony symmetry

База: **Orbital Economy Lab v0.5.0**. Модель v7.3 r2 не изменена (SHA `57a2a102…`).

Добавлено:

- `src/structure_audit.js` — два статических плагина validation JSON:
  - `open_boundaries` — классификация всех FLOW, пересекающих границу модели (`from`/`to` = null), по категориям с флагом `closed_world`; режимы `report` / `classify` / `closed_world`; счётчик «closed-world violations» как прогресс-метрика к самостоятельной планете;
  - `colony_symmetry` — зеркальность A/B: существование зеркального элемента, тип, формула по модулю переименования ссылок, endpoints потоков, LINK; числовые параметры могут отличаться (перечисляются); исключения только с обязательным `reason`;
- `STRUCTURE_AUDIT.cmd` / `node src/cli.js audit` — отдельный прогон с отчётом `structure-audit.md/.json`;
- оба аудита встроены в `RUN_LAB` (раздел в `report.md`, FAIL → `OVERALL: FAIL`) и в static validation `COMPARE_MODELS` / `CHECK_CANDIDATE` (FAIL → `NOT_COMPARED`);
- `STRUCTURE_SELF_TEST.cmd` — 20 QA-случаев на мутированных копиях реальной модели;
- `input\validation\validation-v7.3.2.json` — добавлены оба плагина (7 категорий границ; 11 задокументированных исключений симметрии — все тестовая обвязка сценариев);
- `input\policy\change-policy-v7.3-strict-r3.json` — ревизия policy под SHA validation-v7.3.2;
- `docs\STRUCTURE_AUDIT_RU.md`; обновлены README, QUICK_START, `VALIDATION_FORMAT_RU.md`, `ARCHITECTURE_RU.md`, `HARNESS_QA_RU.md`, `CHANGE_POLICY_RU.md`, `TEST_STATUS_RU.md`.

Результат на baseline v7.3 r2:

```text
open boundaries: 90 of 119 flows; unclassified=0; closed-world violations=7 (семь потоков Expansion)
colony symmetry: pairs=646, links=1252, mismatches=0, parameter differences=42, exceptions=17
```

Подтверждено на Windows: QA 17/17 (20/20 c v0.6.1), COMPARE PASS, POLICY 10/10, CONFORMANCE 17/17, **STRUCTURE 20/20**; RUN_LAB Modes 0–16 PASS; CHECK_CANDIDATE `BYTE_IDENTICAL` / `POLICY PASS` (policy r3). См. `docs\TEST_STATUS_RU.md`.

## v0.5.0 — Capital Lifecycle Kernel conformance

База: **принятая Orbital Economy Lab v0.4.0**. Все механизмы v0.4.0 (`RUN_LAB`, `COMPARE_MODELS`, `CHECK_CANDIDATE`, `EVALUATE_POLICY`, web-reference workflow) сохранены. Accepted-модель v7.3 r2 **не изменена** (SHA `57a2a102…`).

Добавлено:

- `src/lifecycle_conformance.js` — статический checker Capital Lifecycle Kernel: типы примитивов, топология 7 потоков, обязательные зависимости (ссылка + LINK), целостность ссылок, семантика legacy-switch `Capital Lifecycle Enabled`; классификация `CONFORMING` / `CONFORMING_WITH_VARIATION` / `NON_CONFORMING`;
- плагин `capital_lifecycle_kernel` в validation JSON — единый декларативный mapping `роль → примитив`, используемый и статическим, и runtime-слоем;
- runtime-проверки kernel на каждом Mode: `Active <= Installed`, тождества Inactive/Lifetime, `Target Active <= Installed`, `Target Active <= Required Active`, стоки >= 0, потоки >= 0 (7 проверок × 7 экземпляров);
- `LIFECYCLE_CONFORMANCE.cmd` / `node src/cli.js conformance` — отдельный статический прогон с отчётом `lifecycle-conformance.md/.json`;
- conformance встроен в `RUN_LAB` (раздел в `report.md`, `NON_CONFORMING` → `OVERALL: FAIL`) и в static validation `COMPARE_MODELS` / `CHECK_CANDIDATE` (неконформный candidate → `NOT_COMPARED`, policy видит hard blocker);
- `CONFORMANCE_SELF_TEST.cmd` — 17 QA-случаев на мутированных копиях реальной модели, включая два «не-нарушения» (sector parameterization / policy formula);
- `input\validation\validation-v7.3.1.json` — плагин `capital_lifecycle` заменён на `capital_lifecycle_kernel` с 7 экземплярами: A/B Electronics, A/B Power, **A/B Refinery, Transport** (последние три ранее не покрывались kernel-тождествами);
- `input\policy\change-policy-v7.3-strict-r2.json` — ревизия policy, привязанная к SHA нового validation-файла; accepted SHA прежний;
- `docs\LIFECYCLE_CONFORMANCE_RU.md`; обновлены `VALIDATION_FORMAT_RU.md`, `ARCHITECTURE_RU.md`, `HARNESS_QA_RU.md`, `CHANGE_POLICY_RU.md`, `TEST_STATUS_RU.md`.

Сохранено для совместимости: плагин `capital_lifecycle` (форма `items`) по-прежнему поддерживается.

Подтверждено на Windows (Node v24.11.1, simulation@9.0.0):

- `QA_SELF_TEST`: 17/17; `COMPARE_SELF_TEST`: PASS; `POLICY_SELF_TEST`: 10/10; `CONFORMANCE_SELF_TEST`: 17/17;
- `LIFECYCLE_CONFORMANCE`: 7 экземпляров, 0 `NON_CONFORMING`;
- `RUN_LAB` Modes 0–16 с validation-v7.3.1: OVERALL PASS, 49 kernel runtime-проверок на Mode, 0 отказов;
- `CHECK_CANDIDATE` accepted vs identical candidate, policy r2: см. `docs\TEST_STATUS_RU.md`.

Основной проектный смысл:

```text
KERNEL CONFORMANCE = соответствует ли сектор общему физическому lifecycle-контракту?
VALIDATION         = корректна ли модель физически и сценарно?
CHANGE POLICY      = разрешено ли отличие от accepted baseline?
```

Kernel-контракт намеренно не судит отраслевую policy (формулы Required/Desired/Reserve, времена, коэффициенты).

## v0.4.0 — explicit change contract / regression policy

База: **принятая Orbital Economy Lab v0.3.0**. Смысл `RUN_LAB.cmd`, optional web-reference workflow и factual `COMPARE_MODELS.cmd` сохранён.

Добавлено:

- `CHECK_CANDIDATE.cmd` — полный accepted↔candidate comparison + policy gate одной командой;
- `EVALUATE_POLICY.cmd` — повторная policy-оценка уже готового `model-comparison.json` без нового simulation run;
- `POLICY_SELF_TEST.cmd` — synthetic + real Mode 0 integration QA change-policy слоя;
- `input\policy\` — отдельная папка для единственного активного versioned change contract;
- строгая поставляемая policy `change-policy-v7.3-strict.json` для accepted v7.3 r2;
- привязка policy к accepted-model SHA-256;
- опциональная привязка к validation SHA-256;
- привязка policy к comparator tolerance settings;
- default-deny семантика для незаявленных изменений;
- `require_full_mode_coverage` guard: финальный policy gate отклоняет частичный Mode comparison;
- ordered first-match rules;
- allow/deny rules по типу change event, Mode и glob имени;
- `required: true` для изменений, которые должны обязательно появиться;
- bounds `max_abs`, `max_rel`, `max_changed_points` для разрешённых `series_changed`;
- классификации `EXPECTED_CHANGE`, `UNEXPECTED_CHANGE`, `FORBIDDEN_CHANGE`, `THRESHOLD_EXCEEDED`;
- HARD/static/physics validation остаётся неотключаемой policy;
- `change-policy.md` + `change-policy.json`;
- factual comparator теперь сохраняет полный список changed series в JSON, а не только diagnostic top-N, чтобы policy не могла пропустить изменение вне preview;
- factual comparator фиксирует фактические tolerance settings в report для policy preflight;
- подробная документация `docs\CHANGE_POLICY_RU.md`.

Основной проектный смысл:

```text
COMPARE_MODELS = что изменилось?
CHANGE POLICY  = было ли это изменение явно разрешено контрактом?
```

Policy не оценивает качество экономического дизайна и не должна подгоняться постфактум ради зелёного отчёта.

## v0.3.0 — accepted model-to-model regression foundation

База: принятая Orbital Economy Lab v0.2.1.

Добавлено:

- `COMPARE_MODELS.cmd` — accepted ↔ candidate comparison;
- frozen baseline в `reference\accepted\model\`;
- structural/behavioral/model diff;
- added/removed Modes и scenario input changes;
- запуск одинаковых Modes обеих моделей через `simulation@9.0.0`;
- exact all-series output comparison;
- candidate validation;
- `model-comparison.md` + `model-comparison.json`;
- `COMPARE_SELF_TEST.cmd`.

Принятие v0.3.0 подтверждено на Windows:

- QA_SELF_TEST: 17/17 PASS;
- COMPARE_SELF_TEST: PASS;
- полный accepted vs identical candidate Modes 0–16: `BYTE_IDENTICAL`;
- каждый Mode: 827 common series, changed=0, added=0, removed=0, maxAbs=0.

## v0.2.1 — accepted harness hardening

- operational/negative QA;
- fail-fast web-reference preflight;
- duplicate/missing/extra Mode detection;
- manifest/SHA ownership protection;
- safe archive/reset of web reference batch.
