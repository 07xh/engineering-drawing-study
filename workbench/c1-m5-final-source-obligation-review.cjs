'use strict';
/**
 * Fail-closed, read-only review of canonical C1/M5 source-stroke obligations.
 * Never issues a line style, ConstructionIntent, DAG step or V5 action.
 */
const REQUIRED=[
 'realPhysicalCreaseNotProven',
 'existingOuterContourHasOriginalV5Authority',
 'wholeSingleConvexOpenRayNotPositivelyClear',
 'strictWholeSingleConvexOpenRayHidden',
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
const freeze=(value)=>{
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  for(const child of Object.values(value))freeze(child);
  Object.freeze(value);
 }
 return value;
};
function reviewC1M5FinalStrokeObligations(ledger){
 if(!ledger||ledger.schema!=='draftai-c1-m5-recomputed-real-wasm-final-source-obligations/1'||
    !Number.isSafeInteger(ledger.revision)||ledger.revision<1||
    ledger.realCADAndM5RecomputedFromCurrentOriginalReviewedSource!==true||
    ledger.signedV5ActionCount!==0||ledger.wholeSolidV5Ready!==false||
    !Array.isArray(ledger.subspans))
  throw new TypeError('canonical unsigned real-WASM M5 obligations required');
 const rows=ledger.subspans.map((span,index)=>{
  if(span.sourceGeometryId!==ledger.sourceGeometryId||
     span.revision!==ledger.revision||
     !['V','H','W'].includes(span.view)||
     typeof span.sourceEdgeId!=='string'||
     !Array.isArray(span.originalSourceParameterRange)||
     span.originalSourceParameterRange.length!==2||
     !(span.originalSourceParameterRange[0]<span.originalSourceParameterRange[1])||
     !span.blockers||REQUIRED.some(key=>typeof span.blockers[key]!=='boolean')||
     span.formalStandardLineStyle!=='undetermined'||
     span.certifiedEngineeringSolidLine!==false||
     span.certifiedEngineeringDashedLine!==false||
     span.constructionIntentAuthorized!==false||
     span.signedV5Action!==false)
   throw new TypeError('invalid, stale or prematurely signed source stroke');
  const blockingReasons=REQUIRED.filter(key=>span.blockers[key]);
  if(!span.blockers.applicableStandardEngineeringLineStyleNotCertified||
     !span.blockers.originalConstructionIntentDAGAndSingleV5NotAuthorized||
     !span.blockers.completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified||
     !span.blockers.sourceCrossEdgeJunctionsNotGloballyCertified)
   throw new TypeError('unsigned canonical source falsely claims global signoff');
  return {
   index,view:span.view,sourceEdgeId:span.sourceEdgeId,
   originalSourceParameterRange:[...span.originalSourceParameterRange],
   localPositive:span.positiveLineLikeGeometryReadyForFurtherM5Proof===true,
   blockingReasons,formalLineStyle:'undetermined',
   constructionIntentAuthorized:false,signedV5Action:false
  };
 });
 if(ledger.counts?.totalOriginalSourceEdgeViewSubspans!==rows.length)
  throw new TypeError('source interval count mismatch');
 return freeze({
  schema:'draftai-c1-m5-final-source-obligation-review/1',
  sourceGeometryId:ledger.sourceGeometryId,revision:ledger.revision,
  total:rows.length,localPositiveCount:rows.filter(x=>x.localPositive).length,
  fullyCertifiedCount:0,signedV5ActionCount:0,
  rows
 });
}
module.exports={reviewC1M5FinalStrokeObligations};
