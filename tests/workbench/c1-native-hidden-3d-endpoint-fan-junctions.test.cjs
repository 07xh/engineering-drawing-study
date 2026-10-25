'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {witnessHiddenHLRCandidateOriginal3DEndpoint:witness}=
 require('../../workbench/c1-native-hidden-3d-endpoint-fan-junctions.cjs');
const geometry={id:'G',data:{points:{
 A:{x:0,y:0,z:0},B:{x:10,y:0,z:0},
 C:{x:0,y:0,z:9},D:{x:12,y:0,z:9}
}}};
const eId='G::A|B',rev=77,view='H',edge=['A','B'];
const point=t=>({x:10*t,y:0,z:0});
const lift=(t0,t1)=>({
 sourceEdgeId:eId,originalVertexIds:['A','B'],
 sourceParameterAtProjectedFrom:t0,sourceParameterAtProjectedTo:t1,
 fromCandidate3D:point(t0),toCandidate3D:point(t1),
 actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
 originalOCCTSourceLineCurveVerified:true,
 originalXYZReprojectsToHLR:true,v5Authorized:false
});
const stars=()=>new Map(['A','B'].map((id,i)=>[
 view+'@'+id,{
  sourceGeometryId:'G',revision:rev,view,original3DVertexId:id,
  original3DModelPoint:geometry.data.points[id],
  oneConnectedOriginal3DVertexFaceFanProven:true,
  allIncidentSourceEdgesExactlyTwoOriginalFaceIncidencesProven:true,
  signedV5Action:false,
  incidentOriginalSourceEdges:[{
   originalSourceEdgeId:eId,otherOriginal3DVertexId:i?'A':'B',
   original3DEndpointConfirmedByM4:true
  }]
 }
]));
const call=(t0,t1,side,ledger=stars())=>witness({
 geometry,revision:rev,view,sourceEdge:edge,sourceLift:lift(t0,t1),
 side,nativeProjected:project(point(side==='from'?t0:t1))[view],
 vertexStarByKey:ledger
});
test('native hidden candidate true original endpoint joins the authentic closed 3D face fan and M4 physical endpoint',()=>{
 const a=call(0,1,'from');
 const b=call(0,1,'to');
 assert.equal(a.originalSource3DVertexId,'A');
 assert.equal(b.originalSource3DVertexId,'B');
 assert.equal(a.original3DSourceVertexPlusM4AndFanVerified,true);
 assert.equal(b.original3DSourceVertexPlusM4AndFanVerified,true);
 assert.ok(a.projectedOtherOriginal3DVertexIdsNotJoined.includes('C'));
 assert.ok(b.projectedOtherOriginal3DVertexIdsNotJoined.includes('D'));
 for(const row of [a,b]){
  assert.equal(row.nativeHLRGeneratedTopoDSEndpointToOriginalTopoDSIdentityCertified,false);
  assert.equal(row.nativeHLRNativeEdgeToAnotherHLREdgeJoinCertified,false);
  assert.equal(row.standardEngineeringLineStyle,'undetermined');
  assert.equal(row.constructionIntentAuthorized,false);
  assert.equal(row.signedV5Action,false);
 }
});
test('paper middle cut is a legitimate 3D original source point but not a 3D vertex',()=>{
 const r=call(.25,.75,'from');
 assert.equal(r.originalSourceParameter,0.25);
 assert.equal(r.originalSource3DVertexId,null);
 assert.equal(r.exactOriginalM0ParameterIsSourceVertex,false);
 assert.equal(r.original3DSourceVertexPlusM4AndFanVerified,false);
});
test('one ULP from zero NEVER becomes original vertex by visual snapping',()=>{
 const t=Number.EPSILON;
 const r=call(t,.9,'from');
 assert.equal(r.originalSource3DVertexId,null);
 assert.equal(r.original3DSourceVertexPlusM4AndFanVerified,false);
});
test('real original 3D vertex fan alone is not sufficient if M4 endpoint is missing',()=>{
 const ledger=stars();
 ledger.get('H@A').incidentOriginalSourceEdges[0].original3DEndpointConfirmedByM4=false;
 const r=call(0,1,'from',ledger);
 assert.equal(r.originalSource3DVertexId,'A');
 assert.equal(r.independentlyVerifiedOriginal3DClosedFaceFan,true);
 assert.equal(r.original3DSourceVertexPlusM4AndFanVerified,false);
});
test('false or stale original 3D vertex fan identity fails closed',()=>{
 const ledger=stars();ledger.get('H@A').original3DModelPoint={x:0,y:0,z:123};
 assert.throws(()=>call(0,1,'from',ledger),/missing correct original/);
 const ledger2=stars();ledger2.get('H@B').revision=rev-1;
 assert.throws(()=>call(0,1,'to',ledger2),/missing correct original/);
});
test('native CAD 3D source lift with forged paper endpoint or OCCT verification rejected',()=>{
 const c=lift(0,1);
 c.toCandidate3D={x:7,y:0,z:0};
 assert.throws(()=>witness({geometry,revision:rev,view,
  sourceEdge:edge,sourceLift:c,side:'to',
  nativeProjected:project(point(1))[view],vertexStarByKey:stars()}),
 /endpoint XYZ\/parameter\/paper/);
 const forged=lift(0,1);forged.originalOCCTSourceLineCurveVerified=false;
 assert.throws(()=>witness({geometry,revision:rev,view,
  sourceEdge:edge,sourceLift:forged,side:'to',
  nativeProjected:project(point(1))[view],vertexStarByKey:stars()}),
 /not independently original 3D OCCT/);
});
