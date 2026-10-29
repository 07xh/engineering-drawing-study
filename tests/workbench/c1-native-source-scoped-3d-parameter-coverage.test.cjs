'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1Native3DSourceScopedIntervals:audit,
 auditC1Native3DClassPaperCandidateVeto:veto}=
 require('../../workbench/c1-native-source-scoped-3d-parameter-coverage.cjs');
test('full native 3D source-scoped interval is complete but still cannot sign V5',()=>{
 const r=audit({originalNativeParameterRange:[-5,15],
  generatedNativeParameterRanges:[[5,15],[-5,5]]});
 assert.deepEqual(r.positiveLengthUncoveredNativeParameterIntervals,[]);
 assert.deepEqual(r.positiveLengthOverlappingNativeParameterIntervals,[]);
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,true);
 assert.equal(r.originalGeneratedTopoDSHistoryCertified,false);
 assert.equal(r.signedV5Action,false);
 assert.ok(Object.isFrozen(r.generatedNativeParameterRanges));
});
test('one binary64 ULP gap survives native parameter partition without epsilon',()=>{
 const r=audit({originalNativeParameterRange:[0,1],
  generatedNativeParameterRanges:[[0,0.5],[0.5+Number.EPSILON,1]]});
 assert.deepEqual(r.positiveLengthUncoveredNativeParameterIntervals,
  [[0.5,0.5+Number.EPSILON]]);
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,false);
});
test('subnormal positive source gap remains nonzero',()=>{
 const r=audit({originalNativeParameterRange:[0,1],
  generatedNativeParameterRanges:[[Number.MIN_VALUE,1]]});
 assert.deepEqual(r.positiveLengthUncoveredNativeParameterIntervals,
  [[0,Number.MIN_VALUE]]);
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,false);
});
test('positive native source overlap rejects exactly-once coverage',()=>{
 const r=audit({originalNativeParameterRange:[0,1],
  generatedNativeParameterRanges:[[0,0.75],[0.5,1],[0.6,0.8]]});
 assert.deepEqual(r.positiveLengthOverlappingNativeParameterIntervals,[[0.5,0.8]]);
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,false);
});
test('touching source fragments are not a positive overlap',()=>{
 const r=audit({originalNativeParameterRange:[1,3],
  generatedNativeParameterRanges:[[1,2],[2,3]]});
 assert.equal(r.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,true);
});
test('forged out-of-range and collapsed native segments fail closed',()=>{
 for(const generatedNativeParameterRanges of [
  [[-Number.MIN_VALUE,1]],[[0,1+Number.EPSILON]],
  [[0,0]],[[0,NaN]],[[0,Infinity]]
 ])assert.throws(()=>audit({originalNativeParameterRange:[0,1],
  generatedNativeParameterRanges}),/native|interval/);
 assert.throws(()=>audit({originalNativeParameterRange:[0,0],
  generatedNativeParameterRanges:[]}),/native/);
});

const source='C1::A|B';
const edge=(range)=>({
 nativeSourceFilterOriginalEdgeId:source,
 nativeOriginalCurveParameterRange:range,
 native3DCurveExactlySameAsOriginalAtThreeParameters:true,
 originalGeneratedTopoDSHistoryCertified:false,signedV5Action:false
});
const group=(ranges)=>({
 nativeSourceFilteredOriginalTopoDSEdge:true,
 native3DGeneratedCurveIntervals:ranges.map(edge)
});
const scoped=(visible,hidden)=>({
 originalPhysicalSourceEdgeId:source,
 visible3D:group(visible),hidden3D:group(hidden),
 combinedNative3DSourceParameterPartition:audit({
  originalNativeParameterRange:[0,1],
  generatedNativeParameterRanges:[...visible,...hidden]
 })
});
const paper=[
 {hlrClass:'visible-sharp',ordinal:0},
 {hlrClass:'hidden-sharp',ordinal:1}
];
test('real native 3D visible-only source vetoes hidden whole-solid paper alias',()=>{
 const r=veto({view:'V',sourceEdgeId:source,
  scopedRow:scoped([[0,1]],[]),paperCandidates:paper});
 assert.equal(r.originalWholeSolidPaperCandidateCount,2);
 assert.deepEqual(r.native3DClassCompatiblePaperCandidates,
  [{hlrClass:'visible-sharp',ordinal:0}]);
 assert.deepEqual(r.paperCandidatesExcludedByNative3DClassAbsence,
  [{hlrClass:'hidden-sharp',ordinal:1}]);
 assert.equal(r.fullOriginalSourceHistoryCertified,false);
 assert.equal(r.globalContinuousVisibilityCertified,false);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
 assert.ok(Object.isFrozen(r.paperCandidatesExcludedByNative3DClassAbsence));
});
test('native 3D visible/hidden split retains both candidate classes unsigned',()=>{
 const r=veto({view:'H',sourceEdgeId:source,
  scopedRow:scoped([[0,0.5]],[[0.5,1]]),paperCandidates:paper});
 assert.equal(r.native3DClassCompatiblePaperCandidates.length,2);
 assert.equal(r.paperCandidatesExcludedByNative3DClassAbsence.length,0);
 assert.equal(r.fullOriginalSourceHistoryCertified,false);
});
test('incomplete native 3D source partition cannot veto a paper class',()=>{
 const r=veto({view:'W',sourceEdgeId:source,
  scopedRow:scoped([],[]),paperCandidates:paper});
 assert.equal(r.native3DClassVetoEligibleOnlyAfterExactFullPartition,false);
 assert.equal(r.native3DClassCompatiblePaperCandidates.length,2);
 assert.equal(r.paperCandidatesExcludedByNative3DClassAbsence.length,0);
});
test('forged class, duplicate paper ordinal and fake native provenance fail closed',()=>{
 const args={view:'V',sourceEdgeId:source,
  scopedRow:scoped([[0,1]],[]),paperCandidates:paper};
 const badRange=scoped([[0,1]],[]);
 badRange.visible3D.native3DGeneratedCurveIntervals[0].
  nativeOriginalCurveParameterRange=[0,0];
 const stalePartition=scoped([[0,1]],[]);
 stalePartition.combinedNative3DSourceParameterPartition={
  ...stalePartition.combinedNative3DSourceParameterPartition,
  sourceScopedNative3DParameterInventoryCompleteExactlyOnce:false
 };
 for(const changed of [
  {...args,view:'X'},
  {...args,sourceEdgeId:'other'},
  {...args,paperCandidates:[paper[0],paper[0]]},
  {...args,paperCandidates:[{hlrClass:'visible-sharp',ordinal:-1}]},
  {...args,paperCandidates:[{hlrClass:'contour',ordinal:0}]},
  {...args,scopedRow:badRange},
  {...args,scopedRow:stalePartition}
 ])assert.throws(()=>veto(changed),/native|source|paper|original/);
 const forged=scoped([[0,1]],[]);
 forged.visible3D.native3DGeneratedCurveIntervals[0].
  nativeSourceFilterOriginalEdgeId='forged';
 assert.throws(()=>veto({...args,scopedRow:forged}),/native|source/);
});
