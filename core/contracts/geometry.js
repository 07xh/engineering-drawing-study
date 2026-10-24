'use strict';
const {object,identifier,finite,vec,report,noDuplicateIds,finiteTree}=require('./common.js');
const {validAnalyticCurve3D}=
 require('../geometry/analytic-curve-3d.cjs');
const EPS=1e-9;
const kinds=['point','line','segment','polyline','circle','arc','plane','mesh','analytic-curve'];
const spaces=['model-3d','drawing-2d'];
const norm=(v,axes)=>vec(v,axes)?Math.hypot(...axes.map(k=>v[k])):0;
function validateGeometry(g){
 const errors=[];
 if(!object(g))return report(['Geometry 必须是对象']);
 if(!identifier(g.id))errors.push('Geometry.id 无效');
 if(!kinds.includes(g.kind))errors.push('Geometry.kind 不支持');
 if(!spaces.includes(g.space))errors.push('Geometry.space 不支持');
 const data=g.data, axes=g.space==='model-3d'?['x','y','z']:['x','y'];
 if(!object(data)){errors.push('Geometry.data 必须是对象');return report(errors);}
 if(!finiteTree(data))errors.push('Geometry 存在非有限数字');
 if(g.kind==='point'&&!vec(data,axes))errors.push('点坐标无效');
 if(g.kind==='line'&&(!vec(data.point,axes)||norm(data.direction,axes)<=EPS))errors.push('直线位置或方向无效');
 if(g.kind==='segment'&&(!vec(data.start,axes)||!vec(data.end,axes)||
    Math.hypot(...axes.map(k=>data.end[k]-data.start[k]))<=EPS))errors.push('线段端点无效');
 // A polyline is an explicit sequence of STRAIGHT finite edges only. It is
 // not proof of an analytic curve, a polygon interior, or line visibility.
 if(g.kind==='polyline'){
  const points=data.points,closed=data.closed;
  if(!Array.isArray(points)||points.length<2||points.length>2048||
     typeof closed!=='boolean'||(closed&&points.length<3)||
     Object.keys(data).some(k=>!['points','closed'].includes(k))||
     !points.every(p=>vec(p,axes)))errors.push('折线必须是有限有序点、明确闭合状态和有效模型坐标');
  else{
   const count=closed?points.length:points.length-1;
   for(let i=0;i<count;i++){
    const a=points[i],b=points[(i+1)%points.length];
    const span=Math.hypot(...axes.map(k=>b[k]-a[k]));
    if(!finite(span)||span<=EPS){
     errors.push('折线有重复相邻点、零长度或数值溢出边');
     break;
    }
   }
  }
 }
 // Exact bounded analytic 3D curve is not a polyline or proof of line style.
 if(g.kind==='analytic-curve'&&
    (g.space!=='model-3d'||!validAnalyticCurve3D(data)))
  errors.push('空间解析曲线缺少受约束的连续参数方程或真实定义域');
 if(g.kind==='circle'&&(g.space!=='drawing-2d'||!vec(data.center,['x','y'])||
    !finite(data.radius)||data.radius<=0))errors.push('圆仅支持二维有效圆心与正半径');
 if(g.kind==='arc'){
  // Mathematical drawing-plane arc, angular values are degrees (not SVG pixels).
  // ccw: increasing mathematical angle, cw: decreasing mathematical angle.
  const diff=data.endAngle-data.startAngle;
  if(g.space!=='drawing-2d'||!vec(data.center,['x','y'])||!finite(data.radius)||
     data.radius<=0||!finite(data.startAngle)||!finite(data.endAngle)||
     !['cw','ccw'].includes(data.direction)||Math.abs(diff)<=EPS||Math.abs(diff)>360||
     (data.direction==='ccw'&&diff<=0)||(data.direction==='cw'&&diff>=0))
    errors.push('圆弧必须有二维圆心、正半径、起止角(度)与相容的 cw/ccw 方向');
 }
 if(g.kind==='plane'&&(g.space!=='model-3d'||norm(data.normal,['x','y','z'])<=EPS||
    !finite(data.offset)))errors.push('平面必须有有效三维法向量与偏移');
 if(g.kind==='mesh'){
  if(g.space!=='model-3d'||!object(data.points)||!Array.isArray(data.edges)||!Array.isArray(data.faces))errors.push('网格必须提供三维点、棱、面');
  else{
   const ids=Object.keys(data.points),known=new Set(ids);
   const ok=ids.length&&ids.every(identifier)&&ids.every(id=>vec(data.points[id],['x','y','z']));
   if(!ok)errors.push('网格顶点无效');
   const edgeKeys=new Set();
   for(const e of data.edges){
    if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||e.some(id=>!known.has(id))){errors.push('网格棱引用无效');continue;}
    const key=[...e].sort().join('|');
    if(edgeKeys.has(key))errors.push('网格棱重复');else edgeKeys.add(key);
   }
   const faceKeys=new Set();
   for(const face of data.faces){
    if(!Array.isArray(face)||face.length<3||!noDuplicateIds(face)||face.some(id=>!known.has(id))){errors.push('网格面引用无效');continue;}
    const key=[...face].sort().join('|');
    if(faceKeys.has(key))errors.push('网格面重复');else faceKeys.add(key);
    if(!ok)continue;
    const p0=data.points[face[0]];
    const displacements=face.slice(1).map(id=>['x','y','z'].map(k=>data.points[id][k]-p0[k]));
    const noncollinear=displacements.some((a,i)=>displacements.slice(i+1).some(b=>
     Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])>EPS));
    if(!noncollinear)errors.push('网格面顶点退化共线');
   }
  }
 }
 if(g.unit!==undefined&&!['mm','unitless'].includes(g.unit))errors.push('Geometry.unit 不支持');
 return report(errors);
}
module.exports={kinds,spaces,validateGeometry};
