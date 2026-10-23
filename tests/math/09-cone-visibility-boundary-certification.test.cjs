'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneVisibilityBoundaryCertification:run}=require('../../workbench/cone-visibility-boundary-certification.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' V/W styles cover certified open analytic intervals only',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:115,sheetTransform});
  assert.equal(r.status,'verified-open-lateral-interval-styles');
  for(const view of ['V','W']){
   assert.ok(r.intervals[view].length);
   for(const segment of r.intervals[view]){
    assert.equal(segment.lineStyle,segment.visibility==='visible'?'solid':'dashed');
    assert.equal(segment.certifiedOpenInterval,true);
    assert.equal(segment.boundaryVisibility,'undetermined');
   }
  }
  assert.equal(r.fullContourVisibilityVerified,false);
  assert.equal(r.v5LineStyleConnected,false);
 });
}
test('unconfirmed source cannot certify line styles',()=>{
 assert.equal(run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:false,sheetTransform}).status,'not-verified');
});
