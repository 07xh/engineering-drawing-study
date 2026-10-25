'use strict';
// One opt-in view of the already-shared 03/M0/Geometry Scene and ONE existing
// V5 for proven point constructions. The complete solid still lacks line-style
// and V5 certification. No user data is uploaded or persisted.
const {compileReviewedSolidVertexV5}=require('../workbench/reviewed-solid-vertex-v5.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');
const {prismMesh}=require('../project/unified-workbench-session.cjs');
const {toSheet,project}=require('../core/projection/conventions.js');
const $=id=>document.getElementById(id);
const template=prismMesh({solid:{min:{x:0,y:0,z:0},max:{x:1,y:1,z:1}}});
const SAMPLE={x:[0,30],y:[0,15],z:[0,20]};
const NS='http://www.w3.org/2000/svg';
const SHEET={origin:{x:350,y:195},scale:4};
let revision=1,current=null,playing=false,raf=null;
function stop(){
 if(raf!==null){cancelAnimationFrame(raf);raf=null;}
 playing=false;
 if(current)current.player.pause(performance.now());
}
function resetV5(){
 stop();current=null;
 for(const id of ['pointV5Play','pointV5Pause','pointV5Prev','pointV5Next'])
  $(id).disabled=true;
 $('pointV5Status').textContent='已知条件变动，旧顶点 V5 资格失效。';
}
function repaintPointV5(){
 const svg=$('paper');
 svg.querySelectorAll('[data-v5-vertex-layer]').forEach(node=>node.remove());
 if(!current||!current.player.canRender(revision))return;
 const layer=document.createElementNS(NS,'g');
 layer.setAttribute('data-v5-vertex-layer','true');
 layer.setAttribute('aria-label','唯一 V5 播放器的已证明顶点及辅助线');
 const frame=current.player.snapshot();
 for(const step of current.steps)for(const action of step.actions){
  const fraction=frame.actionFractions[action.id]||0;
  if(fraction<=0||!['line','point'].includes(action.kind))continue;
  const el=document.createElementNS(NS,action.kind==='line'?'line':'circle');
  el.setAttribute('stroke',action.kind==='point'?'#20689d':'#bb7b31');
  el.setAttribute('stroke-width',action.kind==='point'?'2.5':'1.5');
  el.setAttribute('fill',action.kind==='point'?'#20689d':'none');
  el.setAttribute('data-source-v5-action',action.id);
  el.setAttribute('data-certified-scope','point-auxiliary-only');
  el.setAttribute('data-official-solid-stroke','false');
  Motion.updateSvg(el,action,fraction);
  layer.append(el);
 }
 svg.append(layer);
 $('pointV5Status').textContent='唯一 V5：已完成 '+frame.completedIds.length+
  '/'+current.timeline.segments.length+' 个顶点或辅助动作；'+
  (frame.done?'本轮播放结束':'仅顶点正式作图')+
  '。实体棱线未认证。';
}
function tick(now){
 if(!playing||!current||!current.player.canRender(revision)){stop();return;}
 const frame=current.player.snapshot(now);
 repaintPointV5();
 if(frame.done){stop();return;}
 raf=requestAnimationFrame(tick);
}
function startV5(){
 if(!current||!current.player.canRender(revision))return;
 if(playing)return;
 current.player.play(performance.now());
 playing=true;raf=requestAnimationFrame(tick);
}
function navigateV5(delta){
 if(!current||!current.player.canRender(revision))return;
 stop();
 const snapshot=current.player.snapshot();
 const stepIndex=Math.max(0,Math.min(current.steps.length,
  (snapshot.done?current.steps.length:snapshot.activeStepIndex)+delta));
 current.player.seekStep(stepIndex,performance.now());
 repaintPointV5();
}
function parseRow(line,index){
 const items=line.trim().split(/[，,]/).map(v=>v.trim());
 if(items.length!==5||!Object.hasOwn(template.data.points,items[0]))
  throw new TypeError('第 '+(index+1)+' 行应为已确认的 V000…V111 编号及四个毫米坐标');
 const n=items.slice(1).map(x=>{
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(x))
   throw new TypeError('投影坐标须是有效十进制数字');
  const value=Number(x);
  if(!Number.isFinite(value)||Math.abs(value)>100000)
   throw new TypeError('模型坐标越界');
  return value;
 });
 return {id:items[0],n};
}
function clear(){
 resetV5();
 $('paper').replaceChildren();
 $('proof').textContent='条件改变，旧几何投影及证明已经作废。';
 $('status').textContent='请重新核对并确认条件后计算。';
 $('status').dataset.status='idle';
 $('confirmed').checked=false;
 revision++;
}
function rowSample(viewPair){
 const coords=Object.entries(template.data.points).map(([id,p])=>{
  const model={x:SAMPLE.x[p.x],y:SAMPLE.y[p.y],z:SAMPLE.z[p.z]};
  const pv=project(model);
  return [id,...[...viewPair].flatMap(v=>[pv[v].u,pv[v].v])].join(',');
 });
 return coords.join('\n');
}
function syncFormat(){
 const pair=$('pair').value;
 if(!['VH','VW','HW'].includes(pair))throw new Error('视图组合不支持');
 $('format').textContent='每行：角点 ID, '+[...pair].flatMap(v=>[v+'.u',v+'.v']).join(', ')+
  '（模型 mm）。注意两张视图须属于同一个长方体的已知对应角点。';
}
function shape(tag,attributes={}){
 const n=document.createElementNS(NS,tag);
 for(const [k,v] of Object.entries(attributes))n.setAttribute(k,String(v));
 return n;
}

