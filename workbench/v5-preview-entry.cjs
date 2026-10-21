'use strict';
/* DA-07 isolated V5 preview. Bundled locally with esbuild; never in public dist. */
const MathAdapter=require('./verified-timeline-adapters.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const Motion=require('./teaching-motion-v5.js');
const {circleCircleFilletCenters}=require('../engines/planar/circle-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../engines/planar/two-segment-fillet.cjs');
const $=id=>document.getElementById(id);
const svgNS='http://www.w3.org/2000/svg';
const color={given:'#237a53',auxiliary:'#c89143',result:'#2d80b9'};
const origin={x:260,y:235},scale=8;
let revision=0,plan=null,player=null,nodes=new Map(),candidateSignature='',loopId=null;
let viewBox={x:0,y:0,width:720,height:440},lastTick=null;
const now=()=>performance.now();
const reduced=()=>Boolean($('reduce').checked||window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const svg=(tag,attributes={})=>{
 const el=document.createElementNS(svgNS,tag);
 for(const [key,value] of Object.entries(attributes))el.setAttribute(key,String(value));
 return el;
};
function safeNumber(key){
 const field=document.querySelector('[data-parameter="'+key+'"]');
 if(!field||field.value.trim()===''||!Number.isFinite(field.valueAsNumber))
  throw new TypeError('请填写有效数字：'+(field?.parentElement?.textContent?.trim()||key));
 return field.valueAsNumber;
}
const modelToSheet=p=>({x:origin.x+p.x*scale,y:origin.y-p.y*scale});
const caseName=()=>$('case').value;
function readBase(){
 if(caseName()==='projection')
  return {knownViews:{V:[safeNumber('vu'),safeNumber('vv')],
    H:[safeNumber('hu'),safeNumber('hv')]},
    sheetTransform:{origin:{x:360,y:172},scale:7}};
 if(caseName()==='circle')
  return {first:{center:{x:safeNumber('x1'),y:safeNumber('y1')},radius:safeNumber('r1')},
   second:{center:{x:safeNumber('x2'),y:safeNumber('y2')},radius:safeNumber('r2')},
   filletRadius:safeNumber('rf'),firstMode:'external',secondMode:'external'};
 return {first:{a:{x:safeNumber('a1x'),y:safeNumber('a1y')},
    b:{x:safeNumber('b1x'),y:safeNumber('b1y')}},
   second:{a:{x:safeNumber('a2x'),y:safeNumber('a2y')},
    b:{x:safeNumber('b2x'),y:safeNumber('b2y')}},
   filletRadius:safeNumber('rf')};
}
function updateSelect(select,options,previous){
 select.replaceChildren();
 const blank=document.createElement('option');blank.value='';blank.textContent='请选择真实候选';
 select.append(blank);
 for(const id of options){
  const option=document.createElement('option');option.value=id;option.textContent=id;select.append(option);
 }
 select.value=options.includes(previous)?previous:'';
}
function readFull(base){
 if(caseName()==='projection')return base;
 const branchId=$('branch').value,direction=$('direction').value;
 const a=$('travel1').value,b=$('travel2').value;
 return {...base,...(branchId?{branchId}:{}),...(direction?{direction}:{}),
  ...(a?{[caseName()==='circle'?'knownFirstTravel':'firstTravel']:a}:{}),
  ...(b?{[caseName()==='circle'?'knownSecondTravel':'secondTravel']:b}:{})};
}
function resetTravelUI(){
 const labels=[...document.querySelectorAll('#arcOptions>label')];
 const circle=caseName()==='circle';
 const options=circle?[['','请选择'],['cw','顺时针 CW'],['ccw','逆时针 CCW']]:
  [['','请选择'],['forward','由起点向终点'],['reverse','由终点向起点']];
 for(const [idx,id] of ['travel1','travel2'].entries()){
  const sel=$(id);sel.replaceChildren();
  for(const [value,name] of options){
   const o=document.createElement('option');o.value=value;o.textContent=name;sel.append(o);
  }
  sel.value='';if(labels[idx+3])labels[idx+3].firstChild.textContent='轮廓 '+(idx+1)+' 走向';
 }
 $('branch').value='';$('direction').value='';
}
function stopLoop(){if(loopId!==null)cancelAnimationFrame(loopId);loopId=null;lastTick=null;}
function appendGrid(){
 const bg=$('background');bg.replaceChildren();
 bg.append(svg('rect',{width:720,height:440,fill:'#ffffff'}));
 for(let x=30;x<720;x+=30)bg.append(svg('line',{x1:x,y1:0,x2:x,y2:440,stroke:'#edf3ee','stroke-width':.6}));
 for(let y=20;y<440;y+=30)bg.append(svg('line',{x1:0,y1:y,x2:720,y2:y,stroke:'#edf3ee','stroke-width':.6}));
}
function addShape(group,id,kind,geometry,role,stepIndex){
 const tag=kind==='arc'?'path':kind==='line'?'line':'circle';
 const attrs={'data-role':role,'data-action-id':id,
  fill:kind==='point'?color[role]:'none',stroke:color[role],
  'stroke-width':kind==='point'?0:role==='result'?3.4:role==='auxiliary'?2.1:2.5,
  'stroke-linecap':'round','stroke-linejoin':'round'};
 const el=svg(tag,attrs);
 if(role==='auxiliary'&&kind==='line')el.setAttribute('stroke-dasharray','6 4');
 Motion.updateSvg(el,{kind,geometry},role==='given'?1:0);
 if(stepIndex!==undefined){
  el.setAttribute('tabindex','0');el.setAttribute('role','button');
  el.setAttribute('aria-label','定位到第 '+(stepIndex+1)+' 步的图元 '+id);
  const jump=()=>jumpTo(stepIndex+1);
  el.addEventListener('click',jump);
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();jump();}});
 }
 group.append(el);return el;
}
function renderKnown(base){
 const group=$('givens');group.replaceChildren();
 if(caseName()==='projection'){
  // Screen given locations are provided by 03's verified sheet projection.
  for(const given of plan?.givens||[])
   addShape(group,given.id,'point',given.geometry,'given');
 }else if(caseName()==='circle'){
  for(const [k,c] of [['source-1',base.first],['source-2',base.second]]){
   const radius=c.radius*scale;
   if(Number.isFinite(radius)&&radius>0)
    addShape(group,k,'circle',{center:modelToSheet(c.center),radius},'given');
  }
 }else{
  for(const [k,line] of [['source-1',base.first],['source-2',base.second]])
   addShape(group,k,'line',{from:modelToSheet(line.a),to:modelToSheet(line.b)},'given');
 }
}
function renderNewPlan(base){
 appendGrid();renderKnown(base);$('drawings').replaceChildren();nodes=new Map();
 if(!plan||plan.status!=='ready')return;
 for(const s of plan.steps){
  for(const action of s.actions){
   const role=action.kind==='arc'||action.id.startsWith('result-')?'result':'auxiliary';
   const node=addShape($('drawings'),action.id,action.kind,action.geometry,role);
   nodes.set(action.id,node);
   // Only verified actions are clickable. No fake center or candidate is fabricated.
   const i=plan.steps.findIndex(v=>v.id===s.id);
   node.setAttribute('tabindex','0');node.setAttribute('role','button');
   node.setAttribute('aria-label','定位到第 '+(i+1)+' 步：'+s.title);
   node.addEventListener('click',()=>jumpTo(i+1));
   node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();jumpTo(i+1);}});
  }
 }
}
function makeSteps(){
 const list=$('stepList');list.replaceChildren();
 if(!plan||plan.status!=='ready')return;
 plan.steps.forEach((s,i)=>{
  const b=document.createElement('button');b.type='button';b.dataset.step=String(i);
  const count=document.createElement('span');count.className='step-count';count.textContent=String(i+1).padStart(2,'0');
  const title=document.createElement('span');
  const strong=document.createElement('strong');strong.textContent=s.title;
  const sm=document.createElement('small');sm.textContent=s.actions.length+' 个动态图元';
  title.append(strong,sm);b.append(count,title);
  b.addEventListener('click',()=>jumpTo(i+1));list.append(b);
 });
}
function recompute({resetBranch=false}={}){
 stopLoop();
 if(player)player.invalidate(revision+1,now());
 revision+=1;plan=null;player=null;candidateSignature='';
 const mode=caseName();
 $('projectionFields').hidden=mode!=='projection';
 $('filletFields').hidden=mode!=='circle';
 $('segmentFields').hidden=mode!=='segments';
 $('arcOptions').hidden=mode==='projection';
 try{
  const base=readBase();
  if(mode!=='projection'){
   const raw=mode==='circle'?circleCircleFilletCenters(base):finiteTwoSegmentFillets(base);
   const ids=(raw.candidates||[]).map(c=>c.id);
   updateSelect($('branch'),ids,resetBranch?'':$('branch').value);
   candidateSignature=ids.join(',');
  }
  const args=readFull(base);
  plan=mode==='projection'?MathAdapter.projectionPlan(args,revision):
   mode==='circle'?MathAdapter.circleFilletPlan(args,{origin,scale},revision):
    MathAdapter.segmentFilletPlan(args,{origin,scale},revision);
  if(plan.status==='ready')player=Timeline.createPlayer(plan.timing,{
    speed:Number($('speed').value),revision});
  $('gate').classList.toggle('warn',!player);
  $('gate').textContent=player?
   '数学验证通过。'+(plan.diagnostic||'')+' 可以播放或跳转步骤。':
   '数学结果尚未满足播放门槛：'+(plan?.reason||'无法生成验证步骤')+'。请选择完整合法条件。';
  $('source').textContent=plan?.source||'—';
  $('residual').textContent=player&&Number.isFinite(plan.residualMm)?
   plan.residualMm.toExponential(2)+' mm':'未计算';
  renderNewPlan(base);makeSteps();
 }catch(error){
  $('gate').classList.add('warn');$('gate').textContent='输入或几何条件无效：'+(error.message||'请核对数据');
  $('source').textContent='—';$('residual').textContent='未计算';
  $('stepList').replaceChildren();appendGrid();$('givens').replaceChildren();$('drawings').replaceChildren();
  nodes.clear();
 }
 viewBox={x:0,y:0,width:720,height:440};$('paper').setAttribute('viewBox','0 0 720 440');
 refresh(now());
}
function bounds(action){
 if(!action)return null;
 const g=action.geometry,kind=action.kind;
 if(kind==='line')return {minX:Math.min(g.from.x,g.to.x),maxX:Math.max(g.from.x,g.to.x),
   minY:Math.min(g.from.y,g.to.y),maxY:Math.max(g.from.y,g.to.y)};
 if(kind==='point')return {minX:g.center.x-15,maxX:g.center.x+15,
   minY:g.center.y-15,maxY:g.center.y+15};
 if(kind==='circle'||kind==='arc')return {minX:g.center.x-g.radius,maxX:g.center.x+g.radius,
   minY:g.center.y-g.radius,maxY:g.center.y+g.radius};
 return null;
}
function refresh(timestamp){
 const s=player?player.snapshot(timestamp):null;
 const ready=!!player&&!s.invalid;
 const active=ready?s.activeActionId:null;
 const actionById=new Map((plan?.steps||[]).flatMap(st=>st.actions.map(a=>[a.id,a])));
 for(const [id,node] of nodes){
  const action=actionById.get(id),frac=ready?s.actionFractions[id]||0:0;
  Motion.updateSvg(node,action,frac);
  node.setAttribute('data-active',String(id===active));
  const highlighted=active===id;
  node.setAttribute('stroke-width',
    action.kind==='point'?0:highlighted?4.2:action.kind==='arc'?3.4:2.1);
 }
 const full=ready&&s.done,stepIndex=ready?s.activeStepIndex:-1;
 for(const node of $('stepList').children){
  const idx=Number(node.dataset.step);
  if(idx===stepIndex)node.setAttribute('aria-current','step');
  else node.removeAttribute('aria-current');
 }
 $('counter').textContent=ready?(stepIndex+1)+' / '+plan.steps.length:'0 / 0';
 const step=ready?plan.steps[Math.max(stepIndex,0)]:null;
 $('stepTitle').textContent=step?step.title:'尚未获得已验证的播放计划';
 $('stepText').textContent=step?step.explanation:'请检查输入、候选解及走向；数学未通过时不会渲染结果步骤。';
 $('play').textContent=ready&&s.playing?'Ⅱ 暂停':'▶ 播放';
 $('play').disabled=!ready||full||reduced();
 $('prev').disabled=!ready||s.elapsedMs<=0;
 $('next').disabled=!ready||full;
 $('restart').disabled=!ready||s.elapsedMs<=0;
 $('progress').disabled=!ready;$('progress').value=ready?String(Math.round(1000*s.ratio)):'0';
 $('progressText').value=ready?Math.round(s.ratio*100)+'%':'0%';
 $('time').textContent=ready?(s.elapsedMs/1000).toFixed(1)+' / '+(s.totalMs/1000).toFixed(1)+' 秒':'0.0 / 0.0 秒';
 let target={x:0,y:0,width:720,height:440};
 if(ready&&$('focus').checked){
  const currentAction=actionById.get(active)||
   [...plan.timing.segments].reverse().find(a=>s.actionFractions[a.id]>0);
  const b=bounds(actionById.get(currentAction?.id||currentAction?.id));
  if(b)target=Motion.focus(b,{width:720,height:440,zoom:1.2});
 }
 const elapsed=lastTick===null?16:Math.max(0,timestamp-lastTick);lastTick=timestamp;
 viewBox=Motion.cameraTowards(viewBox,target,elapsed,170,reduced());
 $('paper').setAttribute('viewBox',[viewBox.x,viewBox.y,viewBox.width,viewBox.height].join(' '));
 return ready&&s.playing||Object.keys(viewBox).some(k=>Math.abs(viewBox[k]-target[k])>.2);
}
function animate(timestamp){
 loopId=null;
 if(refresh(timestamp))loopId=requestAnimationFrame(animate);
}
function schedule(){if(loopId===null)loopId=requestAnimationFrame(animate);}
function jumpTo(count){
 if(!player)return;
 player.seekStep(count,now());schedule();
}
function changeStep(dir){
 if(!player)return;
 const s=player.snapshot(now());
 const boundaries=[0,...plan.timing.steps.map(x=>x.endMs)];
 let idx=boundaries.findIndex(t=>t>=s.elapsedMs-1e-8);
 if(idx<0)idx=boundaries.length-1;
 if(dir>0&&boundaries[idx]<=s.elapsedMs+1e-8)idx=Math.min(idx+1,boundaries.length-1);
 else if(dir<0&&boundaries[idx]>=s.elapsedMs-1e-8)idx=Math.max(idx-1,0);
 player.seekMs(boundaries[idx],now());schedule();
}
$('case').addEventListener('change',()=>{resetTravelUI();recompute({resetBranch:true});});
for(const input of document.querySelectorAll('[data-parameter]'))
 input.addEventListener('input',()=>recompute({resetBranch:true}));
