'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {normalizeNativeDetections:normalize,detectBrowserDimensionCandidates:detect}=
 require('../../recognition/browser-native-dimension-ocr.cjs');
const image={naturalWidth:1200,naturalHeight:800};
function canvasMock(){
 const calls=[];
 return {calls,width:0,height:0,getContext(){
  return {fillRect(...x){calls.push(['fill',...x])},
   drawImage(...x){calls.push(['draw',...x])},fillStyle:''};
 }};
}
const token=(value,x,y,w=60,h=20)=>({
 rawValue:value,boundingBox:{x,y,width:w,height:h}
});
test('native OCR normalizes image-size R and diameter proposals only',()=>{
 const output=normalize([
  token('R8',30,40),token('Φ20',400,150,70,24),
  token('M20',220,260),token('R8±0.1',120,150)
 ],{width:600,height:400},{width:1200,height:800});
 assert.equal(output.length,2);
 assert.equal(output[0].dimensionKind,'radius');
 assert.deepEqual(output[0].bbox,[60,80,120,40]);
 assert.equal(output[0].recognitionScore,0);
 assert.equal(output[0].unitHint,'drawing-unit-unconfirmed');
 assert.equal(output[0].confirmed,false);
 assert.equal(output[1].dimensionKind,'diameter');
 assert.equal(output[1].proposedRadiusValue,10);
 assert.deepEqual(output[1].bbox,[800,300,140,48]);
});
test('native detector actually receives local scaled Canvas pixels and emits dimension candidates',async()=>{
 let calls,received;
 class Detector{
  async detect(canvas){
   received=canvas;return [token('R12',10,20,50,18),
    token('O8',70,40,40,18)];
  }
 }
 const output=await detect(image,{
  TextDetectorCtor:Detector,maxEdge:600,
  canvasFactory:()=>{const canvas=canvasMock();calls=canvas.calls;return canvas}
 });
 assert.equal(output.status,'ok');
 assert.equal(output.candidates.length,1);
 assert.equal(output.candidates[0].numericValue,12);
 assert.equal(received.width,600);assert.equal(received.height,400);
 assert.equal(calls[0][0],'fill');assert.equal(calls[1][0],'draw');
 assert.equal(calls[1][1],image);
 assert.deepEqual(output.candidates[0].bbox,[20,40,100,36]);
});
test('unsupported native OCR is an honest unsupported state, not fabricated text',async()=>{
 const result=await detect(image,{TextDetectorCtor:null,
  canvasFactory:()=>{throw Error('must not read pixels')}});
 assert.equal(result.status,'unsupported');
 assert.deepEqual(result.candidates,[]);
 assert.match(result.reason,/TextDetector/);
});
test('OCR errors, invalid frames, bad text bounding boxes and resource caps fail closed',async()=>{
 const bad=await detect({naturalWidth:15000,naturalHeight:60},
  {TextDetectorCtor:class {}});
 assert.equal(bad.status,'invalid-image');
 const raised=await detect(image,{TextDetectorCtor:class{
  detect(){throw Error('image decode error');}
 },canvasFactory:canvasMock});
 assert.equal(raised.status,'error');assert.deepEqual(raised.candidates,[]);
 const normalized=normalize([
  token('R10',-100,-100),token('Ø8',590,390,50,50),
  {rawValue:'R12',boundingBox:{x:Infinity,y:0,width:10,height:10}},
  {rawValue:'R3',boundingBox:{x:700,y:0,width:20,height:20}}
 ],{width:600,height:400},{width:1200,height:800});
 assert.equal(normalized.length,1);
 assert.deepEqual(normalized[0].bbox,[1180,780,20,20]);
 assert.throws(()=>normalize(Array(151).fill(token('R8',0,0)),
  {width:600,height:400},{width:1200,height:800}),/too many/);
 assert.throws(()=>normalize({fake:true},{width:600,height:400},
  {width:1200,height:800}),/non-array/);
 await assert.rejects(()=>detect(image,{TextDetectorCtor:class{},maxEdge:100}));
});
test('the OCR module has no upload, remote OCR API, local persistence, or solve path',()=>{
 const source=require('node:fs').readFileSync('recognition/browser-native-dimension-ocr.cjs','utf8');
 assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
 assert.doesNotMatch(source,/session\.replace|solveFiniteFillet|confirmedFilletTimeline/);
 assert.match(source,/detector\.detect\(canvas\)/);
});
