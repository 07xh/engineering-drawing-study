'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1NativeGapGeneratedVertexAdjacency:audit}=
 require('../../workbench/c1-native-gap-generated-vertex-adjacency.cjs');
const geometry={id:'tetra',data:{points:{
 A:{x:0,y:0,z:0},C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}
},edges:[['A','C'],['A','D']]}};
const native=(id)=>({
 directlySameOriginalM0VertexId:id,
 directOriginal3DVertexTopoDSIdentityProven:id!==null});
const segment=(options={})=>({
 view:'H',occtHLRVisibilityClass:'visible-sharp',
 from:{u:0,v:0},to:{u:3,v:16},
 sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
  originalVertexIds:['A','C'],
  paperOnlyUnclampedOriginalSourceParameters:[0,1]}],
 directNativeVertexOriginalSource:[native('A'),native('C')],
 actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven:false,
 ...options
});
const run=(gaps,visible=[segment()],hidden=[],view='H')=>audit({
 geometry,view,sourceEdgeId:'tetra::A|C',
 uncoveredIntervals:gaps,visibleSegments:visible,hiddenSegments:hidden});
test('a genuine native IsSame A vertex is distinct from a paper candidate at t=0 and never fills a source gap',()=>{
 const r=run([[0,5.02742501717052e-18]]);
 assert.equal(r.rows[0].from.nativeGeneratedPaperCandidateParameterEqualCount,1);
 assert.equal(r.rows[0].from.directNativeOriginalVertexIsSameEndpointCount,1);
 assert.equal(r.rows[0].from.directNativeOriginalVertexIsSameAtPaperParameterCount,1);
 assert.equal(r.rows[0].to.nativeGeneratedPaperCandidateParameterEqualCount,0);
 assert.equal(r.rows[0].sourceGapClosedByNativeEndpointEvidence,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('a coincident paper t=0 without real TopoDS vertex IsSame is not A-end topology',()=>{
 const s=segment({directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,1.1102230246251565e-16]],[s]);
 assert.equal(r.rows[0].from.nativeGeneratedPaperCandidateParameterEqualCount,1);
 assert.equal(r.rows[0].from.directNativeOriginalVertexIsSameEndpointCount,0);
 assert.equal(r.actualNativeDirectIsSameOriginalSourceVertexEndpoints,1);
});
test('reversed native generated HLR endpoint order still locates original A identity',()=>{
 const s=segment({from:{u:3,v:16},to:{u:0,v:0},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[1,0]}],
  directNativeVertexOriginalSource:[native('C'),native('A')]});
 const r=run([[0,0.1]],[s]);
 assert.equal(r.rows[0].from.directNativeOriginalVertexIsSameAtPaperParameterCount,1);
 assert.equal(r.endpoints[1].directNativeIsSameOriginalM0VertexId,'A');
});
test('a false native IsSame original A claim at a different paper point is rejected',()=>{
 const s=segment({from:{u:0.01,v:0}});
 assert.throws(()=>run([[0,0.5]],[s]),/contradicts first-angle/);
});
test('duplicate source lifts and inconsistent native identity flags fail closed',()=>{
 const s=segment();
 assert.throws(()=>run([[0,0.5]],[segment({
  sourceCandidate3DLifts:[...s.sourceCandidate3DLifts,...s.sourceCandidate3DLifts]
 })]),/duplicate generated/);
 assert.throws(()=>run([[0,0.5]],[segment({
  directNativeVertexOriginalSource:[{
   directlySameOriginalM0VertexId:'A',
   directOriginal3DVertexTopoDSIdentityProven:false},native('C')]
 })]),/inconsistent generated/);
});
test('invalid gaps and unrelated HLR source candidates never sign V5',()=>{
 for(const gaps of [[[0,0]],[[0,1.1]],[[0,0.5],[0.4,1]]])
  assert.throws(()=>run(gaps),/ordered positive/);
 const unrelated=segment({sourceCandidate3DLifts:[{
  sourceEdgeId:'tetra::A|D',originalVertexIds:['A','D'],
  paperOnlyUnclampedOriginalSourceParameters:[0,1]}]});
 const r=run([[0,0.25]],[unrelated]);
 assert.equal(r.actualNativeGeneratedSourceCandidateEndpointCount,0);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.formalEngineeringLineStyleCertified,false);
 assert.equal(r.constructionIntentAuthorized,false);
 assert.ok(Object.isFrozen(r));
});

