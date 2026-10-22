'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseNotation,parseTextCandidates,rankDimensionLinks}=
 require('../../recognition/dimension-notation-candidates.cjs');
const image={width:800,height:600};
test('strict R and diameter token candidates retain dimensions without claiming verified mm',()=>{
 for(const [text,kind,value,radius,unit] of [
  ['R8','radius',8,8,'drawing-unit-unconfirmed'],
  ['r 6.5','radius',6.5,6.5,'drawing-unit-unconfirmed'],
  ['R 8,25 mm','radius',8.25,8.25,'mm-explicit'],
  ['Φ20','diameter',20,10,'drawing-unit-unconfirmed'],
  ['φ 16','diameter',16,8,'drawing-unit-unconfirmed'],
  ['Ø12','diameter',12,6,'drawing-unit-unconfirmed'],
  ['⌀ 10.5','diameter',10.5,5.25,'drawing-unit-unconfirmed'],
  ['∅24 毫米','diameter',24,12,'mm-explicit']
 ]){
  const r=parseNotation(text);
  assert.ok(r,text);assert.equal(r.dimensionKind,kind);
  assert.equal(r.numericValue,value);assert.equal(r.proposedRadiusValue,radius);
  assert.equal(r.unitHint,unit);
 }
});
test('reject OCR ambiguity, tolerances, mixed symbols and unbounded values',()=>{
 for(const label of ['M20','O20','R','R?','R0','R-8','R1e4','R12x',
   'R4±0.1','R4-6','Ø20/2','R100001','R123456789','R1.2345',
   '<script>R10</script>','ØNaN','R20cm',null,42]){
  assert.equal(parseNotation(label),null,String(label));
 }
});
test('OCR text with bbox stays an untrusted pixel source with no solver answer',()=>{
 const tokens=[
  {id:'ocr_a',text:'R12',confidence:.87,bbox:[30,40,65,22]},
  {id:'ocr_b',text:'Φ20',confidence:.65,bbox:[300,200,90,22]},
  {id:'ocr_c',text:'M12',confidence:.99,bbox:[500,100,50,20]}
 ];
 const found=parseTextCandidates(tokens,image);
 assert.equal(found.length,2);
 assert.equal(found[0].id,'ocr_a');
 assert.equal(found[0].numericValue,12);
 assert.equal(found[0].coordinateSpace,'original-image-px');
 assert.equal(found[0].confirmed,false);
 assert.equal(found[0].mathematicalProof,false);
 assert.equal(found[1].dimensionKind,'diameter');
 assert.equal(found[1].proposedRadiusValue,10);
 assert.deepEqual(found[1].bbox,[300,200,90,22]);
});
test('invalid or duplicated OCR text cannot create any confirmed dimension',()=>{
 const good={id:'ocr_r',text:'R8',confidence:.75,bbox:[10,20,40,20]};
 for(const wrong of [
  {...good,bbox:[790,20,50,20]},
  {...good,bbox:[0,0,-3,20]},
  {...good,confidence:2},
  {...good,id:'bad!'},
  {...good,text:12}
 ])assert.throws(()=>parseTextCandidates([wrong],image));
 assert.throws(()=>parseTextCandidates([good,good],image));
 assert.throws(()=>parseTextCandidates([good],{width:0,height:600}));
 assert.throws(()=>parseTextCandidates(Array(151).fill(good),image));
});
test('proximity to a circle or arc produces multiple suggestions only',()=>{
 const dimension=parseTextCandidates([{id:'ocr_r',text:'R12',
  confidence:.83,bbox:[190,190,45,20]}],image)[0];
 const nearby=[
  {id:'curve_2',kind:'arc',coordinateSpace:'original-image-px',bbox:[80,100,220,200]},
  {id:'curve_1',kind:'circle',coordinateSpace:'original-image-px',bbox:[230,185,160,160]},
  {id:'curve_3',kind:'circle',coordinateSpace:'original-image-px',bbox:[650,450,80,80]},
  {id:'line_1',kind:'line',coordinateSpace:'original-image-px',bbox:[180,200,80,20]}
 ];
 const options=rankDimensionLinks(dimension,nearby,image);
 assert.deepEqual(options.map(o=>o.geometryCandidateId),['curve_1','curve_2']);
 for(const c of options){
  assert.equal(c.confirmed,false);
  assert.equal(c.hypothesis,'image-proximity-only');
 }
});
test('reject fabricated accepted or out-of-image association inputs',()=>{
 const d=parseTextCandidates([{id:'ocr_r',text:'R7',
  confidence:.5,bbox:[50,60,40,20]}],image)[0];
 assert.throws(()=>rankDimensionLinks({...d,confirmed:true},[],image));
 assert.throws(()=>rankDimensionLinks({...d,bbox:[900,60,40,20]},[],image));
 assert.throws(()=>rankDimensionLinks(d,Array(101).fill(null),image));
});
test('dimension interpretation does not use OCR text to bypass human math review',()=>{
 const fs=require('node:fs');
 const code=fs.readFileSync('recognition/dimension-notation-candidates.cjs','utf8');
 assert.doesNotMatch(code,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
 assert.doesNotMatch(code,/solveFiniteFillet|session\.replace|markCandidate/);
});
