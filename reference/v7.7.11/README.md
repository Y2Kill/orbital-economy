# Orbital Economy — previous accepted baseline v7.7.11 r1

**Status:** reference (superseded by v7.7.12 r1 on 2026-10-09)  
**Accepted:** 2026-10-05  
**Model SHA-256:** `dbe824b34ad41b5b7d50a6df096b59268198dd4c02c2b36aba5645b24809f0d2`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.11-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–48 of v7.7.12 r1 reproduce this model bit for bit on the canonical platform (switch `Food Enabled` = 0, its default); Modes 49–51 are new.

```text
model/orbital_economy_v7_7_11_r1_modeljson.json   accepted ModelJSON v7.7.11 r1
validation/validation-v7.7.11.json                its validation contract
policy/change-policy-v7.7.11-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                            its manifest, byte-identical to the one accepted with it
```

The v7.7.10 r1 reference it replaced, and everything older, is in git history (tag `v7.7.11-r1` holds `reference/v7.7.10/`).
