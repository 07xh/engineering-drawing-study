'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneContourConstructionEvidence:run}=require('../../workbench/cone-contour-construction-evidence.cjs');
const {validateConstructionStep}=require('../../core/contracts/construction-step.js');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z,expected] of [['full-ellipse',6,0],['clipped-ellipse',1,3]]){
 test(kind+' retains exact conic evidence and validates cap chord canonical steps',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:44,sheetTransform});
  assert.equal(r.status,'verified-contour-construction-evidence');
  assert.equal(r.steps.length,expected);
  assert.equal(r.exactLateralCurvesPreserved,true);
  assert.equal(r.continuousContourV5Ready,false);
  assert.equal(r.capChordVisibilityVerified,false);
  assert.ok(r.curveEvidence.length>=3);
  assert.ok(r.curveEvidence.every(e=>e.constructionStepId===null&&e.proof==='analytic-not-polyline'));
  assert.ok(r.steps.every(s=>validateConstructionStep(s).ok&&s.visibility==='undetermined'));
 });
}
test('unreviewed inputs never generate contour steps',()=>{
 const r=run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:false,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.deepEqual(r.steps,[]);
});
