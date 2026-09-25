#!/usr/bin/env bash
# Self-test of tools/check_branch.mjs and tools/build_sums.mjs.
# Builds a throw-away sandbox (a bare "origin" cloned from this repo plus a working clone) in a
# temp directory, publishes synthetic tasks 900/901 to its main, and replays typical deliveries —
# one honest, the rest each breaking one rule. Every scenario asserts the verdict AND the reason,
# so a guard that fails for the wrong cause does not pass. Never touches this repo or its origin.
#
# Usage (Git Bash on Windows, or any bash):  bash tools/selftest.sh
set -u
REPO="$(git rev-parse --show-toplevel)"
SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT
PASSED=0; FAILED=0

git clone -q --bare "$REPO" "$SANDBOX/origin.git"
git --git-dir="$SANDBOX/origin.git" symbolic-ref HEAD refs/heads/main
for b in $(git --git-dir="$SANDBOX/origin.git" for-each-ref --format='%(refname:short)' refs/heads/); do
  [ "$b" = main ] || git --git-dir="$SANDBOX/origin.git" branch -q -D "$b"
done
git clone -q "$SANDBOX/origin.git" "$SANDBOX/work"
cd "$SANDBOX/work" || exit 2
git checkout -q main
git config user.name selftest; git config user.email selftest@local
# The tools under test are taken from the working tree, so an uncommitted fix is what gets tested.
mkdir -p tools && cp "$REPO"/tools/*.mjs tools/
mkdir -p docs/tasks/900-test docs/tasks/901-test
cat > docs/tasks/900-test/scope.json <<'EOF'
{
  "task": "900",
  "title": "selftest sandbox",
  "branch": "task/900-test",
  "allow": ["lab/INSTALL.cmd", "lab/CHANGELOG.md", "lab/package.json", "lab/notes/README.md"],
  "allow_binary": ["lab/fixtures/*.bin"],
  "required_changes": ["lab/INSTALL.cmd"]
}
EOF
cat > docs/tasks/901-test/scope.json <<'EOF'
{
  "task": "901",
  "title": "selftest sandbox, integrity manifests rebuilt by the reviewer",
  "branch": "task/901-test",
  "allow": ["lab/INSTALL.cmd"],
  "sums_by": "reviewer"
}
EOF
node tools/build_sums.mjs >/dev/null
git add -A && git commit -qm "publish tasks 900, 901" && git push -q origin main
# Every sandbox commit from here on is attributed like an agent's, unless NO_AGENT=1.
cat > .git/hooks/commit-msg <<'EOF'
#!/bin/sh
[ -n "$NO_AGENT" ] || printf '\nAgent: selftest\n' >> "$1"
EOF
chmod +x .git/hooks/commit-msg

CHECK="node tools/check_branch.mjs --scope=docs/tasks/900-test/scope.json"
fresh() { git checkout -q main; git branch -q -D task/900-test side 2>/dev/null; git push -q origin --delete task/900-test 2>/dev/null; git checkout -q -b task/900-test; }
deliver() { printf 'rem change\n' >> lab/INSTALL.cmd; printf '# report\n' > docs/tasks/900-test/REPORT_RU.md; node tools/build_sums.mjs >/dev/null; git add -A; git commit -qm "${1:-delivery}"; }
publish() { git push -q -f origin task/900-test; }
ok()  { PASSED=$((PASSED+1)); echo "[PASS] $1"; }
bad() { FAILED=$((FAILED+1)); echo "[FAIL] $1"; [ -n "${2:-}" ] && printf '%s\n' "$2" | grep -E '^\[(FAIL|WARN)\]|^BRANCH' | sed 's/^/         /'; }
# expect <name> <PASS|FAIL> [regex that must appear in a [FAIL] line]
expect() {
  local out verdict; out="$($CHECK 2>&1)"; verdict="$(printf '%s\n' "$out" | sed -n 's/^BRANCH CHECK: \([A-Z]*\).*/\1/p')"
  if [ "$verdict" = "$2" ] && { [ -z "${3:-}" ] || printf '%s\n' "$out" | grep '^\[FAIL\]' | grep -Eq "$3"; }; then ok "$1"
  else bad "$1 — expected $2${3:+ /$3/}, got ${verdict:-nothing}" "$out"; fi
}

fresh; deliver; publish
expect "honest delivery passes" PASS

fresh; deliver; printf ' ' >> model/orbital_economy_v7_6_r2_modeljson.json; node tools/build_sums.mjs >/dev/null; git add -A; git commit -qm model; publish
expect "touching the accepted model fails" FAIL 'model/.*protected path'

fresh; mkdir -p lab/vendor; printf 'repacked\0' > lab/vendor/simulation-9.0.0.tgz; deliver vendor; publish
expect "touching vendored dependencies fails" FAIL 'lab/vendor/simulation-9.0.0.tgz: protected path'

fresh; node -e "const f='docs/tasks/900-test/scope.json',fs=require('fs'),s=JSON.parse(fs.readFileSync(f));s.allow.push('docs/**');fs.writeFileSync(f,JSON.stringify(s,null,2)+'\n')"
printf 'x\n' >> docs/HISTORY_RU.md; deliver widen; publish
expect "widening the scope inside the branch does not help" FAIL 'docs/HISTORY_RU.md: outside the task scope'

fresh; node -e "const f='lab/package.json',fs=require('fs');fs.writeFileSync(f,fs.readFileSync(f).toString('latin1').replace(/\r\n/g,'\n'),'latin1')"; deliver eol; publish
expect "CRLF file rewritten as LF fails" FAIL 'lab/package.json: line endings changed'

