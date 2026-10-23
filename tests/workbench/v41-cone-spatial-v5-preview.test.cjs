'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSpatialV5Preview}=require('../../workbench/cone-spatial-v5-preview.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' uses existing V5 timeline without claiming visibility or exact construction',()=>{
  const result=coneSpatialV5Preview(cone,plane(z),
   {kind,sourceConfirmed:true,revision:5,sheetTransform,samples:64});
  assert.equal(result.status,'preview-only');
  assert.equal(result.mathematicallyVerified,true);
  assert.equal(result.visibilityVerified,false);
  assert.equal(result.constructionStepsReady,false);
  assert.equal(result.firstAngleLayoutVerified,false);
  assert.deepEqual(result.steps.map(s=>s.id),['cone_V','cone_H','cone_W']);
  assert.ok(result.timing.segments.length>100);
  assert.equal(result.player.canRender(5),true);
  result.player.play(0);
  assert.ok(result.player.snapshot(200).elapsedMs>0);
  assert.equal(result.player.snapshot().invalid,false);
  if(kind==='clipped-ellipse')
   assert.ok(result.steps.some(s=>s.actions.some(a=>a.id.endsWith('cap_chord'))));
 });
}
test('unconfirmed source never produces a V5 player',()=>{
 const result=coneSpatialV5Preview(cone,plane(6),
  {sourceConfirmed:false,revision:6,sheetTransform});
 assert.equal(result.status,'not-verified');
 assert.equal(result.player,null);
 assert.deepEqual(result.steps,[]);
});
