'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizedLine, signedDistance, offsetLine,
  externalLineCircleFillets } = require('../../engines/planar/offset-tangency.cjs');

const close = (actual, expected, tolerance = 1e-7) =>
  assert.ok(Math.abs(actual - expected) <= tolerance,
    String(actual) + ' was not close to ' + String(expected));
const translated = (p, dx, dy) => ({ x: p.x + dx, y: p.y + dy });
const basic = () => ({
  line: { a: { x: -10, y: 0 }, b: { x: 10, y: 0 } },
  circle: { center: { x: 0, y: 5 }, radius: 8 },
  filletRadius: 3, side: 1
});

test('rejects coincident endpoints rather than treating a point as a line', () => {
  assert.throws(() => normalizedLine({ a: { x: 0, y: 0 },
    b: { x: 0, y: 0 } }), /distinct/);
});

test('rejects finite-looking but invalid and non-number coordinates', () => {
  for (const bad of [NaN, Infinity, -Infinity, '3', null])
    assert.throws(() => externalLineCircleFillets({
      ...basic(), circle: { center: { x: bad, y: 5 }, radius: 8 }
    }));
});

test('rejects missing line/circle and degenerate tiny line', () => {
  assert.throws(() => externalLineCircleFillets({ circle: basic().circle,
    filletRadius: 3 }));
  assert.throws(() => externalLineCircleFillets({ line: basic().line,
    filletRadius: 3 }));
  assert.throws(() => normalizedLine({ a: { x: 0, y: 0 },
    b: { x: 1e-14, y: 0 } }), /distinct/);
});

test('rejects nonpositive or nonfinite radii', () => {
  for (const radius of [-2, 0, NaN, Infinity]) {
    assert.throws(() => externalLineCircleFillets({
      ...basic(), filletRadius: radius }));
    assert.throws(() => externalLineCircleFillets({
      ...basic(), circle: { ...basic().circle, radius } }));
  }
});

test('rejects invalid side and epsilon', () => {
  assert.throws(() => externalLineCircleFillets({ ...basic(), side: 0 }));
  assert.throws(() => externalLineCircleFillets({ ...basic(), side: 'left' }));
  assert.throws(() => externalLineCircleFillets({ ...basic(), epsilon: 0 }));
  assert.throws(() => externalLineCircleFillets({ ...basic(), epsilon: -1 }));
});

test('unit tangent and normal are orthogonal, signed distance respects orientation', () => {
  const l = normalizedLine(basic().line);
  close(Math.hypot(l.tangent.x, l.tangent.y), 1);
  close(l.tangent.x * l.normal.x + l.tangent.y * l.normal.y, 0);
  close(signedDistance({ x: 1, y: 3 }, basic().line), 3);
  close(signedDistance({ x: 1, y: 3 },
    { a: basic().line.b, b: basic().line.a }), -3);
});

test('offset line moves signed distance, not along its tangent', () => {
  const line = basic().line;
  const moved = offsetLine(line, 7);
  close(signedDistance(moved.a, line), 7);
  close(signedDistance(moved.b, line), 7);
  close(signedDistance(offsetLine(line, -2).a, line), -2);
});

test('two external line-circle centers are enumerated, never guessed', () => {
  const result = externalLineCircleFillets(basic());
  assert.equal(result.status, 'multiple');
  assert.equal(result.candidateCount, 2);
  assert.equal(result.continuousDegreesOfFreedom, 0);
  assert.equal(result.candidates.length, 2);
  assert.ok(result.candidates[0].center.x < 0);
  assert.ok(result.candidates[1].center.x > 0);
  const x = Math.sqrt(121 - 4);
  close(result.candidates[0].center.x, -x);
  close(result.candidates[1].center.x, x);
  for (const c of result.candidates) {
    close(c.center.y, 3);
    close(c.lineContact.y, 0);
    assert.ok(c.maxResidual < 1e-7);
    close(c.residuals.contactOnCircle, 0);
    close(c.residuals.contactOnFillet, 0);
  }
});

