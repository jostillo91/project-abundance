const assert = require('node:assert/strict');
const { test } = require('node:test');
const { DEFAULT, simulate, sweep } = require('./engine');
test('deterministic output', () => assert.deepEqual(simulate(DEFAULT), simulate(DEFAULT)));
test('zero land produces no food', () => assert.equal(simulate({...DEFAULT, hectares:0}).peopleFed, 0));
test('zero water produces no harvest', () => assert.equal(simulate({...DEFAULT,waterCapacityM3Day:0}).kgHarvest, 0));
test('additional land cannot reduce food when other inputs unconstrained', () => {
  const base={...DEFAULT,robots:1000,solarKW:10000,waterCapacityM3Day:100000};
  assert.ok(simulate({...base,hectares:200}).kgHarvest >= simulate({...base,hectares:100}).kgHarvest);
});
test('water stress cannot increase harvest', () => assert.ok(simulate({...DEFAULT,waterStressPct:70}).kgHarvest <= simulate(DEFAULT).kgHarvest));
test('sweep returns one result per value', () => assert.equal(sweep(DEFAULT,'robots',[2,4,8]).length,3));
test('unknown crop falls back safely', () => assert.equal(simulate({...DEFAULT,crop:'no'}).input.crop, DEFAULT.crop));
test('outputs are finite for valid inputs', () => {
 const r=simulate(DEFAULT);
 for (const k of ['kgHarvest','coveragePct','waterDemand','energyDemand','capex','annualizedCost']) assert.ok(Number.isFinite(r[k]),k);
});