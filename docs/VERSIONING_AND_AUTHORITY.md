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

For v7.6, Modes 0–23 are exact-regression protected against v7.5 and Mode 24 owns the new behavior.

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
