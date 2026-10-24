'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {validateSpatialStrokeConstructionIntent,validateSpatialStrokeIntentDAG}=
 require('../../core/contracts/spatial-stroke-construction-intent.js');
const {validateConstructionStep}=
 require('../../core/contracts/construction-step.js');
const {auditSpatialStrokeConstructionDAG:audit}=
 require('../../workbench/spatial-stroke-construction-dag-parity.cjs');
const {auditReviewedM4V5Motion:motion}=
 require('../../workbench/m4-existing-v5-motion-parity.cjs');
const {evaluateReviewedConvexMeshDepth:scene}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const {deriveGeometryScene}=
 require('../../core/projection/geometry-scene-views.cjs');
const {compileGeometryScene}=
 require('../../project/geometry-scene-consumer.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const P=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?max.x:min.x,y?max.y:min.y,z?max.z:min.z);
 const names=Object.keys(points),edges=[];
 for(const [i,a] of names.entries())for(const b of names.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const geometry=[box('Rear',P(0,0,0),P(10,10,2)),
 box('Front',P(-1,-1,4),P(11,11,6))],revision=803;
const sheet={origin:{x:360,y:208},scale:5};
const viewTransforms={V:sheet,H:sheet,W:sheet};
const reviewed=scene({geometry,revision});
const parity=motion({geometry,sceneDepthEvidence:reviewed,revision,viewTransforms});
const run=(overrides={})=>audit({
 geometry,sceneDepthEvidence:reviewed,revision,viewTransforms,
 motionParity:parity,...overrides
});
test('real closed-convex multi-body scene creates source-bound spatial ConstructionIntent -> existing core ConstructionStep DAG -> ONE V5 action parity',()=>{
 const r=run();
 assert.equal(r.status,'structural-source-action-parity-only');
 assert.equal(r.intents.length,reviewed.projectedStrokePartitions.segmentCount);
 assert.ok(r.intents.length>0);
 assert.equal(r.constructionSteps.length,r.intents.length);
 assert.equal(r.v5CandidateSteps.length,r.intents.length);
 assert.equal(r.v5ActionBindings.length,r.intents.length);
 assert.equal(r.everyActionHasProofTrace,true);
 assert.equal(r.geometricParityVerified,true);
 assert.equal(r.structuralIntentDAGVerified,true);
 assert.equal(r.structuralConstructionStepDAGVerified,true);
 assert.equal(validateSpatialStrokeIntentDAG(r.intents).ok,true);
 assert.equal(r.canonicalM3SolveResultVerified,false);
 assert.equal(r.approvedConstructionOrderVerified,false);
 assert.equal(r.closedEndpointJoinsVerified,false);
 assert.equal(r.fullContourVisibilityVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.singleV5Ready,false);
 assert.equal(r.createsSecondPlayer,false);
 assert.equal(Object.isFrozen(r.v5ActionBindings),true);
 assert.equal(Object.isFrozen(r.intents),true);
 assert.deepEqual(r.presentationTimingAudit,
  Timeline.compileTimeline(r.v5CandidateSteps));
 for(let i=0;i<r.intents.length;i++){
  const intent=r.intents[i],step=r.constructionSteps[i],
   binding=r.v5ActionBindings[i],v5=r.v5CandidateSteps[i].actions[0],
   source=reviewed.projectedStrokePartitions.segments[i];
  assert.equal(validateSpatialStrokeConstructionIntent(intent).ok,true);
  assert.equal(validateConstructionStep(step).ok,true);
  assert.equal(intent.operation.v5ActionId,binding.v5ActionId);
  assert.equal(binding.v5ActionId,v5.id);
  assert.equal(binding.sourceEdgeId,source.sourceEdgeId);
  assert.equal(binding.sourceGeometryId,source.sourceGeometryId);
  assert.equal(binding.view,source.view);
  assert.deepEqual(intent.source.parameterRange,source.sourceParameterRange);
  assert.deepEqual(intent.operation.fromModelMm,source.fromModelMm);
  assert.deepEqual(intent.operation.toModelMm,source.toModelMm);
  assert.deepEqual(intent.operation.fromProjectedMm,
   project(source.fromModelMm)[source.view]);
  assert.deepEqual(v5.geometry.from,
   toSheet(source.view,intent.operation.fromProjectedMm,sheet));
  assert.deepEqual(v5.geometry.to,
   toSheet(source.view,intent.operation.toProjectedMm,sheet));
  assert.equal(step.actions[0].style,'auxiliary');
  assert.equal(intent.proof.wholeStrokeVisibility,'undetermined');
  assert.equal(intent.proof.v5Approved,false);
  assert.equal(binding.officialLineStyleVerified,false);
  assert.equal(binding.approved,false);
  assert.equal(r.v5CandidateSteps[i].role,'auxiliary');
 }
});
test('typed spatial Intent rejects optimistic visible style, future DAG dependency and fake 3D-to-first-angle projection',()=>{
 const r=run();
 const valid=structuredClone(r.intents[0]);
 for(const mutate of [
  x=>{x.proof.v5Approved=true;},
  x=>{x.proof.officialLineStyleVerified=true;},
  x=>{x.proof.wholeStrokeVisibility='visible';},
  x=>{x.proof.sourceEndpointJoinsVerified=true;},
  x=>{x.operation.fromProjectedMm.u+=3;},
  x=>{x.source.view='perspective';},
  x=>{x.source.parameterRange=[0.8,0.2];},
  x=>{x.revision++;},
  x=>{x.source.edgeId='Fake::Edge';}
 ]){
  const obj=structuredClone(valid);mutate(obj);
  if(obj.revision!==valid.revision){
   assert.equal(validateSpatialStrokeConstructionIntent(obj).ok,false);
  }else assert.equal(validateSpatialStrokeConstructionIntent(obj).ok,false);
 }
 const duplicate=[structuredClone(r.intents[0]),structuredClone(r.intents[0])];
 assert.equal(validateSpatialStrokeIntentDAG(duplicate).ok,false);
 const forward=structuredClone(r.intents.slice(0,2));
 forward[0].dependsOn=[forward[1].id];
 assert.equal(validateSpatialStrokeIntentDAG(forward).ok,false);
});
test('forged Motion source action, alternate paper point, stale revision and incomplete proof all fail before Intent or player',()=>{
 const changes=[
  x=>{x.motionParity.candidates[0].v5MotionAction.geometry.to.x+=2;},
  x=>{x.motionParity.candidates[0].scopedOpenInteriorVisibility='visible-forged';},
  x=>{x.sceneDepthEvidence.projectedStrokePartitions.segments[0]
   .officialLineStyleVerified=true;},
  x=>{x.sceneDepthEvidence.edgeOverlapAudit.pairCount++;},
  x=>{x.sceneDepthEvidence.projectedVertexJoins.groups[0]
   .jointVisibilityCertified=true;},
  x=>{x.sceneDepthEvidence.v5Ready=true;},
  x=>{x.sceneDepthEvidence.constructionIntentReady=true;}
 ];
 for(const change of changes){
  const args={geometry,sceneDepthEvidence:structuredClone(reviewed),
   revision,viewTransforms,motionParity:structuredClone(parity)};
  change(args);
  if(args.sceneDepthEvidence.v5Ready||args.sceneDepthEvidence.constructionIntentReady)
   assert.equal(audit(args).status,'not-covered');
  else assert.throws(()=>audit(args));
 }
 assert.equal(run({revision:revision+1}).status,'not-covered');
});
test('real V7 composition integrates source-linked spatial Intent/Step/action audit but still NO official timeline or math signing',()=>{
 const session=createUnifiedProjectSession();
 try{
  session.loadInputs({task:'composition',projectId:'SemanticSource',revision,
   source:{imageId:'UnansweredReviewedOriginal'},relations:[],totalRelationCount:0,
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Confirmed'+g.id,objectId:g.id,
    confirmed:true,sourceCandidateId:null,value:{
     type:'manual-geometry',imageId:'UnansweredReviewedOriginal',unit:'mm',
     geometry:g}}))
  });
  const result=session.solve();
  const plan=result.spatialStrokeConstructionDAG;
  const used=compileGeometryScene(result.scene,{sheet});
  const expected=audit({geometry,sceneDepthEvidence:result.sceneDepthEvidence,
   revision,viewTransforms:{V:used.paperTransform,H:used.paperTransform,
    W:used.paperTransform},motionParity:result.scopedMotionParity});
  assert.deepEqual(plan,expected);
  assert.equal(plan.everyActionHasProofTrace,true);
  assert.equal(plan.singleV5Ready,false);
  assert.equal(result.spatialV5Readiness.singleV5TimelineCanBeSigned,false);
  assert.equal(result.verified,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
test('unreviewed/open Geometry never receives a signed or structural spatial DAG',()=>{
 const g=box('Broken',P(0,0,0),P(10,10,2));
 g.data.faces.pop();
 const bad=scene({geometry:[g],revision});
 const r=audit({geometry:[g],sceneDepthEvidence:bad,revision,
  viewTransforms,motionParity:null});
 assert.equal(r.status,'not-covered');
 assert.equal(r.intents.length,0);
 assert.equal(r.singleV5Ready,false);
});
