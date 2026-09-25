# License notice

**Orbital Economy Lab itself** — everything under `lab/` except `lab/vendor/` — is part of the Orbital Economy project and is licensed under the MIT License (`../LICENSE`).

**Vendored third-party packages** keep their own licences. `lab/vendor/` holds the unmodified npm registry tarballs required for reproducible installation:

- `lab/vendor/simulation-9.0.0.tgz` — `simulation` by Scott Fortmann-Roe, version 9.0.0, GNU Affero General Public License, version 3 or (at your option) any later version. Some files bundled inside it (`package/vendor/avl`, `bigjs`, `jstat`, `xmldom`) carry their own licence files;
- `lab/vendor/csv-parse-5.6.0.tgz` — `csv-parse`, version 5.6.0, MIT License.

The licence text distributed by each upstream package is present inside its tarball as `package/LICENSE`. The vendored archives are installation inputs; the repository intentionally does not bundle `node_modules`.

**How the two fit together.** The MIT License is compatible with the AGPL-3.0: MIT-licensed code may be combined with AGPL-licensed code. The bench's own source can therefore be reused, modified and redistributed on its own under MIT. The bench *as a running tool* depends on `simulation`; whoever redistributes the bench together with `simulation`, or makes a modified version available to users over a network, must also meet the AGPL obligations for `simulation` (in particular, making the corresponding source available). This notice describes the project's intent and is not legal advice.
