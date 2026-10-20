/* Original SVG concept motion models grounded in textbook topics,
 * not publisher drawings, source examples or verified book answer solutions.
 * Geometry and dimensions here are intentionally independent demonstration values.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TextbookConceptMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const pt=(x,y)=>({x,y}),line=(a,b,kind='given')=>({type:'line',a,b,kind}),text=(x,y,label)=>({type:'text',x,y,label}),
 rect=(x,y,w,h,kind='given')=>({type:'rect',x,y,w,h,kind}),
 poly=(points,kind='given')=>({type:'poly',points,kind});
const common={
 'ch01-drawing-scale':{title:'绘图比例与实物尺寸',page:12,printedPage:6,steps:['画出 1:2 的简化形体','加入 1:1 的同一形体','再加入 2:1 的同一形体','核对标注数字不随比例变化'],limit:'仅借鉴教材图1-8的三种比例对照关系；独立重绘轮廓，非原书图形复刻或编号例题。'},
 'ch04-s01':{title:'三轴方向与轴测构图',page:90,printedPage:84,steps:['先识别三条轴测轴','沿对应轴方向依次取等向长度','延续相同方向补出各组平行棱','完成一个简单长方体的轴测投影'],limit:'轴测轴方向和长度比例的独立示意，非教材题图的具体尺寸或标准答案。'},
 'ch05-s02':{title:'剖视图的剖切与材料表达',page:110,printedPage:104,steps:['先认识外形和内部隐线','引入经过内部结构的剖切位置','显示剖切后的内部轮廓','为被切的材料区域加上概念性剖面线'],limit:'只表达剖视形成的基本思想；剖切线、线型及剖面线需以具体题目与适用标准核对。'},
 'ch10-s01':{title:'建筑平面和立面的轴线对应',page:205,printedPage:199,steps:['建立用于定位的平面轴网','绘出墙体的基本平面位置','在立面建立建筑高度与标高参照','比较同一结构的平面与立面轴线对应'],limit:'抽象建筑轴网和标高的概念示意，非原书图10-3的准确复刻或建筑施工图。'}
};
function axon(stage){
 const O=pt(245,270),u=pt(118,63),v=pt(-92,70),w=pt(0,-133);
 const add=(...vs)=>vs.reduce((p,x)=>pt(p.x+x.x,p.y+x.y),O),A=O,
 B=add(u),C=add(v),D=add(u,v),E=add(w),F=add(u,w),G=add(v,w),H=add(u,v,w);
 const sh=[line(O,pt(O.x+u.x*1.5,O.y+u.y*1.5),'axis'),line(O,pt(O.x+v.x*1.5,O.y+v.y*1.5),'axis'),line(O,pt(O.x,O.y-168),'axis'),
 text(430,368,'X'),text(77,384,'Y'),text(250,83,'Z')];
 if(stage>=1)sh.push(line(A,B,'auxiliary'),line(A,C,'auxiliary'),line(A,E,'auxiliary'));
 if(stage>=2)sh.push(line(B,D,'auxiliary'),line(C,D,'auxiliary'),line(E,F,'auxiliary'),line(E,G,'auxiliary'));
 if(stage>=3)sh.push(line(B,F,'result'),line(C,G,'result'),line(F,H,'result'),line(G,H,'result'),line(D,H,'result'),
  poly([A,B,D,C],'result'),poly([E,F,H,G],'result'));
 return sh;
}
function section(stage){
 const sh=[rect(94,82,358,216,'given'),line(pt(206,96),pt(206,284),'hidden'),line(pt(334,96),pt(334,284),'hidden'),
  text(114,68,'外形与内部通道')];
 if(stage>=1){sh.push(line(pt(272,48),pt(272,326),'cut'),text(281,51,'剖切方向示意'))}
 if(stage>=2){
  sh.push(rect(207,82,127,216,'cutout'),line(pt(207,82),pt(207,298),'result'),line(pt(334,82),pt(334,298),'result'),
  text(225,207,'通道'));
 }
 if(stage>=3){
  for(let x=102;x<208;x+=19)sh.push(line(pt(x,280),pt(Math.min(x+46,207),226),'hatch'));
  for(let x=344;x<446;x+=19)sh.push(line(pt(x,280),pt(Math.min(x+46,452),226),'hatch'));
  sh.push(text(106,335,'剖面线仅用于表示被切材料'));
 }
 return sh;
}
function building(stage){
 const sh=[text(86,54,'平面'),text(370,54,'立面')];
 for(let i=0;i<3;i++){let x=76+i*94;
  sh.push(line(pt(x,75),pt(x,320),'axis'),text(x-4,338,String(i+1)))}
 for(let i=0;i<3;i++){let y=100+i*89;
  sh.push(line(pt(49,y),pt(313,y),'axis'))}
 if(stage>=1){
  sh.push(rect(76,100,188,178,'given'),line(pt(170,100),pt(170,278),'given'),
    line(pt(76,189),pt(264,189),'given'),text(113,141,'空间'),text(183,231,'分区'));
 }
 if(stage>=2){
  sh.push(rect(359,125,199,153,'given'),line(pt(359,278),pt(558,278),'result'),
   line(pt(347,192),pt(570,192),'auxiliary'),text(574,196,'楼层高度线'));
 }
 if(stage>=3){
  for(let i=0;i<3;i++){const x=359+i*99.5;
    sh.push(line(pt(x,86),pt(x,305),'axis'),text(x-4,337,String(i+1)))}
  sh.push(text(373,357,'相同轴号对应同一空间位置'));
 }
 return sh;
}
function scaleDiagram(stage){
 const out=[],variants=[{label:'1:2',w:62,x:45},{label:'1:1',w:112,x:230},{label:'2:1',w:178,x:430}];
 for(let i=0;i<=Math.min(stage,2);i++){
  const v=variants[i],w=v.w,h=w*17/20,n=w*12/20,d=w*4/20,x=v.x,y=193-h/2;
  out.push(poly([pt(x,y),pt(x+w,y),pt(x+w,y+h),pt(x+(w+n)/2,y+h),
   pt(x+(w+n)/2,y+h-d),pt(x+(w-n)/2,y+h-d),pt(x+(w-n)/2,y+h),pt(x,y+h)],'given'));
  out.push(text(x+w*.28,74,v.label));
  for(const ratio of [.25,.75]){
   const cx=x+ratio*w,cy=y+.32*h,r=w*.09;
   out.push(poly(Array.from({length:24},(_,k)=>pt(cx+r*Math.cos(k*Math.PI/12),cy+r*Math.sin(k*Math.PI/12))),'auxiliary'));
  }
  if(stage===3){out.push(line(pt(x,y+h+16),pt(x+w,y+h+16),'result'));out.push(text(x+w*.2,330,'20 mm'))}
 }
 if(stage===3)out.push(text(102,364,'绘图长度不同；实际尺寸标注保持一致'));
 return out;
}
function frame(id,step){
 const def=common[id];
 if(!def||!Number.isInteger(step)||step<0||step>=def.steps.length)return null;
 const shapes=id==='ch01-drawing-scale'?scaleDiagram(step):id==='ch04-s01'?axon(step):id==='ch05-s02'?section(step):building(step);
 return {id,step,steps:def.steps.length,title:def.title,action:def.steps[step],page:def.page,
  printedPage:def.printedPage,scope:def.limit,shapes};
}
return {ids:Object.keys(common),frame,definition:id=>common[id]||null};
});
