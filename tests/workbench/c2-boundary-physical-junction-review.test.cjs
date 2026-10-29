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
 const segments=[[a,b],[q,r]].map(([source3DFrom,source3DTo],i)=>({
  id:'RealPhysical'+(i+1),source3DFrom,source3DTo,
  sourcePhysicalFeatureOpenIntervalVerified:true
 }));
 const nodes=[a,b,q,r].filter((n,i,all)=>all.findIndex(k=>
  k.x===n.x&&k.y===n.y&&k.z===n.z)===i).map(point3D=>{
  const incidences=segments.filter(seg=>[seg.source3DFrom,seg.source3DTo]
   .some(pt=>['x','y','z'].every(k=>pt[k]===point3D[k])))
   .map(seg=>({segmentId:seg.id}));
  return {point3D,incidences,incidentSegmentCount:incidences.length,
   original3DPhysicalCoincidenceVerified:true,
   localMultiSourcePhysicalJunctionCandidate:incidences.length>=2};
 });
 const physicalJunctionEvidence={
  status:'source-recomputed-physical-3d-feature-incidence',
  revision,sourceGeometryIds,nodes,segments
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
 assert.equal(joint.independentPhysical3DIncidentSegmentsVerified,true);
 assert.equal(joint.distinctCanonicalPaperSourceGroupsVerified,true);
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
test('C2 rejects a paper join whose matching 3D source has only ONE incident source feature',()=>{
 const x=fixture();
 const junction=x.physicalJunctionEvidence.nodes.find(n=>
  n.point3D.x===10&&n.point3D.y===0&&n.point3D.z===0);
 junction.incidentSegmentCount=1;
 junction.localMultiSourcePhysicalJunctionCandidate=false;
 const reviewed=review(x);
 const corner=reviewed.nodes.find(n=>n.paperPoint.u===10&&n.paperPoint.v===0);
 assert.equal(corner.exactSame3DSourceEndpointCandidateAtAllIncidences,true,
  'matching spatial coordinates do not establish an actual joined feature');
 assert.equal(corner.sourceLedgerMultiFeatureJunctionVerified,false);
 assert.equal(corner.realOriginalOrGenerated3DJunctionNodeListed,false);
 assert.equal(corner.unresolvedReal3DJunctionIncidence,true);
 assert.equal(reviewed.exactPhysical3DSourceNodeCount,0);
 assert.equal(reviewed.officialV5Authorized,false);
});
test('C2 paper junction cannot reuse ONE physical source group as two independent boundary edges',()=>{
 const x=fixture();
 // Paper B2 has the same projected endpoint as B1, but its ray witness
 // references B1's SAME canonical group instead of an independently
 // authenticated group for B2. The real multi-source M5 node alone cannot
 // prove that these particular projected boundaries are connected.
 x.boundaryRayEvidence[1].paperPieces[0].sourceGroupIds=['Group1'];
 const out=review(x),joint=out.nodes.find(n=>
  n.paperPoint.u===10&&n.paperPoint.v===0);
 assert.equal(joint.exactSame3DSourceEndpointCandidateAtAllIncidences,false,
  'a perpendicular line may touch the vertex but cannot prove this boundary');
 assert.equal(joint.distinctCanonicalPaperSourceGroupsVerified,false);
 assert.equal(joint.incidences[1].allClaimedSourceGroupsReachPositiveBoundaryEndpoint,false);
 assert.equal(joint.sourceLedgerMultiFeatureJunctionVerified,false);
 assert.equal(joint.realOriginalOrGenerated3DJunctionNodeListed,false);
 assert.equal(joint.unresolvedReal3DJunctionIncidence,true);
 assert.equal(out.exactPhysical3DSourceNodeCount,0);
 assert.equal(out.officialV5Authorized,false);
});
test('C2 ambiguous multiple overlapping source groups do not identify one edge per boundary',()=>{
 const x=fixture();
 x.boundaryRayEvidence[0].paperPieces[0].sourceGroupIds=['Group1','Group2'];
 const out=review(x),joint=out.nodes.find(n=>
  n.paperPoint.u===10&&n.paperPoint.v===0);
 assert.equal(joint.exactSame3DSourceEndpointCandidateAtAllIncidences,false);
 assert.equal(joint.distinctCanonicalPaperSourceGroupsVerified,false);
 assert.equal(joint.realOriginalOrGenerated3DJunctionNodeListed,false);
});
test('C2 physical junction must match THESE exact paper source segments, not unrelated incident ledger edges',()=>{
 const x=fixture(),junction=x.physicalJunctionEvidence.nodes.find(n=>
  n.point3D.x===10&&n.point3D.y===0&&n.point3D.z===0);
 assert.equal(junction.incidentSegmentCount,2);
 // Deliberately substitute one unrelated physical edge ending at the SAME
 // real 3D junction while retaining the authenticated local node count.
 x.physicalJunctionEvidence.segments[0].source3DFrom=p(10,0,5);
 const result=review(x),joint=result.nodes.find(n=>
  n.paperPoint.u===10&&n.paperPoint.v===0);
 assert.equal(joint.exactSame3DSourceEndpointCandidateAtAllIncidences,true);
 assert.equal(joint.distinctCanonicalPaperSourceGroupsVerified,true);
 assert.equal(joint.independentPhysical3DIncidentSegmentsVerified,false);
 assert.equal(joint.realOriginalOrGenerated3DJunctionNodeListed,false);
 assert.equal(result.exactPhysical3DSourceNodeCount,0);
 assert.equal(result.officialV5Authorized,false);
});
test('C2 M5 physical source ledger must retain real finite current segments',()=>{
 const noSegment=fixture();
 noSegment.physicalJunctionEvidence.segments=[];
 const result=review(noSegment);
 assert.equal(result.exactPhysical3DSourceNodeCount,0);
 const bad=fixture();
 bad.physicalJunctionEvidence.segments[0].source3DFrom={
  ...bad.physicalJunctionEvidence.segments[0].source3DFrom,y:Infinity
 };
 assert.throws(()=>review(bad),/physical source segment ledger is incomplete/);
 const forged=fixture();
 forged.physicalJunctionEvidence.segments[0].sourcePhysicalFeatureOpenIntervalVerified=false;
 assert.throws(()=>review(forged),/physical source segment ledger is incomplete/);
});
test('C2 rejects a perpendicular source group despite its exact common 3D endpoint',()=>{
 const x=fixture();
 const b=p(10,0,0),vertical=p(10,0,5),line=x.paperLines[0];
 line.projectedFromModelMm=V(b);
 line.projectedToModelMm=V(vertical);
 line.physical3DEndpointIncidence=[
  {physicalSource3DPoint:b},{physicalSource3DPoint:vertical}];
 const r=review(x),j=r.nodes.find(n=>n.paperPoint.u===10&&n.paperPoint.v===0);
 assert.equal(j.incidentBoundaryCount,2);
 assert.equal(j.realOriginalOrGenerated3DJunctionNodeListed,false);
 assert.equal(j.incidences[0].allClaimedSourceGroupsReachPositiveBoundaryEndpoint,false);
 assert.equal(j.incidences[0].unresolvedReason,
  'source-group-not-bound-to-positive-boundary-endpoint');
 assert.equal(r.exactPhysical3DSourceNodeCount,0);
 assert.equal(r.officialV5Authorized,false);
});
test('C2 rejects an outward-facing source at a boundary endpoint, even with exact 3D identity',()=>{
 const x=fixture(),b=p(10,0,0),outward=p(20,0,0),line=x.paperLines[0];
 line.projectedFromModelMm=V(b);
 line.projectedToModelMm=V(outward);
 line.physical3DEndpointIncidence=[
  {physicalSource3DPoint:b},{physicalSource3DPoint:outward}];
 const r=review(x),j=r.nodes.find(n=>n.paperPoint.u===10&&n.paperPoint.v===0);
 assert.equal(j.realOriginalOrGenerated3DJunctionNodeListed,false);
 assert.equal(j.incidences[0].allClaimedSourceGroupsReachPositiveBoundaryEndpoint,false);
 assert.equal(r.officialV5Authorized,false);
});
test('C2 rejects non-contiguous, overlapped, reversed and zero ray pieces in [0,1]',()=>{
 const variations=[
  [[0,.4],[.5,1]],
  [[0,.6],[.5,1]],
  [[0,.8],[.8,.7],[.7,1]],
  [[0,0],[0,1]],
  [[0,Number.NaN],[Number.NaN,1]]
 ];
 for(const spans of variations){
  const x=fixture(),old=x.boundaryRayEvidence[0].paperPieces[0];
  x.boundaryRayEvidence[0].paperPieces=spans.map(([fromT,toT])=>
   ({...old,fromT,toT}));
  assert.throws(()=>review(x),/boundary\/ray identity mismatch/,
   'every positive paper parameter must be covered exactly once');
 }
});
test('C2 near-critical or non-positive M5 source ledger may not certify a 3D junction',()=>{
 const x=fixture();
 const n=x.physicalJunctionEvidence.nodes.find(n=>
  n.point3D.x===10&&n.point3D.y===0&&n.point3D.z===0);
 n.localMultiSourcePhysicalJunctionCandidate=false;
 const result=review(x);
 assert.equal(result.exactPhysical3DSourceNodeCount,0);
 assert.equal(result.unresolvedPhysicalSourceJoinCount,3);
});
test('C2 alias must have BOTH independent actual 3D endpoints in recomputed source ledger',()=>{
 const x=fixture(true);
 x.physicalJunctionEvidence.nodes=x.physicalJunctionEvidence.nodes.filter(n=>
  !(n.point3D.x===10&&n.point3D.y===5&&n.point3D.z===0));
 const result=review(x),joint=result.nodes.find(n=>
  n.paperPoint.u===10&&n.paperPoint.v===0);
 assert.equal(joint.distinctReal3DEndpointCandidateCount,2);
 assert.equal(joint.paperOnlyDifferent3DDepthOrLocationAliasDetected,false);
 assert.equal(joint.unresolvedReal3DJunctionIncidence,true);
 assert.equal(result.paperOnlyDifferent3DSourceAliasCount,0);
});
test('C2 must validate hidden 3D coordinate even when visible paper x,z are finite',()=>{
 const x=fixture();
 x.paperLines[0].physical3DEndpointIncidence[1].physicalSource3DPoint=
  p(10,Number.NaN,0);
 assert.throws(()=>review(x),/nonfinite hidden axis/);
 const y=fixture();
 y.physicalJunctionEvidence.nodes[1].point3D.y=Number.NaN;
 assert.throws(()=>review(y),/junction ledger is incomplete/);
});
test('stale revision and incorrect projection of alleged real M5 endpoint fail closed',()=>{
 const x=fixture();
 x.paperLines[1].revision++;
 assert.throws(()=>review(x),/outdated/);
 const y=fixture();
 y.paperLines[0].physical3DEndpointIncidence[1].physicalSource3DPoint=p(9,0,0);
 assert.throws(()=>review(y),/contradicts/);
});