test('genuine A paper point is literal but never supplies a positive source gap history',()=>{
 const r=run([[0,5.02742501717052e-18]]);
 assert.equal(r.rows[0].from.nativeGeneratedPaperCandidateParameterEqualCount,1);
 assert.equal(r.rows[0].from.nativeGeneratedLiteralOriginalPaperBoundaryCount,1);
 assert.equal(r.rows[0].from.nativeGeneratedRoundedInverseOriginalBoundaryAliasCount,0);
 assert.equal(r.actualNativeRoundedInverseOriginalBoundaryAliasEndpoints,0);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
});
test('interior subnormal HLR endpoint with rounded t=0 is not a literal M0 A vertex',()=>{
 const s=segment({from:{u:Number.MIN_VALUE,v:0},
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,5.02742501717052e-18]],[s]);
 assert.equal(r.rows[0].from.nativeGeneratedPaperCandidateParameterEqualCount,1);
 assert.equal(r.rows[0].from.nativeGeneratedLiteralOriginalPaperBoundaryCount,0);
 assert.equal(r.rows[0].from.nativeGeneratedRoundedInverseOriginalBoundaryAliasCount,1);
 assert.equal(r.actualNativeRoundedInverseOriginalBoundaryAliasEndpoints,1);
 assert.equal(r.endpoints[0].directNativeIsSameOriginalM0VertexId,null);
 assert.equal(r.signedV5ActionCount,0);
});
test('reversed HLR source and cross-axis paper drift preserve original A-end gap',()=>{
 for(const s of [
  segment({from:{u:3,v:16},to:{u:Number.MIN_VALUE,v:0},
   sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
    originalVertexIds:['A','C'],
    paperOnlyUnclampedOriginalSourceParameters:[1,0]}],
   directNativeVertexOriginalSource:[native('C'),native(null)]}),
  segment({from:{u:0,v:Number.MIN_VALUE},
   directNativeVertexOriginalSource:[native(null),native('C')]})
 ]){
  const r=run([[0,1.1102230246251565e-16]],[s]);
  assert.equal(r.rows[0].from.nativeGeneratedPaperCandidateParameterEqualCount,1);
  assert.equal(r.rows[0].from.nativeGeneratedLiteralOriginalPaperBoundaryCount,0);
  assert.equal(r.rows[0].from.nativeGeneratedRoundedInverseOriginalBoundaryAliasCount,1);
  assert.equal(r.rows[0].sourceGapClosedByNativeEndpointEvidence,false);
  assert.equal(r.formalEngineeringLineStyleCertified,false);
 }
});
test('unbounded paper inverse parameters never count as literal original M0 vertices',()=>{
 const s=segment({sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
  originalVertexIds:['A','C'],
  paperOnlyUnclampedOriginalSourceParameters:[-Number.MIN_VALUE,1]}],
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,0.1]],[s]);
 assert.equal(r.endpoints[0].paperInverseOriginalBoundaryWithinDomain,false);
 assert.equal(r.rows[0].from.nativeGeneratedLiteralOriginalPaperBoundaryCount,0);
 assert.equal(r.rows[0].from.nativeGeneratedRoundedInverseOriginalBoundaryAliasCount,0);
 assert.equal(r.signedV5ActionCount,0);
});