// The EXISTING M5 hull-side arrangement is the only source of this overlay.
// Rendering an atomic 2D coverage interval is not granting it a line style,
// final depth-sorted 3D identity, source join, or another V5 timeline.
function drawScopedHullIntervals(svg,certified,result,view){
 const proof=certified.convexContourSourceCoverage;
 if(proof?.status==='not-covered')return;
 if(!proof||
    proof.status!=='scoped-convex-hull-physical-source-coverage'||
    proof.sourceGeometryId!==result.geometry.id||
    proof.revision!==result.revision||
    proof.officialLineStylesVerified!==false||
    proof.completeSolidV5Ready!==false)
  throw new Error('当前 C1 凸体投影轮廓来源证据缺失或过期');
 const viewProof=proof.views.find(x=>x.view===view);
 if(!viewProof||viewProof.wholeConvex2DBoundaryVerified!==true||
    viewProof.everyHullSideCoveredByPhysicalSourceEdges!==true||
    viewProof.officialLineStylesVerified!==false)
  throw new Error('当前投影面没有完整且未签收的来源区间证明');
 for(const side of viewProof.sides)for(const interval of side.intervals){
  if(interval.revision!==result.revision||
     interval.sourceGeometryId!==result.geometry.id||
     interval.view!==view||
     !interval.geometricBoundarySourceCoverageVerified||
     interval.uniqueFinalPhysicalStrokeSourceVerified!==false||
     interval.completeProjectedEndpointJoinVerified!==false||
     interval.certifiedObserverRayForEntireFinalStroke!==false||
     interval.officialLineStyle!=='undetermined'||
     interval.v5StrokeAuthorized!==false||
     !Array.isArray(interval.sourceEdgeIds)||
     interval.sourceEdgeIds.length===0)
   throw new Error('来源轮廓区间不满足保守的 M5 预览门禁');
  const a=toSheet(view,interval.fromModelMm,SHEET),
   b=toSheet(view,interval.toModelMm,SHEET);
  if(!(Math.hypot(b.x-a.x,b.y-a.y)>1e-8))
   throw new Error('退化或错误的投影轮廓来源区间');
  const e=shape('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
   stroke:'#147d99','stroke-width':2.5,
   'stroke-dasharray':'1 7','stroke-linecap':'round',fill:'none'});
  e.setAttribute('data-m5-hull-interval','source-coverage-only');
  e.setAttribute('data-source-edges',interval.sourceEdgeIds.join(' '));
  e.setAttribute('data-proof-revision',String(interval.revision));
  e.setAttribute('data-visibility','undetermined');
  e.setAttribute('data-official-v5','false');
  const title=shape('title');
  title.textContent=view+' 单体凸投影边界：原始折棱来源已覆盖；'+
   '完整端点连接/最终可见性/工程虚实线和 V5 均未认证';
  e.append(title);
  svg.append(e);
 }
}

