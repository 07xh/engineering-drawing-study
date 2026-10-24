'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {compileFiniteCylinderEndpointV5}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {assertM3ToV5Consistency}=require('../../workbench/m3-v5-consistency-gate.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');
const sheetTransform={origin:{x:340,y:200},scale:3};
function model(){
 return {kind:'finite-orthogonal-cylinder-intersection',unit:'mm',
  sourceConfirmed:true,
  zCylinder:{radius:10,xCenter:0,yCenter:0,zMin:-12,zMax:12},
  yCylinder:{radius:6,xCenter:0,zCenter:0,yMin:-12,yMax:12}};
}
const compile=(input=model(),revision=5)=>compileFiniteCylinderEndpointV5({
 input,revision,sheetTransform});
test('C3 analytic M3 endpoint V/H/W point Intents are real original V5, not certified curves',()=>{
 const x=compile();
 assert.equal(x.status,'analytic-endpoint-point-actions-only');
 assert.equal(x.sourceM3.status,'scoped-analytic-ready');
 assert.equal(x.sourceM3.branchCount,4);
 assert.equal(x.independentlyProvenEndpointCount,8);
 assert.equal(x.signedEndpointPointActionCount,24);
 assert.equal(x.constructionIntents.length,24);
 assert.equal(x.constructionSteps.length,24);
 assert.equal(x.singleOriginalV5Player,true);
 assert.equal(x.endpointPointV5Ready,true);
 assert.equal(x.branchJunctionsVerified,false);
 assert.equal(x.entireCurveV5Ready,false);
 assert.equal(x.standardVisibleHiddenLineStylesVerified,false);
 assert.equal(x.canExportCertifiedDrawing,false);
 assert.equal(new Set(x.constructionIntents.map(i=>i.id)).size,24);
 assert.equal(new Set(x.bindings.map(b=>b.id)).size,24);
 assertM3ToV5Consistency({revision:5,intents:x.constructionIntents,
  steps:x.constructionSteps,timing:x.timing,sheet:sheetTransform});
 for(const b of x.bindings){
  assert.deepEqual(b.projectedMm,project(b.point3D)[b.view]);
  assert.deepEqual(b.sheetPoint,
   toSheet(b.view,b.projectedMm,sheetTransform));
  const a=x.constructionSteps.flatMap(s=>s.actions).find(a=>a.id===b.id);
  assert.equal(a.kind,'point');
  assert.deepEqual(a.geometry.center,b.sheetPoint);
  assert.equal(b.physicalJunctionTopologyVerified,false);
 }
 assert.equal(x.player.canRender(5),true);
 x.player.seekStep(24,0);
 assert.equal(x.player.snapshot(0).done,true);
 x.player.invalidate(6,0);
 assert.equal(x.player.canRender(5),false);
});
test('C3 nontrivial finite caps preserve exact endpoint-to-action provenance',()=>{
 const input=model();
 input.yCylinder.yMin=9;
 input.yCylinder.yMax=11;
 const x=compile(input,7);
 assert.equal(x.sourceM3.branchCount,2);
 assert.equal(x.independentlyProvenEndpointCount,4);
 assert.equal(x.signedEndpointPointActionCount,12);
 assert.ok(x.bindings.some(b=>b.point3D.y===9||
  Math.abs(b.point3D.y-9)<1e-8));
 assert.ok(x.bindings.every(b=>b.analyticEndpointPointVerified));
 assert.equal(x.entireCurveV5Ready,false);
});
test('C3 empty and isolated tangent branches do not acquire fabricated V5 point Intents',()=>{
 const none=model();none.yCylinder.xCenter=30;
 assert.throws(()=>compile(none),/endpoint proof unavailable/);
 const tangent=model();tangent.yCylinder.xCenter=16;
 assert.throws(()=>compile(tangent),/endpoint proof unavailable/);
 const capTangency=model();
 capTangency.yCylinder.yMin=10;
 capTangency.yCylinder.yMax=11;
 assert.throws(()=>compile(capTangency),/endpoint proof unavailable/);
});
test('C3 source version, spoofed radius and invalid user confirmation fail before binding',()=>{
 const a=model();a.sourceConfirmed=false;
 assert.throws(()=>compile(a),/confirmed/);
 const b=model();b.unit='px';
 assert.throws(()=>compile(b),/confirmed/);
 const c=model();c.officialV5Approved=true;
 assert.throws(()=>compile(c),/confirmed/);
 assert.throws(()=>compile(model(),-1),/revision|source/);
 assert.throws(()=>compileFiniteCylinderEndpointV5({
  input:model(),revision:4,sheetTransform:{origin:{x:0,y:0},scale:Infinity}
 }),/bounded shared V5/);
});
test('C3 line-style tampering or missing point actions cannot pass source→Intent→DAG→V5 parity',()=>{
 const x=compile();
 const steps=x.constructionSteps.map(s=>({...s,
  actions:s.actions.map(a=>({...a}))}));
 const first=steps[0].actions[0];
 first.geometry={center:{x:345,y:-900},radius:4};
 assert.throws(()=>assertM3ToV5Consistency({
  revision:5,intents:x.constructionIntents,steps,
  timing:x.timing,sheet:sheetTransform}),/geometry differs/);
 assert.ok(x.constructionSteps.every(s=>s.actions.every(a=>a.kind==='point')));
});
