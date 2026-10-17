// Adds trial Modes for money (what the model task would do): 58 = Mode 56 (cost pricing) + money,
// 59 = Mode 57 (transport surge with cost pricing) + money; the surge window is keyed by Mode number.
import fs from 'node:fs';
const [inFile, outFile] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const e = m.elements.find(x => x.name === 'Test 2 Transport Surge Active');
e.behavior.value = `IfThenElse([Timed Test Mode] = 59, [Temporary Test Window], ${e.behavior.value})`;
const sc = n => m.scenarios.find(s => s.values['Timed Test Mode'] === n);
const mk = (from, mode, name, description) => m.scenarios.push({ name, description, values: { ...structuredClone(sc(from).values), 'Timed Test Mode': mode, 'Money Enabled': 1 } });
mk(56, 58, 'v7.7.17 Money', 'Mode 56 (cost pricing) with money: household and firm money, every payment, household budgets that scale final demand.');
mk(57, 59, 'v7.7.17 Transport Surge with Money', 'Mode 57 (transport surge with cost pricing) with money.');
fs.writeFileSync(outFile, JSON.stringify(m));
