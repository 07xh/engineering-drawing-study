'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {continuousConeLateralVisibility:run}=require('../../workbench/cone-continuous-lateral-visibility.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' analytic intervals cover complete verified angular domain without overlap',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:17,sheetTransform});
  assert.equal(r.status,'analytic-lateral-intervals');
  assert.equal(r.lateralContinuousIntervalsVerified,true);
  assert.equal(r.completeSolidVisibilityVerified,false);
  assert.equal(r.capOcclusionVerified,false);
  const [start,end]=r.spatialIntent.operation.analytic.parameterRadians;
  for(const view of ['V','H','W']){
   const intervals=r.views[view];
   assert.ok(Math.abs(intervals[0].fromRadians-start)<1e-9);
   assert.ok(Math.abs(intervals.at(-1).toRadians-end)<1e-9);
   for(let i=1;i<intervals.length;i++)
    assert.ok(Math.abs(intervals[i-1].toRadians-intervals[i].fromRadians)<1e-9);
  }
 });
}
test('horizontal cone section has exact V/W front-back halves and H visible',()=>{
 const r=run(cone,{point:{x:0,y:0,z:6},normal:{x:0,y:0,z:1},modelUnit:'mm'},
  {sourceConfirmed:true,revision:18,sheetTransform});
 assert.deepEqual(r.views.V.map(s=>s.visibility),['occluded','visible']);
 assert.deepEqual(r.views.W.map(s=>s.visibility),['visible','occluded','visible']);
 assert.deepEqual(r.views.H.map(s=>s.visibility),['visible']);
 assert.equal(r.silhouetteBoundaryVisibility,'undetermined');
});
test('unconfirmed source never creates continuous visibility proof',()=>{
 const r=run(cone,plane(6),{sourceConfirmed:false,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.equal(r.views,null);
});
