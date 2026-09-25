# Orbital Economy — previous accepted baseline v7.6 r2

**Status:** reference (superseded by v7.6.1 r1 on 2026-09-25)  
**Accepted:** 2026-09-25  
**Model SHA-256:** `a9573f5afe43d2ae2bf12fdc3066c983c264eba162e1d3fc1d5f11e3872f9e91`  
**Validation SHA-256:** `cbd3ff4b115b3a025e2cb54f9cbd3436ca11a5dcebdebb10cf094bfa2963acaf`  
**Engine:** `simulation@9.0.0` · git tag `v7.6-r2`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–24 and 26 of v7.6.1 r1 reproduce this model exactly in every series except the recalibrated constant `Power Resource Shock Factor` (0.1 here, 0.5 in v7.6.1); Mode 25 differs by design (`../../docs/V7_6_1_CALIBRATION_REPORT.md`).

```text
model/orbital_economy_v7_6_r2_modeljson.json   accepted ModelJSON v7.6 r2
validation/validation-v7.6.json                its validation contract
policy/change-policy-v7.6-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                         its manifest, byte-identical to the one accepted with it
```

The v7.5.1 r1 reference it replaced, and everything older, is in git history (tag `v7.6-r2` holds `reference/v7.5.1/`).
