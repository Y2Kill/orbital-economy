# Orbital Economy — previous accepted baseline v7.7.15 r1

**Status:** reference (superseded by v7.7.16 r1 on 2026-10-17)  
**Accepted:** 2026-10-16  
**Model SHA-256:** `a5a233129b013f838cac863e4f9b8aad9da8e90bacfe48763fcedefad929b975`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.15-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–55 of v7.7.16 r1 reproduce this model bit for bit on the canonical platform (switch `Cost Pricing Enabled` = 0, its default); Modes 56–57 are new.

```text
model/orbital_economy_v7_7_15_r1_modeljson.json   accepted ModelJSON v7.7.15 r1
validation/validation-v7.7.15.json                its validation contract
policy/change-policy-v7.7.15-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                            its manifest, byte-identical to the one accepted with it
```

The v7.7.14 r1 reference it replaced, and everything older, is in git history (tag `v7.7.15-r1` holds `reference/v7.7.14/`).
