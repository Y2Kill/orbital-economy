# Orbital Economy — previous accepted baseline v7.7.5 r1

**Status:** reference (superseded by v7.7.6 r1 on 2026-09-29)  
**Accepted:** 2026-09-28  
**Model SHA-256:** `b0b60e63f24bb1791a1d06d631a681a8d96fd820bcccdf79932715ac0d0f9c8c`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.5-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–39 of v7.7.6 r1 reproduce this model bit for bit on the canonical platform (`Ore Capital Enabled = 0`); Modes 40–41 are new.

```text
model/orbital_economy_v7_7_5_r1_modeljson.json   accepted ModelJSON v7.7.5 r1
validation/validation-v7.7.5.json                its validation contract (single-line JSON, as delivered)
policy/change-policy-v7.7.5-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                           its manifest, byte-identical to the one accepted with it
```

The v7.7.4 r1 reference it replaced, and everything older, is in git history (tag `v7.7.5-r1` holds `reference/v7.7.4/`).
