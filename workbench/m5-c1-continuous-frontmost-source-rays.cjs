'use strict';
/**
 * C1 M5: continuous projected-hull SOURCE ordering and independently
 * recomputed whole-subinterval M0 observer rays.
 *
 * Uses #708 complete paper hull source-interval coverage and #712 physical
 * endpoint incidence. For overlapping sources on one paper interval,
 * observer-depth differences are AFFINE; checking both end signs proves
 * strict depth order across the whole OPEN interval. An interior sign change,
 * endpoint tie, tangency or absent source identity remains undetermined.
 *
 * Even a unique positive front source is NOT a full engineering drawing
 * feature/standard-line-style proof or a V5 action authorization.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {outwardProof:certifyExactSourceOutwardRay}=
 require('../core/numeric/convex-incident-source-open-ray.cjs');
const {evaluateFullSourceSegmentOcclusion}=
 require('../core/verification/convex-occlusion-coverage.cjs');
const {exactSameReviewedModelPoint}=
 require('./m5-c1-contour-physical-junction-incidence.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const err=s=>{throw new TypeError('C1 continuous source-depth proof: '+s);};
const d2=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const d3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const observerDepth=(p,v)=>p.x*v.x+p.y*v.y+p.z*v.z;
/**
 * For two linear 3D sources over the SAME projected atomic interval,
 * observer-depth difference d(t)=(1-t)d0+t*d1 is affine. The result is
 * strictly positive/negative for every t IN (0,1) if both endpoint signs
 * are strict, OR one endpoint is the EXACT SAME original reviewed 3D
 * physical point and the opposite endpoint is strictly ordered.
 *
 * A mere 2D projection alias, approximate 3D proximity, tiny signed
 * floating-point value, or two shared endpoints cannot confer ordering.
 * This classifies source depth only; it cannot sign official V5 strokes.
 */
