'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const TOOL_DIR=path.resolve(__dirname,'../../tools');
const SHA='12ff96f3bbcb3fc71ca759dabec0c025b6bae594754f7913d2e1fc3d03509a5c';
const DXFSHA='a'.repeat(64);
const VISIBLE='gb-t-4457.4-continuous-wide-visible-outline';
const frame=()=>({originCad:[0,0],scaleMmPerCadUnit:1,uSign:1,vSign:1});
function source(){
 const originals=[{x:0,y:0,z:0},{x:2,y:1,z:0},
  {x:4,y:0,z:2},{x:6,y:3,z:1}];
 const entities={},given=[];
 const selected={V:[],H:[]};
 for(const [i,p] of originals.entries()){
  for(const view of ['V','H']){
   const handle=view+(i+1);
   given.push(handle);
   selected[view].push({handle,endpoint:'point'});
   entities[handle]={type:'POINT',layout:'Model',
    location:[p.x,view==='V'?p.z:p.y,0]};
  }
 }
 entities.LINE1={type:'LINE',layout:'Model',
  start:[0,0,0],end:[2,0,0]};
 return {
  source_sha256:SHA,dxf_sha256:DXFSHA,entities,
  partition:{status:'manually-partitioned-handle-inventories-only',
   givenHandles:given,referenceHandles:['LINE1']},
  review:{sourceSha256:SHA,convertedDxfSha256:DXFSHA,
   originalSourceAssumption:'all-extreme-vertices-of-one-closed-convex-solid',
   originalSourceAssumptionReviewed:true,
   givenViewVertices:selected,viewFrames:{V:frame(),H:frame()},
   referenceFrame:frame(),referenceStrokes:[{
    handle:'LINE1',style:VISIBLE
   }]}
 };
}
const script=[
 'import sys,json',
 'sys.path.insert(0,sys.argv[1])',
 'from c1_textbook_dxf_blind_packets import build_blind_packets',
 'from c1_textbook_dxf_blind_packets import write_isolated_packets',
 'from pathlib import Path',
 'data=json.load(sys.stdin)',
 'try:',
 ' given,answer=build_blind_packets(**data)',
 ' if len(sys.argv)>2:',
 '  write_isolated_packets(Path(sys.argv[2]),Path(sys.argv[3]),given,answer,[])',
 ' print(json.dumps({"status":"ok","given":given,"answer":answer}))',
 'except (ValueError,TypeError,OSError) as exc:',
 ' print(json.dumps({"status":"blocked","reason":str(exc)}))',
 ' sys.exit(2)'
].join('\n');
function call(data=source(),exportTo=[]){
 const child=spawnSync('python3',['-c',script,TOOL_DIR,...exportTo],
  {input:JSON.stringify(data),encoding:'utf8',timeout:15000});
 assert.equal(child.error,undefined);
 let result;try{result=JSON.parse(child.stdout.trim());}
 catch{throw new Error('Python source packet stdout invalid: '+child.stdout+' '+child.stderr);}
 return {result,code:child.status,stderr:child.stderr};
}
test('actual original-selected V/H CAD source point packets stay isolated from W answer vectors',()=>{
 const {result,code}=call();
 assert.equal(code,0);
 assert.equal(result.status,'ok');
 assert.deepEqual(Object.keys(result.given.views).sort(),['H','V']);
 assert.equal(result.given.views.V.length,4);
 assert.equal(result.given.views.H.length,4);
 assert.deepEqual(result.given.views.V[2],{u:4,v:2});
 assert.deepEqual(result.given.views.H[3],{u:6,v:3});
 assert.equal(result.given.missingView,'W');
 assert.equal(result.given.sourceIsNotYetConfirmedForProduction,true);
 assert.equal(result.given.textbookBlindSolveAccepted,false);
 assert.equal(result.given.referenceWasNotExportedAsSolverInput,true);
 assert.equal(JSON.stringify(result.given).includes('LINE1'),false);
 assert.equal(result.answer.referenceStrokes[0].originalReferenceHandle,'LINE1');
 assert.equal(result.answer.referenceStrokes[0].standardLineStyle,VISIBLE);
 assert.equal(result.answer.wasUsedAsM3Input,false);
 assert.equal(JSON.stringify(result.answer).includes('givenOriginalHandleEndpoints'),false);
});
test('original DXF answer handle is NEVER accepted in the solver given point selections',()=>{
 const data=source();
 data.review.givenViewVertices.V[0]={handle:'LINE1',endpoint:'start'};
 const {result,code}=call(data);
 assert.equal(code,2);
 assert.match(result.reason,/answer-leaking given vertex/);
});
test('changed DWG/DXF SHA or swapped answer-reference styles requires a new review',()=>{
 for(const kind of ['sourceSha256','convertedDxfSha256']){
  const data=source();
  data.review[kind]='0'.repeat(64);
  const {code,result}=call(data);
  assert.equal(code,2);assert.match(result.reason,/provenance mismatch/);
 }
 const invalid=source();
 invalid.review.referenceStrokes[0].style='not-an-engineering-line';
 assert.equal(call(invalid).code,2);
});
test('real DXF projection with nonplanar coords, duplicate source point or unassigned handles stays unsigned',()=>{
 const tilted=source();tilted.entities.V1.location[2]=3;
 assert.equal(call(tilted).code,2);
 const repeated=source();repeated.entities.V2.location=[0,0,0];
 const out=call(repeated);
 assert.equal(out.code,2);assert.match(out.result.reason,/duplicate/);
 const missing=source();missing.review.givenViewVertices.H.pop();
 assert.equal(call(missing).code,2);
 const extra=source();extra.partition.givenHandles.push('UNACCOUNTED');
 extra.entities.UNACCOUNTED={type:'POINT',layout:'Model',location:[2,2,0]};
 assert.equal(call(extra).code,2);
});
test('signed paper calibration is applied only to the source-selected actual CAD point',()=>{
 const data=source();data.review.viewFrames.V={
  originCad:[10,5],scaleMmPerCadUnit:2,uSign:-1,vSign:1};
 const {result,code}=call(data);
 assert.equal(code,0);
 assert.deepEqual(result.given.views.V[0],{u:20,v:-10});
 assert.equal(result.given.textbookBlindSolveAccepted,false);
});
test('two separate no-overwrite output files are created without reference leakage or source replacement',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c1-isolated-'));
 try{
  const given=path.join(dir,'given.json'),answer=path.join(dir,'private-answer.json');
  const first=call(source(),[given,answer]);
  assert.equal(first.code,0,first.stderr);
  const src=fs.readFileSync(given,'utf8');
  const ref=fs.readFileSync(answer,'utf8');
  assert(src.includes('givenOriginalHandleEndpoints'));
  assert(!src.includes('LINE1'));
  assert(ref.includes('LINE1'));
  assert(!ref.includes('givenOriginalHandleEndpoints'));
  const second=call(source(),[given,answer]);
  assert.equal(second.code,2,'must not silently overwrite previously reviewed DXF packets');
  assert.equal(fs.readFileSync(given,'utf8'),src);
  assert.equal(fs.readFileSync(answer,'utf8'),ref);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('original textbook converter CLI exposes only trusted convert+partition+separate packet route',()=>{
 const p=path.join(TOOL_DIR,'c1_textbook_dwg_evidence.py');
 const result=spawnSync('python3',[p,'--help'],
  {encoding:'utf8',timeout:15000});
 assert.equal(result.status,0,result.stderr);
 for(const arg of ['--partition','--mode','--review',
  '--given-packet','--reference-packet'])
  assert(result.stdout.includes(arg));
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c1-unsafe-'));
 try{
  const dwg=path.join(root,'图3-50 补画支架的左视图.dwg');
  fs.writeFileSync(dwg,'AC1018 fake source but trusted name');
  const fake=spawnSync('python3',[p,dwg,'--mode','convert',
   '--review',path.join(root,'review.json'),'--given-packet',path.join(root,'given.json'),
   '--reference-packet',path.join(root,'answer.json')],
   {encoding:'utf8',timeout:15000});
  assert.equal(fake.status,2);
  assert.match(fake.stderr,/original textbook file hash mismatch/);
  assert.equal(fs.existsSync(path.join(root,'given.json')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
