'use strict';
/**
 * Independently account for the FULL [0,1] original M0 edge parameter
 * inventory in V/H/W. A source's mere presence in an M5 ledger does not
 * prove that every portion of its original 3D edge is represented.
 *
 * This is a canonical M5 ROW-INVENTORY check, distinct from native HLR
 * parameter coverage, TopoDS provenance, continuous occlusion and V5.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);
 Object.freeze(x);
}return x;};
function auditC1OriginalM0InventoryCoverage({
 projectedOriginalSourcesByView,canonicalM5RowsByView
}={}){
 if(!projectedOriginalSourcesByView||!canonicalM5RowsByView)
  throw new TypeError('original projected M0 sources and canonical M5 rows required');
 const rows=[],orphanCanonicalM5Rows=[],counts={
  originalProjectedSourceViews:0,
  sourceViewsWithNoM5Rows:0,
  sourceViewsWithPartialM5ParameterCoverage:0,
  sourceViewsWithOverlappingM5ParameterSpans:0,
  sourceViewsWithUnboundM5SourceSpans:0,
  sourceViewsWithCompleteCanonicalM5ParameterInventory:0,
  canonicalM5RowsWithUnboundSourceIdentity:0,
  canonicalM5RowsOutsideNoncollapsedOriginalM0Inventory:0
 };
 for(const view of VIEWS){
  const original=projectedOriginalSourcesByView[view];
  const ledger=canonicalM5RowsByView[view];
  if(!(original instanceof Set)||original.size>2048||
     !Array.isArray(ledger)||ledger.length>2048)
   throw new TypeError('bounded canonical V/H/W original M0 source inventory required');
  // A complete inventory must account for the M5 ledger in BOTH directions.
  // Otherwise a perfectly covered original source could coexist with a
  // fabricated, collapsed-in-this-view or unbound M5 row and still report
  // all sources represented exactly once. Never promote such a ledger.
  for(let ordinal=0;ordinal<ledger.length;ordinal++){
   const row=ledger[ordinal];
   if(!row||row.view!==view||
      (row.sourceEdgeId!==null&&
       (typeof row.sourceEdgeId!=='string'||!row.sourceEdgeId)))
    throw new TypeError('canonical M5 row must have current view and a source identity or null');
   if(row.sourceEdgeId===null){
    counts.canonicalM5RowsWithUnboundSourceIdentity++;
    orphanCanonicalM5Rows.push({view,ordinal,sourceEdgeId:null,
     reason:'unbound-canonical-m5-source-identity'});
   }else if(!original.has(row.sourceEdgeId)){
    counts.canonicalM5RowsOutsideNoncollapsedOriginalM0Inventory++;
    orphanCanonicalM5Rows.push({view,ordinal,sourceEdgeId:row.sourceEdgeId,
     reason:'not-a-noncollapsed-original-m0-source-in-this-view'});
   }
  }
  for(const sourceEdgeId of original){
   if(typeof sourceEdgeId!=='string'||!sourceEdgeId)
    throw new RangeError('original M0 source identity required');
   const sourceRows=ledger.filter(row=>row?.sourceEdgeId===sourceEdgeId);
   const intervals=sourceRows.filter(row=>Array.isArray(row.originalParameterRange))
    .map(row=>[...row.originalParameterRange]);
   const unbound=sourceRows.length-intervals.length;
   const coverage=exactCandidateIntervalCoverage([0,1],intervals);
   // Detect double ownership even when the union happens to cover [0,1].
   // Sorting is essential: neither row order nor overlapping M5 fragments
   // may change the result. A touching endpoint is NOT positive overlap.
   const sorted=intervals.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
   const overlapping=[];let reach=0;
   for(const [start,end] of sorted){
    if(start<reach&&Math.min(end,reach)>start)
     overlapping.push([start,Math.min(end,reach)]);
    if(end>reach)reach=end;
   }
   const overlap=exactCandidateIntervalCoverage([0,1],overlapping).
    positiveLengthCoveredIntervals;
   const gaps=coverage.positiveLengthUncoveredIntervals;
   const complete=gaps.length===0&&overlap.length===0&&unbound===0;
   counts.originalProjectedSourceViews++;
   if(sourceRows.length===0)counts.sourceViewsWithNoM5Rows++;
   if(gaps.length)counts.sourceViewsWithPartialM5ParameterCoverage++;
   if(overlap.length)counts.sourceViewsWithOverlappingM5ParameterSpans++;
   if(unbound)counts.sourceViewsWithUnboundM5SourceSpans++;
   if(complete)counts.sourceViewsWithCompleteCanonicalM5ParameterInventory++;
   rows.push({view,sourceEdgeId,
    canonicalM5SourceSpanCount:sourceRows.length,
    canonicalM5UnboundSourceSpanCount:unbound,
    canonicalM5OriginalSourceParameterRanges:intervals,
    positiveLengthUnrepresentedM5ParameterIntervals:gaps,
    positiveLengthOverlappingM5ParameterIntervals:overlap,
    wholeOriginalM0SourceParameterInventoryComplete:complete,
    nativeGeneratedTopoDSToOriginalSourceHistoryCertified:false,
    globalContinuousVisibilityCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false});
  }
 }
 return freeze({schema:'draftai-c1-original-m0-canonical-m5-parameter-inventory/1',
  counts,rows,orphanCanonicalM5Rows,
  allNoncollapsedOriginalM0SourceParametersRepresentedExactlyOnce:
   counts.originalProjectedSourceViews===
    counts.sourceViewsWithCompleteCanonicalM5ParameterInventory&&
   counts.canonicalM5RowsWithUnboundSourceIdentity===0&&
   counts.canonicalM5RowsOutsideNoncollapsedOriginalM0Inventory===0,
  originalTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  officialV5Authorized:false});
}
module.exports={auditC1OriginalM0InventoryCoverage};
