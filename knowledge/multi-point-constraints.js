/* Multi-point planar linear constraints: exact rank, consistency and per-step effects.
 * Distances, tangencies and other nonlinear relations are intentionally unsupported.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingMultiPointConstraints=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1e-9,finite=x=>typeof x==='number'&&Number.isFinite(x);
function analyze(problem){
 if(!problem||!Array.isArray(problem.points)||!Array.isArray(problem.constraints))throw Error('必须提供点编号和约束');
 const points=problem.points;
 if(points.some(p=>typeof p!=='string'||!p)||new Set(points).size!==points.length)throw Error('点编号无效或重复');
 const dim=2*points.length,index=new Map(points.map((p,i)=>[p,2*i])),rows=[],steps=[];
 function axis(point,component){if(!index.has(point))throw Error('未知点：'+point);if(!['x','y'].includes(component))throw Error('未知坐标分量');return index.get(point)+(component==='y'?1:0)}
 function equation(terms,value){if(!finite(value))throw Error('无效约束常量');const coefficients=Array(dim).fill(0);for(const t of terms){if(!finite(t.factor))throw Error('无效约束系数');coefficients[axis(t.point,t.axis)]+=t.factor}if(coefficients.every(x=>Math.abs(x)<EPS))throw Error('约束系数不能全为零');return [...coefficients,value]}
 function convert(c){
  if(!c||typeof c!=='object')throw Error('无效约束');
  if(c.type==='fixed')return [equation([{point:c.point,axis:c.axis,factor:1}],c.value)];
  if(c.type==='coincident'||c.type==='horizontal'||c.type==='vertical'){
   const axes=c.type==='coincident'?['x','y']:[c.type==='horizontal'?'y':'x'];
   return axes.map(k=>equation([{point:c.a,axis:k,factor:1},{point:c.b,axis:k,factor:-1}],0));
  }
  if(c.type==='point-on-line'){
   if(![c.a,c.b,c.offset].every(finite)||Math.hypot(c.a,c.b)<EPS)throw Error('直线方程无效');
   return [equation([{point:c.point,axis:'x',factor:c.a},{point:c.point,axis:'y',factor:c.b}],c.offset)];
  }
  if(c.type==='linear'){
   if(!Array.isArray(c.terms)||!c.terms.length)throw Error('线性项不能为空');
   return [equation(c.terms,c.value)];
  }
  throw Error('暂不支持约束：'+c.type);
 }
 function solve(){
  const m=rows.map(r=>[...r]);let rank=0;
  for(let col=0;col<dim&&rank<m.length;col++){
   let best=rank;for(let i=rank+1;i<m.length;i++)if(Math.abs(m[i][col])>Math.abs(m[best][col]))best=i;
   if(Math.abs(m[best][col])<EPS)continue;
   [m[rank],m[best]]=[m[best],m[rank]];
   const d=m[rank][col];for(let j=col;j<=dim;j++)m[rank][j]/=d;
   for(let i=0;i<m.length;i++)if(i!==rank){const f=m[i][col];for(let j=col;j<=dim;j++)m[i][j]-=f*m[rank][j]}
   rank++;
  }
  const inconsistent=m.some(r=>r.slice(0,dim).every(v=>Math.abs(v)<EPS)&&Math.abs(r[dim])>=EPS);
  return {rank,inconsistent,degrees:inconsistent?null:dim-rank};
 }
 let previous=solve();
 for(const constraint of problem.constraints){
  rows.push(...convert(constraint));const current=solve();
  const status=current.inconsistent?'contradiction':current.rank>previous.rank?'independent':'redundant';
  steps.push({constraint,status,before:previous.degrees,after:current.degrees});
  previous=current;
 }
 return {scope:'multi-point-2d-linear',pointCount:points.length,variableCount:dim,status:previous.inconsistent?'none':previous.degrees===0?'unique':'continuous',solutionCount:previous.inconsistent?0:previous.degrees===0?1:null,degrees:previous.degrees,rank:previous.rank,steps};
}
return {analyze};
});
