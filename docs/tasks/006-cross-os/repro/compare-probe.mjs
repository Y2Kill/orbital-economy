#!/usr/bin/env node
import fs from 'node:fs';
const [aFile,bFile]=process.argv.slice(2);
const a=JSON.parse(fs.readFileSync(aFile,'utf8')), b=JSON.parse(fs.readFileSync(bFile,'utf8'));
let best=null;
const names=[...new Set([...Object.keys(a.series),...Object.keys(b.series)])].sort();
for(const name of names){
  const x=a.series[name]||[], y=b.series[name]||[];
  for(let i=0;i<Math.min(x.length,y.length);i++){
    if(x[i]!==y[i]){
      const c={series:name,index:i,time_hex:a.time_hex[i],ubuntu:x[i],windows:y[i]};
      if(!best||i<best.index||(i===best.index&&name.localeCompare(best.series)<0)) best=c;
      break;
    }
  }
}
if(!best){ console.log('No difference in probe window.'); process.exit(3); }
console.log(`FIRST DIFFERENCE: series="${best.series}" step=${best.index} time=${best.time_hex} ubuntu=${best.ubuntu} windows=${best.windows}`);
fs.writeFileSync('probe-first-difference.json',JSON.stringify(best,null,2));
