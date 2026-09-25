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

**Reproducibility is per platform — rule: `../docs/VERSIONING_AND_AUTHORITY.md` §8 (canonical platform Windows x64 · Node 24.11.1).** The same model, engine (`simulation` 9.0.0) and Node (24.11.1) produce bit-different series on Windows and on Linux in **every** Mode (task 006; task 005 had compared only the values printed by checks and wrongly suggested Modes 0–16 were unaffected). Root cause: the model's `^` operator is executed as `Math.pow`, and Node's `Math.pow` rounds differently on the two OSes for some arguments — e.g. `Math.pow(0x401368263c9d9065, 0.125)` is `…b79d` on Windows (correctly rounded, 0.499 ULP) and `…b79e` on Linux (0.501 ULP). It depends on the OS, not the CPU: Intel and AMD machines on Windows agree bit for bit. The 1-ULP differences propagate through the model's feedback loops (up to 4.35 % in Mode 19 by day 1080); every validation check passes on both OSes. Consequences: exact comparisons (`abs_tolerance = 0`) are valid only when both sides run on the same OS — which `COMPARE_MODELS` / `CHECK_CANDIDATE` guarantee, since they compute both models in one run; accepted reference numbers are Windows-produced; a Linux CI run is a hint, not an acceptance. `node src/cli.js series` (Lab v0.9.4) hashes every series bit-exactly for cross-machine comparison; `.github/workflows/cross-os.yml` runs it on both OSes. Details: `../docs/tasks/006-cross-os/ACCEPTANCE_RU.md`.

Do not silently upgrade the simulation package. An engine change requires a new golden web↔local cross-check before the new engine is accepted.

`COMPARE_MODELS.cmd` compares accepted and candidate with the same pinned local engine so that reported differences are attributable to model/scenario changes rather than to a changing runtime.

The change policy also pins the factual comparator to exact output comparison (`abs_tolerance=0`, relative tolerance disabled). A policy preflight failure is expected if a comparison report was produced with different tolerances.
