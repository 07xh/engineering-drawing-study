'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {auditC3WLateralProjectionInjectivity:audit}=
 require('../../workbench/c3-w-lateral-injectivity.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const input=()=>({
 kind:'finite-orthogonal-cylinder-intersection',sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}
});
test('offset cylinder X axes prove all exact W lateral/lateral points spatially unique',()=>{
 const s=input(),r=audit({input:s,revision:2});
 assert.equal(r.status,'certified-lateral-lateral-exact-W-injective');
 assert.equal(r.distinctXCenterSeparationVerified,true);
 assert.equal(r.projectedLateralLateralPointInjectivityVerified,true);
 assert.equal(r.actualFirstAngleWProjectionParityVerified,true);
 assert.ok(r.sourceInverseWitnessCount>=r.reviewedM3SourceBranchCount*3);
 assert.ok(r.maxScaledSourceInverseResidual<=1e-8);
 assert.equal(r.projectionOfCapsAndOtherPhysicalFeaturesVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.v5Authorized,false);
});
test('same X center has a real distinct-depth W projection collision',()=>{
 const s=input();s.yCylinder.xCenter=0;
 const y=Math.sqrt(s.zCylinder.radius**2-16);
 const z=Math.sqrt(s.yCylinder.radius**2-16);
 const a={x:4,y,z},b={x:-4,y,z};
 assert.notEqual(a.x,b.x);
 assert.deepEqual(project(a).W,project(b).W);
 for(const p of [a,b]){
  assert.ok(Math.abs(p.x**2+p.y**2-s.zCylinder.radius**2)<1e-9);
  assert.ok(Math.abs(p.x**2+p.z**2-s.yCylinder.radius**2)<1e-9);
  assert.ok(p.z>s.zCylinder.zMin&&p.z<s.zCylinder.zMax);
  assert.ok(p.y>s.yCylinder.yMin&&p.y<s.yCylinder.yMax);
 }
 const r=audit({input:s,revision:2});
 assert.equal(r.projectedLateralLateralPointInjectivityVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
});
test('near-coincident X axes are not signed under inverse conditioning',()=>{
 const s=input();s.yCylinder.xCenter=1e-11;
 const r=audit({input:s,revision:2});
 assert.equal(r.projectedLateralLateralPointInjectivityVerified,false);
 assert.equal(r.v5Authorized,false);
});
test('W injectivity theorem survives common XYZ translation of reviewed cylinders',()=>{
 const s=input(),a=audit({input:s,revision:6});
 const t=input();t.zCylinder.xCenter+=20;t.yCylinder.xCenter+=20;
 t.zCylinder.yCenter+=15;t.yCylinder.yMin+=15;t.yCylinder.yMax+=15;
 t.yCylinder.zCenter-=7;t.zCylinder.zMin-=7;t.zCylinder.zMax-=7;
 const b=audit({input:t,revision:6});
 assert.equal(a.status,b.status);
 assert.equal(a.projectedLateralLateralPointInjectivityVerified,true);
 assert.equal(b.projectedLateralLateralPointInjectivityVerified,true);
 assert.equal(b.v5Authorized,false);
});
test('joint C3 M3/M5 reads the scoped W theorem without authorizing strokes',()=>{
 const r=joint({input:input(),revision:3});
 assert.equal(r.wLateralProjection.projectedLateralLateralPointInjectivityVerified,true);
 assert.ok(r.intervals.filter(i=>i.view==='W').every(i=>
  i.wLateralProjectionCollisionExcludedWithinSourceScope===true));
 assert.ok(r.intervals.filter(i=>i.view!=='W').every(i=>
  i.wLateralProjectionCollisionExcludedWithinSourceScope===false));
 assert.ok(r.intervals.every(i=>i.standardLineStyle==='undetermined'&&
  i.v5ActionAuthorized===false));
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.v5CurveReady,false);
});
test('absent finite intersection never produces a W injectivity credential',()=>{
 const s=input();s.zCylinder.zMin=40;s.zCylinder.zMax=60;
 const r=audit({input:s,revision:5});
 assert.equal(r.status,'not-covered');
 assert.equal(r.projectedLateralLateralPointInjectivityVerified,false);
 assert.equal(r.v5Authorized,false);
});
