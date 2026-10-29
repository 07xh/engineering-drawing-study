'use strict';
/**
 * Finite C3 Boolean ray EXIT theorem on every whole positive W-open
 * analytic lateral/lateral branch interval, not just one sampled point.
 *
 * At p(x,y(x),z(x)) on both source cylinder walls, along the real W +X
 * ray at t>0 the radial differences are exactly
 *
 *   Z: F_Z(p+t ex)-F_Z(p) = t (t+2(x-Xz))
 *   Y: F_Y(p+t ex)-F_Y(p) = t (t+2(x-Xy)).
 *
 * If BOTH axial coordinates are strictly inside finite caps throughout
 * the open cell, the strict interior ray in either finite cylinder is
 * (0, 2*(Xcenter-x)) when x<Xcenter, and empty otherwise.
 *
 * For UNION the ray interior is (0,max(tZ,tY)), for INTERSECTION
 * (0,min(tZ,tY)) only when BOTH tZ and tY are positive. The FIRST
 * forward far boundary is affine: xExit(x)=2*sourceCenter-x, choosing
 * the MAX center for union and MIN center for intersection. This is
 * independent of pixels, sample count, W-paper aliases and cap line
 * visualization. The chosen source boundary identity remains stable
 * over the whole original x-open interval.
 *
 * This certifies strict volume (NOT engineering stroke style) and does
 * not claim that every projected outline crossing / cap-feature contact
 * or closed junction is already signed.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {partitionC3WDirectionalOpenIntervals}=
 require('./c3-selected-boolean-vhw-open-rays.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC3WBooleanForwardExitDepth({input,revision,selectedRayEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    selectedRayEvidence?.schema!=='draftai-c3-boolean-VHW-open-rays/1'||
    selectedRayEvidence.revision!==revision||
    selectedRayEvidence.officialLineStylesVerified!==false||
    selectedRayEvidence.finalV5CurveAuthorized!==false)
  throw new TypeError('current unsigned finite C3 selected Boolean W-ray evidence required');
 const op=selectedRayEvidence.solidOperation;
 const blocked=reason=>freeze({
  schema:'draftai-c3-w-Boolean-first-exit-depth/1',revision,
  solidOperation:op,status:'not-covered',reason,sourceOpenCells:[],
  provedOpaqueExitCellCount:0,provedClearForwardCellCount:0,
  unresolvedCapOrNumericalCellCount:0,allWSourceOpenCellsAccountedFor:false,
  allSourceForwardVolumeSegmentsProven:false,
  allProjectedFeatureDepthAndContactVisibilityProven:false,
  closedEndpointVisibilityProven:false,engineeringLineStylesVerified:false,
  officialV5Authorized:false});
 if(selectedRayEvidence.fullSourceOpenEdgeRayCoverageVerified!==true){
  if(selectedRayEvidence.intervals?.length)
   throw new RangeError('incomplete selected Boolean source rays cannot certify full W exit');
  return blocked('not all current selected finite solid open rays available');
 }
 if(!['union','intersection'].includes(op)||
    selectedRayEvidence.undeterminedCount!==0||
    !Array.isArray(selectedRayEvidence.intervals))
  throw new RangeError('explicit full selected C3 Boolean source volume ray theorem required');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.geometryVerifiedWithinSpecialistScope!==true||
    m3.verifiedCapClipping!==true||
    m3.analyticallyCompleteWithinScope!==true||
    m3.officialLineStylesVerified!==false)
  return blocked('fully cap-clipped signed M3 branches required');
 const dir=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(dir.x!==1||dir.y!==0||dir.z!==0)
  throw new RangeError('first-angle observer W +x direction changed');
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
 const source=new Map(m3.branches.map(x=>[x.id,x]));
 if(source.size!==m3.branches.length||source.size===0||source.size>128)
  throw new RangeError('nonunique finite reviewed M3 lateral source inventory');
 const W=selectedRayEvidence.intervals.filter(x=>
  x.view==='W'&&x.sourceKind==='analytic-curve');
 if(W.length===0||W.length>source.size*3)
  throw new RangeError('missing bounded selected Boolean real W analytic curves');
 if(W.some(row=>!source.has(row.sourceId)||
    row.parameterKind!=='x'||!Array.isArray(row.openParameterRange)||
    row.openParameterRange.length!==2||
    !row.openParameterRange.every(Number.isFinite)||
    row.openParameterRange[1]<=row.openParameterRange[0]||
    row.sourceFirstAngleRayEntireIntervalProven!==true||
    row.standardLineStyle!=='undetermined'||
    row.finalV5StrokeAuthorized!==false||
    ![-1,1].includes(row.zCylinderOutwardRaySign)||
    ![-1,1].includes(row.yCylinderOutwardRaySign)))
  throw new RangeError('C3 W current original M3 Boolean source ray identity incomplete');
 const rows=[];
 for(const b of m3.branches){
  if(!b.finiteDomainVerified||
     ![-1,1].includes(b.signY)||![-1,1].includes(b.signZ))
   throw new RangeError('C3 source signed radical and finite axial domain not verified');
  const expected=partitionC3WDirectionalOpenIntervals(
   b.xRange,Z.xCenter,Y.xCenter);
  const actual=W.filter(x=>x.sourceId===b.id)
   .sort((a,c)=>a.openParameterRange[0]-c.openParameterRange[0]);
  if(expected.length!==actual.length)
   throw new RangeError('C3 W radial events have missing original M3 source open cells');
  for(let i=0;i<expected.length;i++){
   const cell=expected[i],old=actual[i],[lo,hi]=cell.xOpenRange;
   if(old.openParameterRange[0]!==lo||old.openParameterRange[1]!==hi||
      old.zCylinderOutwardRaySign!==cell.zCylinderOutwardRaySign||
      old.yCylinderOutwardRaySign!==cell.yCylinderOutwardRaySign)
    throw new RangeError('C3 current selected W open cells conflict with exact M3 radial event partition');
   // Monotonicity: between successive X-center events, each signed
   // radical has no stationary point in its OPEN x domain. Therefore
   // cap inclusion at both closed x endpoints means STRICT axial cap
   // interior at EVERY point of the open interval (even when a limit
   // touches a cap at one endpoint). We never infer this from midpoint.
   const rad=(R,c,x)=>{
    const a=R-Math.abs(x-c),z=R+Math.abs(x-c);
    return a<0?null:Math.sqrt(a*z);
   };
   const point=x=>{
    const ry=rad(Z.radius,Z.xCenter,x),
     rz=rad(Y.radius,Y.xCenter,x);
    return ry===null||rz===null?null:{
     x,y:Z.yCenter+b.signY*ry,z:Y.zCenter+b.signZ*rz};
   };
   const p=point(lo),q=point(hi);
   const boundsValid=!!(p&&q&&
    [p.y,p.z,q.y,q.z].every(Number.isFinite));
   const finiteAxialInterior=
    boundsValid&&[p,q].every(x=>
     x.z>=Z.zMin&&x.z<=Z.zMax&&
     x.y>=Y.yMin&&x.y<=Y.yMax);
   const zInward=cell.zCylinderOutwardRaySign===-1;
   const yInward=cell.yCylinderOutwardRaySign===-1;
   const opaque=op==='union'?(zInward||yInward):
    (zInward&&yInward);
   const expectedStatus=opaque?
    'opaque-interior-ahead':'strict-interior-ray-clear';
   if(old.openInteriorVolumeRayStatus!==expectedStatus)
    throw new RangeError('selected Boolean forward ray contradicts independent finite radial quadratic');
   const winner=opaque?(op==='union'?
    (Z.xCenter>=Y.xCenter?'zCylinder':'yCylinder'):
    (Z.xCenter<=Y.xCenter?'zCylinder':'yCylinder')):null;
   const exitCenter=winner==='zCylinder'?Z.xCenter:
    winner==='yCylinder'?Y.xCenter:null;
   // At a shared X center both true source surfaces are the far exit
   // boundary simultaneously. Never fabricate a UNIQUE 3D source owner.
   const sharedExit=opaque&&Z.xCenter===Y.xCenter;
   const exitSourceIds=opaque?(sharedExit?
    ['zCylinder','yCylinder']:[winner]):[];
   // Genuine source-cap proof is more than a Boolean from old M5.
   // Require exact original source endpoint limits in BOTH finite cap
   // domains. An unverified near-cap rounding is held UNSIGNED.
   let exitRange=null;
   if(opaque&&finiteAxialInterior){
    const first=2*exitCenter-hi,last=2*exitCenter-lo;
    if([first,last].every(Number.isFinite)&&
       last>first&&exitCenter>=hi)
     exitRange=[first,last];
   }
   const certified=finiteAxialInterior&&(!opaque||exitRange!==null);
   const status=!certified?'undetermined-source-cap-or-binary64-exit':
    opaque?'certified-entire-W-open-ray-opaque-first-exit':
    'certified-entire-W-open-ray-clear';
   rows.push({sourceM3BranchId:b.id,revision,view:'W',
    originalSourceXOpenRange:[lo,hi],
    original3DLimitFrom:p,original3DLimitTo:q,
    sourceFiniteAxialCapsStrictInOpenCellVerified:finiteAxialInterior,
    actualWFirstAngleObserverDirection:{...dir},
    zCylinderForwardRadialSign:cell.zCylinderOutwardRaySign,
    yCylinderForwardRadialSign:cell.yCylinderOutwardRaySign,
    selectedSolidOperation:op,
    strictForwardVolumeRayStatus:status,
    continuousForwardRayAnalyticIdentity:'t*(t+2*(x-Xcenter))',
    sourceFirstExitCylinder:sharedExit?null:winner,
    sourceFirstExitSourceIds:exitSourceIds,
    sourceFirstExitPhysicalSourceUnique:!!(opaque&&!sharedExit),
    simultaneousFiniteCylinderExitSourcesVerified:sharedExit,
    sourceFirstExitXAffine:exitRange?{
     slope:-1,twiceXCenter:2*exitCenter,
     firstExitXDomain:[...exitRange],
     strictForwardDepthPositiveForEveryXInOpenCell:true,
     unionUsesLargestFiniteCylinderFarExit:op==='union',
     intersectionUsesSmallestFiniteCylinderFarExit:op==='intersection'
    }:null,
    fullOpenSourceRayForwardVolumeCertified:certified,
    closedSourceEndpointsAndCapContactsCertified:false,
    allOtherProjectedSourceContourDepthCertified:false,
    officialLineStyle:'undetermined',v5ActionAuthorized:false});
  }
 }
 const unresolved=rows.filter(x=>!x.fullOpenSourceRayForwardVolumeCertified).length;
 return freeze({schema:'draftai-c3-w-Boolean-first-exit-depth/1',
  revision,solidOperation:op,
  status:unresolved===0?'scoped-all-W-lateral-source-open-ray-first-exits':
   'scoped-partial-W-lateral-source-open-ray-first-exits',
  sourceOpenCells:rows,originalM3AnalyticSourceBranchCount:m3.branches.length,
  provedOpaqueExitCellCount:rows.filter(x=>
   x.strictForwardVolumeRayStatus==='certified-entire-W-open-ray-opaque-first-exit').length,
  provedClearForwardCellCount:rows.filter(x=>
   x.strictForwardVolumeRayStatus==='certified-entire-W-open-ray-clear').length,
  unresolvedCapOrNumericalCellCount:unresolved,
  allWSourceOpenCellsAccountedFor:rows.length===W.length,
  allSourceForwardVolumeSegmentsProven:unresolved===0,
  allProjectedFeatureDepthAndContactVisibilityProven:false,
  closedEndpointVisibilityProven:false,engineeringLineStylesVerified:false,
  officialV5Authorized:false});
}
module.exports={auditC3WBooleanForwardExitDepth};
