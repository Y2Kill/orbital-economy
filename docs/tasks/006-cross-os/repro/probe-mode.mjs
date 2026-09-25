#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { discoverWorkspace } from '../../../lab/src/workspace.js';
import { readJson } from '../../../lab/src/util.js';
import { listScenarios, modelJsonForScenario, valuedPrimitives } from '../../../lab/src/model.js';
import { loadModelJSON } from '../../../lab/src/engine.js';

const mode=Number(process.argv[2] ?? 0);
const count=Number(process.argv[3] ?? 64);
const out=process.argv[4] || 'probe.json';
const ws=discoverWorkspace(path.resolve('lab/input'));
const raw=readJson(ws.modelFile);
const sc=listScenarios(raw,'Timed Test Mode').find(s=>s.mode===mode);
if(!sc) throw new Error(`Mode ${mode} not found`);
const model=loadModelJSON(modelJsonForScenario(raw,sc));
const errors=model.check();
if(errors.length) throw new Error(`model.check failed: ${errors.length}`);
const sim=model.simulate();
const hex=v=>{const b=Buffer.alloc(8); b.writeDoubleBE(Number(v),0); return b.toString('hex');};
const times=Array.from(sim.times(),Number).slice(0,count);
const series={};
for(const p of valuedPrimitives(model).filter(p=>p?.name).sort((a,b)=>a.name.localeCompare(b.name))){
  series[p.name]=Array.from(sim.series(p),Number).slice(0,count).map(hex);
}
fs.writeFileSync(out,JSON.stringify({format:'orbital-economy-probe-v1',mode,scenario:sc.name,time_hex:times.map(hex),series}));
console.log(`Mode ${mode}: ${Object.keys(series).length} series, first ${times.length} points -> ${out}`);
