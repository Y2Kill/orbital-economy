# Orbital Economy — previous accepted baseline v7.7.2 r1

**Status:** reference (superseded by v7.7.3 r1 on 2026-09-27)  
**Accepted:** 2026-09-27  
**Model SHA-256:** `9bd5c956acccefddc3573b18d04e782d3cb329be89c1d297337b0831c04f2b45`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.2-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–33 of v7.7.3 r1 reproduce this model bit for bit on the canonical platform (`Construction Materials Capital Enabled = 0`); Modes 34–35 are new.

```text
model/orbital_economy_v7_7_2_r1_modeljson.json   accepted ModelJSON v7.7.2 r1
validation/validation-v7.7.2.json                its validation contract
policy/change-policy-v7.7.2-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                           its manifest, byte-identical to the one accepted with it
```

The v7.7.1 r1 reference it replaced, and everything older, is in git history (tag `v7.7.2-r1` holds `reference/v7.7.1/`).
