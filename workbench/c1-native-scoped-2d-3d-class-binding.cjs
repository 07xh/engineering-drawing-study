'use strict';
/**
 * Exact cross-class binding between two INDEPENDENT HLR extractions for the
 * SAME real indexed original TopoDS source edge:
 *   V/HCompound_2(source) -> generated 2D HLR source-scoped paper segments
 *   CompoundOfEdges_2(source, Sharp, visible, In3d=true) -> original 3D
 *       native curve intervals -> already reviewed M4 [0,1] source cuts.
 *
 * The received paper segments have exact DYADIC-rational source parameters.
 * Compare them with the native 3D original parameter partition without
 * rounding inverse t to Number, snapping 1 ULP, or inventing TopoDS IsSame.
 * This is a necessary source/class consistency check, NOT complete generated
 * 2D HLR TopoDS lineage, all-scene M5 visibility, GB strokes or official V5.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {dyadic,difference,product,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const {auditExactBinary64PaperParameterPair}=
 require('./c1-exact-binary64-paper-parameter.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const valid=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
const sub=(a,b)=>difference(a,b);
const eq=(a,b)=>sign(sub(a,b))===0;
const rat=(n,d)=>{
 if(sign(d)===0)throw new RangeError('zero projected original source axis');
 // Shift dyadics to exact integer numerator/denominator; no floating ratio.
 const e=Math.min(n.e,d.e);
 let x=n.n<<BigInt(n.e-e),y=d.n<<BigInt(d.e-e);
 if(y<0n){x=-x;y=-y;}
 // Canonical rational strings are used in evidence and exact test
 // fixtures: 1/2 must not depend on the 53-bit dyadic mantissa size.
 let m=x<0n?-x:x,k=y;
 while(k!==0n){const r=m%k;m=k;k=r;}
 return {n:x/m,d:y/m};
};
const compare=(a,b)=>a.n*b.d<b.n*a.d?-1:a.n*b.d>b.n*a.d?1:0;
const low=(a,b)=>compare(a,b)<=0?a:b;
const high=(a,b)=>compare(a,b)>=0?a:b;
const printable=x=>x.d===1n?String(x.n):String(x.n)+'/'+String(x.d);
const zero={n:0n,d:1n},one={n:1n,d:1n};
// A *necessary* native output rounding compatibility witness, not a
// second paper inversion or an authorization to snap original t=0/1.
// Native output rounding is checked INDEPENDENTLY per u/v axis: a large
// v coordinate cannot lend its broader binary64 ULP to a small u endpoint.
// Each axis is additionally capped by 1e-6 of the 2D projected source
// length. This is unsigned compatibility, never a TopoDS history certificate.
const ulpBits=new DataView(new ArrayBuffer(8));
const ulpAtPositiveScale=x=>{
 if(!(x>=1)&&!(x>0)||!Number.isFinite(x))
  throw new TypeError('positive finite binary64 source scale required');
 ulpBits.setFloat64(0,x,false);
 const exponent=(ulpBits.getUint32(0,false)>>>20)&0x7ff;
 return exponent<=1?Number.MIN_VALUE:2**(exponent-1023-52);
};
function boundedOriginalFullPaperEndpointEnvelope(a,b,from,to){
 // Finite original/projected coordinates can have a real positive span
 // whose binary64 hypot OVERFLOWS to Infinity (e.g. -MAX to +MAX).
 // That must not erase a genuine native IsSame endpoint witness. For
 // overflowed spans the per-axis source-coordinate ULP remains the bound;
 // Infinity is NEVER accepted as an input paper coordinate.
 if(![a,b,from,to].every(valid))return {
  compatible:false,absolutePaperEnvelopeMm:0,
  exactClosedOriginalEndpointGeometryCertified:false};
 const length=Math.hypot(b.u-a.u,b.v-a.v);
 if(!(length>0))
  return {compatible:false,absolutePaperEnvelopeMm:0,
   exactClosedOriginalEndpointGeometryCertified:false};
 const axisBudget=axis=>Math.min(
  // Do not inflate a sub-unit projected coordinate to 1 mm: that can
  // admit many thousands of true binary64 ULPs for a tiny source edge.
  // An axis with both original endpoints exactly zero has only the
  // smallest positive binary64 spacing as its conservative envelope.
  ulpAtPositiveScale(Math.max(Number.MIN_VALUE,
   Math.abs(a[axis]),Math.abs(b[axis]))),
  length*1e-6);
 const uBudget=axisBudget('u'),vBudget=axisBudget('v');
 if(!(uBudget>0)||!(vBudget>0))
  return {compatible:false,absolutePaperEnvelopeMm:0,
   originalPaperAxisOneULPEnvelopesMm:{u:0,v:0},
   exactClosedOriginalEndpointGeometryCertified:false};
 const close=(p,q)=>Math.abs(p.u-q.u)<=uBudget&&
  Math.abs(p.v-q.v)<=vBudget;
 return {
  compatible:close(from,a)&&close(to,b)||close(from,b)&&close(to,a),
  // This legacy scalar is descriptive only. Both independent axis
  // budgets must pass; neither may be borrowed from the other axis.
  absolutePaperEnvelopeMm:Math.max(uBudget,vBudget),
  originalPaperAxisOneULPEnvelopesMm:{u:uBudget,v:vBudget},
  exactClosedOriginalEndpointGeometryCertified:false,
  sourceScopedHLRWithinOneScaleULPIsNotOriginalParameterIdentity:true
 };
}
function auditC1RealNativeScoped2D3DClassBinding({
 view,sourceEdgeId,sourceProjectedFrom,sourceProjectedTo,
 scoped2DVisible,scoped2DHidden,nativeOriginal3DM4,
 expectedSourceGeometryId,expectedRevision
}={}){
 if(!VIEWS.includes(view)||typeof sourceEdgeId!=='string'||!sourceEdgeId||
    !valid(sourceProjectedFrom)||!valid(sourceProjectedTo)||
    !Array.isArray(scoped2DVisible)||!Array.isArray(scoped2DHidden)||
    scoped2DVisible.length+scoped2DHidden.length>512||
    nativeOriginal3DM4?.schema!==
     'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2'||
    nativeOriginal3DM4.view!==view||
    nativeOriginal3DM4.sourceEdgeId!==sourceEdgeId||
    // Production joins must bind the 2D/3D witnesses to the same M0
    // geometry and CAD revision; matching paper and source IDs alone
    // cannot make a stale M4 partition current.
    (expectedSourceGeometryId!==undefined&&
     (typeof expectedSourceGeometryId!=='string'||
      nativeOriginal3DM4.sourceGeometryId!==expectedSourceGeometryId||
      !sourceEdgeId.startsWith(expectedSourceGeometryId+'::')))||
    (expectedRevision!==undefined&&
     (!Number.isSafeInteger(expectedRevision)||expectedRevision<1||
      nativeOriginal3DM4.revision!==expectedRevision))||
    !Array.isArray(nativeOriginal3DM4.segments)||
    !Array.isArray(nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation)||
    nativeOriginal3DM4.officialV5Authorized!==false)
  throw new TypeError('current genuine source-filtered 2D and original-3D native HLR needed');
 // The original OCCT native parameter partition is authoritative. Two
 // distinct native endpoints can round to the SAME M4 fraction, hiding a
 // genuine positive-length gap even when the M4 [0,1] union looks complete.
 // A generated 2D class witness must never borrow that false completeness.
 const reportedNativePartitionProven=
  nativeOriginal3DM4.native3DSourceParameterPartitionCompleteExactlyOnce===true&&
  nativeOriginal3DM4.M4OriginalUnitIntervalCandidateCoverageComplete===true&&
  Array.isArray(nativeOriginal3DM4.native3DOriginalParameterPositiveGaps)&&
  nativeOriginal3DM4.native3DOriginalParameterPositiveGaps.length===0&&
  Array.isArray(nativeOriginal3DM4.native3DOriginalParameterPositiveOverlaps)&&
  nativeOriginal3DM4.native3DOriginalParameterPositiveOverlaps.length===0&&
  nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation.length===0;
 const a=sourceProjectedFrom,b=sourceProjectedTo;
 // Use the shared M0 exact binary64 dominant-axis witness. Two finite
 // source spans can BOTH overflow Number subtraction to Infinity; selecting
 // u on that tie silently computes the wrong source t and may hide a real
 // positive original-source paper gap. No approximate span ranking here.
 const axis=auditExactBinary64PaperParameterPair({
  sourceFrom:a,sourceTo:b,measuredFrom:a,measuredTo:b
 }).dominantOriginalProjectionAxis;
 const denominator=sub(dyadic(b[axis]),dyadic(a[axis]));
 if(sign(denominator)===0)
  throw new RangeError('collapsed original M0 source paper line');
 const m4=nativeOriginal3DM4.segments.map(seg=>{
  if(seg.view!==view||seg.sourceEdgeId!==sourceEdgeId||
     !['visible-sharp','hidden-sharp'].includes(seg.native3DHLRClass)||
     seg.derivedFromOriginalNative3DCurveNotGeneratedHLRPaper!==true||
     seg.engineeringLineStyle!=='undetermined'||seg.signedV5Action!==false||
     !Array.isArray(seg.originalM0UnitParameterRange)||
     seg.originalM0UnitParameterRange.length!==2)
   throw new RangeError('invalid native 3D M4 source class or source ownership');
  const [s,t]=seg.originalM0UnitParameterRange;
  if(![s,t].every(Number.isFinite)||s<0||!(t>s)||t>1)
   throw new RangeError('invalid positive original native 3D M4 interval');
  return {klass:seg.native3DHLRClass,
   from:rat(dyadic(s),dyadic(1)),to:rat(dyadic(t),dyadic(1))};
 });
 // Independently replay the M4 physical-source partition in exact dyadic
 // rational space. A producer's boolean "complete" is not proof that its
 // received segment inventory covers [0,1] exactly once. In particular a
 // short 2D output may be fully covered by a forged half-edge M4 inventory.
 // Keep the native original-parameter proof as an additional independent gate.
 const orderedM4=[...m4].sort((a,b)=>
  compare(a.from,b.from)||compare(a.to,b.to));
 let m4Reach=zero,exactM4SourcePartitionComplete=true;
 for(const interval of orderedM4){
  if(compare(interval.from,m4Reach)!==0){
   exactM4SourcePartitionComplete=false;break;
  }
  m4Reach=interval.to;
 }
 if(compare(m4Reach,one)!==0)exactM4SourcePartitionComplete=false;
 const nativePartitionProven=
  reportedNativePartitionProven&&exactM4SourcePartitionComplete;
 const receivedSourcePaperSpans=[];
 const rows=[],counts={scoped2DGeneratedEdgesChecked:0,
  exact2DSourcePaperAffineAligned:0,
  exactSameClassNative3DBackedEdges:0,
  exactOppositeClassPositiveOverlapEdges:0,
  positiveNative3DClassCoverageGapsFor2DEdges:0,
  exactPaperOutOfOriginalParameterDomain:0,
  paperDriftOrClassCoverageHeld:0,
  originalFullEdgeOneULPPaperEnvelopeCompatible:0,
  exactNative3DWholeSourceSameClassForBoundedPaper:0,
  roundedPaperRepresentationCompatibleButNotExactCertified:0,
  positiveGenerated2DSourceParameterOverlapPairs:0,
  generated2DEdgesHeldForSourceParameterOverlap:0};
 const cross=(p)=>sub(product(sub(dyadic(b.u),dyadic(a.u)),
    sub(dyadic(p.v),dyadic(a.v))),
   product(sub(dyadic(b.v),dyadic(a.v)),
    sub(dyadic(p.u),dyadic(a.u))));
 for(const [klass,strokes] of [
  ['visible-sharp',scoped2DVisible],['hidden-sharp',scoped2DHidden]]){
  for(const stroke of strokes){
   if(stroke.view!==view||stroke.hlrClass!==klass||
      stroke.originalPhysicalSourceEdgeId!==sourceEdgeId||
      !valid(stroke.from)||!valid(stroke.to)||
      stroke.signedV5Action!==false||
      stroke.engineeringLineStyle!=='undetermined')
    throw new RangeError('forged native source-scoped 2D class witness');
   const p=rat(sub(dyadic(stroke.from[axis]),dyadic(a[axis])),denominator),
    q=rat(sub(dyadic(stroke.to[axis]),dyadic(a[axis])),denominator);
   const from=low(p,q),to=high(p,q);
   const aligned=sign(cross(stroke.from))===0&&
    sign(cross(stroke.to))===0;
   const bounded=compare(from,zero)>=0&&compare(to,one)<=0;
   const positive=compare(from,to)<0;
   // Union of actual native3D source-class intervals must cover every
   // RECEIVED rational paper point of this specific scoped 2D line.
   // Check each positive micro-gap exactly, even below Number.MIN_VALUE.
   const same=m4.filter(x=>x.klass===klass&&compare(x.to,from)>0&&
    compare(x.from,to)<0).map(x=>[high(x.from,from),low(x.to,to)])
    .sort((x,y)=>compare(x[0],y[0])||compare(x[1],y[1]));
   let cursor=from;
   const gaps=[];
   for(const [left,right] of same){
    if(compare(left,cursor)>0)gaps.push([cursor,left]);
    if(compare(right,cursor)>0)cursor=right;
   }
   if(compare(cursor,to)<0)gaps.push([cursor,to]);
   const opposite=m4.some(x=>x.klass!==klass&&
    compare(high(x.from,from),low(x.to,to))<0);
   const backed=nativePartitionProven&&positive&&bounded&&aligned&&
    gaps.length===0&&!opposite;
   const roundedEnvelope=boundedOriginalFullPaperEndpointEnvelope(
    a,b,stroke.from,stroke.to);
   const sameWhole=m4.filter(x=>x.klass===klass)
    .map(x=>[x.from,x.to])
    .sort((x,y)=>compare(x[0],y[0])||compare(x[1],y[1]));
   let wholeReach=zero;
   for(const [start,end] of sameWhole){
    if(compare(start,wholeReach)>0)break;
    if(compare(end,wholeReach)>0)wholeReach=end;
   }
   const native3DSameClassCoversWholeOriginalSource=
    nativePartitionProven&&compare(wholeReach,one)>=0&&
    nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation.length===0&&
    !m4.some(x=>x.klass!==klass);
   const boundedRepresentationConsistent=!backed&&positive&&
    roundedEnvelope.compatible&&
    native3DSameClassCoversWholeOriginalSource&&
    !opposite;
   counts.scoped2DGeneratedEdgesChecked++;
   counts.exact2DSourcePaperAffineAligned+=Number(aligned);
   counts.exactSameClassNative3DBackedEdges+=Number(backed);
   counts.exactOppositeClassPositiveOverlapEdges+=Number(opposite);
   counts.positiveNative3DClassCoverageGapsFor2DEdges+=Number(gaps.length>0);
   counts.exactPaperOutOfOriginalParameterDomain+=Number(!bounded);
   counts.paperDriftOrClassCoverageHeld+=Number(!backed);
   counts.originalFullEdgeOneULPPaperEnvelopeCompatible+=
    Number(roundedEnvelope.compatible);
   counts.exactNative3DWholeSourceSameClassForBoundedPaper+=
    Number(native3DSameClassCoversWholeOriginalSource);
   counts.roundedPaperRepresentationCompatibleButNotExactCertified+=
    Number(boundedRepresentationConsistent);
   rows.push({view,sourceEdgeId,hlrClass:klass,
    originalM0ExactRationalPaperInterval:[printable(from),printable(to)],
    exactOriginalM0PaperAffineCollinearity:aligned,
    exactReceived2DPaperWithinOriginalSourceDomain:bounded,
    exactPositive2DSourcePaperParameterSpan:positive,
    exactSameClassNative3DSourceIntervalCoverage:gaps.length===0,
    exactOppositeNative3DClassPositiveIntervalConflict:opposite,
    exactNative3DSourceClassPositivePaperCoverageGaps:
     gaps.map(([u,v])=>[printable(u),printable(v)]),
    nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment:backed,
    originalNativeParameterPartitionIndependentlyVerified:nativePartitionProven,
    originalNativeSourceScopedGenerated2DFullEdgeOneULPEnvelope:
     roundedEnvelope,
    native3DSameVisibilityClassExactlyCoversWholeOriginalSource:
     native3DSameClassCoversWholeOriginalSource,
    generated2DRepresentationWithinOneULPOfFullOriginalM0Source:
     boundedRepresentationConsistent,
    roundedPaperEnvelopeCannotReplaceExactM0SourceParameterCoverage:true,
    sourceFilteredExtractionDoesNotProveGlobalGenerated2DEdgeIsSame:true,
    actualGlobalHLRGenerated2DTopoDSHistoryCertified:false,
    entireOpaqueSceneVisibilityCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false,
    positiveGenerated2DSourceParameterOverlapWithAnotherEdge:false});
   receivedSourcePaperSpans.push({index:rows.length-1,from,to,positive});
  }
 }
 // A per-stroke class match does not prove the *received collection* is
 // one-to-one: two generated 2D edges can independently borrow the same
 // original physical parameter interval (including reversed duplicates).
 // Audit strict positive intersection in exact binary64 rational space.
 // Shared endpoints are valid; no epsilon or paper-space snapping is used.
 // This is a necessary source-scoped 2D condition, not global HLR lineage.
 const overlappingRows=new Set();
 for(let i=0;i<receivedSourcePaperSpans.length;i++){
  const left=receivedSourcePaperSpans[i];
  if(!left.positive)continue;
  for(let j=i+1;j<receivedSourcePaperSpans.length;j++){
   const right=receivedSourcePaperSpans[j];
   if(!right.positive)continue;
   if(compare(high(left.from,right.from),low(left.to,right.to))<0){
    counts.positiveGenerated2DSourceParameterOverlapPairs++;
    overlappingRows.add(left.index);
    overlappingRows.add(right.index);
   }
  }
 }
 counts.generated2DEdgesHeldForSourceParameterOverlap=overlappingRows.size;
 // A set of individually class-backed scoped HLR fragments need not cover
 // the WHOLE original physical source. Audit the exact rational [0,1]
 // union independently of the native M4 partition. Off-line, out-of-domain
 // or zero-length 2D strokes cannot fill a missing original-source interval.
 // This is a necessary 2D source coverage witness, never TopoDS ancestry.
 const sourcePaperIntervals=receivedSourcePaperSpans.filter(span=>{
  const row=rows[span.index];
  return span.positive&&row.exactOriginalM0PaperAffineCollinearity&&
   row.exactReceived2DPaperWithinOriginalSourceDomain;
 }).sort((a,b)=>compare(a.from,b.from)||compare(a.to,b.to));
 const sourcePaperGaps=[];
 let sourcePaperReach=zero;
 for(const span of sourcePaperIntervals){
  if(compare(span.from,sourcePaperReach)>0)
   sourcePaperGaps.push([sourcePaperReach,span.from]);
  if(compare(span.to,sourcePaperReach)>0)sourcePaperReach=span.to;
 }
 if(compare(sourcePaperReach,one)<0)
  sourcePaperGaps.push([sourcePaperReach,one]);
 const sourcePaperFullExactlyOnce=sourcePaperGaps.length===0&&
  overlappingRows.size===0&&sourcePaperIntervals.length===rows.length;
 counts.positiveGenerated2DSourceParameterGapCount=sourcePaperGaps.length;
 for(const index of overlappingRows){
  const row=rows[index];
  row.positiveGenerated2DSourceParameterOverlapWithAnotherEdge=true;
  if(row.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment){
   row.nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment=false;
   counts.exactSameClassNative3DBackedEdges--;
   counts.paperDriftOrClassCoverageHeld++;
  }
  if(row.generated2DRepresentationWithinOneULPOfFullOriginalM0Source){
   row.generated2DRepresentationWithinOneULPOfFullOriginalM0Source=false;
   counts.roundedPaperRepresentationCompatibleButNotExactCertified--;
  }
 }
 return freeze({
  schema:'draftai-c1-native-2d-generated-to-original-3d-source-class-consistency/1',
  view,sourceEdgeId,counts,rows,
  sourceScoped2DGeneratedPaperPositiveOverlapPresent:overlappingRows.size>0,
  sourceScoped2DGeneratedPaperPositiveOriginalSourceGaps:
   sourcePaperGaps.map(([a,b])=>[printable(a),printable(b)]),
  sourceScoped2DGeneratedPaperFullOriginalParameterCoverageExact:
   sourcePaperFullExactlyOnce,
  sourceScoped2DGeneratedPaperCoverageCannotCertifyGeneratedTopoDSHistory:true,
  originalNativeParameterPartitionIndependentlyVerified:nativePartitionProven,
  genuineOriginalNative3DParametersMayBeHeldByBinary64:
   nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation.length>0,
  sourceScoped2DClassBoundWithoutRounding:
   counts.scoped2DGeneratedEdgesChecked>0&&counts.paperDriftOrClassCoverageHeld===0&&
   !nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation.length,
  native2DAnd3DSourceClassHasBoundedRoundoffOnlyForHeldRows:
   counts.paperDriftOrClassCoverageHeld>0&&
   counts.paperDriftOrClassCoverageHeld===
    counts.roundedPaperRepresentationCompatibleButNotExactCertified,
  boundedOneULPPaperWitnessNeverClosesExactSourceOrM5Gaps:true,
  globalGenerated2DEdgeToOriginalTopoDSIdentityCertified:false,
  originalSource3DClosedEndpointTopologyCertified:false,
  wholeSceneM5Certified:false,officialV5Authorized:false
 });
}
module.exports={auditC1RealNativeScoped2D3DClassBinding,
 boundedOriginalFullPaperEndpointEnvelope};
