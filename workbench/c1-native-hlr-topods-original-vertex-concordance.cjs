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
const {VIEWS,project}=require('../core/projection/conventions.js');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
const equal=(p,q)=>p&&q&&p.u===q.u&&p.v===q.v;
function auditC1NativeHLRGeneratedToOriginalVertexConcordance({
 geometry,revision,cad,originalNativeVertexProof,originalClosedRayM5
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
    !Array.isArray(originalNativeVertexProof.rows)||
    (originalClosedRayM5!==undefined&&(
     originalClosedRayM5?.schema!==
      'draftai-c1-m5-exact-closed-original-edge-ray-and-cut-continuity/1'||
     originalClosedRayM5.sourceGeometryId!==geometry.id||
     originalClosedRayM5.revision!==revision||
     originalClosedRayM5.signedV5ActionCount!==0||
     !Array.isArray(originalClosedRayM5.rows))))
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
  nativeMixedVisibleHiddenWithAuthenticatedOriginalM0VertexAndM5ClearRay:0,
  distinctNativeTopoDSButSameIndependentlyProvenOriginal3DVertexPairs:0,
  paperCoincidentNativePairsWithoutIndependent3DPhysicalJunction:0,
  actualOriginal3DPhysicalSourceJunctionPairsVerified:0,
  genuineCompleteGeneratedHLRJunctionComponentsAudited:0,
  completeGeneratedHLRJunctionComponentsWithIndependentOriginal3DVertex:0,
  completeGeneratedHLRJunctionComponentsHeldOnUnmappedPhysicalSource:0,
  generatedTopoDSEdgeOriginalSourceHistoryCertified:0,
  engineeringGBLineJunctionsSigned:0,signedV5Actions:0
 };
 const rows=[],aliases=[];
 const sourceEdges=new Map((geometry.data.edges??[]).map(edge=>[
  geometry.id+'::'+[...edge].sort().join('|'),edge
 ]));
 const outwardM5=new Map((originalClosedRayM5?.rows??[]).map(row=>[
  row.originalPhysicalSourceEdgeId+'@'+row.view,row
 ]));
 const xyzEq=(a,b)=>a&&b&&['x','y','z'].every(k=>
  Number.isFinite(a[k])&&Number.isFinite(b[k])&&a[k]===b[k]);
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
  if(!isHidden){
   // A true HLR VCompound native segment can be tied to a MODELED original
   // M0 endpoint only if exactly ONE independently OCCT-measured original
   // straight 3D source candidate survives, its TRUE source endpoint
   // projects to the literal native generated paper vertex, and an
   // independent SAME-REVISION M5 closed ray clears the whole front edge.
   // This does not imply generated HLR edge -> original TopoDS history.
   const lifts=seg.sourceCandidate3DLifts;
   if(!Array.isArray(lifts)||lifts.length!==1||
      !originalClosedRayM5)
    return {source:null,vertex:null,nativeHidden:false};
   const lift=lifts[0],edge=sourceEdges.get(lift.sourceEdgeId);
   const row=outwardM5.get(lift.sourceEdgeId+'@'+view);
   if(!edge||!row||
      row.fullProjectedVisibleSourceLineProven!==true||
      row.completeSourceOriginal3DRayClosedIntervalClear!==true||
      row.originalPhysicalCreaseProven!==true||
      row.signedV5Action!==false||
      row.officialEngineeringLineStyle!=='undetermined'||
      lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
      lift.originalOCCTSourceLineCurveVerified!==true||
      lift.originalXYZReprojectsToHLR!==true||
      lift.v5Authorized!==false||
      !Array.isArray(lift.originalVertexIds)||
      lift.originalVertexIds.join('|')!==edge.join('|'))
    return {source:null,vertex:null,nativeHidden:false};
   const isFrom=ref.side==='from',t=isFrom?
    lift.sourceParameterAtProjectedFrom:lift.sourceParameterAtProjectedTo;
   const id=t===0?edge[0]:t===1?edge[1]:null;
   if(id===null)return {source:null,vertex:null,nativeHidden:false};
   const xyz=geometry.data.points[id],measured=isFrom?
    lift.fromCandidate3D:lift.toCandidate3D;
   const original=[geometry.data.points[edge[0]],geometry.data.points[edge[1]]];
   const actualA=lift.actualOriginalOCCTBRepFrom3D,
    actualB=lift.actualOriginalOCCTBRepTo3D;
   if(!xyzEq(xyz,measured)||
      !equal(project(xyz)[view],point)||
      !((xyzEq(original[0],actualA)&&xyzEq(original[1],actualB))||
        (xyzEq(original[0],actualB)&&xyzEq(original[1],actualA))))
    return {source:null,vertex:null,nativeHidden:false};
   return {source:lift.sourceEdgeId,vertex:id,nativeHidden:false,
    independentlyOriginalVisibleM0AndM5FullClearSourceVertex:true};
  }
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
  (a.nativeHidden||a.independentlyOriginalVisibleM0AndM5FullClearSourceVertex===true)&&
  (b.nativeHidden||b.independentlyOriginalVisibleM0AndM5FullClearSourceVertex===true)&&
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
   }else{
    if(verified)
     counts.nativeMixedVisibleHiddenWithAuthenticatedOriginalM0VertexAndM5ClearRay++;
    else counts.IsSameNativeVisibleAndHiddenSourceHistoryStillUnknown++;
   }
   rows.push({view,a:{...pair.a},b:{...pair.b},
    original3DVertexIdAgreedFromTwoIndependentHiddenSources:
     verified&&both?a.vertex:null,
    original3DVertexIdAgreedBetweenAuthenticVisibleAndHiddenM0Sources:
     verified&&!both?a.vertex:null,
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
 // Consume the *whole* actual OCCT IsSame equivalence-class star, not
 // one paper-coincident native edge pair at a time. A complete native star
 // is a proven original 3D physical shared vertex only if EVERY endpoint
 // independently traces to the SAME M0 source vertex and distinct genuine
 // M5-original 3D edges. A visible edge with unknown original provenance
 // holds the entire component; no invented native->original TopoDS history.
 const completeNativeJunctionStars=[];
 if(graph.allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing===true){
  const keyed=n=>n.hlrClass+'@'+n.nativeHLREdgeOrdinal+'@'+n.side;
  for(const view of VIEWS){
   const data=graph.views[view],stars=data.generatedOCCTSharedNativeJunctionComponents;
   if(data.allNativeGeneratedEndpointPairsIndependentlyCompared!==true||
      !Array.isArray(stars))
    throw new RangeError('exhaustive generated native HLR junction components missing');
   const actualPairIds=new Set(data.sameActualGeneratedOCCTTopoDSVertexPairs
    .map(p=>[keyed(p.a),keyed(p.b)].sort().join('|')));
   const globallySeen=new Set();
   for(const group of stars){
    if(group.view!==view||
       group.actualGeneratedOCCTTopoDSVertexPairwiseIsSame!==true||
       group.originalGeneratedTopoDSHistoryRecovered!==false||
       group.engineeringLineJoinCertified!==false||
       group.signedV5Action!==false||
       !Array.isArray(group.generatedSharpEdgeEndpoints)||
       group.generatedSharpEdgeEndpoints.length<2)
     throw new RangeError('invalid genuine OCCT full generated vertex junction star');
    const members=group.generatedSharpEdgeEndpoints;
    const paper=group.exactNativePaperCoordinatesForEntireComponent;
    const names=new Set();
    for(const item of members){
     const id=keyed(item);
     if(names.has(id)||globallySeen.has(id)||!equal(item.nativePaperPoint,paper))
      throw new RangeError('overlapping or paper-misaligned native TopoDS junction stars');
     names.add(id);globallySeen.add(id);
    }
    for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
     if(!actualPairIds.has([keyed(members[i]),keyed(members[j])].sort().join('|')))
      throw new RangeError('native junction component missing actual OCCT IsSame pair witness');
    }
    const physical=members.map(member=>locate(member,view));
    const allSourceMapped=physical.every(x=>
     (x.nativeHidden||x.independentlyOriginalVisibleM0AndM5FullClearSourceVertex===true)&&
     typeof x.source==='string'&&x.vertex!==null&&x.vertex!==undefined);
    const vertices=new Set(physical.map(x=>x.vertex));
    const distinctSources=new Set(physical.map(x=>x.source));
    const fullyCertified=allSourceMapped&&vertices.size===1&&distinctSources.size>=2;
    counts.genuineCompleteGeneratedHLRJunctionComponentsAudited++;
    if(fullyCertified)
     counts.completeGeneratedHLRJunctionComponentsWithIndependentOriginal3DVertex++;
    else counts.completeGeneratedHLRJunctionComponentsHeldOnUnmappedPhysicalSource++;
    completeNativeJunctionStars.push({
     view,genuineNativeGeneratedOCCTVertexPairwiseIsSame:true,
     exactNativePaperPoint:{...paper},
     generatedHLREndpoints:members.map(x=>({...x,nativePaperPoint:{...x.nativePaperPoint}})),
     allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex:fullyCertified,
     independentlyVerifiedOriginalM03DVertexId:
      fullyCertified?physical[0].vertex:null,
     includesActualVisibleHLRWithIndependentM5WholeOriginalClearRay:
      fullyCertified&&physical.some(x=>!x.nativeHidden),
     independentlyTracedOriginal3DSourceEdges:
      fullyCertified?[...distinctSources].sort():[],
     originalOCCTGeneratedToSourceTopoDSEdgeHistoryRecovered:false,
     wholeSceneAndEngineeringGBJunctionCertified:false,
     signedV5Action:false
    });
   }
  }
  if(counts.genuineCompleteGeneratedHLRJunctionComponentsAudited!==
      graph.counts.genuinelySharedNativeJunctionComponents)
   throw new RangeError('generated native junction component count disagrees with OCCT graph');
 }
 if(counts.actualNativeIsSamePairs!==
    graph.counts.positivelySameGeneratedOCCTTopoDSVertexPairs||
    counts.exactPaperCoincidentButDistinctNativeTopoDSPairsHeld!==
    graph.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs)
  throw new RangeError('native OCCT generated vertex graph pair count mismatch');
 return frozen({schema:'draftai-c1-ocjs-native-generated-topods-original-3d-vertex-concordance/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,paperOnlyProjectedVertexAliases:aliases,
  completeGenuineNativeHLRJunctionStars:completeNativeJunctionStars,
  allPerViewActualNativeGeneratedJunctionComponentsConsumed:
   graph.allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing===true,
  nativeGeneratedTopoDSVertexAndOriginal3DPhysicalJunctionIndependentEvidence:true,
  actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete:false,
  entireHLRGraphAndAllProjectedJunctionsCertified:false,
  GBEngineeringLineRulesSatisfied:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={auditC1NativeHLRGeneratedToOriginalVertexConcordance};
