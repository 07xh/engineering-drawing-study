'use strict';
/**
 * Public, strictly local cone math preview. Reuses #437's ONE source-confirmed
 * M3 -> ConstructionStep -> spatial V5 composed plan / existing V5 Motion.
 * No mock geometry, OCR, remote provider, second player or proof promotion.
 */
const {coneSpatialV5Preview}=
 require('../workbench/cone-spatial-v5-preview.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');
(function(){
 const $=id=>document.getElementById(id);
 const SVG='http://www.w3.org/2000/svg';
 const numeric=['coneRadius','coneHeight','conePx','conePy','conePz',
  'coneNx','coneNy','coneNz'];
 const config=['coneKind','coneSamples','coneKept'];
 const defaults={coneRadius:'5',coneHeight:'10',conePx:'0',conePy:'0',
  conePz:'6',coneNx:'1',coneNy:'0',coneNz:'3',coneKind:'full-ellipse',
  coneSamples:'64',coneKept:''};
 let revision=0,plan=null,player=null,raf=null,selected=null;
 const now=()=>performance.now();
 const create=(tag,attrs={})=>{
  const el=document.createElementNS(SVG,tag);
  for(const [key,val] of Object.entries(attrs))el.setAttribute(key,String(val));
  return el;
 };
 function status(s,error=false){
  $('coneStatus').textContent=s;
  $('coneStatus').dataset.error=error?'true':'false';
 }
 function stop(){
  if(raf!==null)cancelAnimationFrame(raf);
  raf=null;
  if(player&&player.canRender(revision))player.pause(now());
  $('conePlay').textContent='▶ 播放';
 }
 function disable(disabled){
  for(const id of ['coneBack','conePlay','coneForward','coneSeek'])
   $(id).disabled=disabled;
 }
 function clear(){
  $('coneDraw').replaceChildren();
  $('coneSteps').replaceChildren();
  $('coneSvg').setAttribute('viewBox','0 0 960 680');
  $('coneSeek').value='0';
  $('conePercent').textContent='0%';
  $('coneStepLabel').textContent='尚未生成。';
  $('conePicked').textContent='条件或步骤已改变，之前选中的图元不再有效。';
  $('coneProof').textContent='不包含教材原图、答案和 AI 识图；请确认新条件后重新验证。';
  $('conePlay').textContent='▶ 播放';
 }
 function invalidate(resetConfirm=true){
  stop();
  revision++;
  if(player&&!player.canRender(revision)&&player.canRender(revision-1))
   player.invalidate(revision,now());
  plan=null;player=null;selected=null;
  if(resetConfirm)$('coneConfirm').checked=false;
  clear();disable(true);
  status('条件已改变，旧解和动画已作废。请重新确认输入并求解。',true);
 }
 function number(id){
  const el=$(id);
  if(!el.value.trim()||!Number.isFinite(el.valueAsNumber))
   throw new TypeError(id+' 必须是有限数值');
  return el.valueAsNumber;
 }
 function solve(){
  stop();
  if(player&&player.canRender(revision))player.invalidate(revision+1,now());
  revision++;plan=null;player=null;selected=null;clear();disable(true);
  try{
   const confirmed=$('coneConfirm').checked;
   if(!confirmed){status('请先勾选确认条件。未确认时不输出任何已验证截线。',true);return;}
   const radiusMm=number('coneRadius'),heightMm=number('coneHeight');
   const cone={baseCenter:{x:0,y:0,z:0},radiusMm,heightMm,modelUnit:'mm'};
   const plane={point:{x:number('conePx'),y:number('conePy'),
      z:number('conePz')},
    normal:{x:number('coneNx'),y:number('coneNy'),z:number('coneNz')},
    modelUnit:'mm'};
   const kind=$('coneKind').value;
   const samples=Number($('coneSamples').value);
   const kept=$('coneKept').value;
   // Observer vectors are an explicit, restricted local coordinate choice.
   // A later arbitrary-camera UI cannot silently reuse these model axes.
   const evidence=kept?{
    retainedHalfspace:kept,
    observerDirections:{
     V:{x:0,y:-1,z:0},H:{x:0,y:0,z:1},W:{x:1,y:0,z:0}
    }
   }:{};
   const answer=coneSpatialV5Preview(cone,plane,{
    kind,samples,revision,sourceConfirmed:true,
    presentationMode:'split-sheet',provenGuideDag:true,...evidence
   });
   if(answer.status!=='preview-only'||
      answer.mathematicallyVerified!==true||
      answer.canonicalGuideDagConnected!==true||
      answer.canonicalGuideStepCount!==12||
      answer.spatialIntent?.source?.v5StepsReady!==false||
      answer.publicWorkbenchConnected!==false)
   {
    status('无法生成已验证的圆锥作图预览：'+
     (answer.reason||'数学证据不完整')+'。',true);return;
   }
   plan=answer;player=answer.createPlayer({speed:Number($('coneSpeed').value)});
   disable(false);makeSteps();paint();
   const counts=answer.rayEvidence?.counts;
   $('coneProof').textContent='数学源：有限直立圆锥解析'+
    (kind==='full-ellipse'?'完整椭圆':'裁剪椭圆与底面截弦')+
    '，已证实辅助母线 ConstructionStep '+answer.canonicalGuideStepCount+
    ' 步；同一 V5 共 '+answer.steps.length+' 步。'+
    (counts?'三视图开区间证据：可见 '+counts.visible+
      '、隐藏 '+counts.hidden+'、未确定 '+counts.undetermined+'。':
      '未确认保留材料侧：结果线型全部待审核。')+
    ' 线段为解析曲线的折线近似；端点、真实线型、图纸规范、照片识别和完整实体均尚未验收。';
   status('几何模型与单一 V5 动画已就绪。可逐笔播放、回退、调速和点选图元；不是完整国标工程制图答案。');
  }catch(error){
   plan=null;player=null;clear();disable(true);
   status('条件或几何求解被拒绝：'+String(error.message||error),true);
  }
 }
 function bounds(action){
  const g=action.geometry;
  if(action.kind==='line')
   return {minX:Math.min(g.from.x,g.to.x),maxX:Math.max(g.from.x,g.to.x),
    minY:Math.min(g.from.y,g.to.y),maxY:Math.max(g.from.y,g.to.y)};
  if(action.kind==='point')
   return {minX:g.center.x-6,maxX:g.center.x+6,
    minY:g.center.y-6,maxY:g.center.y+6};
  return null;
 }
 function paint(frame=player?.snapshot()){
  if(!plan||!player||!player.canRender(revision)||
     !plan.stillCurrent(revision)||!frame)return;
  const group=$('coneDraw');group.replaceChildren();
  const mono=$('coneMono').checked,showGuides=$('coneGuides').checked;
  let focus=null;
  for(const [index,step] of plan.steps.entries()){
   if(step.role==='guide'&&!showGuides)continue;
   for(const action of step.actions){
    const fraction=frame.actionFractions[action.id]??0;
    if(fraction<=0)continue;
    const label=step.role==='guide'?'guide':action.visibility||'undetermined';
    // This is explanatory mathematical coloring only, NOT certified SVG
    // line style or whole projected-chord occlusion.
    const color=mono?'#373737':label==='guide'?'#9a9eaa':
     label==='visible'?'#1d8069':label==='hidden'?'#5c6d7c':'#b17521';
    const selectedNow=selected?.id===action.id&&selected.revision===revision;
    const el=create(action.kind==='line'?'line':'circle',{
     stroke:color,'stroke-width':selectedNow?4:step.role==='guide'?1.5:2.6,
     'stroke-dasharray':step.role==='guide'?'6 6':
      label==='hidden'?'8 5':label==='undetermined'?'2 6':'none',
     'stroke-linecap':'round',fill:action.kind==='point'?color:'none',
     'vector-effect':'non-scaling-stroke',
     'data-cone-action':action.id,'data-cone-step':index,
     'data-cone-visibility':label,
     tabindex:'0',role:'button',
     'aria-label':'第 '+(index+1)+' 步 · '+label
    });
    if(selectedNow)el.setAttribute('data-cone-selected','true');
    Motion.updateSvg(el,action,fraction);
    const pick=()=>{
     selected={id:action.id,revision,step:index};
     player.pause(now());stop();
     const proof=action.visibilityProof||'辅助线位置由已证数学步骤计算';
     $('conePicked').textContent='第 '+(index+1)+' 步：'+
      step.title+' · '+label+' · '+proof+
      '；点选不改变任何数学证明。';
     paint();
    };
    el.addEventListener('click',pick);
    el.addEventListener('keydown',event=>{
     if(event.key==='Enter'||event.key===' '){event.preventDefault();pick();}
    });
    group.append(el);
    if(selectedNow)focus=action;
    else if(!focus&&fraction<1&&fraction>0)focus=action;
   }
  }
  if($('coneFocus').checked&&focus){
   const box=bounds(focus);
   if(box){
    const v=Motion.focus(box,{width:960,height:680,zoom:1.5});
    $('coneSvg').setAttribute('viewBox',[v.x,v.y,v.width,v.height].join(' '));
   }
  }else $('coneSvg').setAttribute('viewBox','0 0 960 680');
  $('coneSeek').value=String(Math.round(frame.ratio*1000));
  $('conePercent').textContent=Math.round(frame.ratio*100)+'%';
  $('coneStepLabel').textContent='第 '+(frame.activeStepIndex+1)+
   ' / '+plan.steps.length+' 步 · '+
   (frame.done?'全部已绘制':plan.steps[frame.activeStepIndex]?.title||'准备中');
  for(const [i,button] of [...$('coneSteps').children].entries()){
   if(i===frame.activeStepIndex)button.setAttribute('aria-current','step');
   else button.removeAttribute('aria-current');
  }
  $('conePlay').textContent=frame.playing?'Ⅱ 暂停':'▶ 播放';
 }
 function makeSteps(){
  const nav=$('coneSteps');nav.replaceChildren();
  plan.steps.forEach((step,index)=>{
   const b=document.createElement('button');
   b.type='button';b.textContent=(index+1)+' · '+step.title;
   b.addEventListener('click',()=>{
    if(!player||!plan||!plan.stillCurrent(revision))return;
    stop();selected=null;
    player.seekStep(index,now());paint();
   });
   nav.append(b);
  });
 }
 function tick(time){
  raf=null;
  if(!player||!plan||!player.canRender(revision))return;
  try{
   const frame=player.snapshot(time);paint(frame);
   if(frame.playing)raf=requestAnimationFrame(tick);
  }catch(e){invalidate(false);status('动画验证失败：'+e.message,true);}
 }
 function toggle(){
  if(!player||!player.canRender(revision))return;
  if(player.snapshot().playing){stop();paint();return;}
  const t=now();
  if(player.snapshot().done)player.seekStep(0,t);
  const frame=player.play(t);paint(frame);
  if(frame.playing){if(raf!==null)cancelAnimationFrame(raf);
   raf=requestAnimationFrame(tick);}
 }
 function step(delta){
  if(!player||!plan)return;
  stop();selected=null;
  const index=player.snapshot().activeStepIndex;
  player.seekStep(Math.max(0,Math.min(plan.steps.length,index+delta)),now());
  paint();
 }
 function init(){
  for(const id of [...numeric,...config]){
   $(id).addEventListener('input',()=>invalidate(true));
  }
  $('coneConfirm').addEventListener('change',()=>invalidate(false));
  $('coneSolve').addEventListener('click',solve);
  $('coneReset').addEventListener('click',()=>{
   for(const [id,value] of Object.entries(defaults))$(id).value=value;
   $('coneConfirm').checked=false;invalidate(false);
  });
  $('conePlay').addEventListener('click',toggle);
  $('coneBack').addEventListener('click',()=>step(-1));
  $('coneForward').addEventListener('click',()=>step(1));
  $('coneSeek').addEventListener('input',()=>{
   if(!player)return;
   stop();selected=null;
   player.seekProgress(Number($('coneSeek').value)/1000,now());paint();
  });
  $('coneSpeed').addEventListener('change',()=>{
   if(!player)return;
   const wasPlaying=player.snapshot().playing;
   player.setSpeed(Number($('coneSpeed').value),now());paint();
   if(wasPlaying&&raf===null)raf=requestAnimationFrame(tick);
  });
  for(const id of ['coneGuides','coneMono','coneFocus'])
   $(id).addEventListener('change',()=>paint());
  $('coneFit').addEventListener('click',()=>{
   $('coneFocus').checked=false;selected=null;paint();
  });
  window.addEventListener('pagehide',()=>{
   if(raf!==null)cancelAnimationFrame(raf);raf=null;
   if(player&&player.canRender(revision))player.pause(now());
  });
  clear();disable(true);status('请确认全部数学条件后开始求解。');
 }
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
