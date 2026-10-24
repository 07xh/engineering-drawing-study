'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditC3SelectedBooleanVHWOpenRays:audit}=
 require('../../workbench/c3-selected-boolean-vhw-open-rays.cjs');
const {auditC3Merged3DSourceGraph:graph}=
 require('../../workbench/c3-merged-3d-source-graph.cjs');
const {evaluateUnifiedMath}=
 require('../../workbench/unified-math-pipeline.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('requires selected finite Boolean solid; strict ray evidence never becomes official V5',()=>{
 const x=audit({input:model(),revision:3});
 assert.equal(x.status,'requires-explicit-solid-operation');
 assert.equal(x.intervals.length,0);
 assert.equal(x.officialLineStylesVerified,false);
 assert.equal(x.finalV5CurveAuthorized,false);
 const gate=joint({input:model(),revision:3});
 assert.equal(gate.selectedBooleanRayEvidence.status,
  'requires-explicit-solid-operation');
 assert.equal(gate.selectedBooleanThreeViewSourceRayCoverageVerified,false);
});
test('real lateral/lateral 3-view WHOLE open rays: intersection differs from UNION correctly',()=>{
 const src=model(),revision=7;
 const I=audit({input:src,revision,solidOperation:'intersection'});
 const U=audit({input:src,revision,solidOperation:'union'});
 assert.equal(I.status,'scoped-three-view-regular-open-ray-theorem');
 assert.equal(U.status,I.status);
 assert.equal(I.undeterminedCount,0);
 assert.equal(U.undeterminedCount,0);
 assert.equal(I.sourceEdgeCount,U.sourceEdgeCount);
 const m3=evaluateUnifiedMath({kind:src.kind,input:src,revision});
 const edgeGraph=graph({input:src,revision});
 assert.equal(I.sourceEdgeCount,edgeGraph.edges.length);
 assert.equal(I.intervals.filter(x=>x.view==='V').length,m3.branchCount);
 assert.equal(I.intervals.filter(x=>x.view==='H').length,m3.branchCount);
 assert.ok(I.intervals.filter(x=>x.view==='W').length>m3.branchCount);
 assert.equal(I.intervals.filter(x=>x.view==='V'||
  x.view==='H').every(x=>x.openInteriorVolumeRayStatus==='strict-interior-ray-clear'),true);
 assert.ok(U.intervals.some(x=>x.view==='V'&&
  x.openInteriorVolumeRayStatus==='opaque-interior-ahead'));
 assert.ok(U.intervals.some(x=>x.view==='H'&&
  x.openInteriorVolumeRayStatus==='opaque-interior-ahead'));
 assert.ok(I.intervals.some(x=>x.view==='W'&&
  x.openInteriorVolumeRayStatus==='opaque-interior-ahead'));
 assert.ok(I.intervals.some(x=>x.view==='W'&&
  x.openInteriorVolumeRayStatus==='strict-interior-ray-clear'));
 const both=I.intervals.filter(x=>x.view==='W');
 for(const branch of m3.branches){
  const e=both.filter(x=>x.sourceId===branch.id)
   .sort((a,b)=>a.openParameterRange[0]-b.openParameterRange[0]);
  assert.ok(e.length>0);
  assert.equal(e[0].openParameterRange[0],branch.xRange[0]);
  assert.equal(e.at(-1).openParameterRange[1],branch.xRange[1]);
  assert.ok(e.every((s,i)=>i===0||
   s.openParameterRange[0]===e[i-1].openParameterRange[1]));
 }
 for(let i=0;i<I.intervals.length;i++){
  const a=I.intervals[i],b=U.intervals[i];
  assert.equal(a.edgeId,b.edgeId);
  assert.equal(a.view,b.view);
  assert.deepEqual(a.openParameterRange,b.openParameterRange);
  assert.equal(a.sourceFirstAngleRayEntireIntervalProven,true);
  assert.equal(a.switchingPointsAndEndpointsCertified,false);
  assert.equal(a.standardLineStyle,'undetermined');
  assert.equal(a.finalV5StrokeAuthorized,false);
 }
 assert.ok(U.certifiedOpaqueCount>I.certifiedOpaqueCount);
 assert.equal(I.officialLineStylesVerified,false);
 assert.equal(U.finalV5CurveAuthorized,false);
 const gate=joint({input:src,revision,solidOperation:'intersection'});
 assert.equal(gate.selectedBooleanRayEvidence.status,I.status);
 assert.equal(gate.selectedBooleanThreeViewSourceRayCoverageVerified,true);
 assert.equal(gate.officialLineStylesVerified,false);
});
test('Y cap source straight generators have globally constant ray derivatives in V/H/W',()=>{
 const src=model();src.yCylinder.yMin=-6;src.yCylinder.yMax=6;
 const r=audit({input:src,revision:4,solidOperation:'intersection'});
 assert.equal(r.status,'scoped-three-view-regular-open-ray-theorem');
 const line=r.intervals.filter(x=>x.sourceKind==='line');
 assert.equal(r.sourceEdgeCount,graph({input:src,revision:4}).edges.length);
 assert.equal(line.length,6);
 assert.ok(line.every(x=>x.proofMethod===
  'constant-axis-cap-face-normal-and-convex-ray'));
 assert.ok(line.every(x=>x.sourceFirstAngleRayEntireIntervalProven));
 assert.equal(line.filter(x=>x.view==='W'&&
  x.openInteriorVolumeRayStatus==='opaque-interior-ahead').length,0);
 assert.ok(line.some(x=>x.view==='V'&&
  x.openInteriorVolumeRayStatus==='opaque-interior-ahead'));
 assert.ok(line.every(x=>x.standardLineStyle==='undetermined'));
});
test('both cap families and cap-cap generators receive exact strict-volume ray status with no stroke signoff',()=>{
 const src=model();
 src.zCylinder.zMin=-5;src.zCylinder.zMax=5;
 src.yCylinder.yMin=-6;src.yCylinder.yMax=6;
 const r=audit({input:src,revision:6,solidOperation:'union'});
 assert.equal(r.status,'scoped-three-view-regular-open-ray-theorem');
 assert.equal(r.undeterminedCount,0);
 assert.equal(r.fullSourceOpenEdgeRayCoverageVerified,true);
 assert.ok(r.intervals.some(x=>x.sourceKind==='line'));
 assert.ok(r.intervals.some(x=>x.view==='V'&&
   x.openInteriorVolumeRayStatus==='opaque-interior-ahead'));
 assert.ok(r.intervals.some(x=>x.view==='H'&&
   x.openInteriorVolumeRayStatus==='opaque-interior-ahead'));
 assert.ok(r.intervals.every(x=>x.standardLineStyle==='undetermined'));
 assert.equal(r.sourceJunctionRayContinuityVerified,false);
 assert.equal(r.projectedFeatureOcclusionAndLineStyleVerified,false);
});
test('rigid translation preserves every source/Boolean/view forward-ray classification',()=>{
 const a=model(),b=model();
 a.yCylinder.yMin=-6;a.yCylinder.yMax=6;
 b.zCylinder.xCenter+=35;b.yCylinder.xCenter+=35;
 b.zCylinder.yCenter+=14;
 b.yCylinder.yMin=-6+14;b.yCylinder.yMax=6+14;
 b.yCylinder.zCenter-=5;
 b.zCylinder.zMin-=5;b.zCylinder.zMax-=5;
 const A=audit({input:a,revision:4,solidOperation:'union'});
 const B=audit({input:b,revision:5,solidOperation:'union'});
 assert.equal(A.status,B.status);
 assert.equal(A.sourceEdgeCount,B.sourceEdgeCount);
 assert.deepEqual(A.intervals.map(x=>[x.sourceId,x.view,x.openInteriorVolumeRayStatus]),
  B.intervals.map(x=>[x.sourceId,x.view,x.openInteriorVolumeRayStatus]));
});
test('tangent, unreviewed source and empty intersection have no certified forward rays',()=>{
 const tangent=model();tangent.zCylinder.zMax=9;
 const x=audit({input:tangent,revision:1,solidOperation:'union'});
 assert.equal(x.status,'not-covered');
 assert.equal(x.intervals.length,0);
 const absent=model();absent.zCylinder.zMin=40;absent.zCylinder.zMax=60;
 const y=audit({input:absent,revision:1,solidOperation:'intersection'});
 assert.equal(y.status,'not-covered');
 assert.equal(y.officialLineStylesVerified,false);
 const unconfirmed=model();unconfirmed.sourceConfirmed=false;
 assert.throws(()=>audit({input:unconfirmed,revision:1,
  solidOperation:'intersection'}),/human-confirmed/);
});
