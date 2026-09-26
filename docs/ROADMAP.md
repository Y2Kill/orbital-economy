# Roadmap

**Document status:** CURRENT  
**Base:** Orbital Economy v7.7.1 r1 — Transport on Construction Materials (accepted 2026-09-26)  
**Rule:** roadmap describes intent; executable accepted code remains authoritative for accepted behavior.

## Current implementation — v7.7.1 Transport on Construction Materials

Shared Transport expansion also needs construction materials, drawn from A and B (two legs, as capital goods since v7.5.1). Mode 31 (transport surge) is the first Mode in which colony B produces construction materials. With this, every capacity expansion in the model is backed by both capital goods and construction materials.

## v7.7 Construction Materials

A second raw-material chain: regional regolith extraction → construction materials → colonial Refinery/Electronics/Power expansion, which now needs both capital goods and construction materials (`Min` of the two fulfillments). No energy use, no interregional trade, fixed sector capacities. Modes 27–29; Modes 0–26 exact. First model version delivered by the repository agent through `candidate.yml` (task 008). Next increments on this layer:

- ~~v7.7.1 — Transport on construction materials~~ — done (task 009);
- construction materials using energy (the allocator change is the risky part — see the v7.4 lesson);
- ~~a stimulated Mode in which colony B builds with construction materials on~~ — done: Mode 31 (v7.7.1).

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

## Bench and process

### Done — static algebraic-loop audit (task 010, Lab v0.9.5)

The engine detects an algebraic loop only at run time and only along the `IfThenElse` branches actually taken, so a loop that exists under some switch value is invisible to every static check. This is how 001 r1 (Modes 17–20) and v7.6 r1 (Modes 25–26) failed. The audit builds the same-step dependency graph (VARIABLE and FLOW; STOCK cuts), prunes `IfThenElse` branches decided by the switches and runs Tarjan on every switch combination (128 for v7.7.1), plus a per-Mode forecast. It reproduces both historical failures exactly and reports zero loops on v7.7.1; it is part of `STRUCTURE_AUDIT` (a loop in any combination is FAIL, `compare` gives `NOT_COMPARED`) and runs on every skeleton before a model task is issued (`node src/cli.js loops`; contract §8 p. 13). Accepted 2026-09-26 (`docs/tasks/010-algebraic-loop-audit/`).

### Deferred, with a trigger — model generator

Idea: stable element IDs, deterministic serialisation, the ModelJSON as a build product; first step, generate colony B from colony A plus a parameter table, accepted when the output is byte-identical (`CHECK_CANDIDATE` → `BYTE_IDENTICAL`).

Why not now (measured on v7.7.1 r1): of 344 A/B pairs, 293 are pure name swaps and the 45 behavioural differences are exactly the 45 annotated asymmetric parameters, so all asymmetry already lives in parameters, and the colony-symmetry audit already guards the rest (0 unannotated). A byte-identical generator would still have to carry element order (A and B interleaved), layout (212 pairs differ in coordinates) and 7 descriptions, so the source would hardly be shorter than the JSON. It would also change the delivery format: the contractor would edit the source instead of patching the model.

**Trigger:** a third settlement (colony C) or the v8 templates, when one description really does produce several copies.

### Deferred, with a trigger — retiring switched-off branches

Idea: run old Modes on a frozen model and bench (tag + pinned engine) and delete dead branches from the main line.

Why not now: it replaces the project's central guarantee (old Modes bit-exact on the main line) with replaying history on an old tag. The number of switches (7 in v7.7.1) is not the cost. The cost is untested switch combinations, and the loop audit above covers them statically.

**Trigger:** the first model change for which an exact algebraic fallback at `switch = 0` is impossible or would distort the design. The next planned increment, construction materials using energy, still has a clean fallback.

## Planet v1 acceptance contract

Defined 2026-09-26: `docs/PLANET_V1_CONTRACT_RU.md`. The single boundary counter reached zero (all 122 boundary flows classified, `external_capital` = 0), so Planet v1 is now a set of parts, each with its own counter measured per **process** rather than per boundary flow:

| Part | Now (v7.7.1, per colony) | v1 target |
|---|---|---|
| P1 capital-backed expansion | 0 external | 0 (closed) |
| P2 capacity from capital, not a constant | 5 constant/unbounded | 0 undeclared; exceptions with reason, counted separately |
| P3 declared energy use | 5 of 7 processes + transport without energy | 0 undeclared; exceptions with reason |
| P4 finite deposits | 3 extractions from nothing | deposit stock from a named parameter (v8: derived from planet formation) |
| P5 declared labor | 2 of 9 | all declared; no labor pool (v2) |
| P6 final demand | constants | explicit external driver (population and life support: v2) |
| P7 reproducibility | closed on the canonical platform | platform independence before going public |

Measured by the `planet_closure` validation plugin (task 011, Lab v0.9.6; validation v7.7.1 r2, `report` mode). Next: model steps under the counter, starting with construction materials using energy (P3 5 → 4 per colony). Open: `labor: declared` is trusted until the P5 model step introduces explicit labor-requirement variables (contract P5).

## v8 — replicated regions/colonies/planets

Only after Planet v1 is sufficiently rich:

- replace hard-coded A/B demonstration topology with reusable templates;
- support a graph/network of settlements/planets and transport links;
- enable resource/energy/industry/logistics-driven specialization;
- preserve deterministic reproducibility and accepted checkpoints.