function draw(result,certified){
 const svg=$('paper');svg.replaceChildren();
 svg.append(shape('rect',{x:0,y:0,width:800,height:530,fill:'#fff'}));
 const missing=result.missingView;
 for(const v of ['V','H','W']){
  const data=result.projections[v];
  const label=v+' · '+(v===missing?'补出的第三视图':'已知投影视图');
  const labelAt=v==='W'?{x:480,y:40}:v==='H'?{x:28,y:385}:{x:28,y:40};
  const text=shape('text',{x:labelAt.x,y:labelAt.y,fill:'#365b83',
    'font-size':18});text.textContent=label;svg.append(text);
  const paperPoints=Object.fromEntries(Object.entries(data.points).map(([id,p])=>
   [id,toSheet(v,p,SHEET)]));
  const edges=certified.scopedEdgePreviews.filter(e=>
   e.view===v&&e.renderedAsPhysicalSourceCandidate);
  for(const edge of edges){
   if(edge.revision!==result.revision||
      edge.sourceGeometryId!==result.geometry.id||
      edge.finalEngineeringLineStyle!=='undetermined'||
      edge.officialV5Stroke!==false)
    throw new Error('过期或伪造的实体棱线 M5 几何预览');
   const from=paperPoints[edge.sourceVertexIds[0]];
   const to=paperPoints[edge.sourceVertexIds[1]];
   if(!from||!to)throw new Error('缺少来源棱线的投影顶点');
   const e=edge.projectionCollapsedToPoint?
    shape('circle',{cx:from.x,cy:from.y,r:3.5,fill:'#7b479e',stroke:'none'}):
    shape('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,
     fill:'none',stroke:missing===v?'#7b479e':'#9b7cab',
     'stroke-width':missing===v?2.5:1.5,
     'stroke-dasharray':'2 6','stroke-linecap':'round'});
   e.setAttribute('data-visibility','undetermined');
   e.setAttribute('data-ray-evidence',edge.rayEvidenceStatus);
   e.setAttribute('data-proof-scope','M5-original-convex-source-only');
   e.setAttribute('data-official-v5','false');
   e.setAttribute('data-source-edge',edge.sourceEdgeId);
   const title=shape('title');
   title.textContent=edge.sourceEdgeId+' '+v+'：'+edge.rayEvidenceStatus+
    '（仅原始实体射线证据，标准虚实线未认证）';
   e.append(title);
   svg.append(e);
  }
  drawScopedHullIntervals(svg,certified,result,v);
 }
}
function solve(){
 $('paper').replaceChildren();
 $('proof').textContent='未生成标准工程线型或 V5 作图。';
 try{
  if(!$('confirmed').checked)throw new Error('请先人工核对原题和长方体拓扑');
  const pair=$('pair').value,lines=$('vertices').value.trim().split(/\r?\n/);
  if(lines.length!==8)throw new Error('请提供恰好八个原题对应角点');
  const rows=lines.map(parseRow);
  if(new Set(rows.map(x=>x.id)).size!==8)throw new Error('角点编号重复');
  const knownViews=[...pair];
  const vertices=rows.map(({id,n})=>({id,
   knownViews:Object.fromEntries(knownViews.map((v,i)=>
    [v,[n[i*2],n[i*2+1]]]))}));
  const certified=compileReviewedSolidVertexV5({input:{
   geometryId:'ReviewedSolid',confirmedBy:'user',topologyConfirmed:true,
   revision,unit:'mm',vertices,edges:template.data.edges,faces:template.data.faces
  },sheetTransform:SHEET});
  current=certified;
  const result=certified.sceneResult;
  draw(result,certified);
  for(const id of ['pointV5Play','pointV5Pause','pointV5Prev','pointV5Next'])
   $(id).disabled=false;
  repaintPointV5();
  $('status').textContent='已计算 '+result.provenVertexCount+' 个点、'+
   result.provenEdgeCount+' 条棱与 '+result.provenFaceCount+' 个面的三视图；第三视图为 '+
   result.missingView+'。虚实线仍未认证。';
  $('status').dataset.status='ready';
  $('proof').textContent='证明：03 线性约束逐点唯一求解 + M0 闭合凸网格检查 + 统一 Geometry Scene 第一角法投影。\n'+
   '证据修订：'+result.revision+'；凸网格证明：'+result.convexProof.status+
   '；最大残差（mm）：'+Math.max(...result.individual.map(v=>v.maxResidualMm))+
   '。\n顶点证明：'+certified.vertexConstructionCount+' 个角点已逐点通过正式 ConstructionIntent → DAG → 唯一 V5。'+
   '\nM5 完整原始棱线射线：全棱无遮挡 '+certified.wholeSourceEdgeRayEvidence.positiveWholeVisibleRayCount+
   ' 段、整段实体前方遮挡 '+certified.wholeSourceEdgeRayEvidence.provenWholeOccludedCount+
   ' 段、投影积聚 '+certified.wholeSourceEdgeRayEvidence.collapsedCount+
   ' 段、其余未判定 '+certified.wholeSourceEdgeRayEvidence.undeterminedCount+
   ' 段。\nM5 原始相邻面折棱：真实单体几何折棱 '+
   certified.wholeSourceEdgeRayEvidence.sourceCreaseEvidence.certifiedSingleSolidCreaseCount+
   ' 条、仅为共面网格分割 '+
   certified.wholeSourceEdgeRayEvidence.sourceCreaseEvidence.provenCoplanarSubdivisionCount+
   ' 条（不作为实体特征边）；多实体并集外露语义仍未证明。'+
   '\\n仅呈现真实折棱的来源绑定候选 '+certified.scopedEdgePreviews.filter(e=>e.renderedAsPhysicalSourceCandidate).length+
   ' 个视图分段；共面网格分割不作为物理棱线，全部保持非正式虚实线。'+
   '\\nM5 单个闭合凸实体完整纸面几何边界：'+
   (certified.convexContourSourceCoverage.completeProjectedConvexBoundaryGeometryVerified?
    'V/H/W 凸包完整、来源折棱覆盖 '+certified.convexContourSourceCoverage.boundarySideCount+
    ' 条侧边、'+certified.convexContourSourceCoverage.boundaryAtomicIntervalCount+
    ' 个原始 3D 折棱来源子区间':'证据范围未覆盖')+
   '。蓝色点线仅表示已证明的单体二维轮廓来源覆盖；空间最终来源唯一性、全部端点连接、标准虚实线、实体棱线 V5 均未认证。'+
   '\\nM5 完整轮廓投影端点：三维真实来源关联 '+certified.contourPhysicalJunctionIncidence.inspectedContourIntervalEndpointCount+
   ' 次；同一纸面端点含不同深度来源 '+certified.contourPhysicalJunctionIncidence.depthAliasedPaperJunctionCount+
   ' 处。物理接点候选不是正式工程线型/逐线 V5 资格。'+
   '\\nM5 连续观察方向深度：核验全轮廓子区间 '+certified.continuousFrontmostSourceRays.auditedIntervalCount+
   ' 个，其中已列来源严格最前且整段射线无阻挡 '+certified.continuousFrontmostSourceRays.independentlyClearLeadingSourceIntervalCount+
   ' 个，深度平齐/换序未定 '+certified.continuousFrontmostSourceRays.ambiguousDepthIntervalCount+
   ' 个。任何局部无遮挡都不自动生成工程标准实线或 V5 实体绘图。'+
   '\n原始三维顶点与投影切分端点已逐一匹配 '+
   certified.wholeSourceEdgeRayEvidence.sourceVertexIncidenceEvidence.exactSourceIncidenceCount+
   ' 组，其中具备独立点射线证据 '+
   certified.wholeSourceEdgeRayEvidence.sourceVertexIncidenceEvidence.positiveOriginalRayCount+
   ' 组，唯一投影局部候选 '+
   certified.wholeSourceEdgeRayEvidence.sourceVertexIncidenceEvidence.unambiguousProjectedCandidateCount+
   ' 组。注意：接合/轮廓/标准实虚线均未认证，完整实体 V5=false；不是原书标准答案。';
 }catch(e){
  $('status').textContent='拒绝输出：'+e.message;
  $('status').dataset.status='blocked';
 }
}
$('pair').addEventListener('change',()=>{
 // Existing text is never silently overwritten by generated sample coordinates.
 clear();syncFormat();
 $('status').textContent='已切换视图组合；请核对并填写新组合的四列坐标。';
});
$('vertices').addEventListener('input',clear);
$('confirmed').addEventListener('change',()=>{
 resetV5();
 revision++;$('paper').replaceChildren();
 $('status').textContent='人工确认状态改变；旧投影已失效，请重新计算。';
 $('status').dataset.status='idle';
});
$('pointV5Play').addEventListener('click',startV5);
$('pointV5Pause').addEventListener('click',()=>{stop();repaintPointV5();});
$('pointV5Prev').addEventListener('click',()=>navigateV5(-1));
$('pointV5Next').addEventListener('click',()=>navigateV5(1));
$('pointV5Speed').addEventListener('change',()=>{
 if(!current||!current.player.canRender(revision))return;
 current.player.setSpeed(Number($('pointV5Speed').value),performance.now());
 repaintPointV5();
});
$('solve').addEventListener('click',solve);
$('vertices').value=rowSample('VH');
syncFormat();
