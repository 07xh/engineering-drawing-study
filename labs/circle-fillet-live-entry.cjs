'use strict';
const {circleCircleFilletCenters}=require('../engines/planar/circle-circle-fillet.cjs');
const {chooseDirectedFillet}=require('../engines/planar/directed-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../engines/planar/two-segment-fillet.cjs');
const {chooseFiniteTwoSegmentArc}=require('../engines/planar/directed-two-segment-fillet.cjs');
const {gradeFilletOffsetLines}=require('../workbench/verified-fillet-offset-drawing.cjs');
const {gradeFilletArcDrawing}=require('../workbench/verified-fillet-arc-drawing.cjs');
const {constructParallelLine,constructConcentricCircle,snapChosenFilletCenter}=
 require('../workbench/verified-ruler-tools.cjs');
const {gradeStudentAuxiliaries}=require('../workbench/verified-ruler-steps.cjs');
const TimelineV5=require('../workbench/teaching-timeline-v5.js');
const MotionV5=require('../workbench/teaching-motion-v5.js');
const {filletTimeline}=require('../workbench/verified-plan-v5-bridge.cjs');
(function(){
 const SVG='http://www.w3.org/2000/svg',$=id=>document.getElementById(id);
 const FIELDS=['x1','y1','r1','mode1','x2','y2','r2','mode2','filletRadius',
  'branch','direction','travel1','travel2',
  'line1Ax','line1Ay','line1Bx','line1By','line2Ax','line2Ay','line2Bx','line2By',
  'lineSide1','lineSide2','lineTravel1','lineTravel2'];
 const O={x:360,y:220},scale=8;let centers=null,chosen=null,input=null,teaching=null,stage=0;
 let learningMode='full',hintStep=0,revision=0,strokes=[],redoStrokes=[],pointer=null;
 let digitalActions=[],digitalError='',snappedCenter=null;
 let centerSnapMessage='使用点选圆心工具，在画纸上选择经数学计算存在的候选交点。';
 let playTimer=null,stageClock=null,animatedArcNode=null,statusMessage='';
 const reducedMotion=()=>typeof window!=='undefined'&&
   !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const stopPlayback=()=>{
  if(playTimer!==null){cancelAnimationFrame(playTimer);playTimer=null}
  stageClock=null;animatedArcNode=null;
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
 const arcSegment=()=>stageClock?.timeline.segments.at(-1);
 const paintCurrentArc=()=>{
  if(learningMode!=='full'||!stageClock||!verifiedArc()||
     stageClock.snapshot().revision!==revision||!stageClock.canRender(revision))return;
  const seg=arcSegment();
  if(!seg||seg.kind!=='arc')return;
  const snapshot=stageClock.snapshot();
  const fraction=snapshot.actionFractions[seg.id];
  if(!(fraction>0)||fraction>=1)return;
  if(!animatedArcNode)animatedArcNode=drawArc($('diagram'),chosen.geometry,0);
  // The animating geometry is exactly the verified last R1/V5 action.
  MotionV5.updateSvg(animatedArcNode,teaching.steps.at(-1).actions[0],fraction);
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
  const args={first:{center:{x:n('x1'),y:n('y1')},radius:n('r1')},
   second:{center:{x:n('x2'),y:n('y2')},radius:n('r2')},
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
  stopPlayback();revision++;strokes=[];redoStrokes=[];pointer=null;
  digitalActions=[];digitalError='';snappedCenter=null;
  centerSnapMessage='题目条件已改变：旧圆心选择和尺规步骤已清空。';
  centers=null;chosen=null;input=null;teaching=null;stage=0;hintStep=0;
  try{
   let args=parse();
   const isSegments=$('modeSelect').value==='segments';
   const result=isSegments?finiteTwoSegmentFillets(args):circleCircleFilletCenters(args);
   refreshCandidates(result);
   // A parameter change can invalidate the previously selected branch.
   // Re-parse after revalidating the actual candidate IDs so a stale branch
   // cannot be used as a fabricated final answer.
   args=parse();
   const picked=isSegments?chooseFiniteTwoSegmentArc(args):chooseDirectedFillet(args);
   const plan=filletTimeline(isSegments?'segments':'circles',args,{origin:O,scale},revision);
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
 function render(){
  const svg=$('diagram');svg.replaceChildren();animatedArcNode=null;
  svg.append(elem('rect',{width:720,height:440,fill:'#fff'}));
  for(let x=30;x<720;x+=30)svg.append(elem('line',{x1:x,y1:0,x2:x,y2:440,stroke:'#edf1ed','stroke-width':.65}));
  for(let y=10;y<440;y+=30)svg.append(elem('line',{x1:0,y1:y,x2:720,y2:y,stroke:'#edf1ed','stroke-width':.65}));
  svg.append(elem('line',{x1:0,y1:O.y,x2:720,y2:O.y,stroke:'#93a49a','stroke-width':1}));
  svg.append(elem('line',{x1:O.x,y1:0,x2:O.x,y2:440,stroke:'#93a49a','stroke-width':1}));
  const isSegments=$('modeSelect').value==='segments',full=learningMode==='full';
  const hint=learningMode==='hint',drawing=learningMode==='draw';
  $('fullControls').hidden=!full;
  $('hintControls').hidden=!hint;
  $('drawControls').hidden=!drawing;
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
  }else{
   if(input){
    svg.append(ring(input.first.center,input.first.radius,'#257650'));
    svg.append(ring(input.second.center,input.second.radius,'#257650'));
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
  }
  if(drawing&&chosen?.status==='selected'&&chosen.g1Verified===true){
   for(const stroke of strokes){
    if(stroke.kind==='arc')svg.append(elem('polyline',{
     points:stroke.points.map(p=>p.x+','+p.y).join(' '),
     stroke:'#8651a8','stroke-width':3.2,fill:'none'}));
    else svg.append(elem('line',{
     x1:stroke.from.x,y1:stroke.from.y,x2:stroke.to.x,y2:stroke.to.y,
     stroke:'#8651a8','stroke-width':3.2}));
   }
   if(pointer?.tool==='arc'&&pointer.points.length>1)
    svg.append(elem('polyline',{
     points:pointer.points.map(p=>p.x+','+p.y).join(' '),
     stroke:'#ad83c7','stroke-width':2.5,fill:'none'}));
  }
  svg.classList?.toggle?.('draw-active',drawing&&(
    ($('drawTool').value==='snap'&&!!input&&!!$('branch').value)||
    (chosen?.status==='selected'&&chosen.g1Verified===true&&
     ($('drawTool').value==='arc'||isSegments))));
  $('prev').disabled=!full||stage===0;
  $('next').disabled=!full||stage>=max;
  $('playPause').disabled=!full||max===0||reducedMotion()||
   (stage>=max&&(!stageClock||stageClock.snapshot().done));
  $('playPause').textContent=playTimer===null?'自动播放':'暂停播放';
  $('counter').textContent=stage+' / '+max;
  const verified=chosen?.status==='selected'&&chosen.g1Verified===true;
  const hintMax=verified?(isSegments?6:4):0;
  $('hintNext').disabled=!hint||hintStep>=hintMax||hintMax===0;
  $('hintCounter').textContent=hintStep+' / '+hintMax;
  $('undoDraw').disabled=!drawing||strokes.length===0;
  $('redoDraw').disabled=!drawing||redoStrokes.length===0;
  $('clearDraw').disabled=!drawing||strokes.length===0;
  $('addDigital').disabled=!drawing||!input||digitalActions.length>=64;
  $('undoDigital').disabled=!drawing||digitalActions.length===0;
  $('clearDigital').disabled=!drawing||digitalActions.length===0;
  $('checkDigital').disabled=!drawing||!input;
  if(drawing){
   try{
    if(!input)$('digitalStatus').textContent='当前题目条件无效，不能构造数学辅助轨迹。';
    else{
     const result=gradeStudentAuxiliaries(isSegments?'segments':'circles',
      input,digitalActions,{branchId:$('branch').value,revision});
     $('digitalStatus').textContent=digitalError||(
      '数字尺规辅助轨迹 '+result.matchedCount+' / '+result.requiredCount+
      '；额外／错误构造 '+result.extraCount+'。'+result.reason);
    }
   }catch(error){$('digitalStatus').textContent='无法验证尺规步骤：'+error.message;}
   $('centerSnapStatus').textContent=centerSnapMessage;
  }
  $('checkDraw').disabled=!drawing||!verified||
   ($('drawTool').value==='line'&&!isSegments);
  if(hint){
   $('stepTitle').textContent='逐步提示｜'+hintStep+' / '+hintMax;
   $('stepText').textContent=hintStep===0?
    '先判断相切条件、可行候选分支及几何约束；不会提前展示图形答案。':
    teaching?.status==='ready'&&teaching.revision===revision
     ?teaching.steps[hintStep-1].explanation:
       '数学证明链尚未完成，请先确认候选分支与原轮廓走向。';
  }
  if(drawing){
   const arcTool=$('drawTool').value==='arc';
   $('stepTitle').textContent=arcTool?'自己作图｜手绘有向圆弧':'自己作图｜有限线段辅助线';
   $('stepText').textContent=arcTool
    ?'验证真实圆弧的两个切点、数学半径与指定旋向；不能由这一步推断所有辅助作图都已完成。'
    :'只验证两条有限线段的半径偏移辅助线，不代表整条连接圆弧已经完成。';
   if(!verified)$('drawStatus').textContent='请先确定有效圆心分支、弧向和两个原轮廓走向，完成有向 G1 数学验证。';
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
 }

 for(const id of FIELDS){
  const selectIds=['mode1','mode2','branch','direction','travel1','travel2',
   'lineSide1','lineSide2','lineTravel1','lineTravel2'];
  $(id).addEventListener(selectIds.includes(id)?'change':'input',compute);
 }
 $('modeSelect').addEventListener('change',()=>{
  $('branch').value='';
  const isSegments=$('modeSelect').value==='segments';
  for(const node of document.querySelectorAll('.circle-only'))node.hidden=isSegments;
  for(const node of document.querySelectorAll('.line-only'))node.hidden=!isSegments;
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
   :(centers?4:0);
  if(learningMode!=='full')return;
  stopPlayback();stage=Math.min(max,stage+1);render();
 });
 $('reset').addEventListener('click',()=>{
  for(const [id,value] of Object.entries({x1:0,y1:0,r1:5,mode1:'external',
   x2:20,y2:0,r2:5,mode2:'external',filletRadius:10,branch:'',direction:'',
   travel1:'',travel2:'',line1Ax:-20,line1Ay:0,line1Bx:20,line1By:0,
   line2Ax:0,line2Ay:-20,line2Bx:0,line2By:20,
   lineSide1:'',lineSide2:'',lineTravel1:'',lineTravel2:''}))$(id).value=String(value);
  compute();
 });
 $('hintNext').addEventListener('click',()=>{
  if(learningMode!=='hint'||chosen?.status!=='selected'||!chosen.g1Verified)return;
  hintStep=Math.min($('modeSelect').value==='segments'?6:4,hintStep+1);
  render();
 });
 $('playPause').addEventListener('click',()=>{
  if(playTimer!==null){pausePlayback();render();paintCurrentArc();return;}
  if(learningMode!=='full'||!centers||reducedMotion())return;
  const max=$('modeSelect').value==='segments'
   ?(verifiedArc()?teaching.steps.length:
      (centers.candidates.length||centers.continuousFamilies.length?3:0)):4;
  const clock=()=>performance.now();
  if(stage>=max&&(!stageClock||stageClock.snapshot().done))return;
  if(!stageClock){
   const arcReady=verifiedArc();
   const timeline=TimelineV5.compileTimeline(Array.from({length:max},(_,i)=>({
    id:'fillet-'+(i+1),actions:[{
     id:'construction-'+(i+1),
     // Last step is a real arc only after explicit mathematical G1 validation.
     kind:i===max-1&&arcReady?'arc':'highlight',
     durationMs:i===max-1&&arcReady?1600:1200
    }]
   })),{gapMs:0});
   stageClock=TimelineV5.createPlayer(timeline,{
    speed:Number($('animationSpeed').value),revision});
   stageClock.seekStep(stage,clock());
  }
  stageClock.play(clock());
  const tick=()=>{
   if(!stageClock||learningMode!=='full'||!centers||reducedMotion()){
    stopPlayback();render();return;
   }
   const snapshot=stageClock.snapshot(clock());
   if(snapshot.completedIds.length!==stage){
    stage=Math.min(max,snapshot.completedIds.length);
    if(stage>=max){stopPlayback();render();return;}
    render();
   }
   paintCurrentArc();
   playTimer=requestAnimationFrame(tick);
  };
  playTimer=requestAnimationFrame(tick);
  render();
  paintCurrentArc();
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
 $('drawTool').addEventListener('change',()=>{pointer=null;render()});
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
   const action=$('modeSelect').value==='segments'
    ?constructParallelLine(input[sourceId],value,{revision})
    :constructConcentricCircle(input[sourceId],value,{revision});
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
  digitalActions=[];snappedCenter=null;digitalError='';
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
  if(tool==='snap'){
   try{
    const selected=snapChosenFilletCenter(
     $('modeSelect').value==='segments'?'segments':'circles',
     input,{x:(from.x-O.x)/scale,y:(O.y-from.y)/scale,revision},
     {branchId:$('branch').value,revision});
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
