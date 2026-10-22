'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const State=require('../../labs/dof-lab-state.js');
const Geom=require('../../labs/dof-lab-geometry.js');
const Sheet=require('../../labs/dof-lab-sheet.js');
const Spatial=require('../../labs/dof-lab-spatial-svg.js');
const Sync=require('../../workbench/dof-synchronized-reveal.cjs');
function createPage(){
 let now=0,id=0,reduced=false,motionHandler=null;
 const frames=new Map(),elements=new Map();
 const make=tag=>({
  tag,children:[],attributes:{},listeners:{},
  value:'',checked:true,disabled:false,hidden:false,textContent:'',innerHTML:'',
  style:{},classList:{add(){},remove(){},toggle(){}},
  append(...nodes){this.children.push(...nodes)},
  replaceChildren(...nodes){this.children=[...nodes]},
  setAttribute(name,value){this.attributes[name]=String(value)},
  insertAdjacentHTML(_position,html){this.innerHTML+=html},
  getAttribute(name){return this.attributes[name]},
  addEventListener(type,fn){this.listeners[type]=fn},
  setPointerCapture(){},
  focus(){},
  get valueAsNumber(){return this.value.trim()===''?NaN:Number(this.value)},
  getBoundingClientRect(){return {left:0,top:0,width:460,height:330}}
 });
 const get=id=>{
  if(!elements.has(id)){
   const el=make('div');el.id=id;elements.set(id,el);
  }
  return elements.get(id);
 };
 get('conditionType').value='projection';
 get('solid').value='cuboid';get('syncSpeed').value='1';
 get('syncProgress').value='1000';
 get('showGuides').checked=true;
 get('showWireframe').checked=true;
 get('showHiddenEdges').checked=true;
 get('showLabels').checked=false;
 for(const [id,value] of [['trialX',35],['trialY',22],['trialZ',51]])
  get(id).value=String(value);
 const docListeners={};
 const document={hidden:false,getElementById:get,createElement:make,querySelectorAll(){return []},
  addEventListener(type,fn){docListeners[type]=fn}};
 const window={DrawingLabState:State,DrawingLabGeometry:Geom,
  DrawingLabSheet:Sheet,DrawingLabSpatialPreview:Spatial,DrawingLabSyncV5:Sync,
  matchMedia(){return {get matches(){return reduced},
   addEventListener(type,fn){if(type==='change')motionHandler=fn}}}};
 const raf=fn=>{frames.set(++id,fn);return id};
 const cancel=i=>frames.delete(i);
 const context={document,window,performance:{now:()=>now},
  requestAnimationFrame:raf,cancelAnimationFrame:cancel};
 vm.runInNewContext(read('labs/dof-lab-v2-ui.js'),context,
  {filename:'dof-lab-v2-ui.js',timeout:5000});
 const fire=(which,event)=>{
  const el=get(which);
  assert.equal(typeof el.listeners[event],'function',which+' lacks '+event);
  el.listeners[event]({preventDefault(){},target:el});
 };
 const advance=delta=>{
  now+=delta;
  const list=[...frames.values()];frames.clear();
  for(const fn of list)fn(now);
 };
 const setHidden=value=>{
  document.hidden=!!value;docListeners.visibilitychange?.();
 };
 const setReduced=value=>{
  reduced=!!value;motionHandler?.({matches:reduced});
 };
 return {get,fire,advance,window,frames,document,setHidden,setReduced};
}
test('real page initializes with P-star and does not hide the playback button',()=>{
 const p=createPage();
 assert.match(p.get('syncCaption').textContent,/P\*/);
 assert.match(p.get('pointCoordinates').textContent,/P\*/);
 assert.equal(p.get('syncPlay').disabled,false);
 assert.equal(p.get('syncRestart').disabled,true);
 assert.equal(p.get('syncProgress').disabled,true);
 assert.equal(p.window.DrawingLabV2Controller.getSync(),null);
});
test('real page synchronizes playback then clears stale timeline after editing constraints',()=>{
 const p=createPage(),{get,fire,advance,window}=p;
 fire('syncPlay','click');
 assert.match(get('syncPlay').textContent,/暂停/);
 const original=window.DrawingLabV2Controller.getSync();
 assert.equal(original.degreeStatus,'sample');
 advance(360);
 assert.ok(Number(get('syncProgress').value)>0);
 get('syncSpeed').value='2';fire('syncSpeed','change');
 advance(1000);
 assert.ok(Number(get('syncProgress').value)>100);
 fire('syncPlay','click');assert.match(get('syncPlay').textContent,/播放/);
 const stopped=get('syncProgress').value;advance(1000);
 assert.equal(get('syncProgress').value,stopped);
 window.DrawingLabV2Controller.apply({type:'add',condition:{
  type:'projection',plane:'H',value:[15,10]}});
 assert.equal(window.DrawingLabV2Controller.getSync(),null);
 assert.match(get('syncCaption').textContent,/P\*/);
 window.DrawingLabV2Controller.apply({type:'add',condition:{
  type:'coordinate',axis:'z',value:12}});
 assert.equal(get('degrees').textContent,'0');
 assert.match(get('syncCaption').textContent,/唯一解 P/);
 fire('syncPlay','click');
 assert.equal(window.DrawingLabV2Controller.getSync().degreeStatus,'unique');
 fire('syncRestart','click');assert.equal(Number(get('syncProgress').value),0);
});
test('contradictory point constraints block real UI player and never expose solved target',()=>{
 const p=createPage(),{get,fire,window}=p;
 window.DrawingLabV2Controller.apply({type:'add',condition:{
  type:'coordinate',axis:'x',value:15}});
 window.DrawingLabV2Controller.apply({type:'add',condition:{
  type:'coordinate',axis:'x',value:16}});
 assert.match(get('syncCaption').textContent,/无解/);
 assert.equal(get('syncPlay').disabled,true);
 assert.match(get('pointCoordinates').textContent,/不存在满足/);
 assert.equal(window.DrawingLabV2Controller.getSync(),null);
});
test('real page can seek to finish while preserving sample-not-unique truth',()=>{
 const p=createPage(),{get,fire,window}=p;
 fire('syncPlay','click');
 get('syncProgress').value='1000';fire('syncProgress','input');
 assert.equal(Number(get('syncProgress').value),1000);
 assert.equal(window.DrawingLabV2Controller.getSync().progress,1);
 assert.match(get('syncExplanation').textContent,/P\*.*不代表唯一解/);
 assert.equal(get('syncPlay').disabled,true);
 fire('syncRestart','click');assert.equal(Number(get('syncProgress').value),0);
});

