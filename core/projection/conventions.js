'use strict';
const {finite,object}=require('../contracts/common.js');
// A source coordinate gets one read before it can influence multiple
// model projections. Preserve legacy boundedness/error behavior and avoid
// introducing a second geometry/projection kernel.
function snap2(value,axes,message){
 if(!object(value))throw Error(message);
 const a=value[axes[0]],b=value[axes[1]];
 if(!finite(a)||!finite(b))throw Error(message);
 return {[axes[0]]:a,[axes[1]]:b};
}
function snap3(value,message){
 if(!object(value))throw Error(message);
 const x=value.x,y=value.y,z=value.z;
 if(!finite(x)||!finite(y)||!finite(z))throw Error(message);
 return {x,y,z};
}
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
 // Take all three caller-owned rays before reading any nested coordinate.
 // A V coordinate accessor cannot swap H/W rays while verification proceeds.
 const sources={};
 for(const view of VIEWS)sources[view]=observers[view];
 const normalized={};
 for(const view of VIEWS){
  const r=sources[view],expected=FIRST_ANGLE_OBSERVER_RAYS[view];
  if(!object(r)||Array.isArray(r)||
     Object.keys(r).sort().join(',')!=='x,y,z')
   throw new TypeError('finite 3D '+view+' observer ray required');
  const {x,y,z}=r;
  if(!finite(x)||!finite(y)||!finite(z))
   throw new TypeError('finite 3D '+view+' observer ray required');
  const magnitude=Math.hypot(x,y,z);
  if(!finite(magnitude)||magnitude<=1e-12)
   throw new RangeError('nonzero first-angle observer ray required');
  const unit={x:x/magnitude,y:y/magnitude,z:z/magnitude};
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
 const q=snap3(point,'空间点须为有限数值坐标');
 return {V:{u:q.x,v:q.z},H:{u:q.x,v:q.y},W:{u:q.y,v:q.z}};
}
function config(value){
 const error='画纸变换必须给出有效原点和正比例';
 if(!object(value))throw Error(error);
 const originalOrigin=value.origin,scale=value.scale;
 const origin=snap2(originalOrigin,['x','y'],error);
 if(!finite(scale)||scale<=0)throw Error(error);
 return {origin,scale};
}
function toSheet(view,uv,transform){
 if(!VIEWS.includes(view))throw Error('无效投影面或二维数学投影点');
 const q=snap2(uv,['u','v'],'无效投影面或二维数学投影点');
 const {origin:o,scale:s}=config(transform);
 if(view==='V')return finiteOutput({x:o.x-q.u*s,y:o.y-q.v*s});
 if(view==='H')return finiteOutput({x:o.x-q.u*s,y:o.y+q.v*s});
 return finiteOutput({x:o.x+q.u*s,y:o.y-q.v*s});
}
function fromSheet(view,p,transform){
 if(!VIEWS.includes(view))throw Error('无效画纸点或投影面');
 const q=snap2(p,['x','y'],'无效画纸点或投影面');
 const {origin:o,scale:s}=config(transform);
 if(view==='V')return finiteOutput({u:(o.x-q.x)/s,v:(o.y-q.y)/s});
 if(view==='H')return finiteOutput({u:(o.x-q.x)/s,v:(q.y-o.y)/s});
 return finiteOutput({u:(q.x-o.x)/s,v:(o.y-q.y)/s});
}
function sheetPoint(point,transform){
 const p=project(point),t=config(transform),r={};
 // V/H/W and 45-degree transfer share one model XYZ and one sheet origin
 // and scale. Do not re-read dynamic caller getters for M or other views.
 for(const view of VIEWS)r[view]=toSheet(view,p[view],t);
 const {origin:o,scale:s}=t;
 r.M=finiteOutput({x:o.x+p.H.v*s,y:o.y+p.H.v*s});
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
 const error='投影数据或精度无效';
 if(!object(views)||!finite(tolerance)||tolerance<0)throw Error(error);
 const V=views.V,H=views.H,W=views.W;
 const v=snap2(V,['u','v'],error),h=snap2(H,['u','v'],error),
  w=snap2(W,['u','v'],error);
 // Absolute discrepancy in model units; never let a large coordinate
 // loosen a 10mm mismatch through relative tolerance.
 const near=(a,b)=>Math.abs(a-b)<=tolerance;
 return {sameX:near(v.u,h.u),sameHeight:near(v.v,w.v),sameDepth:near(h.v,w.u)};
}
module.exports={VIEWS,FIRST_ANGLE_OBSERVER_RAYS,validateFirstAngleObserverRays,
 project,toSheet,fromSheet,sheetPoint,transferGuides,aligned};
