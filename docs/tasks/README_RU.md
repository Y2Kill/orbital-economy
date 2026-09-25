# Задания исполнителю-агенту

Здесь лежат задания, которые выполняет внешний агент с доступом к репозиторию, и их приёмки. Правила поставки — `../CONTRACTOR_DELIVERY_CONTRACT_RU.md` §9; этот файл — порядок работы.

Задания 001–003 (v7.4, v7.4.1, v7.5) выполнялись до git и лежат в архиве проекта; нумерация продолжается с 004.

## Папка задания

```text
docs/tasks/NNN-имя/
  TASK_RU.md        задание: цель, требования, критерии приёмки            — пишем мы, до начала работы
  scope.json        какие пути ветка может менять (машиночитаемо)         — пишем мы, до начала работы
  REPORT_RU.md      отчёт исполнителя                                      — пишет исполнитель, в своей ветке
  ACCEPTANCE_RU.md  итог приёмки: раунды, находки, решение                 — пишем мы, последним коммитом перед слиянием
```

`scope.json`:

```json
{
  "task": "004",
  "title": "…",
  "branch": "task/004-имя",
  "allow": ["glob", "…"],
  "allow_binary": ["glob — бинарные файлы и файлы > 1 МБ, которые задача разрешает"],
  "allow_protected": ["glob — защищённые пути, если задача действительно должна их менять"],
  "required_changes": ["glob — без изменения этих путей поставка неполна"]
}
```

Защищённые пути (без `allow_protected` не меняются никогда): `model/`, `validation/`, `policy/`, `reference/`, `lab/input/`, `lab/reference/`, `BASELINE_MANIFEST.json`, `.gitattributes`, `.gitignore`, `tools/`, `docs/tasks/` (кроме своего `REPORT_RU.md`), контракт исполнителя, `docs/VERSIONING_AND_AUTHORITY.md`. `SHA256SUMS.txt` и `lab/SHA256SUMS.txt` разрешены всегда — их пересобирает исполнитель.

`scope.json` читается проверкой из `main`, не из ветки: поставка не может расширить себе права.

## Цикл

```text
мы         1. TASK_RU.md + scope.json → коммит в main, push
           2. выдаём агенту короткий текст (шаблон ниже)
агент      3. ветка task/NNN-имя от текущего main; работа; node tools/build_sums.mjs
           4. самопроверка: node tools/check_branch.mjs --scope=… --head=HEAD --base=origin/main --no-remote
                            + стенд — в объёме раздела «Приёмка» задания
           5. REPORT_RU.md; push ветки; PR в main, если может (описание = краткий отчёт)
мы         6. node tools/check_branch.mjs --scope=docs/tasks/NNN-имя/scope.json
                 guard: origin/main и теги на месте, ветка — fast-forward от main, линейна,
                 в пределах scope, байты (EOL) целы, SUMS честные, нет локальных путей/секретов
           7. стенд на чистом checkout головы ветки (git worktree add), по разделу «Приёмка»
           8. чтение диффа и отчёта
           9a. доработка: замечания в PR (или текстом через владельца); агент добавляет коммиты
               в ту же ветку и снова push → с шага 6
           9b. принято: ACCEPTANCE_RU.md + node tools/build_sums.mjs → наш коммит поверх ветки;
               git merge --ff-only; push main; удалить удалённую ветку
```

Правила истории:

- **линейно**: ни merge-коммитов в ветке, ни merge-коммита при слиянии; `main` двигаем только мы и только fast-forward;
- **коммиты агента сохраняются** (без squash): видно, что было в каком раунде и кто автор;
- если `main` ушёл вперёд, агент делает `git rebase origin/main`, пересобирает SUMS и пушит с `--force-with-lease` — это единственный допустимый force-push, и только в свою ветку;
- теги ставим только мы.

Проверка самих инструментов: `bash tools/selftest.sh` (песочница во временной папке; 19 сценариев — честная поставка и типовые нарушения; реальный репозиторий и origin не трогаются). Прогонять после любой правки в `tools/`.

## Шаблон выдачи агенту

```text
Репозиторий: https://github.com/Y2Kill/orbital-economy (ветка main).
Задание: docs/tasks/NNN-имя/TASK_RU.md — прочитай его целиком, затем docs/CONTRACTOR_DELIVERY_CONTRACT_RU.md §9.
Работай только в ветке task/NNN-имя, созданной от текущего main. main и теги не трогай.
Перед push: node tools/build_sums.mjs, затем
  node tools/check_branch.mjs --scope=docs/tasks/NNN-имя/scope.json --head=HEAD --base=origin/main --no-remote
— должно быть BRANCH CHECK: PASS. Отчёт — docs/tasks/NNN-имя/REPORT_RU.md.
Если что-то в задании неясно или кажется неверным — напиши об этом в отчёте с аргументами, не обходи молча.
```
