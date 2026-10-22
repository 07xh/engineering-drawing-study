'use strict';

/**
 * V3.7: adapt verified finite-solid plane-section solvers to a common
 * read-only result envelope. This does NOT certify projection visibility,
 * unique 3D reconstruction, or V5 construction steps.
 */
const finite = n => typeof n === 'number' && Number.isFinite(n);
const xyz = p => p && ['x', 'y', 'z'].every(k => finite(p[k]));
const copyPoint = p => ({x:p.x, y:p.y, z:p.z});

function adaptSectionResult(solidType, raw) {
  if (typeof solidType !== 'string' || !/^[a-z][a-z0-9-]*$/.test(solidType))
    throw new TypeError('solidType must be a stable identifier');
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new TypeError('section solver result required');
  const status = typeof raw.status === 'string' ? raw.status : 'undetermined';
  const verified = raw.verified === true && raw.perimeterVerified === true;
  const vertices = Array.isArray(raw.vertices) ? raw.vertices : [];
  const perimeter = Array.isArray(raw.perimeter) ? raw.perimeter : [];
  const validVertices = vertices.every(v => v && typeof v.id === 'string' && xyz(v.point));
  const validPerimeter = perimeter.every(e => e && typeof e.id === 'string' &&
    xyz(e.from) && xyz(e.to));
  const geometryVerified = verified && validVertices && validPerimeter &&
    vertices.length >= 3 && perimeter.length >= 3 &&
    raw.modelUnit === 'mm' && (status === 'unique' || status === 'ready');
  return {
    schemaVersion: 'v3.7-section-1',
    solidType,
    status: geometryVerified ? 'unique' : ((status === 'unique' || status === 'ready') ? 'undetermined' : status),
    verified: geometryVerified,
    modelUnit: 'mm',
    vertices: geometryVerified ? vertices.map(v => ({id:v.id, point:copyPoint(v.point)})) : [],
    perimeter: geometryVerified ? perimeter.map(e => ({
      id:e.id, from:copyPoint(e.from), to:copyPoint(e.to)
    })) : [],
    visibilityVerified: false,
    projectionVerified: false,
    constructionStepsReady: false,
    globallyUnique: null,
    reason: geometryVerified ? null : (raw.reason || 'section requires further validation')
  };
}

module.exports = {adaptSectionResult};
