'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
function load(file,key){const sandbox={};vm.runInNewContext(read(file),sandbox,{filename:file});return sandbox[key]}
const book=load('knowledge/knowledge-data.js','DrawingKnowledge');
const catalog=load('knowledge/textbook-examples.js','TextbookExamples');
const model=load('knowledge/textbook-example-geometry.js','TextbookExampleGeometry');
assert(catalog&&model);
assert.equal(catalog.all.length,2,'only real inspected textbook examples');
const sourceRows=[['example-1-1',13,19,'图 1-22'],['example-2-2',34,40,'图 2-14']];
for(const [id,printed,pdf,figure] of sourceRows){
 const example=catalog.get(id);
 assert(example&&example.printedPage===printed&&example.pdfPage===pdf&&example.figure===figure);
 assert(example.sourceStatus==='page-figure-reviewed');
 assert.equal(example.order.length,5);
 assert.equal(example.why.length,5);
 assert.equal(example.freedom.length,5);
 for(const topic of example.topics){
  const card=book.get(topic);
  assert(card?.contentStatus==='page-reviewed','example mapped to an unreviewed section');
  assert.equal(card.chapter,example.chapter);
  assert.equal(card.section,example.section,'example mapped outside textbook section');
  assert(catalog.forTopic(topic).some(x=>x.id===id));
 }
 for(let i=0;i<5;i++){
  const scene=model.frame(id,i);
  assert.equal(scene.stage,i);
  assert(scene.proof.maxResidual<1e-8,'numeric geometry invalid: '+id+' step '+i);
  assert(scene.shapes.length>=2);
  for(const shape of scene.shapes){
   const points=shape.type==='line'?[shape.a,shape.b]:[shape.p];
   assert(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'invalid SVG coordinate');
  }
 }
}
const division=model.frame('example-1-1',4),p=division.proof;
assert(p.sevenSegments&&p.sixParallelLines,'textbook seven-equal-segment logic invalid');
assert.equal(p.points.length,8);
assert.equal(p.marks.length,8);
for(let i=1;i<=6;i++){
 assert(Math.abs((p.points[i].x-p.A.x)/(p.B.x-p.A.x)-i/7)<1e-9);
}
assert(!model.frame('example-1-1',0).shapes.some(s=>s.style==='result'),'cannot show constructed answer on the given-only frame');
assert(!model.frame('example-2-2',0).shapes.some(s=>s.style==='result'),'cannot show third projection before it is constructed');
const third=model.frame('example-2-2',4);
assert(third.proof.heightAligned&&third.proof.depthAligned&&third.proof.xAligned);
assert(third.proof.points.aDouble.y===third.proof.points.aPrime.y);
assert(Math.abs((third.proof.points.aDouble.x-third.proof.points.O.x)-
 (third.proof.points.a.y-third.proof.points.O.y))<1e-8);
assert.throws(()=>model.frame('example-1-1',-1));
assert.throws(()=>model.frame('example-2-2',6));
assert.throws(()=>model.frame('made-up-question',0),'unverified examples must fail closed');
const html=read('knowledge/index.html'),ui=read('knowledge/textbook-example-ui.js'),app=read('knowledge/knowledge-app.js');
const elements=['textbookExample','bookExampleSvg','bookExamplePrev','bookExampleNext','bookExampleReset','bookExampleFinal',
 'bookExampleAction','bookExampleReason','bookExampleDof','bookExampleAudit','bookExampleSource'];
for(const id of elements)assert(html.includes('id="'+id+'"'),'missing interactive lesson element '+id);
for(const script of ['textbook-examples.js','textbook-example-geometry.js','textbook-example-ui.js'])
 assert(html.includes('src="'+script+'"'),'missing source-driven example library '+script);
assert(ui.includes('source?.forTopic(topicId)'),'UI must only load linked textbook examples');
assert(ui.includes('geom.frame(current.id,index)'),'geometry library must power staged playback');
assert(app.includes('TextbookExampleUI.show(item.id)'),'viewer must display examples inside knowledge');
assert(app.includes('matchedTextbookExample'),'old generic demonstration must be separated from book example');
const builder=read('scripts/build-static.cjs');
for(const script of ['knowledge/textbook-examples.js','knowledge/textbook-example-geometry.js','knowledge/textbook-example-ui.js'])
 assert(builder.includes("'"+script+"'"),'static builder did not package '+script);
const bannedPDFAssets=[...builder.matchAll(/'([^']+\.(?:pdf|jpg|jpeg|png))'/gi)].map(x=>x[1]);
assert.deepEqual(bannedPDFAssets,[],'public build must not publish protected textbook scans');
console.log('PASS real textbook Example 1-1 p13 Fig1-22 + Example 2-2 p34 Fig2-14: ten source-indexed frames, geometry proof, no guessed exercise, correct UI and safe packaging');
