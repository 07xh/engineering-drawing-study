'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('labs/point-projection-live.html');
const script=read('labs/point-projection-live-entry.cjs');
const build=read('scripts/build-static.cjs');
const home=read('index.html');
const {solveProjection}=require('../../engines/projection/point-projection.cjs');

test('live P0 projection page uses local bundled solver and not a fake static answer',()=>{
 assert.match(html,/point-projection-live-bundle\.js/);
 assert.doesNotMatch(html,/https?:\/\//i);
 assert.match(script,/require\('\.\.\/engines\/projection\/point-projection\.cjs'\)/);
 assert.match(script,/solveProjection\(given\)/);
 assert.doesNotMatch(script,/innerHTML\s*=/);
 assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
});
test('input revision invalidation happens before recompute; no stale computed points',()=>{
 assert.match(script,/revision\+\+/);
 assert.match(script,/solution=null;teaching=null;shownStep=0/);
 assert.match(script,/if\(s\.status==='unique'&&teaching\?\.status==='ready'&&learningMode==='full'\)/);
 assert.match(script,/teaching\.steps\.slice\(0,shownStep\)/);
 assert.match(script,/if\(shownStep===s\.steps\.length&&\(!stageClock\|\|stageClock\.snapshot\(\)\.done\)\)/);
});
test('input and keyboard accessible live controls are wired',()=>{
 for(const id of ['paperSvg','pairSelect','firstU','firstV','secondU','secondV','scaleInput',
   'recompute','resetExample','previous','next','restart','solveStatus','stepExplanation']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  assert.match(script,new RegExp(id));
 }
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/@media\(max-width:900px\)/);
 assert.match(html,/min-height:44px/);
 assert.match(script,/createElementNS/);
});
test('production home links exact public page, build packages it without publishing source',()=>{
 assert.match(home,/href="labs\/point-projection-live\.html"/);
 assert.match(build,/'labs\/point-projection-live\.html'/);
 assert.match(build,/labs\/point-projection-live-entry\.cjs/);
 assert.match(build,/labs\/point-projection-live-bundle\.js/);
 assert.doesNotMatch(build,/'tests\/projection\/point-projection\.test\.cjs'/);
 assert.doesNotMatch(build,/'core\/contracts\/geometry\.js'/);
});
test('live solver uses true point projection and fails closed on contradictory data',()=>{
 const success=solveProjection({knownViews:{V:[15,12],H:[15,10]}});
 assert.equal(success.status,'unique');
 assert.deepEqual(success.point,{x:15,y:10,z:12});
 assert.equal(success.steps.length,4);
 const bad=solveProjection({knownViews:{V:[15,12],H:[16,10]}});
 assert.equal(bad.status,'none');
 assert.deepEqual(bad.steps,[]);
});

