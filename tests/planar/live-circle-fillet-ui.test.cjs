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
  arcExtent1:'full',arcStart1:'300',arcEnd1:'330',arcDirection1:'ccw',
  x2:'20',y2:'0',r2:'5',mode2:'external',
  arcExtent2:'full',arcStart2:'215',arcEnd2:'245',arcDirection2:'ccw',filletRadius:'10',
  branch:'',direction:'',travel1:'',travel2:'',
  line1Ax:'-20',line1Ay:'0',line1Bx:'20',line1By:'0',
  line2Ax:'0',line2Ay:'-20',line2Bx:'0',line2By:'20',
  lineSide1:'',lineSide2:'',lineTravel1:'',lineTravel2:'',
  mixAx:'-25',mixAy:'0',mixBx:'25',mixBy:'0',
  mixX:'0',mixY:'5',mixR:'8',mixArcExtent:'full',
  mixArcStart:'155',mixArcEnd:'175',mixArcDirection:'ccw',
  mixSide:'1',mixLineTravel:'',mixCircleTravel:'',
  drawTool:'line',digitalSource:'first',digitalValue:'10'};
 const ids=[...Object.keys(values),'diagram','calculate','prev','next','reset',
  'status','counter','stepTitle','stepText','learningMode','fullControls',
  'hintControls','drawControls','hintNext','hintCounter','undoDraw','redoDraw',
  'clearDraw','checkDraw','drawStatus','playPause','animationSpeed',
  'filletProgress','filletProgressLabel','filletRestart',
  'addDigital','undoDigital','clearDigital','checkDigital',
  'digitalStatus','centerSnapStatus','learningProgress',
  'filletProof','filletProofTitle','filletProofWhy','filletProofBasis',
  'filletProofCheck','filletProofEvidence','filletProofScope'];
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
 const mixed=[{hidden:true},{hidden:true}];
 const docListeners={};let motionHandler=null;
 const motion={matches:false,addEventListener(type,fn){
  if(type==='change')motionHandler=fn;
 }};
 const document={
  hidden:false,
  addEventListener(type,fn){docListeners[type]=fn},
  getElementById(id){
   if(!elems.has(id))throw Error('Missing input '+id);
   return elems.get(id);
  },
  querySelectorAll(sel){return sel==='.circle-only'?circle:
   sel==='.line-only'?line:sel==='.mixed-only'?mixed:[]},
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
  '../engines/planar/segment-circle-fillet.cjs':require('../../engines/planar/segment-circle-fillet.cjs'),
  '../engines/planar/directed-segment-circle-fillet.cjs':require('../../engines/planar/directed-segment-circle-fillet.cjs'),
  '../workbench/verified-fillet-offset-drawing.cjs':require('../../workbench/verified-fillet-offset-drawing.cjs'),
  '../workbench/verified-fillet-arc-drawing.cjs':require('../../workbench/verified-fillet-arc-drawing.cjs'),
  '../workbench/verified-ruler-tools.cjs':require('../../workbench/verified-ruler-tools.cjs'),
  '../workbench/verified-ruler-steps.cjs':require('../../workbench/verified-ruler-steps.cjs'),
  '../workbench/verified-tangent-point-drawing.cjs':require('../../workbench/verified-tangent-point-drawing.cjs'),
  '../workbench/verified-student-fillet-progress.cjs':require('../../workbench/verified-student-fillet-progress.cjs'),
  '../workbench/teaching-timeline-v5.js':require('../../workbench/teaching-timeline-v5.js'),
  '../workbench/teaching-motion-v5.js':require('../../workbench/teaching-motion-v5.js'),
  '../workbench/verified-plan-v5-bridge.cjs':require('../../workbench/verified-plan-v5-bridge.cjs'),
  '../workbench/verified-fillet-step-reasons.cjs':require('../../workbench/verified-fillet-step-reasons.cjs'),
  '../workbench/verified-fillet-progressive-motion.cjs':require('../../workbench/verified-fillet-progressive-motion.cjs')
 };
 vm.runInNewContext(entry,{document,performance,requestAnimationFrame,cancelAnimationFrame,
 window:{matchMedia:()=>motion},require:id=>{
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
 const setHidden=value=>{
  document.hidden=!!value;docListeners.visibilitychange?.();
 };
 const setReduced=value=>{
  motion.matches=!!value;motionHandler?.({matches:motion.matches});
 };
 return {get,fire,collect,circle,line,mixed,advance,setHidden,setReduced};
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
 assert.match(entry,/constructParallelLine\(mode==='segment-circle'\?input\.segment:input\[sourceId\]/);
 assert.match(entry,/constructConcentricCircle\(mode==='segment-circle'\?input\.circle:input\[sourceId\]/);
 assert.match(entry,/gradeStudentAuxiliaries\(currentKind,input,digitalActions/);
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
 assert.match(get('digitalStatus').textContent,/额外或错误构造 1/);
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

test('real full student four-stage math progress appears without claiming the textbook problem is solved',()=>{
 assert.equal((html.match(/id="learningProgress"/g)||[]).length,1);
 const p=interactiveFillet(),{get,fire}=p;
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 get('learningMode').value='draw';fire('learningMode','change');
 assert.match(get('learningProgress').textContent,/已通过 0 \/ 4/);
 const raw=require('../../engines/planar/circle-circle-fillet.cjs')
  .circleCircleFilletCenters({first:{center:{x:0,y:0},radius:5},
   second:{center:{x:20,y:0},radius:5},filletRadius:10,
   firstMode:'external',secondMode:'external'});
 const c=raw.candidates.find(x=>x.id==='center-1');
 for(const source of ['first','second']){
  get('digitalSource').value=source;
  get('digitalValue').value=String(raw.auxiliary[source+'Locus'].radius);
  fire('addDigital','click');
 }
 assert.match(get('learningProgress').textContent,/已通过 1 \/ 4/);
 const board=get('diagram'),tap=(p,id)=>{
  board.listeners.pointerdown({pointerId:id,button:0,
   clientX:360+8*p.x,clientY:220-8*p.y});
 };
 get('drawTool').value='snap';fire('drawTool','change');
 tap(c.center,11);
 assert.match(get('learningProgress').textContent,/已通过 2 \/ 4/);
 get('drawTool').value='tangent';fire('drawTool','change');
 get('digitalSource').value='first';tap(c.contacts.first,12);
 get('digitalSource').value='second';tap(c.contacts.second,13);
 assert.match(get('learningProgress').textContent,/已通过 3 \/ 4/);
 get('drawTool').value='arc';fire('drawTool','change');
 const g=require('../../engines/planar/directed-circle-fillet.cjs')
  .chooseDirectedFillet({first:{center:{x:0,y:0},radius:5},
   second:{center:{x:20,y:0},radius:5},
   filletRadius:10,firstMode:'external',secondMode:'external',
   branchId:'center-1',direction:'cw',
   knownFirstTravel:'ccw',knownSecondTravel:'ccw'}).geometry.data;
 const samples=Array.from({length:49},(_,i)=>{
  const angle=(g.startAngle+(g.endAngle-g.startAngle)*i/48)*Math.PI/180;
  return {x:360+8*(g.center.x+g.radius*Math.cos(angle)),
   y:220-8*(g.center.y+g.radius*Math.sin(angle))};
 });
 const mouse=(p,id)=>({pointerId:id,button:0,clientX:p.x,clientY:p.y});
 board.listeners.pointerdown(mouse(samples[0],14));
 for(let i=1;i<48;i++)board.listeners.pointermove(mouse(samples[i],14));
 board.listeners.pointerup(mouse(samples[48],14));
 assert.match(get('learningProgress').textContent,/已通过 4 \/ 4/);
 assert.match(get('learningProgress').textContent,/未证明完整教材题/);
 fire('undoDraw','click');
 assert.match(get('learningProgress').textContent,/已通过 3 \/ 4/);
 get('filletRadius').value='11';fire('filletRadius','input');
 assert.match(get('learningProgress').textContent,/已通过 0 \/ 4/);
});
test('actual student center tap is not replaced by hidden perfect snap geometry for progress',()=>{
 const p=interactiveFillet(),{get,fire}=p;
 get('branch').value='center-1';fire('branch','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='snap';fire('drawTool','change');
 const c=require('../../engines/planar/circle-circle-fillet.cjs')
  .circleCircleFilletCenters({first:{center:{x:0,y:0},radius:5},
   second:{center:{x:20,y:0},radius:5},filletRadius:10,
   firstMode:'external',secondMode:'external'}).candidates[0];
 get('diagram').listeners.pointerdown({pointerId:1,button:0,
  clientX:360+8*(c.center.x+1.7),clientY:220-8*c.center.y});
 assert.match(get('learningProgress').textContent,/已通过 0 \/ 4/);
 assert.match(get('centerSnapStatus').textContent,/未满足|失败/);
});

test('finite original-circle arcs filter center branches and draw only given source sectors',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 assert.equal(collect().filter(n=>n.attributes?.['data-given-source-arc']==='true').length,0);
 get('arcExtent1').value='finite';fire('arcExtent1','change');
 assert.deepEqual(get('branch').children.map(x=>x.value),['','center-1']);
 const given=collect().filter(n=>n.attributes?.['data-given-source-arc']==='true');
 assert.equal(given.length,1);
 assert.equal(given[0].tag,'path');
 assert.match(given[0].attributes.d,/ A /);
 assert.equal(collect().filter(n=>n.tag==='circle'&&n.attributes.stroke==='#257650').length,1);
 assert.match(get('status').textContent,/1 个|唯一|有限|center/);
 get('arcExtent2').value='finite';fire('arcExtent2','change');
 assert.deepEqual(get('branch').children.map(x=>x.value),['','center-1']);
 assert.equal(collect().filter(n=>n.attributes?.['data-given-source-arc']==='true').length,2);
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 for(let i=0;i<4;i++)fire('next','click');
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,1);
});
test('finite sector clipping can remove every circle tangent candidate and final SVG',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('arcExtent1').value='finite';fire('arcExtent1','change');
 get('arcStart1').value='30';fire('arcStart1','input');
 get('arcEnd1').value='60';fire('arcEnd1','input');
 get('arcExtent2').value='finite';fire('arcExtent2','change');
 assert.deepEqual(get('branch').children.map(x=>x.value),['']);
 for(let i=0;i<4;i++)fire('next','click');
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,0);
 assert.equal(get('branch').value,'');
});
test('changing finite arc restrictions invalidates selected previous branch and drawn student constructions',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 for(let i=0;i<4;i++)fire('next','click');
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,1);
 get('arcExtent1').value='finite';fire('arcExtent1','change');
 get('arcStart1').value='30';fire('arcStart1','input');
 get('arcEnd1').value='60';fire('arcEnd1','input');
 assert.equal(get('branch').value,'');
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,0);
});
test('finite arc angular degeneracy fails closed rather than drawing a full input circle',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('arcExtent1').value='finite';fire('arcExtent1','change');
 get('arcStart1').value='40';fire('arcStart1','input');
 get('arcEnd1').value='40';fire('arcEnd1','input');
 assert.match(get('status').textContent,/条件无效/);
 assert.equal(collect().filter(n=>n.attributes?.['data-given-source-arc']==='true').length,0);
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,0);
});

