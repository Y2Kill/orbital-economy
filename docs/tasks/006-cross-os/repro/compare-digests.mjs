#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [linuxFile, windowsFile, outFile] = process.argv.slice(2);
if (!linuxFile || !windowsFile || !outFile) {
  console.error('usage: node compare-digests.mjs <linux.json> <windows.json> <plan.json>');
  process.exit(2);
}
const a=JSON.parse(fs.readFileSync(linuxFile,'utf8'));
const b=JSON.parse(fs.readFileSync(windowsFile,'utf8'));
if (a.model.sha256 !== b.model.sha256) throw new Error('Model SHA mismatch');
const modes={};
const all=[...new Set([...Object.keys(a.modes),...Object.keys(b.modes)])].map(Number).sort((x,y)=>x-y);
const identical=[], changed=[];
for(const mode of all){
  const x=a.modes[String(mode)], y=b.modes[String(mode)];
  if(!x || !y){ changed.push(mode); modes[String(mode)]=[]; continue; }
  if(x.mode_sha256===y.mode_sha256){ identical.push(mode); continue; }
  changed.push(mode);
  const names=[...new Set([...Object.keys(x.series),...Object.keys(y.series)])].sort();
  modes[String(mode)]=names.filter(n=>x.series[n]!==y.series[n]);
}
const plan={format:'orbital-economy-cross-os-plan-v1',model_sha256:a.model.sha256,identical_modes:identical,changed_modes:changed,modes};
fs.mkdirSync(path.dirname(outFile),{recursive:true});
fs.writeFileSync(outFile,JSON.stringify(plan,null,2));
console.log('Identical Modes:', identical.join(', ') || '<none>');
console.log('Changed Modes:  ', changed.join(', ') || '<none>');
for(const mode of changed) console.log(`Mode ${mode}: ${modes[String(mode)].length} changed series`);
