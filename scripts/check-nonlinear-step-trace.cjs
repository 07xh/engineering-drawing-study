'use strict';
const assert=require('node:assert/strict'),T=require('../knowledge/nonlinear-step-trace.js');
const points={A:{x:0,y:0},B:{x:3,y:4}};
const r=T.analyze({points,constraints:[
 {type:'fixed',point:'A',axis:'x',value:0},
 {type:'fixed',point:'A',axis:'x',value:0},
 {type:'fixed',point:'A',axis:'y',value:0},
 {type:'distance',a:'A',b:'B',value:5},
 {type:'distance',a:'A',b:'B',value:6}
]});
assert.equal(r.initialDegrees,4);assert.equal(r.finalDegrees,1);
assert.deepEqual(r.steps.map(s=>s.removedLocalDegrees),[1,0,1,1,0]);
assert.deepEqual(r.steps.map(s=>s.classification),['locally-independent','locally-redundant','locally-independent','locally-independent','locally-redundant']);
assert.equal(r.steps[4].status,'violated-at-configuration');assert.equal(r.atProvidedConfiguration,false);
assert.match(r.warning,/一阶雅可比/);
console.log('PASS: step-by-step local degrees, duplicate constraints, violated configuration');
