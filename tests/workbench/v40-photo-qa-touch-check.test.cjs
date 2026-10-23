'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createPhotoTouchCheck}=require('../../labs/photo-qa-touch-check.cjs');
const {imagePointFromClient,createPhotoQaGesture}=
 require('../../labs/photo-qa-pointer-geometry.cjs');
const {createPhotoQualitySession}=require('../../recognition/photo-quality-session.cjs');
const {scenarios}=require('../recognition/synthetic-quality-scenes.cjs');
const size={width:2000,height:1200};
test('five crosshairs have deterministic target locations in original image pixels',()=>{
 const check=createPhotoTouchCheck();
 const started=check.start(size);
 assert.deepEqual(started.target,{x:1000,y:600});
 assert.equal(started.total,5);
 assert.equal(started.status,'active');
 const coords=[[1000,600],[400,240],[1600,240],[400,960],[1600,960]];
 for(let i=0;i<coords.length;i++){
  const [x,y]=coords[i];
  const next=check.tap({x,y});
  assert.equal(next.accepted,true);
  assert.equal(next.index,i+1);
 }
 const finished=check.snapshot();
 assert.equal(finished.status,'complete');
 assert.equal(finished.meanErrorPx,0);
 assert.equal(finished.maxErrorPx,0);
 assert.equal(finished.isDeviceCertification,false);
 assert.equal(check.tap({x:0,y:0}).accepted,false);
});
test('subpixel error is visible and not mislabeled as measured actual driver accuracy',()=>{
 const check=createPhotoTouchCheck();
 check.start(size);
 check.tap({x:1005,y:600});
 check.tap({x:400,y:243});
 check.tap({x:1600,y:240});
 check.tap({x:400,y:960});
 check.tap({x:1600,y:968});
 const result=check.snapshot();
 assert.equal(result.maxErrorPx,8);
 assert.equal(result.meanErrorPx,3.2);
 assert.equal(result.isDeviceCertification,false);
});
test('diagnostic uses same CSS zoom and scroll pointer mapping as actual annotation',()=>{
 const check=createPhotoTouchCheck();
 const target=check.start(size).target;
 const rect={left:-145,top:20,width:1000,height:600};
 const client={clientX:rect.left+target.x/size.width*rect.width,
  clientY:rect.top+target.y/size.height*rect.height};
 const pixel=imagePointFromClient(client,rect,size);
 assert.deepEqual(pixel,target);
 assert.equal(check.tap(pixel).errors[0],0);
});
test('malformed or outside tap cannot advance check',()=>{
 const check=createPhotoTouchCheck();
 assert.throws(()=>check.start({width:0,height:1200}));
 assert.throws(()=>check.start({width:100,height:Infinity}));
 const before=check.start(size);
 assert.equal(check.tap(null).accepted,false);
 assert.equal(check.tap({x:NaN,y:3}).accepted,false);
 assert.equal(check.snapshot().index,before.index);
 check.cancel();
 assert.equal(check.tap({x:1000,y:600}).accepted,false);
 assert.equal(check.snapshot().status,'idle');
});
test('multi-touch never advances a calibration point or creates a manual label',()=>{
 const check=createPhotoTouchCheck(),gesture=createPhotoQaGesture();
 check.start(size);
 gesture.down(1,{x:1000,y:600},'touch-check');
 gesture.down(2,{x:990,y:595},'touch-check');
 assert.equal(gesture.up(1,{x:1000,y:600}).status,'cancelled');
 assert.equal(gesture.up(2,{x:990,y:595}).status,'cancelled');
 assert.equal(check.snapshot().index,0);
 assert.equal(gesture.snapshot(),null);
});
test('local calibration cannot affect photo QA session truth, predictions or metrics',()=>{
 const source=scenarios().find(x=>x.truth[0]?.kind==='line');
 const q=createPhotoQualitySession(),check=createPhotoTouchCheck();
 q.loadImage({width:source.image.width,height:source.image.height},source.image);
 q.addAnnotation({kind:'line',from:source.truth[0].from,to:source.truth[0].to});
 const baseline=q.snapshot(),report=q.report();
 check.start(baseline.image);
 const target=check.snapshot().target;
 check.tap(target);check.cancel();
 assert.deepEqual(q.snapshot(),baseline);
 assert.deepEqual(q.report(),report);
});
test('browser UI has separate click targets, no network/storage and no silent metrics changes',()=>{
 const fs=require('node:fs');
 const ui=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 const html=fs.readFileSync('labs/recognition-qa.html','utf8');
 for(const id of ['qaTouchCheck','qaTouchStop','qaTouchResult'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(ui,/touchCheck\.tap\(g\.last\)/);
 assert.match(ui,/touchCheck\.cancel\(\)/);
 assert.match(ui,/data-touch-check/);
 assert.match(ui,/overlay\.getBoundingClientRect\(\)/);
 assert.match(ui,/g\.kind==='touch-check'/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
});
