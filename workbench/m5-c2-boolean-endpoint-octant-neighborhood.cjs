'use strict';
/**
 * C2 / M5: true 3D infinitesimal union occupancy about a CLOSED source
 * endpoint, within the already M0-reviewed axis-aligned cuboid scope.
 *
 * The 8 signed XYZ open octants are exact limiting cells. No finite
 * epsilon sample, image-only join, triangle mesh reconstruction, new
 * Boolean kernel, or tolerance snapping is used. Reuse the existing
 * M0 validated box adapter. For an axial outgoing feature, its four
 * octants on the source-facing halfspace give the independently checked
 * original/new crease quadrant at the endpoint (1 convex, 3 concave).
 *
 * This witnesses a LOCALLY coherent 3D exterior and its incoming source
 * direction. It is NOT a continuous global silhouette, closed linecap,
 * all-face occlusion, official line standard or V5 release authority.
 */
const {boxFromConfirmedConvexMesh}=
 require('../core/geometry/reviewed-box-contact-evidence.cjs');
const AXES=['x','y','z'];
const BITS={x:4,y:2,z:1};
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const child of Object.values(x))freeze(child);Object.freeze(x);
}return x;};
const finite3=p=>p&&AXES.every(k=>typeof p[k]==='number'&&
 Number.isFinite(p[k]));
function connectedOctants(mask,want){
 const seen=new Set(),members=mask.map((v,i)=>v===want?i:-1)
  .filter(i=>i>=0);
 if(!members.length)return 0;
 let components=0;
 for(const root of members){
  if(seen.has(root))continue;
  components++;
  const stack=[root];seen.add(root);
  while(stack.length){
   const v=stack.pop();
   for(const bit of [1,2,4]){
    const u=v^bit;
    if(mask[u]===want&&!seen.has(u)){
     seen.add(u);stack.push(u);
    }
   }
  }
 }
 return components;
}
function createReviewedC2BooleanEndpointNeighborhood({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('C2 reviewed current 2..8 source solids required');
 const names=new Set(),boxes=[];
 for(const g of geometry){
  if(!g||typeof g.id!=='string'||names.has(g.id))
   throw new TypeError('distinct current reviewed source Geometry IDs required');
  names.add(g.id);
  const box=boxFromConfirmedConvexMesh(g);
  if(!box)return freeze({schema:'draftai-m5-c2-boolean-endpoint-octants/1',
   revision,status:'not-covered-non-cuboid',
   sourceGeometryIds:geometry.map(x=>x.id),inspect:()=>null});
  boxes.push(box);
 }
 const cache=new Map();
 const inspect=(point,toward3D)=>{
  if(!finite3(point)||!finite3(toward3D))
   throw new TypeError('genuine finite source endpoint and direction required');
  const key=AXES.map(k=>point[k]).join('|');
  let pointProof=cache.get(key);
  if(!pointProof){
   const mask=[],octantSolids=[],nearCritical=[];
   for(const box of boxes)for(const axis of AXES)
    for(const bound of [box.min[axis],box.max[axis]])
     if(point[axis]!==bound&&
        Math.abs(point[axis]-bound)<=box.toleranceMm)
      nearCritical.push({sourceGeometryId:box.id,axis});
   const membership=boxes.some(b=>AXES.every(k=>
    point[k]>=b.min[k]&&point[k]<=b.max[k]));
   for(let i=0;i<8;i++){
    const solidIds=[];
    for(const b of boxes){
     const present=AXES.every(k=>{
      const sign=(i&BITS[k])?1:-1,v=point[k];
      return v>b.min[k]&&v<b.max[k]||
       (v===b.min[k]&&sign===1)||
       (v===b.max[k]&&sign===-1);
     });
     if(present)solidIds.push(b.id);
    }
    mask.push(solidIds.length>0);
    octantSolids.push(solidIds);
   }
   const occupied=mask.filter(Boolean).length,
    empty=8-occupied,
    insideComponents=connectedOctants(mask,true),
    outsideComponents=connectedOctants(mask,false);
   const local=nearCritical.length===0&&membership&&
    occupied>0&&empty>0&&insideComponents===1&&
    outsideComponents===1;
   pointProof=freeze({
    physicalXYZ:{...point},
    sourceGeometryIds:boxes.map(b=>b.id),
    openOctantUnionOccupancy:mask,
    openOctantContributingSourceIds:octantSolids,
    occupiedOctantCount:occupied,emptyOctantCount:empty,
    occupiedFaceAdjacentComponentCount:insideComponents,
    exteriorFaceAdjacentComponentCount:outsideComponents,
    nearCriticalNonExactBoxFaceCount:nearCritical.length,
    pointBelongsToClosedReviewedSolidUnion:membership,
    localSingleExteriorBooleanNeighborhoodVerified:local,
    actualGlobalPhysicalFeatureContinuityVerified:false,
    canonicalV5ActionSigned:false
   });
   cache.set(key,pointProof);
  }
  const moving=AXES.filter(k=>toward3D[k]!==point[k]),
   axis=moving.length===1?moving[0]:null,
   sign=axis?Math.sign(toward3D[axis]-point[axis]):0;
  const outgoingMask=axis?pointProof.openOctantUnionOccupancy.filter(
   (_,i)=>Boolean(i&BITS[axis])===(sign===1)):[];
  const count=outgoingMask.filter(Boolean).length;
  const positive=pointProof.localSingleExteriorBooleanNeighborhoodVerified&&
   outgoingMask.length===4&&(count===1||count===3);
  return freeze({
   schema:'draftai-m5-c2-boolean-endpoint-octants/1',
   revision,status:'scoped-closed-3d-boolean-local-neighborhood',
   ...pointProof,
   outgoingSourceAxis:axis,
   outgoingSourceSign:sign,
   outgoingHalfOctantOccupancy:outgoingMask,
   occupiedOutgoingQuadrantCount:count,
   outgoingRealSourceBooleanExteriorOpenLimitVerified:positive,
   localClosedUnionBoundaryWithOutgoingSourceVerified:positive,
   closedEndpointCompleteEngineeringLinecapVerified:false,
   allOtherBodyProjectedOcclusionTransitionsVerified:false,
   officialEngineeringLineStyle:'undetermined',
   signedV5LineActions:0,v5Ready:false
  });
 };
 return freeze({
  schema:'draftai-m5-c2-boolean-endpoint-scene/1',
  revision,status:'m0-reviewed-orthogonal-composite-boolean-neighborhood',
  sourceGeometryIds:boxes.map(b=>b.id),inspect,
  officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false});
}
module.exports={createReviewedC2BooleanEndpointNeighborhood,connectedOctants};
