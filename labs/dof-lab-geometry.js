/* 图学课堂自由度实验室 2.0：三维几何与第一角画法共用的数据源。
 * 实验预设为几何教学模型，绝不作为任何教材原题或答案。
 * V(x,z), H(x,y), W(y,z); 图纸左上 V、左下 H、右上 W。
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingLabGeometry=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ORIGIN=Object.freeze({x:470,y:280}),SCALE=3,finite=n=>typeof n==='number'&&Number.isFinite(n);
const pt=(x,y,z)=>({x,y,z});
const cuboid={
 id:'cuboid',name:'长方体（教学参考模型）',
 points:{A:pt(10,10,10),B:pt(65,10,10),C:pt(65,48,10),D:pt(10,48,10),
 E:pt(10,10,56),F:pt(65,10,56),G:pt(65,48,56),H:pt(10,48,56)},
 edges:[['A','B'],['B','C'],['C','D'],['D','A'],['E','F'],['F','G'],['G','H'],['H','E'],['A','E'],['B','F'],['C','G'],['D','H']],
 faces:[['A','B','C','D'],['E','F','G','H'],['A','B','F','E'],['B','C','G','F'],['C','D','H','G'],['D','A','E','H']]
};
const prism={
 id:'triangular-prism',name:'三棱柱（教学参考模型）',
 points:{A:pt(13,14,10),B:pt(60,14,10),C:pt(35,55,10),
 D:pt(13,14,55),E:pt(60,14,55),F:pt(35,55,55)},
 edges:[['A','B'],['B','C'],['C','A'],['D','E'],['E','F'],['F','D'],['A','D'],['B','E'],['C','F']],
 faces:[['A','B','C'],['D','E','F'],['A','B','E','D'],['B','C','F','E'],['C','A','D','F']]
};
const pyramid={
 id:'pyramid',name:'四棱锥（教学参考模型）',
 points:{A:pt(12,12,9),B:pt(62,12,9),C:pt(62,54,9),D:pt(12,54,9),E:pt(36,32,59)},
 edges:[['A','B'],['B','C'],['C','D'],['D','A'],['A','E'],['B','E'],['C','E'],['D','E']],
 faces:[['A','B','C','D'],['A','B','E'],['B','C','E'],['C','D','E'],['D','A','E']]
};
const PRESETS=Object.freeze({'cuboid':cuboid,'triangular-prism':prism,'pyramid':pyramid});
function pointValid(p){return p&&['x','y','z'].every(k=>finite(p[k]))}
function validate(model){
 if(!model||!model.points||!Array.isArray(model.edges)||!Array.isArray(model.faces))throw Error('立体模型数据缺失');
 const ids=Object.keys(model.points);
 if(!ids.length||ids.some(id=>!id||!pointValid(model.points[id])))throw Error('立体模型点坐标无效');
 for(const edge of model.edges){
  if(!Array.isArray(edge)||edge.length!==2||edge[0]===edge[1]||edge.some(id=>!Object.hasOwn(model.points,id)))throw Error('立体模型棱线无效');
 }
 for(const face of model.faces){
  if(!Array.isArray(face)||face.length<3||new Set(face).size!==face.length||face.some(id=>!Object.hasOwn(model.points,id)))throw Error('立体模型表面无效');
 }
 return true;
}
function preset(id){
 const data=PRESETS[id];if(!data)throw Error('未知教学立体');
 const result={id:data.id,name:data.name,points:Object.fromEntries(Object.entries(data.points).map(([k,p])=>[k,{...p}])),
  edges:data.edges.map(e=>[...e]),faces:data.faces.map(f=>[...f])};
 validate(result);return result;
}
function projectPoint(p){
 if(!pointValid(p))throw Error('空间点必须有有限的 x、y、z 坐标');
 const {x,y,z}=p,o=ORIGIN,s=SCALE;
 return {
  V:{x:o.x-x*s,y:o.y-z*s},
  H:{x:o.x-x*s,y:o.y+y*s},
  W:{x:o.x+y*s,y:o.y-z*s},
  M:{x:o.x+y*s,y:o.y+y*s}
 };
}
function geometry(model){
 validate(model);
 const vertices=Object.fromEntries(Object.entries(model.points).map(([id,p])=>[id,projectPoint(p)]));
 const views={};
 for(const view of ['V','H','W']){
  views[view]={points:Object.fromEntries(Object.entries(vertices).map(([id,x])=>[id,x[view]])),
   edges:model.edges.map(([a,b])=>({a,b,from:vertices[a][view],to:vertices[b][view]}))};
 }
 return {vertices,views,faces:model.faces.map(face=>[...face]),
  origin:{...ORIGIN},scale:SCALE,scope:'自定义教学立体投影，非教材原题图及其答案。'};
}
function transfer(p){
 const q=projectPoint(p),o=ORIGIN;
 const guide=(kind,from,to)=>({kind,from,to});
 return {points:q,guide:[
  guide('VH',q.V,q.H),
  guide('height-VW',q.V,q.W),
  guide('depth-HM',q.H,q.M),
  guide('depth-MW',q.M,q.W)
 ],miterRay:{from:{...o},to:{x:o.x+260,y:o.y+260}},
  checks:{
   sameX:Math.abs(q.V.x-q.H.x)<1e-9,
   sameHeight:Math.abs(q.V.y-q.W.y)<1e-9,
   sameDepth:Math.abs((q.H.y-o.y)-(q.W.x-o.x))<1e-9,
   miterOn45:Math.abs((q.M.x-o.x)-(q.M.y-o.y))<1e-9
  }};
}
function candidate(point,report){
 if(!pointValid(point))throw Error('候选空间点无效');
 if(!report||typeof report!=='object')throw Error('缺少自由度计算结果');
 const result=report.result||report;
 if(result.inconsistent)return {kind:'none',example:null,directions:[],degrees:null};
 if(!Number.isInteger(result.degrees)||!Array.isArray(result.particular)||!Array.isArray(result.directions))throw Error('线性约束结果无效');
 // For underconstrained sets, the supplied example position is NOT an inferred solution.
 const base=point;
 const xs=result.particular,ds=result.directions;
 const example=result.degrees===0?pt(xs[0],xs[1],xs[2]):({...point});
 return {kind:['point','line','plane','space'][result.degrees],example,directions:ds.map(d=>[...d]),
  degrees:result.degrees,exampleIsUnique:result.degrees===0,
  warning:result.degrees?'示意点仅为可行位置的样例，并不表示唯一解。':'线性相容条件确定此空间点的唯一位置。'};
}
return {ORIGIN,SCALE,PRESETS,preset,validate,pointValid,projectPoint,geometry,transfer,candidate};
});
