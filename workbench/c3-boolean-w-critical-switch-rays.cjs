'use strict';
/**
 * C3 M5: join the EXISTING independent real finite-cylinder W critical-ray
 * theorem to the explicitly selected UNION / INTERSECTION source intervals.
 *
 * This audits only genuine INTERNAL x-center switches of the same M3 source
 * branch; endpoints, cap contacts, other projected-source depth aliases,
 * total solid outlines, GB strokes, and V5 remain strictly unsigned.
 * A zero outward radial derivative is NOT an inward ray: at x=xCenter
 * the exact radial difference is t^2>0 for every forward t>0.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditC3WCriticalRays}=require('./c3-w-critical-ray-theorem.cjs');
const {partitionC3WDirectionalOpenIntervals}=
 require('./c3-selected-boolean-vhw-open-rays.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC3BooleanWCriticalSwitchRays({
 input,revision,selectedRayEvidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    selectedRayEvidence?.schema!=='draftai-c3-boolean-VHW-open-rays/1'||
    selectedRayEvidence.revision!==revision||
    selectedRayEvidence.finalV5CurveAuthorized!==false||
    selectedRayEvidence.officialLineStylesVerified!==false)
  throw new TypeError('current unsigned C3 M5 Boolean ray proof required');
 const op=selectedRayEvidence.solidOperation;
 const blocked=()=>freeze({
  schema:'draftai-c3-Boolean-W-critical-point-rays/1',
  revision,solidOperation:op,status:'not-covered',
  internalSourceSwitchPointCount:0,certifiedPointRayCount:0,
  unresolvedPointRayCount:0,pointRays:[],
  everyCurrentAnalyticWRootEnumerated:false,
  allCriticalPointRaysCertified:false,
  closedSourceCurveEndpointAndCapContactVisibilityCertified:false,
  globalProjectedFeatureDepthAndOcclusionCertified:false,
  officialEngineeringLineStylesVerified:false,finalV5Authorized:false
 });
 if(selectedRayEvidence.fullSourceOpenEdgeRayCoverageVerified!==true){
  if(selectedRayEvidence.intervals?.length||
     selectedRayEvidence.fullSourceOpenEdgeRayCoverageVerified!==false)
   throw new RangeError('incomplete C3 Boolean open rays cannot seed critical points');
  return blocked();
 }
 if(!['intersection','union'].includes(op)||
    selectedRayEvidence.undeterminedCount!==0||
    !Array.isArray(selectedRayEvidence.intervals))
  throw new RangeError('explicit finite Boolean operation and complete unsigned rays required');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.officialLineStylesVerified!==false||
    m3.analyticallyCompleteWithinScope!==true)
  throw new RangeError('current reviewed finite M3 analytic source required');
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
 const sourceIds=new Set(m3.branches.map(b=>b.id));
 const W=selectedRayEvidence.intervals.filter(row=>
  row.view==='W'&&row.sourceKind==='analytic-curve');
 if(W.some(row=>!sourceIds.has(row.sourceId)||row.parameterKind!=='x'||
    row.sourceFirstAngleRayEntireIntervalProven!==true||
    row.standardLineStyle!=='undetermined'||
    row.finalV5StrokeAuthorized!==false))
  throw new RangeError('C3 W critical predecessor rays have stale M3 source identities');
 const requests=[],neighbors=new Map();
 for(const b of m3.branches){
  if(b.finiteDomainVerified!==true||
     ![-1,1].includes(b.signY)||![-1,1].includes(b.signZ))
   throw new RangeError('unreviewed C3 signed-radical source branch');
  const expected=partitionC3WDirectionalOpenIntervals(
   b.xRange,Z.xCenter,Y.xCenter);
  const actual=W.filter(row=>row.sourceId===b.id)
   .sort((a,c)=>a.openParameterRange[0]-c.openParameterRange[0]);
  if(actual.length!==expected.length)
   throw new RangeError('C3 W center switch partition omitted genuine source cells');
  const status=(z,y)=>(op==='intersection'?
   (z<0&&y<0):(z<0||y<0))?
   'opaque-interior-ahead':'strict-interior-ray-clear';
  for(let i=0;i<expected.length;i++){
   const ex=expected[i],ac=actual[i];
   if(!Array.isArray(ac.openParameterRange)||
      ac.openParameterRange.length!==2||
      ac.openParameterRange[0]!==ex.xOpenRange[0]||
      ac.openParameterRange[1]!==ex.xOpenRange[1]||
      ac.zCylinderOutwardRaySign!==ex.zCylinderOutwardRaySign||
      ac.yCylinderOutwardRaySign!==ex.yCylinderOutwardRaySign||
      ac.openInteriorVolumeRayStatus!==
       status(ex.zCylinderOutwardRaySign,ex.yCylinderOutwardRaySign))
    throw new RangeError('C3 real W adjacent open rays contradict current radial-root signs');
  }
  const centers=[...new Set([Z.xCenter,Y.xCenter])]
   .filter(x=>x>b.xRange[0]&&x<b.xRange[1]).sort((a,c)=>a-c);
  for(const x of centers){
   const left=actual.filter(row=>row.openParameterRange[1]===x);
   const right=actual.filter(row=>row.openParameterRange[0]===x);
   if(left.length!==1||right.length!==1)
    throw new RangeError('C3 W source radial switch lacks both real positive open flanks');
   requests.push({branchId:b.id,x});
   neighbors.set(b.id+'|'+x,{
    leftOpenRayStatus:left[0].openInteriorVolumeRayStatus,
    rightOpenRayStatus:right[0].openInteriorVolumeRayStatus});
  }
 }
 if(requests.length>512)
  throw new RangeError('C3 W radial critical root budget exceeded');
 const native=auditC3WCriticalRays({input,revision,criticalPoints:requests});
 if(native.status!=='scoped-analytic-critical-W-point-evidence'||
    native.revision!==revision||native.points.length!==requests.length||
    native.standardLineStylesVerified!==false||native.v5Authorized!==false)
  throw new RangeError('independent C3 real source W critical-ray theorem unavailable');
 const pointRays=native.points.map((ray,index)=>{
  const request=requests[index];
  if(ray.branchId!==request.branchId||ray.x!==request.x||
     ray.standardLineStyle!=='undetermined'||ray.v5ActionAuthorized!==false||
     !Array.isArray(ray.positiveOpaqueInteriorIntervals))
   throw new RangeError('C3 current W radial source critical point or native identity mismatch');
  const active=new Set(ray.positiveOpaqueInteriorIntervals.map(x=>x.solid));
  if([...active].some(id=>!['zCylinder','yCylinder'].includes(id)))
   throw new RangeError('unknown true 3D cylinder in W critical ray evidence');
  const opaque=op==='union'?active.size>0:
   active.has('zCylinder')&&active.has('yCylinder');
  // INTERSECTION has no strict interior if one cylinder is exterior for
  // every positive t. At an x-center it is radially tangent and exterior.
  const clear=op==='union'?
   ray.radialExteriorForEveryPositiveRayParameterVerified===true:
   request.x>=Z.xCenter||request.x>=Y.xCenter;
  const certified=ray.currentM3SourceBranchVerified===true&&
   ray.finiteAxialCapsInclusiveVerified===true;
  if(opaque&&clear)
   throw new RangeError('C3 W opaque/exterior native source ray contradiction');
  const status=!certified?'undetermined-source-point-or-cap':
   opaque?'certified-Boolean-strict-volume-ahead':
   clear?'certified-Boolean-no-strict-volume-ahead':
   'undetermined-near-finite-cap-boundary';
  const sides=neighbors.get(request.branchId+'|'+request.x);
  if(!sides)throw new RangeError('missing current W source switch flanks');
  return {branchId:request.branchId,view:'W',revision,x:request.x,
   point3D:ray.point3D,
   leftOpenRayStatus:sides.leftOpenRayStatus,
   rightOpenRayStatus:sides.rightOpenRayStatus,
   sourceCenterSwitches:Object.freeze(
    [...(request.x===Z.xCenter?['zCylinder']:[]),
     ...(request.x===Y.xCenter?['yCylinder']:[])]),
   nativePositiveInteriorSourceIds:[...active].sort(),
   current3DSourcePointVerified:certified,
   strictPointwiseFiniteBooleanRayStatus:status,
   pointRayStrictInteriorProved:status==='certified-Boolean-strict-volume-ahead',
   pointRayNoStrictInteriorProved:status==='certified-Boolean-no-strict-volume-ahead',
   nativeRadialIdentity:'t*(t+2*(x-xCenter))',
   closedFeatureEndpointAndFullOcclusionVerified:false,
   projectedFeatureDepthOverlapResolved:false,
   engineeringLineStyle:'undetermined',finalV5ActionAuthorized:false};
 });
 const certified=pointRays.filter(x=>x.pointRayStrictInteriorProved||
  x.pointRayNoStrictInteriorProved).length;
 return freeze({
  schema:'draftai-c3-Boolean-W-critical-point-rays/1',
  revision,solidOperation:op,
  status:certified===pointRays.length?
   'scoped-all-internal-W-center-point-rays-classified':
   'scoped-partial-internal-W-center-point-rays',
  internalSourceSwitchPointCount:pointRays.length,
  certifiedPointRayCount:certified,
  unresolvedPointRayCount:pointRays.length-certified,
  pointRays,everyCurrentAnalyticWRootEnumerated:true,
  allCriticalPointRaysCertified:certified===pointRays.length,
  closedSourceCurveEndpointAndCapContactVisibilityCertified:false,
  globalProjectedFeatureDepthAndOcclusionCertified:false,
  officialEngineeringLineStylesVerified:false,finalV5Authorized:false
 });
}
module.exports={auditC3BooleanWCriticalSwitchRays};
