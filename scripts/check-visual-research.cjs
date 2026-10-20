'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function source(p){return fs.readFileSync(p,'utf8')}
function evaluate(p){const ctx={URL};vm.runInNewContext(source(p),ctx,{filename:p});return ctx}
for(const p of ['knowledge/visual-model.js','knowledge/visual-ui.js','knowledge/research-core.js','knowledge/research-ui.js','knowledge/solution-gate.js','labs/verified-solutions.js'])new vm.Script(source(p),{filename:p});
const know=evaluate('knowledge/knowledge-data.js').DrawingKnowledge;
const geom=evaluate('knowledge/visual-model.js').KnowledgeVisual;
const engine=evaluate('labs/constraint-engine.js').DrawingConstraints;
const research=evaluate('knowledge/research-core.js').DrawingResearchCore;
const compiler=evaluate('knowledge/solution-gate.js').VerifiedSolutionCompiler;
const sourceRegistry=evaluate('labs/verified-exercises.js').VerifiedExerciseGeometry;
const recipeRegistry=evaluate('labs/verified-solutions.js').VerifiedExerciseSolutions;
const reviewed=know.entries.filter(x=>x.contentStatus==='page-reviewed');
assert.equal(know.entries.length,110);
assert.equal(reviewed.length,54);
assert.equal(know.entries.filter(x=>x.contentStatus==='toc-only').length,56);
for(const item of reviewed.filter(x=>x.visualMode)){
 const mode=geom.modeFor(item.id,item.chapter);
 assert(geom.modes[mode],'model missing '+item.id);
 assert.deepEqual([0,1,2,3].map(i=>geom.analyze(engine,item.id,item.chapter,i).degree),[3,1,0,0],'DOF progression incorrect for '+item.id);
 for(let i=0;i<4;i++){
  const stage=geom.svgShapes(item.id,item.chapter,i);
  assert(stage.shapes.filter(s=>s.kind==='panel').length===3,'wrong views');
  assert(stage.shapes.every(s=>!['line','guide','construction'].includes(s.kind)||(Array.isArray(s.xy)&&s.xy.length===4&&s.xy.every(Number.isFinite))),'nonfinite SVG coordinate');
  assert(stage.shapes.every(s=>!['circle','aux-circle'].includes(s.kind)||([s.cx,s.cy,s.r].every(Number.isFinite)&&s.r>0)),'nonfinite SVG circles');
 }
}
for(const [concept,type] of [['ch02-cone','aux-circle'],['ch02-cone','construction'],['ch02-sphere','aux-circle'],['ch02-cylinder','construction']]){
 const item=know.get(concept),picture=geom.svgShapes(item.id,item.chapter,3);
 assert(picture.shapes.some(s=>s.kind===type),'concept-specific auxiliary geometry missing '+concept);
 assert(!geom.svgShapes(item.id,item.chapter,2).shapes.some(s=>s.kind==='construction'||s.kind==='aux-circle'),'assisted solution appears too early '+concept);
}
// 严格第一角布局，不是 V/H/W 三栏横排：正面左上，俯视正下，左视正右。
const {origin,scale,defs}=geom;
assert(origin&&scale>0,'missing unified first-angle origin');
assert.equal(defs.V.rect[0],defs.H.rect[0],'front and top should align on same horizontal region');
assert(defs.H.rect[1]>defs.V.rect[1]+defs.V.rect[3],'top view must be below front view');
assert(defs.W.rect[0]>defs.V.rect[0]+defs.V.rect[2],'left side view must be right of front');
assert.equal(defs.W.rect[1],defs.V.rect[1],'front and side must be at same upper row');
const xyz={x:23,y:37,z:41};
const V=geom.projection(xyz,'V'),H=geom.projection(xyz,'H'),W=geom.projection(xyz,'W');
assert.equal(V[0],H[0],'V and H must share x (长对正)');
assert.equal(V[1],W[1],'V and W must share z (高平齐)');
assert.equal(H[1]-origin.y,W[0]-origin.x,'H and W depth must match via 45-degree transfer');
assert(Math.abs(Math.abs(V[0]-origin.x)/scale-xyz.x)<1e-8,'front x scale mismatch');
assert.equal(geom.projection(xyz,'V')[1],origin.y-xyz.z*scale,'z direction invalid');
assert.equal(geom.projection(xyz,'H')[1],origin.y+xyz.y*scale,'H view must be BELOW X axis');
const last=geom.svgShapes('ch02-point-projection','ch02',3);
const transfer=last.shapes.find(s=>s.kind==='transfer45');
assert(transfer,'45 degree transfer missing in last stage');
assert.equal(transfer.xy[2]-transfer.xy[0],transfer.xy[3]-transfer.xy[1],'45 line must be true 45 degrees');
const link=last.shapes.filter(s=>s.kind==='guide');
assert.equal(link.length,4,'must provide V/H, V/W, H/45 and 45/W correspondence guides');
assert.equal(link[0].xy[0],link[0].xy[2],'V/H projector must be vertical');
assert.equal(link[1].xy[1],link[1].xy[3],'V/W projector must be horizontal');
assert.equal(link[2].xy[1],link[2].xy[3],'H to 45 transfer must be horizontal');
assert.equal(link[3].xy[0],link[3].xy[2],'45 to W transfer must be vertical');
assert.equal(geom.svgShapes('ch02-point-projection','ch02',2).shapes.some(s=>s.kind==='transfer45'),false,'45 transfer should not leak early');
for(const item of reviewed.filter(x=>x.visualMode)){
 for(let step=0;step<=3;step++){
  const shapes=geom.svgShapes(item.id,item.chapter,step).shapes;
  for(const s of shapes){
   if(s.xy)assert(s.xy.every(n=>Number.isFinite(n)&&n>=0&&n<=970),'nonfinite/off-canvas scene line '+item.id);
   if(['circle','aux-circle'].includes(s.kind))assert(s.r>0&&s.cx-s.r>=0&&s.cy-s.r>=0&&s.cx+s.r<=970&&s.cy+s.r<=650,'off-canvas circle '+item.id);
   if(s.kind==='point')assert(s.xy.every(n=>n>=0&&n<=650||n>=0&&n<=970),'off-canvas point '+item.id);
  }
 }
}
const visualUi=source('knowledge/visual-ui.js');
assert(visualUi.includes("viewBox','0 0 970 650'"),'first-angle board must be tall enough for H view');
assert(visualUi.includes("'transfer45'"),'45 degree line renderer missing');
const sphere=geom.modes.sphere.points.A;
assert(Math.abs((sphere.x-30)**2+(sphere.y-30)**2+(sphere.z-30)**2-22**2)<1e-6,'sphere point must be on example sphere');
const cylinder=geom.modes.cylinder.points.A;
assert(Math.abs((cylinder.x-30)**2+(cylinder.y-30)**2-22**2)<1e-6,'cylinder point must be on cylinder');
assert(geom.modeFor('ch02-cone','ch02')==='cone');
assert(geom.modeFor('ch01-s01','ch01')===null,'unreviewed textbook sections must not get point model');
assert(geom.modeFor('ch03-s01','ch03')===null,'non-projection chapters must never use generic point SVG');
assert(geom.modeFor('ch02-sphere','ch02')==='sphere');
const sourceIds=['2-6','2-7','2-8','2-9'].flatMap((section,i)=>Array.from({length:i<2?6:8},(_,n)=>section+'-'+(n+1)));
assert.equal(sourceIds.length,28);
assert.equal(recipeRegistry.ids.length,0,'verified recipe registry must be empty until scan review');
for(const id of sourceIds){
 const original=sourceRegistry.get(id);
 const profile=research.detect(id,original),check=research.requirements(id,original);
 assert(profile&&profile.id===id,'type detection missing '+id);
 assert.equal(check.animationAllowed,false,'partial scan must remain blocked: '+id);
 assert(check.checks.some(x=>x.key==='geometry'&&!x.ok),'all 28 source scans must remain incomplete');
 assert.equal(compiler.compile({...original,id},null).steps.length,0,'source scan cannot draw without approved recipe');
 assert(research.compareMethods(profile).every(x=>x.canDraw===false),'methods must be unverified '+id);
}
assert(research.detect('2-9-7',sourceRegistry.get('2-9-7')).ambiguousShape,'uncertain curved shape must be disclosed');
assert.equal(research.detect('2-9-7',sourceRegistry.get('2-9-7')).group,'curvedUnknown','ambiguous shape must not be asserted as sphere');
assert(research.safeReference({url:'http://x.test',title:'x'})===null);
assert(research.safeReference({url:'https://evil.example/test',title:'x'})===null);
assert(research.safeReference({url:'https://zh.wikipedia.org/wiki/%E6%8A%95%E5%BD%B1',title:'投影'})!==null);
assert(research.safeReference({url:'https://doi.org/10.1000/xyz',title:'geometry'})!==null);
assert(research.scoreReference({provider:'crossref',url:'https://doi.org/10.1000/xyz',title:'cone surface point projection'},research.detect('2-9-3',sourceRegistry.get('2-9-3'))).verifiedForExercise===false);
const inspected=evaluate('labs/source-inspector.js').ChapterSourceInspector;
let scannedCount=0;
for(const id of sourceIds){
 const parts=inspected.collect(sourceRegistry.get(id));
 const stats=inspected.summary(sourceRegistry.get(id));
 assert.equal(stats.total,parts.length,'incorrect item count '+id);
 assert.equal(stats.complete,false,'source scan must not be presented as complete '+id);
 assert(parts.every(x=>typeof inspected.explain(x,sourceRegistry.get(id))==='string'),'missing inspection rationale '+id);
 scannedCount+=parts.length;
}
assert(scannedCount>100,'source inspector should count existing scanned-given line segments');
const inspectorHtml=source('labs/chapter-drawing.html');
const inspectorJS=source('labs/source-inspector-ui.js');
assert(inspectorHtml.includes('id="sourceHighlight"')&&inspectorHtml.includes('id="inspectPanel"'),'source inspector overlay missing');
assert(inspectorHtml.includes('src="source-inspector-ui.js"'),'source inspector script not loaded');
assert(inspectorJS.includes('sourceHighlight')&&!inspectorJS.includes("lineFocus")&&!inspectorJS.includes('VerifiedExerciseSolutions'),'source highlights must be separate from answers');
for(const control of ['inspectReview','inspectNote','inspectSave','inspectCopy','inspectStats','inspectSaved'])assert(inspectorHtml.includes('id="'+control+'"'),'missing personal review control '+control);
assert(inspectorJS.includes("drawing-source-review-v1"),'local-only source notes should be stored separately');
assert(inspectorJS.includes("rec.signature===JSON.stringify(item.geometry)"),'source notes must be invalidated when geometry changes');
assert(inspectorJS.includes('reviews[exercise]'),'per-question review storage must not leak across questions');
assert(inspectorJS.includes('report()'),'copyable personal audit summary is required');
assert(!inspectorJS.includes('status=\'verified-complete\'')&&!inspectorJS.includes('solutionAudit')&&!inspectorJS.includes('sourceFingerprint'),'personal review must not override answer verification');
const valid={
 id:'test-geometry',status:'verified-complete',source:'教材第17页 · 人工复核样例',
 coordinateAudit:'verified',visibilityAudit:'verified',solutionAudit:'verified',
 sourceFingerprint:'sha256:synthetic-test-fingerprint'
};
const recipe={
 sourceId:'test-geometry',sourceFingerprint:valid.sourceFingerprint,
 reviewStatus:'verified',reviewedBy:'human-audit',
 steps:[{kind:'construction',why:'测试中通过三面对应线明确坐标',lines:[[100,100,150,100]]}]
};
const compiled=compiler.compile(valid,recipe);
assert.equal(compiled.approved,true,'fully checked synthetic sample should compile');
assert.equal(compiled.steps.length,1);
assert.equal(compiler.compile({...valid,visibilityAudit:'partial'},recipe).approved,false,'visibility gate bypassed');
assert.equal(compiler.compile({...valid,status:'partial'},recipe).steps.length,0,'partial source must be blocked');
assert.equal(compiler.compile(valid,{...recipe,sourceFingerprint:'unmatched'}).approved,false,'source binding bypassed');
assert.equal(compiler.compile(valid,{...recipe,reviewedBy:'internet-search'}).approved,false,'internet result must not grant review status');
assert.equal(compiler.compile(valid,{...recipe,steps:[{kind:'solution',why:'测试越界坐标必须禁止',lines:[[0,0,2000,150]]}]}).steps.length,0);
const drawingJs=source('labs/chapter-drawing.js'),drawingHtml=source('labs/chapter-drawing.html');
assert(drawingJs.includes('return gate.compile({...item,id:current},recipe).steps'),'exercise drawing must enforce source gate');
for(const dependency of ['verified-solutions.js','../knowledge/solution-gate.js','../knowledge/research-core.js','../knowledge/research-ui.js'])assert(drawingHtml.includes(dependency),'missing lesson dependency '+dependency);
for(const id of ['researchPanel','researchQuery','researchSearch','researchResults','researchAudit','researchGate','researchAlternatives'])assert(drawingHtml.includes('id="'+id+'"'),'missing research UI element '+id);
const page=source('knowledge/index.html'),app=source('knowledge/knowledge-app.js');
for(const id of ['visualLesson','visualBoard','visualDegree','visualNext','visualPrev','visualReset'])assert(page.includes('id="'+id+'"'),'missing visual lesson '+id);
assert(app.includes('window.KnowledgeVisualUI.show(id)'),'knowledge view not linked to geometry');
assert(page.includes('src="../labs/constraint-engine.js"'),'shared constraint engine missing');
const searchUI=source('knowledge/research-ui.js');
assert(searchUI.includes('https://zh.wikipedia.org/w/api.php?'),'wiki public search missing');
assert(searchUI.includes('https://api.crossref.org/works?'),'crossref public search missing');
assert(searchUI.includes('mode:\'cors\''),'cors must be explicit');
assert(searchUI.includes("credentials:'omit'"),'live lookup must not send credentials');
assert(!searchUI.includes('innerHTML'),'web references must not be injected as HTML');
assert(!searchUI.includes("appendChild(svg")&&!searchUI.includes("lineFocus"),'research must not modify verified line layer');
for(const filename of ['knowledge/visual-model.js','knowledge/visual-ui.js','knowledge/research-core.js','knowledge/research-ui.js','knowledge/solution-gate.js','labs/verified-solutions.js','labs/source-inspector.js','labs/source-inspector-ui.js']){
 assert(source('scripts/build-static.cjs').includes("'"+filename+"'"),'static packaging missing '+filename);
}
console.log('PASS: 16 checked chapter-2 lessons, unreviewed topics without animation, 28 fail-closed scans, live research and verified recipe gate');
