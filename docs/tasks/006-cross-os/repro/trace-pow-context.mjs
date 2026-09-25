#!/usr/bin/env node
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { discoverWorkspace } from '../../../../lab/src/workspace.js';
import { readJson } from '../../../../lab/src/util.js';
import { listScenarios, modelJsonForScenario } from '../../../../lab/src/model.js';
import { loadModelJSON } from '../../../../lab/src/engine.js';

const target = Number(process.argv[2] ?? 1014);
const mode = Number(process.argv[3] ?? 0);
const hex = value => {
  const b = Buffer.allocUnsafe(8);
  b.writeDoubleBE(Number(value),0);
  return b.toString('hex');
};

const primitiveModule = await import(pathToFileURL(path.resolve('lab/node_modules/simulation/src/Primitives.js')).href);
const { SVariable, SFlow } = primitiveModule;
const stack=[];

const origVar=SVariable.prototype.calculateValue;
SVariable.prototype.calculateValue=function tracedVariable(){
  stack.push({kind:'VARIABLE',name:this.dna?.name ?? null});
  try { return origVar.call(this); } finally { stack.pop(); }
};
const origPredict=SFlow.prototype.predict;
SFlow.prototype.predict=function tracedFlow(...args){
  stack.push({kind:'FLOW',name:this.dna?.name ?? null});
  try { return origPredict.apply(this,args); } finally { stack.pop(); }
};

let call=-1;
const origPow=Math.pow;
Math.pow=function tracedPow(base,exponent){
  call++;
  const out=origPow(base,exponent);
  if(call>=target-2 && call<=target+2){
    console.log(JSON.stringify({call,context:stack.at(-1) ?? null,stack:[...stack],base:hex(base),exponent:hex(exponent),output:hex(out)}));
  }
  return out;
};

try {
  const ws=discoverWorkspace(path.resolve('lab/input'));
  const raw=readJson(ws.modelFile);
  const scenario=listScenarios(raw,'Timed Test Mode').find(s=>s.mode===mode);
  if(!scenario) throw new Error(`Mode ${mode} not found`);
  const model=loadModelJSON(modelJsonForScenario(raw,scenario));
  const errors=model.check();
  if(errors.length) throw new Error(`model.check failed: ${errors.length}`);
  model.simulate();
} finally {
  Math.pow=origPow;
  SVariable.prototype.calculateValue=origVar;
  SFlow.prototype.predict=origPredict;
}
console.log(`Math.pow calls: ${call+1}`);
