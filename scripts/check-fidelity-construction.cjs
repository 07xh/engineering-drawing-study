'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
function load(path){const c={};vm.runInNewContext(read(path),c,{filename:path});return c}
const src=load('labs/verified-exercises.js').VerifiedExerciseGeometry;
const fidelity=load('labs/source-fidelity-audit.js').ChapterFidelityAudit;
const construct=load('labs/point-construction-core.js').PointConstruction;
const engine=load('labs/constraint-engine.js').DrawingConstraints;
assert.equal(fidelity.ids.length,28);
assert.equal(new Set(fidelity.ids).size,28);
const results=fidelity.scan(id=>src.get(id)),summary=fidelity.totals(results);
assert.equal(results.length,28);
assert.equal(summary.blocked,28,'all partial originals must remain answer-locked');
assert.equal(summary.partial,28,'do not mislabel partial exercises as checked');
assert(summary.rawObjects>=100,'existing partial geometry should be surveyed');
for(const entry of results){
 assert.equal(entry.status,'partial','source status should remain partial: '+entry.id);
 assert.equal(entry.solutionAvailable,false,'audit must never authorize publishing answers: '+entry.id);
 assert(entry.blockers>=4,'insufficient audit blockers: '+entry.id);
 assert.equal(entry.procedural.length,5);
 assert(entry.procedural.every(c=>c.done===false),'do not pre-check reviewer tasks');
 assert(entry.findings.some(f=>f.code==='partial-source'),'missing partial warning '+entry.id);
 const actions=fidelity.nextActions(entry);
 assert(actions.length>=2,'missing source remediation guidance '+entry.id);
 assert(actions.every(a=>typeof a==='string'&&a.length>10),'invalid guidance '+entry.id);
}
const synthetic={
 status:'partial',source:'测试教材第1页',title:'仅供测试',
 lines:[[10,10,20,10,'given'],[20,10,10,10,'given'],[30,30,30,30,'given'],[-5,1,8,10,'given'],[10,10,45,80,'axis'],[10,10,40,30,'transfer']],
 circles:[[50,40,-3],[70,70,18]],dots:[[15,18],[960,520]],labels:[[20,30,'A']]
};
const check=fidelity.inspection('test-1',synthetic),codes=check.findings.map(x=>x.code);
for(const name of ['duplicate-line','zero-line','invalid-line','sloping-axis','transfer-angle','invalid-circle'])assert(codes.includes(name),'missing mechanical geometry warning '+name);
assert.equal(check.solutionAvailable,false);
assert.equal(fidelity.inspection('test-2',null).visualAvailable,false);
const testSource=read('labs/source-fidelity-audit.js');
assert(!testSource.includes('solutionSteps')&&!testSource.includes('VerifiedExerciseSolutions'),'structural audit should never read/write textbook solution data');
for(const x of [8,26,58])for(const y of [8,34,58])for(const z of [8,44,58]){
 const p={x,y,z},coords=construct.coordinates(p),o=construct.origin,k=construct.scale;
 assert.equal(coords.V[0],coords.H[0],'V/H share x');
 assert.equal(coords.V[1],coords.W[1],'V/W share z');
 assert.equal(coords.W[0]-o.x,coords.H[1]-o.y,'H/W depth mismatch');
 assert(Math.abs(coords.mirror[0]-o.x-y*k)<1e-8,'45 deg mirror mismatch');
 assert.equal(coords.mirror[1],coords.H[1],'H to mirror should be horizontal');
 const good=construct.report(engine,p,false),bad=construct.report(engine,p,true);
 assert.equal(good.knownDOF,0);
 assert.equal(good.fullDOF,0);
 assert.equal(good.correct,true);
 assert.equal(good.inconsistent,false);
 assert.equal(bad.inconsistent,true,'wrong W depth must yield contradictory system');
 assert.equal(bad.fullDOF,null,'contradictions are not 0-DOF solutions');
 for(let stage=0;stage<5;stage++){
  const picture=construct.frame(p,stage,false),shapes=picture.shapes;
  assert.equal(picture.stage,stage);
  assert.equal(shapes.filter(s=>s.kind==='panel').length,3);
  for(const s of shapes){
   if(s.xy)assert(s.xy.length===4&&s.xy.every(n=>Number.isFinite(n)&&n>=0&&n<=920),'invalid construction line');
   if(s.at)assert(s.at.length===2&&s.at.every(Number.isFinite),'invalid point');
  }
  if(stage<3)assert(!shapes.some(s=>s.kind==='point'&&s.color==='blue'),'third-view point appeared early');
  else assert(shapes.some(s=>s.kind==='point'&&s.color==='blue'),'missing correct W point');
 }
 const badPicture=construct.frame(p,4,true);
 assert(badPicture.shapes.some(s=>s.kind==='point'&&s.color==='red'),'wrong candidate must be visibly distinct');
}
assert.throws(()=>construct.coordinates({x:2,y:30,z:30}));
assert.throws(()=>construct.frame({x:26,y:34,z:44},5));
const dashboard=read('labs/source-fidelity.html'),audUI=read('labs/source-fidelity-ui.js'),workbench=read('labs/point-construction.html'),workUI=read('labs/point-construction-ui.js');
for(const id of ['statistics','query','section','filter','list','detailFindings','detailChecks','toExercise'])assert(dashboard.includes('id="'+id+'"'),'missing audit UI '+id);
for(const id of ['constructionBoard','xValue','yValue','zValue','contradiction','checkResult','prev','next'])assert(workbench.includes('id="'+id+'"'),'missing interactive construction '+id);
assert(audUI.includes('audit.scan')&&audUI.includes('report.procedural'),'audit page not wired to source findings');
assert(workUI.includes('model.report(engine')&&workUI.includes('model.frame(data'),'interactive lab not wired to numeric proof');
assert(workUI.includes('result.inconsistent'),'contradictory third-view candidates must be explained');
assert(!workUI.includes('lineFocus')&&!workUI.includes('VerifiedExerciseGeometry'),'construction must not modify textbook answer layer');
for(const page of ['labs/chapter-26-29.html','labs/chapter-drawing.html','knowledge/index.html'])assert(read(page).includes('source-fidelity.html'),'source audit not linked '+page);
assert(read('labs/chapter-drawing.js').includes("drawingAuditLink").valueOf(),'current exercise must update audit deeplink');
for(const asset of ['labs/source-fidelity.html','labs/source-fidelity-audit.js','labs/source-fidelity-ui.js','labs/point-construction.html','labs/point-construction-core.js','labs/point-construction-ui.js'])assert(read('scripts/build-static.cjs').includes("'"+asset+"'"),'static build omitted '+asset);
console.log('PASS: 28 source audits remain locked, input anomalies flagged, 27 coordinate scenarios x 5 construction frames, contradiction proof and UI routing');
