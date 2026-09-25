# Orbital Economy — previous accepted baseline v7.6.1 r1

**Status:** reference (superseded by v7.7 r1 on 2026-09-26)  
**Accepted:** 2026-09-25  
**Model SHA-256:** `16e8ca6c5719e67422e16a6ec1ea2724b6121a062200eaf91e81389a2a180cd1`  
**Validation SHA-256:** `1970aaea988ece5ba2524e0ca79b68a0c48864c8bf6d7e458c336b718c209ddc`  
**Engine:** `simulation@9.0.0` · git tag `v7.6.1-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–26 of v7.7 r1 reproduce this model bit for bit on the canonical platform (`Construction Materials Enabled = 0`); Modes 27–29 are new.

```text
model/orbital_economy_v7_6_1_r1_modeljson.json   accepted ModelJSON v7.6.1 r1
validation/validation-v7.6.1.json                its validation contract
policy/change-policy-v7.6.1-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                           its manifest, byte-identical to the one accepted with it
```

The v7.6 r2 reference it replaced, and everything older, is in git history (tag `v7.6.1-r1` holds `reference/v7.6/`).
