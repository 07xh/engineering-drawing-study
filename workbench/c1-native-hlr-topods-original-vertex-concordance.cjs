'use strict';
/**
 * A generated HLR native TopoDS vertex may connect two generated edges.
 * It is a GENUINE SOURCE 3D physical junction ONLY when independent
 * OCCT original BRep source geometry, original M0 closed face fan and
 * M5-pruned unique hidden 3D source endpoints agree on the SAME original
 * 3D vertex ID. Paper coincidence alone NEVER satisfies either test.
 *
 * Generated HLR TopoDS shape history to ORIGINAL TopoDS edge, whole
 * drawing topology, GB line style and ConstructionIntent/V5 stay unsigned.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
const equal=(p,q)=>p&&q&&p.u===q.u&&p.v===q.v;
function auditC1NativeHLRGeneratedToOriginalVertexConcordance({
 geometry,revision,cad,originalNativeVertexProof
}={}){
 const graph=cad?.nativeGeneratedVertexGraph;
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    cad.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||cad.v5Authorized!==false||
    graph?.schema!=='draftai-ocjs-genuine-hlr-generated-topods-issame-vertex-graph/1'||
    graph.realOCCTIsSameComparedBeforeNativeObjectDeletion!==true||
    graph.actualGeneratedToOriginalTopoDSHistoryRecovered!==false||
    graph.signedV5ActionCount!==0||
    originalNativeVertexProof?.sourceGeometryId!==geometry.id||
    originalNativeVertexProof.revision!==revision||
    originalNativeVertexProof.signedV5ActionCount!==0||
    !Array.isArray(originalNativeVertexProof.rows))
  throw new TypeError('real OCCT native graph and original 3D endpoint proof for same geometry/revision required');
 const base=new Map(),byGlobal=[];
 let global=0;
 for(const view of VIEWS){
  const visible=cad.views?.[view],hidden=cad.hiddenSharpViews?.[view],
   v=graph.views?.[view];
  if(!Array.isArray(visible)||!Array.isArray(hidden)||!v||
     v.view!==view||
     v.realNativeSharpEdgeCount!==visible.length+hidden.length||
     !Array.isArray(v.sameActualGeneratedOCCTTopoDSVertexPairs)||
     !Array.isArray(v.paperCoincidentButDifferentTopoDSVertexPairs))
   throw new RangeError('genuine V/H/W native graph incomplete');
  base.set(view,{visible,hidden,globalStart:global});
  for(let i=0;i<hidden.length;i++){
   const proof=originalNativeVertexProof.rows[global++];
   if(proof?.view!==view||proof.nativeHiddenSharpEdgeOrdinal!==global-1||
      proof.sourceGeometryId!==geometry.id||proof.revision!==revision||
      proof.OCCTGeneratedTopoDSNativeEdgeAdjacencyCertified!==false||
      proof.signedV5Action!==false)
    throw new RangeError('reordered or forged original physical hidden endpoint proof');
   byGlobal.push(proof);
  }
 }
 if(global!==originalNativeVertexProof.rows.length)
  throw new RangeError('incomplete hidden native endpoint proof count');
 const counts={actualNativeIsSamePairs:0,
  exactPaperCoincidentButDistinctNativeTopoDSPairsHeld:0,
  IsSameHiddenToHiddenNativeEndpointPairs:0,
  IsSameHiddenToHiddenMatchingOriginal3DPhysicalVertices:0,
  IsSameHLRNodesButOriginalSource3DVertexNotCertified:0,
  IsSameNativeVisibleAndHiddenSourceHistoryStillUnknown:0,
  distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs:0,
  paperCoincidentNativePairsWithoutIndependent3DPhysicalJunction:0,
  actualOriginal3DPhysicalSourceJunctionPairsVerified:0,
  generatedTopoDSEdgeOriginalSourceHistoryCertified:0,
  engineeringGBLineJunctionsSigned:0,signedV5Actions:0
 };
 const rows=[],aliases=[];
 function locate(ref,view){
  const v=base.get(view);
  if(!ref||!['visible-sharp','hidden-sharp'].includes(ref.hlrClass)||
     !['from','to'].includes(ref.side)||!Number.isSafeInteger(ref.nativeHLREdgeOrdinal))
   throw new RangeError('untrusted actual OCCT HLR vertex pair reference');
  const isHidden=ref.hlrClass==='hidden-sharp',
   list=isHidden?v.hidden:v.visible;
  const seg=list[ref.nativeHLREdgeOrdinal];
  const point=ref.side==='from'?seg?.from:seg?.to;
  if(!seg||seg.occtHLRVisibilityClass!==ref.hlrClass||
     seg.actualOCCTHLRFlattenedBRepLineVerified!==true||
     !equal(point,ref.nativePaperPoint))
   throw new RangeError('native true OCCT TopoDS vertex reference not in current HLR stroke');
  if(!isHidden)return {source:null,vertex:null,nativeHidden:false};
  const original=byGlobal[v.globalStart+ref.nativeHLREdgeOrdinal];
  if(original.nativeSource3DVertexEndpointRows.length!==1)return {
   source:null,vertex:null,nativeHidden:true};
  const src=original.nativeSource3DVertexEndpointRows[0],
   w=src.endpointWitnesses[ref.side==='from'?0:1];
  if(!w||w.originalModel3DSourceVertexId===undefined)
   throw new RangeError('original M0 3D endpoint ledger missing');
  return {source:src.originalPhysicalSourceEdgeId,
   vertex:w.originalModel3DSourceVertexId!==null&&
    geometry.data.points[w.originalModel3DSourceVertexId]&&
    (w.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified===true||
     w.existingM4OriginalSourceEndpointVerified===true)?
     w.originalModel3DSourceVertexId:null,
   nativeHidden:true};
 }
 const verifiedPhysical3DPair=(a,b)=>
  a.nativeHidden&&b.nativeHidden&&
  a.source!==null&&b.source!==null&&a.source!==b.source&&
  a.vertex!==null&&a.vertex===b.vertex;
 for(const view of VIEWS){
  const data=graph.views[view];
  for(const pair of data.sameActualGeneratedOCCTTopoDSVertexPairs){
   if(pair.view!==view||pair.nativeGeneratedOCCTTopoDSVertexIsSame!==true||
      pair.original3DSourceTopoDSVertexIdentityRecovered!==false||
      pair.actualNativeHLRStrokeJoinMeetsGlobalEngineeringRules!==false||
      pair.signedV5Action!==false||
      !equal(pair.a?.nativePaperPoint,pair.b?.nativePaperPoint))
    throw new RangeError('native OCCT shared vertex lacks real IsSame proof or is prematurely signed');
   const a=locate(pair.a,view),b=locate(pair.b,view);
   const both=a.nativeHidden&&b.nativeHidden;
   const verified=verifiedPhysical3DPair(a,b);
   if(verified)counts.actualOriginal3DPhysicalSourceJunctionPairsVerified++;
   counts.actualNativeIsSamePairs++;
   if(both){
    counts.IsSameHiddenToHiddenNativeEndpointPairs++;
    if(verified)
     counts.IsSameHiddenToHiddenMatchingOriginal3DPhysicalVertices++;
    else counts.IsSameHLRNodesButOriginalSource3DVertexNotCertified++;
   }else counts.IsSameNativeVisibleAndHiddenSourceHistoryStillUnknown++;
   rows.push({view,a:{...pair.a},b:{...pair.b},
    original3DVertexIdAgreedFromTwoIndependentHiddenSources:
     verified?a.vertex:null,
    actualOCCTHLRGeneratedTopoDSVertexIsSame:true,
    independentlyRealOriginal3DSourceJunctionAlsoProven:verified,
    originalGeneratedHLRTopoDSToSourceTopoDSEdgeHistoryCertified:false,
    globalJunctionAndGBEngineeringLineStyleCertified:false,
    signedV5Action:false
   });
  }
  for(const pair of data.paperCoincidentButDifferentTopoDSVertexPairs){
   if(pair.view!==view||
      pair.nativeGeneratedOCCTTopoDSVertexIsSame!==false||
      pair.signedV5Action!==false||
      !equal(pair.a?.nativePaperPoint,pair.b?.nativePaperPoint))
    throw new RangeError('paper-only alias cannot be considered a native vertex');
   const a=locate(pair.a,view),b=locate(pair.b,view);
   const originalPhysical=verifiedPhysical3DPair(a,b);
   counts.exactPaperCoincidentButDistinctNativeTopoDSPairsHeld++;
   if(originalPhysical){
    counts.distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs++;
    counts.actualOriginal3DPhysicalSourceJunctionPairsVerified++;
   }else counts.paperCoincidentNativePairsWithoutIndependent3DPhysicalJunction++;
   aliases.push({view,a:{...pair.a},b:{...pair.b},
    nativeTopoDSVertexShared:false,
    independentlyRealOriginal3DSourceJunctionPositivelyProven:originalPhysical,
    verifiedOriginal3DVertexId:originalPhysical?a.vertex:null,
    actualNativeGeneratedHLRSharedTopoDSVertexCertified:false,
    globalGBLineJoinStillNotCertified:true,signedV5Action:false});
  }
 }
 if(counts.actualNativeIsSamePairs!==
    graph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs||
    counts.exactPaperCoincidentButDistinctNativeTopoDSPairsHeld!==
    graph.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs)
  throw new RangeError('native OCCT generated vertex graph pair count mismatch');
 return frozen({schema:'draftai-c1-ocjs-native-generated-topods-original-3d-vertex-concordance/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,paperOnlyProjectedVertexAliases:aliases,
  nativeGeneratedTopoDSVertexAndOriginal3DPhysicalJunctionIndependentEvidence:true,
  actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete:false,
  entireHLRGraphAndAllProjectedJunctionsCertified:false,
  GBEngineeringLineRulesSatisfied:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1NativeHLRGeneratedToOriginalVertexConcordance};
