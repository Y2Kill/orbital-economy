# Engine pin

Orbital Economy Lab v0.9.3 intentionally pins:

```text
simulation = 9.0.0
```

The pin is enforced in four layers:

1. `lab/vendor/simulation-9.0.0.tgz` contains the unmodified registry tarball shipped with the repository.
2. `package-lock.json` keeps the registry `integrity` for `simulation@9.0.0`.
3. `INSTALL.cmd` seeds a separate temporary npm cache only from the vendored tarballs and runs `npm ci --offline`; installation therefore follows the lock without using the network or the user's normal npm cache.
4. `src/engine.js` reads the installed `node_modules/simulation/package.json` on startup and refuses to run unless its actual `version` is exactly `9.0.0`. Reports use that actual installed version, not a display-only constant.

The accepted v7.3 r2 model was golden-cross-checked between browser exports and the local runner for Modes 0–16 with exact `max abs diff = 0` over every series exported by the browser.

Do not silently upgrade the simulation package. An engine change requires a new golden web↔local cross-check before the new engine is accepted.

`COMPARE_MODELS.cmd` compares accepted and candidate with the same pinned local engine so that reported differences are attributable to model/scenario changes rather than to a changing runtime.

The change policy also pins the factual comparator to exact output comparison (`abs_tolerance=0`, relative tolerance disabled). A policy preflight failure is expected if a comparison report was produced with different tolerances.
