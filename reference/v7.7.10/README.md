# Orbital Economy — previous accepted baseline v7.7.10 r1

**Status:** reference (superseded by v7.7.11 r1 on 2026-10-05)  
**Accepted:** 2026-10-04  
**Model SHA-256:** `3cb40c883703936af3550a82a731d4af17f3818afe80b69c0c8f92e0878ab903`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.10-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–48 of v7.7.11 r1 reproduce this model bit for bit on the canonical platform (no switch and no new Mode: the population layer only adds elements).

```text
model/orbital_economy_v7_7_10_r1_modeljson.json   accepted ModelJSON v7.7.10 r1
validation/validation-v7.7.10.json                its validation contract
policy/change-policy-v7.7.10-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                            its manifest, byte-identical to the one accepted with it
```

The v7.7.9 r1 reference it replaced, and everything older, is in git history (tag `v7.7.10-r1` holds `reference/v7.7.9/`).
