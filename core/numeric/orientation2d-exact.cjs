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
const words = new DataView(new ArrayBuffer(8));

function point2(value, label) {
  if (!Array.isArray(value) || value.length !== 2 ||
      !Object.hasOwn(value, 0) || !Object.hasOwn(value, 1) ||
      typeof value[0] !== 'number' || !Number.isFinite(value[0]) ||
      typeof value[1] !== 'number' || !Number.isFinite(value[1])) {
    throw new TypeError(label + ' must be a dense finite 2D point');
  }
  return value;
}

// A finite binary64 value is represented exactly as significand * 2^exponent.
function dyadic(number) {
  words.setFloat64(0, number, false);
  const high = words.getUint32(0, false);
  const low = words.getUint32(4, false);
  const exponentBits = (high >>> 20) & 0x7ff;
  const fraction = (BigInt(high & 0xfffff) << 32n) | BigInt(low);
  if (exponentBits === 0 && fraction === 0n) return { n: 0n, e: 0 };
  const mantissa = exponentBits === 0 ? fraction : ((1n << 52n) | fraction);
  return {
    n: (high >>> 31) === 1 ? -mantissa : mantissa,
    e: exponentBits === 0 ? -1074 : exponentBits - 1075
  };
}

function difference(a, b) {
  if (b.n === 0n) return a;
  if (a.n === 0n) return { n: -b.n, e: b.e };
  const e = Math.min(a.e, b.e);
  return { n: (a.n << BigInt(a.e - e)) - (b.n << BigInt(b.e - e)), e };
}

function product(a, b) {
  return { n: a.n * b.n, e: a.e + b.e };
}

const POSITIVE = Object.freeze({ sign: 1, orientation: 'counterclockwise',
  exactForBinary64Inputs: true });
const NEGATIVE = Object.freeze({ sign: -1, orientation: 'clockwise',
  exactForBinary64Inputs: true });
const COLLINEAR = Object.freeze({ sign: 0, orientation: 'collinear',
  exactForBinary64Inputs: true });

function orientation2D(a, b, c) {
  point2(a, 'a'); point2(b, 'b'); point2(c, 'c');
  const ax = dyadic(a[0]), ay = dyadic(a[1]);
  const bx = dyadic(b[0]), by = dyadic(b[1]);
  const cx = dyadic(c[0]), cy = dyadic(c[1]);
  const abx = difference(bx, ax), aby = difference(by, ay);
  const acx = difference(cx, ax), acy = difference(cy, ay);
  const determinant = difference(product(abx, acy), product(aby, acx));
  return determinant.n > 0n ? POSITIVE : determinant.n < 0n ? NEGATIVE : COLLINEAR;
}

module.exports = { orientation2D };
