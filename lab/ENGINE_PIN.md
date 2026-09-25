# Engine pin

Orbital Economy Lab v0.9.2 intentionally pins:

```text
simulation = 9.0.0
```

The accepted v7.3 r2 model was golden-cross-checked between browser exports and the local runner for Modes 0–16 with exact `max abs diff = 0` over every series exported by the browser.

Do not silently upgrade the simulation package. An engine change requires a new golden web↔local cross-check before the new engine is accepted.

`COMPARE_MODELS.cmd` compares accepted and candidate with the same pinned local engine so that reported differences are attributable to model/scenario changes rather than to a changing runtime.

The default v0.5.0 change policy (r2) also pins the factual comparator to exact output comparison (`abs_tolerance=0`, relative tolerance disabled). A policy preflight failure is expected if a comparison report was produced with different tolerances.
