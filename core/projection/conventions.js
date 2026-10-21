'use strict';
const {finite,vec,object}=require('../contracts/common.js');
const VIEWS=['V','H','W'];
const EPS=1e-9;
function project(point){
 if(!vec(point,['x','y','z']))throw Error('空间点须为有限数值坐标');
 return {V:{u:point.x,v:point.z},H:{u:point.x,v:point.y},W:{u:point.y,v:point.z}};
}
function config(value){
 if(!object(value)||!vec(value.origin,['x','y'])||!finite(value.scale)||value.scale<=0)throw Error('画纸变换必须给出有效原点和正比例');
 return value;
}
function toSheet(view,uv,transform){
 if(!VIEWS.includes(view)||!vec(uv,['u','v']))throw Error('无效投影面或二维数学投影点');
 const {origin:o,scale:s}=config(transform);
 if(view==='V')return {x:o.x-uv.u*s,y:o.y-uv.v*s};
 if(view==='H')return {x:o.x-uv.u*s,y:o.y+uv.v*s};
 return {x:o.x+uv.u*s,y:o.y-uv.v*s};
}
function fromSheet(view,p,transform){
 if(!VIEWS.includes(view)||!vec(p,['x','y']))throw Error('无效画纸点或投影面');
 const {origin:o,scale:s}=config(transform);
 if(view==='V')return {u:(o.x-p.x)/s,v:(o.y-p.y)/s};
 if(view==='H')return {u:(o.x-p.x)/s,v:(p.y-o.y)/s};
 return {u:(p.x-o.x)/s,v:(o.y-p.y)/s};
}
function sheetPoint(point,transform){
 const p=project(point),r={};
 for(const view of VIEWS)r[view]=toSheet(view,p[view],transform);
 const {origin:o,scale:s}=config(transform);
 r.M={x:o.x+point.y*s,y:o.y+point.y*s};
 return r;
}
function transferGuides(point,transform){
 const p=sheetPoint(point,transform);
 return {points:p,guides:[
 {kind:'VH',from:p.V,to:p.H},
 {kind:'height-VW',from:p.V,to:p.W},
 {kind:'depth-HM',from:p.H,to:p.M},
 {kind:'depth-MW',from:p.M,to:p.W}
 ]};
}
function aligned(views,tolerance=EPS){
 if(!object(views)||!VIEWS.every(v=>vec(views[v],['u','v']))||!finite(tolerance)||tolerance<0)throw Error('投影数据或精度无效');
 const near=(a,b)=>Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(a),Math.abs(b));
 return {sameX:near(views.V.u,views.H.u),sameHeight:near(views.V.v,views.W.v),sameDepth:near(views.H.v,views.W.u)};
}
module.exports={VIEWS,project,toSheet,fromSheet,sheetPoint,transferGuides,aligned};
