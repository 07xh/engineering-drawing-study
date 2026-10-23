'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneConstructionStepsV5:run}=require('../../workbench/cone-constructionsteps-v5.cjs');
const {coneProvenConstructionSteps}=require('../../workbench/cone-proven-construction-steps.cjs');
const {constructionStepsToV5}=require('../../workbench/construction-step-v5-adapter.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
const sheetTransform={origin:{x:340,y:240},scale:6};
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' proven guide steps reuse canonical V5 adapter with exact parity',()=>{
  const options={kind,sourceConfirmed:true,revision:11,sheetTransform,samples:64};
  const output=run(cone,plane(z),options);
  assert.equal(output.status,'verified-guides-preview');
  assert.equal(output.steps.length,12);
  const source=coneProvenConstructionSteps(cone,plane(z),options);
  const original=constructionStepsToV5({steps:source.steps,frame:'model-mm-2d',
   unit:'mm',sheet:{origin:{x:0,y:0},scale:1},revision:11});
  assert.deepEqual(output.steps,original.steps);
  assert.deepEqual(output.timing,original.timing);
  assert.equal(output.player.canRender(11),true);
  output.player.play(0);
  assert.ok(output.player.snapshot(100).elapsedMs>0);
  assert.equal(output.visibilityVerified,false);
  assert.equal(output.fullContourConstructionVerified,false);
 });
}
test('unconfirmed source cannot create V5 animation',()=>{
 const r=run(cone,plane(6),{sourceConfirmed:false,revision:12,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.equal(r.player,null);
 assert.deepEqual(r.steps,[]);
});
