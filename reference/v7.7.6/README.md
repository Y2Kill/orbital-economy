# Orbital Economy — previous accepted baseline v7.7.6 r1

**Status:** reference (superseded by v7.7.7 r1 on 2026-09-30)  
**Accepted:** 2026-09-29  
**Model SHA-256:** `d274f7b9dcc11dbfe3730c1a88fe8fd3cf242e09a52a3e51e9082ab8420de8dd`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.6-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–41 of v7.7.7 r1 reproduce this model bit for bit on the canonical platform (`Power Resource Capital Enabled = 0`); Modes 42–43 are new.

```text
model/orbital_economy_v7_7_6_r1_modeljson.json   accepted ModelJSON v7.7.6 r1
validation/validation-v7.7.6.json                its validation contract
policy/change-policy-v7.7.6-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                           its manifest, byte-identical to the one accepted with it
```

The v7.7.5 r1 reference it replaced, and everything older, is in git history (tag `v7.7.6-r1` holds `reference/v7.7.5/`).
