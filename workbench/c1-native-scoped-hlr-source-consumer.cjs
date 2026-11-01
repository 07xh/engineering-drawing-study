'use strict';
/**
 * Consume REAL source-scoped HLR extraction (original TopoDS input edge
 * filtered through OCCT) alongside the whole-solid V/H/W HLR result.
 * No guessed paper alias may be promoted to original TopoDS history:
 * native scoped IsSame is tracked separately, and original 3D source
 * parameter intervals and continuous M5 rays remain independent gates.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {nativeScopedPaperSegmentsSame}=
 require('../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
const {exactCandidateIntervalCoverage,exactCandidateVisibilityClassOverlap}=
 require('./c1-original-source-interval-coverage.cjs');
const {auditExactBinary64PaperParameterPair,
 auditExactBinary64PaperCandidateCoverage,
 auditExactBinary64PaperVisibilityConflict}=
 require('./c1-exact-binary64-paper-parameter.cjs');
const {auditC1ExactBinary64PaperAffineWitness}=
 require('./c1-exact-binary64-paper-affine.cjs');
const {auditC1ExactTwoAxisGeneratedPaperCoverage}=
 require('./c1-exact-two-axis-generated-paper-coverage.cjs');
const {projectC1Native3DSourceIntervalsToM4}=
 require('./c1-native-source-scoped-m4-projection.cjs');
const {auditC1RealNativeScoped2D3DClassBinding}=
 require('./c1-native-scoped-2d-3d-class-binding.cjs');
const {auditC1WholeSolidNativeHLRSourceScopeRebinding}=
 require('./c1-global-native-hlr-original-source-rebind.cjs');
const {auditC1GlobalNativeHLROriginalM0EndpointLinks}=
 require('./c1-global-native-hlr-original-3d-endpoint-ledger.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};

/**
 * Compare one generated-edge source interval with the independently
 * source-filtered native 3D M4 visible/hidden parameter partition.
 * The result is class backing, never generated-edge TopoDS ancestry.
 */
function auditC1ParameterizedSourceMatchAgainstNativeM4({
 view,sourceId,match,klass,nativeM4
}={}){
 if(!nativeM4)return {
  availability:'unavailable',sourceEdgeId:sourceId,
  reason:'native-source-scoped-M4-intervals-unavailable',
  originalM0UnitParameterRange:null,nativeM4ClassBacked:false
 };
 const sameClass=klass==='visible'?'visible-sharp':
  klass==='hidden'?'hidden-sharp':null;
 const oppositeClass=klass==='visible'?'hidden-sharp':
  klass==='hidden'?'visible-sharp':null;
 const domain=match?.original3DCurveParameterRange,
  sourceRange=match?.source3DParameterRange,
  direction=nativeM4.original3DSourceCurveDirection;
 if(nativeM4.schema!==
    'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1'||
    nativeM4.sourceEdgeId!==sourceId||nativeM4.view!==view||
    !sameClass||!Array.isArray(nativeM4.segments)||
    !Array.isArray(domain)||domain.length!==2||
    !domain.every(Number.isFinite)||!(domain[1]>domain[0])||
    !Array.isArray(sourceRange)||sourceRange.length!==2||
    !sourceRange.every(Number.isFinite)||
    !['forward','reversed'].includes(direction))
  throw new RangeError('invalid native M4 source-class interval binding for parameterized HLR edge');
 const parameterTolerance=1e-10*Math.max(1,...domain.map(Math.abs),
  ...sourceRange.map(Math.abs));
 if(Math.min(...sourceRange)<domain[0]-parameterTolerance||
    Math.max(...sourceRange)>domain[1]+parameterTolerance)
  throw new RangeError('parameterized source interval escapes original BRep parameter domain');
 const exactDomainContainment=Math.min(...sourceRange)>=domain[0]&&
  Math.max(...sourceRange)<=domain[1];
 const forwardRange=match?.sourceProjected2DParameterRange,
  forwardSortedRange=match?.sourceProjected2DParameterRangeSorted,
  generatedRange=match?.generated2DParameterRange,
  forwardResiduals=match?.sourceProjected2DParameterEndpointResiduals;
 const forwardEndpointBound=
  match?.sourceProjected2DParameterRangeMatchesGeneratedOutputRange===true&&
  Array.isArray(forwardRange)&&forwardRange.length===2&&
  forwardRange.every(Number.isFinite)&&
  Array.isArray(forwardSortedRange)&&forwardSortedRange.length===2&&
  forwardSortedRange.every(Number.isFinite)&&
  Array.isArray(generatedRange)&&generatedRange.length===2&&
  generatedRange.every(Number.isFinite)&&
  Array.isArray(forwardResiduals)&&forwardResiduals.length===2&&
  forwardResiduals.every(Number.isFinite)&&
  Math.min(...forwardRange)===forwardSortedRange[0]&&
  Math.max(...forwardRange)===forwardSortedRange[1]&&
  forwardResiduals[0]===generatedRange[0]-forwardSortedRange[0]&&
  forwardResiduals[1]===generatedRange[1]-forwardSortedRange[1]&&
  forwardResiduals[0]===0&&forwardResiduals[1]===0;
 const normalize=t=>direction==='reversed'?
  (domain[1]-t)/(domain[1]-domain[0]):
  (t-domain[0])/(domain[1]-domain[0]);
 const inverseA=normalize(sourceRange[0]),inverseB=normalize(sourceRange[1]),
  inverseNormalizedRange=[Math.min(inverseA,inverseB),Math.max(inverseA,inverseB)];
 if(!inverseNormalizedRange.every(Number.isFinite)||
    !(inverseNormalizedRange[1]>inverseNormalizedRange[0]))
  throw new RangeError('parameterized generated HLR source interval cannot normalize to original M0 [0,1]');
 // If Parameter3d inverse lands a few ULPs outside the source domain, only
 // the independent exact Parameter2d(original-domain-endpoints) == generated
 // output-endpoints witness may bind the interval back to the original domain.
 // The inverse overshoot is retained verbatim; no endpoint is clamped.
 if(!exactDomainContainment&&!forwardEndpointBound)
  return {
   availability:'available',sourceEdgeId:sourceId,
   original3DSourceCurveDirection:direction,
   generated2DHLRClass:sameClass,
   originalM0UnitParameterRange:inverseNormalizedRange,
   inverseMappedOriginalM0UnitParameterRange:inverseNormalizedRange,
   source3DParameterRangeFromInverse:[...sourceRange],
   sourceParameterDomainContainment:'within-tolerance-but-outside',
   sourceDomainEndpointForwardMapProof:false,
   nativeM4SameClassCoverageComplete:false,
   nativeM4SameClassCoverageGaps:null,
   nativeM4OppositeClassPositiveOverlap:null,
   nativeM4OppositeClassOverlaps:null,
   nativeM4ClassBacked:false,
   reason:'source-parameter-interval-outside-original-M0-unit-domain-no-clamp'
  };
 const effectiveSourceRange=exactDomainContainment?sourceRange:domain;
 const effectiveA=normalize(effectiveSourceRange[0]),
  effectiveB=normalize(effectiveSourceRange[1]),
  normalizedRange=[Math.min(effectiveA,effectiveB),Math.max(effectiveA,effectiveB)];
 if(!normalizedRange.every(Number.isFinite)||
    normalizedRange[0]<0||normalizedRange[1]>1||
    !(normalizedRange[1]>normalizedRange[0]))
  throw new RangeError('forward-bound source interval cannot normalize exactly to original M0 [0,1]');
 const sameRanges=nativeM4.segments.filter(x=>x?.native3DHLRClass===sameClass)
  .map(x=>x.originalM0UnitParameterRange);
 const oppositeRanges=nativeM4.segments.filter(x=>x?.native3DHLRClass===oppositeClass)
  .map(x=>x.originalM0UnitParameterRange);
 const sameCoverage=exactCandidateIntervalCoverage(normalizedRange,sameRanges);
 const oppositeCoverage=exactCandidateIntervalCoverage(normalizedRange,oppositeRanges);
 const oppositeOverlaps=oppositeCoverage.positiveLengthCoveredIntervals;
 return {
  availability:'available',sourceEdgeId:sourceId,
  original3DSourceCurveDirection:direction,
  generated2DHLRClass:sameClass,
  originalM0UnitParameterRange:normalizedRange,
  inverseMappedOriginalM0UnitParameterRange:inverseNormalizedRange,
  source3DParameterRangeFromInverse:[...sourceRange],
  sourceParameterDomainContainment:exactDomainContainment?'exact':
   'forward-endpoint-bound-exact-with-inverse-overshoot',
  sourceDomainEndpointForwardMapProof:forwardEndpointBound,
  nativeM4SameClassCoverageComplete:sameCoverage.entireOriginalParameterIntervalCovered,
  nativeM4SameClassCoverageGaps:sameCoverage.positiveLengthUncoveredIntervals,
  nativeM4OppositeClassPositiveOverlap:oppositeOverlaps.length>0,
  nativeM4OppositeClassOverlaps:oppositeOverlaps,
  nativeM4ClassBacked:
   sameCoverage.entireOriginalParameterIntervalCovered&&oppositeOverlaps.length===0
 };
}
/**
 * Replay a parameterized original HLRBRep_Curve sample against the reviewed
 * M0 physical 3D edge, using the SAME native M4 source orientation. This
 * checks paper coordinates independently of serialized source samples.
 * Small native binary64 drift is measured, never snapped or used to close
 * a positive paper gap, establish generated TopoDS ancestry or sign V5.
 */
