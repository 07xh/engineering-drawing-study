'use strict';
/**
 * Bridge current genuine OCJS native HCompound physical source proof to
 * authoritative C1 ORIGINAL M5 complete-stroke obligations (#765/#767).
 *
 * A full native PAPER OPEN-interval proof is a real positive mathematical
 * result, but does not prove:
 *  - actual generated OCCT TopoDS edge -> original source edge history,
 *  - every adjacent native HLR edge has the same physical original 3D vertex,
 *  - all opaque faces / projected junctions / engineering GB style, or
 *  - existence of an approved ConstructionIntent, DAG and sole V5 stroke.
 *
 * This is a read-only M5 gate and NEVER introduces a second signer.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {exactOriginalM4TransverseCrossingDepth}=
 require('./c1-m4-exact-original-crossing-depth.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))frozen(x);Object.freeze(o);
}return o;};
const requiredGlobal=[
 'original3DSourceIdentity','completeIntervalVisibility',
 'endpointAndProjectionTopology','engineeringLineStandard',
 'soleConstructionIntentDAGV5'
];
function reviewC1NativeHiddenFinalM5Strokes({
 geometry,revision,gapProof,dualProof,endpointFans,
 nativeVertexProof,projectedEncounters,globalM5Review,nativeHLRJunctionConcordance
}={}){
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    gapProof?.sourceGeometryId!==geometry.id||gapProof.revision!==revision||
    gapProof.signedV5ActionCount!==0||
    gapProof.actualNativeGeneratedHLRPaperCoverageAndOriginalModelProofNotConflated!==true||
    dualProof?.sourceGeometryId!==geometry.id||dualProof.revision!==revision||
    dualProof.signedV5ActionCount!==0||
    endpointFans?.sourceGeometryId!==geometry.id||
    endpointFans.revision!==revision||
    endpointFans.nativeGeneratedTopoDSEdgeEndpointIdentityProven!==false||
    endpointFans.signedV5ActionCount!==0||
    nativeVertexProof?.sourceGeometryId!==geometry.id||
    nativeVertexProof.revision!==revision||
    nativeVertexProof.M4SourceCutGapsStillReportedIndependently!==true||
    nativeVertexProof.allGlobalOCCTHLREdgeJoinsVerified!==false||
    nativeVertexProof.signedV5ActionCount!==0||
    projectedEncounters?.sourceGeometryId!==geometry.id||
    projectedEncounters.revision!==revision||
    projectedEncounters.entireReviewedNativeHiddenSourceM4EventLedgerAudited!==true||
    projectedEncounters.signedV5ActionCount!==0||
    projectedEncounters.wholeSceneProjectedJunctionAndOcclusionCertified!==false||
    !Array.isArray(projectedEncounters.rows)||
    nativeHLRJunctionConcordance?.schema!==
     'draftai-c1-ocjs-native-generated-topods-original-3d-vertex-concordance/1'||
    nativeHLRJunctionConcordance.sourceGeometryId!==geometry.id||
    nativeHLRJunctionConcordance.revision!==revision||
    nativeHLRJunctionConcordance.signedV5ActionCount!==0||
    nativeHLRJunctionConcordance.actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete!==false||
    nativeHLRJunctionConcordance.allPerViewActualNativeGeneratedJunctionComponentsConsumed!==true||
    !Array.isArray(nativeHLRJunctionConcordance.completeGenuineNativeHLRJunctionStars)||
    globalM5Review?.sourceGeometryId!==geometry.id||
    globalM5Review.revision!==revision||
    globalM5Review.schema!=='draftai-c1-m5-final-source-obligation-review/1'||
    globalM5Review.signedV5ActionCount!==0||
    globalM5Review.fullyCertifiedCount!==0||
    !Array.isArray(globalM5Review.rows)||!Array.isArray(gapProof.rows)||
    !Array.isArray(dualProof.rows)||!Array.isArray(endpointFans.rows)||
    gapProof.rows.length!==dualProof.rows.length||
    gapProof.rows.length!==endpointFans.rows.length||
    !Array.isArray(nativeVertexProof.rows)||
    gapProof.rows.length!==nativeVertexProof.rows.length||
    gapProof.rows.length!==projectedEncounters.rows.length)
  throw new TypeError('current original M5 global unsigned review and real native HLR M0/endpoint proof required');
 const byKey=new Map();
 for(const row of globalM5Review.rows){
  if(!VIEWS.includes(row.view)||typeof row.sourceEdgeId!=='string'||
     row.formalLineStyle!=='undetermined'||
     row.constructionIntentAuthorized!==false||row.signedV5Action!==false||
     !row.independentGlobalProofGaps||
     requiredGlobal.some(k=>typeof row.independentGlobalProofGaps[k]!=='boolean')||
     row.independentGlobalProofGaps.engineeringLineStandard!==true||
     row.independentGlobalProofGaps.soleConstructionIntentDAGV5!==true)
   throw new RangeError('prematurely signed or untrusted canonical M5 stroke review');
  const interval=row.originalSourceParameterRange;
  if(!Array.isArray(interval)||interval.length!==2||
     !interval.every(Number.isFinite)||interval[0]<0||
     interval[1]>1||interval[0]>=interval[1])
   throw new RangeError('canonical original M5 source interval is not a finite positive partition');
  const key=row.view+'@'+row.sourceEdgeId;
  if(!byKey.has(key))byKey.set(key,[]);
  byKey.get(key).push(row);
 }
 const sourcePartitionCoverage=new Map();
 for(const [key,sourceRows] of byKey){
  const ordered=[...sourceRows].sort((a,b)=>
   a.originalSourceParameterRange[0]-b.originalSourceParameterRange[0]);
  const gaps=[];
  let cursor=0;
  for(const row of ordered){
   const [begin,end]=row.originalSourceParameterRange;
   if(begin<cursor)throw new RangeError('overlapping canonical original M5 source intervals');
   if(begin>cursor)gaps.push([cursor,begin]);
   cursor=end;
  }
  if(cursor<1)gaps.push([cursor,1]);
  sourcePartitionCoverage.set(key,frozen({complete:gaps.length===0,gaps}));
 }
 // Reconcile the ENTIRE canonical M5 parameter ledger against the original
 // M0 3D edge inventory in V/H/W. Per-source [0,1] coverage alone is not
 // whole-scene coverage: a missing edge/view would otherwise disappear.
 // This is an unsigned interval-inventory witness, NOT an OCCT TopoDS
 // history, all-face occlusion, GB line style, or V5 certificate.
 const originalEdges=geometry.data.edges;
 let canonicalOriginalM5SourceInventory;
 if(!Array.isArray(originalEdges)){
  canonicalOriginalM5SourceInventory=frozen({
   originalM0EdgeInventoryAvailable:false,
   expectedOriginalSourceViewCount:null,
   completeOriginalSourceViewCount:0,
   missingOriginalSourceViews:[],
   incompleteOriginalSourceViewPartitions:[],
   allOriginalSourceViewsHaveCompleteParameterPartitions:false,
   globalOpaqueOcclusionAndHLRSourceHistoryCertified:false,
   signedV5Action:false
  });
 }else{
  const expected=new Set();
  for(const edge of originalEdges){
   if(!Array.isArray(edge)||edge.length!==2||
      !edge.every(x=>typeof x==='string'&&
       Object.prototype.hasOwnProperty.call(geometry.data.points,x))||
      edge[0]===edge[1])
    throw new RangeError('invalid original M0 physical edge inventory');
   const id=geometry.id+'::'+[...edge].sort().join('|');
   for(const view of VIEWS){
    const key=view+'@'+id;
    if(expected.has(key))
     throw new RangeError('duplicate original M0 physical edge in source inventory');
    expected.add(key);
   }
  }
  const unexpected=[...byKey.keys()].filter(k=>!expected.has(k));
  if(unexpected.length)
   throw new RangeError('canonical M5 source ledger references an unknown original M0 edge/view');
  const missing=[...expected].filter(k=>!byKey.has(k));
  const incomplete=[...expected].filter(k=>
   byKey.has(k)&&sourcePartitionCoverage.get(k)?.complete!==true);
  canonicalOriginalM5SourceInventory=frozen({
   originalM0EdgeInventoryAvailable:true,
   expectedOriginalSourceViewCount:expected.size,
   completeOriginalSourceViewCount:expected.size-missing.length-incomplete.length,
   missingOriginalSourceViews:missing,
   incompleteOriginalSourceViewPartitions:incomplete.map(k=>({
    sourceViewKey:k,
    positiveLengthParameterGaps:sourcePartitionCoverage.get(k).gaps
   })),
   allOriginalSourceViewsHaveCompleteParameterPartitions:
    expected.size>0&&missing.length===0&&incomplete.length===0,
   globalOpaqueOcclusionAndHLRSourceHistoryCertified:false,
   signedV5Action:false
  });
 }
 const counts={genuineHiddenHLRStrokesReviewed:0,
  wholeRealNativeHiddenPaperOpenIntervalsLocallyProven:0,
  originalM0ModelPhysicalOpenRayEvidenceWithoutCompleteRealNativeHLR:0,
  missingLocalNativeOrModelOpenProofHeld:0,
  original3DEndpointFanProofIncompleteStrokes:0,
  incompleteCanonicalOriginalSourcePartitions:0,
  missingM4OriginalVertexEndpointsIndependentNativeM0ProofRecovered:0,
  genuineOriginalPhysical3DVertexEndpointIdentityStillUnproven:0,
  originalM4PaperEncounterEventsCrosscheckedAgainstActualHLR:0,
  nativeHLRInteriorProjectedEncounterEventsNotGloballyResolved:0,
  nativeHLRUnprovenExactPaperEventAlignment:0,
  nativeM4CollinearInteriorEventsWithExactFullFrontDepthNoSwitchProof:0,
  nativeM4TransverseCrossingsWithIndependentExactM0AndNativeAnchor:0,
  originalHLRHiddenEndpointsWithGenuineNativeIsSameAndFullyVerifiedOriginal3DStar:0,
  originalHLRHiddenEndpointsAtSharedIsSameButOriginalSourceFanHeld:0,
  nativeHLRHiddenEdgesWithBothNativeIsSameEndpointStarsOriginal3DVerified:0,
  originalM4ProjectedEventsWithVerifiedLocal3DSpatialDisposition:0,
  originalM4ProjectedEventsStillMissingExactLocal3DSpatialDisposition:0,
  nativeHLRSourceStrokesWithCompleteLocal3DEventClassification:0,
  nativeM4TransverseDepthAtTruePaperCrossingButM4CutNotAnchored:0,
  nativeM4InteriorCollinearEventsWithoutPositiveFullFrontNoSwitchProof:0,
  nativePaperMisalignmentWithIndependentAuthenticOriginal3DVertex:0,
  exactOriginal3DSharedVertexWithTwoAuthenticBRepSources:0,
  exactSource3DSharedVertexButNativeGeneratedPaperStillMisaligned:0,
  realGeneratedHLRToOriginalTopoDSProven:0,
  entireGlobalJunctionAndSceneTopologyCertified:0,
  officialStandardSolidOrDashedLineSigned:0,
  formalConstructionIntentDAGV5ActionsSigned:0};
 // Reuse the already-verified global OCCT genuine native vertex stars;
 // no inference from paper coincidence. A connected native generated
 // junction is locally physical only when all its HLR edges pass the
 // independent same-revision original M0/M5 complete source fan proof.
 const nativeStarByEndpoint=new Map();
 for(const star of nativeHLRJunctionConcordance.completeGenuineNativeHLRJunctionStars){
  if(!VIEWS.includes(star.view)||!Array.isArray(star.generatedHLREndpoints)||
     star.generatedHLREndpoints.length<2||
     star.genuineNativeGeneratedOCCTVertexPairwiseIsSame!==true||
     star.originalOCCTGeneratedToSourceTopoDSEdgeHistoryRecovered!==false||
     star.wholeSceneAndEngineeringGBJunctionCertified!==false||
     star.signedV5Action!==false)
   throw new RangeError('untrusted complete generated HLR TopoDS original source star');
  const membersSeen=new Set();
  let hiddenMemberCount=0;
  for(const member of star.generatedHLREndpoints){
   if(!['hidden-sharp','visible-sharp'].includes(member.hlrClass)||
      !Number.isSafeInteger(member.nativeHLREdgeOrdinal)||
      member.nativeHLREdgeOrdinal<0||!['from','to'].includes(member.side))
    throw new RangeError('invalid genuine native HLR endpoint identity');
   const memberKey=member.hlrClass+'@'+member.nativeHLREdgeOrdinal+'@'+member.side;
   if(membersSeen.has(memberKey))
    throw new RangeError('duplicate endpoint inside genuine native IsSame star');
   membersSeen.add(memberKey);
   if(member.hlrClass!=='hidden-sharp')continue;
   hiddenMemberCount++;
   const key=star.view+'@'+member.nativeHLREdgeOrdinal+'@'+member.side;
   if(nativeStarByEndpoint.has(key))
    throw new RangeError('duplicate generated native HLR junction endpoint');
   nativeStarByEndpoint.set(key,star);
  }
  if(hiddenMemberCount===0)
   throw new RangeError('genuine native IsSame star has no reviewed hidden HLR endpoint');
  if(membersSeen.size<2)
   throw new RangeError('genuine native IsSame star has fewer than two distinct HLR endpoints');
  const distinctGeneratedEdges=new Set(star.generatedHLREndpoints.map(member=>
   member.hlrClass+'@'+member.nativeHLREdgeOrdinal));
  if(distinctGeneratedEdges.size<2)
   throw new RangeError('genuine native IsSame star has only one generated HLR edge');
 }
 const perViewNativeOrdinal=new Map(VIEWS.map(view=>[view,0]));
 const rows=[];
 for(let i=0;i<gapProof.rows.length;i++){
  const gap=gapProof.rows[i],dual=dualProof.rows[i],
   fans=endpointFans.rows[i],nativeVertex=nativeVertexProof.rows[i],
   m4Native=projectedEncounters.rows[i];
  if(!VIEWS.includes(gap.view)||dual.view!==gap.view||
     fans.view!==gap.view||gap.nativeHiddenSharpEdgeOrdinal!==i||
     dual.nativeHiddenSharpEdgeOrdinal!==i||
     fans.nativeHiddenSharpEdgeOrdinal!==i||
     gap.signedV5Action!==false||dual.signedV5Action!==false||
     fans.signedV5Action!==false||
     nativeVertex.nativeHiddenSharpEdgeOrdinal!==i||
     nativeVertex.view!==gap.view||nativeVertex.revision!==revision||
     nativeVertex.signedV5Action!==false||
     m4Native.sourceGeometryId!==geometry.id||
     m4Native.revision!==revision||m4Native.view!==gap.view||
     m4Native.nativeHiddenSharpEdgeOrdinal!==i||
     m4Native.allEncountersReviewedAgainstCurrentSourceInterval!==true||
     m4Native.completeGlobalProjectedJunctionAndOcclusionCertified!==false||
     m4Native.signedV5Action!==false||
     nativeVertex.OCCTGeneratedTopoDSNativeEdgeAdjacencyCertified!==false||
     gap.nativeHLRGeneratedSourceTopoDSLinksAndAllJunctionsProven!==false||
     dual.fullGBDashedLineOrVisibleLineAssignmentSigned!==false||
     fans.nativeHLREdgeJunctionsCertified!==false)
   throw new RangeError('real native HLR original source or physical 3D fan evidence drift');
  const edge=dual.originalHiddenSourceEdgeId;
  const unique=dual.remainingOriginal3DPhysicalSourceUnique===true&&
   gap.survivingOriginal3DSourceUnique===true;
  if(m4Native.uniqueOriginalPhysical3DSourceEdgeId!==
      (unique?edge:null))
   throw new RangeError('genuine HLR canonical M4 projected source changed after exact source pruning');
  const originalGlobal=unique?(byKey.get(gap.view+'@'+edge)??[]):[];
  if(unique&&(!edge||originalGlobal.length===0))
   throw new RangeError('genuine native hidden 3D source has no canonical original M5 global stroke review');
  const fanSources=fans.survivingOriginal3DEdgesWithEndpointFans;
  if(!Array.isArray(fanSources))
   throw new TypeError('missing original closed face fan and paper endpoint evidence');
  const sourceFan=fanSources.find(x=>x.originalPhysicalSourceEdgeId===edge);
  if(unique&&(!sourceFan||!Array.isArray(sourceFan.endpointWitnesses)||
     sourceFan.endpointWitnesses.length!==2))
   throw new RangeError('original hidden 3D source lacks authenticated M4 source end fan');
  const endGaps=unique?sourceFan.endpointWitnesses.filter(x=>
   x.originalSource3DVertexId!==null&&
   x.original3DSourceVertexPlusM4AndFanVerified!==true).length:2;
  const realNativeSource=unique?nativeVertex.nativeSource3DVertexEndpointRows
   .find(x=>x.originalPhysicalSourceEdgeId===edge):null;
  if(unique&&(!realNativeSource||
     !Array.isArray(realNativeSource.endpointWitnesses)||
     realNativeSource.endpointWitnesses.length!==2))
   throw new RangeError('native original 3D endpoint positive proof missing');
  const alternativeNative3D=unique?realNativeSource.endpointWitnesses.filter(x=>
   x.originalM4SourceParameterGapRemainsUnrepaired===true&&
   x.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified===true).length:0;
  const remainingTrueOriginal3DVertexGaps=unique?realNativeSource.endpointWitnesses
   .filter(x=>x.originalModel3DSourceVertexId!==null&&
    x.originalM4SourceParameterGapRemainsUnrepaired===true&&
    x.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified!==true).length:2;
  if(alternativeNative3D>endGaps)
   throw new RangeError('original M4 endpoint proof identity budget mismatch');
  counts.missingM4OriginalVertexEndpointsIndependentNativeM0ProofRecovered+=
   alternativeNative3D;
  counts.genuineOriginalPhysical3DVertexEndpointIdentityStillUnproven+=
   remainingTrueOriginal3DVertexGaps;
  const sourceCoverage=unique?sourcePartitionCoverage.get(gap.view+'@'+edge):null;
  const thisNativeOrdinal=perViewNativeOrdinal.get(gap.view);
  perViewNativeOrdinal.set(gap.view,thisNativeOrdinal+1);
  // Both sides are independently checked against the real current native
  // source endpoint M0 vertex ID. The true generated OCCT IsSame star and
  // its original physical vertex ID must coincide, without name/position
  // guessing or tolerance.
  const nativeEndpointStars=['from','to'].map((side,n)=>{
   const star=nativeStarByEndpoint.get(
    gap.view+'@'+thisNativeOrdinal+'@'+side);
   const actualOriginalVertex=unique?
    realNativeSource.endpointWitnesses[n]?.originalModel3DSourceVertexId:null;
   const verified=!!star&&
    star.allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex===true&&
    star.independentlyVerifiedOriginalM03DVertexId!==null&&
    star.independentlyVerifiedOriginalM03DVertexId===actualOriginalVertex&&
    star.independentlyTracedOriginal3DSourceEdges?.includes(edge)===true&&
    (realNativeSource.endpointWitnesses[n]?.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified===true||
     realNativeSource.endpointWitnesses[n]?.existingM4OriginalSourceEndpointVerified===true);
   if(star&&star.allNativeGeneratedEndpointsProvenToTheSameOriginal3DVertex===true&&
      !verified)
    throw new RangeError('genuine native IsSame star conflicts with original hidden 3D endpoint source fan');
   if(verified)
    counts.originalHLRHiddenEndpointsWithGenuineNativeIsSameAndFullyVerifiedOriginal3DStar++;
   else if(star)
    counts.originalHLRHiddenEndpointsAtSharedIsSameButOriginalSourceFanHeld++;
   return {
    nativeHLREndpointSide:side,
    actualGeneratedOCCTVertexIsSameJunctionPresent:!!star,
    independentOriginal3DVertexAndFullHLRJunctionProven:verified,
    independentlyVerifiedOriginalM03DVertexId:
     verified?actualOriginalVertex:null,
    nativeGeneratedToOriginalTopoDSEdgeHistoryStillNotProven:true,
    globalOpaqueSceneAndEngineeringLineStyleCertified:false,
    signedV5Action:false
   };
  });
  if(nativeEndpointStars.every(x=>
   x.independentOriginal3DVertexAndFullHLRJunctionProven))
   counts.nativeHLRHiddenEdgesWithBothNativeIsSameEndpointStarsOriginal3DVerified++;
  if(sourceCoverage?.complete!==true)counts.incompleteCanonicalOriginalSourcePartitions++;
  const allGlobalBlockers=requiredGlobal.filter(k=>
   originalGlobal.some(row=>row.independentGlobalProofGaps[k]===true));
  const localNative=gap.realNativeHLRHiddenPaperLineLocallyExplainedByTrueHLRAndM0FullFront===true;
  const localModel=gap.wholeOriginalModelOpenIntervalLocallyAccountedByRayMaskOrM0Source===true;
  if(localNative&&!localModel)
   throw new RangeError('native hidden true HLR paper mask cannot exist without M0 physical proof');
  if(localNative)
   counts.wholeRealNativeHiddenPaperOpenIntervalsLocallyProven++;
  else if(localModel)
   counts.originalM0ModelPhysicalOpenRayEvidenceWithoutCompleteRealNativeHLR++;
  else counts.missingLocalNativeOrModelOpenProofHeld++;
  if(endGaps>0)counts.original3DEndpointFanProofIncompleteStrokes++;
  const projected=m4Native.originalM4ProjectedEncountersOnNativeSource;
  if(!Array.isArray(projected)||projected.some(e=>
    e.originalPhysical3DSourceEdgeId!==edge||
    e.view!==gap.view||
    e.fullGlobalProjectedJunctionAndDepthSwitchCertified!==false||
    e.signedV5Action!==false))
   throw new RangeError('incomplete genuine native original-source M4 projected graph');
  counts.originalM4PaperEncounterEventsCrosscheckedAgainstActualHLR+=projected.length;
  counts.nativeHLRInteriorProjectedEncounterEventsNotGloballyResolved+=
   projected.filter(e=>e.originalSourceParameter>
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
    e.originalSourceParameter<
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[1]??1)).length;
  counts.nativeHLRUnprovenExactPaperEventAlignment+=projected.filter(e=>
   e.actualNativeGeneratedBRepPaperRelation?.
    originalEventOnSameNativePaperLineExactly!==true).length;
  // Only claim a native stroke's local transverse crossing depth when
  // canonical M4's stored cut equals the EXACT rational source crossing.
  // Independent recomputation prevents a forged downstream ledger from
  // upgrading a rounded diagnostic event to an M5 proof.
  const anchoredTransverse=[];
  for(const event of projected){
   if(event.canonicalM4ProjectedEncounterKind!=='crossing')continue;
   const claimed=event.nativeHLRActualM4EventLocallyAnchoredStrictDepth===true;
   const status=event.exactOriginalM4CrossingObserverDepthEvidence;
   if(!claimed){
    if(status?.strictOriginal3DObserverDepthOrderAtPaperCrossingProven===true&&
       event.canonicalM4EventExactRationalSourceParameterMatch!==true)
     counts.nativeM4TransverseDepthAtTruePaperCrossingButM4CutNotAnchored++;
    continue;
   }
   const edgeMap=new Map((geometry.data.edges??[]).map(ids=>
    [geometry.id+'::'+[...ids].sort().join('|'),ids]));
   const original=edgeMap.get(event.originalPhysical3DSourceEdgeId),
    other=edgeMap.get(event.otherOriginal3DSourceEdgeId),
    nativeRange=m4Native.genuineNativeHLROriginalSourceParameterRange;
   if(!original||!other||!Array.isArray(nativeRange)||
      event.originalM4RoundedForDiagnostic!==false||
      event.canonicalM4EventExactRationalSourceParameterMatch!==true||
      event.actualNativeGeneratedBRepPaperRelation?.
       originalEventOnSameNativePaperLineExactly!==true||
      event.actualNativeGeneratedBRepPaperRelation?.
       originalEventWithinNativePaperEndpointsNumerically!==true||
      event.originalSourceParameter<=nativeRange[0]||
      event.originalSourceParameter>=nativeRange[1])
    throw new RangeError('native transverse crossing claims unauthenticated original M4/OCCT identity');
   const independent=exactOriginalM4TransverseCrossingDepth({
    geometry,view:gap.view,firstEdge:original,secondEdge:other,
    nativeFirstOriginalParameterRange:nativeRange,
    originalM4SourceParameter:event.originalSourceParameter
   });
   const front=independent.exactOriginalSourceAtCrossingFront==='first'?
    event.originalPhysical3DSourceEdgeId:event.otherOriginal3DSourceEdgeId;
   if(!independent.strictOriginal3DObserverDepthOrderAtPaperCrossingProven||
      !independent.originalM4SourceParameterExactlyMatchesRationalCrossing||
      event.exactOriginal3DFrontSourceAtTransversePaperCrossing!==front)
    throw new RangeError('forged canonical M4 rational crossing or incorrect exact M0 observer depth');
   anchoredTransverse.push({
    originalHiddenSourceEdgeId:event.originalPhysical3DSourceEdgeId,
    crossingOtherOriginalSourceEdgeId:event.otherOriginal3DSourceEdgeId,
    localExactObserverFrontSourceEdgeId:front,
    exactOriginalM4ParameterAndRealNativePaperBothAligned:true,
    globalOcclusionTopologyCertified:false,
    engineeringLineStyleCertified:false,signedV5Action:false
   });
  }
  counts.nativeM4TransverseCrossingsWithIndependentExactM0AndNativeAnchor+=
   anchoredTransverse.length;
  // M4's near-endpoint collinear overlap is NOT necessarily an actual
  // visibility switch. Positively reject such a switch only when the
  // already independent full-original M0 exact front depth, current M5
  // CLOSED ray clear, and ACTUAL native VCompound/HCompound full paper
  // witness certifies the SAME two source edges at that parameter.
  const positiveFrontNoSwitch=projected.filter(event=>
   event.canonicalM4ProjectedEncounterKind==='collinear-overlap'&&
   event.originalM4RoundedForDiagnostic===false&&
   event.positivelySameOriginal3DPhysicalSourceVertex===null&&
   event.actualNativeGeneratedBRepPaperRelation?.
    originalEventOnSameNativePaperLineExactly===true&&
   event.originalSourceParameter>
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
   event.originalSourceParameter<
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[1]??1)&&
   (gap.originalM4OrNativePaperPositiveGapWitnesses??[]).some(w=>
    w.originalHiddenSourceParameterRange?.[0]<=event.originalSourceParameter&&
    w.originalHiddenSourceParameterRange?.[1]>=event.originalSourceParameter&&
    w.gapOpenIntervalLocallyCoveredByIndependentM0FrontGeometry===true&&
    w.nativeTrueVisibleAndHiddenHLROpenPaperLineCoverageProven===true&&
    w.exactFullOriginal3DPhysicalFrontSourceWitnesses?.some(p=>
     p.originalFront3DSourceEdgeId===event.otherOriginal3DSourceEdgeId&&
     p.exactlyCoincidentFullOriginalM0PaperEndpoints===true&&
     p.exactDyadicStrictOriginal3DWholeOpenFrontDepth===true&&
     p.independentlyM5ClosedFrontOriginal3DRayClear===true&&
     p.realOCCTOriginalSourceBRep3DCurveVerified===true&&
     p.realVisibleVCompoundAndHiddenHCompoundFullOpenPaperMaskProven===true)
   ));
  const interiorCollinear=projected.filter(e=>
   e.canonicalM4ProjectedEncounterKind==='collinear-overlap'&&
   e.originalSourceParameter>
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
   e.originalSourceParameter<
    (m4Native.genuineNativeHLROriginalSourceParameterRange?.[1]??1));
  counts.nativeM4CollinearInteriorEventsWithExactFullFrontDepthNoSwitchProof+=
   positiveFrontNoSwitch.length;
  counts.nativeM4InteriorCollinearEventsWithoutPositiveFullFrontNoSwitchProof+=
   interiorCollinear.length-positiveFrontNoSwitch.length;
  // Materially useful positive M5 *original 3D* event graph. This only
  // settles the physical spatial meaning of known canonical M4 encounters;
  // OCCT-generated TopoDS adjacency, whole-scene opaque-face topology,
  // standard GB line styles and ConstructionIntent/V5 remain separate.
  // Mutually exclusive local mathematical outcomes:
  // (a) authenticated same-original-3D-vertex from both OCCT BRep curves;
  // (b) exact projected transverse crossing at DIFFERENT original depths;
  // (c) genuine front original source masking a collinear paper encounter.
  const anchoredByEvent=new Set(anchoredTransverse.map(x=>
   x.originalHiddenSourceEdgeId+'@'+x.crossingOtherOriginalSourceEdgeId));
  const noSwitch=new Set(positiveFrontNoSwitch);
  const locallyClassified=projected.map(event=>{
   const realVertex=event.positivelySameOriginal3DPhysicalSourceVertex!==null&&
    event.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven===true&&
    event.exactOriginalM4VertexOtherSourceDepthEvidence?.
     exactOriginalVertexDepthRelativeOtherSourceSign===0;
   const crossing=event.canonicalM4ProjectedEncounterKind==='crossing'&&
    event.nativeHLRActualM4EventLocallyAnchoredStrictDepth===true&&
    anchoredByEvent.has(
     event.originalPhysical3DSourceEdgeId+'@'+event.otherOriginal3DSourceEdgeId);
   const masked=event.canonicalM4ProjectedEncounterKind==='collinear-overlap'&&
    noSwitch.has(event);
   const matches=Number(realVertex)+Number(crossing)+Number(masked);
   if(matches>1)
    throw new RangeError('contradictory original 3D physical event classifications');
   const classification=realVertex?
    'shared-authenticated-original-3d-vertex':
    crossing?'transverse-paper-only-distinct-original-3d-depth':
    masked?'collinear-visible-front-original-3d-depth-mask':
    'undetermined';
   return {
    view:gap.view,originalSourceEdgeId:event.originalPhysical3DSourceEdgeId,
    otherOriginalSourceEdgeId:event.otherOriginal3DSourceEdgeId??null,
    originalM4SourceParameter:event.originalSourceParameter,
    original3DSpatialEventClass:classification,
    original3DSpatialMeaningProven:matches===1,
    actualNativeHLRGeneratedEdgeTopoDSJunctionCertified:false,
    wholeSceneOcclusionCertified:false,
    officialEngineeringLineStyle:'undetermined',
    signedV5Action:false
   };
  });
  const localResolved=locallyClassified.filter(x=>x.original3DSpatialMeaningProven).length;
  counts.originalM4ProjectedEventsWithVerifiedLocal3DSpatialDisposition+=localResolved;
  counts.originalM4ProjectedEventsStillMissingExactLocal3DSpatialDisposition+=
   locallyClassified.length-localResolved;
  if(localResolved===locallyClassified.length&&localResolved>0)
   counts.nativeHLRSourceStrokesWithCompleteLocal3DEventClassification++;
  const physicalVertexPaperDrift=projected.filter(e=>
   e.positivelySameOriginal3DPhysicalSourceVertex!==null&&
   e.actualNativeGeneratedBRepPaperRelation?.
    originalEventOnSameNativePaperLineExactly===false&&
   realNativeSource?.endpointWitnesses.some(w=>
    w.originalModel3DSourceVertexId===
      e.positivelySameOriginal3DPhysicalSourceVertex&&
    (w.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified===true||
     w.existingM4OriginalSourceEndpointVerified===true)));
  counts.nativePaperMisalignmentWithIndependentAuthenticOriginal3DVertex+=
   physicalVertexPaperDrift.length;
  counts.exactOriginal3DSharedVertexWithTwoAuthenticBRepSources+=
   projected.filter(e=>
    e.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven===true).length;
  counts.exactSource3DSharedVertexButNativeGeneratedPaperStillMisaligned+=
   projected.filter(e=>
    e.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven===true&&
    e.originalHLRGeneratedPaperMismatchRemains===true).length;
  counts.genuineHiddenHLRStrokesReviewed++;
  rows.push({
   view:gap.view,revision,sourceGeometryId:geometry.id,
   nativeHiddenSharpEdgeOrdinal:i,
   originalPhysical3DSourceEdgeId:unique?edge:null,
   entireRealOCCTHiddenPaperOpenIntervalLocallyVerified:localNative,
   fullOriginalPhysicalOpen3DSourceRayLocallyVerified:localModel,
   originalSourceM4AndClosed3DVertexFanIncompleteEndpointCount:endGaps,
   originalNative3DVertexEndpointsIndependentlyCorroboratedWithoutM4Cut:
    alternativeNative3D,
   originalNativePhysical3DVertexIdentityStillUnproven:
    remainingTrueOriginal3DVertexGaps,
   nativeGeneratedHLREdgesHaveAllPhysical3DJunctionsCertified:false,
   independentlyVerifiedOCCTNativeIsSameOriginal3DEndpointStars:nativeEndpointStars,
   bothRealNativeHLREndpointGeneratedJunctionStarsHaveOriginal3DSourceProof:
    nativeEndpointStars.every(x=>
     x.independentOriginal3DVertexAndFullHLRJunctionProven),
   originalGlobalSourceM5StrokeRowsReviewed:originalGlobal.length,
   canonicalOriginalSourceParameterPartitionComplete:sourceCoverage?.complete===true,
   canonicalOriginalSourceParameterGaps:sourceCoverage?.gaps??null,
   jointPositiveM5Prerequisites:{
    completeSourceParameterCoverage:sourceCoverage?.complete===true,
    original3DEndpointAndM4FanTopology:remainingTrueOriginal3DVertexGaps===0&&
     nativeEndpointStars.every(x=>x.independentOriginal3DVertexAndFullHLRJunctionProven),
    continuousOriginalModelAndRealNativeHLROcclusion:localNative&&localModel
   },
   jointPositiveM5PrerequisitesSatisfied:
    sourceCoverage?.complete===true&&remainingTrueOriginal3DVertexGaps===0&&
    nativeEndpointStars.every(x=>x.independentOriginal3DVertexAndFullHLRJunctionProven)&&
    localNative&&localModel,
   additionalCanonicalM5GlobalBlockers:allGlobalBlockers,
   canonicalOriginalM4ProjectedEncountersAudited:projected.length,
   currentOriginalM4SourceSpatialEventClassifications:locallyClassified,
   allCurrentOriginalM4SourceEncountersLocally3DClassified:
    locallyClassified.length>0&&localResolved===locallyClassified.length,
   nativeGeneratedHLRAndAllOpaqueFacesStillNeedGlobalProof:true,
   nativeM4TransverseExactLocalDepthAndNativeHLRAnchors:anchoredTransverse,
   collinearNativeInteriorEventsWithIndependentFullFrontNoDepthSwitchProof:
    positiveFrontNoSwitch.map(e=>({
     originalSourceParameter:e.originalSourceParameter,
     originalHidden3DEdgeId:e.originalPhysical3DSourceEdgeId,
     originalFront3DEdgeId:e.otherOriginal3DSourceEdgeId,
     completeSource3DDepthAndRealOCCTHLRPaperProof:true,
     generatedHLREdgeTopoDSIdentityAndGBLineCertified:false,
     signedV5Action:false
    })),
   exactModelSpace3DSharedSourceVerticesWithVerifiedOriginalBRep:
    projected.filter(e=>
     e.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven===true)
    .map(e=>({
     originalVertexId:e.positivelySameOriginal3DPhysicalSourceVertex,
     twoGenuineOriginalOCCT3DSourceCurvesVerified:true,
     M0ExactDyadicOriginalObserverDepthTie:
      e.exactOriginalM4VertexOtherSourceDepthEvidence?.
       exactOriginalVertexDepthRelativeOtherSourceSign===0,
     nativeHLRGeneratedPaperAlignmentProven:
      e.originalHLRGeneratedPaperMismatchRemains===false&&
      e.actualNativeGeneratedBRepPaperRelation?.
       originalEventOnSameNativePaperLineExactly===true,
     generatedHLRToOriginalTopoDSHistoryStillUnverified:true,
     globalEngineeringLineStyleSigned:false,signedV5Action:false
    })),
   nativePaperDriftAtIndependentlyProvenOriginal3DVertices:
    physicalVertexPaperDrift.map(e=>({
     originalVertexId:e.positivelySameOriginal3DPhysicalSourceVertex,
     originalSourceParameter:e.originalSourceParameter,
     original3DPhysicalJunctionAlreadyPositivelyProven:true,
     exactNativeHLRGeneratedPaperPointEqual:false,
     globalEngineeringJunctionLineStyleCertified:false,
     signedV5Action:false
    })),
   canonicalNativeHLRInteriorProjectedEventsStillNeedGlobalReview:
    projected.filter(e=>e.originalSourceParameter>
     (m4Native.genuineNativeHLROriginalSourceParameterRange?.[0]??0)&&
     e.originalSourceParameter<
     (m4Native.genuineNativeHLROriginalSourceParameterRange?.[1]??1)).length,
   allProjectedEncountersAndDepthSwitchesResolved:false,
   actualOCCTGeneratedEdgeToOriginalTopoDSIdentityCertified:false,
   engineeringGBSolidOrDashedLineStandardFullyCertified:false,
   officialEngineeringLineStyle:'undetermined',
   authorizedConstructionIntent:false,
   signedConstructionStepDAGOrSoleV5Action:false,
   signedV5Action:false
  });
 }
 if(counts.originalHLRHiddenEndpointsWithGenuineNativeIsSameAndFullyVerifiedOriginal3DStar+
    counts.originalHLRHiddenEndpointsAtSharedIsSameButOriginalSourceFanHeld>
    counts.genuineHiddenHLRStrokesReviewed*2||
    counts.nativeHLRHiddenEdgesWithBothNativeIsSameEndpointStarsOriginal3DVerified>
    counts.genuineHiddenHLRStrokesReviewed)
  throw new RangeError('native whole junction M5 endpoint certification coverage mismatch');
 if(counts.originalM4ProjectedEventsWithVerifiedLocal3DSpatialDisposition+
    counts.originalM4ProjectedEventsStillMissingExactLocal3DSpatialDisposition!==
    counts.originalM4PaperEncounterEventsCrosscheckedAgainstActualHLR||
    counts.nativeHLRSourceStrokesWithCompleteLocal3DEventClassification>
    counts.genuineHiddenHLRStrokesReviewed)
  throw new RangeError('incomplete mathematical classification of C1 native source paper encounters');
 if(counts.genuineHiddenHLRStrokesReviewed!==gapProof.rows.length||
    counts.realGeneratedHLRToOriginalTopoDSProven!==0||
    counts.officialStandardSolidOrDashedLineSigned!==0||
    counts.formalConstructionIntentDAGV5ActionsSigned!==0)
  throw new RangeError('incomplete genuine OCCT HLR to canonical M5 global style gate');
 // Join the complete original M0 V/H/W source inventory to the actual
 // reviewed native hidden HLR rows. This is an explicit whole-scene
 // *coverage deficit* report, never a positive GB/V5 certificate.
 const nativeReviewedSourceViews=new Set(rows.filter(row=>
  typeof row.originalPhysical3DSourceEdgeId==='string').map(row=>
  row.view+'@'+row.originalPhysical3DSourceEdgeId));
 const globallyUnreviewedSourceViews=[...byKey.keys()].filter(key=>
  !nativeReviewedSourceViews.has(key));
 const nativeReviewedWithoutCanonicalSource=[...nativeReviewedSourceViews].filter(key=>
  !byKey.has(key));
 if(nativeReviewedWithoutCanonicalSource.length)
  throw new RangeError('native hidden HLR review has no matching canonical M5 original source ledger');
 const nativeSourceCoverageByView=VIEWS.map(view=>{
  const canonical=[...byKey.keys()].filter(key=>key.startsWith(view+'@'));
  const native=[...nativeReviewedSourceViews].filter(key=>key.startsWith(view+'@'));
  return frozen({
   view,canonicalSourceCount:canonical.length,
   nativeHiddenReviewedSourceCount:native.length,
   canonicalSourcesWithoutNativeHiddenReview:canonical.filter(key=>
    !nativeReviewedSourceViews.has(key)),
   completeCanonicalParameterSources:canonical.filter(key=>
    sourcePartitionCoverage.get(key)?.complete===true).length,
   canonicalSourceParameterGaps:canonical.filter(key=>
    sourcePartitionCoverage.get(key)?.complete!==true).map(key=>({
     sourceViewKey:key,positiveLengthParameterGaps:
      sourcePartitionCoverage.get(key)?.gaps??[[0,1]]
    })),
   fullNativeVisibleAndHiddenHLRSourceHistoryCertified:false,
   continuousAllOpaqueFaceOcclusionCertified:false,
   signedV5ActionCount:0
  });
 });
 const canonicalViewTotal=nativeSourceCoverageByView.reduce((n,x)=>
  n+x.canonicalSourceCount,0);
 const nativeViewTotal=nativeSourceCoverageByView.reduce((n,x)=>
  n+x.nativeHiddenReviewedSourceCount,0);
 if(canonicalViewTotal!==byKey.size||
    nativeViewTotal!==nativeReviewedSourceViews.size)
  throw new RangeError('V/H/W source ledger and native HLR coverage totals disagree');
 const wholeSceneSourceHLRAndM5Closure=frozen({
  originalM0AllViewSourceParameterCoverageComplete:
   canonicalOriginalM5SourceInventory.allOriginalSourceViewsHaveCompleteParameterPartitions,
  canonicalSourceViewRows:byKey.size,
  nativeSourceCoverageByView,
  nativeReviewedSourceViewRows:nativeReviewedSourceViews.size,
  canonicalSourceViewsWithoutNativeHiddenReview:globallyUnreviewedSourceViews,
  nativeHiddenReviewCoverageIsNotWholeHLRVisibilityCoverage:true,
  missingOriginalM0SourceViews:
   canonicalOriginalM5SourceInventory.missingOriginalSourceViews,
  incompleteOriginalM0SourceViewParameterPartitions:
   canonicalOriginalM5SourceInventory.incompleteOriginalSourceViewPartitions,
  fullOriginalTopoDSGeneratedHLRHistoryCertified:false,
  allOpaqueFacesContinuousM5OcclusionCertified:false,
  allProjectedJunctionsCertified:false,
  engineeringGBLineStyleCertified:false,
  authorizedSoleV5ActionCount:0,
  wholeSceneMathematicallySigned:false
 });
 return frozen({
  schema:'draftai-c1-real-native-hlr-complete-open-interval-final-m5-signoff-gate/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,canonicalOriginalM5SourceInventory,wholeSceneSourceHLRAndM5Closure,
  independentOriginalM0ModelAndNativeOCCTPositiveEvidenceUsed:true,
  originalClosedVertexStarAndGlobalM5ScopeConsumed:true,
  actualHLRGeneratedBRepEdgeTopoDSHistoryComplete:false,
  completeGloballySigned3DAndProjectedStrokeJunctionGraph:false,
  officialEngineeringGBLineRulesCertified:false,
  constructionIntentAuthorized:false,
  signedConstructionStepDAGActions:0,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={reviewC1NativeHiddenFinalM5Strokes};
