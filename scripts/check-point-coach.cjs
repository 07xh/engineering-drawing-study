'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const C=require('../labs/point-coach-core.js'),G=require('../labs/point-construction-core.js');
const p={x:26,y:34,z:44};
const answer=(s,y=p.y,z=p.z,reason=C.reasons.correct)=>C.act(C.act(s,{type:'candidate',value:{y,z}}),{type:'reason',value:reason});
const check=s=>C.act(s,{type:'check'});
assert.equal(C.grade(C.create()).kind,'missing-point');
assert.equal(C.grade(C.act(C.create(),{type:'candidate',value:{y:34,z:44}})).kind,'missing-reason');
for(const [y,z,kind] of [[34,40,'height'],[30,44,'depth'],[30,40,'both'],[34,44,'correct']])assert.equal(C.grade(answer(C.create(),y,z)).kind,kind);
assert.equal(C.grade(answer(C.create(),34,44,'height-only')).kind,'reason');
assert.equal(C.performance(check(answer(C.create()))),'independent');
let assisted=C.act(C.create(),{type:'hint'});assisted=C.act(assisted,{type:'reset'});
assert.equal(C.performance(check(answer(assisted))),'guided','reset must not erase help');
for(const type of ['hint','explain','model'])assert.equal(C.performance(check(answer(C.act(C.create(),{type})))),'guided');
let failed=check(answer(C.create(),30,44));failed=check(answer(failed));assert.equal(C.performance(failed),'guided','error feedback is help');
assert.equal(C.act(failed,{type:'check'}).checks,failed.checks,'repeat submit cannot add checks');
for(let y=8;y<=58;y+=2)for(let z=8;z<=58;z+=2){
 const q={x:20,y,z},s=answer(C.create(q),y,z);assert(C.grade(s).correct);
 const at=G.coordinates(q).W;assert.equal((at[0]-G.origin.x)/G.scale,y);assert.equal((G.origin.y-at[1])/G.scale,z);
}
for(const candidate of [{y:NaN,z:20},{y:20,z:Infinity},{y:-1,z:20},{y:71,z:20}])assert.equal(C.validCandidate(candidate),false);
assert.throws(()=>C.create({x:0,y:20,z:20}));
assert.notEqual(C.id(C.generate(()=>0,['10-10-10'])), '10-10-10');
assert.equal(C.restore('bad json').active.solved,false);
const recovered=C.restore(JSON.stringify({version:1,active:{...C.create(),solved:true,candidate:{y:0,z:0},reason:'height-depth'},records:[]}));assert.equal(recovered.active.solved,false);
const restored=C.restore(JSON.stringify({version:1,active:check(answer(assisted)),records:[]}));assert.equal(C.performance(restored.active),'guided');
const html=fs.readFileSync('labs/point-coach.html','utf8');
class Element{
 constructor(){this.value='';this.hidden=false;this.children=[];this.attributes={};this.events={};this.classList={toggle(){}};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(k,v){this.attributes[k]=v;}
 getAttribute(k){return this.attributes[k];}
 addEventListener(type,fn){this.events[type]=fn;}
 fire(type,event={}){this.events[type]?.({preventDefault(){},...event});}
 focus(){}
 scrollIntoView(){}
 getScreenCTM(){return {inverse:()=>({})};}
}
function page({raw=null,deny=false}={}){
 const nodes={},radios=['height-depth','height-only','x-height'].map(value=>Object.assign(new Element(),{value}));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 ids.forEach(id=>nodes[id]=new Element());nodes.modelAngle.value='40';
 const memory=new Map(raw?[[C.storageKey,raw]]:[]);
 const context={PointCoach:C,PointConstruction:G,console,Date,Math,DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}},localStorage:{getItem:key=>memory.get(key)||null,setItem(key,value){if(deny)throw Error('denied');memory.set(key,value);}},document:{getElementById:id=>nodes[id],createElement:()=>new Element(),querySelectorAll:()=>radios}};
 context.window=context;vm.runInNewContext(fs.readFileSync('labs/point-coach-ui.js','utf8'),context);
 return {nodes,radios,memory};
}
const first=page(),n=first.nodes;
n.candidateY.value='34';n.candidateY.fire('input');assert.equal(n.candidateY.value,'34','partial input must survive');
n.candidateZ.value='44';n.candidateZ.fire('input');first.radios[0].fire('change');n.answerForm.fire('submit');
assert.equal(n.successPanel.hidden,false);assert.equal(n.independentCount.textContent,'1 组');assert.equal(n.guidedCount.textContent,'0 组');
n.answerForm.fire('submit');assert.equal(JSON.parse(first.memory.get(C.storageKey)).records.length,1);
const again=page({raw:first.memory.get(C.storageKey)});assert.equal(again.nodes.successPanel.hidden,false);assert.equal(again.nodes.independentCount.textContent,'1 组');
const helped=page(),h=helped.nodes;h.hintButton.fire('click');h.resetAttempt.fire('click');
h.coachBoard.fire('click',{clientX:G.origin.x+34*G.scale,clientY:G.origin.y-44*G.scale});helped.radios[0].fire('change');h.answerForm.fire('submit');assert.equal(h.guidedCount.textContent,'1 组');
h.nextPractice.fire('click');const fresh=JSON.parse(helped.memory.get(C.storageKey));assert.notEqual(C.id(fresh.active.problem),C.id(p));assert.equal(fresh.active.assisted,false);assert.equal(h.successPanel.hidden,true);assert.equal(h.hintList.children.length,0);
const denied=page({deny:true});assert(denied.nodes.storageStatus.textContent.includes('无法保存'));
for(const asset of ['labs/point-coach.html','labs/point-coach.css','labs/point-coach-core.js','labs/point-coach-ui.js'])assert(fs.readFileSync('scripts/build-static.cjs','utf8').includes("'"+asset+"'"));
assert(fs.readFileSync('index.html','utf8').includes('href="labs/point-coach.html"'));
console.log('PASS point coach: 676 geometry cases, targeted feedback, independent/guided distinction, retry and reload, click/input, hint reset, fresh tasks, denied storage, packaged entry');