for(const id of ['branch','direction','travel1','travel2'])
 $(id).addEventListener('change',()=>recompute());
$('recalculate').addEventListener('click',()=>recompute());
$('play').addEventListener('click',()=>{
 if(!player)return;const ts=now(),s=player.snapshot(ts);
 if(s.playing)player.pause(ts);else if(!reduced())player.play(ts);schedule();
});
$('prev').addEventListener('click',()=>changeStep(-1));
$('next').addEventListener('click',()=>changeStep(1));
$('restart').addEventListener('click',()=>{if(player){player.seekMs(0,now());schedule();}});
$('speed').addEventListener('change',()=>{if(player)player.setSpeed(Number($('speed').value),now());schedule();});
$('progress').addEventListener('input',()=>{
 if(player){player.seekProgress(Number($('progress').value)/1000,now());schedule();}
});
for(const id of ['focus','paperMode','reduce'])$(id).addEventListener('change',()=>{
 document.body.classList.toggle('paper-mode',$('paperMode').checked);
 if(reduced()&&player)player.pause(now());
 schedule();
});
const motionPref=window.matchMedia('(prefers-reduced-motion: reduce)');
motionPref.addEventListener?.('change',()=>{
 if(reduced()&&player)player.pause(now());schedule();
});
document.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||e.target?.matches?.('input,select,button,textarea'))return;
 if(e.key==='ArrowRight'){e.preventDefault();changeStep(1);}
 if(e.key==='ArrowLeft'){e.preventDefault();changeStep(-1);}
 if(e.key===' '){e.preventDefault();$('play').click();}
});
recompute();
