# Orbital Economy — previous accepted baseline v7.7.17 r1

**Status:** reference (superseded by v7.7.18 r1 on 2026-10-19)  
**Accepted:** 2026-10-18  
**Model SHA-256:** `43625d458d7bfc20e6b3a0868b4f3f2f503f249075e65c7afac9353ddca137c9`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.17-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. v7.7.18 r1 is a recalibration: Modes 0–55 changed by design. Modes 56–59 reproduce this model bit for bit on the canonical platform, except 8 series nothing reads there (the demand reference prices of wage pricing and their price demand factors).

```text
model/orbital_economy_v7_7_17_r1_modeljson.json   accepted ModelJSON v7.7.17 r1
validation/validation-v7.7.17.json                its validation contract
policy/change-policy-v7.7.17-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                            its manifest, byte-identical to the one accepted with it
```

The v7.7.16 r1 reference it replaced, and everything older, is in git history (tag `v7.7.17-r1` holds `reference/v7.7.16/`).
