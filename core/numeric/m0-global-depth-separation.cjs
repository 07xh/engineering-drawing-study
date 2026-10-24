'use strict';
/**
 * Conservative continuous depth ordering of two convex solids along a
 * common orthographic observer direction. A strict global separation
 * of their projected depth slabs is a sufficient (not necessary)
 * certificate for EVERY ray that meets both solids.
 *
 * The source must separately prove both solids intersect each relevant
 * open segment interval; this module does not prove overlap or visibility.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
function certifyGlobalDepthOrder({front,back,observerDirection,marginMm=1e-7}={}){
 if(!front||!back||front.id===back.id||
  !Array.isArray(front.vertices)||!Array.isArray(back.vertices)||
  front.vertices.length<4||back.vertices.length<4||
  !observerDirection||!['x','y','z'].every(k=>finite(observerDirection[k]))||
  !finite(marginMm)||marginMm<=0||marginMm>1e-2)
  throw new TypeError('distinct solids with trusted finite vertex sets required');
 const norm=Math.hypot(observerDirection.x,observerDirection.y,observerDirection.z);
 if(!finite(norm)||norm<=1e-12)throw new RangeError('nonzero observer required');
 const d={x:observerDirection.x/norm,y:observerDirection.y/norm,
  z:observerDirection.z/norm};
 const bounds=s=>{
  const ds=s.vertices.map(p=>{
   if(!p||!['x','y','z'].every(k=>finite(p[k])&&Math.abs(p[k])<=1e8))
    throw new TypeError('finite trusted solid vertices required');
   return dot(p,d);
  });
  return [Math.min(...ds),Math.max(...ds)];
 };
 const f=bounds(front),b=bounds(back);
 // Positive d points from source toward observer. A globally front
 // solid has strictly greater depth than every point of the back solid.
 const separated=f[0]>b[1]+marginMm;
 return Object.freeze({schema:'draftai-m0-global-depth-separation/1',
  frontId:front.id,backId:back.id,frontDepthRange:f,backDepthRange:b,
  status:separated?'certified-global-separation':'undetermined',
  strictDepthOrderVerified:separated,
  vertexHullVerified:false,sourceRayOverlapVerified:false,
  completeSceneVerified:false,officialLineStyleVerified:false,
  v5VerifiedExportReady:false});
}
module.exports={certifyGlobalDepthOrder};
