'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { orientation2D } = require('../../core/numeric/orientation2d-exact.cjs');
const sign = (a, b, c) => orientation2D(a, b, c).sign;

test('M0 exact orientation returns stable signed branches and immutable evidence', () => {
  assert.deepEqual(orientation2D([0, 0], [1, 0], [0, 1]),
    { sign: 1, orientation: 'counterclockwise', exactForBinary64Inputs: true });
  assert.equal(sign([0, 0], [0, 1], [1, 0]), -1);
  assert.equal(sign([0, 0], [5, 5], [10, 10]), 0);
  assert.equal(sign([3, 4], [3, 4], [9, 8]), 0);
  assert.equal(sign([-0, -0], [1, 0], [0, 1]), 1);
  assert.ok(Object.isFrozen(orientation2D([0, 0], [1, 0], [0, 1])));
});

test('M0 avoids cancellation that rounds a nonzero integer determinant to zero', () => {
  const n = 2 ** 52;
  const a = [0, 0], b = [n, n - 1], c = [n - 1, n - 2];
  assert.equal((b[0] * c[1] - b[1] * c[0]), 0);
  assert.equal(sign(a, b, c), -1); // Exact determinant is -1.
  assert.equal(sign(a, c, b), 1);
});

test('M0 handles subnormal determinants that underflow to floating zero', () => {
  const m = Number.MIN_VALUE;
  assert.equal(m * m, 0);
  assert.equal(sign([0, 0], [m, 0], [0, m]), 1);
  assert.equal(sign([0, 0], [0, m], [m, 0]), -1);
});

test('M0 handles determinant products and coordinate differences beyond Number range', () => {
  assert.equal(sign([1e308, 0], [-1e308, 1], [0, 3]), -1);
  assert.equal(sign([-1e308, 0], [1e308, 1], [0, 3]), 1);
});

test('M0 enforces permutation and safe-frame translation invariance', () => {
  const a = [2, 4], b = [12, 8], c = [7, 13];
  const translate = p => [p[0] + 1_000_000, p[1] - 1_000_000];
  assert.equal(sign(a, b, c), sign(translate(a), translate(b), translate(c)));
  assert.equal(sign(a, b, c), -sign(a, c, b));
  assert.equal(sign(a, b, c), sign(b, c, a));
  assert.equal(sign(a, b, c), sign(a.map(v => v * 0.5), b.map(v => v * 0.5), c.map(v => v * 0.5)));
});

test('M0 rejects holes, nonfinite values, implicit units and malformed coordinates', () => {
  const invalid = [null, {}, [0], [0, 1, 2], [0, NaN],
    [0, Infinity], ['0', 1], [, 1], [0, ,], new Float64Array([0, 1])];
  for (const point of invalid) {
    assert.throws(() => orientation2D(point, [1, 0], [0, 1]), TypeError);
    assert.throws(() => orientation2D([0, 0], point, [0, 1]), TypeError);
    assert.throws(() => orientation2D([0, 0], [1, 0], point), TypeError);
  }
});

test('M0 exposes exact representable-input predicate, never a proximity/uniqueness claim', () => {
  const a = orientation2D([0, 0], [1, 0], [0, Number.MIN_VALUE]);
  assert.equal(a.orientation, 'counterclockwise');
  assert.equal(a.exactForBinary64Inputs, true);
  assert.equal(Object.hasOwn(a, 'withinTolerance'), false);
  assert.equal(Object.hasOwn(a, 'globallyUnique'), false);
  assert.equal(Object.hasOwn(a, 'intersectionExists'), false);
});

test('M0 deterministic integer-grid regression agrees with independent BigInt determinant', () => {
  let state = 0x15a4b3c2;
  function draw() { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return (state % 2000001) - 1000000; }
  for (let i = 0; i < 512; i++) {
    const a = [draw(), draw()], b = [draw(), draw()], c = [draw(), draw()];
    const det = (BigInt(b[0]) - BigInt(a[0])) * (BigInt(c[1]) - BigInt(a[1])) -
      (BigInt(b[1]) - BigInt(a[1])) * (BigInt(c[0]) - BigInt(a[0]));
    const expected = det > 0n ? 1 : det < 0n ? -1 : 0;
    assert.equal(sign(a, b, c), expected, 'integer grid sample ' + i);
  }
});
