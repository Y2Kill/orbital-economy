# Orbital Economy — previous accepted baseline v7.7.7 r1

**Status:** reference (superseded by v7.7.8 r1 on 2026-10-02)  
**Accepted:** 2026-09-30  
**Model SHA-256:** `befccae91083e44c32ddeb25783a3f45a8ef32fa60965e61a210ebfc4c7b8f94`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.7-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–43 of v7.7.8 r1 reproduce this model bit for bit on the canonical platform (`Deposits Enabled = 0`); Modes 44–45 are new.

```text
model/orbital_economy_v7_7_7_r1_modeljson.json   accepted ModelJSON v7.7.7 r1
validation/validation-v7.7.7.json                its validation contract
policy/change-policy-v7.7.7-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                           its manifest, byte-identical to the one accepted with it
```

The v7.7.6 r1 reference it replaced, and everything older, is in git history (tag `v7.7.7-r1` holds `reference/v7.7.6/`).
