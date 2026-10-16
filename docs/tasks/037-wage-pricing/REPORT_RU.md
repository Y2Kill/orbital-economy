# Задание 037 — отчёт исполнителя

Ветка: `task/037-wage-pricing` от `main@f9049a4`. Поставка: **Orbital Economy v7.7.15 Wage Pricing candidate r1**, Lab v0.9.19. Среда локальных проверок: Windows x64, Node v24.11.1, simulation 9.0.0.

## Журнал

### Старт — 2026-10-16

- Выполнен guard до начала работы: 6 ожидаемых FAIL — нет коммитов, отчёта и четырёх candidate-файлов. Исходные SHA256SUMS совпадают; выходов за scope нет. В рабочем дереве существовал посторонний untracked-каталог, он не затрагивается.
- Прочитаны TASK_RU.md целиком, scope.json, спецификация, test plan, draft/, контракт §3–§5, §7–§9, порядок работы, документация узла/патча/validation и поставка/приёмка задачи 034. Ветка создана от текущего main.
- Декларация skeleton совпадает с draft/wage_pricing.json и фикстурой Lab. Прежние сценарные проверки и плагины validation сохранены; режимы 0–53 не получают вход Wage Pricing Enabled.

### КТ1 — 2026-10-16 — локальные apply / conformance / audit PASS

- Candidate r1 собран из owner skeleton: узел только секцией nodes, единственная явная замена — Test 2 Transport Surge Active, новые сценарии только 54–55, modify_scenarios пуст. APPLY_PATCH: 5505 элементов, 56 сценариев; definition fingerprint **f824db7010959d6d** совпал со спецификацией.
- Candidate SHA-256: `426ec607c170486ebbe3780ac59109f576edbfbb0bda4e0a9e1ae2e84b625583`.
- Conformance PASS: wage_pricing A/B — 2 CONFORMING, по 27/27 проверок. Audit PASS: граничных 262, unclassified 0, closed-world violations 0, symmetry mismatches 0, parameter differences 166; planet_v1 PASS, P6=4; 18 switches, 262144 combinations, 0 loops.
- check-validation: 0 ошибок. Проверка сериализации выявила только разницу записи экспонент в draft (например, 1e-09 против 1e-9). Validation приведена к JSON.stringify(v, null, 2) + LF; глубокое сравнение JSON с draft — без отличий. Policy привязана к новой сериализации: validation SHA-256 `3ef2797763b7abd9458284e8ac94d82a3e77d9ca120d369294ea50d79b8f5444`. Начатый предварительный policy-прогон остановлен до завершения и запущен заново с окончательными байтами; завершённым доказательством он не считается.
- Сформированы 7 аннотаций по §5. Реестр с объединёнными accepted annotations и fragment: 594 параметра, 75 asymmetric pairs, **0 asymmetric unannotated**, unknown annotations 0. Все четыре новые несимметричные пары покрыты.
- Доказательства локально: lab/output/task037/{apply-patch.log,conformance.log,audit.log,check-validation.log,delivery-verification.json,registry/}. Выходные артефакты игнорируются Git и не входят в поставку.
- После push ожидаются полный candidate.yml (пять gates, все Modes) и ci.yml на коммите candidate r1. Их ссылки и результаты проверяются отдельным шагом. КТ1 локально подтверждена; ссылка на candidate.yml будет дописана после определения запуска.
- Дальше: КТ2 — полный policy на Windows и Linux, регрессия Modes 0–53; КТ3 — все 56 Modes и таблица значений/порогов/запаса; КТ4 — полная поставка и финальный зелёный CI.

### Запуски КТ1 и контроль новых проверок — 2026-10-16

