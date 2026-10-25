'use strict';
/**
 * Reconcile ALL canonical M4 original-source paper encounters against true
 * OCJS HCompound native hidden lines and independently M5-pruned original
 * 3D source identity.
 *
 * This is NOT a second intersection algorithm: it consumes the existing
 * closed-convex M0/M4 original-source event graph.  Every native hidden
 * original-source interval is tested against EVERY known M4 encounter in
 * that interval, including its original 3D physical identity, endpoint
 * origin, projected-only overlaps and rounded diagnostic source parameters.
 *
 * Paper contact is not a 3D join. Original M0 vertex incidence is not
 * generated HLR TopoDS vertex IsSame, global occlusion or a GB line rule.
 * Undecidable event cuts stay open formal M5 obligations; never auto-fill.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {orientation2DAdaptive}=
 require('../core/numeric/orientation2d-adaptive.cjs');
const {exactOriginalM4TransverseCrossingDepth}=
 require('./c1-m4-exact-original-crossing-depth.cjs');
const {certifyExactM4OriginalVertexVsOtherSourceDepth}=
 require('./c1-m4-exact-original-vertex-on-source-depth.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))frozen(x);Object.freeze(o);
}return o;};
const id=(g,edge)=>g.id+'::'+[...edge].sort().join('|');
const eq2=(a,b)=>a&&b&&a.u===b.u&&a.v===b.v;
// Preserve the ACTUAL original M0 endpoint bit patterns at exact 0/1;
 // reconstructing b as a+(b-a)*1 can lose one ULP.
const interpolate=(a,b,t)=>t===0?a:t===1?b:
 ({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
function paperLineEventRelation({nativeFrom,nativeTo,modelPoint}={}){
 if(![nativeFrom,nativeTo,modelPoint].every(x=>
  x&&Number.isFinite(x.u)&&Number.isFinite(x.v)))
  throw new TypeError('native HLR and recomputed original projected event coordinates required');
 const orient=orientation2DAdaptive(
  [nativeFrom.u,nativeFrom.v],[nativeTo.u,nativeTo.v],
  [modelPoint.u,modelPoint.v]);
 if(![-1,0,1].includes(orient.sign))
  throw new RangeError('invalid exact projected orientation');
 const dx=nativeTo.u-nativeFrom.u,dy=nativeTo.v-nativeFrom.v,
  norm=dx*dx+dy*dy;
 if(!(norm>0)||!Number.isFinite(norm))
  throw new RangeError('non-finite or collapsed real native HLR paper segment');
 const t=((modelPoint.u-nativeFrom.u)*dx+
  (modelPoint.v-nativeFrom.v)*dy)/norm;
 if(!Number.isFinite(t))
  throw new RangeError('invalid projected native event parameter');
 return frozen({
  originalEventOnSameNativePaperLineExactly:orient.sign===0,
  originalEventWithinNativePaperEndpointsNumerically:t>=0&&t<=1,
  nativePaperSegmentParameter:t,
  sameNativeGeneratedEdgeEndpointLiterally:
   eq2(modelPoint,nativeFrom)||eq2(modelPoint,nativeTo),
  tinyPaperDifferenceDoesNotCreateNewPhysical3DVertex:true
 });
}
function auditC1NativeHLRAllM4ProjectedEncounters({
 geometry,revision,cad,refinements,nativeVertexProof,m4
}={}){
 if(!geometry?.data?.points||!Array.isArray(geometry.data.edges)||
    !Number.isSafeInteger(revision)||revision<1||
    cad?.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||
    cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
    cad.v5Authorized!==false||
    nativeVertexProof?.sourceGeometryId!==geometry.id||
    nativeVertexProof.revision!==revision||
    nativeVertexProof.signedV5ActionCount!==0||
    !Array.isArray(nativeVertexProof.rows)||
    m4?.schema!=='draftai-c1-original-source-m4-projected-event-graph/1'||
    m4.sourceGeometryId!==geometry.id||m4.revision!==revision||
    m4.currentM0ClosedConvexVerified!==true||
    m4.signedV5ActionCount!==0||
    m4.sourceIntervalEngineeringLineStylesCertified!==false||
    !Array.isArray(m4.rows)||!Array.isArray(refinements))
  throw new TypeError('same-revision real native HLR, positively reviewed original M4, and M5 3D vertex proof required');
 const sourceById=new Map(geometry.data.edges.map(edge=>[id(geometry,edge),edge]));
 const m4ByKey=new Map(m4.rows.map(row=>[row.view+'@'+row.sourceEdgeId,row]));
 if(sourceById.size!==geometry.data.edges.length||
    m4ByKey.size!==m4.rows.length||
    m4.rows.length!==3*geometry.data.edges.length)
  throw new RangeError('original source event graph omits or duplicates reviewed V/H/W edge');
 for(const view of VIEWS)for(const [source,edge] of sourceById){
  const row=m4ByKey.get(view+'@'+source);
  if(!row||row.view!==view||row.sourceGeometryId!==geometry.id||
     row.sourceOriginalVertexIds?.[0]!==edge[0]||
     row.sourceOriginalVertexIds?.[1]!==edge[1]||
     !Array.isArray(row.encounters)||!Array.isArray(row.cutParameters)||
     row.cutParameters[0]!==0||row.cutParameters.at(-1)!==1||
     row.signedV5ActionCount!==0)
   throw new RangeError('untrusted or stale original M4 V/H/W event source ledger');
 }
 let global=0;
 const rows=[],counts={
  genuineNativeHiddenSharpEdgesInspected:0,
  uniqueOriginal3DSourceNativeHLRLinesAudited:0,
  nativeHiddenLinesUnmappedOrAmbiguousHeld:0,
  originalM4PaperEncounterOccurrencesCovered:0,
  exactOriginal3DPhysicalVertexEncountersCorroborated:0,
  paperOnlyOriginalSourceCrossingsAndOverlapsHeld:0,
  roundedSourceParameterEncountersHeld:0,
  nativeHLRInteriorPaperEventsRequiringSceneJunctionReview:0,
  nativeOriginalM4TransverseCrossingEventsFound:0,
  exactOriginal3DStrictFrontDepthAtM4TransverseCrossingsProven:0,
  exactM4TransverseCrossingsWithDepthTieHeld:0,
  exactM4TransverseCrossingsOutsideOriginalOpenSourceHeld:0,
  authenticM4OriginalVertexOtherSourceIncidencesExactlyReviewed:0,
  exactOriginal3DPhysicalSharedVertexAndOCCTSourceAtNativeHLR:0,
  exactOriginal3DPhysicalSharedVertexDespiteNativePaperMismatch:0,
  projectedEndpointEventsProvedStrictlyDifferentOriginal3DDepth:0,
  actualOriginalEndpointPaperMismatchStillHeld:0,
  M4OriginalEventsWithNativeHLRPaperLineNotExactlyMatched:0,
  source3DPhysicalEncounterNotAtNativeHLREndpoint:0,
  actualGeneratedEdgeTopoDSOriginalSourceHistoryCertified:0,
  globalHLROcclusionAndJunctionGraphComplete:0,
  officiallySignedGBLines:0,signedV5Actions:0
 };
 for(const view of VIEWS){
  const segments=cad.hiddenSharpViews?.[view];
  if(!Array.isArray(segments))throw new RangeError('real OCCT HCompound missing view');
  for(const native of segments){
   const ref=refinements[global],vertex=nativeVertexProof.rows[global];
   if(!ref||!vertex||ref.view!==view||vertex.view!==view||
      vertex.nativeHiddenSharpEdgeOrdinal!==global||
      vertex.revision!==revision||vertex.signedV5Action!==false||
      ref.signedV5Action!==false||
      ref.nativeHLRToSourceTopoDSIdentityRecovered!==false||
      !eq2(ref.projectedFrom,native.from)||
      !eq2(ref.projectedTo,native.to)||
      native.occtHLRVisibilityClass!=='hidden-sharp'||
      native.actualOCCTHLRFlattenedBRepLineVerified!==true||
      native.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
      native.v5Authorized!==false)
    throw new RangeError('untrusted or reordered genuine native HLR/M4 source');
   const survivors=ref.remainingPhysicalSourcePossibilities;
   const unique=Array.isArray(survivors)&&survivors.length===1&&
    vertex.uniqueSurvivingOriginalPhysical3DEdgeId===survivors[0].sourceEdgeId;
   const encounters=[];
   let original=null,range=null;
   if(unique){
    const source=survivors[0].sourceEdgeId,edge=sourceById.get(source),
     lift=native.sourceCandidate3DLifts?.find(x=>x.sourceEdgeId===source),
     row=m4ByKey.get(view+'@'+source),
     originalSource=vertex.nativeSource3DVertexEndpointRows
      ?.find(x=>x.originalPhysicalSourceEdgeId===source);
    if(!edge||!lift||!row||!originalSource||
       lift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       lift.originalOCCTSourceLineCurveVerified!==true||
       lift.originalXYZReprojectsToHLR!==true||lift.v5Authorized!==false||
       originalSource.endpointWitnesses?.length!==2)
     throw new RangeError('original 3D HLR source not independently authenticated');
    range=lift.originalSourceParameterRange;
    if(!Array.isArray(range)||range.length!==2||
       !range.every(Number.isFinite)||range[0]<0||range[1]>1||
       range[0]>=range[1])
     throw new RangeError('invalid native original 3D parameter interval');
    original=source;
    const [a,b]=edge.map(x=>geometry.data.points[x]);
    for(const e of row.encounters){
     const t=e.sourceParameter;
     if(!Number.isFinite(t)||t<0||t>1||
        !sourceById.has(e.otherSourceEdgeId)||
        typeof e.projectedOnlyUnresolved!=='boolean'||
        typeof e.original3DPhysicalJunctionProven!=='boolean'||
        typeof e.sourceParameterBoundaryRoundedForDiagnostic!=='boolean')
      throw new RangeError('invalid canonical original M4 projected encounter');
     if(t<range[0]||t>range[1])continue;
     const p3=interpolate(a,b,t),paper=project(p3)[view],
      relation=paperLineEventRelation({
       nativeFrom:native.from,nativeTo:native.to,modelPoint:paper});
     const vertexId=t===0?edge[0]:t===1?edge[1]:null;
     const physical=e.original3DPhysicalJunctionProven===true&&
      e.projectedOnlyUnresolved===false&&
      e.sourceParameterBoundaryRoundedForDiagnostic===false&&
      vertexId!==null&&e.exactSharedOriginalVertexId===vertexId&&
      sourceById.get(e.otherSourceEdgeId).includes(vertexId);
     if(e.original3DPhysicalJunctionProven===true&&!physical)
      throw new RangeError('M4 paper or rounded encounter forged 3D source junction');
     const endpoint=originalSource.endpointWitnesses.find(x=>
      x.originalModel3DSourceVertexId===vertexId&&vertexId!==null&&
      x.originalM4SourceParameterGapRemainsUnrepaired!==undefined&&
      (x.existingM4OriginalSourceEndpointVerified===true||
       x.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified===true));
     const nativeEndpointPositive=physical&&!!endpoint&&
      relation.sameNativeGeneratedEdgeEndpointLiterally===true;
     const originalEndpointProof=(t===0||t===1)&&
      !e.sourceParameterBoundaryRoundedForDiagnostic?
      certifyExactM4OriginalVertexVsOtherSourceDepth({
       geometry,view,vertexSourceEdge:edge,
       originalSourceParameter:t,
       otherSourceEdge:sourceById.get(e.otherSourceEdgeId)
      }):null;
     const authenticOriginalBRepSource=(sourceId)=>
      cad.originalBRepSourceEdges?.some(x=>
       x.sourceEdgeId===sourceId&&
       x.originalOCCTBRepVertexXYZMatched===true&&
       x.occtCurveTypeIndependentlyVerified===true&&
       x.occtSourceCurveType==='line'&&
       x.occtSourceCurve3DEndpointsAndMidpointVerified===true&&
       x.generatedHLREdgeTopoDSIdentityMatched===false);
     const fullyVerifiedSourceVertex=originalEndpointProof?.
      exactOriginal3DPhysicalVertexSharedBySourceEdges===true&&
      physical===true&&!!endpoint&&
      authenticOriginalBRepSource(source)&&
      authenticOriginalBRepSource(e.otherSourceEdgeId);
     if(originalEndpointProof){
      counts.authenticM4OriginalVertexOtherSourceIncidencesExactlyReviewed++;
      if(originalEndpointProof.exactOriginalVertexOnOtherProjectedClosedSource&&
         originalEndpointProof.exactOriginalVertexDepthRelativeOtherSourceSign!==0&&
         originalEndpointProof.exactOriginalVertexDepthRelativeOtherSourceSign!==null)
       counts.projectedEndpointEventsProvedStrictlyDifferentOriginal3DDepth++;
      if(fullyVerifiedSourceVertex){
       counts.exactOriginal3DPhysicalSharedVertexAndOCCTSourceAtNativeHLR++;
       if(!relation.originalEventOnSameNativePaperLineExactly)
        counts.exactOriginal3DPhysicalSharedVertexDespiteNativePaperMismatch++;
      }
      if(!relation.originalEventOnSameNativePaperLineExactly)
       counts.actualOriginalEndpointPaperMismatchStillHeld++;
     }
     // The canonical M4 already found this crossing. Recompute ONLY
     // the exact source-depth sign using original M0 dyadic geometry,
     // never infer another cut, OCCT history, or final hidden style.
     const exactCrossing=e.kind==='crossing'?
      exactOriginalM4TransverseCrossingDepth({
       geometry,view,firstEdge:edge,
       secondEdge:sourceById.get(e.otherSourceEdgeId),
       nativeFirstOriginalParameterRange:range
      }):null;
     if(exactCrossing){
      counts.nativeOriginalM4TransverseCrossingEventsFound++;
      if(exactCrossing.strictOriginal3DObserverDepthOrderAtPaperCrossingProven)
       counts.exactOriginal3DStrictFrontDepthAtM4TransverseCrossingsProven++;
      else if(exactCrossing.exactDepthTieAtCrossing)
       counts.exactM4TransverseCrossingsWithDepthTieHeld++;
      else counts.exactM4TransverseCrossingsOutsideOriginalOpenSourceHeld++;
     }
     if(physical)counts.exactOriginal3DPhysicalVertexEncountersCorroborated++;
     else if(e.sourceParameterBoundaryRoundedForDiagnostic)
      counts.roundedSourceParameterEncountersHeld++;
     else counts.paperOnlyOriginalSourceCrossingsAndOverlapsHeld++;
     if(!relation.originalEventOnSameNativePaperLineExactly||
        !relation.originalEventWithinNativePaperEndpointsNumerically)
      counts.M4OriginalEventsWithNativeHLRPaperLineNotExactlyMatched++;
     if(t>range[0]&&t<range[1])
      counts.nativeHLRInteriorPaperEventsRequiringSceneJunctionReview++;
     if(physical&&!nativeEndpointPositive)
      counts.source3DPhysicalEncounterNotAtNativeHLREndpoint++;
     encounters.push({
      view,sourceGeometryId:geometry.id,revision,
      nativeHiddenSharpEdgeOrdinal:global,
      originalPhysical3DSourceEdgeId:source,
      otherOriginal3DSourceEdgeId:e.otherSourceEdgeId,
      originalSourceParameter:t,
      originalEventPaperPoint:{...paper},
      canonicalM4ProjectedEncounterKind:e.kind,
      originalM4RoundedForDiagnostic:e.sourceParameterBoundaryRoundedForDiagnostic,
      positivelySameOriginal3DPhysicalSourceVertex:physical?vertexId:null,
      independentlyNativeHLROriginal3DEndpointCorroborated:
       !!nativeEndpointPositive,
      actualNativeGeneratedBRepPaperRelation:relation,
      exactOriginalM4VertexOtherSourceDepthEvidence:originalEndpointProof,
      original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven:
       !!fullyVerifiedSourceVertex,
      originalHLRGeneratedPaperMismatchRemains:
       !!originalEndpointProof&&
       !relation.originalEventOnSameNativePaperLineExactly,
      exactOriginalM4CrossingObserverDepthEvidence:exactCrossing,
      exactOriginal3DFrontSourceAtTransversePaperCrossing:
       exactCrossing?.strictOriginal3DObserverDepthOrderAtPaperCrossingProven?
        (exactCrossing.exactOriginalSourceAtCrossingFront==='first'?
         source:e.otherSourceEdgeId):null,
      // An exact local strict front crossing is NOT continuous occlusion
      // on neighboring source intervals or a whole-scene final line type.
      fullGlobalProjectedJunctionAndDepthSwitchCertified:false,
      officialGBLineStyle:'undetermined',
      constructionIntentAuthorized:false,signedV5Action:false
     });
     counts.originalM4PaperEncounterOccurrencesCovered++;
    }
    counts.uniqueOriginal3DSourceNativeHLRLinesAudited++;
   }else counts.nativeHiddenLinesUnmappedOrAmbiguousHeld++;
   rows.push({
    view,sourceGeometryId:geometry.id,revision,
    nativeHiddenSharpEdgeOrdinal:global,
    uniqueOriginalPhysical3DSourceEdgeId:original,
    genuineNativeHLROriginalSourceParameterRange:
     range?[...range]:null,
    originalM4ProjectedEncountersOnNativeSource:encounters,
    allEncountersReviewedAgainstCurrentSourceInterval:true,
    noPaperOnlyEncounterPromotedTo3DVertex:true,
    generatedHLREdgeAndOriginalTopoDSIdentityCertified:false,
    completeGlobalProjectedJunctionAndOcclusionCertified:false,
    officialEngineeringLineStyle:'undetermined',
    constructionIntentAuthorized:false,signedV5Action:false
   });
   counts.genuineNativeHiddenSharpEdgesInspected++;global++;
  }
 }
 if(global!==refinements.length||global!==nativeVertexProof.rows.length||
    counts.genuineNativeHiddenSharpEdgesInspected!==rows.length||
    counts.signedV5Actions!==0)
  throw new RangeError('native HLR original complete M4 projected encounters omitted');
 return frozen({
  schema:'draftai-c1-real-native-hidden-hlr-canonical-m4-all-encounters/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  M4CurrentOriginalSourceEventGraphSchema:m4.schema,
  counts,rows,
  entireReviewedNativeHiddenSourceM4EventLedgerAudited:true,
  original3DAndPaperOnlyEventsKeptSeparate:true,
  actualHLRGeneratedToOriginalTopoDSHistoryCertified:false,
  wholeSceneProjectedJunctionAndOcclusionCertified:false,
  applicableGBEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={paperLineEventRelation,auditC1NativeHLRAllM4ProjectedEncounters};
