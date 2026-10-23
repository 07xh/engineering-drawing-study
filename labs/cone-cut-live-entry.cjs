'use strict';
/**
 * Public, strictly local cone math preview. Reuses #437's ONE source-confirmed
 * M3 -> ConstructionStep -> spatial V5 composed plan / existing V5 Motion.
 * No mock geometry, OCR, remote provider, second player or proof promotion.
 */
const {coneSpatialV5Preview}=
 require('../workbench/cone-spatial-v5-preview.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');
const {curvePaths}=require('../workbench/v51-curve-paths.cjs');
const {knownConeOutlines}=require('../workbench/v51-known-cone-outlines.cjs');
const {coneSpatialProjectionFocus}=
 require('../workbench/cone-spatial-projection-focus.cjs');
const {coneSolidFaceRayEvidence}=
 require('../workbench/cone-solid-face-ray-evidence.cjs');
const {createLocalPhotoReference}=
 require('../recognition/local-photo-reference.cjs');
const {detectBrowserDimensionCandidates}=
 require('../recognition/browser-native-dimension-ocr.cjs');
const {reviewConeBaseRadiusCandidate}=
 require('../recognition/reviewed-cone-image-radius.cjs');
const {coneLinkedSpatialScene}=
 require('../workbench/cone-linked-spatial-view.cjs');
