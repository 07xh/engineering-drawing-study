'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {webcrypto,createHash}=require('node:crypto');
const {createPhotoQualitySession}=require('../../recognition/photo-quality-session.cjs');
const {createPhotoQaBaseline,comparePhotoQaBaseline}=
 require('../../recognition/photo-qa-baseline.cjs');
const {fingerprintManualTruth}=
 require('../../recognition/local-photo-fingerprint.cjs');
const {scenarios}=require('../recognition/synthetic-quality-scenes.cjs');
const SHA='a'.repeat(64),TRUTH='b'.repeat(64);
const scene=scenarios().find(s=>s.truth[0]?.kind==='line');
function setup(){
 const q=createPhotoQualitySession(),image=scene.image;
 q.loadImage({width:image.width,height:image.height},image);
 q.addAnnotation({kind:'line',from:scene.truth[0].from,to:scene.truth[0].to});
 const snapshot=q.snapshot(),report=q.report();
 return {q,snapshot,report};
}
const params=({snapshot,report},imageSha=SHA,annotationSha=TRUTH)=>({
 snapshot,report,photoSha256:imageSha,truthSha256:annotationSha
});
test('current local photo QA baseline compares to exact same run as zero changes',()=>{
 const state=setup();
 const baseline=createPhotoQaBaseline(params(state));
 const output=comparePhotoQaBaseline(baseline,params(state));
 assert.equal(baseline.schema,'draftai-photo-qa-baseline/1');
 assert.equal(output.status,'comparable');
 assert.equal(output.imageFingerprintsMatch,true);
 assert.equal(output.manualTruthFingerprintsMatch,true);
 assert.equal(output.byKind.line.deltaTP,0);
 assert.equal(output.byKind.line.deltaFP,0);
 assert.equal(output.byKind.line.deltaFN,0);
 assert.equal(output.byKind.line.deltaRecall,0);
 assert.equal(output.byKind.line.deltaF1,0);
 assert.equal(output.noPhotoBytes,true);
 assert.deepEqual(baseline.scoredKinds,['line']);
});
test('synthetic changed detection outcome preserves denominator and reports precision and recall deltas',()=>{
 const state=setup(),baseline=createPhotoQaBaseline(params(state));
 const altered=JSON.parse(JSON.stringify(state.report));
 const prior=altered.metrics.byKind.line;
 assert.equal(prior.tp,1);
 altered.metrics.byKind.line={...prior,tp:0,fp:2,fn:1};
 const output=comparePhotoQaBaseline(baseline,params({...state,report:altered}));
 const line=output.byKind.line;
 assert.equal(line.deltaTP,-1);
 assert.equal(line.deltaFN,1);
 assert.equal(line.deltaFP,2-prior.fp);
 assert.equal(line.deltaRecall,-1);
 assert.equal(line.deltaF1,Number((-2/(2+prior.fp)).toFixed(6)));
});
test('different photo, photo dimensions, manual truth or unrun detector coverage is incomparable',()=>{
 const state=setup(),baseline=createPhotoQaBaseline(params(state));
 assert.throws(()=>comparePhotoQaBaseline(baseline,params(state,'c'.repeat(64))),/different original photo/);
 assert.throws(()=>comparePhotoQaBaseline(baseline,params(state,SHA,'d'.repeat(64))),/manual annotation set changed/);
 const modified=JSON.parse(JSON.stringify(baseline));
 modified.image.width+=1;
 assert.throws(()=>comparePhotoQaBaseline(modified,params(state)),/different original photo/);
 const changed=JSON.parse(JSON.stringify(baseline));
 changed.notRunKinds=[];
 assert.throws(()=>comparePhotoQaBaseline(changed,params(state)),/coverage changed/);
 const changedTruth=JSON.parse(JSON.stringify(state.report));
 changedTruth.metrics.byKind.line.fn+=1;
 assert.throws(()=>comparePhotoQaBaseline(baseline,params({...state,report:changedTruth})),/denominator changed/);
});
test('unexpected metadata or invalid counts cannot be laundered through baseline comparison',()=>{
 const state=setup(),baseline=createPhotoQaBaseline(params(state));
 for(const mutate of [
  b=>{b.filename='source.png'},
  b=>{b.byKind.line.tp=Infinity},
  b=>{b.byKind.line.fp=-1},
  b=>{b.byKind.line.fn=NaN},
  b=>{b.metricSpec='legacy-incompatible'},
  b=>{b.scoredKinds=['line','line']},
  b=>{b.image.sha256='not-a-hash'},
  b=>{b.byKind.line.rawImage='private'},
 ]){
  const forged=JSON.parse(JSON.stringify(baseline));
  mutate(forged);
  assert.throws(()=>comparePhotoQaBaseline(forged,params(state)));
 }
});
test('manual ground truth Web Crypto digest stable, and changes to a label change comparison identity',async()=>{
 const state=setup();
 const a=await fingerprintManualTruth(state.snapshot.annotations,webcrypto.subtle);
 const expected=createHash('sha256')
  .update(JSON.stringify(state.snapshot.annotations)).digest('hex');
 assert.equal(a,expected);
 const changed=JSON.parse(JSON.stringify(state.snapshot.annotations));
 changed[0].from.x+=1;
 const b=await fingerprintManualTruth(changed,webcrypto.subtle);
 assert.notEqual(a,b);
 const p=createPhotoQaBaseline(params(state,SHA,a));
 assert.throws(()=>comparePhotoQaBaseline(p,params(state,SHA,b)),/manual annotation set/);
 await assert.rejects(()=>fingerprintManualTruth(Array(101).fill({}),webcrypto.subtle));
 await assert.rejects(()=>fingerprintManualTruth([],null));
});
test('comparison UI is opt-in, local-only, revision-checked and separate from math solver',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('labs/recognition-qa.html','utf8');
 const ui=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 const source=fs.readFileSync('recognition/photo-qa-baseline.cjs','utf8');
 for(const id of ['qaSaveBaseline','qaBaselineFile','qaCompareBaseline','qaDiff'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(ui,/createPhotoQaBaseline/);
 assert.match(ui,/comparePhotoQaBaseline/);
 assert.match(ui,/fingerprintManualTruth\(t\.snapshot\.annotations\)/);
 assert.match(ui,/replayStillCurrent\(t\)/);
 assert.match(ui,/downloadJson\(baseline,'draftai-photo-qa-baseline\.json'\)/);
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage|solveFiniteFillet/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|localStorage/);
});