test('exact received paper inverse exposes positive subnormal A-end interior even when rounded t=0',()=>{
 const s=segment({from:{u:0,v:Number.MIN_VALUE},
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,Number.MIN_VALUE]],[s]);
 assert.equal(r.rows[0].from.nativeGeneratedPaperCandidateParameterEqualCount,1);
 assert.equal(r.rows[0].exactReceivedPaperCandidateStrictlyInsideGapCount,1);
 assert.equal(r.rows[0].exactReceivedPaperCandidateAtGapFromCount,0);
 assert.equal(r.endpoints[0].roundedInverseDiffersFromExactReceivedPaperParameter,true);
 assert.equal(r.endpoints[0].exactReceivedPaperParameterWithinOriginalDomain,true);
 assert.equal(r.roundedInverseDisagreesWithExactReceivedPaperParameterCount,1);
 assert.equal(r.rows[0].sourceGapClosedByNativeEndpointEvidence,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('literal original A endpoint has exact t=0; transverse-only drift does not invent positive along-source t',()=>{
 const literal=run([[0,Number.MIN_VALUE]],[segment()]);
 assert.equal(literal.rows[0].exactReceivedPaperCandidateAtGapFromCount,1);
 assert.equal(literal.rows[0].exactReceivedPaperCandidateStrictlyInsideGapCount,0);
 assert.equal(literal.endpoints[0].exactReceivedPaperDominantAxisOriginalSourceParameter,'0');
 const drift=run([[0,Number.MIN_VALUE]],[segment({
  from:{u:Number.MIN_VALUE,v:0},
  directNativeVertexOriginalSource:[native(null),native('C')]
 })]);
 assert.equal(drift.rows[0].exactReceivedPaperCandidateAtGapFromCount,1);
 assert.equal(drift.endpoints[0].roundedInverseDiffersFromExactReceivedPaperParameter,false);
 assert.equal(drift.endpoints[0].receivedPaperRoundedInverseOriginalBoundaryAlias,true);
});
test('exact received paper inverse rejects a negative subnormal endpoint hidden by rounded t=0',()=>{
 const s=segment({from:{u:0,v:-Number.MIN_VALUE},
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,Number.MIN_VALUE]],[s]);
 assert.equal(r.endpoints[0].paperInverseOriginalBoundaryWithinDomain,true);
 assert.equal(r.endpoints[0].exactReceivedPaperParameterWithinOriginalDomain,false);
 assert.equal(r.endpoints[0].roundedInverseDiffersFromExactReceivedPaperParameter,true);
 assert.equal(r.rows[0].exactReceivedPaperCandidateStrictlyInsideGapCount,0);
 assert.equal(r.formalEngineeringLineStyleCertified,false);
});
test('reversed generated endpoint order preserves strict rational interior-gap inventory',()=>{
 const s=segment({from:{u:3,v:16},to:{u:0,v:Number.MIN_VALUE},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[1,0]}],
  directNativeVertexOriginalSource:[native('C'),native(null)]});
 const r=run([[0,Number.MIN_VALUE]],[s]);
 assert.equal(r.rows[0].exactReceivedPaperCandidateStrictlyInsideGapCount,1);
 assert.equal(r.endpoints[1].roundedInverseDiffersFromExactReceivedPaperParameter,true);
 assert.equal(r.signedV5ActionCount,0);
});
test('ordinary quarter source parameter is an exact received-paper candidate, not a signed gap fill',()=>{
 const s=segment({from:{u:0.75,v:4},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0.25,1]}],
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,0.5]],[s]);
 assert.equal(r.rows[0].exactReceivedPaperCandidateStrictlyInsideGapCount,1);
 assert.equal(r.endpoints[0].exactReceivedPaperDominantAxisOriginalSourceParameter,'1/4');
 assert.equal(r.endpoints[0].roundedInverseDiffersFromExactReceivedPaperParameter,false);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
});

