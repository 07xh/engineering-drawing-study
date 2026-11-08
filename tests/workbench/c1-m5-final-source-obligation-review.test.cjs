'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reviewC1M5FinalStrokeObligations:review}=
 require('../../workbench/c1-m5-final-source-obligation-review.cjs');
const required=[
 'realPhysicalCreaseNotProven','existingOuterContourHasOriginalV5Authority',
 'wholeSingleConvexOpenRayNotPositivelyClear','strictWholeSingleConvexOpenRayHidden',
 'originalSourceUniquenessNotProvenEvenAfterExactM0Pruning',
 'alreadyBehindAnotherOriginalPhysicalSource',
 'exactOriginal3DDuplicateNeedsCanonicalReduction',
 'sourceListFrontmostNotEstablished',
 'sourceCrossEdgeJunctionsNotGloballyCertified',
 'projectedPaperOnlyEncountersNeedGlobalResolution',
 'completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified',
 'applicableStandardEngineeringLineStyleNotCertified',
 'originalConstructionIntentDAGAndSingleV5NotAuthorized'
];
function span(overrides={}){
 const blockers=Object.fromEntries(required.map(x=>[x,false]));
 for(const key of [
  'sourceCrossEdgeJunctionsNotGloballyCertified',
  'completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified',
  'applicableStandardEngineeringLineStyleNotCertified',
  'originalConstructionIntentDAGAndSingleV5NotAuthorized'
 ])blockers[key]=true;
 return {sourceGeometryId:'G',revision:1,view:'V',sourceEdgeId:'G::A|B',
  originalSourceParameterRange:[0,1],blockers,
  positiveLineLikeGeometryReadyForFurtherM5Proof:true,
  formalStandardLineStyle:'undetermined',
  certifiedEngineeringSolidLine:false,certifiedEngineeringDashedLine:false,
  constructionIntentAuthorized:false,signedV5Action:false,...overrides};
}
function ledger(rows=[span()],overrides={}){
 return {schema:'draftai-c1-m5-recomputed-real-wasm-final-source-obligations/1',
  sourceGeometryId:'G',revision:1,
  realCADAndM5RecomputedFromCurrentOriginalReviewedSource:true,
  signedV5ActionCount:0,wholeSolidV5Ready:false,
  counts:{totalOriginalSourceEdgeViewSubspans:rows.length},
  subspans:rows,...overrides};
}
test('positive local geometry remains unsigned and exposes independent global proof gaps',()=>{
 const result=review(ledger());
 assert.equal(result.localPositiveCount,1);
 assert.equal(result.fullyCertifiedCount,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.equal(result.rows[0].formalLineStyle,'undetermined');
 assert.ok(result.rows[0].blockingReasons.includes(
  'completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified'));
 assert.deepEqual(result.rows[0].independentGlobalProofGaps,{
  original3DSourceIdentity:true,
  completeIntervalVisibility:true,
  endpointAndProjectionTopology:true,
  engineeringLineStandard:true,
  soleConstructionIntentDAGV5:true
 });
 assert.ok(Object.isFrozen(result.rows[0].blockingReasons));
 assert.ok(Object.isFrozen(result.rows[0].independentGlobalProofGaps));
});
test('forged official line style, V5 action or missing global blocker is rejected',()=>{
 assert.throws(()=>review(ledger([span({signedV5Action:true})])),/signed/);
 assert.throws(()=>review(ledger([span({formalStandardLineStyle:'solid'})])),/signed/);
 for(const key of [
  'applicableStandardEngineeringLineStyleNotCertified',
  'originalConstructionIntentDAGAndSingleV5NotAuthorized',
  'completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified',
  'sourceCrossEdgeJunctionsNotGloballyCertified'
 ]){
  const row=span();row.blockers[key]=false;
  assert.throws(()=>review(ledger([row])),/global signoff/);
 }
});
test('missing blocker, stale revision and ledger count mismatch fail closed',()=>{
 const missing=span();delete missing.blockers.sourceCrossEdgeJunctionsNotGloballyCertified;
 assert.throws(()=>review(ledger([missing])),/invalid/);
 const stale=span({revision:2});
 assert.throws(()=>review(ledger([stale])),/stale/);
 assert.throws(()=>review(ledger([span()],{counts:{totalOriginalSourceEdgeViewSubspans:2}})),
  /count mismatch/);
});
test('source intervals must be finite, positive and within the original M0 [0,1] domain',()=>{
 for(const interval of [[0,Infinity],[-Number.MIN_VALUE,1],[0,1+Number.EPSILON],[0,0],[1,0]]){
  assert.throws(()=>review(ledger([span({originalSourceParameterRange:interval})])),
   /invalid original source parameter domain|invalid, stale or prematurely signed/);
 }
});
test('duplicated canonical source intervals are rejected instead of inflating completeness',()=>{
 const row=span();
 assert.throws(()=>review(ledger([row,{...row,blockers:{...row.blockers},
  originalSourceParameterRange:[...row.originalSourceParameterRange]}])),
  /duplicate original 3D source interval/);
});
test('disjoint source pieces remain separately represented and never gain global V5 authority',()=>{
 const first=span({originalSourceParameterRange:[0,.4]});
 const second=span({originalSourceParameterRange:[.4,1]});
 const result=review(ledger([first,second]));
 assert.equal(result.total,2);
 assert.equal(result.rows.length,2);
 assert.equal(result.fullyCertifiedCount,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.ok(result.rows.every(x=>x.formalLineStyle==='undetermined'&&
  x.constructionIntentAuthorized===false&&x.signedV5Action===false));
});


test('partial original M5 same source/view overlap is rejected even if it spans one binary64 ULP',()=>{
 const half=.5,above=half+Number.EPSILON/2;
 for(const ranges of [
  [[0,.75],[.5,1]],
  [[0,above],[half,1]],
  [[0,1],[half,.75]]
 ]){
  const rows=ranges.map(r=>span({originalSourceParameterRange:r}));
  assert.throws(()=>review(ledger(rows)),/overlapping original 3D source parameter intervals/);
 }
});
test('M5 original source diagnostic captures leading, interior, trailing positive gaps; remains unsigned',()=>{
 const rows=[
  span({view:'W',sourceEdgeId:'G::B|D',originalSourceParameterRange:[.25,.5]}),
  span({view:'W',sourceEdgeId:'G::B|D',originalSourceParameterRange:[.75,.875]}),
  span({view:'H',sourceEdgeId:'G::B|D',originalSourceParameterRange:[0,1]})
 ];
 const result=review(ledger(rows));
 assert.equal(result.observedOriginalSourceViewGroups,2);
 assert.equal(result.observedSourceViewGroupsWithPositiveUncoveredRanges,1);
 assert.equal(result.observedPositiveUncoveredOriginalSourceParameterRanges,3);
 const w=result.originalSourceIntervalDiagnostics.find(x=>x.view==='W');
 assert.deepEqual(w.positiveLengthUncoveredOriginalParameterRanges,
  [[0,.25],[.5,.75],[.875,1]]);
 assert.equal(w.originalSourceFullCoverageFromObservedSpansOnly,false);
 assert.equal(w.opaqueSceneVisibilityCertified,false);
 assert.equal(w.entire3DSourceInventoryIndependentlyProven,false);
 assert.equal(w.formalLineStyle,'undetermined');
 assert.equal(w.signedV5Action,false);
 assert.equal(result.fullyCertifiedCount,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.ok(Object.isFrozen(w.observedOriginalParameterRanges));
 const h=result.originalSourceIntervalDiagnostics.find(x=>x.view==='H');
 assert.deepEqual(h.positiveLengthUncoveredOriginalParameterRanges,[]);
 assert.equal(h.originalSourceFullCoverageFromObservedSpansOnly,true);
 assert.equal(h.opaqueSceneVisibilityCertified,false);
});
test('identical original source in separate V/H/W views is never a false overlap',()=>{
 const rows=[
  span({view:'V',originalSourceParameterRange:[0,1]}),
  span({view:'H',originalSourceParameterRange:[0,1]}),
  span({view:'W',originalSourceParameterRange:[0,.5]}),
  span({view:'W',originalSourceParameterRange:[.5,1]})
 ];
 const result=review(ledger(rows));
 assert.equal(result.observedOriginalSourceViewGroups,3);
 assert.equal(result.observedPositiveUncoveredOriginalSourceParameterRanges,0);
 assert.ok(result.originalSourceIntervalDiagnostics.every(x=>
  x.observedSpansExactNonoverlap&&x.formalLineStyle==='undetermined'));
});