test('third mode uses the SAME public fillet teaching page with actual finite segment+circle inputs',()=>{
 assert.match(html,/<option value="segment-circle">/);
 for(const id of ['mixAx','mixAy','mixBx','mixBy','mixX','mixY','mixR',
  'mixArcExtent','mixArcStart','mixArcEnd','mixArcDirection','mixSide',
  'mixLineTravel','mixCircleTravel'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 assert.match(entry,/chooseDirectedSegmentCircleFillet\(args\)/);
 assert.match(entry,/filletTimeline\(isSegments\?'segments':isMixed\?'segment-circle':'circles'/);
 const p=interactiveFillet(),{get,fire,circle,line,mixed}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 assert.ok(mixed.every(n=>n.hidden===false));
 assert.ok(circle.every(n=>n.hidden===true));
 assert.ok(line.every(n=>n.hidden===true));
 assert.deepEqual(get('branch').children.map(x=>x.value),
  ['','candidate-1','candidate-2']);
});
test('student explicitly chooses real candidate and two source travels, then V5 paints exact five-step mathematical arc',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 get('branch').value='candidate-1';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('mixLineTravel').value='forward';fire('mixLineTravel','change');
 get('mixCircleTravel').value='cw';fire('mixCircleTravel','change');
 const args={segment:{a:{x:-25,y:0},b:{x:25,y:0}},
  circle:{center:{x:0,y:5},radius:8},filletRadius:10,side:1,
  branchId:'candidate-1',direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'};
 const plan=require('../../workbench/verified-plan-v5-bridge.cjs')
  .filletTimeline('segment-circle',args,{origin:{x:360,y:220},scale:8},1);
 assert.equal(plan.status,'ready');assert.equal(plan.steps.length,5);
 for(let i=0;i<5;i++)fire('next','click');
 assert.equal(get('counter').textContent,'5 / 5');
 const paths=collect().filter(n=>n.tag==='path');
 assert.equal(paths.length,1);
 assert.equal(paths[0].attributes.d,require('../../workbench/teaching-motion-v5.js')
  .actionShapeAttrs(plan.steps[4].actions[0],1).d);
 assert.equal(paths[0].attributes['data-verified-arc'],'true');
 assert.equal(collect().filter(n=>n.tag==='line'&&n.attributes.stroke==='#c38536').length,1);
 assert.equal(collect().filter(n=>n.tag==='circle'&&n.attributes.stroke==='#c38536').length,1);
});
test('candidate without explicit G1 travels can show only bounded exploratory steps, not a false final arc',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 get('branch').value='candidate-1';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 for(let i=0;i<8;i++)fire('next','click');
 assert.equal(get('counter').textContent,'3 / 3');
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
 get('mixLineTravel').value='reverse';fire('mixLineTravel','change');
 get('mixCircleTravel').value='cw';fire('mixCircleTravel','change');
 assert.equal(collect().filter(n=>n.tag==='path').length,0);
 assert.match(get('status').textContent,/不连续|冲突|轮廓/);
});
test('finite known circle arc removes excluded candidate ID and never fabricates the supporting full circle',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 get('mixArcExtent').value='finite';fire('mixArcExtent','change');
 assert.deepEqual(get('branch').children.map(x=>x.value),['','candidate-1']);
 const given=collect().filter(n=>n.tag==='path'&&n.attributes['data-given-source-arc']==='true');
 assert.equal(given.length,1);
 assert.equal(collect().filter(n=>n.tag==='circle'&&n.attributes.stroke==='#257650').length,0);
 get('mixArcStart').value='60';get('mixArcEnd').value='90';
 fire('mixArcStart','input');
 assert.deepEqual(get('branch').children.map(x=>x.value),['']);
 assert.equal(collect().filter(n=>n.attributes['data-verified-arc']==='true').length,0);
});
test('mixed student draw mode grades true source-specific tangent taps and pen arc, not other tools',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 get('branch').value='candidate-1';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('mixLineTravel').value='forward';fire('mixLineTravel','change');
 get('mixCircleTravel').value='cw';fire('mixCircleTravel','change');
 get('learningMode').value='draw';fire('learningMode','change');
 assert.equal(get('drawTool').disabled,false);
 assert.equal(get('drawTool').value,'tangent');
 assert.equal(get('checkDigital').disabled,false,'mixed construction now has a real mathematics grader');
 assert.equal(get('checkDraw').disabled,false);
 assert.match(get('learningProgress').textContent,/0 \/ 4/);
 const input={segment:{a:{x:-25,y:0},b:{x:25,y:0}},
  circle:{center:{x:0,y:5},radius:8},filletRadius:10,side:1,
  branchId:'candidate-1',direction:'ccw',
  lineTravel:'forward',knownCircleTravel:'cw'};
 const solved=require('../../engines/planar/directed-segment-circle-fillet.cjs')
  .chooseDirectedSegmentCircleFillet(input);
 assert.equal(solved.status,'selected');assert.equal(solved.g1Verified,true);
 const board=get('diagram'),ev=(q,id)=>({
  pointerId:id,button:0,clientX:q.x,clientY:q.y
 }),toSheet=m=>({x:360+8*m.x,y:220-8*m.y});
 get('digitalSource').value='first';
 board.listeners.pointerdown(ev(toSheet(solved.contacts.first),5));
 get('digitalSource').value='second';
 board.listeners.pointerdown(ev(toSheet(solved.contacts.second),6));
 assert.match(get('drawStatus').textContent,/学生切点 2 \/ 2/);
 assert.match(get('learningProgress').textContent,/1 \/ 4/);
 assert.equal(collect().filter(n=>n.tag==='path'&&n.attributes['data-verified-arc']==='true').length,0);
 get('drawTool').value='arc';fire('drawTool','change');
 assert.equal(get('checkDraw').disabled,false);
 const g=solved.geometry.data;
 const points=Array.from({length:49},(_,i)=>{
  const a=(g.startAngle+(g.endAngle-g.startAngle)*i/48)*Math.PI/180;
  return toSheet({x:g.center.x+g.radius*Math.cos(a),y:g.center.y+g.radius*Math.sin(a)});
 });
 board.listeners.pointerdown(ev(points[0],7));
 for(let i=1;i<48;i++)board.listeners.pointermove(ev(points[i],7));
 board.listeners.pointerup(ev(points[48],7));
 assert.match(get('drawStatus').textContent,/手绘连接弧数学验证通过/);
 assert.match(get('learningProgress').textContent,/2 \/ 4/);
 assert.match(get('learningProgress').textContent,/未完成步骤不能冒充已证明/);
 assert.equal(collect().filter(n=>n.tag==='polyline').length,1);
 fire('undoDraw','click');assert.match(get('learningProgress').textContent,/1 \/ 4/);
 fire('redoDraw','click');assert.match(get('learningProgress').textContent,/2 \/ 4/);
 get('mixR').value='9';fire('mixR','input');
 assert.match(get('learningProgress').textContent,/0 \/ 4/);
 assert.equal(collect().filter(n=>n.tag==='polyline').length,0);
 get('learningMode').value='hint';fire('learningMode','change');
 for(let i=0;i<5;i++)fire('hintNext','click');
 assert.equal(collect().filter(n=>n.attributes['data-verified-arc']==='true').length,0);
});
test('mixed source finite arc filters branches in draw mode and forbids impossible taps',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 get('mixArcExtent').value='finite';fire('mixArcExtent','change');
 assert.deepEqual(get('branch').children.map(x=>x.value),['','candidate-1']);
 get('branch').value='candidate-1';fire('branch','change');
 get('learningMode').value='draw';fire('learningMode','change');
 const args={segment:{a:{x:-25,y:0},b:{x:25,y:0}},
  circle:{center:{x:0,y:5},radius:8,arc:{startAngle:155,endAngle:175,direction:'ccw'}},
  filletRadius:10,side:1};
 const c=require('../../engines/planar/segment-circle-fillet.cjs')
  .finiteSegmentCircleFillets(args).candidates[0];
 const board=get('diagram');
 for(const [id,side,where] of [[1,'first',c.lineContact],[2,'second',c.circleContact]]){
  get('digitalSource').value=side;
  board.listeners.pointerdown({pointerId:id,button:0,
   clientX:360+8*where.x,clientY:220-8*where.y});
 }
 assert.match(get('learningProgress').textContent,/1 \/ 4/);
 get('mixArcStart').value='60';get('mixArcEnd').value='90';
 fire('mixArcStart','input');
 assert.deepEqual(get('branch').children.map(x=>x.value),['']);
 assert.match(get('learningProgress').textContent,/0 \/ 4/);
 assert.equal(collect().filter(n=>n.tag==='polyline').length,0);
});
test('mixed student drawing blocks free-line painting but allows explicit mathematical center snap',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 get('learningMode').value='draw';fire('learningMode','change');
 get('drawTool').value='snap';fire('drawTool','change');
 assert.equal(get('drawTool').value,'snap');
 get('drawTool').value='line';fire('drawTool','change');
 assert.equal(get('drawTool').value,'tangent');
 assert.equal(get('addDigital').disabled,false);
 const board=get('diagram');
 board.listeners.pointerdown({pointerId:3,button:0,clientX:400,clientY:230});
 assert.match(get('drawStatus').textContent,/先选择题目实际存在的圆心分支/);
 assert.equal(collect().filter(n=>n.tag==='polyline').length,0);
});

