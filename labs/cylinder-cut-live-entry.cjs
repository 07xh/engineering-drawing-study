'use strict';
/* Local-only V3.8 cylinder section lab. Uses existing mathematics, proof
 * metadata, original V5 player and visibility-preserving full-frame SVG.
 * No uploaded files, network requests, credentials or unverified default rays.
 */
const {fields,checkedGeometry}=require('./cylinder-cut-form.cjs');
const {createCylinderVisibilitySvgScene}=
 require('../engines/spatial/sections/cylinder-visibility-frame-svg.cjs');

(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const ids=fields.concat(['kept','vdir','hdir','wdir']);
 const restore={
  radius:'5',height:'30',px:'0',py:'0',pz:'3',
  nx:'1',ny:'1',nz:'1',kept:'negative',
  vdir:'-1',hdir:'1',wdir:'-1'
 };
 const state={scene:null,player:null,revision:0,raf:null,lastFrame:null,
  lastStep:-2,urls:new Set()};
 const controls=['previous','play','next','seek','save'];
 const now=()=>performance.now();
 const progressText=f=>String(Math.round(f*100))+'%';
 function stop(){
  if(state.raf!==null){cancelAnimationFrame(state.raf);state.raf=null;}
  if(state.player){try{state.player.pause(now());}catch(_){}}
 }
 function disable(disabled){
  for(const id of controls)$(id).disabled=disabled;
 }
 function message(text,isError=false){
  $('status').textContent=text;
  $('status').dataset.error=isError?'true':'false';
 }
 function clearScene(text='条件已改变，需要重新求解'){
  stop();state.revision++;state.scene=null;state.player=null;
  state.lastFrame=null;state.lastStep=-2;disable(true);
  $('board').replaceChildren();
  $('steps').replaceChildren();
  $('percentage').textContent='0%';
  $('seek').value='0';
  $('counts').textContent='尚未计算';
  $('stepDetail').textContent='条件未通过数学验证，旧作图步骤已失效。';
  message(text,true);
 }
 function currentFields(){
  const values={};
  for(const id of fields){
   const node=$(id);
   if(!node.value.trim())throw new TypeError(id+' 不能留空');
   values[id]=node.valueAsNumber;
  }
  for(const id of ['kept','vdir','hdir','wdir'])values[id]=$(id).value;
  return checkedGeometry(values);
 }
 function showSteps(scene){
  const nav=$('steps');nav.replaceChildren();
  for(const [i,step] of scene.stepDescriptors.entries()){
   const btn=document.createElement('button');
   btn.type='button';
   btn.textContent=String(i+1)+' · '+step.title;
   btn.dataset.stepIndex=String(i);
   btn.addEventListener('click',()=>{
    if(!state.player||!state.scene||state.scene!==scene)return;
    try{
     const snapshot=state.player.seekStep(i,now());
     draw(snapshot.elapsedMs);
    }catch(error){message('步骤定位失败：'+error.message,true);}
   });
   nav.appendChild(btn);
  }
 }
 function draw(elapsedMs){
  const scene=state.scene;
  if(!scene||!state.player)return;
  try{
   const frame=scene.renderFrame({
    elapsedMs,expectedRevision:state.revision
   });
   state.lastFrame=frame;
   $('board').innerHTML=frame.svg; // SVG exclusively from proof-backed numeric renderer.
   const progress=frame.totalMs?frame.elapsedMs/frame.totalMs:1;
   $('seek').value=String(Math.round(progress*1000));
   $('percentage').textContent=progressText(progress);
   const c=frame.rendered;
   $('counts').textContent='已画：可见 '+c.visible+' · 遮挡 '+
    c.hidden+' · 待确认 '+c.undetermined;
   if(frame.activeStepIndex!==state.lastStep){
    state.lastStep=frame.activeStepIndex;
    const buttons=$('steps').querySelectorAll('button[data-step-index]');
    for(const item of buttons){
     if(Number(item.dataset.stepIndex)===frame.activeStepIndex)
      item.setAttribute('aria-current','step');
     else item.removeAttribute('aria-current');
    }
   }
   const step=scene.stepDescriptors[frame.activeStepIndex];
   $('stepDetail').textContent=step?
    '当前：'+step.title+' · '+frame.completedActionCount+' 个动作已完成。'+
    '虚实线基于显式视向计算；还未进行正式标准线型签收。':
    '已知图形已准备好。辅助线将按真实作图步骤逐笔出现。';
  }catch(error){
   clearScene('作图被安全阻止：'+error.message);
  }
 }
 function loop(stamp){
  state.raf=null;
  if(!state.player||!state.scene)return;
  try{
   const snapshot=state.player.snapshot(stamp);
   draw(snapshot.elapsedMs);
   if(snapshot.playing)state.raf=requestAnimationFrame(loop);
   else $('play').textContent='▶ 播放';
  }catch(error){clearScene('动画被安全阻止：'+error.message);}
 }
 function recompute(){
  clearScene('正在验证数学条件……');
  try{
   const input=currentFields();
   const scene=createCylinderVisibilitySvgScene(input.cylinder,input.plane,{
    ...input.options,revision:state.revision
   });
   if(scene.status!=='ready'){
    message('暂不能出图：'+scene.reason+
      '。请调整截平面或选择受支持的有限圆柱斜截条件。',true);
    return;
   }
   state.scene=scene;
   state.player=scene.createPlayer({speed:Number($('speed').value)});
   disable(false);
   showSteps(scene);
   draw(0);
   const explain=scene.visibilityLineStylesFullyVerified?
    '此组观察射线的截线开区间可见性均已判定。':
    '部分开区间仍无法确认，将以不同虚线标识。';
   message('数学周界及 V5 作图验证通过，共 '+scene.stepCount+
    ' 个步骤。'+explain+' 尚未签收正式三视国标线型。');
  }catch(error){
   message('数学条件被拒绝：'+(error?.message||'无法验证'),true);
  }
 }
 function playback(){
  if(!state.player||!state.scene)return;
  const t=now();
  try{
   const snap=state.player.snapshot(t);
   if(snap.playing){
    state.player.pause(t);stop();draw(snap.elapsedMs);
    $('play').textContent='▶ 播放';
   }else{
    if(snap.done)state.player.seekProgress(0,t);
    state.player.play(t);
    $('play').textContent='Ⅱ 暂停';
    if(state.raf===null)state.raf=requestAnimationFrame(loop);
   }
  }catch(error){clearScene('动画无法播放：'+error.message);}
 }
 function step(direction){
  if(!state.player||!state.scene)return;
  try{
   const t=now();
   const cur=state.player.snapshot(t);
   const idx=Math.max(0,cur.activeStepIndex);
   const next=Math.max(0,Math.min(
    state.scene.stepCount,idx+direction
   ));
   state.player.seekStep(next,t);
   draw(state.player.snapshot(t).elapsedMs);
  }catch(error){clearScene('单步作图无法继续：'+error.message);}
 }
 function save(){
  if(!state.scene||!state.player||!state.lastFrame)return;
  let href;
  try{
   const snap=state.player.snapshot(now());
   const frame=state.scene.renderFrame({
    elapsedMs:snap.elapsedMs,expectedRevision:state.revision
   });
   const blob=new Blob([frame.svg],{type:'image/svg+xml;charset=utf-8'});
   href=URL.createObjectURL(blob);state.urls.add(href);
   const a=document.createElement('a');
   a.href=href;a.download='draftai-cylinder-r'+state.revision+
    '-step-'+(frame.activeStepIndex+1)+'.svg';
   document.body.appendChild(a);
   try{a.click();}finally{a.remove();}
   message('已在浏览器本地发起当前作图 SVG 下载。结果属于实验版，不是正式国标图纸。');
   setTimeout(()=>{
    if(state.urls.delete(href))URL.revokeObjectURL(href);
   },3000);
  }catch(error){
   if(href&&state.urls.delete(href))URL.revokeObjectURL(href);
   message('SVG 保存失败：'+error.message,true);
  }
 }
 function init(){
  for(const id of fields){
   $(id).addEventListener('input',()=>clearScene());
   $(id).addEventListener('change',recompute);
  }
  for(const id of ['kept','vdir','hdir','wdir'])
   $(id).addEventListener('change',recompute);
  $('recompute').addEventListener('click',recompute);
  $('reset').addEventListener('click',()=>{
   for(const [id,v] of Object.entries(restore))$(id).value=v;
   recompute();
  });
  $('play').addEventListener('click',playback);
  $('previous').addEventListener('click',()=>step(-1));
  $('next').addEventListener('click',()=>step(1));
  $('seek').addEventListener('input',()=>{
   if(!state.player||!state.scene)return;
   try{
    const snap=state.player.seekProgress(Number($('seek').value)/1000,now());
    draw(snap.elapsedMs);
   }catch(error){clearScene('无法定位播放位置：'+error.message);}
  });
  $('speed').addEventListener('change',()=>{
   if(!state.player)return;
   try{state.player.setSpeed(Number($('speed').value),now());}
   catch(error){clearScene('无效播放速度：'+error.message);}
  });
  $('guides').addEventListener('change',()=>{
   $('board').classList.toggle('hide-guides',!$('guides').checked);
  });
  $('mono').addEventListener('change',()=>{
   $('board').classList.toggle('monochrome',$('mono').checked);
  });
  $('save').addEventListener('click',save);
  window.addEventListener('pagehide',()=>{
   stop();
   for(const url of state.urls)URL.revokeObjectURL(url);
   state.urls.clear();
  });
  recompute();
 }
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
