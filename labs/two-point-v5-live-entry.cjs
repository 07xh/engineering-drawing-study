'use strict';
// Public, user-confirmed input only. All strokes come from one proven Math ->
// ConstructionIntent -> V5 pipeline; interaction never reconstructs geometry.
const {compileConfirmedTwoPoint}=require('../workbench/confirmed-two-point-v5.cjs');
const {compileReviewedSegmentPreview}=require('../workbench/reviewed-two-view-segment-preview.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');
const Camera=require('../workbench/v5-action-camera.cjs');
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const FULL=Object.freeze({x:0,y:0,width:720,height:470});
let current=null,revision=0,playing=false,raf=null,chosen=null,camera={...FULL};
const reducedMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const setView=()=>{$('sheet').setAttribute('viewBox',
 [camera.x,camera.y,camera.width,camera.height].join(' '));};
function stop(){
 if(raf!==null){cancelAnimationFrame(raf);raf=null;}
 playing=false;
 if(current)current.player.pause(performance.now());
}
function clear(){
 stop();current=null;chosen=null;camera={...FULL};
 $('sheet').replaceChildren();setView();
 $('picked').textContent='点击或按 Enter 选择已经绘制的辅助线。';
}
function currentFocus(frame){
 if(!$('focus').checked||!current||!current.player.canRender(revision))return FULL;
 const actionId=chosen||frame.activeActionId||frame.completedIds.at(-1);
 if(!actionId)return FULL;
 const action=current.steps.flatMap(step=>step.actions).find(a=>a.id===actionId);
 return Camera.actionViewBox(action);
}
function updateCamera(frame,snap=false){
 const target=currentFocus(frame);
 camera=Motion.cameraTowards(camera,target,snap?1000:16,170,snap||reducedMotion());
 setView();
}
function pick(action,stepIndex){
 if(!current||!current.player.canRender(revision))return;
 stop();const now=performance.now();
 current.player.seekStep(stepIndex+1,now);
 chosen=action.id;
 $('picked').textContent='已选择 '+action.id+'：'+
  (action.id.startsWith('A-')?'A':'B')+' 点第 '+(stepIndex+1)+' 步；已定位到该步结束。';
 draw(true);
 const controls=Array.from($('sheet').children);
 controls.find(n=>n.getAttribute('data-pick-action')===action.id)?.focus?.();
}
// This is a geometric PRESENTATION, not an official line-style/Intent/V5 stroke.
function renderReviewedSegmentPreview(svg,frame,mono){
 const preview=current?.segmentPreview;
 if(!preview||!frame.done||!current.player.canRender(revision))return;
 const group=document.createElementNS(NS,'g');
 group.setAttribute('data-unverified-segment','true');
 group.setAttribute('data-official-v5','false');
 group.setAttribute('aria-label','AB 端点对应的投影几何预览；所有线型未判定');
 const title=document.createElementNS(NS,'title');
 title.textContent='AB 几何预览：虚实线未认证；不是 V5 作图步骤';
 group.append(title);
 for(const v of ['V','H','W']){
  const g=preview.screen[v];
  const stroke=mono?'#555':'#8a48a5';
  const e=document.createElementNS(NS,g.collapsed?'circle':'line');
  if(g.collapsed){
   e.setAttribute('cx',g.from.x);e.setAttribute('cy',g.from.y);
   e.setAttribute('r','4');e.setAttribute('fill','none');
  }else{
   e.setAttribute('x1',g.from.x);e.setAttribute('y1',g.from.y);
   e.setAttribute('x2',g.to.x);e.setAttribute('y2',g.to.y);
  }
  e.setAttribute('stroke',stroke);
  e.setAttribute('stroke-width','2.5');
  e.setAttribute('stroke-dasharray','1.5 7');
  e.setAttribute('stroke-linecap','round');
  e.setAttribute('data-preview-view',v);
  e.setAttribute('data-line-style','undetermined');
  group.append(e);
 }
 svg.append(group);
}
function draw(snap=false){
 const svg=$('sheet');svg.replaceChildren();
 if(!current){updateCamera(null,true);return;}
 const frame=current.player.snapshot(),mono=$('mono').checked;
 for(const [index,step] of current.steps.entries()){
  for(const action of step.actions){
   const fraction=frame.actionFractions[action.id]||0;
   if(fraction<=0||!['line','circle','arc','point'].includes(action.kind))continue;
   const tag=action.kind==='line'?'line':action.kind==='arc'?'path':'circle';
   const color=mono?'#202020':action.id.startsWith('A-')?'#b9751f':'#236eb5';
   const selected=chosen===action.id;
   const visible=document.createElementNS(NS,tag);
   visible.setAttribute('fill',action.kind==='point'?color:'none');
   visible.setAttribute('stroke',color);
   visible.setAttribute('stroke-width',selected?'4':'2.5');
   visible.setAttribute('pointer-events','none');
   visible.setAttribute('data-draw-stroke',action.id);
   if(selected)visible.setAttribute('stroke-dasharray','7 4');
   Motion.updateSvg(visible,action,fraction);
   svg.append(visible);
   // Invisible touch/pen target, not a mathematical construction stroke.
   const hit=document.createElementNS(NS,tag);
   hit.setAttribute('fill',action.kind==='point'?'transparent':'none');
   hit.setAttribute('stroke','transparent');
   hit.setAttribute('stroke-width','30');
   hit.setAttribute('pointer-events',action.kind==='point'?'all':'stroke');
   Motion.updateSvg(hit,action,fraction);
   if(action.kind==='point')hit.setAttribute('r','18');
   hit.setAttribute('data-pick-action',action.id);
   hit.setAttribute('role','button');
   hit.setAttribute('tabindex','0');
   hit.setAttribute('aria-label','定位'+(action.id.startsWith('A-')?'A':'B')+
    '点第'+(index+1)+'步作图');
   hit.addEventListener('click',()=>pick(action,index));
   hit.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();pick(action,index);}
   });
   svg.append(hit);
  }
 }
 renderReviewedSegmentPreview(svg,frame,mono);
 updateCamera(frame,snap);
 $('status').textContent='已确认第 '+revision+' 版；作图 '+
  frame.completedIds.length+'/'+current.timeline.segments.length+
  (frame.done?'，全部绘制完成':'')+
  (current.segmentPreview?'；AB 线段仅几何预览（虚实未判定）':'');
}
function tick(now){
 if(!playing||!current)return;
 const frame=current.player.snapshot(now);draw();
 if(frame.done){stop();return;}
 raf=requestAnimationFrame(tick);
}
const PAIRS=new Set(['VH','VW','HW']);
function numeric(id){
 const el=$(id);
 if(!el||el.value.trim()===''||!Number.isFinite(el.valueAsNumber)||
    Math.abs(el.valueAsNumber)>100000)throw new TypeError('数学投影/坐标 '+id+' 必须是有效 mm 数值');
 return el.valueAsNumber;
}
function invalidateSource(){
 revision++;clear();$('confirmed').checked=false;
 $('status').textContent='条件或视图组合已改变，请重新人工确认并求解；旧 V5 已作废。';
}
function refreshInputMode(){
 const mode=$('knownMode').value;
 if(mode!=='XYZ'&&!PAIRS.has(mode))throw new TypeError('未知第一角投影视图组合');
 const twoViews=mode!=='XYZ';
 $('a-xyz').hidden=twoViews;
 $('b-xyz').hidden=twoViews;
 $('knownViewsInputs').hidden=!twoViews;
 for(const view of ['V','H','W']){
  for(const node of document.querySelectorAll('[data-v5-view="'+view+'"]')){
   node.hidden=!twoViews||!mode.includes(view);
  }
 }
 $('knownModeStatus').textContent=twoViews?
  '请输入两张已知图上的 A/B 对应点数学投影坐标，第三视图由原有 M3 和唯一 V5 计算。':
  '当前使用人工确认的两点完整空间坐标。';
}
function solve(){
 clear();revision++;
 try{
  const mode=$('knownMode').value;
  if(mode!=='XYZ'&&!PAIRS.has(mode))throw new TypeError('未知第一角投影视图组合');
  const points=['a','b'].map(id=>mode==='XYZ'?
   {id:id.toUpperCase(),...Object.fromEntries(['x','y','z'].map(k=>[k,numeric(id+k)]))}:
   {id:id.toUpperCase(),knownViews:Object.fromEntries([...mode].map(v=>
     [v,[numeric(id+v+'u'),numeric(id+v+'v')]]))});
  const input={confirmedBy:$('confirmed').checked?'user':null,
   revision,unit:'mm',points,sheetTransform:{origin:{x:360,y:210},scale:3}};
  current=$('showSegment').checked?
   compileReviewedSegmentPreview(input):compileConfirmedTwoPoint(input);
  $('segmentPreviewNote').textContent=current.segmentPreview?
   'A—B 三视图已从对应端点生成；只有完成点的正式 V5 后才显示紫色点线。线型始终未认证。':
   '未启用 AB 连线预览；当前仅播放由数学求解证明的点投影 V5。';
  draw(true);
 }catch(e){clear();$('status').textContent='拒绝作图：'+e.message;}
}
$('solve').addEventListener('click',solve);
$('showSegment').addEventListener('change',invalidateSource);
for(const id of ['ax','ay','az','bx','by','bz',
 ...['a','b'].flatMap(p=>['V','H','W'].flatMap(v=>[p+v+'u',p+v+'v']))]){
 $(id).addEventListener('input',invalidateSource);
}
$('knownMode').addEventListener('change',()=>{refreshInputMode();invalidateSource();});
refreshInputMode();
$('confirmed').addEventListener('change',()=>{
 revision++;clear();
 $('status').textContent=$('confirmed').checked?
  '条件已确认，请点击确认并计算。':'已取消原题确认。';
});
$('previous').addEventListener('click',()=>{
 if(!current)return;
 stop();const frame=current.player.snapshot(),steps=current.timeline.steps;
 const i=steps.findIndex(s=>s.startMs>=frame.elapsedMs-1);
 const index=i<0?steps.length-1:Math.max(0,i-1);
 current.player.seekStep(index,performance.now());chosen=null;draw(true);
});
$('next').addEventListener('click',()=>{
 if(!current)return;
 stop();const frame=current.player.snapshot();
 const i=current.timeline.steps.findIndex(s=>s.startMs>frame.elapsedMs+1);
 current.player.seekStep(i<0?current.timeline.steps.length:i,performance.now());
 chosen=null;draw(true);
});
$('speed').addEventListener('change',()=>{
 if(current)current.player.setSpeed(Number($('speed').value),performance.now());
});
$('play').addEventListener('click',()=>{
 if(!current)return;
 if(playing){stop();draw();return;}
 if(reducedMotion()){
  $('status').textContent='系统已启用减少动画；请使用上一步/下一步。';return;
 }
 current.player.play(performance.now());playing=current.player.snapshot().playing;
 if(playing)raf=requestAnimationFrame(tick);
});
$('mono').addEventListener('change',()=>draw(true));
$('focus').addEventListener('change',()=>draw(true));
$('viewReset').addEventListener('click',()=>{
 $('focus').checked=false;chosen=null;camera={...FULL};draw(true);
});
setView();
