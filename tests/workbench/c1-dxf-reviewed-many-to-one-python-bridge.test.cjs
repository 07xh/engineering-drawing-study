'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const {reconstructC1FromDxfGiven}=
 require('../../workbench/c1-authenticated-dxf-to-reviewed-v5.cjs');
const SHA='12ff96f3bbcb3fc71ca759dabec0c025b6bae594754f7913d2e1fc3d03509a5c';
const DXF='b'.repeat(64);
const CUBE=[];
for(const x of [-2,3])for(const y of [-3,4])for(const z of [0,5])
 CUBE.push({x,y,z});
const views={H:[],V:[]},entities={};
for(const view of ['H','V']){
 for(const p of CUBE){
  const uv={x:p.x,y:view==='H'?p.y:p.z};
  if(views[view].some(q=>q.x===uv.x&&q.y===uv.y))continue;
  const id=view+(views[view].length+1);
  views[view].push(uv);
  entities[id]={type:'POINT',layout:'Model',location:[uv.x,uv.y,0]};
 }
}
const pairs=CUBE.map(p=>({
 firstIndex:views.H.findIndex(q=>q.x===p.x&&q.y===p.y),
 secondIndex:views.V.findIndex(q=>q.x===p.x&&q.y===p.z)
}));
entities.REF1={type:'LINE',layout:'Model',
 start:[0,0,0],end:[1,1,0]};
function payload(){
 const givenHandles=Object.keys(entities).filter(x=>x!=='REF1');
 return {
  source_sha256:SHA,dxf_sha256:DXF,
  entities:structuredClone(entities),
  partition:{status:'manually-partitioned-handle-inventories-only',
   givenHandles,referenceHandles:['REF1']},
  review:{
   sourceSha256:SHA,convertedDxfSha256:DXF,
   originalSourceAssumption:'all-extreme-vertices-of-one-closed-convex-solid',
   originalSourceAssumptionReviewed:true,
   givenViewVertices:Object.fromEntries(['H','V'].map(v=>[v,
    views[v].map((_,i)=>({handle:v+(i+1),endpoint:'point'}))])),
   viewFrames:{
    H:{originCad:[0,0],scaleMmPerCadUnit:1,uSign:1,vSign:1},
    V:{originCad:[0,0],scaleMmPerCadUnit:1,uSign:1,vSign:1}
   },referenceFrame:{originCad:[0,0],scaleMmPerCadUnit:1,uSign:1,vSign:1},
   referenceStrokes:[{handle:'REF1',
    style:'gb-t-4457.4-continuous-wide-visible-outline'}],
   reviewedCorrespondences:structuredClone(pairs)
  }
 };
}
const python=[
 'import sys,json',
 'sys.path.insert(0,sys.argv[1])',
 'from c1_textbook_dxf_blind_packets import build_blind_packets,write_isolated_packets',
 'from pathlib import Path',
 'x=json.load(sys.stdin)',
 'try:',
 ' given,private=build_blind_packets(**x)',
 ' if len(sys.argv)>2:',
 '  write_isolated_packets(Path(sys.argv[2]),Path(sys.argv[3]),given,private,[])',
 ' print(json.dumps({"status":"ok","given":given,"private":private}))',
 'except (TypeError,ValueError,OSError) as e:',
 ' print(json.dumps({"status":"blocked","reason":str(e)}));sys.exit(2)'
].join('\n');
function run(x=payload(),paths=[]){
 const result=spawnSync('python3',['-c',python,
  path.resolve(__dirname,'../../tools'),...paths],{
  input:JSON.stringify(x),encoding:'utf8',timeout:20000
 });
 assert.equal(result.error,undefined);
 return {status:result.status,response:JSON.parse(result.stdout),
  stderr:result.stderr};
}
test('Python genuine CAD entity selections preserve all 8 reviewed 3D corners from just four paper vertices and isolate answer',async()=>{
 const {status,response}=run();
 assert.equal(status,0,response.reason);
 assert.equal(response.given.reviewedCorrespondences.length,8);
 assert.equal(response.given.views.H.length,4);
 assert.equal(response.given.views.V.length,4);
 assert.equal(JSON.stringify(response.given).includes('REF1'),false);
 assert.equal(response.private.referenceStrokes[0].originalReferenceHandle,'REF1');
 const candidate=await reconstructC1FromDxfGiven({
  givenPacket:response.given,revision:3,geometryId:'CADBox'});
 assert.equal(candidate.inferred.independentlyValidatedByCurrentM0,true);
 assert.equal(candidate.inferred.candidateGeometry.data.edges.length,12);
 assert.equal(candidate.inferred.realTextbookBlindTestPassed,false);
});
test('Python refuses duplicate original 3D matching pairs, orphan CAD paper points, missing hash, and answer leakage',()=>{
 const dup=payload();
 dup.review.reviewedCorrespondences[1]=structuredClone(
  dup.review.reviewedCorrespondences[0]);
 assert.equal(run(dup).status,2);
 const orphan=payload();orphan.review.reviewedCorrespondences=
  orphan.review.reviewedCorrespondences.filter(x=>x.firstIndex!==3);
 assert.equal(run(orphan).status,2);
 const changed=payload();changed.review.convertedDxfSha256='0'.repeat(64);
 assert.equal(run(changed).status,2);
 const leak=payload();leak.review.givenViewVertices.V[0]={
  handle:'REF1',endpoint:'start'};
 assert.equal(run(leak).status,2);
});
test('Python writes strictly separate no-overwrite files; private answer never enters given packet',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c1-real-box-'));
 try{
  const p=[path.join(root,'given.json'),path.join(root,'private.json')];
  const first=run(payload(),p);assert.equal(first.status,0,first.stderr);
  const src=fs.readFileSync(p[0],'utf8'),
   dst=fs.readFileSync(p[1],'utf8');
  assert.equal(src.includes('REF1'),false);
  assert.equal(dst.includes('REF1'),true);
  const second=run(payload(),p);assert.equal(second.status,2);
  assert.equal(fs.readFileSync(p[0],'utf8'),src);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
