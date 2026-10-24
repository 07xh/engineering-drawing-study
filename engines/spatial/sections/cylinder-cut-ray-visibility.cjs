'use strict';
/**
 * DraftAI 04: exact interior-ray visibility for the VERIFIED 1D perimeter
 * of a known, plane-cut finite Z-axis right circular cylinder.
 *
 * The viewer direction (from a boundary point TOWARD the observer) and the
 * retained solid halfspace are both mandatory. This does not establish
 * first-angle diagram convention, occlusion of OTHER parts, hatching, V5
 * stroke style, or which side of a photographed solid was actually removed.
 *
 * For points on the cut plane, ray(t)=p+t*d, t>0. A ray aimed toward the
 * removed halfspace cannot intersect kept material. When aimed toward kept
 * material, lateral visibility depends on the radial outward derivative
 * cos(theta)*dx+sin(theta)*dy, while cap interiors depend on dz.
 * Silhouettes, edge-on cut planes and end junctions remain uncertified.
 */
const {finiteCylinderSectionBoundary}=
 require('./finite-cylinder-section-boundary.cjs');
const {normalizePlane}=require('./axis-cylinder-plane.cjs');
const {classifyConvexOpenRaySign}=
 require('../../../core/numeric/convex-open-ray.cjs');
const TAU=2*Math.PI;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point3=v=>v&&['x','y','z'].every(k=>finite(v[k])&&Math.abs(v[k])<=1e8);
const vecDot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const normalize=v=>{
 if(!point3(v))throw new TypeError('finite observer direction required');
 const mag=Math.hypot(v.x,v.y,v.z);
 if(!finite(mag)||mag<=1e-12)throw new RangeError('zero or invalid observer direction');
 return {x:v.x/mag,y:v.y/mag,z:v.z/mag};
};
const positiveAngle=a=>((a%TAU)+TAU)%TAU;
const project=p=>({V:{u:p.x,v:p.z},H:{u:p.x,v:p.y},W:{u:p.y,v:p.z}});
const dotPlane=(p,pl)=>vecDot(pl.normal,{
 x:p.x-pl.point.x,y:p.y-pl.point.y,z:p.z-pl.point.z
});
const blocked=(source,reason)=>({
 status:'blocked',sourceStatus:source?.status||'missing',
 reason:reason||source?.reason||'unverified section geometry',
 runs:[],visibilityVerified:false,viewerDirectionExplicit:true,
 sectionHalfspaceExplicit:true,standardViewMappingVerified:false,
 v5StrokeStyleReady:false,globallyUnique:null
});
function classifyCylinderSectionVisibility(cylinder,plane,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))
  throw new TypeError('visibility configuration required');
 const {retainedHalfspace,observerDirection,samplesPerTurn=64}=options;
 if(!['positive','negative'].includes(retainedHalfspace))
  throw new TypeError('explicit retainedHalfspace positive or negative required');
 const d=normalize(observerDirection),pl=normalizePlane(plane);
 const proof=finiteCylinderSectionBoundary(cylinder,plane,{samplesPerTurn});
 if(proof.status!=='ready'||proof.solidSectionPerimeterVerified!==true||
    proof.contourLoops.length!==1)
  return blocked(proof);
 const n=pl.normal,sideSign=retainedHalfspace==='positive'?1:-1;
 const k=sideSign*vecDot(n,d);
 const b=cylinder.baseCenter,r=cylinder.radiusMm;
 const minZ=b.z,maxZ=b.z+cylinder.heightMm;
 const scaleTol=1e-8*Math.max(1,r,cylinder.heightMm);
 const ANGLE_EPS=1e-9,DIR_EPS=1e-10;
 const keptRay=k>DIR_EPS;
 const azimuth=Math.atan2(d.y,d.x);
 const sideSlope=Math.hypot(d.x,d.y);
 const boundaryRuns=[],counts={visible:0,hidden:0,undetermined:0};
 let maxCheckedResidualMm=proof.maxResidualMm;
 const pointAt=t=>{
  const x=b.x+r*Math.cos(t),y=b.y+r*Math.sin(t);
  const z=pl.point.z-(
   n.x*(x-pl.point.x)+n.y*(y-pl.point.y))/n.z;
  return {x,y,z};
 };
 // One run represents a mathematically homogeneous OPEN arc interval. The
 // visibility of its corner endpoints is deliberately not asserted.
 for(const edge of proof.boundaryEdges){
  if(edge.kind==='lateral-arc'){
   const [start,end]=edge.angularInterval;
   const split=[start,end];
   if(sideSlope>DIR_EPS&&keptRay){
    const silhouetteAngles=[
     positiveAngle(azimuth+Math.PI/2),
     positiveAngle(azimuth+3*Math.PI/2)
    ];
    for(const phi of silhouetteAngles)
     if(phi>start+ANGLE_EPS&&phi<end-ANGLE_EPS)split.push(phi);
   }
   split.sort((a,b)=>a-b);
   for(let i=0;i<split.length-1;i++){
    const lo=split[i],hi=split[i+1];
    if(hi-lo<=ANGLE_EPS)continue;
    const theta=(lo+hi)/2;
    const slope=Math.cos(theta)*d.x+Math.sin(theta)*d.y;
    const rayCase=classifyConvexOpenRaySign(k,slope,DIR_EPS);
    let visibility='undetermined',why='edge-on-cut-or-silhouette';
    if(rayCase==='removed'){
     visibility='visible';why='ray-enters-removed-halfspace';
    }else if(rayCase==='exiting'){
     visibility='visible';why='ray-leaves-convex-cylinder-outward';
    }else if(rayCase==='entering'){
     visibility='hidden';why='ray-enters-retained-cylinder-interior';
    }
    const a=pointAt(lo),m=pointAt(theta),z=pointAt(hi);
    // Independently recompute plane, side, and finite-height residuals.
    for(const q of [a,m,z]){
     if(!point3(q))return blocked(proof,'invalid analytic visibility point');
     const residual=Math.max(
      Math.abs(dotPlane(q,pl)),
      Math.abs(Math.hypot(q.x-b.x,q.y-b.y)-r),
      Math.max(0,minZ-q.z,q.z-maxZ)
     );
     if(!finite(residual)||residual>scaleTol*4)
      return blocked(proof,'visibility partition fails analytic surface residual');
     maxCheckedResidualMm=Math.max(maxCheckedResidualMm,residual);
    }
    boundaryRuns.push({
     id:edge.id+'-run-'+(i+1),edgeId:edge.id,
     kind:'lateral-arc',visibility,reason:why,
     angularInterval:[lo,hi],
     endpointVisibilityVerified:false,openIntervalCertified:visibility!=='undetermined',
     from:a,through:m,to:z,
     projections:{from:project(a),through:project(m),to:project(z)}
    });
    counts[visibility]++;
   }
  }else if(edge.kind==='cap-chord'){
   const face=edge.face;
   const q=edge.midpoint;
   const capSign=face==='bottom'?1:-1;
   const entering=capSign*d.z;
   const rayCase=classifyConvexOpenRaySign(k,-entering,DIR_EPS);
   let visibility='undetermined',why='edge-on-cut-or-cap';
   if(rayCase==='removed'){
    visibility='visible';why='ray-enters-removed-halfspace';
   }else if(rayCase==='entering'){
    visibility='hidden';why='ray-enters-retained-cylinder-from-cap-interior';
   }else if(rayCase==='exiting'){
    visibility='visible';why='ray-leaves-cylinder-away-from-cap';
   }
   const residual=Math.max(
    Math.abs(dotPlane(q,pl)),Math.abs(q.z-(face==='bottom'?minZ:maxZ)),
    Math.max(0,Math.hypot(q.x-b.x,q.y-b.y)-r)
   );
   if(!finite(residual)||residual>scaleTol*4)
    return blocked(proof,'cap interior midpoint fails independent ray proof');
   maxCheckedResidualMm=Math.max(maxCheckedResidualMm,residual);
   boundaryRuns.push({
    id:edge.id+'-run',edgeId:edge.id,kind:'cap-chord',
    face,visibility,reason:why,
    endpointVisibilityVerified:false,openIntervalCertified:visibility!=='undetermined',
    from:edge.start,through:q,to:edge.end,
    projections:{from:project(edge.start),through:project(q),to:project(edge.end)}
   });
   counts[visibility]++;
  }else return blocked(proof,'unsupported section boundary edge');
 }
 if(boundaryRuns.length===0)return blocked(proof,'empty geometric visibility proof');
 return {
  status:'ready',modelUnit:'mm',
  retainedHalfspace,observerDirection:d,
  sourcePerimeterVerified:true,
  visibilityVerified:counts.undetermined===0,
  boundaryEndpointVisibilityVerified:false,
  standardViewMappingVerified:false,
  v5StrokeStyleReady:false,
  totalRuns:boundaryRuns.length,counts,
  runs:boundaryRuns,maxResidualMm:maxCheckedResidualMm,
  sceneAssumption:'only one finite Z-axis cylinder clipped by specified plane and retained halfspace; orthographic observer rays',
  proofScope:'open section-boundary intervals against retained convex solid interior; tangencies, corners and unrelated objects not covered',
  globallyUnique:null
 };
}
module.exports={classifyCylinderSectionVisibility};
