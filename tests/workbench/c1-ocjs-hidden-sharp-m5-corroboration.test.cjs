'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {exactCandidateIntervalCoverage:cover,
 reviewCanonicalM4M5NativeHLRSourceIntervals:joint}=
 require('../../workbench/c1-ocjs-hidden-sharp-m5-corroboration.cjs');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1OriginalClosedEdgeRayContinuity:auditClosedM5}=
 require('../../workbench/c1-m5-closed-original-edge-ray-continuity.cjs');

test('actual M0 original source parameter completely covered by adjacent native hidden intervals',()=>{
 const v=cover([0,1],[[0,0.35],[0.35,0.7],[0.7,1]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,true);
 assert.deepEqual(v.positiveLengthUncoveredIntervals,[]);
 assert.deepEqual(v.positiveLengthCoveredIntervals,[[0,1]]);
 assert.ok(Object.isFrozen(v));
});
test('even an extremely small REAL M4 paper parameter gap never becomes coverage by tolerance',()=>{
 const lo=0.5,hi=0.5+Number.EPSILON;
 const v=cover([0,1],[[0,lo],[hi,1]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(v.positiveLengthUncoveredIntervals,[[lo,hi]]);
 assert.deepEqual(v.positiveLengthCoveredIntervals,[[0,lo],[hi,1]]);
});
test('overlapping, out-of-order real hidden BRep intervals do not create false gaps',()=>{
 const v=cover([0.2,0.8],[[0.5,0.8],[0.1,0.6],[0.5,0.7]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,true);
 assert.deepEqual(v.positiveLengthCoveredIntervals,[[0.2,0.8]]);
});
test('partial native hidden coverage is correctly restricted to canonical original M4 subspan',()=>{
 const v=cover([0.3,0.6],[[0,0.4],[0.5,1]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(v.positiveLengthUncoveredIntervals,[[0.4,0.5]]);
 assert.deepEqual(v.originalParameterRange,[0.3,0.6]);
});
test('hidden native source candidates outside physical interval never prove that interval',()=>{
 const v=cover([0.4,0.6],[[0,0.2],[0.8,1]]);
 assert.equal(v.entireOriginalParameterIntervalCovered,false);
 assert.deepEqual(v.positiveLengthUncoveredIntervals,[[0.4,0.6]]);
 assert.deepEqual(v.positiveLengthCoveredIntervals,[]);
});
test('untrusted source parameter ranges are rejected rather than clamped to a false whole edge',()=>{
 for(const invalid of [[-0.0000001,0.8],[0.2,1.1],[0.5,0.5],
   [0.7,0.3],[0,Infinity],[NaN,1]]){
  assert.throws(()=>cover([0,1],[invalid]),/verified finite/);
 }
 assert.throws(()=>cover([0,1.01],[]),/bounded exact/);
 assert.throws(()=>cover([0,0],[]),/bounded exact/);
});

const boxM5=()=>{
 const xyz=(x,y,z)=>({x,y,z});
 const g=prismMesh({solid:{min:xyz(0,0,0),max:xyz(10,12,14)}});
 const geometry={...g,id:'C1M4M5NativeHLRJointProofBox'};
 return auditClosedM5({geometry,revision:37});
};
const genuineUnsignedCandidate=(a,b,sourceCount=1,remaining=sourceCount,
 survives=true)=>({
 range:[a,b],distinctOriginal3DCandidateCount:sourceCount,
 remainingPossibleOriginal3DCandidateCount:remaining,
 sourceSurvivesExactM5Pruning:survives,
 realOCCTHLREdgeToSourceIdentityRecovered:false,
 nativeHLRActualClass:'hidden-sharp'
});
test('full M0/M4/M5 original 3D partition jointly matches actual native HLR candidate parameters but stays unsigned',()=>{
 const m5=boxM5(),row=m5.rows.find(r=>
  !r.projectionCollapsed&&r.originalM4PaperParameterPartitionComplete&&
  r.originalCutSubspans.length>0);
 assert.ok(row,'real geometric M4 full source must exist');
 const proof=joint({m5Row:row,nativeCandidates:[
  genuineUnsignedCandidate(0,.4),genuineUnsignedCandidate(.4,1)
 ]});
 assert.equal(proof.canonicalM4Original3DAndM5RayCutUnionRecomputed,true);
 assert.equal(proof.originalM4Full3DSourceIntervalProven,true);
 assert.equal(proof.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage,true);
 assert.equal(proof.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete,true);
 assert.deepEqual(proof.genuineNativeHiddenHLRCandidateParameterCoverage.
  positiveLengthUncoveredIntervals,[]);
 assert.equal(proof.allActualGeneratedTopoDSSourceHistoryAndSceneOcclusionProven,false);
 assert.equal(proof.full3DEndpointAndEngineeringLineStyleProven,false);
 assert.equal(proof.constructionIntentAuthorized,false);
 assert.equal(proof.signedV5Action,false);
});
test('native HLR candidate one-ULP hole prevents joint original 3D source coverage even with full M4 and valid M5',()=>{
 const row=boxM5().rows.find(r=>
  !r.projectionCollapsed&&r.originalM4PaperParameterPartitionComplete);
 const half=.5,next=half+Number.EPSILON/2;
 const proof=joint({m5Row:row,nativeCandidates:[
  genuineUnsignedCandidate(0,half),
  genuineUnsignedCandidate(next,1)
 ]});
 assert.equal(proof.originalM4Full3DSourceIntervalProven,true);
 assert.equal(proof.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage,false);
 assert.equal(proof.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete,false);
 assert.deepEqual(proof.genuineNativeHiddenHLRCandidateParameterCoverage.
  positiveLengthUncoveredIntervals,[[half,next]]);
 assert.equal(proof.engineeringLineStyle,'undetermined');
 assert.equal(proof.signedV5Action,false);
});
test('M5 cannot forge a different M4 original-source cut ledger by retaining a full-coverage label',()=>{
 const row=boxM5().rows.find(r=>
  !r.projectionCollapsed&&r.originalM4PaperParameterPartitionComplete);
 const nativeCandidates=[genuineUnsignedCandidate(0,1)];
 const drift={...row,originalCutSubspans:[{
  ...row.originalCutSubspans[0],originalParameterRange:[0,.5]}]};
 assert.throws(()=>joint({m5Row:drift,nativeCandidates}),
  /contradicts independent canonical M4 coverage/);
 const forged={...row,originalM4Canonical3DSourceParameterCoverage:{
  ...row.originalM4Canonical3DSourceParameterCoverage,
  positiveLengthUncoveredIntervals:[[.5,.5+Number.EPSILON/2]]
 }};
 assert.throws(()=>joint({m5Row:forged,nativeCandidates}),
  /contradicts independent canonical M4 coverage/);
});
test('collapsed original 3D source projects to a point in first-angle view and never satisfies the whole paper HLR gate',()=>{
 const row=boxM5().rows.find(r=>r.projectionCollapsed);
 assert.ok(row);
 const held=joint({m5Row:row,nativeCandidates:[]});
 assert.equal(held.originalM4Full3DSourceIntervalProven,false);
 assert.equal(held.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete,false);
 assert.deepEqual(held.canonicalM4ParameterCoverage.
  positiveLengthUncoveredIntervals,[[0,1]]);
 assert.equal(held.signedV5Action,false);
});

test('complete HLR paper candidate union with two possible physical 3D originals cannot certify source identity',()=>{
 const row=boxM5().rows.find(r=>
  !r.projectionCollapsed&&r.originalM4PaperParameterPartitionComplete);
 assert.ok(row);
 const ambiguous=joint({m5Row:row,nativeCandidates:[
  genuineUnsignedCandidate(0,.5,2),
  genuineUnsignedCandidate(.5,1,2)
 ]});
 assert.equal(ambiguous.originalM4Full3DSourceIntervalProven,true);
 assert.equal(ambiguous.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage,true);
 assert.deepEqual(ambiguous.genuineNativeHiddenHLRCandidateParameterCoverage.
  positiveLengthUncoveredIntervals,[]);
 assert.equal(ambiguous.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage,false);
 assert.deepEqual(ambiguous.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage.
  positiveLengthUncoveredIntervals,[[0,1]]);
 assert.equal(ambiguous.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete,false);
 assert.equal(ambiguous.engineeringLineStyle,'undetermined');
 assert.equal(ambiguous.signedV5Action,false);
});
test('the unique physical OCCT source must continuously cover original 3D, even if ambiguous native HLR spans fill the paper',()=>{
 const row=boxM5().rows.find(r=>
  !r.projectionCollapsed&&r.originalM4PaperParameterPartitionComplete);
 const half=.5,next=half+Number.EPSILON/2;
 const partial=joint({m5Row:row,nativeCandidates:[
  genuineUnsignedCandidate(0,half,1),
  genuineUnsignedCandidate(half,1,2)
 ]});
 assert.equal(partial.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage,true);
 assert.equal(partial.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage,false);
 assert.deepEqual(partial.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage.
  positiveLengthUncoveredIntervals,[[half,1]]);
 assert.equal(partial.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete,false);
 const exact=joint({m5Row:row,nativeCandidates:[
  genuineUnsignedCandidate(0,half,1),
  genuineUnsignedCandidate(next,1,1),
  genuineUnsignedCandidate(half,next,2)
 ]});
 assert.equal(exact.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage,true);
 assert.deepEqual(exact.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage.
  positiveLengthUncoveredIntervals,[[half,next]]);
 assert.equal(exact.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete,false);
});
test('exact M5 whole closed-ray competitor exclusion positively narrows two real OCCT source candidates to one original physical 3D edge',()=>{
 const row=boxM5().rows.find(r=>
  !r.projectionCollapsed&&r.originalM4PaperParameterPartitionComplete);
 const proof=joint({m5Row:row,nativeCandidates:[
  genuineUnsignedCandidate(0,.5,2,1,true),
  genuineUnsignedCandidate(.5,1,2,1,true),
  genuineUnsignedCandidate(0,1,2,1,false)
 ]});
 assert.equal(proof.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage,true);
 assert.equal(proof.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage,true);
 assert.equal(proof.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete,true);
 assert.deepEqual(proof.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage.
  positiveLengthUncoveredIntervals,[]);
 assert.equal(proof.allActualGeneratedTopoDSSourceHistoryAndSceneOcclusionProven,false);
 assert.equal(proof.engineeringLineStyle,'undetermined');
 assert.equal(proof.signedV5Action,false);
});
test('source physically excluded by independently exact M5 ray pruning cannot gain hidden identity from raw paper coverage',()=>{
 const row=boxM5().rows.find(r=>
  !r.projectionCollapsed&&r.originalM4PaperParameterPartitionComplete);
 const proof=joint({m5Row:row,nativeCandidates:[
  genuineUnsignedCandidate(0,1,2,1,false)
 ]});
 assert.equal(proof.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage,true);
 assert.equal(proof.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage,false);
 assert.deepEqual(proof.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage.
  positiveLengthUncoveredIntervals,[[0,1]]);
 assert.equal(proof.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete,false);
 assert.equal(proof.signedV5Action,false);
});
test('invalid or forged after-M5 negative source multiplicity is rejected before physical proof',()=>{
 const row=boxM5().rows.find(r=>
  !r.projectionCollapsed&&r.originalM4PaperParameterPartitionComplete);
 for(const count of [-1,1.5,3,NaN,undefined]){
  const c=genuineUnsignedCandidate(0,1,2);
  c.remainingPossibleOriginal3DCandidateCount=count;
  assert.throws(()=>joint({m5Row:row,nativeCandidates:[c]}),
   /unsigned genuine native HLR source ranges required/);
 }
 const missing=genuineUnsignedCandidate(0,1);
 delete missing.sourceSurvivesExactM5Pruning;
 assert.throws(()=>joint({m5Row:row,nativeCandidates:[missing]}),
  /unsigned genuine native HLR source ranges required/);
});
test('invalid original source candidate multiplicity cannot forge a unique native HLR edge',()=>{
 const row=boxM5().rows.find(r=>
  !r.projectionCollapsed&&r.originalM4PaperParameterPartitionComplete);
 for(const invalid of [0,-1,1.5,NaN,Infinity,undefined]){
  const candidate=genuineUnsignedCandidate(0,1);
  candidate.distinctOriginal3DCandidateCount=invalid;
  assert.throws(()=>joint({m5Row:row,nativeCandidates:[
   candidate
  ]}),/unsigned genuine native HLR source ranges required/);
 }
});
