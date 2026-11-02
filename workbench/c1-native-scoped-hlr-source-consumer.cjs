'use strict';
/**
 * Consume REAL source-scoped HLR extraction (original TopoDS input edge
 * filtered through OCCT) alongside the whole-solid V/H/W HLR result.
 * No guessed paper alias may be promoted to original TopoDS history:
 * native scoped IsSame is tracked separately, and original 3D source
 * parameter intervals and continuous M5 rays remain independent gates.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {auditOriginalEdgeStatusVsSourceScoped3DSharp}=
 require('../engines/spatial/hlr/c1-ocjs-edgestatus-abi.cjs');
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
 * Compare the reviewed ORIGINAL M0 whole physical-edge paper endpoints to
 * actual native GENERATED 2D HLR curve endpoints. Require exactly the same
 * forward native Parameter2d domain; never use the rounded Parameter3d
 * inverse to invent an original source interval. An unsigned witness only.
 */
function auditC1OriginalM0FullForwardHLRPaperEndpoints({
 originalProjectedEndpoints,sourceProjected2DParameterRangeSorted,
 generated2DParameterRange,generatedHLRCurveSamples
}={}){
 const point=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
 const range=r=>Array.isArray(r)&&r.length===2&&r.every(Number.isFinite)&&r[1]>r[0];
 if(!Array.isArray(originalProjectedEndpoints)||
    originalProjectedEndpoints.length!==2||
    !originalProjectedEndpoints.every(point)||
    !range(sourceProjected2DParameterRangeSorted)||
    !range(generated2DParameterRange))
  throw new TypeError('finite original M0 paper and native parameter ranges required');
 const full=sourceProjected2DParameterRangeSorted.every(
  (v,i)=>v===generated2DParameterRange[i]);
 const samples=Array.isArray(generatedHLRCurveSamples)&&
  generatedHLRCurveSamples.length===5&&generatedHLRCurveSamples.every(point);
 if(generatedHLRCurveSamples!==undefined&&!samples)
  throw new RangeError('invalid original native HLR sample inventory');
 const same=(a,b)=>a.u===b.u&&a.v===b.v;
 const a=originalProjectedEndpoints,b=generatedHLRCurveSamples;
 const exact=Boolean(full&&samples&&(
  same(a[0],b[0])&&same(a[1],b[4])||
  same(a[0],b[4])&&same(a[1],b[0])));
 return Object.freeze({
  originalForward2DParameterDomainFullyMatchesGenerated:full,
  actualNativeGeneratedCurveSamplesPresent:samples,
  exactBinary64OriginalM0WholeSourceProjectedEndpointAgreement:exact,
  rawNativeParameter3dInverseNeverClamped:true,
  originalToGeneratedTopoDSHistoryCertified:false,
  continuousAllFaceVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
/**
 * Compare one generated-edge source interval with the independently
 * source-filtered native 3D M4 visible/hidden parameter partition.
 * The result is class backing, never generated-edge TopoDS ancestry.
 */
function positivePairwiseIntervalOverlaps(intervals){
 const overlaps=[];
 for(let i=0;i<intervals.length;i++){
  const a=intervals[i];
  if(!Array.isArray(a)||a.length!==2||!a.every(Number.isFinite)||
     a[0]<0||a[1]>1||!(a[1]>a[0]))
   throw new RangeError('invalid native outline M0 interval');
  for(let j=i+1;j<intervals.length;j++){
   const b=intervals[j];
   if(!Array.isArray(b)||b.length!==2||!b.every(Number.isFinite)||
      b[0]<0||b[1]>1||!(b[1]>b[0]))
    throw new RangeError('invalid native outline M0 interval');
   const from=Math.max(a[0],b[0]),to=Math.min(a[1],b[1]);
   if(to>from)overlaps.push([from,to]);
  }
 }
 overlaps.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const merged=[];
 for(const interval of overlaps){
  const last=merged.at(-1);
  if(last&&interval[0]<=last[1])last[1]=Math.max(last[1],interval[1]);
  else merged.push([...interval]);
 }
 return merged;
}
/**
 * Recheck native OCCT ORIGINAL 3D curve parameters before a generated 2D
 * source candidate can claim outline-class backing. M4 [0,1] normalization
 * may round a strictly positive native one-ULP gap to the same Number on
 * both sides. No epsilon, snapped t or paper geometry may erase that gap.
 * This remains a necessary class check, never global HLR ancestry or M5.
 */
function auditNativeOriginalOutlineClassInterval(query,same,opposite,held){
 if(!Array.isArray(query)||query.length!==2||
    !query.every(Number.isFinite)||!(query[1]>query[0]))
  throw new RangeError('invalid original native outline query interval');
 const intersect=intervals=>{
  if(!Array.isArray(intervals)||intervals.length>512)
   throw new RangeError('invalid original native outline interval inventory');
  return intervals.map(interval=>{
   if(!Array.isArray(interval)||interval.length!==2||
      !interval.every(Number.isFinite)||!(interval[1]>interval[0]))
    throw new RangeError('invalid original native outline parameter interval');
   return [Math.max(query[0],interval[0]),Math.min(query[1],interval[1])];
  }).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 };
 const parts=intersect(same),oppositeParts=intersect(opposite),
  heldParts=intersect(held),gaps=[],overlaps=[];
 let reach=query[0];
 for(const [a,b] of parts){
  if(a>reach)gaps.push([reach,a]);
  if(a<reach&&b>a)overlaps.push([a,Math.min(b,reach)]);
  reach=Math.max(reach,b);
 }
 if(reach<query[1])gaps.push([reach,query[1]]);
 return {
  nativeOriginalParameterPositiveGaps:gaps,
  nativeOriginalSameClassPositiveOverlaps:overlaps,
  nativeOriginalOppositeClassPositiveOverlaps:oppositeParts,
  nativeOriginalHeldBinary64PositiveOverlaps:heldParts,
  nativeOriginalClassBackedWithoutNormalization:
   gaps.length===0&&overlaps.length===0&&
   oppositeParts.length===0&&heldParts.length===0
 };
}
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
    'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2'||
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
 // The inverse Parameter3d interval is a separate native OCCT witness.
 // Exact forward Parameter2d endpoint agreement does NOT prove that an
 // out-of-domain native 3D parameter was inside the physical BRep edge.
 // Even a one-ULP overshoot remains a positive original-parameter defect:
 // preserve it and hold this generated edge instead of silently rebinding
 // the entire interval to [first,last]. No epsilon, clamping, or paper
 // coincidence may manufacture original-source coverage or M5 authority.
 if(!exactDomainContainment)
  return {
   availability:'available',sourceEdgeId:sourceId,
   original3DSourceCurveDirection:direction,
   generated2DHLRClass:sameClass,
   originalM0UnitParameterRange:inverseNormalizedRange,
   inverseMappedOriginalM0UnitParameterRange:inverseNormalizedRange,
   source3DParameterRangeFromInverse:[...sourceRange],
   sourceParameterDomainContainment:'within-tolerance-but-outside',
   sourceProjected2DForwardEndpointAgreementOnly:forwardEndpointBound,
   sourceDomainEndpointForwardMapProof:false,
   nativeM4SameClassCoverageComplete:false,
   nativeM4SameClassCoverageGaps:null,
   nativeM4OppositeClassPositiveOverlap:null,
   nativeM4OppositeClassOverlaps:null,
   nativeM4ClassBacked:false,
   reason:'source-parameter-interval-outside-original-M0-unit-domain-no-clamp'
  };
 const normalizedRange=inverseNormalizedRange;
 if(!normalizedRange.every(Number.isFinite)||
    normalizedRange[0]<0||normalizedRange[1]>1||
    !(normalizedRange[1]>normalizedRange[0]))
  throw new RangeError('exact source interval cannot normalize to original M0 [0,1]');
 const effectiveSourceRange=sourceRange;
 const sameRanges=nativeM4.segments.filter(x=>x?.native3DHLRClass===sameClass)
  .map(x=>x.originalM0UnitParameterRange);
 const oppositeRanges=nativeM4.segments.filter(x=>x?.native3DHLRClass===oppositeClass)
  .map(x=>x.originalM0UnitParameterRange);
 const sameCoverage=exactCandidateIntervalCoverage(normalizedRange,sameRanges);
 // Union coverage is insufficient when the SAME native class assigns a
 // positive original-source subspan twice. A generated HLR edge cannot
 // claim unique original 3D class backing from overlapping partitions.
 const sameClassOverlaps=positivePairwiseIntervalOverlaps(sameRanges);
 // A positive native curve interval may collapse under binary64 M4
 // normalization. Recheck held ORIGINAL BRep parameters, not paper t.
 const heldNative=nativeM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation??[];
 if(!Array.isArray(heldNative)||heldNative.length>512)
  throw new RangeError('invalid held native M4 interval inventory');
 const queryNative=[...effectiveSourceRange].sort((a,b)=>a-b);
 const heldNativeIntersectsQuery=heldNative.some(item=>{
  const r=item?.originalNative3DParameterRange;
  if(!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||
     !(r[1]>r[0]))
   throw new RangeError('invalid held original BRep source interval');
  return Math.min(r[1],queryNative[1])>Math.max(r[0],queryNative[0]);
 });
 // M0-normalized union coverage can conceal a positive ORIGINAL BRep gap
 // when distinct native curve parameters round to the same binary64 M0 t.
 // Recheck the actual same-run Sharp parameter domain, not just paper t.
 const sharpWithRaw=nativeM4.segments.filter(x=>
  x&&Object.prototype.hasOwnProperty.call(x,'originalNative3DParameterRange'));
 if(sharpWithRaw.length>0&&sharpWithRaw.length!==nativeM4.segments.length)
  throw new RangeError('partial original native Sharp parameter evidence cannot back M4');
 const nativeSharpOriginalParameterEvidenceAvailable=sharpWithRaw.length>0;
 let nativeSharpOriginalParameterCoverage=null;
 if(nativeSharpOriginalParameterEvidenceAvailable){
  for(const segment of sharpWithRaw){
   const p=segment.originalNative3DParameterRange;
   if(segment.view!==view||segment.sourceEdgeId!==sourceId||
      !['visible-sharp','hidden-sharp'].includes(segment.native3DHLRClass)||
      segment.derivedFromOriginalNative3DCurveNotGeneratedHLRPaper!==true||
      segment.generated2DHLREdgeTopologyProven!==false||
      segment.completeGlobalCoProjectedVisibilityCertified!==false||
      segment.engineeringLineStyle!=='undetermined'||segment.signedV5Action!==false||
      !Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||
      !(p[1]>p[0])||p[0]<domain[0]||p[1]>domain[1])
    throw new RangeError('invalid original native Sharp source or unsigned interval evidence');
   const expected=[normalize(p[0]),normalize(p[1])].sort((a,b)=>a-b);
   const actual=segment.originalM0UnitParameterRange;
   if(!Array.isArray(actual)||actual.length!==2||
      expected[0]!==actual[0]||expected[1]!==actual[1])
    throw new RangeError('original native Sharp parameter interval does not reproduce M0 interval');
  }
  nativeSharpOriginalParameterCoverage=auditNativeOriginalOutlineClassInterval(
   [...effectiveSourceRange].sort((a,b)=>a-b),
   sharpWithRaw.filter(x=>x.native3DHLRClass===sameClass)
    .map(x=>x.originalNative3DParameterRange),
   sharpWithRaw.filter(x=>x.native3DHLRClass===oppositeClass)
    .map(x=>x.originalNative3DParameterRange),
   heldNative.map(x=>x.originalNative3DParameterRange)
  );
 }
 const nativePartitionNotKnownFalse=
  nativeM4.native3DSourceParameterPartitionCompleteExactlyOnce!==false&&
  nativeM4.M4OriginalUnitIntervalCandidateCoverageComplete!==false;
 const nativeSharpOriginalParameterClassBacked=
  nativeSharpOriginalParameterEvidenceAvailable&&
  nativeSharpOriginalParameterCoverage.nativeOriginalClassBackedWithoutNormalization&&
  nativeM4.native3DSourceParameterPartitionCompleteExactlyOnce===true&&
  nativeM4.M4OriginalUnitIntervalCandidateCoverageComplete===true;
 const oppositeCoverage=exactCandidateIntervalCoverage(normalizedRange,oppositeRanges);
 const oppositeOverlaps=oppositeCoverage.positiveLengthCoveredIntervals;
 // A real native 3D outline interval cannot disappear merely because an
 // availability flag was omitted/false. Legacy producers may omit BOTH
 // outline inventories; a partially supplied or contradictory ledger is
 // invalid, not an empty proof. This matters for W-collapsed paper strokes.
 const outlineFlag=nativeM4.native3DOutlineEvidenceAvailable,
  outlineInventory=nativeM4.native3DOutlineSegments,
  outlineHeld=nativeM4.M4ProjectedNative3DOutlineIntervalsHeldForBinary64Representation;
 if(outlineFlag!==undefined&&typeof outlineFlag!=='boolean')
  throw new RangeError('invalid native outline evidence availability flag');
 if(outlineInventory!==undefined&&!Array.isArray(outlineInventory))
  throw new RangeError('invalid native outline source interval inventory');
 if(outlineHeld!==undefined&&!Array.isArray(outlineHeld))
  throw new RangeError('invalid held native outline interval inventory');
 if(outlineFlag===true&&!Array.isArray(outlineInventory))
  throw new RangeError('available native outline evidence requires an interval inventory');
 if(outlineFlag!==true&&
    ((Array.isArray(outlineInventory)&&outlineInventory.length>0)||
     (Array.isArray(outlineHeld)&&outlineHeld.length>0)))
  throw new RangeError('nonempty native outline source evidence cannot be marked unavailable');
 const nativeOutlineEvidenceAvailable=outlineFlag===true,
  outlineSegments=nativeOutlineEvidenceAvailable?outlineInventory:[];
 const sameOutlineClass=klass==='visible'?'visible-outline':'hidden-outline',
  oppositeOutlineClass=klass==='visible'?'hidden-outline':'visible-outline';
 const outlineClassesValid=!nativeOutlineEvidenceAvailable||outlineSegments.every(x=>
  x&&x.view===view&&x.sourceEdgeId===sourceId&&
  ['visible-outline','hidden-outline'].includes(x.native3DHLRClass)&&
  x.derivedFromOriginalNative3DOutlineNotGeneratedHLRPaper===true&&
  x.generated2DHLREdgeTopologyProven===false&&
  x.completeGlobalCoProjectedVisibilityCertified===false&&
  x.engineeringLineStyle==='undetermined'&&x.signedV5Action===false&&
  Array.isArray(x.originalNative3DParameterRange)&&
  x.originalNative3DParameterRange.length===2&&
  x.originalNative3DParameterRange.every(Number.isFinite)&&
  x.originalNative3DParameterRange[1]>x.originalNative3DParameterRange[0]);
 if(!outlineClassesValid)
  throw new RangeError('native outline segment identity or unsigned proof boundary is invalid');
 // Independently reject forged paper drawability on the new native M4
 // producer. A collapsed original 3D outline is provenance, not a stroke.
 const heldOutline=nativeM4.M4ProjectedNative3DOutlineIntervalsHeldForBinary64Representation??[];
 if(!Array.isArray(heldOutline)||heldOutline.length>512)
  throw new RangeError('invalid held native outline interval inventory');
 for(const segment of outlineSegments){
  if(segment.paperDrawableCandidate===undefined)continue; // older unsigned diagnostic
  const a=segment.fromPaper,b=segment.toPaper;
  const m=segment.fromModelMm,n=segment.toModelMm;
  if(typeof segment.paperDrawableCandidate!=='boolean'||
     !a||!b||!m||!n||
     ![a.u,a.v,b.u,b.v,m.x,m.y,m.z,n.x,n.y,n.z].every(Number.isFinite)||
     segment.paperDrawableCandidate===(a.u===b.u&&a.v===b.v))
   throw new RangeError('native outline original 3D/paper drawable witness is inconsistent');
  if(!segment.paperDrawableCandidate&&!heldOutline.some(x=>
     x?.native3DHLRClass===segment.native3DHLRClass&&
     Array.isArray(x.originalNative3DParameterRange)&&
     x.originalNative3DParameterRange.length===2&&
     x.originalNative3DParameterRange.every((v,i)=>
      v===segment.originalNative3DParameterRange[i])))
   throw new RangeError('paper-collapsed native outline missing held original interval');
 }
 const normalizeOutline=t=>direction==='reversed'?
  (domain[1]-t)/(domain[1]-domain[0]):(t-domain[0])/(domain[1]-domain[0]);
 for(const segment of outlineSegments){
  const p=segment.originalNative3DParameterRange;
  const expected=[normalizeOutline(p[0]),normalizeOutline(p[1])].sort((a,b)=>a-b);
  const actual=segment.originalM0UnitParameterRange;
  if(!Array.isArray(actual)||actual.length!==2||
     !actual.every(Number.isFinite)||expected[0]!==actual[0]||
     expected[1]!==actual[1]||actual[0]<0||actual[1]>1||
     !(actual[1]>actual[0]))
   throw new RangeError('native outline original 3D interval does not reproduce its M0 parameter range');
 }
 const sameOutlineRanges=outlineSegments.filter(x=>
  x?.native3DHLRClass===sameOutlineClass).map(x=>x.originalM0UnitParameterRange);
 const oppositeOutlineRanges=outlineSegments.filter(x=>
  x?.native3DHLRClass===oppositeOutlineClass).map(x=>x.originalM0UnitParameterRange);
 const sameOutlineCoverage=exactCandidateIntervalCoverage(normalizedRange,sameOutlineRanges);
 const oppositeOutlineCoverage=exactCandidateIntervalCoverage(normalizedRange,oppositeOutlineRanges);
 const sameOutlineOverlaps=positivePairwiseIntervalOverlaps(sameOutlineRanges);
 const oppositeOutlineOverlaps=oppositeOutlineCoverage.positiveLengthCoveredIntervals;
 // Independently cover the *native* BRep curve domain. A positive gap
 // can vanish in rounded M0 fractions even while paper coverage looks full.
 // M4-held native outline intervals (including collapsed opposite-class
 // spans) also veto a class claim on any intersecting source subspan.
 const nativeOutlineClassCoverage=nativeOutlineEvidenceAvailable?
  auditNativeOriginalOutlineClassInterval(
   [...effectiveSourceRange].sort((a,b)=>a-b),
   outlineSegments.filter(x=>x.native3DHLRClass===sameOutlineClass)
    .map(x=>x.originalNative3DParameterRange),
   outlineSegments.filter(x=>x.native3DHLRClass===oppositeOutlineClass)
    .map(x=>x.originalNative3DParameterRange),
   (nativeM4.M4ProjectedNative3DOutlineIntervalsHeldForBinary64Representation??[])
    .map(x=>{
     if(!['visible-outline','hidden-outline'].includes(x?.native3DHLRClass))
      throw new RangeError('invalid held native outline class');
     return x.originalNative3DParameterRange;
    })
  ):null;
 const nativeOutlineClassBacked=nativeOutlineEvidenceAvailable&&
  outlineClassesValid&&sameOutlineCoverage.entireOriginalParameterIntervalCovered&&
  sameOutlineOverlaps.length===0&&oppositeOutlineOverlaps.length===0&&
  nativeOutlineClassCoverage.nativeOriginalClassBackedWithoutNormalization;
 return {
  availability:'available',sourceEdgeId:sourceId,
  original3DSourceCurveDirection:direction,
  generated2DHLRClass:sameClass,
  originalM0UnitParameterRange:normalizedRange,
  inverseMappedOriginalM0UnitParameterRange:inverseNormalizedRange,
  source3DParameterRangeFromInverse:[...sourceRange],
  sourceParameterDomainContainment:'exact',
  sourceDomainEndpointForwardMapProof:forwardEndpointBound,
  nativeM4SameClassCoverageComplete:sameCoverage.entireOriginalParameterIntervalCovered,
  nativeM4SameClassCoverageGaps:sameCoverage.positiveLengthUncoveredIntervals,
  nativeM4SameClassPositiveOverlaps:sameClassOverlaps,
  nativeM4HeldOriginalParameterPositiveOverlap:heldNativeIntersectsQuery,
  nativeSharpOriginalParameterEvidenceAvailable,
  nativeSharpOriginalParameterCoverage,
  nativeSharpOriginalParameterClassBacked,
  nativeM4IndependentPartitionNotDisproven:nativePartitionNotKnownFalse,
  nativeM4OppositeClassPositiveOverlap:oppositeOverlaps.length>0,
  nativeM4OppositeClassOverlaps:oppositeOverlaps,
  nativeM4ClassBacked:
   sameCoverage.entireOriginalParameterIntervalCovered&&
   sameClassOverlaps.length===0&&!heldNativeIntersectsQuery&&
   nativePartitionNotKnownFalse&&oppositeOverlaps.length===0&&
   (!nativeSharpOriginalParameterEvidenceAvailable||
    nativeSharpOriginalParameterClassBacked),
  nativeOutlineEvidenceAvailable,
  nativeOutlineSameClassCoverageComplete:
   sameOutlineCoverage.entireOriginalParameterIntervalCovered,
  nativeOutlineSameClassCoverageGaps:sameOutlineCoverage.positiveLengthUncoveredIntervals,
  nativeOutlineSameClassPositiveOverlaps:sameOutlineOverlaps,
  nativeOutlineOppositeClassPositiveOverlap:oppositeOutlineOverlaps.length>0,
  nativeOutlineOppositeClassOverlaps:oppositeOutlineOverlaps,
  nativeOutlineOriginalParameterCoverage:nativeOutlineClassCoverage,
  nativeOutlineClassBacked
 };
}
/**
 * Independent FULL source forward class corroboration. This audits raw
 * original BRep Sharp parameters without using the possibly overrun
 * Parameter3d inverse to define the original source domain.
 * No generated TopoDS ancestry, M5 occlusion, GB style or V5 permission.
 */
function auditC1FullOriginalForwardSharpClass({
 view,sourceEdgeId,klass,domain,forwardPaper,nativeM4
}={}){
 const base={view,sourceEdgeId,
  independentFullOriginalForwardSharpClass:false,
  generated2DTopoDSHistoryCertified:false,
  fullSceneOcclusionCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false};
 if(!VIEWS.includes(view)||typeof sourceEdgeId!=='string'||!sourceEdgeId||
    !['visible','hidden'].includes(klass)||
    !Array.isArray(domain)||domain.length!==2||!domain.every(Number.isFinite)||
    !(domain[1]>domain[0]))
  throw new TypeError('complete original BRep source and HLR class required');
 if(forwardPaper?.exactBinary64OriginalM0WholeSourceProjectedEndpointAgreement!==true||
    forwardPaper?.originalForward2DParameterDomainFullyMatchesGenerated!==true||
    forwardPaper?.actualNativeGeneratedCurveSamplesPresent!==true||
    forwardPaper?.originalToGeneratedTopoDSHistoryCertified!==false||
    forwardPaper?.signedV5Action!==false)
  return Object.freeze({...base,reason:'exact-original-forward-source-paper-unavailable'});
 if(!nativeM4)return Object.freeze({...base,reason:'original-native-sharp-unavailable'});
 if(nativeM4.schema!=='draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2'||
    nativeM4.view!==view||nativeM4.sourceEdgeId!==sourceEdgeId||
    !['forward','reversed'].includes(nativeM4.original3DSourceCurveDirection)||
    !Array.isArray(nativeM4.segments)||
    !Array.isArray(nativeM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation))
  throw new RangeError('invalid full-original native Sharp source ledger');
 const normalize=t=>nativeM4.original3DSourceCurveDirection==='reversed'?
  (domain[1]-t)/(domain[1]-domain[0]):(t-domain[0])/(domain[1]-domain[0]);
 const same=[],opposite=[];
 for(const seg of nativeM4.segments){
  const range=seg?.originalNative3DParameterRange,
   unit=seg?.originalM0UnitParameterRange;
  if(seg?.sourceEdgeId!==sourceEdgeId||seg?.view!==view||
     !['visible-sharp','hidden-sharp'].includes(seg.native3DHLRClass)||
     seg.derivedFromOriginalNative3DCurveNotGeneratedHLRPaper!==true||
     seg.generated2DHLREdgeTopologyProven!==false||
     seg.completeGlobalCoProjectedVisibilityCertified!==false||
     seg.engineeringLineStyle!=='undetermined'||seg.signedV5Action!==false||
     !Array.isArray(range)||range.length!==2||!range.every(Number.isFinite)||
     !(range[1]>range[0])||range[0]<domain[0]||range[1]>domain[1]||
     !Array.isArray(unit)||unit.length!==2||
     unit[0]!==Math.min(normalize(range[0]),normalize(range[1]))||
     unit[1]!==Math.max(normalize(range[0]),normalize(range[1])))
   throw new RangeError('native original Sharp interval or class was forged');
  (seg.native3DHLRClass===klass+'-sharp'?same:opposite).push(range);
 }
 const held=nativeM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation
  .map(row=>{
   if(!['visible-sharp','hidden-sharp'].includes(row?.native3DHLRClass))
    throw new RangeError('invalid held native original Sharp class');
   return row.originalNative3DParameterRange;
  });
 const audited=auditNativeOriginalOutlineClassInterval(domain,same,opposite,held);
 const partition=nativeM4.native3DSourceParameterPartitionCompleteExactlyOnce===true&&
  nativeM4.M4OriginalUnitIntervalCandidateCoverageComplete===true&&
  Array.isArray(nativeM4.native3DOriginalParameterPositiveGaps)&&
  nativeM4.native3DOriginalParameterPositiveGaps.length===0&&
  Array.isArray(nativeM4.native3DOriginalParameterPositiveOverlaps)&&
  nativeM4.native3DOriginalParameterPositiveOverlaps.length===0&&
  Array.isArray(nativeM4.M4OriginalUnitIntervalNativeClassConflicts)&&
  nativeM4.M4OriginalUnitIntervalNativeClassConflicts.length===0;
 return Object.freeze({...base,
  independentFullOriginalForwardSharpClass:
   partition&&audited.nativeOriginalClassBackedWithoutNormalization,
  nativeOriginalSharpPartitionEntireDomain:partition,
  originalSharpParameterAudit:audited,
  originalParameter3dInverseStillRequiresSeparateProof:true});
}
/**
 * Reconcile whole-solid generated 2D HLR edges with the SAME-RUN original
 * HLRBRep_Curve parameter map. The source curve enters this map only after
 * symmetric native TopoDS IsSame binds its EdgeData geometry to one M0 edge.
 * This is parameterized curve correspondence, NOT generated-edge TShape
 * ancestry, global occlusion, GB line style, ConstructionIntent or V5.
 */
/**
 * Count representable binary64 values between the received native HLR
 * Parameter3d inverse and the ORIGINAL OCCT BRep endpoint. A 1-ULP
 * overrun is still strictly OUTSIDE the domain; this is diagnostic only,
 * not a numerical tolerance, source repair, or TopoDS history proof.
 */
const inverseULPBits=new DataView(new ArrayBuffer(8));
const ULP_SIGN_BIT=1n<<63n,ULP_ALL_BITS=(1n<<64n)-1n;
const orderedBinary64=n=>{
 inverseULPBits.setFloat64(0,n,false);
 const bits=inverseULPBits.getBigUint64(0,false);
 return (bits&ULP_SIGN_BIT)!==0n?(~bits)&ULP_ALL_BITS:bits|ULP_SIGN_BIT;
};
function auditC1RejectedOriginalInverseParameterULP({originalBRepDomain,rawInverse}={}){
 if(!Array.isArray(originalBRepDomain)||originalBRepDomain.length!==2||
    !originalBRepDomain.every(Number.isFinite)||
    !(originalBRepDomain[1]>originalBRepDomain[0])||
    !Number.isFinite(rawInverse)||
    rawInverse>=originalBRepDomain[0]&&rawInverse<=originalBRepDomain[1])
  throw new RangeError('strictly out-of-domain finite native Parameter3d inverse required');
 const beyondStart=rawInverse<originalBRepDomain[0];
 const boundary=originalBRepDomain[beyondStart?0:1];
 const rankRaw=orderedBinary64(rawInverse),rankBoundary=orderedBinary64(boundary);
 let ulps=beyondStart?rankBoundary-rankRaw:rankRaw-rankBoundary;
 // -0 and +0 are two binary64 bit patterns but the SAME numerical
 // parameter, so crossing both must not invent an extra ULP of geometry.
 const lo=rankRaw<rankBoundary?rankRaw:rankBoundary;
 const hi=rankRaw>rankBoundary?rankRaw:rankBoundary;
 if(lo<=orderedBinary64(-0)&&hi>=orderedBinary64(0))ulps--;
 if(ulps<=0n)
  throw new RangeError('native Parameter3d overrun has no positive binary64 ULP');
 return Object.freeze({
  originalBRepBoundaryParameter:boundary,
  receivedOutsideNativeInverseParameter:rawInverse,
  overrunSide:beyondStart?'before-original-start':'after-original-end',
  strictlyOutsideOriginalBRepDomain:true,
  binary64RepresentableStepsOutsideOriginalDomain:String(ulps),
  nativeParameterDomainRepaired:false,
  originalToGenerated2DTopoDSHistoryCertified:false,
  signedV5Action:false
 });
}
/**
 * Independently replay each same-run original OCCT forward 3D parameter,
 * native forward 2D parameter and GENERATED actual paper sample. This checks
 * producer arithmetic and detects forged five-point tallies; evaluating
 * original OCCT Value() is still producer/native-runtime responsibility.
 * It is NOT the missing continuous 2D TopoDS history or an M5 signature.
 */
function auditC1HeldInverseOriginalNativeForwardReplay({
 witness,domain,generatedRange,actualGeneratedPaper,nativeTolerance
}={}){
 if(witness==null)return null; // legacy fixtures: no native forward claim
 if(witness.schema!=='draftai-c1-inverse-rejected-original-native-forward-samples/1'||
    !Array.isArray(witness.samples)||witness.samples.length!==5||
    !Array.isArray(domain)||domain.length!==2||
    !domain.every(Number.isFinite)||!(domain[1]>domain[0])||
    !Array.isArray(generatedRange)||generatedRange.length!==2||
    !generatedRange.every(Number.isFinite)||!(generatedRange[1]>generatedRange[0])||
    !Array.isArray(actualGeneratedPaper)||actualGeneratedPaper.length!==5||
    !actualGeneratedPaper.every(p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v))||
    !Number.isFinite(nativeTolerance)||nativeTolerance<0||
    witness.rejectedNativeInverseStillOutOfOriginalBRepDomain!==true||
    witness.generated2DTopoDSHistoryProven!==false||
    witness.wholeSceneOcclusionCertified!==false||
    witness.engineeringLineStyle!=='undetermined'||
    witness.signedV5Action!==false)
  throw new RangeError('invalid same-run rejected-inverse original native forward samples');
 const first=witness.samples[0].originalNative3DParameter,
  reversed=first===domain[1];
 if(first!==domain[0]&&!reversed)
  throw new RangeError('original native forward sample must start at a physical BRep endpoint');
 let complete=true,exactGrid=true,ordered=true,paperWithin=true,
  lastP2=null,maxResidual=0;
 const rows=witness.samples.map((row,i)=>{
  const f=i/4,expectedNative=reversed?
   domain[1]+(domain[0]-domain[1])*f:
   domain[0]+(domain[1]-domain[0])*f;
  const grid=generatedRange[0]+(generatedRange[1]-generatedRange[0])*f;
  if(row.originalNative3DParameter!==expectedNative||
     row.generated2DGridParameter!==grid)
   throw new RangeError('original native five-point forward parameter grid was altered');
  const p2=row.nativeOriginal2DParameter,
   p=row.nativeOriginalProjectedMm,residual=row.nativeGeneratedPaperResidualMm;
  const readable=Number.isFinite(p2)&&p&&
   Number.isFinite(p.u)&&Number.isFinite(p.v)&&Number.isFinite(residual)&&
   residual>=0;
  complete&&=!!readable;
  if(readable){
   const computed=Math.hypot(p.u-actualGeneratedPaper[i].u,
    p.v-actualGeneratedPaper[i].v);
   if(residual!==computed)
    throw new RangeError('original native forward curve paper residual contradicts measured OCCT output');
   if(p2!==grid)exactGrid=false;
   if(lastP2!==null&&!(p2>lastP2))ordered=false;
   lastP2=p2;
   if(!(residual<=nativeTolerance))paperWithin=false;
   maxResidual=Math.max(maxResidual,residual);
  }
  if(row.exactGenerated2DGridParameter!==(readable&&p2===grid))
   throw new RangeError('forged original native forward generated 2D sample parameter');
  return {originalNative3DParameter:expectedNative,
   originalNative2DParameter:readable?p2:null,
   generated2DParameter:grid,
   actualOriginalNativePaperPoint:readable?{u:p.u,v:p.v}:null,
   actualGeneratedNativePaperPoint:{...actualGeneratedPaper[i]},
   nativePaperResidualMm:readable?residual:null};
 });
 const exact=complete&&exactGrid&&ordered,
  inside=complete&&paperWithin,
  full=!!witness.fullOriginalForward2DParameterDomainExact,
  corroborated=full&&exact&&inside;
 if(witness.originalNativeForwardFiveSamplesReadable!==complete||
    witness.originalNativeForwardFive2DParametersMatchGeneratedGridExactly!==exact||
    witness.originalNativeForwardFivePaperSamplesWithinGeneratedNativeTolerance!==inside||
    witness.originalNativeForwardFivePointDiscreteConcordance!==corroborated||
    witness.originalNativeForwardMaximumPaperResidualMm!==
      (complete?maxResidual:null))
  throw new RangeError('forged same-run original BRep forward five-sample certificate');
 return frozen({
  schema:'draftai-c1-held-inverse-native-forward-sample-replay/1',
  originalBRepSourceParameterRange:[...domain],
  nativeGenerated2DParameterRange:[...generatedRange],
  originalNativeForwardSamplesChecked:5,
  independentlyReplayedNativeFivePointDiscreteConcordance:corroborated,
  allNativeForwardParametersExactlyOnGeneratedGrid:exact,
  allNativeForwardPaperWithinGeneratedTolerance:inside,
  rows,
  rawParameter3dInverseStillOutsideOriginalBRep:true,
  completeGeneratedTopoDSHistoryCertified:false,
  allSceneContinuousOcclusionCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
function auditC1ParameterizedGlobalHLRSourceLineage({
 view,classes,scoped,expected,nativeM4ById,projectedOriginalBySource
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
   independentFullForwardSharpCorroboratedButInverseHeldEdges:0,
   inverseRejectedOriginalFullForwardSharpCorroboratedEdges:0,
   nativeM4ClassEvidenceUnavailableEdges:0,
   nativeM4ClassBackingUnprovenEdges:0,
   nativeOutlineClassBackedUniqueFilterSourceEdges:0,
   nativeOutlineEvidenceUnavailableEdges:0,
   nativeOutlineClassBackingUnprovenEdges:0
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
  const seenOrdinals=new Set(),distinctParameterDomainBoundSourceIds=new Set();
  let rawUnique=0,rawAmbiguous=0,rawUnmatched=0;
  let unique=0,ambiguous=0,unmatched=0,disagreements=0;
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
   const candidateIds=new Set();
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
    if(!expected.has(sourceId)||candidateIds.has(sourceId)||
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
       // A same-run producer witness cannot claim even a one-ULP
       // generated 2D interval outside its ORIGINAL projected BRep domain.
       // Do not use round-trip tolerances to erase a positive overhang.
       generatedRange?.[0]<sourceProjectedSortedRange[0]||
       generatedRange?.[1]>sourceProjectedSortedRange[1]||
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
    const sampleResiduals=[],roundTripResiduals=[];
    // Recheck the received same-run five-point ORIGINAL BRep parameter
    // correspondence independently of the native producer. A folded or
    // duplicated source parameter can cover the same paper samples while
    // skipping a real positive original-curve interval. This is a necessary
    // injectivity witness, not a continuous curve/TopoDS history proof.
    const sourceAscending=sourceProjectedRange[1]>sourceProjectedRange[0];
    let previousSample=null;
    for(const sample of samples){
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
     if(previousSample&&
        (!(sample.generated2DParameter>previousSample.generated2DParameter)||
         (sourceAscending?
          !(sample.source3DParameter>previousSample.source3DParameter):
          !(sample.source3DParameter<previousSample.source3DParameter))))
      throw new RangeError('noninjective generated HLR to original BRep parameter correspondence');
     previousSample=sample;
     // Independently reproduce the producer's same-run projected residual.
     // A claimed zero error is not evidence when the two actual paper
     // sample coordinates differ. No epsilon may hide a positive mismatch.
     const computedResidual=Math.hypot(
      sourcePoint[0]-generatedPoint[0],sourcePoint[1]-generatedPoint[1]);
     if(!Number.isFinite(computedResidual)||
        computedResidual!==sample.projectedPointResidualMm)
      throw new RangeError('generated HLR source sample projected residual is inconsistent');
     // The generated curve sample grid is determined by the native HLR
     // output parameter range, not arbitrary values in a source report.
     const sampleOrdinal=sampleResiduals.length;
     const expectedP2=generatedRange[0]+(generatedRange[1]-generatedRange[0])*
      (sampleOrdinal/4);
     if(sample.generated2DParameter!==expectedP2)
      throw new RangeError('generated HLR source sample parameter grid is inconsistent');
     // Where the real OCCT output carries the native projected samples,
     // require exact equality with the claimed generated-side witness.
     // Older synthetic fixtures without this inventory remain unsigned.
     const nativeSamples=segment.actualOCCTHLRCurveSamplesProjectedMm;
     if(nativeSamples!==undefined){
      if(!Array.isArray(nativeSamples)||nativeSamples.length!==5||
         !nativeSamples.every(p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v))||
         generatedPoint[0]!==nativeSamples[sampleOrdinal].u||
         generatedPoint[1]!==nativeSamples[sampleOrdinal].v)
       throw new RangeError('generated HLR source sample disagrees with native OCCT curve');
     }
     sampleResiduals.push(sample.projectedPointResidualMm);
     roundTripResiduals.push(sample.parameterRoundTripResidual);
    }
    if(samples[0].generated2DParameter!==generatedRange[0]||
       samples[4].generated2DParameter!==generatedRange[1]||
       samples[0].source3DParameter!==sourceRange[0]||
       samples[4].source3DParameter!==sourceRange[1])
     throw new RangeError('generated HLR sample endpoints disagree with original BRep parameter range');
    if(Math.max(...sampleResiduals)>match.maximumProjectedPointResidualMm||
       Math.max(...roundTripResiduals)>match.maximumParameterRoundTripResidual||
       (Number.isFinite(segment.actualOCCTHLRCurveSampleToleranceMm)&&
        Math.max(...sampleResiduals)>segment.actualOCCTHLRCurveSampleToleranceMm))
     throw new RangeError('parameterized HLR curve residual summary is inconsistent');
    candidateIds.add(sourceId);
    distinctParameterDomainBoundSourceIds.add(sourceId);
   }
   const rawStatus=matches.length===0?'no-parameterized-source-curve-match':
    matches.length===1?'unique-parameterized-source-curve-match':
     'ambiguous-parameterized-source-curve-match';
   if(row.status!==rawStatus||
      row.uniqueOriginalSourceEdgeId!==(matches.length===1?matches[0].sourceEdgeId:null))
    throw new RangeError('parameterized HLR source match classification is inconsistent');
   if(matches.length===1)rawUnique++;
   else if(matches.length>1)rawAmbiguous++;
   else rawUnmatched++;
   // A parameterized source must agree with BOTH the independent native
   // source-filtered HLR inventory and the original M0 paper candidate set.
   // Extra source-filter claims are a disagreement, not a reason to pick one.
   const filterSources=item.sources[ordinal];
   // A generated HLR edge with a strictly overrun native Parameter3d
   // inverse is NOT a matched source. Retain only original TopoDS identity
   // and forward-parameter evidence to test its native Sharp class as
   // a separate unsigned diagnostic. Never put it in candidateIds.
   const inverseRejectedForwardSources=[];
   for(const held of row.rejectedSourceCandidates??[]){
    if(held?.reason!=='generated-source-3d-parameter-outside-original-brep-domain'||
       held.originalInverseStillOutsideBRepDomain!==true)continue;
    const sourceId=held.sourceEdgeId,
     domain=held.originalBRepSourceParameterRange,
     raw=held.firstRejectedOriginal3DParameter,
     projected=held.sourceProjected2DParameterRange,
     projectedSorted=held.sourceProjected2DParameterRangeSorted,
     generated=held.generated2DParameterRange;
    if(!expected.has(sourceId)||candidateIds.has(sourceId)||
       held.matched!==false||held.originalTopoDSEdgeIdentityProven!==true||
       held.generated2DTopoDSHistoryProven!==false||
       held.engineeringLineStyle!=='undetermined'||held.signedV5Action!==false||
       !Array.isArray(domain)||domain.length!==2||!domain.every(Number.isFinite)||
       !(domain[1]>domain[0])||
       !Array.isArray(held.original3DCurveParameterRange)||
       held.original3DCurveParameterRange.length!==2||
       !held.original3DCurveParameterRange.every((v,i)=>v===domain[i])||
       !Number.isFinite(raw)||(raw>=domain[0]&&raw<=domain[1])||
       !Array.isArray(generated)||generated.length!==2||
       !generated.every(Number.isFinite)||
       generated[0]!==segment.actualOCCTHLRCurveParameterRange?.[0]||
       generated[1]!==segment.actualOCCTHLRCurveParameterRange?.[1]||
       !Array.isArray(projected)||projected.length!==2||
       !projected.every(Number.isFinite)||
       !Array.isArray(projectedSorted)||projectedSorted.length!==2||
       !projectedSorted.every(Number.isFinite)||
       Math.min(...projected)!==projectedSorted[0]||
       Math.max(...projected)!==projectedSorted[1]||
       !Number.isFinite(held.firstRejectedGenerated2DParameter)||
       held.firstRejectedGenerated2DParameter<generated[0]||
       held.firstRejectedGenerated2DParameter>generated[1])
     throw new RangeError('invalid received original BRep inverse-rejected forward HLR witness');
    const forward=auditC1OriginalM0FullForwardHLRPaperEndpoints({
     originalProjectedEndpoints:projectedOriginalBySource?.get(sourceId)?.[view],
     sourceProjected2DParameterRangeSorted:projectedSorted,
     generated2DParameterRange:generated,
     generatedHLRCurveSamples:segment.actualOCCTHLRCurveSamplesProjectedMm
    });
    const sharp=auditC1FullOriginalForwardSharpClass({
     view,sourceEdgeId:sourceId,klass,domain,forwardPaper:forward,
     nativeM4:nativeM4ById?.get(sourceId)
    });
    const overrun=auditC1RejectedOriginalInverseParameterULP({
     originalBRepDomain:domain,rawInverse:raw
    });
    const nativeForwardReplay=auditC1HeldInverseOriginalNativeForwardReplay({
     witness:held.nativeOriginalForwardFiveSampleConcordance,
     domain,generatedRange:generated,
     actualGeneratedPaper:segment.actualOCCTHLRCurveSamplesProjectedMm,
     nativeTolerance:segment.actualOCCTHLRCurveSampleToleranceMm
    });
    inverseRejectedForwardSources.push({
     sourceEdgeId:sourceId,
     strictNativeOriginalInverseBinary64Overrun:overrun,
     originalNativeForwardFiveSampleConcordance:
      held.nativeOriginalForwardFiveSampleConcordance??null,
     independentlyReplayedNativeForwardFiveSamples:nativeForwardReplay,
     originalBRepParameterRange:[...domain],
     firstRejectedGenerated2DParameter:held.firstRejectedGenerated2DParameter,
     firstRejectedOriginal3DParameter:raw,
     exactForwardM0PaperWitness:forward,
     originalNativeSharpFullParameterWitness:sharp,
     rawParameter3dInverseOutsideOriginalBRep:true,
     originalToGeneratedTopoDSHistoryCertified:false,
     signedV5Action:false
    });
   }
   const parameterizedSourceIntervals=[],nativeM4ClassBackedSourceIds=new Set(),
    nativeOutlineClassBackedSourceIds=new Set(),nativeM4Audits=[],
    independentForwardOnlyIds=new Set();
   for(const match of matches){
    const nativeM4=nativeM4ById?.get(match.sourceEdgeId);
    const forwardPaper=auditC1OriginalM0FullForwardHLRPaperEndpoints({
     originalProjectedEndpoints:projectedOriginalBySource?.get(match.sourceEdgeId)?.[view],
     sourceProjected2DParameterRangeSorted:match.sourceProjected2DParameterRangeSorted,
     generated2DParameterRange:match.generated2DParameterRange,
     generatedHLRCurveSamples:segment.actualOCCTHLRCurveSamplesProjectedMm
    });
    const m4Audit=auditC1ParameterizedSourceMatchAgainstNativeM4({
     view,sourceId:match.sourceEdgeId,match,klass,nativeM4
    });
    const forwardSharp=auditC1FullOriginalForwardSharpClass({
     view,sourceEdgeId:match.sourceEdgeId,klass,
     domain:match.originalBRepSourceParameterRange,
     forwardPaper,nativeM4
    });
    nativeM4Audits.push(m4Audit);
    if(m4Audit.nativeM4ClassBacked===true)
     nativeM4ClassBackedSourceIds.add(match.sourceEdgeId);
    else if(forwardSharp.independentFullOriginalForwardSharpClass)
     independentForwardOnlyIds.add(match.sourceEdgeId);
    if(m4Audit.nativeOutlineClassBacked===true)
     nativeOutlineClassBackedSourceIds.add(match.sourceEdgeId);
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
     originalM0FullForwardPaperEndpointWitness:forwardPaper,
     independentFullOriginalForwardSharpClassWitness:forwardSharp,
     // Never upgrade the original inverse parameter proof by implication.
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
   const forwardOnlyUniqueSource=
    filterConsistent&&filterSources.size===1&&
    independentForwardOnlyIds.has([...filterSources][0])&&
    !nativeM4ClassBackedUniqueFilterSource;
   const inverseRejectedOriginalSharpCorroborated=
    matches.length===0&&filterSources.size===1&&
    inverseRejectedForwardSources.some(x=>
     x.sourceEdgeId===[...filterSources][0]&&
     paperCandidates.includes(x.sourceEdgeId)&&
     x.originalNativeSharpFullParameterWitness.
      independentFullOriginalForwardSharpClass===true);
   const m4Available=nativeM4Audits.some(x=>x.availability==='available');
   const nativeOutlineEvidenceAvailable=nativeM4Audits.some(x=>
    x.nativeOutlineEvidenceAvailable===true);
   const nativeOutlineClassBackedUniqueFilterSource=
    filterConsistent&&filterSources.size===1&&
    nativeOutlineClassBackedSourceIds.has([...filterSources][0]);
   if(matches.length>0){
    if(!m4Available)result.counts.nativeM4ClassEvidenceUnavailableEdges++;
    else if(nativeM4ClassBackedUniqueFilterSource)
     result.counts.nativeM4ClassBackedUniqueFilterSourceEdges++;
    else result.counts.nativeM4ClassBackingUnprovenEdges++;
    if(forwardOnlyUniqueSource)
     result.counts.independentFullForwardSharpCorroboratedButInverseHeldEdges++;
    if(!nativeOutlineEvidenceAvailable)
     result.counts.nativeOutlineEvidenceUnavailableEdges++;
    else if(nativeOutlineClassBackedUniqueFilterSource)
     result.counts.nativeOutlineClassBackedUniqueFilterSourceEdges++;
    else result.counts.nativeOutlineClassBackingUnprovenEdges++;
   }
   // This diagnostic is only possible when ALL Parameter3d inversions
   // were rejected. Counting it inside "matches.length>0" silently kept
   // the real W B|D source at zero despite an independently complete
   // forward original-M0 paper + native Sharp-class witness. Preserve
   // the unmatched classification and never authorize TopoDS history/V5.
   if(inverseRejectedOriginalSharpCorroborated)
    result.counts.inverseRejectedOriginalFullForwardSharpCorroboratedEdges++;
   const status=matches.length===0?'unmatched':
    !filterConsistent?'source-filter-or-paper-candidate-disagreement':
     matches.length===1?'unique-parameterized-source-lineage':
      filterNarrows?'ambiguous-parameterized-source-lineage-native-filter-narrowed':
       'ambiguous-parameterized-source-lineage';
   if(status==='unique-parameterized-source-lineage')unique++;
   else if(status==='ambiguous-parameterized-source-lineage'||
           status==='ambiguous-parameterized-source-lineage-native-filter-narrowed')
    ambiguous++;
   else if(status==='unmatched')unmatched++;
   else disagreements++;
   return {
    wholeSolidHLREdgeOrdinal:ordinal,
    parameterizedSourceMatchCount:matches.length,
    parameterizedOriginalSourceEdgeIds:[...candidateIds].sort(),
    nativeSourceFilterCandidateIds:[...filterSources].sort(),
    m0PaperCandidateIds:[...paperCandidates].sort(),
    nativeSourceFilterAndM0PaperCandidatesAgree:filterConsistent,
    nativeFilterNarrowsParameterizedCandidates:filterNarrows,
    parameterizedSourceIntervals,
    nativeM4ClassBackedSourceEdgeIds:[...nativeM4ClassBackedSourceIds].sort(),
    nativeM4ClassBackedUniqueFilterSource,
    independentFullForwardSharpCorroboratedButInverseHeld:forwardOnlyUniqueSource,
    inverseRejectedForwardOriginalSharpSourceWitnesses:inverseRejectedForwardSources,
    inverseRejectedOriginalFullForwardSharpCorroborated:
     inverseRejectedOriginalSharpCorroborated,
    nativeM4ClassEvidenceAvailable:m4Available,
    nativeOutlineClassBackedSourceEdgeIds:[...nativeOutlineClassBackedSourceIds].sort(),
    nativeOutlineClassBackedUniqueFilterSource,
    nativeOutlineEvidenceAvailable,
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
   independentFullForwardSharpCorroboratedButInverseHeldEdges:
    rows.filter(x=>x.independentFullForwardSharpCorroboratedButInverseHeld).length,
   inverseRejectedOriginalFullForwardSharpCorroboratedEdges:
    rows.filter(x=>x.inverseRejectedOriginalFullForwardSharpCorroborated).length,
   nativeM4ClassEvidenceUnavailableEdges:
    rows.filter(x=>x.parameterizedSourceMatchCount>0&&!x.nativeM4ClassEvidenceAvailable).length,
   nativeM4ClassBackingUnprovenEdges:
    rows.filter(x=>x.parameterizedSourceMatchCount>0&&x.nativeM4ClassEvidenceAvailable&&
     !x.nativeM4ClassBackedUniqueFilterSource).length,
   nativeOutlineClassBackedUniqueFilterSourceEdges:
    rows.filter(x=>x.nativeOutlineClassBackedUniqueFilterSource).length,
   nativeOutlineEvidenceUnavailableEdges:
    rows.filter(x=>x.parameterizedSourceMatchCount>0&&!x.nativeOutlineEvidenceAvailable).length,
   nativeOutlineClassBackingUnprovenEdges:
    rows.filter(x=>x.parameterizedSourceMatchCount>0&&x.nativeOutlineEvidenceAvailable&&
     !x.nativeOutlineClassBackedUniqueFilterSource).length,
   rows};
  result.counts.uniqueParameterizedSourceLineage+=unique;
  result.counts.ambiguousParameterizedSourceLineage+=ambiguous;
  result.counts.nativeFilterNarrowedAmbiguousParameterizedSourceLineage+=
   rows.filter(x=>x.status==='ambiguous-parameterized-source-lineage-native-filter-narrowed').length;
  result.counts.unmatchedGeneratedOutputEdges+=unmatched;
  result.counts.sourceFilterOrPaperCandidateDisagreements+=disagreements;
 }
 return result;
}
/**
 * Independently consume same-run original-edge-filtered GENERATED 2D
 * OutLineV/HCompound. Native IsSame is a 2D generated edge identity,
 * not the missing original BRep -> HLR parameter ancestry or M5 proof.
 */
function auditC1Native2DOutlineSourceHistory({view,scoped,expected,onOriginalPaperEdge}={}){
 const ledger=scoped?.native2DOutlineSourceHistory;
 if(ledger===undefined)return null; // legacy unsigned synthetic fixtures
 if(ledger?.schema!=='draftai-c1-ocjs-original-filtered-generated-2d-outline/1'||
    ledger.originalBRepToGenerated2DParameterHistoryCertified!==false||
    ledger.allSceneContinuousVisibilityCertified!==false||
    ledger.engineeringLineStyle!=='undetermined'||ledger.signedV5ActionCount!==0||
    !Number.isSafeInteger(ledger.sourceScopedOutputEdges)||
    !Number.isSafeInteger(ledger.nativeScopedToWholeSolidGeneratedIsSameCount)||
    !Array.isArray(ledger.wholeSolid?.visible)||
    !Array.isArray(ledger.wholeSolid?.hidden)||
    ledger.wholeSolid.visible.length>128||ledger.wholeSolid.hidden.length>128||
    !Array.isArray(scoped.rows))
  throw new RangeError('invalid original-filtered generated 2D outline ledger');
 const whole={visible:ledger.wholeSolid.visible,hidden:ledger.wholeSolid.hidden};
 for(const rows of Object.values(whole))for(const seg of rows)
  if(!seg?.from||!seg?.to||
     !Number.isFinite(seg.from.u)||!Number.isFinite(seg.from.v)||
     !Number.isFinite(seg.to.u)||!Number.isFinite(seg.to.v)||
     seg.originalSourceCandidateOnly!==true||
     seg.engineeringLineStyle!=='undetermined'||seg.signedV5Action!==false)
   throw new RangeError('unsigned whole-solid 2D outline endpoint missing');
 let total=0,direct=0;
 const nativeClaims=new Set(),sources=new Set();
 for(const row of scoped.rows){
  const source=row?.originalPhysicalSourceEdgeId;
  if(!expected.has(source)||sources.has(source))
   throw new RangeError('2D outline source does not belong to original BRep');
  sources.add(source);
  for(const [klass,field,group] of [
   ['visible-outline','visibleOutline2D','visible'],
   ['hidden-outline','hiddenOutline2D','hidden']
  ]){
   const witnesses=row[field];
   if(!Array.isArray(witnesses)||witnesses.length>128)
    throw new RangeError('missing source-scoped generated 2D outline class');
   for(const w of witnesses){
    const paper=w?.globalPaperCandidateOrdinals,
     native=w?.globalDirectSameGeneratedTopoDSOrdinals;
    if(w.view!==view||w.hlrClass!==klass||
       w.originalPhysicalSourceEdgeId!==source||
       !onOriginalPaperEdge(w.from,source,view)||
       !onOriginalPaperEdge(w.to,source,view)||
       !Array.isArray(paper)||!paper.length||!Array.isArray(native)||
       native.length>1||
       w.actualNativeScopedToGlobalGeneratedEdgeIsSameProven!==(native.length===1)||
       w.fullOriginalSourceParameterCoverageProven!==false||
       w.globalContinuousOcclusionProven!==false||
       w.engineeringLineStyle!=='undetermined'||w.signedV5Action!==false)
     throw new RangeError('forged source-scoped generated 2D outline witness');
    const uniquePaper=new Set(paper);
    if(uniquePaper.size!==paper.length||
       paper.some(n=>!Number.isSafeInteger(n)||n<0||
        n>=whole[group].length||
        !nativeScopedPaperSegmentsSame(w,whole[group][n]))||
       native.some(n=>!uniquePaper.has(n)))
     throw new RangeError('source-scoped 2D outline has false global native ordinal');
    for(const n of native){
     const key=klass+'|'+n;
     if(nativeClaims.has(key))
      throw new RangeError('duplicate native generated 2D outline owner');
     nativeClaims.add(key);
    }
    total++;direct+=native.length;
   }
  }
 }
 const conflicts=ledger.identityConflicts;
 if(sources.size!==expected.size||total!==ledger.sourceScopedOutputEdges||
    direct!==ledger.nativeScopedToWholeSolidGeneratedIsSameCount||
    conflicts?.uniqueNativeClaims!==direct||
    conflicts?.wholeSolidNativeGeneratedEdgeCount!==
     whole.visible.length+whole.hidden.length||
    conflicts?.conflictingSourceClaimsRejected!==true||
    conflicts?.fullOriginalSourceHistoryCertified!==false||
    conflicts?.globalContinuousOcclusionCertified!==false||
    conflicts?.signedV5ActionCount!==0)
  throw new RangeError('native 2D outline source identity inventory is inconsistent');
 return frozen({view,sourceScopedOutputEdges:total,
  nativeScopedToGlobalGeneratedIsSame:direct,
  wholeSolidGeneratedOutlineEdges:whole.visible.length+whole.hidden.length,
  unclaimedGeneratedOutlineEdges:
   conflicts.unclaimedWholeSolidGeneratedEdgeOrdinals?.length??null,
  generated2DOriginalParameterAncestryCertified:false,
  globalContinuousVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0});
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
  globalGeneratedHLREdgesWithUnprovenNativeM4ClassBacking:0,
  globalGeneratedHLREdgesWithUniqueNativeOutlineClassBackedSourceFilter:0,
  globalGeneratedHLREdgesWithoutNativeOutlineEvidence:0,
  globalGeneratedHLREdgesWithUnprovenNativeOutlineClassBacking:0,
  originalStatusVsNative3DCompared:0,originalStatusVsNative3DConcordant:0,
  originalStatusVsNative3DConflicting:0,originalStatusVsNative3DHeld:0,
   nativeGenerated2DOutlineSourceScopedEdges:0,
   nativeGenerated2DOutlineIsSameClaims:0,
   nativeGenerated2DOutlineUnclaimedEdges:0};
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
     // A source may collapse to one paper point in a first-angle view,
     // but its native HLR outline remains a real 3D interval. Never
     // silently drop an OutLine just because Sharp emitted no segment.
     // Keep every unprojectable positive interval as a blocking obligation.
     if(['visible3D','hidden3D','visibleOutline3D','hiddenOutline3D']
      .some(key=>{
       const group=source[key];
       if(group==null)return false; // older native ABI may lack OutLine
       if(!Array.isArray(group.native3DGeneratedCurveIntervals))
        throw new RangeError('malformed native 3D HLR interval group');
       return group.native3DGeneratedCurveIntervals.length>0;
      }))
      throw new RangeError('collapsed source cannot emit native 3D sharp or outline interval in this view');
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
    projectedOriginalBySource
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
  counts.globalGeneratedHLREdgesWithUniqueNativeOutlineClassBackedSourceFilter+=
   parameterizedGlobalHLRSourceLineage.counts.nativeOutlineClassBackedUniqueFilterSourceEdges;
  counts.globalGeneratedHLREdgesWithoutNativeOutlineEvidence+=
   parameterizedGlobalHLRSourceLineage.counts.nativeOutlineEvidenceUnavailableEdges;
  counts.globalGeneratedHLREdgesWithUnprovenNativeOutlineClassBacking+=
   parameterizedGlobalHLRSourceLineage.counts.nativeOutlineClassBackingUnprovenEdges;
  // Independently replay real original HLR status vs source-scoped 3D
  // Sharp classes. This remains source-side diagnosis only; a received
  // agree flag cannot certify generated 2D TopoDS ancestry or M5/V5.
  const originalStatusReconciliation=[];
  const summary=scoped.originalStatusVsNative3DSharpSummary;
  if(summary!==undefined){
   const rows=cad.nativeHLRSourceHistoryAPISurfaceByView?.[view]?.
    originalEdgeStatusAbi?.rows;
   if(!nativeM4Available||!Array.isArray(rows)||
      summary?.directGenerated2DTopoDSHistoryCertified!==false||
      summary?.officialV5Authorized!==false)
    throw new RangeError('missing independently indexed original HLR status');
   const statusById=new Map();
   for(const x of rows){
    if(!expected.has(x.sourceEdgeId)||statusById.has(x.sourceEdgeId))
     throw new RangeError('duplicate or invented original EdgeStatus source');
    statusById.set(x.sourceEdgeId,x);
   }
   if(statusById.size!==expected.size)
    throw new RangeError('incomplete original native EdgeStatus source ledger');
   for(const source of scoped.rows){
    const id=source.originalPhysicalSourceEdgeId,
     curve=nativeCurveBySource.get(id);
    if(!curve||!Array.isArray(curve.occtSourceCurveParameterRange))
     throw new RangeError('original status lacks reviewed BRep source curve');
    const visible=source.visible3D?.native3DGeneratedCurveIntervals,
     hidden=source.hidden3D?.native3DGeneratedCurveIntervals;
    const computed=auditOriginalEdgeStatusVsSourceScoped3DSharp({
     sourceEdgeId:id,
     originalNativeParameterRange:curve.occtSourceCurveParameterRange,
     statusRow:statusById.get(id),
     visibleNativeIntervals:Array.isArray(visible)?
      visible.map(x=>x.nativeOriginalCurveParameterRange):null,
     hiddenNativeIntervals:Array.isArray(hidden)?
      hidden.map(x=>x.nativeOriginalCurveParameterRange):null
    });
    if(JSON.stringify(computed)!==
       JSON.stringify(source.originalEdgeStatusVsNative3DSharp))
     throw new RangeError('original native EdgeStatus/3D Sharp report is not replayable');
    originalStatusReconciliation.push(computed);
   }
   const compared=originalStatusReconciliation.filter(x=>x.comparable).length,
    concordant=originalStatusReconciliation.filter(x=>
     x.nativeOriginalStatusClassAgreesWith3DSharp).length,
    conflicting=compared-concordant,
    held=originalStatusReconciliation.length-compared;
   if(summary.comparedOriginalSources!==compared||
      summary.concordantOriginalSources!==concordant||
      summary.mismatchedOriginalSources!==conflicting||
      summary.heldUncomparableOriginalSources!==held)
    throw new RangeError('native original status/3D class aggregate is forged');
   counts.originalStatusVsNative3DCompared+=compared;
   counts.originalStatusVsNative3DConcordant+=concordant;
   counts.originalStatusVsNative3DConflicting+=conflicting;
   counts.originalStatusVsNative3DHeld+=held;
  }
  const native2DOutlineSourceHistory=
    auditC1Native2DOutlineSourceHistory({view,scoped,expected,onOriginalPaperEdge});
   if(native2DOutlineSourceHistory){
    counts.nativeGenerated2DOutlineSourceScopedEdges+=
     native2DOutlineSourceHistory.sourceScopedOutputEdges;
    counts.nativeGenerated2DOutlineIsSameClaims+=
     native2DOutlineSourceHistory.nativeScopedToGlobalGeneratedIsSame;
    counts.nativeGenerated2DOutlineUnclaimedEdges+=
     native2DOutlineSourceHistory.unclaimedGeneratedOutlineEdges??0;
   }
   views[view]={native2DOutlineSourceHistory,nativeOriginal3DM4Candidates,
   nativeScoped2D3DClassBindings,parameterizedGlobalHLRSourceLineage,
   originalStatusReconciliation};
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
 auditC1OriginalM0FullForwardHLRPaperEndpoints,
 auditC1FullOriginalForwardSharpClass,
 auditC1RejectedOriginalInverseParameterULP,
 auditC1HeldInverseOriginalNativeForwardReplay
};
