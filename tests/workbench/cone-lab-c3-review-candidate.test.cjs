'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Bridge=require('../../labs/cone-lab/model-bridge.js');
const {c3CandidateFromConeLab,SCHEMA}=
 require('../../project/cone-lab-c3-review-candidate.cjs');
const {KEYS,makeReviewedC3Input}=
 require('../../project/c3-reviewed-input.cjs');
const part=(type,values={})=>({
 k:'cyl',type,ang:0,x:0,y:0,z:0,r:9,h:30,on:true,open:true,
 ...values
});
const saved=parts=>JSON.stringify(Bridge.documentFromState({
 shape:'lab',flipped:false,parts,faces:[],cyls:[],pickSel:{}
}));
test('source +Y and +Z exact orthogonal cylinders fill existing C3 values without math authorization',()=>{
 const vertical=part('horiz',{_id:100,x:2,y:5,z:7,r:10,h:40});
 const front=part('frontal',{_id:101,x:-4,y:3,z:12,r:8,h:30});
 const result=c3CandidateFromConeLab(saved([vertical,front]));
 assert.equal(result.schema,SCHEMA);
 assert.equal(result.status,'requires-human-review');
 assert.deepEqual(result.sourcePartIds,['ConePartSrc_100','ConePartSrc_101']);
 assert.deepEqual(result.dimensions,{
  zRadius:10,zX:2,zY:-7,zMin:-15,zMax:25,
  yRadius:8,yX:-4,yZ:3,yMin:-27,yMax:3
 });
 assert.deepEqual(Object.keys(result.dimensions).sort(),[...KEYS].sort());
 assert.equal(result.axesConfirmed,false);
 assert.equal(result.capsConfirmed,false);
 assert.equal(result.solidOperation,null);
 assert.equal(result.canSolve,false);
 assert.equal(result.canPlayV5,false);
 assert.equal(result.verification,'unverified-preview');
 assert.equal(Object.prototype.hasOwnProperty.call(result,'sourceConfirmed'),false);
 // The existing solver may only receive the data after user confirmation;
 // this explicit test call validates numeric ranges, not user acceptance.
 const reviewed=makeReviewedC3Input(result.dimensions);
 assert.equal(reviewed.kind,'finite-orthogonal-cylinder-intersection');
 assert.equal(reviewed.zCylinder.zMax,25);
 assert.equal(reviewed.yCylinder.yMin,-27);
});
test('part order is not used to assign fixed Y/Z cylinder meaning',()=>{
 const a=part('horiz',{x:22,z:8,_id:10}),b=part('frontal',{x:5,z:-7,_id:11});
 const one=c3CandidateFromConeLab(saved([a,b]));
 const two=c3CandidateFromConeLab(saved([b,a]));
 assert.deepEqual(one.dimensions,two.dimensions);
 assert.deepEqual(one.sourcePartIds,two.sourcePartIds);
});
test('rejects unsupported non orthogonal, hidden, cut, third body or extra geometry instead of discarding it',()=>{
 const v=part('horiz',{_id:1}),f=part('frontal',{_id:2});
 const invalid=[
  [v,v],[f,f],
  [v,{...f,type:'fv',ang:45}],
  [v,{...f,type:'lat'}],
  [v,{...f,ang:10}],
  [{...v,hidden:true},f],
  [{...v,on:false},f],
  [v,{...f,k:'cone'}],
  [v],
  [v,f,part('horiz',{_id:3})]
 ];
 for(const parts of invalid)
  assert.throws(()=>c3CandidateFromConeLab(saved(parts)),
    'must reject unsafe source or unproven rotated axes');
 const doc=Bridge.documentFromState({
  shape:'lab',flipped:false,parts:[v,f],faces:[],cyls:[],pickSel:{}
 });
 const trial=JSON.parse(JSON.stringify(doc));
 trial.model.cyls.push({shape:'cyl',type:'frontal',ang:0,
  x:0,y:0,z:0,r:9,len:30,depth:0,on:true,open:true,hole:false});
 assert.throws(()=>c3CandidateFromConeLab(JSON.stringify(trial)),/包含切割/);
 trial.model.cyls=[];trial.model.pickSel={'f1:0':false};
 assert.throws(()=>c3CandidateFromConeLab(JSON.stringify(trial)),/包含切割/);
 trial.model.pickSel={};trial.model.flipped=true;
 assert.throws(()=>c3CandidateFromConeLab(JSON.stringify(trial)),/未翻转/);
 trial.model.flipped=false;trial.verification='verified';
 assert.throws(()=>c3CandidateFromConeLab(JSON.stringify(trial)));
});
test('existing workbench UI only prefills dimensions, revokes stale condition, and keeps review unchecked',()=>{
 const home=fs.readFileSync(path.join(__dirname,'../../ui-next/home.cjs'),'utf8');
 const entry=fs.readFileSync(path.join(__dirname,'../../project/unified-workbench-entry.cjs'),'utf8');
 assert.match(home,/id="v8-c3-conelab-file"/);
 assert.match(home,/id="v8-c3-conelab-status"/);
 const start=entry.indexOf("$('v8-c3-conelab-file').addEventListener");
 const end=entry.indexOf("$('v8-c1-template').addEventListener",start);
 assert.ok(start>0&&end>start);
 const wiring=entry.slice(start,end);
 assert.match(wiring,/c3CandidateFromConeLab\(await file\.text\(\)\)/);
 assert.match(wiring,/stopAnimation\(\)/);
 assert.match(wiring,/coordinator\.deleteCondition\('coords'\)/);
 assert.match(wiring,/\$\('v8-c3-axes'\)\.checked=false/);
 assert.match(wiring,/\$\('v8-c3-caps'\)\.checked=false/);
 assert.match(wiring,/\$\('v8-c3-solid-op'\)\.value=''/);
 assert.doesNotMatch(wiring,/coordinator\.confirmCondition\(/);
 assert.doesNotMatch(wiring,/makeReviewedC3Input\(/);
 assert.doesNotMatch(wiring,/session\.solve\(/);
});
