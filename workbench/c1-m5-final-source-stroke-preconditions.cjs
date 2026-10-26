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
const {auditC1ExactOriginalVertexObserverRays}=
 require('./c1-m5-exact-original-vertex-rays.cjs');
const {auditC1OriginalClosedEdgeRayContinuity}=
 require('./c1-m5-closed-original-edge-ray-continuity.cjs');
const {auditC1OriginalClosedVertexStars}=
 require('./c1-m5-original-closed-vertex-stars.cjs');
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
 const rayLedger=auditC1ExactOriginalVertexObserverRays({
  geometry,revision});
 if(rayLedger.sourceGeometryId!==geometry.id||
    rayLedger.revision!==revision||
    rayLedger.signedV5ActionCount!==0)
  throw new RangeError('unreviewed source-vertex endpoint observer rays');
 const vertexRays=new Map(rayLedger.rows.map(x=>
  [x.view+'@'+x.originalVertexId,x]));
 if(vertexRays.size!==rayLedger.rows.length)
  throw new RangeError('duplicate source 3D vertex observer-ray identity');
 const edgeClosure=auditC1OriginalClosedEdgeRayContinuity({
  geometry,revision});
 if(edgeClosure.sourceGeometryId!==geometry.id||
    edgeClosure.revision!==revision||
    edgeClosure.signedV5ActionCount!==0)
  throw new RangeError('unsigned original full-edge rays were not independently proved');
 const closedByKey=new Map(edgeClosure.rows.map(row=>[
  row.originalPhysicalSourceEdgeId+'@'+row.view,row]));
 if(closedByKey.size!==edgeClosure.rows.length)
  throw new RangeError('duplicate original source closed edge proof');
 const sourceStar=auditC1OriginalClosedVertexStars({geometry,revision});
 if(sourceStar.sourceGeometryId!==geometry.id||
    sourceStar.revision!==revision||
    sourceStar.signedV5ActionCount!==0||
    sourceStar.entireOriginalClosed3DVertexFanTopologyCertified!==true)
  throw new RangeError('unsigned reviewed physical 3D vertex star evidence required');
 const starByKey=new Map(sourceStar.rows.map(row=>[
  row.view+'@'+row.original3DVertexId,row]));
 if(starByKey.size!==sourceStar.rows.length)
  throw new RangeError('source 3D vertex star identity repeated');
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
  originalSourceSubspanInheritedExactClosedEdgeRayClear:0,
  originalSourcePaperCut3DContinuityPreserved:0,
  originalSourceClosedRayNotYetProven:0,
  originalVertexEndpointExactRayClearWitnesses:0,
  originalVertexEndpointExactNearInteriorWitnesses:0,
  originalVertexEndpointRayTangenciesHeld:0,
  paperCutEndpointsWithNoOriginalVertexRayProof:0,
  certifiedOriginal3DVertexFanEndpointWitnesses:0,
  originalVertexFanM4EndpointLinkMissingHeld:0,
  actualOriginal3DVertexProjectedAliasWitnessesHeld:0,
  trueCommon3DVertexSourcePairsCounted:0,
  syntheticPaperPointCannotAcquireClosed3DVertexStarCount:0,
  innerCutEndpointsWithNoCrossSourceJoin:0,
  exactInwardPrunedOriginalSourceCandidates:0,
  localPositiveAfterStrictHiddenAliasElimination:0,
  realCadPositiveWithoutWholeRayProof:0,
  nonHullRayClearButCADSourceNotUniqueOrIncomplete:0,
  nonHullRayClearButSourcePriorityUnproven:0,
  strictlyHiddenEvidenceNotYetSignedAsDash:0,
  attemptedNewEngineeringLineSignatures:0,
  attemptedNewV5Actions:0
 };
 for(const row of recomputed.rows){
  for(const span of row.sourceBoundSubintervals){
   const currentEdge=closedByKey.get(row.sourceEdgeId+'@'+row.view);
   const currentCut=currentEdge?.originalCutSubspans.find(x=>
    x.originalParameterRange[0]===span.originalParameterRange[0]&&
    x.originalParameterRange[1]===span.originalParameterRange[1]);
   if(!currentEdge||!currentCut||
      currentEdge.sourceGeometryId!==geometry.id||
      currentEdge.revision!==revision||
      currentEdge.signedV5Action!==false||
      currentCut.signedV5Action!==false)
    throw new RangeError('original edge-ray closure lost current M4 source parameter');
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
   const originalPruning=
    span.originalPaperCandidatesPrunedByExactStrictInward;
   const m0Unique=span.originalSourceUniquenessOnlyAfterExactM0Pruning===true;
   if(!originalPruning||originalPruning.revision!==revision||
      originalPruning.sourceGeometryId!==geometry.id||
      originalPruning.signedV5Action!==false||
      originalPruning.actualOCCTTopoDSEdgeIdentityRecovered!==false||
      (m0Unique&&(!originalPruning.
       targetUniqueWithinOriginalPaperCandidatesByExactM0||
       !originalPruning.multipleCandidatesNarrowedByExactM0)))
    throw new RangeError('unreviewed original-source candidate pruning');
   const completeRealCADPositive=cadCovered&&(cadUnique||m0Unique);
   // The final REAL OCCT/M5 stroke consumer now binds its original source
   // ray and paper-cut topology to the independently proven M4 physical
   // [0,1] parameter certificate produced by the existing M4->M5 path.
   // Do not lift a whole-edge ray into stroke readiness from a stale
   // display partition boolean or an accidentally omitted one-ULP gap.
   const originalCoverage=currentEdge.
    originalM4Canonical3DSourceParameterCoverage;
   const canonicalComplete=currentEdge.
    originalM4Canonical3DSourcePartitionPositivelyProven===true;
   const collapsed=currentEdge.originalM4Canonical3DSourceCollapsedToPoint===true;
   if(!originalCoverage||
      originalCoverage.originalParameterRange?.[0]!==0||
      originalCoverage.originalParameterRange?.[1]!==1||
      !Array.isArray(originalCoverage.positiveLengthUncoveredIntervals)||
      canonicalComplete!==
       originalCoverage.entireOriginalParameterIntervalCovered||
      currentEdge.originalM4PaperParameterPartitionComplete!==(
       canonicalComplete&&!collapsed)||
      (!collapsed&&JSON.stringify(originalCoverage.
       positiveLengthUncoveredIntervals)!==
       JSON.stringify(currentEdge.missingProjectedPaperSourceParameterRanges))||
      collapsed&&currentEdge.originalM4PaperParameterPartitionComplete===true)
    throw new RangeError('final source stroke M4/M5 original 3D parameter partition witness mismatch');
   const inheritedClear=currentEdge.
    completeSourceOriginal3DRayClosedIntervalClear===true&&
    canonicalComplete&&!collapsed&&
    currentEdge.originalPhysicalCreaseProven===true;
   if(inheritedClear&&!clear&&!outer)
    throw new RangeError('closed original ray clearance conflicts with M0 subspan');
   if(inheritedClear)
    counts.originalSourceSubspanInheritedExactClosedEdgeRayClear++;
   else if(physical&&!outer&&!hidden)
    counts.originalSourceClosedRayNotYetProven++;
   if(currentCut.sameOriginalSourceCut3DJoinFromPrevious)
    counts.originalSourcePaperCut3DContinuityPreserved++;
   if(clear&&hidden)
    throw new RangeError('continuous source ray is both clear and hidden');
   const endpoints=[j.fromEndpoint,j.toEndpoint];
   if(endpoints.some(x=>!x||
       x.authorizedAsV5Junction!==false||
       x.anotherOriginalSource3DPointInferred!==false))
    throw new RangeError('fake or unverified physical original source endpoint');
   const verifiedEndpointStars=endpoints.map(endpoint=>{
    const id=endpoint.originalVertexId;
    if(id===null){
     counts.syntheticPaperPointCannotAcquireClosed3DVertexStarCount++;
     return {original3DVertexId:null,
      genuineClosed3DOriginalVertexFaceFanVerified:false,
      originalPaperM4EndpointLinkPositivelyVerified:false,
      projectedOriginalM4EndpointLinkMissingHeld:true,
      true3DOriginalSourceJunctionPairSourceEdgeIds:[],
      other3DVertexIdsWithSamePaperProjection:[],
      candidateProjectedPaperCutNever3DVertex:true,
      signedV5Action:false};
    }
    const proof=starByKey.get(row.view+'@'+id);
    if(!proof||proof.sourceGeometryId!==geometry.id||
       proof.revision!==revision||
       proof.oneConnectedOriginal3DVertexFaceFanProven!==true||
       proof.signedV5Action!==false||
       !['x','y','z'].every(k=>
        proof.original3DModelPoint[k]===endpoint.model3DPoint[k])||
       !proof.incidentOriginalSourceEdges.some(edge=>
        edge.originalSourceEdgeId===row.sourceEdgeId))
      throw new RangeError('current original source stroke endpoint not supported by authentic closed vertex fan');
    const sourceLink=proof.incidentOriginalSourceEdges.find(edge=>
     edge.originalSourceEdgeId===row.sourceEdgeId);
    if(!sourceLink.original3DEndpointConfirmedByM4)
     counts.originalVertexFanM4EndpointLinkMissingHeld++;
    counts.certifiedOriginal3DVertexFanEndpointWitnesses++;
    counts.actualOriginal3DVertexProjectedAliasWitnessesHeld+=
     proof.distinct3DVerticesProjectingToSamePaperPoint.length;
    const pairs=proof.true3DOriginalSourceJunctionPairs.filter(pair=>
     pair.originalSourceEdgeIds.includes(row.sourceEdgeId));
    counts.trueCommon3DVertexSourcePairsCounted+=pairs.length;
    return {original3DVertexId:id,
     genuineClosed3DOriginalVertexFaceFanVerified:true,
     originalPaperM4EndpointLinkPositivelyVerified:
      sourceLink.original3DEndpointConfirmedByM4,
     projectedOriginalM4EndpointLinkMissingHeld:
      !sourceLink.original3DEndpointConfirmedByM4,
     true3DOriginalSourceJunctionPairSourceEdgeIds:pairs.map(pair=>
      [...pair.originalSourceEdgeIds]),
     other3DVertexIdsWithSamePaperProjection:
      [...proof.distinct3DVerticesProjectingToSamePaperPoint],
     candidateProjectedPaperCutNever3DVertex:false,
     completeVisibleEngineeringLineJunctionCertified:false,
     signedV5Action:false};
   });
   const verifiedEndpointRays=endpoints.map(endpoint=>{
    const id=endpoint.originalVertexId;
    if(id===null){
     if(endpoint.originalEndpoint3DIdentityVerified!==false)
      throw new RangeError('nonoriginal paper point forged source vertex');
     counts.paperCutEndpointsWithNoOriginalVertexRayProof++;
     return {originalVertexId:null,
      status:'paper-cut-without-original-3d-vertex-ray-proof',
      exactForwardRayClear:false,
      exactStrictInteriorNearOriginalVertex:false,
      actualReal3DSourceEndpointVerified:false,
      signedV5Action:false};
    }
    const v=vertexRays.get(row.view+'@'+id);
    if(!v||v.sourceGeometryId!==geometry.id||
       v.originalVertexId!==id||
       !endpoint.originalEndpoint3DIdentityVerified||
       !['x','y','z'].every(k=>
        v.originalModel3DPoint[k]===endpoint.model3DPoint[k]))
     throw new RangeError('original physical vertex endpoint ray is not 3D-source matched');
    if(v.proof.positiveForwardRayClear)
     counts.originalVertexEndpointExactRayClearWitnesses++;
    else if(v.proof.strictInteriorNearOriginalVertex)
     counts.originalVertexEndpointExactNearInteriorWitnesses++;
    else counts.originalVertexEndpointRayTangenciesHeld++;
    return {originalVertexId:id,status:v.exactOriginalVertex3DRayStatus,
     exactForwardRayClear:v.proof.positiveForwardRayClear,
     exactStrictInteriorNearOriginalVertex:
      v.proof.strictInteriorNearOriginalVertex,
     actualReal3DSourceEndpointVerified:true,
     signedV5Action:false};
   });
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
   if(m0Unique)counts.exactInwardPrunedOriginalSourceCandidates++;
   if(m0Unique&&positive)
    counts.localPositiveAfterStrictHiddenAliasElimination++;
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
    uniqueRealCADOriginalSourceNotCorroborated:!cadUnique,
    originalSourceUniquenessNotProvenEvenAfterExactM0Pruning:
     !(cadUnique||m0Unique),
    alreadyBehindAnotherOriginalPhysicalSource:sourceBehind,
    exactOriginal3DDuplicateNeedsCanonicalReduction:duplicate,
    sourceListFrontmostNotEstablished:!sourceLead,
    originalClosed3DEdgeObserverRayNotFullyCertified:!inheritedClear,
    originalEdgeM4CutPartitionHasGaps:
     !canonicalComplete||collapsed,
    sourceCrossEdgeJunctionsNotGloballyCertified:true,
    originalClosedVertex3DFanNotCertifiedForEveryEndpoint:
     verifiedEndpointStars.some(x=>
      !x.genuineClosed3DOriginalVertexFaceFanVerified),
    original3DVertexM4PaperEndpointLinkNotVerified:
     verifiedEndpointStars.some(x=>
      !x.originalPaperM4EndpointLinkPositivelyVerified),
    real3DVertexAliasesSharingPaperPointNeedSceneResolution:
     verifiedEndpointStars.some(x=>
      x.other3DVertexIdsWithSamePaperProjection.length>0),
    originalVertexEndpointRayIncompleteOrTangent:
     verifiedEndpointRays.some(x=>
      x.status==='paper-cut-without-original-3d-vertex-ray-proof'||
      x.status==='undetermined'),
    originalVertexForwardRayMayEnterSolid:
     verifiedEndpointRays.some(x=>
      x.exactStrictInteriorNearOriginalVertex),
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
    exactOriginalVertexObserverRayEndpoints:verifiedEndpointRays,
    reviewedOriginalClosed3DVertexFanEndpoints:verifiedEndpointStars,
    genuineOriginal3DSourceFanEndpointCount:
     verifiedEndpointStars.filter(x=>
      x.genuineClosed3DOriginalVertexFaceFanVerified).length,
    bothSourceEndpointsAreOriginalVertices:
     originalVertexEndpoints===2,
    allOriginalEndpointForwardRaysPositivelyClear:
     originalVertexEndpoints===2&&
      verifiedEndpointRays.every(x=>x.exactForwardRayClear),
    paperOnlyCrossSourceEndpointWitnessCount:projectedOnlyEndpointCount,
    sameSourceCutContinuityFromPriorPiece:
     j.sameOriginalSource3DContinuityFromPriorPiece,
    exactClosedOriginal3DSourceObserverRayClear:inheritedClear,
    canonicalOriginal3DSourceCutCoverageFromM4M5Bound:true,
    canonicalOriginal3DSourceCutPositiveCoverage:canonicalComplete&&!collapsed,
    remainingCanonicalM4Original3DParameterGaps:
     originalCoverage.positiveLengthUncoveredIntervals.map(x=>[...x]),
    exactOriginal3DEdgeRayFromFullSourceAndBothVertices:
     currentEdge.completeSourceOriginal3DRayClosedIntervalClear,
    M4Original3DEdgeCutContinuityVerified:
     currentCut.sameOriginalSourceCut3DJoinFromPrevious,
    paperEventCutsNeverCertifiedAsNew3DVertices:
     currentEdge.allPaperInteriorCutPointsRetainNonvertexIdentity,
    singleOpaqueSolidContinuousOpenRayClear:clear,
    singleOpaqueSolidContinuousStrictlyHidden:hidden,
    genuineRealCADCompleteSourceCoverage:cadCovered,
    genuineRealCADUniqueSourceCorroborated:cadUnique,
    originalSourceUniqueOnlyByIndependentExactInwardExclusions:m0Unique,
    originalCADTopoDSEdgeIdentityRecovered:false,
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
 if(counts.certifiedOriginal3DVertexFanEndpointWitnesses+
    counts.syntheticPaperPointCannotAcquireClosed3DVertexStarCount!==
    counts.totalOriginalSourceEdgeViewSubspans*2)
  throw new RangeError('original 3D vertex fan evidence fails exact M4 endpoint accounting');
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
  independentOriginalVertexRayProofSchema:rayLedger.schema,
  independentlyRecomputedClosedOriginalEdgeRaySchema:edgeClosure.schema,
  independentlyRecomputedOriginal3DVertexFanSchema:sourceStar.schema,
  original3DVertexClosedFaceFanTotals:sourceStar.counts,
  originalFull3DEdgeRayContinuityTotals:edgeClosure.counts,
  sourceOriginalVertexObserverRayTotals:rayLedger.counts,
  counts,subspans:ledger,
  onlyOneReviewedConvexSolidScope:true,
  allSourceEdgeProjectionAndCADCandidateTruthVerified:true,
  allFinalSceneAndStandardLineSignaturesApproved:false,
  noSecondConstructionIntentOrV5Player:true,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={auditC1OriginalStrokeFinalPreconditions};
