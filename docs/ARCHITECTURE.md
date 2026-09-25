# Architecture

**Document status:** CURRENT  
**Base:** Orbital Economy v7.6.1 r1  
**Rule:** this document describes accepted code; code is authoritative on conflict.

## 1. Model character

The current model is a deterministic sectoral system-dynamics economy with two regional nodes, physical inventories, endogenous prices, interregional trade, shared logistics and explicit capital lifecycle.

It is not yet an agent-based civilization simulation.

## 2. High-level physical/economic graph

```text
                         ENERGY
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
ORE → REFINERY → METAL ─────────→ ELECTRONICS
                 │                    │
                 └────────┬───────────┘
                          ▼
                    CAPITAL GOODS
                 ┌────────┼────────┐
                 ▼        ▼        ▼
             Refinery  Electronics Power
                expansion / capital lifecycle

REGION A  ⇄  shared TRANSPORT / trade  ⇄  REGION B
                          │
                          ▼
                 Transport expansion
                          │
            physical Capital Goods from A+B
```

## 3. Regional production architecture

A and B contain mirrored industrial structures. Structural mirror equality is audited; calibrated numeric parameters may differ where explicitly annotated.

Physical chains currently represented:

1. primary Ore extraction;
2. Ore → Metal;
3. Metal → Electronics;
4. Metal + Electronics → Capital Goods;
5. Capital Goods → installed Refinery/Electronics/Power capital;
6. Capital Goods → shared installed Transport capacity.

## 4. Capital Goods layer

Regional Capital Goods inventories are real stocks. Production consumes Metal and Electronics. Regional production plans respond to:

- desired local Refinery expansion;
- desired local Electronics expansion;
- desired local Power expansion;
- the region's planning share of shared Transport demand;
- inventory correction toward target coverage.

### Shared Transport variation

Transport is global/shared rather than A- or B-local. v7.5.1 therefore uses a two-leg physical transformation rather than inventing a third producer region:

```text
Transport Desired Expansion × CG per Capacity
                     ↓
             Transport CG Demand
                     ↓
       A inventory + B inventory
                     ↓
              CG Fulfillment
                     ↓
          actual Transport Expansion
            ↙                    ↘
 A Transport CG Consumption   B Transport CG Consumption
```

Planning demand is split 50/50 between the symmetric producers. Actual consumption shares are proportional to current A/B Capital Goods inventories. The two shares sum to one, and the accepted Mode 24 validation checks:

```text
A Transport CG Consumption
+ B Transport CG Consumption
= Transport Capacity Expansion × Transport CG per Capacity
```

The fulfillment buffer reuses the scale-free `Capital Goods Buffer Days` mechanism.

## 5. Capital Lifecycle kernel

Core lifecycle states include Installed, Active, derived Inactive reserve, Decommissioning and Retired. Common mechanisms include activation, mothballing, depreciation, decommissioning and dismantling.

Kernel-v2 adds:

- `desired_expansion`;
- physical Capital Goods consumption paired to actual expansion.

Transport uses a documented shared-infrastructure variation with a secondary Capital Goods consumption role because one global expansion flow is backed by two regional inventories.

## 6. Markets and trade

Market prices and profitability create incentives; they do not create physical goods directly. Interregional trade compares local and foreign offers with freight. Transport capacity is scarce and allocated across goods/directions.

Already-dispatched cargo carries contracted goods/freight values so later spot prices do not retroactively reprice it.

## 7. Regression switches

Major architecture increments are isolated by explicit switches/scenario contracts. v7.5.1 introduces `Transport Capital Goods Enabled`.

Modes 0–23 set it to `0`, guaranteeing the accepted v7.5 execution path. Mode 24 sets it to `1`.

This is why the v7.5 → v7.5.1 comparison can demand exact regression rather than tolerance-based similarity.

## 8. Structural truth layers

- ModelJSON: executable factual behavior;
- validation JSON: executable acceptance contract;
- strict policy: default-deny protection of the accepted checkpoint;
- lifecycle conformance: topology/dependency contract;
- structure audit: boundary classification/transformation pairs/A↔B symmetry;
- canonical docs: human-readable current truth derived from the above.

## 9. What `closed-world = 0` means

It means the current declared audit finds no unbacked **capital expansion boundary**.

It does not mean all physical planetary inputs are closed. Primary extraction is intentionally an allowed boundary; energy operating inputs and several future planetary sectors do not yet exist.


## Energy Kernel v2 (v7.6)

The energy layer now separates requested energy, capacity-limited desired generation, resource-limited available generation and delivered energy. `Power Resource Enabled` gates the new operating-resource path. Primary resource extraction fills regional physical inventories; actual delivered energy consumes those inventories. The existing Power capital lifecycle remains unchanged and continues to determine active generation capacity.

The generic power resource is an abstraction boundary for later generation technologies, not a permanent universal fuel taxonomy. Future technologies should plug into the kernel by defining their operating-resource/availability constraints without bypassing `Available Generation`.
