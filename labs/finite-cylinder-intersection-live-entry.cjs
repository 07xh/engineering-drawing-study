'use strict';
/* Reviewed finite perpendicular-cylinder M3 + canonical source-guide/point V5 UI.
 * The purple analytic line is an explicitly UNCERTIFIED geometry preview.
 * Never repackage it as a standard solid/dashed V5 stroke or a textbook key.
 */
const {compileFiniteCylinderEndpointV5}=
 require('../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {project,toSheet}=require('../core/projection/conventions.js');
const {buildC3WIntervalPreview}=require('../workbench/c3-w-ray-preview.cjs');
const {buildC3VHProjectionDedup,evaluateC3VHProjectedSpan}=
 require('../workbench/c3-vh-projection-dedup.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');
const NS='http://www.w3.org/2000/svg',VIEWS=['V','H','W'];
const $=id=>document.getElementById(id);
const fieldIds=['zRadius','zX','zY','zMin','zMax',
 'yRadius','yX','yZ','yMin','yMax'];
const controls=['play','pause','prev','next'];
let revision=1,current=null,raf=null,playing=false;
let transforms=null;
function now(){return performance.now();}
function node(tag,attributes={}){
 const element=document.createElementNS(NS,tag);
 for(const [name,value] of Object.entries(attributes))
  element.setAttribute(name,String(value));
 return element;
}
function showMessage(message,error=false){
 $('status').textContent=message;$('status').dataset.error=error?'true':'false';
}
function stop(){
 if(raf!==null){cancelAnimationFrame(raf);raf=null;}
 playing=false;
 if(current)current.player.pause(now());
}
function disable(disabled){
 for(const id of controls)$(id).disabled=disabled;
}
function invalidate(reason,resetConfirmation=false){
 stop();
 if(current){current.player.invalidate(revision+1,now());current=null;}
 revision++;
 transforms=null;
 if(resetConfirmation)$('confirmed').checked=false;
 $('board').replaceChildren();
 $('proof').textContent='条件已变化，旧数学与 V5 绘制资格已撤销。';
 disable(true);
 showMessage(reason||'条件变化，请核对后重新计算。');
}
function readInput(){
 const f={};
 for(const id of fieldIds){
  const el=$(id);
  if(!el.value.trim()||!Number.isFinite(el.valueAsNumber))
   throw new TypeError('输入 '+id+' 不是有效数字');
  f[id]=el.valueAsNumber;
 }
 if(!$('confirmed').checked)
  throw new TypeError('须先确认原题中的两个有限圆柱、轴向、毫米和端盖');
 return {kind:'finite-orthogonal-cylinder-intersection',
  sourceConfirmed:true,unit:'mm',
  zCylinder:{radius:f.zRadius,xCenter:f.zX,yCenter:f.zY,
   zMin:f.zMin,zMax:f.zMax},
  yCylinder:{radius:f.yRadius,xCenter:f.yX,zCenter:f.yZ,
   yMin:f.yMin,yMax:f.yMax}};
}
function paperTransforms(input){
 const Z=input.zCylinder,Y=input.yCylinder;
 const range=Math.max(1,
  Math.abs(Z.xCenter)+Z.radius,Math.abs(Y.xCenter)+Y.radius,
  Math.abs(Z.yCenter)+Z.radius,Math.abs(Y.yMin),Math.abs(Y.yMax),
  Math.abs(Y.zCenter)+Y.radius,Math.abs(Z.zMin),Math.abs(Z.zMax));
 const scale=Math.min(4,120/range);
 return {V:{origin:{x:310,y:265},scale},
  H:{origin:{x:310,y:410},scale},
  W:{origin:{x:655,y:265},scale}};
}
function drawScaffold(){
 const svg=$('board');svg.replaceChildren();
 svg.append(node('rect',{x:0,y:0,width:960,height:680,fill:'#fff'}));
 for(const [view,x,y] of [['V',100,35],['H',100,374],['W',570,35]]){
  const label=node('text',{x,y,fill:'#426080','font-size':19});
  label.textContent=view+' · 第一角法';svg.append(label);
 }
 const guide=[['line',{x1:60,y1:340,x2:880,y2:340}],
  ['line',{x1:485,y1:24,x2:485,y2:610}]];
 for(const [tag,props] of guide)
  svg.append(node(tag,{...props,stroke:'#bdd0e1','stroke-width':1.4,
   'stroke-dasharray':'6 5'}));
}
function pointAt(branch,input,x){
 const Z=input.zCylinder,Y=input.yCylinder;
 const y2=(Z.radius-Math.abs(x-Z.xCenter))*
  (Z.radius+Math.abs(x-Z.xCenter));
 const z2=(Y.radius-Math.abs(x-Y.xCenter))*
  (Y.radius+Math.abs(x-Y.xCenter));
 if(y2< -1e-8||z2< -1e-8)
  throw new RangeError('解析曲线预览越过真实径向支撑');
 const p={x,y:Z.yCenter+branch.signY*Math.sqrt(Math.max(0,y2)),
  z:Y.zCenter+branch.signZ*Math.sqrt(Math.max(0,z2))};
 const scale=Math.max(1,Z.radius**2,Y.radius**2);
 const residual=Math.max(Math.abs((p.x-Z.xCenter)**2+
  (p.y-Z.yCenter)**2-Z.radius**2),
  Math.abs((p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2-Y.radius**2))/scale;
 const axialTol=1e-8*Math.max(1,Z.radius,Y.radius);
 if(!Object.values(p).every(Number.isFinite)||residual>1e-8||
  p.y<Y.yMin-axialTol||p.y>Y.yMax+axialTol||
  p.z<Z.zMin-axialTol||p.z>Z.zMax+axialTol)
  throw new RangeError('预览点未通过独立曲面和有限端盖核验');
 return p;
}
function drawAnalyticPreview(compiled,input,wRayProof,vhDedup){
 const svg=$('board'),group=node('g',{
  'data-intersection-preview':'uncertified',
  'aria-label':'解析曲线开区间与原始圆柱投影轮廓预览；非正式工程线型'});
 const branches=new Map(compiled.sourceM3.branches.map(b=>[b.id,b]));
 if(!wRayProof||wRayProof.revision!==revision||
    wRayProof.sourceM3BranchCount!==branches.size||
    wRayProof.v5CurveReady!==false||
    wRayProof.officialLineStylesVerified!==false)
  throw new RangeError('当前 C3 W 区间证明与 M3/V5 来源不一致');
 if(!vhDedup||vhDedup.revision!==revision||
    vhDedup.sourceBranchCount!==branches.size||
    vhDedup.status!=='scoped-projected-analytic-interval-deduplicated'||
    vhDedup.projectionOwnershipVerified!==true||
    vhDedup.officialLineStylesVerified!==false||
    vhDedup.v5CurveActionsAuthorized!==false)
  throw new RangeError('C3 V/H 投影重合证明与当前 M3 来源不一致');
 function drawSpan(view,sourceId,lo,hi,rayStatus,strictOpen,positionAt,extras={}){
  if(!(hi>lo))throw new RangeError('C3 显示参数必须严格递增');
  const positions=[],count=36;
  const epsilon=strictOpen?1e-5:0;
  for(let i=0;i<=count;i++){
   const t=epsilon+(1-2*epsilon)*i/count;
   const x=lo+(hi-lo)*t;
   positions.push(toSheet(view,positionAt(x),transforms[view]));
  }
  const d=positions.map((p,i)=>(i?'L ':'M ')+p.x+' '+p.y).join(' ');
  const stroke=rayStatus==='clear'?'#167f8b':
   rayStatus==='occluded'?'#cb802f':'#8561b2';
  group.append(node('path',{d,fill:'none',stroke,
   'stroke-width':2,'stroke-dasharray':'2 7',
   'data-standard-line-style':'unverified',
   'data-official-v5':'false',
   'data-open-ray-status':rayStatus,
   'data-open-ray-only':strictOpen?'true':'false',
   'data-source-branch':sourceId,'data-view':view,...extras}));
 }
 // Original V/H spatial seam sources lie exactly on one cylinder circle in
 // projection. Consume mathematically merged intervals once per source arc
 // rather than overpainting identical 2D curves from multiple 3D branches.
 for(const row of vhDedup.spans){
  drawSpan(row.view,row.id,row.xOpenRange[0],row.xOpenRange[1],
   'undetermined',false,x=>evaluateC3VHProjectedSpan(row,x),{
    'data-analytic-projection-deduplicated':'true',
    'data-source-branch-ids':row.sourceBranchIds.join(','),
    'data-original-contour-owner':row.sourceCylinder
   });
 }
 for(const row of wRayProof.intervals){
  const branch=branches.get(row.branchId);
  if(!branch||row.xOpenRange[0]<branch.xRange[0]||
     row.xOpenRange[1]>branch.xRange[1])
   throw new RangeError('W 预览片段不能超出当前 M3 解析分支');
  drawSpan('W',branch.id,row.xOpenRange[0],row.xOpenRange[1],
   row.openInteriorRayStatus,true,x=>project(pointAt(branch,input,x)).W);
 }
 svg.append(group);
}
function renderVerifiedV5Actions(){
 const svg=$('board');svg.querySelectorAll('[data-v5-point-layer]')
  .forEach(element=>element.remove());
 if(!current||!current.player.canRender(revision))return;
 const layer=node('g',{'data-v5-point-layer':'true',
  'aria-label':'已证明点的唯一 V5 播放层'});
 const frame=current.player.snapshot();
 for(const step of current.constructionSteps)
  for(const action of step.actions){
   const fraction=frame.actionFractions[action.id]||0;
   if(fraction<=0||
      !['point','circle','arc','analytic-curve'].includes(action.kind))continue;
   const originalGuide=action.kind==='circle';
   const analyticArc=action.kind==='arc';
   const WGuide=action.kind==='analytic-curve';
   const shape=node(analyticArc||WGuide?'path':'circle',{
    fill:action.kind==='point'?'#12649b':'none',
    stroke:WGuide?'#653d9c':analyticArc?'#a064b5':
     originalGuide?'#638bb0':'#12649b',
    'stroke-width':WGuide?2.6:analyticArc?2.3:originalGuide?1.8:2,
    ...(analyticArc||WGuide?{'stroke-dasharray':'3 7'}:{}),
    'data-source-v5-action':action.id,
    'data-certified-scope':WGuide?
     'exact-M3-W-source-screen-approximation-not-official':
     analyticArc?'exact-analytic-VH-projection-arc-not-official':
     originalGuide?'reviewed-original-source-circle-only':
      'analytic-point-only',
    'data-official-line-style':'false'});
   Motion.updateSvg(shape,action,fraction);
   layer.append(shape);
  }
 svg.append(layer);
 showMessage('已完成 '+frame.completedIds.length+
  '/'+current.timing.segments.length+
  ' 个已验证原始圆、V/H 圆弧、W 参数曲线辅助绘制及辅助点动作；国标实虚线仍未签收。');
}
function tick(time){
 raf=null;
 if(!playing||!current||!current.player.canRender(revision))return;
 const frame=current.player.snapshot(time);
 renderVerifiedV5Actions();
 if(frame.done){stop();return;}
 raf=requestAnimationFrame(tick);
}
function start(){
 if(!current||!current.player.canRender(revision)||playing)return;
 const time=now();
 if(current.player.snapshot(time).done)current.player.seekStep(0,time);
 current.player.play(time);playing=true;
 raf=requestAnimationFrame(tick);
}
function navigate(delta){
 if(!current||!current.player.canRender(revision))return;
 stop();
 const snap=current.player.snapshot(),length=current.constructionSteps.length;
 const currentIndex=snap.done?length:Math.max(0,snap.activeStepIndex);
 const index=Math.max(0,Math.min(length,currentIndex+delta));
 current.player.seekStep(index,now());
 renderVerifiedV5Actions();
}
function solve(){
 stop();current=null;disable(true);$('board').replaceChildren();
 try{
  const input=readInput();
  const count=Number($('stations').value);
  if(!Number.isSafeInteger(count)||count<0||count>2)
   throw new RangeError('辅助点数量无效');
  transforms=paperTransforms(input);
  const computed=compileFiniteCylinderEndpointV5({
   input,revision,stationCountPerBranch:count,
   sheetTransform:transforms.V,viewTransforms:transforms,
   includeSourceCircleGuides:true,includeProjectedSeamArcGuides:true,
   includeWAnalyticCurveGuides:true});
  const wRayProof=buildC3WIntervalPreview({input,revision});
  const vhDedup=buildC3VHProjectionDedup({input,revision});
  drawScaffold();
  drawAnalyticPreview(computed,input,wRayProof,vhDedup);
  current=computed;
  disable(false);
  renderVerifiedV5Actions();
  const p=computed.sourceM3;
  $('proof').textContent='同一 M3 解析分支：'+p.branchCount+
   ' 条；数学残差上界：'+p.maxScaledResidual+
   '。\n有限端盖裁剪：'+p.verifiedCapClipping+
   '；正式 V5 端点动作：'+computed.signedEndpointPointActionCount+
   '；原始圆形辅助 V5：'+computed.provenOriginalSourceCircleV5ActionCount+
   '；真实解析 V/H 圆弧 V5：'+computed.provenAnalyticVHArcV5ActionCount+
   '；W 视图解析曲线辅助 V5：'+computed.trueAnalyticWCurveV5GuideCount+
   '；内部辅助点动作：'+computed.signedInteriorAuxiliaryPointActionCount+
   '；本次 V/H/W 第一角纸面坐标各自映射。'+
   '\\nV/H 解析投影：去重后 V='+vhDedup.visibleUniqueVSpanCount+
   ' 段、H='+vhDedup.visibleUniqueHSpanCount+
   ' 段；与原始圆柱轮廓重合，不代表独立认证的相贯线。'+
   '\\nW 视图开区间：前方无遮挡 '+wRayProof.certifiedClearCount+
   ' 段、实体前方遮挡 '+wRayProof.certifiedOccludedCount+
   ' 段、未判定 '+wRayProof.undeterminedCount+
   ' 段。已枚举圆柱轮廓/端盖的投影交汇 '+wRayProof.sourceOutlineEventCount+
   ' 个，开区间分段校验='+wRayProof.projectedSourceOutlineEventsSeparatedAtWBoundaries+
   '；临界端点不继承正式线型。'+
   '\n正向限制：完整曲线接合及全实体端盖拓扑未签收；'+
   '所有曲线预览均不代表标准工程实/虚线，正式连续曲线 V5='+computed.entireCurveV5Ready+'。';
 }catch(e){
  current=null;disable(true);$('board').replaceChildren();
  $('proof').textContent='没有发布任何未经证明的点或曲线。';
  showMessage('数学审核阻断：'+(e?.message||'未知异常'),true);
 }
}
function init(){
 for(const id of fieldIds)$(id).addEventListener('input',()=>
  invalidate('尺寸变化：旧结果作废，需要重新核对。',true));
 $('confirmed').addEventListener('change',()=>
  invalidate('确认状态变化：旧结果作废。'));
 $('stations').addEventListener('change',()=>
  invalidate('辅助求点数量变化：旧 V5 已失效。'));
 $('solve').addEventListener('click',solve);
 $('play').addEventListener('click',start);
 $('pause').addEventListener('click',()=>{stop();renderVerifiedV5Actions();});
 $('prev').addEventListener('click',()=>navigate(-1));
 $('next').addEventListener('click',()=>navigate(1));
 $('speed').addEventListener('change',()=>{
  if(!current||!current.player.canRender(revision))return;
  current.player.setSpeed(Number($('speed').value),now());
  renderVerifiedV5Actions();
 });
 window.addEventListener('pagehide',stop);
 disable(true);
}
if(document.readyState==='loading')
 document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
