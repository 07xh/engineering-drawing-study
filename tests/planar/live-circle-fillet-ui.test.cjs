'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');
const html=read('labs/circle-fillet-live.html');
const entry=read('labs/circle-fillet-live-entry.cjs');
const build=read('scripts/build-static.cjs');
const home=read('index.html');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const {chooseDirectedFillet}=require('../../engines/planar/directed-circle-fillet.cjs');
const args=()=>({first:{center:{x:0,y:0},radius:5},second:{center:{x:20,y:0},radius:5},
 filletRadius:10,firstMode:'external',secondMode:'external'});
test('public circle fillet page references only build-local bundle',()=>{
 assert.match(html,/circle-fillet-live-bundle\.js/);
 assert.doesNotMatch(html,/https?:\/\//);
 for(const id of ['diagram','x1','y1','r1','mode1','x2','y2','r2','mode2',
  'filletRadius','branch','direction','travel1','travel2','status','prev','next','reset']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
});
test('live UI consumes both real candidate and finite directed G1 solvers',()=>{
 assert.match(entry,/require\('\.\.\/engines\/planar\/circle-circle-fillet\.cjs'\)/);
 assert.match(entry,/require\('\.\.\/engines\/planar\/directed-circle-fillet\.cjs'\)/);
 assert.match(entry,/circleCircleFilletCenters\(args\)/);
 assert.match(entry,/chooseDirectedFillet\(args\)/);
 assert.doesNotMatch(entry,/innerHTML\s*=|fetch\(|XMLHttpRequest|localStorage/);
});
test('SVG sweep direction explicitly converts model ccw to screen flag 0',()=>{
 assert.match(entry,/a\.direction==='cw'\?1:0/);
 assert.match(entry,/Math\.abs\(a\.endAngle-a\.startAngle\)>180\?1:0/);
 assert.match(entry,/chosen\?\.status==='selected'/);
});
test('circle fillet public whitelist and home navigation preserve source privacy',()=>{
 assert.match(build,/'labs\/circle-fillet-live\.html'/);
 assert.match(build,/labs\/circle-fillet-live-entry\.cjs/);
 assert.match(build,/labs\/circle-fillet-live-bundle\.js/);
 assert.match(home,/href="labs\/circle-fillet-live\.html"/);
 assert.doesNotMatch(build,/'tests\/planar\/directed-circle-fillet\.test\.cjs'/);
});
test('actual two-circle model gives two candidates and blocks missing direction',()=>{
 const c=circleCircleFilletCenters(args());
 assert.equal(c.candidateCount,2);
 const noChoice=chooseDirectedFillet({...args(),direction:'cw'});
 assert.equal(noChoice.status,'branch-choice-required');
 const explicit=chooseDirectedFillet({...args(),branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
 assert.equal(explicit.status,'selected');
 assert.equal(explicit.g1Verified,true);
 const wrong=chooseDirectedFillet({...args(),branchId:'center-1',direction:'cw',
  knownFirstTravel:'cw',knownSecondTravel:'ccw'});
 assert.equal(wrong.status,'direction-conflict');
});

test('existing teaching page contains finite segment controls, not a second page',()=>{
 for(const id of ['modeSelect','line1Ax','line1Ay','line1Bx','line1By',
   'line2Ax','line2Ay','line2Bx','line2By','lineSide1','lineSide2',
   'lineTravel1','lineTravel2']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.match(html,/<option value="segments">/);
 assert.match(entry,/require\('\.\.\/engines\/planar\/two-segment-fillet\.cjs'\)/);
 assert.match(entry,/require\('\.\.\/engines\/planar\/directed-two-segment-fillet\.cjs'\)/);
 assert.match(entry,/finiteTwoSegmentFillets\(args\)/);
 assert.match(entry,/chooseFiniteTwoSegmentArc\(args\)/);
 assert.doesNotMatch(entry,/fetch\(|XMLHttpRequest|innerHTML\s*=|localStorage/);
});
function interactiveFillet(){
 const vm=require('node:vm');
 const values={modeSelect:'circles',x1:'0',y1:'0',r1:'5',mode1:'external',
  x2:'20',y2:'0',r2:'5',mode2:'external',filletRadius:'10',
  branch:'',direction:'',travel1:'',travel2:'',
  line1Ax:'-20',line1Ay:'0',line1Bx:'20',line1By:'0',
  line2Ax:'0',line2Ay:'-20',line2Bx:'0',line2By:'20',
  lineSide1:'',lineSide2:'',lineTravel1:'',lineTravel2:''};
 const ids=[...Object.keys(values),'diagram','calculate','prev','next','reset',
  'status','counter','stepTitle','stepText'];
 const elems=new Map(ids.map(id=>[id,{
  id,value:values[id]??'',listeners:{},children:[],hidden:false,
  disabled:false,textContent:'',
  get valueAsNumber(){return this.value.trim()===''?NaN:Number(this.value)},
  addEventListener(type,handler){this.listeners[type]=handler},
  append(...elements){this.children.push(...elements)},
  replaceChildren(...elements){this.children=[...elements]}
 }]));
 const circle=[{hidden:false},{hidden:false}];
 const line=[{hidden:true},{hidden:true}];
 const document={
  getElementById(id){
   if(!elems.has(id))throw Error('Missing input '+id);
   return elems.get(id);
  },
  querySelectorAll(sel){return sel==='.circle-only'?circle:sel==='.line-only'?line:[]},
  createElement(tag){
   assert.equal(tag,'option');
   return {tag:'option',value:'',textContent:''};
  },
  createElementNS(_ns,tag){
   return {tag,attributes:{},children:[],textContent:'',
    setAttribute(k,v){this.attributes[k]=String(v)},
    append(...elements){this.children.push(...elements)}
   };
  }
 };
 const modules={
  '../engines/planar/circle-circle-fillet.cjs':require('../../engines/planar/circle-circle-fillet.cjs'),
  '../engines/planar/directed-circle-fillet.cjs':require('../../engines/planar/directed-circle-fillet.cjs'),
  '../engines/planar/two-segment-fillet.cjs':require('../../engines/planar/two-segment-fillet.cjs'),
  '../engines/planar/directed-two-segment-fillet.cjs':require('../../engines/planar/directed-two-segment-fillet.cjs')
 };
 vm.runInNewContext(entry,{document,require:id=>{
  if(!Object.hasOwn(modules,id))throw Error('Unexpected bundle require '+id);
  return modules[id];
 }});
 const get=id=>elems.get(id);
 const fire=(id,type)=>{const f=get(id).listeners[type];assert.equal(typeof f,'function');
  f()};
 const collect=()=>{
  const out=[],walk=n=>{out.push(n);for(const c of n.children??[])walk(c)};
  for(const n of get('diagram').children)walk(n);
  return out;
 };
 return {get,fire,collect,circle,line};
}
test('line mode enumerates genuine finite tangent candidates and a verified six-step SVG arc',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 assert.equal(p.circle.every(c=>c.hidden),true);
 assert.equal(p.line.every(c=>!c.hidden),true);
 assert.match(get('status').textContent,/4 个有效候选圆心/);
 assert.deepEqual(get('branch').children.map(c=>c.value),
  ['', 's--','s-+','s+-','s++']);
 assert.equal(collect().some(n=>n.tag==='path'),false);
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 assert.match(get('status').textContent,/两端有向 G1 已经通过向量检验/);
 for(let i=0;i<6;i++)fire('next','click');
 assert.equal(get('counter').textContent,'6 / 6');
 assert.equal(collect().filter(n=>n.tag==='path').length,1);
 assert.equal(get('next').disabled,true);
 assert.match(get('stepText').textContent,/有向 G1/);
});
test('line mode invalidates old arc and candidate choice when source segment excludes old tangency',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 for(let i=0;i<6;i++)fire('next','click');
 assert.equal(collect().filter(n=>n.tag==='path').length,1);
 get('line1Ax').value='0';fire('line1Ax','input');
 assert.equal(get('branch').value,'');
 assert.equal(get('counter').textContent,'0 / 3');
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
 assert.match(get('status').textContent,/选择|candidate|分支/);
 get('line1Ax').value='';fire('line1Ax','input');
 assert.match(get('status').textContent,/条件无效/);
 assert.equal(get('counter').textContent,'0 / 0');
 assert.equal(get('next').disabled,true);
});
test('wrong source travel blocks final SVG arc without changing valid geometric centers',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='reverse';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 assert.match(get('status').textContent,/有向|切线|不连续|conflict/);
 for(let i=0;i<7;i++)fire('next','click');
 assert.equal(get('counter').textContent,'3 / 3');
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
 assert.equal(get('next').disabled,true);
});
test('switching back to circles retains original two-circle solver and four-step playback',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('modeSelect').value='circles';fire('modeSelect','change');
 assert.equal(get('branch').value,'');
 assert.deepEqual(get('branch').children.map(c=>c.value),
  ['', 'center-1','center-2']);
 assert.match(get('status').textContent,/2 个有效候选圆心/);
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 assert.match(get('status').textContent,/有向 G1/);
 for(let i=0;i<4;i++)fire('next','click');
 assert.equal(get('counter').textContent,'4 / 4');
 assert.equal(collect().filter(n=>n.tag==='path').length,1);
});
test('parallel continuous centers do not display guessed finite arc',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('line2Ax').value='-10';get('line2Ay').value='20';
 get('line2Bx').value='10';get('line2By').value='20';
 get('lineSide1').value='1';get('lineSide2').value='-1';
 fire('line2Bx','input');
 assert.match(get('status').textContent,/连续多解/);
 assert.deepEqual(get('branch').children.map(c=>c.value),['']);
 for(let i=0;i<7;i++)fire('next','click');
 assert.equal(get('counter').textContent,'3 / 3');
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
});