test('exact received paper inverse interior may be off the original 2D source line',()=>{
 const s=segment({from:{u:0,v:Number.MIN_VALUE},
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,Number.MIN_VALUE]],[s]);
 assert.equal(r.rows[0].exactReceivedPaperCandidateStrictlyInsideGapCount,1);
 assert.equal(r.rows[0].exactReceivedPaperCollinearCandidateStrictlyInsideGapCount,0);
 assert.equal(r.rows[0].exactReceivedPaperOffLineCandidateStrictlyInsideGapCount,1);
 assert.equal(r.endpoints[0].exactReceivedPaperOnOriginalProjectedLine,false);
 assert.equal(r.actualNativeExactReceivedPaperOffLineEndpoints,1);
 assert.equal(r.signedV5ActionCount,0);
});
test('genuine collinear quarter paper endpoint is a candidate, not TopoDS history',()=>{
 const s=segment({from:{u:0.75,v:4},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0.25,1]}],
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,0.5]],[s]);
 assert.equal(r.rows[0].exactReceivedPaperCollinearCandidateStrictlyInsideGapCount,1);
 assert.equal(r.rows[0].exactReceivedPaperOffLineCandidateStrictlyInsideGapCount,0);
 assert.equal(r.endpoints[0].exactReceivedPaperOnOriginalProjectedLine,true);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('one-ULP transverse shift at quarter parameter cannot forge collinear gap evidence',()=>{
 const s=segment({from:{u:0.75,v:4+4*Number.EPSILON},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0.25,1]}],
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,0.5]],[s]);
 assert.equal(r.rows[0].exactReceivedPaperCandidateStrictlyInsideGapCount,1);
 assert.equal(r.rows[0].exactReceivedPaperCollinearCandidateStrictlyInsideGapCount,0);
 assert.equal(r.rows[0].exactReceivedPaperOffLineCandidateStrictlyInsideGapCount,1);
 assert.equal(r.endpoints[0].exactReceivedPaperOnOriginalProjectedLine,false);
 assert.equal(r.formalEngineeringLineStyleCertified,false);
});
test('transverse drift at rounded A boundary is not a collinear native A point',()=>{
 const r=run([[0,Number.MIN_VALUE]],[segment({
  from:{u:Number.MIN_VALUE,v:0},
  directNativeVertexOriginalSource:[native(null),native('C')]
 })]);
 assert.equal(r.rows[0].exactReceivedPaperCandidateAtGapFromCount,1);
 assert.equal(r.rows[0].exactReceivedPaperCollinearCandidateAtGapFromCount,0);
 assert.equal(r.endpoints[0].exactReceivedPaperOnOriginalProjectedLine,false);
 const literal=run([[0,Number.MIN_VALUE]]);
 assert.equal(literal.rows[0].exactReceivedPaperCollinearCandidateAtGapFromCount,1);
 assert.equal(literal.endpoints[0].exactReceivedPaperOnOriginalProjectedLine,true);
 assert.equal(literal.rows[0].sourceGapClosedByNativeEndpointEvidence,false);
});