test('mixed finite segment+circle completes all four real student math construction scopes on the same page',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 get('branch').value='candidate-1';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('mixLineTravel').value='forward';fire('mixLineTravel','change');
 get('mixCircleTravel').value='cw';fire('mixCircleTravel','change');
 get('learningMode').value='draw';fire('learningMode','change');
 const args={segment:{a:{x:-25,y:0},b:{x:25,y:0}},
  circle:{center:{x:0,y:5},radius:8},filletRadius:10,side:1,
  branchId:'candidate-1',direction:'ccw',
  lineTravel:'forward',knownCircleTravel:'cw'};
 const center=require('../../engines/planar/segment-circle-fillet.cjs')
  .finiteSegmentCircleFillets(args).candidates.find(c=>c.id==='candidate-1');
 assert.ok(center);
 assert.match(get('learningProgress').textContent,/0 \/ 4/);
 for(const [source,value] of [['first',10],['second',18]]){
  get('digitalSource').value=source;
  get('digitalValue').value=String(value);
  fire('addDigital','click');
 }
 assert.match(get('learningProgress').textContent,/1 \/ 4/);
 assert.match(get('digitalStatus').textContent,/辅助轨迹 2 \/ 2/);
 const board=get('diagram');
 const tap=(point,id)=>board.listeners.pointerdown({pointerId:id,button:0,
  clientX:360+8*point.x,clientY:220-8*point.y});
 get('drawTool').value='snap';fire('drawTool','change');
 assert.equal(get('drawTool').value,'snap');
 tap(center.center,31);
 assert.match(get('learningProgress').textContent,/2 \/ 4/);
 get('drawTool').value='tangent';fire('drawTool','change');
 get('digitalSource').value='first';tap(center.lineContact,32);
 get('digitalSource').value='second';tap(center.circleContact,33);
 assert.match(get('learningProgress').textContent,/3 \/ 4/);
 get('drawTool').value='arc';fire('drawTool','change');
 const geometry=require('../../engines/planar/directed-segment-circle-fillet.cjs')
  .chooseDirectedSegmentCircleFillet(args).geometry.data;
 const points=Array.from({length:49},(_,k)=>{
  const angle=(geometry.startAngle+
   (geometry.endAngle-geometry.startAngle)*k/48)*Math.PI/180;
  return {x:360+8*(geometry.center.x+geometry.radius*Math.cos(angle)),
   y:220-8*(geometry.center.y+geometry.radius*Math.sin(angle))};
 });
 const evt=(point,id)=>({pointerId:id,button:0,clientX:point.x,clientY:point.y});
 board.listeners.pointerdown(evt(points[0],34));
 for(let j=1;j<48;j++)board.listeners.pointermove(evt(points[j],34));
 board.listeners.pointerup(evt(points[48],34));
 assert.match(get('learningProgress').textContent,/4 \/ 4/);
 assert.match(get('learningProgress').textContent,/未证明完整教材题/);
 assert.equal(collect().filter(n=>n.tag==='polyline').length,1);
 fire('undoDraw','click');
 assert.match(get('learningProgress').textContent,/3 \/ 4/);
 get('mixArcExtent').value='finite';fire('mixArcExtent','change');
 get('mixArcStart').value='50';get('mixArcEnd').value='90';
 fire('mixArcStart','input');
 assert.match(get('learningProgress').textContent,/0 \/ 4/);
 assert.equal(get('addDigital').disabled,false);
 assert.equal(collect().filter(n=>n.tag==='polyline').length,0);
});
test('V5 proof panel follows actual circle solver steps without revealing final G1 early',()=>{
 const p=interactiveFillet(),{get,fire}=p;
 assert.equal(get('filletProof').hidden,false);
 assert.match(get('filletProofTitle').textContent,/验证尚不完整/);
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 assert.match(get('status').textContent,/两端有向 G1/);
 assert.match(get('filletProofTitle').textContent,/观察阶段/);
 for(let n=1;n<=3;n++){
  fire('next','click');
  assert.match(get('filletProofTitle').textContent,new RegExp('第 '+n+' / 4 步'));
  assert.ok(get('filletProofWhy').textContent.length>10);
  assert.match(get('filletProofEvidence').textContent,/不会提前展示最终圆弧/);
  assert.doesNotMatch(get('filletProofEvidence').textContent,/双侧有向 G1 验证通过/);
 }
 fire('next','click');
 assert.match(get('filletProofTitle').textContent,/第 4 \/ 4 步/);
 assert.match(get('filletProofEvidence').textContent,/双侧有向 G1 验证通过/);
 assert.match(get('filletProofScope').textContent,/并非完整教材题/);
 fire('prev','click');
 assert.doesNotMatch(get('filletProofEvidence').textContent,/双侧有向 G1 验证通过/);
});
test('V5 proof panel is hidden in hint and drawing modes even when full solution was validated',()=>{
 const p=interactiveFillet(),{get,fire}=p;
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 for(let n=0;n<4;n++)fire('next','click');
 assert.match(get('filletProofEvidence').textContent,/G1/);
 get('learningMode').value='hint';fire('learningMode','change');
 assert.equal(get('filletProof').hidden,true);
 assert.equal(get('hintControls').hidden,false);
 get('learningMode').value='draw';fire('learningMode','change');
 assert.equal(get('filletProof').hidden,true);
 assert.equal(get('drawControls').hidden,false);
 get('learningMode').value='full';fire('learningMode','change');
 assert.equal(get('filletProof').hidden,false);
 assert.match(get('filletProofTitle').textContent,/观察阶段/);
});
test('V5 proof panel represents six real finite-segment construction steps and invalidates old proofs',()=>{
 const p=interactiveFillet(),{get,fire}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 for(let n=0;n<6;n++)fire('next','click');
 assert.match(get('filletProofTitle').textContent,/第 6 \/ 6 步/);
 assert.match(get('filletProofEvidence').textContent,/G1/);
 get('line1Ax').value='0';fire('line1Ax','input');
 assert.match(get('filletProofTitle').textContent,/验证尚不完整/);
 assert.doesNotMatch(get('filletProofEvidence').textContent,/双侧有向 G1 验证通过/);
});
test('V5 finite segment-circle teaching uses five verified steps and guards invalid finite source arcs',()=>{
 const p=interactiveFillet(),{get,fire}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 get('branch').value='candidate-1';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('mixLineTravel').value='forward';fire('mixLineTravel','change');
 get('mixCircleTravel').value='cw';fire('mixCircleTravel','change');
 assert.match(get('status').textContent,/两端有向 G1/);
 for(let n=0;n<5;n++)fire('next','click');
 assert.match(get('filletProofTitle').textContent,/第 5 \/ 5 步/);
 assert.match(get('filletProofEvidence').textContent,/双侧有向 G1 验证通过/);
 get('mixArcExtent').value='finite';fire('mixArcExtent','change');
 get('mixArcStart').value='60';fire('mixArcStart','input');
 get('mixArcEnd').value='80';fire('mixArcEnd','input');
 assert.match(get('filletProofTitle').textContent,/验证尚不完整/);
 assert.doesNotMatch(get('filletProofEvidence').textContent,/双侧有向 G1 验证通过/);
});