test('direct XYZ input and guide toggle are present in the published UI',()=>{
 for(const id of ['spaceInputs','spaceX','spaceY','spaceZ','showGuides']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.match(html,/<option value="XYZ">/);
 assert.match(script,/knownPoint:\{x:xyz\[0\],y:xyz\[1\],z:xyz\[2\]\}/);
 assert.match(script,/knownPoint\?'已按空间点坐标计算/);
 assert.match(script,/\.classList\.toggle\('hidden',pair/);
 assert.match(script,/\$\('showGuides'\)\.addEventListener\('change',render\)/);
});

function createInteractivePage(){
 const vm=require('node:vm');
 let virtualNow=0,taskId=0;
 const animationTasks=new Map();
 const performance={now:()=>virtualNow};
 const requestAnimationFrame=fn=>{animationTasks.set(++taskId,fn);return taskId};
 const cancelAnimationFrame=id=>animationTasks.delete(id);
 const advance=delta=>{
  if(!Number.isFinite(delta)||delta<0)throw new TypeError('invalid frame delta');
  virtualNow+=delta;
  const tasks=[...animationTasks.values()];animationTasks.clear();
  for(const task of tasks)task(virtualNow);
 };
 const values={pairSelect:'XYZ',firstU:'15',firstV:'12',secondU:'15',
  secondV:'10',animationSpeed:'1',spaceX:'15',spaceY:'10',spaceZ:'12',scaleInput:'4'};
 const ids=['paperSvg','pairSelect','spaceInputs','projectionInputs','firstU',
  'firstV','secondU','secondV','spaceX','spaceY','spaceZ','scaleInput','showGuides',
  'firstULabel','firstVLabel','secondULabel','secondVLabel','recompute','resetExample',
  'previous','next','restart','solveStatus','stepTitle','stepExplanation','stepCounter',
  'learningMode','fullControls','hintControls','drawControls','hintReveal',
  'hintCounter','undoDraw','redoDraw','clearDraw','checkDraw','drawStatus',
  'playPause','animationSpeed','projectionMono','projectionFocus',
  'projectionViewReset','projectionPicked','projectionViewport'];
 const elements=new Map(ids.map(id=>[id,{
  id,value:values[id]??'',checked:id==='showGuides'||id==='projectionFocus',
  listeners:{},children:[],hidden:false,attributes:{},classes:new Set(),
  setAttribute(k,v){this.attributes[k]=String(v)},
  getAttribute(k){return this.attributes[k]??null},
  get classList(){return {toggle:(c,on)=>{
   if(on)this.classes.add(c);else this.classes.delete(c);
  },contains:c=>this.classes.has(c)};},
  firstChild:{textContent:''},
  addEventListener(kind,callback){this.listeners[kind]=callback},
  getBoundingClientRect(){return {left:0,top:0,width:720,height:470}},
  setPointerCapture(){},
  replaceChildren(...nodes){this.children=[...nodes]},
  append(...nodes){this.children.push(...nodes)},
  get valueAsNumber(){return this.value.trim()===''?NaN:Number(this.value)},
  textContent:'',disabled:false
 }]));
 const document={
  getElementById(id){
   if(!elements.has(id))throw Error('missing mock control: '+id);
   return elements.get(id);
  },
  createElementNS(_namespace,tag){
   return {tag,attributes:{},children:[],textContent:'',
    setAttribute(name,value){this.attributes[name]=String(value)},
    getAttribute(name){return this.attributes[name]??null},
    append(...nodes){this.children.push(...nodes)}
   };
  }
 };
 const nodeRequire=id=>{
  if(id==='../engines/projection/point-projection.cjs')
   return require('../../engines/projection/point-projection.cjs');
  if(id==='../core/projection/conventions.js')
   return require('../../core/projection/conventions.js');
  if(id==='../workbench/verified-projection-drawing.cjs')
   return require('../../workbench/verified-projection-drawing.cjs');
  if(id==='../workbench/verified-plan-v5-bridge.cjs')
   return require('../../workbench/verified-plan-v5-bridge.cjs');
  if(id==='../workbench/teaching-timeline-v5.js')
   return require('../../workbench/teaching-timeline-v5.js');
  if(id==='../workbench/teaching-motion-v5.js')
   return require('../../workbench/teaching-motion-v5.js');
  throw Error('unexpected runtime module '+id);
 };
 vm.runInNewContext(script,{require:nodeRequire,document,performance,
  requestAnimationFrame,cancelAnimationFrame,
  window:{matchMedia:()=>({matches:false})}});
 const get=id=>elements.get(id);
 const fire=(id,event)=>{const el=get(id);assert.equal(typeof el.listeners[event],'function');
  el.listeners[event]()};
 const allSvgNodes=()=>{
  const out=[],visit=node=>{
   out.push(node);
   for(const child of node.children??[])visit(child);
  };
  for(const n of get('paperSvg').children)visit(n);
  return out;
 };
 return {get,fire,allSvgNodes,advance};
}

test('real UI computes XYZ, all three V/H/W results, and mathematical guide toggle',()=>{
 const page=createInteractivePage();
 const {get,fire,allSvgNodes}=page;
 assert.match(get('solveStatus').textContent,/15, 10, 12/);
 assert.match(get('stepExplanation').textContent,/空间点 P/);
 for(let i=0;i<4;i++)fire('next','click');
 assert.equal(get('stepCounter').textContent,'4 / 4');
 let nodes=allSvgNodes();
 assert.equal(nodes.filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133').length,4);
 assert.equal(nodes.filter(n=>n.tag==='text'&&n.textContent.startsWith('由空间点投影 ')).length,3);
 get('showGuides').checked=false;fire('showGuides','change');
 nodes=allSvgNodes();
 assert.equal(nodes.filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133').length,0);
 assert.equal(nodes.filter(n=>n.tag==='text'&&n.textContent.startsWith('由空间点投影 ')).length,3);
 assert.match(get('solveStatus').textContent,/15, 10, 12/);
 get('spaceX').value='-7';fire('spaceX','input');
 assert.equal(get('stepCounter').textContent,'0 / 4');
 assert.match(get('solveStatus').textContent,/-7, 10, 12/);
 assert.equal(allSvgNodes().some(n=>n.tag==='text'&&n.textContent.startsWith('由空间点投影 ')),false);
});

test('UI mode switch recalculates via real VH solver and rejects invalid XYZ without stale guides',()=>{
 const {get,fire,allSvgNodes}=createInteractivePage();
 get('pairSelect').value='VH';fire('pairSelect','change');
 assert.match(get('solveStatus').textContent,/15, 10, 12/);
 for(let i=0;i<4;i++)fire('next','click');
 let nodes=allSvgNodes();
 assert.equal(nodes.filter(n=>n.tag==='text'&&n.textContent==='求得 W').length,1);
 assert.equal(nodes.filter(n=>n.tag==='text'&&n.textContent.startsWith('已知 ')).length,2);
 get('pairSelect').value='XYZ';fire('pairSelect','change');
 for(let i=0;i<4;i++)fire('next','click');
 get('spaceY').value='';fire('spaceY','input');
 assert.match(get('solveStatus').textContent,/输入尚未有效/);
 assert.equal(get('stepCounter').textContent,'0 / 0');
 assert.equal(get('next').disabled,true);
 assert.equal(allSvgNodes().some(n=>n.tag==='text'&&n.textContent.startsWith('由空间点投影 ')),false);
 get('spaceY').value='10';fire('spaceY','input');
 assert.match(get('solveStatus').textContent,/15, 10, 12/);
 get('scaleInput').value='0';fire('scaleInput','input');
 assert.match(get('solveStatus').textContent,/显示比例/);
 assert.equal(get('next').disabled,true);
});

test('three modes are present on the SAME real-solver site, with accessible pen controls',()=>{
 for(const id of ['learningMode','fullControls','hintControls','drawControls','hintReveal',
  'hintCounter','undoDraw','redoDraw','clearDraw','checkDraw','drawStatus','playPause']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 for(const mode of ['full','hint','draw'])assert.match(html,new RegExp('value="'+mode+'"'));
 assert.match(script,/gradeProjectionDrawing\(s\.steps,studentStrokes/);
 assert.match(script,/pointerdown/);assert.match(script,/pointerup/);
 assert.match(script,/pointercancel/);assert.match(html,/touch-action:none/);
 assert.match(html,/prefers-reduced-motion/);
 assert.doesNotMatch(script,/innerHTML\s*=|XMLHttpRequest|fetch\(/);
});
test('hint mode shows reasons without exposing future computed SVG guide or W answer',()=>{
 const p=createInteractivePage(),{get,fire,allSvgNodes}=p;
 get('learningMode').value='hint';fire('learningMode','change');
 assert.equal(get('hintControls').hidden,false);
 assert.equal(get('fullControls').hidden,true);
 assert.equal(get('next').disabled,true);
 const seen=()=>allSvgNodes().filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133');
 assert.equal(seen().length,0);
 fire('hintReveal','click');
 assert.match(get('stepExplanation').textContent,/正面与水平投影/);
 assert.equal(get('hintCounter').textContent,'1 / 4');
 for(let i=0;i<5;i++)fire('hintReveal','click');
 assert.equal(get('hintCounter').textContent,'4 / 4');
 assert.equal(get('hintReveal').disabled,true);
 assert.equal(seen().length,0);
 assert.equal(allSvgNodes().filter(n=>n.tag==='text'&&String(n.textContent).startsWith('由空间点投影 ')).length,0);
});
test('student pen strokes are graded against actual 4 mathematical guides without revealing answers',()=>{
 const p=createInteractivePage(),{get,fire,allSvgNodes}=p;
 get('learningMode').value='draw';fire('learningMode','change');
 const result=solveProjection({knownPoint:{x:15,y:10,z:12},
  sheetTransform:{origin:{x:360,y:210},scale:4}});
 const lineNodes=()=>allSvgNodes().filter(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8');
 const draw=(from,to,id)=>{
  const svg=get('paperSvg');
  svg.listeners.pointerdown({pointerId:id,button:0,clientX:from.x,clientY:from.y});
  svg.listeners.pointerup({pointerId:id,button:0,clientX:to.x,clientY:to.y});
 };
 assert.equal(get('next').disabled,true);
 assert.equal(get('drawControls').hidden,false);
 assert.equal(get('fullControls').hidden,true);
 assert.equal(lineNodes().length,0);
 for(let i=0;i<4;i++)draw(result.steps[i].from,result.steps[i].to,i+1);
 assert.equal(lineNodes().length,4);
 assert.match(get('drawStatus').textContent,/已验证 4 \/ 4/);
 assert.match(get('drawStatus').textContent,/全部通过/);
 assert.equal(allSvgNodes().some(n=>n.tag==='text'&&String(n.textContent).startsWith('由空间点投影 ')),false);
 fire('undoDraw','click');
 assert.equal(lineNodes().length,3);
 assert.match(get('drawStatus').textContent,/已验证 3 \/ 4/);
 fire('redoDraw','click');
 assert.equal(lineNodes().length,4);
 assert.match(get('drawStatus').textContent,/已验证 4 \/ 4/);
 fire('clearDraw','click');
 assert.equal(lineNodes().length,0);
 assert.match(get('drawStatus').textContent,/已验证 0 \/ 4/);
});
test('incorrect, repeated and stale student lines cannot certify all guides',()=>{
 const p=createInteractivePage(),{get,fire,allSvgNodes}=p;
 get('learningMode').value='draw';fire('learningMode','change');
 const result=solveProjection({knownPoint:{x:15,y:10,z:12},
  sheetTransform:{origin:{x:360,y:210},scale:4}});
 const svg=get('paperSvg'),draw=(from,to,id)=>{
  svg.listeners.pointerdown({pointerId:id,button:0,clientX:from.x,clientY:from.y});
  svg.listeners.pointerup({pointerId:id,button:0,clientX:to.x,clientY:to.y});
 };
 for(let i=0;i<4;i++)draw(result.steps[0].from,result.steps[0].to,i+10);
 assert.match(get('drawStatus').textContent,/已验证 1 \/ 4/);
 assert.match(get('drawStatus').textContent,/额外线条 3/);
 const before=allSvgNodes().filter(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8').length;
 assert.equal(before,4);
 get('spaceX').value='21';fire('spaceX','input');
 assert.match(get('solveStatus').textContent,/21, 10, 12/);
 assert.equal(allSvgNodes().filter(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8').length,0);
 assert.match(get('drawStatus').textContent,/已验证 0 \/ 4/);
 get('spaceY').value='';fire('spaceY','input');
 assert.match(get('drawStatus').textContent,/不能判题/);
 assert.equal(get('paperSvg').classList===undefined,false);
 const savedCount=allSvgNodes().length;
 draw({x:280,y:160},{x:280,y:250},900);
 assert.equal(allSvgNodes().length,savedCount,'nonunique/invalid state must refuse touch drawings');
});
test('input zoom change clears old touch strokes; mode switching does not expose draw answer',()=>{
 const p=createInteractivePage(),{get,fire,allSvgNodes}=p;
 get('learningMode').value='draw';fire('learningMode','change');
 const guide=solveProjection({knownPoint:{x:15,y:10,z:12},
  sheetTransform:{origin:{x:360,y:210},scale:4}}).steps[0];
 const svg=get('paperSvg');
 svg.listeners.pointerdown({pointerId:1,button:0,clientX:guide.from.x,clientY:guide.from.y});
 svg.listeners.pointerup({pointerId:1,button:0,clientX:guide.to.x,clientY:guide.to.y});
 assert.match(get('drawStatus').textContent,/1 \/ 4/);
 get('scaleInput').value='8';fire('scaleInput','input');
 assert.match(get('drawStatus').textContent,/0 \/ 4/);
 fire('undoDraw','click');assert.equal(get('undoDraw').disabled,true);
 get('learningMode').value='hint';fire('learningMode','change');
 assert.equal(allSvgNodes().some(n=>n.tag==='line'&&n.attributes.stroke==='#8651a8'),false);
 assert.equal(allSvgNodes().some(n=>n.tag==='line'&&n.attributes.stroke==='#c28133'),false);
 get('learningMode').value='full';fire('learningMode','change');
 fire('next','click');
 assert.equal(allSvgNodes().filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133').length,1);
});

test('official point page uses the same proof-backed drawing line coordinates as R1/V5',()=>{
 const {pointTimeline}=require('../../workbench/verified-plan-v5-bridge.cjs');
 const p=createInteractivePage();
 const plan=pointTimeline({knownPoint:{x:15,y:10,z:12},
   sheetTransform:{origin:{x:360,y:210},scale:4}},1);
 assert.equal(plan.status,'ready');
 for(let i=0;i<4;i++)p.fire('next','click');
 const visible=p.allSvgNodes().filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133');
 assert.equal(visible.length,4);
 for(let i=0;i<4;i++){
  const data=plan.steps[i].actions[0].geometry;
  assert.equal(Number(visible[i].attributes.x1),data.from.x);
  assert.equal(Number(visible[i].attributes.y1),data.from.y);
  assert.equal(Number(visible[i].attributes.x2),data.to.x);
  assert.equal(Number(visible[i].attributes.y2),data.to.y);
 }
});
test('when the input changes the shared teaching plan cannot retain a prior drawable frame',()=>{
 const p=createInteractivePage(),{get,fire,allSvgNodes}=p;
 for(let i=0;i<4;i++)fire('next','click');
 assert.equal(allSvgNodes().filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133').length,4);
 get('spaceX').value='28';fire('spaceX','input');
 assert.equal(get('stepCounter').textContent,'0 / 4');
 assert.equal(allSvgNodes().filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133').length,0);
 assert.match(get('solveStatus').textContent,/28, 10, 12/);
});

test('V5 real point guide animates across frames and speed change preserves proof-backed math',()=>{
 const page=createInteractivePage(),{get,fire,advance,allSvgNodes}=page;
 const guides=()=>allSvgNodes().filter(n=>n.tag==='line'&&n.attributes.stroke==='#c28133');
 assert.equal(get('stepCounter').textContent,'0 / 4');
 fire('playPause','click');advance(300);
 assert.equal(guides().length,1);
 const partial=guides()[0];
 const original=solveProjection({knownPoint:{x:15,y:10,z:12},
  sheetTransform:{origin:{x:360,y:210},scale:4}}).steps[0];
 const initialLength=Math.hypot(Number(partial.attributes.x2)-original.from.x,
  Number(partial.attributes.y2)-original.from.y);
 const targetLength=Math.hypot(original.to.x-original.from.x,original.to.y-original.from.y);
 assert.ok(initialLength>0&&initialLength<targetLength);
 get('animationSpeed').value='2';fire('animationSpeed','change');
 advance(600);
 assert.ok(guides().length>=2);
 assert.equal(allSvgNodes().filter(n=>n.tag==='text'&&String(n.textContent).startsWith('由空间点投影')).length,0);
 fire('playPause','click');assert.equal(get('playPause').textContent,'自动播放');
 advance(10000);
 assert.equal(guides().length,2,'paused guide should not progress on external clocks');
 get('spaceX').value='-4';fire('spaceX','input');
 assert.equal(guides().length,0,'revision change clears old animation');
 assert.equal(get('stepCounter').textContent,'0 / 4');
});


test('point V5 production paper controls are included and mathematically wired',()=>{
 for(const id of ['projectionMono','projectionFocus','projectionViewReset','projectionPicked','projectionViewport'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 assert.match(script,/MotionV5\.focus\(bounds/);
 assert.match(script,/MotionV5\.cameraTowards\(paperCamera,target/);
 assert.match(script,/markSelectable\(guide,action,i\)/);
});
test('clicking actually painted point projection guide navigates corresponding teaching step',()=>{
 const p=createInteractivePage(),{get,fire,allSvgNodes}=p;
 fire('next','click');fire('next','click');
 const nodes=allSvgNodes().filter(n=>n.attributes?.['data-v5-pick']);
 assert.equal(nodes.length,2);
 get('paperSvg').listeners.click({target:nodes[0]});
 assert.equal(get('stepCounter').textContent,'1 / 4');
 assert.match(get('projectionPicked').textContent,/已选第 1 条/);
 assert.match(get('stepTitle').textContent,/第 1 步/);
 assert.ok(allSvgNodes().some(n=>n.attributes?.['data-v5-selected']==='true'));
 assert.equal(allSvgNodes().filter(n=>n.tag==='text'&&
  n.textContent.startsWith('由空间点投影')).length,0);
});
test('forged future line rejected and changing projection inputs clears stale selected step',()=>{
 const p=createInteractivePage(),{get,fire,allSvgNodes}=p;
 const svg=get('paperSvg');
 svg.listeners.click({target:{attributes:{'data-v5-pick':'forged','data-v5-step':'0'}}});
 assert.match(get('projectionPicked').textContent,/点击已经绘制/);
 fire('next','click');
 const node=allSvgNodes().find(n=>n.attributes?.['data-v5-pick']);
 svg.listeners.click({target:node});
 assert.match(get('projectionPicked').textContent,/已选第 1 条/);
 get('spaceX').value='22';fire('spaceX','input');
 assert.match(get('projectionPicked').textContent,/点击已经绘制/);
 assert.equal(svg.attributes.viewBox,'0 0 720 470');
});
test('projection black-white paper changes presentation only and leaves student draw mode untouched',()=>{
 const p=createInteractivePage(),{get,fire,allSvgNodes}=p;
 get('projectionMono').checked=true;fire('projectionMono','change');
 assert.equal(get('projectionViewport').classList.contains('paper-mono'),true);
 assert.ok(allSvgNodes().some(n=>n.attributes.stroke==='#8a9d90'));
 get('projectionMono').checked=false;fire('projectionMono','change');
 assert.equal(get('projectionViewport').classList.contains('paper-mono'),false);
 get('learningMode').value='draw';fire('learningMode','change');
 get('paperSvg').listeners.click({target:{attributes:{'data-v5-pick':'fake','data-v5-step':'0'}}});
 assert.match(get('projectionPicked').textContent,/学生自己作图/);
 assert.equal(get('drawControls').hidden,false);
});
test('projection V5 camera follows partial real guide and manual reset preserves whole paper',()=>{
 const p=createInteractivePage(),{get,fire,advance}=p;
 assert.equal(get('projectionFocus').checked,true);
 fire('playPause','click');advance(300);
 assert.notEqual(get('paperSvg').attributes.viewBox,'0 0 720 470');
 const first=get('paperSvg').attributes.viewBox;
 advance(200);
 assert.notEqual(get('paperSvg').attributes.viewBox,first);
 fire('projectionViewReset','click');
 assert.equal(get('projectionFocus').checked,false);
 assert.equal(get('paperSvg').attributes.viewBox,'0 0 720 470');
 get('learningMode').value='draw';fire('learningMode','change');
 assert.equal(get('paperSvg').attributes.viewBox,'0 0 720 470');
});
