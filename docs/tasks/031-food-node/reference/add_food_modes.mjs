// Adds the v7.7.12 food Modes and the Mode 50 surge wiring to a model with the food node (what task 032 will do).
import fs from 'node:fs';
const [inFile, outFile] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const e = m.elements.find(x => x.name === 'Test 2 Transport Surge Active');
e.behavior.value = `IfThenElse([Timed Test Mode] = 50, [Temporary Test Window], ${e.behavior.value})`;
const sc = n => m.scenarios.find(s => s.values['Timed Test Mode'] === n);
const mk = (from, mode, name, description, extra) => m.scenarios.push({ name, description, values: { ...structuredClone(sc(from).values), 'Timed Test Mode': mode, 'Food Enabled': 1, ...extra } });
mk(46, 49, 'v7.7.12 Food Baseline', 'Mode 46 with food and farms: fertile B (land A 22, B 60), food traded by need on the shared transport.', {});
mk(47, 50, 'v7.7.12 Transport Surge with Food', 'Mode 47 (transport-demand surge) with food and farms.', {});
mk(46, 51, 'v7.7.12 Food Equal Land Probe', 'Mode 49 with equal land (A 40, B 40); probe, not a start-state change.', { 'A Farm Land Capacity': 40, 'B Farm Land Capacity': 40 });
fs.writeFileSync(outFile, JSON.stringify(m));
