'use strict';
const assert=require('node:assert/strict'),V=require('../knowledge/construction-verifier.js');
const steps=[{id:'given',objects:[{id:'line',kind:'line',dependsOn:[]},{id:'circle',kind:'circle',dependsOn:[]}]},{id:'construct',objects:[{id:'P',kind:'point',dependsOn:['line','circle']}]}];
const geometry={line:{type:'line',a:0,b:1,offset:0},circle:{type:'circle',x:0,y:0,r:5}};
let r=V.verify(steps,'P',geometry);assert.equal(r.status,'multiple');assert.equal(r.solutionCount,2);
r=V.verify(steps,'P',geometry,[{type:'x-greater',value:0}]);assert.equal(r.status,'unique');assert.equal(r.solutions[0].x,5);assert.equal(r.originalStatus,'multiple');assert.equal(r.criteriaApplied,true);
r=V.verify(steps,'P',geometry,[{type:'y-greater',value:0}]);assert.equal(r.status,'none');assert.equal(r.degrees,null);
assert.throws(()=>V.verify(steps,'P',geometry,{}));
console.log('PASS: verified construction filters candidates without hiding original multiplicity');
