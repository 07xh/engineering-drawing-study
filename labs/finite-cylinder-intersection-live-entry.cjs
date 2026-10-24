'use strict';
/* Reviewed finite perpendicular-cylinder M3 + canonical source-guide/point V5 UI.
 * The purple analytic line is an explicitly UNCERTIFIED geometry preview.
 * Never repackage it as a standard solid/dashed V5 stroke or a textbook key.
 */
const {compileFiniteCylinderEndpointV5}=
 require('../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {project,toSheet}=require('../core/projection/conventions.js');
const {buildC3WIntervalPreview}=require('../workbench/c3-w-ray-preview.cjs');
const {auditC3LocalBooleanCreases}=
 require('../workbench/c3-local-boolean-crease.cjs');
const {buildC3VHProjectionDedup,evaluateC3VHProjectedSpan}=
 require('../workbench/c3-vh-projection-dedup.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');
const {buildC3LinkedGeometryScene}=
 require('../workbench/c3-linked-geometry-scene.cjs');
const {compileGeometryScene}=
 require('../project/geometry-scene-consumer.cjs');
const NS='http://www.w3.org/2000/svg',VIEWS=['V','H','W'];
const $=id=>document.getElementById(id);
const fieldIds=['zRadius','zX','zY','zMin','zMax',
 'yRadius','yX','yZ','yMin','yMax'];
const controls=['play','pause','prev','next'];
let revision=1,current=null,raf=null,playing=false;
let transforms=null,linkedScene=null,selectedGeometryIds=new Set();
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
 transforms=null;linkedScene=null;selectedGeometryIds=new Set();
 $('spatialBoard').replaceChildren();
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
function selectLinkedGeometry(ids){
 const items=Array.isArray(ids)?ids:[ids];
 if(!linkedScene||items.length===0||items.some(id=>
    !linkedScene.groups.some(g=>g.geometryId===id)))return;
 // V/H arcs can overlap from several DISTINCT true 3D branches.
 // Highlight all owners without falsely picking a unique 3D source.
 selectedGeometryIds=new Set(items);
 renderVerifiedV5Actions();
 renderLinkedSpatial();
}
function renderLinkedSpatial(){
 const svg=$('spatialBoard');svg.replaceChildren();
 svg.append(node('rect',{x:0,y:0,width:500,height:220,fill:'#f8fbff'}));
 if(!linkedScene||!current||!current.player.canRender(revision))return;
 const scene=compileGeometryScene(linkedScene.scene,{
  camera:{yaw:Number($('c3-yaw').value),
   pitch:Number($('c3-pitch').value)}});
 for(const item of scene.spatial){
  const picked=selectedGeometryIds.has(item.objectId);
  const element=node(item.kind==='line'?'line':
   item.kind==='path'?'path':'circle',{
    ...item.attrs,
    fill:item.kind==='circle'?(picked?'#ef6730':'#286da0'):'none',
    stroke:picked?'#ef6730':item.kind==='circle'?'#286da0':'#43886a',
    'stroke-width':picked?3.5:2.2,
    ...(item.kind==='line'||item.kind==='path'?{'stroke-dasharray':'4 6'}:{}),
    'data-geometry-id':item.objectId,
    'data-view':'3D','data-official-engineering-line':'false',
    role:'button',tabindex:0,
    'aria-label':'选中 '+item.objectId+' 的三维辅助几何'
   });
  element.addEventListener('click',()=>selectLinkedGeometry(item.objectId));
  element.addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();
    selectLinkedGeometry(item.objectId);}
  });
  svg.append(element);
 }
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
      !['point','circle','arc','analytic-curve','line'].includes(action.kind))continue;
   const originalGuide=action.kind==='circle';
   const analyticArc=action.kind==='arc';
   const WGuide=action.kind==='analytic-curve';
   const capGuide=current.capFacePairGuides.find(g=>g.actionId===action.id);
   if(capGuide&&(!capGuide.sourceExactCapFacePairMathVerified||
      capGuide.officialStandardLineStyleVerified!==false||
      !['point','line'].includes(action.kind)))
    throw new RangeError('unverified finite cap-face source line cannot render');
   const WProof=WGuide?current.wAnalyticCurveGuides.find(g=>
    g.id+'Shape'===action.id):null;
   if(WGuide&&(!WProof||!WProof.m5SourcePartitioned||
      WProof.officialStandardLineStyleVerified!==false))
    throw new RangeError('W V5 curve lacks current independently proven M5 partition');
   const shape=node(action.kind==='line'?'line':
    analyticArc||WGuide?'path':'circle',{
    fill:action.kind==='point'?
     (capGuide?'#608969':'#12649b'):'none',
    stroke:capGuide?'#608969':
     WGuide?(WProof.m5OpenInteriorRayStatus==='clear'?'#167f8b':
     WProof.m5OpenInteriorRayStatus==='occluded'?'#cb802f':'#8561b2'):
     analyticArc?'#a064b5':
     originalGuide?'#638bb0':'#12649b',
    'stroke-width':capGuide?2:WGuide?2.6:analyticArc?2.3:originalGuide?1.8:2,
    ...(capGuide&&action.kind==='line'?{'stroke-dasharray':'5 6'}:
      analyticArc||WGuide?{'stroke-dasharray':'3 7'}:{}),
    'data-source-v5-action':action.id,
    'data-certified-scope':capGuide?'cap-face-pair-geometry-only-not-official':
     WGuide?
     'M3-source-M5-open-ray-evidence-not-official-line-style':
     analyticArc?'exact-analytic-VH-projection-arc-not-official':
     originalGuide?'reviewed-original-source-circle-only':
      'analytic-point-only',
    'data-official-line-style':'false',
    ...(capGuide?{'data-cap-pair-id':capGuide.sourceFeatureId,
      'data-cap-projection-collapsed':capGuide.sourceProjectionCollapsedToPoint}:{}),
    ...(WGuide?{'data-M5-open-ray-status':WProof.m5OpenInteriorRayStatus,
      'data-open-interval-only':'true'}:{})});
   const matches=(linkedScene?.groups||[]).filter(g=>
    Object.values(g.v5ActionIds).some(v=>
     Array.isArray(v)?v.includes(action.id):v===action.id));
   if(matches.length){
    const ids=matches.map(g=>g.geometryId);
    const picked=ids.some(id=>selectedGeometryIds.has(id));
    const view=Object.entries(matches[0].v5ActionIds)
     .find(([,value])=>Array.isArray(value)?
      value.includes(action.id):value===action.id)?.[0];
    if(matches.length===1)shape.setAttribute('data-geometry-id',ids[0]);
    shape.setAttribute('data-geometry-ids',ids.join(','));
    shape.setAttribute('data-view',view||'');
    shape.setAttribute('data-projection-source-nonunique',
     String(matches.length>1));
    shape.setAttribute('role','button');
    shape.setAttribute('tabindex','0');
    shape.setAttribute('aria-label',matches.length>1?
     '选择所有对应的真实空间解析曲线（纸面重合）':
     '选中 '+ids[0]+' 的三视图辅助作图');
    if(picked){
     shape.setAttribute('stroke','#ef6730');
     shape.setAttribute('stroke-width','3.5');
     if(action.kind==='point')shape.setAttribute('fill','#ef6730');
    }
    shape.addEventListener('click',()=>selectLinkedGeometry(ids));
    shape.addEventListener('keydown',e=>{
     if(e.key==='Enter'||e.key===' '){e.preventDefault();
      selectLinkedGeometry(ids);}
    });
   }
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
 stop();current=null;linkedScene=null;selectedGeometryIds=new Set();
 disable(true);$('board').replaceChildren();
 $('spatialBoard').replaceChildren();
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
   includeWAnalyticCurveGuides:true,wRayPartitionedV5:true,
   includeCapFacePairGuides:true});
  const wRayProof=buildC3WIntervalPreview({input,revision});
  const vhDedup=buildC3VHProjectionDedup({input,revision});
  const linked=buildC3LinkedGeometryScene({input,revision,
   compiled:computed,viewTransforms:transforms});
  const solidOperation=$('solidOperation').value||null;
  const localCrease=auditC3LocalBooleanCreases({input,revision,solidOperation});
  drawScaffold();
  drawAnalyticPreview(computed,input,wRayProof,vhDedup);
  current=computed;linkedScene=linked;
  renderLinkedSpatial();
  disable(false);
  renderVerifiedV5Actions();
  const p=computed.sourceM3;
  $('proof').textContent='同一 M3 解析分支：'+p.branchCount+
   ' 条；数学残差上界：'+p.maxScaledResidual+
   '。\n有限端盖裁剪：'+p.verifiedCapClipping+
   '；正式 V5 端点动作：'+computed.signedEndpointPointActionCount+
   '；原始圆形辅助 V5：'+computed.provenOriginalSourceCircleV5ActionCount+
   '；真实解析 V/H 圆弧 V5：'+computed.provenAnalyticVHArcV5ActionCount+
   '；W 视图解析曲线逐段 V5：'+computed.trueAnalyticWCurveV5GuideCount+
   '（无遮挡 '+computed.m5RayCertifiedClearGuideCount+
   ' / 有遮挡 '+computed.m5RayCertifiedOccludedGuideCount+'）'+
   '；端盖交线辅助 V5：'+computed.sourceCapFaceProjectionActionCount+
   '（退化为真实投影点 '+computed.sourceCapFaceCollapsedProjectionPointCount+'）'+
   '；内部辅助点动作：'+computed.signedInteriorAuxiliaryPointActionCount+
   '；共享三维辅助对象 '+linked.spatialObjectCount+
   ' 个，V/H/W 与 3D 共享来源，未认证曲线没有伪造折线。'+
   '；本次 V/H/W 第一角纸面坐标各自映射。'+
   '\\n目标实体布尔运算：'+(solidOperation==='intersection'?'交集':
      solidOperation==='union'?'并集':'未指定')+
   '；局部空间交线边界证明：'+localCrease.status+
   '，正规开区间 '+localCrease.regularLocalCreaseCount+
   '/'+localCrease.sourceEdgeCount+
   '；仅代表局部保留面片，全部端点、完整实体轮廓和国标线型仍未认证。'+
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
  current=null;linkedScene=null;selectedGeometryId=null;
  disable(true);$('board').replaceChildren();
  $('spatialBoard').replaceChildren();
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
 $('solidOperation').addEventListener('change',()=>
  invalidate('目标实体运算变化：旧数学保留关系和 V5 已作废，请重新人工确认。',true));
 $('solve').addEventListener('click',solve);
 $('play').addEventListener('click',start);
 $('pause').addEventListener('click',()=>{stop();renderVerifiedV5Actions();});
 $('prev').addEventListener('click',()=>navigate(-1));
 $('next').addEventListener('click',()=>navigate(1));
 for(const id of ['c3-yaw','c3-pitch'])
  $(id).addEventListener('input',renderLinkedSpatial);
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
