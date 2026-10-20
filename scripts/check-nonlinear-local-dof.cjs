'use strict';
const assert=require('node:assert/strict'),N=require('../knowledge/nonlinear-local-dof.js');
const points={A:{x:0,y:0},B:{x:3,y:4}};
let r=N.analyze({points,constraints:[{type:'distance',a:'A',b:'B',value:5}]});assert.equal(r.localDegrees,3);assert.equal(r.atProvidedConfiguration,'satisfied');
r=N.analyze({points,constraints:[{type:'distance',a:'A',b:'B',value:6}]});assert.equal(r.atProvidedConfiguration,'violated');
r=N.analyze({points,constraints:[{type:'fixed',point:'A',axis:'x',value:0},{type:'fixed',point:'A',axis:'y',value:0},{type:'distance',a:'A',b:'B',value:5}]});assert.equal(r.localDegrees,1);
r=N.analyze({points:{A:{x:0,y:0},B:{x:0,y:0}},constraints:[{type:'distance',a:'A',b:'B',value:0}]});assert.equal(r.rank,0);assert.equal(r.localDegrees,4);assert.match(r.warning,/奇异点/);
assert.throws(()=>N.analyze({points,constraints:[{type:'angle',a:'A',b:'B'}]}));
console.log('PASS: local nonlinear Jacobian DOF, violated configuration and singular zero-distance caution');
