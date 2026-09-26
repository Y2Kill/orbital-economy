# Orbital Economy — previous accepted baseline v7.7 r1

**Status:** reference (superseded by v7.7.1 r1 on 2026-09-26)  
**Accepted:** 2026-09-26  
**Model SHA-256:** `5bbc29b6e18caa64ec22267892b6cd0669649722c8fc029d8dba43a77a34d5a1`  
**Engine:** `simulation@9.0.0` · git tag `v7.7-r1`

Kept in the tree for one reason: exact regression of the current accepted model is measured against it. Modes 0–29 of v7.7.1 r1 reproduce this model bit for bit on the canonical platform (`Transport Construction Materials Enabled = 0`); Modes 30–31 are new.

```text
model/orbital_economy_v7_7_r1_modeljson.json   accepted ModelJSON v7.7 r1
validation/validation-v7.7.json                its validation contract
policy/change-policy-v7.7-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                         its manifest, byte-identical to the one accepted with it
```

The v7.6.1 r1 reference it replaced, and everything older, is in git history (tag `v7.7-r1` holds `reference/v7.6.1/`).
