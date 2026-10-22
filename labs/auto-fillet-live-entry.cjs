'use strict';
const {kinds,buildConfirmedInput,defaultValues,defaultChoices}=
 require('./auto-fillet-form.cjs');
const {solveFiniteFillet}=require('../engines/constraints-2d/finite-fillet-gate.cjs');
const {createConfirmedFilletSession}=
 require('../workbench/v31-fillet-session.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');
const {attachLocalImagePreview}=require('./local-problem-preview.cjs');
const {attachLocalVectorReview}=require('./local-vector-svg-review-ui.cjs');
const {attachImageFieldReview}=require('./image-field-review-ui.cjs');
const {attachLocalLineCandidates}=require('./local-line-candidates-ui.cjs');
const {attachLocalCurveCandidates}=require('./local-curve-candidates-ui.cjs');

(function(){
 'use strict';
 const SVG='http://www.w3.org/2000/svg';
 const $=id=>document.getElementById(id);
 const sheet={origin:{x:360,y:220},scale:5};
 const map=p=>({x:sheet.origin.x+sheet.scale*p.x,
  y:sheet.origin.y-sheet.scale*p.y});
 const controlNames=['branch','direction','travel1','travel2'];
 const fmt=n=>Number.isFinite(n)?Number(n.toFixed(5)).toString():'—';
 const svg=(tag,attrs={})=>{
  const node=document.createElementNS(SVG,tag);
  for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));
  return node;
 };
 const option=(value,text)=>{
  const node=document.createElement('option');node.value=value;node.textContent=text;return node;
 };
 let session=null,kind='two-segments',raf=null,renderedStepsKey='';
 let fieldReview=null;
 let localVector=null;
 function stopClock(){
  if(raf!==null){cancelAnimationFrame(raf);raf=null;}
 }
 function values(){
  const v={filletRadius:$('geo-filletRadius')?.valueAsNumber};
  for(const [name] of kinds[kind].fields)v[name]=$('geo-'+name)?.valueAsNumber;
  return v;
 }
 function input(){
  const data=values();
  const fields=kinds[kind].fields.map(x=>x[0]).concat('filletRadius');
  if(fields.some(id=>!Number.isFinite(data[id])||!$('geo-'+id)?.value.trim()))
   return null;
  const selection={
   branchId:$('branch').value,direction:$('direction').value,
   [kinds[kind].travels[0][0]]:$('travel1').value,
   [kinds[kind].travels[1][0]]:$('travel2').value
  };
  if(fieldReview?.isEnabled()){
   const checked=fieldReview.reviewedInput(kind,data,selection,session?.revision??0);
   return checked.status==='ready-for-math'?checked.input:null;
  }
  return buildConfirmedInput(kind,data,selection,session?.revision??0);
 }
 function choiceOptions(element,values,selected){
  element.replaceChildren(option('','请先选择'));
  for(const v of values)element.append(option(v,v==='cw'?'顺时针 CW':
   v==='ccw'?'逆时针 CCW':v==='forward'?'顺线段方向':'逆线段方向'));
  element.value=selected&&values.includes(selected)?selected:'';
 }
 function buildFields(nextKind){
  stopClock();kind=nextKind;renderedStepsKey='';
  const def=defaultValues(kind),choices=defaultChoices(kind),spec=kinds[kind];
  const group=$('fields');group.replaceChildren();
  for(const [id,label] of spec.fields.concat([['filletRadius','连接圆弧半径',spec.radius]])){
   const wrapper=document.createElement('label');wrapper.textContent=label;
   const entry=document.createElement('input');entry.type='number';entry.step='any';
   entry.id='geo-'+id;entry.value=String(def[id]);entry.inputMode='decimal';
   entry.addEventListener('input',()=>{
    fieldReview?.edited(id);
    recompute();
   });
   wrapper.append(entry);group.append(wrapper);
  }
  fieldReview?.setKind(kind);
  choiceOptions($('direction'),['cw','ccw'],choices.direction);
  $('travel1Label').textContent=spec.travels[0][1];
  $('travel2Label').textContent=spec.travels[1][1];
  choiceOptions($('travel1'),spec.travels[0][2],choices[spec.travels[0][0]]);
  choiceOptions($('travel2'),spec.travels[1][2],choices[spec.travels[1][0]]);
  $('branch').replaceChildren(option('','请选择候选圆心'));
  $('branch').value='';
  refreshCandidates(choices.branchId);
  const current=input();
  // The controller always starts from known structured math, but a strict
  // source-review mode immediately invalidates that temporary preview.
  const initial=current||buildConfirmedInput(kind,def,choices,0);
  session=createConfirmedFilletSession(initial,{now:performance.now(),
   speed:Number($('speed').value)});
  const snapshot=current?session.snapshot(performance.now()):
   session.replace(null,{expectedRevision:session.revision,now:performance.now()});
  draw(snapshot);
 }
 function refreshCandidates(preference){
  const b=$('branch'),wanted=preference??b.value;
  let candidates=[];
  try{
   const parsed=input();
   if(parsed)candidates=solveFiniteFillet(parsed.problem).candidates;
  }catch(_){/* invalid input has no valid mathematical candidates */}
  b.replaceChildren(option('','请选择候选圆心'));
  for(const c of candidates)
   b.append(option(c.branchId,c.branchId+'：('+
    fmt(c.center.x)+', '+fmt(c.center.y)+') mm'));
  b.value=candidates.some(c=>c.branchId===wanted)?wanted:'';
 }
 function recompute(){
  if(!session)return;
  localVector?.markFormEdited();
  stopClock();
  refreshCandidates();
  const current=input(),old=session.revision;
  const next=session.replace(current,{expectedRevision:old,now:performance.now()});
  renderedStepsKey='';draw(next);
 }
 function grid(){
  const g=$('grid');g.replaceChildren(svg('rect',
   {width:720,height:440,fill:'white'}));
  for(let x=0;x<=720;x+=40)g.append(svg('line',{x1:x,y1:0,x2:x,y2:440,
   stroke:'#edf3ee','stroke-width':1}));
  for(let y=0;y<=440;y+=40)g.append(svg('line',{x1:0,y1:y,x2:720,y2:y,
   stroke:'#edf3ee','stroke-width':1}));
 }
 function givens(){
  const g=$('givens');g.replaceChildren();
  let current;
  try{current=input();}catch(_){return;}
  if(!current)return;
  const geometry=current.problem.geometry,drawLine=s=>{
   const a=map(s.a),b=map(s.b);
   g.append(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
    stroke:'#26764c','stroke-width':2.5,'data-drawing':'given'}));
  };
  const drawCircle=c=>{
   const center=map(c.center);
   g.append(svg('circle',{cx:center.x,cy:center.y,r:c.radius*sheet.scale,
    fill:'none',stroke:'#26764c','stroke-width':2.5,'data-drawing':'given'}));
  };
  if(kind==='two-segments'){drawLine(geometry.first);drawLine(geometry.second);}
  else if(kind==='segment-circle'){drawLine(geometry.segment);drawCircle(geometry.circle);}
  else{drawCircle(geometry.first);drawCircle(geometry.second);}
 }
 function steps(plan,index,revision){
  const key=revision+':'+index+':'+plan.steps.length;
  if(key===renderedStepsKey)return;
  renderedStepsKey=key;
  const list=$('stepList');list.replaceChildren();
  for(const [i,step] of plan.steps.entries()){
   const btn=document.createElement('button');btn.type='button';
   btn.textContent=(i+1)+' · '+(step.title||step.explanation||step.id);
   if(index===i)btn.setAttribute('aria-current','step');
   btn.addEventListener('click',()=>{
    stopClock();
    draw(session.seekStep(i,performance.now()));
   });
   list.append(btn);
  }
 }
 function draw(snap){
  const result=snap.plan;
  const verified=snap.ready&&result.mathematicallyVerified===true&&
   session.canRender(snap.revision)&&snap.playback?.revision===snap.revision;
  const status=$('status');
  const messages={
   ready:'已通过真实数学计算与双端 G1 验证。可播放逐笔作图。',
   'requires-branch':'存在多个有效圆心，请选择需要的候选解分支。',
   'requires-direction':'请选择连接弧的顺时针或逆时针方向。',
   'requires-travel':'必须确认两侧原轮廓的行进方向。',
   'invalid-input':'当前几何尺寸无效，旧动画已清空。',
   blocked:'条件冲突、无解或未通过有向相切验证，禁止展示旧答案。'
  };
  status.setAttribute('aria-invalid',verified?'false':'true');
  status.textContent=(messages[snap.status]||'当前不可生成验证动画。')+
   (result.reason?' '+result.reason:'');
  $('paperWrap').classList.toggle('mono',$('monochrome').value==='mono');
  givens();
  const drawing=$('drawing');drawing.replaceChildren();
  if(verified){
   const fractions=snap.playback.actionFractions;
   for(const [i,step] of result.steps.entries()){
    for(const a of step.actions){
     const f=fractions[a.id]??0;if(!(f>0))continue;
     const tag=a.kind==='line'?'line':a.kind==='arc'?'path':'circle';
     const node=svg(tag,{fill:a.kind==='point'?'#bb8d3f':'none',
      stroke:step.role==='result'?'#266da8':'#bd9046',
      'stroke-width':step.role==='result'?3.2:1.8,
      'stroke-linecap':'round','data-drawing':'derived',
      ...(step.role==='result'?{'data-result':'true'}:{}),
      'data-action':a.id});
     Motion.updateSvg(node,a,f);
     node.addEventListener('click',()=>{
      stopClock();draw(session.seekStep(i,performance.now()));
     });
     drawing.append(node);
    }
   }
  }
  const active=verified?(snap.playback.activeStepIndex>=0?snap.playback.activeStepIndex:0):0;
  steps(verified?result:{steps:[]},active,snap.revision);
  $('stepDetail').textContent=verified?
   (result.steps[active]?.explanation||result.steps.at(-1)?.explanation||'数学验证通过'):
   '条件未通过数学验证，暂不绘制辅助线及答案。';
  const proof=result.typedMathEvidence;
  $('result').hidden=!verified;
  if(verified&&proof)$('result').textContent='当前 revision '+snap.revision+
   ' · 圆心 ('+fmt(proof.center.x)+', '+fmt(proof.center.y)+') mm'+
   ' · 连接半径 '+fmt(result.originalLesson.result.arc.radius)+' mm'+
   ' · 最大残差 '+fmt(proof.maxResidualMm)+' mm'+
   ' · 所选分支 '+proof.branchId+' · 已校验 G1。';
  const frac=verified?snap.playback.ratio:0;
  $('progress').value=String(Math.round(frac*1000));
  $('progressText').textContent=Math.round(frac*100)+'%';
  $('play').textContent=verified&&snap.playback.playing?'Ⅱ 暂停':'▶ 播放';
  for(const id of ['play','prev','next','restart','progress'])$(id).disabled=!verified;
 }
 function tick(){
  raf=null;
  if(!session)return;
  const snap=session.snapshot(performance.now());draw(snap);
  if(snap.playback?.playing&&!snap.playback.done)raf=requestAnimationFrame(tick);
 }
 function animate(){
  stopClock();raf=requestAnimationFrame(tick);
 }
 $('kind').addEventListener('change',()=>buildFields($('kind').value));
 for(const id of controlNames)$(id).addEventListener('change',recompute);
 $('speed').addEventListener('change',()=>{
  if(!session)return;
  const snap=session.setSpeed(Number($('speed').value),performance.now());
  draw(snap);if(snap.playback?.playing)animate();
 });
 $('monochrome').addEventListener('change',()=>draw(session.snapshot(performance.now())));
 $('play').addEventListener('click',()=>{
  stopClock();let snap=session.snapshot(performance.now());
  snap=snap.playback?.playing?session.pause(performance.now()):session.play(performance.now());
  draw(snap);if(snap.playback?.playing)animate();
 });
 $('prev').addEventListener('click',()=>{
  stopClock();const snap=session.snapshot(performance.now());
  draw(session.seekStep(Math.max(0,snap.playback.activeStepIndex-1),performance.now()));
 });
 $('next').addEventListener('click',()=>{
  stopClock();const snap=session.snapshot(performance.now());
  draw(session.seekStep(Math.min(snap.plan.steps.length,
   Math.max(0,snap.playback.activeStepIndex)+1),performance.now()));
 });
 $('restart').addEventListener('click',()=>{
  stopClock();draw(session.seekProgress(0,performance.now()));
 });
 $('progress').addEventListener('input',()=>{
  stopClock();draw(session.seekProgress(Number($('progress').value)/1000,performance.now()));
 });
 attachLocalImagePreview({input:$('problemPhoto'),image:$('photoPreview'),
  status:$('photoStatus'),clear:$('clearPhoto')});
 fieldReview=attachImageFieldReview({
  image:$('photoPreview'),photoInput:$('problemPhoto'),
  photoClear:$('clearPhoto'),mode:$('sourceReviewEnabled'),
  overlay:$('sourceOverlay'),fieldSelect:$('sourceField'),
  confirmButton:$('confirmSource'),acceptButton:$('acceptSources'),
  status:$('sourceStatus'),values,onUpdate:()=>{
   if(session)recompute();
  }
 });
 attachLocalLineCandidates({
  image:$('photoPreview'),photoInput:$('problemPhoto'),
  photoClear:$('clearPhoto'),run:$('detectLines'),
  clear:$('clearLines'),overlay:$('detectedLineOverlay'),
  status:$('lineStatus')
 });
 attachLocalCurveCandidates({
  image:$('photoPreview'),photoInput:$('problemPhoto'),
  photoClear:$('clearPhoto'),run:$('detectCurves'),
  clear:$('clearCurves'),overlay:$('detectedCurveOverlay'),
  status:$('curveStatus')
 });
 grid();buildFields(kind);
 localVector=attachLocalVectorReview({
  file:$('vectorSvg'),kind:$('kind'),first:$('vectorFirst'),
  second:$('vectorSecond'),mmPerPx:$('vectorMmPerPx'),
  originX:$('vectorOriginX'),originY:$('vectorOriginY'),
  yAxis:$('vectorYAxis'),filletRadiusMm:$('vectorFilletRadius'),
  accepted:$('vectorAccept'),apply:$('vectorApply'),
  status:$('vectorStatus'),preview:$('vectorPreview'),
  onApply:result=>{
   for(const [field,value] of Object.entries(result.fields)){
    const input=$('geo-'+field);
    if(!input)throw new RangeError('missing current numeric field '+field);
    input.value=String(value);
    fieldReview?.edited(field);
   }
   // A valid source does not choose a mathematically legitimate branch/G1 sweep.
   for(const field of ['branch','direction','travel1','travel2'])$(field).value='';
   recompute(); // #248 session invalidates the old verified timeline before solving.
  }
 });
 window.addEventListener('pagehide',()=>localVector?.release());
})();
