# Orbital Economy — previous accepted baseline v7.7.1 r1

**Status:** reference (superseded by v7.7.2 r1 on 2026-09-27)  
**Accepted:** 2026-09-26  
**Model SHA-256:** `d53d014d727a439694e103aafb49f87d4dbbb362e581414cbf4dc71a19646f93`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.1-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–31 of v7.7.2 r1 reproduce this model bit for bit on the canonical platform (`Construction Materials Energy Enabled = 0`); Modes 32–33 are new.

```text
model/orbital_economy_v7_7_1_r1_modeljson.json   accepted ModelJSON v7.7.1 r1
validation/validation-v7.7.1.json                its validation contract (r2: + planet_closure plugin, task 011)
policy/change-policy-v7.7.1-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                           its manifest, byte-identical to the one accepted with it
```

The v7.7 r1 reference it replaced, and everything older, is in git history (tag `v7.7.1-r1` holds `reference/v7.7/`).
