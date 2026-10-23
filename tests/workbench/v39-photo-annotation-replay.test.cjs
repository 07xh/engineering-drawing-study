'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createPhotoQualitySession}=require('../../recognition/photo-quality-session.cjs');
const {createAnnotationPack,validateAnnotationPack}=
 require('../../recognition/photo-annotation-replay.cjs');
const {scenarios}=require('../recognition/synthetic-quality-scenes.cjs');
const scene=scenarios().find(s=>s.truth[0]?.kind==='line');
const SHA='a'.repeat(64),OTHER='b'.repeat(64);
const image={width:scene.image.width,height:scene.image.height};
function session(){
 const q=createPhotoQualitySession();
 q.loadImage(image,scene.image);return q;
}
function prepared(){
 const q=session();
 q.addAnnotation({kind:'line',from:scene.truth[0].from,to:scene.truth[0].to});
 q.addAnnotation({kind:'dimension',bbox:[18,90,48,25],text:'R12'});
 return q;
}
test('export a minimal numeric+manual label replay manifest with no picture bytes or filename',()=>{
 const q=prepared(),pack=createAnnotationPack(q.snapshot(),SHA);
 assert.equal(pack.schema,'draftai-photo-annotations/1');
 assert.equal(pack.image.sha256,SHA);
 assert.equal(pack.image.width,image.width);
 assert.equal(pack.annotations.length,2);
 assert.equal(pack.annotations[0].id,'truth_1');
 assert.equal(pack.annotations[1].text,'R12');
 const text=JSON.stringify(pack);
 assert.doesNotMatch(text,/"(?:fileName|filename|fileBytes|blob|dataUrl|rgba|pixels)"\s*:/i);
 assert.ok(text.length<5000);
 assert.match(pack.notice,/may be identifying/);
 assert.deepEqual(validateAnnotationPack(pack,{image,sha256:SHA}),pack.annotations);
});
test('replay on re-detected SAME original image preserves human truth and re-scores live candidates',()=>{
 const old=prepared(),pack=createAnnotationPack(old.snapshot(),SHA);
 const q=session(),before=q.snapshot(),token=before.imageVersion;
 assert.equal(q.restoreAnnotations(token,pack,SHA),true);
 const current=q.snapshot();
 assert.equal(current.annotations.length,2);
 assert.equal(current.annotations[1].text,'R12');
 assert.equal(q.report().metrics.byKind.line.tp,1);
 assert.equal(q.report().metrics.byKind.dimension.fn,0,
  'unsupported native OCR remains explicitly unevaluated');
 assert.deepEqual(q.report().notRunKinds,['dimension']);
 assert.ok(current.revision>before.revision);
 const after=q.addAnnotation({kind:'arrow',tip:{x:90,y:100}});
 assert.equal(after,'truth_3');
});
test('wrong original image digest or same-size different photo fails closed',()=>{
 const q=session(),before=q.snapshot();
 const pack=createAnnotationPack(prepared().snapshot(),SHA);
 assert.throws(()=>q.restoreAnnotations(before.imageVersion,pack,OTHER),/fingerprint/);
 assert.deepEqual(q.snapshot(),before);
 assert.throws(()=>validateAnnotationPack(pack,{image:{width:201,height:180},sha256:SHA}),/fingerprint/);
 assert.deepEqual(q.snapshot(),before);
});
test('replaced image invalidates stale annotation restore without any mutation',()=>{
 const q=session(),pack=createAnnotationPack(prepared().snapshot(),SHA);
 const stale=q.snapshot().imageVersion;
 q.loadImage(image,scene.image);
 const before=q.snapshot();
 assert.equal(q.restoreAnnotations(stale,pack,SHA),false);
 assert.deepEqual(q.snapshot(),before);
 q.reset();
 assert.equal(q.restoreAnnotations(q.snapshot().imageVersion,pack,SHA),false);
});
test('tampering, unexpected private payload, geometry, IDs and count all reject atomically',()=>{
 const q=prepared(),pack=createAnnotationPack(q.snapshot(),SHA);
 const original=q.snapshot();
 function reject(mutator){
  const modified=JSON.parse(JSON.stringify(pack));
  mutator(modified);
  assert.throws(()=>q.restoreAnnotations(q.snapshot().imageVersion,modified,SHA));
  assert.deepEqual(q.snapshot(),original);
 }
 reject(x=>{x.image.sha256=OTHER});
 reject(x=>{x.filename='homework.jpg'});
 reject(x=>{x.image.bytes='base64-data'});
 reject(x=>{x.annotations[0].rawPhoto='base64'});
 reject(x=>{x.annotations[1].text='a'.repeat(81)});
 reject(x=>{x.annotations[0].from.x=-2});
 reject(x=>{x.annotations[0].id=x.annotations[1].id});
 reject(x=>{x.annotations.push(...Array(100).fill(x.annotations[0]))});
 reject(x=>{x.schema='draftai-photo-annotations/999'});
});
test('source is local-only and does not present file digest as anonymity or math proof',()=>{
 const fs=require('node:fs');
 const src=fs.readFileSync('recognition/photo-annotation-replay.cjs','utf8');
 const session=fs.readFileSync('recognition/photo-quality-session.cjs','utf8');
 assert.match(src,/unique fingerprint, NOT anonymity/);
 assert.match(session,/restoreAnnotations/);
 assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|localStorage/);
 assert.doesNotMatch(src,/solveFiniteFillet|globallyUnique|G1Verified/);
});