(function(){
 const $=id=>document.getElementById(id);
 const SVG='http://www.w3.org/2000/svg';
 const numeric=['coneRadius','coneHeight','conePx','conePy','conePz',
  'coneNx','coneNy','coneNz'];
 const config=['coneKind','coneSamples','coneKept'];
 const defaults={coneRadius:'5',coneHeight:'10',conePx:'0',conePy:'0',
  conePz:'6',coneNx:'1',coneNy:'0',coneNz:'3',coneKind:'full-ellipse',
  coneSamples:'64',coneKept:''};
 let revision=0,plan=null,player=null,raf=null,selected=null,selectedSpatial=null,faceEvidence=null,orbitGesture=null;
 const reference=createLocalPhotoReference();
 let ocrSequence=0,ocrCandidates=[],reviewedRadius=null;
 const now=()=>performance.now();
 const create=(tag,attrs={})=>{
  const el=document.createElementNS(SVG,tag);
  for(const [key,val] of Object.entries(attrs))el.setAttribute(key,String(val));
  return el;
 };
 function status(s,error=false){
  $('coneStatus').textContent=s;
  $('coneStatus').dataset.error=error?'true':'false';
 }
 function stop(){
  if(raf!==null)cancelAnimationFrame(raf);
  raf=null;
  if(player&&player.canRender(revision))player.pause(now());
  $('conePlay').textContent='▶ 播放';
 }
 function freezeBeforeTap(event){
  // V5 DOM nodes are rebuilt during playback. Pause on pointerdown so the
  // same hit target survives until Android emits click/pointerup.
  if(event.isPrimary!==false&&player&&player.canRender(revision))stop();
 }
 function beginOrbit(event){
  if(!plan||!plan.stillCurrent(revision)||
     (event.pointerType!=='touch'&&event.pointerType!=='pen')||
     event.target.closest?.('[data-cone-3d-point],[data-cone-3d-segment-hit]'))
   return;
  orbitGesture={id:event.pointerId,x:event.clientX,
   azimuth:Number($('coneOrbit').value)};
  $('cone3dSvg').setPointerCapture?.(event.pointerId);
 }
 function moveOrbit(event){
  if(!orbitGesture||event.pointerId!==orbitGesture.id||!plan)return;
  const delta=event.clientX-orbitGesture.x;
  if(Math.abs(delta)<2)return;
  const az=Math.max(-180,Math.min(180,
   orbitGesture.azimuth+delta*0.7));
  $('coneOrbit').value=String(az);
  paint();
 }
 function endOrbit(event){
  if(orbitGesture&&event.pointerId===orbitGesture.id){
   orbitGesture=null;
   if($('cone3dSvg').hasPointerCapture?.(event.pointerId))
    $('cone3dSvg').releasePointerCapture(event.pointerId);
  }
 }
 function disable(disabled){
  for(const id of ['coneBack','conePlay','coneForward','coneSeek'])
   $(id).disabled=disabled;
 }
 function clear(){
  $('coneDraw').replaceChildren();
  $('cone3dDraw').replaceChildren();
  $('cone3dStatus').textContent='尚未确认空间几何条件。';
  faceEvidence=null;
  selectedSpatial=null;
  $('coneSteps').replaceChildren();
  $('coneSvg').setAttribute('viewBox','0 0 960 680');
  $('coneSeek').value='0';
  $('conePercent').textContent='0%';
  $('coneStepLabel').textContent='尚未生成。';
  $('conePicked').textContent='条件或步骤已改变，之前选中的图元不再有效。';
  $('coneProof').textContent='不包含教材原图、答案和 AI 识图；请确认新条件后重新验证。';
  $('conePlay').textContent='▶ 播放';
 }
 function invalidate(resetConfirm=true){
  stop();
  revision++;
  if(player&&!player.canRender(revision)&&player.canRender(revision-1))
   player.invalidate(revision,now());
  plan=null;player=null;selected=null;
  if(resetConfirm)$('coneConfirm').checked=false;
  clear();disable(true);
  status('条件已改变，旧解和动画已作废。请重新确认输入并求解。',true);
 }
 function resetOcr(ready=false){
  ++ocrSequence;ocrCandidates=[];reviewedRadius=null;
  const selector=$('coneOcrCandidate');selector.replaceChildren();
  const option=document.createElement('option');
  option.value='';option.textContent='尚无已核对尺寸候选';selector.append(option);
  selector.disabled=true;
  $('coneOcrRun').disabled=!ready;
  $('coneOcrApply').disabled=true;
  $('coneOcrReviewedValue').disabled=true;
  $('coneOcrReviewedValue').value='';
  for(const id of ['coneOcrUnits','coneOcrLink','coneOcrAccept'])
   $(id).checked=false;
  $('coneOcrAnswers').value='unknown';
  $('coneOcrStatus').textContent=ready?
   '本机 OCR 仅提供文字候选；需人工确认单位、底圆归属和数值。':
   '请先载入本地原题；图片及 OCR 均不构成独立解题证据。';
 }
 function resetCandidateAcceptance(){
  reviewedRadius=null;
  $('coneOcrAccept').checked=false;
 }
 async function runNativeOcr(){
  const proof=reference.snapshot();
  if(!proof.ready){$('coneOcrStatus').textContent='先载入并解码原题图片。';return;}
  resetOcr(true);
  const sequence=ocrSequence,epoch=proof.epoch;
  $('coneOcrRun').disabled=true;
  $('coneOcrStatus').textContent='正在本地执行浏览器原生 TextDetector；不上传原图。';
  let output;
  try{output=await detectBrowserDimensionCandidates($('coneSourcePreview'));}
  catch(error){output={status:'error',candidates:[],reason:String(error.message||error)};}
  if(sequence!==ocrSequence||!reference.snapshot().ready||
     epoch!==reference.snapshot().epoch)return;
  $('coneOcrRun').disabled=false;
  if(output.status!=='ok'){
   $('coneOcrStatus').textContent='无法获取本机 OCR：'+
    String(output.reason||output.status)+'。请手动填写，不会生成猜测尺寸。';
   return;
  }
  // Existing OCR is a candidate extractor, not image-to-geometry proof.
  ocrCandidates=output.candidates.slice(0,150);
  const selector=$('coneOcrCandidate');selector.replaceChildren();
  const placeholder=document.createElement('option');
  placeholder.value='';placeholder.textContent='请选择需要复核的 R/Φ 文字';
  selector.append(placeholder);
  for(const candidate of ocrCandidates){
   const option=document.createElement('option');
   option.value=candidate.id;
   option.textContent=candidate.sourceText+' · '+
    (candidate.dimensionKind==='diameter'?'直径':'半径')+
    '（未经核对）';
   selector.append(option);
  }
  selector.disabled=ocrCandidates.length===0;
  $('coneOcrStatus').textContent=ocrCandidates.length?
   '找到 '+ocrCandidates.length+' 条候选。请看原图确认它是否真的指向圆锥底圆；不会自动计算。':
   '未检测到支持的 R/Φ 尺寸。请手动填写，不代表原图无尺寸。';
 }
 function ocrCandidateChanged(){
  resetCandidateAcceptance();
  const candidate=ocrCandidates.find(x=>x.id===$('coneOcrCandidate').value);
  $('coneOcrReviewedValue').disabled=!candidate;
  $('coneOcrReviewedValue').value=candidate?String(candidate.numericValue):'';
  $('coneOcrApply').disabled=!candidate;
  $('coneOcrUnits').checked=false;
  $('coneOcrLink').checked=false;
  $('coneOcrStatus').textContent=candidate?
   '请人工复核 OCR 文本 '+candidate.sourceText+
   '；直径要先除以 2，归属圆锥底圆必须由你确认。':
   '未选尺寸，不允许把 OCR 结果填写为数学条件。';
 }
 function applyReviewedRadius(){
  const candidate=ocrCandidates.find(x=>x.id===$('coneOcrCandidate').value);
  try{
   const info=reference.snapshot();
   if(!info.ready)throw new RangeError('本地参考图已更换或删除');
   const proposal=reviewConeBaseRadiusCandidate({
    candidate,image:info.dimensions,
    sourceEpoch:info.epoch,currentSourceEpoch:reference.snapshot().epoch,
    reviewedTextValueMm:$('coneOcrReviewedValue').valueAsNumber,
    unitsConfirmed:$('coneOcrUnits').checked,
    baseCircleLinkConfirmed:$('coneOcrLink').checked,
    userAccepted:$('coneOcrAccept').checked,
    answerMark:$('coneOcrAnswers').value
   });
   // Explicit user-triggered prefill only. The OLD source solution is stale;
   // never mark new conditions confirmed or trigger the existing M3/V5.
   invalidate(true);
   $('coneRadius').value=String(proposal.radiusMm);
   resetCandidateAcceptance();
   reviewedRadius=proposal;
   $('coneOcrStatus').textContent='已人工核对 '+proposal.sourceText+
    ' → 底圆半径 '+proposal.radiusMm+
    ' mm，仅填入可编辑条件。还需确认高度、截平面及最终数学输入。'+
    (proposal.sourceContainsMarkedAnswer?'原图含参考答案，绝不计入无答案盲测。':
     '原图答案隔离未经独立验证，暂不计入盲测。');
  }catch(error){
   $('coneOcrAccept').checked=false;
   $('coneOcrStatus').textContent='未采用 OCR 尺寸：'+
    String(error.message||error);
  }
 }
 function clearPhotoReference(clearInput=true){
  reference.clear();resetOcr(false);
  const img=$('coneSourcePreview');
  img.onload=null;img.onerror=null;
  img.removeAttribute('src');img.hidden=true;
  if(clearInput)$('coneSourceFile').value='';
  $('coneSourceClear').disabled=true;
  $('coneSourceStatus').textContent=
   '未选择图片。当前仍使用手动填写的模型毫米条件。';
 }
 function showRejectedSource(message){
  const img=$('coneSourcePreview');
  img.onload=null;img.onerror=null;
  img.removeAttribute('src');img.hidden=true;
  $('coneSourceClear').disabled=true;
  $('coneSourceFile').value='';
  $('coneSourceStatus').textContent=message+
   '；未从图片提取任何数学条件，也未生成原题答案。';
 }
 function imageFailed(ticket,message){
  if(!reference.rejectImage(ticket.epoch))return;
  showRejectedSource(message);
 }
 function sourceFileChanged(){
  // Loading another exercise invalidates the prior source/player, even if
  // the replacement is malformed. Never cache source bytes in the solver.
  const file=$('coneSourceFile').files?.[0];
  invalidate(true);
  clearPhotoReference(false);
  if(!file)return;
  let ticket;
  try{
   ticket=reference.attach(file,URL);
   $('coneSourceStatus').textContent='正在本地检查图片尺寸……';
   const img=$('coneSourcePreview');
   img.onload=()=>{
    try{
     if(!reference.confirmImage(ticket.epoch,
      img.naturalWidth,img.naturalHeight))return;
     img.hidden=false;
     $('coneSourceClear').disabled=false;
     resetOcr(true);
     $('coneSourceStatus').textContent=
      '本地参考图片已显示（'+img.naturalWidth+'×'+
      img.naturalHeight+'）。请人工填写圆锥与截平面条件；'+
      '本机可选 OCR 仅产生待审 R/Φ 文字候选；不能自动判定图元归属、解题或盲测通过。';
    }catch(error){
     // The reference session already rejected/revoked the unsafe blob.
     // Still update the UI: rejectImage() on this OLD epoch now returns false.
     showRejectedSource('图片尺寸不符合安全范围');
    }
   };
   img.onerror=()=>imageFailed(ticket,'无法解码选定图片');
   img.src=ticket.url;
  }catch(error){
   clearPhotoReference();
   $('coneSourceStatus').textContent='本地图片被拒绝：'+
    String(error.message||error);
  }
 }
 function number(id){
  const el=$(id);
  if(!el.value.trim()||!Number.isFinite(el.valueAsNumber))
   throw new TypeError(id+' 必须是有限数值');
  return el.valueAsNumber;
 }
 function solve(){
  stop();
  if(player&&player.canRender(revision))player.invalidate(revision+1,now());
  revision++;plan=null;player=null;selected=null;clear();disable(true);
  try{
   const confirmed=$('coneConfirm').checked;
   if(!confirmed){status('请先勾选确认条件。未确认时不输出任何已验证截线。',true);return;}
   const radiusMm=number('coneRadius'),heightMm=number('coneHeight');
   const cone={baseCenter:{x:0,y:0,z:0},radiusMm,heightMm,modelUnit:'mm'};
   const plane={point:{x:number('conePx'),y:number('conePy'),
      z:number('conePz')},
    normal:{x:number('coneNx'),y:number('coneNy'),z:number('coneNz')},
    modelUnit:'mm'};
   const kind=$('coneKind').value;
   const samples=Number($('coneSamples').value);
   const kept=$('coneKept').value;
   // Observer vectors are an explicit, restricted local coordinate choice.
   // A later arbitrary-camera UI cannot silently reuse these model axes.
   const evidence=kept?{
    retainedHalfspace:kept,
    observerDirections:{
     V:{x:0,y:-1,z:0},H:{x:0,y:0,z:1},W:{x:1,y:0,z:0}
    }
   }:{};
   const answer=coneSpatialV5Preview(cone,plane,{
    kind,samples,revision,sourceConfirmed:true,
    presentationMode:'split-sheet',provenGuideDag:true,...evidence
   });
   if(answer.status!=='preview-only'||
      answer.mathematicallyVerified!==true||
      answer.canonicalGuideDagConnected!==true||
      answer.canonicalGuideStepCount!==12||
      answer.spatialIntent?.source?.v5StepsReady!==false||
      answer.publicWorkbenchConnected!==false)
   {
    status('无法生成已验证的圆锥作图预览：'+
     (answer.reason||'数学证据不完整')+'。',true);return;
   }
   plan=answer;
   faceEvidence=kept?coneSolidFaceRayEvidence(answer.spatialIntent,{
    retainedHalfspace:kept}):null;
   player=answer.createPlayer({speed:Number($('coneSpeed').value)});
   disable(false);makeSteps();paint();
   const counts=answer.rayEvidence?.counts;
   const faceNote=faceEvidence?.status==='strict-face-interior-evidence'?
    ' 截切平面严格内部射线证据：'+
    ['V','H','W'].map(v=>v+'='+faceEvidence.views[v].cutFace.visibility).join('、')+
    '；切触、边缘、轮廓和完整遮挡尚未证明。':
    ' 截切平面严格内部射线可见性尚未认证。';
   const reviewNote=reviewedRadius&&
    reviewedRadius.imageEpoch===reference.snapshot().epoch&&
    Number($('coneRadius').value)===reviewedRadius.radiusMm?
    ' 底圆半径由本地 OCR 候选经人工核对填入；仅该字段具备候选来源，其余条件仍来自人工输入。'+
    (reviewedRadius.sourceContainsMarkedAnswer?
     '原图包含参考答案，禁止计入无答案盲测。':
     '答案隔离没有独立验证，禁止计入盲测。'):'';
   const referenceNote=reference.snapshot().sourceAttached?
    ' 本地原题图仅作为人工转录参照；未自动识图、无答案隔离证明或原题整题验收。':'';
   $('coneProof').textContent='数学源：有限直立圆锥解析'+
    (kind==='full-ellipse'?'完整椭圆':'裁剪椭圆与底面截弦')+
    '，已证实辅助母线 ConstructionStep '+answer.canonicalGuideStepCount+
    ' 步；同一 V5 共 '+answer.steps.length+' 步。'+
    (counts?'三视图开区间证据：可见 '+counts.visible+
      '、隐藏 '+counts.hidden+'、未确定 '+counts.undetermined+'。':
      '未确认保留材料侧：结果线型全部待审核。')+
    ' 线段为解析曲线的折线近似；端点、真实线型、图纸规范、照片识别和完整实体均尚未验收。'+
    faceNote+referenceNote+reviewNote;
   status('几何模型与单一 V5 动画已就绪。可逐笔播放、回退、调速和点选图元；不是完整国标工程制图答案。');
  }catch(error){
   plan=null;player=null;clear();disable(true);
   status('条件或几何求解被拒绝：'+String(error.message||error),true);
  }
 }
 function bounds(action){
  const g=action.geometry;
  if(action.kind==='line')
   return {minX:Math.min(g.from.x,g.to.x),maxX:Math.max(g.from.x,g.to.x),
    minY:Math.min(g.from.y,g.to.y),maxY:Math.max(g.from.y,g.to.y)};
  if(action.kind==='point')
   return {minX:g.center.x-6,maxX:g.center.x+6,
    minY:g.center.y-6,maxY:g.center.y+6};
  return null;
 }

 function focusSpatialSample(index){
  if(!plan||!player||!player.canRender(revision)||
     !plan.stillCurrent(revision))return;
  const link=coneSpatialProjectionFocus(plan,index);
  // Step seek acts on SAME V5 instance. The other view markers are
  // explanation overlays, not replayed or already drawn ConstructionSteps.
  stop();
  player.seekMs(link.views.V.actionEndMs,now());
  selectedSpatial=index;
  selected={id:link.views.V.sourceActionId,
   step:link.views.V.sourceStepIndex,revision};
  $('coneFocus').checked=false;
  paint();
  $('conePicked').textContent='已定位数学空间采样点 '+index+
   '：V/H/W 三视图出现蓝色投影定位标记。标记只解释同一 XYZ，'+
   '并不声明尚未播放的投影作图步骤已经完成。';
 }
 // Presentation colors only; uncertain strokes stay mathematically undetermined.
 // A colored preview never certifies complete occlusion or engineering line style.
 const CONE_PALETTES=Object.freeze({
  color:Object.freeze({
   known:'#536b89',guide:'#4787c9',visible:'#1d8069',
   hidden:'#7562a1',undetermined:'#bd762b',curve:'#bd762b',
   selected:'#176eaa',faceCut:'#efb45c',faceBase:'#8bacce',
   faceBody:'#86b2d9',faceCutEdge:'#b98126',faceEdge:'#6685a0',
   plane:'#e9b453',planeEdge:'#b17a23',rail:'#90a5bc',
   rim:'#54789e',spatial:'#20876b',anchor:'#317a75'
  }),
  mono:Object.freeze({
   known:'#515151',guide:'#929292',visible:'#333333',
   hidden:'#5e5e5e',undetermined:'#777777',curve:'#777777',
   selected:'#272727',faceCut:'#b2b2b2',faceBase:'#d2d2d2',
   faceBody:'#c3c3c3',faceCutEdge:'#676767',faceEdge:'#858585',
   plane:'#bbbbbb',planeEdge:'#777777',rail:'#aaa',
   rim:'#666',spatial:'#555',anchor:'#666'
  })
 });
 function conePalette(){return $('coneMono').checked?CONE_PALETTES.mono:CONE_PALETTES.color;}

 function paintSpatial(frame){
  if(!plan||!player||!player.canRender(revision)||!plan.stillCurrent(revision))return;
  // A display camera consumes ALREADY verified M3 xyz. It cannot solve,
  // modify the V/H/W coordinate system, certify visibility or own playback.
  const scene=coneLinkedSpatialScene(plan.spatialIntent,{
   azimuthDeg:Number($('coneOrbit').value),
   elevationDeg:Number($('coneTilt').value),width:360,height:275,
   retainedHalfspace:$('coneKept').value||null
  });
  const group=$('cone3dDraw');group.replaceChildren();
  const palette=conePalette();
  const pts=p=>p.map(q=>q.x.toFixed(3)+','+q.y.toFixed(3)).join(' ');
  const shape=(tag,attrs,parent=group)=>{
   const el=create(tag,attrs);parent.append(el);return el;
  };
  const solid=scene.cutSolid?.status==='sampled-closed-cut-mesh';
  if(solid){
   for(const face of scene.cutSolid.triangles){
    const section=face.kind==='cut-face';
    const base=face.kind==='base';
    shape('polygon',{points:pts(face.points),
     fill:section?palette.faceCut:base?palette.faceBase:palette.faceBody,
     'fill-opacity':section?'.87':'.73',
     stroke:section?palette.faceCutEdge:palette.faceEdge,
     'stroke-width':'.6',
     'data-cone-solid-face':face.kind});
   }
  }else{
   shape('polygon',{points:pts(scene.cuttingPlanePatch),
    fill:palette.plane,'fill-opacity':'.18',stroke:palette.planeEdge,
    'stroke-width':'1.2','stroke-dasharray':'5 4'});
   for(const rail of scene.rails){
    const [a,b]=rail;
    shape('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
     stroke:palette.rail,'stroke-width':'1.25','stroke-dasharray':'3 4'});
   }
   shape('polyline',{points:pts(scene.rim),fill:'none',
    stroke:palette.rim,'stroke-width':'1.8'});
   shape('circle',{cx:scene.apex.x,cy:scene.apex.y,r:3,fill:palette.rim});
  }
  for(const segment of scene.segments){
   const fraction=frame.actionFractions[segment.sourceActionId]??0;
   if(fraction<=0)continue;
   const from=segment.from,to={
    x:from.x+(segment.to.x-from.x)*fraction,
    y:from.y+(segment.to.y-from.y)*fraction
   };
   const active=selectedSpatial===segment.index;
   shape('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,
    stroke:active?palette.selected:palette.spatial,
    'stroke-width':active?3.8:2.6,'stroke-linecap':'round',
    'data-cone-3d-segment':segment.index});
   // Separate wide SVG hit stroke improves mobile point selection without
   // changing the geometric line width or introducing another player.
   const hit=shape('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,
    stroke:'transparent','stroke-width':'15','pointer-events':'stroke',
    'data-cone-3d-segment-hit':segment.index,
    tabindex:'0',role:'button',
    'aria-label':'空间截交线第 '+segment.index+' 段，定位三视图投影'});
   const pick=()=>focusSpatialSample(segment.index);
   hit.addEventListener('pointerdown',freezeBeforeTap);
   hit.addEventListener('click',pick);
   hit.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();pick();}
   });
  }
  const chordProgress=frame.actionFractions.cone_V_cap_chord??0;
  if(scene.capChord&&chordProgress>0){
   const f=scene.capChord.from,t=scene.capChord.to;
   shape('line',{x1:f.x,y1:f.y,
    x2:f.x+(t.x-f.x)*chordProgress,
    y2:f.y+(t.y-f.y)*chordProgress,
    stroke:palette.spatial,'stroke-width':'2.6'});
  }
  // ONLY the four mathematically proven 3D generator intersections are
  // interactive. Each jumps to its EXISTING canonical V guide step.
  for(const anchor of scene.anchors){
   const index=plan.steps.findIndex(s=>s.sourceStepId===anchor.sourceStepId);
   if(index<0)throw new TypeError('spatial anchor has no canonical V5 step');
   const linked=plan.steps[index].actions.at(-1);
   if(linked.kind!=='point')throw new TypeError('nonpoint spatial guide');
   const drawn=(frame.actionFractions[linked.id]??0)>0;
   const active=selectedSpatial===anchor.index;
   const mark=shape('circle',{cx:anchor.point.screen.x,
    cy:anchor.point.screen.y,r:active?6:4.6,
    fill:active?palette.selected:drawn?palette.spatial:'white',
    stroke:active?palette.selected:palette.anchor,'stroke-width':'2',
    'data-cone-3d-point':anchor.index,tabindex:'0',role:'button',
    'aria-label':'空间交点 P'+(anchor.guideOrdinal+1)+'，定位二维 V5 作图步骤'});
   const pick=()=>{
    if(!plan||!player||!plan.stillCurrent(revision))return;
    stop();$('coneGuides').checked=true;
    player.seekStep(index+1,now());
    selected={id:linked.id,revision,step:index};
    selectedSpatial=anchor.index;paint();
    $('conePicked').textContent='空间交点 P'+(anchor.guideOrdinal+1)+
     ' 已定位到真实二维 V 投影母线步骤；可切换 H/W 视图继续检查。';
   };
   mark.addEventListener('pointerdown',freezeBeforeTap);
   mark.addEventListener('click',pick);
   mark.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();pick();}
   });
  }
  if(selectedSpatial!==null&&scene.sourcePoints[selectedSpatial]){
   const target=scene.sourcePoints[selectedSpatial].screen;
   shape('circle',{cx:target.x,cy:target.y,r:7,fill:'none',
    stroke:palette.selected,'stroke-width':'2.8',
    'pointer-events':'none','data-cone-3d-selected':selectedSpatial});
  }
  const solidLabel=solid?'切后实体三角网格（'+
   (scene.cutSolid.retainedPiece==='apex'?'保留锥尖侧':'保留底面侧')+
   '）：封闭网格仅为解析边界的离散近似，完整遮挡仍未证明。':
   scene.cutSolid?.status==='not-supported'?
   '裁剪截线尚无已验证的完整切后体网格，保留线框示意。':
   '未选择保留侧，当前仅显示三维线框与示意截平面。';
  const faceNote=faceEvidence?.status==='strict-face-interior-evidence'?
   ' 截切面严格内部：'+['V','H','W'].map(v=>v+' '+
    faceEvidence.views[v].cutFace.visibility).join(' / ')+
   '（边缘和连续遮挡待证明）。':'';
  if(selectedSpatial!==null&&scene.sourcePoints[selectedSpatial]){
   const p=scene.sourcePoints[selectedSpatial].world;
   $('cone3dStatus').textContent=solidLabel+faceNote+' 选中 M3 空间点（mm）：('+[
    p.x,p.y,p.z].map(n=>n.toFixed(3)).join(', ')+
    ') · 二维投影与三维视角使用同一数学来源。';
  }else $('cone3dStatus').textContent=solidLabel+faceNote+' 同一 V5 进度 '+Math.round(frame.ratio*100)+
   '% · 旋转仅改变观察角度，不修改已确认的几何解。';
 }

 function paint(frame=player?.snapshot()){
  if(!plan||!player||!player.canRender(revision)||
     !plan.stillCurrent(revision)||!frame)return;
  const group=$('coneDraw');group.replaceChildren();
  const palette=conePalette(),showGuides=$('coneGuides').checked;
  $('coneSvg').querySelector('g[aria-hidden=true]')?.setAttribute('fill',palette.known);
  for(const outline of knownConeOutlines(plan.spatialIntent.operation.cone,plan.viewTransforms)){
   group.append(create(outline.kind,{...outline.attrs,fill:'none',stroke:palette.known,'stroke-width':1.5,'data-known-outline':outline.id,'pointer-events':'none'}));
  }
  let focus=null;
  for(const [index,step] of plan.steps.entries()){
   if(step.role==='guide'&&!showGuides)continue;
   for(const action of step.actions){
    const fraction=frame.actionFractions[action.id]??0;
    if(fraction<=0)continue;
    const label=step.role==='guide'?'guide':action.wholeProjectedStrokeOcclusionVerified===true?action.visibility:'undetermined';
    // This is explanatory mathematical coloring only, NOT certified SVG
    // line style or whole projected-chord occlusion.
    const selectedNow=selected?.id===action.id&&selected.revision===revision;
    const color=selectedNow?palette.selected:label==='guide'?palette.guide:
     label==='visible'?palette.visible:label==='hidden'?palette.hidden:palette.undetermined;
    const el=create(action.kind==='line'?'line':'circle',{
     stroke:color,'stroke-width':selectedNow?4:step.role==='guide'?1.5:2.6,
     'stroke-dasharray':step.role==='guide'?'6 6':
      label==='hidden'?'8 5':'none',
     'stroke-linecap':'round',fill:action.kind==='point'?color:'none',
     'vector-effect':'non-scaling-stroke',
     'data-cone-action':action.id,'data-cone-step':index,
     'data-cone-visibility':label,
     tabindex:'0',role:'button',
     'aria-label':'第 '+(index+1)+' 步 · '+label
    });
    if(selectedNow)el.setAttribute('data-cone-selected','true');
    Motion.updateSvg(el,action,fraction);
    const pick=()=>{
     selected={id:action.id,revision,step:index};
     const guide=step.sourceStepId?.match(/^cone_generator_(\d+)_[VHW]$/);
     const lateral=action.id.match(/^cone_[VHW]_lateral_(\d+)$/);
     selectedSpatial=guide?
      Math.floor(Number(guide[1])*(plan.spatialIntent.operation.samplePoints.length-1)/4):
      lateral?Number(lateral[1]):null;
     player.pause(now());stop();
     const proof=action.visibilityProof||'辅助线位置由已证数学步骤计算';
     $('conePicked').textContent='第 '+(index+1)+' 步：'+
      step.title+' · '+label+' · '+proof+
      '；点选不改变任何数学证明。';
     paint();
    };
    el.addEventListener('pointerdown',freezeBeforeTap);
    el.addEventListener('click',pick);
    el.addEventListener('keydown',event=>{
     if(event.key==='Enter'||event.key===' '){event.preventDefault();pick();}
    });
    if(action.sourceBoundary==='analytic-cone-lateral')el.setAttribute('stroke-opacity','0');
    group.append(el);
    // A visually narrow construction line has a >=18px invisible hit
    // stroke; points get an 11px hit radius. Both use existing Motion.
    const hit=create(action.kind==='line'?'line':'circle',{
     stroke:'transparent','stroke-width':'18',
     fill:'transparent','pointer-events':action.kind==='line'?'stroke':'all',
     'data-cone-action-hit':action.id,'aria-hidden':'true'});
    Motion.updateSvg(hit,action,fraction);
    if(action.kind==='point')hit.setAttribute('r','11');
    hit.addEventListener('pointerdown',freezeBeforeTap);
    hit.addEventListener('click',pick);
    group.append(hit);
    if(selectedNow)focus=action;
    else if(!focus&&fraction<1&&fraction>0)focus=action;
   }
  }
  for(const path of curvePaths(plan.steps,frame)){
   group.append(create('path',{d:path.d,fill:'none',stroke:palette.curve,'stroke-width':2.6,'stroke-linejoin':'round','pointer-events':'none','data-curve-id':path.id,'data-curve-actions':path.actionIds.join(' '),'data-curve-revision':path.sourceRevision,'data-chord-error-px':path.maxChordDeviationPx??'unverified'}));
  }
  if(selected?.revision===revision){
   const picked=plan.steps.flatMap(s=>s.actions).find(a=>a.id===selected.id);
   if(picked?.sourceBoundary==='analytic-cone-lateral'&&(frame.actionFractions[picked.id]??0)>0){
    const overlay=create('line',{stroke:palette.selected,'stroke-width':4,'pointer-events':'none','data-curve-selected':picked.id});
    Motion.updateSvg(overlay,picked,frame.actionFractions[picked.id]);group.append(overlay);
   }
  }
  if(selectedSpatial!==null){
   const link=coneSpatialProjectionFocus(plan,selectedSpatial);
   for(const view of ['V','H','W']){
    const q=link.views[view].sheetPx;
    const ring=create('circle',{cx:q.x,cy:q.y,r:7,
     fill:'none',stroke:palette.selected,'stroke-width':'2.7',
     'pointer-events':'none','data-cone-view-focus':view,
     'data-cone-source-index':selectedSpatial});
    const cross=create('path',{d:'M'+(q.x-10)+' '+q.y+
     'H'+(q.x+10)+' M'+q.x+' '+(q.y-10)+'V'+(q.y+10),
     fill:'none',stroke:palette.selected,'stroke-width':'1.3',
     'pointer-events':'none'});
    group.append(ring,cross);
   }
  }
  if($('coneFocus').checked&&focus){
   const box=bounds(focus);
   if(box){
    const v=Motion.focus(box,{width:960,height:680,zoom:1.5});
    $('coneSvg').setAttribute('viewBox',[v.x,v.y,v.width,v.height].join(' '));
   }
  }else $('coneSvg').setAttribute('viewBox','0 0 960 680');
  $('coneSeek').value=String(Math.round(frame.ratio*1000));
  $('conePercent').textContent=Math.round(frame.ratio*100)+'%';
  $('coneStepLabel').textContent='第 '+(frame.activeStepIndex+1)+
   ' / '+plan.steps.length+' 步 · '+
   (frame.done?'全部已绘制':plan.steps[frame.activeStepIndex]?.title||'准备中');
  for(const [i,button] of [...$('coneSteps').children].entries()){
   if(i===frame.activeStepIndex)button.setAttribute('aria-current','step');
   else button.removeAttribute('aria-current');
  }
  $('conePlay').textContent=frame.playing?'Ⅱ 暂停':'▶ 播放';
  paintSpatial(frame);
 }
 function makeSteps(){
  const nav=$('coneSteps');nav.replaceChildren();
  plan.steps.forEach((step,index)=>{
   const b=document.createElement('button');
   b.type='button';b.textContent=(index+1)+' · '+step.title;
   b.addEventListener('click',()=>{
    if(!player||!plan||!plan.stillCurrent(revision))return;
    stop();selected=null;selectedSpatial=null;
    player.seekStep(index,now());paint();
   });
   nav.append(b);
  });
 }
 function tick(_frameTimestamp){
  raf=null;
  if(!player||!plan||!player.canRender(revision))return;
  try{
   // The RAF timestamp can predate performance.now() used by click/seek/pause.
   // Use one monotonic clock for every V5 player command, including frames.
   const frame=player.snapshot(now());paint(frame);
   if(frame.playing)raf=requestAnimationFrame(tick);
  }catch(e){invalidate(false);status('动画验证失败：'+e.message,true);}
 }
 function toggle(){
  if(!player||!player.canRender(revision))return;
  if(player.snapshot().playing){stop();paint();return;}
  const t=now();
  if(player.snapshot().done)player.seekStep(0,t);
  const frame=player.play(t);paint(frame);
  if(frame.playing){if(raf!==null)cancelAnimationFrame(raf);
   raf=requestAnimationFrame(tick);}
 }
 function step(delta){
  if(!player||!plan)return;
  stop();selected=null;selectedSpatial=null;
  const index=player.snapshot().activeStepIndex;
  player.seekStep(Math.max(0,Math.min(plan.steps.length,index+delta)),now());
  paint();
 }
 function init(){
  for(const id of [...numeric,...config]){
   $(id).addEventListener('input',()=>{
    reviewedRadius=null;invalidate(true);
   });
  }
  $('coneConfirm').addEventListener('change',()=>invalidate(false));
  $('coneSolve').addEventListener('click',solve);
  $('coneSourceFile').addEventListener('change',sourceFileChanged);
  $('coneOcrRun').addEventListener('click',runNativeOcr);
  $('coneOcrCandidate').addEventListener('change',ocrCandidateChanged);
  for(const id of ['coneOcrReviewedValue','coneOcrUnits',
   'coneOcrLink','coneOcrAnswers','coneOcrAccept'])
   $(id).addEventListener('input',()=>{reviewedRadius=null;});
  $('coneOcrApply').addEventListener('click',applyReviewedRadius);
  $('coneSourceClear').addEventListener('click',()=>{
   invalidate(true);clearPhotoReference();
  });
  $('coneReset').addEventListener('click',()=>{
   for(const [id,value] of Object.entries(defaults))$(id).value=value;
   $('coneConfirm').checked=false;invalidate(false);
   clearPhotoReference();
  });
  $('conePlay').addEventListener('click',toggle);
  $('coneBack').addEventListener('click',()=>step(-1));
  $('coneForward').addEventListener('click',()=>step(1));
  $('coneSeek').addEventListener('input',()=>{
   if(!player)return;
   stop();selected=null;selectedSpatial=null;
   player.seekProgress(Number($('coneSeek').value)/1000,now());paint();
  });
  $('coneSpeed').addEventListener('change',()=>{
   if(!player)return;
   const wasPlaying=player.snapshot().playing;
   player.setSpeed(Number($('coneSpeed').value),now());paint();
   if(wasPlaying&&raf===null)raf=requestAnimationFrame(tick);
  });
  for(const id of ['coneOrbit','coneTilt'])
   $(id).addEventListener('input',()=>paint());
  $('cone3dSvg').addEventListener('pointerdown',beginOrbit);
  $('cone3dSvg').addEventListener('pointermove',moveOrbit);
  $('cone3dSvg').addEventListener('pointerup',endOrbit);
  $('cone3dSvg').addEventListener('pointercancel',endOrbit);
  $('cone3dSvg').addEventListener('lostpointercapture',endOrbit);
  for(const id of ['coneGuides','coneMono','coneFocus'])
   $(id).addEventListener('change',()=>paint());
  $('coneFit').addEventListener('click',()=>{
   $('coneFocus').checked=false;selected=null;paint();
  });
  window.addEventListener('pagehide',()=>{
   clearPhotoReference();
   if(raf!==null)cancelAnimationFrame(raf);raf=null;
   if(player&&player.canRender(revision))player.pause(now());
  });
  resetOcr(false);
  clear();disable(true);status('请确认全部数学条件后开始求解。');
 }
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
