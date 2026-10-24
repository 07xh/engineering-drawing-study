'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:compute}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {partitionReviewedSourceEdges:partition}=
 require('../../workbench/scoped-projected-stroke-partition.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
const P=(x,y,z)=>({x,y,z});
function box(id,z0,z1){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?10:0,y?10:0,z?z1:z0);
 const keys=Object.keys(points),edges=[];
 for(const [i,a] of keys.entries())for(const b of keys.slice(i+1))
  if([1,2,3].filter(q=>a[q]!==b[q]).length===1)edges.push([a,b]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const back=box('Back',0,2),front=box('Front',4,6),geometry=[back,front];
test('M4 original model endpoints bind to audited 3D incidence and projected depth groups in V/H/W',()=>{
 const e=compute({geometry,revision:400}),
  spans=e.projectedStrokePartitions.segments;
 assert.ok(spans.length>0);
 let sourceEndpoints=0,splitInteriors=0,projectedCoincidences=0;
 for(const s of spans){
  for(const which of ['from','to']){
   const t=which==='from'?s.sourceParameterRange[0]:s.sourceParameterRange[1];
   const event=s.sourceEndpointJoins[which];
   const original=(which==='from'&&t===0)||(which==='to'&&t===1);
   if(!original){
    assert.equal(event,null);
    if(t>0&&t<1)splitInteriors++;
    continue;
   }
   sourceEndpoints++;
   assert.ok(event);
   assert.equal(event.sourceIncidenceVerified,true);
   assert.equal(event.projectedEndpointJoinVisibilityVerified,false);
   assert.equal(event.officialEndpointLineStyleVerified,false);
   const [owner,vertexId]=event.sourceVertexKey.split('::');
   const obj=geometry.find(g=>g.id===owner);
   assert.equal(owner,s.sourceGeometryId);
   const position=obj.data.points[vertexId];
   const point=which==='from'?s.fromModelMm:s.toModelMm;
   assert.deepEqual(point,position);
   assert.deepEqual(project(position)[s.view],
    which==='from'?s.projectedFromModelMm:s.projectedToModelMm);
   const group=e.projectedVertexJoins.groups.find(g=>
    g.view===s.view&&g.projectionKey===event.projectedGroupKey);
   assert.ok(group);
   assert.ok(group.members.some(m=>m.sourceVertexKey===event.sourceVertexKey&&
    m.incidentSourceEdgeIds.includes(s.sourceEdgeId)));
   if(event.distinct3DPointsShareProjection){
    projectedCoincidences++;
    assert.equal(event.same3DPointWithinProjectedGroup,false);
   }
  }
  assert.equal(s.officialLineStyleVerified,false);
  assert.equal(s.v5ActionApproved,false);
 }
 assert.ok(sourceEndpoints>0);
 assert.ok(splitInteriors>0);
 assert.ok(projectedCoincidences>0);
 assert.equal(e.v5Ready,false);
 assert.equal(e.projectedStrokePartitions.canonicalIntentVerified,false);
});
test('M4 explicitly rejects false audited endpoint keys, viewed depth or invented visibility',()=>{
 const original=compute({geometry,revision:411});
 const fresh=()=>({geometry,sceneDepthEvidence:structuredClone(original),revision:411});
 for(const damage of [
  x=>{x.sceneDepthEvidence.projectedVertexJoins.groups[0].view='W';},
  x=>{x.sceneDepthEvidence.projectedVertexJoins.groups[0].members[0].sourceVertexKey='Forged::V999';},
  x=>{x.sceneDepthEvidence.projectedVertexJoins.groups[0].members[0].visibleJoinCertified=true;},
  x=>{x.sceneDepthEvidence.projectedVertexJoins.groups[0].nearestListedSourceVertexKey='Forged';},
  x=>{x.sceneDepthEvidence.projectedVertexJoins.officialLineStylesVerified=true;}
 ]){
  const x=fresh();damage(x);
  assert.throws(()=>partition(x),/scoped projected stroke partition/);
 }
 assert.equal(partition({geometry,sceneDepthEvidence:original,revision:412}).status,'not-covered');
});
test('two 3D vertices with identical H projections cannot be silently welded into one physical construction point',()=>{
 const e=compute({geometry,revision:420});
 const selected=e.projectedStrokePartitions.segments.filter(s=>
  s.view==='H'&&
  Object.values(s.sourceEndpointJoins).some(x=>x?.distinct3DPointsShareProjection));
 assert.ok(selected.length>0);
 for(const item of selected){
  for(const join of Object.values(item.sourceEndpointJoins)){
   if(!join?.distinct3DPointsShareProjection)continue;
   assert.equal(join.projectedEndpointJoinVisibilityVerified,false);
   assert.equal(join.officialEndpointLineStyleVerified,false);
  }
 }
});
test('production V7 verified-geometry session consumes joined span source IDs without creating second V5 player',()=>{
 const session=createUnifiedProjectSession();
 try{
  session.loadInputs({task:'composition',projectId:'ConnectedSegments',revision:422,
   source:{imageId:'ConfirmedSource'},totalRelationCount:0,relations:[],
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Cond'+g.id,objectId:g.id,confirmed:true,
    sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'ConfirmedSource',unit:'mm',geometry:g}}))
  });
  const result=session.solve(),part=result.sceneDepthEvidence.projectedStrokePartitions;
  assert.ok(part.segments.some(x=>x.sourceEndpointJoins.from));
  assert.ok(part.scopedHiddenCount>0&&part.scopedVisibleCount>0);
  assert.equal(part.v5Ready,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
