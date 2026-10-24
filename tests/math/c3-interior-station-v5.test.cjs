'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {compileFiniteCylinderEndpointV5:compile}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {assertM3ToV5Consistency}=
 require('../../workbench/m3-v5-consistency-gate.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');
const input=()=>({
 kind:'finite-orthogonal-cylinder-intersection',sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}
});
const sheet=()=>({origin:{x:350,y:280},scale:4});
test('C3 existing endpoint-only canonical V5 behavior remains the default',()=>{
 const r=compile({input:input(),revision:8,sheetTransform:sheet()});
 assert.equal(r.status,'analytic-endpoint-point-actions-only');
 assert.equal(r.verifiedInteriorStationCount,0);
 assert.equal(r.signedInteriorAuxiliaryPointActionCount,0);
 assert.equal(r.interiorStationPointV5Ready,false);
 assert.equal(r.signedEndpointPointActionCount,r.bindings.length);
 assert.ok(r.bindings.every(b=>b.analyticEndpointPointVerified===true&&
  b.analyticInteriorStationVerified===false));
 assert.equal(r.entireCurveV5Ready,false);
 assert.equal(r.standardVisibleHiddenLineStylesVerified,false);
});
test('C3 actual analytic interior auxiliary points traverse the same canonical Intent DAG and V5',()=>{
 const revision=9,t=sheet(),r=compile({
  input:input(),revision,sheetTransform:t,stationCountPerBranch:2
 });
 const n=r.sourceM3.branchCount;
 assert.ok(n>0);
 assert.equal(r.verifiedInteriorStationCount,n*2);
 assert.equal(r.signedEndpointPointActionCount,n*2*3);
 assert.equal(r.signedInteriorAuxiliaryPointActionCount,n*2*3);
 assert.equal(r.bindings.length,n*4*3);
 assert.equal(r.constructionIntents.length,r.bindings.length);
 assert.equal(r.constructionSteps.length,r.bindings.length);
 assert.equal(r.timing.segments.length,r.bindings.length);
 assert.equal(r.singleOriginalV5Player,true);
 assert.equal(r.interiorStationPointV5Ready,true);
 assert.equal(r.player.canRender(revision),true);
 assert.equal(assertM3ToV5Consistency({
  revision,intents:r.constructionIntents,
  steps:r.constructionSteps,timing:r.timing,sheet:t
 }),true);
 const stations=r.bindings.filter(b=>b.analyticInteriorStationVerified);
 assert.equal(stations.length,n*2*3);
 for(const b of stations){
  const p=b.point3D,src=input(),Z=src.zCylinder,Y=src.yCylinder;
  const zResidual=(p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2-Z.radius**2;
  const yResidual=(p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2-Y.radius**2;
  assert.ok(Math.abs(zResidual)/Z.radius**2<=1e-9);
  assert.ok(Math.abs(yResidual)/Y.radius**2<=1e-9);
  assert.ok(p.y>Y.yMin&&p.y<Y.yMax);
  assert.ok(p.z>Z.zMin&&p.z<Z.zMax);
  assert.deepEqual(b.projectedMm,project(p)[b.view]);
  assert.deepEqual(b.sheetPoint,toSheet(b.view,b.projectedMm,t));
  assert.ok(b.sourceBranchParameterX===p.x);
  assert.equal(b.analyticEndpointPointVerified,false);
  assert.equal(b.standardLineStyleVerified,false);
 }
 assert.ok(r.constructionIntents.filter(i=>
  i.purpose==='construct-verified-analytic-branch-interior-point'
 ).length===n*2*3);
 assert.ok(r.constructionSteps.every(s=>s.actions.every(a=>a.kind==='point')));
 assert.equal(r.entireCurveV5Ready,false);
 assert.equal(r.canExportCertifiedDrawing,false);
 r.player.invalidate(revision+1,0);
 assert.equal(r.player.canRender(revision),false);
});
test('C3 interior stations require explicit safe count, current M3 and finite caps',()=>{
 for(const count of [-1,3,0.5,'2',null,Infinity]){
  assert.throws(()=>compile({input:input(),revision:1,
   sheetTransform:sheet(),stationCountPerBranch:count}),
   /interior stations per branch/);
 }
 const s=input();
 s.zCylinder.zMin=30;s.zCylinder.zMax=40;
 assert.throws(()=>compile({input:s,revision:3,
  sheetTransform:sheet(),stationCountPerBranch:1}),
  /endpoint proof unavailable/);
});
test('C3 source revision and axis translations recompute rather than reuse old stations',()=>{
 const src=input(),shift=input();
 shift.zCylinder.xCenter+=40;shift.yCylinder.xCenter+=40;
 shift.zCylinder.yCenter+=17;shift.yCylinder.yMin+=17;shift.yCylinder.yMax+=17;
 shift.yCylinder.zCenter-=5;shift.zCylinder.zMin-=5;shift.zCylinder.zMax-=5;
 const a=compile({input:src,revision:1,sheetTransform:sheet(),
  stationCountPerBranch:1});
 const b=compile({input:shift,revision:2,sheetTransform:sheet(),
  stationCountPerBranch:1});
 const choose=r=>r.bindings.filter(x=>x.analyticInteriorStationVerified&&
  x.view==='W');
 const A=choose(a),B=choose(b);
 assert.equal(A.length,B.length);
 for(let i=0;i<A.length;i++){
  assert.equal(B[i].point3D.x-A[i].point3D.x,40);
  assert.ok(Math.abs(B[i].point3D.y-A[i].point3D.y-17)<1e-8);
  assert.ok(Math.abs(B[i].point3D.z-A[i].point3D.z+5)<1e-8);
 }
 assert.ok(b.constructionIntents.every(i=>i.source.revision===2));
 assert.equal(b.standardVisibleHiddenLineStylesVerified,false);
});
