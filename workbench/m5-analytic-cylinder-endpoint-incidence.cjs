'use strict';
/**
 * M5: bounded 3D identity and signed-radical endpoint-incidence proof for
 * finite perpendicular-cylinder lateral/lateral analytic branches.
 *
 * Identical first-angle projected endpoints need not be the SAME 3D point.
 * Independently recompute M3, its implicit surface/cap residuals, and the
 * signed radical at every x extremum. Keep all cap/singular and all W/V/H
 * standard line style, global smoothness, continuity and V5 claims false.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const frozen=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))frozen(v);Object.freeze(x);
 }return x;};
const xyzDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const uvDist=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
function auditFiniteCylinderEndpointIncidence({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current finite-cylinder M3 revision required');
 const proof=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 const notCovered=status=>frozen({schema:'draftai-m5-cylinder-endpoint-incidence/1',
  revision,status:'not-covered',sourceStatus:status,
  endpoints:[],junctions:[],projectedCoincidences:[],
  verified3DJunctionCount:0,pairedSignedRadicalCount:0,
  distinct3DProjectedCoincidenceCount:0,
  fullBranchTopologyVerified:false,
  standardLineStylesVerified:false,v5CurveReady:false});
 if(proof.status!=='scoped-analytic-ready'||
    proof.analyticallyCompleteWithinScope!==true||
    proof.verifiedCapClipping!==true||proof.sourceConfirmed!==true||
    proof.officialLineStylesVerified!==false||proof.v5Ready!==false)
  return notCovered(proof.status);
 const Z=proof.source.zCylinder,Y=proof.source.yCylinder;
 const scale=Math.max(1,Z.radius,Y.radius,
  Math.abs(Z.xCenter),Math.abs(Y.xCenter));
 const tol=Math.max(1e-8,scale*1e-9);
 const scaledTol=1e-9;
 const endpoints=[];
 for(const b of proof.branches){
  if(b.finiteDomainVerified!==true||b.officialLineStyle!=='undetermined'||
     ![-1,1].includes(b.signY)||![-1,1].includes(b.signZ)||
     b.endpoints.length!==2)
   throw new TypeError('untrusted analytic source branch for M5 junctions');
  for(const [i,e] of b.endpoints.entries()){
   const p=e.point;
   if(!p||!['x','y','z'].every(k=>Number.isFinite(p[k])))
    throw new RangeError('nonfinite analytic junction endpoint');
   const ry=(Z.radius-Math.abs(p.x-Z.xCenter))*
     (Z.radius+Math.abs(p.x-Z.xCenter));
   const rz=(Y.radius-Math.abs(p.x-Y.xCenter))*
     (Y.radius+Math.abs(p.x-Y.xCenter));
   if(ry < -tol||rz < -tol)
    throw new RangeError('analytic endpoint outside radical supports');
   const expectedY=Z.yCenter+b.signY*Math.sqrt(Math.max(0,ry));
   const expectedZ=Y.zCenter+b.signZ*Math.sqrt(Math.max(0,rz));
   const resZ=((p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2-Z.radius**2)/
      Math.max(1,Z.radius**2,Y.radius**2);
   const resY=((p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2-Y.radius**2)/
      Math.max(1,Z.radius**2,Y.radius**2);
   if(Math.abs(p.y-expectedY)>tol||Math.abs(p.z-expectedZ)>tol||
      Math.abs(resZ)>scaledTol||Math.abs(resY)>scaledTol||
      p.y<Y.yMin-tol||p.y>Y.yMax+tol||
      p.z<Z.zMin-tol||p.z>Z.zMax+tol)
    throw new RangeError('analytic branch endpoint violates implicit cylinders or caps');
   const yRadicalCoalescence=Math.abs(ry)<=tol;
   const zRadicalCoalescence=Math.abs(rz)<=tol;
   const atCapY=Math.abs(p.y-Y.yMin)<=tol||Math.abs(p.y-Y.yMax)<=tol;
   const atCapZ=Math.abs(p.z-Z.zMin)<=tol||Math.abs(p.z-Z.zMax)<=tol;
   endpoints.push({id:'end'+endpoints.length,branchId:b.id,
    branchEndpointRole:i===0?'from':'to',
    xParameter:p.x,point3D:{...p},signY:b.signY,signZ:b.signZ,
    sourceRadicalCoalescence:{y:yRadicalCoalescence,z:zRadicalCoalescence},
    finiteCapEndpoint:{yCylinder:atCapY,zCylinder:atCapZ},
    projections:project(p),
    originalAnalyticEquationAndFiniteCapsVerified:true,
    completeCurveJunctionVerified:false,officialLineStyle:'undetermined'});
  }
 }
 if(endpoints.length>128)throw new RangeError('too many verified curve endpoints');
 const groups=[];
 for(const end of endpoints){
  let row=groups.find(g=>xyzDist(g.point3D,end.point3D)<=tol);
  if(!row){row={id:'junction'+groups.length,point3D:{...end.point3D},
    incident:[]};groups.push(row);}
  row.incident.push(end);
 }
 const junctions=groups.map(row=>{
  const incidents=row.incident;
  if(new Set(incidents.map(x=>x.branchId)).size!==incidents.length)
   throw new RangeError('degenerate duplicate branch junction endpoint');
  const verifiedSourcePoint=incidents.every(x=>xyzDist(x.point3D,row.point3D)<=tol);
  const pairs=[];
  for(let i=0;i<incidents.length;i++)for(let j=i+1;j<incidents.length;j++){
   const a=incidents[i],b=incidents[j];
   const diffY=a.signY!==b.signY,diffZ=a.signZ!==b.signZ;
   const expectedCoalescence=(!diffY||a.sourceRadicalCoalescence.y&&
    b.sourceRadicalCoalescence.y)&&(!diffZ||a.sourceRadicalCoalescence.z&&
    b.sourceRadicalCoalescence.z)&&(diffY||diffZ);
   const cap=a.finiteCapEndpoint.yCylinder||a.finiteCapEndpoint.zCylinder||
    b.finiteCapEndpoint.yCylinder||b.finiteCapEndpoint.zCylinder;
   pairs.push({branchIds:[a.branchId,b.branchId],
    sameExact3DAnalyticEndpoint:xyzDist(a.point3D,b.point3D)<=tol,
    signedRadicalEqualityVerified:expectedCoalescence,
    capEventAtJunction:cap,
    eligibleRadicalCoalescenceCandidate:expectedCoalescence&&!cap,
    globalSmoothBranchContinuationVerified:false});
  }
  // Implicit-function theorem for a REGULAR lateral/lateral radial
  // turn, independent of branch-name coincidence:
  // F=(x-Xz)^2+(y-Yz)^2-Rz², G=(x-Xy)^2+(z-Zy)^2-Ry².
  // If F has a signed-radical turn (y=Yz) and G has nonzero z
  // derivative, gradients are independent; local curve is C1 with
  // tangent along +y/-y. The dual case has tangent along z.
  // Both simultaneous radical turns, cap terminals, depth ties, and
  // third-branch coincidence remain UNSIGNED.
  const regularPair=incidents.length===2&&pairs.length===1?
   pairs[0]:null;
  const a=incidents[0],b=incidents[1];
  const yTurn=a?.sourceRadicalCoalescence.y===true&&
   b?.sourceRadicalCoalescence.y===true;
  const zTurn=a?.sourceRadicalCoalescence.z===true&&
   b?.sourceRadicalCoalescence.z===true;
  const cap=incidents.some(e=>
   e.finiteCapEndpoint.yCylinder||e.finiteCapEndpoint.zCylinder);
  const ry=(Z.radius-Math.abs(row.point3D.x-Z.xCenter))*
    (Z.radius+Math.abs(row.point3D.x-Z.xCenter));
  const rz=(Y.radius-Math.abs(row.point3D.x-Y.xCenter))*
    (Y.radius+Math.abs(row.point3D.x-Y.xCenter));
  const regularY=!!(regularPair?.eligibleRadicalCoalescenceCandidate&&
   !cap&&yTurn&&!zTurn&&a.signY!==b.signY&&a.signZ===b.signZ&&
   rz>tol*tol&&Math.abs(row.point3D.z-Y.zCenter)>tol);
  const regularZ=!!(regularPair?.eligibleRadicalCoalescenceCandidate&&
   !cap&&zTurn&&!yTurn&&a.signZ!==b.signZ&&a.signY===b.signY&&
   ry>tol*tol&&Math.abs(row.point3D.y-Z.yCenter)>tol);
  const regular=regularY||regularZ;
  const tangent=regularY?{x:0,y:1,z:0}:regularZ?{x:0,y:0,z:1}:null;
  const tangentProjection=tangent?Object.fromEntries(VIEWS.map(view=>{
   const o=project({x:0,y:0,z:0})[view],t=project(tangent)[view];
   const direction={u:t.u-o.u,v:t.v-o.v};
   return [view,{direction,
    tangentProjectionCollapsed:Math.hypot(direction.u,direction.v)<=1e-12,
    exactTangentSource:'independent-implicit-gradient-cross-product'}];
  })):null;
  const standalone=incidents.length===1;
  return {id:row.id,point3D:{...row.point3D},
   endpointIds:incidents.map(x=>x.id),
   incidentBranchIds:incidents.map(x=>x.branchId),
   physicalPointIdentityVerified:verifiedSourcePoint,
   pairedRadicalCandidates:pairs,
   finiteCapTermination:incidents.some(x=>
    x.finiteCapEndpoint.yCylinder||x.finiteCapEndpoint.zCylinder),
   classification:standalone?'single-branch-terminal':
    regular?'regular-implicit-C1-radical-join':
    pairs.some(x=>x.eligibleRadicalCoalescenceCandidate)?
    'analytic-signed-radical-coalescence-candidate':
    'multi-branch-topology-undetermined',
   regularLocalTangentVerified:regular,
   tangent3D:tangent,projectedTangentWitnesses:tangentProjection,
   implicitGradientRankTwoVerified:regular,
   localC1ContinuationWithinLateralLateralScopeVerified:regular,
   finiteCapAndOtherSheetContinuationVerified:false,
   completeSpatialCurveConnectivityVerified:false,
   projected3DVisibilityVerified:false,
   standardLineStylesVerified:false,v5CurveActionSignedOff:false};
 });
 const projectedCoincidences=[];
 for(const view of VIEWS){
  for(let i=0;i<junctions.length;i++)for(let j=i+1;j<junctions.length;j++){
   const a=junctions[i],b=junctions[j];
   const pa=project(a.point3D)[view],pb=project(b.point3D)[view];
   if(uvDist(pa,pb)>tol)continue;
   projectedCoincidences.push({view,
    junctionIds:[a.id,b.id],projectedModelMm:pa,
    distinct3DPhysicalPoints:xyzDist(a.point3D,b.point3D)>tol,
    mayInferPhysicalJoinFromPaperPoint:false,
    officialCurveJunctionApproved:false});
  }
 }
 return frozen({schema:'draftai-m5-cylinder-endpoint-incidence/1',
  revision,status:'scoped-analytic-3d-endpoint-incidence',
  sourceM3BranchCount:proof.branchCount,
  endpoints,junctions,projectedCoincidences,
  verified3DJunctionCount:junctions.filter(j=>
   j.physicalPointIdentityVerified).length,
  regularLocalC1JoinCount:junctions.filter(j=>
   j.localC1ContinuationWithinLateralLateralScopeVerified).length,
  unresolvedAnalyticJunctionCount:junctions.filter(j=>
   j.incidentBranchIds.length>1&&!j.regularLocalTangentVerified).length,
  pairedSignedRadicalCount:junctions.reduce((n,j)=>n+
   j.pairedRadicalCandidates.filter(p=>p.eligibleRadicalCoalescenceCandidate).length,0),
  distinct3DProjectedCoincidenceCount:projectedCoincidences.filter(p=>
   p.distinct3DPhysicalPoints).length,
  allSourceEndpointEquationsRecomputed:true,
  allEndpointFirstAngleProjectionsRecomputed:true,
  fullBranchTopologyVerified:false,
  completeStrokeEndpointsAndDepthVerified:false,
  standardLineStylesVerified:false,
  v5CurveReady:false});
}
module.exports={auditFiniteCylinderEndpointIncidence};
