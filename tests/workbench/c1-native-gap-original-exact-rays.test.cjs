'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1NativeGapOriginalExactRays:audit,
 exactOriginal3DVertexOnSourceSegment:on3DSource}=
 require('../../workbench/c1-native-gap-original-exact-rays.cjs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project}=require('../../core/projection/conventions.js');
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
 assert.equal(out.counts.noncollapsedOriginalM0SourceViews,18);
 assert.equal(out.counts.representedOriginalM0SourceViewsInM5,3);
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

test('reversed native BRep parameter and sub-ULP rounded gap retain exact positive original curve and unsigned ray',()=>{
 const g=tetra(),input=fixture(g,[
  ['H',['A','C'],[0,1e-18]]
 ]);
 const source=input.cad.originalBRepSourceEdges.find(x=>
  x.sourceEdgeId===id(g,['A','C']));
 const originalFirst=source.occtSourceCurveFirstPoint3D;
 source.occtSourceCurveFirstPoint3D=source.occtSourceCurveLastPoint3D;
 source.occtSourceCurveLastPoint3D=originalFirst;
 const length=source.occtSourceCurveParameterRange[1];
 source.occtSourceCurveParameterRange=[100,100+length];
 const out=audit(input);
 assert.equal(out.counts.independentOriginalOCCTCurvePositiveGapIntervals,1);
 assert.equal(out.rows[0].independentOriginalOCCTCurveGapPositive,true);
 assert.equal(out.rows[0].originalOCCTCurveGapRoundedToZero,true);
 assert.equal(out.rows[0].nativeHLRGeneratedEdgeCoversGap,false);
 assert.equal(out.rows[0].generatedTopoDSToOriginalSourceHistoryCertified,false);
 assert.equal(out.rows[0].engineeringLineStyle,'undetermined');
 assert.equal(out.rows[0].signedV5Action,false);
});

test('entire M5 source ledger absent: all noncollapsed M0 views remain explicit unsigned obligations',()=>{
 const g=tetra(),out=audit(fixture(g,[]));
 assert.equal(out.counts.positiveNativeGapIntervals,0);
 assert.equal(out.counts.independentOriginalOCCTCurvePositiveGapIntervals,0);
 assert.equal(out.counts.noncollapsedOriginalM0SourceViews,18);
 assert.equal(out.counts.representedOriginalM0SourceViewsInM5,0);
 assert.equal(out.counts.unrepresentedOriginalM0SourceViews,18);
 assert.equal(out.missingOriginalM0SourceViewRows.length,18);
 assert.equal(out.allNoncollapsedOriginalM0SourcesRepresentedInM5,false);
 assert.ok(out.missingOriginalM0SourceViewRows.every(x=>
  x.missingM5SourceViewRemainsUncovered===true&&
  x.generatedTopoDSToOriginalSourceHistoryCertified===false&&
  x.signedV5Action===false));
 assert.equal(out.officialV5Authorized,false);
});

test('omitted original M0 convex front source crosschecks real native HLR classes without signing',()=>{
 const g=box(),input=fixture(g,[]),edge=['V000','V001'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 const segment={from,to,sourceCandidate3DLifts:[{sourceEdgeId}]};
 input.cad.views.V.push(structuredClone(segment));
 input.cad.hiddenSharpViews.V.push(structuredClone(segment));
 input.cad.nativeSourceScopedSharpOutputByView={V:{nativeSourceIdentityConflicts:{rows:[
  {view:'V',hlrClass:'visible-sharp',nativeWholeSolidEdgeOrdinal:0,
   originalPhysicalSourceEdgeId:sourceEdgeId,nativeScopedGeneratedEdgeIsSame:true},
  {view:'V',hlrClass:'hidden-sharp',nativeWholeSolidEdgeOrdinal:0,
   originalPhysicalSourceEdgeId:sourceEdgeId,nativeScopedGeneratedEdgeIsSame:true}
 ]}}};
 const out=audit(input);
 const row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.original3DRayStatus,'exact-original-closed-ray-clear');
 assert.equal(row.expectedHLRClassFromIndependentOriginalRay,'visible-sharp');
 assert.equal(row.exactBinary64PaperVisibleHiddenCandidateConflict.
  hasExactPositiveLengthVisibleHiddenPaperClassConflict,true);
 assert.deepEqual(row.exactBinary64PaperVisibleHiddenCandidateConflict.
  exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals,[['0','1']]);
 assert.equal(row.paperClassConflictCannotCertifyGlobal3DDepthOrVisibility,true);
 assert.deepEqual(row.nativeHLRCandidateExactBinary64AndRayDiagnostics.map(x=>
  [x.hlrClass,x.exactBinary64PaperAffineAligned,
   x.exactBinary64PaperWithinOriginalParameterDomain,
   x.sourceScopedGeneratedIsSameOwnerClaim,
   x.classConsistentWithIndependentWholeOriginal3DRay]),[
  ['visible-sharp',true,true,true,true],
  ['hidden-sharp',true,true,true,false]
 ]);
 assert.equal(out.counts.omittedNativeHLRPaperCandidateDiagnostics.nativeOwnerRayClassConsistent,1);
 assert.equal(out.counts.omittedNativeHLRPaperCandidateDiagnostics.nativeOwnerRayClassContradictions,1);
 assert.equal(out.counts.nativeGeneratedHistoryGapsClosed,0);
 assert.equal(out.globalContinuousVisibilityCertified,false);
 assert.equal(out.signedV5ActionCount,0);
});
test('one-subnormal-ULP paper alias drift and out-of-domain source interval remain visible',()=>{
 const g=tetra(),input=fixture(g,[]),edge=['A','C'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 input.cad.views.V.push({from:{u:-Number.MIN_VALUE,v:from.v},to,
  sourceCandidate3DLifts:[{sourceEdgeId}]});
 const out=audit(input);
 const row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.nativeHLRPaperCandidateCount,1);
 const diagnostic=row.nativeHLRCandidateExactBinary64AndRayDiagnostics[0];
 assert.equal(diagnostic.exactBinary64PaperAffineAligned,false);
 assert.equal(diagnostic.exactBinary64PaperAffineCrossProductDyadic.length,2);
 assert.ok(diagnostic.exactBinary64PaperAffineCrossProductDyadic.some(x=>
  x.numerator!=='0'&&Number.isSafeInteger(x.exponent2)));
 assert.equal(diagnostic.exactBinary64PaperWithinOriginalParameterDomain,false);
 assert.equal(diagnostic.sourceScopedGeneratedIsSameOwnerClaim,false);
 assert.equal(out.counts.omittedNativeHLRPaperCandidateDiagnostics.exactAffineDrift,1);
 assert.equal(out.counts.omittedNativeHLRPaperCandidateDiagnostics.exactParameterDomainFailures,1);
 assert.equal(out.officialV5Authorized,false);
});
test('co-projected native owner from another M0 edge cannot borrow exact 3D ray identity',()=>{
 const g=tetra(),input=fixture(g,[]),edge=['A','C'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 input.cad.views.V.push({from,to,sourceCandidate3DLifts:[{sourceEdgeId}]});
 input.cad.nativeSourceScopedSharpOutputByView={V:{nativeSourceIdentityConflicts:{rows:[
  {view:'V',hlrClass:'visible-sharp',nativeWholeSolidEdgeOrdinal:0,
   originalPhysicalSourceEdgeId:id(g,['A','D']),
   nativeScopedGeneratedEdgeIsSame:true}
 ]}}};
 const out=audit(input);
 const row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.nativeHLRCandidateExactBinary64AndRayDiagnostics[0].
  sourceScopedGeneratedIsSameOwnerClaim,false);
 assert.equal(row.nativeHLRCandidateExactBinary64AndRayDiagnostics[0].
  nativeGeneratedEdgeClaimedByDifferentOriginalSource,true);
 assert.equal(out.counts.omittedNativeHLRPaperCandidateDiagnostics.nativeIsSameOwnerClaims,0);
 assert.equal(out.signedV5ActionCount,0);
});

test('two exact paper aliases can cover omitted M0 source while native owner history remains absent',()=>{
 const g=box(),input=fixture(g,[]),edge=['V000','V001'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 const middle={u:(from.u+to.u)/2,v:(from.v+to.v)/2};
 for(const [a,b] of [[from,middle],[middle,to]])
  input.cad.views.V.push({from:a,to:b,
   sourceCandidate3DLifts:[{sourceEdgeId}]});
 const out=audit(input);
 const row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.allPaperAliasCandidateExactBinary64Coverage.
  exactBinary64PaperCandidateCoverageComplete,true);
 assert.equal(row.nativeScopedOwnerCandidateExactBinary64Coverage.
  exactBinary64PaperCandidateCoverageComplete,false);
 assert.deepEqual(row.nativeScopedOwnerCandidateExactBinary64Coverage.
  exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1']]);
 assert.equal(row.exactPaperCoverageIsNotNativeSourceParameterCoverage,true);
 assert.equal(row.missingM5SourceViewRemainsUncovered,true);
 assert.equal(out.allNativeHLRSourceGapsClosed,false);
 assert.equal(out.signedV5ActionCount,0);
});
test('one subnormal ULP gap in omitted source exact paper union cannot be rounded away',()=>{
 const g=box(),input=fixture(g,[]),edge=['V000','V001'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 const axis=from.u!==to.u?'u':'v';
 assert.equal(from[axis],0);
 const start={...from,[axis]:Math.sign(to[axis]-from[axis])*Number.MIN_VALUE};
 input.cad.views.V.push({from:start,to,
  sourceCandidate3DLifts:[{sourceEdgeId}]});
 const out=audit(input);
 const row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.nativeHLRCandidateExactBinary64AndRayDiagnostics[0].
  exactBinary64PaperAffineAligned,true);
 assert.equal(row.nativeHLRCandidateExactBinary64AndRayDiagnostics[0].
  exactBinary64PaperWithinOriginalParameterDomain,true);
 const coverage=row.allPaperAliasCandidateExactBinary64Coverage;
 assert.equal(coverage.exactBinary64PaperCandidateCoverageComplete,false);
 assert.equal(coverage.exactBinary64PaperPositiveLengthUncoveredIntervals.length,1);
 assert.equal(coverage.exactBinary64PaperPositiveLengthUncoveredIntervals[0][0],'0');
 assert.notEqual(coverage.exactBinary64PaperPositiveLengthUncoveredIntervals[0][1],'0');
 assert.equal(row.missingM5SourceViewRemainsUncovered,true);
 assert.equal(out.officialV5Authorized,false);
});

test('visible/hidden candidate paper classes touching only at endpoint do not overlap positively',()=>{
 const g=box(),input=fixture(g,[]),edge=['V000','V001'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 const middle={u:(from.u+to.u)/2,v:(from.v+to.v)/2};
 input.cad.views.V.push({from,to:middle,sourceCandidate3DLifts:[{sourceEdgeId}]});
 input.cad.hiddenSharpViews.V.push({from:middle,to,
  sourceCandidate3DLifts:[{sourceEdgeId}]});
 const out=audit(input);
 const row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.allPaperAliasCandidateExactBinary64Coverage.
  exactBinary64PaperCandidateCoverageComplete,true);
 assert.equal(row.exactBinary64PaperVisibleHiddenCandidateConflict.
  hasExactPositiveLengthVisibleHiddenPaperClassConflict,false);
 assert.deepEqual(row.exactBinary64PaperVisibleHiddenCandidateConflict.
  exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals,[]);
 assert.equal(out.officialV5Authorized,false);
});

test('native IsSame original vertex at different depth vetoes a false HLR paper source alias',()=>{
 const g=box(),input=fixture(g,[]),edge=['V000','V001'],
  sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 // V010 and V011 have the SAME V paper points as V000 and V001,
 // but lie 10 mm deeper along Y: their actual 3D source is different.
 assert.deepEqual(project(g.data.points.V010).V,from);
 assert.deepEqual(project(g.data.points.V011).V,to);
 input.cad.views.V.push({from,to,sourceCandidate3DLifts:[{sourceEdgeId}],
  directNativeVertexOriginalSource:['V010','V011'].map(vertex=>({
   directlySameOriginalM0VertexId:vertex,
   directOriginal3DVertexTopoDSIdentityProven:true
  }))});
 const out=audit(input),row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.nativeHLRCandidateExactBinary64AndRayDiagnostics[0].
  nativeEndpoint3DSourceStatus,'contradicted-by-native-original-vertex');
 assert.equal(row.nativeHLRCandidateExactBinary64AndRayDiagnostics[0].
  nativeOriginal3DVertexContradictionCount,2);
 assert.equal(row.allPaperAliasCandidateExactBinary64Coverage.
  exactBinary64PaperCandidateCoverageComplete,false);
 assert.equal(out.counts.omittedNativeHLRPaperCandidateDiagnostics.
  nativeEndpoint3DContradictoryPaperAliases,1);
 assert.equal(out.officialV5Authorized,false);
});

test('native IsSame endpoints on the same original 3D source are positive vertex incidence, not generated edge history',()=>{
 const g=box(),input=fixture(g,[]),edge=['V000','V001'],
  sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 input.cad.views.V.push({from,to,sourceCandidate3DLifts:[{sourceEdgeId}],
  directNativeVertexOriginalSource:edge.map(vertex=>({
   directlySameOriginalM0VertexId:vertex,
   directOriginal3DVertexTopoDSIdentityProven:true
  }))});
 const out=audit(input),row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.nativeHLRCandidateExactBinary64AndRayDiagnostics[0].
  nativeEndpoint3DSourceStatus,'positive-original-vertex-incidence-only');
 assert.equal(row.nativeHLRCandidateExactBinary64AndRayDiagnostics[0].
  nativeOriginal3DVertexIncidenceCount,2);
 assert.equal(row.allPaperAliasCandidateExactBinary64Coverage.
  exactBinary64PaperCandidateCoverageComplete,true);
 assert.equal(row.nativeScopedOwnerCandidateExactBinary64Coverage.
  exactBinary64PaperCandidateCoverageComplete,false);
 assert.equal(out.counts.omittedNativeHLRPaperCandidateDiagnostics.
  nativeEndpoint3DConsistentPaperAliases,1);
 assert.equal(out.officialV5Authorized,false);
});

