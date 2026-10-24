'use strict';
/**
 * M5: exact FIRST-ANGLE forward volume-ray classification for 3D creases
 * of TWO confirmed finite convex cylinders, with explicit Boolean choice.
 *
 * At a transverse boundary-boundary point p, each cylinder is convex and
 * p lies on its boundary. For axis ray p+t*d, t>0, the ray enters the
 * cylinder's STRICT interior iff the active outward face gradient has
 * strictly negative dot(d). Nonnegative dot(d) cannot ever re-enter the
 * same convex cylinder (curved tangent exits quadratically; cap tangent
 * stays on the plane). Therefore:
 * INTERSECTION opaque ahead iff both gradients dot(d)<0.
 * UNION opaque ahead iff either gradient dot(d)<0.
 *
 * On M3 signed-radical arcs, V/H directional signs are constant and W
 * switches only at the two X-axis centers; split analytically at these
 * roots. On each verified cap face-pair line, both directional derivatives
 * are constant (linear normal and axis-aligned generator). Endpoints and
 * switching points are NOT included. Theorem certifies only strict-volume
 * ray evidence, not standard drafting stroke or the final drawing.
 */
const {auditC3LocalBooleanCreases}=
 require('./c3-local-boolean-crease.cjs');
const {auditC3Merged3DSourceGraph}=
 require('./c3-merged-3d-source-graph.cjs');