test('Android background tab pauses V5 at its actual progress; manual resumption does not skip drawing',()=>{
 const p=createPage(),{get,fire,advance,setHidden,frames}=p;
 fire('syncPlay','click');advance(450);
 const before=Number(get('syncProgress').value);
 assert.ok(before>0&&before<1000);
 assert.ok(frames.size>0);
 setHidden(true);
 assert.equal(frames.size,0,'background tab cancels all V5 animation callbacks');
 assert.match(get('syncPlay').textContent,/播放/);
 advance(60000);
 assert.equal(Number(get('syncProgress').value),before,'hidden tab does not fast-forward the point');
 setHidden(false);advance(30000);
 assert.equal(Number(get('syncProgress').value),before,'return requires explicit resume');
 fire('syncPlay','click');advance(200);
 const after=Number(get('syncProgress').value);
 assert.ok(after>before&&after<1000,'drawing continues from the paused progress');
 assert.match(get('syncProgress').attributes['aria-valuetext'],/已完成/);
});
test('changing OS reduced-motion preference finishes display without high-motion frames',()=>{
 const p=createPage(),{get,fire,advance,setReduced,frames}=p;
 fire('syncPlay','click');advance(300);
 assert.ok(Number(get('syncProgress').value)<1000);
 setReduced(true);
 assert.equal(Number(get('syncProgress').value),1000);
 assert.equal(frames.size,0);
 assert.match(get('syncExplanation').textContent,/P\*.*不代表唯一解/);
 assert.equal(get('syncPlay').disabled,true);
});
