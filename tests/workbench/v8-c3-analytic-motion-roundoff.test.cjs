'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Motion=require('../../workbench/teaching-motion-v5.js');
test('V5 analytic screen subdivision clamps generated float samples, not source bounds',()=>{
 const g={parameter:{from:0.1,to:0.7},
  u:{kind:'signed-circle-radical',center:0,offset:0,radius:2,sign:1},
  v:{kind:'signed-circle-radical',center:0,offset:0,radius:3,sign:-1},
  paper:{origin:{x:225,y:130},scale:4,signU:1,signV:-1}};
 // Direct arbitrary out-of-bound source inputs must continue failing closed.
 assert.throws(()=>Motion.evaluateAnalyticCurvePoint(g,0.7000000000000001),
  /bounded analytic curve parameter/);
 const output=Motion.analyticCurve(g,1);
 assert.ok(output.finished);
 assert.match(output.d,/^M /);
 assert.ok(Number.isFinite(output.pen.x)&&Number.isFinite(output.pen.y));
 assert.equal(output.renderApproximationOnly,true);
 const clipped={...g,parameter:{from:0.15000000000001,to:0.15000000000003}};
 const sample=Motion.analyticCurve(clipped,0.75);
 assert.ok(Number.isFinite(sample.pen.x));
 assert.equal(Motion.actionShapeAttrs({kind:'analytic-curve',geometry:clipped},1).opacity,1);
});
