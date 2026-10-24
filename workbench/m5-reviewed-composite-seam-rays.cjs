'use strict';
/**
 * M5 scoped positive continuous visibility proof for a REAL 3D source
 * contact-patch border. Contact topology originates in M0 verified convex
 * meshes, never from a 2D screen coincidence. Every segment is checked
 * against ALL the reviewed opaque solids via existing analytic M0 kernels.
 *
 * This is an all-forward-rays / whole-segment certificate. It does not prove
 * whether a seam is a physical external engineering-feature edge, projected
 * join continuity, visibility at intersecting contours or STANDARD drawing
 * line styles. Existing V5 remains forbidden for all seam strokes.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {certifyConvexPointRayClearance}=
 require('../core/numeric/convex-point-ray-clearance.cjs');
const {evaluateFullSourceSegmentOcclusion}=
 require('../core/verification/convex-occlusion-coverage.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('./reviewed-convex-scene-depth.cjs');
const {evaluateReviewedBoxContacts}=
 require('../core/geometry/reviewed-box-contact-evidence.cjs');
const {evaluateReviewedCompositeInterfaces}=
 require('./reviewed-composite-interface-evidence.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
 }return x;};
function proveReviewedCompositeSeamRays({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current source revision required');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('bounded current confirmed spatial geometry required');
 // Do not trust a caller-provided relation or M5 audit. Recompute the
 // independently approved Geometry -> M0/M5 -> interface provenance chain.
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 if(scene.status!=='scoped-face-probes-only')
  return freeze({schema:'draftai-m5-composite-seam-ray/1',revision,
   status:'not-covered',reason:'no certified reviewed convex source scene',
   segments:[],checkedCount:0,certifiedOpenVisibleCount:0,
   certifiedFullyOccludedCount:0,undeterminedCount:0,
   completeSeamLineStyleVerified:false,v5Ready:false});
 const contacts=evaluateReviewedBoxContacts({geometry,revision});
 const interfaceProof=evaluateReviewedCompositeInterfaces({
  geometry,revision,contactEvidence:contacts,sceneDepthEvidence:scene});
 if(interfaceProof.contactBoundarySegmentCount>80)
  throw new RangeError('composite seam exceeds bounded M5 source budget');
 const solids=geometry.map(g=>{
  const proof=verifiedConvexMeshHalfspaces(g);
  return {id:g.id,halfspaces:proof.halfspaces};
 });
 const segments=[];
 for(const patch of interfaceProof.patches){
  for(const seam of patch.boundarySegments){
   for(const view of VIEWS){
    const a=project(seam.from3D)[view],b=project(seam.to3D)[view];
    const length=Math.hypot(a.u-b.u,a.v-b.v);
    const base={seamId:seam.id,sourceGeometryIds:[...patch.objectIds],
     sourceFaceBoundaryClass:seam.sourceFaceBoundaryClass,
     sourceFaceBoundaryContainment:{...seam.originalSourceFaceBoundaryContainment},
     from3D:{...seam.from3D},to3D:{...seam.to3D},
     view,sourceParameterRange:[0,1],projectedFrom:a,projectedTo:b,
     physicalEngineeringSeamVerified:false,
     sourceEndpointJunctionContinuityVerified:false,
     standardLineStyle:'undetermined',V5LineActionAuthorized:false};
    if(!Number.isFinite(length)||length<=1e-8){
     segments.push({...base,status:'collapsed-projection',
      wholeOpenSourceRayClearVerified:false,
      bothOriginalSegmentEndpointsRayClearVerified:false,
      entireSourceSegmentBehindOpaqueVolumeVerified:false,
      independentSolidRayWitnesses:[]});
     continue;
    }
    const ray=FIRST_ANGLE_OBSERVER_RAYS[view];
    const source={id:'M5Seam'+segments.length,from:seam.from3D,to:seam.to3D};
    const occlusion=evaluateFullSourceSegmentOcclusion({source,solids,view});
    const clearance=solids.map(s=>{
     const interior=certifyConvexSegmentClearance({
      source,solid:s,observerDirection:ray,sourceParameterRange:[0,1]});
     const from=certifyConvexPointRayClearance({
      point:source.from,observerDirection:ray,solid:s});
     const to=certifyConvexPointRayClearance({
      point:source.to,observerDirection:ray,solid:s});
     return {solidId:s.id,
      wholeOpenRayClearVerified:interior.status==='certified-clear',
      fromEndpointRayClearVerified:from.status==='certified-clear',
      toEndpointRayClearVerified:to.status==='certified-clear',
      segmentM0Status:interior.status,sourceEndpointM0Statuses:[from.status,to.status]};
    });
    const wholeClear=clearance.every(s=>s.wholeOpenRayClearVerified);
    const endpointsClear=wholeClear&&clearance.every(s=>
      s.fromEndpointRayClearVerified&&s.toEndpointRayClearVerified);
    const entirelyHidden=occlusion.entireSourceSegmentOccluded===true;
    if(wholeClear&&entirelyHidden)
     throw new RangeError('M0 strict volume witness contradicts full-ray clearance');
    const status=entirelyHidden?'certified-strictly-occluded-whole-source-segment':
     wholeClear?'certified-open-ray-clear-whole-source-segment':'undetermined';
    segments.push({...base,status,
     wholeOpenSourceRayClearVerified:wholeClear,
     bothOriginalSegmentEndpointsRayClearVerified:endpointsClear,
     entireSourceSegmentBehindOpaqueVolumeVerified:entirelyHidden,
     independentSolidRayWitnesses:clearance,
     occluderGeometryIds:[...occlusion.occluderIds]});
   }
  }
 }
 return freeze({schema:'draftai-m5-composite-seam-ray/1',revision,
  status:'scoped-source-bounded-whole-seam-ray-evidence',
  sourceGeometryIds:geometry.map(g=>g.id),sourcePatchCount:interfaceProof.contactPatchCount,
  segments,checkedCount:segments.length,
  certifiedOpenVisibleCount:segments.filter(e=>
   e.status==='certified-open-ray-clear-whole-source-segment').length,
  certifiedFullyOccludedCount:segments.filter(e=>
   e.status==='certified-strictly-occluded-whole-source-segment').length,
  undeterminedCount:segments.filter(e=>
   e.status==='undetermined'||e.status==='collapsed-projection').length,
  sourceEndpointVisibilityReproved:true,
  allPhysicalSeamFeaturesVerified:false,
  allProjectedContourJunctionsVerified:false,
  completeSeamLineStyleVerified:false,approvedConstructionOrderVerified:false,
  v5Ready:false});
}
module.exports={proveReviewedCompositeSeamRays};
