// Loop-rich stress model: in a model with energy_consumer nodes (v7.7.9 skeleton or later), every
// "X K Requested Energy" reads the same-step "X K Pre Energy Rate" instead of its smoothed signal,
// which closes loops through the energy allocator in half of all switch combinations.
// Usage: node make_stress_model.mjs <model.json> <out.json>
import fs from 'node:fs';
const [inFile, outFile] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(inFile, 'utf8'));
let n = 0;
for (const e of m.elements) {
  const hit = e.type !== 'LINK' && /^([AB]) (.+) Requested Energy$/.exec(e.name || '');
  if (!hit) continue;
  const sig = `[${hit[1]} ${hit[2]} Energy Signal]`;
  if (!String(e.behavior?.value).includes(sig)) continue;
  e.behavior.value = e.behavior.value.replace(sig, `[${hit[1]} ${hit[2]} Pre Energy Rate]`);
  n++;
}
fs.writeFileSync(outFile, JSON.stringify(m));
console.log(`rewired ${n} requests`);
