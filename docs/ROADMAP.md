# Roadmap

**Document status:** CURRENT  
**Base:** Orbital Economy v7.7 r1 — Construction Materials (accepted 2026-09-26)  
**Rule:** roadmap describes intent; executable accepted code remains authoritative for accepted behavior.

## Current implementation — v7.7 Construction Materials

A second raw-material chain: regional regolith extraction → construction materials → colonial Refinery/Electronics/Power expansion, which now needs both capital goods and construction materials (`Min` of the two fulfillments). No energy use, no interregional trade, fixed sector capacities. Modes 27–29; Modes 0–26 exact. First model version delivered by the repository agent through `candidate.yml` (task 008). Next increments on this layer:

- **v7.7.1 — Transport on construction materials**: shared transport expansion drawing on A and B inventories, as v7.5.1 did for capital goods;
- construction materials using energy (the allocator change is the risky part — see the v7.4 lesson);
- a situation where colony B builds: today B never expands, so half of every new sector stays idle.

## Previous layer — v7.6 Energy Kernel v2

The approved energy-kernel refactor is implemented:

- explicit physical power-resource stocks and extraction;
- capacity-limited desired generation separated from resource-limited available generation;
- physical operating-resource consumption paired to actual energy supply;
- resource scarcity contributes to generation cost;
- separate resource-shock and capacity-shock acceptance modes;
- old v7.5.1 path retained under `Power Resource Enabled = 0`.

Mode 25 calibrated in v7.6.1 (resource-supply shock at 50 % of extraction instead of a 10 % cut-off; `V7_6_1_CALIBRATION_REPORT.md`). v7.6 promotion: the pinned executable validation (Modes 0–26 PASS) and the exact Modes 0–24 comparison against v7.5.1 r1 were run on 2026-09-25 — see `ACCEPTANCE_STATUS.md` and `V7_6_R1_TO_R2_FIX_REPORT.md`.

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

## Open technical item — platform-independent arithmetic

**Status:** open, not scheduled. Decided 2026-09-25 to live with it for now (canonical platform, `VERSIONING_AND_AUTHORITY.md` §8) and remove it later.

**Problem.** Accepted numbers are bit-exact only on Windows. The engine executes the model's `^` as `Math.pow`; Node's `Math.pow` rounds differently on Windows and Linux for some arguments (1 ULP, near-halfway cases), and the model's feedback loops amplify it — every Mode differs bitwise between the two OSes, Mode 19 by up to 4.35 % at day 1080. Browsers are unverified and may differ again. Found in tasks 005/006; evidence in `docs/tasks/006-cross-os/`.

**Where it bites.** 198 formulas use `^`. Both integer and fractional exponents are affected: the first platform-dependent call found was `x ^ 8`, the first one that propagated was `x ^ 0.125`, both inside the smooth saturation `x / (1 + (x / cap) ^ 8) ^ 0.125` used by the production rates.

**Directions to evaluate (a separate task each, with full re-acceptance of all Modes):**

1. **Model side** — express integer powers as products (`y * y` …) where the engine evaluates them exactly, and replace fractional powers in saturations with a formulation that needs no transcendental function; check whether the engine's other functions used by the model are platform-stable.
2. **Engine side** — route `^` through a deterministic, platform-independent `pow`; the engine is pinned (`lab/ENGINE_PIN.md`), so this means a patched engine and a new golden cross-check.
3. **Verification** — whichever route: `tools/verify_series.mjs` on Windows and Linux (CI `cross-os.yml`) must report bit-identical series in every Mode; then, and only then, §8 of `VERSIONING_AND_AUTHORITY.md` can be relaxed.

Any of these changes the model's numbers everywhere (by 1 ULP and whatever the feedback makes of it), so it is a new model version, not a bench fix.

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
