#!/usr/bin/env node

function fromHex(h) {
  const b = Buffer.from(h, 'hex');
  return b.readDoubleBE(0);
}
function bits(x) {
  const b = Buffer.alloc(8);
  b.writeDoubleBE(x, 0);
  return b.toString('hex');
}

const inputs = [
  ['sample-square', '3fd6e403878ca48b'],
  ['linux-gap-square', '3fd6e403878ca30d'],
  ['windows-gap-square', '3fd6e403878ca3cc']
];

for (const [name, hex] of inputs) {
  const x = fromHex(hex);
  console.log(JSON.stringify({
    name,
    input: hex,
    pow: bits(Math.pow(x, 0.5)),
    exponent: bits(x ** 0.5),
    sqrt: bits(Math.sqrt(x))
  }));
}
