'use strict';
/**
 * The same TRUE native OCJS hidden HCompound source-open interval may be
 * locally explained by one of TWO logically different proofs on different
 * pieces: M5 strict solid-interior observer-ray occlusion, OR an independently
 * M5 outward-clear FRONT original 3D edge, positive-depth-ordered by M4,
 * actually present in OCJS VCompound and covering the SAME hidden PAPER line.
 *
 * This is a conservative union of two independently recomputed POSITIVE
 * certificates, not a third HLR classifier or inferred TopoDS provenance.
 * Every positive-length uncovered interval persists, even one binary64 ULP.
 * It NEVER grants a GB engineering dashed line, source line join,
 * ConstructionIntent, DAG or sole V5 stroke.
 */
const finite=Number.isFinite;
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
function certifyHiddenNativeOriginalOpenIntervalDualCoverage({
 originalSourceParameterRange,strictInteriorRanges,frontVisibleMaskRanges,
 exactIntervalCoverage
}={}){
 const range=originalSourceParameterRange;
 if(!Array.isArray(range)||range.length!==2||!range.every(finite)||
    range[0]<0||range[1]>1||range[0]>=range[1]||
    !Array.isArray(strictInteriorRanges)||
    !Array.isArray(frontVisibleMaskRanges)||
    typeof exactIntervalCoverage!=='function')
  throw new TypeError('native HLR bounded original parameter and independent two positive witnesses required');
 // Treat these as already authenticated by the current exact M5 and
 // actual native HLR/M4/visible M5 consumers; never invent more ranges.
 const inside=exactIntervalCoverage(range,strictInteriorRanges),
  masked=exactIntervalCoverage(range,frontVisibleMaskRanges),
  both=exactIntervalCoverage(range,[
   ...inside.positiveLengthCoveredIntervals,
   ...masked.positiveLengthCoveredIntervals
  ]);
 return frozen({
  originalSourceParameterRange:[...range],
  strictInteriorIndependentlyVerifiedIntervals:
   inside.positiveLengthCoveredIntervals,
  realVisibleFrontSourceDepthMaskVerifiedIntervals:
   masked.positiveLengthCoveredIntervals,
  onlyLocallyVerifiedHiddenOrFrontMaskIntervals:
   both.positiveLengthCoveredIntervals,
  outstandingUnprovedOriginalParameterIntervals:
   both.positiveLengthUncoveredIntervals,
  entireActualNativeHLROpenPaperIntervalLocallyAccountedFor:
   both.entireOriginalParameterIntervalCovered,
  strictInwardSourceEntireOpenIntervalProven:
   inside.entireOriginalParameterIntervalCovered,
  independentFrontVisibleSourceMaskEntireOpenIntervalProven:
   masked.entireOriginalParameterIntervalCovered,
  allGapBoundariesHavePhysical3DOriginalJunctionProof:false,
  completeOCCTGeneratedBRepEdgeOriginalTopoDSHistory:false,
  globallyFinalStandardLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5Action:false
 });
}
function auditC1NativeHiddenDualOpenIntervalProof({
 geometry,revision,strictM5,frontMask,exactIntervalCoverage
}={}){
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    strictM5?.sourceGeometryId!==geometry.id||
    strictM5.revision!==revision||
    strictM5.allNativeHLRToSourceTopoDSIdentitiesProven!==false||
    strictM5.signedV5ActionCount!==0||
    frontMask?.sourceGeometryId!==geometry.id||
    frontMask.revision!==revision||
    frontMask.firstAngleTrueOCCTHLRVisibleAndHiddenConsumed!==true||
    frontMask.signedV5ActionCount!==0||
    !Array.isArray(strictM5.rows)||!Array.isArray(frontMask.rows)||
    strictM5.rows.length!==frontMask.rows.length||
    typeof exactIntervalCoverage!=='function')
  throw new TypeError('current true OCCT hidden line M5 strict and front native proofs required');
 const counts={
  realNativeHiddenOpenLineIntervalsReviewed:0,
  withUniqueOriginal3DSource:0,
  withNoUniqueOriginal3DSourceHeld:0,
  fullyStrictInwardLocallyVerified:0,
  fullyFrontVisible3DSourceMaskVerified:0,
  entireNativeHiddenOpenIntervalLocallyAccountedByEitherProof:0,
  needingBothPositiveProofTypesForFullCoverage:0,
  stillUnprovenAfterConservativeIntervalUnion:0,
  uncoveredPositiveOriginalSourceParameterRangesHeld:0,
  original3DEndpointFanProofsIncompleteHeld:0,
  OCCTGeneratedTopoDSProven:0,
  formalGBLineStylesSigned:0,V5ActionsSigned:0
 };
 const rows=[];
 for(let i=0;i<strictM5.rows.length;i++){
  const a=strictM5.rows[i],b=frontMask.rows[i];
  if(a.view!==b.view||a.nativeHiddenSharpEdgeOrdinal!==i||
     b.nativeHiddenSharpEdgeOrdinal!==i||
     a.sourceGeometryId!==geometry.id||a.revision!==revision||
     b.sourceGeometryId!==geometry.id||b.revision!==revision||
     a.genuineHiddenOCCTCurveVerified!==true||
     b.signedV5Action!==false||a.signedV5Action!==false||
     a.nativeHLRGeneratedTopologyComplete!==false||
     a.wholeNativeHLRLineOfficialGBStyleCertified!==false||
     b.originalHLRSourceTopoDSIdentityRecovered!==false)
   throw new RangeError('native hidden HLR proof union has stale or unmatched source');
  const sources=a.sourceCandidate3DProofs,hasUnique=
   sources.length===1&&
   sources[0].uniqueRemaining3DPhysicalSourcePossibility===true&&
   sources[0].originalPhysical3DCreasePositivelyVerified===true&&
   b.originalHidden3DSourceEdgeId===sources[0].originalPhysicalSourceEdgeId;
  let union=null,endpointsComplete=false;
  if(hasUnique){
   const strict=sources[0],inward=
    strict.independentM5Open3DRayClosure;
   if(!inward||inward.generatedHLRTopoDSToOriginalTopoDSCertified!==false||
      strict.nativeGeneratedTopoDSOriginalSourceIdentityRecovered!==false||
      strict.signedV5Action!==false||
      b.wholeHiddenPaperIntervalMaskCoverage===null||
      b.actualHiddenOriginal3DSourceParameterRange?.[0]!==
       strict.nativeOriginalSourceParameterRange?.[0]||
      b.actualHiddenOriginal3DSourceParameterRange?.[1]!==
       strict.nativeOriginalSourceParameterRange?.[1])
    throw new RangeError('M5 same original 3D hidden source parameter mismatch');
   const inside=inward.exactM5StrictlyHiddenPositiveCoverage;
   const visible=b.wholeHiddenPaperIntervalMaskCoverage
    .positiveLengthCoveredIntervals;
   union=certifyHiddenNativeOriginalOpenIntervalDualCoverage({
    originalSourceParameterRange:strict.nativeOriginalSourceParameterRange,
    strictInteriorRanges:inside,
    frontVisibleMaskRanges:visible,
    exactIntervalCoverage
   });
   const originalM4All=inward.nativeOriginalParameterFullyCoveredByM4Cuts;
   const mask=b.wholeHiddenPaperIntervalMaskCoverage;
   // Do not treat M4 missing original ray cuts as proof of inward
   // occlusion, but a front-visible *independent* physical witness
   // may still explain those parts on PAPER. This is only LOCAL proof.
   if(union.strictInwardSourceEntireOpenIntervalProven&&
      (!inward.wholeNativeOriginalOpenIntervalStrictlyHiddenByM5||
       !originalM4All))
    throw new RangeError('strict M5 full interval falsely inferred across M4 gaps');
   if(union.independentFrontVisibleSourceMaskEntireOpenIntervalProven!==
      b.entireNativeHiddenPaperStrokeCoveredByPositivelyClearFrontSource)
    throw new RangeError('native front-visible original source coverage drift');
   endpointsComplete=
    strict.nativeOriginalEndVertexClosed3DFanAndM4MissingCount===0;
   counts.withUniqueOriginal3DSource++;
   if(!endpointsComplete)
    counts.original3DEndpointFanProofsIncompleteHeld++;
   if(union.strictInwardSourceEntireOpenIntervalProven)
    counts.fullyStrictInwardLocallyVerified++;
   if(union.independentFrontVisibleSourceMaskEntireOpenIntervalProven)
    counts.fullyFrontVisible3DSourceMaskVerified++;
   if(union.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor)
    counts.entireNativeHiddenOpenIntervalLocallyAccountedByEitherProof++;
   else counts.stillUnprovenAfterConservativeIntervalUnion++;
   if(union.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor&&
      !union.strictInwardSourceEntireOpenIntervalProven&&
      !union.independentFrontVisibleSourceMaskEntireOpenIntervalProven)
    counts.needingBothPositiveProofTypesForFullCoverage++;
   counts.uncoveredPositiveOriginalSourceParameterRangesHeld+=
    union.outstandingUnprovedOriginalParameterIntervals.length;
  }else{
   counts.withNoUniqueOriginal3DSourceHeld++;
   counts.stillUnprovenAfterConservativeIntervalUnion++;
  }
  rows.push({
   view:a.view,revision,sourceGeometryId:geometry.id,
   nativeHiddenSharpEdgeOrdinal:i,
   remainingOriginal3DPhysicalSourceUnique:hasUnique,
   originalHiddenSourceEdgeId:hasUnique?b.originalHidden3DSourceEdgeId:null,
   original3DSourceEndpointFanAndM4Complete:endpointsComplete,
   independentOpenIntervalRayAndFrontVisibleUnion:union,
   locallyExplainedNativeHiddenOpenPaperInterval:
    union?.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor===true,
   entireOriginal3DAndGeneratedHLRPhysicalJunctionProofCertified:false,
   fullGBDashedLineOrVisibleLineAssignmentSigned:false,
   constructionIntentAuthorized:false,signedV5Action:false
  });
  counts.realNativeHiddenOpenLineIntervalsReviewed++;
 }
 if(counts.realNativeHiddenOpenLineIntervalsReviewed!==
    strictM5.counts.actualNativeHiddenEdgesAudited||
    counts.realNativeHiddenOpenLineIntervalsReviewed!==
     frontMask.counts.realHiddenNativeEdgesAudited||
    counts.OCCTGeneratedTopoDSProven!==0||
    counts.formalGBLineStylesSigned!==0||counts.V5ActionsSigned!==0)
  throw new RangeError('incomplete original-source local native hidden evidence proof union');
 return frozen({
  schema:'draftai-c1-real-occt-hlr-native-hidden-3d-source-ray-or-front-visible-interval-union/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,
  strictInteriorAndFrontVisibleProofTypesRemainIndependent:true,
  nativeVisibleAndHiddenOCCTOnlyLocalPaperEvidence:true,
  unsignedOriginalM5CanonicalLineSignerUntouched:true,
  allGeneratedTopoDSOriginalSourceHistoryProven:false,
  allGlobalEngineeringLineStylesCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={certifyHiddenNativeOriginalOpenIntervalDualCoverage,
 auditC1NativeHiddenDualOpenIntervalProof};
