'use strict';
/**
 * 04 + 09 strict local-interior face-ray evidence for an analytic FULL
 * ellipse cut of a bounded convex right circular cone. This COMPOSES
 * validated M3 geometry and existing 07 V/H/W ray directions; does not
 * solve, certify all endpoints, silhouette, projected overlap or line styles.
 */
const {validateSpatialConstructionIntent}=
 require('../core/contracts/spatial-construction-intent.js');
const {DIRS,validatedDirections}=
 require('./cone-open-ray-v5-mapping.cjs');
const finite=Number.isFinite;
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const diff=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const mean=points=>({
 x:points.reduce((a,p)=>a+p.x,0)/points.length,
 y:points.reduce((a,p)=>a+p.y,0)/points.length,
 z:points.reduce((a,p)=>a+p.z,0)/points.length
});
const blocked=(revision,reason)=>({
 status:'not-verified',revision,reason,views:null,
 completeSolidVisibilityVerified:false,visibilityEndpointsVerified:false
});
function coneSolidFaceRayEvidence(intent,{retainedHalfspace,observerDirections}={}){
 const valid=validateSpatialConstructionIntent(intent);
 if(!valid.ok||intent.source.mathStatus!=='ready')
  throw new TypeError('validated analytic cone spatial source required');
 if(!['positive','negative'].includes(retainedHalfspace))
  throw new TypeError('explicit retained solid halfspace required');
 const directions=validatedDirections(observerDirections||{
  V:{...DIRS.V},H:{...DIRS.H},W:{...DIRS.W}});
 const op=intent.operation,cone=op.cone,plane=op.plane,kind=op.geometryKind;
 if(kind!=='full-ellipse')
  return blocked(intent.revision,'clipped cap sector and face interior not certified');
 const boundary=op.samplePoints.slice(0,-1);
 const center=mean(boundary);
 const n=plane.normal,nn=Math.hypot(n.x,n.y,n.z);
 const base=cone.baseCenter;
 const apexZ=base.z+cone.heightMm;
 const h=cone.heightMm,r=cone.radiusMm;
 const eps=1e-7*Math.max(1,r,h);
 const planeResidual=Math.abs(dot(n,diff(center,plane.point)))/nn;
 const radial=Math.hypot(center.x-base.x,center.y-base.y);
 const coneMargin=r*(apexZ-center.z)/h-radial;
 if(![planeResidual,coneMargin,center.z].every(finite)||
    planeResidual>eps||coneMargin<=eps||
    center.z<=base.z+eps||center.z>=apexZ-eps)
  return blocked(intent.revision,'strict open interior of the analytic section unverified');
 const sign=retainedHalfspace==='positive'?1:-1;
 const apex={x:base.x,y:base.y,z:apexZ};
 const apexSigned=sign*dot(n,diff(apex,plane.point))/nn;
 if(Math.abs(apexSigned)<=eps)
  return blocked(intent.revision,'retained side near apex degeneracy');
 const keptApex=apexSigned>0;
 // Local face interior visibility: convex solid K=cone ∩ kept halfspace.
 // Strict outward ray leaves K for every t>0; strict inward ray initially
 // enters K and is hidden. Parallel/tangent rays remain undetermined.
 const outwardCut={
  x:-sign*n.x/nn,y:-sign*n.y/nn,z:-sign*n.z/nn};
 const classify=(normal,d)=>{
  const value=dot(normal,d);
  if(value>1e-10)return 'visible';
  if(value< -1e-10)return 'hidden';
  return 'undetermined';
 };
 const views={};
 for(const view of ['V','H','W']){
  const ray=directions[view];
  const face=classify(outwardCut,ray);
  const bottom=keptApex?null:classify({x:0,y:0,z:-1},ray);
  views[view]={
   cutFace:{visibility:face,proofScope:'strict-open-interior-only',
    boundaryAndSilhouetteVerified:false,
    planeSupportNormal:{...outwardCut}},
   baseFace:bottom===null?null:{
    visibility:bottom,proofScope:'strict-open-base-interior-only',
    boundaryAndSilhouetteVerified:false},
   rayDirection:{...ray}
  };
 }
 return {status:'strict-face-interior-evidence',
  revision:intent.revision,sourceSpatialIntentId:intent.id,
  retainedHalfspace,retainedPiece:keptApex?'apex':'base',
  cutInteriorWitnessMm:center,planeResidualMm:planeResidual,
  coneInteriorMarginMm:coneMargin,
  faceInteriorValidated:true,
  cutFaceOpenInteriorRayCertified:true,
  baseFaceOpenInteriorRayCertified:!keptApex,
  views,
  edgeRayTangentVerified:false,
  completeSolidVisibilityVerified:false,
  fullProjectedContourVisibilityVerified:false,
  visibilityEndpointsVerified:false,
  standardLineStylesCertified:false,
  V5ProofPromotionAllowed:false
 };
}
module.exports={coneSolidFaceRayEvidence};
