# Задание 035 — отчёт исполнителя

Ветка: `task/035-recalibration` от `main@a15f6aa0a35384594ee5b194d31168c75745e232`.

## Среда и ограничения

Поставка выполняется через GitHub API-коннектор. Ветка создана строго от опубликованной базы. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не меняются (`sums_by=reviewer`). `model/nodes/*` не меняется.

## Журнал

### Старт — 2026-10-11 — candidate r1
Прочитаны `TASK_RU.md`, `V7_7_14_RECALIBRATION_SPEC.md`, sensitivity report и весь `draft/`. Candidate r1 собран непосредственно из owner skeleton: **ровно четыре** `replace_formulas` — `Power Operating Reserve Factor=1.1`, `Labor Participation Share=0.52`, `A/B Labor Demand Signal initial_value=14.56/4.42`. Сценариев, nodes, add/remove элементов и связей нет.
Validation поставляется тем же Git blob, что owner draft. Policy сохраняет owner rules и `validation_sha256=b28a25e4dc5a37494821e68cd068e0774c293d1aa91e0abb4df04c51f1b29576`; меняются только name/description из DRAFT в candidate.

### КТ1 — ожидается candidate.yml
Ожидание: patch применяется; conformance/audit PASS, boundaries 262, symmetry 0, loops 0/131072, `planet_v1 PASS`.

### КТ2 — ожидается candidate.yml
Ожидание: policy PASS; разрешены series changes во всех Modes, обязательны ровно четыре definition changes; структурных событий 0.

### КТ3 — ожидается candidate.yml
Ожидание: validation 54/54 PASS; по фактическому artifact/report будет заполнена таблица 16 пересмотренных проверок «проверка → значение → порог → запас».

### КТ4 — ожидается финальная голова
Ожидание: четыре candidate-файла + REPORT, candidate 5/5 PASS и ci зелёный. Журнал по КТ1–КТ4 после зелёных прогонов будет дописан отдельным journal-only коммитом.

## Поставка

- `candidate/model-patch.json` — owner skeleton, финализированное имя candidate r1; только 4 `replace_formulas`.
- `candidate/validation.json` — byte-identical owner draft, многострочный JSON.
- `candidate/change-policy.json` — owner draft; правила и validation SHA не менялись.
- `candidate/PARAMETER_ANNOTATIONS_fragment.json` — обновлённые аннотации `Power Operating Reserve Factor`, `Labor Participation Share`, `Target Labor Tightness`; последний помечен ключевым.

## Отличия

По четырём значениям модели, validation-проверкам, policy rules и порогам отличий от опубликованных owner skeleton/drafts **нет**. Техническая финализация только служебная: имя candidate r1, policy name/description без пометки DRAFT и обязательный annotation fragment.

Никаких дополнительных «улучшений» или ослаблений validation не внесено. `Target Labor Tightness` не меняется численно — обновляется только его аннотация как ключевого долгосрочного параметра.

## Ограничения

Это полная перекалибровка, поэтому точная regression-цепочка v7.7.13 сознательно обрывается: `regression_modes=[]`. Структура модели и сценарии должны остаться неизменными.
