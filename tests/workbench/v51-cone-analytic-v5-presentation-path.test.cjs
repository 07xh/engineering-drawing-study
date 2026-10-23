'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneAnalyticV5Presentation:run}=require('../../workbench/cone-analytic-v5-presentation-path.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' retains exact rational trigonometric conic separate from visual SVG',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:91,sheetTransform});
  assert.equal(r.status,'analytic-evidence-with-v5-presentation-path');
  assert.equal(r.exactConicEvidencePreserved,true);
  assert.equal(r.visualPathIsExact,false);
  assert.equal(r.certifiedPixelErrorBound,false);
  assert.ok(r.player.snapshot().totalMs>0);
  for(const view of ['V','H','W']){
   assert.ok(r.views[view].length);
   assert.ok(r.views[view].every(x=>x.svgPath.startsWith('M ')&&
    x.exactMathematicalRepresentation.analyticCurveVerified===undefined&&
    x.presentationApproximationOnly));
  }
 });
}
test('unconfirmed source cannot generate presentation path',()=>{
 const r=run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:false,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.equal(r.views,null);
});
