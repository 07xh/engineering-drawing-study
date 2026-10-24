'use strict';
const {finite,vec,object}=require('../contracts/common.js');
const VIEWS=['V','H','W'];
// A view label is more than two projected coordinates: it also fixes the
// ray FROM model geometry TOWARD the first-angle orthographic observer.
// These signs are shared with the established cone V5 proof, not inferred
// from a freely rotatable 3D camera.
const FIRST_ANGLE_OBSERVER_RAYS=Object.freeze({
 V:Object.freeze({x:0,y:-1,z:0}),
 H:Object.freeze({x:0,y:0,z:1}),
 W:Object.freeze({x:1,y:0,z:0})
});
function validateFirstAngleObserverRays(observers){
 if(!object(observers)||Array.isArray(observers)||
    Object.keys(observers).sort().join(',')!=='H,V,W')
  throw new TypeError('three explicitly supplied first-angle V/H/W observer rays required');
 const normalized={};
 for(const view of VIEWS){
  const r=observers[view],expected=FIRST_ANGLE_OBSERVER_RAYS[view];
  if(!object(r)||Array.isArray(r)||
     Object.keys(r).sort().join(',')!=='x,y,z'||
     !vec(r,['x','y','z']))
   throw new TypeError('finite 3D '+view+' observer ray required');
  const magnitude=Math.hypot(r.x,r.y,r.z);
  if(!finite(magnitude)||magnitude<=1e-12)
   throw new RangeError('nonzero first-angle observer ray required');
  const unit={x:r.x/magnitude,y:r.y/magnitude,z:r.z/magnitude};
  if(Math.hypot(unit.x-expected.x,unit.y-expected.y,unit.z-expected.z)>1e-12)
   throw new RangeError('observer ray conflicts with first-angle '+view+' view');
  normalized[view]=Object.freeze(unit);
 }
 return Object.freeze(normalized);
}
// Coordinate mismatch is measured in absolute model units (typically mm),
// never by a factor of the coordinate magnitude; this is a display check,
// not proof that a trusted solver has accepted the full constraint system.
const EPS=1e-8;
function finiteOutput(p){if(!Object.values(p).every(finite))throw Error('画纸变换溢出或结果非有限');return p;}
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
 if(view==='V')return finiteOutput({x:o.x-uv.u*s,y:o.y-uv.v*s});
 if(view==='H')return finiteOutput({x:o.x-uv.u*s,y:o.y+uv.v*s});
 return finiteOutput({x:o.x+uv.u*s,y:o.y-uv.v*s});
}
function fromSheet(view,p,transform){
 if(!VIEWS.includes(view)||!vec(p,['x','y']))throw Error('无效画纸点或投影面');
 const {origin:o,scale:s}=config(transform);
 if(view==='V')return finiteOutput({u:(o.x-p.x)/s,v:(o.y-p.y)/s});
 if(view==='H')return finiteOutput({u:(o.x-p.x)/s,v:(p.y-o.y)/s});
 return finiteOutput({u:(p.x-o.x)/s,v:(o.y-p.y)/s});
}
function sheetPoint(point,transform){
 const p=project(point),r={};
 for(const view of VIEWS)r[view]=toSheet(view,p[view],transform);
 const {origin:o,scale:s}=config(transform);
 r.M=finiteOutput({x:o.x+point.y*s,y:o.y+point.y*s});
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
 // Absolute discrepancy in the math unit: relative tolerances can hide
 // 10mm contradictions when coordinates are near 1e12mm.
 const near=(a,b)=>Math.abs(a-b)<=tolerance;
 return {sameX:near(views.V.u,views.H.u),sameHeight:near(views.V.v,views.W.v),sameDepth:near(views.H.v,views.W.u)};
}
module.exports={VIEWS,FIRST_ANGLE_OBSERVER_RAYS,validateFirstAngleObserverRays,
 project,toSheet,fromSheet,sheetPoint,transferGuides,aligned};
