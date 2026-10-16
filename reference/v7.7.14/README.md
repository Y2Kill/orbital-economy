# Orbital Economy — previous accepted baseline v7.7.14 r1

**Status:** reference (superseded by v7.7.15 r1 on 2026-10-16)  
**Accepted:** 2026-10-11  
**Model SHA-256:** `bbb4f9ea5c522514a84e9de0cc5decf5585da0cd2dd3ec80a63e79d11c0f0375`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.14-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–53 of v7.7.15 r1 reproduce this model bit for bit on the canonical platform (switch `Wage Pricing Enabled` = 0, its default); Modes 54–55 are new.

```text
model/orbital_economy_v7_7_14_r1_modeljson.json   accepted ModelJSON v7.7.14 r1
validation/validation-v7.7.14.json                its validation contract
policy/change-policy-v7.7.14-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                            its manifest, byte-identical to the one accepted with it
```

The v7.7.13 r1 reference it replaced, and everything older, is in git history (tag `v7.7.14-r1` holds `reference/v7.7.13/`).
