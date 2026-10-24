'use strict';
/**
 * C3 W view, analytic uniqueness of the lateral/lateral source projection.
 *
 * Both finite curves satisfy the SAME independently checked source surfaces:
 *  (x-Xz)^2+(y-Yz)^2=Rz^2; (x-Xy)^2+(z-Zy)^2=Ry^2.
 * Two real curve points with the same W projection (y,z) obey
 * (x-x')*(x+x'-2*Xz)=0 and (x-x')*(x+x'-2*Xy)=0.
 * If Xz != Xy, x != x' leads to contradiction. Thus EXACT projected
 * lateral/lateral curve points have unique spatial x, on all sign branches.
 * This theorem does NOT exclude overlap with caps, silhouettes, external
 * edges, other shapes, pixel-level near-coincidence or certify V5 line types.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC3WLateralProjectionInjectivity({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current reviewed C3 source revision required');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 const notCovered=()=>freeze({schema:'draftai-c3-w-lateral-injectivity/1',
  revision,status:'not-covered',m3Status:m3.status,
  projectedLateralLateralPointInjectivityVerified:false,
  officialLineStylesVerified:false,v5Authorized:false});
 if(m3.status!=='scoped-analytic-ready'||
    m3.sourceConfirmed!==true||m3.verifiedCapClipping!==true||
    m3.analyticallyCompleteWithinScope!==true||
    m3.geometryVerifiedWithinSpecialistScope!==true||
    m3.officialLineStylesVerified!==false)
  return notCovered();
 const {zCylinder:Z,yCylinder:Y}=m3.source;
 const dir=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(dir.x!==1||dir.y!==0||dir.z!==0)
  throw new RangeError('first-angle W view changed');
 const delta=Z.xCenter-Y.xCenter;
 const tol=1e-9*Math.max(1,Math.abs(Z.xCenter),Math.abs(Y.xCenter),
  Z.radius,Y.radius);
 const separated=Math.abs(delta)>tol;
 const data=[];
 let worst=0;
 if(separated)for(const branch of m3.branches){
  if(branch.finiteDomainVerified!==true||
     branch.officialLineStyle!=='undetermined')
   throw new RangeError('unverified C3 analytic source branch');
  for(const entry of branch.witnesses){
   const p=entry.point,uv=project(p).W;
   // The canonical first-angle W map MUST be (u,v)=(y,z).
   // An invertible viewer plane map is required by the uniqueness theorem.
   const firstAngleInverseValid=uv.u===p.y&&uv.v===p.z;
   const numerator=Z.xCenter**2-Y.xCenter**2+
    (p.y-Z.yCenter)**2-(p.z-Y.zCenter)**2-
    Z.radius**2+Y.radius**2;
   const inverseX=numerator/(2*delta);
   const scale=Math.max(1,Math.abs(p.x),Z.radius,Y.radius);
   const residual=Math.abs(inverseX-p.x)/scale;
   if(!Number.isFinite(residual))throw new RangeError('invalid inverse W source');
   worst=Math.max(worst,residual);
   data.push({branchId:branch.id,originalSourceX:p.x,
    recoveredSourceX:inverseX,scaledInverseResidual:residual,
    independentFirstAngleWProjection:uv,
    sourceProjectionParityVerified:firstAngleInverseValid&&
     uv.u===entry.projections.W.u&&uv.v===entry.projections.W.v});
  }
 }
 const sourceProjectionParity=data.every(d=>d.sourceProjectionParityVerified);
 const stable=separated&&sourceProjectionParity&&worst<=1e-8&&
  data.length===m3.branches.length*3;
 return freeze({schema:'draftai-c3-w-lateral-injectivity/1',
  revision,status:stable?'certified-lateral-lateral-exact-W-injective':
   'undetermined-axis-coincidence-or-numerical-conditioning',
  reviewedM3SourceBranchCount:m3.branchCount,
  distinctXCenterSeparationVerified:separated,
  absoluteXCenterSeparation:Math.abs(delta),
  algebraicUniquenessIdentity:
   '(x-xprime)*(x+xprime-2*Xz)=0 AND (x-xprime)*(x+xprime-2*Xy)=0',
  sourceInverseWitnessCount:data.length,
  maxScaledSourceInverseResidual:separated?worst:null,
  actualFirstAngleWProjectionParityVerified:sourceProjectionParity,
  projectedLateralLateralPointInjectivityVerified:stable,
  projectionOfCapsAndOtherPhysicalFeaturesVerified:false,
  pixelScaleSeparationVerified:false,
  entireCurveVisibilityVerified:false,
  officialLineStylesVerified:false,v5Authorized:false});
}
module.exports={auditC3WLateralProjectionInjectivity};
