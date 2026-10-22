'use strict';
/**
 * DA-07 V5 synchronized teaching reveal for a single affine-constrained point.
 * This is a READ-ONLY presentation consumer of DrawingLabState.compute() and
 * DrawingLabGeometry.transfer(). No new constraints, solutions or guesses.
 * The fixed solids are reference objects, not movable constraint bodies.
 */
const G=require('../labs/dof-lab-geometry.js');
const T=require('./teaching-timeline-v5.js');
const Motion=require('./teaching-motion-v5.js');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const xyz=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const xy=p=>p&&finite(p.x)&&finite(p.y);
const guideIds=['VH','height-VW','depth-HM','depth-MW'];
const describe=[
 '沿正面 V 与水平 H 的同名 x 坐标绘制联系线',
 '沿正面 V 与侧面 W 的同名高度绘制水平联系线',
 '由 H 的深度沿 45° 转移线方向画出辅助线',
 '从 45° 深度转移点向 W 延伸联系线'
];
const notReady=reason=>({status:'blocked',reason,steps:[],timeline:null,degreeStatus:'blocked'});
function build(report,{revision=0}={}){
 if(!Number.isSafeInteger(revision)||revision<0)throw new TypeError('invalid geometry input revision');
 const result=report?.analysis?.result;
 if(!result||typeof result!=='object'||!Number.isInteger(result.degrees)&&!result.inconsistent)
  return notReady('未获得有效的线性约束求解结果');
 if(result.inconsistent)return notReady('约束互相矛盾，没有可行空间点或投影点');
 if(result.degrees<0||result.degrees>3||!xyz(report?.point?.example)||
     report.point.kind=== 'none'||report.point.degrees!==result.degrees||
     report.point.exampleIsUnique!==(result.degrees===0))
  return notReady('数学结果与示例点的自由度声明不一致');
 const P={...report.point.example},projections=G.transfer(P);
 if(!projections.guide||projections.guide.length!==4||
     guideIds.some((id,i)=>projections.guide[i].kind!==id)||
     !Object.values(projections.checks).every(v=>v===true))
  return notReady('第一角 V/H/W 关系或 45° 转移检验未通过');
 const steps=guideIds.map((id,i)=>{
  const geometry={from:{...projections.guide[i].from},to:{...projections.guide[i].to}};
  if(!xy(geometry.from)||!xy(geometry.to))throw new TypeError('non-finite verified guide');
  return {id:'step-'+(i+1),title:describe[i],kind:'auxiliary',
   dependsOn:i?['step-'+i]:[],
   actions:[{id:'guide-'+(i+1),kind:'line',geometry,durationMs:720}]};
 });
 steps.push({id:'step-5',title:result.degrees===0?
    '同步显示唯一空间点 P 与 V/H/W 投影':
    '同步显示一个可行示例点 P* 与 V/H/W 投影（非唯一解）',
   kind:'result-reveal',dependsOn:['step-4'],
   actions:[{id:'target-reveal',kind:'point',
     geometry:{center:{...projections.points.V},radius:5},durationMs:740}]});
 const timeline=T.compileTimeline(steps,{gapMs:125});
 return Object.freeze({status:'ready',revision,modelPoint:Object.freeze(P),
  sheetPoints:projections.points,guides:projections.guide,
  timeline,steps,degreeStatus:result.degrees===0?'unique':'sample',
  degrees:result.degrees,
  label:result.degrees===0?'P（唯一确定的空间点）':
    'P*（满足约束的一个示例位置，不代表唯一解）'});
}
function presentation(plan,snapshot){
 if(plan?.status!=='ready'||!snapshot||snapshot.invalid||snapshot.revision!==plan.revision)
  return {ready:false,guideFractions:[0,0,0,0],targetOpacity:0};
 const f=plan.steps.slice(0,4).map(s=>{
  const n=snapshot.actionFractions[s.actions[0].id];
  return finite(n)?Math.max(0,Math.min(1,n)):0;
 });
 const n=snapshot.actionFractions['target-reveal'];
 return {ready:true,guideFractions:f,targetOpacity:finite(n)?Math.max(0,Math.min(1,n)):0,
  degreeStatus:plan.degreeStatus,label:plan.label};
}
/** Updates an already-rendered single-sheet SVG; all element paths belong to G.transfer. */
function paintSheet(svg,plan,visual){
 if(!svg||typeof svg.querySelectorAll!=='function')return;
 const lines=svg.querySelectorAll('.sheet-helper-lines line[data-kind]');
 for(const line of lines){
  const kind=line.getAttribute('data-kind'),index=guideIds.indexOf(kind);
  if(index<0||!visual.ready)continue;
  const t=visual.guideFractions[index];
  Motion.updateSvg(line,{kind:'line',geometry:{
    from:plan.guides[index].from,to:plan.guides[index].to}},t);
  line.setAttribute('opacity',String(t===0?0:1));
 }
 for(const el of svg.querySelectorAll('.sheet-target-projections circle, .sheet-target-projections text'))
  el.setAttribute('opacity',String(visual.ready?visual.targetOpacity:1));
}
/** WebGL fallback uses the exact same reveal alpha as the SVG first-angle projections. */
function paintSpace(svg,viewer,visual){
 const opacity=visual.ready?visual.targetOpacity:1;
 if(viewer?.setTargetOpacity)viewer.setTargetOpacity(opacity);
 if(svg?.querySelectorAll){
  for(const node of svg.querySelectorAll('.locus-point, .locus-label'))
   node.setAttribute('opacity',String(opacity));
 }
}
function createPlayer(plan,{speed=1}={}){
 if(plan?.status!=='ready')throw new TypeError('cannot animate unverified/contradictory space point');
 return T.createPlayer(plan.timeline,{speed,revision:plan.revision});
}
module.exports={build,createPlayer,presentation,paintSheet,paintSpace};
