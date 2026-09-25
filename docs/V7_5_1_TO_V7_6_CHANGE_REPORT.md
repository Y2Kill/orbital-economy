# v7.5.1 → v7.6 implementation delta

**Base:** accepted v7.5.1 r1  
**Accepted:** v7.6 r2 Energy Kernel v2 (r1 numbers below; the r1 -> r2 delta is in the last section)

## Structural delta

- named primitives added: **37**
- named primitives removed: **0**
- existing named primitives changed: **11**
- scenarios: 25 → 27
- FLOW: 135 → 139
- STOCK: 65 → 67
- VARIABLE: 763 → 794
- LINK: 1840 → 1926

## Existing primitives intentionally modified

- `A Effective Power Generation Cost`
- `A Energy Fulfillment Ratio`
- `A Instant Energy Scarcity Ratio`
- `A Power Active Generation Capacity`
- `A Power Utilization`
- `B Effective Power Generation Cost`
- `B Energy Fulfillment Ratio`
- `B Instant Energy Scarcity Ratio`
- `B Power Active Generation Capacity`
- `B Power Utilization`
- `Timed Test Mode`

All other existing named primitives are structurally unchanged. Modes 0–24 explicitly set `Power Resource Enabled = 0`.

## Static QA

- structure audit: PASS
- Capital Lifecycle conformance: PASS
- unresolved formula references: 0
- formula dependencies without LINK: 0
- A/B symmetry mismatches: 0
- unclassified boundary flows: 0
- declared external-capital violations: 0

## r1 -> r2 delta (runtime fixes, 2026-09-25)

Model:

- named primitives added: **4** — `A/B Perceived Power Resource Demand`, `A/B Perceived Power Resource Fulfillment`;
- existing named primitives changed: **2** — `A/B Power Resource Price` (now read the perceived ratio);
- LINK: 1926 -> 1940 (14 added, 2 stale removed);
- VARIABLE 794 -> 798; STOCK 67 (unchanged); FLOW 139 (unchanged); elements 2926 -> 2944.

Validation (`validation-v7.6.json`):

- `A/B power-resource operating identity` moved out of `global_checks` into Modes 25-26;
- Modes 0-24 gained five switch-off checks per colony (consumption 0, extraction 0, fulfillment 1, inventory dead at 5000, price at base);
- Mode 26 gained the B-side resource-fulfillment check for symmetry with Mode 25.

Reason, evidence and verification: `V7_6_R1_TO_R2_FIX_REPORT.md`.

## Runtime result

- Modes 0-26: **PASS** 27/27;
- Modes 0-24 vs accepted v7.5.1 r1: 25 x `common=963, changed=0, added=41, removed=0, maxAbs=0`;
- promotion to accepted baseline completed 2026-09-25; see `ACCEPTANCE_STATUS.md`.
