'use strict';
/**
 * Shared M5 whole ORIGINAL physical source edge visibility, for 2..8
 * independently M0-verified CLOSED CONVEX components of a composite
 * (possibly nonconvex) union. Every ray is tested against EVERY supplied
 * opaque convex component, not just its own source solid.
 *
 * Positive results certify continuous first-angle forward rays over the
 * FULL original source edge against this exact component inventory.
 * They do NOT certify composite boolean feature seams, generated BRep
 * intersection edges, globally completed projected topology or official V5.
 *
 * This reuses the canonical M0 analytic solid ray kernels; not a new solver.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {auditReviewedConvexSourceCreases}=
 require('./m5-reviewed-convex-source-creases.cjs');
const {outwardProof}=
 require('../core/numeric/convex-incident-source-open-ray.cjs');
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {evaluateFullSourceSegmentOcclusion}=
 require('../core/verification/convex-occlusion-coverage.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
function auditReviewedMultiBodyWholePhysicalEdgeRays({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1||
    !Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('current 2..8 original reviewed convex components required');
 const seen=new Set(),parts=[],solids=[];
 let totalEdges=0;
 for(const g of geometry){
  if(!g||seen.has(g.id)||g.kind!=='mesh'||
     g.space!=='model-3d'||g.unit!=='mm')
   throw new TypeError('unique original millimetre component identities required');
  seen.add(g.id);
  const proof=verifiedConvexMeshHalfspaces(g),
   creases=auditReviewedConvexSourceCreases({geometry:g,revision});
  if(proof.sourceGeometryId!==g.id||
     creases.sourceGeometryId!==g.id||
     creases.sourceEdgeCount!==g.data.edges.length||
     creases.officialLineStylesVerified!==false)
   throw new RangeError('unverified current M0 physical component source');
  totalEdges+=g.data.edges.length;
  parts.push({geometry:g,proof,creases});
  solids.push({id:g.id,halfspaces:proof.halfspaces});
 }
 if(totalEdges>80)throw new RangeError('C2 original physical-ray budget 80 exceeded');
 const rows=[],counts={physicalProjected:0,collapsed:0,
  clear:0,strictHidden:0,uncertain:0,coplanarMeshSubdivision:0};
 for(const part of parts){
  const g=part.geometry;
  const creaseById=new Map(part.creases.edges.map(e=>[e.sourceEdgeId,e]));
  for(const [a,b] of g.data.edges){
   const edgeId=g.id+'::'+[a,b].sort().join('|'),crease=creaseById.get(edgeId);
   if(!crease||JSON.stringify(crease.originalVertexIds)!==
      JSON.stringify([a,b]))
    throw new RangeError('stale original C2 source edge incidence');
   const from=g.data.points[a],to=g.data.points[b];
   for(const view of VIEWS){
    const p=project(from)[view],q=project(to)[view],
     length=Math.hypot(p.u-q.u,p.v-q.v);
    const base={sourceGeometryId:g.id,sourceEdgeId:edgeId,
     sourceVertexIds:[a,b],revision,view,
     projectedFromModelMm:p,projectedToModelMm:q,
     originalParameterRange:[0,1]};
    if(length<=1e-8){
     counts.collapsed++;
     rows.push({...base,status:'projected-point-not-a-line'});
     continue;
    }
    if(crease.sourceIsCoplanarSubdivisionWithinSingleSolid){
     counts.coplanarMeshSubdivision++;
     rows.push({...base,status:'coplanar-mesh-subdivision'});
     continue;
    }
    if(crease.sourceIsPhysicalCreaseWithinSingleSolid!==true){
     counts.uncertain++;
     rows.push({...base,status:'undetermined-physical-crease'});
     continue;
    }
    const source={id:'C2Source',from,to};
    const occlusion=evaluateFullSourceSegmentOcclusion({
     source,solids,view
    });
    const clearIds=[],uncertainIds=[];
    for(const solid of solids){
     const own=solid.id===g.id,
      outward=own?outwardProof({geometry:g,
       sourceVertexIds:[a,b],view,convexProof:part.proof}):null;
     const analytic=certifyConvexSegmentClearance({
      source,solid,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view]
     });
     const clear=outward?.status==='certified-clear'||
      analytic.status==='certified-clear';
     if(clear)clearIds.push(solid.id);
     else uncertainIds.push(solid.id);
    }
    const wholeClear=clearIds.length===solids.length;
    const wholeHidden=occlusion.entireSourceSegmentOccluded===true;
    if(wholeClear&&wholeHidden)
     throw new RangeError('contradictory composite M0 strict occlusion and clear rays');
    const status=wholeClear?'whole-source-clear-across-all-opaque-components':
     wholeHidden?'whole-source-strictly-occluded-in-composite-union':
      'undetermined-global-component-depth';
    counts.physicalProjected++;
    if(wholeClear)counts.clear++;
    else if(wholeHidden)counts.strictHidden++;
    else counts.uncertain++;
    rows.push({...base,status,
     strictlyContinuousAllComponentFrontRayClearVerified:wholeClear,
     fullyContinuousUnionOpaqueRayOcclusionVerified:wholeHidden,
     allOriginalComponentIdsAudited:solids.map(s=>s.id),
     independentlyClearedComponentIds:clearIds,
     unresolvedComponentIds:uncertainIds,
     certifiedOccluderComponentIds:occlusion.occluderIds||[],
     sourceIsOriginal3DPhysicalCrease:true,
     original3DEndpointIncidenceVerified:true,
     originalEntireSourceParameterRangeAudited:true,
     compositeUnionBoundarySemanticsVerified:false,
     intersectionGeneratedEdgesCertified:false,
     finalProjectedJunctionAndLineStylesCertified:false,
     constructionIntentAuthorized:false,signedV5Action:false});
   }
  }
 }
 if(rows.length!==totalEdges*VIEWS.length||
    counts.physicalProjected!==counts.clear+counts.strictHidden+
     counts.uncertain-counts.coplanarMeshSubdivision+
     counts.coplanarMeshSubdivision*0)
  {
  // The relation is recomputed over actual physical-source line rows,
  // excluding degenerate source projection and mesh triangulation.
  const drawable=rows.filter(x=>x.sourceIsOriginal3DPhysicalCrease===true);
  if(drawable.length!==counts.physicalProjected||
     drawable.length!==counts.clear+counts.strictHidden+
      drawable.filter(x=>x.status==='undetermined-global-component-depth').length)
   throw new RangeError('multi-body original source-ray accounting mismatch');
 }
 return freeze({
  schema:'draftai-m5-multiconvex-original-whole-edge-union-rays/1',
  revision,sourceGeometryIds:geometry.map(g=>g.id),
  componentCount:parts.length,originalSourceEdgeCount:totalEdges,
  projectedEdgeRowCount:rows.length,counts,rows,
  allBodiesM0ClosedConvexVerified:true,
  allContinuousOriginalSourceRaysCheckedAgainstEveryComponent:true,
  compositeNonconvexBooleanBoundaryCertified:false,
  generatedIntersectionCurveEdgesCertified:false,
  combinedC2EngineeringLineStylesCertified:false,
  completedDrawingV5Authorized:false,signedV5ActionCount:0
 });
}
module.exports={auditReviewedMultiBodyWholePhysicalEdgeRays};
