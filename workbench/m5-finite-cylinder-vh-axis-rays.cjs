'use strict';
/**
 * M5 finite-cylinder LATERAL-LATERAL V/H positive occlusion proof.
 *
 * First-angle observer V=(0,-1,0): at a source curve point,
 *   F_z(x,y-t,z)-F_z(x,y,z)=-2*(y-Z.yCenter)*t+t*t.
 * Thus signY=+ proves strict Z-volume in front for sufficiently small t>0,
 * PROVIDED the entire analytic x-open branch lies STRICTLY inside Z's z caps.
 *
 * First-angle observer H=(0,0,+1):
 *   F_y(x,y,z+t)-F_y(x,y,z)=2*(z-Y.zCenter)*t+t*t.
 * Thus signZ=- proves strict Y-volume in front for small positive t,
 * PROVIDED the entire branch is strictly inside Y's y caps.
 *
 * The OTHER cylinder is tangent to the observer ray (generator-direction).
 * Therefore the opposite sign does NOT prove an unobstructed drawable
 * curve: it remains undetermined, not 'visible'.
 *
 * Each finite-axial cap guard uses the exact extrema of the analytic radical
 * over the WHOLE source branch (endpoints plus optional X axis center).
 * Equality/near-tangency at a cap or truncated axial boundary fails closed.
 * No point sampling can upgrade this scope. Endpoint joins, global 3D curve
 * feature semantics, official line styles, and V5 remain UNSIGNED.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const child of Object.values(x))freeze(child);
 Object.freeze(x);
}return x;};
const finite=Number.isFinite;
function radicalRange(branch,axisCenter,radius,offset,sign){
 const [a,b]=branch.xRange;
 if(!(finite(a)&&finite(b)&&b>a&&finite(radius)&&radius>0&&
    finite(axisCenter)&&finite(offset)&&[-1,1].includes(sign)))
  throw new RangeError('untrusted analytic branch or radical source');
 const rootAt=x=>{
  const v=(radius-Math.abs(x-axisCenter))*(radius+Math.abs(x-axisCenter));
  const tol=1e-11*Math.max(1,radius*radius);
  if(v< -tol)throw new RangeError('analytic branch leaves signed radical support');
  return Math.sqrt(Math.max(0,v));
 };
 const values=[rootAt(a),rootAt(b)];
 if(axisCenter>a&&axisCenter<b)values.push(radius);
 const low=Math.min(...values),high=Math.max(...values);
 return sign===1?{min:offset+low,max:offset+high}:
  {min:offset-high,max:offset-low};
}
function auditFiniteCylinderVHAxisRays({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current finite cylinder source revision required');
 const source=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 const blocked=status=>freeze({
  schema:'draftai-m5-finite-cylinder-VH-axis-rays/1',
  revision,status:'not-covered',sourceStatus:status,
  sourceBranchCoverageVerified:false,sourceBranchCount:0,
  intervals:[],intervalCount:0,certifiedOccludedCount:0,
  generatorOrCapUndeterminedCount:0,
  viewCoverage:{V:'not-covered',H:'not-covered'},
  allCurveEndpointsVerified:false,
  officialLineStylesVerified:false,completeCurveV5Ready:false
 });
 if(source.status!=='scoped-analytic-ready'||
    source.geometryVerifiedWithinSpecialistScope!==true||
    source.analyticallyCompleteWithinScope!==true||
    source.verifiedCapClipping!==true||source.sourceConfirmed!==true||
    source.officialLineStylesVerified!==false||source.v5Ready!==false)
  return blocked(source.status);
 const Z=source.source?.zCylinder,Y=source.source?.yCylinder;
 const V=FIRST_ANGLE_OBSERVER_RAYS.V,H=FIRST_ANGLE_OBSERVER_RAYS.H;
 if(!Z||!Y||V.x!==0||V.y!==-1||V.z!==0||
    H.x!==0||H.y!==0||H.z!==1)
  throw new RangeError('unexpected source cylinders or first-angle rays');
 if(source.branchCount!==source.branches.length||source.branchCount>64)
  throw new RangeError('incomplete current verified signed branch scope');
 const capTol=1e-9*Math.max(1,Z.radius,Y.radius);
 const intervals=[];
 for(const branch of source.branches){
  if(!branch||branch.finiteDomainVerified!==true||
     branch.officialLineStyle!=='undetermined'||
     ![-1,1].includes(branch.signY)||
     ![-1,1].includes(branch.signZ))
   throw new RangeError('unverified M3 source branch');
  // Exact analytic coordinate extrema, NOT an interior-only sample.
  const yRange=radicalRange(branch,Z.xCenter,Z.radius,Z.yCenter,
   branch.signY);
  const zRange=radicalRange(branch,Y.xCenter,Y.radius,Y.zCenter,
   branch.signZ);
  const zCapStrict=zRange.min>Z.zMin+capTol&&zRange.max<Z.zMax-capTol;
  const yCapStrict=yRange.min>Y.yMin+capTol&&yRange.max<Y.yMax-capTol;
  for(const view of ['V','H']){
   const inward=view==='V'?branch.signY===1:branch.signZ===-1;
   const strictCap=view==='V'?zCapStrict:yCapStrict;
   const proven=inward&&strictCap;
   intervals.push({
    id:view.toLowerCase()+intervals.length,
    branchId:branch.id,sourceM3BranchId:branch.id,view,
    sourceSignY:branch.signY,sourceSignZ:branch.signZ,
    xOpenRange:[...branch.xRange],
    observerDirection:{...FIRST_ANGLE_OBSERVER_RAYS[view]},
    status:proven?'certified-entire-open-interval-strictly-volume-occluded':
     'undetermined-axis-generator-or-finite-cap',
    positiveOpaqueVolumeAheadForEveryOpenCurvePoint:proven,
    strictlyInteriorToOccludingCylinderCapsForWholeBranch:strictCap,
    sourceAxialCoordinateRangeOnWholeBranch:view==='V'?
      {...zRange}:{...yRange},
    relevantFiniteAxialCaps:view==='V'?
      [Z.zMin,Z.zMax]:[Y.yMin,Y.yMax],
    sourceOccluderId:proven?(view==='V'?'zCylinder':'yCylinder'):null,
    analyticPositiveRayIdentity:view==='V'?
      '-2*(y-Z.yCenter)*t+t*t':'2*(z-Y.zCenter)*t+t*t',
    rayCoincidentWithOtherCylinderGenerator:true,
    positiveOpenViewerRayClearVerified:false,
    originalCurveEndpointJunctionsVerified:false,
    completeFeatureContourVerified:false,
    officialSolidDashedLineStyle:'undetermined',
    canonicalConstructionIntentSigned:false,
    v5LineActionAuthorized:false
   });
  }
 }
 if(intervals.length!==source.branchCount*2||
   source.branches.some(b=>['V','H'].some(v=>
    intervals.filter(i=>i.branchId===b.id&&i.view===v).length!==1)))
  throw new RangeError('M5 V/H proof failed complete source branch accounting');
 return freeze({
  schema:'draftai-m5-finite-cylinder-VH-axis-rays/1',
  revision,status:'scoped-analytic-VH-strict-volume-occlusion',
  sourceBranchCount:source.branchCount,sourceBranchCoverageVerified:true,
  intervals,intervalCount:intervals.length,
  certifiedOccludedCount:intervals.filter(i=>
   i.positiveOpaqueVolumeAheadForEveryOpenCurvePoint).length,
  generatorOrCapUndeterminedCount:intervals.filter(i=>
   !i.positiveOpaqueVolumeAheadForEveryOpenCurvePoint).length,
  viewCoverage:{
   V:'positive-opaque-forward-rays-only-generator-clearance-uncertain',
   H:'positive-opaque-forward-rays-only-generator-clearance-uncertain'
  },
  allCurveEndpointsVerified:false,
  standardFirstAngleGeometryVerifiedWithinScope:true,
  officialLineStylesVerified:false,
  completeCurveV5Ready:false
 });
}
module.exports={auditFiniteCylinderVHAxisRays};
