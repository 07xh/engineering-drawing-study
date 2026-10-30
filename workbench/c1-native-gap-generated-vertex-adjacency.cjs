'use strict';
/**
 * Unsigned real-HLR endpoint inventory for positive ORIGINAL 3D source gaps.
 * Compare native generated TopoDS vertex IsSame witnesses to original M0
 * vertices separately from paper-derived inverse source parameters.
 * A paper endpoint at t=0 is NOT a native original-vertex identity.
 * No generated edge history, occlusion or V5 authority is inferred.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {dyadic,difference,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const {auditC1RoundedInversePaperBoundaryAlias}=
 require('./c1-rounded-inverse-paper-boundary-alias.cjs');
const {auditC1ExactBinary64PaperAffineWitness}=
 require('./c1-exact-binary64-paper-affine.cjs');
const frozen=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const value of Object.values(x))frozen(value);
  Object.freeze(x);
 }
 return x;
};
const validPaper=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
const relation=(a,b)=>sign(difference(dyadic(a),dyadic(b)));
// The actual RECEIVED HLR paper coordinate can have a strictly positive
// rational inverse t even when binary64 division rounded its candidate to 0.
// This is a dominant-axis PAPER diagnostic, not a native TopoDS edge history.
const gcd=(a,b)=>{a=a<0n?-a:a;while(b!==0n){const r=a%b;a=b;b=r;}return a;};
const asRatio=value=>{
 const {n,e}=dyadic(value);
 const ratio=e>=0?{n:n<<BigInt(e),d:1n}:
  {n,d:1n<<BigInt(-e)};
 const factor=gcd(ratio.n,ratio.d);
 return {n:ratio.n/factor,d:ratio.d/factor};
};
const compareRatio=(a,b)=>sign({n:a.n*b.d-b.n*a.d});
const printRatio=r=>r.d===1n?String(r.n):String(r.n)+'/'+String(r.d);
const paperParameterRatio=(paper,a,b)=>{
 // Ordinary binary64 subtraction can overflow BOTH projected spans to
 // Infinity and silently pick u even when |dv|>|du|. Choose the dominant
 // axis using the exact M0 dyadic differences, without a tolerance.
 const du=difference(dyadic(b.u),dyadic(a.u));
 const dv=difference(dyadic(b.v),dyadic(a.v));
 const magnitude=x=>({n:x.n<0n?-x.n:x.n,e:x.e});
 const axis=sign(difference(magnitude(du),magnitude(dv)))>=0?'u':'v';
 const origin=dyadic(a[axis]),delta=difference(dyadic(b[axis]),origin);
 if(sign(delta)===0)return null; // Source projection collapses in this view.
 const offset=difference(dyadic(paper[axis]),origin);
 const e=Math.min(offset.e,delta.e);
 let n=offset.n<<BigInt(offset.e-e),d=delta.n<<BigInt(delta.e-e);
 if(d<0n){n=-n;d=-d;}
 const factor=gcd(n,d);
 return {n:n/factor,d:d/factor};
};
function auditC1NativeGapGeneratedVertexAdjacency({
 geometry,view,sourceEdgeId,uncoveredIntervals,visibleSegments,hiddenSegments
}={}){
 if(!geometry?.data?.points||!Array.isArray(geometry.data.edges)||
    typeof geometry.id!=='string'||!geometry.id||
    !VIEWS.includes(view)||typeof sourceEdgeId!=='string'||
    !Array.isArray(uncoveredIntervals)||uncoveredIntervals.length>128||
    !Array.isArray(visibleSegments)||!Array.isArray(hiddenSegments)||
    visibleSegments.length>128||hiddenSegments.length>128)
  throw new TypeError('bounded real C1 generated HLR endpoint inventory required');
 const matches=geometry.data.edges.filter(edge=>
  Array.isArray(edge)&&edge.length===2&&edge[0]!==edge[1]&&
  edge.every(id=>typeof id==='string'&&Object.hasOwn(geometry.data.points,id))&&
  geometry.id+'::'+[...edge].sort().join('|')===sourceEdgeId);
 if(matches.length!==1)throw new RangeError('unique original M0 source edge required');
 const vertexIds=matches[0];
 const originalPaperEndpoints=vertexIds.map(id=>
  project(geometry.data.points[id])[view]);
 const endpoints=[],exactReceivedPaperParameters=[];
 for(const [klass,segments] of [['visible-sharp',visibleSegments],
                                 ['hidden-sharp',hiddenSegments]]){
  for(const [ordinal,segment] of segments.entries()){
   const lifts=segment?.sourceCandidate3DLifts;
   if(!Array.isArray(lifts)||lifts.length>128)
    throw new TypeError('actual generated HLR 3D source candidates required');
   const candidates=lifts.filter(lift=>lift?.sourceEdgeId===sourceEdgeId);
   if(candidates.length>1)throw new RangeError('duplicate generated HLR source candidate');
   if(!candidates.length)continue;
   const lift=candidates[0],native=segment.directNativeVertexOriginalSource,
    raw=lift.paperOnlyUnclampedOriginalSourceParameters;
   if(segment.view!==view||segment.occtHLRVisibilityClass!==klass||
      !validPaper(segment.from)||!validPaper(segment.to)||
      !Array.isArray(raw)||raw.length!==2||
      !raw.every(Number.isFinite)||
      !Array.isArray(lift.originalVertexIds)||
      lift.originalVertexIds.length!==2||
      lift.originalVertexIds.some((id,i)=>id!==vertexIds[i])||
      !Array.isArray(native)||native.length!==2||
      typeof segment.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven!=='boolean')
    throw new TypeError('invalid real HLR generated endpoint provenance');
   // A rounded inverse t=0 is only a paper candidate. A literal original
   // vertex paper point must be checked separately, even when a generated
   // HLR TopoDS vertex lacks direct original M0 IsSame.
   const withinRaw=raw.every(t=>t>=0&&t<=1);
   const boundaryAlias=withinRaw?
    auditC1RoundedInversePaperBoundaryAlias({
     sourceFrom:originalPaperEndpoints[0],
     sourceTo:originalPaperEndpoints[1],
     measuredFrom:segment.from,measuredTo:segment.to,
     roundedInverseParameters:raw
    }):null;
   // A dominant-axis rational parameter is not a point-on-line proof.
   // Reuse the independent M0 exact cross-axis affine predicate; do not
   // count transverse drift as a physically collinear source endpoint.
   const sourceCollapsed=originalPaperEndpoints[0].u===originalPaperEndpoints[1].u&&
    originalPaperEndpoints[0].v===originalPaperEndpoints[1].v;
   const affine=sourceCollapsed?null:auditC1ExactBinary64PaperAffineWitness({
    sourceFrom:originalPaperEndpoints[0],sourceTo:originalPaperEndpoints[1],
    measuredFrom:segment.from,measuredTo:segment.to
   });
   for(let side=0;side<2;side++){
    const paper=side===0?segment.from:segment.to,
     proof=native[side],id=proof?.directlySameOriginalM0VertexId;
    if(typeof proof?.directOriginal3DVertexTopoDSIdentityProven!=='boolean'||
       (proof.directOriginal3DVertexTopoDSIdentityProven!==(id!==null)))
     throw new RangeError('inconsistent generated native TopoDS vertex identity');
    if(id!==null){
     const original=geometry.data.points[id];
     if(typeof id!=='string'||!original||
        !['x','y','z'].every(k=>Number.isFinite(original[k])))
      throw new RangeError('generated native vertex not bound to original M0');
     const expected=project(original)[view];
     if(expected.u!==paper.u||expected.v!==paper.v)
      throw new RangeError('native original vertex IsSame contradicts first-angle paper point');
    }
    const exactPaper=paperParameterRatio(paper,
     originalPaperEndpoints[0],originalPaperEndpoints[1]);
    const collinear=affine===null?null:side===0?
     affine.nativeFromExactlyOnOriginalBinary64PaperLine:
     affine.nativeToExactlyOnOriginalBinary64PaperLine;
    exactReceivedPaperParameters.push({parameter:exactPaper,collinear});
    endpoints.push({
     exactReceivedPaperOnOriginalProjectedLine:collinear,
     exactReceivedPaperDominantAxisOriginalSourceParameter:
      exactPaper===null?null:printRatio(exactPaper),
     exactReceivedPaperParameterWithinOriginalDomain:
      exactPaper===null?null:
      compareRatio(exactPaper,asRatio(0))>=0&&
      compareRatio(exactPaper,asRatio(1))<=0,
     roundedInverseDiffersFromExactReceivedPaperParameter:
      exactPaper===null?null:
      compareRatio(exactPaper,asRatio(raw[side]))!==0,
     hlrClass:klass,generatedHLREdgeOrdinal:ordinal,
     generatedHLREndpointSide:side===0?'from':'to',
     nativeGeneratedPaperPoint:{...paper},
     paperDerivedUnclampedOriginalSourceParameter:raw[side],
     paperInverseOriginalBoundaryWithinDomain:withinRaw,
     receivedPaperExactlyAtOriginalSourceBoundary:
      boundaryAlias!==null&&
      (raw[side]===0||raw[side]===1)&&
      !boundaryAlias.rows[side].roundedInverseAliasesDifferentReceivedPaperPoint,
     receivedPaperRoundedInverseOriginalBoundaryAlias:
      boundaryAlias?.rows[side].
       roundedInverseAliasesDifferentReceivedPaperPoint??false,
     directNativeIsSameOriginalM0VertexId:id,
     directNativeIsSameOriginalSourceEndpoint:
      id!==null&&vertexIds.includes(id),
     nativeGeneratedEdgeDirectOriginalSourceIsSame:
      segment.actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven,
     originalTopoDSEdgeHistoryProven:false,
     engineeringLineStyle:'undetermined',signedV5Action:false
    });
   }
  }
 }
 // Compute the exact rational intersection between RECEIVED native HLR
 // paper candidates and each STILL-POSITIVE original M5 parameter gap.
 // Only segments with BOTH endpoints exactly on the original projected
 // M0 line and inside [0,1] enter this diagnostic. A rounded dominant
 // axis inverse alone is NOT a line-incidence or ownership proof.
 // Even complete paper-candidate coverage cannot replace generated
 // TopoDS source history, a closed ray, or a formal V5 line.
 const one=asRatio(1),zeroRatio=asRatio(0);
 const collinearPaperRanges=[];
 for(let i=0;i<exactReceivedPaperParameters.length;i+=2){
  const a=exactReceivedPaperParameters[i],
   b=exactReceivedPaperParameters[i+1];
  if(a.collinear!==true||b.collinear!==true||
     a.parameter===null||b.parameter===null||
     compareRatio(a.parameter,zeroRatio)<0||
     compareRatio(b.parameter,zeroRatio)<0||
     compareRatio(a.parameter,one)>0||
     compareRatio(b.parameter,one)>0||
     compareRatio(a.parameter,b.parameter)===0)continue;
  collinearPaperRanges.push(compareRatio(a.parameter,b.parameter)<0?
   [a.parameter,b.parameter]:[b.parameter,a.parameter]);
 }
 collinearPaperRanges.sort((a,b)=>
  compareRatio(a[0],b[0])||compareRatio(a[1],b[1]));
 const paperCandidateGapIntersection=(from,to)=>{
  let cursor=from;
  const seen=[],residual=[];
  for(const [a,b] of collinearPaperRanges){
   const left=compareRatio(a,from)<0?from:a,
    right=compareRatio(b,to)>0?to:b;
   if(compareRatio(left,right)>=0)continue;
   if(compareRatio(left,cursor)>0)
    residual.push([cursor,left]);
   if(compareRatio(right,cursor)>0){
    if(seen.length&&compareRatio(left,seen.at(-1)[1])<=0)
     seen.at(-1)[1]=right;
    else seen.push([compareRatio(left,cursor)<0?cursor:left,right]);
    cursor=right;
   }
  }
  if(compareRatio(cursor,to)<0)residual.push([cursor,to]);
  const serialize=parts=>parts.map(row=>row.map(printRatio));
  return {
   exactReceivedCollinearPaperCandidateSubrangesWithoutSourceHistory:serialize(seen),
   positiveRationalGapResidualAfterCollinearPaperCandidates:serialize(residual),
   originalPositiveM5GapRemainsUnclosedWithoutGeneratedTopoDSHistory:true
  };
 };
 let previous=0;
 const rows=uncoveredIntervals.map((gap,index)=>{
  if(!Array.isArray(gap)||gap.length!==2||
     !gap.every(x=>typeof x==='number'&&Number.isFinite(x))||
     gap[0]<0||gap[1]>1||!(gap[1]>gap[0])||
     (index>0&&gap[0]<previous))
   throw new RangeError('ordered positive original source gaps required');
  previous=gap[1];
  const boundary=(t,vertexId)=>({
   originalSourceParameter:t,
   originalM0VertexId:vertexId,
   nativeGeneratedPaperCandidateParameterEqualCount:endpoints.filter(e=>
    relation(e.paperDerivedUnclampedOriginalSourceParameter,t)===0).length,
   nativeGeneratedLiteralOriginalPaperBoundaryCount:vertexId===null?0:
    endpoints.filter(e=>
     relation(e.paperDerivedUnclampedOriginalSourceParameter,t)===0&&
     e.receivedPaperExactlyAtOriginalSourceBoundary).length,
   nativeGeneratedRoundedInverseOriginalBoundaryAliasCount:vertexId===null?0:
    endpoints.filter(e=>
     relation(e.paperDerivedUnclampedOriginalSourceParameter,t)===0&&
     e.receivedPaperRoundedInverseOriginalBoundaryAlias).length,
   directNativeOriginalVertexIsSameEndpointCount:vertexId===null?0:
    endpoints.filter(e=>e.directNativeIsSameOriginalM0VertexId===vertexId).length,
   directNativeOriginalVertexIsSameAtPaperParameterCount:vertexId===null?0:
    endpoints.filter(e=>e.directNativeIsSameOriginalM0VertexId===vertexId&&
     relation(e.paperDerivedUnclampedOriginalSourceParameter,t)===0).length,
   originalGeneratedTopoDSEdgeHistoryCertified:false
  });
  const fromExact=asRatio(gap[0]),toExact=asRatio(gap[1]);
  const strictlyInside=p=>p.parameter!==null&&
   compareRatio(p.parameter,fromExact)>0&&
   compareRatio(p.parameter,toExact)<0;
  const atFrom=p=>p.parameter!==null&&
   compareRatio(p.parameter,fromExact)===0;
  const atTo=p=>p.parameter!==null&&
   compareRatio(p.parameter,toExact)===0;
  return {gapOrdinal:index,originalSourceParameterGap:[...gap],
   ...paperCandidateGapIntersection(fromExact,toExact),
   // Strict rational comparisons, including paper tails smaller than the
   // smallest positive binary64 parameter. Candidate presence is not
   // coverage or source-history certification.
   exactReceivedPaperCandidateStrictlyInsideGapCount:
    exactReceivedPaperParameters.filter(strictlyInside).length,
   exactReceivedPaperCollinearCandidateStrictlyInsideGapCount:
    exactReceivedPaperParameters.filter(p=>strictlyInside(p)&&p.collinear===true).length,
   exactReceivedPaperOffLineCandidateStrictlyInsideGapCount:
    exactReceivedPaperParameters.filter(p=>strictlyInside(p)&&p.collinear===false).length,
   exactReceivedPaperCandidateAtGapFromCount:
    exactReceivedPaperParameters.filter(atFrom).length,
   exactReceivedPaperCollinearCandidateAtGapFromCount:
    exactReceivedPaperParameters.filter(p=>atFrom(p)&&p.collinear===true).length,
   exactReceivedPaperCandidateAtGapToCount:
    exactReceivedPaperParameters.filter(atTo).length,
   exactReceivedPaperCollinearCandidateAtGapToCount:
    exactReceivedPaperParameters.filter(p=>atTo(p)&&p.collinear===true).length,
   from:boundary(gap[0],gap[0]===0?vertexIds[0]:null),
   to:boundary(gap[1],gap[1]===1?vertexIds[1]:null),
   sourceGapClosedByNativeEndpointEvidence:false,
   engineeringLineStyle:'undetermined',signedV5Action:false};
 });
 return frozen({
  schema:'draftai-c1-real-native-gap-generated-vertex-adjacency/1',
  view,sourceEdgeId,originalSourceVertexIds:[...vertexIds],
  actualNativeGeneratedSourceCandidateEndpointCount:endpoints.length,
  actualNativeDirectIsSameOriginalSourceVertexEndpoints:endpoints.filter(x=>
   x.directNativeIsSameOriginalSourceEndpoint).length,
  actualNativeRoundedInverseOriginalBoundaryAliasEndpoints:endpoints.filter(x=>
   x.receivedPaperRoundedInverseOriginalBoundaryAlias).length,
  endpoints,rows,
  exactReceivedPaperSegmentsWithBothEndpointsCollinearAndInOriginalDomain:
   collinearPaperRanges.length,
  positiveOriginalM5GapsWithPartiallyCorroboratedExactCollinearPaperCandidates:
   rows.filter(r=>r.exactReceivedCollinearPaperCandidateSubrangesWithoutSourceHistory.length>0).length,
  positiveOriginalM5GapsWithExactCollinearPaperCandidateOnlyFullCoverage:
   rows.filter(r=>r.positiveRationalGapResidualAfterCollinearPaperCandidates.length===0).length,
  actualNativeExactReceivedPaperOffLineEndpoints:
   endpoints.filter(x=>x.exactReceivedPaperOnOriginalProjectedLine===false).length,
  roundedInverseDisagreesWithExactReceivedPaperParameterCount:
   endpoints.filter(x=>
    x.roundedInverseDiffersFromExactReceivedPaperParameter===true).length,
  generatedToOriginalTopoDSFullHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1NativeGapGeneratedVertexAdjacency};
