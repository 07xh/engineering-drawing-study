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
   edge(2,[2,3],B,{x:7,y:4,z:5})
  ])
 }),/same TopoDS vertex|source/);
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
