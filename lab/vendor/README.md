# Vendored dependencies

Unmodified npm registry tarballs of the bench's two dependencies. The bytes are the identity: each
file's SHA-512 equals the `integrity` recorded for it in `../package-lock.json`, so this is provably
what the registry serves for that version, not a repack.

| File | Registry URL | Bytes | SHA-256 | Licence (file inside the tarball) |
|---|---|---:|---|---|
| `simulation-9.0.0.tgz` | https://registry.npmjs.org/simulation/-/simulation-9.0.0.tgz | 541452 | `82b4d2528851baa9b7281aa0364b56a2114c02e2e5be6331adf0ae43a03dac12` | AGPL (`package/LICENSE`) |
| `csv-parse-5.6.0.tgz` | https://registry.npmjs.org/csv-parse/-/csv-parse-5.6.0.tgz | 271029 | `2c11496fd2d83a23f0274bf6b9a27096d937a6ba958ca1ec92052268e889c071` | MIT (`package/LICENSE`) |

Fetched 2026-09-25 from the registry and verified against the lock before commit. Do not replace
or re-pack these files; a new engine version is a new golden cross-check (`../ENGINE_PIN.md`), not a
file swap.
