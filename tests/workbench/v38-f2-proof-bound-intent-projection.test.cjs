'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {adaptDirectedFillet}=require('../../workbench/verified-teaching-plan.cjs');
const {projectVerifiedPlan}=require('../../workbench/verified-intent-projection.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const sheet={origin:{x:360,y:220},scale:8};
const input=()=>({
 first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'
});
test('F2 real verified finite-segment fillet yields intent DAG and existing V5',()=>{
 const source=adaptDirectedFillet('segments',input(),{revision:12});
 const projected=projectVerifiedPlan('segments',input(),sheet,12);
 assert.equal(projected.status,'ready');
 assert.equal(projected.revision,12);
 assert.equal(projected.selectedBranchId,'s++');
 assert.equal(projected.intents.length,source.steps.length);
 assert.deepEqual(projected.intents.map(x=>x.id),source.steps.map(x=>x.id));
 for(const [i,intent] of projected.intents.entries()){
  assert.deepEqual(intent.dependsOn,source.steps[i].dependsOn);
  assert.deepEqual(intent.outputEntityIds,source.steps[i].actions.map(a=>a.id));
  assert.deepEqual(intent.inputEntityIds,[],'step IDs must not masquerade as geometry entities');
  assert.equal(typeof intent.evidenceSource,'string');
  assert.equal(intent.sourceRevision,12);
  assert.equal(intent.sourceSolver,source.solver);
 }
 assert.equal(Timeline.frame(projected.timing,projected.timing.totalMs).done,true);
 assert.equal(projected.steps.at(-1).actions[0].kind,'arc');
});
test('F2 missing branch fails closed and produces no intent or timeline',()=>{
 const data=input();delete data.branchId;
 const source=adaptDirectedFillet('segments',data,{revision:13});
 const projected=projectVerifiedPlan('segments',data,sheet,13);
 assert.equal(projected.status,'not-verified');
 assert.deepEqual(projected.intents,[]);
 assert.deepEqual(projected.steps,[]);
 assert.equal(projected.mathematicallyVerified,false);
 assert.equal(projected.timing,undefined);
});
test('F2 forged proof-bearing plan cannot be passed as trusted solver input',()=>{
 const source=adaptDirectedFillet('segments',input(),{revision:14});
 const steps=source.steps.map(x=>({...x,dependsOn:[...x.dependsOn]}));
 steps[0].dependsOn=['future-step'];
 assert.throws(()=>projectVerifiedPlan({...source,steps},sheet),/unsupported specialist kind/);
});