test('V5 default two-circle auxiliary LOCUS strokes grow progressively instead of flashing at step boundary',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 const guides=()=>collect().filter(n=>n.attributes?.['data-v5-progressive']==='circle');
 assert.equal(get('branch').value,'','default has no chosen candidate');
 fire('playPause','click');
 advance(150);
 assert.equal(get('counter').textContent,'0 / 4');
 assert.equal(guides().length,1,'first actual auxiliary circle starts tracing');
 const node=guides()[0],first=node.attributes['stroke-dasharray'];
 assert.match(first,/^[0-9.e+-]+ [0-9.e+-]+$/);
 assert.ok(Number(first.split(' ')[0])>0);
 advance(140);
 assert.equal(guides()[0],node,'updates the SAME circle node during the stroke');
 assert.notEqual(guides()[0].attributes['stroke-dasharray'],first);
 fire('playPause','click');
 const frozen=guides()[0].attributes['stroke-dasharray'];
 advance(5000);
 assert.equal(guides()[0].attributes['stroke-dasharray'],frozen,'paused guide is frozen');
 fire('playPause','click');advance(1100);
 assert.equal(get('counter').textContent,'1 / 4');
 const painted=collect().filter(n=>n.tag==='circle'&&n.attributes.stroke==='#c38536'&&n.attributes.fill==='none');
 assert.equal(painted.length,2,'both real auxiliary circles remain after the step completes');
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,0,
  'no branch means no final answer');
});
test('verified two-circle G1 still traces both radius loci in sequence before revealing the directed arc',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 get('branch').value='center-1';fire('branch','change');
 get('direction').value='cw';fire('direction','change');
 get('travel1').value='ccw';fire('travel1','change');
 get('travel2').value='ccw';fire('travel2','change');
 fire('playPause','click');
 advance(220);
 const pending=collect().filter(n=>n.attributes?.['data-v5-progressive']==='circle');
 assert.equal(pending.length,1);
 const firstDash=pending[0].attributes['stroke-dasharray'];
 assert.notEqual(firstDash,'none');
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,0);
 advance(520);
 const second=collect().filter(n=>n.attributes?.['data-v5-progressive']==='circle');
 assert.equal(second.length,2,'second verified locus now starts tracing');
 assert.notEqual(second[1].attributes['stroke-dasharray'],'none');
 advance(530);
 assert.equal(get('counter').textContent,'1 / 4');
 assert.equal(collect().filter(n=>n.tag==='circle'&&n.attributes.stroke==='#c38536'&&n.attributes.fill==='none').length,2);
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,0);
});
test('V5 line fillet draws each exact solver offset as a moving endpoint, keeps one SVG node per stroke',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 get('modeSelect').value='segments';fire('modeSelect','change');
 get('branch').value='s++';fire('branch','change');
 get('direction').value='ccw';fire('direction','change');
 get('lineTravel1').value='forward';fire('lineTravel1','change');
 get('lineTravel2').value='forward';fire('lineTravel2','change');
 const lines=()=>collect().filter(n=>n.attributes?.['data-v5-progressive']==='line');
 fire('playPause','click');advance(300);
 assert.equal(get('counter').textContent,'0 / 6');
 assert.equal(lines().length,1);
 const first=lines()[0],a=Number(first.attributes.x1),b=Number(first.attributes.x2);
 assert.notEqual(a,b,'actual line segment is partially visible');
 const old=b;advance(300);
 assert.equal(lines()[0],first);
 assert.notEqual(Number(lines()[0].attributes.x2),old);
 advance(650);
 assert.equal(get('counter').textContent,'1 / 6');
 const all=collect().filter(n=>n.tag==='line'&&n.attributes.stroke==='#c38536');
 assert.ok(all.length>=1);
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,0);
});
test('V5 true mixed segment-circle first line and concentric circle animate without unverified arc',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 get('modeSelect').value='segment-circle';fire('modeSelect','change');
 // The exploratory mode is mathematically valid even without a selected branch.
 fire('playPause','click');advance(400);
 const line=collect().filter(n=>n.attributes?.['data-v5-progressive']==='line');
 assert.equal(line.length,1);
 assert.notEqual(line[0].attributes.x1,line[0].attributes.x2);
 advance(1100);
 const circles=collect().filter(n=>n.attributes?.['data-v5-progressive']==='circle');
 assert.equal(circles.length,1);
 assert.notEqual(circles[0].attributes['stroke-dasharray'],'none');
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,0);
});
test('V5 input revision and learning mode switch destroy partially animated auxiliary shapes',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 const guides=()=>collect().filter(n=>n.attributes?.['data-v5-progressive']);
 fire('playPause','click');advance(300);
 assert.ok(guides().length);
 get('filletRadius').value='11';fire('filletRadius','input');
 assert.equal(guides().length,0,'stale solver locus is erased immediately');
 advance(12000);
 assert.equal(guides().length,0);
 fire('playPause','click');advance(300);
 assert.ok(guides().length);
 get('learningMode').value='hint';fire('learningMode','change');
 assert.equal(guides().length,0);
 advance(4000);
 assert.equal(guides().length,0);
});

