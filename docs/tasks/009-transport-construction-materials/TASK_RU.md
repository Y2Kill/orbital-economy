# Задание 009 — v7.7.1: общий транспорт на строительных материалах

Ветка: `task/009-transport-construction-materials` · Scope: `scope.json` рядом · Правила: контракт 1.8 — §3–§5, §7, §8, §9 и §9.4 (в т. ч. п. 5 — поставка через `candidate/`), §9.2 п. 9 (контрольные точки и журнал) · Порядок работы: `docs/tasks/README_RU.md`

Продолжение задачи 008 по той же схеме. Механика — дословный аналог оборудования для транспорта из v7.5.1, поэтому задача короче.

## 1. Что прочитать

1. `V7_7_1_ARCHITECTURE_SPEC.md` — что меняется, исчерпывающий список изменяемых формул (§3), ограничения (§6).
2. `V7_7_1_TEST_PLAN.md`.
3. `draft/validation-v7.7.1-draft.json` (структурная часть) и `draft/change-policy-v7.7.1-draft.json` — черновик, **проверенный нами на полном skeleton**. Финализируешь: `validation_sha256` = SHA твоей validation (из лога `candidate.yml`); изменения правил — только с обоснованием.
4. Для образца — поставка задачи 008 (`docs/tasks/008-construction-materials/candidate/`, `REPORT_RU.md`): формат validation, калибровка «зонды → пороги», аннотации.

## 2. Что поставить

В `docs/tasks/009-transport-construction-materials/candidate/`: `model-patch.json` (к v7.7 r1, `base_sha256` = `5bbc29b6e18caa64ec22267892b6cd0669649722c8fc029d8dba43a77a34d5a1`, `name` = `Orbital Economy v7.7.1 Transport Construction Materials candidate rN`), `validation.json`, `change-policy.json`, `PARAMETER_ANNOTATIONS_fragment.json`. И `REPORT_RU.md` в папке задачи: журнал по КТ и отчёт кандидата.

## 3. Контрольные точки

После каждой КТ — сразу «Журнал» в `REPORT_RU.md` и push; при перезапуске — сначала журнал.

| КТ | Результат | Доказательство |
|---|---|---|
| КТ1 | патч применяется, `conformance` и `audit` PASS | ссылка на запуск `candidate.yml` |
| КТ2 | регрессия: `policy` без неожиданных событий в Modes 0–29 | ссылка, счётчики |
| КТ3 | validation Modes 30–31 по test plan, пороги по первому прогону с обоснованием; validation PASS 32/32; **B производит стройматериалы в Mode 31** | ссылка, таблица «проверка → значение → порог → запас» |
| КТ4 | поставка полная; `candidate.yml` 5/5 PASS, `ci.yml` зелёный | ссылки |

## 4. Чего не делать

- Ничего сверх спецификации §3; не трогать энергетику и колониальные формулы, кроме `X Construction Materials Demand` по §3.
- Менять можно только `candidate/` и `REPORT_RU.md` в папке задачи.
- Не ослаблять прежние проверки; не подгонять пороги впритык.
- Не вставлять в отчёт персональные данные (адреса почты, имена авторов коммитов) — ссылайся на коммиты по хешу. Guard это теперь проверяет.
- SHA256SUMS не трогать (`sums_by: reviewer`).

## 5. Приёмка (наша, на канонической платформе)

Как в 008: строгий guard; полный цикл на Windows (validation 32/32, `CHECK_CANDIDATE` с твоей policy — `POLICY PASS`, Modes 0–29 `changed = 0, maxAbs = 0`); ревью патча против нашего skeleton; продвижение в v7.7.1 r1 с новым эталоном канонической платформы.
