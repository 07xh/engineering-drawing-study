'use strict';
/**
 * M3 finite-cone section: analytic ray/surface visibility evidence.
 * Only orthographic lateral-surface occlusion of verified section samples
 * is decided. Never claim a complete drawing, silhouette or cap visibility.
 */
const {verifiedConeSpatialIntent}=require('./verified-cone-spatial-intent.cjs');
const {project}=require('../core/projection/conventions.js');
const finite=Number.isFinite;
const dirs={V:{x:0,y:-1,z:0},H:{x:0,y:0,z:1},W:{x:1,y:0,z:0}};
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
// Ray direction is explicitly from the surface point toward the observer.
// V looks along -Y, H along +Z and W along +X in this coordinate system.
function coneSectionVisibilityEvidence(cone,plane,options={}){
 const source=verifiedConeSpatialIntent(cone,plane,options);
 if(source.status!=='ready')
  return {status:'not-verified',reason:source.reason,visibilityVerified:false,views:null};
 const apex={x:cone.baseCenter.x,y:cone.baseCenter.y,
  z:cone.baseCenter.z+cone.heightMm};
 const k=cone.radiusMm/cone.heightMm;
 const views={};
 const tolerance=1e-8*Math.max(1,cone.radiusMm,cone.heightMm);
 for(const [view,d] of Object.entries(dirs)){
  const entries=[];
  for(const p of source.spatialIntent.operation.samplePoints){
   // Ray toward the observer: p + t*d, t>0. Find a strictly closer
   // second intersection with the cone's finite lateral surface.
   const q={x:p.x-cone.baseCenter.x,y:p.y-cone.baseCenter.y,
    z:apex.z-p.z};
   const A=d.x*d.x+d.y*d.y-k*k*d.z*d.z;
   const B=2*(q.x*d.x+q.y*d.y+k*k*q.z*d.z);
   let occluded=false,ambiguous=false,nearest=null;
   if(Math.abs(A)<=1e-14){
    // A near-linear ray may be tangent/degenerate; do not certify visibility.
    ambiguous=true;
   }else{
    const t=-B/A;
    if(finite(t)&&t>tolerance){
     const hit={x:p.x+t*d.x,y:p.y+t*d.y,z:p.z+t*d.z};
     const rho=Math.hypot(hit.x-cone.baseCenter.x,hit.y-cone.baseCenter.y);
     const expected=k*(apex.z-hit.z);
     const surfaceError=Math.abs(rho-expected);
     if(hit.z>=cone.baseCenter.z-tolerance&&hit.z<=apex.z+tolerance&&
        surfaceError<=tolerance){
      occluded=true;nearest=t;
     }else if(surfaceError>tolerance&&
      hit.z>=cone.baseCenter.z&&hit.z<=apex.z)ambiguous=true;
    }
   }
   // Near silhouette/grazing rays have unstable visibility classification.
   const normal={x:q.x,y:q.y,z:k*k*q.z};
   const norm=Math.hypot(normal.x,normal.y,normal.z);
   if(norm<=tolerance||Math.abs(dot(normal,d))/norm<1e-7)ambiguous=true;
   // The H view can be blocked by the planar base disk only for rays
   // pointing toward -Z. Our H ray is +Z, so the base lies behind
   // lateral points. This does not certify cap boundary presentation.
   entries.push({projection:project(p)[view],
    visibility:ambiguous?'undetermined':occluded?'occluded':'visible',
    lateralRayIntersectionMm:nearest});
  }
  views[view]=entries;
 }
 return {status:'lateral-sample-evidence',revision:source.revision,views,
  spatialIntent:source.spatialIntent,
  lateralRayTested:true,visibilityVerified:false,
  capOcclusionVerified:false,continuousCurveVisibilityVerified:false,
  fullContourVerified:false,firstAngleLayoutVerified:false};
}
module.exports={coneSectionVisibilityEvidence};
