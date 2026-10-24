'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {audit}=require('../../scripts/audit-m0-acceptance.cjs');
const by=(r,id)=>r.entries.find(x=>x.path==='core/numeric/'+id+'.cjs');
test('complete M0 API inventory has explicit scoped tests and real unresolved gates',()=>{
 const r=audit();
 assert.equal(r.moduleCount,20);
 assert.equal(r.entries.length,20);
 assert.equal(r.statuses.provisional,1);
 assert.equal(r.statuses['consumer-pending'],3);
 assert.ok(r.entries.every(x=>x.proofScope&&x.remainingGate&&x.regressionTests.length));
 assert.match(r.warning,/not executable paths/);
});
test('three real spatial solver sources consume existing object-vector M0 bridge',()=>{
 const r=audit(),bridge=by(r,'object-vector3');
 for(const spec of [
  'engines/spatial/sections/axis-cylinder-plane.cjs',
  'engines/spatial/sections/rectangular-prism-plane.cjs',
  'engines/spatial/sections/rectangular-pyramid-plane.cjs'
 ])assert.ok(bridge.directRuntimeConsumers.includes(spec),spec);
 const kernel=by(r,'euclidean-kernel');
 assert.ok(kernel.directRuntimeConsumers.includes('core/numeric/object-vector3.cjs'));
 for(const spec of bridge.directRuntimeConsumers.filter(x=>x.startsWith('engines/')))
  assert.ok(kernel.transitiveRuntimeConsumers.includes(spec));
});
test('opt-in M2 numerical diagnostics are not falsely certified as solver-integrated',()=>{
 const r=audit();
 for(const id of ['dimensionless-jacobian','jacobian-rank-evidence','residual-evidence']){
  assert.equal(by(r,id).status,'consumer-pending');
  assert.ok(by(r,id).remainingGate);
 }
 assert.equal(by(r,'reviewed-pixel-frame').status,'provisional');
});
test('ray and projected-edge primitives retain independent missing scene/endpoint proofs',()=>{
 const r=audit();
 for(const id of ['convex-ray-depth','convex-point-ray-clearance',
  'convex-segment-clearance','convex-segment-occlusion','projected-edge-depth-events']){
  assert.match(by(r,id).remainingGate,/scene|occluder|revision|endpoint|contour/);
 }
});
