'use strict';
/**
 * Local-only private C1 textbook DXF GIVEN packet review -> shared M3/M0/M5/V5.
 *
 * The reference answer file must NEVER be selected here. It is kept offline,
 * out of the browser input, DOM, bundler, logs, storage and solver.
 * A DXF packet hash by itself cannot authenticate source bytes: the trusted
 * converter and original textbook review remain independent prerequisites.
 */
const {validateGivenPacket,reconstructC1FromDxfGiven,
 compileReviewedC1DxfGivenToSoleV5}=
 require('../workbench/c1-authenticated-dxf-to-reviewed-v5.cjs');
const {project,toSheet,VIEWS}=require('../core/projection/conventions.js');
const Motion=require('../workbench/teaching-motion-v5.js');
const {inspectC1CanonicalV5Step}=
 require('../workbench/c1-canonical-v5-step-evidence.cjs');
const {buildC1DxfGivenFirstPaper}=
 require('../workbench/c1-dxf-given-first-paper.cjs');
const {listGivenSourceProjectionIndices,stringifyReviewedSourcePairs,
 withEditedReviewedSourcePairs}=
 require('../workbench/c1-local-review-correspondence-editor.cjs');
const NS='http://www.w3.org/2000/svg', $=id=>document.getElementById(id);
const geometryId='ReviewedPrivateDXF';
let revision=0,rawGiven=null,given=null,candidate=null,current=null,
 playing=false,raf=null,previewObjectUrl=null;
