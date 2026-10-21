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
 const values={modeSelect:'circles',animationSpeed:'1',x1:'0',y1:'0',r1:'5',mode1:'external',
  x2:'20',y2:'0',r2:'5',mode2:'external',filletRadius:'10',
  branch:'',direction:'',travel1:'',travel2:'',
  line1Ax:'-20',line1Ay:'0',line1Bx:'20',line1By:'0',
  line2Ax:'0',line2Ay:'-20',line2Bx:'0',line2By:'20',
  lineSide1:'',lineSide2:'',lineTravel1:'',lineTravel2:'',drawTool:'line'};
 const ids=[...Object.keys(values),'diagram','calculate','prev','next','reset',
  'status','counter','stepTitle','stepText','learningMode','fullControls',
  'hintControls','drawControls','hintNext','hintCounter','undoDraw','redoDraw',
  'clearDraw','checkDraw','drawStatus','playPause','animationSpeed'];
 const elems=new Map(ids.map(id=>[id,{
  id,value:values[id]??'',listeners:{},children:[],hidden:false,
  disabled:false,textContent:'',
  get valueAsNumber(){return this.value.trim()===''?NaN:Number(this.value)},
  addEventListener(type,handler){this.listeners[type]=handler},
  getBoundingClientRect(){return {left:0,top:0,width:720,height:440}},
  setPointerCapture(){},
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
   return {tag,attributes:{},children:[],listeners:{},textContent:'',
    setAttribute(k,v){this.attributes[k]=String(v)},
    addEventListener(type,handler){this.listeners[type]=handler},
    getBoundingClientRect(){return {left:0,top:0,width:720,height:440}},
    setPointerCapture(){},
    append(...elements){this.children.push(...elements)}
   };
  }
 };
 const modules={
  '../engines/planar/circle-circle-fillet.cjs':require('../../engines/planar/circle-circle-fillet.cjs'),
  '../engines/planar/directed-circle-fillet.cjs':require('../../engines/planar/directed-circle-fillet.cjs'),
  '../engines/planar/two-segment-fillet.cjs':require('../../engines/planar/two-segment-fillet.cjs'),
  '../engines/planar/directed-two-segment-fillet.cjs':require('../../engines/planar/directed-two-segment-fillet.cjs'),
  '../workbench/verified-fillet-offset-drawing.cjs':require('../../workbench/verified-fillet-offset-drawing.cjs'),
  '../workbench/verified-fillet-arc-drawing.cjs':require('../../workbench/verified-fillet-arc-drawing.cjs'),
  '../workbench/teaching-timeline-v5.js':require('../../workbench/teaching-timeline-v5.js')
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
 assert.match(get('status').textContent,/选择|candidate|分支|branch/);
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
 assert.match(get('status').textContent,/有向|切线|不连续|conflict|tangent/);
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

test('three teaching modes use real fillet page and do not add duplicate public route',()=>{
 for(const id of ['learningMode','fullControls','hintControls','drawControls',
  'hintNext','hintCounter','undoDraw','redoDraw','clearDraw','checkDraw','drawStatus','playPause']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.match(entry,/gradeFilletOffsetLines\(input,lines/);
 assert.match(entry,/pointerdown/);
 assert.match(entry,/pointerup/);
 assert.match(entry,/pointercancel/);
 assert.match(html,/touch-action:none/);
 assert.doesNotMatch(entry,/fetch\(|XMLHttpRequest|innerHTML\s*=|localStorage/);
});
test('hint mode prevents future auxiliary loci, circle centers and completed SVG arcs',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 get('learningMode').value='hint';fire('learningMode','change');
 assert.equal(get('hintControls').hidden,false);
 assert.equal(get('fullControls').hidden,true);
 assert.equal(get('next').disabled,true);
 for(let i=0;i<6;i++)fire('hintNext','click');
 assert.equal(get('hintCounter').textContent,'6 / 6');
 assert.equal(get('hintNext').disabled,true);
 assert.match(get('stepText').textContent,/有向 G1/);
 const scene=collect();
 assert.equal(scene.filter(n=>n.tag==='path').length,0);
 assert.equal(scene.filter(n=>n.tag==='line'&&n.attributes.stroke==='#c38536').length,0);
 assert.equal(scene.some(n=>n.tag==='text'&&/^s[+-]{2}$/.test(n.textContent)),false);
});
test('real two-segment pen drawings match TWO mathematically generated offset lines only',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 get('learningMode').value='draw';fire('learningMode','change');
 const raw={first:{a:{x:-20,y:0},b:{x:20,y:0}},
  second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10,branchId:'s++',
  direction:'ccw',firstTravel:'forward',secondTravel:'forward'};
 const steps=require('../../engines/planar/directed-two-segment-fillet.cjs')
  .chooseFiniteTwoSegmentArc(raw).steps.filter(s=>s.kind==='offset-line');
 const svg=get('diagram');
 const drag=(line,id)=>{
  const sheet=q=>({x:360+q.x*8,y:220-q.y*8});
  const from=sheet(line.geometry.a),to=sheet(line.geometry.b);
  svg.listeners.pointerdown({pointerId:id,button:0,clientX:from.x,clientY:from.y});
  svg.listeners.pointerup({pointerId:id,button:0,clientX:to.x,clientY:to.y});
 };
 assert.equal(get('drawControls').hidden,false);
 assert.equal(get('fullControls').hidden,true);
 assert.equal(get('next').disabled,true);
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
 drag(steps[0],1);
 assert.match(get('drawStatus').textContent,/辅助线 1 \/ 2/);
 drag(steps[1],2);
 assert.match(get('drawStatus').textContent,/辅助线 2 \/ 2/);
 assert.match(get('drawStatus').textContent,/最终圆弧仍需分别验证/);
 assert.equal(collect().filter(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8').length,2);
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
 fire('undoDraw','click');assert.match(get('drawStatus').textContent,/辅助线 1 \/ 2/);
 fire('redoDraw','click');assert.match(get('drawStatus').textContent,/辅助线 2 \/ 2/);
 get('line1Ay').value='1';fire('line1Ay','input');
 assert.equal(collect().filter(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8').length,0);
 assert.equal(get('undoDraw').disabled,true);
});
test('circle-mode draw grader and missing G1 branch are explicitly unsupported',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('learningMode').value='draw';fire('learningMode','change');
 assert.match(get('drawStatus').textContent,/请先确定/);
 assert.equal(get('checkDraw').disabled,true);
 get('modeSelect').value='segments';fire('modeSelect','change');
 assert.match(get('drawStatus').textContent,/请先确定/);
 assert.equal(get('checkDraw').disabled,true);
 const svg=get('diagram');
 svg.listeners.pointerdown({pointerId:1,button:0,clientX:200,clientY:140});
 svg.listeners.pointerup({pointerId:1,button:0,clientX:520,clientY:140});
 assert.equal(collect().filter(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8').length,0);
});
test('mode switch returns to full lesson and its existing 6-frame G1 arc workflow',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 get('learningMode').value='hint';fire('learningMode','change');
 get('learningMode').value='full';fire('learningMode','change');
 for(let i=0;i<6;i++)fire('next','click');
 assert.equal(get('counter').textContent,'6 / 6');
 assert.equal(collect().filter(n=>n.tag==='path').length,1);
});

test('arc tool exists for both model categories and verifies continuous pen sampling',()=>{
 assert.equal((html.match(/id="drawTool"/g)||[]).length,1);
 assert.match(entry,/gradeFilletArcDrawing\(input,attempts\.at\(-1\)/);
 assert.match(entry,/pointermove/);
 assert.match(entry,/points:pointer\.points/);
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='arc';fire('drawTool','change');
 const args={first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'};
 const a=require('../../engines/planar/directed-two-segment-fillet.cjs')
  .chooseFiniteTwoSegmentArc(args).geometry.data;
 const samples=Array.from({length:33},(_,i)=>{
  const theta=(a.startAngle+(a.endAngle-a.startAngle)*i/32)*Math.PI/180;
  return {x:360+8*(a.center.x+a.radius*Math.cos(theta)),
   y:220-8*(a.center.y+a.radius*Math.sin(theta))};
 });
 const board=get('diagram'),event=(p,id)=>({pointerId:id,button:0,clientX:p.x,clientY:p.y});
 board.listeners.pointerdown(event(samples[0],5));
 for(let i=1;i<32;i++)board.listeners.pointermove(event(samples[i],5));
 board.listeners.pointerup(event(samples[32],5));
 assert.match(get('drawStatus').textContent,/手绘圆弧数学验证通过/);
 assert.match(get('drawStatus').textContent,/不能据此认定全部辅助线/);
 assert.equal(collect().filter(x=>x.tag==='polyline'&&x.attributes.stroke==='#8651a8').length,1);
 assert.equal(collect().filter(x=>x.tag==='path').length,0);
 fire('undoDraw','click');
 assert.match(get('drawStatus').textContent,/尚未绘制连接圆弧/);
 fire('redoDraw','click');
 assert.match(get('drawStatus').textContent,/手绘圆弧数学验证通过/);
 get('line1Ay').value='2';fire('line1Ay','input');
 assert.equal(collect().filter(x=>x.tag==='polyline').length,0);
 assert.equal(get('undoDraw').disabled,true);
});
test('a straight chord cannot masquerade as a mathematically verified arc',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='arc';fire('drawTool','change');
 const selected=require('../../engines/planar/directed-two-segment-fillet.cjs')
  .chooseFiniteTwoSegmentArc({first:{a:{x:-20,y:0},b:{x:20,y:0}},
   second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10,
   branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'});
 const toSheet=q=>({x:360+q.x*8,y:220-q.y*8});
 const first=toSheet(selected.contacts.first),last=toSheet(selected.contacts.second);
 const samples=Array.from({length:21},(_,i)=>({
  x:first.x+(last.x-first.x)*i/20,y:first.y+(last.y-first.y)*i/20
 }));
 const board=get('diagram'),evt=(p,id)=>({pointerId:id,button:0,clientX:p.x,clientY:p.y});
 board.listeners.pointerdown(evt(samples[0],9));
 for(let i=1;i<20;i++)board.listeners.pointermove(evt(samples[i],9));
 board.listeners.pointerup(evt(samples[20],9));
 assert.match(get('drawStatus').textContent,/尚未通过数学验证/);
 assert.doesNotMatch(get('drawStatus').textContent,/数学验证通过/);
 assert.equal(collect().filter(x=>x.tag==='polyline').length,1);
});
test('two-circle branch with explicit directed G1 can grade the actual handwritten curved connection',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='arc';fire('drawTool','change');
 assert.equal(get('checkDraw').disabled,false);
 const args={first:{center:{x:0,y:0},radius:5},
  second:{center:{x:20,y:0},radius:5},filletRadius:10,
  firstMode:'external',secondMode:'external',branchId:'center-1',
  direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'};
 const a=require('../../engines/planar/directed-circle-fillet.cjs')
   .chooseDirectedFillet(args).geometry.data;
 const samples=Array.from({length:49},(_,i)=>{
  const theta=(a.startAngle+(a.endAngle-a.startAngle)*i/48)*Math.PI/180;
  return {x:360+8*(a.center.x+a.radius*Math.cos(theta)),
   y:220-8*(a.center.y+a.radius*Math.sin(theta))};
 });
 const board=get('diagram'),evt=(p,id)=>({pointerId:id,button:0,clientX:p.x,clientY:p.y});
 board.listeners.pointerdown(evt(samples[0],13));
 for(let i=1;i<48;i++)board.listeners.pointermove(evt(samples[i],13));
 board.listeners.pointerup(evt(samples[48],13));
 assert.match(get('drawStatus').textContent,/手绘圆弧数学验证通过/);
 assert.match(get('drawStatus').textContent,/有限已知圆弧范围/);
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
 assert.equal(collect().filter(n=>n.tag==='polyline').length,1);
});
test('cancelled curved pen stroke never earns credit and different pointers cannot finish it',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='arc';fire('drawTool','change');
 const board=get('diagram');
 board.listeners.pointerdown({pointerId:6,button:0,clientX:220,clientY:210});
 board.listeners.pointermove({pointerId:6,button:0,clientX:230,clientY:215});
 board.listeners.pointerup({pointerId:7,button:0,clientX:240,clientY:220});
 board.listeners.pointercancel();
 board.listeners.pointerup({pointerId:6,button:0,clientX:240,clientY:220});
 assert.equal(collect().filter(n=>n.tag==='polyline').length,0);
 assert.match(get('drawStatus').textContent,/尚未绘制/);
});
