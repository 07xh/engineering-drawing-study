'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chooseOcrRadiusPrefill:choose}=
 require('../../recognition/reviewed-ocr-radius-prefill.cjs');
const sample=(text,dimensionKind,proposedRadiusValue)=>({
 id:'ocr_1',confirmed:false,coordinateSpace:'original-image-px',
 sourceText:text,dimensionKind,proposedRadiusValue
});
test('explicit R mm token yields optional numeric radius without automatic math',()=>{
 const x=choose(sample('R8 mm','radius',8),'filletRadius');
 assert.equal(x.status,'ready-to-prefill');
 assert.equal(x.value,8);assert.equal(x.sourceId,'ocr_1');
 assert.equal(x.proof,undefined);
});
test('diameter candidate converts to radius only after explicit drawing-unit confirmation',()=>{
 const x=sample('Φ20','diameter',10);
 assert.equal(choose(x,'r1').status,'blocked');
 const accepted=choose(x,'r1',{unitAcknowledged:true});
 assert.equal(accepted.status,'ready-to-prefill');
 assert.equal(accepted.value,10);
});
test('never use radius OCR as generic X/Y coordinate and never trust forged value',()=>{
 const x=sample('R12 mm','radius',12);
 for(const field of ['a1x','a2y','c1x','constructor','__proto__'])
  assert.equal(choose(x,field).status,'blocked');
 assert.equal(choose({...x,proposedRadiusValue:999},'filletRadius').status,'blocked');
 assert.equal(choose({...x,dimensionKind:'diameter'},'filletRadius').status,'blocked');
 assert.equal(choose({...x,confirmed:true},'filletRadius').status,'blocked');
 assert.equal(choose({...x,coordinateSpace:'model-mm'},'filletRadius').status,'blocked');
 assert.equal(choose({...x,id:'ocr_script'},'filletRadius').status,'blocked');
});
test('unknown labels and invalid values cannot silently adopt a radius',()=>{
 for(const text of ['O20','M20','R0','R8±0.2','Ø12cm','R8-10']){
  assert.equal(choose(sample(text,'radius',8),'r2',
   {unitAcknowledged:true}).status,'blocked');
 }
});
test('source does not touch Math solver, browser persistence or upload endpoints',()=>{
 const fs=require('node:fs');
 const src=fs.readFileSync('recognition/reviewed-ocr-radius-prefill.cjs','utf8');
 assert.doesNotMatch(src,/\bfetch\s*\(|\blocalStorage\b|\bXMLHttpRequest\b/);
 assert.doesNotMatch(src,/solveFiniteFillet|session\.replace|confirm\(/);
 const ui=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 assert.match(ui,/input\.dispatchEvent\(new Event\('input'/);
});