test('V5 pen slider truly traces partial auxiliary circles and rewinds their SVG circumference',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 const circles=()=>collect().filter(n=>n.attributes?.['data-v5-progressive']==='circle');
 assert.equal(get('filletProgress').disabled,false);
 get('filletProgress').value='50';fire('filletProgress','input');
 assert.equal(get('counter').textContent,'0 / 4');
 assert.equal(circles().length,1);
 const first=circles()[0].attributes['stroke-dasharray'];
 assert.match(first,/^\S+ \S+$/);
 get('filletProgress').value='175';fire('filletProgress','input');
 assert.equal(circles().length,2);
 assert.notEqual(circles()[1].attributes['stroke-dasharray'],'none');
 get('filletProgress').value='25';fire('filletProgress','input');
 assert.equal(circles().length,1);
 assert.notEqual(circles()[0].attributes['stroke-dasharray'],first);
 assert.equal(get('filletProgressLabel').textContent,'3%');
});
test('seek into only the verified G1 final step; rewind removes its result',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 for(const [id,v] of [['branch','center-1'],['direction','cw'],
  ['travel1','ccw'],['travel2','ccw']]){get(id).value=v;fire(id,'change')}
 const arcs=()=>collect().filter(n=>n.attributes?.['data-verified-arc']==='true');
 get('filletProgress').value='850';fire('filletProgress','input');
 assert.equal(get('counter').textContent,'3 / 4');
 assert.equal(arcs().length,1);
 const partial=arcs()[0].attributes.d;
 get('filletProgress').value='1000';fire('filletProgress','input');
 assert.equal(get('counter').textContent,'4 / 4');
 assert.equal(get('filletProgressLabel').textContent,'100%');
 assert.notEqual(arcs()[0].attributes.d,partial);
 get('filletProgress').value='0';fire('filletProgress','input');
 assert.equal(get('counter').textContent,'0 / 4');
 assert.equal(arcs().length,0);
});
test('no branch never leaks unverified G1 on slider; restart clears progress',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 get('filletProgress').value='950';fire('filletProgress','input');
 assert.equal(collect().filter(n=>n.attributes?.['data-verified-arc']==='true').length,0);
 fire('filletRestart','click');
 assert.equal(get('counter').textContent,'0 / 4');
 assert.equal(get('filletProgressLabel').textContent,'0%');
});
test('touch seeking pauses timeline, keeps same partial stroke and resumes normally',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect}=p;
 const strokes=()=>collect().filter(n=>n.attributes?.['data-v5-progressive']==='circle');
 fire('playPause','click');advance(300);
 const before=strokes()[0].attributes['stroke-dasharray'];
 get('filletProgress').value='140';fire('filletProgress','input');
 assert.equal(strokes().length,2,'seek crosses the first completed locus');
 const sought=strokes()[1].attributes['stroke-dasharray'];
 assert.notEqual(sought,'none','second auxiliary locus is still tracing');
 assert.notEqual(sought,before);
 advance(2000);
 assert.equal(strokes()[1].attributes['stroke-dasharray'],sought);
 fire('playPause','click');advance(100);
 assert.notEqual(strokes()[1].attributes['stroke-dasharray'],sought,
  'resume continues on second partially drawn locus, not completed first circle');
});
test('hidden Android tab pauses frame clock and return does not fast-forward',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect,setHidden}=p;
 const strokes=()=>collect().filter(n=>n.attributes?.['data-v5-progressive']==='circle');
 fire('playPause','click');advance(300);
 const old=strokes()[0].attributes['stroke-dasharray'];
 setHidden(true);advance(60000);
 assert.equal(strokes()[0].attributes['stroke-dasharray'],old);
 assert.equal(get('playPause').textContent,'逐笔播放');
 setHidden(false);advance(30000);
 assert.equal(strokes()[0].attributes['stroke-dasharray'],old);
 fire('playPause','click');advance(150);
 assert.notEqual(strokes()[0].attributes['stroke-dasharray'],old);
});
test('live reduced motion stops RAF while allowing discrete math-backed scrubbing',()=>{
 const p=interactiveFillet(),{get,fire,advance,collect,setReduced}=p;
 const strokes=()=>collect().filter(n=>n.attributes?.['data-v5-progressive']==='circle');
 fire('playPause','click');advance(200);
 setReduced(true);
 const frozen=strokes()[0].attributes['stroke-dasharray'];
 advance(5000);
 assert.equal(strokes()[0].attributes['stroke-dasharray'],frozen);
 assert.equal(get('playPause').disabled,true);
 get('filletProgress').value='400';fire('filletProgress','input');
 assert.equal(get('filletProgressLabel').textContent,'40%');
});
test('math input changes erase stale seeked construction and restore zero-time scrubber',()=>{
 const p=interactiveFillet(),{get,fire,collect}=p;
 const moving=()=>collect().filter(n=>n.attributes?.['data-v5-progressive']);
 get('filletProgress').value='150';fire('filletProgress','input');
 assert.ok(moving().length);
 get('filletRadius').value='11';fire('filletRadius','input');
 assert.equal(moving().length,0);
 assert.equal(get('filletProgressLabel').textContent,'0%');
 assert.equal(get('filletProgress').value,'0');
});
