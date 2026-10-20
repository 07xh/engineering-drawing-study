'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
function load(path){const context={};vm.runInNewContext(read(path),context);return context}
const library=load('labs/verified-exercises.js').VerifiedExerciseGeometry;
const model=load('labs/exercise-261-evidence.js').Exercise261Evidence;
const current=library.get('2-6-1');
assert(current&&current.status==='partial','must retain incomplete textbook provenance');
const result=model.scan(current);
assert(result.safe===true,'current traced source topology should pass internal-only structural checks');
assert(result.originalVerified===false&&result.solutionAllowed===false,'partial scans may not authorize original solutions');
assert(result.stages.length===5,'five evidence review stages required');
assert(result.facts.length===5);
assert(result.missing.length>=5,'missing source evidence must stay visible');
assert(result.internal.triangleVertices===3&&result.internal.twiceArea>0,'H plane triangle must be nondegenerate in current tracing');
assert(result.facts.every(x=>x.ok),'current traced geometry checks should all pass; otherwise halt for review');
let inspected=new Set();
for(let step=0;step<result.stages.length;step++){
 const lines=model.highlight(current,result,step);
 assert.equal(lines.length,result.stages[step].indices.length);
 for(const ref of lines){
  inspected.add(ref.index);
  const original=current.lines[ref.index];
  assert(original,'missing original source line');
  assert.deepEqual(Array.from(ref.segment),Array.from(original.slice(0,4)),'highlight must exactly equal an existing segment');
  assert.equal(ref.kind,original[4]);
  assert(ref.segment.every(x=>Number.isFinite(x)&&x>=0&&x<=960),'invalid traced canvas bounds');
 }
}
assert(inspected.size>=10,'should review all 2-6-1 lines');
assert.equal(model.highlight(current,result,4).length,0,'final reasoning step may not draw missing third projection');
assert.equal(model.highlight(current,result,6).length,0);
const clone=x=>JSON.parse(JSON.stringify(x));
const cases=[
 x=>{x.status='verified-complete'},
 x=>{x.lines=x.lines.filter(a=>a[4]!=='thin')},
 x=>{x.lines=x.lines.filter(a=>a[4]!=='transfer')},
 x=>{const tri=x.lines.filter(a=>a[4]==='given'&&a[1]>255);tri[0][1]=255;tri[0][3]=255;},
 x=>{x.lines=x.lines.filter(a=>a[4]!=='axis')}
];
for(const modify of cases){
 const bad=clone(current);modify(bad);
 const scan=model.scan(bad);
 assert.equal(scan.safe,false,'unexpected acceptance of incomplete/corrupted source topology');
 assert.equal(model.highlight(bad,scan,0).length,0,'unverified geometry must not be highlighted');
}
const html=read('labs/chapter-drawing.html'),ui=read('labs/exercise-261-ui.js'),answer=read('labs/chapter-drawing.js'),gate=read('knowledge/solution-gate.js');
for(const id of ['sourceEvidence','exercise261Panel','exercise261Prev','exercise261Next','exercise261Status','exercise261Facts','exercise261Missing','exercise261Why'])assert(html.includes('id="'+id+'"'),'missing HTML id '+id);
assert(html.includes('src="exercise-261-evidence.js"')&&html.includes('src="exercise-261-ui.js"'),'missing source evidence scripts');
assert(html.indexOf('src="exercise-261-evidence.js"')<html.indexOf('src="exercise-261-ui.js"'),'must load model first');
assert(ui.includes("layer=$('sourceEvidence')"),'distinct overlay missing');
assert(ui.includes("source.lines[i]")===false||ui.includes('api.highlight('),'overlay must get source-only references');
assert(ui.includes("selected!=='2-6-1'"),'evidence review must hide on other exercises');
assert(!ui.includes("lineFocus")&&!ui.includes("VerifiedExerciseSolutions")&&!ui.includes("source.status='verified-complete'"),'should not change answer state');
assert(answer.includes('return gate.compile({...item,id:current},recipe).steps'),'answer gate must remain active');
assert(gate.includes("source.status!=='verified-complete'"),'partial solution gate must remain active');
const build=read('scripts/build-static.cjs');
for(const asset of ['labs/exercise-261-evidence.js','labs/exercise-261-ui.js'])assert(build.includes("'"+asset+"'"),'missing deployment asset '+asset);
console.log('PASS 2-6-1: original existing lines only, 5 audited evidence stages, textbook answer gate intact, partial scan and missing source declared');
