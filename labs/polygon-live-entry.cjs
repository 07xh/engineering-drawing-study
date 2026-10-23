'use strict';
/**
 * Local-only verified polygon workbench. All geometry is recomputed by M3 ->
 * canonical Intent; this file only CONSUMES the existing 07 V5 player/motion.
 * No OCR, static textbook answers, alternative geometry engine or animation.
 */
const {verifiedPolygonIntentTimeline}=require('../workbench/verified-polygon-intent-v1.cjs');
const Timeline=require('../workbench/teaching-timeline-v5.js');
const Motion=require('../workbench/teaching-motion-v5.js');
(function(){
 const SVG='http://www.w3.org/2000/svg';
 const $=id=>document.getElementById(id);
 const fields=['polygonSides','polygonX','polygonY','polygonRadius',
  'polygonAngle','polygonDirection','polygonConfirm'];
 const baseView={x:0,y:0,width:720,height:460};
 let revision=0,plan=null,player=null,animation=null,selected=null;
 const create=(tag,attrs={})=>{
  const e=document.createElementNS(SVG,tag);
  for(const [name,value] of Object.entries(attrs))e.setAttribute(name,String(value));
  return e;
 };
 const status=message=>{$('polygonStatus').textContent=message;};
 const now=()=>performance.now();
 function cancel(){
  if(animation!==null)cancelAnimationFrame(animation);
  animation=null;
 }
 function setControls(){
  const ready=!!player&&player.canRender(revision);
  for(const id of ['polygonPlay','polygonBack','polygonForward',
   'polygonRestart','polygonSeek'])$(id).disabled=!ready;
 }
 function resetView(){
  $('polygonSvg').setAttribute('viewBox','0 0 720 460');
 }
 function clear(){
  $('polygonDraw').replaceChildren();
  $('polygonStepList').replaceChildren();
  $('polygonSeek').value='0';
  $('polygonStepLabel').textContent='尚无可播放数学步骤';
  $('polygonPicked').textContent='逐笔绘制后，可以点选线段回到对应步骤。';
  $('polygonProof').textContent='数学证明、源码验证与网页验收分开记录；无 OCR 或原书整题盲测声明。';
  $('polygonPlay').textContent='播放';
  resetView();
 }
 function invalidate(){
  revision++;
  cancel();
  if(player&&player.canRender(revision-1))
   player.invalidate(revision,now());
  plan=null;player=null;selected=null;
  clear();setControls();
  status('已修改条件：上一版本的数学步骤和动画已失效，请重新确认后求解。');
 }
 function finiteValue(id){
  const el=$(id);
  if(el.value.trim()===''||!Number.isFinite(el.valueAsNumber))
   throw new TypeError('请填写有效的 '+id+' 数值');
  return el.valueAsNumber;
 }
 const renderAction=(action,fraction,role,stepIndex)=>{
  const tag=action.kind==='line'?'line':
   action.kind==='arc'?'path':'circle';
  const mono=$('polygonMono').checked;
  const col=mono?'#222':role==='result'?'#246fa4':'#bb7c31';
  const el=create(tag,{
   stroke:col,'stroke-width':action.kind==='line'?3:2,
   'stroke-linecap':'round',
   fill:action.kind==='point'?col:'none',
   'vector-effect':'non-scaling-stroke',
   'data-v5-pick':action.id,'data-v5-step':stepIndex,
   tabindex:'0',role:'button',
   'aria-label':'选择第 '+(stepIndex+1)+' 步数学图元'
  });
  if(selected?.id===action.id&&selected.revision===revision)
   el.setAttribute('data-v5-selected','true');
  Motion.updateSvg(el,action,fraction);
  if(action.kind==='point')el.setAttribute('opacity',String(fraction));
  const pick=()=>{
   selected={id:action.id,revision,step:stepIndex};
   $('polygonPicked').textContent='选中第 '+(stepIndex+1)+' 步：'+
    plan.steps[stepIndex].title+'。点选只定位原有步骤，不改变数学结果。';
   repaint();
  };
  el.addEventListener('click',pick);
  el.addEventListener('keydown',event=>{
   if(event.key==='Enter'||event.key===' '){event.preventDefault();pick();}
  });
  return el;
 };
 function boundsFor(a){
  const g=a?.geometry;
  if(!g)return null;
  if(a.kind==='line')return {
   minX:Math.min(g.from.x,g.to.x),maxX:Math.max(g.from.x,g.to.x),
   minY:Math.min(g.from.y,g.to.y),maxY:Math.max(g.from.y,g.to.y)};
  if(['circle','point'].includes(a.kind)){
   const radius=a.kind==='point'?8:g.radius;
   return {minX:g.center.x-radius,maxX:g.center.x+radius,
    minY:g.center.y-radius,maxY:g.center.y+radius};
  }
  return null;
 }
 function repaint(frame=player?.snapshot()){
  if(!plan||!player||!player.canRender(revision)||!frame)return;
  const root=$('polygonDraw');root.replaceChildren();
  let focus=null;
  for(const [index,step] of plan.steps.entries()){
   for(const a of step.actions){
    const fraction=frame.actionFractions[a.id]??0;
    if(fraction<=0)continue;
    root.append(renderAction(a,fraction,step.role,index));
    if(selected?.id===a.id&&selected.revision===revision)
     focus=a;
    else if(!focus&&fraction<1&&fraction>0)focus=a;
   }
  }
  if($('polygonFocus').checked&&focus){
   const bounds=boundsFor(focus);
   if(bounds&&Object.values(bounds).every(Number.isFinite)){
    const target=Motion.focus(bounds,{width:720,height:460,zoom:1.5});
    $('polygonSvg').setAttribute('viewBox',[
     target.x,target.y,target.width,target.height].join(' '));
   }else resetView();
  }else resetView();
  $('polygonSeek').value=String(Math.round(frame.ratio*1000));
  $('polygonStepLabel').textContent='第 '+Math.max(0,frame.activeStepIndex+1)+
   ' / '+plan.steps.length+' 步 · '+
   (frame.done?'全部已完成':plan.steps[frame.activeStepIndex]?.title||'准备绘制');
  for(const [index,button] of [...$('polygonStepList').children].entries()){
   if(index===frame.activeStepIndex)button.setAttribute('aria-current','step');
   else button.removeAttribute('aria-current');
  }
  $('polygonPlay').textContent=frame.playing?'暂停':'播放';
 }
 function stepList(){
  $('polygonStepList').replaceChildren();
  for(const [index,step] of plan.steps.entries()){
   const button=document.createElement('button');
   button.type='button';
   button.textContent=(index+1)+' · '+step.title;
   button.addEventListener('click',()=>{
    pause();player.seekStep(index,now());repaint();
   });
   $('polygonStepList').append(button);
  }
 }
 function solve(){
  invalidate();
  try{
   const radiusMm=finiteValue('polygonRadius');
   const center={x:finiteValue('polygonX'),y:finiteValue('polygonY')};
   const firstVertexAngleDeg=finiteValue('polygonAngle');
   const scale=Math.min(1e7,155/radiusMm);
   const sheet={origin:{x:360-center.x*scale,y:230+center.y*scale},scale};
   const input={unit:'mm',center,radiusMm,
    sideCount:Number($('polygonSides').value),
    firstVertexAngleDeg,direction:$('polygonDirection').value,
    revision,sourceConfirmed:$('polygonConfirm').checked};
   const result=verifiedPolygonIntentTimeline(input,sheet);
   if(result.status!=='ready'){
    status('无法生成已验证作图：'+result.reason);
    return;
   }
   plan=result;player=Timeline.createPlayer(result.timing,{
    revision,speed:Number($('polygonSpeed').value)});
   setControls();stepList();repaint();
   const proof=result.solverResult.solutions[0];
   $('polygonProof').textContent='M3 解析证明范围：'+result.proofScope+
    '。边长 '+Number(proof.sideLengthMm.toFixed(6))+
    ' mm，面积 '+Number(proof.areaMm2.toFixed(6))+
    ' mm²；V5 图元依赖源已通过正式 Intent DAG 校验。'+
    ' 仅限手动确认条件；未进行 OCR、真实原题盲测或 Android 实机验收。';
   status('计算与 Intent/V5 一致，'+result.steps.length+
    ' 个真实绘制步骤已就绪。可以逐笔播放、点选或修改参数重算。');
  }catch(error){
   plan=null;player=null;clear();setControls();
   status('已拒绝不可验证的输入或作图：'+String(error.message||error));
  }
 }
 function tick(timestamp){
  animation=null;
  if(!player||!player.canRender(revision))return;
  const frame=player.snapshot(timestamp);
  repaint(frame);
  if(frame.playing)animation=requestAnimationFrame(tick);
 }
 function play(){
  if(!player||!player.canRender(revision))return;
  if(player.snapshot().playing){pause();return;}
  const t=now();
  if(player.snapshot().done)player.seekStep(0,t);
  const frame=player.play(t);
  repaint(frame);
  if(frame.playing){cancel();animation=requestAnimationFrame(tick);}
 }
 function pause(){
  cancel();
  if(player){player.pause(now());repaint();}
 }
 function move(delta){
  if(!player)return;
  pause();
  const step=player.snapshot().activeStepIndex;
  player.seekStep(Math.max(0,Math.min(plan.steps.length,step+delta)),now());
  repaint();
 }
 for(const id of fields)$(id).addEventListener('input',invalidate);
 $('polygonSolve').addEventListener('click',solve);
 $('polygonPlay').addEventListener('click',play);
 $('polygonBack').addEventListener('click',()=>move(-1));
 $('polygonForward').addEventListener('click',()=>move(1));
 $('polygonRestart').addEventListener('click',()=>{
  pause();if(player){player.seekStep(0,now());repaint();}
 });
 $('polygonSeek').addEventListener('input',()=>{
  if(!player)return;
  pause();player.seekProgress(Number($('polygonSeek').value)/1000,now());repaint();
 });
 $('polygonSpeed').addEventListener('change',()=>{
  if(!player)return;
  const wasPlaying=player.snapshot().playing;
  player.setSpeed(Number($('polygonSpeed').value),now());
  repaint();
  if(wasPlaying&&animation===null)animation=requestAnimationFrame(tick);
 });
 for(const id of ['polygonMono','polygonFocus'])
  $(id).addEventListener('change',()=>repaint());
 clear();setControls();
})();
