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
 const rows=[],counts={
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
  for(const range of entry.positiveGaps){
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
    rows.length!==counts.exactOriginalClosedRayClearGapIntervals+
     counts.exactOriginalOpenStrictInteriorGapIntervals+
     counts.originalSourceRayUnresolvedGapIntervals)
  throw new RangeError('original exact ray/native HLR gap reconciliation incomplete');
 return freeze({
  schema:'draftai-c1-native-gap-positive-original-ray-theorem/1',
  sourceGeometryId:geometry.id,revision:cad.revision,
  originalSourceGapLedgerSchema:gaps.schema,
  independentOriginalClosedRaySchema:rays.schema,
  counts,rows,
  allNativeHLRSourceGapsClosed:false,
  fullOriginalTopoDSGeneratedHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  officialV5Authorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1NativeGapOriginalExactRays};