function node(kind,attributes={}){
 const el=document.createElementNS(NS,kind);
 for(const [k,v] of Object.entries(attributes))el.setAttribute(k,String(v));
 return el;
}
function setStatus(message,blocked=false){
 $('status').textContent=message;$('status').dataset.status=blocked?'blocked':'review';
}
function controls(active){
 for(const id of ['play','pause','prev','next'])$(id).disabled=!active;
}
function halt(){
 if(raf!==null){cancelAnimationFrame(raf);raf=null;}
 playing=false;
 if(current?.solution?.player)current.solution.player.pause(performance.now());
}
function resetStepInspector(){
 $('v5StepJump').replaceChildren();
 $('v5StepJump').disabled=true;
 $('v5StepTitle').textContent='原题条件未审核';
 $('v5StepExplanation').textContent='当前条件尚未通过核验，暂无作图步骤。';
 $('v5StepActions').replaceChildren();
 $('v5StepProof').textContent='来源和线型尚未核验，暂无可用作图。';
}
function invalidateDerived(){
 halt();revision++;
 given=null;candidate=null;current=null;
 controls(false);
 $('reviewCheck').checked=false;$('reviewCheck').disabled=true;
 $('compile').disabled=true;
 $('candidate').textContent='原始投影点对应关系尚未独立确认。';
 resetStepInspector();
 $('sheetPreview').replaceChildren();
 $('showCandidate').disabled=true;
 $('showGiven').disabled=!rawGiven;
 renderOriginalPaper();
 $('animation').replaceChildren();
 $('v5Status').textContent='条件已修改，原作图已失效，请重新核对。';
 $('proof').textContent='没有签发当前版本的任何原题实虚线或动画结果。';
}
function clearPreview(){
 if(previewObjectUrl!==null){
  URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=null;
 }
 $('sourcePreview').removeAttribute('src');
 $('sourcePreview').hidden=true;
}
function invalidate(){
 invalidateDerived();
 rawGiven=null;
 $('sourcePoints').textContent='请先选择已知视图 JSON。';
 $('sourcePairs').value='';
 $('applyPairs').disabled=true;
 $('previewFile').value='';
 clearPreview();
 renderOriginalPaper();
}
function projectCandidate(src){
 const geometry=src.inferred.candidateGeometry,
  projections=Object.values(geometry.data.points).flatMap(p=>
   Object.values(project(p)));
 const max=Math.max(1,...projections.map(p=>Math.abs(p.u)),
  ...projections.map(p=>Math.abs(p.v)));
 const scale=Math.min(5,210/max);
 return {origin:{x:380,y:270},scale};
}
// Present only authenticated GIVEN source points on first entry; M0/M3
// candidate geometry and unknown target view are never fetched here.
function renderOriginalPaper(){
 const container=$('sheetPreview');container.replaceChildren();
 $('showGiven').setAttribute('aria-pressed','true');
 $('showCandidate').setAttribute('aria-pressed','false');
 if(!rawGiven){
  $('paperMode').textContent='尚未加载原题：不展示三维候选或第三视图答案。';
  return;
 }
 const paper=buildC1DxfGivenFirstPaper(rawGiven);
 const outer=node('svg',{viewBox:'0 0 960 720',
  'data-c1-paper-mode':'given','data-missing-view':paper.missingView,
  'aria-label':'原题已知点；待补第三视图留白'});
 const labels={V:{x:130,y:38},H:{x:130,y:664},W:{x:640,y:38}};
 const blanks={V:{x:150,y:150},H:{x:150,y:510},W:{x:625,y:170}};
 for(const view of VIEWS){
  const source=paper.views[view],pos=labels[view];
  const group=node('g',{'data-view':view,'data-source-role':source.sourceRole});
  const title=node('text',{x:pos.x,y:pos.y,'font-size':18,
   fill:source.sourceRole==='GIVEN'?'#1b547c':'#8b5d24'});
  title.textContent=view+(source.sourceRole==='GIVEN'?' · 原题已知点':' · 待补空白');
  group.append(title);
  if(source.sourceRole==='UNKNOWN'){
   const blank=node('text',{x:blanks[view].x,y:blanks[view].y,
    fill:'#8d98a5','font-size':16,'data-c1-unanswered-view':view});
   blank.textContent='待求 · 未作答';group.append(blank);
  }else for(const point of source.points){
   group.append(node('circle',{cx:point.paper.x,cy:point.paper.y,r:4.3,
    fill:'#216b9b','data-given-point-index':point.index,
    'data-source-point-only':'true'}));
   const label=node('text',{x:point.paper.x+6,y:point.paper.y-7,
    fill:'#174f78','font-size':13,'data-original-point-label':point.index});
   label.textContent=String(point.index);group.append(label);
  }
  outer.append(group);
 }
 container.append(outer);
 $('paperMode').textContent='仅显示原题 '+paper.knownViewPair.join('/')+
  ' 的 '+paper.knownViewPair.reduce((n,v)=>n+paper.views[v].points.length,0)+
  ' 个原始 CAD 投影点（非已认证线条）；'+paper.missingView+
  ' 视图严格留白。候选必须主动预览，不能作为标准答案。';
}
function renderCandidate(src,transform){
 const svg=$('sheetPreview');
 svg.replaceChildren();
 const outer=node('svg',{viewBox:'0 0 960 720',
  'data-c1-paper-mode':'unsigned-candidate',
  'aria-label':'用户主动打开：V/H/W 未认证三维候选，绝非正式工程线或参考答案'});
 const geometry=src.inferred.candidateGeometry,pts=geometry.data.points;
 for(const [n,view] of VIEWS.entries()){
  const g=node('g',{'data-view':view});
  const pos={V:[130,38],H:[130,664],W:[640,38]}[view];
  const label=node('text',{x:pos[0],y:pos[1],fill:'#99531f','font-size':18});
  label.textContent=view+' · 未认证候选';
  g.append(label);
  for(const [a,b] of geometry.data.edges){
   const from=toSheet(view,project(pts[a])[view],transform),
    to=toSheet(view,project(pts[b])[view],transform);
   if(Math.hypot(from.x-to.x,from.y-to.y)<=1e-8)continue;
   g.append(node('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,
    stroke:'#97a7b9','stroke-width':1.25,'stroke-dasharray':'5 4',
    'data-certification':'unreviewed-convex-source-candidate'}));
  }
  outer.append(g);
 }
 svg.append(outer);
 $('showGiven').setAttribute('aria-pressed','false');
 $('showCandidate').setAttribute('aria-pressed','true');
 $('paperMode').textContent='你正在主动检查未认证三维候选：全部灰色虚线只是几何草稿，'+
  '不是已验证作图、正式实虚线或题目答案。点击“原题已知视图”恢复空白待补视图。';
}
// Never invent a teaching sentence: this is a READ-ONLY projection of
// the existing same-revision ConstructionStep DAG, M5 bindings and V5 frame.
function renderStepInspector(frame){
 const currentStep=inspectC1CanonicalV5Step({
  solution:current.solution,revision,frame
 });
 const select=$('v5StepJump');
 if(select.options.length!==currentStep.totalSteps||
    select.dataset.revision!==String(revision)){
  select.replaceChildren();
  for(const item of currentStep.options){
   const option=document.createElement('option');
   option.value=String(item.index);
   option.textContent=(item.index+1)+' / '+currentStep.totalSteps+' · '+item.title;
   select.append(option);
  }
  select.dataset.revision=String(revision);
 }
 select.disabled=false;
 select.value=String(currentStep.stepIndex);
 $('v5StepTitle').textContent='第 '+currentStep.stepNumber+' / '+
  currentStep.totalSteps+' 步 · '+currentStep.title;
 $('v5StepExplanation').textContent=
  currentStep.explanationVerifiedAvailable?currentStep.explanation:
   '此步骤缺少可核对的作图依据，暂不提供说明。';
 const list=$('v5StepActions');
 list.replaceChildren();
 for(const action of currentStep.actions){
  const item=document.createElement('li');
  item.dataset.proof=action.formalLineCertified?'signed':'unsigned';
  item.dataset.actionId=action.id;
  const kind=action.kind==='point'?'点':action.kind==='line'?'线':action.kind;
  const state=action.status==='completed'?'已绘制':
   action.status==='drawing'?'绘制中':'未开始';
  const proof=action.formalLineCertified?
   ' · 已签收 '+(action.officialLineStyle===
     'gb-t-4457.4-continuous-wide-visible-outline'?'可见粗实线':'隐藏虚线')+
   ' · '+action.view+' 来源 '+action.originalSourceEdgeId+
   (action.sourceParameterRange?
    ' 参数 ['+action.sourceParameterRange.join(', ')+']':''):
   ' · 辅助/点动作（未签收工程线型）';
  item.textContent=kind+' '+action.id+' · '+state+proof;
  list.append(item);
 }
 if(!currentStep.actions.length){
  const item=document.createElement('li');
  item.dataset.proof='unsigned';
  item.textContent='该步骤没有绘图动作，不能作为已完成的正式逐笔作图计数。';
  list.append(item);
 }
 const deps=currentStep.dependsOn.length?
  currentStep.dependsOn.join('、'):'无';
 $('v5StepProof').textContent='来源：'+
  (currentStep.registeredProofSourceSolver||'当前 DAG 未提供求解器来源')+
  '；证明范围：'+(currentStep.proofScope||'未附完整范围说明')+
  '；前置步骤：'+deps+
  '。本面板只展示已有证据，不补签二维 HLR 历史、全场景遮挡或教材整题。';
}
function drawV5(){
 const paper=$('animation');paper.replaceChildren();
 if(!current?.solution?.player?.canRender(revision))return;
 const actual=current.solution,frame=actual.player.snapshot(performance.now()),
  preview=$('sheetPreview').querySelector('svg'),
  viewBox=preview?.getAttribute('viewBox')||'0 0 960 720';
 paper.setAttribute('viewBox',viewBox);
 // Verify actual DAG + every signed action's source before rendering a line.
 // Unbound contours are never allowed to borrow engineering line styles.
 renderStepInspector(frame);
 const signedBindings=new Map([
  ...(actual.certifiedVisibleContourLineBindings||[]),
  ...(actual.certifiedPhysicalLineBindings||[])
 ].map(binding=>[binding.actionId,binding]));
 const layer=node('g',{'data-player':'one-existing-canonical-v5',
  'aria-label':'当前条件下的作图动画'});
 for(const step of actual.steps)for(const a of step.actions){
  const fraction=frame.actionFractions[a.id]||0;
  if(fraction<=0||!['line','point'].includes(a.kind))continue;
  const binding=signedBindings.get(a.id);
  const official=binding?.standardLineStyle||a.engineeringLineStyle,
   hidden=official==='gb-t-4457.4-thin-dashed-hidden-edge',
   visible=official==='gb-t-4457.4-continuous-wide-visible-outline';
  const el=node(a.kind==='line'?'line':'circle',{
   fill:a.kind==='point'?'#1d67a1':'none',
   stroke:hidden?'#1b334d':visible?'#092e53':'#3982be',
   'stroke-width':a.kind==='point'?2:hidden?1.25:visible?2.6:1,
   'data-action-id':a.id,
   'data-original-source-id':binding?.sourceEdgeId||'not-signed',
   'data-official-line-style':hidden?'hidden':visible?'visible':'not-signed'
  });
  if(hidden)el.setAttribute('stroke-dasharray','6 3');
  Motion.updateSvg(el,a,fraction);
  layer.append(el);
 }
 paper.append(layer);
 $('v5Status').textContent='作图进度：'+frame.completedIds.length+
  '/'+actual.timeline.segments.length+' 个当前版本动作已完成。'+
  (frame.done?'本轮播放完成。':'未验证的边不会显示为标准工程线。');
}
function tick(now){
 if(!playing||!current?.solution?.player?.canRender(revision)){
  halt();return;
 }
 const frame=current.solution.player.snapshot(now);
 drawV5();
 if(frame.done){halt();return;}
 raf=requestAnimationFrame(tick);
}
function play(){
 if(!current?.solution?.player?.canRender(revision)||playing)return;
 const player=current.solution.player,now=performance.now();
 if(player.snapshot(now).done)player.seekStep(0,now);
 player.play(now);playing=true;raf=requestAnimationFrame(tick);
}
function seek(dir){
 if(!current?.solution?.player?.canRender(revision))return;
 halt();const player=current.solution.player,
 snap=player.snapshot(performance.now()),
 length=current.solution.steps.length,
 currentIndex=snap.done?length:Math.max(0,snap.activeStepIndex);
 player.seekStep(Math.max(0,Math.min(length,currentIndex+dir)),
  performance.now());
 drawV5();
}
function safeString(hash){return hash.slice(0,12)+'…'+hash.slice(-8);}
async function applyReviewedPairs(){
 if(!rawGiven){
  setStatus('未提供本机可信转换后的原题已知量。',true);return;
 }
 invalidateDerived();
 const currentRevision=revision;
 try{
  // This editor cannot import answers, CAD layers or arbitrary geometry:
  // it only maps 0-based indices already in the ORIGINAL GIVEN JSON.
  const source=withEditedReviewedSourcePairs(
   rawGiven,$('sourcePairs').value);
  const inferred=await reconstructC1FromDxfGiven({
   givenPacket:source,revision:currentRevision,geometryId});
  if(revision!==currentRevision)return;
  given=source;candidate=inferred;
  // Reconstruct M3/M0, but NEVER auto-draw inferred missing-view strokes.
  // Only explicit preview clicks can render the unsigned candidate.
  $('showCandidate').disabled=false;
  const p=inferred.inferred;
  $('candidate').textContent=
   '原始 DWG SHA-256：'+safeString(source.sourceSha256)+
   '\\n可信转换 DXF SHA-256：'+safeString(source.convertedDxfSha256)+
   '\\n原题已知视图：'+p.knownViewPair.join('/')+
   '；待补视图：'+p.missingView+
   '\\n当前有 '+p.inferredOriginal3DPointCount+' 个独立三维角点；'+
   (p.explicitlyReviewedManyToOnePaperProjectionPairs?
    '由人工明确配对的二维索引：'+p.reviewedOriginal3DPairCount:
    '自动对应，仍需核对')+
   '\\nM0 验证闭合凸体候选：'+p.independentlyValidatedByCurrentM0+
   '\\n候选三维面：'+p.candidateGeometry.data.faces.length+
   ' 面；候选实体棱线：'+p.candidateGeometry.data.edges.length+
   ' 条。\\n这是审核候选，并不能证明原题中所有隐藏角点、孔槽或非凸部分已识别。';
  $('reviewCheck').disabled=false;
  setStatus('角点对应关系已提交；请核对每个面和棱后确认。');
 }catch(e){
  if(revision!==currentRevision)return;
  const message=e?.message||String(e);
  setStatus(/ambiguous|duplicate\/collapsed|different source vertex counts/.test(message)?
   '二维投影存在真实多对一歧义。请按上方各视图索引逐行填写三维角点对应，不得自动猜测。'+message:
   '角点对应未通过检查：'+message,true);
 }
}
async function loadGiven(){
 invalidate();
 const file=$('givenFile').files?.[0],loadRevision=revision;
 if(!file)return;
 try{
  if(!file.name.endsWith('.json')||file.size<=0||file.size>300000)
   throw new RangeError('仅支持本机可信转换工具生成的小于 300 KB 的原题已知量 JSON');
  const parsed=JSON.parse(await file.text());
  if(revision!==loadRevision)return;
  validateGivenPacket(parsed);
  rawGiven=parsed;
  renderOriginalPaper();
  $('showGiven').disabled=false;
  $('sourcePoints').textContent=listGivenSourceProjectionIndices(parsed);
  $('sourcePairs').value=stringifyReviewedSourcePairs(parsed);
  $('applyPairs').disabled=false;
  await applyReviewedPairs();
 }catch(e){
  if(revision!==loadRevision&&!rawGiven)return;
  setStatus('本机已知量 JSON 不符合原题来源契约：'+(e?.message||String(e)),true);
 }
}
function loadSourcePreview(){
 clearPreview();
 // Changing the source image also invalidates the previous human review;
 // it never becomes an M3/M5 mathematical source or answer verifier.
 invalidateDerived();
 $('applyPairs').disabled=!rawGiven;
 const file=$('previewFile').files?.[0];
 if(!file){
  setStatus('原题图片已撤销，必须重新核对当前二维数学条件。');return;
 }
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||
    file.size<=0||file.size>6*1024*1024){
  setStatus('只允许本机 6 MB 以内的 PNG/JPEG/WebP 原题参考图片；未作为数学证据。',true);
  return;
 }
 previewObjectUrl=URL.createObjectURL(file);
 $('sourcePreview').src=previewObjectUrl;
 $('sourcePreview').hidden=false;
 setStatus('原图已更换，之前的审核已失效，请重新核对角点。');
}
async function compile(){
 halt();current=null;controls(false);resetStepInspector();
 $('animation').replaceChildren();
 if(!given||!candidate||!$('reviewCheck').checked){
  setStatus('请先核对全部角点、面和棱的对应关系。',true);return;
 }
 try{
  const source=given,rev=revision,
   transformed=projectCandidate(candidate);
  const confirmedReview={
   sourceSha256:source.sourceSha256,
   convertedDxfSha256:source.convertedDxfSha256,
   confirmedCurrentRevision:rev,confirmedGeometryId:geometryId,
   originalGivenPointSetsChecked:true,
   allOriginalExtremeVerticesPresentChecked:true,
   closedConvexFaceAndEdgeTopologyReviewed:true,
   referenceAnswerWasNotUsedToConfirmTopology:true,
   explicitReviewedInputKind:'human-reviewed-original-candidate'
  };
  const result=await compileReviewedC1DxfGivenToSoleV5({
   givenPacket:source,revision:rev,geometryId,
   confirmedReview,sheetTransform:transformed
  });
  if(revision!==rev||!$('reviewCheck').checked)return;
  const scope=result.scopedConvexAcceptance;
  if(!scope||scope.realTextbookBlindTestPassed!==false||
     !scope.perViewSourceCoverage)
   throw new RangeError('missing isolated bounded-convex acceptance evidence');
  const fullyProven=scope.scopedSingleConvexFullyCertified===true;
  const viewCoverage=['V','H','W'].map(view=>{
   const row=scope.perViewSourceCoverage[view];
   if(!row||!Number.isSafeInteger(row.checkedOriginalPhysicalEdgeViews)||
      !Number.isSafeInteger(row.positiveGapCount)||
      !Number.isSafeInteger(row.overlappingCertifiedSourceCount))
    throw new RangeError('missing original '+view+' source-range audit');
   if(fullyProven&&row.allOriginalPhysicalSourceRangesAccounted!==true)
    throw new RangeError('claimed complete C1 lacks '+view+' source-range proof');
   return view+': '+row.checkedOriginalPhysicalEdgeViews+
    ' 条，缺口 '+row.positiveGapCount+
    '，重复 '+row.overlappingCertifiedSourceCount;
  }).join('；');
  // Only publish a live player after the same-run scoped proof is inspected.
  current=result;
  // This SVG is generated by canonical source-escaped M3/M5 renderer.
  // The local paper and V5 panels never request any textbook answer data.
  $('sheetPreview').innerHTML=result.solution.threeViewSvgSheet.sheetSvg;
  $('showGiven').disabled=true;
  $('showCandidate').disabled=true;
  $('showGiven').setAttribute('aria-pressed','false');
  $('showCandidate').setAttribute('aria-pressed','false');
  $('paperMode').textContent='当前显示本次核验通过的结果；'+
   '未证明线段不得按正式工程线展示，教材整题盲测仍未通过。';
  controls(true);
  $('proof').textContent='真实教材题图自动识别/全部角点完整性：尚未独立认证。'+
   '\nM3/M0/M5 原始来源门禁：'+
   result.solution.m0M3M5PhysicalSourceAcceptance.status+
   '\n限定单闭合凸体全部原始实体棱线：'+
   (fullyProven?'完整数学认证通过':'尚存数学证明阻断')+
   '\n已审三视图原始棱线：'+scope.checkedOriginalPhysicalEdgeViews+
   '；正长度未覆盖区间：'+scope.positiveGapCount+
   '；重复签发区间：'+scope.overlappingCertifiedSourceCount+
   '\nV/H/W 原始来源逐视图：'+viewCoverage+
   '\nM5 已签发轮廓 V5：'+
   result.solution.certifiedVisibleContourLineActionCount+
   '；已证明的实体棱线 V5：'+
   result.solution.certifiedPhysicalLineActionCount+
   '\n唯一 V5 动作数：'+result.solution.timeline.segments.length+
   '；真实教材原题/标准答案无答案盲测：未通过。'+
   (fullyProven?
    '\n数学证明仅适用于本次人工审核的单一闭合凸体，绝不代表真实教材答案已通过。':
    '\n尚未签发的数学条件：'+scope.missingObligations.join('；')+
    '。未认证棱线只供灰色审阅。');
  setStatus(fullyProven?
   '本次受限凸体全三视图原始棱线数学签收通过；原教材盲测仍未通过。':
   '当前显示局部作图；完整棱线和题目结果仍未全部核验。');
  drawV5();
 }catch(e){setStatus('条件未通过核验：'+(e?.message||String(e)),true);}
}
$('showGiven').addEventListener('click',()=>{
 if(!rawGiven||$('showGiven').disabled)return;
 halt();renderOriginalPaper();
});
$('showCandidate').addEventListener('click',()=>{
 if(!rawGiven||!candidate||$('showCandidate').disabled)return;
 halt();renderCandidate(candidate,projectCandidate(candidate));
});
$('givenFile').addEventListener('change',loadGiven);
$('sourcePairs').addEventListener('input',()=>{
 invalidateDerived();
 $('applyPairs').disabled=!rawGiven;
 setStatus('角点对应已修改，旧结果已失效，请重新核对。');
});
$('applyPairs').addEventListener('click',applyReviewedPairs);
$('previewFile').addEventListener('change',loadSourcePreview);
$('reviewCheck').addEventListener('change',()=>{
 halt();current=null;controls(false);
 $('animation').replaceChildren();
 resetStepInspector();
 $('compile').disabled=!candidate||!$('reviewCheck').checked;
 $('v5Status').textContent='确认条件已改变，旧作图已失效。';
});
$('compile').addEventListener('click',compile);
$('v5StepJump').addEventListener('change',()=>{
 if(!current?.solution?.player?.canRender(revision))return;
 const index=Number($('v5StepJump').value);
 if(!Number.isInteger(index)||index<0||index>=current.solution.steps.length)return;
 halt();
 current.solution.player.seekStep(index,performance.now());
 drawV5();
});
$('play').addEventListener('click',play);
$('pause').addEventListener('click',()=>{halt();drawV5();});
$('prev').addEventListener('click',()=>seek(-1));
$('next').addEventListener('click',()=>seek(1));
window.addEventListener('pagehide',()=>{halt();clearPreview();});
invalidate();
setStatus('请选择本机生成的已知量 JSON，不要选择答案文件。');
