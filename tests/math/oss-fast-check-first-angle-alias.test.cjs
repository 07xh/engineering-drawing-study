'use strict';
// Dependency-free deterministic property counterexamples for first-angle aliases.
// This test does not certify topology, visibility, M2 uniqueness or official V5 lines.
const {test}=require('node:test');
const assert=require('node:assert/strict');
// Core-math CI intentionally runs without npm install; keep this oracle self-contained.
function checkCases(fn,count){let s=20261025;const next=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s;};for(let i=0;i<count;i++)fn(next()%20001-10000,next()%20001-10000,next()%20001-10000,next()%100+1);}
const {project}=require('../../core/projection/conventions.js');
const {deriveGeometryScene}=require('../../core/projection/geometry-scene-views.cjs');
const p=(id,x,y,z)=>({id,kind:'point',space:'model-3d',unit:'mm',data:{x,y,z}});
const snapshot=(geometry,revision=91)=>deriveGeometryScene({
 revision,resultId:'ossAliasOracle',branchId:'candidateA',geometry
});
test('OSS property: identical V paper coordinates do not merge distinct XYZ sources',()=>{
 checkCases((x,y,z,dy)=>{
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
  },250);
});
test('OSS property: a source revision changes scene revision without inheriting V5 qualification',()=>{
 checkCases((x,y,z)=>{
  const geometry=[p('A',x,y,z)];
  const old=snapshot(geometry,91),updated=snapshot(geometry,92);
  assert.equal(old.revision,91);
  assert.equal(updated.revision,92);
  assert.equal(updated.evidence.v5,'requires-verified-construction-intent');
  assert.deepEqual(old.objects[0].representations.V,updated.objects[0].representations.V);
 },150);
});
