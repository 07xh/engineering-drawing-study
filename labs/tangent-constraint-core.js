/* Original 2D tangency constraint model. NOT an exercise-solution or publisher diagram.
 * The fixed circle O,R and a straight line are synthetic teaching data.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TangencyConstraint=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const fixed={ox:300,oy:155,R:50,lineY:245};
const bounds={minR:22,maxR:52};
const degrees=[2,1,0,0,0];
const titles=[
 '① 看清已知：固定圆、直线、连接半径',
 '② 连接圆心在一条偏移直线上',
 '③ 连接圆心还在一条辅助圆上',
 '④ 交会得到两个候选圆心，依原题选分支',
 '⑤ 找两个切点并核算真正相切'
];
const reasons=[
 '连接弧的半径已给定，但圆心还没有指定位置。圆心是二维未知点，最初有2个连续自由度。',
 '连接圆与已知水平直线相切，若规定圆在直线上方，圆心到直线的距离为r；约束纵坐标后，圆心仍可左右移动。',
 '两圆按外切要求，圆心距必须等于R+r。圆心同时属于偏移直线和半径R+r的辅助圆，连续自由度降为0；此时仍可能存在两个离散解。',
 '辅助圆与偏移直线有两个交点，它们都满足两个距离条件。左、右分支必须依据真正的图形轮廓或题目给定条件选择；不是额外的连续自由度。',
 '从圆心连线求两圆相切点，从连接圆心向直线作垂线求另一切点。检查两段距离与圆心共线后，才画对应的连接弧。'
];
function compute(radius=32,side='right'){
 const r=Number(radius);
 if(!Number.isFinite(r)||r<bounds.minR||r>bounds.maxR)throw Error('连接半径超出原创演示范围');
 if(side!=='left'&&side!=='right')throw Error('未知的圆心分支');
 const cy=fixed.lineY-r,dy=cy-fixed.oy,dist=fixed.R+r;
 const delta=dist*dist-dy*dy;
 if(delta<0)throw Error('此条件下不存在实圆心，请检查距离和半径');
 const dx=Math.sqrt(delta);
 const left={x:fixed.ox-dx,y:cy},right={x:fixed.ox+dx,y:cy};
 const center=side==='left'?left:right;
 const contactCircle={x:fixed.ox+(center.x-fixed.ox)*fixed.R/dist,
  y:fixed.oy+(center.y-fixed.oy)*fixed.R/dist};
 const contactLine={x:center.x,y:fixed.lineY};
 const residuals={
  lineDistance:Math.abs(Math.abs(center.y-fixed.lineY)-r),
  circlesDistance:Math.abs(Math.hypot(center.x-fixed.ox,center.y-fixed.oy)-dist),
  oldContact:Math.abs(Math.hypot(contactCircle.x-fixed.ox,contactCircle.y-fixed.oy)-fixed.R),
  newContact:Math.abs(Math.hypot(contactCircle.x-center.x,contactCircle.y-center.y)-r),
  lineContact:Math.abs(Math.hypot(contactLine.x-center.x,contactLine.y-center.y)-r)
 };
 return {r,side,center,left,right,contactCircle,contactLine,offsetY:cy,auxR:dist,residuals,
  valid:Object.values(residuals).every(x=>x<1e-8),continuousDOF:0,discreteSolutions:dx>1e-8?2:1};
}
function frame(radius,side,stage){
 if(!Number.isInteger(stage)||stage<0||stage>4)throw Error('不支持的作图步骤');
 const m=compute(radius,side);
 const items=[
  {kind:'circle',cx:fixed.ox,cy:fixed.oy,r:fixed.R,style:'known',label:'已知圆'},
  {kind:'line',x1:90,y1:fixed.lineY,x2:560,y2:fixed.lineY,style:'known',label:'已知直线'},
  {kind:'point',x:fixed.ox,y:fixed.oy,label:'O',style:'known'}];
 if(stage>=1)items.push({kind:'line',x1:90,y1:m.offsetY,x2:560,y2:m.offsetY,style:'auxiliary',label:'距离为 r 的平行轨迹'});
 if(stage>=2)items.push({kind:'circle',cx:fixed.ox,cy:fixed.oy,r:m.auxR,style:'auxiliary',label:'半径 R+r 的圆心轨迹'});
 if(stage>=3){
  for(const [sideName,p] of [['left',m.left],['right',m.right]]){
   items.push({kind:'point',x:p.x,y:p.y,label:sideName==='left'?'候选 C₁':'候选 C₂',style:sideName===side?'selected':'candidate'});
  }
 }
 if(stage>=4){
  const c=m.center,a=m.contactCircle,b=m.contactLine;
  items.push({kind:'circle',cx:c.x,cy:c.y,r:m.r,style:'solution',label:'连接圆（辅助展示全圆）'},
    {kind:'line',x1:fixed.ox,y1:fixed.oy,x2:c.x,y2:c.y,style:'auxiliary',label:'圆心连线'},
    {kind:'line',x1:c.x,y1:c.y,x2:b.x,y2:b.y,style:'auxiliary',label:'垂足'},
    {kind:'point',x:a.x,y:a.y,label:'圆与圆的切点',style:'selected'},
    {kind:'point',x:b.x,y:b.y,label:'圆与线的切点',style:'selected'});
 }
 return {stage,title:titles[stage],reason:reasons[stage],items,geometry:m,
  dof:degrees[stage],scope:'二维圆弧外切的原创几何教学示例；只验证圆心和切点，不对应教材中任何具体原图或出版社答案。'};
}
return {fixed,bounds,titles,reasons,degrees,compute,frame};
});
