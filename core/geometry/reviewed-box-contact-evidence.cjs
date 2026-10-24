'use strict';
/**
 * C2: scoped 3D RELATIONSHIP evidence for reviewed axis-aligned cuboids,
 * not a boolean solver, connected-volume proof, silhouette or V5 line style.
 * Preserve the general closed-convex mesh proof as a required prerequisite.
 * No guessed geometry from any two orthographic view silhouettes.
 */
const {verifiedConvexMeshHalfspaces}=
 require('./verified-convex-mesh-halfspaces.cjs');
const AXES=['x','y','z'],finite=Number.isFinite;
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  Object.values(x).forEach(freeze);Object.freeze(x);
 }
 return x;
};
function boxFromConfirmedConvexMesh(g){
 if(g?.kind!=='mesh'||g.space!=='model-3d'||g.unit!=='mm'||
    Object.keys(g.data?.points||{}).length!==8||
    g.data?.edges?.length!==12||g.data?.faces?.length!==6)
  return null;
 let proof;
 try{proof=verifiedConvexMeshHalfspaces(g);}catch{return null;}
 const points=Object.values(g.data.points),min={},max={};
 for(const axis of AXES){
  min[axis]=Math.min(...points.map(p=>p[axis]));
  max[axis]=Math.max(...points.map(p=>p[axis]));
  if(!finite(min[axis])||!finite(max[axis])||
     !(max[axis]-min[axis]>proof.toleranceMm))return null;
 }
 // Exactly eight Cartesian products, no diagonal or warped mesh admitted.
 const corners=new Set();
 for(const p of points){
  let id='';
  for(const axis of AXES){
   if(p[axis]===min[axis])id+='0';
   else if(p[axis]===max[axis])id+='1';
   else return null; // no tolerance-based snapping a warped mesh
  }
  if(corners.has(id))return null;
  corners.add(id);
 }
 if(corners.size!==8)return null;
 return freeze({id:g.id,min,max,sourceProof:proof.provenTopology,
  toleranceMm:proof.toleranceMm,solidKind:'verified-axis-aligned-cuboid'});
}
function evaluateReviewedBoxContacts({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    !Array.isArray(geometry)||geometry.length>100)
  throw new TypeError('confirmed bounded Geometry and revision required');
 const ids=new Set(),boxes=[];
 let unsupportedCount=0;
 for(const g of geometry){
  if(!g||typeof g.id!=='string'||ids.has(g.id))
   throw new TypeError('duplicate or missing Geometry identity');
  ids.add(g.id);
  if(g.kind!=='mesh')continue;
  const box=boxFromConfirmedConvexMesh(g);
  if(!box)unsupportedCount++;
  else boxes.push(box);
 }
 if(boxes.length>16)
  return freeze({schema:'draftai-reviewed-box-contacts/1',
   revision,status:'not-covered',reason:'scoped pair count exceeds 16',
   sourceGeometryIds:boxes.map(x=>x.id),unsupportedCount,
   boxCount:boxes.length,pairs:[],pairCount:0,
   constructedGeometry:null,booleanUnionVerified:false,
   officialLineStylesVerified:false,v5Ready:false});
 const pairs=[];
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
  const a=boxes[i],b=boxes[j],overlap={};
  let separated=false,nearCritical=false,exactTouchCount=0;
  for(const axis of AXES){
   overlap[axis]=Math.min(a.max[axis],b.max[axis])-
    Math.max(a.min[axis],b.min[axis]);
   if(!finite(overlap[axis]))throw new RangeError('nonfinite box overlap');
   const tol=Math.max(a.toleranceMm,b.toleranceMm);
   if(overlap[axis] < -tol)separated=true;
   else if(overlap[axis]===0)exactTouchCount++;
   else if(Math.abs(overlap[axis])<=tol)nearCritical=true;
  }
  const relation=separated?'separated':
   nearCritical?'undetermined-near-contact':
   exactTouchCount===3?'point-contact':
   exactTouchCount===2?'edge-contact':
   exactTouchCount===1?'face-contact':'volumetric-overlap';
  pairs.push({objectIds:[a.id,b.id],relation,axisOverlapMm:overlap,
   toleranceMm:Math.max(a.toleranceMm,b.toleranceMm),
   scope:'confirmed-axis-aligned-convex-bounds-only',
   positiveVolumeOverlap:relation==='volumetric-overlap',
   exactBoundaryContact:relation.endsWith('-contact'),
   booleanUnionVerified:false,occlusionVerified:false,
   visibleHiddenLineStyles:'undetermined'});
 }
 return freeze({schema:'draftai-reviewed-box-contacts/1',revision,
  status:unsupportedCount?'scoped-only':'pairwise-proven',
  sourceGeometryIds:boxes.map(x=>x.id),unsupportedCount,
  boxCount:boxes.length,pairs,pairCount:pairs.length,
  constructedGeometry:null,booleanUnionVerified:false,
  officialLineStylesVerified:false,v5Ready:false});
}
module.exports={boxFromConfirmedConvexMesh,evaluateReviewedBoxContacts};
