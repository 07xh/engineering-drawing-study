/* Normalized mathematical animations for source-verified textbook examples 1-1, 2-2, 2-3 and 4-2.
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
// 例4-2图4-5：以原书五步构造顺序重建无量纲楔形块。
function isometricWedge(stage){
 const length=210,width=112,height=137,low=52,frontCut=77,roofRun=131,corner=25;
 const roof=x=>x>=roofRun?height:low+(height-low)*x/roofRun;
 const project=(x,y,z)=>pt(452+.84*x-.51*y,211+.40*x+.31*y-1.10*z);
 const base=[[0,corner],[frontCut,0],[length,0],[length,width],[frontCut,width],[0,width-corner]];
 const resultEdges=[],addEdge=(a,b,label)=>resultEdges.push(line(project(...a),project(...b),'result',label));
 const zTop=([x,y])=>[x,y,roof(x)],zBase=([x,y])=>[x,y,0];
 const frontR=[roofRun,0,height],backR=[roofRun,width,height];
 const shapes=[];
 // A symbolic two-view scaffold is redrawn beside the constructed isometric figure.
 const f=(x,z)=>pt(66+.93*x,182-.63*z),v=(x,y)=>pt(66+.93*x,245+.58*y);
 const front=[[0,0],[length,0],[length,height],[roofRun,height],[0,low]];
 const plan=base;
 const drawPolygon=(points,mapper,style,label)=>{
  for(let i=0;i<points.length;i++)shapes.push(line(mapper(...points[i]),mapper(...points[(i+1)%points.length]),style,label));
 };
 drawPolygon(front,f,'given','已知正视轮廓');
 drawPolygon(plan,v,'given','已知俯视轮廓');
 shapes.push(line(v(0,width/2),v(length,width/2),'axis','俯视对称轴'));
 shapes.push(dot(f(0,low),'given','h'),dot(f(roofRun,height),'given','L3'));
 if(stage>=1){
  const box=[[0,0,0],[length,0,0],[length,width,0],[0,width,0]],
    top=box.map(p=>[p[0],p[1],height]);
  for(let i=0;i<4;i++){
   shapes.push(line(project(...box[i]),project(...box[(i+1)%4]),'auxiliary','长方体包络'));
   shapes.push(line(project(...top[i]),project(...top[(i+1)%4]),'auxiliary','长方体包络'));
   shapes.push(line(project(...box[i]),project(...top[i]),'auxiliary','长方体包络'));
  }
 }
 if(stage>=2){
  shapes.push(line(project(0,0,low),project(...frontR),'auxiliary','顶部斜切定位'));
  shapes.push(line(project(0,width,low),project(...backR),'auxiliary','顶部斜切定位'));
  shapes.push(line(project(...frontR),project(...backR),'auxiliary','顶部斜面交线'));
  shapes.push(line(project(...frontR),project(0,0,low),'auxiliary','顶部斜面交线'));
 }
 if(stage>=3){
  for(const [a,b] of [
   [[0,corner,roof(0)],[frontCut,0,roof(frontCut)]],
   [[0,width-corner,roof(0)],[frontCut,width,roof(frontCut)]],
   [[0,corner,0],[frontCut,0,0]],
   [[0,width-corner,0],[frontCut,width,0]]
  ])shapes.push(line(project(...a),project(...b),'auxiliary','角部切除定位'));
 }
 if(stage>=4){
  // Keep all prior construction geometry in the source frame for step-player invariants.
  // The inline drawing UI hides auxiliary material from the finished view instead.
  for(let i=0;i<base.length;i++){
   const a=base[i],b=base[(i+1)%base.length];
   addEdge(zBase(a),zBase(b),'楔形块底部轮廓');
   addEdge(zTop(a),zTop(b),'楔形块顶边');
   addEdge(zBase(a),zTop(a),'楔形块外边');
  }
  addEdge([roofRun,0,height],[roofRun,width,height],'顶部斜面交线');
  addEdge([frontCut,0,roof(frontCut)],frontR,'顶部斜面交线');
  addEdge([frontCut,width,roof(frontCut)],backR,'顶部斜面交线');
  for(const e of resultEdges)shapes.push(e);
 }
 const maxResidual=Math.max(Math.abs(roof(0)-low),Math.abs(roof(roofRun)-height),
  Math.abs(roof(length)-height),Math.abs((width-corner)-width+corner));
 return {stage,shapes,proof:{maxResidual,dimensions:{length,width,height,low,frontCut,roofRun,corner},
   note:'只对无量纲长方体包络、对称切除和上部转折关系做几何验证；不能替代原书毫米尺寸校核。'},
  dof:null,degreeTarget:'此楔形体尚无逐参数的完整独立约束系统，故不显示未经证明的整题自由度数值。',
  note:'原书第87页例4-2图4-5的五步顺序，另以归一化长方体及切除关系制作原创重绘。'};
}

function frame(exampleId,stage){
 if(!Number.isInteger(stage)||stage<0||stage>4)throw Error('不支持的例题帧');
 if(exampleId==='example-1-1')return division(stage);
 if(exampleId==='example-2-2')return thirdProjection(stage);
 if(exampleId==='example-2-3')return coordinateProjection(stage);
 if(exampleId==='example-4-2')return isometricWedge(stage);
 throw Error('只允许播放已核对的课本例题');
}
return {frame};
});