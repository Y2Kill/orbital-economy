# Задание 030 — отчёт исполнителя

Ветка: `task/030-population` от `main@1763ce677839dd96fecac39312a05b2f5cc4290c`.

## Среда и ограничения

Исполнение через GitHub API-коннектор, без локального checkout с сетью. Поэтому локальная команда `node tools/check_branch.mjs --scope=docs/tasks/030-population/scope.json` и стенд не запускаются; для такого режима `docs/tasks/README_RU.md` предписывает пропустить локальную самопроверку и опираться на `ci.yml` / `candidate.yml`. Перед началом проверены опубликованный `scope.json`, код guard и точная база ветки `1763ce677839dd96fecac39312a05b2f5cc4290c`. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не меняются: `sums_by = reviewer`.

## Поставка

Кандидат r1:
- `candidate/model-patch.json` — только декларативный узел `population` из owner draft; `add_elements`, `replace_formulas`, `add_links`, `modify_scenarios`, `add_scenarios` пусты;
- `candidate/validation.json` — тот же Git blob, что `draft/validation-v7.7.11-draft.json`, то есть байт-в-байт owner draft;
- `candidate/change-policy.json` — owner draft с финализированными именем/описанием; правила и ожидаемый `validation_sha256` не менялись;
- `candidate/PARAMETER_ANNOTATIONS_fragment.json` — аннотации всех 11 параметров декларации population, с единицами и происхождением значений.

## Журнал

### Старт — 2026-10-05 — кандидат r1 отправляется
Сделано: ветка создана строго от `1763ce677839dd96fecac39312a05b2f5cc4290c`; собран candidate r1 без ручного раскрытия узла, без переключателя, новых Modes и изменений сценариев. Validation копируется байт-в-байт из owner draft.
Доказательство: база `1763ce677839dd96fecac39312a05b2f5cc4290c`; owner validation SHA-256 по опубликованному пакету — `49f806b2ccd0b776c5c1e65e8687fad09f9ccad375e2edb2a36da9d22a814841`.
Не запускалось локально: `check_branch`, APPLY_PATCH, conformance, audit, validation, CHECK_CANDIDATE и self-tests стенда — среда API-коннектора, согласно §9.4/README.
Дальше: отдельно проверить `candidate.yml` и `ci.yml`; после подтверждения каждого контрольного результата немедленно дописывать КТ1–КТ4.

## Отличия

От модели, test plan и owner drafts по существу отличий нет. Декларация `population` и validation не изменены; пороги не ослаблялись; policy-правила не изменены. В policy финализированы только имя и описание кандидата. Аннотации добавлены как требуемая поставка задачи и не влияют на модель.
