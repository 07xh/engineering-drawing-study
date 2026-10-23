'use strict';
/**
 * 04 M3 -> versioned 3D semantic Intent -> existing 03 V/H/W projection.
 * This does NOT create a second solver, retype the frozen 2D Intent, turn
 * samples into mathematical proof, or assert hidden lines/V5 readiness.
 */
const {conePlaneFullEllipse,conePlaneClippedEllipseBoundary}=
 require('../engines/spatial/sections/finite-cone-plane.cjs');
const {project,toSheet,fromSheet}=require('../core/projection/conventions.js');
const {SPATIAL_INTENT_VERSION:VERSION,validateSpatialConstructionIntent}=
 require('../core/contracts/spatial-construction-intent.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const xyz=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const point=p=>({x:p.x,y:p.y,z:p.z});
const uv=p=>({u:p.u,v:p.v});
const blocked=(revision,reason,solverStatus='undetermined')=>({
 status:'not-verified',revision,reason,solverStatus,
 spatialIntent:null,projectionSamples:null,sheetViews:null,
 mathematicallyVerified:false,firstAngleCoordinateMappingVerified:false,
 firstAngleLayoutVerified:false,v5StepsReady:false
});
function verifiedConeSpatialIntent(cone,plane,{
 kind='full-ellipse',revision=0,sourceConfirmed=false,
 sheetTransform,samples=64}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('nonnegative source revision required');
 if(!['full-ellipse','clipped-ellipse'].includes(kind))
  throw new TypeError('unsupported cone section kind');
 if(sourceConfirmed!==true)
  return blocked(revision,'cone and section plane require reviewed inputs');
 if(!sheetTransform||!sheetTransform.origin||
    !finite(sheetTransform.origin.x)||!finite(sheetTransform.origin.y)||
    !finite(sheetTransform.scale)||sheetTransform.scale<=0)
  throw new TypeError('explicit positive first-angle sheet transformation required');
 const solved=kind==='full-ellipse'
  ?conePlaneFullEllipse(cone,plane,{samples})
  :conePlaneClippedEllipseBoundary(cone,plane,{samplesPerArc:samples});
 if(solved.status!=='ready'||solved.verified!==true||
    !solved.curve?.analyticCurveVerified||
    !Array.isArray(solved.points)||solved.points.length!==samples+1||
    solved.v5StepsReady!==false||solved.visibilityVerified!==false||
    solved.sectionInteriorVerified!==false||
    solved.firstAngleLayoutVerified!==false||
    (kind==='full-ellipse'&&solved.completeLateralIntersection!==true)||
    (kind==='clipped-ellipse'&&
     (solved.boundaryVerified!==true||
      solved.solidSectionPerimeterVerified!==true||
      solved.capChord?.capInteriorVerified!==true)))
  return blocked(revision,solved.reason||'analytically verified cone section unavailable',
   solved.status);
 const apex={x:cone.baseCenter.x,y:cone.baseCenter.y,
  z:cone.baseCenter.z+cone.heightMm};
 const worldScale=Math.max(1,...[...Object.values(apex),...Object.values(plane.point)]
  .map(Math.abs));
 const eps=Math.max(1e-9*Math.max(cone.radiusMm,cone.heightMm),
  64*Number.EPSILON*worldScale);
 const nNorm=Math.hypot(plane.normal.x,plane.normal.y,plane.normal.z);
 const planeDistance=q=>Math.abs(
  (q.x-plane.point.x)*plane.normal.x+
  (q.y-plane.point.y)*plane.normal.y+
  (q.z-plane.point.z)*plane.normal.z)/nNorm;
 const sideDistance=q=>Math.abs(
  Math.hypot(q.x-cone.baseCenter.x,q.y-cone.baseCenter.y)-
  cone.radiusMm*(apex.z-q.z)/cone.heightMm);
 const analytic=solved.curve,[begin,end]=analytic.parameterRadians;
 const projections={V:[],H:[],W:[]};
 const sheets={V:[],H:[],W:[]};
 for(const [i,q] of solved.points.entries()){
  if(!xyz(q)||planeDistance(q)>8*eps||sideDistance(q)>8*eps||
     q.z<cone.baseCenter.z-8*eps||q.z>apex.z+8*eps)
   return blocked(revision,'independent cone/plane residual invalid');
  const t=begin+(end-begin)*i/samples;
  const denom=analytic.denominator.constant+
   analytic.denominator.cosCoeff*Math.cos(t)+
   analytic.denominator.sinCoeff*Math.sin(t);
  const rho=analytic.numeratorMm/denom;
  const expected={x:apex.x+rho*Math.cos(t),y:apex.y+rho*Math.sin(t),
   z:apex.z-cone.heightMm*rho/cone.radiusMm};
  if(!xyz(expected)||Math.hypot(q.x-expected.x,q.y-expected.y,
    q.z-expected.z)>8*eps)
   return blocked(revision,'analytic parameter does not match source samples');
  const views=project(q);
  for(const view of ['V','H','W']){
   const p=views[view],existing=solved.projections?.[i]?.[view];
   if(!existing||Math.hypot(p.u-existing.u,p.v-existing.v)>8*eps)
    return blocked(revision,'solver and shared projection disagreement');
   const sheet=toSheet(view,p,sheetTransform);
   const back=fromSheet(view,sheet,sheetTransform);
   if(!finite(back.u)||!finite(back.v)||
      Math.hypot(back.u-p.u,back.v-p.v)>8*eps)
    return blocked(revision,'first-angle sheet round-trip under-resolved');
   projections[view].push(uv(p));
   sheets[view].push({x:sheet.x,y:sheet.y});
  }
 }
 // M5 topology invariant: an analytically complete lateral loop must actually
 // join at its sampled seam. Sampling itself never establishes the proof.
 const curveStart=solved.points[0],curveEnd=solved.points.at(-1);
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 if(kind==='full-ellipse'&&distance(curveStart,curveEnd)>8*eps)
  return blocked(revision,'full cone ellipse has a disconnected presentation seam');
 let chord=null;
 if(kind==='clipped-ellipse'){
  chord={start:point(solved.capChord.start),end:point(solved.capChord.end)};
  const [start,endPoint]=[chord.start,chord.end];
  if(!xyz(start)||!xyz(endPoint)||Math.hypot(
     start.x-endPoint.x,start.y-endPoint.y,start.z-endPoint.z)<=eps||
     [start,endPoint].some(q=>Math.abs(q.z-cone.baseCenter.z)>8*eps||
      Math.abs(Math.hypot(q.x-cone.baseCenter.x,q.y-cone.baseCenter.y)-
       cone.radiusMm)>8*eps||planeDistance(q)>8*eps))
   return blocked(revision,'base chord boundary or residual invalid');
  // The cap chord must run from the LAST lateral point back to the FIRST.
  // Two individually valid plane/cap points are not a proven closed contour
  // without this directed connectivity check.
  if(distance(start,curveEnd)>8*eps||
     distance(endPoint,curveStart)>8*eps)
   return blocked(revision,'oriented cap chord does not close lateral arc');
 }
 const intent={
  schema:VERSION,id:'cone-section-'+revision,revision,
  coordinateSpace:'model-mm-3d',modelUnit:'mm',
  operation:{kind:'analytic-cone-plane-section',geometryKind:kind,
   cone:{baseCenter:point(cone.baseCenter),radiusMm:cone.radiusMm,
    heightMm:cone.heightMm},
   plane:{point:point(plane.point),normal:point(plane.normal)},
   analytic:{kind:kind==='full-ellipse'?'complete-lateral-ellipse':'finite-lateral-arc',
    apex:point(apex),normal:point(analytic.normal),
    numeratorMm:analytic.numeratorMm,
    denominator:{...analytic.denominator},
    radialBoundsMm:{...analytic.radialBoundsMm},
    parameterRadians:[...analytic.parameterRadians],
    closed:kind==='full-ellipse'},
   samplePoints:solved.points.map(point),capChord:chord},
  projectionSamples:projections,
  source:{solver:'engines/spatial/sections/finite-cone-plane',
   revision,proofScope:solved.proofScope,proofLevel:'analytic',
   mathStatus:'ready',visibilityVerified:false,
   sectionInteriorVerified:false,firstAngleLayoutVerified:false,
   v5StepsReady:false}
 };
 const validation=validateSpatialConstructionIntent(intent);
 if(!validation.ok)
  throw new TypeError('spatial Intent invalid: '+validation.errors.join('; '));
 return {status:'ready',revision,spatialIntent:intent,
  projectionSamples:projections,sheetViews:sheets,
  mathematicallyVerified:true,
  firstAngleCoordinateMappingVerified:true,
  firstAngleLayoutVerified:false,v5StepsReady:false,
  proofScope:solved.proofScope,sourceConfirmation:'caller-reviewed-parameters',
  // Existing V5 is 2D; a reviewed 3D/visibility consumer is still required.
  constructionSteps:[],timing:null,publicWorkbenchConnected:false};
}
module.exports={verifiedConeSpatialIntent};
