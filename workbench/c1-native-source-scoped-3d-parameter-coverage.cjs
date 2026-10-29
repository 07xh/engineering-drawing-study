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

/**
 * Native source-filtered 3D HLR has a stronger class witness than a
 * co-projected whole-solid 2D edge: if the ORIGINAL source has no native
 * visible (or hidden) 3D interval in this view, a same-class paper alias
 * cannot be attributed to it. This is a NEGATIVE candidate veto only.
 * A surviving paper alias still lacks generated TopoDS identity, endpoint
 * adjacency, global occlusion and official V5 authorization.
 */
function auditC1Native3DClassPaperCandidateVeto({
 view,sourceEdgeId,scopedRow,paperCandidates
}={}){
 if(!['V','H','W'].includes(view)||
    typeof sourceEdgeId!=='string'||!sourceEdgeId||
    scopedRow?.originalPhysicalSourceEdgeId!==sourceEdgeId||
    !Array.isArray(paperCandidates)||paperCandidates.length>256)
  throw new TypeError('current original-source native 3D class and bounded paper candidates required');
 const classRanges={};
 for(const [klass,key] of [['visible-sharp','visible3D'],['hidden-sharp','hidden3D']]){
  const group=scopedRow[key];
  const intervals=group?.native3DGeneratedCurveIntervals;
  if(group?.nativeSourceFilteredOriginalTopoDSEdge!==true||
     !Array.isArray(intervals)||intervals.length>128||
     intervals.some(edge=>
      edge?.nativeSourceFilterOriginalEdgeId!==sourceEdgeId||
      edge.native3DCurveExactlySameAsOriginalAtThreeParameters!==true||
      edge.originalGeneratedTopoDSHistoryCertified!==false||
      edge.signedV5Action!==false||
      !Array.isArray(edge.nativeOriginalCurveParameterRange)||
      edge.nativeOriginalCurveParameterRange.length!==2||
      !edge.nativeOriginalCurveParameterRange.every(Number.isFinite)||
      !(edge.nativeOriginalCurveParameterRange[1]>
        edge.nativeOriginalCurveParameterRange[0])))
   throw new RangeError('unverified native original-source 3D visibility class');
  classRanges[klass]=intervals;
 }
 const retained=[],rejected=[],seen=new Set();
 for(const candidate of paperCandidates){
  const klass=candidate?.hlrClass,ordinal=candidate?.ordinal;
  if(!Object.hasOwn(classRanges,klass)||
     !Number.isSafeInteger(ordinal)||ordinal<0||
     seen.has(klass+'|'+ordinal))
   throw new RangeError('invalid or duplicate whole-solid HLR paper candidate');
  seen.add(klass+'|'+ordinal);
  const row={hlrClass:klass,ordinal};
  (classRanges[klass].length?retained:rejected).push(row);
 }
 return freeze({
  schema:'draftai-c1-native-3d-source-class-paper-candidate-veto/1',
  view,sourceEdgeId,
  nativeVisible3DSourceIntervalCount:classRanges['visible-sharp'].length,
  nativeHidden3DSourceIntervalCount:classRanges['hidden-sharp'].length,
  originalWholeSolidPaperCandidateCount:paperCandidates.length,
  native3DClassCompatiblePaperCandidates:retained,
  paperCandidatesExcludedByNative3DClassAbsence:rejected,
  native3DClassVetoIsNotGenerated2DTopoDSIdentity:true,
  fullOriginalSourceHistoryCertified:false,
  globalContinuousVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}

module.exports={auditC1Native3DSourceScopedIntervals,
 auditC1Native3DClassPaperCandidateVeto};
