'use strict';
/**
 * M5 positive source-edge ledger for fully reviewed convex Geometry.
 * Validates current M0/M5 source meshes and correlates EXISTING source-
 * bounded continuous closed-ray clearance and strict entire-edge occlusion.
 * It never elevates rays or projected union outlines into engineering CAD
 * solid/dashed styles, endpoint joins, ConstructionIntent or V5 actions.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {verifyConvexProjectedOutline}=
 require('../core/verification/convex-projected-outline.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('./reviewed-convex-scene-depth.cjs');
const {inspectSourceVertexIncidence}=
 require('./m5-source-vertex-incidence-audit.cjs');
const {auditReviewedConvexSourceCreases}=
 require('./m5-reviewed-convex-source-creases.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const c of Object.values(x))freeze(c);Object.freeze(x);
 }return x;};
function auditReviewedSolidWholeSourceEdges({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current reviewed source revision required');
 if(!geometry||typeof geometry.id!=='string'||
   geometry.kind!=='mesh'||geometry.space!=='model-3d'||
   geometry.unit!=='mm')
  throw new TypeError('user-confirmed current 3D convex mesh required');
 const proof=evaluateReviewedConvexMeshDepth({geometry:[geometry],revision});
 if(proof.status!=='scoped-face-probes-only'||
    proof.revision!==revision||
    proof.v5Ready!==false||proof.officialLineStylesVerified!==false)
  return freeze({schema:'draftai-m5-reviewed-solid-whole-edge-ledger/1',
   revision,status:'not-covered',reason:proof.reason??'no trustworthy M5 source proof',
   edges:[],sourceProjectedEdgeCount:0,positiveWholeVisibleRayCount:0,
   provenWholeOccludedCount:0,undeterminedCount:0,collapsedCount:0,
   completeSolidVisibilityVerified:false,officialLineStylesVerified:false,
   signedEdgeV5Ready:false});
 const sourceVertexIncidenceEvidence=inspectSourceVertexIncidence({
  geometry:[geometry],revision,sceneDepthEvidence:proof});
 if(sourceVertexIncidenceEvidence.v5Ready!==false||
    sourceVertexIncidenceEvidence.standardLineStylesVerified!==false)
  throw new RangeError('original 3D endpoint source proof cannot certify a V5 stroke');
 const sourceCreaseEvidence=auditReviewedConvexSourceCreases({
  geometry,revision});
 const creases=new Map(sourceCreaseEvidence.edges.map(e=>[e.sourceEdgeId,e]));
 // Reuse the already independently certified COMPLETE convex projected
 // occupancy boundary. It proves a 2D geometric hull, not the nearest
 // 3D feature, standard stroke visibility, joined endpoints or V5.
 const hull=verifyConvexProjectedOutline({mesh:geometry,revision});
 if(hull.sourceGeometryId!==geometry.id||hull.revision!==revision||
    hull.unit!=='mm'||hull.multiBodySilhouetteVerified!==false||
    hull.constructionIntentReady!==false||hull.v5Ready!==false)
  throw new TypeError('stale or over-promoted full projected convex hull');
 const closed=proof.closedSourceStrokeRays,occlusion=proof.wholeSourceEdgeOcclusion;
 if(closed.status!=='scoped-positive-closed-source-rays-only'||
    occlusion.status!=='scoped-source-segment-occlusion-only')
  throw new RangeError('M5 independent closed visible/hidden intervals missing');
 const edges=[];
 for(const [a,b] of geometry.data.edges){
  const id=geometry.id+'::'+[a,b].sort().join('|');
  const crease=creases.get(id);
  if(!crease||crease.sourceGeometryId!==geometry.id||
     crease.finalV5LineActionAuthorized!==false)
   throw new TypeError('C1 source edge lacks authentic M0 dihedral proof');
  const start=geometry.data.points[a],end=geometry.data.points[b];
  for(const view of VIEWS){
   const uvA=project(start)[view],uvB=project(end)[view];
   const length=Math.hypot(uvA.u-uvB.u,uvA.v-uvB.v);
   if(!Number.isFinite(length))throw new RangeError('nonfinite first-angle projected edge');
   const collapsed=length<=1e-8;
   const aVisible=closed.edges.filter(e=>e.sourceEdgeId===id&&e.view===view);
   const aHidden=occlusion.hiddenSourceEdges.filter(e=>e.sourceEdgeId===id&&e.view===view);
   if(collapsed&&aVisible.length||aVisible.length>1||aHidden.length>1)
    throw new RangeError('duplicate or collapsed closed source proof');
   // A positive source-edge hull match is geometric and bounded to this
   // single ORIGINAL convex solid. A front/back coincident edge pair may
   // BOTH lie on the same projected hull; only the independent M5 observer
   // ray can distinguish them. Reject split/ambiguous matches rather than
   // guessing a complete physical drawing stroke from an open interval.
   const localId=[a,b].sort().join('|');
   const sourceHullMatches=hull[view].boundarySides.flatMap((side,index)=>
    side.sourceEdgeCandidates.filter(c=>c.sourceEdgeId===localId).
     map(c=>({side,index,interval:c.projectedFractionRange})));
   const match=sourceHullMatches.length===1?sourceHullMatches[0]:null;
   const projectedFullHull=Boolean(!collapsed&&match&&
    Math.abs((match.interval[1]-match.interval[0])*
     match.side.projectedLengthMm-length)<=
      Math.max(1e-9,length*1e-10));
   const ray=aVisible[0],hidden=aHidden[0];
   const front=ray?.positiveClosedRayVisibilityVerified===true&&
     ray.wholeSourceIntervalClearVerified===true&&
     ray.originalSourceEndpointRaysVerified===true;
   const occluded=!collapsed&&hidden?.geometryOfEntireSourceSegmentOccluded===true;
   if(front&&occluded)throw new RangeError('complete forward ray contradicts strict full edge occlusion');
   const status=collapsed?'projected-point-not-an-edge':
     front?'source-entire-edge-positive-open-ray-clear':
     occluded?'source-entire-edge-strictly-behind-reviewed-solid':
     'undetermined';
   edges.push({sourceGeometryId:geometry.id,sourceEdgeId:id,view,
    sourceVertexIds:[a,b],projectedFrom:uvA,projectedTo:uvB,
    status,fullOriginalSourceParameterRange:[0,1],
    originalSingleSolidCreaseVerified:
      crease.sourceIsPhysicalCreaseWithinSingleSolid,
    originalCoplanarMeshSubdivisionVerified:
      crease.sourceIsCoplanarSubdivisionWithinSingleSolid,
    projectedFullSingleSolidHullBoundaryVerified:projectedFullHull,
    projectedHullBoundarySideIndex:projectedFullHull?match.index:null,
    coincidentProjectedHullSourceCandidateCount:projectedFullHull?
     match.side.sourceEdgeCandidates.length:0,
    // This joins two INDEPENDENT existing positive witnesses, but does
    // not prove the final all-source contour, endpoint joins or line type.
    singleSolidHullAndWholeFrontRayCandidateVerified:
     Boolean(projectedFullHull&&front&&
      crease.sourceIsPhysicalCreaseWithinSingleSolid),
    completeMultiBodyFeatureSemanticsVerified:false,
    continuouslyFrontRayClearVerified:front,
    completeStrictInteriorOcclusionVerified:occluded,
    trueOriginalEndpointRaysVerified:!!(front&&ray.originalSourceEndpointRaysVerified),
    projectedOuterBoundaryGeometryVerified:!!(front&&ray.projectedOuterOpenBoundaryVerified),
    occluderGeometryIds:occluded?[...hidden.occluderGeometryIds]:[],
    allProjectedJunctionContinuityVerified:false,
    contourSignedAsVisibleOrHidden:false,
    standardEngineeringLineStyle:'undetermined',
    V5LineActionSignedOff:false});
  }
 }
 return freeze({schema:'draftai-m5-reviewed-solid-whole-edge-ledger/1',
  revision,status:'scoped-full-original-source-edge-ray-evidence',
  sourceGeometryId:geometry.id,sourceVertexIncidenceEvidence,
  sourceCreaseEvidence,
  edges,sourceProjectedEdgeCount:edges.length,
  positiveWholeVisibleRayCount:edges.filter(x=>
   x.continuouslyFrontRayClearVerified).length,
  positiveFullSingleSolidHullGeometryEdgeCount:edges.filter(x=>
   x.projectedFullSingleSolidHullBoundaryVerified).length,
  positiveHullAndWholeFrontRayCandidateCount:edges.filter(x=>
   x.singleSolidHullAndWholeFrontRayCandidateVerified).length,
  provenWholeOccludedCount:edges.filter(x=>
   x.completeStrictInteriorOcclusionVerified).length,
  collapsedCount:edges.filter(x=>x.status==='projected-point-not-an-edge').length,
  undeterminedCount:edges.filter(x=>x.status==='undetermined').length,
  completeSolidVisibilityVerified:false,allProjectedJunctionsVerified:false,
  officialLineStylesVerified:false,signedEdgeV5Ready:false});
}
module.exports={auditReviewedSolidWholeSourceEdges};
