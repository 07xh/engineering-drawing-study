'use strict';
/**
 * Exact horizontal orthographic ray test for finite upright right cone.
 * At fixed z, solid cross-section is a closed disk with radius
 * R(z)=r*(apexZ-z)/h. An observer at -Y or +X sees the first disk
 * boundary along its ray. This proves visibility of lateral points
 * at STRICT interior heights, without deciding coincident base-cap rays.
 */
function coneHorizontalSolidRay(cone,point,view,{epsilon=1e-9}={}){
 const finite=Number.isFinite;
 if(!cone||!point||!['V','W'].includes(view)||
    !cone.baseCenter||![cone.baseCenter.x,cone.baseCenter.y,cone.baseCenter.z,
      cone.radiusMm,cone.heightMm,point.x,point.y,point.z,epsilon].every(finite)||
    cone.radiusMm<=0||cone.heightMm<=0||epsilon<=0)
  throw new TypeError('finite cone, point, V/W view and tolerance required');
 const z=point.z-cone.baseCenter.z;
 if(z<=epsilon||z>=cone.heightMm-epsilon)
  return {status:'undetermined',reason:'base or apex degeneracy; cap-ray convention required'};
 const radius=cone.radiusMm*(cone.heightMm-z)/cone.heightMm;
 const x=point.x-cone.baseCenter.x,y=point.y-cone.baseCenter.y;
 if(Math.abs(Math.hypot(x,y)-radius)>epsilon*Math.max(1,radius))
  return {status:'undetermined',reason:'point not certified on cone lateral surface'};
 // V observer -Y: first boundary y=-sqrt(R²-x²).
 // W observer +X: first boundary x=+sqrt(R²-y²).
 const transverse=view==='V'?x:y;
 const root=Math.sqrt(Math.max(0,(radius-Math.abs(transverse))*(radius+Math.abs(transverse))));
 const depth=view==='V'?y:x;
 const first=view==='V'?-root:root;
 const delta=Math.abs(depth-first);
 const tol=epsilon*Math.max(1,radius);
 if(root<=tol||delta<=tol)
  return {status:'visible',proof:'first-intersection-of-exact-solid-disk-ray',
   view,firstHitDepth:first,rayRadiusMm:radius};
 return {status:'occluded',proof:'nearer-exact-solid-disk-boundary-on-observer-ray',
  view,firstHitDepth:first,rayRadiusMm:radius};
}
module.exports={coneHorizontalSolidRay};
