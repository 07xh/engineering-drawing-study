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
  if(records.length>256)throw new RangeError('too many genuine native HLR sharp edges');
  const nodeBuckets=new Map(),nodeRecords=[];
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
    const k=pt.u+'|'+pt.v;
    if(!nodeBuckets.has(k))nodeBuckets.set(k,[]);
    nodeBuckets.get(k).push(node);
    counts.actualNativeBRepVertexEndpoints++;
   }
   counts.genuineOCCTNativeHLRSharpEdges++;
  }
  const same=[],paperOnly=[];
  for(const nodes of nodeBuckets.values()){
   for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
    const a=nodes[i],b=nodes[j];
    if(a.hlrClass===b.hlrClass&&
       a.nativeHLREdgeOrdinal===b.nativeHLREdgeOrdinal)continue;
    counts.literalSamePaperPointEndpointPairsChecked++;
    const ab=a.nativeVertex.IsSame(b.nativeVertex),
     ba=b.nativeVertex.IsSame(a.nativeVertex);
    if(typeof ab!=='boolean'||typeof ba!=='boolean'||ab!==ba)
     throw new RangeError('native OCCT IsSame is not symmetric between paper-coincident vertices');
    const lite=n=>({hlrClass:n.hlrClass,
     nativeHLREdgeOrdinal:n.nativeHLREdgeOrdinal,side:n.side,
     nativePaperPoint:{...n.nativePaperPoint}});
    const link={view,a:lite(a),b:lite(b),
     nativeGeneratedOCCTTopoDSVertexIsSame:ab,
     original3DSourceTopoDSVertexIdentityRecovered:false,
     actualNativeHLRStrokeJoinMeetsGlobalEngineeringRules:false,
     signedV5Action:false};
    if(ab){same.push(link);counts.positivelySameGeneratedOCCTTopoDSVertexPairs++;}
    else{paperOnly.push(link);
     counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs++;}
   }
  }
  views[view]={
   view,realNativeSharpEdgeCount:records.length,
   sameActualGeneratedOCCTTopoDSVertexPairs:same,
   paperCoincidentButDifferentTopoDSVertexPairs:paperOnly,
   generatedTopoDSOriginalSourceHistoryRecovered:false,
   engineeringLineJoinCertified:false,signedV5Action:false
  };
 }
 return frozen({schema:'draftai-ocjs-genuine-hlr-generated-topods-issame-vertex-graph/1',
  views,counts,realOCCTIsSameComparedBeforeNativeObjectDeletion:true,
  literalPaperCoordinateAloneNeverTopology:true,
  generatedNativeTopoDSDoesNotProveOriginal3DSourceIdentity:true,
  actualGeneratedToOriginalTopoDSHistoryRecovered:false,
  globalFinalStandardEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={computeC1NativeHLRIsSameVertexGraph};
