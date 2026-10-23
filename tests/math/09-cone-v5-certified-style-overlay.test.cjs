'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneV5CertifiedStyleOverlay:run}=require('../../workbench/cone-v5-certified-style-overlay.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' V/W bounded display paths carry certified styles on same V5 player',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:116,sheetTransform});
  assert.equal(r.status,'certified-style-overlay-for-existing-v5');
  assert.ok(r.player);
  for(const view of ['V','W']){
   assert.ok(r.views[view].length);
   for(const p of r.views[view]){
    assert.equal(p.lineStyle,p.visibility==='visible'?'solid':'dashed');
    assert.equal(p.displayApproximationOnly,true);
    assert.ok(p.maxChordDeviationPx<=0.5+1e-10);
   }
  }
  assert.equal(r.overlayConnectedToPublicWorkbench,false);
  assert.equal(r.capChordVisibilityVerified,false);
 });
}
test('unconfirmed source never receives style overlay',()=>{
 assert.equal(run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:false,sheetTransform}).status,'not-verified');
});
