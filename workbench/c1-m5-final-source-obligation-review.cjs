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
 const exactSourceKeys=new Set(),sourceIntervals=new Map();
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
  const [start,end]=span.originalSourceParameterRange;
  if(!Number.isFinite(start)||!Number.isFinite(end)||
     start<0||end>1)
   throw new TypeError('invalid original source parameter domain');
  const sourceKey=span.view+'@'+span.sourceEdgeId+'@'+start+'@'+end;
  if(exactSourceKeys.has(sourceKey))
   throw new TypeError('duplicate original 3D source interval');
  exactSourceKeys.add(sourceKey);
  // The original M0 3D source interval must not overlap another subspan
  // of the same source/view, even by exactly one binary64 representable step.
  if(!sourceIntervals.has(span.view))sourceIntervals.set(span.view,new Map());
  const group=sourceIntervals.get(span.view);
  if(!group.has(span.sourceEdgeId))group.set(span.sourceEdgeId,[]);
  group.get(span.sourceEdgeId).push([start,end]);
  const independentGlobalProofGaps={
   original3DSourceIdentity:span.blockers.originalSourceUniquenessNotProvenEvenAfterExactM0Pruning||
    span.originalCADTopoDSEdgeIdentityRecovered!==true,
   completeIntervalVisibility:span.blockers.wholeSingleConvexOpenRayNotPositivelyClear||
    span.blockers.completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified,
   endpointAndProjectionTopology:span.blockers.sourceCrossEdgeJunctionsNotGloballyCertified||
    span.blockers.projectedPaperOnlyEncountersNeedGlobalResolution,
   engineeringLineStandard:span.blockers.applicableStandardEngineeringLineStyleNotCertified,
   soleConstructionIntentDAGV5:span.blockers.originalConstructionIntentDAGAndSingleV5NotAuthorized
  };
  if(Object.values(independentGlobalProofGaps).some(v=>typeof v!=='boolean'))
   throw new TypeError('invalid global proof obligation');
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
   independentGlobalProofGaps,
   blockingReasons,formalLineStyle:'undetermined',
   constructionIntentAuthorized:false,signedV5Action:false
  };
 });
 // Recompute original source parameter gaps without epsilon or paper
 // approximation. An absent segment is a diagnostic hold, not a proof that
 // the original geometry itself is incomplete (e.g. source may be exterior).
 // The caller must still independently prove complete original CAD source
 // inventory and global opaque-scene occlusion before signing any line.
 const originalSourceIntervalDiagnostics=[];
 for(const [view,group] of sourceIntervals){
  for(const [sourceEdgeId,ranges] of group){
   const ordered=[...ranges].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
   const uncovered=[];let cursor=0;
   for(const [start,end] of ordered){
    if(start<cursor)
     throw new TypeError('overlapping original 3D source parameter intervals');
    if(start>cursor)uncovered.push([cursor,start]);
    cursor=end;
   }
   if(cursor<1)uncovered.push([cursor,1]);
   originalSourceIntervalDiagnostics.push({
    view,sourceEdgeId,observedOriginalSourceSubspanCount:ordered.length,
    observedOriginalParameterRanges:ordered.map(r=>[...r]),
    positiveLengthUncoveredOriginalParameterRanges:uncovered,
    observedSpansExactNonoverlap:true,
    originalSourceFullCoverageFromObservedSpansOnly:uncovered.length===0,
    entire3DSourceInventoryIndependentlyProven:false,
    opaqueSceneVisibilityCertified:false,
    formalLineStyle:'undetermined',signedV5Action:false
   });
  }
 }
 originalSourceIntervalDiagnostics.sort((a,b)=>
  a.view.localeCompare(b.view)||a.sourceEdgeId.localeCompare(b.sourceEdgeId));
 if(ledger.counts?.totalOriginalSourceEdgeViewSubspans!==rows.length)
  throw new TypeError('source interval count mismatch');
 return freeze({
  schema:'draftai-c1-m5-final-source-obligation-review/1',
  sourceGeometryId:ledger.sourceGeometryId,revision:ledger.revision,
  total:rows.length,localPositiveCount:rows.filter(x=>x.localPositive).length,
  fullyCertifiedCount:0,signedV5ActionCount:0,
  observedOriginalSourceViewGroups:originalSourceIntervalDiagnostics.length,
  observedSourceViewGroupsWithPositiveUncoveredRanges:
   originalSourceIntervalDiagnostics.filter(x=>
    x.positiveLengthUncoveredOriginalParameterRanges.length>0).length,
  observedPositiveUncoveredOriginalSourceParameterRanges:
   originalSourceIntervalDiagnostics.reduce((n,x)=>
    n+x.positiveLengthUncoveredOriginalParameterRanges.length,0),
  originalSourceIntervalDiagnostics,
  unresolvedByProofClass:Object.fromEntries(
   ['original3DSourceIdentity','completeIntervalVisibility',
    'endpointAndProjectionTopology','engineeringLineStandard',
    'soleConstructionIntentDAGV5'].map(key=>
     [key,rows.filter(row=>row.independentGlobalProofGaps[key]).length])),
  rows
 });
}
module.exports={reviewC1M5FinalStrokeObligations};
