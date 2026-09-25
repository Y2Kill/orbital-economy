#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const [planFile, linuxDir, windowsDir] = process.argv.slice(2);
if(!planFile||!linuxDir||!windowsDir){ console.error('usage: node compare-targeted.mjs <plan.json> <linux-dir> <windows-dir>'); process.exit(2); }
const plan=JSON.parse(fs.readFileSync(planFile,'utf8'));
const out={};
for(const mode of plan.changed_modes){
  const a=JSON.parse(fs.readFileSync(path.join(linuxDir,`mode-${mode}-targeted.json`),'utf8'));
  const b=JSON.parse(fs.readFileSync(path.join(windowsDir,`mode-${mode}-targeted.json`),'utf8'));
  let best=null;
  for(const name of plan.modes[String(mode)].slice().sort()){
    const av=a.series[name], bv=b.series[name];
    if(!av||!bv) continue;
    const n=Math.min(av.length,bv.length);
    for(let i=0;i<n;i++){
      if(av[i]!==bv[i]){
        const candidate={series:name,index:i,time_hex:a.time_hex[i],linux:av[i],windows:bv[i]};
        if(!best || i<best.index || (i===best.index && name.localeCompare(best.series)<0)) best=candidate;
        break;
      }
    }
  }
  out[String(mode)]=best;
  if(best) console.log(`Mode ${mode}: first difference series="${best.series}", step=${best.index}, time=${best.time_hex}, linux=${best.linux}, windows=${best.windows}`);
  else console.log(`Mode ${mode}: digest differed but targeted values found no differing point`);
}
fs.writeFileSync('cross-os-first-differences.json',JSON.stringify({format:'orbital-economy-cross-os-first-differences-v1',modes:out},null,2));