- Коммит поставки `af7e690` отправлен. Полный строгий guard: PASS, 0 fail / 1 ожидаемый SUMS warn; remote main=f9049a4, все 33 refs тегов совпадают.
- Ожидаются [candidate.yml 38890777719](https://github.com/Y2Kill/orbital-economy/actions/runs/38890777719) и [ci.yml 38890777712](https://github.com/Y2Kill/orbital-economy/actions/runs/38890777712). В candidate уже PASS Gates 1–3 (apply-patch, conformance, audit), выполняется полная validation. Итоговые исходы пока не объявляются.
- Первый локальный диагностический прогон Modes 54–55: оба PASS всех plugins и сценарных проверок. Он начат до нормализации записи чисел validation; её JSON-значения полностью совпадают с окончательной validation. Финальный полный Windows policy запущен с SHA 3ef27977… и отдельно подтвердит все 56 Modes.
- Отрицательный контроль на временной копии модели с switch=0 в Modes 54–55, окончательная validation: ровно 3 FAIL в Mode 54 (руда, еда и энергия B) и 2 FAIL в Mode 55 (доступность труда мягче, пик цены ниже), как test plan. Mode 55 без передачи: Labor Availability min=0.946109478402073, A Market Price max=36.5366960243617. Контроль намеренно завершился OVERALL FAIL; пороги не менялись.
- Полный Windows policy продолжается: все уже завершённые Modes имеют changed=0, maxAbs=0; частичный результат не считается закрытой КТ2.

### Организация полного Windows-сравнения — 2026-10-16

- Последовательный policy остановлен ради параллельного выполнения независимых сценариев: завершённые Modes 0–8 имели candidate validation PASS, common=1764, changed=0, added=18, removed=0, maxAbs=0. Этот незавершённый запуск не выдаётся за полный POLICY PASS.
- Запущены штатные compare для четырёх непересекающихся диапазонов 0–13, 14–27, 28–41 и 42–55. После завершения проверяются совпадение SHA моделей/validation, engine/settings/schema/structure, полнота 0–55 без повторов и validation каждого Mode. Затем штатный evaluate-policy проверяет объединённый отчёт с require_full_mode_coverage=true и неизменёнными правилами. CI candidate.yml выполняет отдельный полный последовательный цикл validation/policy.

### КТ1 — CI подтверждён, 2026-10-16

- [ci.yml 38890777712](https://github.com/Y2Kill/orbital-economy/actions/runs/38890777712) на `af7e690` — success: guard, tools-selftest и bench-selftests целиком PASS. NODE 66/66, QA 48/48, остальные self-tests и smoke Modes 0/12 PASS. Это самотесты стенда на принятой базе; шаг 0a со skeleton в роли принятой модели проверен владельцем до выдачи (§7.1 спецификации), исполнителем повторно не запускался.
- КТ1 подтверждена локальными apply/conformance/audit и Gates 1–3 [candidate.yml 38890777719](https://github.com/Y2Kill/orbital-economy/actions/runs/38890777719); полный candidate workflow ещё выполняется. Его validation SHA должен подтвердить привязку policy.
- Подтверждение зелёного CI и накопленные диагностические записи сохраняются отдельным report-only коммитом. После push ожидается ci.yml на новой голове журнала; candidate.yml продолжает проверять неизменённую поставку `af7e690`.
- Windows-сравнение продолжается по четырём диапазонам; завершённые сценарии имеют validation PASS и changed=0, maxAbs=0.

## Поставка и устройство

Поставляются ровно четыре файла в candidate/: model-patch.json, validation.json, change-policy.json, PARAMETER_ANNOTATIONS_fragment.json, и этот REPORT_RU.md. Узел wage_pricing раскрывает стенд; цена руды, энергии и еды каждого региона пропорционально отвечает на его зарплату. Фактор цены с эластичностью 0.5 умножает прежний эффективный конечный спрос на металл и электронику. При switch=0 выбираются прежние формулы. Внешняя ветка окна транспорта дополнена Mode 55.

Аннотации покрывают переключатель, Price Demand Elasticity, симметричную пару Food Labor Share и четыре несимметричные пары Ore/Energy Labor Share и Metal/Electronics Demand Reference Price. Региональные записи стоят на A с applies_to_mirror:true. Источники чисел и способ их получения указаны в evidence, включая исследование FINANCE_PROTOTYPE_2026-10-12_RU.md. Проверка реестра использует временное объединение с принятыми аннотациями.

## Обоснование правил policy

Все правила взяты из owner draft; default_action=deny и оба запрета сохранены. regression-guard-modes-0-53 запрещает любое изменение прежних рядов; forbid-removals-and-structural-drift запрещает удаления и изменение типа, времени, simulation или прежних сценарных входов.

| Allow-rule | Почему требуется |
|---|---|
| add-wage-pricing | Только 18 элементов узла по декларации из спецификации §1–2; имена ограничены switch, elasticity, региональными долями/опорными ценами/факторами/изменением зарплаты. |
| change-definitions-per-spec | Только 10 switch-wrapped замен узла и внешняя ветка окна всплеска Mode 55; остальные определения запрещены default-deny. |
| link-into-changed-definitions | Связи к указанным изменённым формулам для новых ссылок; произвольные цели не разрешены. |
| link-into-new-elements | Связи к именованным элементам декларации; новых потоков, запасов или физических границ нет. |
| add-modes-54-55 | Только два новых сценария по спецификации §3, добавление обязательно. |
| new-series-everywhere | Новые 18 наблюдаемых рядов существуют также при выключенном узле в прежних Modes; изменения общих прежних рядов этим правилом не разрешаются. |

## Отличия

- Содержательных отличий от owner skeleton/drafts нет: декларация, формулы, сценарии, значения/пороги validation и все правила policy сохранены.
- Служебная финализация патча: имя candidate r1 и явный modify_scenarios:[]. Policy name/description финализированы без изменения правил и допусков.
- Validation сериализована требуемым JSON.stringify(v, null, 2) + LF. Отличается только текстовая запись некоторых чисел, например 1e-09 → 1e-9; JSON-значения совпадают с draft. Поэтому validation_sha256 в policy изменён с `6c0c1ebc10fb5a709706d03f681eb4e61d753dbc69080ad004856a64cbe5f826` на `3ef2797763b7abd9458284e8ac94d82a3e77d9ca120d369294ea50d79b8f5444`; SHA должен быть подтверждён логом candidate.yml.
- Добавлен обязательный annotation fragment из семи записей; доли и опорные цены декларации не менялись.

## Ограничения и состояние

КТ1 подтверждена локально; КТ2–КТ4 и CI ещё не подтверждены. Готовность к приёмке пока не объявляется. Трёхлетняя validation не доказывает исследовательский эффект на 80-летнем горизонте. Спрос от дохода, деньги и сбережения остаются за пределами этого промежуточного шага. Доли труда ограничены 1; исходный ценовой уровень, местами ниже трудозатрат, здесь не пересчитывается в полные затраты (спецификация §8).

Принятые model/validation/policy, model/nodes, Lab, main и теги сохраняются. SHA256SUMS не пересобираются (sums_by=reviewer), [skip ci] не используется. Продвижение модели и приёмку выполняет владелец отдельным шагом.
