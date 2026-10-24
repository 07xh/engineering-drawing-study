'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth}=require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectSpatialV5Readiness:check}=require('../../workbench/spatial-v5-evidence-readiness.cjs');
const {createUnifiedProjectSession}=require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,a,b){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?b.x:a.x,y?b.y:a.y,z?b.z:a.z);
 const ids=Object.keys(points),edges=[];
 for(const [i,k]of ids.entries())for(const v of ids.slice(i+1))
  if([1,2,3].filter(n=>k[n]!==v[n]).length===1)edges.push([k,v]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const geometry=[
 box('Rear',P(0,0,0),P(10,10,2)),
 box('Forward',P(4,3,4),P(14,13,8))
];
const audit=()=>evaluateReviewedConvexMeshDepth({geometry,revision:51});
test('M5 scene reports precise V/H/W blocker evidence without upgrading any open-interval visibility to V5',()=>{
 const e=audit(),r=check({sceneDepthEvidence:e,revision:51});
 assert.equal(r.schema,'draftai-m5-spatial-v5-readiness/1');
 assert.equal(r.status,'blocked-evidence-incomplete');
 assert.equal(r.singleV5TimelineCanBeSigned,false);
 assert.equal(r.allOfficialLineStylesVerified,false);
 assert.equal(r.canonicalIntentVerified,false);
 assert.equal(r.constructionStepDAGVerified,false);
 assert.equal(r.v5Ready,false);
 assert.ok(r.missingCount>3);
 assert.ok(r.missingEvidence.some(x=>x.id==='all-projected-endpoint-joins'));
 assert.ok(r.missingEvidence.some(x=>x.id==='official-solid-dashed-style'));
 assert.ok(r.missingEvidence.some(x=>x.id==='canonical-construction-intent'));
 assert.ok(r.missingEvidence.some(x=>x.id==='dag-v5-action-parity'));
 assert.equal(r.geometricUnionEvidencePresent,true);
 for(const view of ['V','H','W']){
  assert.ok(r.views[view].projectedStrokeCount>0);
  assert.ok(r.views[view].projectedUnionOpenBoundaryCount>0);
  assert.equal(r.views[view].fullViewLineStyleVerified,false);
 }
 assert.ok(Object.isFrozen(r.missingEvidence));
});
test('empty or unreviewed source Geometry never authorizes V5 despite a validated revision',()=>{
 const e=evaluateReviewedConvexMeshDepth({geometry:[],revision:6});
 const r=check({sceneDepthEvidence:e,revision:6});
 assert.equal(r.scopedRayEvidencePresent,false);
 assert.equal(r.geometricUnionEvidencePresent,false);
 assert.equal(r.v5Ready,false);
 assert.ok(r.missingEvidence.some(x=>x.id==='reviewed-convex-source'));
});
test('old source revision, fake global line-style or fake projected stroke flags are rejected',()=>{
 const e=audit();
 assert.throws(()=>check({sceneDepthEvidence:e,revision:50}),/revision/);
 assert.throws(()=>check({sceneDepthEvidence:{...e,v5Ready:true},revision:51}),/forged/);
 assert.throws(()=>check({sceneDepthEvidence:{...e,constructionIntentReady:true},revision:51}),/forged/);
 const forged={...e,projectedStrokePartitions:{...e.projectedStrokePartitions,
  segments:e.projectedStrokePartitions.segments.map((s,i)=>i===0?
   {...s,v5ActionApproved:true}:s)}};
 assert.throws(()=>check({sceneDepthEvidence:forged,revision:51}),/promotion/);
});
test('existing reviewed composition session exposes readiness report without any verified SolveResult, DAG or V5 clock',()=>{
 const session=createUnifiedProjectSession();
 try{
  session.loadInputs({
   task:'composition',projectId:'ReadinessV7',revision:51,
   source:{imageId:'SourceImage'},totalRelationCount:0,relations:[],
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Condition'+g.id,
    objectId:g.id,sourceCandidateId:null,confirmed:true,
    value:{type:'manual-geometry',unit:'mm',
     imageId:'SourceImage',geometry:g}}))
  });
  const result=session.solve();
  assert.equal(result.spatialV5Readiness.v5Ready,false);
  assert.equal(result.spatialV5Readiness.revision,51);
  assert.ok(result.spatialV5Readiness.views.H.projectedStrokeCount>0);
  assert.equal(result.verified,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  session.invalidate();assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
