'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3BooleanWCriticalSwitchRays:audit}=
 require('../../workbench/c3-boolean-w-critical-switch-rays.cjs');
const {auditC3SelectedBooleanVHWOpenRays:rays}=
 require('../../workbench/c3-selected-boolean-vhw-open-rays.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const run=(input,op,revision=41)=>audit({input,revision,
 selectedRayEvidence:rays({input,revision,solidOperation:op})});
test('real C3 W internal center rays are certified independently for BOTH Boolean solids',()=>{
 const src=model();
 const U=run(src,'union'),I=run(src,'intersection');
 assert.equal(U.status,'scoped-all-internal-W-center-point-rays-classified');
 assert.equal(I.status,U.status);
 assert.ok(U.internalSourceSwitchPointCount>=4);
 assert.equal(U.internalSourceSwitchPointCount,I.internalSourceSwitchPointCount);
 assert.equal(U.certifiedPointRayCount,U.internalSourceSwitchPointCount);
 assert.equal(U.unresolvedPointRayCount,0);
 assert.equal(U.everyCurrentAnalyticWRootEnumerated,true);
 const zero=U.pointRays.filter(r=>r.x===0);
 const two=U.pointRays.filter(r=>r.x===2);
 assert.ok(zero.length>0&&two.length>0);
 assert.ok(zero.every(r=>
  r.strictPointwiseFiniteBooleanRayStatus==='certified-Boolean-strict-volume-ahead'&&
  r.nativePositiveInteriorSourceIds.includes('yCylinder')&&
  r.sourceCenterSwitches.includes('zCylinder')));
 assert.ok(two.every(r=>
  r.strictPointwiseFiniteBooleanRayStatus==='certified-Boolean-no-strict-volume-ahead'&&
  r.sourceCenterSwitches.includes('yCylinder')));
 assert.ok(I.pointRays.every(r=>
  r.strictPointwiseFiniteBooleanRayStatus==='certified-Boolean-no-strict-volume-ahead'));
 assert.ok(U.pointRays.every(r=>r.current3DSourcePointVerified===true&&
  r.engineeringLineStyle==='undetermined'&&
  r.closedFeatureEndpointAndFullOcclusionVerified===false&&
  r.finalV5ActionAuthorized===false));
 assert.equal(U.globalProjectedFeatureDepthAndOcclusionCertified,false);
 assert.equal(U.finalV5Authorized,false);
});
test('at a repeated W cylinder center both analytic normals are tangent, not inward',()=>{
 const src=model();src.yCylinder.xCenter=src.zCylinder.xCenter;
 const U=run(src,'union');
 assert.ok(U.internalSourceSwitchPointCount>0);
 assert.ok(U.pointRays.every(r=>r.x===src.zCylinder.xCenter&&
  r.sourceCenterSwitches.length===2&&
  r.strictPointwiseFiniteBooleanRayStatus==='certified-Boolean-no-strict-volume-ahead'));
 const I=run(src,'intersection');
 assert.ok(I.pointRays.every(r=>r.pointRayNoStrictInteriorProved));
});
test('current W switch must be shared by TWO true positive source-ray open intervals',()=>{
 const src=model(),revision=41;
 const original=rays({input:src,revision,solidOperation:'union'});
 const altered=JSON.parse(JSON.stringify(original));
 const W=altered.intervals.filter(r=>r.sourceKind==='analytic-curve'&&
  r.view==='W');
 assert.ok(W.length>2);
 W[0].openParameterRange[1]=W[0].openParameterRange[0]+0.05;
 assert.throws(()=>audit({input:src,revision,selectedRayEvidence:altered}),
  /center switch partition omitted genuine source cells|real W adjacent open rays/);
});
test('a forged Boolean open-cell ray sign cannot be inherited by the critical-point proof',()=>{
 const src=model(),revision=41;
 const original=rays({input:src,revision,solidOperation:'union'});
 const altered=JSON.parse(JSON.stringify(original));
 const cell=altered.intervals.find(x=>x.view==='W'&&
  x.sourceKind==='analytic-curve');
 assert.ok(cell);
 cell.openInteriorVolumeRayStatus=cell.openInteriorVolumeRayStatus===
  'opaque-interior-ahead'?'strict-interior-ray-clear':'opaque-interior-ahead';
 assert.throws(()=>audit({input:src,revision,selectedRayEvidence:altered}),
  /real W adjacent open rays contradict/);
});
test('no selected Boolean operation gives NO invented critical-ray classification',()=>{
 const src=model(),revision=41;
 const missing=rays({input:src,revision,solidOperation:null});
 const result=audit({input:src,revision,selectedRayEvidence:missing});
 assert.equal(result.status,'not-covered');
 assert.equal(result.pointRays.length,0);
 assert.equal(result.everyCurrentAnalyticWRootEnumerated,false);
 assert.equal(result.finalV5Authorized,false);
 assert.throws(()=>audit({input:src,revision:42,selectedRayEvidence:missing}),
  /current unsigned/);
});
test('normal reviewed C3 M3/M5 joint preserves both pointwise Boolean and unsigned V5',()=>{
 for(const operation of ['union','intersection']){
  const src=model(),r=joint({input:src,revision:45,solidOperation:operation});
  const point=r.selectedBooleanWCriticalPointEvidence;
  assert.ok(point.internalSourceSwitchPointCount>0);
  assert.equal(point.everyCurrentAnalyticWRootEnumerated,true);
  assert.equal(point.allCriticalPointRaysCertified,true);
  assert.equal(point.finalV5Authorized,false);
  assert.equal(r.selectedBooleanRayEvidence.finalV5CurveAuthorized,false);
  assert.equal(r.v5CurveReady,false);
 }
});
