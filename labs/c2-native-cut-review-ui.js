'use strict';
/* Display-only C2 proof review. NO browser geometry solver and NO second player.
 * Replays existing DA07TimelineV5 and DA07MotionV5 actions from a genuine
 * same-run native proof pack selected by the user from local storage.
 * Browser-side shape validation is NOT cryptographic OCCT attestation.
 */
(function(){
 const $=id=>document.getElementById(id),
  timelineV5=globalThis.DA07TimelineV5,motionV5=globalThis.DA07MotionV5,
  projection=globalThis.DAFirstAngleProjection,
  ns='http://www.w3.org/2000/svg';
 let player=null,segments=[],frameId=null,actualSteps=[],loadedRevision=null;
 const controls=['cutPlay','cutPrev','cutNext','cutSeek'];
 const message=(value,error=false)=>{
  $('cutStatus').textContent=value;
  $('cutStatus').dataset.error=error?'true':'false';
 };
 const safeNumber=n=>Number.isFinite(n)&&Math.abs(n)<1000000;
 function assertPack(pack){
  if(!projection||typeof projection.toSheet!=='function')
   throw new Error('缺少与真实 M4 相同的第一角法投影变换');
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
  const originalSheet=p.sheetTransform;
  if(!originalSheet||!Number.isFinite(originalSheet.scale)||
     originalSheet.scale<=0||
     !Number.isFinite(originalSheet.origin?.x)||
     !Number.isFinite(originalSheet.origin?.y))
   throw new Error('未提供真实首角法 V H W 同纸变换');
  const indices=new Map(),ordered=[];
  for(const row of signed){
   if(typeof row?.actionId!=='string'||!/^c2_native_action_[VHW]_\d+_\d+$/.test(row.actionId)||
      indices.has(row.actionId)||!['V','H','W'].includes(row.view)||
      !permitted.has(row.standardEngineeringLineStyle)||
      !Array.isArray(row.originalGeneratedEdgeParameterRange)||
      row.originalGeneratedEdgeParameterRange.length!==2||
      !(row.originalGeneratedEdgeParameterRange[0]>=0&&
       row.originalGeneratedEdgeParameterRange[0]<
       row.originalGeneratedEdgeParameterRange[1]&&
       row.originalGeneratedEdgeParameterRange[1]<=1)||
      !row.projectedFromModelMm||!row.projectedToModelMm||
      row.cutVerifiedOriginalTopoDSEndpointsAndClosedM0Rays!==true||
      row.cutOriginalM4PaperAliasStrictDepthReverified!==true||
      row.completeC2CutResultCertified!==false||
      row.signedByExistingConstructionIntentDagAndSingleV5!==true)
    throw new Error('有未被认证的物理线段试图进入 V5');
   indices.set(row.actionId,row);
  }
  const seen=new Set();
  for(const [i,step] of p.steps.entries()){
   if(!Array.isArray(step.actions)||step.actions.length!==1||
      typeof step.id!=='string'||!/^c2_native_[VHW]_\d+_\d+$/.test(step.id))
    throw new Error('已有 V5 步骤格式有误');
   const a=step.actions[0],row=indices.get(a?.id);
   if(!row||seen.has(a.id)||a.kind!=='line'||
      a.engineeringLineStyle!==row.standardEngineeringLineStyle||
      !a.geometry||
      ![a.geometry.from?.x,a.geometry.from?.y,a.geometry.to?.x,
        a.geometry.to?.y].every(safeNumber))
    throw new Error('动画包含未经来源和线型匹配的动作');
   const intent=p.intents[i];
   const op=intent?.operations?.[0];
   if(intent?.id!==step.id||intent?.operations?.length!==1||
      intent?.outputEntityIds?.length!==1||
      intent.outputEntityIds[0]!==a.id||
      op?.id!==a.id||op?.kind!=='line'||
      op.coordinateSpace!=='sheet-px')
    throw new Error('现有 ConstructionIntent 与 V5 DAG 对应关系不一致');
   const rowProjectedFrom=projection.toSheet(row.view,row.projectedFromModelMm,originalSheet);
   const rowProjectedTo=projection.toSheet(row.view,row.projectedToModelMm,originalSheet);
   for(const [actual,expected,contract] of [
    [a.geometry.from,rowProjectedFrom,'V5 起点与 M4 纸面投影'],
    [a.geometry.to,rowProjectedTo,'V5 终点与 M4 纸面投影'],
    [op.geometry?.from,a.geometry.from,'ConstructionIntent 起点与 V5'],
    [op.geometry?.to,a.geometry.to,'ConstructionIntent 终点与 V5']]){
    if(!actual||!expected||!Object.is(actual.x,expected.x)||
       !Object.is(actual.y,expected.y))
     throw new Error(contract+'不一致，不允许绘制伪造线段');
   }
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
 function showAcceptedV5Rows({rows,ordered,computed,revision,counts,explanation}){
  if(!Array.isArray(rows)||rows.length!==ordered.length||!rows.length)
   throw new Error('认证线段与动画步骤没有一一对应');
  const styleByAction=new Map(rows.map(r=>[r.actionId,r.standardEngineeringLineStyle]));
  if(styleByAction.size!==rows.length)
   throw new Error('重复的 V5 原始已认证图线');
  const root=$('cutDraw');root.replaceChildren();
  const xs=[],ys=[];
  segments=ordered.map(action=>{
   const style=styleByAction.get(action.id);
   if(!style||action.engineeringLineStyle!==style)
    throw new Error('V5 线型未匹配已认证原始对象');
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
  for(const row of rows){
   const li=document.createElement('li');
   li.textContent=row.view+' 视图 · 原始棱线 #'+
    row.sourceNativeResultEdgeOrdinal+' · '+
    (row.standardEngineeringLineStyle.includes('dashed')?'虚线':'实线')+
    ' · 局部认证';labels.appendChild(li);
  }
  player=timelineV5.createPlayer(computed,{revision});
  actualSteps=computed.steps;
  loadedRevision=revision;
  $('cutSigned').textContent=String(counts.signed);
  $('cutSuppressed').textContent=String(counts.suppressed);
  $('cutHeld').textContent=String(counts.held);
  controls.forEach(id=>$(id).disabled=false);
  $('cutSpeed').value='1';
  message(explanation);
  refresh();
 }
 function loadProof(parsed){
  if(!timelineV5||!motionV5)throw new Error('未能加载仓库现有 V5 组件');
  const {p,computed,ordered}=assertPack(parsed);
  showAcceptedV5Rows({
   rows:p.certifiedVisibleHiddenSourceIntervals,ordered,computed,
   revision:p.revision,
   counts:{signed:ordered.length,suppressed:p.suppressedNativeBackSourceIntervals.length,
    held:p.unsignedNativePhysicalSourceIntervals.length},
   explanation:'已本机加载 '+ordered.length+' 条局部 V5 线段。文件来自外部，浏览器没有重新核验原生 OCCT 真实性；整题仍未签收。'
  });
 }
 function loadPinnedNativeDemo(){
  const d=globalThis.DAC2NativeSignedDemo;
  if(!timelineV5||!motionV5||!projection||d?.schema!==
     'draftai-public-occt-c2-cut-signed-only-preview/1'||
     d.completeDrawing!==false||d.originalBRepActualOCP!==true||
     !Number.isSafeInteger(d.sourceRevision)||d.sourceRevision<1||
     typeof d.sourceGeometryHash!=='string'||
     !/^[0-9a-f]{64}$/.test(d.sourceGeometryHash)||
     d.counts?.signed!==12||d.counts.suppressed!==12||
     d.counts.held!==40||!Array.isArray(d.strokes)||
     d.strokes.length!==12)
   throw new Error('公开固定通孔演示来源缺失或不符合原始 CI 数学边界');
  const transform={origin:{x:320,y:270},scale:12},
   styles=new Set(['gb-t-4457.4-continuous-wide-visible-outline',
    'gb-t-4457.4-thin-dashed-hidden-edge']),seen=new Set(),rows=[],steps=[];
  for(const [i,s] of d.strokes.entries()){
   if(!['V','H','W'].includes(s.view)||!Number.isSafeInteger(s.edge)||
      s.edge<1||s.edge>24||!Array.isArray(s.range)||
      s.range.length!==2||s.range[0]!==0||s.range[1]!==1||
      !styles.has(s.style)||!s.from||!s.to)
    throw new Error('演示行不符合 CI 验证的原始线段范围');
   const key=s.view+'@'+s.edge;
   if(seen.has(key))throw new Error('重复的通孔原始视图棱线');
   seen.add(key);
   const from=projection.toSheet(s.view,s.from,transform),
    to=projection.toSheet(s.view,s.to,transform);
   if(![from.x,from.y,to.x,to.y].every(safeNumber)||
      Math.hypot(from.x-to.x,from.y-to.y)<1e-9)
    throw new Error('演示投影不构成有限的第一角法工程棱线');
   const id='c2_native_'+s.view+'_'+s.edge+'_0',
    actionId='c2_native_action_'+s.view+'_'+s.edge+'_0',
    action={id:actionId,kind:'line',geometry:{from,to},
     engineeringLineStyle:s.style};
   const previous=steps[i-1]?.id;
   steps.push({id,title:'经原始 OCCT 验收的局部图线 '+s.view,
    dependsOn:previous?[previous]:[],actions:[action]});
   rows.push({view:s.view,sourceNativeResultEdgeOrdinal:s.edge,
    actionId,standardEngineeringLineStyle:s.style});
  }
  const computed=timelineV5.compileTimeline(steps);
  showAcceptedV5Rows({rows,ordered:steps.map(x=>x.actions[0]),
   computed,revision:d.sourceRevision,counts:d.counts,
   explanation:'已打开仓库自带的真实 OCCT 固定通孔局部演示：12 条已认证，12 条后景不重复绘制，40 条待验。每次 CI 重新比对演示源与真正 OCP 结果；这不是可修改参数的完整 C2 解答。'});
 }
 $('cutDemo').addEventListener('click',()=>{
  if(frameId!==null)cancelAnimationFrame(frameId);
  frameId=null;player=null;segments=[];actualSteps=[];
  controls.forEach(id=>$(id).disabled=true);
  $('cutDraw').replaceChildren();
  try{loadPinnedNativeDemo()}
  catch(error){message('无法打开官方局部演示：'+String(error.message||error),true)}
 });
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
