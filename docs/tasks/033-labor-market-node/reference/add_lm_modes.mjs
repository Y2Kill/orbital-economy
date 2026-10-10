// Adds trial Modes for the labor market (what the model task would do): 52 = Mode 49 + labor market, 53 = Mode 50 + labor market.
import fs from 'node:fs';
const [inFile, outFile] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const e = m.elements.find(x => x.name === 'Test 2 Transport Surge Active');
e.behavior.value = `IfThenElse([Timed Test Mode] = 53, [Temporary Test Window], ${e.behavior.value})`;
const sc = n => m.scenarios.find(s => s.values['Timed Test Mode'] === n);
const mk = (from, mode, name, description) => m.scenarios.push({ name, description, values: { ...structuredClone(sc(from).values), 'Timed Test Mode': mode, 'Labor Market Enabled': 1 } });
mk(49, 52, 'v7.7.13 Labor Market', 'Mode 49 (food) with the labor market: demand per capita, flexible wage, labor limit.');
mk(50, 53, 'v7.7.13 Transport Surge with Labor Market', 'Mode 50 (transport surge with food) with the labor market.');
fs.writeFileSync(outFile, JSON.stringify(m));
