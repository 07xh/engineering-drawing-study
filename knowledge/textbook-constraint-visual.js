/* Interactive 2D constraint visualization for the three source-reviewed textbook examples.
 * Uses the existing verified per-stage adapter. Never infers an answer from unreviewed scans.
 * A disabled condition is an exploratory overlay ONLY; original textbook geometry is not edited.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./planar-point-constraints.js'):root.DrawingPlanarConstraints);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TextbookConstraintVisual=api;})(typeof globalThis!=='undefined'?globalThis:this,function(planar){
'use strict';
const definitions={
 'example-1-1':{
  scope:'只分析沿 AB 的一个内部等分点 Q1，不代表全部六点和辅助射线。',
  bounds:{x:95,y:55,w:595,h:132},
  labels:[{id:'ab',name:'Q1 位于已知直线 AB',shapes:['AB'],hint:'先限定点在 AB 上，仍可沿线移动。'},
   {id:'parallel',name:'Q1 位于第一条等分转移线',shapes:['过 1 作平行线','Q1'],hint:'非平行的两条直线相交，确定 Q1。'}]
 },
 'example-2-2':{
  scope:'只分析侧投影 a″ 在画纸上的二维位置，不等于空间点 A 的自由度。',
  bounds:{x:435,y:40,w:342,h:145},
  labels:[{id:'height',name:'正侧投影高度一致',shapes:['a′ 的等高联系线',"a′"],hint:'限制纵向位置，横向仍可变化。'},
   {id:'depth',name:'侧投影深度位置已转移',shapes:['W面深度定位线'],hint:'限制横向位置，与等高线相交。'}]
 },
 'example-2-3':{
  scope:'题给空间坐标始终确定；仅追踪尚未在纸上画出的侧投影 a″。',
  bounds:{x:435,y:40,w:340,h:152},
  labels:[{id:'height',name:'z=12 的侧投影等高条件',shapes:['向上 z=12',"a′",'同高联系线'],hint:'将已知 z 高度应用到侧投影。'},
   {id:'depth',name:'y=10 的侧投影同深条件',shapes:['W面深度定位','H面深度转移'],hint:'把已知 y 深度转到 W 面位置。'}]
 }
};
function stageModel(example,stage,adapted){
 if(!example||example.sourceStatus!=='page-figure-reviewed')return null;
 const config=definitions[example.id],entry=adapted?.steps?.[stage];
 if(!config||!entry?.localDofAnalysis)return null;
 const data=entry.localDofAnalysis,names=Object.keys(data.points||{});
 if(names.length!==1||!Array.isArray(data.constraints))return null;
 const target=data.points[names[0]];
 if(!target||![target.x,target.y].every(Number.isFinite))return null;
 if(data.constraints.length>config.labels.length)throw Error('教材约束数量超出核实范围');
 const conditions=data.constraints.map((raw,i)=>{
  const meta=config.labels[i];if(!meta)throw Error('缺少已核实的约束映射');
  let equation=null;
  if(raw.type==='fixed'&&raw.point===names[0]){
   equation={type:'coordinate',axis:raw.axis,value:raw.value};
  }else if(raw.type==='on-line'&&raw.point===names[0]&&raw.line){
   equation={type:'line',a:raw.line.a,b:raw.line.b,offset:raw.line.offset};
  }else throw Error('发现不支持的教材约束类型');
  const row=planar.equation(equation),residual=Math.abs(row.a[0]*target.x+row.a[1]*target.y-row.b);
  if(residual>1e-6)throw Error('教材展示点不满足约束：'+meta.id);
  return {...meta,equation};
 });
 // Mapping must remain exact: both sources and their order are canonical.
 if(example.id==='example-1-1'){
  if(conditions[0]?.id!=='ab'||(stage>=3&&conditions[1]?.id!=='parallel'))throw Error('七等分约束顺序不匹配');
 }else if(conditions.some((x,i)=>x.id!==(i===0?'height':'depth')))throw Error('三投影约束顺序不匹配');
 return {exampleId:example.id,stage,scope:config.scope,bounds:{...config.bounds},target:{...target},conditions};
}
function analyze(model,disabledIds=[]){
 if(!model||!planar)throw Error('缺少已核实的二维约束模块');
 const disabled=new Set(disabledIds),source=planar.analyze(model.conditions.map(x=>x.equation));
 const picked=model.conditions.filter(x=>!disabled.has(x.id));
 const report=planar.analyze(picked.map(x=>x.equation));
 const r=report.result;
 const conditionResults=model.conditions.map(x=>{
  const active=!disabled.has(x.id),at=picked.findIndex(a=>a.id===x.id);
  return {...x,enabled:active,status:active?report.steps[at].status:'disabled'};
 });
 return {model,sourceDegrees:source.result.degrees,degrees:r.degrees,
  status:r.inconsistent?'conflict':r.degrees===0?'fixed':r.degrees===1?'line':'plane',
  rank:r.rank,position:r.particular,directions:r.directions,conditions:conditionResults};
}
function clipLine(equation,bounds){
 const {a,b}=planar.equation(equation),[ax,ay]=a,eps=1e-8;
 const x0=bounds.x,x1=x0+bounds.w,y0=bounds.y,y1=y0+bounds.h,points=[];
 function collect(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<x0-eps||x>x1+eps||y<y0-eps||y>y1+eps)return;
  if(!points.some(p=>Math.hypot(p.x-x,p.y-y)<eps))points.push({x,y});
 }
 if(Math.abs(ay)>eps){collect(x0,(b-ax*x0)/ay);collect(x1,(b-ax*x1)/ay)}
 if(Math.abs(ax)>eps){collect((b-ay*y0)/ax,y0);collect((b-ay*y1)/ax,y1)}
 if(points.length<2)return null;
 let far=null,length=-1;
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
  const d=Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y);
  if(d>length){length=d;far=[points[i],points[j]]}
 }
 return far;
}
function visuals(report){
 const {model,status,conditions}=report,bounds=model.bounds;
 const primitives=[];
 if(status==='plane'){
  primitives.push({type:'region',bounds});
  return primitives;
 }
 if(status==='conflict')return [{type:'conflict',bounds}];
 for(const entry of conditions.filter(x=>x.enabled)){
  const ends=clipLine(entry.equation,bounds);
  if(ends)primitives.push({type:'guide',id:entry.id,ends});
 }
 if(status==='line'){
  // For a consistent rank-one system, any nonredundant active line describes the locus.
  const base=conditions.find(x=>x.enabled),ends=base&&clipLine(base.equation,bounds);
  if(ends)primitives.push({type:'locus',ends});
 }else if(status==='fixed'){
  const [x,y]=report.position;
  if(x>=bounds.x-1&&x<=bounds.x+bounds.w+1&&y>=bounds.y-1&&y<=bounds.y+bounds.h+1)
   primitives.push({type:'solution',x,y});
 }
 return primitives;
}
return {stageModel,analyze,clipLine,visuals};
});
