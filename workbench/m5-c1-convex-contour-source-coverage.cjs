'use strict';
/**
 * C1 / M5. One reviewed closed CONVEX solid has an exact mathematical
 * first-angle projected boundary SET (the hull of projected vertices).
 * Correlate that EXISTING proof with the already audited original source
 * edge dihedrals and whole-source continuous observer rays.
 *
 * This is a real full-side 2D geometric COVERAGE ledger: an interval cannot
 * be presented unless authentic source physical creases cover it. It does
 * not prove which 3D edge is the final frontmost stroke, all junctions,
 * construction ordering or ISO/GB engineering line styles. No V5 issuance.
 */
const {verifyConvexProjectedOutline}=
 require('../core/verification/convex-projected-outline.cjs');
const {auditReviewedSolidWholeSourceEdges}=
 require('./m5-reviewed-solid-source-edge-ledger.cjs');
const {VIEWS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC1ConvexContourSourceCoverage({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('C1 contour requires current reviewed geometry revision');
 // Ledger is computed ONCE here, not duplicated in the C1 V5 consumer.
 const edgeLedger=auditReviewedSolidWholeSourceEdges({geometry,revision});
 const blocked=reason=>freeze({
  schema:'draftai-c1-convex-contour-source-coverage/1',
  revision,status:'not-covered',reason,edgeLedger,
  views:[],completeProjectedConvexBoundaryGeometryVerified:false,
  fullPhysicalSourceContourCoverageVerified:false,
  firstAngleSourceJoinCertified:false,
  entireFinalStrokeVisibilityVerified:false,
  officialLineStylesVerified:false,completeSolidV5Ready:false
 });
 if(edgeLedger.status!=='scoped-full-original-source-edge-ray-evidence'||
    edgeLedger.revision!==revision||edgeLedger.sourceGeometryId!==geometry.id||
    edgeLedger.signedEdgeV5Ready!==false||
    edgeLedger.officialLineStylesVerified!==false)
  return blocked('current single-source M5 edge evidence unavailable');
 let outline;
 try{outline=verifyConvexProjectedOutline({mesh:geometry,revision});}
 catch(e){return blocked('independent projected convex hull not proven: '+e.message);}
 if(outline.sourceGeometryId!==geometry.id||outline.revision!==revision||
    !outline.sourceClosedConvexTopologyVerified||outline.v5Ready!==false)
  throw new RangeError('C1 source hull and current M5 geometry differ');
 const index=new Map(edgeLedger.edges.map(e=>[e.view+'::'+e.sourceEdgeId,e]));
 if(index.size!==edgeLedger.edges.length)
  throw new RangeError('duplicate source edge/view identity in current M5 ledger');
 const views=[];
 for(const view of VIEWS){
  const hull=outline[view];
  if(!hull?.convexProjectedBoundaryVerified||hull.view!==view)
   throw new RangeError('current first-angle convex silhouette proof unavailable');
  const sides=[];
  for(const [sideIndex,side] of hull.boundarySides.entries()){
   if(!side.projectedBoundaryVerified||side.frontmostSourceEdgeVerified!==false||
      side.officialLineStyleVerified!==false)
    throw new RangeError('untrusted or already signed convex boundary source');
   const fractionTolerance=Math.max(1e-10,
    1e-9/Math.max(1,side.projectedLengthMm));
   const candidates=side.sourceEdgeCandidates.map(candidate=>{
    const id=geometry.id+'::'+candidate.sourceEdgeId;
    const row=index.get(view+'::'+id);
    const range=candidate.projectedFractionRange;
    if(!row||row.sourceGeometryId!==geometry.id||
       row.sourceEdgeId!==id||row.view!==view||
       !Array.isArray(range)||range.length!==2||
       !range.every(Number.isFinite)||range[0]<-fractionTolerance||
       range[1]>1+fractionTolerance||range[1]-range[0]<=fractionTolerance||
       row.standardEngineeringLineStyle!=='undetermined'||
       row.V5LineActionSignedOff!==false)
     throw new RangeError('C1 hull edge has no authentic, unsigned M5 source');
    const a=row.projectedFrom,b=row.projectedTo;
    const du=side.to.u-side.from.u,dv=side.to.v-side.from.v,
     length2=du*du+dv*dv;
    const crossA=du*(a.v-side.from.v)-dv*(a.u-side.from.u),
     crossB=du*(b.v-side.from.v)-dv*(b.u-side.from.u);
    const scale=Math.max(1,side.projectedLengthMm);
    if(!Number.isFinite(length2)||length2<=0||
       Math.abs(crossA)>1e-8*scale||
       Math.abs(crossB)>1e-8*scale)
     throw new RangeError('C1 source edge not on independently verified hull support line');
    return {
     sourceEdgeId:id,projectedFractionRange:[...range],
     sourcePhysicalCreaseVerified:row.originalSingleSolidCreaseVerified,
     sourceCoplanarSubdivisionVerified:row.originalCoplanarMeshSubdivisionVerified,
     wholeOriginalSourceRayStatus:row.status,
     wholeSourceFrontRayClearVerified:row.continuouslyFrontRayClearVerified,
     wholeSourceStrictlyOccludedVerified:row.completeStrictInteriorOcclusionVerified
    };
   });
   // Every source edge whose projection overlaps the mathematical hull side
   // participates in a common 1D arrangement, independent of SVG drawing.
   const splits=[0,1,...candidates.flatMap(x=>x.projectedFractionRange)]
    .map(x=>Math.max(0,Math.min(1,x))).sort((a,b)=>a-b)
    .filter((x,i,array)=>i===0||x-array[i-1]>fractionTolerance);
   if(splits.at(-1)<1-fractionTolerance)splits.push(1);
   const intervals=[];
   const at=t=>({u:side.from.u+(side.to.u-side.from.u)*t,
     v:side.from.v+(side.to.v-side.from.v)*t});
   for(let i=0;i<splits.length-1;i++){
    const lo=splits[i],hi=splits[i+1];
    if(hi-lo<=fractionTolerance)continue;
    const covering=candidates.filter(c=>
      c.projectedFractionRange[0]<=lo+fractionTolerance&&
      c.projectedFractionRange[1]>=hi-fractionTolerance);
    // The existing convex hull proves that actual projected source mesh
    // edges cover each side. A *physical crease* must independently cover
    // each atomic interval; a coplanar triangulation split is not one.
    const real=covering.filter(c=>c.sourcePhysicalCreaseVerified&&
      !c.sourceCoplanarSubdivisionVerified);
    if(!real.length)
     return blocked('convex paper side not covered by proven physical creases');
    const positive=real.filter(c=>c.wholeSourceFrontRayClearVerified);
    const strictlyHidden=real.filter(c=>c.wholeSourceStrictlyOccludedVerified);
    intervals.push({
     sourceGeometryId:geometry.id,revision,view,sideIndex,
     projectedParameterRange:[lo,hi],fromModelMm:at(lo),toModelMm:at(hi),
     sourceEdgeIds:real.map(c=>c.sourceEdgeId),
     nonPhysicalSubdivisionCount:covering.length-real.length,
     certifiedWholeSourceClearCandidates:positive.map(c=>c.sourceEdgeId),
     certifiedWholeSourceHiddenCandidates:strictlyHidden.map(c=>c.sourceEdgeId),
     geometricBoundarySourceCoverageVerified:true,
     localSingleClearRayCandidate:positive.length===1?
      positive[0].sourceEdgeId:null,
     uniqueFinalPhysicalStrokeSourceVerified:false,
     completeProjectedEndpointJoinVerified:false,
     certifiedObserverRayForEntireFinalStroke:false,
     officialLineStyle:'undetermined',v5StrokeAuthorized:false
    });
   }
   if(!intervals.length||intervals[0].projectedParameterRange[0]>fractionTolerance||
      intervals.at(-1).projectedParameterRange[1]<1-fractionTolerance||
      intervals.some((x,i)=>i&&
       x.projectedParameterRange[0]>intervals[i-1].projectedParameterRange[1]+fractionTolerance))
    return blocked('convex hull boundary atomic source arrangement has a gap');
   sides.push({
    view,sideIndex,fromModelMm:{...side.from},toModelMm:{...side.to},
    intervals,geometricHullSideVerified:true,
    physicalSourceCoverageVerified:true,
    fullyJoinedFinalDrawingContourVerified:false,
    officialLineStyleVerified:false
   });
  }
  views.push({view,sideCount:sides.length,sides,
   wholeConvex2DBoundaryVerified:true,
   everyHullSideCoveredByPhysicalSourceEdges:true,
   finalPhysicalStrokeSourceUnique:false,
   allProjectedJunctionsCertified:false,
   officialLineStylesVerified:false});
 }
 return freeze({
  schema:'draftai-c1-convex-contour-source-coverage/1',revision,
  status:'scoped-convex-hull-physical-source-coverage',
  sourceGeometryId:geometry.id,unit:'mm',edgeLedger,views,
  boundarySideCount:views.reduce((n,v)=>n+v.sideCount,0),
  boundaryAtomicIntervalCount:views.reduce((n,v)=>n+
   v.sides.reduce((a,s)=>a+s.intervals.length,0),0),
  completeProjectedConvexBoundaryGeometryVerified:true,
  fullPhysicalSourceContourCoverageVerified:true,
  firstAngleSourceJoinCertified:false,
  entireFinalStrokeVisibilityVerified:false,
  officialLineStylesVerified:false,completeSolidV5Ready:false
 });
}
module.exports={auditC1ConvexContourSourceCoverage};
