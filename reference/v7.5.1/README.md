# Orbital Economy — Accepted Baseline v7.5.1 r1

**Status:** ACCEPTED BASELINE  
**Accepted:** 2026-09-24  
**Model SHA-256:** `299216122552a6819e5ef6432f8dc51197cde7c0862de7a43edd8eef359aeeda`  
**Engine:** `simulation@9.0.0`  
**Lab:** Orbital Economy Lab v0.9.0

This package is the clean working checkpoint for Orbital Economy after closing the planned v7.5.1 Transport Capital Goods increment.

## Authority

`docs/` is the canonical documentation layer, but **accepted code is authoritative about actual model behavior**. If documentation disagrees with the accepted ModelJSON or executable validation, documentation must be corrected; code is not silently altered to fit prose.

Read in this order:

1. `docs/CURRENT_STATE.md` — what exists now;
2. `docs/ARCHITECTURE.md` — how the current model is organized;
3. `docs/ROADMAP.md` — what is planned next;
4. `docs/VERSIONING_AND_AUTHORITY.md` — authority/versioning rules.

## What v7.5.1 adds

The shared Transport sector no longer creates installed capacity from an unbacked external-capital source. Transport now has:

- `Transport Desired Expansion` preserving the accepted v7.5 investment policy;
- explicit `Transport Capital Goods Demand`;
- a scale-free fulfillment factor based on combined A/B Capital Goods inventories;
- physical Capital Goods consumption from both A and B regional inventories;
- actual `Transport Capacity Expansion = Desired Expansion × Fulfillment` when the v7.5.1 switch is enabled.

The production-planning share of shared Transport demand is split equally between A and B; actual physical consumption is drawn from the two inventories in proportion to their current stocks.

## Acceptance summary

- Modes **0–23**: exact regression against accepted v7.5 — `changed=0`, `maxAbs=0` for every old Mode.
- Mode **24**: Transport Capital Goods Closure — PASS.
- Capital Lifecycle conformance: PASS, 7/7 instances, all kernel-v2.
- Structure audit: PASS.
- Declared external-capital closed-world violations: **0**.
- A/B structural symmetry mismatches: **0**.
- Temporary task acceptance policy: 388/388 expected changes, 0 unexpected/forbidden/missing.

`closed-world violations = 0` is a narrow statement about the currently declared expansion-boundary audit. It does **not** mean the planetary economy is complete: explicit energy inputs, broader materials/resource sectors, population/life support and other future subsystems remain outside current scope.

## Package layout

```text
model/       accepted ModelJSON
validation/  accepted executable validation contract
policy/      strict default-deny policy bound to this baseline
docs/        canonical current documentation and generated audit reports
lab/         reproducible QA/comparison/policy/conformance tools
```

Historical task/spec/delivery documents are intentionally not part of this clean package.
