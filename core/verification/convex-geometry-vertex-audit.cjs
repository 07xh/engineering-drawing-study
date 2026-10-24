'use strict';
/**
 * Opt-in OFFLINE source-shape binding of existing reviewed closed-convex
 * Geometry mesh to the ONE M0 exact bounded polyhedron vertex auditor.
 * Source is snapshotted first, then the current strict M0/M5 convex mesh
 * validator independently reconstructs all outward halfspaces.
 *
 * This does not certify that an external photo/camera or user statement
 * is authentic, nor that a caller-supplied revision is server-authored.
 * It never grants M4/M5 official hidden line or whole-scene evidence.
 */
const {verifiedConvexMeshHalfspaces}=
 require('../geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexVertexSetExact}=
 require('../numeric/exact-convex-vertex-set.cjs');
function auditConvexGeometryVertexSet({mesh,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('nonnegative source revision required');
 // A single immutable-by-detachment snapshot protects against changing
 // accessor-based source data during two independent mathematical audits.
 const source=structuredClone(mesh);
 const geometry=verifiedConvexMeshHalfspaces(source);
 const base={schema:'draftai-m0-convex-geometry-vertex-audit/1',
  sourceGeometryId:source.id,sourceRevision:revision,unit:'mm',
  sourceClosedConvexTopologyVerified:true,
  sourceSnapshotUsed:true,
  // Caller-provided revision is an assertion, NOT a trusted source binding.
  sourceRevisionIndependentlyVerified:false,
  originalImageCalibrationVerified:false,completeSceneVerified:false,
  officialLineStyleVerified:false,v5VerifiedExportReady:false};
 if(geometry.sourceFaceCount>16||geometry.sourceVertexCount>128)
  return Object.freeze({...base,status:'undetermined',
   reason:'exact-offline-audit-budget-exceeded',
   exactVertexSetVerified:false,fullDimensionalVerified:false});
 const exact=certifyConvexVertexSetExact({solid:{
  id:source.id,halfspaces:geometry.halfspaces,
  vertices:Object.values(source.data.points)
 }});
 return Object.freeze({...base,status:exact.status,
  reason:exact.reason,
  exactVertexSetVerified:
   exact.vertexSetCompleteForSuppliedHalfspacesVerified,
  fullDimensionalVerified:exact.fullDimensionalVerified,
  recessionConeTrivialVerified:exact.recessionConeTrivialVerified,
  vertexCount:exact.derivedVertexCount});
}
module.exports={auditConvexGeometryVertexSet};
