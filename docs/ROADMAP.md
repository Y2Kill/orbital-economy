# Roadmap

**Document status:** CURRENT  
**Base:** Orbital Economy v7.7.5 r1 — Regolith Capital (accepted 2026-09-28)  
**Rule:** roadmap describes intent; executable accepted code remains authoritative for accepted behavior.

## Current implementation — v7.7.5 Regolith Capital

Regolith extraction capacity is simple capital: each colony has a regolith mine (one capacity stock, expansion from capital goods and construction materials toward a desired capacity sized from a smoothed regolith demand-signal stock, depreciation, retirement of the excess). The first model task written on node declarations: the sector is `model/nodes/regolith-mine.json`, expanded by the bench; only the scenario wiring was hand-written. In Mode 39 colony B rebuilds its mine during the transport surge, and construction materials are short meanwhile — the chain's inertia now starts at the raw material. Planet v1 counter P2: exceptions 6 → 4 (kernel 11, simple 2).

## v7.7.4 Capital Goods Capital

Capital-goods production capacity is capital: each colony has a capital-goods plant on the lifecycle kernel, like the v7.7.3 construction-materials plant, sized to a new smoothed capital-goods demand-signal stock (the plant is built from capital goods, so same-step demand would loop). In Mode 36 A's plant grows past its starting capacity for the first time — the former hard ceiling on all construction is gone; in Mode 37 colony B rebuilds its plant and is short of capital goods meanwhile (fulfillment ≈ 0.19). Planet v1 counter P2: 9 → 11 processes on capital.

## v7.7.3 Construction Materials Capital

Construction-materials processing capacity is capital: each colony has a plant on the capital lifecycle kernel (kernel-v2, no finance limit, as Power), sized to the smoothed demand signal and expanded from capital goods and construction materials. The plant winds down its oversized starting capacity in calm Modes; in Mode 35 (transport surge) colony B rebuilds it, and until it is rebuilt B's construction materials are short (fulfillment ≈ 0.12) — construction-materials output now has inertia. Planet v1 counter P2: 7 → 9 processes on capital.

## v7.7.2 Construction Materials use Energy

Regolith processing is the third consumer of each colony's energy allocator (after smelting and electronics); the plan that feeds the allocator reads a smoothed demand-signal stock (same-step demand closed an algebraic loop through refinery profit — found by the loop audit on the first skeleton). Mode 33 (generation capacity shock) shows colony B producing construction materials under an energy shortfall. First model step under the Planet v1 counter: P3 4 → 6 processes requesting energy.

## v7.7.1 Transport on Construction Materials

Shared Transport expansion also needs construction materials, drawn from A and B (two legs, as capital goods since v7.5.1). Mode 31 (transport surge) is the first Mode in which colony B produces construction materials. With this, every capacity expansion in the model is backed by both capital goods and construction materials.

## v7.7 Construction Materials

A second raw-material chain: regional regolith extraction → construction materials → colonial Refinery/Electronics/Power expansion, which now needs both capital goods and construction materials (`Min` of the two fulfillments). No energy use, no interregional trade, fixed sector capacities. Modes 27–29; Modes 0–26 exact. First model version delivered by the repository agent through `candidate.yml` (task 008). Next increments on this layer:

- ~~v7.7.1 — Transport on construction materials~~ — done (task 009);
- ~~construction materials using energy~~ — done: v7.7.2 (task 012); the allocator risk materialised as an algebraic loop and was caught by the loop audit on the skeleton;
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

### In progress — strict validation schema (task 018, Lab v0.9.10)

The bench ignores fields it does not know: in task 014 r2 five Mode 37 checks carried `from_day`/`to_day` instead of `window`, ran over the whole horizon and passed while checking something other than their names said. Unknown check types only WARN, and checks for a Mode the model does not have never run. Task 018 makes the shape of validation a static HARD check before any simulation (unknown field, unknown type, malformed window, missing Mode → error with a JSON path) and adds `check-validation`. Our prototype over all 40 validation files in git history: 0 errors on every file from v7.5.1 on, exactly the defect on 014 r2.

### Done — guard checks large text as text (2026-09-28)

