'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {preflightTextbookDwg}=require('../../scripts/preflight-textbook-dwg.cjs');
function dwg({pointer=448,kind=2,width=184,height=95,corrupt=false}={}){
 const b=Buffer.alloc(1200);b.write('AC1018',0,'ascii');
 b.writeUInt32LE(pointer,13);b[pointer+20]=1;
 const record=pointer+21;
 b[record]=kind;b.writeUInt32LE(600,record+1);
 b.writeUInt32LE(corrupt?10000:50,record+5);
 b.writeUInt32LE(40,600);b.writeInt32LE(width,604);b.writeInt32LE(height,608);
 b.writeUInt16LE(1,612);b.writeUInt16LE(8,614);
 return b;
}
test('09 an AC1018 source with 184x95 thumbnail does NOT claim CAD entities or full textbook result',()=>{
 const b=dwg(),v=preflightTextbookDwg(b);
 assert.equal(v.status,'thumbnail-only');
 assert.equal(v.embeddedPreview.width,184);
 assert.equal(v.embeddedPreview.height,95);
 assert.equal(v.embeddedPreview.bitsPerPixel,8);
 assert.equal(v.sourceBytes,b.length);
 assert.match(v.sourceSha256,/^[a-f0-9]{64}$/);
 for(const flag of [
  'dwgVectorEntitiesDecoded','trueDimensionsVerified',
  'solveResultComparedWithReference','threeDimensionalSolidCompared',
  'constructionStepsCompared','singleV5PlaybackCompared',
  'realGeometryVerified','wholeProblemVerified'
 ])assert.equal(v[flag],false);
 assert.equal(v.nextIndependentEvidence.includes('answer-isolated'),true);
});
test('09 malicious or incomplete thumbnails cannot become a validated textbook geometry oracle',()=>{
 assert.throws(()=>preflightTextbookDwg(Buffer.alloc(10)),/bounded/);
 assert.throws(()=>preflightTextbookDwg(dwg({pointer:1190})),/pointer/);
 assert.throws(()=>preflightTextbookDwg(dwg({corrupt:true})),/bounds/);
 assert.throws(()=>preflightTextbookDwg(dwg({width:0})),/dimensions/);
 assert.throws(()=>preflightTextbookDwg(dwg({height:0})),/dimensions/);
 const notBmp=preflightTextbookDwg(dwg({kind:1}));
 assert.equal(notBmp.status,'no-preview');
 assert.equal(notBmp.wholeProblemVerified,false);
 const unsupported=dwg();unsupported.write('AC1027',0,'ascii');
 assert.equal(preflightTextbookDwg(unsupported).status,'unsupported-dwg');
 assert.equal(preflightTextbookDwg(unsupported).wholeProblemVerified,false);
});
