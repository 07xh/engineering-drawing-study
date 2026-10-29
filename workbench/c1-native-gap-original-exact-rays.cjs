'use strict';
/**
 * Positive ORIGINAL M0 convex-source ray theorem on every REAL M5/HLR
 * parameter gap. Unlike a paper endpoint tolerance, the exact supporting
 * halfspace theorem covers the whole original 3D edge (hence each gap)
 * without sampling or interpolating its tiny binary64 endpoints.
 *
 * Crucial separation:
 *  - M0 original source rays can be positively clear/strictly interior.
 *  - missing OCCT generated HLR source intervals are STILL missing.
 *  - generated TopoDS history, global co-projected depth and V5 remain
 *    independent obligations. A strict-hidden OPEN edge does not prove
 *    its endpoint ray, especially when a gap begins at t=0.
 */
const {auditC1AllOriginalSourceNativeGaps}=
 require('./c1-all-native-source-gap-ledger.cjs');
const {auditC1OriginalClosedEdgeRayContinuity}=
 require('./c1-m5-closed-original-edge-ray-continuity.cjs');
const {project}=require('../core/projection/conventions.js');
const {dyadic,difference,product,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
// Exact received-binary64 3D incidence, independent of HLR paper aliasing.
// A generated native vertex can project onto an original M0 edge while
// belonging to a DIFFERENT-depth original vertex. This is a veto witness,
// not a generated TopoDS edge ownership or visibility certificate.
function exactOriginal3DVertexOnSourceSegment(a,b,p){
 const axes=['x','y','z'];
 if([a,b,p].some(q=>!q||axes.some(k=>!Number.isFinite(q[k]))))
  throw new TypeError('finite original M0 source and native vertex required');
 const d=axes.map(k=>difference(dyadic(b[k]),dyadic(a[k])));
 const q=axes.map(k=>difference(dyadic(p[k]),dyadic(a[k])));
 const pivot=d.findIndex(x=>sign(x)!==0);
 if(pivot<0)throw new RangeError('collapsed original 3D source edge');
 if(axes.some((_,i)=>sign(difference(
  product(q[i],d[pivot]),product(q[pivot],d[i])))!==0))
  return false;
 const direction=sign(d[pivot]);
 return sign(q[pivot])*direction>=0&&
  sign(difference(d[pivot],q[pivot]))*direction>=0;
}
const {auditC1ExactBinary64PaperAffineWitness}=
 require('./c1-exact-binary64-paper-affine.cjs');
const {auditExactBinary64PaperParameterPair,
 auditExactBinary64PaperCandidateCoverage,
 auditExactBinary64PaperVisibilityConflict}=
 require('./c1-exact-binary64-paper-parameter.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC1NativeGapOriginalExactRays({geometry,cad,m5Ledger}={}){
 const gaps=auditC1AllOriginalSourceNativeGaps({geometry,cad,m5Ledger});
 // Recompute the existing M0/M4/M5 exact halfspace and original-vertex
 // certificates directly from the geometry, never from caller-supplied
 // booleans or from the HLR output itself.
 const rays=auditC1OriginalClosedEdgeRayContinuity({
  geometry,revision:cad.revision
 });
 if(rays.schema!=='draftai-c1-m5-exact-closed-original-edge-ray-and-cut-continuity/1'||
    rays.sourceGeometryId!==geometry.id||rays.revision!==cad.revision||
    rays.signedV5ActionCount!==0||rays.wholeSolidV5Ready!==false||
    rays.allActualOccludingSceneFacesCertified!==false)
  throw new RangeError('current unsigned exact original 3D convex source rays required');
 const bySource=new Map();
 for(const ray of rays.rows){
  const key=ray.view+'|'+ray.originalPhysicalSourceEdgeId;
  if(bySource.has(key))throw new RangeError('duplicate exact original source ray');
  bySource.set(key,ray);
 }
 // A missing M5 source/view is a distinct coverage obligation from a
 // positive gap inside an existing M5 span. Audit every noncollapsed
 // original M0 edge, including sources never emitted by the M5 ledger.
 const missingCandidates=new Map();
 for(const witness of gaps.unrepresentedM0NativeHLRCandidateForensics){
  const key=witness.view+'|'+witness.sourceEdgeId;
  if(missingCandidates.has(key)||
     !Number.isSafeInteger(witness.nativeHLRPaperCandidateCount)||
     witness.nativeHLRPaperCandidateCount<0||
     witness.nativeHLRPaperCandidateCount!==witness.nativeHLRPaperCandidates?.length||
     witness.continuousOcclusionCertified!==false||
     witness.signedV5Action!==false)
   throw new RangeError('invalid omitted M0 source HLR candidate inventory');
  missingCandidates.set(key,witness);
 }
 const missingOriginalM0SourceViewRows=[];
 const missingSeen=new Set();
 const omittedCandidateCounts={
  examined:0,exactAffineAligned:0,exactAffineDrift:0,
  exactParameterDomainFailures:0,nativeIsSameOwnerClaims:0,
  nativeOwnerRayClassConsistent:0,nativeOwnerRayClassContradictions:0,
  paperOnlyRayClassDisagreements:0,
  paperAliasExactFullSourceViewCoverage:0,
  paperAliasExactPositiveGapSourceViews:0,
  nativeScopedOwnerExactFullSourceViewCoverage:0,
  nativeScopedOwnerExactPositiveGapSourceViews:0,
  exactPaperVisibleHiddenPositiveConflictSourceViews:0,
  rayExcludedOppositeHLRClassPaperAliases:0,
  rayCompatiblePaperFullSourceViewCoverage:0,
  rayCompatiblePaperPositiveGapSourceViews:0,
  rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews:0,
  nativeEndpoint3DContradictoryPaperAliases:0,
  nativeEndpoint3DConsistentPaperAliases:0,
  nativeEndpoint3DUnknownPaperAliases:0
 };
 for(const missing of gaps.unrepresentedOriginalM0ProjectedSources){
  const key=missing.view+'|'+missing.sourceEdgeId;
  const ray=bySource.get(key),candidate=missingCandidates.get(key);
  if(missingSeen.has(key)||!ray||!candidate||
     ray.sourceGeometryId!==geometry.id||ray.revision!==cad.revision||
     ray.projectionCollapsed!==false||
     ray.signedV5Action!==false||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[0]!==0||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[1]!==1||
     missing.originalTopoDSHistoryCertified!==false||
     missing.signedV5Action!==false)
   throw new RangeError('unrepresented original M0 source/view lacks independent 3D ray');
  missingSeen.add(key);
  const closed=ray.originalPhysicalCreaseProven===true&&
   ray.completeSourceOriginal3DRayClosedIntervalClear===true&&
   ray.exactlyBothOriginalVertexForwardRaysClear===true;
  const hidden=ray.originalPhysicalCreaseProven===true&&
   ray.originalOpenEdgeStrictInteriorOcclusionProven===true;
  if(closed&&hidden)
   throw new RangeError('contradictory omitted M0 original ray witnesses');
  const original=geometry.data.edges.find(edge=>
   geometry.id+'::'+[...edge].sort().join('|')===missing.sourceEdgeId);
  if(!original||original.some((id,i)=>id!==ray.originalVertexIds[i]))
   throw new RangeError('omitted HLR source is not the original M0 3D edge');
  const [from,to]=original.map(id=>project(geometry.data.points[id])[missing.view]);
  const nativeOwners=new Set(candidate.directNativeGeneratedIdentityCandidates?.map(x=>
   x.hlrClass+'|'+x.ordinal)??[]);
  if(candidate.directNativeGeneratedIdentityCandidateCount!==nativeOwners.size)
   throw new RangeError('incomplete omitted M0 genuine native identity claims');
  const otherOwners=new Set(candidate.paperCandidatesClaimedByDifferentOriginalNativeSource?.
   map(x=>x.hlrClass+'|'+x.ordinal)??[]);
  const expectedClass=closed?'visible-sharp':hidden?'hidden-sharp':null;
  const candidateDiagnostics=candidate.nativeHLRPaperCandidates.map(paper=>{
   const key=paper.hlrClass+'|'+paper.ordinal;
   if(nativeOwners.has(key)&&otherOwners.has(key))
    throw new RangeError('contradictory original native HLR edge owners');
   const affine=auditC1ExactBinary64PaperAffineWitness({
    sourceFrom:from,sourceTo:to,
    measuredFrom:paper.projectedFrom,measuredTo:paper.projectedTo
   });
   const parameter=auditExactBinary64PaperParameterPair({
    sourceFrom:from,sourceTo:to,
    measuredFrom:paper.projectedFrom,measuredTo:paper.projectedTo
   });
   const aligned=affine.bothNativeEndpointsExactlyOnOriginalBinary64PaperLine;
   const bounded=parameter.nativeFromWithinExactBinary64OriginalParameterDomain&&
    parameter.nativeToWithinExactBinary64OriginalParameterDomain;
   const nativeOwner=nativeOwners.has(key);
   const nativeSegment=paper.hlrClass==='visible-sharp'?
    cad.views[missing.view]?.[paper.ordinal]:
    cad.hiddenSharpViews[missing.view]?.[paper.ordinal];
   const directVertices=nativeSegment?.directNativeVertexOriginalSource;
   if(directVertices!==undefined&&
      (!Array.isArray(directVertices)||directVertices.length!==2))
    throw new RangeError('invalid native generated vertex TopoDS identity pair');
   let positiveOriginal3DVertexEndpoints=0,contradictory3DEndpoints=0;
   if(directVertices)for(let side=0;side<2;side++){
    const witness=directVertices[side];
    const vertexId=witness?.directlySameOriginalM0VertexId;
    if(vertexId===null||vertexId===undefined){
     if(witness?.directOriginal3DVertexTopoDSIdentityProven===true)
      throw new RangeError('unbound positive native original vertex identity');
     continue;
    }
    const point=geometry.data.points[vertexId];
    if(witness?.directOriginal3DVertexTopoDSIdentityProven!==true||!point)
     throw new RangeError('forged original native vertex TopoDS identity');
    const projected=project(point)[missing.view];
    const endpoint=side===0?paper.projectedFrom:paper.projectedTo;
    if(projected.u!==endpoint.u||projected.v!==endpoint.v)
     throw new RangeError('native IsSame original vertex contradicts actual HLR paper endpoint');
    if(exactOriginal3DVertexOnSourceSegment(
      geometry.data.points[original[0]],
      geometry.data.points[original[1]],point))
     positiveOriginal3DVertexEndpoints++;
    else contradictory3DEndpoints++;
   }
   const nativeEndpoint3DSourceStatus=contradictory3DEndpoints?
    'contradicted-by-native-original-vertex':
    positiveOriginal3DVertexEndpoints?
    'positive-original-vertex-incidence-only':'unverified';
   if(contradictory3DEndpoints)
    omittedCandidateCounts.nativeEndpoint3DContradictoryPaperAliases++;
   else if(positiveOriginal3DVertexEndpoints)
    omittedCandidateCounts.nativeEndpoint3DConsistentPaperAliases++;
   else omittedCandidateCounts.nativeEndpoint3DUnknownPaperAliases++;
   const classMatches=expectedClass===null?null:paper.hlrClass===expectedClass;
   // An independently proven whole ORIGINAL 3D edge ray can veto a
   // projected HLR class as ownership of THIS source. It cannot veto
   // the actual HLR segment: another 3D edge may share its paper line.
   if(classMatches===false)
    omittedCandidateCounts.rayExcludedOppositeHLRClassPaperAliases++;
   omittedCandidateCounts.examined++;
   if(aligned)omittedCandidateCounts.exactAffineAligned++;
   else omittedCandidateCounts.exactAffineDrift++;
   if(!bounded)omittedCandidateCounts.exactParameterDomainFailures++;
   if(nativeOwner){
    omittedCandidateCounts.nativeIsSameOwnerClaims++;
    if(classMatches===true)omittedCandidateCounts.nativeOwnerRayClassConsistent++;
    if(classMatches===false)omittedCandidateCounts.nativeOwnerRayClassContradictions++;
   }else if(classMatches===false)
    omittedCandidateCounts.paperOnlyRayClassDisagreements++;
   return {hlrClass:paper.hlrClass,ordinal:paper.ordinal,
    exactBinary64PaperAffineAligned:aligned,
    exactBinary64PaperAffineCrossProductDyadic:[
     affine.exactBinary64PaperFromCrossProductDyadic,
     affine.exactBinary64PaperToCrossProductDyadic],
    exactBinary64PaperWithinOriginalParameterDomain:bounded,
    exactBinary64PaperHasPositiveParameterSpan:
     parameter.nativePaperSourceParameterPairHasExactPositiveSpan,
    sourceScopedGeneratedIsSameOwnerClaim:nativeOwner,
    nativeEndpoint3DSourceStatus,
    nativeOriginal3DVertexIncidenceCount:positiveOriginal3DVertexEndpoints,
    nativeOriginal3DVertexContradictionCount:contradictory3DEndpoints,
    nativeOriginalVertexIncidenceIsNotGeneratedEdgeHistory:true,
    nativeGeneratedEdgeClaimedByDifferentOriginalSource:otherOwners.has(key),
    classConsistentWithIndependentWholeOriginal3DRay:classMatches,
    oppositeClassExcludedAsThisOriginal3DSourceByExactRay:classMatches===false,
    sourceScopedIdentityIsNotCompleteGeneratedTopoDSHistory:true,
    engineeringLineStyle:'undetermined',signedV5Action:false};
  });
  if(candidateDiagnostics.length!==candidate.nativeHLRPaperCandidateCount||
     [...nativeOwners,...otherOwners].some(key=>
      !candidateDiagnostics.some(x=>x.hlrClass+'|'+x.ordinal===key)))
   throw new RangeError('omitted original source native HLR candidate/claim inventory mismatch');
  // These are exact dyadic unions of received binary64 HLR PAPER
  // coordinates, not recovered native source parameters. Only exactly
  // affine-aligned, in-domain, positive-length fragments may contribute.
  // Keep native IsSame scoped-owner subsets separate from paper aliases.
  const eligible=candidate.nativeHLRPaperCandidates.filter((paper,i)=>{
   const proof=candidateDiagnostics[i];
   return proof.nativeEndpoint3DSourceStatus!=='contradicted-by-native-original-vertex'&&
    proof.exactBinary64PaperAffineAligned&&
    proof.exactBinary64PaperWithinOriginalParameterDomain&&
    proof.exactBinary64PaperHasPositiveParameterSpan;
  });
  // Source-specific candidate pruning is an independent M0 3D theorem,
  // NOT a change to the actual whole-solid OCCT visible/hidden HLR output.
  // Preserve the raw alias/class conflict separately for audit. In
  // particular, a contradictory direct native IsSame owner claim remains
  // an unresolved evidence conflict rather than being silently approved.
  const rayCompatibleEligible=eligible.filter(paper=>
   candidateDiagnostics[candidate.nativeHLRPaperCandidates.indexOf(paper)].
    classConsistentWithIndependentWholeOriginal3DRay!==false);
  const rayCompatiblePaperCoverage=auditExactBinary64PaperCandidateCoverage({
   sourceFrom:from,sourceTo:to,
   segments:rayCompatibleEligible.map(paper=>({
    from:paper.projectedFrom,to:paper.projectedTo
   }))
  });
  const rayCompatiblePaperVisibility=auditExactBinary64PaperVisibilityConflict({
   sourceFrom:from,sourceTo:to,
   visibleSegments:rayCompatibleEligible.filter(p=>p.hlrClass==='visible-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo})),
   hiddenSegments:rayCompatibleEligible.filter(p=>p.hlrClass==='hidden-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo}))
  });
  if(rayCompatiblePaperVisibility.hasExactPositiveLengthVisibleHiddenPaperClassConflict)
   omittedCandidateCounts.rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews++;
  if(rayCompatiblePaperCoverage.exactBinary64PaperCandidateCoverageComplete)
   omittedCandidateCounts.rayCompatiblePaperFullSourceViewCoverage++;
  else omittedCandidateCounts.rayCompatiblePaperPositiveGapSourceViews++;
  const paperCoverage=auditExactBinary64PaperCandidateCoverage({
   sourceFrom:from,sourceTo:to,
   segments:eligible.map(paper=>({
    from:paper.projectedFrom,to:paper.projectedTo
   }))
  });
  const nativeOwnedCoverage=auditExactBinary64PaperCandidateCoverage({
   sourceFrom:from,sourceTo:to,
   segments:eligible.filter(paper=>nativeOwners.has(
    paper.hlrClass+'|'+paper.ordinal)).map(paper=>({
     from:paper.projectedFrom,to:paper.projectedTo
    }))
  });
  const paperVisibility=auditExactBinary64PaperVisibilityConflict({
   sourceFrom:from,sourceTo:to,
   visibleSegments:eligible.filter(p=>p.hlrClass==='visible-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo})),
   hiddenSegments:eligible.filter(p=>p.hlrClass==='hidden-sharp').
    map(p=>({from:p.projectedFrom,to:p.projectedTo}))
  });
  if(paperVisibility.hasExactPositiveLengthVisibleHiddenPaperClassConflict)
   omittedCandidateCounts.exactPaperVisibleHiddenPositiveConflictSourceViews++;
  if(paperCoverage.exactBinary64PaperCandidateCoverageComplete)
   omittedCandidateCounts.paperAliasExactFullSourceViewCoverage++;
  else omittedCandidateCounts.paperAliasExactPositiveGapSourceViews++;
  if(nativeOwnedCoverage.exactBinary64PaperCandidateCoverageComplete)
   omittedCandidateCounts.nativeScopedOwnerExactFullSourceViewCoverage++;
  else omittedCandidateCounts.nativeScopedOwnerExactPositiveGapSourceViews++;
  missingOriginalM0SourceViewRows.push({
   view:missing.view,sourceEdgeId:missing.sourceEdgeId,
   expectedHLRClassFromIndependentOriginalRay:expectedClass,
   allPaperAliasCandidateExactBinary64Coverage:paperCoverage,
   nativeScopedOwnerCandidateExactBinary64Coverage:nativeOwnedCoverage,
   exactBinary64PaperVisibleHiddenCandidateConflict:paperVisibility,
   rayCompatibleOriginal3DSourcePaperCoverage:rayCompatiblePaperCoverage,
   rayCompatibleOriginal3DSourcePaperVisibility:rayCompatiblePaperVisibility,
   rayCompatibleCandidateCount:rayCompatibleEligible.length,
   rayClassPruningIsNotNativeHLROwnershipOrContinuousVisibility:true,
   paperClassConflictCannotCertifyGlobal3DDepthOrVisibility:true,
   exactPaperCoverageIsNotNativeSourceParameterCoverage:true,
   nativeHLRCandidateExactBinary64AndRayDiagnostics:candidateDiagnostics,
   original3DVertexIds:[...ray.originalVertexIds],
   original3DRayStatus:closed?'exact-original-closed-ray-clear':
    hidden?'exact-original-open-strict-interior':'undetermined',
   originalM4SourcePartitionComplete:
    ray.originalM4Canonical3DSourcePartitionPositivelyProven===true,
   nativeHLRPaperCandidateCount:candidate.nativeHLRPaperCandidateCount,
   nativeHLRPaperCandidates:candidate.nativeHLRPaperCandidates.map(x=>({
    hlrClass:x.hlrClass,ordinal:x.ordinal
   })),
   missingM5SourceViewRemainsUncovered:true,
   generatedTopoDSToOriginalSourceHistoryCertified:false,
   globalCoProjectedFrontmostSourceCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 if(missingCandidates.size!==missingSeen.size||
    omittedCandidateCounts.examined!==
     omittedCandidateCounts.exactAffineAligned+omittedCandidateCounts.exactAffineDrift||
    omittedCandidateCounts.examined!==
     omittedCandidateCounts.nativeEndpoint3DContradictoryPaperAliases+
     omittedCandidateCounts.nativeEndpoint3DConsistentPaperAliases+
     omittedCandidateCounts.nativeEndpoint3DUnknownPaperAliases||
    omittedCandidateCounts.nativeOwnerRayClassConsistent+
     omittedCandidateCounts.nativeOwnerRayClassContradictions>
     omittedCandidateCounts.nativeIsSameOwnerClaims||
    omittedCandidateCounts.paperAliasExactFullSourceViewCoverage+
     omittedCandidateCounts.paperAliasExactPositiveGapSourceViews!==missingSeen.size||
    omittedCandidateCounts.nativeScopedOwnerExactFullSourceViewCoverage+
     omittedCandidateCounts.nativeScopedOwnerExactPositiveGapSourceViews!==missingSeen.size||
    omittedCandidateCounts.exactPaperVisibleHiddenPositiveConflictSourceViews>missingSeen.size||
    omittedCandidateCounts.rayCompatiblePaperFullSourceViewCoverage+
     omittedCandidateCounts.rayCompatiblePaperPositiveGapSourceViews!==missingSeen.size||
    omittedCandidateCounts.rayCompatiblePaperVisibleHiddenPositiveConflictSourceViews>
     omittedCandidateCounts.exactPaperVisibleHiddenPositiveConflictSourceViews||
    omittedCandidateCounts.rayExcludedOppositeHLRClassPaperAliases>
     omittedCandidateCounts.examined)
  throw new RangeError('incomplete omitted original M0 native HLR/ray reconciliation');
 // Independent whole-M0 inventory equation: every drawable original
 // source/view is either represented by at least one current M5 span or
 // explicitly missing. Multiple M5 subspans must not inflate the count.
 const noncollapsedOriginalM0SourceViews=rays.rows.filter(x=>
  x.projectionCollapsed===false).length;
 const representedOriginalM0SourceViewsInM5=new Set(gaps.rows.filter(x=>
  x.sourceEdgeId&&bySource.get(x.view+'|'+x.sourceEdgeId)?.
   projectionCollapsed===false).map(x=>x.view+'|'+x.sourceEdgeId)).size;
 if(noncollapsedOriginalM0SourceViews!==
    representedOriginalM0SourceViewsInM5+missingSeen.size)
  throw new RangeError('incomplete whole-M0 noncollapsed V/H/W source inventory');
 const rows=[],counts={
  noncollapsedOriginalM0SourceViews,
  representedOriginalM0SourceViewsInM5,
  unrepresentedOriginalM0SourceViews:missingOriginalM0SourceViewRows.length,
  unrepresentedM0SourceViewsWithNativeHLRPaperCandidates:
   missingOriginalM0SourceViewRows.filter(x=>x.nativeHLRPaperCandidateCount>0).length,
  omittedNativeHLRPaperCandidateDiagnostics:omittedCandidateCounts,
  unrepresentedM0SourceViewsWithExactClosedRays:
   missingOriginalM0SourceViewRows.filter(x=>
    x.original3DRayStatus==='exact-original-closed-ray-clear').length,
  unrepresentedM0SourceViewsWithExactOpenHiddenRays:
   missingOriginalM0SourceViewRows.filter(x=>
    x.original3DRayStatus==='exact-original-open-strict-interior').length,
  independentOriginalOCCTCurvePositiveGapIntervals:0,
  positiveNativeGapIntervals:0,
  exactOriginalClosedRayClearGapIntervals:0,
  exactOriginalOpenStrictInteriorGapIntervals:0,
  originalSourceRayUnresolvedGapIntervals:0,
  nativeGeneratedHistoryGapsClosed:0,
  officialV5Actions:0
 };
 for(const entry of gaps.rows){
  if(entry.positiveGaps.length===0)continue;
  const ray=bySource.get(entry.view+'|'+entry.sourceEdgeId);
  if(!ray||ray.sourceGeometryId!==geometry.id||
     ray.revision!==cad.revision||ray.signedV5Action!==false||
     !Array.isArray(ray.originalVertexIds)||ray.originalVertexIds.length!==2||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[0]!==0||
     ray.originalM4Canonical3DSourceParameterCoverage?.originalParameterRange?.[1]!==1)
   throw new RangeError('positive HLR gap lacks independently recomputed original M0 ray');
  const original=geometry.data.edges.find(edge=>
   geometry.id+'::'+[...edge].sort().join('|')===entry.sourceEdgeId);
  if(!original||original.some((id,i)=>id!==ray.originalVertexIds[i]))
   throw new RangeError('native HLR gap does not belong to exact original 3D edge');
  const closedClear=ray.originalPhysicalCreaseProven===true&&
   ray.completeSourceOriginal3DRayClosedIntervalClear===true&&
   ray.exactlyBothOriginalVertexForwardRaysClear===true;
  const openHidden=ray.originalPhysicalCreaseProven===true&&
   ray.originalOpenEdgeStrictInteriorOcclusionProven===true;
  if(closedClear&&openHidden)
   throw new RangeError('contradictory exact original full-edge ray theorems');
  const joint=entry.jointNativeGapForensics;
  if(joint?.positiveGapCount!==entry.positiveGaps.length||
     !Array.isArray(joint.rows)||joint.rows.length!==entry.positiveGaps.length||
     joint.fullOriginalSourceHistoryCertified!==false||
     joint.globalContinuousVisibilityCertified!==false)
   throw new RangeError('native gap lacks independent original OCCT curve evidence');
  for(const [gapOrdinal,range] of entry.positiveGaps.entries()){
   const originalCurve=joint.rows[gapOrdinal];
   if(originalCurve?.gapOrdinal!==gapOrdinal||
      originalCurve.view!==entry.view||
      originalCurve.sourceEdgeId!==entry.sourceEdgeId||
      originalCurve.originalSourceParameterGap?.[0]!==range[0]||
      originalCurve.originalSourceParameterGap?.[1]!==range[1]||
      originalCurve.exactOriginalOcctCurvePositive!==true||
      originalCurve.generatedToOriginalTopoDSHistoryProven!==false||
      originalCurve.globalContinuousOcclusionProven!==false||
      originalCurve.signedV5Action!==false)
    throw new RangeError('original OCCT curve gap and M5 source interval disagree');
   counts.independentOriginalOCCTCurvePositiveGapIntervals++;
   if(!Array.isArray(range)||range.length!==2||
      !range.every(Number.isFinite)||range[0]<0||
      !(range[1]>range[0])||range[1]>1)
    throw new RangeError('invalid positive original native gap');
   const status=closedClear?'exact-original-closed-ray-clear':
    openHidden?'exact-original-open-strict-interior':'undetermined';
   counts.positiveNativeGapIntervals++;
   if(closedClear)counts.exactOriginalClosedRayClearGapIntervals++;
   else if(openHidden)counts.exactOriginalOpenStrictInteriorGapIntervals++;
   else counts.originalSourceRayUnresolvedGapIntervals++;
   rows.push({
    view:entry.view,sourceEdgeId:entry.sourceEdgeId,
    originalSourceParameterGap:[...range],
    original3DVertexIds:[...ray.originalVertexIds],
    independentOriginalOCCTCurveGapPositive:true,
    originalOCCTCurveGapRoundedToZero:
     originalCurve.originalCurveRoundedParameterCollapsed===true,
    nativeHLRGapDiagnosis:originalCurve.diagnosis,
    independentOriginal3DExactRayStatus:status,
    exactOriginal3DRayProvenThroughoutOpenGap:closedClear||openHidden,
    exactOriginal3DRayProvenAtBothOriginalVertices:closedClear,
    originalM4SourcePartitionComplete:
     ray.originalM4Canonical3DSourcePartitionPositivelyProven===true,
    nativeHLRGeneratedEdgeCoversGap:false,
    generatedTopoDSToOriginalSourceHistoryCertified:false,
    globalCoProjectedFrontmostSourceCertified:false,
    engineeringLineStyle:'undetermined',
    signedV5Action:false
   });
  }
 }
 if(rows.length!==gaps.totals.individualPositiveNativeGaps||
    rows.length!==counts.independentOriginalOCCTCurvePositiveGapIntervals||
    missingOriginalM0SourceViewRows.length!==
     gaps.unrepresentedOriginalM0ProjectedSources.length||
    rows.length!==counts.exactOriginalClosedRayClearGapIntervals+
     counts.exactOriginalOpenStrictInteriorGapIntervals+
     counts.originalSourceRayUnresolvedGapIntervals)
  throw new RangeError('original exact ray/native HLR gap reconciliation incomplete');
 return freeze({
  schema:'draftai-c1-native-gap-positive-original-ray-theorem/1',
  sourceGeometryId:geometry.id,revision:cad.revision,
  originalSourceGapLedgerSchema:gaps.schema,
  independentOriginalClosedRaySchema:rays.schema,
  counts,rows,missingOriginalM0SourceViewRows,
  allNoncollapsedOriginalM0SourcesRepresentedInM5:
   missingOriginalM0SourceViewRows.length===0,
  allNativeHLRSourceGapsClosed:false,
  fullOriginalTopoDSGeneratedHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  officialV5Authorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1NativeGapOriginalExactRays,exactOriginal3DVertexOnSourceSegment};