`tools/check_branch.mjs` treated every file over 1 MB like a binary (allow-list only, no line-ending or leak checks), so the executor of task 017 minified validation to stay under it. Now only binaries and text above 8 MB need `allow_binary`; candidate validation is delivered pretty-printed.

### Done — static algebraic-loop audit (task 010, Lab v0.9.5)

The engine detects an algebraic loop only at run time and only along the `IfThenElse` branches actually taken, so a loop that exists under some switch value is invisible to every static check. This is how 001 r1 (Modes 17–20) and v7.6 r1 (Modes 25–26) failed. The audit builds the same-step dependency graph (VARIABLE and FLOW; STOCK cuts), prunes `IfThenElse` branches decided by the switches and runs Tarjan on every switch combination (128 for v7.7.1), plus a per-Mode forecast. It reproduces both historical failures exactly and reports zero loops on v7.7.1; it is part of `STRUCTURE_AUDIT` (a loop in any combination is FAIL, `compare` gives `NOT_COMPARED`) and runs on every skeleton before a model task is issued (`node src/cli.js loops`; contract §8 p. 13). Accepted 2026-09-26 (`docs/tasks/010-algebraic-loop-audit/`).

### Deferred, with a trigger — model generator

Idea: stable element IDs, deterministic serialisation, the ModelJSON as a build product; first step, generate colony B from colony A plus a parameter table, accepted when the output is byte-identical (`CHECK_CANDIDATE` → `BYTE_IDENTICAL`).

Why not now (measured on v7.7.1 r1): of 344 A/B pairs, 293 are pure name swaps and the 45 behavioural differences are exactly the 45 annotated asymmetric parameters, so all asymmetry already lives in parameters, and the colony-symmetry audit already guards the rest (0 unannotated). A byte-identical generator would still have to carry element order (A and B interleaved), layout (212 pairs differ in coordinates) and 7 descriptions, so the source would hardly be shorter than the JSON. It would also change the delivery format: the contractor would edit the source instead of patching the model.

**Trigger:** a third settlement (colony C) or the v8 templates, when one description really does produce several copies.

### Deferred, with a trigger — retiring switched-off branches

Idea: run old Modes on a frozen model and bench (tag + pinned engine) and delete dead branches from the main line.

Why not now: it replaces the project's central guarantee (old Modes bit-exact on the main line) with replaying history on an old tag. The number of switches (7 in v7.7.1) is not the cost. The cost is untested switch combinations, and the loop audit above covers them statically.

**Trigger:** the first model change for which an exact algebraic fallback at `switch = 0` is impossible or would distort the design. The v7.7.2 increment (construction materials using energy) still had a clean fallback: Modes 0–31 bit-exact.

## External review observations (2026-09-27) — decided: node generator first (task 015 — done, Lab v0.9.8), then `simple_capital` (task 016 — done, Lab v0.9.9)

An outside review of v7.7.3 (not a request for changes). No plan is changed by this section; it records what to decide once task 014 is accepted.

1. **Kernel instances as a node type.** The review argues the capital lifecycle should become a reusable node rather than be hand-replicated per sector. Our own evidence agrees: task 014 was assembled from task 013 by string replacement; kernel instances go 7 → 9 (v7.7.3) → 11 (v7.7.4), about 40 elements each per colony. The generator trigger above was written for the A/B-symmetry argument (colony C / v8); per-sector replication is a separate and stronger reason, and it has arguably fired. If done: a pure refactor accepted by `BYTE_IDENTICAL` against the current model (the criterion recorded in "Deferred — model generator"), no numbers change.
2. **Levels of sector detail.** The review proposes three tiers — simple (capacity → production → inventory), industrial (+ inputs, energy, delayed construction, capital goods), strategic (the full lifecycle: mothballing, strategic reserve, decommissioning). Our Planet v1 P2 target reads "capacity through the lifecycle kernel" for every process; for the remaining P2 exceptions (ore, regolith, power resource) the full kernel may be more than needed. Option to weigh: a "simple capital" declaration kind in `planet_closure` (capacity stock, expansion from capital goods and construction materials, depreciation) alongside `kernel`.
3. **Behavioural criterion for each step.** The review's rule: new detail is justified only if it changes observable market behaviour. Tasks 012–014 already met it (energy-limited construction materials; construction-materials and capital-goods inertia in Modes 35 and 37: fulfillment 0.93 → 0.12 and 0.92 → 0.19). Option: make it an explicit requirement of every Planet v1 step — the step must show its effect in its own Mode.
4. **Commodity interface outward (v8 sketch).** Per commodity and economy: spot price, available now, sell capacity, buy demand, production and consumption rates, expected supply, import/export capacity, lead time, trend/scarcity. Everything else stays internal to the economy's model. The current model already has the transport prototype (cargo stocks, lag, freight in the import price, contract values fixed at shipment).

