'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3WCenterClosedFoldVisibility:audit}=
 require('../../workbench/c3-w-center-closed-fold-visibility.cjs');
const {auditC3WGlobalSourceCurveSolidDepth:globalDepth}=
 require('../../workbench/c3-w-global-source-curve-solid-depth.cjs');
const {auditC3WAllLateralProjectionCollisions:collisions}=
 require('../../workbench/c3-w-lateral-projection-collision-inventory.cjs');
const {auditC3WMirrorExitOutlineConcordance:mirrors}=
 require('../../workbench/c3-w-mirror-exit-outline-concordance.cjs');
const {auditC3WMirrorSourceOutlineUnion:outlines}=
 require('../../workbench/c3-w-mirror-source-outline-union.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const {buildC3WIntervalPreview:preview}=
 require('../../workbench/c3-w-ray-preview.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:0,zCenter:0,yMin:-17,yMax:17}});
function evidence(input,revision=211,op='union'){
 const j=joint({input,revision,solidOperation:op});
 const out=outlines({input,revision,
  capPartitionEvidence:j.wMirrorCapContactPartition,
  wRayPreview:preview({input,revision})});
 const col=collisions({input,revision,
  mirrorExitEvidence:mirrors({input,revision,
   exitEvidence:j.wBooleanForwardExitDepth,outlineEvidence:out})});
 const solid=globalDepth({input,revision,collisionEvidence:col,
  forwardExitEvidence:j.wBooleanForwardExitDepth});
 return {input,revision,criticalPointEvidence:j.selectedBooleanWCriticalPointEvidence,
  globalSourceCurveDepth:solid};
}
test('shared-X-center real finite cylinder union/intersection has genuine closed internal W folds globally frontmost',()=>{
 for(const op of ['union','intersection']){
  const d=evidence(model(),211,op),result=audit(d);
  assert.equal(result.status,
   'scoped-complete-regular-3D-W-quadratic-fold-center-source-point-visibility');
  assert.equal(result.allCurrentInternalSignedSourceCenterFoldsCertified,true);
  assert.equal(result.allCurrentWInternalCenterRaysAccountedFor,true);
  assert.equal(result.closedInternalCenterCount,4);
  assert.equal(result.closedInternalCenterCount,
   result.globallyFrontmostCenterPointCount);
  for(const p of result.closedInternalCenterPoints){
   assert.equal(p.originalClosedSourceX,0);
   assert.equal(p.strictFiniteCapInteriorAtCenter,true);
   assert.equal(p.bothOriginal3DSourceHalfCurvesMeetAtSamePhysicalPoint,true);
   assert.equal(p.actual3DLateralGradientRankTwoAtCenter,true);
   assert.equal(p.original3DCurveRegularTangentAlongObserverX,true);
   assert.deepEqual(p.projectedWFirstDerivative,{u:0,v:0});
   assert.notEqual(p.projectedWSecondDerivative.u,0);
   assert.notEqual(p.projectedWSecondDerivative.v,0);
   assert.equal(p.nondegenerateQuadraticWProjectedFoldAtCenter,true);
   assert.equal(p.globallyFrontmostClosedPointAgainstEntireFiniteSelectedSolid,true);
   assert.ok(p.leftRearM3SourceOpenRange[1]===0);
   assert.ok(p.rightFrontM3SourceOpenRange[0]===0);
   assert.equal(p.originalCurveEndpointOrCapContactAuthorized,false);
   assert.equal(p.officialEngineeringLineStyle,'undetermined');
   assert.equal(p.v5ActionAuthorized,false);
  }
  assert.equal(result.originalCurveTerminalAndCapContactVisibilityCertified,false);
  assert.equal(result.completeDrawingWLineStyleSigned,false);
  assert.equal(result.finalV5Authorized,false);
 }
});
test('real finite cap clipping retains internal center continuity only with strict cap interior',()=>{
 const m=model();m.zCylinder.zMin=-7;m.zCylinder.zMax=7;
 m.yCylinder.yMin=-10;m.yCylinder.yMax=10;
 const result=audit(evidence(m,212,'intersection'));
 assert.equal(result.closedInternalCenterCount,4);
 assert.ok(result.closedInternalCenterPoints.every(x=>
  x.globallyFrontmostClosedPointAgainstEntireFiniteSelectedSolid));
 assert.equal(result.finalV5Authorized,false);
});
test('source translation keeps physically identical center fold and tangent-axis theorem',()=>{
 const m=model();m.zCylinder.xCenter=12;m.yCylinder.xCenter=12;
 const a=audit(evidence(m,213,'union'));
 assert.equal(a.closedInternalCenterCount,4);
 assert.ok(a.closedInternalCenterPoints.every(x=>x.originalClosedSourceX===12));
});
test('forged center native ray or lost neighboring open M3 source atom fails closed',()=>{
 const d=evidence(model(),214,'intersection');
 const bad=structuredClone(d.criticalPointEvidence);
 bad.pointRays[0].strictPointwiseFiniteBooleanRayStatus='certified-Boolean-strict-volume-ahead';
 assert.throws(()=>audit({...d,criticalPointEvidence:bad}),
  /center ray contradicts actual M3 closed source point/);
 const missing=structuredClone(d.globalSourceCurveDepth);
 missing.provedWSourceCurveOpenCells.shift();
 assert.throws(()=>audit({...d,globalSourceCurveDepth:missing}),
  /both proven original M3 incident flanks/);
});
test('unknown selected model, different centers and stale revision cannot become closed point authority',()=>{
 const no=audit(evidence(model(),215,null));
 assert.equal(no.status,'not-covered');assert.equal(no.finalV5Authorized,false);
 const m=model();m.yCylinder.xCenter=1;
 const different=audit(evidence(m,216,'union'));
 assert.equal(different.status,'not-covered');
 assert.equal(different.closedInternalCenterCount,0);
 const d=evidence(model(),217,'union');
 assert.throws(()=>audit({...d,revision:218}),/same-revision unsigned/);
});
