# Architecture

**Document status:** CURRENT  
**Base:** Orbital Economy v7.7.7 r1  
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
5. Capital Goods + Construction Materials → installed Refinery/Electronics/Power capital (v7.7);
6. Capital Goods → shared installed Transport capacity;
7. Regolith extraction → Construction Materials (v7.7).

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

## 4a. Construction Materials layer (v7.7)

Each colony extracts **regolith** (a second, bulk raw resource) into a regional inventory and processes it into **Construction Materials** at a fixed processing capacity; no energy is used in v7.7. Colonial Refinery/Electronics/Power expansion requires both physical inputs:

```text
expansion = desired expansion × Min(Capital Goods fulfillment, Construction Materials fulfillment)
```

and consumes both, each by its own per-capacity norm. Both fulfillments are scale-free (buffer in days of demand). Shared Transport uses them too since v7.7.1: `Transport Capacity Expansion = Desired × Min(Transport CG Fulfillment, Transport CM Fulfillment)`, drawing from A and B by current stock shares. Since v7.7.2 construction-materials processing draws energy as the third consumer of the colony allocator (after smelting and electronics); its plan reads a smoothed demand-signal stock, because same-step demand closes an algebraic loop through refinery profit (`CURRENT_STATE.md` 2b). Since v7.7.3 processing capacity is capital: each colony has a construction-materials plant on the lifecycle kernel (kernel-v2, no finance limit, as Power), sized to the same demand signal and expanded from capital goods and construction materials (`CURRENT_STATE.md` 2c). Since v7.7.4 the capital-goods sector has the same kind of plant, sized to a smoothed capital-goods demand-signal stock (`CURRENT_STATE.md` 2d). Since v7.7.5 regolith extraction capacity is a regolith mine per colony — simple capital (`CURRENT_STATE.md` 2e); since v7.7.6 ore mining capacity is an ore mine of the same kind (2f); since v7.7.7 energy-resource extraction has a mine too, capping the former uncapped extraction rate (2g). Colony B builds only when stimulated: it starts with more Refinery / Electronics / Power capacity than it needs, so in calm scenarios (Modes 17, 21, 27) it winds capacity down, while demand surges and shocks make it expand (Modes 18–20, 23–26, 31). Since v7.7.1 shared Transport also draws construction materials from A and B (two legs, as capital goods since v7.5.1), and Mode 31 — the transport surge with everything on — makes B build, extract regolith and produce construction materials. Switch: `Construction Materials Enabled` (Modes 0–26 = 0). Details: `docs/tasks/008-construction-materials/V7_7_ARCHITECTURE_SPEC.md`.

## 5. Capital Lifecycle kernel

Core lifecycle states include Installed, Active, derived Inactive reserve, Decommissioning and Retired. Common mechanisms include activation, mothballing, depreciation, decommissioning and dismantling.

Kernel-v2 adds:

- `desired_expansion`;
- physical Capital Goods consumption paired to actual expansion.

Transport uses a documented shared-infrastructure variation with a secondary Capital Goods consumption role because one global expansion flow is backed by two regional inventories.

**Simple capital (v7.7.5).** A lighter capital form for processes that need no activation or mothballing: one capacity stock, expansion from capital goods and construction materials toward a desired capacity sized from a smoothed demand-signal STOCK, depreciation, and retirement of the excess. It is a node type (`simple_capital`, `lab/docs/NODES_RU.md`) checked by its own validation plugin; its depreciation and retirement leave the model through the closed-world boundary category `capital_retirement`. Instances: A/B Regolith Mine (v7.7.5, `model/nodes/regolith-mine.json`), A/B Ore Mine (v7.7.6, `model/nodes/ore-mine.json`) and A/B Power Resource Mine (v7.7.7, `model/nodes/power-resource-mine.json`). Two ways to attach: replace a capacity constant inside an existing capacity variable (`replaces`), or cap an uncapped rate smoothly, keeping the old formula as `Uncapped Output` (`cap: "smooth"`, since Lab v0.9.11). Nodes that extend the same formulas nest: the ore mine wraps the regolith mine on the capital-goods and construction-materials demand formulas.

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
