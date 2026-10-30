'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC2GeneratedResultProjectedM4M5}=
 require('../../workbench/c2-native-generated-global-m4-m5.cjs');
const {originalBoxGeometry}=
 require('../../workbench/c2-native-occt-generated-ray-m5.cjs');
const {verifiedConvexMeshHalfspaces}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const parts=[
 {id:'CubeA',type:'box',min:[0,0,0],max:[4,4,4]},
 {id:'CubeB',type:'box',min:[5,0,0],max:[9,4,4]}
];
const solids=parts.map(p=>{
 const g=originalBoxGeometry(p);
 return {id:g.id,halfspaces:verifiedConvexMeshHalfspaces(g).halfspaces};
});
function edge(id,verts,from,to,feature='coplanar-subdivision'){
 return {finalTopoDSEdgeOrdinal:id,
  actualNativeTopoDSVertexOrdinals:verts,
  real3DModelMmEndpoints:[from,to],
  currentNativeResultFeatureStatus:feature};
}
const A={x:0,y:0,z:0},B={x:4,y:4,z:0},
 C={x:0,y:4,z:5},D={x:4,y:0,z:5};
const report=edges=>({sourceRevision:1,outputEdges:edges});
test('reuses original M4 crossing and preserves real 3D paper-only disconnection',()=>{
 const result=auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,
  nativeReport:report([edge(1,[1,2],A,B),edge(2,[3,4],C,D)])
 });
 assert.equal(result.actualM4PairwiseSegmentViewChecks,3);
 assert(result.exactM4TransverseProjectedCrossings>=1);
 assert.equal(result.provenOriginalNative3DVertexMeetings,0);
 assert(result.paperOnlyMeetingsKeptSeparate>=1);
 const h=result.rows.find(x=>x.view==='H'&&x.sourceNativeResultEdgeOrdinal===1);
 assert.deepEqual(h.cuts,[0,0.5,1]);
 assert.equal(h.subspans.length,2);
 assert(h.subspans.every(x=>x.officialEngineeringLineStyle==='undetermined'));
 assert.equal(result.allOfficialEngineeringLinesCertified,false);
 assert.equal(result.fullOriginalConstructionIntentDAGSingleV5Authorized,false);
});
test('an actual same-run TopoDS vertex ID, not 2D point overlap, proves a join',()=>{
 const E={x:8,y:4,z:0};
 const result=auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,
  nativeReport:report([edge(1,[1,2],A,B),edge(2,[2,3],B,E)])
 });
 assert(result.provenOriginalNative3DVertexMeetings>0);
 assert.equal(result.sourceResultEdgeCount,2);
});
test('same genuine vertex label but disconnected 3D endpoints must hard-fail',()=>{
 assert.throws(()=>auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,
  nativeReport:report([
   edge(1,[1,2],A,B),
   edge(2,[2,3],{x:4,y:4,z:5},{x:7,y:4,z:5})
  ])
 }),/same TopoDS vertex|shared native TopoDS vertex|source/);
});
test('missing native edge, duplicate ID and nonpositive segment stay rejected',()=>{
 assert.throws(()=>auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,nativeReport:report([edge(1,[1,2],A,B)])
 }),/bounded native/);
 assert.throws(()=>auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,
  nativeReport:report([edge(1,[1,2],A,B),edge(1,[3,4],C,D)])
 }),/untrusted native result/);
});

test('global native TopoDS vertex identity rejects mismatched 3D ownership even without a paper crossing',()=>{
 // The forged shared vertex #2 is different in all of the raw 3D
 // coordinates; pairwise HLR paper intersection discovery need not
 // enumerate a common point for this inconsistency to be fatal.
 const first=edge(1,[1,2],
  {x:0,y:0,z:0},{x:2,y:2,z:2},'physical-crease');
 const second=edge(2,[2,3],
  {x:30,y:31,z:32},{x:35,y:36,z:37},'physical-crease');
 assert.throws(()=>auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,nativeReport:report([first,second])
 }),/shared native TopoDS vertex has inconsistent actual 3D coordinates/);
});
test('native output TopoDS shared endpoint mapping is globally conserved across V/H/W',()=>{
 const p={x:4,y:4,z:0};
 const result=auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,nativeReport:report([
   edge(1,[1,2],A,p,'physical-crease'),
   edge(2,[2,3],p,{x:8,y:4,z:0},'physical-crease'),
   edge(3,[2,4],p,{x:4,y:4,z:6},'physical-crease')
  ])
 });
 assert.equal(result.independentlyAccountedNative3DVertexCount,4);
 assert.equal(result.actualNative3DVertexEndpointIncidenceCount,6);
 assert.equal(result.allNativeEdgeEndpointVertexIncidencesGloballyReconciled,true);
 assert.equal(result.rows.length,9);
 assert.equal(result.allOfficialEngineeringLinesCertified,false);
});
test('native output may not substitute duplicate result edge ordinal or a different endpoint vertex ID',()=>{
 assert.throws(()=>auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,
  nativeReport:report([
   edge(1,[1,2],A,B),edge(1,[2,3],B,D)
  ])
 }),/untrusted native result/);
 const distinct=auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,
  nativeReport:report([
   edge(1,[1,2],A,B),edge(2,[3,4],B,D)
  ])
 });
 assert.equal(distinct.independentlyAccountedNative3DVertexCount,4,
  'equal 3D coordinates with DIFFERENT TopoDS vertex IDs cannot be silently fused');
});

