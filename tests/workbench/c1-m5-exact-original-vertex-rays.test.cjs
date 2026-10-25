'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {verifiedConvexMeshHalfspaces}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {originalVertexRayProof}=
 require('../../core/numeric/convex-incident-source-open-ray.cjs');
const {auditC1ExactOriginalVertexObserverRays:audit}=
 require('../../workbench/c1-m5-exact-original-vertex-rays.cjs');
const p=(x,y,z)=>({x,y,z});
const box=()=>({...prismMesh({solid:{min:p(0,0,0),
 max:p(10,10,10)}}),id:'C1ExactVertexBox'});
const tetra=()=>({id:'C1ExactVertexObliqueTetra',kind:'mesh',
 space:'model-3d',unit:'mm',data:{
  points:{A:p(0,0,0),B:p(10,0,0),C:p(0,0,10),D:p(2,8,2)},
  edges:[['A','B'],['A','C'],['A','D'],
   ['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]
 }});
test('exact cube front original vertex ray clear; back tangent cannot masquerade as entering strict interior',()=>{
 const g=box(),proof=verifiedConvexMeshHalfspaces(g);
 const a=originalVertexRayProof({geometry:g,
  sourceVertexId:'V000',view:'V',convexProof:proof});
 assert.equal(a.status,'certified-clear');
 assert.equal(a.positiveForwardRayClear,true);
 assert.equal(a.exactFullOriginalConvexSupportChecked,true);
 assert.equal(a.endpointAndCrossSourceJoinCertified,false);
 const b=originalVertexRayProof({geometry:g,
  sourceVertexId:'V010',view:'V',convexProof:proof});
 assert.equal(b.status,'undetermined');
 assert.equal(b.positiveForwardRayClear,false);
 assert.equal(b.strictInteriorNearOriginalVertex,false);
 assert.ok(b.tangentIncidentFaceCount>0);
 assert.equal(b.v5Ready,false);
});
test('genuine tetra rear apex ray strictly enters solid near original vertex; its front vertex ray clears',()=>{
 const g=tetra(),proof=verifiedConvexMeshHalfspaces(g);
 const rear=originalVertexRayProof({geometry:g,
  sourceVertexId:'D',view:'V',convexProof:proof});
 assert.equal(rear.status,'certified-strictly-inside-near-original-vertex');
 assert.equal(rear.strictInteriorNearOriginalVertex,true);
 assert.equal(rear.exactFullOriginalConvexSupportChecked,true);
 assert.equal(rear.completeMultiSolidSceneCertified,false);
 assert.equal(rear.endpointAndCrossSourceJoinCertified,false);
 const front=originalVertexRayProof({geometry:g,
  sourceVertexId:'A',view:'V',convexProof:proof});
 assert.equal(front.positiveForwardRayClear,true);
 assert.equal(front.officialLineStyleVerified,false);
});
test('V/H/W every ORIGINAL vertex is audited with exact proof without falsely joining paper source lines',()=>{
 for(const g of [box(),tetra()]){
  const result=audit({geometry:g,revision:27});
  assert.equal(result.counts.originalVertexViewRayCount,
   Object.keys(g.data.points).length*3);
  assert.equal(result.counts.originalVertexViewRayCount,
   result.counts.exactWholeForwardOpenRayClearCount+
   result.counts.exactStrictInteriorNearVertexCount+
   result.counts.tangentOrDegenerateUnresolvedCount);
  assert.equal(result.signedV5ActionCount,0);
  assert.equal(result.allM4ProjectedPaperCutJunctionsResolved,false);
  assert.ok(result.rows.every(x=>x.signedV5Action===false&&
   x.proof.v5Ready===false&&
   x.proof.endpointAndCrossSourceJoinCertified===false));
  assert.ok(Object.isFrozen(result));
 }
});
test('near-coplanar source face may pass tolerant M0 but cannot acquire exact binary64 all-face vertex theorem',()=>{
 const g=box();
 const points={...g.data.points,V111:{
  ...g.data.points.V111,
  z:g.data.points.V111.z+Math.pow(2,-34)}};
 const near={...g,id:'C1AlmostPlanarVertex',
  data:{...g.data,points}};
 const proof=verifiedConvexMeshHalfspaces(near);
 assert.equal(proof.status,'validated-closed-convex-mesh');
 const result=originalVertexRayProof({geometry:near,
  sourceVertexId:'V000',view:'V',convexProof:proof});
 assert.equal(result.status,'undetermined');
 assert.equal(result.exactFullOriginalConvexSupportChecked,false);
 assert.match(result.reason,/non-exact-planar/);
});
test('fake source vertex IDs and stale or unsupported geometry do not receive exact endpoint visibility',()=>{
 const g=box(),proof=verifiedConvexMeshHalfspaces(g);
 assert.throws(()=>originalVertexRayProof({geometry:g,
  sourceVertexId:'Unknown',view:'V',convexProof:proof}),/source vertex/);
 assert.throws(()=>originalVertexRayProof({geometry:g,
  sourceVertexId:'V000',view:'X',convexProof:proof}),/source vertex/);
 assert.throws(()=>audit({geometry:g,revision:0}),/revision/);
 const bad={...g,data:{...g.data,faces:g.data.faces.slice(1)}};
 assert.throws(()=>audit({geometry:bad,revision:10}),/closed|face|Euler/);
});
