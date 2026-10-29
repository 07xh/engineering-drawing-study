'use strict';
/**
 * Positive ORIGINAL M0 convex-source ray theorem on every REAL M5/HLR
 * parameter gap. Unlike a paper endpoint tolerance, the exact supporting
 * halfspace theorem covers the whole original 3D edge (hence each gap)
 * without sampling or interpolating its tiny binary64 endpoints.
 *
 * Crucial separation:
 *  - M0 original source rays can be positively clear/strictly interior.
 *  - missing OCCT generated HLR source intervals are STILL missing.
 *  - generated TopoDS history, global co-projected depth and V5 remain
 *    independent obligations. A strict-hidden OPEN edge does not prove
 *    its endpoint ray, especially when a gap begins at t=0.
 */
const {auditC1AllOriginalSourceNativeGaps}=
 require('./c1-all-native-source-gap-ledger.cjs');
const {auditC1OriginalClosedEdgeRayContinuity}=
 require('./c1-m5-closed-original-edge-ray-continuity.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC1NativeGapOriginalExactRays({geometry,cad,m5Ledger}={}){
 const gaps=auditC1AllOriginalSourceNativeGaps({geometry,cad,m5Ledger});
 // Recompute the existing M0/M4/M5 exact halfspace and original-vertex
 // certificates directly from the geometry, never from caller-supplied
 // booleans or from the HLR output itself.
 const rays=auditC1OriginalClosedEdgeRayContinuity({
  geometry,revision:cad.revision
 });
 if(rays.schema!=='draftai-c1-m5-exact-closed-original-edge-ray-and-cut-continuity/1'||
    rays.sourceGeometryId!==geometry.id||rays.revision!==cad.revision||
    rays.signedV5ActionCount!==0||rays.wholeSolidV5Ready!==false||
    rays.allActualOccludingSceneFacesCertified!==false)
  throw new RangeError('current unsigned exact original 3D convex source rays required');
 const bySource=new Map();
 for(const ray of rays.rows){
  const key=ray.view+'|'+ray.originalPhysicalSourceEdgeId;
  if(bySource.has(key))throw new RangeError('duplicate exact original source ray');
  bySource.set(key,ray);
 }
 // A missing M5 source/view is a distinct coverage obligation from a
 // positive gap inside an existing M5 span. Audit every noncollapsed
 // original M0 edge, including sources never emitted by the M5 ledger.
 const missingCandidates=new Map();
 for(const witness of gaps.unrepresentedM0NativeHLRCandidateForensics){
  const key=witness.view+'|'+witness.sourceEdgeId;
  if(missingCandidates.has(key)||
     !Number.isSafeInteger(witness.nativeHLRPaperCandidateCount)||
     witness.nativeHLRPaperCandidateCount<0||
     witness.nativeHLRPaperCandidateCount!==witness.nativeHLRPaperCandidates?.length||
     witness.continuousOcclusionCertified!==false||
     witness.signedV5Action!==false)
   throw new RangeError('invalid omitted M0 source HLR candidate inventory');
  missingCandidates.set(key,witness);
 }
 const missingOriginalM0SourceViewRows=[];
 const missingSeen=new Set();
 for(const missing of gaps.unrepresentedOriginalM0ProjectedSources){
  const key=missing.view+'|'+missing.sourceEdgeId;
  const ray=bySource.get(key),candidate=missingCandidates.get(key);
  if(missingSeen.has(key)||!ray||!candidate||
     ray.sourceGeometryId!==geometry.id||ray.revision!==cad.revision||
     ray.projectionCollapsed!==false||
     ray.signedV5Action!==false||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[0]!==0||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[1]!==1||
     missing.originalTopoDSHistoryCertified!==false||
     missing.signedV5Action!==false)
   throw new RangeError('unrepresented original M0 source/view lacks independent 3D ray');
  missingSeen.add(key);
  const closed=ray.originalPhysicalCreaseProven===true&&
   ray.completeSourceOriginal3DRayClosedIntervalClear===true&&
   ray.exactlyBothOriginalVertexForwardRaysClear===true;
  const hidden=ray.originalPhysicalCreaseProven===true&&
   ray.originalOpenEdgeStrictInteriorOcclusionProven===true;
  if(closed&&hidden)
   throw new RangeError('contradictory omitted M0 original ray witnesses');
  missingOriginalM0SourceViewRows.push({
   view:missing.view,sourceEdgeId:missing.sourceEdgeId,
   original3DVertexIds:[...ray.originalVertexIds],
   original3DRayStatus:closed?'exact-original-closed-ray-clear':
    hidden?'exact-original-open-strict-interior':'undetermined',
   originalM4SourcePartitionComplete:
    ray.originalM4Canonical3DSourcePartitionPositivelyProven===true,
   nativeHLRPaperCandidateCount:candidate.nativeHLRPaperCandidateCount,
   nativeHLRPaperCandidates:candidate.nativeHLRPaperCandidates.map(x=>({
    hlrClass:x.hlrClass,ordinal:x.ordinal
   })),
   missingM5SourceViewRemainsUncovered:true,
   generatedTopoDSToOriginalSourceHistoryCertified:false,
   globalCoProjectedFrontmostSourceCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 if(missingCandidates.size!==missingSeen.size)
  throw new RangeError('incomplete omitted original M0 source/view reconciliation');
 // Independent whole-M0 inventory equation: every drawable original
 // source/view is either represented by at least one current M5 span or
 // explicitly missing. Multiple M5 subspans must not inflate the count.
 const noncollapsedOriginalM0SourceViews=rays.rows.filter(x=>
  x.projectionCollapsed===false).length;
 const representedOriginalM0SourceViewsInM5=new Set(gaps.rows.filter(x=>
  x.sourceEdgeId&&bySource.get(x.view+'|'+x.sourceEdgeId)?.
   projectionCollapsed===false).map(x=>x.view+'|'+x.sourceEdgeId)).size;
 if(noncollapsedOriginalM0SourceViews!==
    representedOriginalM0SourceViewsInM5+missingSeen.size)
  throw new RangeError('incomplete whole-M0 noncollapsed V/H/W source inventory');
 const rows=[],counts={
  noncollapsedOriginalM0SourceViews,
  representedOriginalM0SourceViewsInM5,
  unrepresentedOriginalM0SourceViews:missingOriginalM0SourceViewRows.length,
  unrepresentedM0SourceViewsWithNativeHLRPaperCandidates:
   missingOriginalM0SourceViewRows.filter(x=>x.nativeHLRPaperCandidateCount>0).length,
  unrepresentedM0SourceViewsWithExactClosedRays:
   missingOriginalM0SourceViewRows.filter(x=>
    x.original3DRayStatus==='exact-original-closed-ray-clear').length,
  unrepresentedM0SourceViewsWithExactOpenHiddenRays:
   missingOriginalM0SourceViewRows.filter(x=>
    x.original3DRayStatus==='exact-original-open-strict-interior').length,
  independentOriginalOCCTCurvePositiveGapIntervals:0,
  positiveNativeGapIntervals:0,
  exactOriginalClosedRayClearGapIntervals:0,
  exactOriginalOpenStrictInteriorGapIntervals:0,
  originalSourceRayUnresolvedGapIntervals:0,
  nativeGeneratedHistoryGapsClosed:0,
  officialV5Actions:0
 };
 for(const entry of gaps.rows){
  if(entry.positiveGaps.length===0)continue;
  const ray=bySource.get(entry.view+'|'+entry.sourceEdgeId);
  if(!ray||ray.sourceGeometryId!==geometry.id||
     ray.revision!==cad.revision||ray.signedV5Action!==false||
     !Array.isArray(ray.originalVertexIds)||ray.originalVertexIds.length!==2||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[0]!==0||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[1]!==1)
   throw new RangeError('positive HLR gap lacks independently recomputed original M0 ray');
  const original=geometry.data.edges.find(edge=>
   geometry.id+'::'+[...edge].sort().join('|')===entry.sourceEdgeId);
  if(!original||original.some((id,i)=>id!==ray.originalVertexIds[i]))
   throw new RangeError('native HLR gap does not belong to exact original 3D edge');
  const closedClear=ray.originalPhysicalCreaseProven===true&&
   ray.completeSourceOriginal3DRayClosedIntervalClear===true&&
   ray.exactlyBothOriginalVertexForwardRaysClear===true;
  const openHidden=ray.originalPhysicalCreaseProven===true&&
   ray.originalOpenEdgeStrictInteriorOcclusionProven===true;
  if(closedClear&&openHidden)
   throw new RangeError('contradictory exact original full-edge ray theorems');
  const joint=entry.jointNativeGapForensics;
  if(joint?.positiveGapCount!==entry.positiveGaps.length||
     !Array.isArray(joint.rows)||joint.rows.length!==entry.positiveGaps.length||
     joint.fullOriginalSourceHistoryCertified!==false||
     joint.globalContinuousVisibilityCertified!==false)
   throw new RangeError('native gap lacks independent original OCCT curve evidence');
  for(const [gapOrdinal,range] of entry.positiveGaps.entries()){
   const originalCurve=joint.rows[gapOrdinal];
   if(originalCurve?.gapOrdinal!==gapOrdinal||
      originalCurve.view!==entry.view||
      originalCurve.sourceEdgeId!==entry.sourceEdgeId||
      originalCurve.originalSourceParameterGap?.[0]!==range[0]||
      originalCurve.originalSourceParameterGap?.[1]!==range[1]||
      originalCurve.exactOriginalOcctCurvePositive!==true||
      originalCurve.generatedToOriginalTopoDSHistoryProven!==false||
      originalCurve.globalContinuousOcclusionProven!==false||
      originalCurve.signedV5Action!==false)
    throw new RangeError('original OCCT curve gap and M5 source interval disagree');
   counts.independentOriginalOCCTCurvePositiveGapIntervals++;
   if(!Array.isArray(range)||range.length!==2||
      !range.every(Number.isFinite)||range[0]<0||
      !(range[1]>range[0])||range[1]>1)
    throw new RangeError('invalid positive original native gap');
   const status=closedClear?'exact-original-closed-ray-clear':
    openHidden?'exact-original-open-strict-interior':'undetermined';
   counts.positiveNativeGapIntervals++;
   if(closedClear)counts.exactOriginalClosedRayClearGapIntervals++;
   else if(openHidden)counts.exactOriginalOpenStrictInteriorGapIntervals++;
   else counts.originalSourceRayUnresolvedGapIntervals++;
   rows.push({
    view:entry.view,sourceEdgeId:entry.sourceEdgeId,
    originalSourceParameterGap:[...range],
    original3DVertexIds:[...ray.originalVertexIds],
    independentOriginalOCCTCurveGapPositive:true,
    originalOCCTCurveGapRoundedToZero:
     originalCurve.originalCurveRoundedParameterCollapsed===true,
    nativeHLRGapDiagnosis:originalCurve.diagnosis,
    independentOriginal3DExactRayStatus:status,
    exactOriginal3DRayProvenThroughoutOpenGap:closedClear||openHidden,
    exactOriginal3DRayProvenAtBothOriginalVertices:closedClear,
    originalM4SourcePartitionComplete:
     ray.originalM4Canonical3DSourcePartitionPositivelyProven===true,
    nativeHLRGeneratedEdgeCoversGap:false,
    generatedTopoDSToOriginalSourceHistoryCertified:false,
    globalCoProjectedFrontmostSourceCertified:false,
    engineeringLineStyle:'undetermined',
    signedV5Action:false
   });
  }
 }
 if(rows.length!==gaps.totals.individualPositiveNativeGaps||
    rows.length!==counts.independentOriginalOCCTCurvePositiveGapIntervals||
    missingOriginalM0SourceViewRows.length!==
     gaps.unrepresentedOriginalM0ProjectedSources.length||
    rows.length!==counts.exactOriginalClosedRayClearGapIntervals+
     counts.exactOriginalOpenStrictInteriorGapIntervals+
     counts.originalSourceRayUnresolvedGapIntervals)
  throw new RangeError('original exact ray/native HLR gap reconciliation incomplete');
 return freeze({
  schema:'draftai-c1-native-gap-positive-original-ray-theorem/1',
  sourceGeometryId:geometry.id,revision:cad.revision,
  originalSourceGapLedgerSchema:gaps.schema,
  independentOriginalClosedRaySchema:rays.schema,
  counts,rows,missingOriginalM0SourceViewRows,
  allNoncollapsedOriginalM0SourcesRepresentedInM5:
   missingOriginalM0SourceViewRows.length===0,
  allNativeHLRSourceGapsClosed:false,
  fullOriginalTopoDSGeneratedHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  officialV5Authorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1NativeGapOriginalExactRays};
