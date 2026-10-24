'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:analyze}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {partitionReviewedSourceEdges:partition}=
 require('../../workbench/scoped-projected-stroke-partition.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const P=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?max.x:min.x,y?max.y:min.y,z?max.z:min.z);
 const keys=Object.keys(points),edges=[];
 for(const [i,a] of keys.entries())for(const b of keys.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const rear=box('Rear',P(0,0,0),P(10,10,2)),
 front=box('Front',P(-1,-1,4),P(11,11,6));
function knownEdgeOwner(geometry,sourceId){
 const [owner,vertices]=sourceId.split('::');
 const g=geometry.find(x=>x.id===owner);
 assert.ok(g);
 const [a,b]=vertices.split('|');
 return [g.data.points[a],g.data.points[b]];
}
test('read-only first-angle stroke pieces partition reviewed source edges at occlusion and crossing events',()=>{
 const geometry=[rear,front],evidence=analyze({geometry,revision:78}),
  response=evidence.projectedStrokePartitions;
 assert.equal(response.schema,'draftai-scoped-projected-stroke-partition/1');
 assert.equal(response.status,'preview-partition-evidence-only');
 assert.equal(response.officialLineStylesVerified,false);
 assert.equal(response.canonicalIntentVerified,false);
 assert.equal(response.constructionStepDAGVerified,false);
 assert.equal(response.v5Ready,false);
 assert.equal(response.segmentCount,response.segments.length);
 assert.ok(response.scopedHiddenCount>0);
 assert.ok(response.segments.some(x=>x.openInteriorVisibility==='undetermined'));
 assert.equal(Object.isFrozen(response.segments),true);
 for(const span of response.segments){
  assert.ok(['V','H','W'].includes(span.view));
  assert.ok(span.sourceParameterRange[0]>=0&&
   span.sourceParameterRange[1]<=1);
  assert.ok(span.sourceParameterRange[0]<span.sourceParameterRange[1]);
  const [a,b]=knownEdgeOwner(geometry,span.sourceEdgeId),[t0,t1]=span.sourceParameterRange;
  const interpolation=t=>P(a.x+(b.x-a.x)*t,
   a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t);
  assert.deepEqual(span.fromModelMm,interpolation(t0));
  assert.deepEqual(span.toModelMm,interpolation(t1));
  assert.deepEqual(span.projectedFromModelMm,project(span.fromModelMm)[span.view]);
  assert.deepEqual(span.projectedToModelMm,project(span.toModelMm)[span.view]);
  assert.equal(span.officialLineStyleVerified,false);
  assert.equal(span.v5ActionApproved,false);
  assert.equal(span.joinVisibilityVerified,false);
  if(span.openInteriorVisibility==='hidden'){
   assert.ok(span.evidenceScope.includes('strict-forward-ray'));
  }else{
   assert.deepEqual(span.occluderGeometryIds,[]);
  }
 }
});
test('all proved hidden open spans have an independent full-body forward ray witness at sample interior',()=>{
 const geometry=[rear,front],evidence=analyze({geometry,revision:79});
 const selected=evidence.projectedStrokePartitions.segments.filter(s=>
  s.view==='H'&&s.sourceGeometryId==='Rear'&&
  s.openInteriorVisibility==='hidden'&&s.occluderGeometryIds.includes('Front'));
 assert.ok(selected.length>=4);
 for(const span of selected){
  const middle=P((span.fromModelMm.x+span.toModelMm.x)/2,
   (span.fromModelMm.y+span.toModelMm.y)/2,
   (span.fromModelMm.z+span.toModelMm.z)/2);
  const forward=P(middle.x,middle.y,5);
  assert.ok(forward.z>middle.z);
  assert.ok(forward.x> -1&&forward.x<11);
  assert.ok(forward.y> -1&&forward.y<11);
  assert.ok(forward.z>4&&forward.z<6);
 }
});
test('tampered view, source edge, interval, revision or forged line-status cannot pass M4 partition gate',()=>{
 const geometry=[rear,front],source=analyze({geometry,revision:80});
 const arg=()=>({geometry,revision:80,
  sceneDepthEvidence:structuredClone(source)});
 for(const mutate of [
  x=>{x.sceneDepthEvidence.revision=79;},
  x=>{x.sceneDepthEvidence.edgeContinuousOcclusion.certifiedRanges[0].view='W';},
  x=>{x.sceneDepthEvidence.edgeContinuousOcclusion.certifiedRanges[0].openSourceParameterRange=[0,1];},
  x=>{x.sceneDepthEvidence.edgeContinuousOcclusion.certifiedRanges[0].sourceEdgeId='Forged::V000|V111';},
  x=>{x.sceneDepthEvidence.edgeContinuousOcclusion.certifiedRanges[0].fullLineStyleVerified=true;},
  x=>{x.sceneDepthEvidence.officialLineStylesVerified=true;}
 ]){
  const x=arg();mutate(x);
  if(x.sceneDepthEvidence.revision!==80)
   assert.equal(partition(x).status,'not-covered');
  else assert.throws(()=>partition(x),/scoped projected stroke partition/);
 }
});
test('nonconvex or mixed inputs keep V5 proof boundaries blocked',()=>{
 const bad=box('Open',P(0,0,0),P(10,10,2));bad.data.faces.pop();
 const out=analyze({geometry:[rear,bad],revision:81});
 assert.equal(out.status,'not-covered');
 assert.equal(out.projectedStrokePartitions.status,'not-covered');
 assert.equal(out.projectedStrokePartitions.v5Ready,false);
});
test('real existing project composition still does NOT mint ConstructionIntent or V5 timeline',()=>{
 const session=createUnifiedProjectSession();
 const geometry=[rear,front];
 try{
  session.loadInputs({task:'composition',projectId:'PartitionProject',revision:83,
   source:{imageId:'ReviewedSource'},totalRelationCount:0,relations:[],
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Condition'+g.id,objectId:g.id,
    confirmed:true,sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'ReviewedSource',unit:'mm',geometry:g}}))
  });
  const result=session.solve();
  assert.equal(result.sceneDepthEvidence.projectedStrokePartitions.status,
   'preview-partition-evidence-only');
  assert.equal(result.verified,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