function auditC1OriginalM0ProjectedSourceSamples({
 view,originalModelEndpoints,originalNativeRange,originalDirection,
 samples,toleranceMm=1e-6
}={}){
 if(!VIEWS.includes(view)||!Array.isArray(originalModelEndpoints)||
    originalModelEndpoints.length!==2||
    !originalModelEndpoints.every(p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k])))||
    !Array.isArray(originalNativeRange)||originalNativeRange.length!==2||
    !originalNativeRange.every(Number.isFinite)||
    !(originalNativeRange[1]>originalNativeRange[0])||
    !['forward','reversed'].includes(originalDirection)||
    !Array.isArray(samples)||samples.length!==5||
    !Number.isFinite(toleranceMm)||toleranceMm<0)
  throw new RangeError('current M0 source and native 3D curve sample audit required');
 const [a,b]=originalModelEndpoints,[first,last]=originalNativeRange;
 let maximumResidualMm=0;
 for(const sample of samples){
  const parameter=sample?.source3DParameter;
  const point=sample?.sourceProjectedPointMm;
  if(!Number.isFinite(parameter)||!Array.isArray(point)||
     point.length!==2||!point.every(Number.isFinite))
   throw new RangeError('nonfinite original M0 source paper sample');
  const raw=(parameter-first)/(last-first);
  if(!Number.isFinite(raw)||raw<0||raw>1)
   return {status:'held-outside-original-source-domain',
    maximumM0PaperResidualMm:null,originalM0SourcePaperSamplesCorroborated:false,
    generated2DTopoDSHistoryCertified:false,signedV5Action:false};
  const t=originalDirection==='reversed'?1-raw:raw;
  const xyz=t===0?a:t===1?b:{
   x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t
  };
  const expected=project(xyz)[view];
  const residual=Math.hypot(point[0]-expected.u,point[1]-expected.v);
  if(!Number.isFinite(residual)||residual>toleranceMm)
   throw new RangeError('parameterized original HLR source paper sample disagrees with reviewed M0 3D edge');
  maximumResidualMm=Math.max(maximumResidualMm,residual);
 }
 return {status:'reviewed-original-m0-paper-samples-correspond',
  maximumM0PaperResidualMm:maximumResidualMm,
  originalM0SourcePaperSamplesCorroborated:true,
  generated2DTopoDSHistoryCertified:false,signedV5Action:false};
}
/**
 * Reconcile whole-solid generated 2D HLR edges with the SAME-RUN original
 * HLRBRep_Curve parameter map. The source curve enters this map only after
 * symmetric native TopoDS IsSame binds its EdgeData geometry to one M0 edge.
 * This is parameterized curve correspondence, NOT generated-edge TShape
 * ancestry, global occlusion, GB line style, ConstructionIntent or V5.
 */
