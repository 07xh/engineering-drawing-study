'use strict';
/**
 * Native OCCT *GENERATED* HLR BRep vertex topology, not a model-space
 * reconstructed or paper-coincident join.
 *
 * TopoDS_Shape.IsSame compares actual TShape + Location, ignoring only
 * orientation. Never infer OCCT identity from co-projected paper points.
 * The original 3D source TopoDS history is a SEPARATE unproven claim.
 *
 * Run while native OCJS TopoDS wrappers are still alive. Do not return
 * those handles from this proof: the serializable output holds IDs/paper
 * coordinates and independent positive/different native-vertex pairs.
 */
const VIEWS=['V','H','W'];
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
function computeC1NativeHLRIsSameVertexGraph({perView}={}){
 if(!perView||typeof perView!=='object'||
    VIEWS.some(v=>!perView[v]||
     !Array.isArray(perView[v].visible)||
     !Array.isArray(perView[v].hidden)))
  throw new TypeError('current actual OCCT V/H/W visible and hidden sharp BRep vertex records required');
 const views={},counts={
  genuineOCCTNativeHLRSharpEdges:0,
  actualNativeBRepVertexEndpoints:0,
  literalSamePaperPointEndpointPairsChecked:0,
  allPerViewGeneratedOCCTTopoDSVertexPairsChecked:0,
  genuinelySharedNativeJunctionComponents:0,
  genuinelySharedNativeJunctionEndpoints:0,
  positivelySameGeneratedOCCTTopoDSVertexPairs:0,
  coincidentPaperButDistinctGeneratedTopoDSVertexPairs:0,
  sameTopoDSVertexWithNonmatchingPaperCoordinatesRejected:0,
  formalSourceOCCTToGeneratedHLRTopoDSIdsRecovered:0,
  certifiedGBJunctionLineStyles:0,
  signedV5Actions:0
 };
 for(const view of VIEWS){
  const records=[
   ...perView[view].visible.map(x=>({...x,hlrClass:'visible-sharp'})),
   ...perView[view].hidden.map(x=>({...x,hlrClass:'hidden-sharp'}))
  ];
  // Real HLR traversal ordinals index the emitted CAD segment array.
  // A duplicated, skipped or permuted ordinal can otherwise associate a
  // genuine TopoDS vertex with a DIFFERENT paper edge downstream in M5.
  // Visible and hidden have separate ordinal namespaces in each view.
  for(const [hlrClass,items] of [
   ['visible-sharp',perView[view].visible],
   ['hidden-sharp',perView[view].hidden]
  ])for(let ordinal=0;ordinal<items.length;ordinal++){
   if(items[ordinal]?.nativeHLREdgeOrdinal!==ordinal)
    throw new RangeError('native OCCT '+hlrClass+
     ' HLR ordinal does not match actual emitted segment index');
  }

  if(records.length>256)throw new RangeError('too many genuine native HLR sharp edges');
  const nodeRecords=[];
  for(const rec of records){
   if(!Number.isSafeInteger(rec.nativeHLREdgeOrdinal)||
      rec.nativeHLREdgeOrdinal<0||
      !Array.isArray(rec.vertices)||rec.vertices.length!==2||
      !Array.isArray(rec.projectedEndpoints)||rec.projectedEndpoints.length!==2)
    throw new TypeError('real OCCT sharp edge requires exactly two native BRep vertices');
   for(let side=0;side<2;side++){
    const shape=rec.vertices[side],pt=rec.projectedEndpoints[side];
    if(typeof shape?.IsSame!=='function'||
       !pt||!Number.isFinite(pt.u)||!Number.isFinite(pt.v)||
       shape.IsNull?.()===true||
       shape.IsSame(shape)!==true)
     throw new TypeError('valid native OCCT non-null TopoDS vertex with reflexive IsSame required');
    const node={view,hlrClass:rec.hlrClass,
     nativeHLREdgeOrdinal:rec.nativeHLREdgeOrdinal,
     side:side===0?'from':'to',
     nativePaperPoint:{u:pt.u,v:pt.v},
     sourceTopoDSIdentityCertified:false,
     nativeVertex:shape};
    nodeRecords.push(node);
    counts.actualNativeBRepVertexEndpoints++;
   }
   counts.genuineOCCTNativeHLRSharpEdges++;
  }
  const same=[],paperOnly=[],parent=nodeRecords.map((_,i)=>i),actualSame=new Set();
  const root=i=>{while(parent[i]!==i)i=parent[i];return i;};
  const makeRef=n=>({hlrClass:n.hlrClass,
   nativeHLREdgeOrdinal:n.nativeHLREdgeOrdinal,side:n.side,
   nativePaperPoint:{...n.nativePaperPoint}});
  // Examine ALL distinct native vertex endpoint pairs, not only those that
  // look equal on paper. An actual IsSame TopoDS vertex that projects to
  // two different first-angle paper coordinates is inconsistent. Never
  // silently omit this connection from the generated junction graph.
  for(let i=0;i<nodeRecords.length;i++)
   for(let j=i+1;j<nodeRecords.length;j++){
    const a=nodeRecords[i],b=nodeRecords[j];
    const ab=a.nativeVertex.IsSame(b.nativeVertex),
     ba=b.nativeVertex.IsSame(a.nativeVertex);
    counts.allPerViewGeneratedOCCTTopoDSVertexPairsChecked++;
    if(typeof ab!=='boolean'||typeof ba!=='boolean'||ab!==ba)
     throw new RangeError('native OCCT IsSame is not symmetric between generated vertices');
    const samePaper=a.nativePaperPoint.u===b.nativePaperPoint.u&&
     a.nativePaperPoint.v===b.nativePaperPoint.v;
    if(ab&&!samePaper)
     throw new RangeError('same generated TopoDS vertex has inconsistent first-angle paper coordinates');
    if(ab){
     actualSame.add(i+'|'+j);
     parent[root(j)]=root(i);
    }
    if(a.hlrClass===b.hlrClass&&
       a.nativeHLREdgeOrdinal===b.nativeHLREdgeOrdinal){
     if(ab)
      throw new RangeError('one finite native HLR edge has identical generated TopoDS start and end vertex');
     continue;
    }
    if(!samePaper)continue;
    counts.literalSamePaperPointEndpointPairsChecked++;
    const link={view,a:makeRef(a),b:makeRef(b),
     nativeGeneratedOCCTTopoDSVertexIsSame:ab,
     original3DSourceTopoDSVertexIdentityRecovered:false,
     actualNativeHLRStrokeJoinMeetsGlobalEngineeringRules:false,
     signedV5Action:false};
    if(ab){same.push(link);counts.positivelySameGeneratedOCCTTopoDSVertexPairs++;}
    else{paperOnly.push(link);
     counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs++;}
  }
  // Pairwise, transitive genuine TopoDS identity, not paper connectivity.
  // No reconstructed TopoDS ID leaves this synchronous OCCT proof.
  const nativeComponents=new Map();
  nodeRecords.forEach((node,i)=>{
   const owner=root(i);
   if(!nativeComponents.has(owner))nativeComponents.set(owner,[]);
   nativeComponents.get(owner).push({index:i,node});
  });
  const sharedNativeJunctions=[];
  for(const component of nativeComponents.values()){
   if(component.length<2)continue;
   for(let i=0;i<component.length;i++)
    for(let j=i+1;j<component.length;j++){
     const a=component[i].index,b=component[j].index;
     if(!actualSame.has(Math.min(a,b)+'|'+Math.max(a,b)))
      throw new RangeError('OCCT generated TopoDS IsSame relation is not transitive');
    }
   const point=component[0].node.nativePaperPoint;
   sharedNativeJunctions.push({
    view,originalGeneratedTopoDSHistoryRecovered:false,
    actualGeneratedOCCTTopoDSVertexPairwiseIsSame:true,
    exactNativePaperCoordinatesForEntireComponent:{...point},
    generatedSharpEdgeEndpoints:component.map(x=>makeRef(x.node)),
    independentlyCertifiedOriginal3DSourceVertexId:null,
    engineeringLineJoinCertified:false,
    signedV5Action:false
   });
   counts.genuinelySharedNativeJunctionComponents++;
   counts.genuinelySharedNativeJunctionEndpoints+=component.length;
  }
  // Keep original pairwise proof for existing native M5 consumers.
  views[view]={
   view,realNativeSharpEdgeCount:records.length,
   sameActualGeneratedOCCTTopoDSVertexPairs:same,
   generatedOCCTSharedNativeJunctionComponents:sharedNativeJunctions,
   allNativeGeneratedEndpointPairsIndependentlyCompared:true,
   paperCoincidentButDifferentTopoDSVertexPairs:paperOnly,
   generatedTopoDSOriginalSourceHistoryRecovered:false,
   engineeringLineJoinCertified:false,signedV5Action:false
  };
 }
 return frozen({schema:'draftai-ocjs-genuine-hlr-generated-topods-issame-vertex-graph/1',
  views,counts,realOCCTIsSameComparedBeforeNativeObjectDeletion:true,
  literalPaperCoordinateAloneNeverTopology:true,
  allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing:true,
  generatedJunctionComponentsBasedOnlyOnPairwiseOCCTIsSame:true,
  generatedNativeTopoDSDoesNotProveOriginal3DSourceIdentity:true,
  actualGeneratedToOriginalTopoDSHistoryRecovered:false,
  globalFinalStandardEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={computeC1NativeHLRIsSameVertexGraph};
