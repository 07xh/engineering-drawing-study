'use strict';
/**
 * Positive C3 M4/M5 W-depth theorem for COINCIDENT cylinder X centers.
 *
 * On a signed lateral/lateral M3 branch, y(x) and z(x) are signed square
 * roots of (R^2-(x-c)^2). At the same x center c for BOTH finite cylinders,
 * every source point at c-d has EXACTLY the same W=(y,z) paper image as
 * the point at c+d for the same signed radical branch, where d>0.
 * For the first-angle W observer +x, c+d is strictly IN FRONT of c-d.
 *
 * Match all left and right FULL OPEN M3 parameter domains by exact
 * reflection; verify independent selected Boolean rays say back=opaque,
 * front=clear on every mirrored open cell. No midpoint pixel sampling or
 * tolerance-based loss of short, strictly positive spans.
 *
 * This proves only same-analytic-source W mirror depth, NOT cap silhouettes,
 * other unrelated projected features, closed junctions, the full solid
 * boundary, engineering line styles, or a signed V5 curve.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS,project}=
 require('../core/projection/conventions.js');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))freeze(x);Object.freeze(o);
}return o;};
function auditC3WExactMirrorDepthOrder({input,revision,selectedRayEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    selectedRayEvidence?.schema!=='draftai-c3-boolean-VHW-open-rays/1'||
    selectedRayEvidence.revision!==revision||
    selectedRayEvidence.officialLineStylesVerified!==false||
    selectedRayEvidence.finalV5CurveAuthorized!==false)
  throw new TypeError('current unsigned C3 Boolean M5 source rays required');
 const op=selectedRayEvidence.solidOperation;
 const blocked=reason=>freeze({schema:'draftai-c3-W-mirror-depth-order/1',
  revision,solidOperation:op,status:'not-covered',reason,
  mirroredOpenDepthCells:[],verifiedMirroredOpenDepthCellCount:0,
  allSignedM3LateralSourceMirrorsAccountedFor:false,
  sameSignedLateralSourceWDepthOrderProven:false,
  otherProjectedFeatureDepthResolved:false,
  closedCenterAndCurveEndpointVisibilityProven:false,
  standardEngineeringLineStylesVerified:false,officialV5Authorized:false});
 if(selectedRayEvidence.fullSourceOpenEdgeRayCoverageVerified!==true){
  if(selectedRayEvidence.intervals?.length)
   throw new RangeError('C3 incomplete Boolean M5 rays must be unsigned and empty');
  return blocked('explicit Boolean solid and all source open rays required');
 }
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.verifiedCapClipping!==true||m3.analyticallyCompleteWithinScope!==true||
    m3.officialLineStylesVerified!==false)
  return blocked('finite signed M3 source has no full cap-clipped branches');
 const {zCylinder:Z,yCylinder:Y}=m3.source;
 if(Z.xCenter!==Y.xCenter)
  return blocked('W mirrored source projection requires EXACT shared cylinder X center');
 const dir=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(dir.x!==1||dir.y!==0||dir.z!==0||
    JSON.stringify(project({x:1,y:2,z:3}).W)!==
     JSON.stringify({u:2,v:3}))
  throw new RangeError('C3 first-angle W paper and observer convention changed');
 if(!['intersection','union'].includes(op)||
    !Array.isArray(selectedRayEvidence.intervals)||
    selectedRayEvidence.undeterminedCount!==0)
  throw new RangeError('complete selected current C3 union/intersection rays required');
 const center=Z.xCenter;
 const W=selectedRayEvidence.intervals.filter(row=>
  row.view==='W'&&row.sourceKind==='analytic-curve');
 if(m3.branches.length>128||W.length>768)
  throw new RangeError('unbounded C3 mirror source and M5 ray intervals');
 const bySign=new Map(),sourceIds=new Set();
 for(const b of m3.branches){
  if(typeof b.id!=='string'||sourceIds.has(b.id)||
     b.finiteDomainVerified!==true||
     ![-1,1].includes(b.signY)||![-1,1].includes(b.signZ)||
     !Array.isArray(b.xRange)||b.xRange.length!==2||
     !b.xRange.every(Number.isFinite)||!(b.xRange[1]>b.xRange[0]))
   throw new RangeError('C3 W mirrored source must use real positive signed M3 branches');
  sourceIds.add(b.id);
  const sign=b.signY+'|'+b.signZ;
  if(!bySign.has(sign))bySign.set(sign,{left:[],right:[]});
  const target=bySign.get(sign),[lo,hi]=b.xRange;
  if(lo<center){
   const upper=Math.min(hi,center);
   // Mirror the OPEN source interval at the exact shared X center.
   const a=2*center-upper,z=2*center-lo;
   if(!(z>a)&&upper>lo)return blocked('binary64 mirror endpoints collapsed');
   target.left.push({a,z,branchId:b.id,originalOpenRange:[lo,upper]});
  }
  if(hi>center){
   const lower=Math.max(lo,center);
   target.right.push({a:lower,z:hi,branchId:b.id,
    originalOpenRange:[lower,hi]});
  }
 }
 if(W.some(row=>!sourceIds.has(row.sourceId)||
    row.parameterKind!=='x'||row.sourceFirstAngleRayEntireIntervalProven!==true||
    row.standardLineStyle!=='undetermined'||
    row.finalV5StrokeAuthorized!==false||
    !Array.isArray(row.openParameterRange)||
    row.openParameterRange.length!==2||
    !row.openParameterRange.every(Number.isFinite)||
    row.openParameterRange[1]<=row.openParameterRange[0]))
  throw new RangeError('C3 W mirrored ray uses an unknown or unsigned M5 source');
 const selectedStatus=(branchId,range,expected)=>{
  const matches=W.filter(row=>row.sourceId===branchId&&
   row.openParameterRange[0]<=range[0]&&
   row.openParameterRange[1]>=range[1]);
  if(matches.length!==1||
     matches[0].openInteriorVolumeRayStatus!==expected)
   throw new RangeError('C3 W mirror depth contradicts independent Boolean source ray');
  return matches[0];
 };
 const rows=[];
 for(const [sign,parts] of bySign){
  if(!parts.left.length||!parts.right.length)
   return blocked('signed finite M3 source missing one W mirror flank');
  const cuts=[...new Set([
   ...parts.left.flatMap(x=>[x.a,x.z]),
   ...parts.right.flatMap(x=>[x.a,x.z])
  ])].sort((a,b)=>a-b);
  if(cuts.length>512)return blocked('too many W mirror source interval boundaries');
  for(let i=1;i<cuts.length;i++){
   const a=cuts[i-1],z=cuts[i];
   if(!(z>a))return blocked('zero or nonfinite W mirror cell');
   const left=parts.left.filter(x=>x.a<=a&&x.z>=z);
   const right=parts.right.filter(x=>x.a<=a&&x.z>=z);
   if(left.length!==1||right.length!==1)
    return blocked('full reflected M3 lateral source interval pairing absent');
   const from=[2*center-z,2*center-a],to=[a,z];
   if(!(from[1]>from[0]&&to[1]>to[0]&&a>=center))
    return blocked('binary64 reflected source pair lost open positive depth');
   const behind=selectedStatus(left[0].branchId,from,'opaque-interior-ahead');
   const ahead=selectedStatus(right[0].branchId,to,'strict-interior-ray-clear');
   if(behind.zCylinderOutwardRaySign!==-1||
      behind.yCylinderOutwardRaySign!==-1||
      ahead.zCylinderOutwardRaySign!==1||
      ahead.yCylinderOutwardRaySign!==1)
    throw new RangeError('real C3 M5 W mirror left/right radial gradient signs conflict');
   rows.push({signedRadicalPair:sign,
    rearM3BranchId:left[0].branchId,frontM3BranchId:right[0].branchId,
    rearOriginalXOpenRange:from,frontOriginalXOpenRange:to,
    commonFirstAngleProjectedWCurveProof:
     'same signed y/z circle radicals, x=c-d and x=c+d',
    front3DDepthStrictlyGreaterThroughoutOpenCell:true,
    distinctRearAndFront3DPointsShareExactAnalyticWProjection:true,
    rearSelectedBooleanInteriorAheadProven:true,
    frontSelectedBooleanNoInteriorAheadProven:true,
    closedCenterAndSourceJunctionDepthProven:false,
    unrelatedSourceCapAndOutlineDepthProven:false,
    officialLineStyle:'undetermined',v5ActionAuthorized:false});
  }
 }
 if(!rows.length||rows.length>512)
  return blocked('no positive matched M3 W mirror source open cells');
 return freeze({schema:'draftai-c3-W-mirror-depth-order/1',
  revision,solidOperation:op,
  status:'scoped-exact-signed-W-lateral-mirror-depth',
  mirroredOpenDepthCells:rows,verifiedMirroredOpenDepthCellCount:rows.length,
  allSignedM3LateralSourceMirrorsAccountedFor:true,
  sameSignedLateralSourceWDepthOrderProven:true,
  exactSharedXCenter:center,
  firstAngleWObserverPositiveXVerified:true,
  closedCenterAndCurveEndpointVisibilityProven:false,
  otherProjectedFeatureDepthResolved:false,
  standardEngineeringLineStylesVerified:false,officialV5Authorized:false});
}
module.exports={auditC3WExactMirrorDepthOrder};
