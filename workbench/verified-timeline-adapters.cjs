'use strict';
/**
 * DA-07 verified V5 consumer adapters.
 * Only read DA-02/03 validated solver outputs; never manufacture a
 * mathematical solution, candidate branch, or residual from UI animation.
 */
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {chooseDirectedFillet}=require('../engines/planar/directed-circle-fillet.cjs');
const {chooseFiniteTwoSegmentArc}=require('../engines/planar/directed-two-segment-fillet.cjs');
const Motion=require('./teaching-motion-v5.js');
const Timeline=require('./teaching-timeline-v5.js');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const pt=p=>p&&finite(p.x)&&finite(p.y);
const validRevision=x=>Number.isSafeInteger(x)&&x>=0;
function transform(sheet){
 if(!sheet||!pt(sheet.origin)||!finite(sheet.scale)||sheet.scale<=0)
  throw new TypeError('sheet transform must have finite origin and positive px/mm');
 const map=p=>{
  if(!pt(p))throw new TypeError('non-finite verified model point');
  const v={x:sheet.origin.x+sheet.scale*p.x,y:sheet.origin.y-sheet.scale*p.y};
  if(!pt(v))throw new RangeError('sheet coordinate overflow');
  return v;
 };
 return map;
}
function action(id,kind,geometry){return {id,kind,geometry};}
function step(id,title,explanation,actions,dependsOn=[]){
 return {id,title,explanation,dependsOn,actions};
}
function ready(plan){
 const timing=Timeline.compileTimeline(plan.steps);
 return {...plan,timing,mathematicallyVerified:true};
}
function rejection(result,revision,source){
 return {status:'not-verified',source,revision,reason:result?.reason||'solver rejected or withheld solution',
  steps:[],mathematicallyVerified:false};
}
function projectionPlan(args={},revision=0){
 if(!validRevision(revision))throw new TypeError('invalid revision');
 const r=solveProjection(args);
 if(r.status!=='unique'||r.globallyUnique!==true||r.solutionCount!==1||
    r.degrees!==0||r.proofLevel!=='linear-algebra'||!pt(r.sheet?.W)||
    !Array.isArray(r.steps)||r.steps.length!==4||r.steps.some(s=>
      s.source!=='computed-first-angle-guides'||s.unit!=='px'||s.style!=='auxiliary'||
      !pt(s.from)||!pt(s.to)||!finite(s.from.x)||!finite(s.to.x)))
  return rejection(r,revision,'03-validated-first-angle');
 const steps=r.steps.map((s,i)=>step(s.id,
    ['V/H 联系线','正侧高度联系线','45° 深度转移','深度转至侧面'][i],
    s.explanation,[action(s.id,'line',{from:s.from,to:s.to})],s.dependsOn));
 const givens=(r.knownViews||[]).map(name=>({
   id:'given-'+name,kind:'point',geometry:{center:{...r.sheet[name]},radius:5},role:'given',name
 }));
 const missing=['V','H','W'].filter(name=>!r.knownViews.includes(name));
 if(missing.length===1){
   const name=missing[0];
   steps.push(step('third-view','标记'+name+' 面投影',
    '此投影点来自经数学验证的空间唯一解；不是根据动画位置猜测。',
    [action('result-'+name,'point',{center:{...r.sheet[name]},radius:5})],
    [steps.at(-1).id]));
 }
 return ready({status:'ready',source:'03-validated-first-angle',revision,givens,
   solverStatus:r.status,resultRef:r.resultId,steps,
   diagnostic:'第一角 V/H/W 投影与 45° 深度联系线，保留真实求解器的线性约束证明',
   residualMm:r.maxResidual});
}
function sourceCircles(steps,sheet){
 const loci=steps?.[0]?.circles;
 if(!Array.isArray(loci)||loci.length!==2)return null;
 const map=transform(sheet);
 return loci.map((c,i)=>{
  if(!pt(c.center)||!finite(c.radius)||c.radius<=0)throw new TypeError('invalid verified auxiliary circle');
  const radius=c.radius*sheet.scale;
  if(!finite(radius)||radius<=0)throw new RangeError('auxiliary radius overflow');
  return action('locus-'+(i+1),'circle',{center:map(c.center),radius});
 });
}
function circleFilletPlan(args={},sheet={origin:{x:360,y:220},scale:8},revision=0){
 if(!validRevision(revision))throw new TypeError('invalid revision');
 const r=chooseDirectedFillet(args);
 if(r.status!=='selected'||r.g1Verified!==true||!r.geometry||
    r.geometry.kind!=='arc'||r.geometry.unit!=='mm'||
    !pt(r.center)||!pt(r.contacts?.first)||!pt(r.contacts?.second)||
    !finite(r.maxTangencyResidual)||r.maxTangencyResidual>1e-6||
    !finite(r.maxG1Mismatch)||r.maxG1Mismatch>1e-7||
    r.selectedId!==args.branchId||
    !Array.isArray(r.steps)||r.steps.length!==4)
  return rejection(r,revision,'02-verified-directed-circles');
 const loci=sourceCircles(r.steps,sheet);
 if(!loci)return rejection(r,revision,'02-verified-directed-circles');
 const map=transform(sheet);
 const arc=Motion.projectArcFromVerifiedModel(r.geometry.data,sheet);
 const steps=[
  step('loci','构造圆心轨迹',r.steps[0].reason,loci),
  step('center','交点确定候选圆心',r.steps[1].reason,
    [action('selected-center','point',{center:map(r.center),radius:4.5})],['loci']),
  step('contacts','确定相切点',r.steps[2].reason,[
    action('contact-first','point',{center:map(r.contacts.first),radius:4}),
    action('contact-second','point',{center:map(r.contacts.second),radius:4})],['center']),
  step('fillet','绘制经验证的有向连接圆弧',r.steps[3].reason,
    [action('verified-arc','arc',arc)],['contacts'])
 ];
 return ready({status:'ready',source:'02-verified-directed-circles',revision,selectedBranchId:r.selectedId,
  solverStatus:r.status,steps,residualMm:r.maxTangencyResidual,g1Residual:r.maxG1Mismatch,
  diagnostic:'显式分支 + 顺逆方向 + 已知轮廓双侧有向 G1 验证通过'});
}
function segmentFilletPlan(args={},sheet={origin:{x:360,y:220},scale:8},revision=0){
 if(!validRevision(revision))throw new TypeError('invalid revision');
 const r=chooseFiniteTwoSegmentArc(args);
 if(r.status!=='selected'||r.g1Verified!==true||r.finiteArcSweepVerified!==true||
    !r.geometry||r.geometry.kind!=='arc'||r.selectedId!==args.branchId||
    !finite(r.maxTangencyResidual)||r.maxTangencyResidual>1e-6||
    !finite(r.maxG1Mismatch)||r.maxG1Mismatch>1e-7||
    !Array.isArray(r.steps)||r.steps.length<2)
  return rejection(r,revision,'02-verified-directed-segments');
 const map=transform(sheet),steps=[],originSteps=r.steps;
 for(const source of originSteps){
  const acts=[];
  if(source.kind==='offset-line'&&source.geometry&&
      pt(source.geometry.a)&&pt(source.geometry.b))
   acts.push(action('action-'+source.id,'line',
    {from:map(source.geometry.a),to:map(source.geometry.b)}));
  if(source.kind==='directed-arc'&&source.geometry?.data)
   acts.push(action('action-'+source.id,'arc',
    Motion.projectArcFromVerifiedModel(source.geometry.data,sheet)));
  const prev=steps.length?steps.at(-1).id:null;
  steps.push(step(source.id,source.kind||'几何构造',source.reason||'数学步骤',acts,prev?[prev]:[]));
 }
 return ready({status:'ready',source:'02-verified-directed-segments',revision,
  selectedBranchId:r.selectedId,solverStatus:r.status,steps,
  residualMm:r.maxTangencyResidual,g1Residual:r.maxG1Mismatch,
  diagnostic:'两个有限线段的候选、切点、截断线、旋向与双侧 G1 已验证'});
}
module.exports={projectionPlan,circleFilletPlan,segmentFilletPlan};