fresh; mkdir -p lab/notes; printf 'line\r\n' > lab/notes/README.md; deliver crlfnew; publish
expect "new file with CRLF fails" FAIL 'lab/notes/README.md: new file with CRLF'

fresh; printf 'rem x\n' >> lab/INSTALL.cmd; printf '# r\n' > docs/tasks/900-test/REPORT_RU.md; git add -A; git commit -qm nosums; publish
expect "stale integrity manifests fail" FAIL 'SHA256SUMS.txt: .*hash mismatch lab/INSTALL.cmd'

fresh; printf 'rem x\n' >> lab/INSTALL.cmd; node tools/build_sums.mjs >/dev/null; git add -A; git commit -qm noreport; publish
expect "missing agent report fails" FAIL 'REPORT_RU.md missing'

fresh; printf '# r\n' > docs/tasks/900-test/REPORT_RU.md; printf 'x\n' >> lab/CHANGELOG.md; node tools/build_sums.mjs >/dev/null; git add -A; git commit -qm norequired; publish
expect "missing required change fails" FAIL 'required change missing: lab/INSTALL.cmd'

fresh; printf 'rem x\n' >> lab/INSTALL.cmd; printf '# r\n' > docs/tasks/900-test/REPORT_RU.md; node tools/build_sums.mjs >/dev/null; git add -A; NO_AGENT=1 git commit -qm unattributed; publish
expect "commit without an Agent: line fails" FAIL 'without an "Agent: <name>" line'

fresh; mkdir -p lab/fixtures; printf 'a\0b' > lab/fixtures/blob.dat; deliver binary; publish
expect "binary outside allow_binary fails" FAIL 'lab/fixtures/blob.dat: binary'

fresh; mkdir -p lab/fixtures; printf 'a\0b' > lab/fixtures/data.bin; deliver bin; publish
expect "binary inside allow_binary passes" PASS

fresh; printf 'rem cache C:\\Users\\someone\\AppData\\npm\n' >> lab/INSTALL.cmd; deliver leak; publish
expect "absolute local path in an added line fails" FAIL 'absolute local path'

fresh; printf 'set NPM_TOKEN=npm_%s\n' "$(printf 'a%.0s' $(seq 1 36))" >> lab/INSTALL.cmd; deliver secret; publish
expect "credential-like string fails" FAIL 'credential-like string'

fresh; git checkout -q -b side main; printf 'x\n' >> lab/CHANGELOG.md; git commit -qam side; git checkout -q task/900-test
deliver; git merge -q --no-edit --no-ff side; node tools/build_sums.mjs >/dev/null; git add -A; git commit -qm resums; publish
expect "merge commit on the branch fails" FAIL 'merge commits on the branch'

fresh; deliver; publish; git checkout -q main; printf 'y\n' >> docs/HISTORY_RU.md; node tools/build_sums.mjs >/dev/null; git commit -qam "main moves on"; git push -q origin main; git checkout -q task/900-test
out="$($CHECK 2>&1)"
if printf '%s\n' "$out" | grep -q 'not from current main' && ! printf '%s\n' "$out" | grep -q 'HISTORY_RU.md'; then ok "stale base is one FAIL and main's own changes are not blamed on the branch"
else bad "stale base diagnosis" "$out"; fi
git rebase -q main >/dev/null 2>&1 || { node tools/build_sums.mjs >/dev/null; git add -A; GIT_EDITOR=true git rebase --continue >/dev/null 2>&1; }
node tools/build_sums.mjs >/dev/null; git diff --quiet || { git add -A; git commit -qm resums; }; publish
expect "after rebase onto main the delivery passes" PASS

fresh; deliver; publish; git push -q -f origin main~1:refs/tags/v7.6-r2
expect "tag moved on origin fails" FAIL 'tag refs/tags/v7.6-r2'
git push -q -f origin v7.6-r2:refs/tags/v7.6-r2

fresh; deliver; publish; git push -q -f origin main~1:main
expect "main moved on origin fails" FAIL 'origin/main is'
git push -q -f origin main:main

git checkout -q main; git branch -q -D task/901-test 2>/dev/null; git checkout -q -b task/901-test
printf 'rem x\n' >> lab/INSTALL.cmd; printf '# r\n' > docs/tasks/901-test/REPORT_RU.md; git add -A; git commit -qm "api agent, no sums"; git push -q -f origin task/901-test
out="$(node tools/check_branch.mjs --scope=docs/tasks/901-test/scope.json 2>&1)"
if printf '%s\n' "$out" | grep -q '^BRANCH CHECK: PASS' && printf '%s\n' "$out" | grep -q '^\[WARN\] SHA256SUMS.txt: .*sums_by=reviewer'; then ok "sums_by=reviewer: stale manifests are a WARN, the delivery passes"
else bad "sums_by=reviewer" "$out"; fi

git checkout -q main
out="$(node tools/build_sums.mjs --check 2>&1)"; if printf '%s\n' "$out" | grep -q 'SUMS CHECK: PASS'; then ok "build_sums --check passes on a clean tree"; else bad "build_sums --check on a clean tree" "$out"; fi
printf 'x' >> README.md
out="$(node tools/build_sums.mjs --check 2>&1)"; if printf '%s\n' "$out" | grep -q 'HASH MISMATCH ./README.md'; then ok "build_sums --check reports a changed file"; else bad "build_sums --check missed a changed file" "$out"; fi
git checkout -q -- README.md

echo
echo "TOOLS SELF-TEST RESULT: $([ $FAILED -eq 0 ] && echo PASS || echo FAIL) ($PASSED passed, $FAILED failed)"
[ $FAILED -eq 0 ]
