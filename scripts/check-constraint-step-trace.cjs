'use strict';
const assert=require('node:assert/strict'),engine=require('../labs/constraint-engine.js'),trace=require('../knowledge/constraint-step-trace.js');
const C=(axis,value)=>({type:'coordinate',axis,value});
const result=trace.analyzeSteps([
 {id:'known',constraints:[C('x',10)]},
 {id:'auxiliary',constraints:[]},
 {id:'redundant',constraints:[C('x',10)]},
 {id:'locate',constraints:[C('y',20),C('z',30)]}
],engine);
assert.deepEqual(result.history.map(x=>x.after),[2,2,2,0]);
assert.deepEqual(result.history.map(x=>x.status),['independent','unchanged','redundant','independent']);
assert.equal(result.final.degrees,0);
const conflict=trace.analyzeSteps([{id:'a',constraints:[C('x',1)]},{id:'b',constraints:[C('x',2)]}],engine);
assert.equal(conflict.history[1].status,'contradiction');assert.equal(conflict.history[1].after,null);
assert.throws(()=>trace.analyzeSteps([{id:'bad'}],engine));
console.log('PASS: step-level constraint trace distinguishes unchanged, redundant, independent, and contradictory conditions');
