# Отчёт по заданию 027 — labor node

## Журнал

### КТ1 — 2026-10-03 — генератор `labor`, строгая схема, self-test 34/38/39
Сделано: добавлен тип узла `labor` и фикстура; раскрытие повторяет порядок прототипа и проверяет контракт декларации; добавлены self-test 34, 38 и 39.
Доказательство: ожидаемые инварианты в self-test — 69 добавленных элементов / 4 замены / 123 связи / 17 экземпляров; отпечаток `8da2d7d17c679eda`.
Не запускалось локально: среда имеет только GitHub API-коннектор, без сетевого локального git/стенда; `check_branch` и Node self-tests по §9.4 не запускались; `SHA256SUMS` не пересобирался (`sums_by: reviewer`).
CI: GitHub Actions run `37124982126` — SUCCESS.
Дальше: КТ2 — validation fragments/merge, статический и runtime plugin `labor`, строгий `planet_closure labor.requirement`, self-tests 35–37, planet 19–20, QA 44.

### КТ2 — 2026-10-03 — validation, `planet_closure labor.requirement`, static/runtime plugin `labor`, self-tests 35–37/19–20/44
Сделано: добавлено идемпотентное слияние `labor` и Planet P5; строгая проверка `requirement`; статический HARD conformance и runtime-проверки диапазонов/произведения; самотесты задания.
Проверки КТ1: GitHub Actions run `37124982126` — SUCCESS. На КТ2 CI обнаружил две ошибки только в новых Planet QA: сначала синтаксическую опечатку synthetic fixture, затем устаревшее ожидание case 9, которое не учитывало новый обязательный долг P5 для четырёх прежних `declared` без `requirement`; обе исправлены до КТ3.
Не запускалось локально: по §9.4 локального стенда нет; `check_branch`/Node self-tests не запускались локально; `SHA256SUMS` не менялся.
Дальше: КТ3 — Lab 0.9.15, документация и полный CI на итоговой реализации.

### КТ3 — 2026-10-03 — Lab v0.9.15, документация, полный CI
Сделано: версия Lab поднята до `0.9.15`; обновлены NODES/VALIDATION/STRUCTURE_AUDIT/HARNESS_QA/TEST_STATUS/README/CHANGELOG. `package.json` сохранил исходные CRLF и отсутствие завершающего перевода строки. Канонические `model/validation/policy` и `model/nodes/*` не менялись; `SHA256SUMS` не менялся (`sums_by: reviewer`).

Итоговая архитектура:
- узел `labor` генерирует per-process intensity/automation factor/requirement и totals, без switch;
- при automation=0 коэффициент строго 1; Smelting/Electronics cost используют intensity × factor;
- validation merge создаёт plugin `labor` и заполняет `planet_closure.processes[].labor.requirement` идемпотентно;
- Planet `report` сохраняет старое поведение declared labor без requirement, а `planet_v1`/strict дают `P5: labor declared without a requirement variable`;
- static HARD conformance проверяет роли/прямые зависимости/LINK, runtime — диапазоны, неотрицательность и product identity.

Эталонные результаты: **69 add / 4 replace / 123 LINK / 17 instances**, fingerprint `8da2d7d17c679eda`; Planet P5 после merge = **17/0**; A Smelting automation=0.5 даёт factor **0.525** и снижает labor-компонент себестоимости.

Проверки: GitHub Actions run `37126138178` — полный SUCCESS: QA **44/44**, Planet **20/20**, Node **39/39**; также SUCCESS у Structure, Loop, Conformance, Policy, Compare, Tools, Guard и bench Modes 0/12.

Локально не запускалось: по §9.4 исполнитель работал через GitHub API-коннектор без локального сетевого git/стенда; поэтому локальные `check_branch` и Node/bench команды не запускались. Их эквивалентные repository guard/self-test этапы выполнены GitHub Actions.
