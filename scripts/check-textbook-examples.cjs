'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
function load(file,key){const sandbox={};vm.runInNewContext(read(file),sandbox,{filename:file});return sandbox[key]}
const book=load('knowledge/knowledge-data.js','DrawingKnowledge');
const catalog=load('knowledge/textbook-examples.js','TextbookExamples');
const model=load('knowledge/textbook-example-geometry.js','TextbookExampleGeometry');
assert(catalog&&model);
assert.equal(catalog.all.length,3,'only three inspected textbook examples');
const sourceRows=[['example-1-1',13,19,'图 1-22'],['example-2-2',34,40,'图 2-14'],['example-2-3',35,41,'图 2-16']];
for(const [id,printed,pdf,figure] of sourceRows){
 const example=catalog.get(id);
 assert(example&&example.printedPage===printed&&example.pdfPage===pdf&&example.figure===figure);
 assert(example.sourceStatus==='page-figure-reviewed');
 assert.equal(example.order.length,5);
 assert.equal(example.why.length,5);
 assert.equal(example.freedom.length,5);
 assert.equal(example.stageChecks.length,5,'every textbook stage needs a source-aligned check');
 assert(example.stageChecks.every(x=>typeof x==='string'&&x.length>12));
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
const coordinateProof=model.frame('example-2-3',4).proof;
assert.deepEqual(JSON.parse(JSON.stringify(coordinateProof.measured)),{x:15,y:10,z:12});
assert(coordinateProof.heightAligned&&coordinateProof.depthAligned);
assert(!model.frame('example-2-3',2).shapes.some(x=>x.label==='a″'),'cannot reveal side projection before construction');
assert(model.frame('example-2-3',3).shapes.some(x=>x.label==='a″'),'third projection missing');
assert.equal(catalog.forTopic('ch02-point-coordinates').length,2,'both verified point examples must appear');
assert.throws(()=>model.frame('example-1-1',-1));
assert.throws(()=>model.frame('example-2-2',6));
assert.throws(()=>model.frame('made-up-question',0),'unverified examples must fail closed');
const html=read('knowledge/index.html'),ui=read('knowledge/textbook-example-ui.js'),app=read('knowledge/knowledge-app.js');
const elements=['textbookExample','bookExampleSvg','bookExamplePrev','bookExampleNext','bookExampleReset','bookExampleFinal',
 'bookExampleAction','bookExampleReason','bookExampleDof','bookExampleAudit','bookExampleSource'];
for(const id of elements)assert(html.includes('id="'+id+'"'),'missing interactive lesson element '+id);
assert(html.includes('id="bookExampleStepNav"'),'missing step navigation');
assert(html.includes('id="bookExamplePicker"'),'missing multiple-example selector');
assert(ui.includes('available.find(entry=>entry.id==='),'selector must only open linked verified textbook examples');
assert(html.includes('id="bookExampleShowAux" checked'),'auxiliary lines should be visible by default');
assert(ui.includes("item.style==='auxiliary')continue"),'hide only helper lines, not given or result geometry');
assert(ui.includes("bookExampleShowAux').addEventListener('change'"),'auxiliary visibility must redraw current stage');
assert(ui.includes("current.order.forEach((label,i)=>"),'step navigator must be generated from verified textbook stages');
assert(ui.includes("button.addEventListener('click',()=>{index=i;render()})"),'step navigator must select a real geometry stage');
assert(ui.includes("button.setAttribute('aria-current','step')"),'active step must be accessible');

assert(ui.includes("setAttribute('aria-pressed',String(i===index))"),'step buttons must announce selected state');
assert(ui.includes("setAttribute('aria-label',current.number+"),'SVG must expose current stage description');
assert(ui.includes("addEventListener('keydown',event=>"),'keyboard step navigation missing');
assert(ui.includes("target.closest('.book-example-guide')"),'keyboard shortcuts must stay scoped to the guide');
for(const script of ['textbook-examples.js','textbook-example-geometry.js','textbook-example-ui.js'])
 assert(html.includes('src="'+script+'"'),'missing source-driven example library '+script);
assert(ui.includes('source?.forTopic(topicId)'),'UI must only load linked textbook examples');
assert(ui.includes('geom.frame(current.id,index)'),'geometry library must power staged playback');
assert(app.includes('TextbookExampleUI.show(item.id)'),'viewer must display examples inside knowledge');
assert(app.includes('matchedTextbookExample'),'old generic demonstration must be separated from book example');
// Layout regression: controls AND explanations must be to the right of a reduced-size diagram.
const workspace=html.indexOf('<div class="book-example-workspace">');
const figure=html.indexOf('<div class="book-example-figure">',workspace);
const guide=html.indexOf('<div class="book-example-guide"',workspace);
const figureSvg=html.indexOf('id="bookExampleSvg"',figure);
const prev=html.indexOf('id="bookExamplePrev"',guide);
const next=html.indexOf('id="bookExampleNext"',guide);
const explanation=html.indexOf('<div class="book-example-explanation">',guide);
const action=html.indexOf('id="bookExampleAction"',explanation);
const freedom=html.indexOf('id="bookExampleDof"',explanation);
const fidelity=html.indexOf('id="bookExampleFidelity"',explanation);
assert(workspace>0&&figure>workspace&&figureSvg>figure&&figureSvg<guide,
 'example drawing must appear in the left panel before the right-side guide');
assert(guide>figureSvg&&prev>guide&&next>prev&&explanation>next&&action>explanation&&freedom>action&&fidelity>freedom,
 'step controls and explanation must appear together to the right of the diagram');
const styles=read('knowledge/knowledge-ui.css');
assert(styles.includes('.book-example-workspace')&&styles.includes('grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)'),
 'desktop book example requires two columns');
assert(styles.includes('@container bookExample (max-width:690px)')&&styles.includes('grid-template-columns:minmax(0,1fr)'),
 'book example must stack responsively in a narrow containing panel');
assert(styles.includes('min-width:0;max-height:none'),'SVG should scale down without causing horizontal overflow');
assert(ui.includes("'font-size':19"),'diagram labels must remain legible when drawing is smaller');
const builder=read('scripts/build-static.cjs');
for(const script of ['knowledge/textbook-examples.js','knowledge/textbook-example-geometry.js','knowledge/textbook-example-ui.js'])
 assert(builder.includes("'"+script+"'"),'static builder did not package '+script);
const bannedPDFAssets=[...builder.matchAll(/'([^']+\.(?:pdf|jpg|jpeg|png))'/gi)].map(x=>x[1]);
assert.deepEqual(bannedPDFAssets,[],'public build must not publish protected textbook scans');
console.log('PASS three source-verified textbook examples, fifteen frames, source coordinates, multi-example UI and safe public build');
