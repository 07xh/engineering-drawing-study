'use strict';
/**
 * Presentation-only W source-interval consumer for C3.
 *
 * Recomputes the actual M3/M5 joint audit; it does not infer any ray outcome
 * by samples, assign engineering strokes, or authorize a V5 curve action.
 * An exact W projected-depth collision between different source positions
 * disables the three-color preview: it must not imply a unique visible
 * drawing stroke when overlapping source curves have different depths.
 */
const {auditC3JointTopologyVisibility}=require('./c3-joint-topology-visibility.cjs');
const {auditC3WProjectedSourceEdges}=require('./c3-w-projected-source-outline.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function buildC3WIntervalPreview({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current reviewed C3 model revision required');
 const audit=auditC3JointTopologyVisibility({input,revision});
 const notCovered=()=>freeze({schema:'draftai-c3-w-ray-preview/1',
  revision,status:'not-covered',intervals:[],certifiedClearCount:0,
  certifiedOccludedCount:0,undeterminedCount:0,
  officialLineStylesVerified:false,v5CurveReady:false});
 if(audit.status!=='scoped-open-interval-joint-evidence')return notCovered();
 const injective=audit.wLateralProjection
  ?.projectedLateralLateralPointInjectivityVerified===true;
 // The original source silhouettes and finite-cap outlines must introduce
 // no missing crossing INSIDE an already-classified source W interval.
 const outline=auditC3WProjectedSourceEdges({input,revision});
 const sourceContourPartitionComplete=outline.status===
  'scoped-analytic-source-outline-event-partition'&&
  outline.originalM3BranchCount===audit.sourceBranchCount&&
  outline.sourceOutlineOpenOverlapExcluded===true&&
  outline.everyProjectedEventAtExistingWPartitionBoundary===true;
 const colorEligible=injective&&sourceContourPartitionComplete;
 const source=audit.intervals.filter(i=>i.view==='W');
 if(!source.length||source.length>256||
    new Set(source.map(i=>i.branchId)).size!==audit.sourceBranchCount||
    source.some(i=>!i.sourceM3AnalyticBranchVerified||
      !i.physicalGraphBranchAccountedFor||
      !Array.isArray(i.xOpenRange)||i.xOpenRange.length!==2||
      !i.xOpenRange.every(Number.isFinite)||
      i.xOpenRange[1]<=i.xOpenRange[0]||
      !['clear','occluded','undetermined'].includes(i.openInteriorStatus)||
      i.v5ActionAuthorized!==false||
      i.standardLineStyle!=='undetermined'))
  throw new RangeError('incomplete or unreviewed C3 W source interval proof');
 const intervals=source.map(row=>({
  branchId:row.branchId,
  xOpenRange:[...row.xOpenRange],
  originalM5EvidenceId:row.originalM5EvidenceId,
  // These labels are a continuously proven first-angle viewer-ray
  // classification of the OPEN interior, not a standard stroke definition.
  openInteriorRayStatus:colorEligible?row.openInteriorStatus:'undetermined',
  wSourceProjectionInjectivityVerified:injective,
  sourceOutlinePartitionVerified:sourceContourPartitionComplete,
  confidenceScope:'open-interval-finite-volume-ray-only',
  transitionAndEndpointVisibilityVerified:false,
  otherProjectedContoursVerified:false,
  officialLineStyle:'undetermined',
  v5CurveActionAuthorized:false
 }));
 for(const branchId of new Set(intervals.map(i=>i.branchId))){
  const pieces=intervals.filter(i=>i.branchId===branchId)
   .sort((a,b)=>a.xOpenRange[0]-b.xOpenRange[0]);
  if(pieces.some((p,i)=>i>0&&
     p.xOpenRange[0]!==pieces[i-1].xOpenRange[1]))
   throw new RangeError('W interval consumer left source gap or overlap');
 }
 return freeze({schema:'draftai-c3-w-ray-preview/1',revision,
  status:'source-bounded-W-open-ray-preview',
  sourceM3BranchCount:audit.sourceBranchCount,
  exactProjectedLateralSelfOverlapExcluded:injective,
  sourceOutlineEventCount:outline.eventCount||0,
  projectedSourceOutlineEventsSeparatedAtWBoundaries:sourceContourPartitionComplete,
  intervals,
  certifiedClearCount:intervals.filter(i=>i.openInteriorRayStatus==='clear').length,
  certifiedOccludedCount:intervals.filter(i=>i.openInteriorRayStatus==='occluded').length,
  undeterminedCount:intervals.filter(i=>i.openInteriorRayStatus==='undetermined').length,
  entireFeatureContourVerified:false,
  fullThreeViewLineStylesVerified:false,
  officialLineStylesVerified:false,
  v5CurveReady:false});
}
module.exports={buildC3WIntervalPreview};
