/* Three original paper-construction models drawn from the *topics* in the
 * user's edition-3 textbook (printed pp. 13-14 and 21-22).
 * No textbook scan, exercise prompt, publisher diagram, or answer coordinates.
 * All computations are in synthetic SVG units, not real millimetres.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.PaperGeometry=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const point=(x,y)=>({x,y});
const near=(a,b,e=1e-8)=>Math.abs(a-b)<=e;
function assertInteger(n,min,max,name){if(!Number.isInteger(n)||n<min||n>max)throw Error(name+'参数必须为'+min+'～'+max+'的整数')}
function shapeLine(a,b,role='given',name=''){return {kind:'line',x1:a.x,y1:a.y,x2:b.x,y2:b.y,role,name}}
function shapePoint(p,role='point',name=''){return {kind:'point',x:p.x,y:p.y,role,name}}
function shapeCircle(c,r,role='given',name=''){return {kind:'circle',cx:c.x,cy:c.y,r,role,name}}
function regular(mode,nOrParam,stage){
 assertInteger(stage,0,4,'作图步骤');
 if(mode==='divide'){
  const n=Number(nOrParam);assertInteger(n,2,10,'等分段数');
  const A=point(100,275),B=point(565,275),P=Array.from({length:n+1},(_,k)=>point(A.x+29*k,A.y-18*k));
  const Q=Array.from({length:n+1},(_,k)=>point(A.x+(B.x-A.x)*k/n,A.y));
  const shapes=[shapeLine(A,B,'given','AB'),shapePoint(A,'given','A'),shapePoint(B,'given','B')];
  if(stage>=1){shapes.push(shapeLine(A,P[n],'aux','辅助射线 AM'));for(let k=1;k<=n;k++)shapes.push(shapePoint(P[k],'aux',''+k))}
  if(stage>=2)shapes.push(shapeLine(P[n],B,'aux','连接末等分点与 B'));
  if(stage>=3)for(let k=1;k<n;k++)shapes.push(shapeLine(P[k],Q[k],'aux','过分点作平行线'));
  if(stage>=4)for(let k=1;k<n;k++)shapes.push(shapePoint(Q[k],'found','P'+k));
  const spacings=Q.slice(1).map((p,k)=>p.x-Q[k].x),equal=spacings.every(d=>near(d,(B.x-A.x)/n));
  const slope=(B.y-P[n].y)/(B.x-P[n].x);
  const parallels=Array.from({length:n-1},(_,i)=>{const k=i+1;return (Q[k].y-P[k].y)/(Q[k].x-P[k].x)});
  const valid=equal&&parallels.every(s=>near(s,slope));
  const why=[
   '已知线段 AB 两端点，要求分成 n 段等长。端点固定后，每个分点应在 AB 上。',
   '从 A 引出一条不与 AB 重合的射线，以同一量距在射线上连续截取 n 段；长度可以任意选，但每段必须相等。',
   '连接辅助射线上的第 n 个分点和原线段端点 B，确定后续平行线的方向。',
   '依次从前 n−1 个辅助分点作平行线，与 AB 相交。相似三角形保证分点比例相等。',
   '检查 AB 被分出的 n 段长度相等。这里只演示数学上精确的原创线段，不是原书例1-1的描图。'
  ];
  const dof=[1,1,1,0,0][stage]; // DOF of any *one target division point* before ratio intersection, not of all construction.
  return {mode,n,stage,title:['已知线段','射线等距标记','连接最后一个分点','作平行线求交','全部等分点并验算'][stage],
   why:why[stage].replaceAll('n',String(n)),dof,dofScope:'针对某个待求分点在已知 AB 上的位置：初始连续自由度为1；平行交会提供该点的比例位置后为0。辅助射线可任意选择，不属于待求点的自由度。',
   shapes,result:{A,B,P,Q,spacing:(B.x-A.x)/n,valid,maxError:Math.max(...spacings.map(x=>Math.abs(x-(B.x-A.x)/n)))}};
 }
 if(mode==='polygon'){
  const n=Number(nOrParam);if(![3,4,6,8].includes(n))throw Error('仅支持原创演示中的3、4、6、8边形');
  const C=point(331,181),r=108,theta0=-Math.PI/2;
  const V=Array.from({length:n},(_,k)=>point(C.x+r*Math.cos(theta0+2*Math.PI*k/n),C.y+r*Math.sin(theta0+2*Math.PI*k/n)));
  const shapes=[shapeCircle(C,r,'given','外接圆'),shapePoint(C,'given','O')];
  if(stage>=1){shapes.push(shapeLine(C,V[0],'aux','第一个顶点的方向'));shapes.push(shapePoint(V[0],'found','V1'))}
  if(stage>=2)for(let k=1;k<n;k++){shapes.push(shapeLine(C,V[k],'aux','等角半径'));shapes.push(shapePoint(V[k],'found','V'+(k+1)))}
  if(stage>=3)for(let k=0;k<n;k++)shapes.push(shapeLine(V[k],V[(k+1)%n],'found','多边形边'));
  if(stage>=4)for(let k=0;k<n;k++)shapes.push(shapeLine(C,V[k],'check','等半径验算'));
  const edges=V.map((p,k)=>Math.hypot(p.x-V[(k+1)%n].x,p.y-V[(k+1)%n].y));
  const side=2*r*Math.sin(Math.PI/n),valid=edges.every(x=>near(x,side,1e-7))&&V.every(p=>near(Math.hypot(p.x-C.x,p.y-C.y),r,1e-7));
  return {mode,n,stage,title:['确定外接圆','先确定旋转方向','等角分配顶点','按顺序连成多边形','核对半径与边长'][stage],
   why:[
    '已知外接圆圆心和半径，可确定每个顶点与圆心的距离，但若没有规定第一个顶点方向，整个正多边形仍可绕圆心连续旋转。',
    '选定第一个顶点的方向后，整体旋转自由度消失。此方向由演示者选择，不能冒充教材原题的固定条件。',
    '将圆心角均分为 n 份，每一份的角度为360°/n，并把相应射线与外接圆交会确定全部顶点。',
    '按圆周次序依次连接相邻顶点，最后将末点连回首点构成闭合轮廓。',
    '数值检查各顶点到圆心距离是否同为 r，且各边长度是否相等。对于正六边形，边长等于外接圆半径。'
   ][stage].replaceAll('n',String(n)),dof:stage===0?1:0,
   dofScope:'仅讨论外接圆已固定、边数已固定时，整个多边形的旋转自由度；一旦规定第一个顶点方向，旋转自由度为0。不是把每个顶点当作独立未知点。',
   shapes,result:{C,r,V,side,valid,maxError:Math.max(...edges.map(x=>Math.abs(x-side)))}};
 }
 if(mode==='dimension'){
  const dx=Number(nOrParam?.dx),dy=Number(nOrParam?.dy);
  assertInteger(dx,60,280,'水平定位尺寸');assertInteger(dy,50,180,'竖直定位尺寸');
  const base=point(110,300),center=point(base.x+dx,base.y-dy),radius=37;
  const shapes=[shapeLine(point(base.x,53),point(base.x,327),'axis','竖向基准'),
   shapeLine(point(64,base.y),point(592,base.y),'axis','横向基准'),
   shapePoint(base,'given','基准 O')];
  if(stage>=1)shapes.push(shapeLine(point(center.x,55),point(center.x,327),'aux','水平定位 x = '+dx));
  if(stage>=2)shapes.push(shapeLine(point(64,center.y),point(592,center.y),'aux','竖直定位 y = '+dy));
  if(stage>=3){shapes.push(shapePoint(center,'found','C'));shapes.push(shapeCircle(center,radius,'found','定形半径 R'))}
  if(stage>=4){
   shapes.push(shapeLine(base,point(center.x,base.y),'check','水平尺寸'),shapeLine(point(center.x,base.y),center,'check','竖向尺寸'));
  }
  const valid=near(center.x-base.x,dx)&&near(base.y-center.y,dy)&&radius>0;
  return {mode,stage,title:['确认尺寸基准与圆的半径','指定水平定位尺寸','补充竖直定位尺寸','交点确定圆心后画圆','检查定形与定位是否齐全'][stage],
   why:[
    '已知圆的半径 R 只能确定圆的形状大小，不能确定圆心位置；二维圆心有2个连续坐标自由度。',
    '从竖直基准量取给定水平距离 x，得到圆心所在的竖向定位线。圆心还能上下移动，剩余1个连续自由度。',
    '从横向基准向上量取垂直距离 y，得到水平定位线。两条独立、非平行定位线相交，圆心自由度降为0。',
    '由两条定位线交点确定圆心 C，再利用给定的半径 R 作圆。半径是定形尺寸，两个方向的距离是定位尺寸。',
    '计算复核圆心的水平、竖向偏移分别等于给定尺寸。若某个尺寸缺失或两条定位线重合，不能宣称圆心已经唯一确定。'
   ][stage],dof:[2,1,0,0,0][stage],
   dofScope:'仅对固定基准下未知二维圆心的两个位置坐标计数；半径 R 是定形尺寸，不会直接减少圆心的两个定位自由度。',
   shapes,result:{base,center,radius,dx,dy,valid,maxError:Math.max(Math.abs(center.x-base.x-dx),Math.abs(base.y-center.y-dy))}};
 }
 throw Error('不支持的原创作图方式');
}
return {regular,near};
});