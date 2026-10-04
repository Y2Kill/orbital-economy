# Orbital Economy — previous accepted baseline v7.7.9 r1

**Status:** reference (superseded by v7.7.10 r1 on 2026-10-04)  
**Accepted:** 2026-10-03  
**Model SHA-256:** `fb27f258e5fca6d236513399f7b29082b483b97b3f7a1d2c5eed00a5bc3754f8`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.9-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–47 of v7.7.10 r1 reproduce this model bit for bit on the canonical platform (no switch: automation 0); Mode 48 is new.

```text
model/orbital_economy_v7_7_9_r1_modeljson.json   accepted ModelJSON v7.7.9 r1
validation/validation-v7.7.9.json                its validation contract
policy/change-policy-v7.7.9-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                           its manifest, byte-identical to the one accepted with it
```

The v7.7.8 r1 reference it replaced, and everything older, is in git history (tag `v7.7.9-r1` holds `reference/v7.7.8/`).
