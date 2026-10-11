# Orbital Economy — previous accepted baseline v7.7.13 r1

**Status:** reference (superseded by v7.7.14 r1 on 2026-10-11)  
**Accepted:** 2026-10-10  
**Model SHA-256:** `cede8ecf699995bc818646a2e922f87f3d798c002231fa70e14d3e357196d4f1`  
**Engine:** `simulation@9.0.0` · git tag `v7.7.13-r1`

Kept in the tree as the model the v7.7.14 recalibration was compared against. v7.7.14 r1 changes two values (`Power Operating Reserve Factor` 1.02 → 1.10, `Labor Participation Share` 0.50 → 0.52), so no Mode reproduces this model: the exact-regression chain that ran from v7.7.0 ends here.

```text
model/orbital_economy_v7_7_13_r1_modeljson.json   accepted ModelJSON v7.7.13 r1
validation/validation-v7.7.13.json                its validation contract
policy/change-policy-v7.7.13-strict.json          its strict default-deny policy
BASELINE_MANIFEST.json                            its manifest, byte-identical to the one accepted with it
```

The v7.7.12 r1 reference it replaced, and everything older, is in git history (tag `v7.7.13-r1` holds `reference/v7.7.12/`).
