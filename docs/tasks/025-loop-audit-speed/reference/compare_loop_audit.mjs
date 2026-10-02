// Compares two loop_audit.js modules on the same models: audit JSON and combination details must be
// byte-identical; prints timings.
// Usage: node compare_loop_audit.mjs <reference loop_audit.js> <candidate loop_audit.js> <model.json>...
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [refFile, candFile, ...models] = process.argv.slice(2);
const ref = await import(pathToFileURL(path.resolve(refFile)));
const cand = await import(pathToFileURL(path.resolve(candFile)));
let bad = 0;
for (const f of models) {
  const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
  let t = Date.now(); const a = cand.auditAlgebraicLoops(raw); const tc = Date.now() - t;
  t = Date.now(); const b = ref.auditAlgebraicLoops(raw); const tr = Date.now() - t;
  const audit = JSON.stringify(a) === JSON.stringify(b);
  const details = JSON.stringify(cand.algebraicLoopCombinationDetails(raw)) === JSON.stringify(ref.algebraicLoopCombinationDetails(raw));
  if (!audit || !details) bad++;
  console.log(path.basename(f), `combinations=${b.combinations} with loops=${b.combinationsWithLoops} loops=${b.loops.length}`,
    `reference ${tr} ms, candidate ${tc} ms`, audit ? 'AUDIT IDENTICAL' : 'AUDIT DIFFERS', details ? 'DETAILS IDENTICAL' : 'DETAILS DIFFER');
}
process.exitCode = bad ? 1 : 0;
