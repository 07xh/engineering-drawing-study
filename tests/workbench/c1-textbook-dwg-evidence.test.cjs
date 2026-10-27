'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const script=path.join(__dirname,'../../tools/c1_textbook_dwg_evidence.py');
function run(args){
 return spawnSync('python3',[script,...args],{encoding:'utf8',timeout:20000});
}
test('authentic original textbook DWG hash is mandatory; renamed fake DWG fails',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c1-dwg-gate-'));
 try{
  const p=path.join(root,'图3-50 补画支架的左视图.dwg');
  fs.writeFileSync(p,'AC1018\0fake cad source');
  const r=run([p,'--mode','probe']);
  assert.equal(r.status,2);
  assert.match(r.stderr,/original textbook file hash mismatch/);
  assert.match(r.stderr,/blindIndependentTextbookTestPassed/);
  assert.equal(fs.readdirSync(root).length,1,'input must not be overwritten');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('no arbitrary DWG or solver answer is allowed into textbook corpus',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c1-dwg-negative-'));
 try{
  const p=path.join(root,'renamed-solution.dwg');
  fs.writeFileSync(p,'AC1018\0not textbook');
  const r=run([p,'--mode','probe']);
  assert.equal(r.status,2);
  assert.match(r.stderr,/not an identified original C1 textbook DWG/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('original reference handle partition refuses answer leakage',()=>{
 const snippet=[
  'import importlib.util,json,pathlib,sys',
  'spec=importlib.util.spec_from_file_location("gate",sys.argv[1])',
  'm=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)',
  'records=[{"handle":"1"},{"handle":"2"}]',
  'partition=pathlib.Path(sys.argv[2])',
  'try:',
  ' m.partition_reference({},records,"testsha",partition)',
  'except ValueError as exc:',
  ' print(str(exc));sys.exit(0)',
  'sys.exit(3)'
 ].join('\n');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c1-partition-'));
 try{
  const f=path.join(root,'partition.json');
  fs.writeFileSync(f,JSON.stringify({sourceSha256:'testsha',
   givenHandles:['1'],referenceHandles:['1','2']}));
  const r=spawnSync('python3',['-c',snippet,script,f],
   {encoding:'utf8',timeout:20000});
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/may never leak/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
