'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneVWSolidRayCrossValidation:run}=require('../../workbench/cone-vw-solid-ray-cross-validation.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' V/W interval midpoint agrees with full solid ray',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:110,sheetTransform});
  assert.equal(r.status,'midpoint-witnesses-consistent');
  assert.ok(r.witnesses.length>=2);
  assert.ok(r.witnesses.every(w=>w.consistent));
  assert.equal(r.continuousIntervalProvedBySamples,false);
  assert.equal(r.capChordVisibilityVerified,false);
 });
}
test('unconfirmed source cannot cross-validate',()=>{
 assert.equal(run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:false,sheetTransform}).status,'not-verified');
});
