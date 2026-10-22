'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createPhotoQualitySession}=require('../../recognition/photo-quality-session.cjs');
const {scenarios}=require('../recognition/synthetic-quality-scenes.cjs');
function source(){return scenarios().find(x=>x.truth[0]?.kind==='circle');}
test('a dimension annotation alone must NOT count as OCR false negative when OCR never ran',()=>{
 const scene=source(),s=createPhotoQualitySession();
 s.loadImage({width:scene.image.width,height:scene.image.height},scene.image);
 s.addAnnotation({kind:'dimension',bbox:[10,10,45,20],text:'R12'});
 const report=s.report();
 assert.equal(report.status,'needs-evaluable-annotations');
 assert.deepEqual(report.notRunKinds,['dimension']);
 assert.equal(report.precision,null);
 assert.equal(report.recall,null);
 assert.equal(report.unevaluatedAnnotations.length,1);
});
test('mixed circle and text truth only evaluates detectors that actually ran',()=>{
 const scene=source(),s=createPhotoQualitySession();
 s.loadImage({width:scene.image.width,height:scene.image.height},scene.image);
 s.addAnnotation({kind:'dimension',bbox:[10,10,45,20],text:'R12'});
 s.addAnnotation({kind:'circle',center:scene.truth[0].center,radius:scene.truth[0].radius});
 const r=s.report();
 assert.equal(r.status,'evaluated');
 assert.equal(r.metrics.byKind.circle.tp,1);
 assert.equal(r.metrics.byKind.dimension.fn,0);
 assert.equal(r.unevaluatedAnnotations.length,1);
 assert.equal(r.evaluatedAnnotationCount,1);
 assert.deepEqual(r.notRunKinds,['dimension']);
});
function arrowFrame(){
 const width=180,height=180,data=new Uint8ClampedArray(width*height*4);
 for(let k=0;k<data.length;k+=4)
  {data[k]=data[k+1]=data[k+2]=255;data[k+3]=255;}
 const draw=(a,b)=>{
  const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*3);
  for(let j=0;j<=n;j++){
   const t=j/n,x=Math.round(a.x*(1-t)+b.x*t),
    y=Math.round(a.y*(1-t)+b.y*t);
   const k=4*(y*width+x);
   data[k]=data[k+1]=data[k+2]=0;
  }
 };
 draw({x:20,y:90},{x:130,y:90});
 draw({x:130,y:90},{x:116,y:82});
 draw({x:130,y:90},{x:116,y:98});
 return {width,height,data};
}
test('actual local arrow V-wing detector is executed, retaining unverified tip as pixel candidate',()=>{
 const frame=arrowFrame(),s=createPhotoQualitySession();
 const snapshot=s.loadImage({width:180,height:180},frame);
 const arrows=snapshot.predictions.filter(x=>x.kind==='arrow');
 assert.ok(arrows.length>=1,JSON.stringify(snapshot.predictions));
 assert.ok(arrows.some(x=>Math.hypot(x.tip.x-130,x.tip.y-90)<7));
 assert.equal(snapshot.imageBytesRetained,false);
 assert.deepEqual(snapshot.evaluatedKinds,['line','circle','arc','arrow']);
 assert.deepEqual(snapshot.notRunKinds,['dimension']);
 s.addAnnotation({kind:'arrow',tip:{x:130,y:90}});
 const report=s.report();
 assert.equal(report.metrics.byKind.arrow.tp,1,JSON.stringify(report.metrics.byKind));
 assert.equal(report.metrics.byKind.arrow.fn,0);
});
test('public QA correctly distinguishes unrun OCR, local arrow detection and real pixels',()=>{
 const fs=require('node:fs');
 const session=fs.readFileSync('recognition/photo-quality-session.cjs','utf8');
 const ui=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 assert.match(session,/detectArrowWingCandidates\(frame,candidateLines/);
 assert.match(session,/notRunKinds:\['dimension'\]/);
 assert.match(session,/truth:measured,predictions/);
 assert.match(ui,/needs-evaluable-annotations/);
 assert.match(ui,/尺寸文字 OCR 未运行/);
 assert.doesNotMatch(session,/solveFiniteFillet|session\.replace|XMLHttpRequest|fetch\(/);
});
