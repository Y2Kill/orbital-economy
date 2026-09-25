#!/usr/bin/env node
import fs from 'node:fs';

const [uFile,wFile] = process.argv.slice(2);
const u = JSON.parse(fs.readFileSync(uFile,'utf8'));
const w = JSON.parse(fs.readFileSync(wFile,'utf8'));
const n = Math.min(u.calls.length,w.calls.length);
for (let i=0;i<n;i++) {
  const a=u.calls[i], b=w.calls[i];
  if (a[0]!==b[0] || a[1]!==b[1] || a[2]!==b[2]) {
    const sameArgs=a[0]===b[0] && a[1]===b[1];
    console.log(`FIRST POW TRACE DIFFERENCE: call=${i} same_args=${sameArgs} ubuntu_base=${a[0]} windows_base=${b[0]} ubuntu_exp=${a[1]} windows_exp=${b[1]} ubuntu_out=${a[2]} windows_out=${b[2]}`);
    process.exit(0);
  }
}
if (u.calls.length!==w.calls.length) {
  console.log(`POW TRACE LENGTH DIFFERENCE after ${n} identical calls: ubuntu=${u.calls.length} windows=${w.calls.length}`);
  process.exit(0);
}
console.log(`POW TRACE IDENTICAL: ${n} calls`);
