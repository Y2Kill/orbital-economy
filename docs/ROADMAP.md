# Roadmap

**Document status:** CURRENT  
**Base:** Orbital Economy v7.6 r2 Energy Kernel v2 (accepted 2026-09-25)  
**Rule:** roadmap describes intent; executable accepted code remains authoritative for accepted behavior.

## Current implementation — v7.6 Energy Kernel v2

The approved energy-kernel refactor is implemented:

- explicit physical power-resource stocks and extraction;
- capacity-limited desired generation separated from resource-limited available generation;
- physical operating-resource consumption paired to actual energy supply;
- resource scarcity contributes to generation cost;
- separate resource-shock and capacity-shock acceptance modes;
- old v7.5.1 path retained under `Power Resource Enabled = 0`.

Promotion completed: the pinned executable validation (Modes 0–26 PASS) and the exact Modes 0–24 comparison against v7.5.1 r1 were run on 2026-09-25 — see `ACCEPTANCE_STATUS.md` and `V7_6_R1_TO_R2_FIX_REPORT.md`.

## Next design phase — broader planetary industries

With Energy Kernel v2 accepted, the main roadmap returns to expanding the material basis of one planet. Priority candidates:

1. **Concrete generation technologies / energy-resource classes** only where they create materially different constraints (fuelled, nuclear, intermittent renewable, geothermal/hydro, etc.).
2. **Broader raw-material classes** — avoid one universal Ore where different resource bases matter.
3. **Construction/basic materials** — infrastructure/habitat material basis beyond Capital Goods.
4. **Additional industrial transformation sectors** needed for a self-contained planetary production graph.
5. **Water / food / habitat / life support** before population becomes a fully physical actor.
6. **Population, endogenous labor and consumption** after the physical consumption basket exists.
7. **Consumer goods and recycling/recovery** where they materially alter scarcity and long-run closure.

The decomposition rule remains: do not split a sector merely for detail. Split it when resource base, technology, geography, investment logic or strategic role produces different behavior.

## Planet v1 acceptance concept

Planet v1 needs a multi-part contract rather than a single violation counter:

- declared physical production chains complete at the chosen abstraction level;
- explicit essential energy/resource dependencies;
- capital expansion/replacement physically backed;
- life-support flows represented if population is active;
- no hidden external boundary presented as internal production;
- deterministic, reproducible validation and regression.

## v8 — replicated regions/colonies/planets

Only after Planet v1 is sufficiently rich:

- replace hard-coded A/B demonstration topology with reusable templates;
- support a graph/network of settlements/planets and transport links;
- enable resource/energy/industry/logistics-driven specialization;
- preserve deterministic reproducibility and accepted checkpoints.
