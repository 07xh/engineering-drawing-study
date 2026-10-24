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
function draw(result){
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
  for(const edge of data.edges){
   const from=paperPoints[edge.fromId],to=paperPoints[edge.toId];
   if(!from||!to)throw new Error('缺少投影棱的顶点');
   const e=edge.projection.kind==='point'?
    shape('circle',{cx:from.x,cy:from.y,r:3.5,fill:'#7b479e',stroke:'none'}):
    shape('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,
     fill:'none',stroke:missing===v?'#7b479e':'#9b7cab',
     'stroke-width':missing===v?2.5:1.5,
     'stroke-dasharray':'2 6','stroke-linecap':'round'});
   e.setAttribute('data-visibility','undetermined');
   e.setAttribute('data-official-v5','false');
   e.setAttribute('data-source-edge',edge.fromId+'-'+edge.toId);
   svg.append(e);
  }
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
  draw(result);
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
   ' 段。注意：接合/轮廓/标准实虚线均未认证，完整实体 V5=false；不是原书标准答案。';
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
