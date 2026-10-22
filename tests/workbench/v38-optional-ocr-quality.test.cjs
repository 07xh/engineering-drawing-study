'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createPhotoQualitySession}=
 require('../../recognition/photo-quality-session.cjs');
const {scenarios}=require('../recognition/synthetic-quality-scenes.cjs');
const scene=()=>scenarios().find(x=>x.truth[0]?.kind==='circle');
const sample=()=>({id:'ocr_1',sourceText:'R12',
 coordinateSpace:'original-image-px',confirmed:false,
 bbox:[15,20,45,20]});
function setup(){
 const s=scene(),q=createPhotoQualitySession();
 q.loadImage({width:s.image.width,height:s.image.height},s.image);
 return q;
}
test('OCR dimensions are absent from recall denominator until the actual optional detector runs',()=>{
 const q=setup();q.addAnnotation({kind:'dimension',bbox:[15,20,45,20],text:'R12'});
 assert.equal(q.report().status,'needs-evaluable-annotations');
 assert.deepEqual(q.snapshot().notRunKinds,['dimension']);
 const version=q.snapshot().imageVersion;
 assert.equal(q.acceptNativeOcr(version,[sample()]),true);
 const report=q.report();
 assert.equal(report.status,'evaluated');
 assert.equal(report.metrics.byKind.dimension.tp,1);
 assert.equal(report.metrics.byKind.dimension.fp,0);
 assert.equal(report.metrics.byKind.dimension.fn,0);
 assert.deepEqual(report.notRunKinds,[]);
 assert.equal(report.imageBytesIncluded,false);
 assert.equal(report.filenameIncluded,false);
});
test('native OCR actually ran but returned no R/Φ tokens: missed human label is a legitimate FN',()=>{
 const q=setup();q.addAnnotation({kind:'dimension',bbox:[15,20,45,20],text:'R12'});
 assert.equal(q.acceptNativeOcr(q.snapshot().imageVersion,[]),true);
 const r=q.report();
 assert.equal(r.status,'evaluated');
 assert.equal(r.metrics.byKind.dimension.tp,0);
 assert.equal(r.metrics.byKind.dimension.fn,1);
});
test('old-image native OCR cannot contaminate replacement or reset image scores',()=>{
 const q=setup(),token=q.snapshot().imageVersion;
 const s=scene();
 q.loadImage({width:s.image.width,height:s.image.height},s.image);
 assert.equal(q.acceptNativeOcr(token,[sample()]),false);
 assert.deepEqual(q.snapshot().notRunKinds,['dimension']);
 assert.equal(q.snapshot().predictions.some(x=>x.kind==='dimension'),false);
 q.reset();
 assert.equal(q.acceptNativeOcr(q.snapshot().imageVersion,[sample()]),false);
 assert.equal(q.report().status,'no-image');
});
test('illegal OCR candidate list or checked/forged scores fail closed without changing report',()=>{
 const q=setup(),token=q.snapshot().imageVersion;
 const before=q.snapshot();
 for(const forged of [
  {...sample(),confirmed:true},
  {...sample(),coordinateSpace:'mm'},
  {...sample(),id:'bad@id'},
  {...sample(),bbox:[9999,10,40,20]},
  {...sample(),sourceText:123},
 ]){
  assert.throws(()=>q.acceptNativeOcr(token,[forged]));
  assert.deepEqual(q.snapshot(),before);
 }
 assert.throws(()=>q.acceptNativeOcr(token,Array(151).fill(sample())));
 assert.deepEqual(q.snapshot(),before);
});
test('joined split OCR candidates must preserve typed provenance and unique proposal IDs',()=>{
 const q=setup(),token=q.snapshot().imageVersion;
 const joined={...sample(),id:'ocr_join_1_2'};
 assert.equal(q.acceptNativeOcr(token,[joined]),true);
 const s=q.snapshot();
 assert.ok(s.predictions.find(x=>x.id==='ocr_join_1_2'));
 assert.throws(()=>q.acceptNativeOcr(token,[joined,joined]));
});
test('browser QA explicitly offers opt-in OCR with honest unsupported and stale-result guard',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('labs/recognition-qa.html','utf8');
 const ui=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 assert.match(html,/id="qaOcr"/);
 assert.match(ui,/detectBrowserDimensionCandidates\(image\)/);
 assert.match(ui,/result\.status==='unsupported'/);
 assert.match(ui,/imageVersion!==imageVersion/);
 assert.match(ui,/session\.acceptNativeOcr\(imageVersion,result\.candidates\)/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|localStorage/);
});
