# Orbital Economy — previous accepted baseline v7.7.8 r1

**Status:** reference (superseded by v7.7.9 r1 on 2026-10-03)  
**Accepted:** 2026-10-02  
**Model SHA-256:** `17794e6c6acec9a965473bc170f1c71e31a82fe7a095ec1391c86eb681c1b50e`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.8-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–45 of v7.7.9 r1 reproduce this model bit for bit on the canonical platform (`Process Energy Enabled = 0`); Modes 46–47 are new.

```text
model/orbital_economy_v7_7_8_r1_modeljson.json   accepted ModelJSON v7.7.8 r1
validation/validation-v7.7.8.json                its validation contract
policy/change-policy-v7.7.8-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                           its manifest, byte-identical to the one accepted with it
```

The v7.7.7 r1 reference it replaced, and everything older, is in git history (tag `v7.7.8-r1` holds `reference/v7.7.7/`).
