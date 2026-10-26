'use strict';
/**
 * Genuine native OCJS HCompound vs existing authoritative M0->M4->M5
 * ORIGINAL closed-convex source rays. This is a witness audit, not a
 * second line classifier, a TopoDS-generated edge provenance claim,
 * an engineering standard signer, or a V5/ConstructionStep creator.
 *
 * Positive-length gaps are NEVER bridged by tolerance: #752 discovered
 * that M4 can contain actual micro-gaps that must remain explicit.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {computeC1OcjsVisibleSegments}=
 require('../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const {auditC1OriginalClosedEdgeRayContinuity}=
 require('./c1-m5-closed-original-edge-ray-continuity.cjs');
const {pruneHiddenSharpPaperAliasesUsingExactM5}=
 require('./c1-native-hidden-exact-source-pruning.cjs');
const {auditC1OriginalClosedVertexStars}=
 require('./c1-m5-original-closed-vertex-stars.cjs');
const {auditC1NativeHidden3DEndpointFans}=
 require('./c1-native-hidden-3d-endpoint-fan-junctions.cjs');
const {auditC1NativeHiddenOriginalVertexEndpointProof}=
 require('./c1-native-hidden-original-3d-vertex-endpoints.cjs');
const {auditC1NativeHLRGeneratedToOriginalVertexConcordance}=
 require('./c1-native-hlr-topods-original-vertex-concordance.cjs');
const {auditC1ReviewedProjectedSourceEventGraph}=
 require('./c1-reviewed-projected-source-event-graph.cjs');
const {auditC1NativeHLRAllM4ProjectedEncounters}=
 require('./c1-native-hlr-complete-m4-projected-encounters.cjs');
const {auditNativeHiddenWholeOriginalSourceIntervals}=
 require('./c1-native-hidden-whole-source-interval-closure.cjs');
const {auditC1ProjectedSourcePairDepth}=
 require('./c1-projected-source-pair-affine-depth.cjs');
const {auditC1NativeHiddenFrontVisibleMasks}=
 require('./c1-native-hidden-front-visible-mask.cjs');
const {auditC1NativeHiddenDualOpenIntervalProof}=
 require('./c1-native-hidden-dual-proof-open-interval-union.cjs');
const {auditC1NativeHiddenExactModelFrontMasks}=
 require('./c1-native-hidden-exact-model-front-mask.cjs');
const {auditC1NativeHiddenUncoveredOriginalFrontRay}=
 require('./c1-native-hidden-exact-original-front-gap.cjs');
const frozen=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))frozen(v);Object.freeze(o);
 }return o;
};
const finite=Number.isFinite;
/**
 * Audit complete coverage of one actual original 3D source parameter
 * interval by native HLR projected candidate intervals. Floating-point
 * micro-gaps are recorded even when they are much smaller than paper ink.
 */
const {exactCandidateIntervalCoverage}=require('./c1-original-source-interval-coverage.cjs');

/**
 * Join the SAME original 3D source/view across genuine native HLR evidence
 * and the independent canonical M4 -> closed-ray M5 certificate.
 *
 * This verifies exact binary64 interval *identity*, not merely counts or an
 * upstream boolean. It cannot attest a generated TopoDS->original edge link,
 * full-scene continuous visibility, an engineering line type, or V5.
 */
