'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {projectVerifiedPlan}=require('../../workbench/verified-intent-projection.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const sheet={origin:{x:360,y:220},scale:8};
const segment=()=>({first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10,
 branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'});
const circle=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10,
 firstMode:'external',secondMode:'external',branchId:'center-1',
 direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
const segmentCircle=()=>({segment:{a:{x:-15,y:0},b:{x:15,y:0}},
 circle:{center:{x:0,y:5},radius:8},filletRadius:3,side:1,
 branchId:'candidate-1',direction:'ccw',lineTravel:'forward',
 knownCircleTravel:'cw'});
for(const [kind,factory,branch,sign] of [
 ['segments',segment,'s++',-1],
 ['circles',circle,'center-1',1],
 ['segment-circle',segmentCircle,'candidate-1',-1]
]){
 test('F2 real solver branch and model-to-SVG directed arc: '+kind,()=>{
  const result=projectVerifiedPlan(kind,factory(),sheet,9);
  assert.equal(result.status,'ready');
  assert.equal(result.selectedBranchId,branch);
  assert.equal(result.revision,9);
  assert.ok(result.intents.length>0);
  const arc=result.steps.at(-1).actions[0];
  assert.equal(arc.kind,'arc');
  assert.equal(Math.sign(arc.geometry.sweepRadians),sign);
  assert.match(Motion.actionShapeAttrs(arc,1).d,/ A /);
 });
 test('F2 missing branch never yields proof or V5 actions: '+kind,()=>{
  const data=factory();delete data.branchId;
  const result=projectVerifiedPlan(kind,data,sheet,10);
  assert.equal(result.status,'not-verified');
  assert.equal(result.mathematicallyVerified,false);
  assert.deepEqual(result.steps,[]);
  assert.deepEqual(result.intents,[]);
 });
}
test('F2 invalid directed G1 travel rejects finite segment proof',()=>{
 const data=segment();data.firstTravel='reverse';
 const result=projectVerifiedPlan('segments',data,sheet,4);
 assert.equal(result.status,'not-verified');
 assert.deepEqual(result.intents,[]);
});
test('F2 changing branch or invalid revision cannot recycle a prior projection',()=>{
 const data=segment();
 const original=projectVerifiedPlan('segments',data,sheet,11);
 assert.equal(original.status,'ready');
 data.branchId='nonexistent-branch';
 // Existing specialist solver rejects an unknown branch with an exception.
 // An exception is fail-closed; never reinterpret it as an animated result.
 assert.throws(()=>projectVerifiedPlan('segments',data,sheet,12),
  /branchId is not an actual finite-contact candidate/);
 assert.equal(original.revision,11);
 assert.throws(()=>projectVerifiedPlan('segments',segment(),sheet,-1),/revision/);
});
