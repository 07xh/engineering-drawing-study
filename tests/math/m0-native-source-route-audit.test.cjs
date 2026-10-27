'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {audit,verifyNativeRoutes}=require('../../scripts/audit-m0-acceptance.cjs');
const manifest=JSON.parse(fs.readFileSync(
 'docs/architecture/m0-acceptance-inventory.json','utf8'));
test('machine-gated real M0 source routes reach the native photo and private-evidence UI',()=>{
 const r=audit();
 assert.equal(r.moduleCount,31);
 assert.equal(r.nativeRuntimeRoutes.length,8);
 const names=r.nativeRuntimeRoutes.map(x=>x.name);
 assert.deepEqual(names,[
  'photo-original-bytes-to-live-m3',
  'native-reviewed-pixel-mm-to-real-m3-entry',
  'photo-bytes-to-rehashable-private-evidence',
  'reviewed-3d-extreme-vertices-to-real-composition-scene',
  'reviewed-3d-original-rays-to-first-angle-scene',
  'reviewed-3d-face-joins-to-real-composition-scene',
  'reviewed-C1-original-source-to-sole-V5-gate',
  'finite-C3-M0-gradients-to-real-analytic-workbench'
 ]);
 for(const [i,route] of r.nativeRuntimeRoutes.entries()){
  assert.equal(route.consumerEntry,i<3?
   'labs/auto-fillet-live-entry.cjs':
   i<6?'project/unified-workbench-session.cjs':
   i===6?'workbench/reviewed-solid-vertex-v5.cjs':
   'labs/finite-cylinder-intersection-live-entry.cjs');
  assert.equal(route.staticImportChainConnected,true);
  assert.equal(route.executableEvidenceFilesPresent,true);
  assert.equal(route.currentSourceIndependentlyAuthenticated,false);
  assert.equal(route.fullM0ProofCertified,false);
 }
 const reviewed=r.entries.find(x=>x.path==='core/numeric/reviewed-pixel-frame.cjs');
 assert.equal(reviewed.status,'provisional');
 assert.ok(reviewed.transitiveRuntimeConsumers.includes(
  'labs/auto-fillet-live-entry.cjs'));
 const routes=[
  'm0-joint-visibility-partition.cjs',
  'projected-contour-topology.cjs',
  'm0-convex-vertex-completeness.cjs'
 ].map(name=>r.entries.find(x=>x.path==='core/numeric/'+name));
 for(const row of routes){
  assert.ok(row,'M0 numeric route absent');
  assert.ok(row.transitiveRuntimeConsumers.includes(
   'project/unified-workbench-session.cjs'));
 }
 assert.ok(routes[0].directRuntimeConsumers.includes(
  'workbench/m0-reviewed-scene-continuous-partitions.cjs'));
 assert.ok(routes[1].directRuntimeConsumers.includes(
  'workbench/m0-reviewed-face-ring-join-consumer.cjs'));
 const vectors=r.entries.find(x=>x.path==='core/numeric/object-vector3.cjs');
 assert.ok(vectors.transitiveRuntimeConsumers.includes(
  'labs/finite-cylinder-intersection-live-entry.cjs'));
 assert.ok(routes[0].transitiveRuntimeConsumers.includes(
  'workbench/reviewed-solid-vertex-v5.cjs'));
 assert.ok(r.nativeRuntimeRoutes.slice(3).every(x=>
  x.staticImportChainConnected&&x.executableEvidenceFilesPresent&&
  x.fullM0ProofCertified===false));
});
test('source route verification refuses a missing M0 import, including when evidence tests still exist',()=>{
 const list=manifest.nativeRuntimeRoutes;
 const by=file=>file==='labs/local-reviewed-dimension-draft-ui.cjs'?[]:
  list.flatMap(x=>x.chain.slice(1).map((f,i)=>[
   f,x.chain[i]])).filter(x=>x[0]===file).map(x=>x[1]);
 const exists=()=>true;
 assert.throws(()=>verifyNativeRoutes(list,by,exists),
  /native M0 route disconnected/);
});
test('a forged route cannot replace executable source or regression evidence with a status label',()=>{
 const list=manifest.nativeRuntimeRoutes.map(x=>({...x}));
 list[0]={...list[0],regressionTests:['tests/math/does-not-exist.test.cjs']};
 const imports=file=>list.flatMap(x=>x.chain.slice(1).map((f,i)=>[
  f,x.chain[i]])).filter(x=>x[0]===file).map(x=>x[1]);
 const exists=f=>!f.includes('does-not-exist');
 assert.throws(()=>verifyNativeRoutes(list,imports,exists),
  /missing native source regression/);
});
test('machine gate rejects duplicate names, nonexistent route source and omitted consumer chain',()=>{
 const original=manifest.nativeRuntimeRoutes;
 const lookup=file=>original.flatMap(x=>x.chain.slice(1).map((f,i)=>[
  f,x.chain[i]])).filter(x=>x[0]===file).map(x=>x[1]);
 const exists=file=>file!=='labs/nonexistent.cjs';
 assert.throws(()=>verifyNativeRoutes([...original,original[0]],lookup,exists),
  /invalid or duplicate/);
 assert.throws(()=>verifyNativeRoutes([{
  ...original[0],chain:['labs/nonexistent.cjs',...original[0].chain.slice(1)]
 }],lookup,exists),/missing native route source/);
 assert.throws(()=>verifyNativeRoutes([{
  ...original[0],chain:[original[0].chain[0]]
 }],lookup,exists),/invalid or duplicate/);
});