function auditC1ParameterizedGlobalHLRSourceLineage({
 view,classes,scoped,expected,nativeM4ById,originalModelEndpointsById
}={}){
 const reports=scoped?.generated2DSourceParameterMatches;
 const result={schema:'draftai-c1-parameterized-global-hlr-source-lineage/1',
  view,availability:'available',classes:{},counts:{
   uniqueParameterizedSourceLineage:0,
   ambiguousParameterizedSourceLineage:0,
   nativeFilterNarrowedAmbiguousParameterizedSourceLineage:0,
   unmatchedGeneratedOutputEdges:0,
   unavailableGeneratedOutputEdges:0,
   sourceFilterOrPaperCandidateDisagreements:0,
   nativeM4ClassBackedUniqueFilterSourceEdges:0,
   nativeM4ClassEvidenceUnavailableEdges:0,
   nativeM4ClassBackingUnprovenEdges:0,
   reviewedOriginalM0PaperHeldGeneratedEdges:0,
   heldForIncompleteOriginalCurveCandidateInventory:0
  },generated2DTopoDSHistoryProven:false,
  globalContinuousVisibilityProven:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0};
 // Older synthetic consumers may not carry this optional diagnostic yet.
 // The real pinned-WASM producer now always emits it; absence is reported
 // as unavailable and can never be upgraded from paper aliases.
 if(!reports||typeof reports!=='object'){
  result.availability='unavailable';
  for(const [klass,item] of Object.entries(classes)){
   const rows=item.global.map((_,ordinal)=>({
    wholeSolidHLREdgeOrdinal:ordinal,parameterizedSourceMatchCount:0,
    parameterizedOriginalSourceEdgeIds:[],
    nativeSourceFilterAndM0PaperCandidatesAgree:false,
    status:'parameterized-source-report-unavailable',
    sameRunOriginalHLRCurveParameterLineageProven:false,
    generated2DTopoDSHistoryProven:false,
    globalContinuousVisibilityProven:false,
    engineeringLineStyle:'undetermined',signedV5Action:false
   }));
   result.classes[klass]={generatedOutputEdgeCount:item.global.length,
    unavailableGeneratedOutputEdges:item.global.length,rows};
   result.counts.unavailableGeneratedOutputEdges+=item.global.length;
  }
  return result;
 }
 for(const [klass,item] of Object.entries(classes)){
  const report=reports[klass];
  if(!report||report.schema!==
      'draftai-c1-ocjs-generated-2d-source-parameter-match/1'||
     !Number.isSafeInteger(report.sourceCurveCandidateCount)||
     report.sourceCurveCandidateCount<0||
     report.sourceCurveCandidateCount>expected.size||
     !Number.isSafeInteger(report.topoDSIdentityBoundSourceCurveCount)||
     report.topoDSIdentityBoundSourceCurveCount<0||
     report.topoDSIdentityBoundSourceCurveCount>report.sourceCurveCandidateCount||
     !Number.isSafeInteger(report.topoDSParameterDomainBoundSourceCurveCount)||
     report.topoDSParameterDomainBoundSourceCurveCount<0||
     report.topoDSParameterDomainBoundSourceCurveCount>
      report.topoDSIdentityBoundSourceCurveCount||
     report.generatedOutputEdgeCount!==item.global.length||
     !Array.isArray(report.rows)||report.rows.length!==item.global.length||
     report.generated2DTopoDSHistoryProven!==false||
     report.globalContinuousVisibilityProven!==false||
     report.engineeringLineStyle!=='undetermined'||
     report.signedV5ActionCount!==0)
   throw new RangeError('invalid parameterized whole-solid HLR source report');
  // A 'unique' paper/source candidate is meaningful only when EVERY
  // reviewed original physical source was actually considered. A partial
  // native HLRBRep_Curve map can have one match while silently omitting a
  // second competing BRep edge, so keep that classification held.
  // The producer exports the actual same-run Map keys; old reports without
  // that field are diagnostic-only. Do not invent missing source candidates.
  const sourceIds=report.originalSourceCurveIds;
  if(sourceIds!==undefined&&
     (!Array.isArray(sourceIds)||
      sourceIds.length!==report.sourceCurveCandidateCount||
      sourceIds.some(id=>typeof id!=='string'||!expected.has(id))||
      new Set(sourceIds).size!==sourceIds.length))
   throw new RangeError('invalid or duplicated original HLR source-curve candidate ID inventory');
  const completeOriginalSourceCurveInventory=
   Array.isArray(sourceIds)&&sourceIds.length===expected.size&&
   sourceIds.every(id=>expected.has(id));
  const sourceIdsSet=new Set(sourceIds??[]);
  const seenOrdinals=new Set(),distinctParameterDomainBoundSourceIds=new Set();
  let rawUnique=0,rawAmbiguous=0,rawUnmatched=0;
  let unique=0,ambiguous=0,unmatched=0,disagreements=0,heldInventory=0;
  const rows=report.rows.map(row=>{
   const ordinal=row?.ordinal,matches=row?.candidateSourceMatches;
   if(!Number.isSafeInteger(ordinal)||ordinal<0||ordinal>=item.global.length||
      seenOrdinals.has(ordinal)||!Array.isArray(matches)||
      row.candidateSourceMatchCount!==matches.length||
      !Number.isSafeInteger(row.rejectedSourceCandidateCount)||
      row.rejectedSourceCandidateCount<0||
      matches.length+row.rejectedSourceCandidateCount!==
       report.sourceCurveCandidateCount)
    throw new RangeError('invalid or incomplete parameterized HLR output ordinal inventory');
   seenOrdinals.add(ordinal);
   const segment=item.global[ordinal];
   const paperCandidates=Array.isArray(segment?.projectedOriginalEdgeCandidates)?
    segment.projectedOriginalEdgeCandidates:[];
   const candidateIds=new Set(),m0SampleAudits=new Map();
   for(const match of matches){
    const sourceId=match?.sourceEdgeId,
     originalDomain=match?.original3DCurveParameterRange,
     originalBRepDomain=match?.originalBRepSourceParameterRange,
     sourceProjectedRange=match?.sourceProjected2DParameterRange,
     sourceProjectedSortedRange=match?.sourceProjected2DParameterRangeSorted,
     sourceProjectedEndpointResiduals=match?.sourceProjected2DParameterEndpointResiduals,
     sourceRange=match?.source3DParameterRange,
     generatedRange=match?.generated2DParameterRange,
     samples=match?.samples;
    if(!expected.has(sourceId)||
       (Array.isArray(sourceIds)&&!sourceIdsSet.has(sourceId))||
       candidateIds.has(sourceId)||
       match.matched!==true||match.originalTopoDSEdgeIdentityProven!==true||
       match.originalBRepParameterRangeMatches!==true||
       !Array.isArray(originalBRepDomain)||originalBRepDomain.length!==2||
       !originalBRepDomain.every(Number.isFinite)||
       originalBRepDomain[0]!==originalDomain?.[0]||
       originalBRepDomain[1]!==originalDomain?.[1]||
       !Array.isArray(sourceProjectedRange)||sourceProjectedRange.length!==2||
       !sourceProjectedRange.every(Number.isFinite)||
       !Array.isArray(sourceProjectedSortedRange)||sourceProjectedSortedRange.length!==2||
       !sourceProjectedSortedRange.every(Number.isFinite)||
       !Array.isArray(sourceProjectedEndpointResiduals)||sourceProjectedEndpointResiduals.length!==2||
       !sourceProjectedEndpointResiduals.every(Number.isFinite)||
       typeof match.sourceProjected2DParameterRangeMatchesGeneratedOutputRange!=='boolean'||
       sourceProjectedRange[0]===sourceProjectedRange[1]||
       Math.min(...sourceProjectedRange)!==sourceProjectedSortedRange[0]||
       Math.max(...sourceProjectedRange)!==sourceProjectedSortedRange[1]||
       sourceProjectedEndpointResiduals[0]!==
        generatedRange?.[0]-sourceProjectedSortedRange[0]||
       sourceProjectedEndpointResiduals[1]!==
        generatedRange?.[1]-sourceProjectedSortedRange[1]||
       match.sourceProjected2DParameterRangeMatchesGeneratedOutputRange!==
        (sourceProjectedEndpointResiduals[0]===0&&sourceProjectedEndpointResiduals[1]===0)||
       match.generated2DTopoDSHistoryProven!==false||
       match.engineeringLineStyle!=='undetermined'||match.signedV5Action!==false||
       !Array.isArray(originalDomain)||originalDomain.length!==2||
       !originalDomain.every(Number.isFinite)||!(originalDomain[1]>originalDomain[0])||
       !Array.isArray(sourceRange)||sourceRange.length!==2||
       !sourceRange.every(Number.isFinite)||sourceRange[0]===sourceRange[1]||
       !Array.isArray(generatedRange)||generatedRange.length!==2||
       !generatedRange.every(Number.isFinite)||!(generatedRange[1]>generatedRange[0])||
       !Number.isFinite(match.maximumProjectedPointResidualMm)||
       match.maximumProjectedPointResidualMm<0||
       !Number.isFinite(match.maximumParameterRoundTripResidual)||
       match.maximumParameterRoundTripResidual<0||
       !Array.isArray(samples)||samples.length!==5)
     throw new RangeError('invalid same-run original HLR parameterized source witness');
    const parameterTolerance=1e-10*Math.max(1,...originalDomain.map(Math.abs),
     ...sourceRange.map(Math.abs));
    if(Math.min(...sourceRange)<originalDomain[0]-parameterTolerance||
       Math.max(...sourceRange)>originalDomain[1]+parameterTolerance)
     throw new RangeError('parameterized HLR source interval escapes original 3D curve domain');
    if(Array.isArray(segment.actualOCCTHLRCurveParameterRange)&&
       (segment.actualOCCTHLRCurveParameterRange[0]!==generatedRange[0]||
        segment.actualOCCTHLRCurveParameterRange[1]!==generatedRange[1]))
     throw new RangeError('parameterized HLR match disagrees with generated edge parameter domain');
    // Recompute the received five-point evidence instead of trusting a
    // producer-supplied residual or a grafted interior generated sample.
    // This validates candidate provenance only, never source TopoDS
    // ancestry, continuous visibility, engineering style or V5.
    if(samples[0].source3DParameter!==sourceRange[0]||
       samples[4].source3DParameter!==sourceRange[1])
     throw new RangeError('M4 parameterized HLR five-point source endpoints disagree with source interval');
    const sampleResiduals=[],roundTripResiduals=[];
    const sourceDirection=Math.sign(sourceRange[1]-sourceRange[0]);
    const reportedNativeSamples=segment.actualOCCTHLRCurveSamplesProjectedMm;
    for(let sampleIndex=0;sampleIndex<samples.length;sampleIndex++){
     const sample=samples[sampleIndex];
     const sourcePoint=sample?.sourceProjectedPointMm,
      generatedPoint=sample?.generatedProjectedPointMm;
     if(!Number.isFinite(sample?.generated2DParameter)||
        !Number.isFinite(sample?.source3DParameter)||
        !Number.isFinite(sample?.parameterRoundTripResidual)||
        sample.parameterRoundTripResidual<0||
        !Array.isArray(sourcePoint)||sourcePoint.length!==2||
        !sourcePoint.every(Number.isFinite)||
        !Array.isArray(generatedPoint)||generatedPoint.length!==2||
        !generatedPoint.every(Number.isFinite)||
        !Number.isFinite(sample.projectedPointResidualMm)||
        sample.projectedPointResidualMm<0)
      throw new RangeError('invalid parameterized HLR five-point curve correspondence');
     const measured=Math.hypot(sourcePoint[0]-generatedPoint[0],
      sourcePoint[1]-generatedPoint[1]);
     const expectedP2=generatedRange[0]+
      (generatedRange[1]-generatedRange[0])*(sampleIndex/4);
     if(!Number.isFinite(measured)||
        measured!==sample.projectedPointResidualMm||
        sample.generated2DParameter!==expectedP2||
        (Array.isArray(reportedNativeSamples)&&
         (reportedNativeSamples[sampleIndex]?.u!==generatedPoint[0]||
          reportedNativeSamples[sampleIndex]?.v!==generatedPoint[1])))
      throw new RangeError('M4 parameterized HLR five-point sample contradicts actual native paper curve');
     // Parameter3d must not jump backward within one witnessed source
     // interval, even if a forged projected residual happens to be zero.
     // Preserve the exact binary64 interval: no epsilon or clamping.
     if(sampleIndex>0&&sourceDirection*(sample.source3DParameter-
        samples[sampleIndex-1].source3DParameter)<0)
      throw new RangeError('M4 original HLR source parameter samples reverse inside generated edge');
     if(sample.source3DParameter<Math.min(...sourceRange)||
        sample.source3DParameter>Math.max(...sourceRange))
      throw new RangeError('M4 original HLR source sample escapes witnessed parameter interval');
     sampleResiduals.push(measured);
     roundTripResiduals.push(sample.parameterRoundTripResidual);
    }
    if(Math.max(...sampleResiduals)!==match.maximumProjectedPointResidualMm||
       Math.max(...roundTripResiduals)!==match.maximumParameterRoundTripResidual||
       (Number.isFinite(segment.actualOCCTHLRCurveSampleToleranceMm)&&
        Math.max(...sampleResiduals)>segment.actualOCCTHLRCurveSampleToleranceMm))
     throw new RangeError('parameterized HLR curve residual summary is inconsistent');
    // Independently replay the producer's received native HLR endpoint
    // witness at the M4 consumer boundary. A copied parameterized match
    // cannot be grafted onto a different whole-solid generated 2D edge.
    // This is never an original/generated TopoDS identity or M5 signoff.
    const nativeSamples=segment.actualOCCTHLRCurveSamplesProjectedMm;
    const endpointWitness=match.nativePaperEndpointSampleWitness;
    if(nativeSamples!==undefined||endpointWitness!==undefined){
     const from=segment.from,to=segment.to;
     if(!Array.isArray(nativeSamples)||nativeSamples.length!==5||
        !nativeSamples.every(p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v))||
        ![from,to].every(p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v))||
        !Number.isFinite(segment.actualOCCTHLRCurveSampleToleranceMm)||
        segment.actualOCCTHLRCurveSampleToleranceMm<0||
        endpointWitness?.receivedNativePaperEndpointsChecked!==true||
        endpointWitness.generatedTopoDSVertexIdentityCertified!==false||
        endpointWitness.signedV5Action!==false)
      throw new RangeError('M4 native HLR endpoint/sample provenance witness incomplete');
     const residual=(p,q)=>Math.hypot(p.u-q.u,p.v-q.v);
     const direct=Math.max(residual(nativeSamples[0],from),
      residual(nativeSamples[4],to));
     const reverse=Math.max(residual(nativeSamples[0],to),
      residual(nativeSamples[4],from));
     const minimum=Math.min(direct,reverse);
     const orientation=direct<=reverse?'direct':'reversed';
     if(!Number.isFinite(minimum)||
        minimum>segment.actualOCCTHLRCurveSampleToleranceMm||
        endpointWitness.endpointOrientation!==orientation||
        endpointWitness.maximumNativePaperEndpointSampleResidualMm!==minimum||
        endpointWitness.exactBinary64NativePaperEndpoints!==(minimum===0))
      throw new RangeError('M4 parameterized HLR source reused stale native paper endpoints');
    }
    // Reproject the ORIGINAL reviewed M0 3D source independently of the
    // producer's source/projected paper sample arrays. Native M4 supplies
    // the authentic BRep parameter direction; absent M4 remains candidate
    // only and is never promoted to a line signature.
    const nativeM4=nativeM4ById?.get(sourceId);
    const m0Endpoints=originalModelEndpointsById?.get(sourceId);
    const m0PaperSampleAudit=nativeM4&&m0Endpoints?
     auditC1OriginalM0ProjectedSourceSamples({
      view,originalModelEndpoints:m0Endpoints,
      originalNativeRange:originalDomain,
      originalDirection:nativeM4.original3DSourceCurveDirection,
      // A serialized CAD tolerance is never authority to widen the
      // independent M0 paper consistency gate.
      samples,toleranceMm:Math.min(1e-6,
       Number.isFinite(segment.actualOCCTHLRCurveSampleToleranceMm)?
        Math.max(0,segment.actualOCCTHLRCurveSampleToleranceMm):1e-6)
     }):null;
    // The audit is a veto/diagnostic, not a replacement for original
    // TopoDS identity, global source coverage or continuous M5 rays.
    m0SampleAudits.set(sourceId,m0PaperSampleAudit);
    candidateIds.add(sourceId);
    distinctParameterDomainBoundSourceIds.add(sourceId);
   }
   const rawStatus=matches.length===0?'no-parameterized-source-curve-match':
    matches.length===1?'unique-parameterized-source-curve-match':
     'ambiguous-parameterized-source-curve-match';
   if(row.status!==rawStatus||
      row.uniqueOriginalSourceEdgeId!==(matches.length===1?matches[0].sourceEdgeId:null))
    throw new RangeError('parameterized HLR source match classification is inconsistent');
   // A count alone does not prove that every original BRep curve was
   // actually rejected or matched. Rebuild the exact per-edge partition
   // from the native producer's accepted AND rejected source identities.
   // Legacy reports without rejection identities remain held, not signed.
   const rejectedCandidates=row.rejectedSourceCandidates;
   const rejectedIds=new Set();
   if(rejectedCandidates!==undefined){
    if(!Array.isArray(rejectedCandidates)||
       rejectedCandidates.length!==row.rejectedSourceCandidateCount)
     throw new RangeError('incomplete HLR rejected original BRep source inventory');
    for(const rejected of rejectedCandidates){
     if(typeof rejected?.sourceEdgeId!=='string'||
        !sourceIdsSet.has(rejected.sourceEdgeId)||
        rejectedIds.has(rejected.sourceEdgeId)||
        candidateIds.has(rejected.sourceEdgeId)||
        typeof rejected.reason!=='string'||!rejected.reason.trim())
      throw new RangeError('forged or repeated original HLR rejection source identity');
     rejectedIds.add(rejected.sourceEdgeId);
    }
   }
   const completeCandidateReview=
    completeOriginalSourceCurveInventory&&
    Array.isArray(rejectedCandidates)&&
    rejectedIds.size+candidateIds.size===sourceIdsSet.size&&
    [...sourceIdsSet].every(id=>rejectedIds.has(id)||candidateIds.has(id));
   if(Array.isArray(rejectedCandidates)&&
      rejectedIds.size+candidateIds.size!==sourceIdsSet.size)
    throw new RangeError('original HLR source-curve candidate rejection partition incomplete');
   if(matches.length===1)rawUnique++;
   else if(matches.length>1)rawAmbiguous++;
   else rawUnmatched++;
   // A parameterized source must agree with BOTH the independent native
   // source-filtered HLR inventory and the original M0 paper candidate set.
   // Extra source-filter claims are a disagreement, not a reason to pick one.
   const filterSources=item.sources[ordinal];
   const parameterizedSourceIntervals=[],nativeM4ClassBackedSourceIds=new Set(),
    nativeM4Audits=[];
   for(const match of matches){
    const m4Audit=auditC1ParameterizedSourceMatchAgainstNativeM4({
     view,sourceId:match.sourceEdgeId,match,klass,
     nativeM4:nativeM4ById?.get(match.sourceEdgeId)
    });
    nativeM4Audits.push(m4Audit);
    if(m4Audit.nativeM4ClassBacked===true)
     nativeM4ClassBackedSourceIds.add(match.sourceEdgeId);
    parameterizedSourceIntervals.push({
     sourceEdgeId:match.sourceEdgeId,
     originalBRepSourceParameterRange:[...match.originalBRepSourceParameterRange],
     original3DCurveParameterRange:[...match.original3DCurveParameterRange],
     sourceProjected2DParameterRange:[...match.sourceProjected2DParameterRange],
     sourceProjected2DParameterRangeSorted:[...match.sourceProjected2DParameterRangeSorted],
     sourceProjected2DParameterRangeMatchesGeneratedOutputRange:
      match.sourceProjected2DParameterRangeMatchesGeneratedOutputRange,
     sourceProjected2DParameterEndpointResiduals:
      [...match.sourceProjected2DParameterEndpointResiduals],
     source3DParameterRange:[...match.source3DParameterRange],
     generated2DParameterRange:[...match.generated2DParameterRange],
     maximumProjectedPointResidualMm:match.maximumProjectedPointResidualMm,
     maximumParameterRoundTripResidual:match.maximumParameterRoundTripResidual,
     sampleCount:match.samples.length,
     nativePaperEndpointSampleWitness:match.nativePaperEndpointSampleWitness??null,
     reviewedOriginalM0PaperSampleAudit:m0SampleAudits.get(match.sourceEdgeId)??null,
     nativeM4ClassBacking:m4Audit
    });
   }
   // A view-collapsed pair can legitimately match the same generated 2D
   // curve in two different 3D source parameter maps. The class-specific
   // native source filter may narrow that set to the one source emitted in
   // this visible/hidden class. Preserve the geometric ambiguity; record
   // the narrowing separately instead of calling it a unique 3D identity.
   const filterConsistent=matches.length>0&&filterSources.size>0&&
    [...filterSources].every(id=>candidateIds.has(id))&&
    [...candidateIds].every(id=>paperCandidates.includes(id));
   const filterNarrows=filterConsistent&&filterSources.size<candidateIds.size;
   const nativeM4ClassBackedUniqueFilterSource=
    filterConsistent&&filterSources.size===1&&
    nativeM4ClassBackedSourceIds.has([...filterSources][0]);
   const m4Available=nativeM4Audits.some(x=>x.availability==='available');
   if(matches.length>0){
    if(!m4Available)result.counts.nativeM4ClassEvidenceUnavailableEdges++;
    else if(nativeM4ClassBackedUniqueFilterSource)
     result.counts.nativeM4ClassBackedUniqueFilterSourceEdges++;
    else result.counts.nativeM4ClassBackingUnprovenEdges++;
   }
   // A held reviewed M0 paper sample (including a one-ULP original
   // parameter overshoot) vetoes a 'proven' lineage diagnostic.
   const reviewedM0PaperHeld=[...m0SampleAudits.values()].some(x=>
    x!==null&&x.originalM0SourcePaperSamplesCorroborated!==true);
   const status=matches.length===0?'unmatched':
    !completeCandidateReview?'incomplete-original-hlr-source-curve-inventory-held':
    reviewedM0PaperHeld?'reviewed-original-m0-source-paper-held':
    !filterConsistent?'source-filter-or-paper-candidate-disagreement':
     matches.length===1?'unique-parameterized-source-lineage':
      filterNarrows?'ambiguous-parameterized-source-lineage-native-filter-narrowed':
       'ambiguous-parameterized-source-lineage';
   if(status==='unique-parameterized-source-lineage')unique++;
   else if(status==='ambiguous-parameterized-source-lineage'||
           status==='ambiguous-parameterized-source-lineage-native-filter-narrowed')
    ambiguous++;
   else if(status==='unmatched')unmatched++;
   else if(status==='incomplete-original-hlr-source-curve-inventory-held')heldInventory++;
   else disagreements++;
   return {
    wholeSolidHLREdgeOrdinal:ordinal,
    parameterizedSourceMatchCount:matches.length,
    completeOriginalSourceCurveInventory,
    completeAcceptedAndRejectedOriginalSourceCurveReview:completeCandidateReview,
    parameterizedOriginalSourceEdgeIds:[...candidateIds].sort(),
    nativeSourceFilterCandidateIds:[...filterSources].sort(),
    m0PaperCandidateIds:[...paperCandidates].sort(),
    nativeSourceFilterAndM0PaperCandidatesAgree:filterConsistent,
    reviewedOriginalM0PaperHeld:reviewedM0PaperHeld,
    nativeFilterNarrowsParameterizedCandidates:filterNarrows,
    parameterizedSourceIntervals,
    nativeM4ClassBackedSourceEdgeIds:[...nativeM4ClassBackedSourceIds].sort(),
    nativeM4ClassBackedUniqueFilterSource,
    nativeM4ClassEvidenceAvailable:m4Available,
    status,
    sameRunOriginalHLRCurveParameterLineageProven:
     status==='unique-parameterized-source-lineage',
    generated2DTopoDSHistoryProven:false,
    globalContinuousVisibilityProven:false,
    engineeringLineStyle:'undetermined',signedV5Action:false
   };
  });
  if(seenOrdinals.size!==item.global.length||
     rawUnique!==report.uniqueParameterizedSourceMatchCount||
     rawAmbiguous!==report.ambiguousParameterizedSourceMatchCount||
     rawUnmatched!==report.unmatchedGeneratedOutputEdgeCount||
     rawUnique+rawAmbiguous+rawUnmatched!==item.global.length)
   throw new RangeError('parameterized HLR source report counts do not reconcile');
  if(distinctParameterDomainBoundSourceIds.size>
      report.topoDSParameterDomainBoundSourceCurveCount)
   throw new RangeError('parameterized HLR source IDs exceed original BRep parameter-domain identity ledger');
  result.classes[klass]={sourceCurveCandidateCount:report.sourceCurveCandidateCount,
   completeOriginalSourceCurveInventory,
   reviewedOriginalSourceCurveCount:expected.size,
   heldForIncompleteOriginalCurveCandidateInventory:heldInventory,
   topoDSIdentityBoundSourceCurveCount:report.topoDSIdentityBoundSourceCurveCount,
   topoDSParameterDomainBoundSourceCurveCount:
    report.topoDSParameterDomainBoundSourceCurveCount,
   generatedOutputEdgeCount:report.generatedOutputEdgeCount,
   rawUniqueParameterizedSourceMatches:rawUnique,
   rawAmbiguousParameterizedSourceMatches:rawAmbiguous,
   rawUnmatchedGeneratedOutputEdges:rawUnmatched,
   uniqueParameterizedSourceLineage:unique,
   ambiguousParameterizedSourceLineage:ambiguous,
   nativeFilterNarrowedAmbiguousParameterizedSourceLineage:
    rows.filter(x=>x.status==='ambiguous-parameterized-source-lineage-native-filter-narrowed').length,
   unmatchedGeneratedOutputEdges:unmatched,
   sourceFilterOrPaperCandidateDisagreements:disagreements,
   nativeM4ClassBackedUniqueFilterSourceEdges:
    rows.filter(x=>x.nativeM4ClassBackedUniqueFilterSource).length,
   nativeM4ClassEvidenceUnavailableEdges:
    rows.filter(x=>x.parameterizedSourceMatchCount>0&&!x.nativeM4ClassEvidenceAvailable).length,
   nativeM4ClassBackingUnprovenEdges:
    rows.filter(x=>x.parameterizedSourceMatchCount>0&&x.nativeM4ClassEvidenceAvailable&&
     !x.nativeM4ClassBackedUniqueFilterSource).length,
   reviewedOriginalM0PaperHeldGeneratedEdges:
    rows.filter(x=>x.reviewedOriginalM0PaperHeld).length,
   rows};
  result.counts.uniqueParameterizedSourceLineage+=unique;
  result.counts.ambiguousParameterizedSourceLineage+=ambiguous;
  result.counts.nativeFilterNarrowedAmbiguousParameterizedSourceLineage+=
   rows.filter(x=>x.status==='ambiguous-parameterized-source-lineage-native-filter-narrowed').length;
  result.counts.unmatchedGeneratedOutputEdges+=unmatched;
  result.counts.heldForIncompleteOriginalCurveCandidateInventory+=heldInventory;
  result.counts.sourceFilterOrPaperCandidateDisagreements+=disagreements;
  result.counts.reviewedOriginalM0PaperHeldGeneratedEdges+=
   rows.filter(x=>x.reviewedOriginalM0PaperHeld).length;
 }
 return result;
}
function auditC1NativeScopedHLRSourceConsumer({geometry,cad}={}){
 if(typeof geometry?.id!=='string'||!geometry.id||
    !Array.isArray(geometry?.data?.edges)||!geometry.data.edges.length||
    !geometry.data.points||cad?.sourceGeometryId!==geometry.id||
    !Number.isSafeInteger(cad?.revision)||cad.revision<1)
  throw new TypeError('current C1 M0 geometry and real HLR revision required');
 const ids=geometry.data.edges.map(e=>{
  if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||e.some(id=>
      typeof id!=='string'||!Object.hasOwn(geometry.data.points,id)))
   throw new RangeError('invalid original C1 physical source');
  const [a,b]=e.map(id=>geometry.data.points[id]);
  if(![a,b].every(p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k])))||
     ['x','y','z'].every(k=>a[k]===b[k]))
   throw new RangeError('nonfinite or degenerate original C1 3D source edge');
  return geometry.id+'::'+[...e].sort().join('|');
 });
 const projectedOriginalBySource=new Map();
 for(let i=0;i<ids.length;i++){
  const [a,b]=geometry.data.edges[i].map(id=>geometry.data.points[id]);
  const projectedA=project(a),projectedB=project(b);
  projectedOriginalBySource.set(ids[i],Object.fromEntries(VIEWS.map(view=>
   [view,[projectedA[view],projectedB[view]]])));
 }
 const originalVertexIdsBySource=new Map(ids.map((id,i)=>
  [id,geometry.data.edges[i]]));
 const expected=new Set(ids);
 // Real source-scoped 3D geometry is a stronger, independent M4 input
 // than an inverse of rounded 2D generated HLR paper endpoints.
 const nativeM4Available=geometry.kind==='mesh'&&
  geometry.space==='model-3d'&&geometry.unit==='mm'&&
  cad.actualOCCTCurveTypeIndependentlyVerified===true&&
  Array.isArray(cad.originalBRepSourceEdges)&&
  cad.originalBRepSourceEdges.length===ids.length;
 const nativeCurveBySource=new Map();
 if(nativeM4Available){
  for(const curve of cad.originalBRepSourceEdges){
   if(!expected.has(curve?.sourceEdgeId)||
      nativeCurveBySource.has(curve.sourceEdgeId))
    throw new RangeError('unbound original native 3D curve in M4 source consumer');
   nativeCurveBySource.set(curve.sourceEdgeId,curve);
  }
 }
 if(expected.size!==ids.length)
  throw new RangeError('duplicate original M0 physical source edge');
 const valid=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
 // Scoped HLR paper aliases are only CANDIDATES, but even a candidate
 // must lie on its claimed ORIGINAL M0 edge in the SAME first-angle view.
 // This tolerance is exclusively for CAD paper rounding, never for exact
 // source parameter coverage, 3D depth, continuous visibility or V5.
 const onOriginalPaperEdge=(p,source,view)=>{
  const [a,b]=projectedOriginalBySource.get(source)[view];
  const dx=b.u-a.u,dy=b.v-a.v,length=Math.hypot(dx,dy);
  if(!valid(p)||!Number.isFinite(length)||!(length>0))return false;
  const along=(p.u-a.u)*(dx/length)+(p.v-a.v)*(dy/length);
  if(!Number.isFinite(along))return false;
  const bounded=Math.max(0,Math.min(length,along));
  // For a very short original M0 projection, an absolute 1e-6 mm
  // allowance could assign an entirely unrelated generated line to it.
  // Keep the CAD rounding cap but scale it to the actual source span.
  return Math.hypot(p.u-a.u-(dx/length)*bounded,
   p.v-a.v-(dy/length)*bounded)<=Math.min(1e-6,length*1e-6);
 };
 // Inverting a 2D HLR paper line yields only a CANDIDATE original 3D
 // parameter. Native TopoDS history, endpoint topology and opaque rays must
 // still be proven separately. Never clamp rounded endpoints to [0,1]:
 // that could silently erase a positive original-source parameter gap.
 const paperParameter=(p,source,view)=>{
  const [a,b]=projectedOriginalBySource.get(source)[view];
  const du=b.u-a.u,dv=b.v-a.v,useU=Math.abs(du)>=Math.abs(dv);
  const delta=useU?du:dv;
  if(!Number.isFinite(delta)||delta===0)return null;
  const t=((useU?p.u:p.v)-(useU?a.u:a.v))/delta;
  return Number.isFinite(t)&&t>=0&&t<=1?t:null;
 };
 const originalEndpointCandidate=(p,t,source,view)=>{
  const [a,b]=projectedOriginalBySource.get(source)[view];
  const [aId,bId]=originalVertexIdsBySource.get(source);
  if(t===0&&p.u===a.u&&p.v===a.v)return aId;
  if(t===1&&p.u===b.u&&p.v===b.v)return bId;
  return null;
 };
 const views={},counts={originalSourceEdgesPerView:ids.length,
  projectedSourcesWithFullPaperCandidateCoverage:0,
  projectedSourcesWithPositivePaperCandidateGaps:0,
  projectedSourcesWithExactBinary64PaperCandidateGaps:0,
  projectedSourcesWithFullExactBinary64PaperCandidateCoverage:0,
  projectedSourcesWithRoundedFalseFullPaperCandidateCoverage:0,
  projectedSourcesWithStrictTwoAxisFullPaperCoverage:0,
  projectedSourcesWithStrictTwoAxisPositivePaperResiduals:0,
  projectedSourcesWithFalseDominantAxisFullCoverageVetoed:0,
  sourceScopedGenerated2DSegmentsTransverselyOffOriginalSource:0,
  sourceScopedPaperEndpointsOffExactBinary64OriginalLine:0,
  projectedSourcesWithExactAffinePaperMismatch:0,
  projectedSourcesWithVisibleHiddenCandidateConflicts:0,
  positiveLengthVisibleHiddenCandidateConflictIntervalCount:0,
  projectedSourcesWithExactVisibleHiddenCandidateConflicts:0,
  exactPositiveLengthVisibleHiddenCandidateConflictIntervalCount:0,
  projectedSourcesWithRoundedMissedVisibleHiddenCandidateConflicts:0,
  sourceScopedPaperStrokesWithUnboundParameters:0,
  sourceScopedPaperEndpointsOutsideExactBinary64Domain:0,
  sourceScopedPaperPositiveIntervalsLostByRoundedInverse:0,
  nativeSourceScopedOutputEdges:0,nativeGeneratedIsSameMatches:0,
  paperOnlySourceScopedEdges:0,wholeSolidVisibleEdgesWithoutScopedSource:0,
  wholeSolidHiddenEdgesWithoutScopedSource:0,
  paperAliasedWholeSolidEdgesWithMultipleOriginalSources:0,
  nativeOriginal3DM4SourceViewCandidates:0,
  nativeOriginal3DM4ProjectedClassSegments:0,
  nativeOriginal3DM4PositiveIntervalsHeldForBinary64:0,
  nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D:0,
  nativeSourceScoped2DEdgesExactlyBackedBySame3DClass:0,
  nativeSourceScoped2DEdgesClassOrRoundingHeld:0,
  nativeSourceScoped2DEdgesWithOpposite3DClassOverlap:0,
  nativeSourceScoped2DEdgesWithFullSourceOneULPCompatibility:0,
  nativeSourceScoped2DEdgesPreciselyHeldButULPBounded:0,
  nativeSourceScoped2DEdgesBeyondOneULPOrWithoutWholeNativeClass:0,
  globalGeneratedHLREdgesWithUniqueParameterizedSourceLineage:0,
  globalGeneratedHLREdgesWithAmbiguousParameterizedSourceLineage:0,
  globalGeneratedHLREdgesWithNativeFilterNarrowedAmbiguousParameterizedLineage:0,
  globalGeneratedHLREdgesWithoutParameterizedSourceLineage:0,
  globalGeneratedHLREdgesWithoutParameterizedSourceReport:0,
  globalGeneratedHLREdgesWithParameterizedSourceDisagreement:0,
  globalGeneratedHLREdgesWithUniqueNativeM4ClassBackedSourceFilter:0,
  globalGeneratedHLREdgesWithoutNativeM4ClassEvidence:0,
  globalGeneratedHLREdgesWithUnprovenNativeM4ClassBacking:0};
 for(const view of VIEWS){
  const scoped=cad.nativeSourceScopedSharpOutputByView?.[view],
   ds=cad.nativeHLRSourceHistoryAPISurfaceByView?.[view]?.originalDataStructureIndex;
  if(scoped?.schema!=='draftai-c1-ocjs-real-original-topods-scoped-hlr/1'||
     scoped.sourceEdgeCount!==ids.length||
     scoped.originalTopoDSEdgeIndexCheckedAgainstActualHLREdgeMap!==true||
     scoped.allScopedOutputsReboundToWholeSolidPaper!==true||
     scoped.fullGlobalGeneratedEdgeToOriginalSourceHistoryProven!==false||
     scoped.fullContinuousVisibilityProven!==false||
     scoped.signedV5ActionCount!==0||
     ds?.availability!=='real-native-edge-map-inspected'||
     ds.everyOriginalBRepSourcePresentInHLRDataStructure!==true||
     !Array.isArray(ds.indexedOriginalSources)||
     ds.indexedOriginalSources.length!==ids.length||
     !Array.isArray(scoped.rows)||scoped.rows.length!==ids.length)
   throw new RangeError('missing complete real OCCT source-scoped HLR/EdgeMap evidence');
  // A real OCCT EdgeMap is a bijection: two distinct original TopoDS
  // source edges cannot own the same one-based native index.
  const indexed=new Map(),nativeSourceIndices=new Set();
  for(const x of ds.indexedOriginalSources){
   if(!expected.has(x.originalPhysicalSourceEdgeId)||
      !Number.isSafeInteger(x.hlrDataStructureOneBasedEdgeIndex)||
      x.hlrDataStructureOneBasedEdgeIndex<1||
      x.directlySameOriginalTopoDSInputEdge!==true||
      indexed.has(x.originalPhysicalSourceEdgeId)||
      nativeSourceIndices.has(x.hlrDataStructureOneBasedEdgeIndex))
    throw new RangeError('stale or duplicated real native HLR source index');
   indexed.set(x.originalPhysicalSourceEdgeId,x.hlrDataStructureOneBasedEdgeIndex);
   nativeSourceIndices.add(x.hlrDataStructureOneBasedEdgeIndex);
  }
  const classes={
   visible:{global:cad.views?.[view],field:'visible'},
   hidden:{global:cad.hiddenSharpViews?.[view],field:'hidden'}
  };
  for(const item of Object.values(classes)){
   if(!Array.isArray(item.global)||item.global.length>128)
    throw new RangeError('invalid whole-solid HLR stroke inventory');
   item.sources=Array.from({length:item.global.length},()=>new Set());
   // Direct native IsSame is an identity, not a paper-only alias. A single
   // generated TopoDS edge may not certify two original sources or appear
   // twice in one visibility class.
   item.nativeOwners=new Map();
  }
  const sourceRanges=new Map(ids.map(id=>[id,[]]));
  const exactPaperDiagnostics=new Map(ids.map(id=>[id,[]]));
  const exactAffineWitnesses=new Map(ids.map(id=>[id,[]]));
  const exactPaperSegments=new Map(ids.map(id=>[id,[]]));
  const exactClassSegments=Object.fromEntries(['visible','hidden'].map(k=>
   [k,new Map(ids.map(id=>[id,[]]))]));
  const classRanges=Object.fromEntries(['visible','hidden'].map(k=>
   [k,new Map(ids.map(id=>[id,[]]))]));
  for(const item of Object.values(classes))
   item.parameterCandidates=Array.from({length:item.global.length},()=>[]);
  let total=0,direct=0,seen=new Set();
  for(const row of scoped.rows){
   const source=row?.originalPhysicalSourceEdgeId;
   if(!expected.has(source)||seen.has(source)||
      row.hlrDataStructureOneBasedEdgeIndex!==indexed.get(source))
    throw new RangeError('source-scoped HLR row is not the current original TopoDS');
   seen.add(source);
   for(const [klass,item] of Object.entries(classes)){
    const witnesses=row[item.field];
    if(!Array.isArray(witnesses)||witnesses.length>128)
     throw new RangeError('invalid original-source-filtered HLR class');
    for(const w of witnesses){
     const paper=w?.globalPaperCandidateOrdinals,
      native=w?.globalDirectSameGeneratedTopoDSOrdinals;
     if(w.view!==view||
        w.hlrClass!==(klass==='visible'?'visible-sharp':'hidden-sharp')||
        w.originalPhysicalSourceEdgeId!==source||
        !valid(w.from)||!valid(w.to)||
        !Array.isArray(paper)||paper.length===0||
        !Array.isArray(native)||native.length>1||
        w.actualNativeScopedToGlobalGeneratedEdgeIsSameProven!==
         (native.length===1)||
        w.fullOriginalSourceParameterCoverageProven!==false||
        w.globalContinuousOcclusionProven!==false||
        w.engineeringLineStyle!=='undetermined'||w.signedV5Action!==false)
      throw new RangeError('invalid unsigned OCCT source-scoped HLR witness');
     // A native source-filtered HLR line cannot be attributed to an
     // arbitrary 3D source just because its label occurs in a whole-solid
     // candidate list. Reproject the original 3D BRep endpoints first.
     // A collapsed projection has no positive line to attribute.
     if(!(Math.hypot(w.to.u-w.from.u,w.to.v-w.from.v)>0)||
        !onOriginalPaperEdge(w.from,source,view)||
        !onOriginalPaperEdge(w.to,source,view))
      throw new RangeError('source-scoped HLR paper segment contradicts original M0 3D projection');
     const [sourceFrom,sourceTo]=projectedOriginalBySource.get(source)[view];
     const exactPaper=auditExactBinary64PaperParameterPair({
      sourceFrom,sourceTo,measuredFrom:w.from,measuredTo:w.to
     });
     // Cross-axis exact affine incidence is independent of inverse-t coverage.
     // OCCT may round transverse paper coordinates: diagnose, never snap.
     const affine=auditC1ExactBinary64PaperAffineWitness({
      sourceFrom,sourceTo,measuredFrom:w.from,measuredTo:w.to
     });
     exactAffineWitnesses.get(source).push(affine);
     counts.sourceScopedPaperEndpointsOffExactBinary64OriginalLine+=
      Number(!affine.nativeFromExactlyOnOriginalBinary64PaperLine)+
      Number(!affine.nativeToExactlyOnOriginalBinary64PaperLine);
     const exactBounds=exactPaper.nativeFromWithinExactBinary64OriginalParameterDomain&&
      exactPaper.nativeToWithinExactBinary64OriginalParameterDomain;
     if(!exactBounds)counts.sourceScopedPaperEndpointsOutsideExactBinary64Domain++;
     // Retain the RECEIVED binary64 paper endpoints independently of
     // Number-division candidate t. An interior t can round to 0 or 1,
     // falsely closing a positive original-source interval tail.
     if(exactBounds&&exactPaper.nativePaperSourceParameterPairHasExactPositiveSpan){
      const originalPaperSegment={from:{...w.from},to:{...w.to}};
      exactPaperSegments.get(source).push(originalPaperSegment);
      exactClassSegments[klass].get(source).push(originalPaperSegment);
     }
     const tFrom=paperParameter(w.from,source,view),
      tTo=paperParameter(w.to,source,view);
     if(exactPaper.nativePaperSourceParameterPairHasExactPositiveSpan&&
        tFrom!==null&&tTo!==null&&tFrom===tTo)
      counts.sourceScopedPaperPositiveIntervalsLostByRoundedInverse++;
     // A rounded t=0 or t=1 cannot override an exact one-ULP paper
     // overshoot. Likewise, two distinct dyadic positions whose rounded
     // inverse parameters coincide cannot certify a positive interval.
     const range=!exactBounds||
      !exactPaper.nativePaperSourceParameterPairHasExactPositiveSpan||
      tFrom===null||tTo===null||tFrom===tTo?null:
      [Math.min(tFrom,tTo),Math.max(tFrom,tTo)];
     exactPaperDiagnostics.get(source).push({
      hlrClass:w.hlrClass,measuredPaperFrom:{...w.from},
      measuredPaperTo:{...w.to},
      roundedPaperInverseParameters:[tFrom,tTo],
      paperDerivedCandidateIntervalRetained:range!==null,
      ...exactPaper,
      exactBinary64PaperAffineWitness:affine
     });
     if(range){
      sourceRanges.get(source).push(range);
      classRanges[klass].get(source).push(range);
     }else counts.sourceScopedPaperStrokesWithUnboundParameters++;
     const endpointCandidates=[
      originalEndpointCandidate(w.from,tFrom,source,view),
      originalEndpointCandidate(w.to,tTo,source,view)
     ];
     const ordinalSet=new Set();
     for(const ordinal of paper){
      if(!Number.isSafeInteger(ordinal)||ordinal<0||
         ordinal>=item.global.length||ordinalSet.has(ordinal))
       throw new RangeError('invalid or duplicate whole-solid HLR ordinal');
      ordinalSet.add(ordinal);
      const seg=item.global[ordinal];
      if(!valid(seg?.from)||!valid(seg?.to)||
         !Array.isArray(seg.projectedOriginalEdgeCandidates)||
         !seg.projectedOriginalEdgeCandidates.includes(source)||
         !nativeScopedPaperSegmentsSame(seg,w))
       throw new RangeError('native original source filter contradicts whole-solid HLR physical source');
      item.sources[ordinal].add(source);
      if(range)item.parameterCandidates[ordinal].push({
       originalPhysicalSourceEdgeId:source,
       paperDerivedOriginalSourceParameterCandidateRange:[...range],
       paperDerivedOriginal3DEndpointVertexCandidates:[...endpointCandidates],
       actualNativeTopoDSParameterHistoryProven:false,
       nativeOriginal3DEndpointTopologyProven:false
      });
     }
     for(const ordinal of native){
      if(!ordinalSet.has(ordinal))
       throw new RangeError('native generated IsSame is not a matching whole-solid HLR ordinal');
      if(item.nativeOwners.has(ordinal))
       throw new RangeError('duplicate native generated HLR ordinal identity claim');
      item.nativeOwners.set(ordinal,source);
     }
     total++;direct+=native.length;
    }
   }
  }
  if(seen.size!==expected.size||
     total!==scoped.nativeSourceScopedOutputEdgeCount||
     direct!==scoped.nativeScopedToWholeSolidGeneratedIsSameCount||
     total-direct!==scoped.paperOnlyScopedOutputEdgeCount)
   throw new RangeError('native source-scoped HLR output accounting mismatch');
  counts.nativeSourceScopedOutputEdges+=total;
  counts.nativeGeneratedIsSameMatches+=direct;
  counts.paperOnlySourceScopedEdges+=total-direct;
  // Project actual source-filtered native 3D curve parameters into M4
  // without inverting received rounded generated HLR paper coordinates.
  // Still held: generated-edge identity, co-projected depth, GB line type,
  // ConstructionIntent and the sole formal V5 player.
  const nativeOriginal3DM4Candidates=[];
  if(nativeM4Available){
   for(const source of scoped.rows){
    const [from,to]=projectedOriginalBySource.get(
     source.originalPhysicalSourceEdgeId)[view];
    if(from.u===to.u&&from.v===to.v){
     if((source.visible3D?.native3DGeneratedCurveIntervals.length??0)!==0||
        (source.hidden3D?.native3DGeneratedCurveIntervals.length??0)!==0)
      throw new RangeError('collapsed source cannot emit native 3D line in this view');
     continue;
    }
    const projected=projectC1Native3DSourceIntervalsToM4({
     geometry,revision:cad.revision,view,
     sourceEdgeId:source.originalPhysicalSourceEdgeId,
     originalCurve:nativeCurveBySource.get(source.originalPhysicalSourceEdgeId),
     scopedRow:source
    });
    nativeOriginal3DM4Candidates.push(projected);
    counts.nativeOriginal3DM4SourceViewCandidates++;
    counts.nativeOriginal3DM4ProjectedClassSegments+=projected.segments.length;
    counts.nativeOriginal3DM4PositiveIntervalsHeldForBinary64+=
     projected.M4ProjectedNative3DIntervalsHeldForBinary64Representation.length;
   }
  }
  // Same original TopoDS EdgeMap index, TWO independent source-filtered
  // native HLR result classes: generated 2D edge vs original native 3D
  // curve parameters. Check the exact dyadic source parameter support of
  // each received generated 2D segment, not a rounded 2D inverse t.
  // Direct native global-generated IsSame, M5 global visibility and V5
  // remain distinct unproven obligations.
  const nativeScoped2D3DClassBindings=[];
  if(nativeM4Available){
   const nativeM4ById=new Map(nativeOriginal3DM4Candidates.map(x=>
    [x.sourceEdgeId,x]));
   if(nativeM4ById.size!==nativeOriginal3DM4Candidates.length)
    throw new RangeError('duplicate original native 3D M4 source for 2D class binding');
   for(const source of scoped.rows){
    const originalId=source.originalPhysicalSourceEdgeId,
     nativeM4=nativeM4ById.get(originalId);
    if(!nativeM4)continue; // source collapses in this first-angle view
    const [sourceProjectedFrom,sourceProjectedTo]=
     projectedOriginalBySource.get(originalId)[view];
    const joined=auditC1RealNativeScoped2D3DClassBinding({
     view,sourceEdgeId:originalId,sourceProjectedFrom,sourceProjectedTo,
     scoped2DVisible:source.visible,scoped2DHidden:source.hidden,
     nativeOriginal3DM4:nativeM4
    });
    nativeScoped2D3DClassBindings.push(joined);
    counts.nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D+=
     joined.counts.scoped2DGeneratedEdgesChecked;
    counts.nativeSourceScoped2DEdgesExactlyBackedBySame3DClass+=
     joined.counts.exactSameClassNative3DBackedEdges;
    counts.nativeSourceScoped2DEdgesClassOrRoundingHeld+=
     joined.counts.paperDriftOrClassCoverageHeld;
    counts.nativeSourceScoped2DEdgesWithOpposite3DClassOverlap+=
     joined.counts.exactOppositeClassPositiveOverlapEdges;
    counts.nativeSourceScoped2DEdgesWithFullSourceOneULPCompatibility+=
     joined.counts.originalFullEdgeOneULPPaperEnvelopeCompatible;
    counts.nativeSourceScoped2DEdgesPreciselyHeldButULPBounded+=
     joined.counts.roundedPaperRepresentationCompatibleButNotExactCertified;
    counts.nativeSourceScoped2DEdgesBeyondOneULPOrWithoutWholeNativeClass+=
     joined.counts.paperDriftOrClassCoverageHeld-
      joined.counts.roundedPaperRepresentationCompatibleButNotExactCertified;
   }
   if(nativeScoped2D3DClassBindings.length!==
      nativeOriginal3DM4Candidates.length||
      counts.nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D!==
      counts.nativeSourceScoped2DEdgesExactlyBackedBySame3DClass+
      counts.nativeSourceScoped2DEdgesClassOrRoundingHeld)
    throw new RangeError('native source-scoped 2D/3D HLR class inventory incomplete');
  }
  const nativeM4ByIdForParameterizedLineage=new Map(nativeOriginal3DM4Candidates.map(x=>
   [x.sourceEdgeId,x]));
  const parameterizedGlobalHLRSourceLineage=
   auditC1ParameterizedGlobalHLRSourceLineage({
    view,classes,scoped,expected,nativeM4ById:nativeM4ByIdForParameterizedLineage,
    originalModelEndpointsById:new Map(ids.map((id,i)=>
     [id,geometry.data.edges[i].map(vertex=>geometry.data.points[vertex])]))
   });
  counts.globalGeneratedHLREdgesWithUniqueParameterizedSourceLineage+=
   parameterizedGlobalHLRSourceLineage.counts.uniqueParameterizedSourceLineage;
  counts.globalGeneratedHLREdgesWithAmbiguousParameterizedSourceLineage+=
   parameterizedGlobalHLRSourceLineage.counts.ambiguousParameterizedSourceLineage;
  counts.globalGeneratedHLREdgesWithNativeFilterNarrowedAmbiguousParameterizedLineage+=
   parameterizedGlobalHLRSourceLineage.counts.nativeFilterNarrowedAmbiguousParameterizedSourceLineage;
  counts.globalGeneratedHLREdgesWithoutParameterizedSourceReport+=
   parameterizedGlobalHLRSourceLineage.counts.unavailableGeneratedOutputEdges;
  counts.globalGeneratedHLREdgesWithoutParameterizedSourceLineage+=
   parameterizedGlobalHLRSourceLineage.counts.unmatchedGeneratedOutputEdges+
   parameterizedGlobalHLRSourceLineage.counts.unavailableGeneratedOutputEdges;
  counts.globalGeneratedHLREdgesWithParameterizedSourceDisagreement+=
   parameterizedGlobalHLRSourceLineage.counts.sourceFilterOrPaperCandidateDisagreements;
  counts.globalGeneratedHLREdgesWithUniqueNativeM4ClassBackedSourceFilter+=
   parameterizedGlobalHLRSourceLineage.counts.nativeM4ClassBackedUniqueFilterSourceEdges;
  counts.globalGeneratedHLREdgesWithoutNativeM4ClassEvidence+=
   parameterizedGlobalHLRSourceLineage.counts.nativeM4ClassEvidenceUnavailableEdges;
  counts.globalGeneratedHLREdgesWithUnprovenNativeM4ClassBacking+=
   parameterizedGlobalHLRSourceLineage.counts.nativeM4ClassBackingUnprovenEdges;
  views[view]={nativeOriginal3DM4Candidates,
   nativeScoped2D3DClassBindings,parameterizedGlobalHLRSourceLineage};
  for(const [klass,item] of Object.entries(classes)){
   const rows=item.sources.map((sources,ordinal)=>({
    wholeSolidHLREdgeOrdinal:ordinal,
    original3DSourceCandidatesFromNativeFilter:[...sources].sort(),
    paperDerivedOriginalSourceParameterCandidates:
     item.parameterCandidates[ordinal].sort((a,b)=>
      a.originalPhysicalSourceEdgeId.localeCompare(b.originalPhysicalSourceEdgeId)),
    originalTopoDSHistoryProven:false,
    originalSourceParameterCoverageProven:false,
    continuousFrontRayProven:false,
    engineeringLineStyle:'undetermined',signedV5Action:false
   }));
   const missing=rows.filter(x=>
    !x.original3DSourceCandidatesFromNativeFilter.length).length;
   counts[klass==='visible'?'wholeSolidVisibleEdgesWithoutScopedSource':
    'wholeSolidHiddenEdgesWithoutScopedSource']+=missing;
   counts.paperAliasedWholeSolidEdgesWithMultipleOriginalSources+=
    rows.filter(x=>x.original3DSourceCandidatesFromNativeFilter.length>1).length;
   views[view][klass]=rows;
  }
  // Union the REAL source-filtered HLR outputs, but label all intervals
  // PAPER-DERIVED CANDIDATES. This reports exact binary64 gaps, including
  // one-ULP holes, without certifying original TopoDS parameter history.
  views[view].sourceParameterCandidates=ids.map(source=>{
   const [a,b]=projectedOriginalBySource.get(source)[view];
   const collapsed=!(Math.hypot(b.u-a.u,b.v-a.v)>0);
   const ranges=sourceRanges.get(source);
    const affineWitnesses=exactAffineWitnesses.get(source);
    const exactAffineCollinearity=affineWitnesses.length>0&&
     affineWitnesses.every(x=>x.bothNativeEndpointsExactlyOnOriginalBinary64PaperLine);
    if(!collapsed&&affineWitnesses.length>0&&!exactAffineCollinearity)
     counts.projectedSourcesWithExactAffinePaperMismatch++;
   const coverage=collapsed?null:
    exactCandidateIntervalCoverage([0,1],ranges);
   const exactPaperCoverage=collapsed?null:
    auditExactBinary64PaperCandidateCoverage({
     sourceFrom:a,sourceTo:b,segments:exactPaperSegments.get(source)
    });
   // Strict original physical M0 line collinearity in BOTH received native
   // coordinates, never just a dominant-axis inverse-t union. An actual
   // generated 2D OCCT TopoDS causal source claim is still NOT proven.
   const twoAxisCoverage=collapsed?null:
    auditC1ExactTwoAxisGeneratedPaperCoverage({
     sourceFrom:a,sourceTo:b,segments:exactPaperSegments.get(source)
    });
   if(twoAxisCoverage){
    if(twoAxisCoverage.generatedPaperSegmentCount!==
       exactPaperSegments.get(source).length||
       twoAxisCoverage.unsafeDominantAxisOnlyCoverage.
        exactBinary64PaperCandidateCoverageComplete!==
        exactPaperCoverage.exactBinary64PaperCandidateCoverageComplete)
     throw new RangeError('native two-axis original paper and exact one-axis union disagree');
    counts.projectedSourcesWithStrictTwoAxisFullPaperCoverage+=
     Number(twoAxisCoverage.strictReceivedTwoAxisPaperCoverageComplete);
    counts.projectedSourcesWithStrictTwoAxisPositivePaperResiduals+=
     Number(twoAxisCoverage.positiveLengthTwoAxisPaperResidualsStillPresent);
    counts.projectedSourcesWithFalseDominantAxisFullCoverageVetoed+=
     Number(twoAxisCoverage.falseDominantAxisFullCoverageVetoed);
    counts.sourceScopedGenerated2DSegmentsTransverselyOffOriginalSource+=
     twoAxisCoverage.transverseDisplacedGeneratedSegments;
   }
   if(exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete)
    counts.projectedSourcesWithFullExactBinary64PaperCandidateCoverage++;
   else if(exactPaperCoverage)
    counts.projectedSourcesWithExactBinary64PaperCandidateGaps++;
   if(coverage?.entireOriginalParameterIntervalCovered===true&&
      exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete===false)
    counts.projectedSourcesWithRoundedFalseFullPaperCandidateCoverage++;
   const classOverlap=collapsed?null:exactCandidateVisibilityClassOverlap(
    classRanges.visible.get(source),classRanges.hidden.get(source)
   );
   const exactClassOverlap=collapsed?null:
    auditExactBinary64PaperVisibilityConflict({
     sourceFrom:a,sourceTo:b,
     visibleSegments:exactClassSegments.visible.get(source),
     hiddenSegments:exactClassSegments.hidden.get(source)
    });
   if(exactClassOverlap?.hasExactPositiveLengthVisibleHiddenPaperClassConflict){
    counts.projectedSourcesWithExactVisibleHiddenCandidateConflicts++;
    counts.exactPositiveLengthVisibleHiddenCandidateConflictIntervalCount+=
     exactClassOverlap.exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals.length;
    if(!classOverlap.hasPositiveLengthVisibleHiddenClassConflict)
     counts.projectedSourcesWithRoundedMissedVisibleHiddenCandidateConflicts++;
   }
   if(classOverlap?.hasPositiveLengthVisibleHiddenClassConflict){
    counts.projectedSourcesWithVisibleHiddenCandidateConflicts++;
    counts.positiveLengthVisibleHiddenCandidateConflictIntervalCount+=
     classOverlap.paperDerivedPositiveLengthVisibleHiddenConflictIntervals.length;
   }
   if(coverage?.entireOriginalParameterIntervalCovered)
    counts.projectedSourcesWithFullPaperCandidateCoverage++;
   else if(coverage)
    counts.projectedSourcesWithPositivePaperCandidateGaps++;
   return {
    originalPhysicalSourceEdgeId:source,
    originalProjectedEdgeCollapsed:collapsed,
    paperDerivedOriginalSourceParameterCandidateIntervals:
     ranges.map(range=>[...range]),
    exactBinary64PaperParameterDiagnostics:
     exactPaperDiagnostics.get(source),
     exactBinary64PaperAffineWitnesses:affineWitnesses,
     allReceivedNativePaperEndpointsExactlyCollinearWithOriginalSource:
      exactAffineCollinearity,
    // These exact rational gaps are PAPER candidate diagnostics only.
    // Never promote their absence to TopoDS history or V5 authority.
    exactBinary64PaperCandidateCoverage:exactPaperCoverage,
    exactTwoAxisQualifiedNativePaperCoverage:twoAxisCoverage,
    strictTwoAxisPaperOnlyCoverageComplete:
     twoAxisCoverage?.strictReceivedTwoAxisPaperCoverageComplete===true,
    originalM0SourcePaperTransverseDriftNeverClosesGap:true,
    exactBinary64PaperVisibleHiddenClassOverlap:exactClassOverlap,
    paperDerivedVisibleCandidateParameterUnion:
     classOverlap?.paperDerivedVisibleOriginalSourceParameterUnion??null,
    paperDerivedHiddenCandidateParameterUnion:
     classOverlap?.paperDerivedHiddenOriginalSourceParameterUnion??null,
    paperDerivedPositiveLengthVisibleHiddenConflictIntervals:
     classOverlap?.paperDerivedPositiveLengthVisibleHiddenConflictIntervals??null,
    paperDerivedPositiveLengthVisibleHiddenConflictDetected:
     classOverlap?.hasPositiveLengthVisibleHiddenClassConflict??false,
    paperDerivedPositiveLengthUncoveredCandidateIntervals:
     coverage?.positiveLengthUncoveredIntervals??null,
    // Claim of 'entire original paper candidate' must now survive BOTH
    // received coordinates, not merely a rounded or one-axis interval.
    entireOriginalSourcePaperCandidateIntervalCovered:
     coverage?.entireOriginalParameterIntervalCovered===true&&
     exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete===true&&
     twoAxisCoverage?.strictReceivedTwoAxisPaperCoverageComplete===true,
    // A received paper segment can cover t=[0,1] yet drift transversely.
     // This stricter result remains paper-only, never TopoDS/M5/V5 proof.
     fullOriginalPaperCandidateCoverageWithExactAffineCollinearity:
      coverage?.entireOriginalParameterIntervalCovered===true&&
      exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete===true&&
      exactAffineCollinearity&&
      twoAxisCoverage?.strictReceivedTwoAxisPaperCoverageComplete===true,
     fullOriginalPaperCandidateCoverageWithoutClassConflict:
     coverage?.entireOriginalParameterIntervalCovered===true&&
     exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete===true&&
     twoAxisCoverage?.strictReceivedTwoAxisPaperCoverageComplete===true&&
     classOverlap?.hasPositiveLengthVisibleHiddenClassConflict===false&&
     exactClassOverlap?.hasExactPositiveLengthVisibleHiddenPaperClassConflict===false,
    actualOriginalTopoDSParameterCoverageCertified:false,
    nativeOriginal3DEndpointTopologyProven:false,
    continuousOcclusionCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false
   };
  });
 }
 // Join all actual WHOLE-SOLID generated 2D HLR edge ordinals against
 // original TopoDS edge-filtered HLR, with strict original native 3D
 // same-class backing. A unique source-filtered candidate is evidence,
 // never a fabricated original/generated TShape or official line style.
 const globalNativeHLRSourceScopeRebinding=nativeM4Available?
  auditC1WholeSolidNativeHLRSourceScopeRebinding({cad,views}):null;
 if(nativeM4Available&&globalNativeHLRSourceScopeRebinding.counts.
    wholeSolidNativeHLREdges!==
      VIEWS.reduce((n,v)=>n+cad.views[v].length+
       cad.hiddenSharpViews[v].length,0))
  throw new RangeError('whole-solid OCCT generated 2D HLR edge inventory was not fully rebound');
 const globalNativeHLROriginal3DEndpointLedger=nativeM4Available?
  auditC1GlobalNativeHLROriginalM0EndpointLinks({
   geometry,cad,globalRebinding:globalNativeHLRSourceScopeRebinding,
   sourceM4Views:views
  }):null;
 if(nativeM4Available&&
    globalNativeHLROriginal3DEndpointLedger.counts.globalGeneratedHLREdgesChecked!==
     globalNativeHLRSourceScopeRebinding.counts.wholeSolidNativeHLREdges)
  throw new RangeError('global original OCCT endpoint ledger lost native HLR edge');
 return frozen({schema:'draftai-c1-real-source-scoped-hlr-m5-consumer/1',
  sourceGeometryId:geometry.id,revision:cad.revision,unit:'mm',
  views,counts,globalNativeHLRSourceScopeRebinding,
  globalNativeHLROriginal3DEndpointLedger,
  actualOriginalTopoDSSourceFilteredHLRConsumed:true,
  nativeOriginal3DToM4ProjectionConsumerAvailable:nativeM4Available,
  nativeOriginal3DProjectionIsNotGenerated2DSourceHistory:true,
  generatedToOriginalTopoDSFullHistoryCertified:false,
  paperDerivedVisibleHiddenSourceConflictsDetected:
   counts.projectedSourcesWithVisibleHiddenCandidateConflicts>0||
   counts.projectedSourcesWithExactVisibleHiddenCandidateConflicts>0,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,signedV5ActionCount:0});
}
module.exports={
 auditC1NativeScopedHLRSourceConsumer,
 auditC1ParameterizedSourceMatchAgainstNativeM4,
 auditC1OriginalM0ProjectedSourceSamples
};
