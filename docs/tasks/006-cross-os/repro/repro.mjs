#!/usr/bin/env node

function fromHex(h) {
  return Buffer.from(h, 'hex').readDoubleBE(0);
}
function bits(x) {
  const b=Buffer.alloc(8);
  b.writeDoubleBE(x,0);
  return b.toString('hex');
}

const cases=[
  ['step88-inner','3ff0a00e7d9dd843'],
  ['step89-inner','3ff0a0a5a6c27bb6'],
  ['step90-inner','3ff0a138d9c75ee1']
];

for(const [name,h] of cases){
  const x=fromHex(h);
  console.log(JSON.stringify({
    name,
    input:h,
    exponent:'0.125',
    output:bits(Math.pow(x,0.125))
  }));
}
