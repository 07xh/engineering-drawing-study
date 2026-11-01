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
function reviewC1M5FinalStrokeObligations(ledger,{geometry}={}){
 if(!ledger||ledger.schema!=='draftai-c1-m5-recomputed-real-wasm-final-source-obligations/1'||
    !Number.isSafeInteger(ledger.revision)||ledger.revision<1||
    ledger.realCADAndM5RecomputedFromCurrentOriginalReviewedSource!==true||
    ledger.signedV5ActionCount!==0||ledger.wholeSolidV5Ready!==false||
    !Array.isArray(ledger.subspans)||
    typeof ledger.sourceGeometryId!=='string'||!ledger.sourceGeometryId.trim())
  throw new TypeError('canonical unsigned real-WASM M5 obligations required');
 // The final M5 subspan ledger cannot enumerate a source/view it omitted.
 // Reconstruct the independent M0 physical-edge × first-angle-view universe
 // when the real reviewed geometry is supplied. An absent pair is NOT a
 // complete [0,1] partition, even when every observed pair is gap-free.
 const expectedSourceViewKeys=geometry===undefined?null:(()=>{
  if(geometry?.id!==ledger.sourceGeometryId||
     geometry.kind!=='mesh'||geometry.space!=='model-3d'||
     geometry.unit!=='mm'||!Array.isArray(geometry.data?.edges)||
     geometry.data.edges.length===0||!geometry.data?.points)
   throw new TypeError('current original M0 geometry required for source inventory');
  const sourceIds=new Set();
  for(const edge of geometry.data.edges){
   if(!Array.isArray(edge)||edge.length!==2||
      edge.some(id=>typeof id!=='string'||!id.trim()||
       !geometry.data.points[id])||edge[0]===edge[1])
    throw new TypeError('invalid original M0 physical edge inventory');
   const id=geometry.id+'::'+[...edge].sort().join('|');
   if(sourceIds.has(id))
    throw new TypeError('duplicate original M0 physical edge inventory');
   sourceIds.add(id);
  }
  return new Set([...sourceIds].flatMap(id=>
   ['V','H','W'].map(view=>JSON.stringify([view,id]))));
 })();
 const exactSourceKeys=new Set(),intervalsBySourceView=new Map();
 const viewsSeen=new Set();
 const rows=ledger.subspans.map((span,index)=>{
  if(span.sourceGeometryId!==ledger.sourceGeometryId||
     span.revision!==ledger.revision||
     !['V','H','W'].includes(span.view)||
     typeof span.sourceEdgeId!=='string'||!span.sourceEdgeId.trim()||
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
  if(expectedSourceViewKeys!==null&&
     !expectedSourceViewKeys.has(JSON.stringify([span.view,span.sourceEdgeId])))
   throw new TypeError('M5 subspan has no original M0 physical source/view');
  viewsSeen.add(span.view);
  const sourceKey=JSON.stringify([span.view,span.sourceEdgeId,start,end]);
  if(exactSourceKeys.has(sourceKey))
   throw new TypeError('duplicate original 3D source interval');
  exactSourceKeys.add(sourceKey);
  const owner=JSON.stringify([span.view,span.sourceEdgeId]);
  if(!intervalsBySourceView.has(owner))intervalsBySourceView.set(owner,[]);
  intervalsBySourceView.get(owner).push([start,end]);
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
 // This original-parameter partition may share exact endpoints, but
 // strictly positive overlap must never inflate independent M5 subspans.
 // Report every positive unrepresented parameter interval for OBSERVED
 // source/view pairs. This is a diagnostic obligation, never a M5 signature;
 // an entirely absent source/view must be found by the upstream inventory.
 const uncoveredOriginalParameterRanges=[];
 for(const [owner,intervals] of intervalsBySourceView){
  const [view,sourceEdgeId]=JSON.parse(owner);
  intervals.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  let cursor=0;
  for(const [start,end] of intervals){
   if(start<cursor)
    throw new TypeError('overlapping original 3D source intervals');
   if(start>cursor)uncoveredOriginalParameterRanges.push({
    view,sourceEdgeId,originalSourceParameterRange:[cursor,start]
   });
   cursor=end;
  }
  if(cursor<1)uncoveredOriginalParameterRanges.push({
   view,sourceEdgeId,originalSourceParameterRange:[cursor,1]
  });
 }
 const observedSourceViewKeys=new Set(intervalsBySourceView.keys());
 const missingOriginalSourceViews=expectedSourceViewKeys===null?null:
  [...expectedSourceViewKeys].filter(key=>!observedSourceViewKeys.has(key))
   .map(key=>{const [view,sourceEdgeId]=JSON.parse(key);
    return {view,sourceEdgeId,originalSourceParameterRange:[0,1]};
   });
 if(ledger.counts?.totalOriginalSourceEdgeViewSubspans!==rows.length)
  throw new TypeError('source interval count mismatch');
 return freeze({
  schema:'draftai-c1-m5-final-source-obligation-review/1',
  sourceGeometryId:ledger.sourceGeometryId,revision:ledger.revision,
  total:rows.length,viewsRepresented:['V','H','W'].filter(view=>viewsSeen.has(view)),
  independentOriginalM0InventoryAudited:expectedSourceViewKeys!==null,
  expectedOriginalSourceViewCount:expectedSourceViewKeys?.size??null,
  observedOriginalSourceViewCount:observedSourceViewKeys.size,
  missingOriginalSourceViews,
  missingOriginalSourceViewCount:missingOriginalSourceViews?.length??null,
  // A complete observed partition does not erase wholly absent source/view pairs.
  allOriginalSourceViewsHaveCompleteParameterPartitions:
   expectedSourceViewKeys!==null&&missingOriginalSourceViews.length===0&&
   uncoveredOriginalParameterRanges.length===0,
  uncoveredOriginalParameterRanges,
  observedSourceViewsWithUncoveredOriginalParameters:new Set(
   uncoveredOriginalParameterRanges.map(x=>JSON.stringify([x.view,x.sourceEdgeId]))
  ).size,
  localPositiveCount:rows.filter(x=>x.localPositive).length,
  fullyCertifiedCount:0,signedV5ActionCount:0,
  unresolvedByProofClass:Object.fromEntries(
   ['original3DSourceIdentity','completeIntervalVisibility',
    'endpointAndProjectionTopology','engineeringLineStandard',
    'soleConstructionIntentDAGV5'].map(key=>
     [key,rows.filter(row=>row.independentGlobalProofGaps[key]).length])),
  rows
 });
}
module.exports={reviewC1M5FinalStrokeObligations};
