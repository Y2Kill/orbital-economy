#!/usr/bin/env node

function fromHex(h) {
  return Buffer.from(h, 'hex').readDoubleBE(0);
}
function bits(x) {
  const b = Buffer.alloc(8);
  b.writeDoubleBE(Number(x), 0);
  return b.toString('hex');
}
function emit(name, args, value) {
  console.log(JSON.stringify({ name, args, output: bits(value) }));
}

const oreConsumption = fromHex('404751d98bdf17ac');
const oreTarget = fromHex('40a3880000000000');
const oreInventory = fromHex('40a381b08f926fde');
const oreAdjustment = fromHex('4044000000000000');
emit('A Desired Mining Rate', ['404751d98bdf17ac','40a3880000000000','40a381b08f926fde','4044000000000000'],
  oreConsumption + (oreTarget - oreInventory) / oreAdjustment);

const metalRequested = fromHex('408f3b55a4787fbc');
const electronicsRequested = fromHex('4058607b7ab1cc19');
emit('A Total Requested Energy', ['408f3b55a4787fbc','4058607b7ab1cc19'],
  metalRequested + electronicsRequested);

const smelting = fromHex('4040a82dad0d10ed');
const activeCapacity = fromHex('40417cc32c4d0fed');
emit('A Refinery Utilization', ['4040a82dad0d10ed','40417cc32c4d0fed','0.001'],
  smelting / (activeCapacity + 0.001));

const domesticSignal = fromHex('40405ba0b09d1c44');
const domesticDelta = smelting - domesticSignal;
emit('A Domestic Supply Up Gap', ['4040a82dad0d10ed','40405ba0b09d1c44'],
  (domesticDelta + Math.pow(Math.pow(domesticDelta, 2), 0.5)) / 2);

const planningSignal = fromHex('40930935034c7aaa');
const requested = metalRequested + electronicsRequested;
const planningDelta = planningSignal - requested;
emit('A Power Capacity Planning Down Gap', ['40930935034c7aaa', bits(requested)],
  (planningDelta + Math.pow(Math.pow(planningDelta, 2), 0.5)) / 2);

const demandSignal = fromHex('4090b90ff7686781');
const demandAdjustment = fromHex('4008000000000000');
emit('A Energy Demand Signal Increase', [bits(requested),'4090b90ff7686781','4008000000000000'],
  requested > demandSignal ? (requested - demandSignal) / demandAdjustment : 0);

const generationCapacity = fromHex('4095180000000000');
emit('A Desired Generation', [bits(requested),'4095180000000000'],
  requested < generationCapacity ? requested : generationCapacity);
