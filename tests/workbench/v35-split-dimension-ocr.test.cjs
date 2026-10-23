'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {joinSplitDimensionTokens:join}=
 require('../../recognition/dimension-notation-candidates.cjs');
const {normalizeNativeDetections:normalize}=
 require('../../recognition/browser-native-dimension-ocr.cjs');
const frame={width:600,height:400},original={width:1200,height:800};
const native=(rawValue,x,y,width=12,height=20)=>({
 rawValue,boundingBox:{x,y,width,height}
});
test('native detector recombines truly adjacent same-baseline R + number pixels',()=>{
 const out=normalize([native('R',30,40),native('8',45,40)],
  frame,original);
 assert.equal(out.length,1);
 assert.equal(out[0].sourceText,'R8');
 assert.equal(out[0].numericValue,8);
 assert.equal(out[0].dimensionKind,'radius');
 assert.deepEqual(out[0].bbox,[60,80,54,40]);
 assert.deepEqual(out[0].sourceTokenIds,['ocr_1','ocr_2']);
 assert.equal(out[0].syntheticJoin,true);
 assert.equal(out[0].confirmed,false);
 assert.equal(out[0].mathematicalProof,false);
});
test('split diameter symbols and numeric labels map back to half-radius candidate',()=>{
 const out=normalize([native('⌀',10,15,12,18),
  native('20',25,15,22,18),native('M',160,100),native('20',175,100)],
 frame,original);
 assert.equal(out.length,1);
 assert.equal(out[0].sourceText,'⌀20');
 assert.equal(out[0].proposedRadiusValue,10);
 assert.equal(out[0].unitHint,'drawing-unit-unconfirmed');
});
test('far apart, vertically misaligned or untrusted OCR numerals are never joined',()=>{
 for(const tokens of [
  [native('R',30,40),native('8',95,40)],
  [native('R',30,40),native('8',44,77)],
  [native('R',30,40),native('8',44,40,12,5)],
  [native('O',30,40),native('8',44,40)],
  [native('R',30,40),native('-8',44,40)],
  [native('R',30,40),native('8±0.2',44,40)]
 ]){
  assert.deepEqual(normalize(tokens,frame,original),[]);
 }
});
test('two equally plausible digits remain alternatives with no guessed winner',()=>{
 const tokens=[native('R',30,40),native('8',45,40),
  native('16',45,42,18,20)];
 const output=normalize(tokens,frame,original);
 assert.equal(output.length,2);
 assert.deepEqual(new Set(output.map(x=>x.numericValue)),new Set([8,16]));
 assert.ok(output.every(x=>x.confirmed===false));
});
test('native whole R8 label suppresses an overlapping split duplicate',()=>{
 const output=normalize([
  native('R8',30,40,27,20),native('R',30,40,12,20),
  native('8',45,40,12,20)
 ],frame,original);
 assert.equal(output.length,1);
 assert.equal(output[0].sourceText,'R8');
 assert.equal(output[0].syntheticJoin,undefined);
});
test('pair reconstruction stays bounded and validates original-image candidates',()=>{
 const tokens=[
  {id:'ocr_a',text:'R',confidence:0,bbox:[40,50,12,18]},
  {id:'ocr_b',text:'12',confidence:0,bbox:[54,50,24,18]}
 ];
 const result=join(tokens,original);
 assert.equal(result.length,1);
 assert.equal(result[0].text,'R12');
 assert.deepEqual(result[0].sourceTokenIds,['ocr_a','ocr_b']);
 assert.throws(()=>join(tokens,original,{maxPairs:81}));
 assert.throws(()=>join(tokens,{width:0,height:100}));
 assert.throws(()=>join(Array(151).fill(tokens[0]),original));
});
test('reconstructed OCR suggestions never write math proof or call remote OCR',()=>{
 const fs=require('node:fs');
 const source=fs.readFileSync('recognition/dimension-notation-candidates.cjs','utf8');
 const nativeSource=fs.readFileSync('recognition/browser-native-dimension-ocr.cjs','utf8');
 assert.match(nativeSource,/joinSplitDimensionTokens\(tokens,original\)/);
 assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|localStorage/);
 assert.doesNotMatch(nativeSource,/session\.replace|solveFiniteFillet/);
});
