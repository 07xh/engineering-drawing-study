'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const {auditC3WCriticalRays:audit}=
 require('../../workbench/c3-w-critical-ray-theorem.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const input=()=>({
 kind:'finite-orthogonal-cylinder-intersection',sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}
});
function branchAt(source,x,predicate=()=>true){
 const m3=evaluateUnifiedMath({kind:'finite-orthogonal-cylinder-intersection',
  input:source,revision:2});
 assert.equal(m3.status,'scoped-analytic-ready');
 const branch=m3.branches.find(b=>b.xRange[0]<=x&&x<=b.xRange[1]&&
  predicate(b));
 assert.ok(branch,'analytic M3 source must own requested x');
 return branch.id;
}
test('W critical ray has exact positive-t exterior and opaque interior theorems',()=>{
 const s=input(),branchId=branchAt(s,0);
 const r=audit({input:s,revision:2,criticalPoints:[
  {branchId,x:0},{branchId,x:2},{branchId,x:4}
 ]});
 assert.equal(r.status,'scoped-analytic-critical-W-point-evidence');
 assert.equal(r.points.length,3);
 assert.equal(r.points[0].rayStatus,'certified-finite-cylinder-interior-ahead');
 assert.ok(r.points[0].positiveOpaqueInteriorIntervals.some(row=>
  row.solid==='yCylinder'&&row.positiveOpenRayParameterRange[1]>0));
 for(const p of r.points.slice(1)){
  assert.equal(p.rayStatus,'certified-no-finite-cylinder-ahead');
  assert.equal(p.radialExteriorForEveryPositiveRayParameterVerified,true);
  assert.equal(p.criticalPointWRayWithinTwoFiniteSolidsVerified,true);
 }
 assert.equal(r.certifiedOpaqueCriticalCount,1);
 assert.equal(r.certifiedClearCriticalCount,2);
 assert.equal(r.v5Authorized,false);
 assert.ok(r.points.every(p=>p.standardLineStyle==='undetermined'&&
  p.v5ActionAuthorized===false&&p.completeProjectedFeatureTopologyVerified===false));
});
test('true cap boundary refuses opaque inference from a lateral tangency',()=>{
 const s=input();s.yCylinder.yMax=12; // signY=+ at x=0 lies on axial Y cap
 const branchId=branchAt(s,0,b=>b.signY===1);
 const r=audit({input:s,revision:2,criticalPoints:[{branchId,x:0}]});
 assert.equal(r.points[0].currentM3SourceBranchVerified,true);
 assert.equal(r.points[0].rayStatus,'undetermined');
 assert.equal(r.points[0].positiveOpaqueInteriorIntervals.length,0);
 assert.equal(r.points[0].v5ActionAuthorized,false);
});
test('common X translation preserves independently recomputed critical W statuses',()=>{
 const s=input(),id=branchAt(s,0);
 const baseline=audit({input:s,revision:2,criticalPoints:[{branchId:id,x:0},
  {branchId:id,x:2},{branchId:id,x:4}]});
 const moved=input();moved.zCylinder.xCenter+=40;moved.yCylinder.xCenter+=40;
 const idMoved=branchAt(moved,40);
 const translated=audit({input:moved,revision:2,criticalPoints:[
  {branchId:idMoved,x:40},{branchId:idMoved,x:42},
  {branchId:idMoved,x:44}
 ]});
 assert.deepEqual(baseline.points.map(p=>p.rayStatus),
  translated.points.map(p=>p.rayStatus));
 assert.ok(translated.points.every(p=>p.v5ActionAuthorized===false));
});
test('joint C3 M3/M5 guard carries W critical theorem, without signing V5',()=>{
 const r=joint({input:input(),revision:8});
 const w=r.transitionGuards.filter(g=>g.view==='W'&&
  Number.isFinite(g.transitionX));
 assert.ok(w.length>0);
 assert.ok(w.every(g=>g.criticalPointWRayProof&&
  g.criticalPointWRayProof.branchId===g.branchId&&
  g.criticalPointWRayProof.x===g.transitionX));
 assert.ok(w.some(g=>g.criticalPointWRayProof.rayStatus===
  'certified-no-finite-cylinder-ahead'));
 assert.ok(w.every(g=>g.criticalPointWRayProof.v5ActionAuthorized===false&&
  g.standardLineStyle==='undetermined'&&
  g.endpointRayContinuityVerified===false));
 assert.equal(r.v5CurveReady,false);
});
test('empty or forged critical source never signs an official stroke',()=>{
 const s=input();s.zCylinder.zMin=40;s.zCylinder.zMax=60;
 const none=audit({input:s,revision:4,criticalPoints:[]});
 assert.equal(none.status,'not-covered');
 assert.equal(none.v5Authorized,false);
 const good=input(),id=branchAt(good,0);
 assert.throws(()=>audit({input:good,revision:4,
  criticalPoints:[{branchId:id,x:1000}]}),/outside verified M3 branch/);
});
