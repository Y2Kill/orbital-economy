#!/usr/bin/env node
// Compares a series digest (`node lab/src/cli.js series`, Lab >= v0.9.4) against the canonical-platform
// golden digest of the accepted model, Mode by Mode, bit for bit.
//
// Why this exists: the model's `^` runs as Math.pow, and Node's Math.pow rounds differently on
// Windows and Linux for some arguments. Bit-exact numbers are therefore defined on ONE platform —
// the canonical platform (docs/VERSIONING_AND_AUTHORITY.md §8). This tool answers "does this
// machine reproduce the accepted numbers exactly?". It compares per-Mode hashes (locale-independent),
// not file bytes: the digest file's key order follows localeCompare and may vary with the locale.
//
// Usage:
//   node tools/verify_series.mjs <candidate series-digest.json> [golden.json]
//   golden defaults to lab/reference/accepted/series-digest.windows.json
// Exit code: 0 = identical in every compared Mode, 2 = any difference or wrong model.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const [candFile, goldFile = path.join(root, 'lab/reference/accepted/series-digest.windows.json')] = process.argv.slice(2);
if (!candFile) { console.log('usage: node tools/verify_series.mjs <series-digest.json> [golden.json]'); process.exit(2); }
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const cand = read(candFile), gold = read(goldFile);

let problems = 0;
const say = (ok, msg) => { if (!ok) problems++; console.log(`[${ok ? 'PASS' : 'FAIL'}] ${msg}`); };
say(cand.model?.sha256 === gold.model?.sha256, `model SHA-256 ${String(cand.model?.sha256).slice(0, 12)}… vs golden ${String(gold.model?.sha256).slice(0, 12)}…`);
say(cand.engine?.version === gold.engine?.version, `engine simulation ${cand.engine?.version} vs golden ${gold.engine?.version}`);
if (gold.platform) console.log(`       golden produced on: ${gold.platform.os} · Node ${gold.platform.node} · ${gold.platform.cpu}`);

const modes = Object.keys(gold.modes).filter(m => m in cand.modes);
const missing = Object.keys(gold.modes).filter(m => !(m in cand.modes));
if (missing.length) console.log(`       not in candidate (not compared): Modes ${missing.join(', ')}`);
const differing = [];
for (const m of modes) {
  const g = gold.modes[m], c = cand.modes[m];
  if (g.mode_sha256 === c.mode_sha256) continue;
  const time = g.time_sha256 !== c.time_sha256 ? ' (time axis differs too)' : '';
  if (!g.series) { differing.push(`Mode ${m}: differs${time}`); continue; }   // compact golden: per-Mode hashes only
  const names = Object.keys(g.series).filter(n => g.series[n] !== c.series?.[n]);
  differing.push(`Mode ${m}: ${names.length} of ${Object.keys(g.series).length} series differ${time}${names.length ? ' — e.g. ' + names.slice(0, 3).join(', ') : ''}`);
}
if (differing.length && !gold.modes[modes[0]]?.series) console.log('       (the golden keeps per-Mode hashes only; to find the differing series, run `series` on both machines and pass the two full digests, or use .github/workflows/cross-os.yml)');
say(differing.length === 0, `${modes.length} Modes compared, ${modes.length - differing.length} bit-identical`);
for (const d of differing) console.log(`       ${d}`);
console.log(`\nSERIES CHECK: ${problems ? 'FAIL — this machine does not reproduce the canonical-platform numbers exactly' : 'PASS — bit-identical to the canonical-platform golden'}`);
process.exit(problems ? 2 : 0);
