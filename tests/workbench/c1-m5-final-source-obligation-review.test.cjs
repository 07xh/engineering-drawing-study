'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
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
function fixture(){
 const blockers=Object.fromEntries(required.map(x=>[x,false]));
 for(const key of required.slice(-4))blockers[key]=true;
 return {schema:'draftai-c1-m5-recomputed-real-wasm-final-source-obligations/1',
  sourceGeometryId:'G',revision:1,
  realCADAndM5RecomputedFromCurrentOriginalReviewedSource:true,
  signedV5ActionCount:0,wholeSolidV5Ready:false,
  counts:{totalOriginalSourceEdgeViewSubspans:1},
  subspans:[{sourceGeometryId:'G',revision:1,view:'V',sourceEdgeId:'G::A|B',
   originalSourceParameterRange:[0,1],blockers,
   positiveLineLikeGeometryReadyForFurtherM5Proof:true,
   formalStandardLineStyle:'undetermined',
   certifiedEngineeringSolidLine:false,certifiedEngineeringDashedLine:false,
   constructionIntentAuthorized:false,signedV5Action:false}]};
}
test('positive local evidence remains unsigned with explicit global blockers',()=>{
 const result=review(fixture());
 assert.equal(result.localPositiveCount,1);
 assert.equal(result.fullyCertifiedCount,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.equal(result.rows[0].formalLineStyle,'undetermined');
 assert.ok(result.rows[0].blockingReasons.includes(
  'completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified'));
 assert.ok(Object.isFrozen(result.rows[0].blockingReasons));
});
test('forged standard signoff or V5 action is rejected',()=>{
 const signed=fixture();signed.subspans[0].signedV5Action=true;
 assert.throws(()=>review(signed),/invalid|signed/);
 const forged=fixture();
 forged.subspans[0].blockers.applicableStandardEngineeringLineStyleNotCertified=false;
 assert.throws(()=>review(forged),/global signoff/);
});
test('missing blocker, stale revision and count mismatch fail closed',()=>{
 const missing=fixture();delete missing.subspans[0].blockers.sourceCrossEdgeJunctionsNotGloballyCertified;
 assert.throws(()=>review(missing),/invalid/);
 const stale=fixture();stale.subspans[0].revision=2;
 assert.throws(()=>review(stale),/stale/);
 const count=fixture();count.counts.totalOriginalSourceEdgeViewSubspans=2;
 assert.throws(()=>review(count),/count mismatch/);
});
