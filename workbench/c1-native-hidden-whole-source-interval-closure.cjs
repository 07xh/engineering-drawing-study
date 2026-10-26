'use strict';
/**
 * The genuine OCJS HCompound segment is a PAPER line. A unique remaining
 * ORIGINAL 3D source possibility does not prove that every point along
 * that native line has an independently certified M5 hidden observer ray.
 *
 * Intersect its lifted original-source [t0,t1] with the authoritative
 * ORIGINAL M4 source-cut intervals; require gap-free positive exact
 * strictly-inward M5 proof for EVERY covered parameter. No epsilon
 * stitching, no inference of HLR generated TopoDS/source identity.
 */
const {VIEWS}=require('../core/projection/conventions.js');
// Fixed trusted M4/M5 interval union: callers cannot substitute an
// unverified coverage callback and forge a whole-native hidden ray proof.
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const finite=Number.isFinite;
function certifyNativeHiddenOriginalOpenInterval({
 nativeOriginalParameterRange,canonicalM5OriginalSourceCuts
}={}){
 const range=nativeOriginalParameterRange,cuts=canonicalM5OriginalSourceCuts;
 if(!Array.isArray(range)||range.length!==2||
    !range.every(finite)||range[0]<0||range[1]>1||range[1]<=range[0]||
    !Array.isArray(cuts)||cuts.length>256)
  throw new TypeError('bounded native original source and verified M5 cuts required');
 let previous=0;
 for(const cut of cuts){
  const r=cut?.originalParameterRange;
  if(!Array.isArray(r)||r.length!==2||
     !r.every(finite)||r[0]<0||r[1]>1||r[0]>=r[1]||
     r[0]<previous||
     cut.signedV5Action!==false||
     (cut.exactWholeOpenRayClear===true&&
      cut.exactWholeOpenStrictInwardHidden===true))
   throw new RangeError('untrusted, overlapping or contradictory original M5 source cut');
  previous=r[1];
 }
 const all=exactCandidateIntervalCoverage(range,cuts.map(x=>x.originalParameterRange));
 const inside=exactCandidateIntervalCoverage(range,cuts.filter(x=>
  x.exactWholeOpenStrictInwardHidden===true)
  .map(x=>x.originalParameterRange));
 const clear=exactCandidateIntervalCoverage(range,cuts.filter(x=>
  x.exactWholeOpenRayClear===true)
  .map(x=>x.originalParameterRange));
 const trueCovered=all.positiveLengthCoveredIntervals;
 const hiddenWhole=all.entireOriginalParameterIntervalCovered&&
  inside.entireOriginalParameterIntervalCovered;
 // An outward-clear ray for any positive-length subset means a native
 // 'hidden' paper overlap is not a verified hidden 3D source attribution.
 const incompatibleClear=clear.positiveLengthCoveredIntervals.length>0;
 if(hiddenWhole&&incompatibleClear)
  throw new RangeError('M5 strict inward contradicts independently clear original ray');
 return freeze({
  nativeOriginalParameterRange:[...range],
  canonicalM4PositiveCoverage:trueCovered,
  uncoveredNativeOriginal3DSourceIntervals:
   all.positiveLengthUncoveredIntervals,
  exactM5StrictlyHiddenPositiveCoverage:
   inside.positiveLengthCoveredIntervals,
  strictM5HiddenProofGapsAlongNativeHLRInterval:
   inside.positiveLengthUncoveredIntervals,
  M5ClearRayOverlapsNativeHLRHiddenPaperCandidate:
   incompatibleClear,
  nativeOriginalParameterFullyCoveredByM4Cuts:
   all.entireOriginalParameterIntervalCovered,
  wholeNativeOriginalOpenIntervalStrictlyHiddenByM5:
   hiddenWhole&&!incompatibleClear,
  originalM4MissingPositiveParameterLength:
   all.originalSourceSubspanHasGenuinePositiveLengthGap,
  originalOpen3DRayHiddenNotEndpointOrGlobalStyle:true,
  generatedHLRTopoDSToOriginalTopoDSCertified:false,
  engineeringHiddenLineStyleSigned:false,
  signedV5Action:false
 });
}
/**
 * Cross-check authentic #761 native HLR endpoint candidates, #760 source
 * elimination, and #752 M5 open original 3D ray cut partition. A verified
 * open line interval says nothing about whether adjoining projected lines
 * physically connect or whether GB dashed line style is authorized.
 */
