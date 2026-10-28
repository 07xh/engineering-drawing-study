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
