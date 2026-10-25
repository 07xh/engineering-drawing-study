'use strict';
/**
 * POSITIVE original M0 3D VERTEX authentication for native OCCT HCompound
 * endpoints even where the existing M4 source-cut endpoint ledger is not
 * positive. The M4 microgap is NOT erased: this is independent authentic
 * original 3D vertex + closed face fan + genuine original OCCT BRep edge
 * endpoint and native HLR exact 2D reprojection.
 *
 * This does NOT claim OCCT generated HLR TopoDS edge->original source
 * identity, cross-HLR-edge global junction, paper source precedence,
 * engineering style or new sole V5 ConstructionStep authorization.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))frozen(x);Object.freeze(o);
}return o;};
const eq2=(a,b)=>a&&b&&a.u===b.u&&a.v===b.v;
const eq3=(a,b)=>a&&b&&a.x===b.x&&a.y===b.y&&a.z===b.z;
const id=(g,e)=>g.id+'::'+[...e].sort().join('|');
function auditC1NativeHiddenOriginalVertexEndpointProof({
 geometry,revision,cad,endpointFans,refinements
}={}){
 if(!geometry?.data?.points||!Array.isArray(geometry.data.edges)||
    !Number.isSafeInteger(revision)||revision<1||
    cad?.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||
    cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
    cad.v5Authorized!==false||
    !Array.isArray(cad.originalBRepSourceEdges)||
    endpointFans?.sourceGeometryId!==geometry.id||
    endpointFans.revision!==revision||
    endpointFans.nativeGeneratedTopoDSEdgeEndpointIdentityProven!==false||
    endpointFans.signedV5ActionCount!==0||
    !Array.isArray(endpointFans.rows)||
    !Array.isArray(refinements)||endpointFans.rows.length!==refinements.length)
  throw new TypeError('genuine current C1 hidden native HLR and M0 exact original 3D face fan required');
 const edgeMap=new Map(geometry.data.edges.map(e=>[id(geometry,e),e]));
 const sourceBRep=new Map(cad.originalBRepSourceEdges.map(s=>[s.sourceEdgeId,s]));
 if(edgeMap.size!==geometry.data.edges.length||
    sourceBRep.size!==geometry.data.edges.length)
  throw new RangeError('missing original 3D CAD source or duplicate physical original edge');
 const counts={nativeHLRHiddenEdgesExamined:0,
  originalSourceTrue3DVertexEndpointsAudited:0,
  independentlyOriginalM4AndFaceFanProvenEndpoints:0,
  originalM4EndCutsStillUnproven:0,
  missingM4EndpointsIndependentlyPositiveNativeM0VertexProven:0,
  missingM4EndpointsStillLackingIndependentNativeProof:0,
  originalInteriorSourceCutNotPromotedToVertex:0,
  nativeHiddenEdgesWithAllOriginal3DVertexEndpointsVerified:0,
  officialGeneratedTopoDSJunctionsCertified:0,
  GBLineStylesOrNewV5ActionsSigned:0};
 const rows=[];let ordinal=0;
 for(const view of VIEWS){
  const hidden=cad.hiddenSharpViews?.[view];
  if(!Array.isArray(hidden))
   throw new RangeError('real OCCT HCompound hidden view missing');
  for(const native of hidden){
   const row=endpointFans.rows[ordinal],ref=refinements[ordinal];
   if(!row||!ref||row.nativeHiddenSharpEdgeOrdinal!==ordinal||
      row.view!==view||ref.view!==view||
      row.nativeGeneratedTopoDSIdentityCertified!==false||
      row.nativeHLREdgeJunctionsCertified!==false||
      row.signedV5Action!==false||
      native.occtHLRVisibilityClass!=='hidden-sharp'||
      native.actualOCCTHLRFlattenedBRepLineVerified!==true||
      native.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
      native.v5Authorized!==false||
      !eq2(row.nativeProjectedFrom,native.from)||
      !eq2(row.nativeProjectedTo,native.to)||
      !Array.isArray(ref.remainingPhysicalSourcePossibilities)||
      row.physicallyRemainingSourceCount!==
       ref.remainingPhysicalSourcePossibilities.length)
    throw new RangeError('stale or untrusted native HLR original 3D fan evidence');
   const sourceRows=[];
   for(const original of row.survivingOriginal3DEdgesWithEndpointFans){
    const edge=edgeMap.get(original.originalPhysicalSourceEdgeId),
     bRep=sourceBRep.get(original.originalPhysicalSourceEdgeId),
     nativeLift=native.sourceCandidate3DLifts?.find(x=>
      x.sourceEdgeId===original.originalPhysicalSourceEdgeId);
    if(!edge||!bRep||!nativeLift||
       bRep.originalOCCTBRepVertexXYZMatched!==true||
       bRep.occtCurveTypeIndependentlyVerified!==true||
       bRep.occtSourceCurveType!=='line'||
       bRep.occtSourceCurve3DEndpointsAndMidpointVerified!==true||
       bRep.generatedHLREdgeTopoDSIdentityMatched!==false||
       nativeLift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       nativeLift.originalOCCTSourceLineCurveVerified!==true||
       nativeLift.originalXYZReprojectsToHLR!==true||
       nativeLift.v5Authorized!==false||
       !Array.isArray(original.endpointWitnesses)||
       original.endpointWitnesses.length!==2)
     throw new RangeError('native hidden original OCCT BRep source curve or face fan missing');
    const endpoints=[];
    for(let i=0;i<2;i++){
     const witness=original.endpointWitnesses[i],
      paper=i===0?native.from:native.to,
      lifted=i===0?nativeLift.fromCandidate3D:nativeLift.toCandidate3D,
      param=i===0?nativeLift.sourceParameterAtProjectedFrom:
       nativeLift.sourceParameterAtProjectedTo;
     if(witness.sourceGeometryId!==geometry.id||
        witness.revision!==revision||witness.view!==view||
        witness.sourceEdgeId!==original.originalPhysicalSourceEdgeId||
        witness.signedV5Action!==false||
        witness.nativeHLRGeneratedTopoDSEndpointToOriginalTopoDSIdentityCertified!==false||
        witness.originalSourceParameter!==param||
        !eq2(witness.nativePaperPoint,paper))
      throw new RangeError('native hidden edge original parameter endpoint was changed');
     const isVertex=param===0||param===1;
     const vertexId=isVertex?edge[param===0?0:1]:null,
      model=vertexId!==null?geometry.data.points[vertexId]:null;
     // Exact equality in both MODEL 3D and actual native OCCT HLR
     // projected PAPER. No proximity tolerance or binary64 snapping.
     const independent=isVertex&&
      witness.originalSource3DVertexId===vertexId&&
      witness.exactOriginalM0ParameterIsSourceVertex===true&&
      witness.independentlyVerifiedOriginal3DClosedFaceFan===true&&
      eq3(witness.possibleOriginal3DPoint,model)&&
      eq3(lifted,model)&&
      eq2(project(model)[view],paper);
     if(isVertex)counts.originalSourceTrue3DVertexEndpointsAudited++;
     else counts.originalInteriorSourceCutNotPromotedToVertex++;
     const originalM4=witness.originalM4PaperEndpointMatchesAuthentic3DVertex===true&&
      witness.original3DSourceVertexPlusM4AndFanVerified===true;
     if(originalM4)
      counts.independentlyOriginalM4AndFaceFanProvenEndpoints++;
     if(isVertex&&!originalM4){
      counts.originalM4EndCutsStillUnproven++;
      if(independent)
       counts.missingM4EndpointsIndependentlyPositiveNativeM0VertexProven++;
      else counts.missingM4EndpointsStillLackingIndependentNativeProof++;
     }
     endpoints.push({
      nativeHLREndpointSide:i===0?'from':'to',
      originalModel3DSourceVertexId:vertexId,
      originalOpenSourceInteriorCutNotPhysicalVertex:!isVertex,
      existingM4OriginalSourceEndpointVerified:originalM4,
      exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified:!!independent,
      originalM4SourceParameterGapRemainsUnrepaired:isVertex&&!originalM4,
      OCCTGeneratedHLRToOriginalTopoDSVertexIdentityRecovered:false,
      joinedToOtherNativeHLREdgeWithOfficialLineRule:false,
      constructionIntentAuthorized:false,signedV5Action:false
     });
    }
    sourceRows.push({
     originalPhysicalSourceEdgeId:original.originalPhysicalSourceEdgeId,
     endpointWitnesses:endpoints,
     genuineOriginal3DVertexEndpointsAllIndependentlyVerified:
      endpoints.every(x=>
       x.originalOpenSourceInteriorCutNotPhysicalVertex||
       x.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified),
     originalM4PaperGapStillHeld:endpoints.some(x=>
      x.originalM4SourceParameterGapRemainsUnrepaired),
     formalOCCTGeneratedHLRSourceJunctionsProven:false,
     standardLineStyle:'undetermined',signedV5Action:false
    });
   }
   if(sourceRows.length===1&&
      sourceRows[0].genuineOriginal3DVertexEndpointsAllIndependentlyVerified)
    counts.nativeHiddenEdgesWithAllOriginal3DVertexEndpointsVerified++;
   rows.push({
    view,revision,sourceGeometryId:geometry.id,
    nativeHiddenSharpEdgeOrdinal:ordinal,
    uniqueSurvivingOriginalPhysical3DEdgeId:
     sourceRows.length===1?sourceRows[0].originalPhysicalSourceEdgeId:null,
    nativeSource3DVertexEndpointRows:sourceRows,
    OCCTGeneratedTopoDSNativeEdgeAdjacencyCertified:false,
    applicableGBEngineeringLineStyleCertified:false,
    constructionIntentAuthorized:false,signedV5Action:false
   });
   ordinal++;counts.nativeHLRHiddenEdgesExamined++;
  }
 }
 if(ordinal!==refinements.length||ordinal!==endpointFans.rows.length||
    counts.officialGeneratedTopoDSJunctionsCertified!==0||
    counts.GBLineStylesOrNewV5ActionsSigned!==0)
  throw new RangeError('incomplete native OCCT original physical vertex face fan endpoint proof');
 return frozen({
  schema:'draftai-c1-occt-real-hlr-original-3d-vertex-endpoint-independent-closure/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,
  M4SourceCutGapsStillReportedIndependently:true,
  genuineOriginal3DSourceEndpointsNotGeneratedHLRTopoDSJunctions:true,
  allGlobalOCCTHLREdgeJoinsVerified:false,
  engineeringGBLineStylesCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={auditC1NativeHiddenOriginalVertexEndpointProof};
