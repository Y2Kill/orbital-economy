// Adds trial Modes for wage pricing (what the model task would do): 54 = Mode 52 + wage pricing,
// 55 = Mode 53 (transport surge with the labor market) + wage pricing; the surge window is keyed by Mode number.
import fs from 'node:fs';
const [inFile, outFile] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const e = m.elements.find(x => x.name === 'Test 2 Transport Surge Active');
e.behavior.value = `IfThenElse([Timed Test Mode] = 55, [Temporary Test Window], ${e.behavior.value})`;
const sc = n => m.scenarios.find(s => s.values['Timed Test Mode'] === n);
const mk = (from, mode, name, description) => m.scenarios.push({ name, description, values: { ...structuredClone(sc(from).values), 'Timed Test Mode': mode, 'Wage Pricing Enabled': 1 } });
mk(52, 54, 'v7.7.15 Wage Pricing', 'Mode 52 (labor market) with wage pricing: ore, energy and food prices follow the wage; demand responds to price.');
mk(53, 55, 'v7.7.15 Transport Surge with Wage Pricing', 'Mode 53 (transport surge with the labor market) with wage pricing.');
fs.writeFileSync(outFile, JSON.stringify(m));