test('negative side enumerates the other offset locus', () => {
  const r = externalLineCircleFillets({ ...basic(), side: -1 });
  assert.equal(r.status, 'multiple');
  for (const c of r.candidates) close(c.center.y, -3);
});

test('far offset locus has no solution and never returns NaN geometry', () => {
  const r = externalLineCircleFillets({
    ...basic(), circle: { center: { x: 0, y: 100 }, radius: 8 },
    side: -1
  });
  assert.deepEqual(r.candidates, []);
  assert.equal(r.candidateCount, 0);
  assert.equal(r.status, 'none');
  assert.equal(r.continuousDegreesOfFreedom, null);
});

test('exact tangency produces exactly one center', () => {
  const r = externalLineCircleFillets({
    ...basic(), circle: { center: { x: 0, y: 14 }, radius: 8 }
  });
  assert.equal(r.status, 'unique');
  assert.equal(r.candidateCount, 1);
  close(r.candidates[0].center.x, 0);
  close(r.candidates[0].center.y, 3);
});

test('near-tangency within tolerance yields one bounded-residual candidate', () => {
  const r = externalLineCircleFillets({
    ...basic(), circle: { center: { x: 0, y: 14 + 5e-10 }, radius: 8 }
  });
  assert.equal(r.status, 'unique');
  assert.ok(r.candidates[0].maxResidual <= 1e-8);
});

test('near-tangency outside numeric tolerance does not invent a solution', () => {
  const r = externalLineCircleFillets({
    ...basic(), circle: { center: { x: 0, y: 14 + 2e-7 }, radius: 8 }
  });
  assert.equal(r.status, 'none');
});

test('increasing fillet radius recomputes candidate centers', () => {
  const before = externalLineCircleFillets(basic());
  const after = externalLineCircleFillets({ ...basic(), filletRadius: 4 });
  assert.equal(after.status, 'multiple');
  assert.notEqual(before.candidates[0].center.y, after.candidates[0].center.y);
  close(after.candidates[0].center.y, 4);
});

test('translation invariance for both center and contacts', () => {
  const input = basic(), dx = 1000, dy = -700;
  const moved = externalLineCircleFillets({
    ...input, line: { a: translated(input.line.a, dx, dy),
      b: translated(input.line.b, dx, dy) },
    circle: { center: translated(input.circle.center, dx, dy),
      radius: input.circle.radius }
  });
  const original = externalLineCircleFillets(input);
  for (let i = 0; i < 2; i++)
    for (const key of ['center','lineContact','circleContact']) {
      close(moved.candidates[i][key].x, original.candidates[i][key].x + dx);
      close(moved.candidates[i][key].y, original.candidates[i][key].y + dy);
    }
});

test('uniform scale covariance without mixing pixel coordinates', () => {
  const input = basic(), factor = 4;
  const scaled = externalLineCircleFillets({
    line: { a: { x: input.line.a.x * factor, y: 0 },
      b: { x: input.line.b.x * factor, y: 0 } },
    circle: { center: { x: 0, y: input.circle.center.y * factor },
      radius: input.circle.radius * factor },
    filletRadius: input.filletRadius * factor
  });
  const original = externalLineCircleFillets(input);
  for (let i = 0; i < 2; i++) {
    close(scaled.candidates[i].center.x,
      factor * original.candidates[i].center.x);
    close(scaled.candidates[i].center.y,
      factor * original.candidates[i].center.y);
  }
});

test('diagonal line has true perpendicular contact', () => {
  const line = { a: { x: -5, y: -5 }, b: { x: 5, y: 5 } };
  const r = externalLineCircleFillets({ line,
    circle: { center: { x: 0, y: 2 }, radius: 3 }, filletRadius: 2 });
  assert.equal(r.status, 'multiple');
  const { tangent } = normalizedLine(line);
  for (const c of r.candidates) {
    const between = { x: c.center.x - c.lineContact.x,
      y: c.center.y - c.lineContact.y };
    close(between.x * tangent.x + between.y * tangent.y, 0);
    close(c.maxResidual, 0);
  }
});

