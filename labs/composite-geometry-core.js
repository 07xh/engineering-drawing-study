/* 图学课堂 · 第三章组合体：原创数学模型。
 * Original composite prism, prism/plane section, orthogonal equal-axis-position
 * cylinder surfaces. No publisher art / original exercise / hidden-line claims.
 * First angle: V top left; H bottom left; W top right.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CompositeGeometry=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const S=2,O={vx:375,vy:312,hx:375,hy:312,wx:535,wy:312};
const views={V:{rect:[100,60,390,248],title:'正视图 V'},H:{rect:[100,327,390,250],title:'俯视图 H'},W:{rect:[515,60,305,248],title:'左视图 W'}};
function point(x,y,z){return{x,y,z}}
function proj(p,v){
 if(v==='V')return [O.vx-S*p.x,O.vy-S*p.z];
 if(v==='H')return [O.hx-S*p.x,O.hy+S*p.y];
 if(v==='W')return [O.wx+S*p.y,O.wy-S*p.z];
 throw Error('未知投影面');
}
function finite(num){return typeof num==='number'&&Number.isFinite(num)}
function integer(num,lo,hi){if(!Number.isInteger(num)||num<lo||num>hi)throw Error('参数越界')}
function line(a,b,style,view,label){return{kind:'line',xy:[...a,...b],style,view,label}}
function rect(a,b,style,view,label){
 return{kind:'rect',x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),w:Math.abs(b[0]-a[0]),h:Math.abs(b[1]-a[1]),style,view,label}
}
function dot(p,style,view,label){return{kind:'point',at:p,style,view,label}}
function curve(points,style,view,label){return{kind:'polyline',points,style,view,label}}
function circle(center,r,style,view,label){return{kind:'circle',center,r,style,view,label}}
function base(){
 const sh=[];
 for(const v of ['V','H','W'])sh.push({kind:'panel',rect:views[v].rect,label:views[v].title,view:v});
 sh.push(line([94,312],[850,312],'axis','cross','投影面横轴'),
  line([500,52],[500,572],'axis','cross','折转轴'));
 return sh;
}
function prismRect(box,v,style,label){
 const points=[point(box.x1,box.y1,box.z1),point(box.x2,box.y2,box.z2)].map(p=>proj(p,v));
 return rect(points[0],points[1],style,v,label);
}
const math={
 composite:{dof:[2,2,1,0,0],titles:['基座形体与已知尺寸','加入上方棱柱的投影包络','利用横向尺寸定位','利用深度尺寸完成定位','核对三视图和重叠关系'],
  reasons:['先分解组合体：已知水平基座的长、宽、高。此时另一个上方棱柱的中心在基座平面上还有两个未知定位坐标。',
   '加上固定长、宽、高的棱柱，示意两个形体的投影区域。尺寸只规定它是什么形状，并未单独决定上方棱柱在基座上的位置。',
   '确定上方棱柱中心相对基座的横向偏移，解决一个独立位置坐标；深度方向仍可平移。',
   '再确定中心的深度偏移，第二个独立位置坐标被确定。柱体高度由固定底面接触条件与给定高度决定。',
   '用三等规律复查各视图中两个基本形体的投影包络；相接处的可见线、虚线需单独检查，本演示没有自动判定隐线。']},
 section:{dof:[1,1,1,0,0],titles:['确认四棱柱和切割平面','先分析一条被切棱的自由度','代入切面求各棱交点','将截面投影到三个面','逐点校核共面和范围'],
  reasons:['已知棱柱的上下底面与侧棱。切面由高度参数 h 和固定的倾斜方向定义，这里只讨论四条竖直棱如何与平面相交。',
   '选取一条竖直棱，横向和深度固定，沿棱的交点还剩一个连续位置自由度（高度 z）。',
   '切面方程 z=h+0.28x 给出剩余高度，四条竖直侧棱各得唯一交点；此时该截点的连续自由度为0。',
   '顺次连接四个真实截点，分别作 V、H、W 正投影；同一空间截面在不同视图中可能积聚为线。',
   '依次验算每个交点满足切面方程、落在有限侧棱范围内，且三视图共享正确的 x、y、z 对应。']},
 intersection:{dof:[1,1,0,0,0],titles:['辨认相交的两圆柱曲面','同时列出两个曲面条件','先求一组真实相贯点','连续计算四个对称分支','验算交线及提醒可见性审核'],
  reasons:['原创模型取两个轴互相垂直的圆柱面：竖轴柱面 x²+(y−cy)²=R²，沿深度轴柱面 x²+(z−cz)²=r²。',
   '先固定其中一个柱面的表面点并要求它还在另一圆柱面上。相贯线仍是一维曲线：整条曲线上的点仍可沿线移动。',
   '若额外指定横向坐标 x，则 y 与 z 分别由两个半径关系确定；每个正负分支成为离散的候选交点，连续自由度降为0。',
   '在各个 x 上精确计算四个符号分支，并投影到 V/H/W；同一投影可能重合，但并不代表四支空间曲线相同。',
   '仅验证数学曲面交线。图上没有对两实体的真实遮挡、可见性和虚线进行求解；不能作为教材原题的完整相贯线标准答案。']}
};
function composite(arg,stage){
 const cx=arg.x??0,cy=arg.y??48;
 integer(cx,-15,15);integer(cy,32,60);
 const bottom={x1:-55,x2:55,y1:10,y2:82,z1:0,z2:16};
 const top={x1:cx-18,x2:cx+18,y1:cy-14,y2:cy+14,z1:16,z2:60};
 const shapes=base();
 for(const v of ['V','H','W']){
  shapes.push(prismRect(bottom,v,'known','基座投影包络'));
  if(stage>=1)shapes.push(prismRect(top,v,stage<3?'tentative':'found','凸台投影包络'));
 }
 if(stage>=2){
  const p=point(cx,cy,60),front=proj(p,'V'),floor=proj(p,'H');
  shapes.push(line([front[0],150],[front[0],floor[1]],'guide','VH','横向定位：长对正'));
 }
 if(stage>=3){
  shapes.push(line([O.wx,O.vy],[O.wx+220,O.vy+220],'transfer','cross','45°参考线'));
  const p=point(cx,cy,60),floor=proj(p,'H'),side=proj(p,'W');
  shapes.push(line(floor,[O.wx+S*cy,floor[1]],'guide','HW','深度向45°转移参考'));
  shapes.push(line([O.wx+S*cy,floor[1]],side,'guide','HW','侧面深度定位'));
 }
 const valid=top.x1>=bottom.x1&&top.x2<=bottom.x2&&top.y1>=bottom.y1&&top.y2<=bottom.y2&&top.z1===bottom.z2;
 return {shapes,valid,error:valid?0:1,details:'基座 110 × 72 × 16；凸台 36 × 28 × 44；凸台中心 x='+cx+'、y='+cy+'（画布数学单位）。',
  objectScope:'计算的是两个固定长宽高的轴向棱柱，在接触基座的条件下其凸台中心的两个平面定位自由度，不是复杂组合体整体运动的自由度。',
  candidateCount:valid?1:0,source:'组成形式参考原教材第三章第54—55页；原创建模不等于教材图3-1。'};
}
function section(arg,stage){
 const h=arg.h??33;integer(h,25,42);
 const b={x1:-38,x2:38,y1:14,y2:76,z1:0,z2:66},slope=.28;
 const at=x=>h+slope*x;
 const vertices=[point(b.x1,b.y1,at(b.x1)),point(b.x2,b.y1,at(b.x2)),
   point(b.x2,b.y2,at(b.x2)),point(b.x1,b.y2,at(b.x1))];
 const shapes=base();
 for(const v of ['V','H','W'])shapes.push(prismRect(b,v,'known','原始四棱柱外框'));
 if(stage>=1){
  const p=point(b.x1,b.y1,at(b.x1));
  shapes.push(line(proj(point(b.x1,b.y1,0),'V'),proj(point(b.x1,b.y1,66),'V'),'guide','V','一条竖直侧棱'));
  if(stage>=2)shapes.push(dot(proj(p,'V'),'found','V','切割平面确定高度'));
 }
 if(stage>=2)for(const v of ['V','H','W'])for(const p of vertices)shapes.push(dot(proj(p,v),'found',v,'已求出的截点'));
 if(stage>=3)for(const v of ['V','H','W'])shapes.push(curve([...vertices,vertices[0]].map(p=>proj(p,v)),'section',v,'已验算截面投影'));
 if(stage>=4)for(const v of ['V','H','W'])shapes.push(line(proj(vertices[0],v),proj(vertices[2],v),'check',v,'截点对角参考'));
 const residual=vertices.map(p=>Math.abs(p.z-h-slope*p.x));
 const within=vertices.every(p=>p.z>=b.z1&&p.z<=b.z2&&p.x>=b.x1&&p.x<=b.x2&&p.y>=b.y1&&p.y<=b.y2);
 return {shapes,valid:within&&residual.every(x=>x<1e-9),error:Math.max(...residual),vertices,
  objectScope:'仅针对四棱柱竖直侧棱上的待求交点：该棱原有一个高度自由度，加入切面共面约束后为0。不能当作整个截面或切割平面的总自由度。',
  details:'切面方程 z = '+h+' + 0.28x；四条竖棱各有一个交点，组成四边形截面。',candidateCount:vertices.length,
  source:'教材第三章第56—63页介绍平面切割立体。本图独立构造数学例题，不复刻教材实例。'};
}
function intersection(arg,stage){
 const r=arg.r??24;integer(r,18,28);
 const R=32,cy=44,cz=44;
 const branches=[],N=40;
 for(const sy of [-1,1])for(const sz of [-1,1]){
  const samples=Array.from({length:N+1},(_,i)=>{
   const x=-r+(2*r*i/N);
   const y=cy+sy*Math.sqrt(Math.max(0,R*R-x*x));
   const z=cz+sz*Math.sqrt(Math.max(0,r*r-x*x));
   return point(x,y,z);
  });
  branches.push({sy,sz,samples});
 }
 const shapes=base(),origin=point(0,cy,cz);
 shapes.push(circle(proj(origin,'V'),S*r,'known','V','沿深度轴圆柱的真实正投影圆'));
 shapes.push(circle(proj(origin,'H'),S*R,'known','H','竖轴圆柱的真实俯投影圆'));
 if(stage>=1){
  shapes.push(line(proj(point(-r,cy,cz),'V'),proj(point(r,cy,cz),'V'),'aux','V','横向取值范围'));
 }
 if(stage>=2){
  for(const b of branches){
   const p=b.samples[20];
   for(const v of ['V','H','W'])shapes.push(dot(proj(p,v),'candidate',v,'固定 x=0 后的可能交点'));
  }
 }
 if(stage>=3)for(const b of branches)for(const v of ['V','H','W'])
  shapes.push(curve(b.samples.map(p=>proj(p,v)),'intersection',v,'两圆柱面交线：全部几何候选'));
 if(stage>=4)for(const b of branches)for(const v of ['V','H','W'])shapes.push(dot(proj(b.samples[10],v),'check',v,'样本方程核对'));
 const errors=branches.flatMap(b=>b.samples.flatMap(p=>[
  Math.abs(p.x*p.x+(p.y-cy)**2-R*R),Math.abs(p.x*p.x+(p.z-cz)**2-r*r)
 ]));
 return {shapes,valid:errors.every(e=>e<1e-7),error:Math.max(...errors),branches,
  details:'双圆柱曲面：x²+(y−'+cy+')²='+R+'²，x²+(z−'+cz+')²='+r+'²；生成 '+(4*(N+1))+' 个解析取样点。',
  objectScope:'曲面求交后得到一维曲线；若固定曲线上某点的 x 坐标，剩下的符号分支是离散候选，不再有连续自由度。未计算视图可见性。',
  candidateCount:4,source:'教材第三章第64—66页介绍相贯线（含两圆柱正交）。本模型为完整独立的无限柱面解析例子，仅演示交线几何。'};
}
function frame(mode,argument,stage){
 integer(stage,0,4);
 const meta=math[mode];if(!meta)throw Error('不支持的几何模型');
 const item=mode==='composite'?composite(argument||{},stage):mode==='section'?section(argument||{},stage):intersection(argument||{},stage);
 return {...item,mode,stage,title:meta.titles[stage],why:meta.reasons[stage],dof:meta.dof[stage],
   notice:'原创计算模型，展示包络/截点/数学交线，不是教材扫描图、完整隐线判定或原题标准答案。'};
}
return {frame,proj,views,math};
});