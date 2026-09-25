# Orbital Economy

A deterministic System Dynamics model of a two-region planetary economy, together with the bench that accepts changes to it.

**Accepted baseline:** v7.6 r2 — Energy Kernel v2
**Model SHA-256:** `a9573f5afe43d2ae2bf12fdc3066c983c264eba162e1d3fc1d5f11e3872f9e91`
**Engine contract:** `simulation@9.0.0` (pinned)
**Scenarios:** Modes 0–26 · 0..1080 days · dt 0.25 · RK1
**Accepted:** 2026-09-25 — validation 27/27 PASS, Modes 0–24 bit-identical to the previous accepted baseline

Two regions (A and B) each run ore → metal → electronics, a power sector, and a capital-goods sector that physically backs capacity expansion; they trade over shared transport with endogenous prices. Capital has an explicit lifecycle (installed / active / mothballed / decommissioned), expansion consumes capital goods, and — since v7.6 — generation consumes a physical operating resource.

## Repository layout

```text
model/          accepted ModelJSON — the authoritative description of behaviour
validation/     executable validation contract (HARD invariants, plugins, per-Mode expectations)
policy/         strict default-deny change policy, bound to the SHA-256 of both files above
docs/           documentation aligned to the accepted model, generated audit reports, version history
lab/            Orbital Economy Lab — the bench: run, compare, audit, policy-check, apply patches
reference/      the previous accepted baseline (v7.5.1 r1), kept for exact regression comparison
tools/          repository tooling: integrity manifests (build_sums), task-branch acceptance guard (check_branch)
BASELINE_MANIFEST.json   what is accepted, with every SHA-256 and every gate result
SHA256SUMS.txt           integrity of the whole tree (lab/ has its own for the bench)
```

## Quick start (Windows)

```bat
cd lab
INSTALL.cmd
RUN_LAB.cmd
```

`INSTALL.cmd` installs the pinned dependencies only from the vendored npm tarballs in `lab/vendor/`, using a temporary isolated cache and `npm ci --offline` (`lab/node_modules` is not in git). The bench then verifies the actually installed `simulation` version before engine-backed commands run. `RUN_LAB.cmd` needs no arguments: `lab/input/` and `lab/reference/accepted/` already hold the accepted artefacts, so it runs all 27 Modes of the accepted model against the accepted validation contract. Expected: `OVERALL: PASS`.

Everything else is one command:

```bat
RUN_TESTS.cmd ..\model\orbital_economy_v7_6_r2_modeljson.json ..\validation\validation-v7.6.json all
COMPARE_MODELS.cmd ..\reference\v7.5.1\model\orbital_economy_v7_5_1_r1_modeljson.json ..\model\orbital_economy_v7_6_r2_modeljson.json ..\validation\validation-v7.6.json 0-24
LIFECYCLE_CONFORMANCE.cmd   STRUCTURE_AUDIT.cmd   PARAMETER_REGISTRY.cmd
CHECK_CANDIDATE.cmd         (accepted vs candidate + change policy — the acceptance gate)
QA_SELF_TEST.cmd  POLICY_SELF_TEST.cmd  CONFORMANCE_SELF_TEST.cmd  STRUCTURE_SELF_TEST.cmd  COMPARE_SELF_TEST.cmd
```

On a clean checkout `CHECK_CANDIDATE.cmd` reports `BYTE_IDENTICAL` and `POLICY RESULT: PASS`: the accepted model is its own candidate.

## How a change gets in

```text
spec + test plan + change policy   ->  candidate (ModelJSON or a declarative patch)
                                   ->  APPLY_PATCH / LIFECYCLE_CONFORMANCE / STRUCTURE_AUDIT
                                   ->  RUN_LAB (all Modes)  ->  CHECK_CANDIDATE (policy gate)
                                   ->  accepted: model, validation, policy, manifests, docs, tags
```

Rules that do not bend:

- **old Modes must reproduce the previous accepted baseline exactly** (`changed = 0`, `maxAbs = 0`) — new mechanics live behind their own switch, which the old scenarios set to 0;
- **validation answers "is the model correct", policy answers "was this difference authorised"** — policy is written before implementation and never relaxed to make a report green;
- **the accepted executable artefacts are the authority**; a disagreement between code and documentation is a documentation defect unless a task authorised the code change (`docs/VERSIONING_AND_AUTHORITY.md`);
- **every externally set number is registered** — `docs/PARAMETER_REGISTRY.md` plus hand-written annotations in `docs/PARAMETER_ANNOTATIONS.json`; an unannotated A/B asymmetry is a debt.

## Where to read next

| Question | File |
|---|---|
| What exists in the model right now | `docs/CURRENT_STATE.md` |
| How the energy kernel works | `docs/ENERGY_KERNEL_V2_SPEC.md` |
| What went wrong in v7.6 r1 and how it was fixed | `docs/V7_6_R1_TO_R2_FIX_REPORT.md` |
| Capital lifecycle contract and role mapping | `docs/CAPITAL_LIFECYCLE_KERNEL_SPEC.md`, `docs/CAPITAL_LIFECYCLE_SECTOR_MAPPING.md` |
| Structure of the whole economy | `docs/ARCHITECTURE.md` |
| How we got here, version by version (RU) | `docs/HISTORY_RU.md` |
| Rules for an external model author (RU) | `docs/CONTRACTOR_DELIVERY_CONTRACT_RU.md` |
| Tasks for an agent working in this repository, and how they are accepted (RU) | `docs/tasks/README_RU.md` |
| Where the model is going | `docs/ROADMAP.md` |
| The bench itself (RU) | `lab/README_RU.md`, `lab/docs/`, `lab/CHANGELOG.md` |

Documentation is mixed-language by history: model documentation is English, process and bench documentation is Russian.

## Versioning

One accepted baseline lives in the tree; earlier ones are commits and tags (`v7.6-r2`), not directories. `reference/` carries only the immediately previous accepted model, because exact regression is measured against it. Model, validation and policy are rewritten together at acceptance, and `BASELINE_MANIFEST.json` plus both `SHA256SUMS.txt` are regenerated in the same commit.

The engine is frozen at `simulation@9.0.0`; upgrading it requires a new golden cross-check, not a dependency bump (`lab/ENGINE_PIN.md`).

## Licence note

The bench depends on the `simulation` package; see `lab/LICENSE-NOTICE.md`. The model, contracts and documentation in this repository are the project's own work.
