#!/usr/bin/env node
// Rebuilds (or, with --check, verifies) the two integrity manifests of the repository:
//
//   SHA256SUMS.txt       every versioned file except itself, as "<sha256>  ./<path>"
//   lab/SHA256SUMS.txt   every versioned file under lab/ except itself, as "<sha256>  <path-inside-lab>"
//
// "Versioned" = what git tracks or would add (tracked + untracked-but-not-ignored), minus files
// deleted from the working tree. Entries are sorted by raw bytes, one per line, LF, trailing LF.
// lab/SHA256SUMS.txt is written first because the root manifest covers it.
//
// Usage (from anywhere inside the repo):
//   node tools/build_sums.mjs            rebuild both files
//   node tools/build_sums.mjs --check    verify only; exit 2 on any mismatch, missing or extra entry
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const check = process.argv.includes('--check');

const listed = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root })
  .toString('utf8').split('\0').filter(Boolean);
const files = [...new Set(listed)].filter(f => fs.existsSync(path.join(root, f)));
const byBytes = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');

const manifests = [
  { file: 'lab/SHA256SUMS.txt', entries: () => files.filter(f => f.startsWith('lab/') && f !== 'lab/SHA256SUMS.txt').map(f => [f, f.slice(4)]) },
  { file: 'SHA256SUMS.txt', entries: () => files.filter(f => f !== 'SHA256SUMS.txt').map(f => [f, './' + f]) },
];

let problems = 0;
for (const m of manifests) {
  const entries = m.entries().sort((a, b) => byBytes(a[1], b[1]));
  const text = entries.map(([f, shown]) => `${sha(f)}  ${shown}\n`).join('');
  const target = path.join(root, m.file);
  if (!check) {
    fs.writeFileSync(target, text);
    console.log(`${m.file}: ${entries.length} entries written`);
    continue;
  }
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (current === text) { console.log(`${m.file}: OK (${entries.length} entries)`); continue; }
  const want = new Map(text.split('\n').filter(Boolean).map(l => [l.slice(66), l.slice(0, 64)]));
  const have = new Map(current.split('\n').filter(Boolean).map(l => [l.replace(/\r$/, '').slice(66), l.slice(0, 64)]));
  for (const [p, h] of want) {
    if (!have.has(p)) { console.log(`${m.file}: MISSING ${p}`); problems++; }
    else if (have.get(p) !== h) { console.log(`${m.file}: HASH MISMATCH ${p}`); problems++; }
  }
  for (const p of have.keys()) if (!want.has(p)) { console.log(`${m.file}: EXTRA ${p} (not a versioned file)`); problems++; }
  if (!problems) { console.log(`${m.file}: FORMAT differs (order, line endings or trailing newline)`); problems++; }
}
if (check) {
  console.log(problems ? `SUMS CHECK: FAIL (${problems})` : 'SUMS CHECK: PASS');
  process.exit(problems ? 2 : 0);
}
