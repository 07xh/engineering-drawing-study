'use strict';
/**
 * C1 shared M0->M5: FULL source-subspan first-angle forward observer-ray
 * classification against ONE CURRENT, independently reviewed, CLOSED
 * CONVEX opaque solid. Source cuts come from the existing M4 source graph;
 * no sampling, no reference answer, no fabricated face or vertex.
 *
 * Clearance is the UNION of existing exact original incident-face
 * outward-ray theorem and conservative analytic convex-segment clearance.
 * Hidden requires existing continuous strict-interior ray coverage of
 * the WHOLE open source subspan, not absence from a CAD visible list.
 * These are opaque-ray mathematical observations ONLY: full frontmost
 * source ID, all 3D junctions, GB styles and unique V5 are not signed.
 */
const {VIEWS,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {auditC1ReviewedProjectedSourceEventGraph}=
 require('./c1-reviewed-projected-source-event-graph.cjs');
const {outwardProof,inwardProof}=require('../core/numeric/convex-incident-source-open-ray.cjs');
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {evaluateFullSourceSegmentOcclusion}=
 require('../core/verification/convex-occlusion-coverage.cjs');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const child of Object.values(o))freeze(child);
  Object.freeze(o);
 }return o;
};
const id=(g,a,b)=>g.id+'::'+[a,b].sort().join('|');
function auditC1SingleConvexSourceSubspanRays({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current original C1 source revision required');
 const convex=verifiedConvexMeshHalfspaces(geometry);
 const eventGraph=auditC1ReviewedProjectedSourceEventGraph({
  geometry,revision,proofMode:'m5-hull-required'
 });
 if(convex.sourceGeometryId!==geometry.id||
    eventGraph.sourceGeometryId!==geometry.id||
    eventGraph.revision!==revision||
    eventGraph.originalM5ExteriorHullRecomputedAndAvailable!==true||
    eventGraph.proofMode!=='m5-hull-required'||
    eventGraph.signedV5ActionCount!==0||
    eventGraph.sourceIntervalEngineeringLineStylesCertified!==false)
  throw new RangeError('M5-authenticated original source subspan proof required');
 const original=new Map(geometry.data.edges.map(([a,b])=>[
  id(geometry,a,b),[a,b]]));
 const solids=[{id:geometry.id,halfspaces:convex.halfspaces}];
 const results=[],counts={subspanCount:0,clear:0,strictHidden:0,
  unresolved:0,excludedAlreadySignedContour:0,
  exactOriginalFaceOutwardClear:0,analyticClear:0,
  exactOriginalEdgeStrictInwardHidden:0,analyticStrictHidden:0,
  attemptedFormalV5Actions:0};
 for(const row of eventGraph.rows){
  if(!VIEWS.includes(row.view)||!original.has(row.sourceEdgeId))
   throw new RangeError('recomputed M4 source identity missing');
  const vertices=original.get(row.sourceEdgeId);
  if(JSON.stringify(vertices)!==JSON.stringify(row.sourceOriginalVertexIds))
   throw new RangeError('original C1 3D endpoints have changed');
  const exact=outwardProof({geometry,sourceVertexIds:vertices,
   view:row.view,convexProof:convex});
  const inward=inwardProof({geometry,sourceVertexIds:vertices,
   view:row.view,convexProof:convex});
  for(const span of row.spans){
   if(span.sourceEdgeId!==row.sourceEdgeId||span.view!==row.view||
      span.sourceGeometryId!==geometry.id||
      span.signedV5Action!==false||
      span.engineeringLineStyle!=='undetermined'||
      !Array.isArray(span.originalParameterRange)||
      span.originalParameterRange.length!==2)
    throw new RangeError('unsigned current M4 source interval required');
   const source={id:'C1Subspan',from:span.from3D,to:span.to3D};
   // M4 must retain real positive binary64 source tails, even when
   // their 3D endpoint distance is below the analytic clearance kernel's
   // positive margin. That kernel explicitly rejects such microsegments.
   // Do not weaken its margin or fabricate a clearance certificate:
   // consume the whole-original-edge exact support ray independently and
   // keep the projected microspan UNDRAWABLE and unsigned.
   const microPaper=span.projectedSubpixelPaperSegmentHeldAsUndrawable===true;
   const clearance=microPaper?null:certifyConvexSegmentClearance({
    source,solid:solids[0],
    observerDirection:FIRST_ANGLE_OBSERVER_RAYS[row.view]});
   const occluded=evaluateFullSourceSegmentOcclusion({
    source,solids,view:row.view});
   const byExact=exact.status==='certified-clear';
   const byAnalytic=clearance?.status==='certified-clear';
   const visible=byExact||byAnalytic;
   const exactHidden=inward.fullOriginalSourceOpenIntervalStrictlyHidden===true;
   const analyticHidden=occluded.entireSourceSegmentOccluded===true;
   const hidden=exactHidden||analyticHidden;
   if(visible&&hidden)
    throw new RangeError('C1 M0 original source has contradictory continuous open ray evidence');
   const status=microPaper?'undetermined':
    span.projectedExteriorHullOverlap===true?
    'exterior-contour-held-by-original-m5':
    visible?'single-opaque-solid-whole-open-ray-clear':
    hidden?'single-opaque-solid-whole-open-ray-strictly-hidden':
    'undetermined';
   counts.subspanCount++;
   if(status==='exterior-contour-held-by-original-m5')
    counts.excludedAlreadySignedContour++;
   else if(visible)counts.clear++;
   else if(hidden)counts.strictHidden++;
   else counts.unresolved++;
   if(byExact)counts.exactOriginalFaceOutwardClear++;
   if(byAnalytic)counts.analyticClear++;
   if(exactHidden)counts.exactOriginalEdgeStrictInwardHidden++;
   if(analyticHidden)counts.analyticStrictHidden++;
   results.push({
    view:row.view,revision,sourceGeometryId:geometry.id,
    sourceEdgeId:row.sourceEdgeId,
    originalVertexIds:[...vertices],
    originalParameterRange:[...span.originalParameterRange],
    projectedSubpixelPaperSegmentHeldAsUndrawable:microPaper,
    source3DIntervalPreservedForFullM5RayContinuity:
     span.source3DIntervalPreservedForFullM5RayContinuity===true,
    source3DFrom:{...span.from3D},source3DTo:{...span.to3D},
    fromModelMm:{...span.fromModelMm},
    toModelMm:{...span.toModelMm},
    originalM5ExteriorContourOverlap:span.projectedExteriorHullOverlap,
    status,
    exactOriginalFaceWholeOpenRayClear:byExact,
    analyticConservativeWholeOpenRayClear:byAnalytic,
    fullAnalyticStrictInteriorRayOcclusion:analyticHidden,
    exactOriginalSourceStrictInwardOpenRayHidden:exactHidden,
    allOriginalSupportPlanesVerifiedForStrictInward:
     inward.status==='certified-strictly-hidden-open-original-edge',
    signedLineStyle:'undetermined',
    real3DEndpointJunctionsFullyCertified:false,
    entireSceneAndOtherSolidsChecked:false,
    globallyFrontmostPhysicalSourceCertified:false,
    engineeringLineStyleAuthorized:false,
    signedV5Action:false
   });
  }
 }
 if(results.length!==eventGraph.partitionedSourceSubintervalCount||
    counts.subspanCount!==counts.excludedAlreadySignedContour+
     counts.clear+counts.strictHidden+counts.unresolved||
    results.some(x=>x.signedV5Action!==false||
     x.engineeringLineStyleAuthorized!==false||
     x.signedLineStyle!=='undetermined'))
  throw new RangeError('single convex subspan ray diagnostic not fully accounted for');
 return freeze({
  schema:'draftai-c1-m5-original-source-subspan-opaque-ray/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  sourceEventGraphSchema:eventGraph.schema,
  sourceEventCount:eventGraph.actualM4OriginalSourcePairwiseEventCount,
  sourceSubspanCount:results.length,
  firstAngleViews:[...VIEWS],counts,subspans:results,
  onlyOneReviewedConvexOpaqueSolidChecked:true,
  allSource3DJunctionsCertified:false,
  allCoProjectedSourceDepthsCertified:false,
  applicableEngineeringLineStylesSigned:false,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={auditC1SingleConvexSourceSubspanRays};
