# Energy Kernel v2 — implementation specification

**Version:** v7.6 r2  
**Status:** IMPLEMENTED IN MODEL, RUNTIME-ACCEPTED (2026-09-25)  
**Base:** v7.5.1 r1

## Purpose

Separate three different quantities that the old energy layer partially conflated:

1. industrial energy **requested**;
2. generation physically possible from active **capacity**;
3. generation physically supportable by an operating **resource**.

## Kernel

For colony `X`:

```text
DesiredGeneration_X = min(TotalRequestedEnergy_X, ActiveGenerationCapacity_X)
ResourceDemand_X = DesiredGeneration_X × ResourcePerEnergy
ResourceFulfillment_X = f(ResourceInventory_X, ResourceDemand_X, BufferDays)
AvailableGeneration_X = DesiredGeneration_X × ResourceFulfillment_X
EnergyFulfillment_X = min(1, AvailableGeneration_X / RequestedEnergy_X)
ResourceConsumption_X = EnergySupply_X × ResourcePerEnergy
```

When `Power Resource Enabled = 0`, the accepted v7.5.1 path is the fallback and new physical-resource flows are zero.

## Physical stocks and flows

Per region:

- STOCK `Power Resource Inventory`;
- FLOW `Power Resource Extraction`: external planetary primary-resource boundary → inventory;
- FLOW `Power Resource Consumption`: inventory → physical sink during actual energy supply.

The consumption identity is checked dynamically **in Modes 25–26**:

```text
Power Resource Consumption = Energy Supply × Power Resource per Energy
```

It is scoped to those modes because the consumption flow is gated by `Power Resource Enabled`: with the kernel off, consumption is 0 while `Energy Supply` is not, so the identity is false by construction. Modes 0–24 assert the switch-off state instead (consumption 0, extraction 0, fulfillment 1, inventory a dead stock at 5000, resource price at base). The same rule already applies to the v7.5 capital-goods pairs.

`Power Resource per Energy = 1` in r1, therefore the executable identity coefficient is 1. If that parameter is recalibrated, the validation identity must be updated with it.

## Extraction planning

The r1 extraction kernel is intentionally simple:

```text
TargetInventory = BufferDays × ResourceDemand
ExtractionRate = max(0,
    ResourceDemand + (TargetInventory - Inventory) / AdjustmentTime
) × Headroom × TestMultiplier
```

It is not a geological model. It provides a physical stock/replenishment loop suitable for later replacement by technology-specific extraction sectors.

## Cost

When enabled:

```text
PerceivedResourceDemand      = min(EnergyDemandSignal, ActiveGenerationCapacity) × ResourcePerEnergy
PerceivedResourceFulfillment = min(1, ResourceInventory / (BufferDays × PerceivedResourceDemand))
ResourcePrice                = BaseResourcePrice × (1 + ScarcityStrength × (1 - PerceivedResourceFulfillment))
EffectiveGenerationCost      = legacy_generation_cost + ResourcePrice × ResourcePerEnergy
```

Thus resource scarcity influences both quantity and price without rewriting the existing energy-price signal layer.

**The price channel must not read `ResourceFulfillment`.** That ratio is derived from `DesiredGeneration`, which is derived from requested energy, which is derived from the energy price — so pricing off it closes an algebraic loop and the engine refuses to run Modes 25–26 (this was the r1 defect; see `V7_6_R1_TO_R2_FIX_REPORT.md`). `EnergyDemandSignal` is a STOCK that smooths total requested energy over `Energy Demand Signal Adjustment Time` (3 days), so the perceived ratio depends only on state. The existing `PerceivedEnergyScarcityRatio` in the legacy price layer is built exactly this way; r2 restores that idiom. Physical rationing keeps using the instantaneous `ResourceFulfillment`.

Both ratios are 1 when `Power Resource Enabled = 0`, so the price stays at `BaseResourcePrice` in the legacy modes.

## Acceptance intent

Mode 25 must establish that resource shortage can reduce available generation while active generation capital remains present.

Mode 26 must establish the orthogonal case: capacity shortage can reduce energy supply while resource fulfillment remains high.

Modes 0–24 must remain exact legacy regression with the kernel switch disabled.
