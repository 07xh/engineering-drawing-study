'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneProvenConstructionSteps:run}=require('../../workbench/cone-proven-construction-steps.cjs');
const {validateConstructionStep}=require('../../core/contracts/construction-step.js');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
const sheetTransform={origin:{x:340,y:240},scale:6};
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' yields independently checked generator and transfer steps',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:9,sheetTransform,samples:64});
  assert.equal(r.status,'verified-guide-steps');
  assert.equal(r.steps.length,12);
  assert.ok(r.steps.every(s=>validateConstructionStep(s).ok));
  assert.ok(r.proof.every(p=>p.generatorResidualMm<1e-7&&p.planeResidualMm<1e-7));
  assert.equal(r.visibilityVerified,false);
  assert.equal(r.fullContourConstructionVerified,false);
  for(let i=1;i<r.steps.length;i++)
   assert.deepEqual(r.steps[i].dependsOn,[r.steps[i-1].id]);
 });
}
test('unconfirmed cone input cannot produce trusted construction steps',()=>{
 const r=run(cone,plane(6),{sourceConfirmed:false,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.deepEqual(r.steps,[]);
});
