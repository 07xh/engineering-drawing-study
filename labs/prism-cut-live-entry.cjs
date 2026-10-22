'use strict';
/* DraftAI 04: strictly local reviewed-prism V5 drawing experiment. */
const {fields,checkedPrismFields,checkedPrismObserverFields}=
 require('./prism-cut-form.cjs');
const {createPrismV5SvgScene}=
 require('../engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs');
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const initial={sizeX:'10',sizeY:'10',sizeZ:'10',
  px:'0',py:'0',pz:'12',nx:'1',ny:'1',nz:'1',
  visibilityMode:'unconfirmed',retainedHalfspace:'',
  viewV:'',viewH:'',viewW:''};
 const state={scene:null,player:null,rev:0,raf:null,last:null,urls:new Set()};
 const time=()=>performance.now();
 function message(value,bad=false){
  $('status').textContent=value;$('status').dataset.error=bad?'true':'false';
 }
 function stop(){
  if(state.raf!==null){cancelAnimationFrame(state.raf);state.raf=null;}
  if(state.player)state.player.pause(time());
  $('play').textContent='▶ 播放';
 }
 function disabled(value){
  for(const k of ['previous','next','play','seek','save'])$(k).disabled=value;
 }
 function invalidate(){
  stop();state.rev++;state.scene=null;state.player=null;state.last=null;
  disabled(true);
  $('board').replaceChildren();$('steps').replaceChildren();
  $('seek').value='0';$('percentage').textContent='0%';
  $('measure').textContent='等待新数学证明。';
  $('rayStatus').textContent='输入已改变，原视向射线判定已失效。';
  $('stepDetail').textContent='数据已变更，旧作图步骤不再有效。';
  message('条件已更新，旧结果已失效。请确认输入并重新求解。',true);
 }
 function fieldsNow(){
  const raw={};
  for(const k of fields){
   const node=$(k);
   if(!node.value.trim())throw new TypeError(k+' 不能为空');
   raw[k]=node.valueAsNumber;
  }
  return checkedPrismFields(raw);
 }
 function draw(elapsed){
  if(!state.scene||!state.player)return;
  try{
   const s=state.scene,frame=s.renderFrame({
    elapsedMs:elapsed,expectedRevision:state.rev
   });
   state.last=frame;
   $('board').innerHTML=frame.svg; // proof-derived, no user HTML.
   $('seek').value=String(Math.round(1000*frame.elapsedMs/frame.totalMs));
   $('percentage').textContent=Math.round(100*frame.elapsedMs/frame.totalMs)+'%';
   const step=s.steps[frame.activeStepIndex];
   $('stepDetail').textContent=step?
    '正在执行：'+step.title+' · 已绘制 '+frame.completeActions+
      ' 笔。'+(s.visibilityEvidenceMode==='explicit-observer-rays'?
       '线型来自显式空间视向；并非正式标准答案。':
       '橙色截线表示可见性仍需确认。') :
    '已知投影就绪，辅助线将在相应步骤逐笔出现。';
   for(const item of $('steps').querySelectorAll('button[data-step]')){
    if(Number(item.dataset.step)===frame.activeStepIndex)
     item.setAttribute('aria-current','step');
    else item.removeAttribute('aria-current');
   }
  }catch(error){invalidate();message('绘制已阻断：'+error.message,true);}
 }
 function tick(stamp){
  state.raf=null;
  if(!state.scene||!state.player)return;
  try{
   const snapshot=state.player.snapshot(stamp);
   draw(snapshot.elapsedMs);
   if(snapshot.playing)state.raf=requestAnimationFrame(tick);
   else $('play').textContent='▶ 播放';
  }catch(error){invalidate();message('动画已阻断：'+error.message,true);}
 }
 function update(){
  invalidate();
  try{
   const input=fieldsNow();
   const observer=checkedPrismObserverFields({
    mode:$('visibilityMode').value,
    retainedHalfspace:$('retainedHalfspace').value,
    viewV:$('viewV').value,
    viewH:$('viewH').value,
    viewW:$('viewW').value
   });
   const s=createPrismV5SvgScene(input.box,input.plane,{
    revision:state.rev,...observer
   });
   if(s.status!=='ready'){
    message('暂不能绘图：'+s.reason+'。请调整截平面条件。',true);
    return;
   }
   state.scene=s;state.player=s.createPlayer({speed:Number($('speed').value)});
   disabled(false);
   const nav=$('steps');nav.replaceChildren();
   for(const [i,step] of s.steps.entries()){
    const button=document.createElement('button');
    button.type='button';button.dataset.step=String(i);
    button.textContent=(i+1)+' · '+step.title;
    button.addEventListener('click',()=>{
     if(state.scene!==s||!state.player)return;
     try{
      stop();
      const x=state.player.seekStep(i,time());
      draw(x.elapsedMs);
     }catch(error){invalidate();message(error.message,true);}
    });
    nav.append(button);
   }
   $('measure').textContent='数学截面：'+s.sectionEdgeCount+' 边 · 面积 '+
    s.areaMm2.toFixed(3)+' mm² · 周长 '+
    s.perimeterMm.toFixed(3)+' mm。正式国标线型仍待审核。';
   const counts=s.visibilityCounts;
   $('rayStatus').textContent=s.visibilityEvidenceMode==='explicit-observer-rays'?
    '指定视向的截面开边：可见 '+counts.visible+'、遮挡 '+
    counts.hidden+'、不确定 '+counts.undetermined+
    '；仅为模型空间射线结论，端点和正式第一角法均未签收。':
    '未确认材料侧与观察方向：全部 '+counts.undetermined+
    ' 段投影均为待审核线型。';
   draw(0);
   message('数学截面和 V5 逐笔图元已验证，共 '+s.stepCount+
    ' 个步骤。'+(s.visibilityEvidenceMode==='explicit-observer-rays'?
     '按已确认的射线生成模型开边线型。':'未确认观察射线，全部线型待审核。')+
    '正式第一角法标准尚未验收。');
  }catch(error){
   $('rayStatus').textContent='输入尚未满足完整的材料侧和三个视向确认条件。';
   message('求解条件被拒绝：'+error.message,true);
  }
 }
 function play(){
  if(!state.player||!state.scene)return;
  try{
   const clock=time(),snapshot=state.player.snapshot(clock);
   if(snapshot.playing){
    stop();draw(snapshot.elapsedMs);
   }else{
    if(snapshot.done)state.player.seekStep(0,clock);
    state.player.play(clock);$('play').textContent='Ⅱ 暂停';
    if(state.raf===null)state.raf=requestAnimationFrame(tick);
   }
  }catch(error){invalidate();message(error.message,true);}
 }
 function next(delta){
  if(!state.player||!state.scene)return;
  try{
   stop();const t=time(),snapshot=state.player.snapshot(t);
   const target=Math.max(0,Math.min(state.scene.stepCount,
    snapshot.activeStepIndex+delta));
   const stepped=state.player.seekStep(target,t);
   draw(stepped.elapsedMs);
  }catch(error){invalidate();message(error.message,true);}
 }
 function save(){
  if(!state.scene||!state.player)return;
  let url;
  try{
   const frame=state.scene.renderFrame({
    elapsedMs:state.player.snapshot(time()).elapsedMs,
    expectedRevision:state.rev
   });
   url=URL.createObjectURL(new Blob([frame.svg],{
    type:'image/svg+xml;charset=utf-8'
   }));state.urls.add(url);
   const a=document.createElement('a');
   a.href=url;a.download='draftai-prism-section-'+state.rev+'.svg';
   document.body.appendChild(a);
   try{a.click();}finally{a.remove();}
   message('浏览器已发起本地 SVG 保存。空间可见性和正式制图标准的验收范围不同。');
   setTimeout(()=>{if(state.urls.delete(url))URL.revokeObjectURL(url);},3000);
  }catch(error){
   if(url&&state.urls.delete(url))URL.revokeObjectURL(url);
   message('SVG 保存失败：'+error.message,true);
  }
 }
 function init(){
  for(const k of fields){
   $(k).addEventListener('input',invalidate);
   $(k).addEventListener('change',update);
  }
  $('solve').addEventListener('click',update);
  $('visibilityMode').addEventListener('change',()=>{
   $('rayControls').hidden=$('visibilityMode').value!=='rays';
   update();
  });
  for(const id of ['retainedHalfspace','viewV','viewH','viewW'])
   $(id).addEventListener('change',update);
  $('reset').addEventListener('click',()=>{
   for(const [k,v] of Object.entries(initial))$(k).value=v;
   $('rayControls').hidden=true;
   update();
  });
  $('play').addEventListener('click',play);
  $('previous').addEventListener('click',()=>next(-1));
  $('next').addEventListener('click',()=>next(1));
  $('seek').addEventListener('input',()=>{
   if(!state.player)return;
   try{
    const x=state.player.seekProgress(Number($('seek').value)/1000,time());
    draw(x.elapsedMs);
   }catch(error){invalidate();message(error.message,true);}
  });
  $('speed').addEventListener('change',()=>{
   if(!state.player)return;
   try{state.player.setSpeed(Number($('speed').value),time());}
   catch(error){invalidate();message(error.message,true);}
  });
  $('guides').addEventListener('change',()=>{
   $('board').classList.toggle('no-guides',!$('guides').checked);
  });
  $('mono').addEventListener('change',()=>{
   $('board').classList.toggle('mono',$('mono').checked);
  });
  $('save').addEventListener('click',save);
  window.addEventListener('pagehide',()=>{
   stop();for(const u of state.urls)URL.revokeObjectURL(u);state.urls.clear();
  });
  $('rayControls').hidden=$('visibilityMode').value!=='rays';
  update();
 }
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
