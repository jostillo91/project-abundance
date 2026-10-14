const assert=require('node:assert/strict');
const {test}=require('node:test');
const engine=require('./engine');
const optimizer=require('./optimizer');
test('optimizer exports optimize',()=>assert.equal(typeof optimizer.optimize,'function'));
test('engine remains deterministic',()=>assert.deepEqual(engine.simulate(engine.DEFAULT),engine.simulate(engine.DEFAULT)));
