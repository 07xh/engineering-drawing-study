'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditC1ExactConvexOriginalOpenEdgeRays}=
 require('../../workbench/c1-exact-convex-original-open-edge-ray.cjs');
const edges=[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']];
const faces=[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']];
const geometry={
 id:'C1SkewTetra',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:{x:0,y:0,z:0},B:{x:17,y:1,z:3},
  C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}},edges,faces}
};
const source=(a,b)=>geometry.id+'::'+[a,b].sort().join('|');
const nativeFaceAdjacency={
 schema:'draftai-c1-original-occt-brep-face-edge-adjacency/1',
 sourceGeometryId:geometry.id,
 allOriginalBRepSourceEdgesNativeFaceAdjacencyVerified:true,
 generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
 faces:faces.map((face,i)=>({originalM0FaceIndex:i,
  originalM0BoundarySourceEdgeIds:face.map((a,j)=>
   source(a,face[(j+1)%face.length])).sort()})),
 edges:edges.map(([a,b])=>({sourceEdgeId:source(a,b),
  originalM0AdjacentFaceIndices:faces.flatMap((f,i)=>
   f.some((p,j)=>source(p,f[(j+1)%f.length])===source(a,b))?[i]:[])
 })).sort((a,b)=>a.sourceEdgeId.localeCompare(b.sourceEdgeId))
};
const expected={
 V:['visible','hidden','visible','hidden','visible','hidden'],
 H:['visible','visible','visible','visible','visible','visible'],
 W:['visible','visible','visible','visible','visible','visible']
};
function nativeM4(){
 return Object.fromEntries(Object.entries(expected).map(([view,classes])=>
  [view,{nativeOriginal3DM4Candidates:edges.map(([a,b],i)=>({
   view,sourceEdgeId:source(a,b),
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
   M4OriginalUnitIntervalCandidateCoverageComplete:true,
   native3DOriginalParameterPositiveGaps:[],
   native3DOriginalParameterPositiveOverlaps:[],
   M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
   segments:[{view,sourceEdgeId:source(a,b),
    native3DHLRClass:classes[i]+'-sharp',
    originalM0UnitParameterRange:[0,1],
    derivedFromOriginalNative3DCurveNotGeneratedHLRPaper:true,
    generated2DHLREdgeTopologyProven:false}]
  }))}]));
}
test('exact M0 convex all-face open-edge rays agree with independently known tetra classes',()=>{
 const result=auditC1ExactConvexOriginalOpenEdgeRays({
  geometry,nativeFaceAdjacency,nativeM4Views:nativeM4()
 });
 assert.equal(result.status,'audited');
 assert.equal(result.exactOriginalClosedConvexSupportingHalfspacesProven,true);
 assert.equal(result.counts.exactOpenEdgeNativeClassAgreements,18);
 assert.equal(result.counts.heldSourceViewRows,0);
 assert.equal(result.counts.originalVisibleClosedEndpointRayRowsCertified,15);
 assert.deepEqual(Object.fromEntries(Object.entries(result.views).map(([v,rows])=>
  [v,rows.map(x=>x.exactOriginalOpenEdgeOpaqueFaceRayClass)])),
  Object.fromEntries(Object.entries(expected).map(([v,rows])=>
   [v,rows.map(x=>x+'-sharp')])));
 assert.ok(Object.values(result.views).flat().every(x=>
  x.originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified===true&&
  x.generated2DTopoDSHistoryCertified===false&&
  x.originalClosedEndpointRayCertified===
   (x.exactOriginalOpenEdgeOpaqueFaceRayClass==='visible-sharp')&&
  x.engineeringLineStyle==='undetermined'&&x.signedV5Action===false));
 assert.equal(result.signedV5ActionCount,0);
});
test('opposite native class cannot borrow an exact face-ray certificate',()=>{
 const m=nativeM4();
 m.V.nativeOriginal3DM4Candidates[0].segments[0].native3DHLRClass='hidden-sharp';
 const r=auditC1ExactConvexOriginalOpenEdgeRays({
  geometry,nativeFaceAdjacency,nativeM4Views:m
 });
 assert.equal(r.counts.exactOpenEdgeNativeClassAgreements,17);
 assert.equal(r.views.V[0].originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified,false);
 assert.equal(r.views.V[0].reason,'native-3d-class-or-exact-parameter-not-certified');
});
test('a positive one-ULP native parameter gap remains held',()=>{
 const m=nativeM4(),row=m.H.nativeOriginal3DM4Candidates[0];
 row.segments=[{...row.segments[0],originalM0UnitParameterRange:[0,0.5]},
  {...row.segments[0],originalM0UnitParameterRange:[0.5000000000000001,1]}];
 const r=auditC1ExactConvexOriginalOpenEdgeRays({
  geometry,nativeFaceAdjacency,nativeM4Views:m
 });
 assert.equal(r.counts.exactOpenEdgeNativeClassAgreements,17);
 assert.equal(r.views.H[0].originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('forged native face adjacency cannot certify an original 3D ray',()=>{
 const fake=structuredClone(nativeFaceAdjacency);
 fake.edges[0].originalM0AdjacentFaceIndices=[0,0];
 assert.throws(()=>auditC1ExactConvexOriginalOpenEdgeRays({
  geometry,nativeFaceAdjacency:fake,nativeM4Views:nativeM4()
 }),/native BRep face topology/);
});
test('one strict exterior face certifies a convex open edge despite another tangent face, but negative tangent stays held',()=>{
 const tangent=structuredClone(geometry);
 tangent.data.points={A:{x:0,y:0,z:0},B:{x:1,y:0,z:0},
  C:{x:0,y:1,z:0},D:{x:0,y:0,z:1}};
 const m=nativeM4();
 const r=auditC1ExactConvexOriginalOpenEdgeRays({
  geometry:tangent,nativeFaceAdjacency,nativeM4Views:m
 });
 const ab=source('A','B');
 const visible=r.views.V.find(row=>row.sourceEdgeId===ab);
 assert.ok(visible.exactIncidentOutwardObserverSigns.includes(0));
 assert.ok(visible.exactIncidentOutwardObserverSigns.some(sign=>sign>0));
 assert.equal(visible.exactOriginalOpenEdgeOpaqueFaceRayClass,'visible-sharp');
 assert.equal(visible.originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified,true);
 assert.equal(visible.originalClosedEndpointRayCertified,true);
 assert.ok(r.counts.exactTangentStrictExteriorRowsCertified>0);
 const held=r.views.H.find(row=>row.sourceEdgeId===ab);
 assert.ok(held.exactIncidentOutwardObserverSigns.includes(0));
 assert.ok(held.exactIncidentOutwardObserverSigns.some(sign=>sign<0));
 assert.equal(held.originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified,false);
 assert.equal(held.originalClosedEndpointRayCertified,false);
 assert.equal(held.engineeringLineStyle,'undetermined');
 const wrong=nativeM4();
 wrong.V.nativeOriginal3DM4Candidates[0].segments[0].native3DHLRClass='hidden-sharp';
 const mismatch=auditC1ExactConvexOriginalOpenEdgeRays({
  geometry:tangent,nativeFaceAdjacency,nativeM4Views:wrong
 });
 assert.equal(mismatch.views.V.find(row=>row.sourceEdgeId===ab).
  originalOpenEdgeAllFaceContinuousRayAndNativeClassCertified,false);
 assert.equal(mismatch.views.V.find(row=>row.sourceEdgeId===ab).
  originalClosedEndpointRayCertified,false);
 assert.equal(mismatch.signedV5ActionCount,0);
 assert.equal(r.signedV5ActionCount,0);
});
test('degenerate source geometry and tangential observer cannot become full proof',()=>{
 const degenerate=structuredClone(geometry);
 degenerate.data.points.D={...degenerate.data.points.A};
 const held=auditC1ExactConvexOriginalOpenEdgeRays({
  geometry:degenerate,nativeFaceAdjacency,nativeM4Views:nativeM4()
 });
 assert.equal(held.status,'held');
 assert.equal(held.counts.exactOpenEdgeNativeClassAgreements,0);
 const tangent=structuredClone(geometry);
 tangent.data.points={A:{x:0,y:0,z:0},B:{x:1,y:0,z:0},
  C:{x:0,y:1,z:0},D:{x:0,y:0,z:1}};
 const r=auditC1ExactConvexOriginalOpenEdgeRays({
  geometry:tangent,nativeFaceAdjacency,nativeM4Views:nativeM4()
 });
 assert.equal(r.status,'audited');
 assert.ok(r.counts.exactTangentFaceRayRows>0);
 assert.ok(r.counts.heldSourceViewRows>0);
 assert.equal(r.signedV5ActionCount,0);
});
