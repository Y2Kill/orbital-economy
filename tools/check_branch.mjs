#!/usr/bin/env node
// Repository-level acceptance guard for a task branch delivered by an external agent.
// It checks what the bench cannot: that the delivery stays inside the task's scope, keeps the
// artefacts' bytes (line endings) intact, rebuilds the integrity manifests honestly, and that
// nothing outside the branch — main, tags — was moved. The bench (self-tests, RUN_LAB,
// CHECK_CANDIDATE) is run separately; this guard comes first.
//
// The task scope is read from the BASE revision (main), never from the branch under review,
// so a delivery cannot widen its own permissions.
//
// Usage (from anywhere inside the repo):
//   node tools/check_branch.mjs --scope=docs/tasks/<id>/scope.json            we, at acceptance
//   node tools/check_branch.mjs --scope=... --head=HEAD --base=origin/main --no-remote
//                                                                              the agent, before pushing
// Options: --head=<rev> (default: origin/<scope.branch>, fetched), --base=<rev> (default: main),
//          --no-fetch, --no-remote (skip the origin main/tags guard).
// Exit code: 0 = PASS, 2 = FAIL.
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (a, opts = {}) => execFileSync('git', a, { cwd: root, maxBuffer: 256 << 20, ...opts });
const gitText = a => git(a, { encoding: 'utf8' }).trim();
const tryGit = a => { try { return gitText(a); } catch { return null; } };

let fails = 0, warns = 0;
const pass = m => console.log(`[PASS] ${m}`);
const fail = m => { fails++; console.log(`[FAIL] ${m}`); };
const warn = m => { warns++; console.log(`[WARN] ${m}`); };
const info = m => console.log(`       ${m}`);

if (!args.scope) { console.log('usage: node tools/check_branch.mjs --scope=docs/tasks/<id>/scope.json [--head=] [--base=] [--no-fetch] [--no-remote]'); process.exit(2); }
const base = args.base || 'main';
const baseSha = tryGit(['rev-parse', '--verify', `${base}^{commit}`]);
if (!baseSha) { console.log(`base ${base} not found`); process.exit(2); }

// ---- scope (from base) --------------------------------------------------------------------
const scopePath = String(args.scope).replace(/\\/g, '/');
const scopeText = tryGit(['show', `${baseSha}:${scopePath}`]);
if (scopeText == null) { console.log(`scope ${scopePath} does not exist in ${base} — a task is published to main before work starts`); process.exit(2); }
const scope = JSON.parse(scopeText);
const taskDir = scopePath.replace(/\/[^/]+$/, '');
// Glob: "**/" = any number of directories, "**" = anything, "*" = within one path segment, "?" = one char.
function globRe(g) {
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') { i++; if (g[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*'; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}
const matchAny = (f, globs = []) => globs.some(g => globRe(g).test(f));

// Paths no task may touch unless its scope lists them under allow_protected.
const PROTECTED = ['model/**', 'validation/**', 'policy/**', 'reference/**', 'lab/input/**', 'lab/reference/**',
  'BASELINE_MANIFEST.json', '.gitattributes', '.gitignore', 'tools/**', 'docs/tasks/**', 'lab/vendor/**', '.github/**',
  'docs/CONTRACTOR_DELIVERY_CONTRACT_RU.md', 'docs/VERSIONING_AND_AUTHORITY.md'];
// Paths every task may (and usually must) touch.
const ALWAYS = ['SHA256SUMS.txt', 'lab/SHA256SUMS.txt', `${taskDir}/REPORT_RU.md`];

console.log(`Orbital Economy — branch check, task ${scope.task} (${scope.title || ''})`);

// ---- 1. origin: main and tags must be exactly where we left them ---------------------------
if (!args['no-remote']) {
  const remote = new Map(gitText(['ls-remote', 'origin']).split('\n').filter(Boolean).map(l => l.split('\t').reverse()));
  const localMain = gitText(['rev-parse', 'main']);
  remote.get('refs/heads/main') === localMain
    ? pass(`origin/main = local main (${localMain.slice(0, 7)})`)
    : fail(`origin/main is ${String(remote.get('refs/heads/main')).slice(0, 7)}, local main is ${localMain.slice(0, 7)} — main was moved by someone other than us`);
  const localTags = new Map((tryGit(['show-ref', '--tags', '-d']) || '').split('\n').filter(Boolean).map(l => l.split(' ').reverse()));
  const remoteTags = [...remote].filter(([r]) => r.startsWith('refs/tags/'));
  let tagProblems = 0;
  for (const [r, s] of remoteTags) if (localTags.get(r) !== s) { tagProblems++; fail(`tag ${r} on origin (${s.slice(0, 7)}) differs from local (${String(localTags.get(r)).slice(0, 7)}) or is new`); }
  for (const [r] of localTags) if (!remote.has(r)) { tagProblems++; fail(`tag ${r} is missing on origin`); }
  if (!tagProblems) pass(`tags on origin identical to local (${localTags.size} refs)`);
  const heads = [...remote.keys()].filter(r => r.startsWith('refs/heads/') && r !== 'refs/heads/main');
  const stray = heads.filter(r => !/^refs\/heads\/task\/\d{3}-[a-z0-9-]+$/.test(r));
  if (stray.length) warn(`branches on origin outside task/NNN-name: ${stray.join(', ')}`);
}

