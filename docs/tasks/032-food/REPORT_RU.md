# Задание 032 — отчёт исполнителя

Ветка: `task/032-food` от `main@4b419c9f562166b2dc56181fcd61548ad2b37db5`.

## Среда и ограничения

Исполнение через GitHub API-коннектор, без локального checkout со стендом. Поэтому локальные `check_branch`, APPLY_PATCH и validation не запускаются; по §9.4 опираюсь на GitHub Actions `ci.yml` и `candidate.yml`. Ветка создана строго от опубликованной базы. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` не меняются (`sums_by=reviewer`).

## Журнал

### Старт — 2026-10-09 — кандидат r1 отправляется
Сделано: прочитаны TASK, архитектурная спецификация, test plan и весь draft. Candidate r1 собран из owner skeleton: узел `food` декларацией, одна замена `Test 2 Transport Surge Active`, Modes 49–51, `modify_scenarios=[]`. Modes 0–48 не модифицируются и `Food Enabled` в них не прописывается. Validation ставится тем же Git blob, что owner draft.
Доказательство: база `4b419c9f562166b2dc56181fcd61548ad2b37db5`; ожидаемый validation SHA-256 из owner policy — `b0c49ceea10deb5e681a9125be2ab15643932852e065a27b6b9e84bdb23d6956`.
Дальше: дождаться первого полного `candidate.yml` и `ci.yml`; КТ1–КТ3 записать по фактическим строкам run.

### КТ1 — ожидается candidate.yml
Ожидание: model fingerprint `c2ce1d6b11f56df8`; food 2 CONFORMING; boundary 254/unclassified 0; loops 0/65536; planet_v1 PASS, P2 11/8/0/0, P3 16/2/1/0, P5 19/0.

### КТ2 — ожидается candidate.yml
Ожидание: Modes 0–48 `changed=0`, policy PASS, unexpected=0.

### КТ3 — ожидается candidate.yml
Ожидание: validation PASS 52/52 и сценарные проверки Modes 49–51 с фактическими значениями/запасами из первого run.

### КТ4 — ожидается финальная голова
Ожидание: поставка полная, parameter registry — 0 неаннотированных несимметричных A/B-пар, candidate 5/5 PASS, ci зелёный.

## Поставка

- `candidate/model-patch.json` — owner skeleton, финализированное имя r1; food остаётся секцией `nodes`, ручного раскрытия нет.
- `candidate/validation.json` — byte-identical owner draft, многострочный JSON.
- `candidate/change-policy.json` — owner draft; изменены только name/description, правила и validation SHA не менялись.
- `candidate/PARAMETER_ANNOTATIONS_fragment.json` — Food Enabled, 20 параметров декларации, пять A/B-пар с `applies_to_mirror`, B→A startup export signal/cargo.

## Отличия

По модели, validation, policy-правилам и порогам отличий от опубликованного owner skeleton/drafts нет. Техническая финализация: имя candidate r1, пустой `modify_scenarios` записан явно по TASK, policy name/description переведены из DRAFT в candidate. Аннотации — обязательная поставка TASK §2 и на модель не влияют.

Известное ограничение шага сохранено: труд на перевозку еды не учитывается.

## Ограничения

Модель, accepted validation/policy, `model/nodes/*`, стенд и workflows не меняются. Долгосрочная аграрная специализация и влияние нехватки труда не входят в validation этого шага.