const {auditC3CapBoundaryIncidence}=
 require('./c3-cap-boundary-incidence.cjs');
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))freeze(x);Object.freeze(o);
}return o;};
function auditC3SelectedBooleanVHWOpenRays({input,revision,solidOperation=null}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current C3 finite-source revision required');
 const local=auditC3LocalBooleanCreases({input,revision,solidOperation});
 const blocked=(reason)=>freeze({
  schema:'draftai-c3-boolean-VHW-open-rays/1',revision,
  solidOperation:solidOperation||'unselected',
  status:local.status==='requires-explicit-solid-operation'?
   'requires-explicit-solid-operation':'not-covered',reason,
  intervals:[],sourceEdgeCount:0,certifiedClearCount:0,
  certifiedOpaqueCount:0,undeterminedCount:0,
  fullSourceOpenEdgeRayCoverageVerified:false,
  sourceJunctionRayContinuityVerified:false,
  projectedFeatureOcclusionAndLineStyleVerified:false,
  officialLineStylesVerified:false,finalV5CurveAuthorized:false
 });
 if(local.status!=='scoped-all-source-open-edges-locally-retained'||
   local.localBooleanRetainedFaceSidesVerified!==true||
   !local.edgeProofs.length||
   !local.edgeProofs.every(p=>p.regularTransverseThroughoutOpenEdge&&
      p.localCompositeCreaseRetained))
  return blocked('all local 3D Boolean face-pair crease proofs required');
 const rays=FIRST_ANGLE_OBSERVER_RAYS;
 if(JSON.stringify(rays.V)!=='{"x":0,"y":-1,"z":0}'||
    JSON.stringify(rays.H)!=='{"x":0,"y":0,"z":1}'||
    JSON.stringify(rays.W)!=='{"x":1,"y":0,"z":0}')
  throw new RangeError('unexpected first-angle observer-ray convention');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 const graph=auditC3Merged3DSourceGraph({input,revision});
 const cap=auditC3CapBoundaryIncidence({input,revision});
 if(graph.edges.length!==local.sourceEdgeCount||
    graph.edges.length!==local.edgeProofs.length)
  throw new RangeError('M5 source graph and Boolean theorem identity changed');
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
 const branches=new Map(m3.branches.map(b=>[b.id,b]));
 const capMap=new Map(cap.capSegments.map(s=>[s.id,s]));
 const tol=1e-10*Math.max(1,Z.radius,Y.radius);
 const raySign=n=>n===0?0:n>0?1:-1;
 // Strict open side signs: -1 inward, 0 tangent, +1 outward.
 const rayOutcome=(z,y)=>z===null||y===null?'undetermined':
   (solidOperation==='intersection'?(z===-1&&y===-1):
      (z===-1||y===-1))?
     'opaque-interior-ahead':'strict-interior-ray-clear';
 const intervals=[];
 for(const edge of graph.edges){
  const source=local.edgeProofs.find(p=>p.edgeId===edge.id);
  if(!source||!source.localCompositeCreaseRetained)
   throw new RangeError('source graph edge lacks selected Boolean crease theorem');
  if(edge.kind==='analytic-curve'){
   const b=branches.get(edge.sourceId);
   if(!b)throw new RangeError('lost analytic lateral source identity');
   for(const view of ['V','H','W']){
    const [lo,hi]=b.xRange;
    const cuts=[lo,hi];
    if(view==='W')for(const center of [Z.xCenter,Y.xCenter])
     if(center>lo+tol&&center<hi-tol)cuts.push(center);
    const sorted=[...new Set(cuts)].sort((a,c)=>a-c);
    for(let k=1;k<sorted.length;k++){
     const a=sorted[k-1],c=sorted[k];
     if(!(c-a>tol))throw new RangeError('unresolved small directional ray interval');
     const x=(a+c)/2;
     const zSign=view==='V'?-b.signY:
       view==='H'?0:raySign(x-Z.xCenter);
     const ySign=view==='V'?0:
       view==='H'?b.signZ:raySign(x-Y.xCenter);
     const status=rayOutcome(zSign,ySign);
     intervals.push({
      edgeId:edge.id,sourceId:edge.sourceId,sourceKind:edge.kind,view,
      parameterKind:'x',openParameterRange:[a,c],
      zCylinderOutwardRaySign:zSign,yCylinderOutwardRaySign:ySign,
      openInteriorVolumeRayStatus:status,
      proofMethod:'sign-fixed-root-and-linear-X-center-partition',
      sourceFirstAngleRayEntireIntervalProven:status!=='undetermined',
      switchingPointsAndEndpointsCertified:false,
      standardLineStyle:'undetermined',finalV5StrokeAuthorized:false
     });
    }
   }
  }else{
   const feature=capMap.get(edge.sourceId);
   if(!feature||!Array.isArray(edge.sourceRange)||
      edge.sourceRange.length!==2)
    throw new RangeError('lost finite cap line source identity');
   const zFace=feature.sourceFaces.find(f=>f.startsWith('zCylinder.'));
   const yFace=feature.sourceFaces.find(f=>f.startsWith('yCylinder.'));
   if(!zFace||!yFace)throw new RangeError('lost selected source face');
   const signFor=(face,view,p)=>{
    if(face==='zCylinder.lateral')return view==='V'?
     -(p.y-Z.yCenter):view==='H'?0:p.x-Z.xCenter;
    if(face==='yCylinder.lateral')return view==='V'?0:
     view==='H'?p.z-Y.zCenter:p.x-Y.xCenter;
    if(face==='zCylinder.cap.zMin')return view==='H'?-1:0;
    if(face==='zCylinder.cap.zMax')return view==='H'?1:0;
    if(face==='yCylinder.cap.yMin')return view==='V'?1:0;
    if(face==='yCylinder.cap.yMax')return view==='V'?-1:0;
    throw new RangeError('unknown finite source solid face');
   };
   for(const view of ['V','H','W']){
    const first=[signFor(zFace,view,feature.from),
       signFor(yFace,view,feature.from)];
    const last=[signFor(zFace,view,feature.to),
       signFor(yFace,view,feature.to)];
    if(first.some((x,i)=>Math.abs(x-last[i])>tol))
     throw new RangeError('cap edge ray derivative is not source-constant');
    const classify=x=>Math.abs(x)<=tol?(x===0?0:null):raySign(x);
    const zSign=classify(first[0]),ySign=classify(first[1]);
    const status=rayOutcome(zSign,ySign);
    intervals.push({
     edgeId:edge.id,sourceId:edge.sourceId,sourceKind:edge.kind,view,
     parameterKind:'cap-source-unit-interval',
     openParameterRange:[...edge.sourceRange],
     zCylinderOutwardRaySign:zSign,yCylinderOutwardRaySign:ySign,
     openInteriorVolumeRayStatus:status,
     proofMethod:'constant-axis-cap-face-normal-and-convex-ray',
     sourceFirstAngleRayEntireIntervalProven:status!=='undetermined',
     switchingPointsAndEndpointsCertified:false,
     standardLineStyle:'undetermined',finalV5StrokeAuthorized:false
    });
   }
  }
 }
 const allCovered=['V','H','W'].every(view=>
  graph.edges.every(e=>intervals.some(i=>
   i.view===view&&i.edgeId===e.id)));
 const unknown=intervals.filter(i=>
  i.openInteriorVolumeRayStatus==='undetermined').length;
 return freeze({
  schema:'draftai-c3-boolean-VHW-open-rays/1',revision,
  solidOperation,status:allCovered&&unknown===0?
   'scoped-three-view-regular-open-ray-theorem':
   'scoped-partial-regular-open-ray-theorem',
  intervals,sourceEdgeCount:graph.edges.length,
  certifiedClearCount:intervals.filter(i=>
   i.openInteriorVolumeRayStatus==='strict-interior-ray-clear').length,
  certifiedOpaqueCount:intervals.filter(i=>
   i.openInteriorVolumeRayStatus==='opaque-interior-ahead').length,
  undeterminedCount:unknown,
  fullSourceOpenEdgeRayCoverageVerified:allCovered&&unknown===0,
  proofUsesConvexFiniteSourceSolids:true,
  projectedFeatureCoincidenceStillRequiresSeparateProof:true,
  sourceJunctionRayContinuityVerified:false,
  projectedFeatureOcclusionAndLineStyleVerified:false,
  officialLineStylesVerified:false,finalV5CurveAuthorized:false
 });
}
module.exports={auditC3SelectedBooleanVHWOpenRays};