function reviewCanonicalM4M5NativeHLRSourceIntervals({m5Row,nativeCandidates}={}){
 const row=m5Row,canonical=row?.originalM4Canonical3DSourceParameterCoverage;
 if(!row||!Array.isArray(row.originalCutSubspans)||
    !Array.isArray(nativeCandidates)||!canonical||
    row.officialEngineeringLineStyle!=='undetermined'||
    row.signedV5Action!==false||
    row.originalM4Canonical3DSourceCollapsedToPoint!==row.projectionCollapsed||
    canonical.originalParameterRange?.[0]!==0||
    canonical.originalParameterRange?.[1]!==1)
  throw new RangeError('real M5 canonical M4 source partition witness missing');
 const parts=row.originalCutSubspans;
 if(parts.some(part=>!Array.isArray(part.originalParameterRange)||
      part.signedV5Action!==false||
      part.applicableLineType!=='undetermined'||(
       part.exactWholeOpenStrictInwardHidden===true&&
       part.exactWholeOpenRayClear===true)))
  throw new RangeError('untrusted M5 exact original M4 subspan ray witness');
 // This independent union recomputation preserves even a one-ULP gap and
 // rejects contradictory or stale M4/M5 cut partitions before looking at HLR.
 const fromM5=exactCandidateIntervalCoverage([0,1],
  parts.map(p=>p.originalParameterRange));
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const full=!row.projectionCollapsed&&
  fromM5.entireOriginalParameterIntervalCovered;
 if(!equal(fromM5.positiveLengthCoveredIntervals,
       canonical.positiveLengthCoveredIntervals)||
    !equal(fromM5.positiveLengthUncoveredIntervals,
       canonical.positiveLengthUncoveredIntervals)||
    canonical.entireOriginalParameterIntervalCovered!==
     fromM5.entireOriginalParameterIntervalCovered||
    row.originalM4Canonical3DSourcePartitionPositivelyProven!==full||
    row.originalM4PaperParameterPartitionComplete!==full||
    (!row.projectionCollapsed&&
     !equal(fromM5.positiveLengthUncoveredIntervals,
       row.missingProjectedPaperSourceParameterRanges))||
    (row.projectionCollapsed&&
     (!equal(fromM5.positiveLengthUncoveredIntervals,[[0,1]])||
      row.missingProjectedPaperSourceParameterRanges?.length!==0)))
  throw new RangeError('native HLR/M5 source range contradicts independent canonical M4 coverage');
 if(nativeCandidates.some(c=>!c||!Array.isArray(c.range)||
    c.realOCCTHLREdgeToSourceIdentityRecovered!==false||
    c.nativeHLRActualClass!=='hidden-sharp'))
  throw new RangeError('unsigned genuine native HLR source ranges required');
 const native=exactCandidateIntervalCoverage([0,1],
  nativeCandidates.map(c=>c.range));
 const jointlyFull=full&&native.entireOriginalParameterIntervalCovered;
 return frozen({
  sourceEdgeId:row.originalPhysicalSourceEdgeId,view:row.view,
  originalSourceParameterRange:[0,1],
  canonicalM4Original3DAndM5RayCutUnionRecomputed:true,
  canonicalM4ParameterCoverage:fromM5,
  genuineNativeHiddenHLRCandidateParameterCoverage:native,
  originalM4Full3DSourceIntervalProven:full,
  actualNativeHiddenHLRCandidateFullOriginalParameterCoverage:
   native.entireOriginalParameterIntervalCovered,
  originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete:jointlyFull,
  originalM5StrictlyHiddenWholeOriginalSourceRay:
   parts.length>0&&parts.every(p=>
    p.exactWholeOpenStrictInwardHidden===true)&&full,
  allActualGeneratedTopoDSSourceHistoryAndSceneOcclusionProven:false,
  full3DEndpointAndEngineeringLineStyleProven:false,
  engineeringLineStyle:'undetermined',
  constructionIntentAuthorized:false,signedV5Action:false
 });
}
function auditC1NativeHiddenSharpVsM5({oc,geometry,revision}={}){
 if(!oc||typeof oc!=='object'||!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current pinned real OCJS and C1 source revision required');
 const proof=verifiedConvexMeshHalfspaces(geometry);
 const cad=computeC1OcjsVisibleSegments({oc,geometry,revision});
 const m5=auditC1OriginalClosedEdgeRayContinuity({geometry,revision});
 if(cad.sourceGeometryId!==geometry.id||m5.sourceGeometryId!==geometry.id||
    cad.revision!==revision||m5.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||
    cad.hiddenLineStylesCertified!==false||cad.v5Authorized!==false||
    cad.completeSourceTopology3DEndpointCorrespondence!==true||
    cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
    proof.status!=='validated-closed-convex-mesh'||
    m5.signedV5ActionCount!==0)
  throw new RangeError('native hidden OCCT/M0-M5 unsigned proof chain mismatch');
 const realIds=new Set(geometry.data.edges.map(([a,b])=>
  geometry.id+'::'+[a,b].sort().join('|')));
 const closedByKey=new Map(m5.rows.map(row=>
  [row.originalPhysicalSourceEdgeId+'@'+row.view,row]));
 if(closedByKey.size!==m5.rows.length)
  throw new RangeError('duplicate canonical M5 original 3D source ray');
 const nativeMap=new Map(),nativeHiddenSourceRefinements=[];
 const counts={realNativeHiddenSharpSegments:0,
  hiddenHLRWithMultiple3DSourceCandidates:0,
  nativeHiddenWithoutM0SourceCandidates:0,
  exactClosedOutwardRayExcludedHiddenCandidates:0,
  nativeHiddenSharpWithOneSurvivingM5Source:0,
  nativeHiddenSharpWithNoSurvivingM5Source:0,
  nativeHiddenSharpStillWithMultipleM5Sources:0,
  sourceViewIntervalsChecked:0,canonicalOriginalM4SubspansChecked:0,
  exactM5HiddenOpenSubspans:0,
  hiddenNativePaperCoverageConfirmedSubspans:0,
  uniqueNativePaperCandidatePlusExactM5HiddenSubspans:0,
  ambiguousHiddenNativePaperCandidateSubspans:0,
  positiveLengthHiddenNativePaperGaps:0,
  contradictoryVisibleCADAttributionRejected:0,
  canonicalM4M5NativeSourceViewIntervalsJointlyReviewed:0,
  canonicalM4FullOriginal3DSourceAndNativeHLRFullCandidateIntervals:0,
  canonicalM4AndNativeHLRIncompleteSourceViewIntervalsHeld:0,
  signedNewEngineeringStrokes:0,signedNewV5Actions:0};
 for(const view of VIEWS){
  const hidden=cad.hiddenSharpViews?.[view];
  if(!Array.isArray(hidden))throw new RangeError('missing real native HCompound view');
  for(const seg of hidden){
   if(seg.view!==view||seg.occtHLRVisibilityClass!=='hidden-sharp'||
      seg.actualOCCTHLRFlattenedBRepLineVerified!==true||
      seg.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
      seg.v5Authorized!==false||
      !Array.isArray(seg.sourceCandidate3DLifts)||
      seg.sourceCandidate3DLifts.length!==seg.projectedOriginalEdgeCandidates?.length)
    throw new RangeError('untrusted real native hidden HLR stroke');
   counts.realNativeHiddenSharpSegments++;
   if(seg.sourceCandidate3DLifts.length===0)
    counts.nativeHiddenWithoutM0SourceCandidates++;
   if(seg.sourceCandidate3DLifts.length>1)
    counts.hiddenHLRWithMultiple3DSourceCandidates++;
   const refined=pruneHiddenSharpPaperAliasesUsingExactM5({
    view,candidates:seg.sourceCandidate3DLifts,
    closedOriginalSourceByKey:closedByKey
   });
   counts.exactClosedOutwardRayExcludedHiddenCandidates+=
    refined.exactClosedRayExclusionCount;
   if(refined.remainingPossibleOriginal3DSourceCount===1)
    counts.nativeHiddenSharpWithOneSurvivingM5Source++;
   if(refined.remainingPossibleOriginal3DSourceCount===0)
    counts.nativeHiddenSharpWithNoSurvivingM5Source++;
   if(refined.remainingPossibleOriginal3DSourceCount>1)
    counts.nativeHiddenSharpStillWithMultipleM5Sources++;
   nativeHiddenSourceRefinements.push({
    view,projectedFrom:{...seg.from},projectedTo:{...seg.to},
    ...refined
   });
   for(const candidate of seg.sourceCandidate3DLifts){
    const id=candidate.sourceEdgeId,range=candidate.originalSourceParameterRange;
    if(!realIds.has(id)||
       candidate.originalXYZReprojectsToHLR!==true||
       candidate.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       candidate.originalOCCTSourceLineCurveVerified!==true||
       candidate.v5Authorized!==false||
       !Array.isArray(range)||range.length!==2||!range.every(finite)||
       range[0]<0||range[1]>1||range[1]<=range[0])
     throw new RangeError('native HLR candidate lacks actual original 3D OCCT source');
    const key=id+'@'+view;
    if(!nativeMap.has(key))nativeMap.set(key,[]);
    nativeMap.get(key).push({range:[...range],
     distinctOriginal3DCandidateCount:seg.sourceCandidate3DLifts.length,
     realOCCTHLREdgeToSourceIdentityRecovered:false,
     nativeHLRActualClass:'hidden-sharp'});
   }
  }
 }
 const rows=[];
 for(const row of m5.rows){
  if(!VIEWS.includes(row.view)||!realIds.has(row.originalPhysicalSourceEdgeId)||
     row.sourceGeometryId!==geometry.id||row.revision!==revision||
     row.officialEngineeringLineStyle!=='undetermined'||row.signedV5Action!==false)
   throw new RangeError('original full-edge M5 proof does not match reviewed source');
  const candidates=nativeMap.get(row.originalPhysicalSourceEdgeId+'@'+row.view)??[];
  const jointSourceInterval=reviewCanonicalM4M5NativeHLRSourceIntervals({
   m5Row:row,nativeCandidates:candidates
  });
  counts.canonicalM4M5NativeSourceViewIntervalsJointlyReviewed++;
  if(jointSourceInterval.
      originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete)
   counts.canonicalM4FullOriginal3DSourceAndNativeHLRFullCandidateIntervals++;
  else counts.canonicalM4AndNativeHLRIncompleteSourceViewIntervalsHeld++;
  const projectedPoints=row.originalVertexIds.map(id=>
   project(geometry.data.points[id])[row.view]);
  const collapsed=Math.hypot(
   projectedPoints[0].u-projectedPoints[1].u,
   projectedPoints[0].v-projectedPoints[1].v)<=1e-8;
  if(collapsed!==row.projectionCollapsed)
   throw new RangeError('native hidden source projection contradicts M5');
  const subspans=[];
  for(const s of row.originalCutSubspans){
   const all=exactCandidateIntervalCoverage(
    s.originalParameterRange,candidates.map(x=>x.range));
   const unique=exactCandidateIntervalCoverage(
    s.originalParameterRange,candidates.filter(x=>
     x.distinctOriginal3DCandidateCount===1).map(x=>x.range));
   const hidden=s.exactWholeOpenStrictInwardHidden===true;
   const clear=s.exactWholeOpenRayClear===true;
   if(hidden&&clear)
    throw new RangeError('same source M5 ray both exactly inward and outward');
   counts.canonicalOriginalM4SubspansChecked++;
   if(hidden)counts.exactM5HiddenOpenSubspans++;
   if(all.entireOriginalParameterIntervalCovered)
    counts.hiddenNativePaperCoverageConfirmedSubspans++;
   counts.positiveLengthHiddenNativePaperGaps+=
    all.positiveLengthUncoveredIntervals.length;
   const local=hidden&&unique.entireOriginalParameterIntervalCovered;
   if(local)counts.uniqueNativePaperCandidatePlusExactM5HiddenSubspans++;
   if(all.entireOriginalParameterIntervalCovered&&
      !unique.entireOriginalParameterIntervalCovered)
    counts.ambiguousHiddenNativePaperCandidateSubspans++;
   subspans.push({
    originalParameterRange:[...s.originalParameterRange],
    exactOriginalM5WholeOpenStrictlyInwardHidden:hidden,
    exactOriginalM5WholeOpenRayClear:clear,
    nativeHiddenCandidateCoverage:all,
    onlyUniqueOriginal3DCandidateHiddenCoverage:unique,
    nativeHiddenAndExactM5HiddenLocallyCorroborated:local,
    nativeHLRGeneratedTopoDSEdgeToOriginalIdentityProven:false,
    hiddenLineStyleStandardCertified:false,
    projectedSourceCollisionAndAllGlobalJunctionsProven:false,
    finalEngineeringStyle:'undetermined',
    constructionIntentAuthorized:false,signedV5Action:false
   });
  }
  counts.sourceViewIntervalsChecked++;
  rows.push({
   view:row.view,sourceGeometryId:geometry.id,revision,
   sourceEdgeId:row.originalPhysicalSourceEdgeId,
   projectionCollapsed:collapsed,
   originalPhysicalCreaseProven:row.originalPhysicalCreaseProven,
   entireOriginalOpenRayStrictlyHidden:
    row.originalOpenEdgeStrictInteriorOcclusionProven,
   originalSourceM4PaperPartitionComplete:
    row.originalM4PaperParameterPartitionComplete,
   genuineM4ProjectedParameterGaps:
    row.missingProjectedPaperSourceParameterRanges.map(x=>[...x]),
   nativeHiddenProjectedCandidateCount:candidates.length,
   canonicalM4M5NativeHLRJointSourceIntervalEvidence:jointSourceInterval,
   subspans,
   officialEngineeringStyle:'undetermined',
   fullHLRToOriginalTopoDSProven:false,signedV5Action:false
  });
 }
 if(rows.length!==m5.rows.length||
    counts.sourceViewIntervalsChecked!==geometry.data.edges.length*3||
    counts.canonicalM4M5NativeSourceViewIntervalsJointlyReviewed!==rows.length||
    counts.canonicalM4FullOriginal3DSourceAndNativeHLRFullCandidateIntervals+
     counts.canonicalM4AndNativeHLRIncompleteSourceViewIntervalsHeld!==rows.length||
    counts.signedNewV5Actions!==0)
  throw new RangeError('missing original 3D edge/view hidden HLR proof rows');
 // Preserve #759 M0 original closed 3D fan/physical M4 endpoint proofs
 // alongside #760 CAD hidden native-edge source-elimination ledger.
 // This is a distinct proof of ORIGINAL vertex incidence, not a claim
 // that generated OCCT HLR edges share TopoDS vertices.
 const originalVertexStars=auditC1OriginalClosedVertexStars({geometry,revision});
 const nativeHidden3DEndpointFans=auditC1NativeHidden3DEndpointFans({
  geometry,revision,cad,refinements:nativeHiddenSourceRefinements,
  vertexStars:originalVertexStars
 });
 if(nativeHidden3DEndpointFans.genuineNativeHiddenSharpStrokeCount!==
     counts.realNativeHiddenSharpSegments||
    nativeHidden3DEndpointFans.signedV5ActionCount!==0||
    nativeHidden3DEndpointFans.nativeGeneratedTopoDSEdgeEndpointIdentityProven!==false)
  throw new RangeError('real native sharp HLR generated-source junction proof gate');
 const nativeHiddenOriginalVertexEndpointProof=
  auditC1NativeHiddenOriginalVertexEndpointProof({
   geometry,revision,cad,endpointFans:nativeHidden3DEndpointFans,
   refinements:nativeHiddenSourceRefinements
  });
 if(nativeHiddenOriginalVertexEndpointProof.counts.nativeHLRHiddenEdgesExamined!==
     counts.realNativeHiddenSharpSegments||
    nativeHiddenOriginalVertexEndpointProof.signedV5ActionCount!==0)
  throw new RangeError('authentic original 3D vertex native HLR edge source audit missing');
 const nativeHLRVertexConcordance=
  auditC1NativeHLRGeneratedToOriginalVertexConcordance({
   geometry,revision,cad,
   originalNativeVertexProof:nativeHiddenOriginalVertexEndpointProof,
   originalClosedRayM5:m5
  });
 if(nativeHLRVertexConcordance.signedV5ActionCount!==0||
    nativeHLRVertexConcordance.actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete!==false)
  throw new RangeError('generated real HLR vertex/source independent proof gate');
 const nativeHLRAllM4ProjectedEncounters=
  auditC1NativeHLRAllM4ProjectedEncounters({
   geometry,revision,cad,refinements:nativeHiddenSourceRefinements,
   nativeVertexProof:nativeHiddenOriginalVertexEndpointProof,
   m4:auditC1ReviewedProjectedSourceEventGraph({geometry,revision})
  });
 if(nativeHLRAllM4ProjectedEncounters.counts.genuineNativeHiddenSharpEdgesInspected!==
     counts.realNativeHiddenSharpSegments||
    nativeHLRAllM4ProjectedEncounters.signedV5ActionCount!==0||
    nativeHLRAllM4ProjectedEncounters.wholeSceneProjectedJunctionAndOcclusionCertified!==false)
  throw new RangeError('genuine native HLR source complete M4 event graph gate');
 const nativeHiddenOriginalOpenRayClosure=
  auditNativeHiddenWholeOriginalSourceIntervals({
   geometry,revision,cad,refinements:nativeHiddenSourceRefinements,
   m5,endpointFans:nativeHidden3DEndpointFans
  });
 if(nativeHiddenOriginalOpenRayClosure.counts.actualNativeHiddenEdgesAudited!==
     counts.realNativeHiddenSharpSegments||
    nativeHiddenOriginalOpenRayClosure.signedV5ActionCount!==0||
    nativeHiddenOriginalOpenRayClosure.wholeEngineeringHiddenLineCertification!==false)
  throw new RangeError('real native sharp HLR original source continuous ray gate');
 const nativeHiddenFrontVisibleMask=auditC1NativeHiddenFrontVisibleMasks({
  geometry,revision,cad,refinements:nativeHiddenSourceRefinements,
  m5,sourceDepth:auditC1ProjectedSourcePairDepth({geometry,revision})
 });
 if(nativeHiddenFrontVisibleMask.counts.realHiddenNativeEdgesAudited!==
     counts.realNativeHiddenSharpSegments||
    nativeHiddenFrontVisibleMask.signedV5ActionCount!==0)
  throw new RangeError('actual front visible source depth mask audit incomplete');
 const nativeHiddenDualOpenIntervalProof=auditC1NativeHiddenDualOpenIntervalProof({
  geometry,revision,strictM5:nativeHiddenOriginalOpenRayClosure,
  frontMask:nativeHiddenFrontVisibleMask
 });
 if(nativeHiddenDualOpenIntervalProof.counts.realNativeHiddenOpenLineIntervalsReviewed!==
     counts.realNativeHiddenSharpSegments||
    nativeHiddenDualOpenIntervalProof.signedV5ActionCount!==0)
  throw new RangeError('real native OCCT hidden joint physical line proof incomplete');
 const nativeHiddenExactModelFrontMask=auditC1NativeHiddenExactModelFrontMasks({
  geometry,revision,cad,refinements:nativeHiddenSourceRefinements,m5
 });
 if(nativeHiddenExactModelFrontMask.counts.genuineNativeHiddenSharpStrokes!==
      counts.realNativeHiddenSharpSegments||
    nativeHiddenExactModelFrontMask.signedV5ActionCount!==0)
  throw new RangeError('exact original 3D front-depth witness failed native HLR source count');
 const nativeHiddenExactOriginalFrontGap=auditC1NativeHiddenUncoveredOriginalFrontRay({
  geometry,revision,cad,refinements:nativeHiddenSourceRefinements,
  dual:nativeHiddenDualOpenIntervalProof,m5,
  exactIntervalCoverage:exactCandidateIntervalCoverage
 });
 if(nativeHiddenExactOriginalFrontGap.counts.actualNativeHiddenEdgesReviewed!==
     counts.realNativeHiddenSharpSegments||
    nativeHiddenExactOriginalFrontGap.signedV5ActionCount!==0||
    nativeHiddenExactOriginalFrontGap.allOriginal3DAndNativeTopoDSLinksAndJunctionsCertified!==false)
  throw new RangeError('native HLR residual gap mathematical vs generated output proof gate');
 return frozen({
  schema:'draftai-c1-ocjs-real-hidden-sharp-m5-original-source-audit/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  nativeHiddenSource:'pinned-genuine-ocjs-hlr-hcompound',
  nativeNullHiddenSharpViews:[...cad.hiddenSharpNullCompoundViews],
  sourceM0M5ClosureSchema:m5.schema,
  allOriginal3DEdgesAndViewsRecomputed:true,
  nativeHiddenSourceRefinements,
  independentlyVerifiedOriginal3DVertexFans:originalVertexStars.schema,
  nativeHidden3DEndpointFans,
  nativeHiddenOriginalVertexEndpointProof,
  nativeHLRVertexConcordance,
  nativeHLRAllM4ProjectedEncounters,
  nativeHiddenOriginalOpenRayClosure,
  nativeHiddenFrontVisibleMask,
  nativeHiddenDualOpenIntervalProof,
  nativeHiddenExactModelFrontMask,
  nativeHiddenExactOriginalFrontGap,
  counts,rows,
  localProofNotGlobalTopoDSIdentity:true,
  sourceAndGeneratedHiddenLineAttributionNotCertified:true,
  officialEngineeringLineStylesCertified:false,
  constructionIntentAuthorized:false,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={exactCandidateIntervalCoverage,auditC1NativeHiddenSharpVsM5,
 reviewCanonicalM4M5NativeHLRSourceIntervals};
