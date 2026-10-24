'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {deriveReviewedProjectedVertexJoins:joins}=
 require('../../workbench/reviewed-projected-vertex-joins.cjs');
const {evaluateReviewedConvexMeshDepth:scene}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexPointRayClearance:check}=
 require('../../core/numeric/convex-point-ray-clearance.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,zmin,zmax){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(10*x,10*y,z?zmax:zmin);
 const ids=Object.keys(points),edges=[];
 for(const [i,a]of ids.entries())for(const b of ids.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces:[
   ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
   ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
   ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ]}};
}
const lower=box('Lower',0,2),upper=box('Upper',4,6),geometry=[lower,upper];
test('M5 positive source vertex clear is independently checked for EVERY confirmed solid',()=>{
 const evidence=joins({geometry,revision:222});
 const solids=geometry.map(g=>({id:g.id,halfspaces:verifiedConvexMeshHalfspaces(g).halfspaces}));
 let positive=0,notPositive=0;
 for(const group of evidence.groups){
  for(const vertex of group.members){
   const verified=solids.map(solid=>check({
    point:vertex.pointModelMm,
    observerDirection:FIRST_ANGLE_OBSERVER_RAYS[group.view],solid
   }));
   assert.deepEqual(vertex.positiveOpenRayClearSolidIds,
    verified.filter(x=>x.status==='certified-clear').map(x=>x.solidId));
   assert.equal(vertex.positiveOpenRayClearWithinReviewedSolids,
    verified.every(x=>x.status==='certified-clear'));
   assert.equal(vertex.positiveRayProofScope,
    'only-all-explicit-closed-convex-mesh-set');
   assert.equal(vertex.projectedPointVisibilityCertified,false);
   assert.equal(vertex.visibleJoinCertified,false);
   if(vertex.positiveOpenRayClearWithinReviewedSolids)positive++;
   else notPositive++;
  }
 }
 assert.ok(positive>0);
 assert.ok(notPositive>0);
 assert.equal(evidence.endpointVisibilityVerified,false);
 assert.equal(evidence.officialLineStylesVerified,false);
});
test('listed nearest vertex alone cannot certify a global multi-object projection junction',()=>{
 const e=joins({geometry,revision:223});
 const H=e.groups.find(g=>g.view==='H'&&
  g.projectedModelMm.u===0&&g.projectedModelMm.v===0);
 assert.equal(H.memberCount,4);
 assert.equal(H.nearestListedSourceVertexKey,'Upper::V001');
 assert.equal(H.members[0].positiveOpenRayClearWithinReviewedSolids,true);
 assert.ok(H.members.some(x=>x.positiveOpenRayClearWithinReviewedSolids===false));
 assert.equal(H.distinct3DPointsShareProjection,true);
 assert.equal(H.jointVisibilityCertified,false);
 assert.equal(H.projectedJunctionLineStyleCertified,false);
});
test('existing full-scene M5 mathematical partition remains unpromoted after added point-ray witness',()=>{
 const e=scene({geometry,revision:225});
 assert.equal(e.projectedStrokePartitions.status,'preview-partition-evidence-only');
 assert.equal(e.projectedVertexJoins.status,'scoped-projected-coincidences-only');
 assert.equal(e.frontmostOpenContours.v5Ready,false);
 assert.equal(e.officialLineStylesVerified,false);
 assert.equal(e.v5Ready,false);
});
test('actual reviewed V7 project keeps revision and does not acquire a new V5 player',()=>{
 const s=createUnifiedProjectSession();
 try{
  s.loadInputs({task:'composition',projectId:'PositiveVertex',revision:226,
   source:{imageId:'CurrentPhoto'},relations:[],totalRelationCount:0,
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Cond'+g.id,objectId:g.id,
    confirmed:true,sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'CurrentPhoto',unit:'mm',geometry:g}}))
  });
  const result=s.solve();
  assert.ok(result.sceneDepthEvidence.projectedVertexJoins.groups.some(g=>
   g.members.some(m=>m.positiveOpenRayClearWithinReviewedSolids)));
  assert.equal(result.verified,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  assert.equal(result.scopedMotionParity.v5Ready,false);
  s.invalidate();
  assert.equal(s.readSnapshot(),null);
 }finally{s.dispose();}
});
test('open source mesh and mixed 2D geometry never issue the new positive point evidence',()=>{
 const bad=box('Invalid',0,2);bad.data.faces.pop();
 const e=scene({geometry:[lower,bad],revision:228});
 assert.equal(e.status,'not-covered');
 assert.equal(e.projectedVertexJoins.status,'not-covered');
 assert.throws(()=>joins({geometry:[lower,bad],revision:228}));
});
