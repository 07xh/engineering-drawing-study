'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1NativeGapOriginalExactRays:audit}=
 require('../../workbench/c1-native-gap-original-exact-rays.cjs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
const tetra=()=>({id:'C1SkewTetra',kind:'mesh',space:'model-3d',
 unit:'mm',data:{
  points:{A:P(0,0,0),B:P(17,1,3),C:P(3,16,2),D:P(5,6,23)},
  edges:[['A','B'],['A','C'],['A','D'],
   ['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],
   ['A','C','D'],['B','C','D']]
 }});
const box=()=>({...prismMesh({solid:{min:P(0,0,0),max:P(10,10,10)}}),
 id:'C1NativeGapExactRayBox'});
const id=(g,e)=>g.id+'::'+[...e].sort().join('|');
function fixture(g,missing){
 const cad={schema:'draftai-c1-ocjs-real-visible-brep/1',
  engine:'opencascade.js',sourceGeometryId:g.id,revision:19,
  completeSourceTopology3DEndpointCorrespondence:true,
  actualOCCTCurveTypeIndependentlyVerified:true,
  actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified:false,
  lineStyleCertified:false,v5Authorized:false,
  originalBRepSourceEdges:g.data.edges.map(e=>{
   const [a,b]=e.map(x=>g.data.points[x]);
   return {sourceEdgeId:id(g,e),
    occtSourceCurveParameterRange:[0,Math.hypot(
     b.x-a.x,b.y-a.y,b.z-a.z)],
    occtSourceCurveFirstPoint3D:a,occtSourceCurveLastPoint3D:b,
    originalOCCTBRepVertexXYZMatched:true,
    occtCurveTypeIndependentlyVerified:true,
    occtSourceCurve3DEndpointsAndMidpointVerified:true,
    occtSourceCurveType:'line'};
  }),views:{V:[],H:[],W:[]},hiddenSharpViews:{V:[],H:[],W:[]}};
 const m5Ledger={schema:'draftai-c1-ocjs-m5-convex-proof-gap-ledger/1',
  sourceGeometryId:g.id,revision:19,engine:'opencascade.js',
  realCadSourceCandidateOnly:true,officialLineStylesVerified:false,
  wholeSolidV5Ready:false,signedV5ActionCount:0,
  views:{V:{intervals:[]},H:{intervals:[]},W:{intervals:[]}}};
 for(const [view,e,range] of missing){
  const sourceEdgeId=id(g,e);
  m5Ledger.views[view].intervals.push({
   view,sourceEdgeId,engineeringLineStyle:'undetermined',signedV5:false,
   realNativeOriginal3DSourceParameterCovered:false,
   exactNativeOriginal3DSourceCoverage:{
    sourceEdgeId,view,originalSourceParameterRange:[0,1],
    entireOriginalParameterIntervalCovered:false,
    positiveLengthUncoveredIntervals:[range],
    status:'exact-original-3d-native-source-positive-gap',
    engineeringLineStyle:'undetermined',signedV5Action:false}
  });
 }
 return {geometry:g,cad,m5Ledger};
}
test('skew tetra: all three tiny real-shaped HLR gaps receive independently recomputed M0 rays, but no HLR history',()=>{
 const g=tetra(),input=fixture(g,[
  ['H',['A','C'],[0,5.02742501717052e-18]],
  ['W',['A','C'],[0,1.1102230246251565e-16]],
  ['W',['A','D'],[0,9.431983218054427e-18]]
 ]);
 const out=audit(input);
 assert.equal(out.counts.positiveNativeGapIntervals,3);
 assert.equal(out.rows.length,3);
 assert.equal(out.counts.nativeGeneratedHistoryGapsClosed,0);
 assert.equal(out.counts.independentOriginalOCCTCurvePositiveGapIntervals,3);
 assert.equal(out.counts.unrepresentedOriginalM0SourceViews,15);
 assert.equal(out.missingOriginalM0SourceViewRows.length,15);
 assert.equal(out.allNoncollapsedOriginalM0SourcesRepresentedInM5,false);
 assert.ok(out.missingOriginalM0SourceViewRows.every(row=>
  row.missingM5SourceViewRemainsUncovered===true&&
  row.generatedTopoDSToOriginalSourceHistoryCertified===false&&
  row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));
 assert.ok(out.rows.every(row=>row.independentOriginalOCCTCurveGapPositive===true));
 assert.equal(out.allNativeHLRSourceGapsClosed,false);
 assert.equal(out.globalContinuousVisibilityCertified,false);
 assert.ok(out.rows.every(row=>row.original3DVertexIds[0]==='A'&&
  row.originalSourceParameterGap[0]===0&&
  row.originalSourceParameterGap[1]>0&&
  row.nativeHLRGeneratedEdgeCoversGap===false&&
  row.generatedTopoDSToOriginalSourceHistoryCertified===false&&
  row.engineeringLineStyle==='undetermined'&&row.signedV5Action===false));
 assert.equal(out.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(out.rows[0].originalSourceParameterGap));
});
test('box: genuine front convex physical source has positive exact CLOSED ray proof across an unsampled one-ULP gap',()=>{
 const g=box(),range=[0,Number.MIN_VALUE];
 const out=audit(fixture(g,[['V',['V000','V001'],range]]));
 assert.equal(out.counts.positiveNativeGapIntervals,1);
 assert.equal(out.counts.exactOriginalClosedRayClearGapIntervals,1);
 const row=out.rows[0];
 assert.equal(row.independentOriginal3DExactRayStatus,'exact-original-closed-ray-clear');
 assert.equal(row.exactOriginal3DRayProvenThroughoutOpenGap,true);
 assert.equal(row.exactOriginal3DRayProvenAtBothOriginalVertices,true);
 assert.equal(row.originalM4SourcePartitionComplete,true);
 assert.equal(row.nativeHLRGeneratedEdgeCoversGap,false);
 assert.equal(out.officialV5Authorized,false);
});
test('back/tangent source cannot borrow front exact ray proof and cannot authorize V5',()=>{
 const g=box(),out=audit(fixture(g,[
  ['V',['V010','V011'],[0,Number.MIN_VALUE]]
 ]));
 assert.equal(out.counts.exactOriginalClosedRayClearGapIntervals,0);
 assert.equal(out.rows[0].exactOriginal3DRayProvenAtBothOriginalVertices,false);
 assert.equal(out.rows[0].nativeHLRGeneratedEdgeCoversGap,false);
 assert.equal(out.rows[0].signedV5Action,false);
});
test('incomplete convex topology and altered native source range fail closed',()=>{
 const g=tetra(),input=fixture(g,[['H',['A','C'],[0,1e-18]]]);
 const bad=structuredClone(input);
 bad.geometry.data.faces.pop();
 assert.throws(()=>audit(bad),/closed|Euler|face|convex/);
 const wrong=structuredClone(input);
 wrong.m5Ledger.views.H.intervals[0].
  exactNativeOriginal3DSourceCoverage.positiveLengthUncoveredIntervals=[[0,0]];
 assert.throws(()=>audit(wrong),/positive|gap|interval/);
 const wrongRevision=structuredClone(input);
 wrongRevision.m5Ledger.revision++;
 assert.throws(()=>audit(wrongRevision),/current unsigned/);
});

test('original M0 sources absent from M5 are reconciled with real HLR paper aliases but never signed',()=>{
 const g=tetra(),sourceEdgeId=id(g,['A','C']);
 const input=fixture(g,[['H',['A','C'],[0,1e-18]]]);
 input.cad.views.V.push({
  from:{u:0,v:0},to:{u:3,v:2},
  sourceCandidate3DLifts:[{sourceEdgeId}],
  engineeringLineStyle:'undetermined',v5Authorized:false
 });
 const out=audit(input);
 const missing=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.ok(missing);
 assert.equal(missing.nativeHLRPaperCandidateCount,1);
 assert.deepEqual(missing.nativeHLRPaperCandidates,
  [{hlrClass:'visible-sharp',ordinal:0}]);
 assert.equal(missing.originalM4SourcePartitionComplete,true);
 assert.equal(missing.generatedTopoDSToOriginalSourceHistoryCertified,false);
 assert.equal(missing.globalCoProjectedFrontmostSourceCertified,false);
 assert.equal(out.counts.unrepresentedM0SourceViewsWithNativeHLRPaperCandidates,1);
 assert.equal(out.officialV5Authorized,false);
});
test('collapsed original source projection is not falsely treated as missing drawable M5 evidence',()=>{
 const g=box(),out=audit(fixture(g,[
  ['V',['V000','V001'],[0,Number.MIN_VALUE]]
 ]));
 assert.ok(out.counts.unrepresentedOriginalM0SourceViews>0);
 assert.ok(out.missingOriginalM0SourceViewRows.every(row=>
  row.missingM5SourceViewRemainsUncovered===true));
 assert.equal(out.counts.unrepresentedOriginalM0SourceViews,
  out.missingOriginalM0SourceViewRows.length);
 assert.equal(out.counts.nativeGeneratedHistoryGapsClosed,0);
 assert.equal(out.signedV5ActionCount,0);
});
