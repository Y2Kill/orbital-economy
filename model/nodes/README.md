# Node declarations of the accepted model

Declarative sources of the sectors that are generated rather than hand-written. Each file declares one node; the bench
expands it against a base model into model elements, formula replacements and links, plus the matching validation
fragments (kernel instance, boundary classification, transformation pairs, Planet v1 capacity declaration).

| File | Node type | Since | Reproduces |
|---|---|---|---|
| `construction-materials-plant.json` | `capital_lifecycle` | v7.7.3 r1 (task 013) | A/B Construction Materials Plant |
| `capital-goods-plant.json` | `capital_lifecycle` | v7.7.4 r1 (task 014) | A/B Capital Goods Plant |
| `regolith-mine.json` | `simple_capital` | v7.7.5 r1 (task 017) | A/B Regolith Mine — the first sector written as a declaration from the start |
| `ore-mine.json` | `simple_capital` | v7.7.6 r1 (task 019) | A/B Ore Mine — wraps the regolith mine on the capital-goods and construction-materials demand formulas |
| `power-resource-mine.json` | `simple_capital`, `cap: "smooth"` | v7.7.7 r1 (task 021) | A/B Power Resource Mine — caps the former uncapped extraction rate (kept as `Uncapped Output`); wraps the ore mine on the demand formulas |

The seven older lifecycle instances (Electronics, Power, Refinery, Transport) remain hand-written: they carry model
history (legacy switch gating, finance limits, layered regression branches) and are not generated.

Verified before task 015 by `docs/tasks/015-node-generator/reference/expand_prototype.mjs`: each declaration, expanded
against the model accepted before its step, reproduces that step's elements, replacements and links with zero
differences in definitions, and its validation fragments equal the accepted ones. `regolith-mine.json` needed no such
proof: task 017 delivered it unchanged in the `nodes` section of the model patch, so the accepted model was generated from it; the same holds for `ore-mine.json` (task 019) and `power-resource-mine.json` (task 021). Order matters when nodes extend the same formula: the later node wraps the earlier one, and `NODE_SELF_TEST` reads the peel order from the model.
