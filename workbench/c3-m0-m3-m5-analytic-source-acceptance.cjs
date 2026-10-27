'use strict';
/**
 * C3 same-source acceptance at the M0 -> M3 -> M5 boundary.
 * Reuses the existing finite-cylinder M3 solver, canonical symbolic
 * 3D/V/H/W Geometry Scene, M0 vector/projection kernels, actual locally
 * proven convex Boolean M5 ray intervals and the ONE V5 guide timeline.
 *
 * Evaluating an analytic M5 interval's interior point is an INDEPENDENT
 * source/observer-sign parity check. It NEVER uses sampling to certify
 * full-interval visibility, topology, GB hidden/visible styles or V5 strokes.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {buildC3LinkedGeometryScene}=
 require('./c3-linked-geometry-scene.cjs');
const {auditC3SelectedBooleanVHWOpenRays}=
 require('./c3-selected-boolean-vhw-open-rays.cjs');
const {atAnalyticCurve3D}=require('../core/geometry/analytic-curve-3d.cjs');
const {project,VIEWS,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {dotObject3}=require('../core/numeric/object-vector3.cjs');
const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))deepFreeze(v);Object.freeze(o);
}return o;};
const valid=n=>typeof n==='number'&&Number.isFinite(n);
const close=(a,b)=>valid(a)&&valid(b)&&Math.abs(a-b)<=
 1e-7*Math.max(1,Math.abs(a),Math.abs(b));
const eq2=(a,b)=>a&&b&&close(a.u,b.u)&&close(a.v,b.v);
const fail=s=>{throw new RangeError('C3 actual M0/M3/M5 source acceptance: '+s);};
function auditC3M0M3M5AnalyticSources({input,revision,compiled,linked,
 viewTransforms,solidOperation=null}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    ![null,'intersection','union'].includes(solidOperation))
  throw new TypeError('current finite C3 source and selected Boolean operation required');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 if(m3.status!=='scoped-analytic-ready'||
    JSON.stringify(m3)!==JSON.stringify(compiled?.sourceM3))
  fail('current independent finite-cylinder M3 source unavailable');
 // This original source consumer has already checked V5 action IDs,
 // source cap topology, analytic curve geometry and all current transforms.
 const reconstructed=buildC3LinkedGeometryScene({
  input,revision,compiled,viewTransforms});
 if(JSON.stringify(reconstructed)!==JSON.stringify(linked))
  fail('caller scene does not equal freshly reviewed real M3 source/one V5');
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
 const tol=1e-7*Math.max(1,Z.radius**2,Y.radius**2);
 function onBothFiniteCylinderSides(p){
  if(!p||!['x','y','z'].every(k=>valid(p[k])))
   return false;
  const zVector={x:p.x-Z.xCenter,y:p.y-Z.yCenter,z:0},
   yVector={x:p.x-Y.xCenter,y:0,z:p.z-Y.zCenter};
  const zResidual=dotObject3(zVector,zVector)-Z.radius**2,
   yResidual=dotObject3(yVector,yVector)-Y.radius**2;
  return Math.abs(zResidual)<=tol&&Math.abs(yResidual)<=tol&&
   p.z>=Z.zMin-1e-7&&p.z<=Z.zMax+1e-7&&
   p.y>=Y.yMin-1e-7&&p.y<=Y.yMax+1e-7;
 }
 let pointCount=0,segmentCount=0,curveCount=0,projectionCount=0;
 const curvesByBranch=new Map();
 for(const obj of linked.scene.objects){
  if(obj.space!=='model-3d'||obj.model?.unit!=='mm'||
     obj.model.id!==obj.id)
   fail('current C3 Geometry Scene lost an original three-dimensional model');
  const objData=obj.model.data,points=[];
  if(obj.kind==='point'){
   points.push(objData);pointCount++;
  }else if(obj.kind==='segment'){
   points.push(objData.start,objData.end);segmentCount++;
  }else if(obj.kind==='analytic-curve'){
   const group=linked.groups.find(g=>g.geometryId===obj.id&&
    g.role==='analytic-lateral-intersection');
   const branch=m3.branches.find(b=>b.id===group?.branchId);
   if(!branch||
      objData.parameter.from!==branch.xRange[0]||
      objData.parameter.to!==branch.xRange[1]||
      curvesByBranch.has(branch.id))
    fail('actual C3 M3 branch identity or parameter domain changed');
   curvesByBranch.set(branch.id,obj);
   const a=atAnalyticCurve3D(objData,objData.parameter.from),
    b=atAnalyticCurve3D(objData,objData.parameter.to),
    c=atAnalyticCurve3D(objData,(objData.parameter.from+
      objData.parameter.to)/2);
   if(![a,b,c].every(onBothFiniteCylinderSides))
    fail('real C3 analytic source violates one of the finite solid equations');
   points.push(a,b);curveCount++;
  }else fail('C3 source object has unsupported geometric kind');
  for(const view of VIEWS){
   const rep=obj.representations?.[view],first=project(points[0])[view];
   if(!rep)fail('missing current first-angle geometry projection');
   if(obj.kind==='point'&&
      (rep.kind!=='point'||!eq2(rep.at,first)))
    fail('C3 original 3D point conflicts with M0/M3 first-angle projection');
   if(obj.kind==='segment'){
    const last=project(points[1])[view],collapsed=eq2(first,last);
    if(collapsed?rep.kind!=='point'||!eq2(rep.at,first):
       rep.kind!=='segment'||!eq2(rep.start,first)||
        !eq2(rep.end,last))
     fail('actual C3 finite cap line projected without its original 3D endpoints');
   }
   if(obj.kind==='analytic-curve'){
    const last=project(points[1])[view];
    if(rep.kind!=='analytic-curve-projection'||
       !eq2(rep.start,first)||!eq2(rep.end,last))
     fail('actual symbolic C3 curve differs from M0 first-angle model projection');
   }
   projectionCount++;
  }
 }
 if(curveCount!==linked.analyticCurveCount||
    linked.entireCurveV5Ready!==false||
    linked.officialLineStylesVerified!==false)
  fail('C3 symbolic source cannot become a completed engineering drawing');
 const m5=solidOperation?auditC3SelectedBooleanVHWOpenRays({
  input,revision,solidOperation}):null;
 let analyticIntervals=0,positiveVolumeRayParity=0;
 for(const interval of m5?.intervals??[]){
  if(interval.standardLineStyle!=='undetermined'||
     interval.finalV5StrokeAuthorized!==false||
     !VIEWS.includes(interval.view))
   fail('unsigned original C3 M5 interval was promoted to a formal engineering stroke');
  if(interval.sourceKind!=='analytic-curve')continue;
  const curve=curvesByBranch.get(interval.sourceId),
   branch=m3.branches.find(b=>b.id===interval.sourceId);
  if(!curve||!branch||interval.parameterKind!=='x'||
     !Array.isArray(interval.openParameterRange)||
     interval.openParameterRange.length!==2)
   fail('M5 analytic Boolean ray has no current three-dimensional M3 branch');
  const [lo,hi]=interval.openParameterRange;
  if(!(lo>=branch.xRange[0]&&hi<=branch.xRange[1]&&hi>lo))
   fail('M5 analytic interval exceeds its original M3 parameter domain');
  const p=atAnalyticCurve3D(curve.model.data,(lo+hi)/2);
  if(!onBothFiniteCylinderSides(p))
   fail('M5 interval source does not satisfy real finite-cylinder equations');
  const observer=FIRST_ANGLE_OBSERVER_RAYS[interval.view],
   zGrad={x:p.x-Z.xCenter,y:p.y-Z.yCenter,z:0},
   yGrad={x:p.x-Y.xCenter,y:0,z:p.z-Y.zCenter},
   zDot=dotObject3(zGrad,observer),yDot=dotObject3(yGrad,observer);
  const epsilon=1e-10*Math.max(1,Z.radius,Y.radius);
  const sign=v=>Math.abs(v)<epsilon?0:v<0?-1:1;
  const zs=sign(zDot),ys=sign(yDot);
  if(zs!==interval.zCylinderOutwardRaySign||
     ys!==interval.yCylinderOutwardRaySign)
   fail('independent M0 first-angle 3D observer-depth sign contradicts M5 analytic source interval');
  const opaque=solidOperation==='intersection'?
   (zs===-1&&ys===-1):(zs===-1||ys===-1);
  if(interval.openInteriorVolumeRayStatus!==
     (opaque?'opaque-interior-ahead':'strict-interior-ray-clear'))
   fail('C3 M5 open-interval Boolean ray classification contradicts M0 3D solid gradients');
  analyticIntervals++;positiveVolumeRayParity++;
 }
 return deepFreeze({
  schema:'draftai-c3-m0-m3-m5-analytic-source-acceptance/1',
  revision,solidOperation:solidOperation||'unselected',
  status:'actual-current-M3-source-and-M5-local-ray-parity',
  m3BranchCount:m3.branchCount,originalModelPointCount:pointCount,
  originalFiniteCapSegmentCount:segmentCount,
  originalSymbolic3DCurveCount:curveCount,
  independentFirstAngleProjectionCount:projectionCount,
  independentlyCheckedAnalyticM5OpenRayIntervals:analyticIntervals,
  analyticallyAgreeingM0M5ObserverRayIntervals:positiveVolumeRayParity,
  booleanM5RayProof:m5,
  originalFullCurveTopologyVerified:false,
  completeSceneOcclusionVerified:false,
  officialEngineeringLineStylesVerified:false,
  entireCurveV5Ready:false,
  createsSecondMathSolver:false,createsSecondV5Player:false
 });
}
module.exports={auditC3M0M3M5AnalyticSources};
