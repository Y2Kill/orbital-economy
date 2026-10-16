// Adds trial Modes for cost pricing (what the model task would do): 56 = Mode 52 + cost pricing,
// 57 = Mode 53 (transport surge with the labor market) + cost pricing; the surge window is keyed by Mode number.
// Wage pricing stays off in both: with cost pricing the wage already enters every price through labor costs.
import fs from 'node:fs';
const [inFile, outFile] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const e = m.elements.find(x => x.name === 'Test 2 Transport Surge Active');
e.behavior.value = `IfThenElse([Timed Test Mode] = 57, [Temporary Test Window], ${e.behavior.value})`;
const sc = n => m.scenarios.find(s => s.values['Timed Test Mode'] === n);
const mk = (from, mode, name, description) => m.scenarios.push({ name, description, values: { ...structuredClone(sc(from).values), 'Timed Test Mode': mode, 'Cost Pricing Enabled': 1 } });
mk(52, 56, 'v7.7.16 Cost Pricing', 'Mode 52 (labor market) with cost pricing: every price is full unit cost x 1.15 x its scarcity factor.');
mk(53, 57, 'v7.7.16 Transport Surge with Cost Pricing', 'Mode 53 (transport surge with the labor market) with cost pricing.');
fs.writeFileSync(outFile, JSON.stringify(m));
