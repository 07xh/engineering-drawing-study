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
// One binary64 ULP at the original edge's GLOBAL source-paper magnitude
// is bounded by 1e-6 of the projected edge length: a tiny original edge
// may never borrow an unrelated point only because its absolute XYZ is
// huge. The source-scoped TopoDS HLR filter is independently verified.
const ulpBits=new DataView(new ArrayBuffer(8));
const ulpAtPositiveScale=x=>{
 if(!(x>=1)&&!(x>0)||!Number.isFinite(x))
  throw new TypeError('positive finite binary64 source scale required');
 ulpBits.setFloat64(0,x,false);
 const exponent=(ulpBits.getUint32(0,false)>>>20)&0x7ff;
 return exponent<=1?Number.MIN_VALUE:2**(exponent-1023-52);
};
function boundedOriginalFullPaperEndpointEnvelope(a,b,from,to){
 const length=Math.hypot(b.u-a.u,b.v-a.v);
 if(!(length>0)||!Number.isFinite(length))
  return {compatible:false,absolutePaperEnvelopeMm:0,
   exactClosedOriginalEndpointGeometryCertified:false};
 const magnitude=Math.max(1,Math.abs(a.u),Math.abs(a.v),
  Math.abs(b.u),Math.abs(b.v));
 const budget=Math.min(ulpAtPositiveScale(magnitude),length*1e-6);
 if(!(budget>0))
  return {compatible:false,absolutePaperEnvelopeMm:0,
   exactClosedOriginalEndpointGeometryCertified:false};
 const close=(p,q)=>Math.abs(p.u-q.u)<=budget&&
  Math.abs(p.v-q.v)<=budget;
 return {
  compatible:close(from,a)&&close(to,b)||close(from,b)&&close(to,a),
  absolutePaperEnvelopeMm:budget,
  exactClosedOriginalEndpointGeometryCertified:false,
  sourceScopedHLRWithinOneScaleULPIsNotOriginalParameterIdentity:true
 };
}
function auditC1RealNativeScoped2D3DClassBinding({
 view,sourceEdgeId,sourceProjectedFrom,sourceProjectedTo,
 scoped2DVisible,scoped2DHidden,nativeOriginal3DM4
}={}){
 if(!VIEWS.includes(view)||typeof sourceEdgeId!=='string'||!sourceEdgeId||
    !valid(sourceProjectedFrom)||!valid(sourceProjectedTo)||
    !Array.isArray(scoped2DVisible)||!Array.isArray(scoped2DHidden)||
    scoped2DVisible.length+scoped2DHidden.length>512||
    nativeOriginal3DM4?.schema!==
     'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1'||
    nativeOriginal3DM4.view!==view||
    nativeOriginal3DM4.sourceEdgeId!==sourceEdgeId||
    !Array.isArray(nativeOriginal3DM4.segments)||
    !Array.isArray(nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation)||
    nativeOriginal3DM4.officialV5Authorized!==false)
  throw new TypeError('current genuine source-filtered 2D and original-3D native HLR needed');
 // The original OCCT native parameter partition is authoritative. Two
 // distinct native endpoints can round to the SAME M4 fraction, hiding a
 // genuine positive-length gap even when the M4 [0,1] union looks complete.
 // A generated 2D class witness must never borrow that false completeness.
 const nativePartitionProven=
  nativeOriginal3DM4.native3DSourceParameterPartitionCompleteExactlyOnce===true&&
  nativeOriginal3DM4.M4OriginalUnitIntervalCandidateCoverageComplete===true&&
  Array.isArray(nativeOriginal3DM4.native3DOriginalParameterPositiveGaps)&&
  nativeOriginal3DM4.native3DOriginalParameterPositiveGaps.length===0&&
  Array.isArray(nativeOriginal3DM4.native3DOriginalParameterPositiveOverlaps)&&
  nativeOriginal3DM4.native3DOriginalParameterPositiveOverlaps.length===0&&
  nativeOriginal3DM4.M4ProjectedNative3DIntervalsHeldForBinary64Representation.length===0;
 const a=sourceProjectedFrom,b=sourceProjectedTo;
 const axis=Math.abs(b.u-a.u)>=Math.abs(b.v-a.v)?'u':'v',
  denominator=sub(dyadic(b[axis]),dyadic(a[axis]));
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
 const rows=[],counts={scoped2DGeneratedEdgesChecked:0,
  exact2DSourcePaperAffineAligned:0,
  exactSameClassNative3DBackedEdges:0,
  exactOppositeClassPositiveOverlapEdges:0,
  positiveNative3DClassCoverageGapsFor2DEdges:0,
  exactPaperOutOfOriginalParameterDomain:0,
  paperDriftOrClassCoverageHeld:0,
  originalFullEdgeOneULPPaperEnvelopeCompatible:0,
  exactNative3DWholeSourceSameClassForBoundedPaper:0,
  roundedPaperRepresentationCompatibleButNotExactCertified:0};
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
    // Preserve the exact received generated 2D edge for the downstream
    // global HLR ordinal join. A same-class witness for a DIFFERENT
    // scoped emission must never be reused to certify this one.
    nativeScopedReceivedPaperFrom:{u:stroke.from.u,v:stroke.from.v},
    nativeScopedReceivedPaperTo:{u:stroke.to.u,v:stroke.to.v},
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
    engineeringLineStyle:'undetermined',signedV5Action:false});
  }
 }
 return freeze({
  schema:'draftai-c1-native-2d-generated-to-original-3d-source-class-consistency/1',
  view,sourceEdgeId,counts,rows,
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
