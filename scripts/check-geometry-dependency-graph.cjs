'use strict';
const assert=require('node:assert/strict'),G=require('../knowledge/geometry-dependency-graph.js');
const g=G.build([{id:'given',objects:[{id:'A',kind:'given',dependsOn:[]},{id:'B',kind:'given',dependsOn:[]}]},{id:'helper',objects:[{id:'ray',kind:'auxiliary',dependsOn:['A'],reason:'辅助射线'}]},{id:'locate',objects:[{id:'P',kind:'point',dependsOn:['ray','B'],reason:'辅助线交会'}]}]);
assert.deepEqual(g.ancestors('P'),['A','B','ray']);assert.equal(g.byStep('helper').length,1);
assert.throws(()=>G.build([{id:'bad',objects:[{id:'X',kind:'point',dependsOn:['Y']}]}]));
assert.throws(()=>G.build([{id:'bad',objects:[{id:'X',kind:'point',dependsOn:['X']}]}]));
assert.throws(()=>G.build([{id:'bad',objects:[{id:'X',kind:'point',dependsOn:[]},{id:'X',kind:'point',dependsOn:[]}]}]));
console.log('PASS: ordered geometry dependencies, ancestor provenance and invalid reference rejection');
