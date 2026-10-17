// Order-independent fingerprint of a ModelJSON's definitions (elements, flow endpoints, behaviours, links).
// Usage: node definition_fingerprint.mjs <model.json>   — prints the first 16 hex digits of SHA-256.
import fs from 'node:fs';
import crypto from 'node:crypto';
const m = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const key = e => e.type === 'LINK' ? `L|${e.from}|${e.to}` : `${e.type}|${e.name}`;
const def = e => JSON.stringify({ t: e.type, f: e.from ?? null, to: e.to ?? null, b: e.behavior });
const text = m.elements.map(e => `${key(e)}=${def(e)}`).sort().join('\n');
console.log(crypto.createHash('sha256').update(text).digest('hex').slice(0, 16));
