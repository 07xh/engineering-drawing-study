/* Exact linear constraint analysis for one point in a 2D drawing.
 * Conditions must be supplied and verified; this engine does not infer textbook geometry.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingPlanarConstraints=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1e-9;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function equation(c){
 if(!c||typeof c!=='object')throw Error('无效二维约束');
 if(c.type==='coordinate'){
  if(!['x','y'].includes(c.axis)||!finite(c.value))throw Error('无效二维坐标');
  return {a:c.axis==='x'?[1,0]:[0,1],b:c.value};
 }
 if(c.type==='line'){
  if(![c.a,c.b,c.offset].every(finite)||Math.hypot(c.a,c.b)<EPS)throw Error('无效直线方程');
  return {a:[c.a,c.b],b:c.offset};
 }
 if(c.type==='through-points'){
  const p=c.p||{},q=c.q||{};
  if(![p.x,p.y,q.x,q.y].every(finite))throw Error('直线端点无效');
  const dx=q.x-p.x,dy=q.y-p.y;
  if(Math.hypot(dx,dy)<EPS)throw Error('两点重合不能定义直线');
  return {a:[-dy,dx],b:-dy*p.x+dx*p.y};
 }
 throw Error('尚不支持二维约束：'+c.type);
}
function solve(rows){
 const m=rows.map(r=>[...r.a,r.b]),pivots=[];let rank=0;
 for(let col=0;col<2;col++){
  let pivot=rank;
  for(let i=rank+1;i<m.length;i++)if(Math.abs(m[i][col])>Math.abs(m[pivot]?.[col]||0))pivot=i;
  if(rank>=m.length||Math.abs(m[pivot][col])<EPS)continue;
  [m[rank],m[pivot]]=[m[pivot],m[rank]];
  const scale=m[rank][col];for(let j=col;j<3;j++)m[rank][j]/=scale;
  for(let i=0;i<m.length;i++)if(i!==rank){const factor=m[i][col];for(let j=col;j<3;j++)m[i][j]-=factor*m[rank][j];}
  pivots.push(col);rank++;
 }
 const inconsistent=m.some(r=>Math.abs(r[0])<EPS&&Math.abs(r[1])<EPS&&Math.abs(r[2])>=EPS);
 const free=[0,1].filter(i=>!pivots.includes(i));
 const particular=[0,0],directions=[];
 if(!inconsistent){
  pivots.forEach((col,i)=>particular[col]=m[i][2]);
  for(const axis of free){const vector=[0,0];vector[axis]=1;pivots.forEach((col,i)=>vector[col]=-m[i][axis]);directions.push(vector);}
 }
 return {rank,inconsistent,degrees:inconsistent?null:2-rank,particular:inconsistent?null:particular,directions};
}
function analyze(conditions){
 if(!Array.isArray(conditions))throw Error('二维条件必须为数组');
 const rows=[],steps=[];let previous=solve(rows);
 for(const condition of conditions){
  rows.push(equation(condition));const result=solve(rows);
  const status=result.inconsistent?'contradiction':result.rank>previous.rank?'independent':'redundant';
  steps.push({condition,status,before:previous.degrees,after:result.degrees,result});
  previous=result;
 }
 return {scope:'single-2d-point-linear',result:previous,steps};
}
return {equation,solve,analyze};
});
