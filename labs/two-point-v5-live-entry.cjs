'use strict';
// Public, user-confirmed input only. All strokes come from one proven Math ->
// ConstructionIntent -> V5 pipeline; interaction never reconstructs geometry.
const {compileConfirmedTwoPoint}=require('../workbench/confirmed-two-point-v5.cjs');
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
 updateCamera(frame,snap);
 $('status').textContent='已确认第 '+revision+' 版；作图 '+
  frame.completedIds.length+'/'+current.timeline.segments.length+
  (frame.done?'，全部绘制完成':'');
}
function tick(now){
 if(!playing||!current)return;
 const frame=current.player.snapshot(now);draw();
 if(frame.done){stop();return;}
 raf=requestAnimationFrame(tick);
}
function solve(){
 clear();revision++;
 try{
  const points=['a','b'].map(id=>({
   id:id.toUpperCase(),...Object.fromEntries(['x','y','z'].map(k=>{
    const el=$(id+k);
    if(el.value.trim()===''||!Number.isFinite(el.valueAsNumber))
     throw new TypeError('坐标不能为空或无效');
    return [k,el.valueAsNumber];
   }))
  }));
  current=compileConfirmedTwoPoint({confirmedBy:$('confirmed').checked?'user':null,
   revision,unit:'mm',points,sheetTransform:{origin:{x:360,y:210},scale:3}});
  draw(true);
 }catch(e){clear();$('status').textContent='拒绝作图：'+e.message;}
}
$('solve').addEventListener('click',solve);
for(const id of ['ax','ay','az','bx','by','bz']){
 $(id).addEventListener('input',()=>{
  revision++;clear();$('confirmed').checked=false;
  $('status').textContent='条件已修改，请重新确认并计算。';
 });
}
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
