'use strict';
/**
 * Original M0 physical line theorem for the remaining open source parameter
 * intervals of genuine OCJS HCompound hidden sharp strokes.
 *
 * A measured HLR VCompound may stop one ULP short of the *original* M0
 * physical source vertex in 2D. The missing part of that HLR BRep output
 * CANNOT be invented. But an independently certified ORIGINAL front edge
 * exists over the entire model-space interval if:
 *  - both distinct original 3D source edges project EXACTLY to the same
 *    full model-space first-angle paper endpoints;
 *  - exact dyadic original 3D forward observer depth is strictly positive
 *    at BOTH projected original endpoints (hence for the whole open edge);
 *  - the FRONT original 3D source's whole CLOSED observer ray is proven
 *    clear by the existing independent M5 exact source theorem;
 *  - OCCT supplied actual independent original 3D BRep straight curves
 *    and a real (possibly incomplete) VCompound visible front candidate;
 *  - true HCompound hidden source 3D lift is independently corroborated.
 *
 * This is an extra LOCAL original model physical-front *open interval*
 * proof, NOT a claim the OCCT generated VCompound covers those missing
 * native HLR subpixels. Every native HLR endpoint, generated TopoDS link,
 * global line join, engineering style and sole V5 remains unsigned.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const {certifyExactFullOriginalFront3DMask,
 certifyActualOCCTFullFrontOriginalPaperEndpoints}=
 require('./c1-native-hidden-exact-model-front-mask.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))frozen(x);Object.freeze(o);
}return o;};
const id=(g,e)=>g.id+'::'+[...e].sort().join('|');
const pEq=(a,b)=>a.u===b.u&&a.v===b.v;
const source3DMatchesRealOcct=(cad,sourceId)=>cad.originalBRepSourceEdges
 ?.some(e=>e.sourceEdgeId===sourceId&&
  e.originalOCCTBRepVertexXYZMatched===true&&
  e.occtCurveTypeIndependentlyVerified===true&&
  e.occtSourceCurveType==='line'&&
  e.occtSourceCurve3DEndpointsAndMidpointVerified===true&&
  e.generatedHLREdgeTopoDSIdentityMatched===false);
function auditC1NativeHiddenUncoveredOriginalFrontRay({
 geometry,revision,cad,refinements,dual,m5,exactIntervalCoverage
}={}){
 if(!Number.isSafeInteger(revision)||revision<1||
    !geometry?.data?.points||!Array.isArray(geometry.data.edges)||
    cad?.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||
    cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
    cad.v5Authorized!==false||
    !Array.isArray(cad.originalBRepSourceEdges)||
    m5?.sourceGeometryId!==geometry.id||m5.revision!==revision||
    m5.signedV5ActionCount!==0||
    dual?.sourceGeometryId!==geometry.id||dual.revision!==revision||
    dual.allGeneratedTopoDSOriginalSourceHistoryProven!==false||
    dual.signedV5ActionCount!==0||
    !Array.isArray(dual.rows)||!Array.isArray(refinements)||
    dual.rows.length!==refinements.length||
    typeof exactIntervalCoverage!=='function')
  throw new TypeError('real current HLR, reviewed M0 original edge, current M5 and unsigned dual-gap evidence required');
 const edges=new Map(geometry.data.edges.map(edge=>[id(geometry,edge),edge]));
 const rays=new Map(m5.rows.map(row=>[
  row.originalPhysicalSourceEdgeId+'@'+row.view,row]));
 if(edges.size!==geometry.data.edges.length||
    rays.size!==m5.rows.length)
  throw new RangeError('duplicated M0 source edge or M5 source/view ray');
 const rows=[],counts={
  actualNativeHiddenEdgesReviewed:0,
  existingDualProvenNativeHiddenStrokes:0,
  existingDualUnprovenNativeHiddenStrokes:0,
  originalOpenParameterGapIntervalsReviewed:0,
  exactM0FullFrontPhysicalSourceGapIntervalsCorroborated:0,
  unprovenOriginalOpenParameterGapIntervalsHeld:0,
  newlyFullOriginalModelOpenIntervalLocallyCorroborated:0,
  remainingOriginalModelOpenIntervalUnresolvedNativeEdges:0,
  actualNativeVisibleHLRDoesNotFullyCoverM0PaperStillHeld:0,
  verifiedCompleteRealNativeVCompoundPaperCoveringSourceGaps:0,
  completeNativeHiddenOpenPaperLinesExplainedByDualOrExactM0WithRealVisibleBRep:0,
  nativeHiddenOpenPaperLinesWithUnverifiedGeneratedHLRTail:0,
  confirmedGeneratedTopoDSSourceIdentities:0,
  officiallySignedGBLineStyles:0,signedV5Actions:0
 };
 let ordinal=0;
 for(const view of VIEWS){
  const hidden=cad.hiddenSharpViews?.[view],visible=cad.views?.[view];
  if(!Array.isArray(hidden)||!Array.isArray(visible))
   throw new RangeError('true V/H/W OCCT visible/hidden shape output unavailable');
  for(const native of hidden){
   const entry=dual.rows[ordinal],ref=refinements[ordinal];
   if(!entry||!ref||entry.view!==view||ref.view!==view||
      entry.nativeHiddenSharpEdgeOrdinal!==ordinal||
      entry.sourceGeometryId!==geometry.id||
      entry.revision!==revision||
      entry.signedV5Action!==false||
      ref.nativeHLRToSourceTopoDSIdentityRecovered!==false||
      native.occtHLRVisibilityClass!=='hidden-sharp'||
      native.actualOCCTHLRFlattenedBRepLineVerified!==true||
      native.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
      native.v5Authorized!==false||
      !pEq(native.from,ref.projectedFrom)||
      !pEq(native.to,ref.projectedTo))
    throw new RangeError('stale or forged native OCCT hidden/source open evidence');
   counts.actualNativeHiddenEdgesReviewed++;
   if(entry.locallyExplainedNativeHiddenOpenPaperInterval)
    counts.existingDualProvenNativeHiddenStrokes++;
   else counts.existingDualUnprovenNativeHiddenStrokes++;
   const ranges=entry.independentOpenIntervalRayAndFrontVisibleUnion
    ?.outstandingUnprovedOriginalParameterIntervals??[];
   if(!Array.isArray(ranges))
    throw new RangeError('missing authoritative positive residual gap intervals');
   const unique=entry.remainingOriginal3DPhysicalSourceUnique===true&&
    ref.remainingPhysicalSourcePossibilities?.length===1&&
    entry.originalHiddenSourceEdgeId===
     ref.remainingPhysicalSourcePossibilities[0].sourceEdgeId;
   // Recompute the exact binary64 complement of the TWO independently
   // verified M5/real-native-front interval sets. The downstream front-gap
   // reviewer must never trust a stale/forged list of residual intervals,
   // nor treat an empty unproved-gap list as vacuous positive proof.
   if(unique){
    const union=entry.independentOpenIntervalRayAndFrontVisibleUnion;
    if(!union||!Array.isArray(union.originalSourceParameterRange)||
       !Array.isArray(union.strictInteriorIndependentlyVerifiedIntervals)||
       !Array.isArray(union.realVisibleFrontSourceDepthMaskVerifiedIntervals))
     throw new RangeError('missing independent native M5 residual source coverage witnesses');
    const expected=exactCandidateIntervalCoverage(
     union.originalSourceParameterRange,[
      ...union.strictInteriorIndependentlyVerifiedIntervals,
      ...union.realVisibleFrontSourceDepthMaskVerifiedIntervals
     ]);
    if(JSON.stringify(expected.positiveLengthUncoveredIntervals)!==
        JSON.stringify(ranges)||
       expected.entireOriginalParameterIntervalCovered!==
        union.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor||
       expected.entireOriginalParameterIntervalCovered!==
        entry.locallyExplainedNativeHiddenOpenPaperInterval)
     throw new RangeError('native M5 residual original 3D source intervals contradict independently recomputed coverage');
   }else if(entry.locallyExplainedNativeHiddenOpenPaperInterval===true){
    throw new RangeError('nonunique native source cannot certify complete M5 residual coverage');
   }
   const hiddenId=unique?entry.originalHiddenSourceEdgeId:null;
   const hiddenEdge=edges.get(hiddenId);
   const hiddenLift=native.sourceCandidate3DLifts
    ?.find(x=>x.sourceEdgeId===hiddenId);
   // A perfectly covered but TRUNCATED upstream interval is not proof of
   // the actual native hidden source. Bind the independently recomputed
   // dual M5 range to the OCCT original 3D lift's exact parameter endpoints.
   if(unique){
    const actual=hiddenLift?.originalSourceParameterRange,
     claimed=entry.independentOpenIntervalRayAndFrontVisibleUnion
      ?.originalSourceParameterRange;
    if(!Array.isArray(actual)||actual.length!==2||
       !Array.isArray(claimed)||claimed.length!==2||
       actual[0]!==claimed[0]||actual[1]!==claimed[1])
     throw new RangeError('dual M5 original source range does not match genuine native HLR 3D lift');
   }
   const trueHiddenGeometry=!!(hiddenEdge&&hiddenLift&&
    hiddenLift.actualOriginalOCCTBRepEdge3DEndpointsVerified===true&&
    hiddenLift.originalOCCTSourceLineCurveVerified===true&&
    hiddenLift.originalXYZReprojectsToHLR===true&&
    hiddenLift.v5Authorized===false&&
    source3DMatchesRealOcct(cad,hiddenId));
   const nativeHiddenEndpointReprojectionExactlyVerified=
    trueHiddenGeometry&&
    pEq(project(hiddenLift.fromCandidate3D)[view],native.from)&&
    pEq(project(hiddenLift.toCandidate3D)[view],native.to);
   const gapRows=[];
   for(const gap of ranges){
    const range=gap;
    if(!Array.isArray(range)||range.length!==2||
       !range.every(Number.isFinite)||range[0]<0||
       range[1]>1||range[0]>=range[1])
     throw new RangeError('untrusted positive-length unsigned original M4/HLR gap');
    if(unique&&trueHiddenGeometry){
     const param=hiddenLift.originalSourceParameterRange;
     if(!Array.isArray(param)||param.length!==2||
        range[0]<param[0]||range[1]>param[1])
      throw new RangeError('residual source parameter not contained in actual OCCT hidden source');
    }
    counts.originalOpenParameterGapIntervalsReviewed++;
    const physicalFrontSourceProofs=[];
    if(unique&&trueHiddenGeometry){
     for(const [frontId,frontEdge] of edges){
      if(frontId===hiddenId||!source3DMatchesRealOcct(cad,frontId))
       continue;
      const frontRay=rays.get(frontId+'@'+view);
      if(!frontRay||frontRay.originalPhysicalCreaseProven!==true||
         frontRay.completeSourceOriginal3DRayClosedIntervalClear!==true||
         frontRay.signedV5Action!==false)continue;
      const exact=certifyExactFullOriginalFront3DMask({
       geometry,view,hiddenEdge,frontEdge
      });
      if(exact.strictObserverFrontDepthAcrossOriginalOpenInterval!==true||
         exact.exactOriginalProjectionSameWholePaperSegment!==true||
         exact.signedV5Action!==false)
       continue;
      const nativeCandidates=[];
      for(const candidate of visible){
       const witness=certifyActualOCCTFullFrontOriginalPaperEndpoints({
        geometry,view,frontEdge,nativeVisible:candidate
       });
       if(witness.nativeVisibleOriginalFrontSourceVerified!==true)
        continue;
       nativeCandidates.push(witness);
      }
      // The original solid physical front-edge theorem must also be
      // independently present in real OCCT, never a fabricated face.
      // It is not necessary that the generated native VCompound owns
      // the missing one-ULP original parameter *endpoint*.
      if(nativeCandidates.length===0)continue;
      const nativeEntire=nativeCandidates.some(x=>
       x.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints);
      physicalFrontSourceProofs.push({
       originalFront3DSourceEdgeId:frontId,
       exactlyCoincidentFullOriginalM0PaperEndpoints:true,
       exactDyadicStrictOriginal3DWholeOpenFrontDepth:true,
       independentlyM5ClosedFrontOriginal3DRayClear:true,
       realOCCTOriginalSourceBRep3DCurveVerified:true,
       realOCCTVisibleFrontNativeSourceCurveWitnessCount:
        nativeCandidates.length,
       genuineOCCTVisibleHLRGeneratedEdgeCoversAllOriginalEndpoints:
        nativeEntire,
       genuineHCompoundSource3DEndpointsExactlyReprojectToNativePaper:
        nativeHiddenEndpointReprojectionExactlyVerified,
       realVisibleVCompoundAndHiddenHCompoundFullOpenPaperMaskProven:
        nativeEntire&&nativeHiddenEndpointReprojectionExactlyVerified,
       missingOCCTGeneratedHLREdgePaperTailStillRequiresSeparateProof:
        !nativeEntire,
       fullOriginalModelOpenParameterGapLocallyFrontMasked:true,
       actualGeneratedTopoDSEdgeIdentityCertified:false,
       originalEndVertexJoinAndGBStyleCertified:false,
       signedV5Action:false
      });
     }
    }
    const accounted=physicalFrontSourceProofs.length>0;
    if(accounted)
     counts.exactM0FullFrontPhysicalSourceGapIntervalsCorroborated++;
    else counts.unprovenOriginalOpenParameterGapIntervalsHeld++;
    if(physicalFrontSourceProofs.some(x=>
      x.realVisibleVCompoundAndHiddenHCompoundFullOpenPaperMaskProven))
     counts.verifiedCompleteRealNativeVCompoundPaperCoveringSourceGaps++;
    if(physicalFrontSourceProofs.some(x=>
      x.missingOCCTGeneratedHLREdgePaperTailStillRequiresSeparateProof))
     counts.actualNativeVisibleHLRDoesNotFullyCoverM0PaperStillHeld++;
    gapRows.push({
     originalHiddenSourceParameterRange:[...range],
     exactFullOriginal3DPhysicalFrontSourceWitnesses:
      physicalFrontSourceProofs,
     gapOpenIntervalLocallyCoveredByIndependentM0FrontGeometry:accounted,
     nativeTrueVisibleAndHiddenHLROpenPaperLineCoverageProven:
      physicalFrontSourceProofs.some(x=>
       x.realVisibleVCompoundAndHiddenHCompoundFullOpenPaperMaskProven),
     // Exact native paper equality is not OCCT's generated TopoDS
     // edge-to-source history or physical adjacent edge topological join.
     generatedHLRSourceTopoDSHistoryAndAllJunctionsCertified:false,
     endpointAndGlobalProjectedTopologicalJoinCertified:false,
     officialEngineeringLineStyle:'undetermined',
     constructionIntentAuthorized:false,signedV5Action:false
    });
   }
   const localWithM0=unique&&trueHiddenGeometry&&ranges.length>0&&
    ranges.length===gapRows.length&&
    gapRows.every(x=>x.gapOpenIntervalLocallyCoveredByIndependentM0FrontGeometry);
   if(!entry.locallyExplainedNativeHiddenOpenPaperInterval&&localWithM0)
    counts.newlyFullOriginalModelOpenIntervalLocallyCorroborated++;
   if(!entry.locallyExplainedNativeHiddenOpenPaperInterval&&!localWithM0)
    counts.remainingOriginalModelOpenIntervalUnresolvedNativeEdges++;
   const nativeFull=entry.locallyExplainedNativeHiddenOpenPaperInterval||
    (gapRows.length>0&&gapRows.every(x=>
     x.nativeTrueVisibleAndHiddenHLROpenPaperLineCoverageProven));
   if(nativeFull)
    counts.completeNativeHiddenOpenPaperLinesExplainedByDualOrExactM0WithRealVisibleBRep++;
   else counts.nativeHiddenOpenPaperLinesWithUnverifiedGeneratedHLRTail++;
   rows.push({
    view,revision,sourceGeometryId:geometry.id,
    nativeHiddenSharpEdgeOrdinal:ordinal,
    survivingOriginal3DSourceUnique:unique,
    genuineOriginalOCCT3DHiddenCurveConfirmed:trueHiddenGeometry,
    existingDualProofWholeIntervalVerified:
     entry.locallyExplainedNativeHiddenOpenPaperInterval,
    originalM4OrNativePaperPositiveGapWitnesses:gapRows,
    wholeOriginalModelOpenIntervalLocallyAccountedByRayMaskOrM0Source:
     entry.locallyExplainedNativeHiddenOpenPaperInterval||localWithM0,
    realNativeHLRHiddenPaperLineLocallyExplainedByTrueHLRAndM0FullFront:
     nativeFull,
    // Real paper coverage does NOT mean generated TopoDS history or
    // neighboring source-to-source junction topological certification.
    nativeHLRGeneratedSourceTopoDSLinksAndAllJunctionsProven:false,
    allOriginalPhysical3DJunctionsAndGBLineStyleCertified:false,
    constructionIntentAuthorized:false,signedV5Action:false
   });
   ordinal++; 
  }
 }
 if(ordinal!==dual.rows.length||ordinal!==refinements.length||
    counts.actualNativeHiddenEdgesReviewed!==rows.length||
    counts.signedV5Actions!==0)
  throw new RangeError('genuine OCCT native hidden front original 3D gap ledger incomplete');
 return frozen({
  schema:'draftai-c1-real-occt-native-hidden-exact-m0-front-open-gap/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,
  actualNativeGeneratedHLRPaperCoverageAndOriginalModelProofNotConflated:true,
  allOriginal3DAndNativeTopoDSLinksAndJunctionsCertified:false,
  formalStandardLineStyleSignaturesIssued:0,
  constructionIntentAuthorized:false,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={auditC1NativeHiddenUncoveredOriginalFrontRay};
