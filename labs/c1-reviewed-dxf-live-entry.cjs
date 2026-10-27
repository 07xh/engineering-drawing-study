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
function invalidateDerived(){
 halt();revision++;
 given=null;candidate=null;current=null;
 controls(false);
 $('reviewCheck').checked=false;$('reviewCheck').disabled=true;
 $('compile').disabled=true;
 $('candidate').textContent='原始投影点对应关系尚未独立确认。';
 $('sheetPreview').replaceChildren();
 $('animation').replaceChildren();
 $('v5Status').textContent='数学条件发生变化，旧唯一 V5 已全部失效。';
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
 $('sourcePoints').textContent='请先选择本机原题 GIVEN JSON。';
 $('sourcePairs').value='';
 $('applyPairs').disabled=true;
 $('previewFile').value='';
 clearPreview();
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
function renderCandidate(src,transform){
 const svg=$('sheetPreview');
 svg.replaceChildren();
 const outer=node('svg',{viewBox:'0 0 960 720','aria-label':
  '仅为复原候选：V/H/W 三视图的未确认三维棱线'});
 const geometry=src.inferred.candidateGeometry,pts=geometry.data.points;
 for(const [n,view] of VIEWS.entries()){
  const g=node('g',{'data-view':view});
  const label=node('text',{x:30+n*110,y:25,fill:'#1c5e91',
   'font-size':15});
  label.textContent=view+' 未确认候选';
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
}
function drawV5(){
 const paper=$('animation');paper.replaceChildren();
 if(!current?.solution?.player?.canRender(revision))return;
 const actual=current.solution,frame=actual.player.snapshot(performance.now()),
  preview=$('sheetPreview').querySelector('svg'),
  viewBox=preview?.getAttribute('viewBox')||'0 0 960 720';
 paper.setAttribute('viewBox',viewBox);
 const layer=node('g',{'data-player':'one-existing-canonical-v5',
  'aria-label':'当前已审核的唯一 ConstructionIntent DAG V5'});
 for(const step of actual.steps)for(const a of step.actions){
  const fraction=frame.actionFractions[a.id]||0;
  if(fraction<=0||!['line','point'].includes(a.kind))continue;
  const official=a.engineeringLineStyle,
   hidden=official==='gb-t-4457.4-thin-dashed-hidden-edge',
   visible=official==='gb-t-4457.4-continuous-wide-visible-outline';
  const el=node(a.kind==='line'?'line':'circle',{
   fill:a.kind==='point'?'#1d67a1':'none',
   stroke:hidden?'#1b334d':visible?'#092e53':'#3982be',
   'stroke-width':a.kind==='point'?2:hidden?1.25:visible?2.6:1,
   'data-action-id':a.id,
   'data-official-line-style':hidden?'hidden':visible?'visible':'not-signed'
  });
  if(hidden)el.setAttribute('stroke-dasharray','6 3');
  Motion.updateSvg(el,a,fraction);
  layer.append(el);
 }
 paper.append(layer);
 $('v5Status').textContent='唯一 V5：'+frame.completedIds.length+
  '/'+actual.timeline.segments.length+' 个当前版本动作已完成。'+
  (frame.done?'本轮播放完成。':'未经 M5 认证的边不会作为标准工程线。');
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
  renderCandidate(inferred,projectCandidate(inferred));
  const p=inferred.inferred;
  $('candidate').textContent=
   '原始 DWG SHA-256：'+safeString(source.sourceSha256)+
   '\\n可信转换 DXF SHA-256：'+safeString(source.convertedDxfSha256)+
   '\\n原题已知视图：'+p.knownViewPair.join('/')+
   '；待补视图：'+p.missingView+
   '\\n当前有 '+p.inferredOriginal3DPointCount+' 个独立三维角点；'+
   (p.explicitlyReviewedManyToOnePaperProjectionPairs?
    '由人工明确配对的二维索引：'+p.reviewedOriginal3DPairCount:
    '由现有 M3 自动唯一对应')+
   '\\nM0 验证闭合凸体候选：'+p.independentlyValidatedByCurrentM0+
   '\\n候选三维面：'+p.candidateGeometry.data.faces.length+
   ' 面；候选实体棱线：'+p.candidateGeometry.data.edges.length+
   ' 条。\\n这是审核候选，并不能证明原题中所有隐藏角点、孔槽或非凸部分已识别。';
  $('reviewCheck').disabled=false;
  setStatus('真实原题二维对应关系已提交 M3 和 M0；请独立检查每一面、每条棱后再确认 V5。');
 }catch(e){
  if(revision!==currentRevision)return;
  const message=e?.message||String(e);
  setStatus(/ambiguous|duplicate\/collapsed|different source vertex counts/.test(message)?
   '二维投影存在真实多对一歧义。请按上方各视图索引逐行填写三维角点对应，不得自动猜测。'+message:
   '原题二维配对审核被 M3/M0 阻断：'+message,true);
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
 setStatus('已载入本机原题参考图；原有数学和 V5 审核失效。请重新配对确认。');
}
async function compile(){
 halt();current=null;controls(false);
 $('animation').replaceChildren();
 if(!given||!candidate||!$('reviewCheck').checked){
  setStatus('未明确人工核对凸体全部角点和面拓扑，禁止签发 V5。',true);return;
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
  current=result;
  // This SVG is generated by canonical source-escaped M3/M5 renderer.
  // The local paper and V5 panels never request any textbook answer data.
  $('sheetPreview').innerHTML=result.solution.threeViewSvgSheet.sheetSvg;
  controls(true);
  $('proof').textContent='当前题图识别：仍须人工确认。'+
   '\nM3/M0/M5 原始来源门禁：'+
   result.solution.m0M3M5PhysicalSourceAcceptance.status+
   '\nM5 已签发轮廓 V5：'+
   result.solution.certifiedVisibleContourLineActionCount+
   '；独立证明的实体棱线 V5：'+
   result.solution.certifiedPhysicalLineActionCount+
   '\n唯一 V5 动作数：'+result.solution.timeline.segments.length+
   '；完整教材原题/标准答案盲测：未通过。'+
   '\n原题识别完整性没有独立证明；未认证边只作灰色审阅预览。';
  setStatus('已按本次人工确认条件进入既有 M3/M0/M5/V5；整题未签收。');
  drawV5();
 }catch(e){setStatus('M3/M5/V5 正向门禁阻断：'+(e?.message||String(e)),true);}
}
$('givenFile').addEventListener('change',loadGiven);
$('sourcePairs').addEventListener('input',()=>{
 invalidateDerived();
 $('applyPairs').disabled=!rawGiven;
 setStatus('人工对应关系已编辑：旧 M3/M5/V5 结果已全部作废，请重新核验。');
});
$('applyPairs').addEventListener('click',applyReviewedPairs);
$('previewFile').addEventListener('change',loadSourcePreview);
$('reviewCheck').addEventListener('change',()=>{
 halt();current=null;controls(false);
 $('animation').replaceChildren();
 $('compile').disabled=!candidate||!$('reviewCheck').checked;
 $('v5Status').textContent='确认条件已改变，旧 V5 动作立即失效。';
});
$('compile').addEventListener('click',compile);
$('play').addEventListener('click',play);
$('pause').addEventListener('click',()=>{halt();drawV5();});
$('prev').addEventListener('click',()=>seek(-1));
$('next').addEventListener('click',()=>seek(1));
window.addEventListener('pagehide',()=>{halt();clearPreview();});
invalidate();
setStatus('请选择本机生成的原题 GIVEN JSON，绝不能选私有答案 JSON。');
