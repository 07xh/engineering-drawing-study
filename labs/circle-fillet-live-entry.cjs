'use strict';
const {circleCircleFilletCenters}=require('../engines/planar/circle-circle-fillet.cjs');
const {chooseDirectedFillet}=require('../engines/planar/directed-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../engines/planar/two-segment-fillet.cjs');
const {chooseFiniteTwoSegmentArc}=require('../engines/planar/directed-two-segment-fillet.cjs');
const {finiteSegmentCircleFillets}=require('../engines/planar/segment-circle-fillet.cjs');
const {chooseDirectedSegmentCircleFillet}=
 require('../engines/planar/directed-segment-circle-fillet.cjs');
const {gradeFilletOffsetLines}=require('../workbench/verified-fillet-offset-drawing.cjs');
const {gradeFilletArcDrawing}=require('../workbench/verified-fillet-arc-drawing.cjs');
const {constructParallelLine,constructConcentricCircle,snapChosenFilletCenter}=
 require('../workbench/verified-ruler-tools.cjs');
const {gradeStudentAuxiliaries}=require('../workbench/verified-ruler-steps.cjs');
const {gradeStudentTangentPoints}=require('../workbench/verified-tangent-point-drawing.cjs');
const {assessFilletStudentProgress}=require('../workbench/verified-student-fillet-progress.cjs');
const {fromProgress:studentFeedback}=require('../workbench/verified-student-fillet-guidance.cjs');
const TimelineV5=require('../workbench/teaching-timeline-v5.js');
const MotionV5=require('../workbench/teaching-motion-v5.js');
const {filletTimeline}=require('../workbench/verified-plan-v5-bridge.cjs');
const ReasonsV5=require('../workbench/verified-fillet-step-reasons.cjs');
const ProgressiveV5=require('../workbench/verified-fillet-progressive-motion.cjs');
const StrokeReasonV5=require('../workbench/verified-fillet-stroke-reasons.cjs');
(function(){
 const SVG='http://www.w3.org/2000/svg',$=id=>document.getElementById(id);
 const FIELDS=['x1','y1','r1','mode1','arcExtent1','arcStart1','arcEnd1','arcDirection1',
  'x2','y2','r2','mode2','arcExtent2','arcStart2','arcEnd2','arcDirection2','filletRadius',
  'branch','direction','travel1','travel2',
  'line1Ax','line1Ay','line1Bx','line1By','line2Ax','line2Ay','line2Bx','line2By',
  'lineSide1','lineSide2','lineTravel1','lineTravel2',
  'mixAx','mixAy','mixBx','mixBy','mixX','mixY','mixR',
  'mixArcExtent','mixArcStart','mixArcEnd','mixArcDirection','mixSide',
  'mixLineTravel','mixCircleTravel'];
 const O={x:360,y:220},scale=8;let centers=null,chosen=null,input=null,teaching=null,reasons=null,stage=0;
 let learningMode='full',hintStep=0,revision=0,strokes=[],redoStrokes=[],pointer=null;
 let digitalActions=[],digitalError='',snappedCenter=null,studentCenterTap=null;
 let centerSnapMessage='使用点选圆心工具，在画纸上选择经数学计算存在的候选交点。';
 let playTimer=null,stageClock=null,autoplayPlan=null,statusMessage='';
 const activeActionNodes=new Map();

 let pickedAction=null;
 let paperCamera={x:0,y:0,width:720,height:440};
 const fullCamera=()=>({x:0,y:0,width:720,height:440});
 const markSelectable=(node,action,index)=>{
  if(!action?.id||!['line','circle','point','arc'].includes(action.kind))return node;
  node.setAttribute('data-v5-pick',action.id);
  node.setAttribute('data-v5-step',String(index));
  node.setAttribute('data-v5-kind',action.kind);
  if(pickedAction?.id===action.id&&pickedAction.revision===revision)
   node.setAttribute('data-v5-selected','true');
  return node;
 };
 const actionBounds=a=>{
  const g=a?.geometry;
  if(!g)return null;
  let b;
  if(a.kind==='line'&&g.from&&g.to)
   b={minX:Math.min(g.from.x,g.to.x),maxX:Math.max(g.from.x,g.to.x),
    minY:Math.min(g.from.y,g.to.y),maxY:Math.max(g.from.y,g.to.y)};
  else if(['circle','arc','point'].includes(a.kind)&&g.center){
   const radius=a.kind==='point'?12:g.radius;
   b={minX:g.center.x-radius,maxX:g.center.x+radius,
    minY:g.center.y-radius,maxY:g.center.y+radius};
  }
  return b&&Object.values(b).every(Number.isFinite)?b:null;
 };
 const selectedVisible=()=>{
  if(learningMode!=='full')return null;
  const frame=stageClock?.canRender(revision)?stageClock.snapshot():null;
  const plan=autoplayPlan?.steps||teaching?.steps;
  if(!plan)return null;
  if(pickedAction?.revision===revision){
   const action=plan[pickedAction.step]?.actions.find(a=>a.id===pickedAction.id);
   if(action&&(frame?frame.actionFractions?.[action.id]>0:stage>pickedAction.step))
    return action;
  }
  if(!frame||frame.done)return null;
  const current=plan[frame.activeStepIndex]?.actions||[];
  return current.find(a=>frame.actionFractions?.[a.id]>0&&
   frame.actionFractions?.[a.id]<1)||
   current.find(a=>frame.actionFractions?.[a.id]>0)||null;
 };
 const updatePaperView=(snap=false)=>{
  const action=$('paperFocus').checked?selectedVisible():null;
  const b=actionBounds(action);
  const zoom=b?Math.max(1,Math.min(1.7,720/(b.maxX-b.minX+70),
   440/(b.maxY-b.minY+70))):1;
  const target=b?MotionV5.focus(b,{width:720,height:440,zoom}):fullCamera();
  paperCamera=MotionV5.cameraTowards(paperCamera,target,snap?1000:16,170,
   snap||reducedMotion());
  $('diagram').setAttribute?.('viewBox',[
   paperCamera.x,paperCamera.y,paperCamera.width,paperCamera.height].join(' '));
 };
 const syncPaperPick=()=>{
  if(learningMode!=='full'){
   $('paperPicked').textContent='仅完整教学支持选择数学图线。';return;
  }
  const plan=autoplayPlan?.steps||teaching?.steps;
  const a=plan?.[pickedAction?.step]?.actions.find(v=>v.id===pickedAction?.id);
  if(!a||pickedAction.revision!==revision){
   $('paperPicked').textContent='点击已经绘出的辅助线、辅助圆或连接弧，可查看数学步骤。';
   return;
  }
  $('paperPicked').textContent='已选第 '+(pickedAction.step+1)+' 步 · '+
   ({line:'辅助线',circle:'辅助圆',point:'投影点',arc:'有向连接弧'}[a.kind]||'几何图元')+
   '；选择只定位步骤，不改变数学结果。';
 };
 const reducedMotion=()=>typeof window!=='undefined'&&
   !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const stopPlayback=()=>{
  if(playTimer!==null){cancelAnimationFrame(playTimer);playTimer=null}
  stageClock=null;autoplayPlan=null;activeActionNodes.clear();
 };
 const pausePlayback=()=>{
  if(playTimer!==null){cancelAnimationFrame(playTimer);playTimer=null}
  if(stageClock)stageClock.pause(performance.now());
 };
 // Screen projection is performed by V5. Never recompute an arc from its SVG pixels.
 const verifiedArc=()=>chosen?.status==='selected'&&chosen.g1Verified===true&&
   chosen.geometry?.kind==='arc'&&chosen.geometry?.data&&
   teaching?.status==='ready'&&teaching.revision===revision&&
   teaching.selectedBranchId===chosen.selectedId&&
   chosen.selectedId===input?.branchId&&
   chosen.geometry.data.direction===input?.direction;
 const paintCurrentConstruction=()=>{
  if(learningMode!=='full'||!stageClock||!autoplayPlan||
     !stageClock.canRender(revision))return;
  const snapshot=stageClock.snapshot();
  if(snapshot.invalid||snapshot.revision!==revision||snapshot.done)return;
  const step=autoplayPlan.steps[snapshot.activeStepIndex];
  if(!step||snapshot.activeStepIndex!==stage)return;
  const color=step.role==='result'?'#246da5':
   step.id.includes('trim')?'#236eb5':'#c38536';
  for(const action of step.actions){
   const fraction=snapshot.actionFractions[action.id];
   if(!(fraction>0))continue;
   let node=activeActionNodes.get(action.id);
   if(!node){
    const tag=action.kind==='line'?'line':
     action.kind==='point'||action.kind==='circle'?'circle':
     action.kind==='arc'?'path':null;
    if(!tag)continue;
    node=elem(tag,{stroke:color,
     'stroke-width':action.kind==='arc'?3.5:2,
     fill:action.kind==='point'?color:'none','stroke-linecap':'round',
     'data-v5-progressive':action.kind,
     ...(action.kind==='arc'?{'data-verified-arc':'true'}:{})
    });
    $('diagram').append(node);activeActionNodes.set(action.id,node);
   }
   // A line grows its end coordinate; a circle exposes increasing
   // circumference; a point fades in; an arc grows its VERIFIED sweep.
   MotionV5.updateSvg(node,action,fraction);
   if(action.kind==='point')node.setAttribute('opacity',String(fraction));
  }
 };
 const availableStages=()=>{
  if(!centers)return 0;
  return $('modeSelect').value==='segments'
   ?(verifiedArc()?teaching.steps.length:
      (centers.candidates.length||centers.continuousFamilies.length?3:0))
   :$('modeSelect').value==='segment-circle'
    ?(verifiedArc()?teaching.steps.length:(centers.candidates.length?3:0)):4;
 };
 const syncLiveExplanation=()=>{
  const panel=$('filletStrokeLive');
  const frame=stageClock?.canRender(revision)?stageClock.snapshot():null;
  if(learningMode!=='full'||!autoplayPlan||!frame){
   panel.hidden=true;return;
  }
  const detail=StrokeReasonV5.at({
   motion:autoplayPlan,reasons,frame,revision,mode:learningMode
  });
  if(!['drawing','stage-finished','complete','no-action'].includes(detail.status)){
   panel.hidden=true;return;
  }
  panel.hidden=false;
  $('filletStrokeTitle').textContent=detail.title;
  $('filletStrokeWhy').textContent=detail.why;
  $('filletStrokeBasis').textContent=detail.basis;
  $('filletStrokeCheck').textContent=detail.check;
  $('filletStrokePercent').textContent=detail.percent+'% · 第 '+
   detail.step+' 步，第 '+detail.action+' / '+detail.totalActions+' 笔';
 };
 const syncStrokeProgress=()=>{
  const max=availableStages();
  const frame=stageClock?.canRender(revision)?stageClock.snapshot():null;
  const ratio=frame?frame.ratio:max?stage/max:0;
  const r=Math.max(0,Math.min(1,ratio));
  const percent=Math.round(r*100);
  $('filletProgress').value=String(Math.round(r*1000));
  $('filletProgress').disabled=learningMode!=='full'||max===0;
  $('filletRestart').disabled=learningMode!=='full'||(stage===0&&!frame?.elapsedMs);
  $('filletProgressLabel').textContent=percent+'%';
  $('filletProgress').setAttribute?.('aria-valuetext',
   '已完成 '+percent+'%；'+(frame?.done?'全部步骤完成':
    '第 '+Math.min(max,stage+1)+' / '+max+' 步'));
  syncLiveExplanation();
 };
 const ensureAutoplayClock=()=>{
  if(stageClock&&autoplayPlan&&stageClock.canRender(revision))return true;
  const max=availableStages();
  if(!max)return false;
  autoplayPlan=ProgressiveV5.build({kind:$('modeSelect').value,
   centers,chosen,teaching,verified:!!verifiedArc(),
   revision,origin:O,scale,max});
  stageClock=TimelineV5.createPlayer(autoplayPlan.timeline,{
   speed:Number($('animationSpeed').value),revision});
  stageClock.seekStep(stage,performance.now());
  return true;
 };
 const fmt=n=>Number.isFinite(n)?Number(n.toFixed(6)).toString():'?';
 const elem=(tag,attr={},value)=>{
  const e=document.createElementNS(SVG,tag);
  for(const [k,v] of Object.entries(attr))e.setAttribute(k,String(v));
  if(value!==undefined)e.textContent=String(value);
  return e;
 };
 const sheet=p=>({x:O.x+scale*p.x,y:O.y-scale*p.y});
 const ring=(center,radius,color,dash='')=>elem('circle',{cx:sheet(center).x,cy:sheet(center).y,r:scale*radius,
   fill:'none',stroke:color,'stroke-width':2,'stroke-dasharray':dash||'none'});
 const knownOutline=(circleSpec)=>{
  if(!circleSpec.arc)return ring(circleSpec.center,circleSpec.radius,'#257650');
  const a=circleSpec.arc,positive=(v)=>(v%360+360)%360;
  const sweep=positive(a.direction==='ccw'?
   a.endAngle-a.startAngle:a.startAngle-a.endAngle);
  // A pure coordinate conversion. The core solver has already verified
  // this proper source arc. Do not infer a full circle on the drawing.
  const signedEnd=a.startAngle+(a.direction==='ccw'?sweep:-sweep);
  const model={center:circleSpec.center,radius:circleSpec.radius,
   startAngle:a.startAngle,endAngle:signedEnd,direction:a.direction};
  const projected=MotionV5.projectArcFromVerifiedModel(model,{origin:O,scale});
  const outline=elem('path',{stroke:'#257650','stroke-width':2,fill:'none',
   'data-given-source-arc':'true'});
  MotionV5.updateSvg(outline,{kind:'arc',geometry:projected},1);
  return outline;
 };
 const drawLine=(a,b,color='#257650',dash='')=>{
  const start=sheet(a),end=sheet(b);
  return elem('line',{x1:start.x,y1:start.y,x2:end.x,y2:end.y,
   stroke:color,'stroke-width':2,'stroke-dasharray':dash||'none'});
 };
 const dot=(p,color,label)=>{
  const g=elem('g'),v=sheet(p);
  g.append(elem('circle',{cx:v.x,cy:v.y,r:4.5,fill:color}));
  g.append(elem('text',{x:v.x+7,y:v.y-8,'font-size':12,fill:color},label));
  return g;
 };
 function parse(){
  const n=id=>{
   const e=$(id);
   if(e.value.trim()===''||!Number.isFinite(e.valueAsNumber))
    throw Error('请填写有效有限数值：'+id);
   return e.valueAsNumber;
  };
  const branch=$('branch').value,direction=$('direction').value;
  if($('modeSelect').value==='segments'){
   const args={
    first:{a:{x:n('line1Ax'),y:n('line1Ay')},b:{x:n('line1Bx'),y:n('line1By')}},
    second:{a:{x:n('line2Ax'),y:n('line2Ay')},b:{x:n('line2Bx'),y:n('line2By')}},
    filletRadius:n('filletRadius'),
    ...($('lineSide1').value===''?{}:{firstSide:Number($('lineSide1').value)}),
    ...($('lineSide2').value===''?{}:{secondSide:Number($('lineSide2').value)})
   };
   return {...args,...(branch?{branchId:branch}:{}),...(direction?{direction}:{}),
    ...($('lineTravel1').value?{firstTravel:$('lineTravel1').value}:{}),
    ...($('lineTravel2').value?{secondTravel:$('lineTravel2').value}:{})};
  }
  if($('modeSelect').value==='segment-circle'){
   const finiteSource=$('mixArcExtent').value==='finite'?{arc:{
    startAngle:n('mixArcStart'),endAngle:n('mixArcEnd'),
    direction:$('mixArcDirection').value}}:{};
   const model={segment:{a:{x:n('mixAx'),y:n('mixAy')},
     b:{x:n('mixBx'),y:n('mixBy')}},
    circle:{center:{x:n('mixX'),y:n('mixY')},radius:n('mixR'),...finiteSource},
    filletRadius:n('filletRadius'),side:Number($('mixSide').value)};
   return {...model,...(branch?{branchId:branch}:{}),
    ...(direction?{direction}:{}),
    ...($('mixLineTravel').value?{lineTravel:$('mixLineTravel').value}:{}),
    ...($('mixCircleTravel').value?{knownCircleTravel:$('mixCircleTravel').value}:{})};
  }
  const givenArc=i=>$('arcExtent'+i).value==='finite'?{arc:{
   startAngle:n('arcStart'+i),endAngle:n('arcEnd'+i),
   direction:$('arcDirection'+i).value}}:{};
  const args={first:{center:{x:n('x1'),y:n('y1')},radius:n('r1'),...givenArc(1)},
   second:{center:{x:n('x2'),y:n('y2')},radius:n('r2'),...givenArc(2)},
   filletRadius:n('filletRadius'),firstMode:$('mode1').value,secondMode:$('mode2').value};
  return {...args,...(branch?{branchId:branch}:{}),...(direction?{direction}:{}),
   ...($('travel1').value?{knownFirstTravel:$('travel1').value}:{}),
   ...($('travel2').value?{knownSecondTravel:$('travel2').value}:{})};
 }
 function refreshCandidates(result){
  const selector=$('branch'),previous=selector.value;
  selector.replaceChildren();
  const add=(value,label)=>{
   const option=document.createElement('option');
   option.value=value;option.textContent=label;selector.append(option);
  };
  add('','请选择有效候选圆心');
  for(const c of result.candidates??[])add(c.id,learningMode==='full'?c.id+' ('+
   fmt(c.center.x)+', '+fmt(c.center.y)+')':c.id);
  selector.value=(result.candidates??[]).some(c=>c.id===previous)?previous:'';
 }
 function compute(){
  stopPlayback();revision++;pickedAction=null;paperCamera=fullCamera();
  strokes=[];redoStrokes=[];pointer=null;
  digitalActions=[];digitalError='';snappedCenter=null;studentCenterTap=null;
  centerSnapMessage='题目条件已改变：旧圆心选择和尺规步骤已清空。';
  centers=null;chosen=null;input=null;teaching=null;reasons=null;stage=0;hintStep=0;
  try{
   let args=parse();
   const isSegments=$('modeSelect').value==='segments';
   const isMixed=$('modeSelect').value==='segment-circle';
   const result=isSegments?finiteTwoSegmentFillets(args):
    isMixed?finiteSegmentCircleFillets(args):circleCircleFilletCenters(args);
   refreshCandidates(result);
   // A parameter change can invalidate the previously selected branch.
   // Re-parse after revalidating the actual candidate IDs so a stale branch
   // cannot be used as a fabricated final answer.
   args=parse();
   const picked=isSegments?chooseFiniteTwoSegmentArc(args):
    isMixed?chooseDirectedSegmentCircleFillet(args):chooseDirectedFillet(args);
   const plan=filletTimeline(isSegments?'segments':isMixed?'segment-circle':'circles',
    args,{origin:O,scale},revision);
   if(picked.status==='selected'&&picked.g1Verified===true&&
     (plan.status!=='ready'||plan.revision!==revision||
      plan.selectedBranchId!==picked.selectedId))
    throw Error('数学解与统一证明链冲突，已拒绝显示圆弧');
   if(plan.status==='ready'){
    const actual=picked.geometry?.data,arc=plan.originalLesson.result.arc;
    if(!actual||!['radius','startAngle','endAngle'].every(
      k=>Math.abs(actual[k]-arc[k])<1e-8)||
      actual.direction!==arc.direction||
      Math.hypot(actual.center.x-arc.center.x,actual.center.y-arc.center.y)>1e-8)
     throw Error('圆弧证明与教学步骤结果不一致，已拒绝显示');
   }
   const sourceKind=isSegments?'segments':isMixed?'segment-circle':'circles';
   reasons=ReasonsV5.build(plan,{kind:sourceKind,revision});
   centers=result;chosen=picked;input=args;teaching=plan;
   const short=result.status==='multiple'?'存在 '+result.candidateCount+' 个有效候选圆心。':
    result.status==='unique'?'存在 1 个有效候选圆心。':
    result.status==='none'?'当前相切条件无解。':
    result.status==='unstable'?'当前条件数值不稳定，拒绝推测圆心。':
    '存在连续多解，不能自动选定连接圆心。';
   statusMessage=short+' '+(
    picked.status==='selected'
     ?'已选 '+picked.selectedId+'，连接弧扫掠 '+fmt(picked.sweepDegrees)+'°。'+
      (picked.g1Verified?'两端有向 G1 已经通过向量检验。':'尚未提供完整轮廓走向，仅验证无向相切。')
     :picked.reason||'尚未给出有限弧段。');
  }catch(e){statusMessage='条件无效：'+(e.message||'请重新填写');}
  render();
 }
 function drawArc(svg,g,fraction=1){
  // G1 and selected branch are checked by the caller. This is strictly the
  // verified model arc transformed to a sheet-space SVG path, not a solver.
  const transformed=MotionV5.projectArcFromVerifiedModel(g.data,{origin:O,scale});
  const node=elem('path',{stroke:'#246da5','stroke-width':3.5,
    fill:'none','stroke-linecap':'round','data-verified-arc':'true'});
  MotionV5.updateSvg(node,{kind:'arc',geometry:transformed},fraction);
  svg.append(node);return node;
 }
 function appendVerifiedSteps(svg,count){
  if(teaching?.status!=='ready'||teaching.revision!==revision)return;
  for(const step of teaching.steps.slice(0,count))
   for(const action of step.actions){
    const g=action.geometry;
    const color=step.role==='result'?'#246da5':
      step.id.includes('trim')?'#236eb5':'#c38536';
    if(action.kind==='line')
     svg.append(elem('line',{x1:g.from.x,y1:g.from.y,x2:g.to.x,y2:g.to.y,
      stroke:color,'stroke-width':2,
      'stroke-dasharray':step.id.includes('trim')?'none':'7 6'}));
    else if(action.kind==='circle')
     svg.append(elem('circle',{cx:g.center.x,cy:g.center.y,r:g.radius,
      stroke:color,'stroke-width':2,fill:'none','stroke-dasharray':'7 6'}));
    else if(action.kind==='point')
     svg.append(elem('circle',{cx:g.center.x,cy:g.center.y,r:4.5,fill:color}));
    else if(action.kind==='arc'){
     const path=elem('path',{stroke:'#246da5','stroke-width':3.5,
      fill:'none','stroke-linecap':'round','data-verified-arc':'true'});
     MotionV5.updateSvg(path,action,1);svg.append(path);
    }else throw Error('不支持的统一教学动作：'+action.kind);
   }
 }
 function paintV5Reasons(){
  // Full explanation is deliberately absent from hint and student drawing modes.
  const panel=$('filletProof');panel.hidden=learningMode!=='full';
  if(panel.hidden)return;
  const explanation=ReasonsV5.at(reasons,{revision,stage,mode:learningMode});
  $('filletProofTitle').textContent=explanation.status==='ready'?
   '第 '+explanation.step+' / '+explanation.total+' 步 · 已选分支的数学依据':
   explanation.status==='intro'?'观察阶段 · 尚未推导结果':
   '验证尚不完整 · 不展示圆弧结果';
  $('filletProofWhy').textContent=explanation.why||explanation.reason;
  $('filletProofBasis').textContent=explanation.basis||
   '需要明确数学有效的分支、原轮廓方向和弧向；不自动推测。';
  $('filletProofCheck').textContent=explanation.check||
   '未经验证的辅助轨迹和连接圆弧均不能当成标准解。';
  $('filletProofEvidence').textContent=explanation.evidence||
   '尚未通过有向 G1 数学验证，不提供模型残差或结果证明。';
  $('filletProofScope').textContent=explanation.scope||
   '本页仅解释真实数学求解能支持的内容，不代替整本教材题验收。';
 }
 function render(){
  const svg=$('diagram');svg.replaceChildren();activeActionNodes.clear();
  svg.append(elem('rect',{width:720,height:440,fill:'#fff'}));
  for(let x=30;x<720;x+=30)svg.append(elem('line',{x1:x,y1:0,x2:x,y2:440,stroke:'#edf1ed','stroke-width':.65}));
  for(let y=10;y<440;y+=30)svg.append(elem('line',{x1:0,y1:y,x2:720,y2:y,stroke:'#edf1ed','stroke-width':.65}));
  svg.append(elem('line',{x1:0,y1:O.y,x2:720,y2:O.y,stroke:'#93a49a','stroke-width':1}));
  svg.append(elem('line',{x1:O.x,y1:0,x2:O.x,y2:440,stroke:'#93a49a','stroke-width':1}));
  const isSegments=$('modeSelect').value==='segments',
   isMixed=$('modeSelect').value==='segment-circle',full=learningMode==='full';
  const hint=learningMode==='hint',drawing=learningMode==='draw';
  $('fullControls').hidden=!full;
  $('hintControls').hidden=!hint;
  $('drawControls').hidden=!drawing;
  $('studentMathFeedback').hidden=!drawing;
  $('status').textContent=!input||full?statusMessage:
   chosen?.status==='selected'?'已经选定数学分支；此模式不展示圆心坐标或成品圆弧。':
   '条件尚不足以生成经验证的最终弧段；请选择合适条件后再学习。';
  const proofReady=full&&verifiedArc();
  let max=0;
  if(input&&isSegments){
   svg.append(drawLine(input.first.a,input.first.b));
   svg.append(drawLine(input.second.a,input.second.b));
   svg.append(dot(input.first.a,'#257650','A₁'));
   svg.append(dot(input.first.b,'#257650','B₁'));
   svg.append(dot(input.second.a,'#257650','A₂'));
   svg.append(dot(input.second.b,'#257650','B₂'));
   if(full&&!proofReady&&stage>=1){
    const drawn=new Set();
    const loci=(centers?.candidates??[]).map(c=>c.steps)
      .concat((centers?.continuousFamilies??[]).map(f=>[
       {geometry:f.firstOffsetLine},{geometry:f.secondOffsetLine}]));
    for(const parts of loci){
     const first=parts[0]?.geometry,second=parts[1]?.geometry;
     for(const [i,line] of [[0,first],[1,second]]){
      if(stage<i+1||!line)continue;
      const key=JSON.stringify(line);
      if(drawn.has(key))continue;
      drawn.add(key);
      svg.append(drawLine(line.a,line.b,'#c38536','7 6'));
     }
    }
   }
   if(full&&!proofReady&&stage>=3){
    for(const c of centers?.candidates??[])svg.append(dot(c.center,'#9d6529',c.id));
    for(const f of centers?.continuousFamilies??[]){
     svg.append(drawLine(f.start.center,f.end.center,'#c38536','3 3'));
    }
   }
   if(full&&!proofReady&&stage>=4&&chosen?.contacts){
    svg.append(dot(chosen.contacts.first,'#2477b0','T₁'));
    svg.append(dot(chosen.contacts.second,'#2477b0','T₂'));
   }
   if(full&&!proofReady&&stage>=5&&chosen?.trimmedSourceSegments){
    for(const key of ['first','second']){
     const line=chosen.trimmedSourceSegments[key].segment;
     svg.append(drawLine(line.a,line.b,'#236eb5'));
    }
   }
   if(proofReady)appendVerifiedSteps(svg,stage);
   const exists=!!(centers?.candidates?.length||centers?.continuousFamilies?.length);
   max=exists?(proofReady?teaching.steps.length:3):0;
   $('stepTitle').textContent='第 '+stage+' 步';
   $('stepText').textContent=stage===0
    ?'先观察两条有限线段，切点必须位于各自的真实端点之间。'
    :proofReady&&teaching.steps[stage-1]
     ?teaching.steps[stage-1].explanation:
     ['','沿第一条直线作半径距离偏移线。','沿第二条直线作半径距离偏移线。',
      '观察所有有效圆心（或平行条件下的连续族），先选分支和走向才能继续。'][stage];
  }else if(input&&isMixed){
   svg.append(drawLine(input.segment.a,input.segment.b));
   svg.append(knownOutline(input.circle));
   svg.append(dot(input.segment.a,'#257650','A'));
   svg.append(dot(input.segment.b,'#257650','B'));
   svg.append(dot(input.circle.center,'#257650','O'));
   if(full&&!proofReady&&centers?.auxiliary&&stage>=1){
    const line=centers.auxiliary.offsetLine;
    svg.append(drawLine(line.a,line.b,'#c38536','7 6'));
   }
   if(full&&!proofReady&&centers?.auxiliary&&stage>=2){
    const aux=centers.auxiliary;
    svg.append(ring(aux.circleCenter,aux.centerLocusRadius,'#c38536','7 6'));
   }
   if(full&&!proofReady&&stage>=3){
    for(const c of centers?.candidates??[])
     svg.append(dot(c.center,'#9d6529',c.id));
   }
   if(proofReady)appendVerifiedSteps(svg,stage);
   max=proofReady?teaching.steps.length:centers?.candidates?.length?3:0;
   const prompts=[
    '先观察有限线段和给定完整圆／有限圆弧；切点必须位于已知轮廓上。',
    '在线段指定法向一侧作距离为连接半径的平行辅助线。',
    '以已知圆心为圆心作半径 R+r 的辅助圆心轨迹。',
    '偏移线与辅助圆的交点是有效候选圆心；必须独立选择合法分支。'
   ];
   $('stepTitle').textContent='第 '+stage+' 步';
   $('stepText').textContent=stage===0?prompts[0]:
    proofReady&&teaching.steps[stage-1]
     ?teaching.steps[stage-1].explanation:prompts[stage];
  }else{
   if(input){
    svg.append(knownOutline(input.first));
    svg.append(knownOutline(input.second));
    svg.append(dot(input.first.center,'#257650','O₁'));
    svg.append(dot(input.second.center,'#257650','O₂'));
    if(full&&!proofReady&&centers?.auxiliary&&stage>=1){
     svg.append(ring(centers.auxiliary.firstLocus.center,centers.auxiliary.firstLocus.radius,'#c38536','7 6'));
     svg.append(ring(centers.auxiliary.secondLocus.center,centers.auxiliary.secondLocus.radius,'#c38536','7 6'));
    }
    if(full&&!proofReady&&centers?.candidates&&stage>=2)for(const c of centers.candidates)
     svg.append(dot(c.center,'#9d6529',c.id));
    if(full&&!proofReady&&chosen?.contacts&&stage>=3){
     svg.append(dot(chosen.contacts.first,'#2477b0','T₁'));
     svg.append(dot(chosen.contacts.second,'#2477b0','T₂'));
    }
    if(proofReady)appendVerifiedSteps(svg,stage);
   }
   max=centers?4:0;
   const copy=[
    '仅显示已知圆心与半径，不把猜测的连接圆弧当成标准解。',
    '根据内切／外切和连接半径画出两个辅助圆心轨迹。',
    '两条圆心轨迹的交点是候选连接圆心。存在多个就保留所有候选。',
    '选择圆心后，沿圆心连线计算两处接触点。没有选择就不编造切点。',
    '在明确圆心分支和 cw/ccw 方向后画出有限圆弧；如已知原轮廓方向冲突，则不显示未通过 G1 的结果。'
   ];
   $('stepTitle').textContent='第 '+stage+' 步';
   $('stepText').textContent=proofReady&&stage>0?teaching.steps[stage-1].explanation:copy[stage];
  }
  if(drawing&&input){
   for(const action of digitalActions){
    if(action.kind==='line')svg.append(drawLine(action.from,action.to,'#8651a8','4 4'));
    if(action.kind==='circle')svg.append(ring(action.center,action.radius,'#8651a8','4 4'));
   }
   if(snappedCenter)svg.append(dot(snappedCenter,'#8651a8','已选圆心'));
   // Student-owned marks: NEVER draw computed expected tangent contacts here.
   for(const mark of strokes.filter(st=>st.kind==='tangent-point'))
    svg.append(dot(mark.point,'#8651a8',mark.sourceId==='first'?'我标的 T₁':'我标的 T₂'));
  }
  if(drawing&&chosen?.status==='selected'&&chosen.g1Verified===true){
   for(const stroke of strokes){
    if(stroke.kind==='arc')svg.append(elem('polyline',{
     points:stroke.points.map(p=>p.x+','+p.y).join(' '),
     stroke:'#8651a8','stroke-width':3.2,fill:'none'}));
    else if(stroke.kind==='line')svg.append(elem('line',{
     x1:stroke.from.x,y1:stroke.from.y,x2:stroke.to.x,y2:stroke.to.y,
     stroke:'#8651a8','stroke-width':3.2}));
   }
   if(pointer?.tool==='arc'&&pointer.points.length>1)
    svg.append(elem('polyline',{
     points:pointer.points.map(p=>p.x+','+p.y).join(' '),
     stroke:'#ad83c7','stroke-width':2.5,fill:'none'}));
  }
  svg.classList?.toggle?.('draw-active',drawing&&(
    (isMixed&&!!input&&($('drawTool').value==='tangent'||
      ($('drawTool').value==='snap'&&!!$('branch').value)||
      ($('drawTool').value==='arc'&&verifiedArc())))||
    (!isMixed&&(
     ($('drawTool').value==='tangent'&&!!input)||
     ($('drawTool').value==='snap'&&!!input&&!!$('branch').value)||
     (chosen?.status==='selected'&&chosen.g1Verified===true&&
      ($('drawTool').value==='arc'||isSegments))))));
  $('prev').disabled=!full||stage===0;
  $('next').disabled=!full||stage>=max;
  $('playPause').disabled=!full||max===0||reducedMotion()||
   (stage>=max&&(!stageClock||stageClock.snapshot().done));
  $('playPause').textContent=playTimer===null?'逐笔播放':'暂停播放';
  $('counter').textContent=stage+' / '+max;
  const verified=chosen?.status==='selected'&&chosen.g1Verified===true;
  const hintMax=verified?(isSegments?6:isMixed?5:4):0;
  $('hintNext').disabled=!hint||hintStep>=hintMax||hintMax===0;
  $('hintCounter').textContent=hintStep+' / '+hintMax;
  $('undoDraw').disabled=!drawing||strokes.length===0;
  $('redoDraw').disabled=!drawing||redoStrokes.length===0;
  $('clearDraw').disabled=!drawing||strokes.length===0;
  $('drawTool').disabled=!drawing;
  $('addDigital').disabled=!drawing||!input||digitalActions.length>=64;
  $('undoDigital').disabled=!drawing||digitalActions.length===0;
  $('clearDigital').disabled=!drawing||digitalActions.length===0;
  $('checkDigital').disabled=!drawing||!input;
  if(drawing){
   const currentKind=isSegments?'segments':isMixed?'segment-circle':'circles';
   try{
    if(!input)$('digitalStatus').textContent='输入无效，无法构造辅助轨迹。';
    else{
     const result=gradeStudentAuxiliaries(currentKind,input,digitalActions,
      {branchId:$('branch').value,revision});
     $('digitalStatus').textContent=digitalError||
      '数字尺规辅助轨迹 '+result.matchedCount+' / '+result.requiredCount+
      '；额外或错误构造 '+result.extraCount+'。'+result.reason;
    }
   }catch(e){$('digitalStatus').textContent='尺规判题失败：'+e.message;}
   $('centerSnapStatus').textContent=centerSnapMessage;
   if(input){
    try{
     const grade=assessFilletStudentProgress(currentKind,input,{
      auxiliaries:digitalActions,centerMark:studentCenterTap,
      tangentMarks:strokes.filter(st=>st.kind==='tangent-point'),
      arcStrokes:strokes.filter(st=>st.kind==='arc')
     },{branchId:$('branch').value,revision,origin:O,scale});
     const labels={'auxiliary-loci':'辅助轨迹','chosen-center':'候选圆心',
      'contact-points':'两个切点','directed-arc':'连接弧'};
     $('learningProgress').textContent='已通过 '+grade.verifiedCount+
      ' / '+grade.supportedStageCount+' 项受支持的数学构造：'+
      grade.stages.map(x=>labels[x.id]+(x.ok?' ✓':' 待核验')).join(' · ')+
      '。'+grade.reason;
     // Reuse the independent student grading envelope; no hidden ideal
     // coordinates, signed offsets or tangent locations enter the UI.
     const feedback=studentFeedback(grade,{kind:currentKind,revision});
     $('studentFeedbackSummary').textContent=feedback.headline;
     $('studentFeedbackNext').textContent=feedback.next;
     $('studentFeedbackScope').textContent=feedback.scope;
     for(const [i,id] of ['studentFeedbackAux','studentFeedbackCenter',
      'studentFeedbackContacts','studentFeedbackArc'].entries()){
      const item=feedback.stages[i];
      $(id).textContent=item?(item.verified?'已核验 · ':'待处理 · ')+item.detail:
       '无法核验当前数学数据';
     }
    }catch(e){
     $('learningProgress').textContent='联合数学判题失败：'+e.message;
     $('studentFeedbackSummary').textContent='此题暂不能核验学生作图';
     $('studentFeedbackNext').textContent='检查题目输入和有效候选分支；不显示可能失效的旧结论。';
     for(const id of ['studentFeedbackAux','studentFeedbackCenter',
      'studentFeedbackContacts','studentFeedbackArc'])$(id).textContent='未验证';
    }
   }else{
    $('learningProgress').textContent='题目输入无效，无法验证数学构造。';
    $('studentFeedbackSummary').textContent='无法验证当前输入';
    $('studentFeedbackNext').textContent='先检查半径、原轮廓与分支输入，然后重新画图。';
    for(const id of ['studentFeedbackAux','studentFeedbackCenter',
     'studentFeedbackContacts','studentFeedbackArc'])$(id).textContent='未验证';
   }
  }
  const drawKind=$('drawTool').value;
  $('checkDraw').disabled=!drawing||!input||
   (drawKind!=='tangent'&&drawKind!=='snap'&&(!verified||
      (drawKind==='line'&&!isSegments&&!isMixed)));
  if(hint){
   $('stepTitle').textContent='逐步提示｜'+hintStep+' / '+hintMax;
   $('stepText').textContent=hintStep===0?
    '先判断相切条件、可行候选分支及几何约束；不会提前展示图形答案。':
    teaching?.status==='ready'&&teaching.revision===revision
     ?teaching.steps[hintStep-1].explanation:
       '数学证明链尚未完成，请先确认候选分支与原轮廓走向。';
  }
  if(drawing&&isMixed){
   const tool=$('drawTool').value;
   $('stepTitle').textContent=tool==='arc'?'线段＋圆｜手绘连接弧':
    tool==='snap'?'线段＋圆｜自主选择候选圆心':
    tool==='tangent'?'线段＋圆｜自行确定两个切点':'线段＋圆｜数字化尺规';
   $('stepText').textContent=tool==='arc'?
    '从有限线段切点到给定圆弧切点画出有向 G1 连接弧；不代表整题完成。':
    tool==='snap'?'自行选择有效分支再点选圆心，数学吸附不会代替选答案。':
    '按已知对象分别构造偏移线与辅助圆，并点选自己计算的两个切点。';
   if(!['tangent','arc'].includes(tool))
    $('drawStatus').textContent=tool==='snap'?centerSnapMessage:
     '请使用上方数字尺规构造辅助轨迹，或切换点选切点和手绘圆弧工具。';
   else try{
    if(tool==='tangent'){
     const r=gradeStudentTangentPoints('segment-circle',input,
      strokes.filter(st=>st.kind==='tangent-point'),
      {branchId:$('branch').value,revision});
     $('drawStatus').textContent='学生切点 '+r.matchedCount+' / 2；额外或错误标记 '+r.extraCount+'。'+r.reason;
    }else{
     const arcs=strokes.filter(st=>st.kind==='arc');
     const result=arcs.length>1?
      {status:'incorrect',reason:'请撤销多余曲线，仅保留一条连接弧'}:
      gradeFilletArcDrawing(input,arcs[0]??null,
       {kind:'segment-circle',origin:O,scale,revision});
     $('drawStatus').textContent=(result.status==='correct'?'手绘连接弧数学验证通过。':
      result.status==='incomplete'?'尚未绘制连接弧。':
      '连接弧尚未通过有向数学检验。')+result.reason;
    }
   }catch(e){$('drawStatus').textContent='本题型学生作图验证失败：'+e.message;}
  }else if(drawing){
   const arcTool=$('drawTool').value==='arc',tangentTool=$('drawTool').value==='tangent';
   $('stepTitle').textContent=tangentTool?'自己作图｜两处真实切点':
    arcTool?'自己作图｜手绘有向圆弧':'自己作图｜有限线段辅助线';
   $('stepText').textContent=tangentTool
    ?'先选源对象 1 或 2，再点选你算出的切点。只验证数学位置，不替你选择分支，也不把切点正确当作整题完成。':
    arcTool?'验证真实圆弧的两个切点、数学半径与指定旋向；不能由这一步推断所有辅助作图都已完成。'
    :'只验证两条有限线段的半径偏移辅助线，不代表整条连接圆弧已经完成。';
   if(tangentTool){
    try{
     const grade=gradeStudentTangentPoints(isSegments?'segments':'circles',
      input,strokes.filter(st=>st.kind==='tangent-point'),
      {branchId:$('branch').value,revision});
     $('drawStatus').textContent='学生切点 '+grade.matchedCount+' / '+grade.requiredCount+
      '；重复或错误标记 '+grade.extraCount+'。'+grade.reason;
    }catch(error){$('drawStatus').textContent='切点数学验证失败：'+error.message;}
   }
   else if(!verified)$('drawStatus').textContent='请先确定有效圆心分支、弧向和两个原轮廓走向，完成有向 G1 数学验证。';
   else if(!arcTool&&!isSegments)$('drawStatus').textContent='两圆的辅助圆手绘尚未支持；可以选“手绘有向连接圆弧”工具。';
   else{
    try{
     if(arcTool){
      const attempts=strokes.filter(st=>st.kind==='arc');
      const result=gradeFilletArcDrawing(input,attempts.at(-1)??null,{
       kind:isSegments?'segments':'circles',origin:O,scale,revision});
      $('drawStatus').textContent=attempts.length>1?
       '检测到多条弧线，请撤销多余弧线后再判题。':
       (result.status==='correct'?'手绘圆弧数学验证通过。':
        result.status==='incomplete'?'尚未绘制连接圆弧。':
        '连接弧尚未通过数学验证。')+result.reason;
     }else{
      const lines=strokes.filter(st=>st.kind==='line');
      const result=gradeFilletOffsetLines(input,lines,{origin:O,scale,revision});
      $('drawStatus').textContent='辅助线 '+result.matchedCount+' / '+result.targetCount+
       '；额外直线 '+result.extraCount+'。'+result.reason;
     }
    }catch(e){$('drawStatus').textContent='无法验证：'+e.message;}
   }
  }
  paintV5Reasons();
  syncStrokeProgress();
 }

 for(const id of FIELDS){
  const selectIds=['mode1','mode2','arcExtent1','arcExtent2','arcDirection1','arcDirection2',
   'branch','direction','travel1','travel2',
   'lineSide1','lineSide2','lineTravel1','lineTravel2',
   'mixArcExtent','mixArcDirection','mixSide','mixLineTravel','mixCircleTravel'];
  $(id).addEventListener(selectIds.includes(id)?'change':'input',compute);
 }
 $('modeSelect').addEventListener('change',()=>{
  $('branch').value='';
  const mode=$('modeSelect').value;
  for(const node of document.querySelectorAll('.circle-only'))node.hidden=mode!=='circles';
  for(const node of document.querySelectorAll('.line-only'))node.hidden=mode!=='segments';
  for(const node of document.querySelectorAll('.mixed-only'))node.hidden=mode!=='segment-circle';
  if(mode==='segment-circle')$('drawTool').value='tangent';
  compute();
 });
 $('learningMode').addEventListener('change',()=>{
  stopPlayback();
  learningMode=$('learningMode').value;
  if(!['full','hint','draw'].includes(learningMode))learningMode='full';
  stage=0;hintStep=0;pointer=null;
  if(centers)refreshCandidates(centers);
  render();
 });
  $('calculate').addEventListener('click',compute);
 $('prev').addEventListener('click',()=>{stopPlayback();if(learningMode!=='full')return;
  stage=Math.max(0,stage-1);render()});
 $('next').addEventListener('click',()=>{
  const max=$('modeSelect').value==='segments'
   ?(verifiedArc()?teaching.steps.length:
      (centers?.candidates?.length||centers?.continuousFamilies?.length?3:0))
   :$('modeSelect').value==='segment-circle'
    ?(verifiedArc()?teaching.steps.length:(centers?.candidates?.length?3:0)):
    (centers?4:0);
  if(learningMode!=='full')return;
  stopPlayback();stage=Math.min(max,stage+1);render();
 });
 $('reset').addEventListener('click',()=>{
  for(const [id,value] of Object.entries({x1:0,y1:0,r1:5,mode1:'external',
   arcExtent1:'full',arcStart1:300,arcEnd1:330,arcDirection1:'ccw',
   x2:20,y2:0,r2:5,mode2:'external',
   arcExtent2:'full',arcStart2:215,arcEnd2:245,arcDirection2:'ccw',
   filletRadius:10,branch:'',direction:'',
   travel1:'',travel2:'',line1Ax:-20,line1Ay:0,line1Bx:20,line1By:0,
   line2Ax:0,line2Ay:-20,line2Bx:0,line2By:20,
   lineSide1:'',lineSide2:'',lineTravel1:'',lineTravel2:'',
   mixAx:-25,mixAy:0,mixBx:25,mixBy:0,mixX:0,mixY:5,mixR:8,
   mixArcExtent:'full',mixArcStart:155,mixArcEnd:175,mixArcDirection:'ccw',
   mixSide:1,mixLineTravel:'',mixCircleTravel:''}))$(id).value=String(value);
  compute();
 });
 $('hintNext').addEventListener('click',()=>{
  if(learningMode!=='hint'||chosen?.status!=='selected'||!chosen.g1Verified)return;
  hintStep=Math.min($('modeSelect').value==='segments'?6:
   $('modeSelect').value==='segment-circle'?5:4,hintStep+1);
  render();
 });
 $('playPause').addEventListener('click',()=>{
  if(playTimer!==null){pausePlayback();render();paintCurrentConstruction();return;}
  if(learningMode!=='full'||!centers||reducedMotion())return;
  const max=availableStages();
  if(!max||stage>=max&&(!stageClock||stageClock.snapshot().done))return;
  if(!ensureAutoplayClock())return;
  const now=()=>performance.now();
  stageClock.play(now());
  const tick=()=>{
   if(!stageClock||learningMode!=='full'||!centers||reducedMotion()){
    stopPlayback();render();return;
   }
   const snapshot=stageClock.snapshot(now());
   const completed=ProgressiveV5.completedSteps(stageClock.timeline,snapshot);
   if(completed!==stage){
    stage=Math.min(max,completed);
    if(stage>=max){stopPlayback();render();return;}
    render();
   }
   paintCurrentConstruction();
   syncStrokeProgress();
   playTimer=requestAnimationFrame(tick);
  };
  playTimer=requestAnimationFrame(tick);
  render();paintCurrentConstruction();
 });
 $('filletProgress').addEventListener('input',()=>{
  if(learningMode!=='full'||!ensureAutoplayClock())return;
  if(playTimer!==null)pausePlayback();
  const progress=Number($('filletProgress').value);
  if(!Number.isFinite(progress))return;
  const ratio=Math.max(0,Math.min(1,progress/1000));
  const now=performance.now();
  stageClock.pause(now);
  const frame=stageClock.seekMs(ratio*stageClock.timeline.totalMs,now);
  stage=ProgressiveV5.completedSteps(stageClock.timeline,frame);
  render();paintCurrentConstruction();
 });
 $('filletRestart').addEventListener('click',()=>{
  if(learningMode!=='full')return;
  stopPlayback();stage=0;render();
 });
 document.addEventListener?.('visibilitychange',()=>{
  if(document.hidden&&playTimer!==null){
   pausePlayback();render();paintCurrentConstruction();
  }
 });
 const motionMedia=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 motionMedia?.addEventListener?.('change',event=>{
  if(event.matches&&playTimer!==null){
   pausePlayback();render();paintCurrentConstruction();
  }
 });
 $('animationSpeed').addEventListener('change',()=>{
  const speed=Number($('animationSpeed').value);
  TimelineV5.validateSpeed(speed);
  if(stageClock)stageClock.setSpeed(speed,performance.now());
 });
 for(const [button,kind] of [['undoDraw','undo'],['redoDraw','redo'],['clearDraw','clear']]){
  $(button).addEventListener('click',()=>{
   if(learningMode!=='draw')return;
   if(kind==='undo'&&strokes.length)redoStrokes.push(strokes.pop());
   if(kind==='redo'&&redoStrokes.length)strokes.push(redoStrokes.pop());
   if(kind==='clear'){strokes=[];redoStrokes=[];pointer=null;}
   render();
  });
 }
 $('drawTool').addEventListener('change',()=>{
  pointer=null;
  if($('modeSelect').value==='segment-circle'&&$('drawTool').value==='line')
   $('drawTool').value='tangent';
  render();
 });
 $('checkDraw').addEventListener('click',()=>{if(learningMode==='draw')render()});
 $('addDigital').addEventListener('click',()=>{
  if(learningMode!=='draw'||!input)return;
  try{
   const sourceId=$('digitalSource').value;
   if(!['first','second'].includes(sourceId)||digitalActions.length>=64)
    throw new RangeError('请选源对象，且尺规步骤不能超过 64 条');
   const field=$('digitalValue');
   if(field.value.trim()===''||!Number.isFinite(field.valueAsNumber))
    throw new TypeError('请输入有效的偏移距离或圆规半径（mm）');
   const value=field.valueAsNumber;
   const mode=$('modeSelect').value;
   const action=mode==='segments'||mode==='segment-circle'&&sourceId==='first'
    ?constructParallelLine(mode==='segment-circle'?input.segment:input[sourceId],
      value,{revision})
    :constructConcentricCircle(mode==='segment-circle'?input.circle:input[sourceId],
      value,{revision});
   digitalActions.push({...action,sourceId});
   digitalError='';render();
  }catch(error){digitalError='尺规构造失败：'+error.message;render();}
 });
 $('undoDigital').addEventListener('click',()=>{
  if(learningMode!=='draw')return;
  digitalActions.pop();digitalError='';render();
 });
 $('clearDigital').addEventListener('click',()=>{
  if(learningMode!=='draw')return;
  digitalActions=[];snappedCenter=null;studentCenterTap=null;digitalError='';
  centerSnapMessage='尺规和圆心选择已清空。';render();
 });
 $('checkDigital').addEventListener('click',()=>{if(learningMode==='draw'){
  digitalError='';render();
 }});

 const svg=$('diagram');
 function eventPoint(event){
  const rect=svg.getBoundingClientRect();
  if(!rect||!rect.width||!rect.height||
     !Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return null;
  return {x:Math.max(0,Math.min(720,(event.clientX-rect.left)*720/rect.width)),
    y:Math.max(0,Math.min(440,(event.clientY-rect.top)*440/rect.height))};
 }
 svg.addEventListener('pointerdown',event=>{
  if(learningMode!=='draw'||!input||event.button>0)return;
  const from=eventPoint(event);if(!from)return;
  const tool=$('drawTool').value;
  if($('modeSelect').value==='segment-circle'&&tool==='line')return;
  if(tool==='tangent'){
   const sourceId=$('digitalSource').value;
   if(!['first','second'].includes(sourceId))return;
   // Tap coordinates are mapped back to model-mm before grading.
   strokes.push({kind:'tangent-point',sourceId,revision,
    point:{x:(from.x-O.x)/scale,y:(O.y-from.y)/scale}});
   if(strokes.length>200)strokes.shift();
   redoStrokes=[];render();return;
  }
  if(tool==='snap'){
   try{
    const rawTap={x:(from.x-O.x)/scale,y:(O.y-from.y)/scale,revision};
    // Preserve the actual student tap as evidence; the snapped mathematical
    // center must NOT be reused as an invented student input.
    studentCenterTap=rawTap;
    const selected=snapChosenFilletCenter(
     $('modeSelect').value==='segments'?'segments':
      $('modeSelect').value==='segment-circle'?'segment-circle':'circles',
     input,rawTap,{branchId:$('branch').value,revision});
    snappedCenter=selected.status==='verified-center'?selected.snappedPoint:null;
    centerSnapMessage=selected.status==='verified-center'
     ?'候选圆心数学吸附通过；仍须验证真实切点、弧向及 G1。'
     :selected.reason;
   }catch(error){
    snappedCenter=null;centerSnapMessage='圆心数学吸附失败：'+error.message;
   }
   render();return;
  }
  if(chosen?.status!=='selected'||!chosen.g1Verified||
     (tool==='line'&&$('modeSelect').value!=='segments'))return;
  pointer={id:event.pointerId,revision,from,tool,
   points:tool==='arc'?[from]:[]};
  svg.setPointerCapture?.(event.pointerId);
 });
 svg.addEventListener('pointermove',event=>{
  if(!pointer||pointer.id!==event.pointerId||pointer.tool!=='arc')return;
  const p=eventPoint(event);if(!p)return;
  const last=pointer.points[pointer.points.length-1];
  if(Math.hypot(p.x-last.x,p.y-last.y)>=2&&pointer.points.length<800){
   pointer.points.push(p);render();
  }
 });
 svg.addEventListener('pointerup',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  const old=pointer;pointer=null;
  const to=eventPoint(event);
  if(!to||old.revision!==revision||learningMode!=='draw'||
     chosen?.status!=='selected'||!chosen.g1Verified)return;
  if(old.tool==='arc'){
   const end=old.points[old.points.length-1];
   if(Math.hypot(to.x-end.x,to.y-end.y)>=1&&old.points.length<800)
    old.points.push(to);
   if(old.points.length<2)return;
   strokes.push({kind:'arc',points:old.points,revision});
  }else{
   if(Math.hypot(to.x-old.from.x,to.y-old.from.y)<3)return;
   strokes.push({kind:'line',from:old.from,to,revision});
  }
  if(strokes.length>200)strokes.shift();
  redoStrokes=[];render();
 });
 svg.addEventListener('pointercancel',()=>{pointer=null;render()});
 svg.addEventListener('lostpointercapture',()=>{pointer=null;render()});
 compute();
})();
