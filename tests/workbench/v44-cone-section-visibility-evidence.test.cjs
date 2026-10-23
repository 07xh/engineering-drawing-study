'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSectionVisibilityEvidence:run}=require('../../workbench/cone-section-visibility-evidence.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' emits bounded three-view ray evidence without visibility certification',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:14,sheetTransform});
  assert.equal(r.status,'lateral-sample-evidence');
  assert.equal(r.visibilityVerified,false);
  assert.equal(r.continuousCurveVisibilityVerified,false);
  assert.equal(r.capOcclusionVerified,false);
  for(const v of ['V','H','W']){
   assert.equal(r.views[v].length,65);
   assert.ok(r.views[v].every(e=>['visible','occluded','undetermined'].includes(e.visibility)));
  }
 });
}
test('unconfirmed source cannot produce ray evidence',()=>{
 const r=run(cone,plane(6),{sourceConfirmed:false,revision:15,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.equal(r.views,null);
});