**Open question for the owner — order.** Our decision of 2026-09-21 is "breadth to a self-contained planet (Planet v1) first, then the network (v8)". The review suggests trying A ↔ transport ↔ B ↔ C at the current level earlier and adding mechanisms only where the network shows implausible behaviour. Both positions are coherent; to be discussed after task 014.

**Further external notes (2026-09-28; texts in `docs/external/`, not normative).**

5. **Module boundary criterion.** "If a phenomenon only changes a coefficient of another process, it is a parameter; if it has memory, its own state and evolves by itself, it is a candidate module." This matches our decomposition rule (do not split for detail) and the behavioural criterion of item 3.
6. **Transport edge for v8.** Beyond capacity, travel time and cost: `risk` and `access` (route security, blockade, sanctions), changed by governance/security, so that war and sanctions act through the ordinary trade mechanisms instead of scripts. Complements the commodity interface of item 4.
7. **Order of modules for Planet v2** (after the economy): Demography → Resources/Habitat → Governance (as rule changes: priorities, quotas, permissions) → a thin Social State. Resources/Habitat overlaps our P4 (deposits); infrastructure as service capacity overlaps `simple_capital`.
8. **Automation before labour.** Labour requirement should carry an automation factor from the start (output × base labour intensity × automation factor, with a minimum human fraction), automation being a state of capital that costs capital goods, electronics, energy and time; the economy must work with population = 0. Recorded as design guidance for the P5 step in `PLANET_V1_CONTRACT_RU.md`.

## Planet v1 acceptance contract

Defined 2026-09-26: `docs/PLANET_V1_CONTRACT_RU.md`. The single boundary counter reached zero (all 122 boundary flows classified, `external_capital` = 0), so Planet v1 is now a set of parts, each with its own counter measured per **process** rather than per boundary flow:

| Part | Now (v7.7.1, per colony) | v1 target |
|---|---|---|
| P1 capital-backed expansion | 0 external | 0 (closed) |
| P2 capacity from capital, not a constant | 2 constant/unbounded — ore, energy resource (v7.7.2: 5; v7.7.3: 4; v7.7.4: 3) | 0 undeclared; exceptions with reason, counted separately |
| P3 declared energy use | 4 of 7 processes + transport without energy (v7.7.1: 5 of 7) | 0 undeclared; exceptions with reason |
| P4 finite deposits | 3 extractions from nothing | deposit stock from a named parameter (v8: derived from planet formation) |
| P5 declared labor | 2 of 9 | all declared; no labor pool (v2) |
| P6 final demand | constants | explicit external driver (population and life support: v2) |
| P7 reproducibility | closed on the canonical platform | platform independence before going public |

Measured by the `planet_closure` validation plugin (task 011, Lab v0.9.6; in the accepted validation since v7.7.1 r2, `report` mode). Next: model steps under the counter. Done: task 012, v7.7.2 construction materials using energy (P3 5 → 4 per colony; bench v0.9.7 `energy_balance` consumers list). Done: task 013, v7.7.3 construction-materials capacity on the capital lifecycle kernel (P2 5 → 4 per colony). Done: task 014, v7.7.4 capital-goods capacity on the capital lifecycle kernel (P2 4 → 3 per colony). Done: task 017, v7.7.5 regolith extraction as simple capital — the first model task on node declarations (P2 exceptions 3 → 2 per colony). Open: `labor: declared` is trusted until the P5 model step introduces explicit labor-requirement variables (contract P5).

## v8 — replicated regions/colonies/planets

Only after Planet v1 is sufficiently rich:

- replace hard-coded A/B demonstration topology with reusable templates;
- support a graph/network of settlements/planets and transport links;
- enable resource/energy/industry/logistics-driven specialization;
- preserve deterministic reproducibility and accepted checkpoints.