test('exact dominant-axis inverse remains correct when BOTH projected binary64 spans overflow in V/H/W',()=>{
 const max=Number.MAX_VALUE;
 const pointsByView={
  H:{A:{x:-max,y:-max,z:0},C:{x:0.8*max,y:max,z:0}},
  V:{A:{x:-max,y:0,z:-max},C:{x:0.8*max,y:0,z:max}},
  W:{A:{x:0,y:-max,z:-max},C:{x:0,y:0.8*max,z:max}}
 };
 for(const [view,points] of Object.entries(pointsByView)){
  const g={id:'overflow',data:{points,edges:[['A','C']]}};
  const s={
   view,occtHLRVisibilityClass:'visible-sharp',
   from:{u:0,v:0},to:{u:0.8*max,v:max},
   sourceCandidate3DLifts:[{sourceEdgeId:'overflow::A|C',
    originalVertexIds:['A','C'],
    paperOnlyUnclampedOriginalSourceParameters:[0.5,1]}],
   directNativeVertexOriginalSource:[native(null),native('C')],
   actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven:false
  };
  // Math.abs(delta) would be Infinity for BOTH axes and previously
  // selected u (wrong); the exact larger span is v, yielding t=1/2.
  assert.equal(Math.abs(s.to.u-(-max)),Infinity);
  assert.equal(Math.abs(s.to.v-(-max)),Infinity);
  const check=segments=>audit({geometry:g,view,sourceEdgeId:'overflow::A|C',
   uncoveredIntervals:[[0.4,0.6]],visibleSegments:segments,hiddenSegments:[]});
  const r=check([s]);
  assert.equal(r.endpoints[0].exactReceivedPaperDominantAxisOriginalSourceParameter,'1/2',view);
  assert.equal(r.rows[0].exactReceivedPaperCandidateStrictlyInsideGapCount,1,view);
  assert.equal(r.rows[0].exactReceivedPaperOffLineCandidateStrictlyInsideGapCount,1,view);
  assert.equal(r.rows[0].sourceGapClosedByNativeEndpointEvidence,false,view);
  assert.equal(r.signedV5ActionCount,0,view);
  const reversed=check([{...s,from:s.to,to:s.from,
   sourceCandidate3DLifts:[{...s.sourceCandidate3DLifts[0],
    paperOnlyUnclampedOriginalSourceParameters:[1,0.5]}],
   directNativeVertexOriginalSource:[native('C'),native(null)]}]);
  assert.equal(reversed.endpoints[1].exactReceivedPaperDominantAxisOriginalSourceParameter,'1/2',view);
  assert.equal(reversed.generatedToOriginalTopoDSFullHistoryCertified,false,view);
 }
});
test('exact dominant-axis inverse preserves u preference when u is truly larger despite overflow',()=>{
 const max=Number.MAX_VALUE;
 const g={id:'overflow',data:{points:{
  A:{x:-max,y:-max,z:0},C:{x:max,y:0.8*max,z:0}
 },edges:[['A','C']]}};
 const s={view:'H',occtHLRVisibilityClass:'visible-sharp',
  from:{u:0,v:0},to:{u:max,v:0.8*max},
  sourceCandidate3DLifts:[{sourceEdgeId:'overflow::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0.5,1]}],
  directNativeVertexOriginalSource:[native(null),native('C')],
  actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven:false};
 const r=audit({geometry:g,view:'H',sourceEdgeId:'overflow::A|C',
  uncoveredIntervals:[[0.4,0.6]],visibleSegments:[s],hiddenSegments:[]});
 assert.equal(r.endpoints[0].exactReceivedPaperDominantAxisOriginalSourceParameter,'1/2');
 assert.equal(r.rows[0].exactReceivedPaperOffLineCandidateStrictlyInsideGapCount,1);
 assert.equal(r.formalEngineeringLineStyleCertified,false);
});

test('strict rational on-line HLR paper candidates partition a genuine M5 gap without filling source history',()=>{
 const s=segment({from:{u:0.75,v:4},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0.25,1]}],
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,0.5]],[s]),gap=r.rows[0];
 assert.equal(r.exactReceivedPaperSegmentsWithBothEndpointsCollinearAndInOriginalDomain,1);
 assert.deepEqual(gap.exactReceivedCollinearPaperCandidateSubrangesWithoutSourceHistory,
  [['1/4','1/2']]);
 assert.deepEqual(gap.positiveRationalGapResidualAfterCollinearPaperCandidates,
  [['0','1/4']]);
 assert.equal(r.positiveOriginalM5GapsWithPartiallyCorroboratedExactCollinearPaperCandidates,1);
 assert.equal(r.positiveOriginalM5GapsWithExactCollinearPaperCandidateOnlyFullCoverage,0);
 assert.equal(gap.originalPositiveM5GapRemainsUnclosedWithoutGeneratedTopoDSHistory,true);
 assert.equal(gap.sourceGapClosedByNativeEndpointEvidence,false);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.signedV5ActionCount,0);
 const reversed=run([[0,0.5]],[{
  ...s,from:s.to,to:s.from,
  sourceCandidate3DLifts:[{...s.sourceCandidate3DLifts[0],
   paperOnlyUnclampedOriginalSourceParameters:[1,0.25]}],
  directNativeVertexOriginalSource:[native('C'),native(null)]
 }]);
 assert.deepEqual(reversed.rows[0].positiveRationalGapResidualAfterCollinearPaperCandidates,
  [['0','1/4']]);
});
test('off-line paper endpoints never cover a positive source gap even if dominant inverse rounds to zero',()=>{
 const s=segment({from:{u:0,v:Number.MIN_VALUE},
  directNativeVertexOriginalSource:[native(null),native('C')]});
 const r=run([[0,Number.MIN_VALUE]],[s]);
 assert.equal(r.endpoints[0].exactReceivedPaperOnOriginalProjectedLine,false);
 assert.equal(r.exactReceivedPaperSegmentsWithBothEndpointsCollinearAndInOriginalDomain,0);
 assert.deepEqual(r.rows[0].exactReceivedCollinearPaperCandidateSubrangesWithoutSourceHistory,[]);
 assert.equal(r.rows[0].positiveRationalGapResidualAfterCollinearPaperCandidates.length,1);
 assert.equal(r.rows[0].positiveRationalGapResidualAfterCollinearPaperCandidates[0][0],'0');
 assert.equal(r.positiveOriginalM5GapsWithExactCollinearPaperCandidateOnlyFullCoverage,0);
 assert.equal(r.signedV5ActionCount,0);
});
test('complete on-line HLR paper candidate remains distinct from generated source-history proof',()=>{
 const r=run([[0.2,0.3]]);
 assert.equal(r.exactReceivedPaperSegmentsWithBothEndpointsCollinearAndInOriginalDomain,1);
 assert.deepEqual(r.rows[0].positiveRationalGapResidualAfterCollinearPaperCandidates,[]);
 assert.equal(r.positiveOriginalM5GapsWithExactCollinearPaperCandidateOnlyFullCoverage,1);
 assert.equal(r.rows[0].sourceGapClosedByNativeEndpointEvidence,false);
 assert.equal(r.rows[0].originalPositiveM5GapRemainsUnclosedWithoutGeneratedTopoDSHistory,true);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.formalEngineeringLineStyleCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});