// ---- 2. head: fetched, linear, based on current base --------------------------------------
let head = args.head;
if (!head) {
  if (!scope.branch) { console.log('scope has no "branch"; pass --head'); process.exit(2); }
  if (!args['no-fetch']) git(['fetch', '--quiet', '--no-tags', 'origin', `+refs/heads/${scope.branch}:refs/remotes/origin/${scope.branch}`]);
  head = `origin/${scope.branch}`;
}
const headSha = tryGit(['rev-parse', '--verify', `${head}^{commit}`]);
if (!headSha) { fail(`head ${head} not found`); process.exit(2); }
info(`base ${base} ${baseSha.slice(0, 7)}  head ${head} ${headSha.slice(0, 7)}`);
// Everything below is measured from the fork point, so a stale branch is not blamed for what
// landed on base after it forked; the stale base itself is one FAIL.
const forkSha = gitText(['merge-base', baseSha, headSha]);
if (forkSha !== baseSha) fail(`${head} forked from ${forkSha.slice(0, 7)}, not from current ${base} ${baseSha.slice(0, 7)} — rebase onto ${base} (no merge commits)`);
else pass(`${head} is a fast-forward of ${base}`);

const commits = gitText(['log', '--format=%H%x09%P%x09%an <%ae>%x09%s', `${forkSha}..${headSha}`]).split('\n').filter(Boolean).map(l => l.split('\t'));
if (!commits.length) fail('no commits on the branch');
const merges = commits.filter(c => c[1].includes(' '));
merges.length ? fail(`merge commits on the branch: ${merges.map(c => c[0].slice(0, 7)).join(', ')} — history must be linear`) : pass(`${commits.length} commit(s), linear`);
for (const c of commits.reverse()) info(`${c[0].slice(0, 7)} ${c[2]} — ${c[3]}`);
// Attribution lives in the message, not in the author field: an agent pushing through an API
// connector cannot choose the author, but it can always write the trailer.
const bodies = git(['log', '--format=%H%x00%B%x1e', `${forkSha}..${headSha}`]).toString('utf8').split('\x1e').map(s => s.trim()).filter(Boolean).map(s => s.split('\0'));
const unattributed = bodies.filter(([, body]) => !/^Agent:[ \t]*\S/m.test(body || ''));
const agents = [...new Set(bodies.flatMap(([, body]) => [...(body || '').matchAll(/^Agent:[ \t]*(.+)$/gm)].map(m => m[1].trim())))];
unattributed.length ? fail(`commit(s) without an "Agent: <name>" line: ${unattributed.map(([h]) => h.slice(0, 7)).join(', ')}`)
  : commits.length && pass(`every commit is attributed (Agent: ${agents.join(', ')})`);

// ---- 3. scope ------------------------------------------------------------------------------
const changes = gitText(['diff', '--name-status', '--no-renames', forkSha, headSha]).split('\n').filter(Boolean).map(l => { const [s, ...p] = l.split('\t'); return { status: s, file: p.join('\t') }; });
info(`${changes.length} path(s) changed: ${['A', 'M', 'D'].map(s => `${s}=${changes.filter(c => c.status === s).length}`).join(' ')}`);
let scopeProblems = 0;
for (const { status, file } of changes) {
  if (matchAny(file, ALWAYS)) continue;
  if (matchAny(file, PROTECTED) && !matchAny(file, scope.allow_protected)) { scopeProblems++; fail(`${status} ${file}: protected path, not in allow_protected`); continue; }
  if (!matchAny(file, [...(scope.allow || []), ...(scope.allow_protected || []), ...(scope.allow_binary || [])])) { scopeProblems++; fail(`${status} ${file}: outside the task scope`); }
}
if (!scopeProblems) pass('every changed path is inside the task scope');
const report = `${taskDir}/REPORT_RU.md`;
changes.some(c => c.file === report && c.status !== 'D') ? pass(`${report} delivered`) : fail(`${report} missing — the agent's report is part of the delivery`);
for (const r of scope.required_changes || []) changes.some(c => matchAny(c.file, [r])) ? pass(`required change present: ${r}`) : fail(`required change missing: ${r}`);