function classifyAffineOpenSourceDepth(x,y,margin=1e-8){
 const d0=x.observerDepthAtFromMm-y.observerDepthAtFromMm;
 const d1=x.observerDepthAtToMm-y.observerDepthAtToMm;
 if(!Number.isFinite(d0)||!Number.isFinite(d1)||
    !Number.isFinite(margin)||margin<=0)
  throw new TypeError('finite positive C1 source depth tolerance required');
 const sharedStart=d0===0&&
  exactSameReviewedModelPoint(x.from3D,y.from3D);
 const sharedEnd=d1===0&&
  exactSameReviewedModelPoint(x.to3D,y.to3D);
 const first=(d0>margin&&(d1>margin||sharedEnd))||
  (sharedStart&&d1>margin);
 const second=(d0< -margin&&(d1< -margin||sharedEnd))||
  (sharedStart&&d1< -margin);
 const strict=first!==second;
 const equal=Math.abs(d0)<=margin&&Math.abs(d1)<=margin;
 const crossing=(d0*d1<0)&&Math.abs(d0)>margin&&Math.abs(d1)>margin;
 return {
  depthDifferenceFromMm:d0,depthDifferenceToMm:d1,
  relativeDepthProvenForWholeInterval:strict,
  strictOpenIntervalSharedPhysicalEndpointProven:strict&&(sharedStart||sharedEnd),
  exactSharedPhysicalStart:sharedStart,exactSharedPhysicalEnd:sharedEnd,
  relation:first?'first-in-front':second?'second-in-front':
   equal?'depth-tied-undetermined':
   crossing?'interior-depth-switch-undetermined':'boundary-depth-tie-undetermined',
  analyticSwitchFraction:crossing?d0/(d0-d1):null
 };
}
function auditC1ContinuousFrontmostSourceRays({
 geometry,revision,contourCoverage,physicalJunctionIncidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<1||
    geometry?.kind!=='mesh'||geometry.space!=='model-3d'||
    geometry.unit!=='mm'||typeof geometry.id!=='string')
  err('current reviewed 3D convex mm geometry required');
 const c=contourCoverage,j=physicalJunctionIncidence;
 if(!Object.isFrozen(c)||!Object.isFrozen(j)||
    c?.schema!=='draftai-c1-convex-contour-source-coverage/1'||
    c.status!=='scoped-convex-hull-physical-source-coverage'||
    j?.schema!=='draftai-c1-contour-physical-junction-incidence/1'||
    j.status!=='scoped-physical-3d-contour-endpoint-candidates'||
    c.sourceGeometryId!==geometry.id||j.sourceGeometryId!==geometry.id||
    c.revision!==revision||j.revision!==revision||
    !c.fullPhysicalSourceContourCoverageVerified||
    !j.currentConvexSourceGeometryAndProjectionVerified||
    c.officialLineStylesVerified!==false||
    j.standardEngineeringLineStylesCertified!==false||
    j.signedV5EdgeActions!==0||j.completeSolidV5Ready!==false)
  err('unsigned current convex contour and physical 3D endpoint witnesses required');
 const validated=verifiedConvexMeshHalfspaces(geometry);
 const solids=[{id:geometry.id,halfspaces:validated.halfspaces}];
 const edges=new Map();
 for(const [a,b] of geometry.data.edges){
  const id=geometry.id+'::'+[a,b].sort().join('|');
  if(edges.has(id))err('duplicate physical source edge');
  edges.set(id,{fromId:a,toId:b,
   from:geometry.data.points[a],to:geometry.data.points[b]});
 }
 const viewRows=[];
 for(const view of VIEWS){
  const cv=c.views.find(x=>x.view===view),
   jv=j.views.find(x=>x.view===view),observer=FIRST_ANGLE_OBSERVER_RAYS[view];
  if(!cv||!jv||cv.sides.length!==cv.sideCount||
     !jv.allContourSidePaperEndpointsAccountedFor||jv.endpointCount<3)
   err('complete first-angle source and 3D junction ring required');
  const spans=cv.sides.flatMap(s=>s.intervals);
  if(spans.length!==jv.junctions.length)err('source interval/junction counts disagree');
  const intervals=[];
  for(let i=0;i<spans.length;i++){
   const s=spans[i],previous=jv.junctions[(i+spans.length-1)%spans.length],
    next=jv.junctions[i];
   if(s.view!==view||s.revision!==revision||s.sourceGeometryId!==geometry.id||
      !s.geometricBoundarySourceCoverageVerified||
      s.officialLineStyle!=='undetermined'||s.v5StrokeAuthorized!==false||
      previous.view!==view||next.view!==view||
      d2(previous.projectedModelMm,s.fromModelMm)>1e-7||
      d2(next.projectedModelMm,s.toModelMm)>1e-7)
    err('stale or discontinuous paper interval and 3D endpoint ring');
   const fromRows=previous.toSourceEndpoints,toRows=next.fromSourceEndpoints;
   if(!Array.isArray(fromRows)||!Array.isArray(toRows)||
      !Array.isArray(s.sourceEdgeIds)||s.sourceEdgeIds.length<1||
      new Set(s.sourceEdgeIds).size!==s.sourceEdgeIds.length)
    err('paper source physical endpoint identity incomplete');
   const candidates=[];
   for(const id of s.sourceEdgeIds){
    const e=edges.get(id),from=fromRows.filter(x=>x.sourceEdgeId===id),
     to=toRows.filter(x=>x.sourceEdgeId===id);
    if(!e||from.length!==1||to.length!==1||
       !from[0].currentSourceProjectionVerified||
       !to[0].currentSourceProjectionVerified||
       from[0].officialLineJoinAuthorized!==false||
       to[0].officialLineJoinAuthorized!==false)
     err('unmatched source 3D endpoints at complete contour interval');
    const a=from[0],b=to[0],from3=a.real3DPoint,to3=b.real3DPoint;
    if(d2(project(from3)[view],s.fromModelMm)>1e-7||
       d2(project(to3)[view],s.toModelMm)>1e-7||
       d3(from3,to3)<=1e-8||
       ![a.originalSourceParameter,b.originalSourceParameter]
        .every(x=>Number.isFinite(x)&&x>=0&&x<=1))
     err('impossible source interval projection or source parameters');
    // Validate actual interpolation from this exact current physical edge,
    // not merely a frozen or user-supplied endpoint witness.
    const on=(t)=>({x:e.from.x+(e.to.x-e.from.x)*t,
     y:e.from.y+(e.to.y-e.from.y)*t,
     z:e.from.z+(e.to.z-e.from.z)*t});
    if(d3(on(a.originalSourceParameter),from3)>1e-7||
       d3(on(b.originalSourceParameter),to3)>1e-7)
     err('forged source edge 3D interpolated witness');
    const source={id:'C1ContourRay',from:from3,to:to3};
    const clear=certifyConvexSegmentClearance({source,solid:solids[0],
     observerDirection:observer});
    const hidden=evaluateFullSourceSegmentOcclusion({source,solids,view});
    // A normalized supporting-plane residual can round slightly inward
    // even when an ORIGINAL triangular face contains BOTH edge vertices.
    // The independent exact-dyadic incident-face theorem proves continuous
    // outward clearance without changing any tolerance or trusting HLR.
    const exact=clear.status==='certified-clear'?null:
      certifyExactSourceOutwardRay({geometry,
       sourceVertexIds:[e.fromId,e.toId],view,convexProof:validated});
    const wholeClear=clear.status==='certified-clear'||
      exact?.status==='certified-clear',
     entireHidden=hidden.entireSourceSegmentOccluded===true;
    if(wholeClear&&entireHidden)
     err('positive and strict-interior whole-ray proofs contradict');
    candidates.push({sourceEdgeId:id,sourceParameterRange:[
     a.originalSourceParameter,b.originalSourceParameter],
     from3D:{...from3},to3D:{...to3},
     observerDepthAtFromMm:observerDepth(from3,observer),
     observerDepthAtToMm:observerDepth(to3,observer),
     fullOpenSubintervalClear:wholeClear,
     fullOpenSubintervalStrictlyOccluded:entireHidden,
     rayProofStatus:wholeClear?'certified-clear':
      entireHidden?'certified-whole-strict-interior-occluded':'undetermined',
     rayProofReason:clear.status==='certified-clear'?clear.reason:
      exact?.status==='certified-clear'?exact.reason:
      entireHidden?'strict-occlusion':clear.reason,
     exactIncidenceSupportFaceIndex:exact?.status==='certified-clear'?
      exact.supportingOriginalFaceIndex:null,
     fullEndpointJoinAndContourVisibilityCertified:false,
     officialEngineeringLineStyle:'undetermined',v5StrokeApproved:false});
   }
   const comparisons=[];
   for(let a=0;a<candidates.length;a++)for(let b=a+1;b<candidates.length;b++){
    const x=candidates[a],y=candidates[b];
    const certificate=classifyAffineOpenSourceDepth(x,y);
    comparisons.push({sourceEdgeIds:[x.sourceEdgeId,y.sourceEdgeId],
     ...certificate,officialLineStyleVerified:false});
   }
   const sorted=candidates.filter(x=>candidates.every(y=>{
    if(x===y)return true;
    const ix=candidates.indexOf(x),iy=candidates.indexOf(y);
    const cmp=comparisons.find(q=>
     q.sourceEdgeIds.includes(x.sourceEdgeId)&&
     q.sourceEdgeIds.includes(y.sourceEdgeId));
    if(!cmp||!cmp.relativeDepthProvenForWholeInterval)return false;
    return ix<iy?cmp.relation==='first-in-front':
      cmp.relation==='second-in-front';
   }));
   const unique=sorted.length===1?sorted[0]:null;
   // A whole source clear ray is independently proven on this subspan.
   // A depth-front source is NOT automatically the final visible drawing
   // stroke: incident branch identity, tangency and standard style remain.
   intervals.push({view,revision,sideIndex:s.sideIndex,
    paperFromModelMm:{...s.fromModelMm},paperToModelMm:{...s.toModelMm},
    projectedParameterRange:[...s.projectedParameterRange],
    sources:candidates,relativeSourceDepthComparisons:comparisons,
    uniqueStrictFrontSourceId:unique?.sourceEdgeId??null,
    uniqueStrictFrontPhysical3DSourceAmongListedCandidates:!!unique,
    wholeIntervalFrontSourceClearRayVerified:!!unique?.fullOpenSubintervalClear,
    wholeIntervalFrontSourceStrictlyHiddenVerified:!!unique?.fullOpenSubintervalStrictlyOccluded,
    unresolvedDepthSwitchOrTie:comparisons.some(x=>!x.relativeDepthProvenForWholeInterval),
    fullProjectedJunctionAndContourMembershipProven:false,
    certifiedFinalVisibleOrHiddenStroke:false,
    standardEngineeringLineStyle:'undetermined',signedV5LineAction:false});
  }
  // Join the existing #708 hull/source ring, #712/#714 exact physical
  // junctions and #713 continuous open rays. Every approved local candidate
  // must keep exactly the SAME reviewed 3D point across its two incident
  // frontmost source spans. Equal paper coordinates / near-equal 3D points
  // are never sufficient. This is not a full contour, style or V5 proof.
  const frontSourceJunctions=[];
  for(let i=0;i<intervals.length;i++){
   const jn=jv.junctions[i],incoming=intervals[i],
    outgoing=intervals[(i+1)%intervals.length];
   const a=incoming.sources.find(q=>
    q.sourceEdgeId===incoming.uniqueStrictFrontSourceId);
   const b=outgoing.sources.find(q=>
    q.sourceEdgeId===outgoing.uniqueStrictFrontSourceId);
   if(d2(jn.projectedModelMm,incoming.paperToModelMm)>1e-7||
      d2(jn.projectedModelMm,outgoing.paperFromModelMm)>1e-7)
    err('source ray endpoints not aligned to real paper junction');
   const matched=Boolean(a&&b&&jn.authenticatedCommon3DJoinCandidates.some(q=>
     q.arrivingSourceEdgeId===a.sourceEdgeId&&
     q.departingSourceEdgeId===b.sourceEdgeId&&
     q.sharedPhysical3DPointVerified===true&&
     exactSameReviewedModelPoint(q.real3DPoint,a.to3D)&&
     exactSameReviewedModelPoint(q.real3DPoint,b.from3D)));
   const bothClear=Boolean(a?.fullOpenSubintervalClear&&
    b?.fullOpenSubintervalClear);
   const local=matched&&bothClear&&
    !incoming.unresolvedDepthSwitchOrTie&&
    !outgoing.unresolvedDepthSwitchOrTie;
   frontSourceJunctions.push({
    view,revision,sourceGeometryId:geometry.id,junctionIndex:i,
    paperPointModelMm:{...jn.projectedModelMm},
    arrivingFrontSourceEdgeId:a?.sourceEdgeId??null,
    departingFrontSourceEdgeId:b?.sourceEdgeId??null,
    authenticatedExactCommon3DFrontSourcePoint:matched,
    bothAdjacentOpenSourceIntervalsRayClear:bothClear,
    localFrontRayPhysicalJunctionCandidateVerified:local,
    nearButDistinctPhysicalSourcesNotPromoted:
     jn.nearButDifferent3DSourcePointPairsRemainUndetermined>0,
    wholeGlobalContourAndOcclusionTopologyVerified:false,
    officialEngineeringLineStyle:'undetermined',signedV5Action:false
   });
  }
  viewRows.push({view,intervals,intervalCount:intervals.length,
   frontSourceJunctions,
   localFrontRayPhysicalJunctionCandidateCount:frontSourceJunctions.filter(
    x=>x.localFrontRayPhysicalJunctionCandidateVerified).length,
   frontSourceJunctionsAwaitingFullProofCount:frontSourceJunctions.filter(
    x=>!x.localFrontRayPhysicalJunctionCandidateVerified).length,
   strictUniqueListedFrontCount:intervals.filter(x=>
    x.uniqueStrictFrontPhysical3DSourceAmongListedCandidates).length,
   continuousFrontOpenRayClearCount:intervals.filter(x=>
    x.wholeIntervalFrontSourceClearRayVerified).length,
   crossingOrTieCount:intervals.filter(x=>x.unresolvedDepthSwitchOrTie).length,
   completeFinalEngineeringLineContourVerified:false,
   standardEngineeringLineStylesCertified:false});
 }
 return freeze({schema:'draftai-c1-continuous-frontmost-source-rays/1',
  status:'source-scoped-affine-depth-and-open-ray-verified',revision,
  sourceGeometryId:geometry.id,views:viewRows,
  auditedIntervalCount:viewRows.reduce((n,v)=>n+v.intervalCount,0),
  independentlyClearLeadingSourceIntervalCount:viewRows.reduce((n,v)=>
   n+v.continuousFrontOpenRayClearCount,0),
  ambiguousDepthIntervalCount:viewRows.reduce((n,v)=>n+v.crossingOrTieCount,0),
  localFrontRayPhysicalJunctionCandidateCount:viewRows.reduce((n,v)=>n+
   v.localFrontRayPhysicalJunctionCandidateCount,0),
  frontSourceJunctionsAwaitingFullProofCount:viewRows.reduce((n,v)=>n+
   v.frontSourceJunctionsAwaitingFullProofCount,0),
  authenticSourceAndPaperProjectionVerified:true,
  entireGlobalFinalStrokeTopologyVerified:false,
  officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false});
}
module.exports={auditC1ContinuousFrontmostSourceRays,classifyAffineOpenSourceDepth};
