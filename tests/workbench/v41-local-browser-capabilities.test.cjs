'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {inspectLocalQaCapabilities:inspect}=
 require('../../labs/photo-qa-capability-check.cjs');
function fake({ocr=false,secure=true,canvas=true,touch=true,crypto=true,urls=true}={}){
 const env={
  isSecureContext:secure,
  TextDetector:ocr?function TextDetector(){}:undefined,
  PointerEvent:touch?function PointerEvent(){}:undefined,
  URL:urls?{createObjectURL(){},revokeObjectURL(){}}:undefined,
  crypto:crypto?{subtle:{digest(){return Promise.resolve(new ArrayBuffer(32));}}}:undefined,
  userAgent:'SECRET user-agent must never be echoed',
  deviceId:'SECRET device-id must never be echoed',
  document:{createElement(name){
   assert.equal(name,'canvas');
   return {getContext(which){assert.equal(which,'2d');return canvas?{}:null;}};
  }}
 };
 return env;
}
test('full API presence marks prerequisites, not proof of OCR or phone driver accuracy',()=>{
 const result=inspect(fake({ocr:true}));
 assert.deepEqual(result.api,{
  secureContext:true,canvas2D:true,pointerEvents:true,
  localObjectUrl:true,sha256WebCrypto:true,nativeTextDetectorPresent:true
 });
 assert.equal(result.ocrStatus,'API-present-execution-unverified');
 assert.equal(result.localPhotoQaUsable,true);
 assert.equal(result.originalPhotoHashUsable,true);
 assert.equal(result.notDeviceOrOCRCertification,true);
 assert.equal(result.noImageOpenedOrUploaded,true);
 assert.equal(result.noDeviceIdentifiersCollected,true);
});
test('unsupported native OCR is reported as not evaluated, not failed accuracy',()=>{
 const r=inspect(fake({ocr:false,secure:false,crypto:false}));
 assert.equal(r.ocrStatus,'API-absent-OCR-not-evaluated');
 assert.equal(r.originalPhotoHashUsable,false);
 assert.equal(r.api.nativeTextDetectorPresent,false);
});
test('missing canvas, pointer or object URL disables the respective local QA prerequisite',()=>{
 for(const option of [{canvas:false},{touch:false},{urls:false}]){
  const report=inspect(fake(option));
  assert.equal(report.localPhotoQaUsable,false);
 }
 assert.equal(inspect({}).api.canvas2D,false);
});
test('exceptions from WebView Canvas availability are caught and never uploaded',()=>{
 let requests=0;
 const env=fake();
 env.document={createElement(){requests++;throw new Error('Canvas disabled by policy');}};
 const result=inspect(env);
 assert.equal(requests,1);
 assert.equal(result.api.canvas2D,false);
 assert.equal(result.localPhotoQaUsable,false);
});
test('capability report never includes user agent, device IDs, image bytes or private values',()=>{
 const report=inspect(fake({ocr:true}));
 const value=JSON.stringify(report);
 assert.doesNotMatch(value,/SECRET|user-agent|device-id|UA string|EXIF|data:image/);
 assert.deepEqual(Object.keys(report.api).sort(),[
  'secureContext','canvas2D','pointerEvents','localObjectUrl',
  'sha256WebCrypto','nativeTextDetectorPresent'].sort());
});
test('UI only inspects on click and warns native OCR API presence is not actual execution',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('labs/recognition-qa.html','utf8');
 const ui=fs.readFileSync('labs/recognition-qa-entry.cjs','utf8');
 const core=fs.readFileSync('labs/photo-qa-capability-check.cjs','utf8');
 assert.match(html,/id="qaCapabilities"/);
 assert.match(html,/id="qaCapabilityResult"/);
 assert.match(ui,/\$\('qaCapabilities'\)\.addEventListener\('click'/);
 assert.match(ui,/inspectLocalQaCapabilities\(window,document\)/);
 assert.match(ui,/未发现，OCR 保持未评测/);
 assert.match(ui,/能否识别工程图仍须按按钮实测/);
 for(const code of [ui,core]){
  assert.doesNotMatch(code,/\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB/);
 }
 assert.doesNotMatch(core,/navigator\.userAgent|deviceId|hardwareConcurrency/);
});
