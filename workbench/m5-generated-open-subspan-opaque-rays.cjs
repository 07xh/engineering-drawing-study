'use strict';
/**
 * M5 C2. For each authentic NEW union-crease M4 first-angle 3D subspan,
 * independently recompute the whole OPEN-subspan viewer ray certificate
 * using the existing M0 verified-convex-mesh + continuous kernels.
 *
 * The #627 partition contains true projected feature-pair critical events.
 * An undecidable full-length source stroke MAY become mathematically
 * decidable after source-parameter subdivision; unlike image samples, these
 * analytic subspans retain exact original 3D source coordinates.
 *
 * This only checks the supplied reviewed opaque convex solids. A positive
 * ray witness is not a certified drawing line without source feature and
 * global silhouette, junctions, engineering standard, and single V5 audit.
 */
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {evaluateFullSourceSegmentOcclusion}=
 require('../core/verification/convex-occlusion-coverage.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS,project,VIEWS}=
 require('../core/projection/conventions.js');
const {auditGeneratedStrokeOverlapPartitions}=
 require('./m5-generated-stroke-overlap-partitions.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const same=(a,b)=>Math.abs(a-b)<=1e-8;
const same3=(p,q)=>p&&q&&['x','y','z'].every(k=>same(p[k],q[k]));
const same2=(p,q)=>p&&q&&same(p.u,q.u)&&same(p.v,q.v);
function auditGeneratedOpenSubspanOpaqueRays({geometry,revision,
 projectedStrokePartitions,physicalJunctionEvidence,
 projectedOverlapDepthEvidence,generatedProjectedEndpointEvidence,
 generatedOverlapPartitionEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current generated subspan ray source revision required');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('reviewed multi-source geometry required');
 const fresh=auditGeneratedStrokeOverlapPartitions({geometry,revision,
  projectedStrokePartitions,physicalJunctionEvidence,
  projectedOverlapDepthEvidence,generatedProjectedEndpointEvidence});
 const unavailable=()=>freeze({
  schema:'draftai-m5-generated-open-subspan-opaque-rays/1',
  revision,status:'not-covered',pieces:[],pieceCount:0,
  certifiedClearPieceCount:0,certifiedOccludedPieceCount:0,
  undeterminedPieceCount:0,officialLineStylesVerified:false,
  v5Ready:false,signedV5LineActions:0});
 if(fresh.status!=='source-generated-view-pair-overlap-open-partitions')
  return unavailable();
 if(JSON.stringify(fresh)!==JSON.stringify(generatedOverlapPartitionEvidence))
  throw new TypeError('forged or stale analytic co-projection feature subspans');
 const solids=geometry.map(g=>{
  const proof=verifiedConvexMeshHalfspaces(g);
  if(proof.status!=='validated-closed-convex-mesh')
   throw new TypeError('source body must have certified convex 3D halfspaces');
  return {id:g.id,halfspaces:proof.halfspaces};
 });
 const projected=new Map(projectedStrokePartitions.generatedSegments.map(x=>[x.id,x]));
 if(projected.size!==projectedStrokePartitions.generatedSegments.length)
  throw new TypeError('duplicate M4 generated stroke source');
 const result=[];let nearDegenerateCount=0;
 for(const entry of fresh.entries){
  const base=projected.get(entry.m4GeneratedCandidateId);
  if(!base||base.revision!==revision||base.view!==entry.view||
     base.sourceGeneratedFeatureId!==entry.sourceGeneratedFeatureId||
     base.canonicalIntentAndV5LineStepApproved!==false)
   throw new TypeError('generated M4 source stroke identity differs');
  for(const sourcePiece of entry.pieces){
   if(result.length>=1800)
    throw new RangeError('bounded per-source opaque ray witness complexity exceeded');
   const from=sourcePiece.physicalSource3DFrom,
    to=sourcePiece.physicalSource3DTo,view=entry.view;
   if(!VIEWS.includes(view)||sourcePiece.view!==view||
      !same2(project(from)[view],sourcePiece.projectedFromModelMm)||
      !same2(project(to)[view],sourcePiece.projectedToModelMm))
    throw new TypeError('source-recomputed first-angle split source projection required');
   const length=Math.hypot(from.x-to.x,from.y-to.y,from.z-to.z);
   const collapsed=length<=1e-7;
   let clearance=[],occlusion=null,clear=false,hidden=false;
   if(!collapsed){
    const source={id:'NewOpenSource'+result.length,from,to};
    clearance=solids.map(solid=>{
     const proof=certifyConvexSegmentClearance({source,solid,
      observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view]});
     return {sourceGeometryId:solid.id,status:proof.status,
      continuousOpenRayClearVerified:proof.sourceOpenIntervalVerified};
    });
    clear=clearance.every(p=>p.continuousOpenRayClearVerified);
    occlusion=evaluateFullSourceSegmentOcclusion({source,solids,view});
    hidden=occlusion.entireSourceSegmentOccluded===true;
    if(clear&&hidden)
     throw new RangeError('contradictory full interval M0 front ray and strict opacity proofs');
   }else nearDegenerateCount++;
   result.push({id:'M5NewSubspanRay'+result.length,revision,
    m4GeneratedCandidateId:entry.m4GeneratedCandidateId,
    generated3DSourceFeatureId:entry.sourceGeneratedFeatureId,
    view,source3DOpenParameterRange:
     [...sourcePiece.source3DOpenParameterRange],
    source3DFrom:{...from},source3DTo:{...to},
    sourceProjectedFromModelMm:{...sourcePiece.projectedFromModelMm},
    sourceProjectedToModelMm:{...sourcePiece.projectedToModelMm},
    independentConvexSourceGeometryIds:solids.map(x=>x.id),
    independentSolidObserverRayStatuses:clearance,
    sourceWholeOpenPieceObserverClearVerified:clear,
    sourceWholeOpenPieceStrictlyOccludedVerified:hidden,
    strictOccluderGeometryIds:hidden?[...occlusion.occluderIds]:[],
    sourceRayStatus:collapsed?'undetermined-near-degenerate-source-subspan':
     hidden?'certified-whole-open-subspan-strictly-occluded':
     clear?'certified-whole-open-subspan-forward-rays-clear':
     'undetermined-open-subspan-observer-ray',
    listedSourceLineRelativeDepthOnly:
     sourcePiece.listedSourceOverlapWitnesses,
    allRealSourceEndpointsAndGlobalFeatureTopologyVerified:false,
    globalProjectedOuterContourAndAllOpaqueFacesVerified:false,
    applicableEngineeringLineStyle:'undetermined',
    officialSingleV5LineActionAuthorized:false});
  }
 }
 if(result.length!==fresh.openPieceCount)
  throw new RangeError('source open subspan ray evidence omitted a current M4 fragment');
 return freeze({schema:'draftai-m5-generated-open-subspan-opaque-rays/1',
  revision,status:'all-current-generated-open-subspan-source-rays-recomputed',
  sourceGeometryIds:geometry.map(g=>g.id),
  pieces:result,pieceCount:result.length,
  certifiedClearPieceCount:result.filter(p=>
   p.sourceWholeOpenPieceObserverClearVerified).length,
  certifiedOccludedPieceCount:result.filter(p=>
   p.sourceWholeOpenPieceStrictlyOccludedVerified).length,
  undeterminedPieceCount:result.filter(p=>
   !p.sourceWholeOpenPieceObserverClearVerified&&
   !p.sourceWholeOpenPieceStrictlyOccludedVerified).length,
  nearDegeneratePieceCount:nearDegenerateCount,
  entireSourceM4PieceCoverageVerified:true,
  fullModel3DConvexSourceGeometryRechecked:true,
  completeFinalEngineeringLineFeatureTopologyVerified:false,
  officialLineStylesVerified:false,v5Ready:false,signedV5LineActions:0});
}
module.exports={auditGeneratedOpenSubspanOpaqueRays};
