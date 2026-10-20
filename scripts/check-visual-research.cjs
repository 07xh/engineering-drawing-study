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
assert.equal(know.entries.length,31);
for(const item of know.entries){
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
for(const [concept,type] of [['cone-circle','aux-circle'],['cone-generator','construction'],['sphere-point','aux-circle'],['cylinder-point','construction']]){
 const item=know.get(concept),picture=geom.svgShapes(item.id,item.chapter,3);
 assert(picture.shapes.some(s=>s.kind===type),'concept-specific auxiliary geometry missing '+concept);
 assert(!geom.svgShapes(item.id,item.chapter,2).shapes.some(s=>s.kind==='construction'||s.kind==='aux-circle'),'assisted solution appears too early '+concept);
}
const sphere=geom.modes.sphere.points.A;
assert(Math.abs((sphere.x-30)**2+(sphere.y-30)**2+(sphere.z-30)**2-22**2)<1e-6,'sphere point must be on example sphere');
const cylinder=geom.modes.cylinder.points.A;
assert(Math.abs((cylinder.x-30)**2+(cylinder.y-30)**2-22**2)<1e-6,'cylinder point must be on cylinder');
assert(geom.modeFor('cone-circle','curved')==='cone');
assert(geom.modeFor('sphere-point','curved')==='sphere');
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
console.log('PASS: 31 dynamic lessons, 28 fail-closed source checks, method review, live research UI, original-only geometry and checked frame compiler');