test('opposite HLR classes covering disjoint paper halves cannot certify one visible source',()=>{
 const first=segment({
  from:{u:0,v:0},to:{u:1.5,v:8},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0,0.5]}],
  directNativeVertexOriginalSource:[native('A'),native(null)]
 });
 const second=segment({
  view:'H',occtHLRVisibilityClass:'hidden-sharp',
  from:{u:1.5,v:8},to:{u:3,v:16},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0.5,1]}],
  directNativeVertexOriginalSource:[native(null),native('C')]
 });
 const r=run([[0,1]],[first],[second]);
 const gap=r.rows[0];
 assert.deepEqual(gap.positiveRationalGapResidualAfterCollinearPaperCandidates,[]);
 assert.deepEqual(gap.exactVisibleCollinearPaperCandidateSubrangesWithoutSourceHistory,
  [['0','1/2']]);
 assert.deepEqual(gap.exactHiddenCollinearPaperCandidateSubrangesWithoutSourceHistory,
  [['1/2','1']]);
 assert.deepEqual(gap.positiveRationalGapResidualAfterVisiblePaperCandidates,
  [['1/2','1']]);
 assert.deepEqual(gap.positiveRationalGapResidualAfterHiddenPaperCandidates,
  [['0','1/2']]);
 assert.equal(gap.mixedHLRClassPaperOnlyFullCoverageCannotSignVisibility,true);
 assert.equal(gap.oppositeHLRClassPositivePaperOverlapStillHeld,false);
 assert.equal(r.positiveOriginalM5GapsWithMixedHLRClassPaperOnlyFullCoverageHeld,1);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('overlapping opposite-class collinear HLR paper intervals remain an explicit M5 conflict',()=>{
 const visible=segment({
  from:{u:0,v:0},to:{u:2.25,v:12},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0,0.75]}],
  directNativeVertexOriginalSource:[native('A'),native(null)]
 });
 const hidden=segment({
  occtHLRVisibilityClass:'hidden-sharp',
  from:{u:0.75,v:4},to:{u:3,v:16},
  sourceCandidate3DLifts:[{sourceEdgeId:'tetra::A|C',
   originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0.25,1]}],
  directNativeVertexOriginalSource:[native(null),native('C')]
 });
 const r=run([[0,1]],[visible],[hidden]);
 assert.equal(r.rows[0].oppositeHLRClassPositivePaperOverlapStillHeld,true);
 assert.equal(r.positiveOriginalM5GapsWithOppositeHLRClassPaperOverlapHeld,1);
 assert.equal(r.rows[0].mixedHLRClassPaperOnlyFullCoverageCannotSignVisibility,true);
 assert.equal(r.rows[0].sourceGapClosedByNativeEndpointEvidence,false);
 assert.equal(r.formalEngineeringLineStyleCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('one native class fully covering paper does not create a false mixed-class warning',()=>{
 const r=run([[0.2,0.3]]);
 assert.equal(r.rows[0].mixedHLRClassPaperOnlyFullCoverageCannotSignVisibility,false);
 assert.equal(r.rows[0].oppositeHLRClassPositivePaperOverlapStillHeld,false);
 assert.deepEqual(r.rows[0].positiveRationalGapResidualAfterVisiblePaperCandidates,[]);
 assert.deepEqual(r.rows[0].positiveRationalGapResidualAfterHiddenPaperCandidates,
  [['3602879701896397/18014398509481984','5404319552844595/18014398509481984']]);
 assert.equal(r.signedV5ActionCount,0);
});
