# v7.5 r1 Promotion Record

**Status:** ACCEPTED  
**Accepted:** 2026-09-24  
**Base:** v7.4.1 r1 — `07ce33e004597ef485e47e3a95026b584197824468382e28daa80950a45fb08e`  
**Accepted model:** `Orbital Economy v7.5 r1`  
**Accepted SHA-256:** `987490e88806933cb96b7e4e91f76048fc1ba3f14efb1f6acdebec390962b1f7`

## Scope

Task 003 / Capital Goods only. No v7.5.1 Transport Capital Goods, Energy Inputs, population, firms, currency or civilization layer is included.

## Acceptance evidence

- Model patch is based directly on accepted v7.4.1 r1.
- New structure: 56 named elements, 132 LINK additions, 8 semantic definition replacements, Modes 21–23.
- Local re-run on the promoted r2 semantics: Modes 0–23 individually PASS validation.
- Capital Lifecycle conformance: PASS; 7 instances, 6 kernel-v2 variations + Transport v1, 0 NON_CONFORMING.
- Structure audit: PASS; unclassified boundaries 0; A/B symmetry mismatches 0; symmetry exceptions 0; closed-world violations **1** (`Transport Capacity Expansion`).
- Attached acceptance evidence for the semantically identical r2 verification variant reports Modes 0–20 outputs identical to accepted v7.4.1 and policy PASS: observed 1396, expected 1396, unexpected 0, forbidden 0, required missing 0, hard blockers 0.
- The r2 changes relative to rejected r1 are exactly: switch-gated six Capital Goods consumption flows; `Capital Goods Buffer Days = 1` scale-free fulfillment; Mode 22 shock multiplier `0.1`; corrected r2 validation/policy.

## Promotion rule

The accepted file is the metadata-clean promotion of the verified r2 candidate. The model name/description were changed from candidate wording to accepted `v7.5 r1`; executable formulas, elements, links, scenarios and simulation settings are unchanged.
