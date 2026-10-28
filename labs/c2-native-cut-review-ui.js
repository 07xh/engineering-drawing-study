'use strict';
/* Display-only C2 proof review. NO browser geometry solver and NO second player.
 * Replays existing DA07TimelineV5 and DA07MotionV5 actions from a genuine
 * same-run native proof pack selected by the user from local storage.
 * Browser-side shape validation is NOT cryptographic OCCT attestation.
 */
(function(){
 const $=id=>document.getElementById(id),
  timelineV5=globalThis.DA07TimelineV5,motionV5=globalThis.DA07MotionV5,
  ns='http://www.w3.org/2000/svg';
 let player=null,segments=[],frameId=null,actualSteps=[],loadedRevision=null;
 const controls=['cutPlay','cutPrev','cutNext','cutSeek'];
 const message=(value,error=false)=>{
  $('cutStatus').textContent=value;
  $('cutStatus').dataset.error=error?'true':'false';
 };
 const safeNumber=n=>Number.isFinite(n)&&Math.abs(n)<1000000;
 function assertPack(pack){
  const p=pack?.sourceCertifiedNativeCanonicalPartialCutV5;
  if(pack?.schema!=='draftai-c2-actual-native-occt-m0-m4-m5-full-proof-pack/1'||
     pack.booleanOperation!=='cut'||
     pack.provenance?.actualNativeOpenCascadeRanInThisProcessTree!==true||
     pack.sourceCertifiedNativeCanonicalV5!==null||
     pack.completeCutProjectOfficialGBLineStylesAndV5Certified!==false||
     pack.ConstructionIntentDAGSingleV5FullySigned!==false||
     pack.completeSubtractiveBooleanM5RayVisibilityCertified!==false||
     pack.realTextbookBlindTestPassed!==false||
     p?.actualOriginalBooleanOperation!=='cut'||
     p.entireCutOriginalDrawingSigned!==false||
     p.boundedTwoBoxUnionFullFormalV5Certified!==false||
     p.allNativePhysicalSourcesSignedOrProvenSuppressed!==false||
     p.canonicalConstructionIntentDagChecked!==true||
     p.oneExistingV5TimelineRecreated!==true||
     p.realNativeBRepWasExecutedInOriginalRunner!==true)
   throw new Error('这不是仍保持整题未签收的真实 C2 Cut 局部证明格式');
  const signed=p.certifiedVisibleHiddenSourceIntervals,held=p.unsignedNativePhysicalSourceIntervals,
   suppressed=p.suppressedNativeBackSourceIntervals;
  if(!Array.isArray(signed)||!Array.isArray(held)||!Array.isArray(suppressed)||
     signed.length<1||signed.length>256||
     held.length>256||suppressed.length>256||
     pack.independentlySignedPartialCutV5ActionCount!==signed.length||
     p.steps?.length!==signed.length||p.intents?.length!==signed.length||
     pack.provenance?.signedV5ActionCount!==signed.length)
   throw new Error('局部签发线段与 V5 事件清单数量不一致');
  const permitted=new Set([
   'gb-t-4457.4-continuous-wide-visible-outline',
   'gb-t-4457.4-thin-dashed-hidden-edge'
  ]);
  const indices=new Map(),ordered=[];
  for(const row of signed){
   if(typeof row?.actionId!=='string'||!/^c2_native_action_[VHW]_\d+_\d+$/.test(row.actionId)||
      indices.has(row.actionId)||!['V','H','W'].includes(row.view)||
      !permitted.has(row.standardEngineeringLineStyle)||
      row.cutVerifiedOriginalTopoDSEndpointsAndClosedM0Rays!==true||
      row.cutOriginalM4PaperAliasStrictDepthReverified!==true||
      row.completeC2CutResultCertified!==false||
      row.signedByExistingConstructionIntentDagAndSingleV5!==true)
    throw new Error('有未被认证的物理线段试图进入 V5');
   indices.set(row.actionId,row);
  }
  const seen=new Set();
  for(const step of p.steps){
   if(!Array.isArray(step.actions)||step.actions.length!==1||
      typeof step.id!=='string'||!/^c2_native_[VHW]_\d+_\d+$/.test(step.id))
    throw new Error('已有 V5 步骤格式有误');
   const a=step.actions[0],row=indices.get(a?.id);
   if(!row||seen.has(a.id)||a.kind!=='line'||
      a.engineeringLineStyle!==row.standardEngineeringLineStyle||
      a.coordinateSpace!=='sheet-px'||!a.geometry||
      ![a.geometry.from?.x,a.geometry.from?.y,a.geometry.to?.x,
        a.geometry.to?.y].every(safeNumber))
    throw new Error('动画包含未经来源和线型匹配的动作');
   seen.add(a.id);
   ordered.push(a);
  }
  if(seen.size!==signed.length)
   throw new Error('原始认证线段没有逐一进入现有 V5');
  const computed=timelineV5.compileTimeline(p.steps);
  if(!p.timeline||computed.totalMs!==p.timeline.totalMs||
     computed.segments.length!==p.timeline.segments?.length||
     computed.segments.some((seg,i)=>seg.id!==p.timeline.segments[i]?.id||
      seg.startMs!==p.timeline.segments[i].startMs||
      seg.endMs!==p.timeline.segments[i].endMs))
   throw new Error('导入的时间轴与现有 V5 重新编译结果不符');
  if(!Number.isSafeInteger(p.revision)||p.revision<1)
   throw new Error('输入版本无效');
  return {pack,p,computed,ordered,indices};
 }
 function render(now){
  if(!player)return;
  const snapshot=player.snapshot(now);
  for(const item of segments){
   const t=snapshot.actionFractions[item.action.id]??0;
   const attrs=motionV5.actionShapeAttrs(item.action,t);
   for(const key of ['x1','y1','x2','y2','opacity','stroke-width','stroke-dasharray']){
    if(attrs[key]!==undefined)item.el.setAttribute(key,String(attrs[key]));
   }
   item.el.style.visibility=t<=0?'hidden':'visible';
  }
  $('cutSeek').value=String(Math.round(snapshot.ratio*1000));
  $('cutPosition').textContent=(snapshot.activeStepIndex+1)+' / '+actualSteps.length;
  $('cutStep').textContent=snapshot.done?
   '局部认证线段回放结束；剩余未认证线条始终不绘制。':
   (actualSteps[snapshot.activeStepIndex]?.title||'准备逐笔绘制');
  $('cutPlay').textContent=snapshot.playing?'暂停':'播放';
  frameId=null;
  if(snapshot.playing)frameId=requestAnimationFrame(render);
 }
 function refresh(){
  if(frameId!==null)cancelAnimationFrame(frameId);
  frameId=null;render(performance.now());
 }
 function loadProof(parsed){
  if(!timelineV5||!motionV5)throw new Error('未能加载仓库现有 V5 组件');
  const {pack,p,computed,ordered,indices}=assertPack(parsed);
  const root=$('cutDraw');root.replaceChildren();
  const xs=[],ys=[];
  segments=ordered.map(action=>{
   const style=indices.get(action.id).standardEngineeringLineStyle;
   const el=document.createElementNS(ns,'line');
   el.setAttribute('stroke','#145497');el.setAttribute('fill','none');
   el.dataset.actionId=action.id;
   el.dataset.engineeringLine=style.includes('dashed')?'hidden':'visible';
   root.appendChild(el);
   xs.push(action.geometry.from.x,action.geometry.to.x);
   ys.push(action.geometry.from.y,action.geometry.to.y);
   return {action,el};
  });
  $('cutBoard').setAttribute('viewBox',[
   Math.min(...xs)-45,Math.min(...ys)-62,
   Math.max(420,Math.max(...xs)-Math.min(...xs)+90),
   Math.max(300,Math.max(...ys)-Math.min(...ys)+112)
  ].join(' '));
  const labels=$('cutLineList');labels.replaceChildren();
  for(const row of p.certifiedVisibleHiddenSourceIntervals){
   const li=document.createElement('li');
   li.textContent=row.view+' 视图 · 原始棱线 #'+
    row.sourceNativeResultEdgeOrdinal+' · '+
    (row.standardEngineeringLineStyle.includes('dashed')?'虚线':'实线')+
    ' · 已认证';labels.appendChild(li);
  }
  player=timelineV5.createPlayer(computed,{revision:p.revision});
  actualSteps=p.steps;
  loadedRevision=p.revision;
  $('cutSigned').textContent=String(segments.length);
  $('cutSuppressed').textContent=String(p.suppressedNativeBackSourceIntervals.length);
  $('cutHeld').textContent=String(p.unsignedNativePhysicalSourceIntervals.length);
  controls.forEach(id=>$(id).disabled=false);
  $('cutSpeed').value='1';
  message('已本机加载 '+segments.length+' 条局部 V5 线段。文件来自外部，浏览器没有重新核验原生 OCCT 真实性；整题仍未签收。');
  refresh();
 }
 $('cutProofFile').addEventListener('change',async event=>{
  controls.forEach(id=>$(id).disabled=true);
  if(frameId!==null)cancelAnimationFrame(frameId);
  frameId=null;player=null;segments=[];actualSteps=[];
  $('cutDraw').replaceChildren();$('cutLineList').replaceChildren();
  ['cutSigned','cutSuppressed','cutHeld'].forEach(id=>$(id).textContent='—');
  const file=event.target.files?.[0];
  if(!file)return;
  try{
   if(file.size>12*1024*1024||file.size<100)
    throw new Error('证明文件必须是小于等于 12 MiB 的非空 JSON');
   const raw=await file.text(),parsed=JSON.parse(raw);
   loadProof(parsed);
  }catch(error){
   message('无法加载证明：'+String(error.message||error),true);
  }
 });
 $('cutPlay').addEventListener('click',()=>{
  if(!player)return;
  const now=performance.now(),snapshot=player.snapshot(now);
  if(snapshot.done)player.seekMs(0,now);
  if(snapshot.playing)player.pause(now);else player.play(now);
  refresh();
 });
 $('cutPrev').addEventListener('click',()=>{
  if(!player)return;
  const now=performance.now(),s=player.snapshot(now),index=
   Math.max(0,s.activeStepIndex-1);
  player.pause(now);player.seekStep(index,now);refresh();
 });
 $('cutNext').addEventListener('click',()=>{
  if(!player)return;
  const now=performance.now(),s=player.snapshot(now),index=
   Math.min(actualSteps.length,s.activeStepIndex+1);
  player.pause(now);player.seekStep(index,now);refresh();
 });
 $('cutSpeed').addEventListener('change',()=>{
  if(!player)return;
  player.setSpeed(Number($('cutSpeed').value),performance.now());
  refresh();
 });
 $('cutSeek').addEventListener('input',()=>{
  if(!player)return;
  player.seekProgress(Number($('cutSeek').value)/1000,performance.now());
  refresh();
 });
})();
