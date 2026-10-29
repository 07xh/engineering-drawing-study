'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {reviewC2BoundaryPhysicalJunctions:review}=
 require('../../project/c2-boundary-physical-junction-review.cjs');
const p=(x,y,z)=>({x,y,z}),V=point=>project(point).V;
function fixture(depthAlias=false){
 const a=p(0,0,0),b=p(10,0,0),c=p(10,0,10);
 const q=depthAlias?p(10,5,0):b;
 const r=depthAlias?p(10,5,10):c;
 const sourceGeometryIds=['BoxA','BoxB'],revision=113;
 const boundaries=[
  {id:'B1',view:'V',revision,from:V(a),to:V(b),officialV5Approved:false},
  {id:'B2',view:'V',revision,from:V(q),to:V(r),officialV5Approved:false}
 ];
 const rayEvidence=boundaries.map((edge,i)=>({
  id:edge.id,view:'V',revision,officialV5Approved:false,
  paperPieces:[{fromT:0,toT:1,
   exactCurrentPhysicalSourceAndOpenRayCorroborated:true,
   sourceGroupIds:['Group'+(i+1)],
   unprovenLocalSourceOrRayReason:null,
   completeClosedEndpointAndGlobalVisibilityCertified:false,
   officialV5Approved:false}]
 }));
 const lines=[[a,b],[q,r]].map((endpoints,i)=>({
  paperGroupId:'Group'+(i+1),revision,view:'V',
  projectedFromModelMm:V(endpoints[0]),
  projectedToModelMm:V(endpoints[1]),
  selectedWholeSource3DBooleanExteriorOpenFeatureVerified:true,
  rayStatus:'scoped-continuous-front-ray-clear',
  physical3DEndpointIncidence:endpoints.map(point=>({
   physicalSource3DPoint:point
  }))
 }));
 const nodes=[a,b,c,q,r].filter((n,i,all)=>all.findIndex(k=>
  k.x===n.x&&k.y===n.y&&k.z===n.z)===i).map(point3D=>({point3D}));
 const physicalJunctionEvidence={
  status:'source-recomputed-physical-3d-feature-incidence',
  revision,sourceGeometryIds,nodes
 };
 return {revision,sourceGeometryIds,sourceBoundaries:boundaries,
  boundaryRayEvidence:rayEvidence,paperLines:lines,
  physicalJunctionEvidence};
}
test('same paper endpoint with exact same verified real 3D source is not merely a 2D coincidence',()=>{
 const r=review(fixture());
 assert.equal(r.schema,'draftai-c2-first-angle-paper-versus-real-3d-junction-ledger/1');
 assert.equal(r.paperJunctionCount,3);
 assert.equal(r.exactPhysical3DSourceNodeCount,1);
 assert.equal(r.paperOnlyDifferent3DSourceAliasCount,0);
 assert.equal(r.unresolvedPhysicalSourceJoinCount,2);
 const joint=r.nodes.find(n=>n.paperPoint.u===10&&n.paperPoint.v===0);
 assert.equal(joint.incidentBoundaryCount,2);
 assert.equal(joint.realOriginalOrGenerated3DJunctionNodeListed,true);
 assert.equal(joint.exactSame3DSourceEndpointCandidateAtAllIncidences,true);
 assert.equal(joint.officialV5JunctionAuthorized,false);
 assert.equal(r.officialV5Authorized,false);
});
test('identical first-angle V paper endpoint but different real 3D depths MUST be an alias',()=>{
 const r=review(fixture(true));
 assert.equal(r.paperJunctionCount,3);
 assert.equal(r.exactPhysical3DSourceNodeCount,0);
 assert.equal(r.paperOnlyDifferent3DSourceAliasCount,1);
 const alias=r.nodes.find(n=>n.paperPoint.u===10&&n.paperPoint.v===0);
 assert.equal(alias.distinctReal3DEndpointCandidateCount,2);
 assert.equal(alias.paperOnlyDifferent3DDepthOrLocationAliasDetected,true);
 assert.equal(alias.realOriginalOrGenerated3DJunctionNodeListed,false);
 assert.equal(alias.globalClosedEndpointAndStandardLineStylesProven,false);
 assert.equal(r.allRegionBoundaryEndpointsAccountedFor,true);
});
test('stale revision and incorrect projection of alleged real M5 endpoint fail closed',()=>{
 const x=fixture();
 x.paperLines[1].revision++;
 assert.throws(()=>review(x),/outdated/);
 const y=fixture();
 y.paperLines[0].physical3DEndpointIncidence[1].physicalSource3DPoint=p(9,0,0);
 assert.throws(()=>review(y),/contradicts/);
});
