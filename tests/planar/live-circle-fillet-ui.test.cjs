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
test('directed fillet is converted from proved model geometry using V5 motion',()=>{
 assert.match(entry,/MotionV5\.projectArcFromVerifiedModel/);
 assert.match(entry,/MotionV5\.updateSvg/);
 assert.match(entry,/chosen\.g1Verified===true/);
 assert.match(entry,/chosen\?\.status==='selected'/);
 assert.doesNotMatch(entry,/Math\.abs\(a\.endAngle-a\.startAngle\)>180\?1:0/);
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
 let time=0,frameId=0;
 const frames=new Map();
 const performance={now:()=>time};
 const requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId};
 const cancelAnimationFrame=id=>frames.delete(id);
 const advance=ms=>{
  if(!Number.isFinite(ms)||ms<0)throw new TypeError('invalid frame time');
  time+=ms;const due=[...frames.values()];frames.clear();
  for(const fn of due)fn(time);
 };
 const values={modeSelect:'circles',animationSpeed:'1',x1:'0',y1:'0',r1:'5',mode1:'external',
  x2:'20',y2:'0',r2:'5',mode2:'external',filletRadius:'10',
  branch:'',direction:'',travel1:'',travel2:'',
  line1Ax:'-20',line1Ay:'0',line1Bx:'20',line1By:'0',
  line2Ax:'0',line2Ay:'-20',line2Bx:'0',line2By:'20',
  lineSide1:'',lineSide2:'',lineTravel1:'',lineTravel2:'',
  drawTool:'line',digitalSource:'first',digitalValue:'10'};
 const ids=[...Object.keys(values),'diagram','calculate','prev','next','reset',
  'status','counter','stepTitle','stepText','learningMode','fullControls',
  'hintControls','drawControls','hintNext','hintCounter','undoDraw','redoDraw',
  'clearDraw','checkDraw','drawStatus','playPause','animationSpeed',
  'addDigital','undoDigital','clearDigital','checkDigital',
  'digitalStatus','centerSnapStatus'];
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
  '../workbench/verified-ruler-tools.cjs':require('../../workbench/verified-ruler-tools.cjs'),
  '../workbench/verified-ruler-steps.cjs':require('../../workbench/verified-ruler-steps.cjs'),
  '../workbench/verified-tangent-point-drawing.cjs':require('../../workbench/verified-tangent-point-drawing.cjs'),
  '../workbench/teaching-timeline-v5.js':require('../../workbench/teaching-timeline-v5.js'),
  '../workbench/teaching-motion-v5.js':require('../../workbench/teaching-motion-v5.js'),
  '../workbench/verified-plan-v5-bridge.cjs':require('../../workbench/verified-plan-v5-bridge.cjs')
 };
 vm.runInNewContext(entry,{document,performance,requestAnimationFrame,cancelAnimationFrame,
 window:{matchMedia:()=>({matches:false})},require:id=>{
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
 return {get,fire,collect,circle,line,advance};
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

test('V5 live fillet clock changes speed without recalculating real selected G1 branch',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 assert.match(get('status').textContent,/两端有向 G1 已经通过向量检验/);
 fire('playPause','click');
 advance(600);assert.equal(get('counter').textContent,'0 / 6');
 get('animationSpeed').value='2';fire('animationSpeed','change');
 advance(300);assert.equal(get('counter').textContent,'1 / 6');
 fire('playPause','click');
 advance(2400);
 assert.equal(get('counter').textContent,'1 / 6','paused player must remain on the same mathematical step');
 assert.equal(collect().some(n=>n.tag==='path'),false);
 fire('playPause','click');advance(10000);
 assert.equal(get('counter').textContent,'6 / 6');
 assert.equal(collect().filter(n=>n.tag==='path').length,1);
 assert.match(get('status').textContent,/有向 G1/);
 get('line1Ay').value='';fire('line1Ay','input');
 assert.equal(get('counter').textContent,'0 / 0');
 assert.match(get('status').textContent,/条件无效/);
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
 advance(20000);
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
});

test('real page includes digital compass/ruler, source choice, and math snap affordance',()=>{
 for(const id of ['digitalSource','digitalValue','addDigital','undoDigital',
  'clearDigital','checkDigital','digitalStatus','centerSnapStatus'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 assert.match(html,/<option value="snap">/);
 assert.match(entry,/constructParallelLine\(input\[sourceId\],value/);
 assert.match(entry,/constructConcentricCircle\(input\[sourceId\],value/);
 assert.match(entry,/gradeStudentAuxiliaries\(isSegments/);
 assert.match(entry,/snapChosenFilletCenter\(/);
 assert.doesNotMatch(entry,/innerHTML\s*=|localStorage|fetch\(/);
});
test('digital signed ruler on the existing finite-segment page scores TWO independent student guides',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('learningMode').value='draw';fire('learningMode','change');
 assert.match(get('digitalStatus').textContent,/0 \/ 2/);
 get('digitalSource').value='first';get('digitalValue').value='10';fire('addDigital','click');
 assert.match(get('digitalStatus').textContent,/1 \/ 2/);
 get('digitalSource').value='second';fire('addDigital','click');
 assert.match(get('digitalStatus').textContent,/2 \/ 2/);
 assert.match(get('digitalStatus').textContent,/仍须独立确定切点/);
 assert.equal(collect().filter(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8').length,2);
 fire('undoDigital','click');
 assert.match(get('digitalStatus').textContent,/1 \/ 2/);
 fire('clearDigital','click');
 assert.match(get('digitalStatus').textContent,/0 \/ 2/);
 assert.equal(collect().filter(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8').length,0);
});
test('wrong numeric radius for student compass fails even though geometry is drawable',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('branch').value='center-1';fire('branch','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('digitalSource').value='first';get('digitalValue').value='12';fire('addDigital','click');
 assert.match(get('digitalStatus').textContent,/0 \/ 2/);
 get('digitalValue').value='15';fire('addDigital','click');
 assert.match(get('digitalStatus').textContent,/1 \/ 2/);
 get('digitalSource').value='second';fire('addDigital','click');
 assert.match(get('digitalStatus').textContent,/2 \/ 2/);
 assert.match(get('digitalStatus').textContent,/额外／错误构造 1/);
 assert.equal(collect().filter(n=>n.tag==='circle'&&n.attributes.stroke==='#8651a8').length,3);
});
test('digital construction with missing candidate does not disclose an automatic center',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('learningMode').value='draw';fire('learningMode','change');
 fire('addDigital','click');
 assert.match(get('digitalStatus').textContent,/必须明确选择有效分支/);
 assert.equal(collect().filter(n=>n.tag==='circle'&&n.attributes.stroke==='#9d6529').length,0);
});
test('student chooses candidate center by tapping actual page in screen coordinates',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('branch').value='center-1';fire('branch','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='snap';fire('drawTool','change');
 const args={first:{center:{x:0,y:0},radius:5},
  second:{center:{x:20,y:0},radius:5},filletRadius:10,
  firstMode:'external',secondMode:'external'};
 const selected=circleCircleFilletCenters(args).candidates.find(x=>x.id==='center-1');
 assert.ok(selected);
 const svg=get('diagram');
 svg.listeners.pointerdown({pointerId:15,button:0,
  clientX:360+selected.center.x*8,clientY:220-selected.center.y*8});
 assert.match(get('centerSnapStatus').textContent,/候选圆心数学吸附通过/);
 assert.match(get('centerSnapStatus').textContent,/仍须验证真实切点/);
 assert.equal(collect().filter(n=>n.tag==='text'&&n.textContent==='已选圆心').length,1);
 svg.listeners.pointerdown({pointerId:16,button:0,clientX:50,clientY:50});
 assert.doesNotMatch(get('centerSnapStatus').textContent,/数学吸附通过/);
 assert.equal(collect().filter(n=>n.tag==='text'&&n.textContent==='已选圆心').length,0);
});
test('input revision clears previous geometric ruler actions and snapped center',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('learningMode').value='draw';fire('learningMode','change');
 fire('addDigital','click');
 assert.match(get('digitalStatus').textContent,/1 \/ 2/);
 get('line1Ay').value='3';fire('line1Ay','input');
 assert.equal(get('undoDigital').disabled,true);
 assert.equal(collect().filter(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8').length,0);
 assert.match(get('centerSnapStatus').textContent,/已清空/);
});

test('two verified finite-segment fillets draw the SAME SVG node progressively while advancing',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 assert.match(get('status').textContent,/两端有向 G1/);
 const paths=()=>collect().filter(n=>n.tag==='path'&&n.attributes['data-verified-arc']==='true');
 fire('playPause','click');advance(6000);
 assert.equal(get('counter').textContent,'5 / 6');
 assert.equal(paths().length,0);
 advance(400);
 assert.equal(paths().length,1,'final approved arc should start appearing during its step');
 const node=paths()[0],early=node.attributes.d;
 assert.match(early,/ A /);
 advance(400);
 assert.equal(paths()[0],node,'per-frame animation must update the same SVG element');
 const halfway=node.attributes.d;
 assert.notEqual(early,halfway,'visible sweep must expand');
 get('animationSpeed').value='0.5';fire('animationSpeed','change');
 advance(400);
 const slowed=paths()[0].attributes.d;
 assert.notEqual(slowed,halfway,'changing speed keeps sweep moving rather than restarting');
 fire('playPause','click');
 const frozen=paths()[0].attributes.d;
 advance(2000);
 assert.equal(paths()[0].attributes.d,frozen,'pause preserves existing directed sweep');
 fire('playPause','click');
 advance(3000);
 assert.equal(get('counter').textContent,'6 / 6');
 assert.equal(paths().length,1);
 assert.equal(paths()[0].attributes.opacity,'1');
});
test('verified two-circle fillet animates but incomplete G1 inputs never paint an answer',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 const paths=()=>collect().filter(n=>n.tag==='path'&&n.attributes['data-verified-arc']==='true');
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 fire('playPause','click');advance(4800);
 assert.equal(paths().length,0,'no asserted G1 travel = no arc, even at final step');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 assert.match(get('status').textContent,/两端有向 G1/);
 fire('playPause','click');advance(3600);
 assert.equal(get('counter').textContent,'3 / 4');
 assert.equal(paths().length,0);
 advance(700);assert.equal(paths().length,1);
 const start=paths()[0].attributes.d;assert.match(start,/ A /);
 advance(700);
 assert.notEqual(paths()[0].attributes.d,start,'verified circle fillet should grow');
 advance(600);
 assert.equal(get('counter').textContent,'4 / 4');
 assert.equal(paths().length,1);
 get('r2').value='';fire('r2','input');
 assert.equal(paths().length,0,'invalid radius clears stale animation and confirmed result');
 advance(12000);assert.equal(paths().length,0);
});

test('public finite line fillet step SVG is byte-identical to verified R1/V5 action coordinates',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 const args={first:{a:{x:-20,y:0},b:{x:20,y:0}},
  second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10,
  branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'};
 const plan=require('../../workbench/verified-plan-v5-bridge.cjs')
   .filletTimeline('segments',args,{origin:{x:360,y:220},scale:8},1);
 assert.equal(plan.status,'ready');assert.equal(plan.steps.length,6);
 for(let i=0;i<6;i++)fire('next','click');
 const actual=collect().filter(n=>n.tag==='path');
 assert.equal(actual.length,1);
 assert.equal(actual[0].attributes['data-verified-arc'],'true');
 const math=require('../../workbench/teaching-motion-v5.js')
  .actionShapeAttrs(plan.steps.at(-1).actions[0],1);
 assert.equal(actual[0].attributes.d,math.d);
 assert.equal(collect().filter(n=>n.tag==='line'&&n.attributes.stroke==='#c38536').length,2);
 assert.equal(get('counter').textContent,'6 / 6');
});
test('public two-circle lesson also uses same exact directed R1/V5 mathematical arc',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 for(let i=0;i<4;i++)fire('next','click');
 const args={first:{center:{x:0,y:0},radius:5},
   second:{center:{x:20,y:0},radius:5},filletRadius:10,
   firstMode:'external',secondMode:'external',branchId:'center-1',
   direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'};
 const plan=require('../../workbench/verified-plan-v5-bridge.cjs')
  .filletTimeline('circles',args,{origin:{x:360,y:220},scale:8},1);
 assert.equal(plan.status,'ready');
 const paths=collect().filter(n=>n.tag==='path');
 assert.equal(paths.length,1);
 assert.equal(paths[0].attributes.d,require('../../workbench/teaching-motion-v5.js')
  .actionShapeAttrs(plan.steps.at(-1).actions[0],1).d);
});
test('arc still advances frame-by-frame with the SAME SVG node after shared plan integration',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 const paths=()=>collect().filter(n=>n.tag==='path'&&n.attributes['data-verified-arc']==='true');
 fire('playPause','click');advance(6000);
 assert.equal(get('counter').textContent,'5 / 6');
 advance(400);
 assert.equal(paths().length,1);
 const node=paths()[0],first=node.attributes.d;
 advance(300);
 assert.equal(paths()[0],node);
 assert.notEqual(paths()[0].attributes.d,first);
});
test('without a complete directed G1 proof, a selected branch never renders its final SVG arc',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 for(let i=0;i<8;i++)fire('next','click');
 assert.equal(get('counter').textContent,'3 / 3');
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
});

test('source-specific tangent tool grades TWO student marks before directed G1 while hiding expected contacts',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='tangent';fire('drawTool','change');
 assert.equal(get('checkDraw').disabled,false,'contacts do not require selected directed arc');
 assert.equal(collect().filter(n=>n.tag==='text'&&/T[₁₂]/.test(n.textContent)).length,0);
 const args={first:{a:{x:-20,y:0},b:{x:20,y:0}},
  second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10};
 const chosen=require('../../engines/planar/two-segment-fillet.cjs')
  .finiteTwoSegmentFillets(args).candidates.find(c=>c.id==='s++');
 const board=get('diagram');
 const tap=(side,id)=>{
  get('digitalSource').value=side;
  const c=chosen.contacts[side];
  board.listeners.pointerdown({pointerId:id,button:0,
   clientX:360+8*c.x,clientY:220-8*c.y});
 };
 tap('first',5);
 assert.match(get('drawStatus').textContent,/学生切点 1 \/ 2/);
 tap('second',6);
 assert.match(get('drawStatus').textContent,/学生切点 2 \/ 2/);
 assert.match(get('drawStatus').textContent,/还需独立验证连接弧/);
 assert.equal(collect().filter(n=>n.tag==='text'&&/我标的 T/.test(n.textContent)).length,2);
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
 fire('undoDraw','click');assert.match(get('drawStatus').textContent,/学生切点 1 \/ 2/);
 fire('redoDraw','click');assert.match(get('drawStatus').textContent,/学生切点 2 \/ 2/);
 get('line1Ay').value='1';fire('line1Ay','input');
 assert.equal(collect().filter(n=>n.tag==='text'&&/我标的 T/.test(n.textContent)).length,0);
 assert.equal(get('undoDraw').disabled,true);
});
test('repeated tap on one true tangent does not earn the second tangent point',()=>{
 const p=interactiveFillet(),{get,fire}=p;
 get('branch').value='center-1';fire('branch','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='tangent';fire('drawTool','change');
 get('digitalSource').value='first';
 const args={first:{center:{x:0,y:0},radius:5},
  second:{center:{x:20,y:0},radius:5},filletRadius:10,
  firstMode:'external',secondMode:'external'};
 const contact=require('../../engines/planar/circle-circle-fillet.cjs')
   .circleCircleFilletCenters(args).candidates.find(c=>c.id==='center-1').contacts.first;
 const board=get('diagram');
 for(let id=1;id<=2;id++)board.listeners.pointerdown({pointerId:id,button:0,
  clientX:360+8*contact.x,clientY:220-8*contact.y});
 assert.match(get('drawStatus').textContent,/学生切点 1 \/ 2/);
 assert.match(get('drawStatus').textContent,/重复或错误标记 1/);
 assert.equal(get('drawTool').value,'tangent');
});
test('tangent tool explicitly blocks branch auto-selection and does not pretend to complete G1',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='tangent';fire('drawTool','change');
 get('digitalSource').value='first';
 get('diagram').listeners.pointerdown({pointerId:1,button:0,clientX:390,clientY:220});
 assert.match(get('drawStatus').textContent,/先选择题目实际存在的圆心分支/);
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
});
