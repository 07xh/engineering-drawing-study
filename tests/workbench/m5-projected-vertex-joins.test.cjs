'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {deriveReviewedProjectedVertexJoins:joins}=
 require('../../workbench/reviewed-projected-vertex-joins.cjs');
const {evaluateReviewedConvexMeshDepth:scene}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../../core/projection/conventions.js');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,z0,z1){
 const points={};
 for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)
  points['V'+a+b+c]=P(a?10:0,b?10:0,c?z1:z0);
 const ids=Object.keys(points),edges=[];
 for(const [i,k]of ids.entries())for(const v of ids.slice(i+1))
  if([1,2,3].filter(q=>k[q]!==v[q]).length===1)edges.push([k,v]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const back=box('Back',0,2),front=box('Front',4,6),geometry=[back,front];
test('same H paper coordinate with different 3D depths is NOT a true 3D geometric join',()=>{
 const j=joins({geometry,revision:203});
 assert.equal(j.status,'scoped-projected-coincidences-only');
 assert.equal(j.sourceVertexCount,16);
 const group=j.groups.find(x=>x.view==='H'&&
  x.projectedModelMm.u===0&&x.projectedModelMm.v===0);
 assert.ok(group);
 assert.equal(group.memberCount,4);
 assert.equal(group.same3DPoint,false);
 assert.equal(group.distinct3DPointsShareProjection,true);
 assert.equal(group.listedVertexDepthOrderVerified,true);
 assert.equal(group.nearestListedSourceVertexKey,'Front::V001');
 assert.deepEqual(group.members.map(m=>m.observerDepthMm),[6,4,2,0]);
 assert.equal(group.jointVisibilityCertified,false);
 assert.equal(group.projectedJunctionLineStyleCertified,false);
 assert.equal(j.endpointVisibilityVerified,false);
 assert.equal(j.officialLineStylesVerified,false);
 assert.equal(j.v5Ready,false);
 for(const v of group.members){
  const source=geometry.find(x=>x.id===v.sourceGeometryId).data.points[v.sourceVertexId];
  assert.deepEqual(v.pointModelMm,source);
  assert.deepEqual(project(source).H,group.projectedModelMm);
  assert.equal(v.incidentSourceEdgeIds.length,3);
  assert.equal(v.sourceIncidenceVerified,true);
  assert.equal(v.visibleJoinCertified,false);
 }
 assert.equal(Object.isFrozen(j.groups),true);
 assert.equal(Object.isFrozen(group.members),true);
});
test('3D incidence, projection coordinates and first-angle V/H/W observer depth are recomputed',()=>{
 const j=joins({geometry,revision:204});
 for(const group of j.groups){
  const d=FIRST_ANGLE_OBSERVER_RAYS[group.view];
  const keys=group.members.map(m=>m.sourceVertexKey);
  assert.equal(new Set(keys).size,keys.length);
  assert.equal(group.allSourceVertexIncidencesVerified,true);
  assert.equal(group.wholeContourCertified,false);
  for(const m of group.members){
   const expect=m.pointModelMm.x*d.x+
    m.pointModelMm.y*d.y+m.pointModelMm.z*d.z;
   assert.equal(m.observerDepthMm,expect);
   assert.ok(['occluded','clear','undetermined'].includes(m.pointRayOcclusion));
   assert.equal(m.pointRayScope,'only-supplied-convex-halfspaces');
  }
 }
 assert.ok(j.groups.some(g=>g.members.length>1));
});
test('overlapping projected coincident vertices with equal depth remain ambiguous',()=>{
 const other=box('Other',0,2);
 const j=joins({geometry:[back,other],revision:205});
 const g=j.groups.find(x=>x.view==='H'&&
  x.projectedModelMm.u===0&&x.projectedModelMm.v===0);
 assert.equal(g.same3DPoint,false);
 assert.equal(g.listedVertexDepthOrderVerified,false);
 assert.equal(g.nearestListedSourceVertexKey,null);
 assert.equal(g.jointVisibilityCertified,false);
});
test('existing M5 scene and human-confirmed V7 project receive depth-scoped join evidence but no V5',()=>{
 const proof=scene({geometry,revision:206});
 assert.equal(proof.projectedVertexJoins.status,'scoped-projected-coincidences-only');
 assert.equal(proof.projectedVertexJoins.revision,206);
 assert.equal(proof.completeContourVerified,false);
 assert.equal(proof.v5Ready,false);
 const session=createUnifiedProjectSession();
 try{
  session.loadInputs({projectId:'JoinProject',revision:206,
   task:'composition',source:{imageId:'ReviewedOriginal'},
   totalRelationCount:0,relations:[],
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Condition'+g.id,objectId:g.id,
    sourceCandidateId:null,confirmed:true,value:{type:'manual-geometry',
     imageId:'ReviewedOriginal',unit:'mm',geometry:g}}))
  });
  const result=session.solve();
  assert.equal(result.sceneDepthEvidence.projectedVertexJoins.sourceVertexCount,16);
  assert.equal(result.verified,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
test('open meshes, duplicate identities and stale source revisions cannot mint a verified 3D join',()=>{
 const bad=box('Open',0,2);bad.data.faces.pop();
 assert.throws(()=>joins({geometry:[back,bad],revision:17}));
 assert.throws(()=>joins({geometry:[back,back],revision:17}));
 assert.throws(()=>joins({geometry,revision:-1}));
 const result=scene({geometry:[back,bad],revision:17});
 assert.equal(result.status,'not-covered');
 assert.equal(result.projectedVertexJoins.status,'not-covered');
});
