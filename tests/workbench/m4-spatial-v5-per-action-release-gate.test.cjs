'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {inspectSpatialV5ActionRelease:release}=
 require('../../workbench/spatial-v5-per-action-release-gate.cjs');
const {auditSpatialStrokeConstructionDAG:audit}=
 require('../../workbench/spatial-stroke-construction-dag-parity.cjs');
const {auditReviewedM4V5Motion:motion}=
 require('../../workbench/m4-existing-v5-motion-parity.cjs');
const {evaluateReviewedConvexMeshDepth:scene}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?max.x:min.x,y?max.y:min.y,z?max.z:min.z);
 const ids=Object.keys(points),edges=[];
 for(const [i,a]of ids.entries())for(const b of ids.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,
  faces:[['V000','V100','V110','V010'],['V001','V101','V111','V011'],
   ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
   ['V000','V010','V011','V001'],['V100','V110','V111','V101']]}};
}
const geometry=[box('Rear',P(0,0,0),P(10,10,2)),
 box('Front',P(-1,-1,4),P(11,11,6))],revision=1503,
 sheet={origin:{x:360,y:208},scale:5},
 viewTransforms={V:sheet,H:sheet,W:sheet};
const e=scene({geometry,revision});
const m=motion({geometry,sceneDepthEvidence:e,revision,viewTransforms});
const dag=audit({geometry,sceneDepthEvidence:e,revision,viewTransforms,motionParity:m});
const args=()=>({geometry,sceneDepthEvidence:e,revision,
 viewTransforms,motionParity:m,spatialConstructionDAG:dag});
test('EVERY source-bound V5 action is held, including mathematically visible and hidden open rays',()=>{
 const r=release(args());
 assert.equal(r.schema,'draftai-spatial-v5-per-action-release-gate/1');
 assert.equal(r.status,'all-actions-held-evidence-incomplete');
 assert.equal(r.actionCount,dag.v5ActionBindings.length);
 assert.equal(r.blockedCount,r.actionCount);
 assert.equal(r.signedCount,0);
 assert.equal(r.anyOfficialStyleApproved,false);
 assert.equal(r.singleV5Ready,false);
 assert.equal(Object.isFrozen(r.actions),true);
 const statuses=new Set(r.actions.map(a=>a.mathematicallyScopedOpenInterior));
 assert.ok(statuses.has('visible'));
 assert.ok(statuses.has('hidden'));
 for(const a of r.actions){
  assert.equal(a.actionReleaseStatus,'blocked');
  assert.equal(a.authorizedLineStyle,'undetermined');
  assert.equal(a.officialStyleApproved,false);
  assert.equal(a.sourceEndpointVisibilityVerified,false);
  assert.equal(a.existingSingleV5ActionOnly,true);
  assert.equal(a.geometryAndMotionParityVerified,true);
  assert.equal(a.sourceIntentAndDAGStructureVerified,true);
  assert.ok(a.missingProofs.includes('m3-independent-solve-result'));
  assert.ok(a.missingProofs.includes('canonical-spatial-construction-order'));
  assert.ok(a.missingProofs.includes('global-multibody-depth-sorted-contour'));
  assert.ok(a.missingProofs.includes('standard-complete-stroke-solid-dashed-proof'));
  assert.ok(a.missingProofs.includes('complete-source-endpoint-and-projected-join-visibility'));
  assert.ok(a.missingProofs.includes('scene:official-solid-dashed-style'));
 }
 assert.equal(new Set(r.actions.map(a=>a.v5ActionId)).size,r.actionCount);
});
test('source-revision forged 2D/3D intent, V5 action or official style cannot mint signed lines',()=>{
 for(const mutate of [
  x=>{x.spatialConstructionDAG.intents[0].proof.v5Approved=true;},
  x=>{x.spatialConstructionDAG.intents[0].operation
   .fromModelMm.z+=1;},
  x=>{x.spatialConstructionDAG.v5CandidateSteps[0].actions[0]
   .geometry.from.x+=1;},
  x=>{x.spatialConstructionDAG.v5ActionBindings[0]
   .officialLineStyleVerified=true;},
  x=>{x.spatialConstructionDAG.v5ActionBindings[0]
   .sourceEdgeId='Fake::Edge';},
  x=>{x.sceneDepthEvidence.projectedStrokePartitions
   .segments[0].openInteriorVisibility='visible-forged';},
  x=>{x.sceneDepthEvidence.projectedVertexJoins.groups[0]
   .jointVisibilityCertified=true;},
  x=>{x.sceneDepthEvidence.edgeOverlapAudit.pairCount++;},
  x=>{x.motionParity.candidates[0].v5MotionAction
   .geometry.to.x+=1;}
 ]){
  const input={geometry,sceneDepthEvidence:structuredClone(e),revision,
   viewTransforms,motionParity:structuredClone(m),
   spatialConstructionDAG:structuredClone(dag)};
  mutate(input);
  assert.throws(()=>release(input));
 }
 assert.equal(release({...args(),revision:revision+1}).status,'not-covered');
});
test('actual V7 reviewed source stores per-action blocked line style; no official V5 playback or extra player',()=>{
 const s=createUnifiedProjectSession();
 try{
  s.loadInputs({task:'composition',projectId:'NoFalseV5Line',revision,
   source:{imageId:'GenuineReviewedSource'},relations:[],totalRelationCount:0,
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Condition'+g.id,objectId:g.id,
    confirmed:true,sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'GenuineReviewedSource',unit:'mm',geometry:g}}))
  });
  const result=s.solve();
  assert.equal(result.kind,'composition-evidence');
  assert.equal(result.spatialV5ActionRelease.status,
   'all-actions-held-evidence-incomplete');
  assert.equal(result.spatialV5ActionRelease.actionCount,
   result.spatialStrokeConstructionDAG.v5ActionBindings.length);
  assert.equal(result.spatialV5ActionRelease.signedCount,0);
  assert.ok(result.spatialV5ActionRelease.actions.every(x=>
   x.authorizedLineStyle==='undetermined'&&!x.officialStyleApproved));
  assert.equal(result.verified,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  s.invalidate();
  assert.equal(s.readSnapshot(),null);
 }finally{s.dispose();}
});
test('invalid open mesh source cannot request even a structural V5 action release',()=>{
 const broken=box('Broken',P(0,0,0),P(10,10,2));
 broken.data.faces.pop();
 const bad=scene({geometry:[broken],revision});
 const gate=release({geometry:[broken],sceneDepthEvidence:bad,revision,
  viewTransforms,motionParity:null,spatialConstructionDAG:null});
 assert.equal(gate.status,'not-covered');
 assert.deepEqual(gate.actions,[]);
 assert.equal(gate.anyOfficialStyleApproved,false);
 assert.equal(gate.singleV5Ready,false);
});
