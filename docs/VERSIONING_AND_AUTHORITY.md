# Versioning and Authority

**Document status:** CURRENT

## 1. Core rule

`docs/` is the canonical human-readable documentation layer, but accepted executable artifacts are the factual authority.

When sources disagree, use this order for facts about current behavior:

1. accepted ModelJSON;
2. executable accepted validation / structural contracts;
3. accepted strict policy / manifests and generated audit reports;
4. canonical `README.md` + `docs/`;
5. historical task/spec/feedback material.

A documentation/code disagreement is a documentation defect unless an explicit new task authorizes a code change.

## 2. Accepted baseline

A baseline is accepted only after:

- model schema/check passes;
- required dynamic Modes pass validation;
- lifecycle/structure audits pass;
- regression requirements against the previous accepted checkpoint pass;
- change policy sees no unauthorized differences;
- manifests/SHA are rebuilt for the promoted artifacts;
- canonical documentation is updated after code acceptance.

Accepted baselines are immutable checkpoints. New work creates a candidate/new version; it does not silently rewrite the old checkpoint.

## 3. Status vocabulary

- `CURRENT` — current canonical documentation.
- `ACCEPTED` — promoted executable checkpoint.
- `CANDIDATE` — executable proposed successor not yet promoted.
- `DRAFT` — incomplete specification/validation/policy.
- `SUPERSEDED` — replaced by a newer explicit authority.
- `HISTORICAL` — retained only as provenance/reference.

Only CURRENT/ACCEPTED material belongs in the normal working path of a clean baseline package.

## 4. Regression rule

Previously accepted behavior is a hard development constraint unless an intentional behavior change is explicitly authorized and isolated.

Where a new feature is switch-gated, legacy scenarios should preserve the old execution path exactly. The project prefers `maxAbs = 0` exact comparison over tolerance-based similarity whenever technically possible.

For v7.7, Modes 0–26 reproduce v7.6.1 r1 exactly (switch `Construction Materials Enabled` = 0) and Modes 27–29 own the new behaviour. Exact means bit-exact **on the canonical platform** (§8).

## 5. Validation vs policy

Validation asks: **is this model internally/physically/structurally acceptable?**

Change policy asks: **were these particular differences from the previous accepted baseline authorized?**

A policy allow-rule cannot waive a hard validation/static physics failure.

After promotion, the working package contains a strict default-deny policy bound to the new accepted model and validation SHA. Task-specific allow policies belong to task provenance, not to the clean accepted working layer.

## 6. Documentation update rule

Documentation is updated **after** code acceptance, from the accepted artifacts. Roadmap intent must never be presented as already implemented behavior.

Generated reports may be regenerated from code; hand-written current docs must be corrected whenever generated/executable evidence disagrees.

## 7. Clean package rule

A clean baseline package contains only what is sufficient to continue work:

- one accepted current model;
- one accepted validation contract;
- one strict policy for the accepted checkpoint;
- current canonical docs and generated reports;
- reproducible tools and only the fixtures they require.

Old task deliveries, errata, candidate archives and superseded specifications are not duplicated into the clean package.

## 8. Canonical platform — where "exact" is defined

**Rule (decided 2026-09-25).** Bit-exact numbers of an accepted model are defined on one platform:

```text
Windows x64 · Node 24.11.1 · simulation 9.0.0 (lab/vendor/, enforced by lab/src/engine.js)
```

- **Acceptance runs on the canonical platform.** Every gate that compares numbers exactly — `RUN_LAB`, `COMPARE_MODELS`, `CHECK_CANDIDATE`, the regression claims in `BASELINE_MANIFEST.json` — is authoritative only when run there.
- **The golden digest is the reference.** `lab/reference/accepted/series-digest.windows.json` holds the bit-exact SHA-256 of every series of every Mode of the accepted model, produced on the canonical platform. `BASELINE_MANIFEST.json` → `canonical_platform` records its SHA-256. It is regenerated at every acceptance (contract §6).
- **Any machine can be checked against it:** in `lab/`, `node --expose-gc src/cli.js series --modes=all --out=output/series`, then from the repo root `node tools/verify_series.mjs lab/output/series/series-digest.json`. PASS = this machine reproduces the accepted numbers bit for bit.
- **Other platforms are not wrong, they are different.** On Linux (and possibly in browsers) the same model gives series that differ in the last bits in every Mode, amplified by feedback loops up to 4.35 % (Mode 19, day 1080); every validation check passes on both. Such a run may be used for self-consistent work — `COMPARE_MODELS` / `CHECK_CANDIDATE` compute both models on the same machine, so their exact verdicts hold there — but its numbers must not be compared bit-for-bit with numbers from the canonical platform. The Linux CI (`.github/workflows/ci.yml`) is a hint, not an acceptance.
- **Do not paper over the difference** with rounding or tolerances in the bench or the comparator: that would weaken every exact gate and hide the cause.

**Why.** The model's `^` operator is executed by the engine as `Math.pow`, 198 formulas use it, and Node's `Math.pow` rounds differently on Windows and Linux for some arguments: `Math.pow(0x401368263c9d9065, 0.125)` is `0x3ff37df4ef6ab79d` on Windows (correctly rounded, error 0.499 ULP) and `0x3ff37df4ef6ab79e` on Linux (0.501 ULP). It depends on the OS, not the CPU — an Intel and an AMD machine on Windows agree bit for bit. Evidence: `docs/tasks/005-ci/ACCEPTANCE_RU.md`, `docs/tasks/006-cross-os/ACCEPTANCE_RU.md`, `lab/ENGINE_PIN.md`.

**Changing the canonical platform** (another OS, another Node) is a deliberate decision recorded here, followed by regenerating the golden digest and re-running the acceptance gates on the new platform. It is not a side effect of upgrading a machine.

**Removing the dependence** (making the numbers identical on every OS) is an open roadmap item — `ROADMAP.md`, "Platform-independent arithmetic". Until it is done, this section stands.
