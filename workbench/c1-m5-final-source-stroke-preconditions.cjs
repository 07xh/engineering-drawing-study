'use strict';
/**
 * C1/M5 final per-original-source interval PRECONDITION gate, not a new
 * engineering-line classifier or V5 authority.
 *
 * This recomputes REAL OCJS HLR / reviewed convex M0, canonical M4 cuts,
 * M5 physical-crease dihedrals, exact strict inward/outward rays, two-edge
 * affine depth order, original 3D junctions and paper-source priority.
 * A caller-provided ledger is checked against the recomputation: display
 * booleans, candidate user metadata or a stale revision are not proofs.
 *
 * Most importantly, whole-open source visibility is not a GB solid line,
 * strict hidden ray is not a GB dashed line, and source-list front order
 * never establishes full all-face / all-junction engineering signoff.
 */
const {auditC1OcjsPhysicalCreaseCandidates}=
 require('./c1-ocjs-physical-crease-ray-evidence.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }return x;
};
const validStatuses=new Set([
 'sole-listed-original-physical-source',
 'strict-front-among-listed-original-physical-sources'
]);
function auditC1OriginalStrokeFinalPreconditions({
 oc,geometry,revision,physicalEvidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<1||!oc||
    typeof oc!=='object')
  throw new TypeError('real OpenCascade.js and original C1 revision required');
 // Important: this is the SAME canonical M5+real HLR path, not an
 // independent guessed set of CAD line candidates or a second V5 signer.
 const recomputed=auditC1OcjsPhysicalCreaseCandidates({
  oc,geometry,revision});
 if(physicalEvidence!==undefined&&
    JSON.stringify(physicalEvidence)!==JSON.stringify(recomputed))
  throw new TypeError('stale/forged C1 real CAD or M0-M5 physical source evidence');
 if(recomputed.sourceGeometryId!==geometry.id||
    recomputed.revision!==revision||
    recomputed.CADComputedGenuineOpenCascadeWasm!==true||
    recomputed.officialV5ActionCount!==0||
    recomputed.standardEngineeringStylesCertified!==false||
    recomputed.wholeSolidV5Ready!==false)
  throw new RangeError('canonical C1 source evidence is stale or already signed');
 const ledger=[],counts={
  totalOriginalSourceEdgeViewSubspans:0,
  externalContourHeld:0,
  unprovenPhysicalFeatureHeld:0,
  visibleWholeRayAndCadButOtherGatesRemain:0,
  strictlyHiddenWholeOpenRayButOtherGatesRemain:0,
  behindAnotherPhysicalSource:0,
  physical3DDuplicateHeld:0,
  unresolvedPhysicalVisibilityOrSourcePriority:0,
  withoutAnyOriginalVertexEndpoint:0,
  innerCutEndpointsWithNoCrossSourceJoin:0,
  realCadPositiveWithoutWholeRayProof:0,
  nonHullRayClearButCADSourceNotUniqueOrIncomplete:0,
  nonHullRayClearButSourcePriorityUnproven:0,
  strictlyHiddenEvidenceNotYetSignedAsDash:0,
  attemptedNewEngineeringLineSignatures:0,
  attemptedNewV5Actions:0
 };
 for(const row of recomputed.rows){
  for(const span of row.sourceBoundSubintervals){
   const j=span.independentOriginal3DJunctionProof;
   const priority=span.originalPaperSourcePriority;
   const physical=row.originalPhysicalDihedralVerified===true;
   const outer=span.projectedExteriorHullOverlap===true;
   if(span.sourceGeometryId!==geometry.id||
      span.sourceEdgeId!==row.sourceEdgeId||
      span.view!==row.view||
      span.officialEngineeringLineStyle!=='undetermined'||
      span.signedV5Action!==false||
      !j||!priority||j.signedV5Action!==false||
      priority.signedV5Action!==false||
      priority.standardEngineeringLineStyle!=='undetermined')
    throw new RangeError('unmatched source/physical junction/priority evidence');
   const clear=span.originalConvexOpaqueRayStatus===
    'single-opaque-solid-whole-open-ray-clear';
   const hidden=span.originalConvexOpaqueRayStatus===
    'single-opaque-solid-whole-open-ray-strictly-hidden';
   const sourceLead=priority.listedSourcePriorityProven===true&&
    validStatuses.has(priority.status);
   const sourceBehind=priority.status===
    'behind-another-original-source-open-interval';
   const duplicate=priority.status==='exact-original-3d-feature-duplicate-held';
   const cadCovered=span.completeOriginalSourceCADCoverage===true;
   const cadUnique=span.uniqueOriginal3DSourceCandidate===true;
   const completeRealCADPositive=cadCovered&&cadUnique;
   if(clear&&hidden)
    throw new RangeError('continuous source ray is both clear and hidden');
   const endpoints=[j.fromEndpoint,j.toEndpoint];
   if(endpoints.some(x=>!x||
       x.authorizedAsV5Junction!==false||
       x.anotherOriginalSource3DPointInferred!==false))
    throw new RangeError('fake or unverified physical original source endpoint');
   const originalVertexEndpoints=endpoints.filter(x=>
    x.originalEndpoint3DIdentityVerified===true).length;
   if(originalVertexEndpoints===0)
    counts.withoutAnyOriginalVertexEndpoint++;
   const projectedOnlyEndpointCount=endpoints.reduce((n,x)=>
    n+x.paperOnlyOtherSourceEdgeIds.length,0);
   if(projectedOnlyEndpointCount>0)
    counts.innerCutEndpointsWithNoCrossSourceJoin++;
   const positive=physical&&!outer&&clear&&sourceLead&&
    completeRealCADPositive;
   const diagnosticStatus=!physical?
    'unproven-original-physical-feature':
    outer?'already-original-m5-exterior-contour':
    duplicate?'real-3d-geometric-duplicate-held':
    sourceBehind?'another-original-source-strictly-ahead':
    hidden?'whole-open-interval-strictly-occluded-by-single-convex-solid':
    positive?'positive-visible-original-open-subspan-awaiting-final-M5':
    'unresolved-original-physical-stroke';
   counts.totalOriginalSourceEdgeViewSubspans++;
   if(!physical)counts.unprovenPhysicalFeatureHeld++;
   else if(outer)counts.externalContourHeld++;
   else if(duplicate)counts.physical3DDuplicateHeld++;
   else if(sourceBehind)counts.behindAnotherPhysicalSource++;
   else if(hidden)counts.strictlyHiddenWholeOpenRayButOtherGatesRemain++;
   else if(positive)counts.visibleWholeRayAndCadButOtherGatesRemain++;
   else counts.unresolvedPhysicalVisibilityOrSourcePriority++;
   if(completeRealCADPositive&&!clear&&!outer&&physical)
    counts.realCadPositiveWithoutWholeRayProof++;
   if(physical&&!outer&&clear&&!completeRealCADPositive)
    counts.nonHullRayClearButCADSourceNotUniqueOrIncomplete++;
   if(physical&&!outer&&clear&&!sourceLead)
    counts.nonHullRayClearButSourcePriorityUnproven++;
   if(physical&&!outer&&hidden)
    counts.strictlyHiddenEvidenceNotYetSignedAsDash++;
   const blockers={
    realPhysicalCreaseNotProven:!physical,
    existingOuterContourHasOriginalV5Authority:outer,
    wholeSingleConvexOpenRayNotPositivelyClear:!clear,
    strictWholeSingleConvexOpenRayHidden:hidden,
    uniqueRealCADOriginalSourceNotCorroborated:!completeRealCADPositive,
    alreadyBehindAnotherOriginalPhysicalSource:sourceBehind,
    exactOriginal3DDuplicateNeedsCanonicalReduction:duplicate,
    sourceListFrontmostNotEstablished:!sourceLead,
    sourceCrossEdgeJunctionsNotGloballyCertified:true,
    projectedPaperOnlyEncountersNeedGlobalResolution:
     projectedOnlyEndpointCount>0,
    completeOpaqueSceneFeatureTopologyAndAllFacesNotCertified:true,
    applicableStandardEngineeringLineStyleNotCertified:true,
    originalConstructionIntentDAGAndSingleV5NotAuthorized:true
   };
   ledger.push({
    sourceGeometryId:geometry.id,revision,
    view:row.view,sourceEdgeId:row.sourceEdgeId,
    originalSourceParameterRange:[...span.originalParameterRange],
    fromModelMm:{...span.fromModelMm},
    toModelMm:{...span.toModelMm},
    originalPhysicalSourceCreaseProven:physical,
    originalM5ExteriorContourOverlap:outer,
    exactOriginal3DVertexEndpointCount:originalVertexEndpoints,
    paperOnlyCrossSourceEndpointWitnessCount:projectedOnlyEndpointCount,
    sameSourceCutContinuityFromPriorPiece:
     j.sameOriginalSource3DContinuityFromPriorPiece,
    singleOpaqueSolidContinuousOpenRayClear:clear,
    singleOpaqueSolidContinuousStrictlyHidden:hidden,
    genuineRealCADCompleteSourceCoverage:cadCovered,
    genuineRealCADUniqueSourceCorroborated:cadUnique,
    listedOriginalPhysicalSourceFrontOrderProven:sourceLead,
    originalPaperSourcePriorityStatus:priority.status,
    diagnosticStatus,blockers,
    positiveLineLikeGeometryReadyForFurtherM5Proof:positive,
    formalStandardLineStyle:'undetermined',
    certifiedEngineeringSolidLine:false,
    certifiedEngineeringDashedLine:false,
    constructionIntentAuthorized:false,
    signedV5Action:false
   });
  }
 }
 const total=counts.externalContourHeld+
  counts.unprovenPhysicalFeatureHeld+
  counts.visibleWholeRayAndCadButOtherGatesRemain+
  counts.strictlyHiddenWholeOpenRayButOtherGatesRemain+
  counts.behindAnotherPhysicalSource+counts.physical3DDuplicateHeld+
  counts.unresolvedPhysicalVisibilityOrSourcePriority;
 if(total!==counts.totalOriginalSourceEdgeViewSubspans||
    total!==recomputed.counts.sourceBoundSubintervalCount||
    ledger.some(s=>s.formalStandardLineStyle!=='undetermined'||
     s.certifiedEngineeringSolidLine!==false||
     s.certifiedEngineeringDashedLine!==false||
     s.signedV5Action!==false))
  throw new RangeError('C1 final source obligations cannot mint new official V5');
 return freeze({
  schema:'draftai-c1-m5-recomputed-real-wasm-final-source-obligations/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  realCADAndM5RecomputedFromCurrentOriginalReviewedSource:true,
  originalPhysicalEvidenceSchema:recomputed.schema,
  counts,subspans:ledger,
  onlyOneReviewedConvexSolidScope:true,
  allSourceEdgeProjectionAndCADCandidateTruthVerified:true,
  allFinalSceneAndStandardLineSignaturesApproved:false,
  noSecondConstructionIntentOrV5Player:true,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={auditC1OriginalStrokeFinalPreconditions};
