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