test('reversing line endpoints and side preserves the geometric candidate set', () => {
  const first = externalLineCircleFillets(basic());
  const reversed = externalLineCircleFillets({
    ...basic(), line: { a: basic().line.b, b: basic().line.a }, side: -1
  });
  const sort = values => values.map(c => c.center.x).sort((a,b)=>a-b);
  for (let i=0; i<2; i++) close(sort(first.candidates)[i],sort(reversed.candidates)[i]);
});

test('input geometry is not mutated', () => {
  const input = basic();
  const before = JSON.stringify(input);
  externalLineCircleFillets(input);
  assert.equal(JSON.stringify(input),before);
});

test('scope does not claim uniqueness for unsupplied finite arcs or line segments', () => {
  const r = externalLineCircleFillets(basic());
  assert.match(r.scope, /infinite-line/);
  assert.match(r.uniquenessScope, /external tangency/);
  assert.ok(!Object.prototype.hasOwnProperty.call(r,'globallyUnique'));
});

test('rotation covariance preserves tangent centers and contact points', () => {
  const angle = Math.PI / 5;
  const c = Math.cos(angle), s = Math.sin(angle);
  const rotate = p => ({ x: c * p.x - s * p.y, y: s * p.x + c * p.y });
  const input = basic();
  const original = externalLineCircleFillets(input);
  const transformed = externalLineCircleFillets({
    ...input,
    line: { a: rotate(input.line.a), b: rotate(input.line.b) },
    circle: { center: rotate(input.circle.center), radius: input.circle.radius }
  });
  assert.equal(transformed.status, original.status);
  for (let i = 0; i < original.candidateCount; i++) {
    for (const key of ['center', 'lineContact', 'circleContact']) {
      const predicted = rotate(original.candidates[i][key]);
      close(transformed.candidates[i][key].x, predicted.x);
      close(transformed.candidates[i][key].y, predicted.y);
    }
  }
});

test('circle centered on offset line gives two symmetric tangent solutions', () => {
  const result = externalLineCircleFillets({
    ...basic(), circle: { center: { x: 1, y: 3 }, radius: 8 }
  });
  assert.equal(result.status, 'multiple');
  close(result.candidates[0].center.x, -10);
  close(result.candidates[1].center.x, 12);
  for (const candidate of result.candidates) close(candidate.maxResidual, 0);
});

test('deterministic numerical sample retains zero residuals and no false uniqueness', () => {
  let seenMultiple = 0, seenNone = 0;
  for (const angle of [0, Math.PI / 7, Math.PI / 2, Math.PI * 0.9]) {
    const tx = Math.cos(angle), ty = Math.sin(angle);
    const nx = -ty, ny = tx;
    const line = { a: { x: -12 * tx, y: -12 * ty },
      b: { x: 12 * tx, y: 12 * ty } };
    for (const offset of [-30, -10, 0, 3, 12, 30]) {
      const center = { x: 2 * tx + offset * nx, y: 2 * ty + offset * ny };
      for (const side of [-1, 1]) {
        const result = externalLineCircleFillets({ line,
          circle: { center, radius: 5 }, filletRadius: 2, side });
        if (result.status === 'none') seenNone++;
        if (result.status === 'multiple') seenMultiple++;
        assert.equal(result.candidateCount, result.candidates.length);
        assert.ok(result.candidates.length <= 2);
        for (const candidate of result.candidates) {
          assert.ok(candidate.maxResidual <= 1e-7);
          close(signedDistance(candidate.center, line), side * 2);
          close(Math.hypot(candidate.center.x - center.x,
            candidate.center.y - center.y), 7);
        }
      }
    }
  }
  assert.ok(seenNone > 0 && seenMultiple > 0);
});
