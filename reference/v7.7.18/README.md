# Orbital Economy — previous accepted baseline v7.7.18 r1

**Status:** reference (superseded by v7.7.19 r1 on 2026-10-24)  
**Accepted:** 2026-10-19  
**Model SHA-256:** `43034a2890e06c030b04433a3ed9cebf1961d4ccf9101766a8394d2033748b48`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.18-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–51 of v7.7.19 r1 (labor market off) reproduce this model bit for bit on the canonical platform; Modes 52–59 change (labor demand follows the wage).

```text
model/orbital_economy_v7_7_18_r1_modeljson.json   accepted ModelJSON v7.7.18 r1
validation/validation-v7.7.18.json                its validation contract
policy/change-policy-v7.7.18-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                            its manifest, byte-identical to the one accepted with it
```

The v7.7.17 r1 reference it replaced, and everything older, is in git history (tag `v7.7.18-r1` holds `reference/v7.7.17/`).
