'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const {project}=require('../../core/projection/conventions.js');
const model=()=>({
 kind:'finite-orthogonal-cylinder-intersection',unit:'mm',sourceConfirmed:true,
 zCylinder:{radius:10,xCenter:0,yCenter:0,zMin:-15,zMax:15},
 yCylinder:{radius:6,xCenter:0,zCenter:0,yMin:-15,yMax:15}
});
const run=(input=model(),revision=11)=>evaluateUnifiedMath({
 kind:'finite-orthogonal-cylinder-intersection',input,revision});
const almost=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,a+' should equal '+b);
function verify(branch,input){
 const Z=input.zCylinder,Y=input.yCylinder;
 for(const w of branch.witnesses){
  const p=w.point;
  almost((p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2,Z.radius**2,1e-7);
  almost((p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2,Y.radius**2,1e-7);
  assert.ok(p.z>=Z.zMin-1e-7&&p.z<=Z.zMax+1e-7);
  assert.ok(p.y>=Y.yMin-1e-7&&p.y<=Y.yMax+1e-7);
  assert.deepEqual(w.projections,project(p));
 }
}
test('C3 two untrimmed finite axes: four exact lateral sign branches, never V5',()=>{
 const input=model(),r=run(input);
 assert.equal(r.status,'scoped-analytic-ready');
 assert.equal(r.branchCount,4);
 assert.equal(r.scope,'finite-lateral-lateral-only');
 assert.equal(r.analyticallyCompleteWithinScope,true);
 assert.equal(r.verifiedCapClipping,true);
 assert.equal(r.geometryVerifiedWithinSpecialistScope,true);
 assert.equal(r.verifiedVisibility,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.v5Ready,false);
 assert.equal(r.constructionIntents.length,0);
 assert.equal(r.steps.length,0);
 assert.equal(r.junctionCandidates.every(x=>x.globalTopologyVerified===false),true);
 assert.equal(r.projectionWitnessCount,12);
 for(const b of r.branches){
  assert.deepEqual(b.xRange,[-6,6]);
  assert.equal(b.vertexJunctionTopologyVerified,false);
  assert.equal(b.officialLineStyle,'undetermined');
  verify(b,input);
 }
 assert.ok(Object.isFrozen(r.branches));
});
test('C3 one-sided caps select exactly one sign pair and classify four x support ends',()=>{
 const input=model();
 input.yCylinder.yMin=0;input.yCylinder.yMax=11;
 input.zCylinder.zMin=0;input.zCylinder.zMax=7;
 const r=run(input);
 assert.equal(r.status,'scoped-analytic-ready');
 assert.equal(r.branchCount,1);
 assert.equal(r.branches[0].signY,1);
 assert.equal(r.branches[0].signZ,1);
 assert.equal(r.branches[0].endpoints.length,2);
 verify(r.branches[0],input);
});
test('C3 axial cap genuinely clips complete analytic branch at derived roots',()=>{
 const input=model();
 input.yCylinder.yMin=9;input.yCylinder.yMax=11;
 input.zCylinder.zMin=-15;input.zCylinder.zMax=15;
 const r=run(input);
 assert.equal(r.branchCount,2);
 const limit=Math.sqrt(100-81);
 for(const b of r.branches){
  almost(b.xRange[0],-limit);almost(b.xRange[1],limit);
  assert.equal(b.signY,1);
  assert.equal(b.endpoints[0].events.yCylinderCap,true);
  assert.equal(b.endpoints[1].events.yCylinderCap,true);
  verify(b,input);
 }
});
test('C3 far-side caps split a branch into two disconnected x arcs',()=>{
 const input=model();
 input.zCylinder.zMin=0;input.zCylinder.zMax=3;
 input.yCylinder.yMin=0;input.yCylinder.yMax=20;
 const r=run(input);
 assert.equal(r.status,'scoped-analytic-ready');
 assert.equal(r.branchCount,2);
 const root=Math.sqrt(36-9);
 for(const b of r.branches){
  assert.equal(b.signY,1);assert.equal(b.signZ,1);
  assert.ok(b.xRange[1]<=-root+1e-8||b.xRange[0]>=root-1e-8);
  verify(b,input);
 }
});
test('C3 general unequal, translated, X-offset cylinder axes preserve both implicit equations',()=>{
 const input=model();
 input.zCylinder.xCenter=3;input.zCylinder.yCenter=-7;
 input.yCylinder.xCenter=-2;input.yCylinder.zCenter=15;
 input.zCylinder.radius=8;input.yCylinder.radius=6;
 input.yCylinder.yMin=-30;input.yCylinder.yMax=30;
 input.zCylinder.zMin=-30;input.zCylinder.zMax=30;
 const r=run(input);
 assert.equal(r.status,'scoped-analytic-ready');
 assert.equal(r.branchCount,4);
 for(const b of r.branches){
  almost(b.xRange[0],-5);almost(b.xRange[1],4);
  verify(b,input);
 }
});
test('C3 no radial overlap is mathematically empty; radial/cap singular cases fail closed',()=>{
 const input=model();input.yCylinder.xCenter=30;
 const absent=run(input);
 assert.equal(absent.status,'none');assert.equal(absent.branchCount,0);
 assert.equal(absent.v5Ready,false);
 const touch=model();touch.yCylinder.xCenter=16;
 assert.equal(run(touch).status,'degenerate-undetermined');
 const capPoint=model();capPoint.yCylinder.yMin=10;capPoint.yCylinder.yMax=11;
 assert.equal(run(capPoint).status,'degenerate-undetermined');
});
test('C3 both finite axial caps can eliminate all lateral intersections',()=>{
 const input=model();
 input.yCylinder.yMin=9;input.yCylinder.yMax=10;
 input.zCylinder.zMin=0;input.zCylinder.zMax=3;
 const r=run(input);
 assert.equal(r.status,'none');
 assert.equal(r.analyticallyCompleteWithinScope,true);
 assert.equal(r.branchCount,0);
});
test('C3 rejects fake source proof, unsupported units, stale or invalid analytic branches',()=>{
 const input=model();input.sourceConfirmed=false;
 assert.throws(()=>run(input),/confirmed/);
 const unit=model();unit.unit='pixels';
 assert.throws(()=>run(unit),/confirmed/);
 const injected=model();injected.v5Ready=true;
 assert.throws(()=>run(injected),/confirmed/);
 const radius=model();radius.zCylinder.radius=-1;
 assert.throws(()=>run(radius),/bounded/);
 const reversed=model();reversed.zCylinder.zMax=reversed.zCylinder.zMin;
 assert.throws(()=>run(reversed),/positive finite axial length/);
 const extra=model();extra.yCylinder.knownHiddenLine=true;
 assert.throws(()=>run(extra),/bounded/);
 assert.throws(()=>run(model(),-1),/revision/);
 assert.throws(()=>evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input:model(),
  revision:3,sheet:{origin:{x:0,y:0},scale:3}}),/model-mm input/);
 assert.throws(()=>evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input:model(),
  revision:3,visibilityReview:{verified:true}}),/spatial view rays|model-mm input/);
});
