'use strict';
/**
 * Bounded, declarative, continuously parametrized 3D Geometry.
 * Mathematics stays symbolic in the canonical Geometry Scene. Rendering
 * may sample the equation but NEVER upgrades the samples to source edges,
 * visibility evidence, ConstructionIntent or engineering V5 stroke styles.
 *
 * Supported coordinate basis is extensible: affine and signed radical of
 * a real circle. No executable formula strings or caller functions.
 */
const finite=Number.isFinite;
const own=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).sort().join(',')===keys.slice().sort().join(',');
const MAX=1e5;
function checkComponent(c,interval){
 if(!c||typeof c!=='object'||Array.isArray(c))return false;
 if(c.kind==='affine')
  return own(c,['kind','offset','slope'])&&finite(c.offset)&&
   finite(c.slope)&&Math.abs(c.offset)<=MAX&&Math.abs(c.slope)<=MAX&&
   [interval.from,interval.to].every(t=>
    finite(c.offset+c.slope*t)&&Math.abs(c.offset+c.slope*t)<=MAX);
 if(c.kind==='signed-circle-radical'){
  if(!own(c,['kind','center','offset','radius','sign'])||
     ![c.center,c.offset,c.radius].every(finite)||
     c.radius<=1e-9||c.radius>MAX||Math.abs(c.center)>MAX||
     Math.abs(c.offset)>MAX||![-1,1].includes(c.sign))return false;
  const eps=1e-11*Math.max(1,c.radius);
  return interval.from>=c.center-c.radius-eps&&
   interval.to<=c.center+c.radius+eps;
 }
 return false;
}
function validAnalyticCurve3D(data){
 if(!own(data,['parameter','coordinates'])||
    !own(data.parameter,['from','to'])||
    !own(data.coordinates,['x','y','z']))return false;
 const {from,to}=data.parameter;
 if(!finite(from)||!finite(to)||!(to>from)||
    Math.abs(from)>MAX||Math.abs(to)>MAX)return false;
 return ['x','y','z'].every(k=>
  checkComponent(data.coordinates[k],data.parameter));
}
function atAnalyticCurve3D(data,t){
 if(!validAnalyticCurve3D(data)||!finite(t)||
    t<data.parameter.from||t>data.parameter.to)
  throw new RangeError('bounded analytic 3D parameter or formula invalid');
 const one=c=>{
  if(c.kind==='affine')return c.offset+c.slope*t;
  const delta=t-c.center,radicand=
    (c.radius-Math.abs(delta))*(c.radius+Math.abs(delta));
  const tolerance=1e-9*Math.max(1,c.radius*c.radius);
  if(radicand< -tolerance)
   throw new RangeError('analytic curve exceeds real radical domain');
  return c.offset+c.sign*Math.sqrt(Math.max(0,radicand));
 };
 const point={x:one(data.coordinates.x),y:one(data.coordinates.y),
  z:one(data.coordinates.z)};
 if(!Object.values(point).every(finite))
  throw new RangeError('analytic 3D curve point overflows');
 return point;
}
module.exports={validAnalyticCurve3D,atAnalyticCurve3D};
