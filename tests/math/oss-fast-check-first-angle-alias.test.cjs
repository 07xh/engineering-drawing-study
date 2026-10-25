'use strict';
// OSS fast-check is development-only: independent cross-view alias counterexamples.
// This test does not certify topology, visibility, M2 uniqueness or official V5 lines.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fc=require('fast-check');
const {project}=require('../../core/projection/conventions.js');
const {deriveGeometryScene}=require('../../core/projection/geometry-scene-views.cjs');
const coord=fc.integer({min:-10000,max:10000});
const p=(id,x,y,z)=>({id,kind:'point',space:'model-3d',unit:'mm',data:{x,y,z}});
const snapshot=(geometry,revision=91)=>deriveGeometryScene({
 revision,resultId:'ossAliasOracle',branchId:'candidateA',geometry
});
test('OSS property: identical V paper coordinates do not merge distinct XYZ sources',()=>{
 fc.assert(fc.property(coord,coord,coord,fc.integer({min:1,max:100}),
  (x,y,z,dy)=>{
   const a={x,y,z},b={x,y:y+dy,z};
   const av=project(a),bv=project(b);
   assert.deepEqual(av.V,bv.V);
   assert.notDeepEqual(av.H,bv.H);
   assert.notDeepEqual(av.W,bv.W);
   const scene=snapshot([p('A',x,y,z),p('B',x,y+dy,z)]);
   assert.equal(scene.objects.length,2);
   assert.notEqual(scene.objects[0].id,scene.objects[1].id);
   assert.equal(scene.evidence.math,'requires-canonical-solve-result');
   assert.equal(scene.evidence.v5,'requires-verified-construction-intent');
  }),{seed:20261025,numRuns:250});
});
test('OSS property: a source revision changes scene revision without inheriting V5 qualification',()=>{
 fc.assert(fc.property(coord,coord,coord,(x,y,z)=>{
  const geometry=[p('A',x,y,z)];
  const old=snapshot(geometry,91),updated=snapshot(geometry,92);
  assert.equal(old.revision,91);
  assert.equal(updated.revision,92);
  assert.equal(updated.evidence.v5,'requires-verified-construction-intent');
  assert.deepEqual(old.objects[0].representations.V,updated.objects[0].representations.V);
 }),{seed:20261025,numRuns:150});
});
