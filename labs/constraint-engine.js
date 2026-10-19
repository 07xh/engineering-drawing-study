/* 图学课堂：空间点的线性约束分析（无需外部依赖） */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DrawingConstraints=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1e-8;
const num=x=>typeof x==='number'&&Number.isFinite(x);
function row(a,b,label){if(!Array.isArray(a)||a.length!==3||!a.every(num)||!num(b))throw Error('约束系数必须为三个有限数');return {a:[...a],b,label};}
function equations(c){
 if(!c||typeof c!=='object')throw Error('无效约束');
 const p=c.point||{},n=c.normal||{};
 switch(c.type){
  case 'coordinate':{
   const axis={x:0,y:1,z:2}[c.axis];
   if(axis===undefined)throw Error('未知坐标轴');
   const a=[0,0,0];a[axis]=1;return [row(a,c.value,c.axis+'='+c.value)];
  }
  case 'projection':{
   if(!Array.isArray(c.value)||c.value.length!==2)throw Error('投影坐标应为两个数');
   const axes={H:['x','y'],V:['x','z'],W:['y','z']}[c.plane];
   if(!axes)throw Error('未知投影面');
   return axes.flatMap((axis,i)=>equations({type:'coordinate',axis,value:c.value[i]}));
  }
  case 'plane':{
   if(!num(n.x)||!num(n.y)||!num(n.z)||!num(c.offset))throw Error('平面方程无效');
   if(Math.hypot(n.x,n.y,n.z)<EPS)throw Error('平面法向量不能为零');
   return [row([n.x,n.y,n.z],c.offset,'点在平面上')];
  }
  case 'line':{
   const d=c.direction||{};
   if(!['x','y','z'].every(k=>num(p[k])&&num(d[k])))throw Error('直线数据无效');
   const ds=[d.x,d.y,d.z],ps=[p.x,p.y,p.z];
   let pivot=0;for(let i=1;i<3;i++)if(Math.abs(ds[i])>Math.abs(ds[pivot]))pivot=i;
   if(Math.abs(ds[pivot])<EPS)throw Error('直线方向向量不能为零');
   const out=[];
   for(let i=0;i<3;i++)if(i!==pivot){
    const a=[0,0,0];a[i]=ds[pivot];a[pivot]=-ds[i];
    out.push(row(a,ds[pivot]*ps[i]-ds[i]*ps[pivot],'点在直线上'));
   }
   return out;
  }
  default:throw Error('尚不支持此类约束：'+c.type);
 }
}
function solve(rows){
 const m=rows.map(r=>[...r.a,r.b]);let rank=0;const pivots=[];
 for(let j=0;j<3;j++){
  let best=rank;
  for(let i=rank+1;i<m.length;i++)if(Math.abs(m[i][j])>Math.abs(m[best]?.[j]||0))best=i;
  if(rank>=m.length||Math.abs(m[best][j])<EPS)continue;
  [m[rank],m[best]]=[m[best],m[rank]];
  const factor=m[rank][j];for(let k=j;k<4;k++)m[rank][k]/=factor;
  for(let i=0;i<m.length;i++)if(i!==rank){const t=m[i][j];for(let k=j;k<4;k++)m[i][k]-=t*m[rank][k];}
  pivots.push(j);rank++;
 }
 const inconsistent=m.some(r=>r.slice(0,3).every(v=>Math.abs(v)<EPS)&&Math.abs(r[3])>=EPS);
 const free=[0,1,2].filter(i=>!pivots.includes(i));
 const particular=[0,0,0],directions=[];
 if(!inconsistent){
  pivots.forEach((col,i)=>particular[col]=m[i][3]);
  for(const axis of free){const v=[0,0,0];v[axis]=1;pivots.forEach((col,i)=>v[col]=-m[i][axis]);directions.push(v);}
 }
 return {rank,inconsistent,degrees:inconsistent?null:3-rank,particular:inconsistent?null:particular,directions:inconsistent?[]:directions};
}
const fmt=n=>Number(n.toFixed(3));
function describe(s){
 if(s.inconsistent)return '条件互相矛盾，空间中没有满足全部条件的点；不能把无解误写成 0 个自由度。';
 if(s.degrees===3)return '空间点没有受到独立约束，可以在三维空间内移动。';
 if(s.degrees===2)return '一个独立线性条件使点限制在一个平面上，剩余 2 个自由度。';
 if(s.degrees===1)return '两个独立线性条件使点限制在一条直线上，剩余 1 个自由度。';
 return '三个独立线性条件共同确定唯一空间点 ('+s.particular.map(fmt).join(', ')+')，剩余 0 个自由度。';
}
function analyze(conditions){
 if(!Array.isArray(conditions))throw Error('条件必须为数组');
 let rows=[],previous=solve(rows);const steps=[];
 for(const c of conditions){
  const added=equations(c);
  rows=[...rows,...added];
  const current=solve(rows);
  const status=current.inconsistent?'contradiction':current.rank===previous.rank?'redundant':'independent';
  steps.push({condition:c,addedEquations:added.length,status,before:previous.degrees,after:current.degrees,explanation:current.inconsistent?'新条件与已有条件矛盾：无解。':status==='redundant'?'新条件没有增加独立限制：自由度不变。':'新增 '+(current.rank-previous.rank)+' 个独立约束；剩余 '+current.degrees+' 个自由度。',result:current});
  previous=current;
 }
 return {result:previous,steps,summary:describe(previous)};
}
return {analyze,equations,solve,describe};
});