function auditNativeHiddenWholeOriginalSourceIntervals({
 geometry,revision,cad,refinements,m5,endpointFans
}={}){
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    cad?.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||
    cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
    cad.v5Authorized!==false||
    m5?.sourceGeometryId!==geometry.id||m5.revision!==revision||
    m5.signedV5ActionCount!==0||
    endpointFans?.sourceGeometryId!==geometry.id||
    endpointFans.revision!==revision||
    endpointFans.nativeGeneratedTopoDSEdgeEndpointIdentityProven!==false||
    endpointFans.signedV5ActionCount!==0||
    !Array.isArray(m5.rows)||!Array.isArray(endpointFans.rows)||
    !Array.isArray(refinements))
  throw new TypeError('current native HLR, M5 cut, M4 vertex fan and revision required');
 const sourceMap=new Map(m5.rows.map(row=>[
  row.originalPhysicalSourceEdgeId+'@'+row.view,row]));
 if(sourceMap.size!==m5.rows.length)
  throw new RangeError('duplicated M5 3D original source/view');
 const rows=[],counts={
  actualNativeHiddenEdgesAudited:0,
  wholeHiddenNativeOpen3DSourceIntervalsCertified:0,
  original3DPhysicalCreaseWholeHiddenAndValidEndpoints:0,
  nativeHiddenUnique3DSourceButIncompleteStrictM5:0,
  nativeHiddenRetainedMultiple3DSourcePossibilities:0,
  nativeHiddenWithoutAnyPhysicalSourcePossibility:0,
  nativeHiddenOriginal3DSourceM4PositiveGapCount:0,
  nativeHiddenOriginalStrictM5ProofPositiveGapCount:0,
  nativeHiddenSourceClearRayConflicts:0,
  original3DNativeHiddenEndpointFanGapsHeld:0,
  generatedHLRTopoDSIdentityCertified:0,engineeringHiddenLinesSigned:0,
  newV5ActionsSigned:0
 };
 let ordinal=0;
 for(const view of VIEWS){
  const hidden=cad.hiddenSharpViews?.[view];
  if(!Array.isArray(hidden))throw new RangeError('missing real hidden HLR view');
  for(const native of hidden){
   const refined=refinements[ordinal],topology=endpointFans.rows[ordinal];
   if(native.view!==view||
      native.occtHLRVisibilityClass!=='hidden-sharp'||
      native.actualOCCTHLRFlattenedBRepLineVerified!==true||
      native.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
      !refined||refined.view!==view||
      refined.projectedFrom.u!==native.from.u||
      refined.projectedFrom.v!==native.from.v||
      refined.projectedTo.u!==native.to.u||
      refined.projectedTo.v!==native.to.v||
      refined.originalPaperCandidateCount!==native.sourceCandidate3DLifts.length||
      refined.nativeHLRToSourceTopoDSIdentityRecovered!==false||
      !topology||topology.view!==view||
      topology.nativeHiddenSharpEdgeOrdinal!==ordinal||
      topology.nativeGeneratedTopoDSIdentityCertified!==false||
      topology.nativeHLREdgeJunctionsCertified!==false||
      topology.physicallyRemainingSourceCount!==
       refined.remainingPossibleOriginal3DSourceCount)
    throw new RangeError('native hidden OCCT/M5/3D topology source history mismatch');
   const surviving=refined.remainingPhysicalSourcePossibilities;
   if(!Array.isArray(surviving)||
      topology.survivingOriginal3DEdgesWithEndpointFans.length!==surviving.length)
    throw new RangeError('current native HLR surviving physical source evidence missing');
   if(surviving.length===0)
    counts.nativeHiddenWithoutAnyPhysicalSourcePossibility++;
   if(surviving.length>1)
    counts.nativeHiddenRetainedMultiple3DSourcePossibilities++;
   const perSource=[];
   for(const possibility of surviving){
    const id=possibility.sourceEdgeId;
    const lifted=native.sourceCandidate3DLifts.find(x=>x.sourceEdgeId===id);
    const original=sourceMap.get(id+'@'+view);
    const endpoint=topology.survivingOriginal3DEdgesWithEndpointFans
     .find(x=>x.originalPhysicalSourceEdgeId===id);
    if(!lifted||!original||!endpoint||
       original.sourceGeometryId!==geometry.id||original.revision!==revision||
       original.officialEngineeringLineStyle!=='undetermined'||
       original.signedV5Action!==false||
       lifted.originalOCCTSourceLineCurveVerified!==true||
       lifted.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       lifted.originalXYZReprojectsToHLR!==true||
       lifted.v5Authorized!==false||
       !Array.isArray(endpoint.endpointWitnesses)||
       endpoint.endpointWitnesses.length!==2||
       endpoint.signedV5Action!==false)
     throw new RangeError('lost genuine M5 original physical source evidence');
    const nativeRange=lifted.originalSourceParameterRange;
    const [a,b]=endpoint.endpointWitnesses;
    if(a.sourceEdgeId!==id||b.sourceEdgeId!==id||
       a.originalSourceParameter!==lifted.sourceParameterAtProjectedFrom||
       b.originalSourceParameter!==lifted.sourceParameterAtProjectedTo||
       a.signedV5Action!==false||b.signedV5Action!==false||
       a.nativeHLRGeneratedTopoDSEndpointToOriginalTopoDSIdentityCertified!==false||
       b.nativeHLRGeneratedTopoDSEndpointToOriginalTopoDSIdentityCertified!==false)
     throw new RangeError('native HLR 3D endpoints are not exact original-source intervals');
    const closure=certifyNativeHiddenOriginalOpenInterval({
     nativeOriginalParameterRange:nativeRange,
     canonicalM5OriginalSourceCuts:original.originalCutSubspans
    });
    // Genuine original vertices require both M4 endpoint linkage
    // and positively verified 3D original face fan. A native HLR
    // midpoint is valid SOURCE geometry, NEVER a new physical junction.
    const originalEndpointFanGaps=[a,b].filter(w=>
     w.originalSource3DVertexId!==null&&
     w.original3DSourceVertexPlusM4AndFanVerified!==true).length;
    const sourcePhysical=original.originalPhysicalCreaseProven===true;
    const single=surviving.length===1;
    const locallyHidden=single&&sourcePhysical&&
     closure.wholeNativeOriginalOpenIntervalStrictlyHiddenByM5;
    const withEndpoints=locallyHidden&&originalEndpointFanGaps===0;
    if(locallyHidden)
     counts.wholeHiddenNativeOpen3DSourceIntervalsCertified++;
    if(withEndpoints)
     counts.original3DPhysicalCreaseWholeHiddenAndValidEndpoints++;
    if(single&&!locallyHidden)
     counts.nativeHiddenUnique3DSourceButIncompleteStrictM5++;
    counts.nativeHiddenOriginal3DSourceM4PositiveGapCount+=
     closure.uncoveredNativeOriginal3DSourceIntervals.length;
    counts.nativeHiddenOriginalStrictM5ProofPositiveGapCount+=
     closure.strictM5HiddenProofGapsAlongNativeHLRInterval.length;
    if(closure.M5ClearRayOverlapsNativeHLRHiddenPaperCandidate)
     counts.nativeHiddenSourceClearRayConflicts++;
    counts.original3DNativeHiddenEndpointFanGapsHeld+=originalEndpointFanGaps;
    perSource.push({
     originalPhysicalSourceEdgeId:id,
     nativeOriginalSourceParameterRange:[...nativeRange],
     uniqueRemaining3DPhysicalSourcePossibility:single,
     originalPhysical3DCreasePositivelyVerified:sourcePhysical,
     independentM5Open3DRayClosure:closure,
     nativeOriginalEndVertexClosed3DFanAndM4MissingCount:
      originalEndpointFanGaps,
     localWholeHiddenOriginal3DSourceOpenIntervalCorroborated:
      locallyHidden,
     localWholeHiddenOpenIntervalAndOriginalEndVerticesCorroborated:
      withEndpoints,
     // This is positive ray/source/endpoint proof, NOT certified
     // OCCT HLR generated-TopoDS identity or engineering dashed style.
     globalViewPaperJunctionsCertified:false,
     nativeGeneratedTopoDSOriginalSourceIdentityRecovered:false,
     allApplicableGBLineStyleRulesCertified:false,
     officialEngineeringLineStyle:'undetermined',
     constructionIntentAuthorized:false,signedV5Action:false
    });
   }
   rows.push({
    view,sourceGeometryId:geometry.id,revision,
    nativeHiddenSharpEdgeOrdinal:ordinal,
    nativeProjectedFrom:{...native.from},
    nativeProjectedTo:{...native.to},
    sourceCandidate3DProofs:perSource,
    genuineHiddenOCCTCurveVerified:true,
    nativeHLRGeneratedTopologyComplete:false,
    wholeNativeHLRLineOfficialGBStyleCertified:false,
    constructionIntentAuthorized:false,signedV5Action:false
   });
   ordinal++;counts.actualNativeHiddenEdgesAudited++;
  }
 }
 if(rows.length!==refinements.length||
    rows.length!==endpointFans.rows.length||
    counts.actualNativeHiddenEdgesAudited!==
     Object.values(cad.hiddenSharpViews).reduce((s,v)=>s+v.length,0)||
    counts.newV5ActionsSigned!==0)
  throw new RangeError('native full hidden original source proof ledger is incomplete');
 return freeze({
  schema:'draftai-c1-native-hidden-hlr-full-original-open-ray-interval-closure/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,
  allOriginal3DRayParameterGapsPreserved:true,
  allNativeHLRToSourceTopoDSIdentitiesProven:false,
  actualGlobalHLRPolylineAndJunctionTopologyComplete:false,
  wholeEngineeringHiddenLineCertification:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={certifyNativeHiddenOriginalOpenInterval,
 auditNativeHiddenWholeOriginalSourceIntervals};
