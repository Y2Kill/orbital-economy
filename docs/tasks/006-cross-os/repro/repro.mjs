#!/usr/bin/env node

function fromHex(hex) {
  return Buffer.from(hex, 'hex').readDoubleBE(0);
}
function toHex(value) {
  const b = Buffer.allocUnsafe(8);
  b.writeDoubleBE(value, 0);
  return b.toString('hex');
}

const baseHex = '401368263c9d9065';
const exponentHex = '3fc0000000000000';
const base = fromHex(baseHex);
const exponent = fromHex(exponentHex);
const result = Math.pow(base, exponent);

console.log(JSON.stringify({
  operation: 'Math.pow(base, exponent)',
  base: { hex: baseHex, value: base },
  exponent: { hex: exponentHex, value: exponent },
  result: { hex: toHex(result), value: result }
}, null, 2));
