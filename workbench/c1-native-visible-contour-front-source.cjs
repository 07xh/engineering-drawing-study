'use strict';
/**
 * C1: independently prove the physical FRONT original 3D M0 edge when a
 * genuine OCCT HLR visible contour has multiple co-projected ORIGINAL
 * measured BRep candidate edges. This is NOT generated TopoDS shape
 * history, complete exterior contour topology, GB engineering line
 * signing or ConstructionIntent/DAG/V5.
 *
 * Reuses current shared convex exact-supporting-face outward ray theorem,
 * exact binary64 dyadic observer-depth ordering and canonical M4 hull
 * membership. No tolerance snapping, "choose first" or new CAD kernel.
 */
const {project,VIEWS,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {auditC1ReviewedProjectedSourceEventGraph}=
 require('./c1-reviewed-projected-source-event-graph.cjs');
const {outwardProof}=
 require('../core/numeric/convex-incident-source-open-ray.cjs');
const {dyadic,difference,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const y of Object.values(x))freeze(y);Object.freeze(x);
}return x;};
const same3=(a,b)=>!!a&&!!b&&['x','y','z'].every(k=>
 Number.isFinite(a[k])&&Number.isFinite(b[k])&&a[k]===b[k]);
const same2=(a,b)=>!!a&&!!b&&a.u===b.u&&a.v===b.v;
function auditC1NativeVisibleContourOriginalFrontSource({
 geometry,revision,view,seg,nativeHLREdgeOrdinal
}={}){
 if(!Number.isSafeInteger(revision)||revision<1||
    !VIEWS.includes(view)||!Number.isSafeInteger(nativeHLREdgeOrdinal)||
    nativeHLREdgeOrdinal<0||seg?.occtHLRVisibilityClass!=='visible-sharp'||
    seg.actualOCCTHLRFlattenedBRepLineVerified!==true||
    seg.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared!==true||
    seg.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
    !Array.isArray(seg.sourceCandidate3DLifts))
  throw new TypeError('current real OCCT native contour and M0 revision required');
 const unverified=reason=>freeze({
  view,nativeHLREdgeOrdinal,status:'undetermined',reason,
  certifiedOriginalFrontPhysicalSourceEdgeId:null,
  exactWholeOpenRayAndBothEndpointDepthDominance:false,
  actualGeneratedTopoDSEdgeOriginalHistoryCertified:false,
  entireHullAndProjectedJunctionsCertified:false,
  gbEngineeringLineCertified:false,signedV5Action:false
 });
 // No selection by simple HLR paper equality: require at least two
 // independent original BRep source candidates for this special branch.
 if(seg.sourceCandidate3DLifts.length<2)
  return unverified('not-a-multiple-original-3d-source-contour');
 const convex=verifiedConvexMeshHalfspaces(geometry);
 const m4=auditC1ReviewedProjectedSourceEventGraph({
  geometry,revision,proofMode:'m5-hull-required'
 });
 if(convex.status!=='validated-closed-convex-mesh'||
    m4.sourceGeometryId!==geometry.id||m4.revision!==revision||
    m4.originalM5ExteriorHullRecomputedAndAvailable!==true||
    m4.signedV5ActionCount!==0)
  throw new RangeError('original all-support-face and M5 contour provenance missing');
 const ray=FIRST_ANGLE_OBSERVER_RAYS[view],
  axis=Object.keys(ray).find(k=>ray[k]!==0),direction=ray[axis];
 if(!axis||Math.abs(direction)!==1)
  throw new RangeError('noncanonical first-angle observer ray');
 const modeled=new Map((geometry.data.edges??[]).map(e=>[
  geometry.id+'::'+[...e].sort().join('|'),e]));
 if(modeled.size!==(geometry.data.edges??[]).length)
  throw new RangeError('duplicate modeled original M0 edge');
 const witnesses=[];
 for(const lift of seg.sourceCandidate3DLifts){
  const edge=modeled.get(lift?.sourceEdgeId);
  if(!edge||lift.originalVertexIds?.join('|')!==edge.join('|')||
     lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
     lift.originalOCCTSourceLineCurveVerified!==true||
     lift.originalXYZReprojectsToHLR!==true||
     lift.v5Authorized!==false)
   return unverified('unverified-original-occt-brep-candidate');
  const a=geometry.data.points[edge[0]],b=geometry.data.points[edge[1]],
   t0=lift.sourceParameterAtProjectedFrom,
   t1=lift.sourceParameterAtProjectedTo,
   range=lift.originalSourceParameterRange;
  if(!Number.isFinite(t0)||!Number.isFinite(t1)||
     t0<0||t0>1||t1<0||t1>1||t0===t1||
     !Array.isArray(range)||range.length!==2||
     range[0]!==Math.min(t0,t1)||range[1]!==Math.max(t0,t1)||
     !((same3(a,lift.actualOriginalOCCTBRepFrom3D)&&
        same3(b,lift.actualOriginalOCCTBRepTo3D))||
       (same3(b,lift.actualOriginalOCCTBRepFrom3D)&&
        same3(a,lift.actualOriginalOCCTBRepTo3D))))
   return unverified('invalid-occt-original-3d-source-endpoint-or-parameter');
  const originalPoint=t=>({
   x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
   z:a.z+(b.z-a.z)*t
  });
  const p0=originalPoint(t0),p1=originalPoint(t1);
  if(!same3(p0,lift.fromCandidate3D)||
     !same3(p1,lift.toCandidate3D)||
     !same2(project(p0)[view],seg.from)||
     !same2(project(p1)[view],seg.to))
   return unverified('native-projected-or-original-3d-endpoint-mismatch');
  // M4 hull source provenance is a witness of contour membership, NOT
  // independently a complete [0,1] GB contour certificate.
  const source=m4.rows.find(x=>
   x.view===view&&x.sourceEdgeId===lift.sourceEdgeId);
  const hullOverlaps=source?.spans?.some(x=>
   x.projectedExteriorHullOverlap===true&&
   Math.min(x.originalParameterRange[1],range[1])>
    Math.max(x.originalParameterRange[0],range[0]))===true;
  witnesses.push({
   id:lift.sourceEdgeId,sourceOriginalVertexIds:[...edge],
   range:[...range],p0,p1,hullOverlaps,
   outward:outwardProof({
    geometry,sourceVertexIds:edge,view,convexProof:convex
   })
  });
 }
 if(new Set(witnesses.map(x=>x.id)).size!==witnesses.length)
  return unverified('duplicate-original-3d-physical-source-candidate');
 const front=witnesses.filter(x=>
  x.hullOverlaps&&x.outward.status==='certified-clear'&&
  x.outward.exactBinary64PlaneAndSourceIncidence===true&&
  x.outward.continuousOpenSourceIntervalRayClear===true);
 if(front.length!==1)
  return unverified('no-unique-exact-convex-original-contour-outward-ray');
 const winner=front[0];
 const others=witnesses.filter(x=>x.id!==winner.id);
 // For straight original M0 source segments the observer depth difference
 // is affine in the shared generated native paper parameter. Positivity
 // at BOTH physical 3D endpoints proves positivity on the WHOLE interval,
 // without sampling, snapping or guessed depth at a projected cross.
 const depthDominates=others.every(other=>
  [0,1].every(i=>{
   const a=i===0?winner.p0:winner.p1,b=i===0?other.p0:other.p1;
   return sign(difference(dyadic(a[axis]),dyadic(b[axis])))*
    direction>0;
  }));
 if(!depthDominates)
  return unverified('original-3d-contour-observer-depth-tie-or-reversal');
 return freeze({
  view,nativeHLREdgeOrdinal,status:'locally-proven-original-3d-front-contour-source',
  certifiedOriginalFrontPhysicalSourceEdgeId:winner.id,
  sourceOriginalVertexIds:winner.sourceOriginalVertexIds,
  originalSourceParameterRange:winner.range,
  otherOriginal3DCoProjectedSourceEdgeIds:others.map(x=>x.id),
  originalFaceIndexProvingOutwardRay:
   winner.outward.supportingOriginalFaceIndex,
  exactWholeOpenRayAndBothEndpointDepthDominance:true,
  independentM4OriginalHullOverlapWitness:true,
  exactObserverAxis:axis,observerDirectionSign:direction,
  original3DSourceCandidateCount:witnesses.length,
  actualGeneratedTopoDSEdgeOriginalHistoryCertified:false,
  entireHullAndProjectedJunctionsCertified:false,
  gbEngineeringLineCertified:false,signedV5Action:false
 });
}
module.exports={auditC1NativeVisibleContourOriginalFrontSource};
