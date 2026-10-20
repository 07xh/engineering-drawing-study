/* Source-mapped 2D animation for examples 1-1, 2-2 and 2-3 (Figs 1-22, 2-14, 2-16).
 * Pixel positions are a normalized *rendering* of the book's method, not book artwork.
 * No separate invented question. Verification checks mathematical invariants of book steps.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TextbookExampleGeometry=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const pt=(x,y)=>({x,y}),line=(a,b,style,label)=>({type:'line',a,b,style,label}),
 dot=(p,style,label)=>({type:'point',p,style,label});
const near=(a,b,t=1e-8)=>Math.abs(a-b)<t;
function division(stage){
 const A=pt(110,120),B=pt(670,120),n=7;
 const ray=pt(220,220),marks=Array.from({length:n+1},(_,i)=>pt(A.x+ray.x*i/n,A.y+ray.y*i/n));
 const points=Array.from({length:n+1},(_,i)=>pt(A.x+(B.x-A.x)*i/n,A.y));
 const shapes=[line(A,B,'given','AB'),dot(A,'given','A'),dot(B,'given','B')];
 if(stage>=1){shapes.push(line(A,marks[n],'auxiliary','AM'));for(let i=1;i<=n;i++)shapes.push(dot(marks[i],'mark',String(i)))}
 if(stage>=2)shapes.push(line(marks[n],B,'auxiliary','7B'));
 if(stage>=3)for(let i=1;i<n;i++){shapes.push(line(marks[i],points[i],'auxiliary','过 '+i+' 作平行线'));shapes.push(dot(points[i],'result','Q'+i))}
 if(stage>=4)for(let i=0;i<n;i++)shapes.push(line(points[i],points[i+1],'result','第'+(i+1)+'等分段'));
 const target=(B.x-A.x)/7;
 const residual=Math.max(...points.slice(1).map((p,i)=>Math.abs(p.x-points[i].x-target)));
 const direct=pt(B.x-marks[n].x,B.y-marks[n].y);
 const parallels=Array.from({length:6},(_,j)=>{const i=j+1;const v=pt(points[i].x-marks[i].x,points[i].y-marks[i].y);return Math.abs(v.x*direct.y-v.y*direct.x)});
 const crossError=Math.max(...parallels);
 return {stage,shapes,proof:{sevenSegments:points.slice(1).every((p,i)=>near(p.x-points[i].x,target)),
  sixParallelLines:parallels.every(x=>x<1e-8),maxResidual:Math.max(residual,crossError),A,B,marks,points},
  dof:stage<3?1:0,
  degreeTarget:'一个沿已知 AB 移动的待求等分点（不是整道题、全部辅助线的总自由度）',
  note:'七等分及相似三角形的作图顺序取自教材例1-1；画布长度和辅助射线角度经归一化重绘。'};
}
function thirdProjection(stage){
 const O=pt(430,200),aPrime=pt(330,100),a=pt(330,350);
 const depth=a.y-O.y,sideX=O.x+depth,aDouble=pt(sideX,aPrime.y),transfer=pt(sideX,a.y);
 const shapes=[
  line(pt(75,O.y),pt(795,O.y),'axis','X / YW'),
  line(pt(O.x,35),pt(O.x,410),'axis','Z / YH'),
  dot(aPrime,'given',"a′"),dot(a,'given','a')
 ];
 if(stage>=1)shapes.push(line(aPrime,pt(680,aPrime.y),'auxiliary',"a′ 的等高联系线"));
 if(stage>=2){shapes.push(line(O,pt(625,395),'auxiliary','45°深度转移'),line(a,transfer,'auxiliary','H面深度移交'))}
 if(stage>=3)shapes.push(line(transfer,aDouble,'auxiliary','W面深度定位线'));
 if(stage>=4)shapes.push(dot(aDouble,'result','a″'));
 const heightError=Math.abs(aDouble.y-aPrime.y),widthError=Math.abs((aDouble.x-O.x)-(a.y-O.y));
 return {stage,shapes,proof:{heightError,widthError,maxResidual:Math.max(heightError,widthError),
   xAligned:near(aPrime.x,a.x),heightAligned:heightError===0,depthAligned:widthError===0,points:{O,aPrime,a,aDouble,transfer}},
   dof:stage===0?2:stage<3?1:0,
   degreeTarget:'侧投影 a″ 在纸面上的二维位置。已知同名 V、H 投影的空间点自身没有新增三维自由度。',
   note:'第三投影的联系线与45°深度转移顺序取自教材例2-2；已知点位置为归一化重绘，非原版图纸量测结果。'};
}

// 教材例2-3（图2-16）：已知坐标 (x,y,z)=(15,10,12) mm。
// 图形单位：10像素/mm；三幅投影共享同一空间点，不把示意像素当做原图尺寸。
function coordinateProjection(stage){
 const scale=10,coordinates={x:15,y:10,z:12},O=pt(430,205);
 const ax=pt(O.x-scale*coordinates.x,O.y);
 const a=pt(ax.x,O.y+scale*coordinates.y);
 const aPrime=pt(ax.x,O.y-scale*coordinates.z);
 const aDouble=pt(O.x+scale*coordinates.y,aPrime.y);
 const transfer=pt(aDouble.x,a.y),sideFoot=pt(aDouble.x,O.y);
 const shapes=[
  line(pt(70,O.y),pt(780,O.y),'axis','X / YW'),
  line(pt(O.x,35),pt(O.x,410),'axis','Z / YH'),
  line(O,pt(630,405),'axis','45°'),
  dot(ax,'mark','aₓ')
 ];
 if(stage>=1){
  shapes.push(line(ax,a,'auxiliary','向下 y=10'),dot(a,'result','a'));
 }
 if(stage>=2){
  shapes.push(line(ax,aPrime,'auxiliary','向上 z=12'),dot(aPrime,'result','a′'));
 }
 if(stage>=3){
  shapes.push(line(aPrime,aDouble,'auxiliary','同高联系线'));
  shapes.push(line(a,transfer,'auxiliary','H面深度转移'));
  shapes.push(line(transfer,aDouble,'auxiliary','W面深度定位'));
  shapes.push(dot(aDouble,'result','a″'),dot(sideFoot,'mark','aYw'));
 }
 if(stage>=4){
  shapes.push(line(aPrime,aDouble,'result','高平齐'));
  shapes.push(line(O,sideFoot,'result','宽相等'));
 }
 const measured={x:(O.x-ax.x)/scale,y:(a.y-O.y)/scale,z:(O.y-aPrime.y)/scale};
 const heightError=Math.abs(aDouble.y-aPrime.y);
 const depthError=Math.abs(aDouble.x-O.x-(a.y-O.y));
 const maxResidual=Math.max(heightError,depthError,
  Math.abs(measured.x-coordinates.x),Math.abs(measured.y-coordinates.y),Math.abs(measured.z-coordinates.z));
 return {stage,shapes,proof:{coordinates,measured,scale,O,ax,a,aPrime,aDouble,transfer,sideFoot,
   heightAligned:heightError<1e-8,depthAligned:depthError<1e-8,maxResidual},
  dof:stage<2?2:stage<3?1:0,
  degreeTarget:'仅指侧面投影 a″ 尚未在画纸上完成定位的两个坐标；已给定(15,10,12)的空间点自由度始终为0。',
  note:'教材例2-3图2-16按三项原书作图划分为五帧；最后一帧是网页额外的关系验算。'};
}
function frame(exampleId,stage){
 if(!Number.isInteger(stage)||stage<0||stage>4)throw Error('不支持的例题帧');
 if(exampleId==='example-1-1')return division(stage);
 if(exampleId==='example-2-2')return thirdProjection(stage);
 if(exampleId==='example-2-3')return coordinateProjection(stage);
 throw Error('只允许播放已核对的课本例题');
}
return {frame};
});