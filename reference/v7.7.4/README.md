# Orbital Economy — previous accepted baseline v7.7.4 r1

**Status:** reference (superseded by v7.7.5 r1 on 2026-09-28)  
**Accepted:** 2026-09-27  
**Model SHA-256:** `8a71fe6678c4fc6c532bb8e35b6006280ddb9639a69aed045a6ca25f516f1991`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.4-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–37 of v7.7.5 r1 reproduce this model bit for bit on the canonical platform (`Regolith Capital Enabled = 0`); Modes 38–39 are new.

```text
model/orbital_economy_v7_7_4_r1_modeljson.json   accepted ModelJSON v7.7.4 r1
validation/validation-v7.7.4.json                its validation contract
policy/change-policy-v7.7.4-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                           its manifest, byte-identical to the one accepted with it
```

The v7.7.3 r1 reference it replaced, and everything older, is in git history (tag `v7.7.4-r1` holds `reference/v7.7.3/`).