test('native output edges outside original union input solid volume fail before projected M4 and M5',()=>{
 const boxes=parts;
 const call=outputEdges=>auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,boxes,nativeReport:report(outputEdges)
 });
 // A bounding box enclosing all components is not enough: x=4.5 lies
 // strictly in the GAP, so it belongs to neither original physical solid.
 const gap={x:4.5,y:2,z:2};
 assert.throws(()=>call([
  edge(1,[1,2],{x:0,y:0,z:0},{x:4,y:4,z:0}),
  edge(2,[3,4],gap,{x:6,y:2,z:2})
 ]),/native Boolean result vertex escapes authenticated original source solid volume/);
 const outside={x:100,y:2,z:2};
 assert.throws(()=>call([
  edge(1,[1,2],{x:0,y:0,z:0},{x:4,y:4,z:0}),
  edge(2,[3,4],outside,{x:6,y:2,z:2})
 ]),/native Boolean result vertex escapes authenticated original source solid volume/);
 const valid=call([
  edge(1,[1,2],{x:0,y:0,z:0},{x:4,y:4,z:0}),
  edge(2,[3,4],{x:5,y:2,z:2},{x:6,y:2,z:2})
 ]);
 assert.equal(valid.allNativeResultEndpointsWithinOriginalBooleanInputVolumeVerified,true);
 assert.equal(valid.boundingSourceDomainOperation,'union');
 assert.equal(valid.allOfficialEngineeringLinesCertified,false);
});
test('native subtractive result cannot claim an edge in cutter-only space outside stock',()=>{
 const cut=edges=>auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,boxes:parts,operation:'cut',
  nativeReport:{...report(edges),actualNativeBooleanOperation:'cut'}
 });
 assert.throws(()=>cut([
  edge(1,[1,2],{x:0,y:0,z:0},{x:4,y:4,z:0}),
  edge(2,[3,4],{x:5,y:1,z:1},{x:6,y:1,z:1})
 ]),/native Boolean result vertex escapes authenticated original source solid volume/);
});
test('native source volume check refuses nonfinite, reversed and unbounded source boxes',()=>{
 for(const bounds of [
  {...parts[0],min:[0,NaN,0]},
  {...parts[0],min:[4,0,0]},
  {...parts[0],max:[Infinity,4,4]},
  {...parts[0],max:[1e7,4,4]}
 ]){
  assert.throws(()=>auditC2GeneratedResultProjectedM4M5({
   revision:1,solids,boxes:[bounds,parts[1]],
   nativeReport:report([
    edge(1,[1,2],A,B),edge(2,[3,4],C,D)
   ])
  }),/actual native output source box bounds must be finite and positive/);
 }
});

test('native result rejects a straight bridge through EMPTY SPACE between otherwise valid source endpoints',()=>{
 const bridge=edge(1,[1,2],
  {x:4,y:2,z:2},{x:5,y:2,z:2},'physical-crease');
 const supported=edge(2,[3,4],
  {x:0,y:0,z:0},{x:4,y:4,z:0},'physical-crease');
 // Both bridge endpoints are in one of the boxes and passed the old
 // endpoint-only condition, but all 0<t<1 lies outside their UNION.
 assert.throws(()=>auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,boxes:parts,
  nativeReport:report([bridge,supported])
 }),/edge crosses uncovered original source solid volume/);
});
test('a native edge traversing touching closed source boxes has exact closed source interval coverage',()=>{
 const joinedParts=[
  {...parts[0]},
  {...parts[1],min:[4,0,0],max:[8,4,4]}
 ];
 const joinedSolids=joinedParts.map(p=>{
  const g=originalBoxGeometry(p);
  return {id:g.id,halfspaces:verifiedConvexMeshHalfspaces(g).halfspaces};
 });
 const result=auditC2GeneratedResultProjectedM4M5({
  revision:1,solids:joinedSolids,boxes:joinedParts,
  nativeReport:report([
   edge(1,[1,2],{x:2,y:2,z:2},{x:6,y:2,z:2},'physical-crease'),
   edge(2,[3,4],{x:4,y:1,z:2},{x:4,y:3,z:2},'physical-crease')
  ])
 });
 assert.equal(result.allNativeResultEdgeWholeClosedSpansWithinOriginalBooleanInputVolumeVerified,true);
 assert.equal(result.originalBooleanInputVolumeWholeNativeEdgeCount,2);
 const longitudinal=result.originalNativeResultEdgeClosedSourceVolumeIntervalWitnesses
  .find(w=>w.nativeResultEdgeOrdinal===1);
 assert.equal(longitudinal.allOriginalEdgeParametersCoveredByBooleanInputClosedSolids,true);
 assert.equal(longitudinal.originalSourceBoxParameterSpans.length,2);
 assert.equal(result.allOfficialEngineeringLinesCertified,false);
});
test('whole-native-edge source solid coverage is not claimed without independent input boxes',()=>{
 const result=auditC2GeneratedResultProjectedM4M5({
  revision:1,solids,
  nativeReport:report([
   edge(1,[1,2],A,B),edge(2,[3,4],C,D)
  ])
 });
 assert.equal(result.allNativeResultEdgeWholeClosedSpansWithinOriginalBooleanInputVolumeVerified,false);
 assert.equal(result.originalBooleanInputVolumeWholeNativeEdgeCount,0);
});
