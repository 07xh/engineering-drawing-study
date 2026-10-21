'use strict';
const {object,identifier,finite,vec,report,noDuplicateIds,finiteTree}=require('./common.js');
const kinds=['point','line','segment','circle','plane','mesh'];
const spaces=['model-3d','drawing-2d'];
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
 if(g.kind==='line'&&(!vec(data.point,axes)||!vec(data.direction,axes)||Math.hypot(...axes.map(k=>data.direction?.[k]||0))<=0))errors.push('直线位置或方向无效');
 if(g.kind==='segment'&&(!vec(data.start,axes)||!vec(data.end,axes)||Math.hypot(...axes.map(k=>(data.end?.[k]||0)-(data.start?.[k]||0)))<=0))errors.push('线段端点无效');
 if(g.kind==='circle'&&(g.space!=='drawing-2d'||!vec(data.center,['x','y'])||!finite(data.radius)||data.radius<=0))errors.push('圆仅支持二维有效圆心与正半径');
 if(g.kind==='plane'&&(g.space!=='model-3d'||!vec(data.normal,['x','y','z'])||Math.hypot(data.normal?.x||0,data.normal?.y||0,data.normal?.z||0)<=0||!finite(data.offset)))errors.push('平面必须有有效三维法向量与偏移');
 if(g.kind==='mesh'){
  if(g.space!=='model-3d'||!object(data.points)||!Array.isArray(data.edges)||!Array.isArray(data.faces))errors.push('网格必须提供三维点、棱、面');
  else{
   const ids=Object.keys(data.points);
   if(!ids.length||!ids.every(identifier)||!noDuplicateIds(ids)||!ids.every(id=>vec(data.points[id],['x','y','z'])))errors.push('网格顶点无效');
   const known=new Set(ids);
   if(data.edges.some(e=>!Array.isArray(e)||e.length!==2||e[0]===e[1]||e.some(id=>!known.has(id))))errors.push('网格棱引用无效');
   if(data.faces.some(f=>!Array.isArray(f)||f.length<3||!noDuplicateIds(f)||f.some(id=>!known.has(id))))errors.push('网格面引用无效');
  }
 }
 if(g.unit!==undefined&&!['mm','unitless'].includes(g.unit))errors.push('Geometry.unit 不支持');
 return report(errors);
}
module.exports={kinds,spaces,validateGeometry};
