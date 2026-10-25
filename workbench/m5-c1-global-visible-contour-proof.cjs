'use strict';
/**
 * C1 / shared M5: a POSITIVE but narrowly bounded complete visible
 * projected-outline theorem for ONE reviewed, closed, convex opaque mesh.
 *
 * Recomputes the existing #708 paper hull, #712/#714 real source endpoints,
 * #713/#715 complete source-open rays and exact 3D junctions. No caller
 * "proof: true" is accepted. A view is releasable only if its ENTIRE source
 * interval ring has uniquely identified front sources, clear rays, no depth
 * swaps and both exact physical junctions for every atomic segment.
 *
 * Closed convex -> orthographic projection's boundary is the actual outer
 * silhouette. Source-backed exterior visible contour gets a CONTINUOUS WIDE
 * line per GB/T 4457.4-2002, scope is not hidden/internal feature lines.
 * Tangency, overlap, extra solids, and any failed ring obligation block.
 *
 * This module emits a proof-bound LINE CLAIM, never a ConstructionStep/V5
 * command. The sole C1 V5 consumer must re-bind these claims to its actual
 * reviewed Geometry Scene and canonical point source graph.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {auditC1ConvexContourSourceCoverage}=
 require('./m5-c1-convex-contour-source-coverage.cjs');
const {auditC1ContourPhysicalJunctionIncidence}=
 require('./m5-c1-contour-physical-junction-incidence.cjs');
const {auditC1ContinuousFrontmostSourceRays}=
 require('./m5-c1-continuous-frontmost-source-rays.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);
 Object.freeze(x);
}return x;};
const equal3=(a,b)=>a&&b&&['x','y','z'].every(k=>a[k]===b[k]);
const near2=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v)<=1e-7;
const BLOCK='undetermined';

function auditC1GlobalVisibleContourProof({geometry,revision}={}){
 if(!geometry||geometry.kind!=='mesh'||geometry.space!=='model-3d'||
    geometry.unit!=='mm'||!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('reviewed current single convex 3D mm source required');
 // All original single-source proofs are freshly recomputed here, ONCE,
 // and reused unchanged by the existing vertex/one-V5 consumer.
 const contourCoverage=auditC1ConvexContourSourceCoverage({geometry,revision});
 const contourPhysicalJunctionIncidence=auditC1ContourPhysicalJunctionIncidence({
  geometry,revision,contourCoverage});
 const continuousFrontmostSourceRays=auditC1ContinuousFrontmostSourceRays({
  geometry,revision,contourCoverage,
  physicalJunctionIncidence:contourPhysicalJunctionIncidence});
 const c=contourCoverage,j=contourPhysicalJunctionIncidence,
  r=continuousFrontmostSourceRays;
 if(c.status!=='scoped-convex-hull-physical-source-coverage'||
    c.sourceGeometryId!==geometry.id||c.revision!==revision||
    c.completeProjectedConvexBoundaryGeometryVerified!==true||
    c.fullPhysicalSourceContourCoverageVerified!==true||
    j.sourceGeometryId!==geometry.id||j.revision!==revision||
    r.sourceGeometryId!==geometry.id||r.revision!==revision||
    ![c,j,r].every(Object.isFrozen)||
    [c.officialLineStylesVerified,r.officialLineStylesVerified].some(Boolean)||
    c.completeSolidV5Ready!==false||r.v5Ready!==false)
  throw new RangeError('complete current unsigned convex M5 evidence required');
 const views=[];
 for(const view of VIEWS){
  const cv=c.views.find(x=>x.view===view),
   jv=j.views.find(x=>x.view===view),
   rv=r.views.find(x=>x.view===view),
   spans=cv?.sides.flatMap(s=>s.intervals)??[];
  if(!cv||!jv||!rv||spans.length<3||
     spans.length!==jv.junctions.length||
     spans.length!==rv.intervals.length||
     spans.length!==rv.frontSourceJunctions.length||
     !cv.wholeConvex2DBoundaryVerified||
     !cv.everyHullSideCoveredByPhysicalSourceEdges)
   throw new TypeError('first-angle complete closed paper boundary missing');
  let blockedCount=0;
  const candidates=[];
  for(let i=0;i<spans.length;i++){
   const s=spans[i],line=rv.intervals[i],
    source=line.sources.find(x=>x.sourceEdgeId===line.uniqueStrictFrontSourceId),
    entry=rv.frontSourceJunctions[(i+spans.length-1)%spans.length],
    exit=rv.frontSourceJunctions[i];
   if(s.revision!==revision||s.sourceGeometryId!==geometry.id||
      s.view!==view||line.view!==view||
      s.officialLineStyle!==BLOCK||line.standardEngineeringLineStyle!==BLOCK||
      s.v5StrokeAuthorized!==false||line.signedV5LineAction!==false)
    throw new TypeError('current canonical unsigned contour source required');
   const matches=Boolean(source&&
    s.sourceEdgeIds.includes(source.sourceEdgeId)&&
    near2(s.fromModelMm,line.paperFromModelMm)&&
    near2(s.toModelMm,line.paperToModelMm)&&
    near2(project(source.from3D)[view],s.fromModelMm)&&
    near2(project(source.to3D)[view],s.toModelMm));
   const joined=Boolean(entry.localFrontRayPhysicalJunctionCandidateVerified&&
    exit.localFrontRayPhysicalJunctionCandidateVerified&&
    entry.departingFrontSourceEdgeId===source?.sourceEdgeId&&
    exit.arrivingFrontSourceEdgeId===source?.sourceEdgeId&&
    equal3(jv.junctions[(i+spans.length-1)%spans.length]
      .authenticatedCommon3DJoinCandidates.find(q=>
        q.departingSourceEdgeId===source?.sourceEdgeId&&
        q.arrivingSourceEdgeId===entry.arrivingFrontSourceEdgeId)?.real3DPoint,
      source?.from3D)&&
    equal3(jv.junctions[i].authenticatedCommon3DJoinCandidates.find(q=>
      q.arrivingSourceEdgeId===source?.sourceEdgeId&&
      q.departingSourceEdgeId===exit.departingFrontSourceEdgeId)?.real3DPoint,
      source?.to3D));
   const clear=Boolean(source?.fullOpenSubintervalClear&&
    line.wholeIntervalFrontSourceClearRayVerified&&
    line.uniqueStrictFrontPhysical3DSourceAmongListedCandidates&&
    !line.unresolvedDepthSwitchOrTie);
   const eligible=matches&&joined&&clear;
   if(!eligible)blockedCount++;
   candidates.push({view,revision,sourceGeometryId:geometry.id,
    projectedFromModelMm:{...s.fromModelMm},
    projectedToModelMm:{...s.toModelMm},
    real3DFrom:source?{...source.from3D}:null,
    real3DTo:source?{...source.to3D}:null,
    sourceEdgeId:source?.sourceEdgeId??null,
    canonicalHullSideIndex:s.sideIndex,
    sourceContourCoverageVerified:matches,
    genuineFrontSourceEndpointJoinsVerified:joined,
    continuouslyFrontRayClearVerified:clear,
    locallyCompleteVisibleHullSegmentProven:eligible,
    // Cannot release a partial ring by itself: a missing adjacent source
    // or unresolved switch could change the global closed drawing graph.
    signedOfficialLineStyle:BLOCK,
    v5ActionAuthorized:false});
  }
  const global=blockedCount===0&&
   candidates.length===spans.length&&
   r.ambiguousDepthIntervalCount===0;
  views.push({view,revision,
   globalSingleConvexClosedVisibleContourVerified:global,
   everyAtomicPaperHullSourceRetained:true,
   fullPhysicalJunctionAndContinuousVisibilityVerified:global,
   blockedAtomicIntervalCount:blockedCount,
   candidateIntervals:candidates.map(x=>({...x,
    signedOfficialLineStyle:global?
     'gb-t-4457.4-continuous-wide-visible-outline':BLOCK,
    v5ActionAuthorized:global})),
   allContourLinesVerified:global});
 }
 const accepted=views.filter(x=>x.allContourLinesVerified);
 return freeze({
  schema:'draftai-m5-c1-single-convex-visible-contour/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  proofScope:'single-reviewed-closed-convex-opaque-exterior-silhouette',
  contourCoverage,contourPhysicalJunctionIncidence,
  continuousFrontmostSourceRays,views,
  acceptedFirstAngleViews:accepted.map(v=>v.view),
  certifiedVisibleContourLineCount:accepted.reduce((n,v)=>
   n+v.candidateIntervals.length,0),
  allThreeViewsGlobalContourCertified:accepted.length===3,
  nonExteriorInternalEdgesSigned:false,
  hiddenLineTopologyAndStylesCertified:false,
  allGeometryMultiBodyC2AndAnalyticC3Certified:false,
  // Releasable scoped lines; consumer must independently verify
  // ConstructionIntent source/projection/DAG and ONE V5 action parity.
  canonicalV5ActionParityVerified:false,
  actualOriginalTextbookBlindTestPassed:false
 });
}
module.exports={auditC1GlobalVisibleContourProof};
