'use strict';

/**
 * Exact 2D orientation for the finite IEEE-754 binary64 coordinates received.
 * This determines the sign of (b-a) x (c-a) without floating-point
 * subtraction, multiplication or determinant cancellation.
 *
 * Exactness applies to the actual JavaScript Number inputs, not their
 * intended pre-rounding decimal values. It is NOT a distance tolerance,
 * collinearity-within-tolerance test, or proof that a segment intersects.
 * All coordinates must already share a consistent model frame and unit.
 * Pixel-to-millimetre conversion is the caller's separate responsibility.
 */
const {dyadic,difference,product}=require('./binary64-dyadic.cjs');

// This boundary is deliberately kept in the original authoritative 2D
// predicate: no second read of getter-backed/sparse source coordinates.
function point2(value,label){
 if(!Array.isArray(value)||value.length!==2||
    !Object.hasOwn(value,0)||!Object.hasOwn(value,1))
  throw new TypeError(label+' must be a dense finite 2D point');
 const x=value[0],y=value[1];
 if(typeof x!=='number'||!Number.isFinite(x)||
    typeof y!=='number'||!Number.isFinite(y))
  throw new TypeError(label+' must be a dense finite 2D point');
 return [x,y];
}


const POSITIVE = Object.freeze({ sign: 1, orientation: 'counterclockwise',
  exactForBinary64Inputs: true });
const NEGATIVE = Object.freeze({ sign: -1, orientation: 'clockwise',
  exactForBinary64Inputs: true });
const COLLINEAR = Object.freeze({ sign: 0, orientation: 'collinear',
  exactForBinary64Inputs: true });

function orientation2D(a, b, c) {
  const pa = point2(a, 'a'), pb = point2(b, 'b'), pc = point2(c, 'c');
  const ax = dyadic(pa[0]), ay = dyadic(pa[1]);
  const bx = dyadic(pb[0]), by = dyadic(pb[1]);
  const cx = dyadic(pc[0]), cy = dyadic(pc[1]);
  const abx = difference(bx, ax), aby = difference(by, ay);
  const acx = difference(cx, ax), acy = difference(cy, ay);
  const determinant = difference(product(abx, acy), product(aby, acx));
  return determinant.n > 0n ? POSITIVE : determinant.n < 0n ? NEGATIVE : COLLINEAR;
}

module.exports = { orientation2D };
