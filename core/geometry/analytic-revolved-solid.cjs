'use strict';
/**
 * Bounded, exact *source parameterization* of a finite circular solid.
 * SVG sampling must NEVER create Geometry mesh edges, an intersection curve,
 * visibility/line-style evidence, a verified C3 SolveResult or V5 actions.
 *
 * Model axes use the canonical right-handed DraftFlow xyz system. Base at
 * center - axis*height/2, top at center + axis*height/2, with radial
 * orthonormal basis u,v and u × axis = v.
 */
const finite=Number.isFinite;
const MAX=100000;
const norm=v=>Math.hypot(v.x,v.y,v.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,
  y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const validVector=v=>v&&typeof v==='object'&&!Array.isArray(v)&&
  ['x','y','z'].every(k=>finite(v[k])&&Math.abs(v[k])<=MAX);
const NEAR=1e-8;
const near=(a,b)=>Math.abs(a-b)<=NEAR;
function validAnalyticRevolvedSolid(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||
    Object.keys(data).sort().join(',')!==
    ['axis','center','height','profile','radialU','radialV','radiusBottom','radiusTop'].sort().join(','))
  return false;
 if(!['cylinder','cone','frustum'].includes(data.profile)||
   ![data.center,data.axis,data.radialU,data.radialV].every(validVector)||
   !finite(data.height)||data.height<=1e-9||data.height>MAX||
   !finite(data.radiusBottom)||data.radiusBottom<=1e-9||data.radiusBottom>MAX||
   !finite(data.radiusTop)||data.radiusTop<0||data.radiusTop>MAX)return false;
 if(data.profile==='cone'&&data.radiusTop!==0)return false;
 if(data.profile==='cylinder'&&data.radiusBottom!==data.radiusTop)return false;
 if(data.profile==='frustum'&&
   (data.radiusTop<=1e-9||data.radiusTop===data.radiusBottom))return false;
 if([data.axis,data.radialU,data.radialV].some(v=>!near(norm(v),1)))return false;
 if(!near(dot(data.axis,data.radialU),0)||
    !near(dot(data.axis,data.radialV),0)||
    !near(dot(data.radialU,data.radialV),0))return false;
 const actual=cross(data.radialU,data.axis);
 if(!['x','y','z'].every(k=>near(actual[k],data.radialV[k])))return false;
 const outer=Math.max(data.radiusBottom,data.radiusTop);
 return ['x','y','z'].every(k=>Math.abs(data.center[k])+
   Math.abs(data.axis[k])*data.height/2+
   Math.hypot(data.radialU[k],data.radialV[k])*outer<=MAX);
}
function onAnalyticRevolvedSolid(data,t,theta){
 if(!validAnalyticRevolvedSolid(data))throw new TypeError('解析旋转实体参数或坐标基无效');
 if(!finite(t)||t<0||t>1||!finite(theta)||Math.abs(theta)>Math.PI*4)
  throw new RangeError('解析曲面参数不在受限定义域');
 const height=(t-0.5)*data.height;
 const r=data.radiusBottom+(data.radiusTop-data.radiusBottom)*t;
 const ca=Math.cos(theta),sa=Math.sin(theta);
 return Object.fromEntries(['x','y','z'].map(k=>[k,
  data.center[k]+data.axis[k]*height+
    r*(data.radialU[k]*ca+data.radialV[k]*sa)]));
}
function centerAt(data,t){
 if(!validAnalyticRevolvedSolid(data)||!finite(t)||t<0||t>1)
  throw new RangeError('解析实体中心轴位置无效');
 return Object.fromEntries(['x','y','z'].map(k=>
  [k,data.center[k]+data.axis[k]*(t-0.5)*data.height]));
}
module.exports={validAnalyticRevolvedSolid,onAnalyticRevolvedSolid,centerAt};