test('forged native IsSame original vertex paper mismatch and unbound identity fail closed',()=>{
 const g=box(),edge=['V000','V001'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 for(const witness of [
  {directlySameOriginalM0VertexId:'V100',
   directOriginal3DVertexTopoDSIdentityProven:true},
  {directlySameOriginalM0VertexId:null,
   directOriginal3DVertexTopoDSIdentityProven:true},
  {directlySameOriginalM0VertexId:'V000',
   directOriginal3DVertexTopoDSIdentityProven:false}
 ]){
  const input=fixture(g,[]);
  input.cad.views.V.push({from,to,sourceCandidate3DLifts:[{sourceEdgeId}],
   directNativeVertexOriginalSource:[witness,{
    directlySameOriginalM0VertexId:null,
    directOriginal3DVertexTopoDSIdentityProven:false
   }]});
  assert.throws(()=>audit(input),/native|Top[oD]DS|vertex|identity/);
 }
});

test('exact 3D source incidence preserves one-subnormal-ULP transverse offset',()=>{
 const a=P(0,0,0),b=P(1,0,0);
 assert.equal(on3DSource(a,b,P(0.5,0,0)),true);
 assert.equal(on3DSource(a,b,P(0.5,Number.MIN_VALUE,0)),false);
 assert.equal(on3DSource(a,b,P(0.5,0,Number.MIN_VALUE)),false);
 assert.equal(on3DSource(a,b,P(1+Number.EPSILON,0,0)),false);
 assert.equal(on3DSource(b,a,P(0.5,0,0)),true);
 assert.equal(on3DSource(b,a,P(1+Number.EPSILON,0,0)),false);
 assert.throws(()=>on3DSource(a,a,P(0,0,0)),/collapsed/);
 assert.throws(()=>on3DSource(a,b,P(Infinity,0,0)),/finite/);
});

test('exact front original 3D ray excludes co-projected hidden HLR paper aliases without altering raw OCCT class evidence',()=>{
 const g=box(),input=fixture(g,[]),edge=['V000','V001'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 const alias={from,to,sourceCandidate3DLifts:[{sourceEdgeId}]};
 input.cad.views.V.push(structuredClone(alias));
 input.cad.hiddenSharpViews.V.push(structuredClone(alias));
 const out=audit(input),row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.expectedHLRClassFromIndependentOriginalRay,'visible-sharp');
 assert.equal(row.exactBinary64PaperVisibleHiddenCandidateConflict.
  hasExactPositiveLengthVisibleHiddenPaperClassConflict,true);
 assert.equal(row.rayCompatibleOriginal3DSourcePaperVisibility.
  hasExactPositiveLengthVisibleHiddenPaperClassConflict,false);
 assert.equal(row.rayCompatibleOriginal3DSourcePaperCoverage.
  exactBinary64PaperCandidateCoverageComplete,true);
 assert.equal(row.rayCompatibleCandidateCount,1);
 assert.deepEqual(row.nativeHLRCandidateExactBinary64AndRayDiagnostics.map(x=>
  x.oppositeClassExcludedAsThisOriginal3DSourceByExactRay),[false,true]);
 assert.equal(out.counts.omittedNativeHLRPaperCandidateDiagnostics.
  rayExcludedOppositeHLRClassPaperAliases,1);
 assert.equal(out.counts.omittedNativeHLRPaperCandidateDiagnostics.
  rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews,0);
 assert.equal(row.generatedTopoDSToOriginalSourceHistoryCertified,false);
 assert.equal(out.officialV5Authorized,false);
});

test('hidden-only whole-paper alias cannot cover an independently clear original 3D source',()=>{
 const g=box(),input=fixture(g,[]),edge=['V000','V001'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 input.cad.hiddenSharpViews.V.push({from,to,sourceCandidate3DLifts:[{sourceEdgeId}]});
 const out=audit(input),row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.allPaperAliasCandidateExactBinary64Coverage.
  exactBinary64PaperCandidateCoverageComplete,true);
 assert.equal(row.rayCompatibleOriginal3DSourcePaperCoverage.
  exactBinary64PaperCandidateCoverageComplete,false);
 assert.deepEqual(row.rayCompatibleOriginal3DSourcePaperCoverage.
  exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1']]);
 assert.equal(row.rayCompatibleCandidateCount,0);
 assert.equal(row.missingM5SourceViewRemainsUncovered,true);
 assert.equal(row.engineeringLineStyle,'undetermined');
 assert.equal(out.signedV5ActionCount,0);
});

test('half visible and half opposite-class aliases retain exact positive source-specific gap',()=>{
 const g=box(),input=fixture(g,[]),edge=['V000','V001'],sourceEdgeId=id(g,edge);
 const [from,to]=edge.map(vertex=>project(g.data.points[vertex]).V);
 const mid={u:(from.u+to.u)/2,v:(from.v+to.v)/2};
 input.cad.views.V.push({from,to:mid,sourceCandidate3DLifts:[{sourceEdgeId}]});
 input.cad.hiddenSharpViews.V.push({from:mid,to,sourceCandidate3DLifts:[{sourceEdgeId}]});
 const out=audit(input),row=out.missingOriginalM0SourceViewRows.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.allPaperAliasCandidateExactBinary64Coverage.
  exactBinary64PaperCandidateCoverageComplete,true);
 assert.equal(row.exactBinary64PaperVisibleHiddenCandidateConflict.
  hasExactPositiveLengthVisibleHiddenPaperClassConflict,false);
 assert.equal(row.rayCompatibleOriginal3DSourcePaperCoverage.
  exactBinary64PaperCandidateCoverageComplete,false);
 assert.deepEqual(row.rayCompatibleOriginal3DSourcePaperCoverage.
  exactBinary64PaperPositiveLengthUncoveredIntervals,[['1/2','1']]);
 assert.equal(row.generatedTopoDSToOriginalSourceHistoryCertified,false);
 assert.equal(out.officialV5Authorized,false);
});
