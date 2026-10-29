'use strict';
/**
 * Exact ordering of RECEIVED OCCT binary64 native 3D BRep curve parameters.
 * This consumes source-scoped HLRBRep_HLRToShape.CompoundOfEdges(S,Sharp,
 * visible,In3d=true) intervals, NOT 2D projected V/H/W endpoint inverses.
 *
 * OCCT source filtering supplies a candidate original edge association;
 * only the native 3D curve/parameter ledger can prove its parameter union.
 * No tolerance can erase a positive binary64 gap, and this audit alone
 * never signs a generated-edge/global-occlusion/V5 certificate.
 */
function freeze(x){
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }
 return x;
}
function auditC1Native3DSourceScopedIntervals({
 originalNativeParameterRange,generatedNativeParameterRanges
}={}){
 const valid=range=>Array.isArray(range)&&range.length===2&&
  range.every(Number.isFinite)&&range[1]>range[0];
 if(!valid(originalNativeParameterRange)||
    !Array.isArray(generatedNativeParameterRanges)||
    generatedNativeParameterRanges.length>512)
  throw new TypeError('bounded original native 3D curve parameter range and HLR intervals required');
 const [start,end]=originalNativeParameterRange;
 const sorted=generatedNativeParameterRanges.map(range=>{
  if(!valid(range)||range[0]<start||range[1]>end)
   throw new RangeError('source-scoped HLR 3D interval outside original native curve parameter domain');
  return [...range];
 }).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const gaps=[],overlaps=[];let reach=start;
 for(const [a,b] of sorted){
  if(a>reach)gaps.push([reach,a]);
  if(a<reach&&Math.min(reach,b)>a)
   overlaps.push([a,Math.min(reach,b)]);
  if(b>reach)reach=b;
 }
 if(reach<end)gaps.push([reach,end]);
 // Merge overlapping witness fragments, retaining positive length only.
 const merge=parts=>{
  const out=[];
  for(const [a,b] of parts.sort((x,y)=>x[0]-y[0]||x[1]-y[1])){
   if(out.length&&a<=out.at(-1)[1])
    out.at(-1)[1]=Math.max(out.at(-1)[1],b);
   else out.push([a,b]);
  }
  return out;
 };
 const joined=merge(overlaps);
 return freeze({
  schema:'draftai-c1-native-source-scoped-3d-curve-parameter-coverage/1',
  originalNativeParameterRange:[start,end],
  generatedNativeParameterRanges:sorted,
  positiveLengthUncoveredNativeParameterIntervals:gaps,
  positiveLengthOverlappingNativeParameterIntervals:joined,
  sourceScopedNative3DParameterInventoryCompleteExactlyOnce:
   gaps.length===0&&joined.length===0,
  originalGeneratedTopoDSHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
module.exports={auditC1Native3DSourceScopedIntervals};
