'use strict';
/**
 * DA-ARCH-MANDATORY-002 / #372: independent M0 exact predicate metamorphic
 * audit. Tests only the public predicate; does not modify shared core or
 * mistake exact binary64 orientation for tolerance, intersection or proof.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const {orientation2D} = require('../../core/numeric/orientation2d-exact.cjs');

test('M0 orientation obeys cyclic invariance and antisymmetry', () => {
  const triples = [
    [[0, 0], [3, 0], [1, 2]],
    [[-8, 4], [2, 7], [5, -3]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 0], [2 ** -500, 0], [0, 2 ** -500]],
    [[0, 0], [2 ** 500, 0], [0, 2 ** 500]]
  ];
  for (const [a, b, c] of triples) {
    const s = orientation2D(a, b, c).sign;
    assert.equal(orientation2D(b, c, a).sign, s);
    assert.equal(orientation2D(c, a, b).sign, s);
    assert.equal(orientation2D(a, c, b).sign, -s);
    assert.equal(orientation2D(b, a, c).sign, -s);
    assert.equal(orientation2D(c, b, a).sign, -s);
  }
});

test('M0 exact orientation preserves signs under exact power-of-two scaling', () => {
  const base = [[0, 0], [3, 1], [1, 5]];
  const expected = orientation2D(...base).sign;
  for (const exponent of [-500, -250, -20, 0, 20, 250, 500]) {
    const scale = 2 ** exponent;
    const scaled = base.map(([x, y]) => [x * scale, y * scale]);
    assert.equal(orientation2D(...scaled).sign, expected, 'scale 2^' + exponent);
  }
});

test('M0 exact orientation distinguishes subnormal positive area from zero', () => {
  const tiny = Number.MIN_VALUE;
  assert.equal(orientation2D([0, 0], [tiny, 0], [0, tiny]).sign, 1);
  assert.equal(orientation2D([0, 0], [tiny, 0], [tiny, 0]).sign, 0);
});

test('M0 rejects nonfinite, sparse and malformed points rather than proving orientation', () => {
  const good = [0, 0];
  const sparse = new Array(2); sparse[0] = 1;
  for (const bad of [[NaN, 0], [Infinity, 0], sparse, [1], [1, 2, 3], {x: 1, y: 2}]) {
    assert.throws(() => orientation2D(good, [1, 0], bad), TypeError);
  }
});

test('M0 exact sign is not a near-collinearity tolerance or intersection result', () => {
  const tiny = Number.MIN_VALUE;
  const result = orientation2D([0, 0], [1, 0], [0, tiny]);
  assert.deepEqual(result, {sign: 1, orientation: 'counterclockwise', exactForBinary64Inputs: true});
  assert.equal(Object.hasOwn(result, 'proofOfIntersection'), false);
  assert.equal(Object.hasOwn(result, 'globallyUnique'), false);
});
