# Отчёт по заданию 024 — energy_consumer

## Журнал

### КТ1 — 2026-10-02 — генератор energy_consumer и базовые QA
Сделано:
- добавлен тип узла `energy_consumer` со строгой схемой декларации;
- добавлена фикстура `lab/fixtures/nodes/process-energy.json`;
- добавлены случаи node QA 28, 32 и 33;
- случай 28 проверяет 71 добавленный элемент / 14 заменённых элементов / 232 связи и отпечаток `fe5f022b5d81ec3b`;
- случай 32 проверяет пять обязательных ошибок: лишнее поле, отсутствующая колония в `signal.initial`, `energy_per_unit = 0`, отсутствующий `allocator.available`, уже подключённый потребитель;
- случай 33 проверяет отсутствие замены общей доли при отсутствии приоритетных потребителей (12 замен вместо 14).

Доказательство:
- коммит КТ1: `8fadea5382f3d5eff974dc31bc1a14200191327b`;
- ожидается CI для головы `8fadea5382f3d5eff974dc31bc1a14200191327b`; результат будет проверен отдельным шагом.

Не запускалось:
- локальный `check_branch` и локальный стенд: среда не имеет сетевого git checkout; работа ведётся через GitHub API по §9.4;
- SHA256SUMS не пересобирались: `sums_by: reviewer`.

Не подтвердилось:
- пока нет; CI ещё не проверен.

Дальше:
- проверить CI КТ1 отдельно;
- КТ2: validation fragments/merge, `planet_closure energy.signal/fulfillment`, `energy_balance priority`, QA 29–31, planet 17–18 и QA 43.

### Перенос ветки — 2026-10-02 — новый main и лимит CI
Ветка перенесена владельцем на новый `main` `beeeff0d5b298cfddc1a1282e16c62a8a06199e3`; продолжение начинается с головы `c62ec8daad3460d373d11cd2708178d9d888cb5a`. Старые SHA выше сохранены как исторические записи журнала. Лимит `bench-selftests` в CI поднят до 60 минут и манифесты пересобраны владельцем. Предыдущий длинный прогон был остановлен таймаутом CI, а не диагностированным дефектом кода.

Уточнение приёмочного oracle для case 29/N3: `Process Energy Enabled` ещё не проводится сценариями принятой модели (это задача 025), поэтому аудит петель не добавляет новую перебираемую ось. Case 29 должен требовать `combinationsWithLoops === 0` и `combinations === baselineAudits.algebraicLoops.combinations` того же случая, без константы 32768.


### КТ2 — 2026-10-02 — validation fragments и расширения энергетических проверок
Сделано:
- generated validation fragment `energy_consumer` добавляет потребителей в `energy_balance.consumers`, приоритетных потребителей в `energy_balance.priority`, signal-flow patterns в `open_boundaries.information_signal` и per-process `planet_closure.energy`;
- merge идемпотентен и сохраняет прежнее поведение существующих типов узлов;
- `planet_closure` поддерживает `energy.signal` как строго ограниченный мост через объявленный STOCK-сигнал и его boundary FLOW, а также per-process `energy.fulfillment`;
- `energy_balance.priority` проверяет `X K Energy Fulfillment Ratio >= X Energy Fulfillment Ratio` с `abs_tol`;
- добавлены node QA 29–31, Planet QA 17–18 и QA 43;
- oracle case 29 исправлен после уточнения N3: число комбинаций сравнивается с базовым аудитом того же случая, `combinationsWithLoops === 0`; `Process Energy Enabled` не добавляет сценарную ось до задачи 025.

Доказательство:
- кодовая голова КТ2: `c88433963aee8795810a5cf15db9937688cb2253`;
- GitHub Actions CI run: https://github.com/Y2Kill/orbital-economy/actions/runs/37006501565 — `completed / success`;
- в этом run: QA 43/43, Planet 18/18, Structure 21/21, Loop 15/15, Conformance 18/18, Policy 10/10, Compare PASS, Bench Modes 0,12 `OVERALL: PASS`;
- case 29 подтверждает loops = 0 и число combinations, равное baseline-аудиту; на текущей принятой базе это 16384.

Не запускалось:
- локальный `check_branch` и локальный Windows acceptance: работа через GitHub API по §9.4; строгий branch guard и Linux CI выполнены самим Actions;
- SHA256SUMS не пересобирались: `sums_by: reviewer`.

Не подтвердилось:
- дефектов КТ2 на зелёном CI не осталось;
- прежний timeout до переноса ветки не считается дефектом кода.

Дальше:
- КТ3 по §4: версия Lab 0.9.13, документация, статусные файлы и финальный отчёт.
