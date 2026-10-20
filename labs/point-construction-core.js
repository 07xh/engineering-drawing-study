/* 图学课堂 · 第一角法：两个已知点投影构造第三投影（原创示例）。
 * 此程序只使用可任意更改的 x/y/z 教学参数，绝不读取教材习题答案或做题笔迹。
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.PointConstruction=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const origin={x:460,y:300},scale=3.5,range={min:8,max:58};
function valid(p){
 if(!p||!['x','y','z'].every(k=>Number.isFinite(p[k])&&p[k]>=range.min&&p[k]<=range.max))throw Error('坐标必须位于演示允许的范围内');
 return {x:p.x,y:p.y,z:p.z};
}
function coordinates(p){
 const q=valid(p);
 const V=[origin.x-q.x*scale,origin.y-q.z*scale];
 const H=[origin.x-q.x*scale,origin.y+q.y*scale];
 const W=[origin.x+q.y*scale,origin.y-q.z*scale];
 const mirror=[origin.x+q.y*scale,origin.y+q.y*scale];
 return {V,H,W,mirror,p:q};
}
function report(engine,p,wrong=false){
 if(!engine||typeof engine.analyze!=='function')throw Error('缺少共享自由度计算器');
 const q=valid(p);
 const observations=[
  {type:'projection',plane:'V',value:[q.x,q.z]},
  {type:'projection',plane:'H',value:[q.x,q.y]},
  {type:'projection',plane:'W',value:[wrong?q.y+8:q.y,q.z]}
 ];
 const primary=engine.analyze(observations.slice(0,2)),full=engine.analyze(observations);
 return {knownDOF:primary.result.degrees,fullDOF:full.result.degrees,rank:full.result.rank,
  inconsistent:full.result.inconsistent,
  correct:!full.result.inconsistent&&full.result.degrees===0,
  summary:full.result.inconsistent?'第三面候选点与已知两面投影互相矛盾：没有同时满足全部条件的空间点。':'正视图与俯视图已确定 x、y、z；所得左视图通过了三坐标对应复核。',
  wrongCandidate:wrong};
}
const names=[
 ['已知 V/H','已知正面 V 与水平 H 两幅同名投影。两个投影合起来固定空间点的三坐标；待求的 W 是验证结果。'],
 ['高平齐','从 V 投影点向右作水平线，固定 W 投影中的高度 z；注意这条线尚不能决定侧面深度。'],
 ['转移深度','从 H 投影作水平转移线到右下角 45° 转移线，得到与 H 相同的深度 y。'],
 ['相交定点','从转移点作竖直线，它和 V 的等高线相交，才是左视图同名点的唯一正确位置。'],
 ['代入复核','同时复核 V(x,z)、H(x,y)、W(y,z)，若 W 中 y 不一致，即使画面看起来相近也不能算正确。']
];
function frame(p,stage,wrong=false){
 if(!Number.isInteger(stage)||stage<0||stage>=names.length)throw Error('无效的步骤');
 const c=coordinates(p),line=(kind,xy,label='')=>({kind,xy,label});
 const s=[
 {kind:'panel',rect:[125,50,305,222],label:'正视图 V'},
 {kind:'panel',rect:[125,330,305,250],label:'俯视图 H'},
 {kind:'panel',rect:[485,50,315,222],label:'左视图 W'},
 line('axis',[100,origin.y,815,origin.y]),
 line('axis',[origin.x,35,origin.x,597]),
 {kind:'point',at:c.V,label:'a′',color:'green'},
 {kind:'point',at:c.H,label:'a',color:'green'}];
 if(stage>=1)s.push(line('guide',[...c.V,790,c.V[1]],'高平齐'));
 if(stage>=2){
  s.push(line('transfer45',[origin.x,origin.y,origin.x+250,origin.y+250],'45°'));
  s.push(line('guide',[...c.H,...c.mirror],'等深转移'));
 }
 if(stage>=3){
  s.push(line('guide',[...c.mirror,...c.W],'交会线'));
  s.push({kind:'point',at:c.W,label:'a″',color:'blue'});
 }
 if(stage>=4&&wrong){
  const w=[c.W[0]+8*scale,c.W[1]];
  s.push({kind:'point',at:w,label:'错误的 a″',color:'red'});
 }
 return {stage,title:names[stage][0],why:names[stage][1],shapes:s,coords:c,scope:'原创示例，不是教材原题作图、原题解答或毫米真实比例图。'};
}
return {range,origin,scale,names,coordinates,report,frame};
});