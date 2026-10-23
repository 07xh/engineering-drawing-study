'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSingleV5Composition:run}=require('../../workbench/cone-single-v5-composition.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z,count] of [['full-ellipse',6,12],['clipped-ellipse',1,15]]){
 test(kind+' guides and cap chord share one V5 player',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:61,sheetTransform});
  assert.equal(r.status,'verified-single-v5-composition');
  assert.equal(r.steps.length,count);
  assert.equal(r.timing.steps.length,count);
  assert.ok(r.player.snapshot().totalMs>0);
  assert.equal(new Set(r.steps.map(s=>s.id)).size,count);
  assert.equal(new Set(r.steps.flatMap(s=>s.actions.map(a=>a.id))).size,
   r.steps.flatMap(s=>s.actions).length);
  assert.ok(r.curveEvidence.length>=3);
  assert.equal(r.exactConicV5Ready,false);
  assert.equal(r.fullContourV5Ready,false);
  assert.equal(r.publicWorkbenchConnected,false);
 });
}
test('unreviewed geometry cannot compose a timeline',()=>{
 const r=run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:false,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.equal(r.player,null);
});
