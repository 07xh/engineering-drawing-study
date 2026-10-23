'use strict';
/**
 * DA-02-A: isolated, exact-input planar tangency foundation.
 *
 * Coordinates and radii share the caller's mathematical unit (for example mm).
 * This module is NOT the frozen DA-GEOM-CONTRACT-v1, does not use canvas pixels,
 * contains no textbook artwork, and never selects one of several valid centers.
 *
 * Stage A deliberately models infinite straight lines and EXTERNAL circle-to-
 * fillet-circle tangency. Finite segments, internal tangency, oriented arc sweeps,
 * and G1 joins between finite arc segments require separate stage B/C validation.
 */
const DEFAULT_TOLERANCE = 1e-9;

function finiteNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError(label + ' must be a finite number');
  return value;
}

function point(value, label) {
  if (!value || typeof value !== 'object')
    throw new TypeError(label + ' must be a point');
  return { x: finiteNumber(value.x, label + '.x'),
    y: finiteNumber(value.y, label + '.y') };
}

function positive(value, label) {
  finiteNumber(value, label);
  if (value <= 0) throw new RangeError(label + ' must be positive');
  return value;
}

function tolerance(value = DEFAULT_TOLERANCE) {
  return positive(value, 'tolerance');
}

function normalizedLine(line) {
  if (!line || typeof line !== 'object')
    throw new TypeError('line is required');
  const a = point(line.a, 'line.a'), b = point(line.b, 'line.b');
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length <= 1e-12)
    throw new RangeError('line endpoints must be distinct');
  const tx = dx / length, ty = dy / length;
  return { a, b, tangent: { x: tx, y: ty },
    normal: { x: -ty, y: tx }, length };
}

function signedDistance(inputPoint, inputLine) {
  const p = point(inputPoint, 'point');
  const line = normalizedLine(inputLine);
  return (p.x - line.a.x) * line.normal.x
    + (p.y - line.a.y) * line.normal.y;
}

function offsetLine(inputLine, signedOffset) {
  const line = normalizedLine(inputLine);
  const amount = finiteNumber(signedOffset, 'signedOffset');
  const shift = p => ({ x: p.x + line.normal.x * amount,
    y: p.y + line.normal.y * amount });
  return { a: shift(line.a), b: shift(line.b) };
}

function externalLineCircleFillets({
  line: inputLine, circle: inputCircle, filletRadius,
  side = 1, epsilon = DEFAULT_TOLERANCE
} = {}) {
  const line = normalizedLine(inputLine);
  if (!inputCircle || typeof inputCircle !== 'object')
    throw new TypeError('circle is required');
  const circleCenter = point(inputCircle.center, 'circle.center');
  const circleRadius = positive(inputCircle.radius, 'circle.radius');
  const r = positive(filletRadius, 'filletRadius');
  const tol = tolerance(epsilon);
  if (side !== 1 && side !== -1)
    throw new RangeError('side must be +1 or -1 relative to line direction');

  // Center locus of the fillet: the signed-distance-r offset line.
  const offsetPoint = {
    x: line.a.x + line.normal.x * side * r,
    y: line.a.y + line.normal.y * side * r
  };
  // External tangency to fixed circle: the circle of possible centers
  // is centered at the given circle center with radius R+r.
  const centerDistance = circleRadius + r;
  if (!Number.isFinite(centerDistance))
    throw new RangeError('sum of radii is not finite');
  const relative = { x: circleCenter.x - offsetPoint.x,
    y: circleCenter.y - offsetPoint.y };
  const along = relative.x * line.tangent.x + relative.y * line.tangent.y;
  const closest = {
    x: offsetPoint.x + along * line.tangent.x,
    y: offsetPoint.y + along * line.tangent.y
  };
  const separation = Math.hypot(circleCenter.x - closest.x,
    circleCenter.y - closest.y);
  const margin = tol * Math.max(1, circleRadius, r, centerDistance, separation);
  const empty = {
    scope: 'infinite-line-and-circle-external-tangency',
    candidateCount: 0, status: 'none', candidates: [],
    continuousDegreesOfFreedom: null, unit: 'input-math-unit',
    uniquenessScope: 'fixed infinite line, signed side, fixed circle, external tangency'
  };
  if (separation > centerDistance + margin)
    return empty;

  const tangentCase = Math.abs(separation - centerDistance) <= margin;
  const halfSpan = tangentCase ? 0
    : Math.sqrt(Math.max(0, (centerDistance - separation) * (centerDistance + separation)));
  if (!Number.isFinite(halfSpan))
    throw new RangeError('candidate geometry exceeds finite numeric range');

  const makeCandidate = (direction, index) => {
    const center = {
      x: closest.x + direction * halfSpan * line.tangent.x,
      y: closest.y + direction * halfSpan * line.tangent.y
    };
    const lineContact = {
      x: center.x - side * r * line.normal.x,
      y: center.y - side * r * line.normal.y
    };
    const ratio = circleRadius / centerDistance;
    const circleContact = {
      x: circleCenter.x + (center.x - circleCenter.x) * ratio,
      y: circleCenter.y + (center.y - circleCenter.y) * ratio
    };
    const residuals = {
      signedLineDistance: Math.abs(
        (center.x - line.a.x) * line.normal.x
        + (center.y - line.a.y) * line.normal.y - side * r),
      centerDistance: Math.abs(
        Math.hypot(center.x - circleCenter.x, center.y - circleCenter.y)
        - centerDistance),
      contactOnCircle: Math.abs(
        Math.hypot(circleContact.x - circleCenter.x,
          circleContact.y - circleCenter.y) - circleRadius),
      contactOnFillet: Math.abs(
        Math.hypot(circleContact.x - center.x,
          circleContact.y - center.y) - r),
      contactOnLine: Math.abs(
        (lineContact.x - line.a.x) * line.normal.x
        + (lineContact.y - line.a.y) * line.normal.y)
    };
    const maxResidual = Math.max(...Object.values(residuals));
    if (!Number.isFinite(maxResidual) || maxResidual > margin * 4)
      throw new RangeError('candidate fails numerical tangency validation');
    return { id: 'candidate-' + index, center, lineContact, circleContact,
      residuals, maxResidual };
  };
  const candidates = halfSpan === 0
    ? [makeCandidate(0, 1)]
    : [makeCandidate(-1, 1), makeCandidate(1, 2)];
  return {
    scope: empty.scope, unit: empty.unit,
    uniquenessScope: empty.uniquenessScope,
    status: candidates.length === 1 ? 'unique' : 'multiple',
    candidateCount: candidates.length,
    continuousDegreesOfFreedom: 0,
    // Geometric candidates are returned together; no selection is invented.
    candidates,
    auxiliary: {
      offsetLine: offsetLine(inputLine, side * r),
      circleCenter, centerLocusRadius: centerDistance,
      perpendicularDistance: separation
    }
  };
}

module.exports = {
  DEFAULT_TOLERANCE, normalizedLine, signedDistance,
  offsetLine, externalLineCircleFillets
};