// ---- 4. bytes: line endings, binaries, size, leaks ----------------------------------------
const blob = (rev, f) => git(['cat-file', 'blob', `${rev}:${f}`]);
const eol = b => ({ crlf: b.includes(Buffer.from('\r\n')), finalNl: b.length === 0 || b[b.length - 1] === 0x0a });
const LEAK = [
  [/\b[A-Za-z]:[\\/]{1,2}(?:Users|Documents and Settings|!!!_USER_FOLDERS)\b/i, 'absolute local path'],
  [/AppData[\\/]|\/home\/[a-z_][\w-]*\/|\/Users\/[A-Za-z][\w.-]*\//, 'absolute local path'],
  [/\bghp_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bnpm_[A-Za-z0-9]{30,}|_authToken|\bAKIA[0-9A-Z]{16}\b|\bsk-[A-Za-z0-9-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'credential-like string'],
];
let byteProblems = 0;
for (const { status, file } of changes.filter(c => c.status !== 'D')) {
  const b = blob(headSha, file);
  const isBinary = b.includes(0);
  if (isBinary || b.length > 1_000_000) {
    if (!matchAny(file, scope.allow_binary)) { byteProblems++; fail(`${file}: ${isBinary ? 'binary' : 'larger than 1 MB'} (${b.length} bytes), not in allow_binary`); }
    else info(`${file}: ${isBinary ? 'binary' : 'large'} ${b.length} bytes, sha256 ${crypto.createHash('sha256').update(b).digest('hex')} (allowed)`);
    continue;
  }
  const now = eol(b);
  if (status === 'M') {
    const was = eol(blob(forkSha, file));
    if (was.crlf !== now.crlf || was.finalNl !== now.finalNl) { byteProblems++; fail(`${file}: line endings changed (${was.crlf ? 'CRLF' : 'LF'}${was.finalNl ? '' : ', no final NL'} -> ${now.crlf ? 'CRLF' : 'LF'}${now.finalNl ? '' : ', no final NL'}) — an edit must keep the file's bytes convention`); }
  } else if (now.crlf) { byteProblems++; fail(`${file}: new file with CRLF — new files are LF`); }
  const added = status === 'A' ? b.toString('utf8').split('\n')
    : gitText(['diff', '-U0', '--no-color', forkSha, headSha, '--', file]).split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1));
  for (const line of added) for (const [re, what] of LEAK) if (re.test(line)) { byteProblems++; fail(`${file}: ${what} in added line: ${line.trim().slice(0, 100)}`); }
}
if (!byteProblems) pass('line endings kept, no unexpected binaries or large files, no local paths or credentials in added lines');

// ---- 5. integrity manifests at head --------------------------------------------------------
const tree = git(['ls-tree', '-r', '-z', '--name-only', headSha]).toString('utf8').split('\0').filter(Boolean);
const sha256 = f => crypto.createHash('sha256').update(blob(headSha, f)).digest('hex');
for (const [sums, prefix, strip] of [['lab/SHA256SUMS.txt', 'lab/', 4], ['SHA256SUMS.txt', '', 0]]) {
  const expected = tree.filter(f => f.startsWith(prefix) && f !== sums);
  const lines = blob(headSha, sums).toString('utf8').split('\n').filter(Boolean);
  const listed = new Map(lines.map(l => [l.slice(66).replace(/^\.\//, ''), l.slice(0, 64)]));
  const problems = [];
  for (const f of expected) {
    const key = f.slice(strip);
    if (!listed.has(key)) problems.push(`unlisted ${f}`);
    else if (listed.get(key) !== sha256(f)) problems.push(`hash mismatch ${f}`);
  }
  for (const k of listed.keys()) if (!expected.includes(prefix + k)) problems.push(`listed but not in tree: ${k}`);
  const sumsByReviewer = scope.sums_by === 'reviewer';
  problems.length ? (sumsByReviewer ? warn : fail)(`${sums}: ${problems.length} problem(s) — ${problems.slice(0, 6).join('; ')}${sumsByReviewer ? ' (sums_by=reviewer: rebuilt by us at acceptance)' : ' (rebuild with node tools/build_sums.mjs)'}`)
    : pass(`${sums}: ${expected.length} entries, all match the head tree`);
}

console.log('');
console.log(`BRANCH CHECK: ${fails ? 'FAIL' : 'PASS'} (${fails} fail, ${warns} warn)`);
console.log(fails ? '' : 'Next: the bench on a clean checkout of the head — see the task\'s acceptance section.');
process.exit(fails ? 2 : 0);
