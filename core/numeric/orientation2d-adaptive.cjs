'use strict';
/**
 * M0 filtered-orientation predicate:
 *   - ordinary separated turns: cheap IEEE-754 Float64 determinant
 *     only when the standard conservative roundoff bound proves its sign;
 *   - cancellation, degeneracy, overflow, underflow: exact dyadic predicate
 *     over the SAME snapshotted represented binary64 coordinates.
 *
 * Robustness is limited to the sign of orientation of represented inputs.
 * It neither converts units nor certifies distances, collinearity with
 * tolerance, segment intersection, topology, world-space curves, or V5.
 * The exact path is conditional; no BigInt in the safe fast path.
 */
const {orientation2D}=require('./orientation2d-exact.cjs');
const EPSILON=Number.EPSILON/2; // IEEE binary64 machine unit roundoff, 2^-53.
const CCW_FILTER=(3+16*EPSILON)*EPSILON;
function point2(p,label){
 if(!Array.isArray(p)||p.length!==2||
    !Object.hasOwn(p,0)||!Object.hasOwn(p,1))
  throw new TypeError(label+' must be a dense finite 2D coordinate array');
 const x=p[0],y=p[1]; // Snapshot each accessor only once.
 if(typeof x!=='number'||typeof y!=='number'||
    !Number.isFinite(x)||!Number.isFinite(y))
  throw new TypeError(label+' must be a dense finite 2D coordinate array');
 return [x,y];
}
const outcomes=Object.freeze({
 fast:Object.freeze([
  Object.freeze({sign:-1,orientation:'clockwise',method:'float64-filtered',
   exactForBinary64Inputs:true}),
  Object.freeze({sign:1,orientation:'counterclockwise',method:'float64-filtered',
   exactForBinary64Inputs:true})
 ]),
 fallback:Object.freeze([
  Object.freeze({sign:-1,orientation:'clockwise',method:'exact-dyadic-fallback',
   exactForBinary64Inputs:true}),
  Object.freeze({sign:0,orientation:'collinear',method:'exact-dyadic-fallback',
   exactForBinary64Inputs:true}),
  Object.freeze({sign:1,orientation:'counterclockwise',method:'exact-dyadic-fallback',
   exactForBinary64Inputs:true})
 ])
});
function orientation2DAdaptive(a,b,c){
 const pa=point2(a,'a'),pb=point2(b,'b'),pc=point2(c,'c');
 // Use the well-established ccw sign filter: with finite operands and
 // finite intermediate arithmetic, abs(det) > (3+16u)*u*
 // (abs(detLeft)+abs(detRight)) is a sufficient sign certificate.
 // It is deliberately more conservative than a cancellation-sensitive
 // difference-only threshold. An uncertain sign NEVER becomes collinear.
 const acx=pa[0]-pc[0],bcy=pb[1]-pc[1],
  acy=pa[1]-pc[1],bcx=pb[0]-pc[0];
 if([acx,bcy,acy,bcx].every(Number.isFinite)){
  const left=acx*bcy,right=acy*bcx,det=left-right;
  const magnitude=Math.abs(left)+Math.abs(right);
  const err=CCW_FILTER*magnitude;
  if(Number.isFinite(left)&&Number.isFinite(right)&&
     Number.isFinite(det)&&Number.isFinite(magnitude)&&
     Number.isFinite(err)&&Math.abs(det)>err){
   return det<0?outcomes.fast[0]:outcomes.fast[1];
  }
 }
 const exact=orientation2D(pa,pb,pc);
 return outcomes.fallback[exact.sign+1];
}
module.exports={orientation2DAdaptive};
