'use strict';
/**
 * Independent M3 check of polygon section vertices against the ORIGINAL plane.
 * This does not certify the solid boundary, occlusion, global uniqueness,
 * image provenance or the final engineering drawing.
 *
 * A specialist's reported maximum residual is an assertion to CHECK, not
 * a tolerance that the specialist may choose to make itself pass.
 */
const M0=require('../../../core/numeric/euclidean-kernel.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const xyz=p=>p!==null&&typeof p==='object'&&!Array.isArray(p)&&
 ['x','y','z'].every(k=>finite(p[k]));
const vector=p=>[p.x,p.y,p.z];

function auditPolygonPlaneResidual(vertices,plane,{modelExtentMm,claimedMaxResidualMm}={}){
 if(!Array.isArray(vertices)||vertices.length<3||vertices.length>6||
    vertices.some(v=>!xyz(v?.point))||
    !plane||!xyz(plane.point)||!xyz(plane.normal)||
    !finite(modelExtentMm)||modelExtentMm<=0||
    !finite(claimedMaxResidualMm)||claimedMaxResidualMm<0)
  throw new TypeError('finite model-mm polygon, original plane and residual scope required');
 const origin=vector(plane.point);
 const normal=M0.normalize(vector(plane.normal));
 if(!normal.every(finite))throw new TypeError('degenerate section plane normal');
 const coordinateScale=Math.max(1,
  ...origin.map(Math.abs),
  ...vertices.flatMap(v=>vector(v.point).map(Math.abs)));
 // The first term is independent of the solver's claimed residual.
 // The second allows for world-coordinate cancellation in IEEE-754.
 const roundoffMm=128*Number.EPSILON*coordinateScale;
 const toleranceMm=4e-8*Math.max(1,modelExtentMm)+roundoffMm;
 if(!finite(toleranceMm))throw new TypeError('unrepresentable section tolerance');
 let measuredMaxResidualMm=0;
 for(const vertex of vertices){
  const distance=Math.abs(M0.dot(M0.subtract(vector(vertex.point),origin),normal));
  if(!finite(distance))throw new TypeError('nonfinite independent plane residual');
  measuredMaxResidualMm=Math.max(measuredMaxResidualMm,distance);
 }
 const ok=measuredMaxResidualMm<=toleranceMm&&
  measuredMaxResidualMm<=claimedMaxResidualMm+roundoffMm;
 return Object.freeze({ok,measuredMaxResidualMm,toleranceMm,roundoffMm});
}
module.exports={auditPolygonPlaneResidual};
