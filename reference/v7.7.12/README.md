# Orbital Economy — previous accepted baseline v7.7.12 r1

**Status:** reference (superseded by v7.7.13 r1 on 2026-10-10)  
**Accepted:** 2026-10-09  
**Model SHA-256:** `e8829fa550172dfab9629a0d66b0c628c1d802c5c1a3826ab7a9a86365c9f234`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.12-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–51 of v7.7.13 r1 reproduce this model bit for bit on the canonical platform (switch `Labor Market Enabled` = 0, its default); Modes 52–53 are new.

```text
model/orbital_economy_v7_7_12_r1_modeljson.json   accepted ModelJSON v7.7.12 r1
validation/validation-v7.7.12.json                its validation contract
policy/change-policy-v7.7.12-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                            its manifest, byte-identical to the one accepted with it
```

The v7.7.11 r1 reference it replaced, and everything older, is in git history (tag `v7.7.12-r1` holds `reference/v7.7.11/`).
