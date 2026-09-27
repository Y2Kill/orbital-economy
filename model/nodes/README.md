# Node declarations of the accepted model

Declarative sources of the sectors that are generated rather than hand-written. Each file declares one node; the bench
expands it against a base model into model elements, formula replacements and links, plus the matching validation
fragments (kernel instance, boundary classification, transformation pairs, Planet v1 capacity declaration).

| File | Node type | Since | Reproduces |
|---|---|---|---|
| `construction-materials-plant.json` | `capital_lifecycle` | v7.7.3 r1 (task 013) | A/B Construction Materials Plant |
| `capital-goods-plant.json` | `capital_lifecycle` | v7.7.4 r1 (task 014) | A/B Capital Goods Plant |

The seven older lifecycle instances (Electronics, Power, Refinery, Transport) remain hand-written: they carry model
history (legacy switch gating, finance limits, layered regression branches) and are not generated.

Verified before task 015 by `docs/tasks/015-node-generator/reference/expand_prototype.mjs`: each declaration, expanded
against the model accepted before its step, reproduces that step's elements, replacements and links with zero
differences in definitions, and its validation fragments equal the accepted ones.
