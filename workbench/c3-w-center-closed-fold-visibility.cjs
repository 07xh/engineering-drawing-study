'use strict';
/**
 * C3/M5 exact CLOSED INTERNAL W-center fold for the shared-X-axis family.
 *
 * On the original signed lateral/lateral M3 branch at x=c:
 *   p=(c, Yz+sy*Rz, Zy+sz*Ry).
 * Both source-cylinder surface gradients have rank 2 because Rz,Ry>0.
 * The true 3D curve has derivative (1,0,0), while its W=(y,z)
 * projection has zero first derivative and SECOND derivatives
 * (-sy/Rz,-sz/Ry), never both zero. This is a regular 3D curve with
 * a projected quadratic fold, NOT a new 3D junction.
 *
 * Along W observer +X for every t>0, the exact squared radial excess
 * relative to BOTH finite cylinders is t^2>0. Thus the CLOSED CENTER
 * point is globally frontmost against the ENTIRE union/intersection solid.
 *
 * Recompute current genuine M3, match independently enumerated native
 * Boolean W critical source point rays, and require the two incident
 * OPEN M3 source curve intervals on both sides from the independently
 * global-solid-qualified source-cell ledger. A point is never extended
 * to closed terminal/cap contact or an official V5 drawing stroke.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS,project}=
 require('../core/projection/conventions.js');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
function auditC3WCenterClosedFoldVisibility({
 input,revision,criticalPointEvidence,globalSourceCurveDepth
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    criticalPointEvidence?.schema!=='draftai-c3-Boolean-W-critical-point-rays/1'||
    globalSourceCurveDepth?.schema!=='draftai-c3-W-global-selected-solid-source-curve-depth/1'||
    criticalPointEvidence.revision!==revision||
    globalSourceCurveDepth.revision!==revision||
    criticalPointEvidence.solidOperation!==globalSourceCurveDepth.solidOperation||
    criticalPointEvidence.finalV5Authorized!==false||
    globalSourceCurveDepth.officialV5Authorized!==false||
    criticalPointEvidence.officialEngineeringLineStylesVerified!==false||
    globalSourceCurveDepth.standardEngineeringLineStylesVerified!==false)
  throw new TypeError('same-revision unsigned W critical points and complete finite solid source depth required');
 const op=globalSourceCurveDepth.solidOperation;
 const blocked=reason=>freeze({
  schema:'draftai-c3-W-closed-internal-center-fold/1',
  revision,solidOperation:op,status:'not-covered',reason,
  closedInternalCenterPoints:[],closedInternalCenterCount:0,
  globallyFrontmostCenterPointCount:0,
  allCurrentInternalSignedSourceCenterFoldsCertified:false,
  allCurrentWInternalCenterRaysAccountedFor:false,
  originalCurveTerminalAndCapContactVisibilityCertified:false,
  completeDrawingWLineStyleSigned:false,finalV5Authorized:false
 });
 if(!['intersection','union'].includes(op)||
    globalSourceCurveDepth.allOriginalM3WSourceCurveAtomsGloballyDepthProven!==true||
    criticalPointEvidence.everyCurrentAnalyticWRootEnumerated!==true||
    criticalPointEvidence.allCriticalPointRaysCertified!==true)
  return blocked('no complete original signed source curve and native closed point rays');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.verifiedCapClipping!==true||
    m3.analyticallyCompleteWithinScope!==true||
    m3.officialLineStylesVerified!==false)
  return blocked('reviewed finite analytic M3 source missing');
 const {zCylinder:Z,yCylinder:Y}=m3.source,c=Z.xCenter;
 if(c!==Y.xCenter)return blocked('requires exactly coincident X centers');
 const W=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(W.x!==1||W.y!==0||W.z!==0||
    project({x:5,y:6,z:7}).W.u!==6||
    project({x:5,y:6,z:7}).W.v!==7)
  throw new RangeError('first-angle W observer or paper projection changed');
 const expected=m3.branches.filter(branch=>
  branch.xRange[0]<c&&c<branch.xRange[1]);
 if(expected.length===0)
  return blocked('all real internal center source points were clipped by finite caps');
 const points=criticalPointEvidence.pointRays;
 const solid=globalSourceCurveDepth.provedWSourceCurveOpenCells;
 if(!Array.isArray(points)||points.length>512||
    !Array.isArray(solid)||solid.length>2048||
    expected.length>128)
  throw new RangeError('bounded genuine W source center critical points required');
 const results=[];
 for(const branch of expected){
  if(![-1,1].includes(branch.signY)||
     ![-1,1].includes(branch.signZ)||
     branch.finiteDomainVerified!==true||
     branch.officialLineStyle!=='undetermined'||
     !(Z.radius>0&&Y.radius>0))
   throw new RangeError('invalid source regular signed branch at closed W center');
  const point={x:c,
   y:Z.yCenter+branch.signY*Z.radius,
   z:Y.zCenter+branch.signZ*Y.radius};
  const axialStrict=point.z>Z.zMin&&point.z<Z.zMax&&
   point.y>Y.yMin&&point.y<Y.yMax;
  if(!axialStrict)return blocked('center point on finite cap cannot inherit strict open-cell continuity');
  const witness=points.filter(x=>x.branchId===branch.id&&x.x===c);
  if(witness.length!==1)
   throw new RangeError('every real internal W-center source requires exactly one native point ray');
  const rec=witness[0];
  if(rec.sourceCenterSwitches?.length!==2||
     !rec.sourceCenterSwitches.includes('zCylinder')||
     !rec.sourceCenterSwitches.includes('yCylinder')||
     rec.strictPointwiseFiniteBooleanRayStatus!==
      'certified-Boolean-no-strict-volume-ahead'||
     rec.pointRayNoStrictInteriorProved!==true||
     rec.current3DSourcePointVerified!==true||
     rec.nativePositiveInteriorSourceIds?.length!==0||
     !rec.point3D||
     ['x','y','z'].some(k=>rec.point3D[k]!==point[k])||
     rec.engineeringLineStyle!=='undetermined'||
     rec.finalV5ActionAuthorized!==false)
   throw new RangeError('selected finite Boolean W center ray contradicts actual M3 closed source point');
  const left=solid.filter(row=>
   row.rearOriginal3DSourceBranchId===branch.id&&
   row.rearOriginalXOpenRange?.[1]===c);
  const right=solid.filter(row=>
   row.frontOriginal3DSourceBranchId===branch.id&&
   row.frontOriginalXOpenRange?.[0]===c);
  if(left.length!==1||right.length!==1||
     left[0].signedRadicalPair!==branch.signY+'|'+branch.signZ||
     right[0].signedRadicalPair!==branch.signY+'|'+branch.signZ||
     left[0].rearSelectedSolidOccludedOnEntireSourceOpenCell!==true||
     right[0].frontSourceIsGloballyFrontmostAmongALLSelectedFiniteSolidPoints!==true)
   throw new RangeError('C3 exact W center does not have both proven original M3 incident flanks');
  // The two ORIGINAL cylinder gradients at c are (0,sy*Rz,0)
  // and (0,0,sz*Ry); cross-product rank >0 since Rz*Ry>0.
  const product=Z.radius*Y.radius;
  if(!(product>0&&Number.isFinite(product)))
   return blocked('numeric source gradient rank cannot be represented');
  const second={u:-branch.signY/Z.radius,v:-branch.signZ/Y.radius};
  if(!Number.isFinite(second.u)||!Number.isFinite(second.v)||
     (second.u===0&&second.v===0))
   return blocked('projected W second derivative is not representable');
  results.push({
   originalM3SourceBranchId:branch.id,
   signedRadicalPair:branch.signY+'|'+branch.signZ,
   originalClosedSourceX:c,originalClosedPoint3D:point,
   originalClosedFirstAngleWPaper:project(point).W,
   strictFiniteCapInteriorAtCenter:true,
   leftRearM3SourceOpenRange:[...left[0].rearOriginalXOpenRange],
   rightFrontM3SourceOpenRange:[...right[0].frontOriginalXOpenRange],
   bothOriginal3DSourceHalfCurvesMeetAtSamePhysicalPoint:true,
   actual3DLateralGradientRankTwoAtCenter:true,
   original3DCurveRegularTangentAlongObserverX:true,
   projectedWFirstDerivative:{u:0,v:0},
   projectedWSecondDerivative:second,
   nondegenerateQuadraticWProjectedFoldAtCenter:true,
   positiveRayRadialDifferenceForBothCylinders:'t*t>0 for every t>0',
   globallyFrontmostClosedPointAgainstEntireFiniteSelectedSolid:true,
   originalCurveEndpointOrCapContactAuthorized:false,
   officialEngineeringLineStyle:'undetermined',v5ActionAuthorized:false
  });
 }
 if(results.length!==expected.length||
    points.length!==expected.length||
    new Set(results.map(x=>x.originalM3SourceBranchId)).size!==results.length)
  throw new RangeError('all genuine internal signed W centers must be accounted for exactly once');
 return freeze({
  schema:'draftai-c3-W-closed-internal-center-fold/1',
  revision,solidOperation:op,
  status:'scoped-complete-regular-3D-W-quadratic-fold-center-source-point-visibility',
  closedInternalCenterPoints:results,
  closedInternalCenterCount:results.length,
  globallyFrontmostCenterPointCount:results.length,
  allCurrentInternalSignedSourceCenterFoldsCertified:true,
  allCurrentWInternalCenterRaysAccountedFor:true,
  originalCurveTerminalAndCapContactVisibilityCertified:false,
  completeDrawingWLineStyleSigned:false,finalV5Authorized:false
 });
}
module.exports={auditC3WCenterClosedFoldVisibility};
