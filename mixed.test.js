const {test}=require('node:test');const assert=require('node:assert/strict');const e=require('./engine');const m=require('./mixed');
test('deterministic mixed output',()=>assert.deepEqual(m.simulateMixed(e.DEFAULT,{potatoes:40,wheat:35,beans:25}),m.simulateMixed(e.DEFAULT,{potatoes:40,wheat:35,beans:25})));
test('land is conserved',()=>assert.ok(Math.abs(m.simulateMixed(e.DEFAULT,{potatoes:40,wheat:35,beans:25}).harvest.reduce((a,b)=>a+b.hectares,0)-e.DEFAULT.hectares)<1e-8));
test('zero allocation produces zero nutrition',()=>assert.equal(m.simulateMixed(e.DEFAULT,{potatoes:0,wheat:0,beans:0}).calories,0));
test('zero water produces zero nutrition',()=>assert.equal(m.simulateMixed({...e.DEFAULT,waterCapacityM3Day:0},{potatoes:20,wheat:40,beans:40}).proteinG,0));
test('resource stress never improves output',()=>assert.ok(m.simulateMixed({...e.DEFAULT,waterStressPct:70},{potatoes:30,wheat:30,beans:40}).calories<=m.simulateMixed(e.DEFAULT,{potatoes:30,wheat:30,beans:40}).calories));
test('search checks 66 combinations',()=>assert.equal(m.searchMix(e.DEFAULT).tested,66));
