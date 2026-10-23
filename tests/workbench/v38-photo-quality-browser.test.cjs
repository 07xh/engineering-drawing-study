'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createManualPhotoAnnotation:create}=
 require('../../labs/photo-qa-annotation-gestures.cjs');
const {createPhotoQualitySession}=
 require('../../recognition/photo-quality-session.cjs');
const {scenarios}=require('../recognition/synthetic-quality-scenes.cjs');
const p=(x,y)=>({x,y});
test('pointer line and circle gestures are image-pixel annotations only',()=>{
 assert.deepEqual(create('line',p(20,30),p(150,30)),{
  kind:'line',from:p(20,30),to:p(150,30)
 });
 const circle=create('circle',p(100,80),p(125,80));
 assert.equal(circle.kind,'circle');
 assert.deepEqual(circle.center,p(100,80));
 assert.equal(circle.radius,25);
 assert.equal(circle.unit,undefined);
 const arc=create('arc',p(80,60),p(110,60),{coverageDeg:135});
 assert.equal(arc.radius,30);
 assert.equal(arc.coverageDeg,135);
});
test('OCR rectangle must contain a manually transcribed label and visible region',()=>{
 assert.deepEqual(create('dimension',p(80,70),p(25,30),{text:' R12 '}),{
  kind:'dimension',bbox:[25,30,55,40],text:'R12'
 });
 assert.throws(()=>create('dimension',p(0,0),p(20,20),{text:''}));
 assert.throws(()=>create('dimension',p(0,0),p(0,20),{text:'Φ12'}));
 assert.throws(()=>create('dimension',p(0,0),p(50,50),{text:'x'.repeat(81)}));
});
test('arrow is a point, not a geometric distance or automatically proven tip',()=>{
 assert.deepEqual(create('arrow',p(120,90),p(170,110)),{
  kind:'arrow',tip:p(120,90)
 });
 assert.throws(()=>create('circle',p(1,1),p(1,1)));
 assert.throws(()=>create('line',p(1,1),p(2,2)));
 assert.throws(()=>create('arc',p(80,60),p(110,60),{coverageDeg:400}));
 assert.throws(()=>create('line',p(NaN,2),p(2,2)));
 assert.throws(()=>create('hidden',p(1,1),p(100,100)));
});
test('manual gesture labels are evaluated through actual local pixel detector and false positives',()=>{
 const scene=scenarios()[0],q=createPhotoQualitySession();
 q.loadImage({width:scene.image.width,height:scene.image.height},scene.image);
 const label=create('line',scene.truth[0].from,scene.truth[0].to);
 q.addAnnotation(label);
 const result=q.report();
 assert.equal(result.status,'evaluated');
 assert.equal(result.metrics.byKind.line.tp,1);
 assert.equal(result.imageBytesIncluded,false);
 assert.equal(result.filenameIncluded,false);
});
test('new QA page exposes image, overlay, manual tools and optional JSON export only',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('labs/recognition-qa.html','utf8');
 const js=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 const build=fs.readFileSync('scripts/build-static.cjs','utf8');
 const workbench=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 for(const id of ['qaFile','qaAnalyze','qaReset','qaTool','qaText','qaCoverage',
  'qaUndo','qaClearTruth','qaExport','qaStage','qaImage','qaOverlay','metrics','status'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/createPhotoQualitySession/);
 assert.match(js,/createManualPhotoAnnotation/);
 assert.match(js,/session\.loadImage/);
 assert.match(js,/session\.addAnnotation/);
 assert.match(js,/session\.report/);
 assert.match(js,/JSON\.stringify\(r,null,2\)/); // local, user-triggered export
 assert.match(js,/pointerdown/);
 assert.match(js,/pointercancel/);
 assert.match(js,/URL\.revokeObjectURL/);
 assert.match(build,/'labs\/recognition-qa\.html'/);
 assert.match(build,/recognition-qa-entry\.cjs/);
 assert.match(build,/recognition-qa-bundle\.js/);
 assert.match(workbench,/href="recognition-qa.html"/);
 assert.doesNotMatch(js,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
 assert.doesNotMatch(js,/solveFiniteFillet|session\.replace|cloudflare|github\.com\/api/);
 assert.doesNotMatch(html,/<form[^>]+action=|https:\/\/[^"' ]+\.js/);
});
