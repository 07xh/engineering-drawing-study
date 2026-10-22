'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createPhotoTouchCheck}=require('../../labs/photo-qa-touch-check.cjs');
const {buildTouchDiagnosticReport:build}=
 require('../../labs/photo-qa-touch-report.cjs');
const centered=[
 {x:1000,y:500},{x:400,y:200},{x:1600,y:200},
 {x:400,y:800},{x:1600,y:800}
];
function complete(){
 const g=createPhotoTouchCheck();
 g.start({width:2000,height:1000});
 for(const p of centered)g.tap(p);
 return g.snapshot();
}
test('exports only 5 human tap deviations, not any original photo or user identifiers',()=>{
 const report=build(complete());
 assert.equal(report.schema,'draftai-photo-touch-diagnostic/1');
 assert.equal(report.sampleCount,5);
 assert.deepEqual(report.deviationsInOriginalImagePx,[0,0,0,0,0]);
 assert.equal(report.meanDeviationPx,0);
 assert.equal(report.maxDeviationPx,0);
 assert.equal(report.deviceAccuracyCertified,false);
 assert.equal(report.includesImageBytes,false);
 assert.equal(report.includesOriginalImageDimensions,false);
 assert.equal(report.includesFileFingerprint,false);
 const keys=Object.keys(report).join(' ');
 assert.doesNotMatch(keys,/file|name|hash|photo|imageBytes|userAgent|ipAddress|geolocation/i);
 // The fixed schema can mention excluded fields by name, not their values.
 assert.doesNotMatch(JSON.stringify(report),/rawPhoto|base64|data:image|location|canvas/i);
});
test('metric report recomputes average and max with fixed precision',()=>{
 const check=createPhotoTouchCheck();
 check.start({width:2000,height:1000});
 const errors=[5,3,0,8,4];
 for(let i=0;i<centered.length;i++){
  const p=centered[i];
  check.tap({x:p.x+errors[i],y:p.y});
 }
 const r=build(check.snapshot());
 assert.equal(r.meanDeviationPx,4);
 assert.equal(r.maxDeviationPx,8);
 assert.deepEqual(r.deviationsInOriginalImagePx,errors);
});
test('not started, incomplete, canceled or malformed samples never create an export',()=>{
 const check=createPhotoTouchCheck();
 assert.throws(()=>build(check.snapshot()));
 check.start({width:2000,height:1000});
 check.tap(centered[0]);
 assert.throws(()=>build(check.snapshot()));
 check.cancel();assert.throws(()=>build(check.snapshot()));
 const good=complete();
 for(const bad of [
  {...good,index:4},
  {...good,total:6},
  {...good,errors:[0,0,0]},
  {...good,errors:[0,0,NaN,0,0]},
  {...good,errors:[0,0,-1,0,0]},
  {...good,errors:[0,0,Infinity,0,0]},
  {...good,errors:[0,0,16000,0,0]},
  {...good,meanErrorPx:900},
  {...good,maxErrorPx:100},
  {...good,isDeviceCertification:true}
 ])assert.throws(()=>build(bad));
});
test('report is a defensive summary and cannot change the underlying QA check',()=>{
 const original=complete();
 const report=build(original);
 assert.throws(()=>{report.maxDeviationPx=8});
 report.deviationsInOriginalImagePx[0]=12;
 assert.equal(original.errors[0],0);
 const next=build(original);
 assert.equal(next.deviationsInOriginalImagePx[0],0);
});
test('diagnostic summary cannot reach math solver, network, hidden user data or image content',()=>{
 const fs=require('node:fs');
 const source=fs.readFileSync('labs/photo-qa-touch-report.cjs','utf8');
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
 assert.doesNotMatch(source,/solveFiniteFillet|session\.replace|V5Verified/);
 assert.match(source,/five completed human taps required/);
});
