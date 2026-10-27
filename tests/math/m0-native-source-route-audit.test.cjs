'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {audit,verifyNativeRoutes}=require('../../scripts/audit-m0-acceptance.cjs');
const manifest=JSON.parse(fs.readFileSync(
 'docs/architecture/m0-acceptance-inventory.json','utf8'));
test('machine-gated real M0 source routes reach the native photo and private-evidence UI',()=>{
 const r=audit();
 assert.equal(r.moduleCount,31);
 assert.equal(r.nativeRuntimeRoutes.length,3);
 const names=r.nativeRuntimeRoutes.map(x=>x.name);
 assert.deepEqual(names,[
  'photo-original-bytes-to-live-m3',
  'native-reviewed-pixel-mm-to-real-m3-entry',
  'photo-bytes-to-rehashable-private-evidence'
 ]);
 for(const route of r.nativeRuntimeRoutes){
  assert.equal(route.consumerEntry,'labs/auto-fillet-live-entry.cjs');
  assert.equal(route.staticImportChainConnected,true);
  assert.equal(route.executableEvidenceFilesPresent,true);
  assert.equal(route.currentSourceIndependentlyAuthenticated,false);
  assert.equal(route.fullM0ProofCertified,false);
 }
 const reviewed=r.entries.find(x=>x.path==='core/numeric/reviewed-pixel-frame.cjs');
 assert.equal(reviewed.status,'provisional');
 assert.ok(reviewed.transitiveRuntimeConsumers.includes(
  'labs/auto-fillet-live-entry.cjs'));
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
