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
const frozen=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const value of Object.values(x))frozen(value);
  Object.freeze(x);
 }
 return x;
};
const validPaper=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
const relation=(a,b)=>sign(difference(dyadic(a),dyadic(b)));
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
 const endpoints=[];
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
    endpoints.push({
     hlrClass:klass,generatedHLREdgeOrdinal:ordinal,
     generatedHLREndpointSide:side===0?'from':'to',
     nativeGeneratedPaperPoint:{...paper},
     paperDerivedUnclampedOriginalSourceParameter:raw[side],
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
   directNativeOriginalVertexIsSameEndpointCount:vertexId===null?0:
    endpoints.filter(e=>e.directNativeIsSameOriginalM0VertexId===vertexId).length,
   directNativeOriginalVertexIsSameAtPaperParameterCount:vertexId===null?0:
    endpoints.filter(e=>e.directNativeIsSameOriginalM0VertexId===vertexId&&
     relation(e.paperDerivedUnclampedOriginalSourceParameter,t)===0).length,
   originalGeneratedTopoDSEdgeHistoryCertified:false
  });
  return {gapOrdinal:index,originalSourceParameterGap:[...gap],
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
  endpoints,rows,
  generatedToOriginalTopoDSFullHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1NativeGapGeneratedVertexAdjacency};
