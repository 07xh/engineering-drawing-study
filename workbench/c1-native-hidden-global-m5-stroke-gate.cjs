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
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
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
 nativeVertexProof,projectedEncounters,globalM5Review,nativeHLRJunctionConcordance,
 nativeSourceAudit
}={}){
 if(!geometry?.data?.points||!Number.isSafeInteger(revision)||revision<1||
    nativeSourceAudit?.schema!==
     'draftai-c1-ocjs-real-hidden-sharp-m5-original-source-audit/1'||
    nativeSourceAudit.sourceGeometryId!==geometry.id||
    nativeSourceAudit.revision!==revision||
    !Array.isArray(nativeSourceAudit.rows)||
    nativeSourceAudit.counts?.sourceViewIntervalsChecked!==
     nativeSourceAudit.rows.length||
    nativeSourceAudit.signedV5ActionCount!==0||
    nativeSourceAudit.nativeHLRVertexConcordance!==nativeHLRJunctionConcordance||
    nativeSourceAudit.nativeHidden3DEndpointFans!==endpointFans||
    nativeSourceAudit.nativeHiddenOriginalVertexEndpointProof!==nativeVertexProof||
    nativeSourceAudit.nativeHLRAllM4ProjectedEncounters!==projectedEncounters||
    nativeSourceAudit.nativeHiddenDualOpenIntervalProof!==dualProof||
    nativeSourceAudit.nativeHiddenExactOriginalFrontGap!==gapProof||
    nativeSourceAudit.nativeHiddenFrontVisibleMask?.signedV5ActionCount!==0||
    nativeSourceAudit.nativeHiddenExactModelFrontMask?.signedV5ActionCount!==0||
    nativeSourceAudit.nativeHiddenFrontVisibleMask?.sourceGeometryId!==geometry.id||
    nativeSourceAudit.nativeHiddenExactModelFrontMask?.sourceGeometryId!==geometry.id||
    nativeSourceAudit.nativeHiddenFrontVisibleMask?.revision!==revision||
    nativeSourceAudit.nativeHiddenExactModelFrontMask?.revision!==revision||
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
 // A single real OCCT run must deliver all six proof branches on the SAME
 // 3D source/view identity. Never infer this from independent success flags.
 // The per-source proof is issued upstream by native OCCT. Before this
 // FINAL M5 consumer accepts even its local source-ready state, rebuild
 // exact binary64 coverage from its actual positive intervals. A stale
 // full/empty-gap flag or a forged unique source subset is not a proof.
 const intervalsMatch=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const recheck=proof=>{
  if(!proof||!Array.isArray(proof.originalParameterRange)||
     proof.originalParameterRange.length!==2||
     proof.originalParameterRange[0]!==0||
     proof.originalParameterRange[1]!==1||
     !Array.isArray(proof.positiveLengthCoveredIntervals)||
     !Array.isArray(proof.positiveLengthUncoveredIntervals))
   throw new RangeError('missing exact same-run M4/M5/native HLR source interval ledger');
  const checked=exactCandidateIntervalCoverage([0,1],
   proof.positiveLengthCoveredIntervals);
  if(!intervalsMatch(checked.positiveLengthCoveredIntervals,
      proof.positiveLengthCoveredIntervals)||
     !intervalsMatch(checked.positiveLengthUncoveredIntervals,
      proof.positiveLengthUncoveredIntervals)||
     checked.entireOriginalParameterIntervalCovered!==
      proof.entireOriginalParameterIntervalCovered)
   throw new RangeError('contradictory exact native M4/M5 source parameter intervals');
  return checked;
 };
 const jointSourceByKey=new Map();
 for(const row of nativeSourceAudit.rows){
  const joint=row.canonicalM4M5NativeHLRJointSourceIntervalEvidence;
  const key=row.view+'@'+row.sourceEdgeId;
  const checkedM4=recheck(joint?.canonicalM4ParameterCoverage),
   checkedPaper=recheck(joint?.genuineNativeHiddenHLRCandidateParameterCoverage),
   checkedUnique=recheck(joint?.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage);
  // Each physical identity interval MUST be included in genuine real-HLR
  // projected source candidate evidence; unique M5 pruning can only
  // remove alternatives, never invent paper coverage.
  for(const interval of checkedUnique.positiveLengthCoveredIntervals)
   if(!exactCandidateIntervalCoverage(interval,
     checkedPaper.positiveLengthCoveredIntervals).entireOriginalParameterIntervalCovered)
    throw new RangeError('unique original 3D source proof exceeds actual native HLR paper coverage');
  if(joint.originalM4Full3DSourceIntervalProven===true&&
      !checkedM4.entireOriginalParameterIntervalCovered||
     joint.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage!==
      checkedPaper.entireOriginalParameterIntervalCovered||
     joint.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage!==
      checkedUnique.entireOriginalParameterIntervalCovered)
   throw new RangeError('native OCCT physical-source full-coverage flags contradict independent exact intervals');
  if(!VIEWS.includes(row.view)||typeof row.sourceEdgeId!=='string'||
     row.sourceGeometryId!==geometry.id||row.revision!==revision||
     row.signedV5Action!==false||row.officialEngineeringStyle!=='undetermined'||
     !joint||joint.view!==row.view||
     joint.sourceEdgeId!==row.sourceEdgeId||
     joint.canonicalM4Original3DAndM5RayCutUnionRecomputed!==true||
     joint.engineeringLineStyle!=='undetermined'||
     joint.constructionIntentAuthorized!==false||
     joint.signedV5Action!==false||
     joint.allActualGeneratedTopoDSSourceHistoryAndSceneOcclusionProven!==false||
     joint.full3DEndpointAndEngineeringLineStyleProven!==false||
     !joint.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage||
     joint.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage!==
      joint.uniqueOriginal3DNativeHiddenHLRCandidateParameterCoverage.
       entireOriginalParameterIntervalCovered||
     (joint.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage===true&&
      joint.actualNativeHiddenHLRCandidateFullOriginalParameterCoverage!==true)||
     joint.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete!==(
      joint.originalM4Full3DSourceIntervalProven===true&&
      joint.actualNativeHiddenHLRUnique3DSourceFullOriginalParameterCoverage===true)||
     jointSourceByKey.has(key))
   throw new RangeError('stale, duplicate or forged M4/M5/native OCCT 3D source-view join');
  jointSourceByKey.set(key,joint);
 }
 // Only an actual reviewed M0 mesh carries the complete V/H/W edge
 // universe. Focused unit fixtures deliberately supply partial source
 // graphs to test independently held crossings and junctions.
 if(geometry.kind==='mesh'&&geometry.space==='model-3d'&&
    geometry.unit==='mm'&&Array.isArray(geometry.data.edges)&&
    (jointSourceByKey.size!==geometry.data.edges.length*VIEWS.length||
     geometry.data.edges.some(ids=>VIEWS.some(view=>
      !jointSourceByKey.has(view+'@'+geometry.id+'::'+[...ids].sort().join('|'))))))
  throw new RangeError('C1 native HLR/M4/M5 incomplete original source-view universe');
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
 // Reconcile every original M0 physical edge across all first-angle views.
 // A perfect local native hidden interval cannot certify a scene with an
 // omitted physical edge/view. This is source COVERAGE only, not visibility.
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
   signedV5Action:false
  });
 }else{
  const expected=new Set();
  for(const edge of originalEdges){
   if(!Array.isArray(edge)||edge.length!==2||
      !edge.every(v=>typeof v==='string'&&
       Object.prototype.hasOwnProperty.call(geometry.data.points,v))||
      edge[0]===edge[1])
    throw new RangeError('invalid original M0 physical edge inventory');
   const sourceId=geometry.id+'::'+[...edge].sort().join('|');
   for(const view of VIEWS){
    const key=view+'@'+sourceId;
    if(expected.has(key))
     throw new RangeError('duplicate original M0 physical edge in source inventory');
    expected.add(key);
   }
  }
  if([...byKey.keys()].some(key=>!expected.has(key)))
   throw new RangeError('canonical M5 source ledger references unknown original M0 edge/view');
  const missing=[...expected].filter(key=>!byKey.has(key));
  const incomplete=[...expected].filter(key=>
   byKey.has(key)&&sourcePartitionCoverage.get(key)?.complete!==true);
  canonicalOriginalM5SourceInventory=frozen({
   originalM0EdgeInventoryAvailable:true,
   expectedOriginalSourceViewCount:expected.size,
   completeOriginalSourceViewCount:expected.size-missing.length-incomplete.length,
   missingOriginalSourceViews:missing,
   incompleteOriginalSourceViewPartitions:incomplete.map(key=>({
    sourceViewKey:key,
    positiveLengthParameterGaps:sourcePartitionCoverage.get(key).gaps
   })),
   allOriginalSourceViewsHaveCompleteParameterPartitions:
    expected.size>0&&missing.length===0&&incomplete.length===0,
   signedV5Action:false
  });
 }
 const counts={genuineHiddenHLRStrokesReviewed:0,
  jointM4M5NativeHLROriginal3DSourceViewsConsumed:jointSourceByKey.size,
  nativeHiddenStrokesWithFullM4M5AndHLRSourceCoverage:0,
  nativeHiddenStrokesWithUnprovenJointPhysicalSourceCoverage:0,
  realNativeHiddenOpenIntervalsWithIndependentlyRecomputedM5Occlusion:0,
  realNativeHiddenOpenIntervalsWithUnprovenM5Occlusion:0,
  nativeHLRLocallyCompleteSourceOcclusionAndActual3DVertexStars:0,
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
  for(const member of star.generatedHLREndpoints){
   if(member.hlrClass!=='hidden-sharp')continue;
   const key=star.view+'@'+member.nativeHLREdgeOrdinal+'@'+member.side;
   if(!['from','to'].includes(member.side)||nativeStarByEndpoint.has(key))
    throw new RangeError('duplicate generated native HLR junction endpoint');
   nativeStarByEndpoint.set(key,star);
  }
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
  const directNativeEdge= nativeSourceAudit.nativeHiddenSourceRefinements?.[i]?.
   actualGeneratedOCCTTopoDSDirectOriginalBRepIsSameEvidence;
  if(directNativeEdge?.nativeGeneratedEdgeDirectOriginalIsSameCompared!==true||
     directNativeEdge.allM0OriginalPhysicalOCCTSourceEdgesCompared!==true||
     directNativeEdge.fullGeneratedTopoDSOriginalBRepEdgeHistoryRecovered!==false||
     directNativeEdge.signedV5Action!==false)
   throw new RangeError('global C1 M5 native generated edge direct OCCT source IsSame witness missing');
  const directlySameOriginal=directNativeEdge.
   directlySameUniqueOriginalOCCTBRepSourceEdgeId;
  if(directlySameOriginal!==null&&
     (!unique||directlySameOriginal!==edge))
   throw new RangeError('native generated TopoDS IsSame original source contradicts M5 hidden physical source identity');
  const sourceCoverage=unique?sourcePartitionCoverage.get(gap.view+'@'+edge):null;
  const nativeJoined=unique?jointSourceByKey.get(gap.view+'@'+edge):null;
  if(unique&&(!nativeJoined||sourceCoverage?.complete===true&&
       nativeJoined.originalM4Full3DSourceIntervalProven!==true))
   throw new RangeError('canonical M5 complete source contradicts actual M4 original 3D source proof');
  const sourceAndNativeComplete=sourceCoverage?.complete===true&&
   nativeJoined?.originalM4AndNativeHiddenHLRPhysicalSourceIntervalBothComplete===true;
  if(sourceAndNativeComplete)
   counts.nativeHiddenStrokesWithFullM4M5AndHLRSourceCoverage++;
  else counts.nativeHiddenStrokesWithUnprovenJointPhysicalSourceCoverage++;
  // Recalculate continuous ORIGINAL 3D ray occlusion from the two real
  // same-run positive proof interval types. A source edge may project to
  // more than one genuine HLR segment: use this exact segment's parameter
  // range rather than confusing source-[0,1] with one generated TopoDS edge.
  let exactNativeIntervalM5Occlusion=null;
  if(unique){
   const claimed=dual.independentOpenIntervalRayAndFrontVisibleUnion,
    range=m4Native.genuineNativeHLROriginalSourceParameterRange;
   if(!claimed||!Array.isArray(range)||range.length!==2||
      !range.every(Number.isFinite)||range[0]<0||range[1]>1||
      range[0]>=range[1]||
      claimed.originalSourceParameterRange?.[0]!==range[0]||
      claimed.originalSourceParameterRange?.[1]!==range[1]||
      dual.originalHiddenSourceEdgeId!==edge||
      dual.locallyExplainedNativeHiddenOpenPaperInterval!==
       claimed.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor||
      claimed.globallyFinalStandardLineStyleCertified!==false||
      claimed.completeOCCTGeneratedBRepEdgeOriginalTopoDSHistory!==false||
      claimed.signedV5Action!==false)
    throw new RangeError('real native generated HLR interval lacks same-source M5 continuous observer-ray evidence');
   const inside=exactCandidateIntervalCoverage(range,
     claimed.strictInteriorIndependentlyVerifiedIntervals),
    visible=exactCandidateIntervalCoverage(range,
     claimed.realVisibleFrontSourceDepthMaskVerifiedIntervals),
    union=exactCandidateIntervalCoverage(range,[
     ...inside.positiveLengthCoveredIntervals,
     ...visible.positiveLengthCoveredIntervals]);
   if(!intervalsMatch(inside.positiveLengthCoveredIntervals,
        claimed.strictInteriorIndependentlyVerifiedIntervals)||
      !intervalsMatch(visible.positiveLengthCoveredIntervals,
        claimed.realVisibleFrontSourceDepthMaskVerifiedIntervals)||
      !intervalsMatch(union.positiveLengthCoveredIntervals,
        claimed.onlyLocallyVerifiedHiddenOrFrontMaskIntervals)||
      !intervalsMatch(union.positiveLengthUncoveredIntervals,
        claimed.outstandingUnprovedOriginalParameterIntervals)||
      union.entireOriginalParameterIntervalCovered!==
       claimed.entireActualNativeHLROpenPaperIntervalLocallyAccountedFor||
      inside.entireOriginalParameterIntervalCovered!==
       claimed.strictInwardSourceEntireOpenIntervalProven||
      visible.entireOriginalParameterIntervalCovered!==
       claimed.independentFrontVisibleSourceMaskEntireOpenIntervalProven)
    throw new RangeError('native generated TopoDS original-source M5 ray coverage contradicts independently exact interval union');
   exactNativeIntervalM5Occlusion=union;
  }else if(dual.independentOpenIntervalRayAndFrontVisibleUnion!==null&&
            dual.independentOpenIntervalRayAndFrontVisibleUnion!==undefined)
   throw new RangeError('nonunique generated HLR edge cannot own original M5 source interval proof');
  if(exactNativeIntervalM5Occlusion?.entireOriginalParameterIntervalCovered)
   counts.realNativeHiddenOpenIntervalsWithIndependentlyRecomputedM5Occlusion++;
  else counts.realNativeHiddenOpenIntervalsWithUnprovenM5Occlusion++;
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
  const localSourceOcclusionAndTopoDSVertices=sourceAndNativeComplete&&
   exactNativeIntervalM5Occlusion?.entireOriginalParameterIntervalCovered===true&&
   nativeEndpointStars.every(x=>
    x.independentOriginal3DVertexAndFullHLRJunctionProven);
  if(localSourceOcclusionAndTopoDSVertices)
   counts.nativeHLRLocallyCompleteSourceOcclusionAndActual3DVertexStars++;
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
   sameRunCanonicalM4M5NativeHLRJointPhysicalSourceCoverage:
    sourceAndNativeComplete,
   genuineGeneratedTopoDSEdgeDirectOriginalSourceIsSameWitness:
    directNativeEdge,
   generatedTopoDSEdgePhysicallySameAsM5OriginalBRepSource:
    directlySameOriginal!==null&&directlySameOriginal===edge,
   independentlyRecomputedCanonicalM4M5NativeSourceEvidence:
    nativeJoined??null,
   actualNativeTopodsOpenIntervalContinuousM5CoverageIndependentlyRecomputed:
    exactNativeIntervalM5Occlusion??null,
   localOriginal3DSourceExactM5OcclusionAndNativeIsSameEndpointConjunction:
    localSourceOcclusionAndTopoDSVertices,
   generatedTopoDSEdgeOriginalTopoDSEdgeHistoryStillMissing:true,
   jointPositiveM5Prerequisites:{
    completeSourceParameterCoverage:sourceAndNativeComplete,
    original3DEndpointAndM4FanTopology:remainingTrueOriginal3DVertexGaps===0&&
     nativeEndpointStars.every(x=>x.independentOriginal3DVertexAndFullHLRJunctionProven),
    continuousOriginalModelAndRealNativeHLROcclusion:localNative&&localModel&&
     exactNativeIntervalM5Occlusion?.entireOriginalParameterIntervalCovered===true
   },
   jointPositiveM5PrerequisitesSatisfied:
    sourceAndNativeComplete&&remainingTrueOriginal3DVertexGaps===0&&
    nativeEndpointStars.every(x=>x.independentOriginal3DVertexAndFullHLRJunctionProven)&&
    localNative&&localModel&&
    exactNativeIntervalM5Occlusion?.entireOriginalParameterIntervalCovered===true,
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
 if(counts.realNativeHiddenOpenIntervalsWithIndependentlyRecomputedM5Occlusion+
     counts.realNativeHiddenOpenIntervalsWithUnprovenM5Occlusion!==
      counts.genuineHiddenHLRStrokesReviewed||
    counts.nativeHLRLocallyCompleteSourceOcclusionAndActual3DVertexStars>
     counts.realNativeHiddenOpenIntervalsWithIndependentlyRecomputedM5Occlusion||
    counts.nativeHiddenStrokesWithFullM4M5AndHLRSourceCoverage+
     counts.nativeHiddenStrokesWithUnprovenJointPhysicalSourceCoverage!==
      counts.genuineHiddenHLRStrokesReviewed||
    counts.genuineHiddenHLRStrokesReviewed!==gapProof.rows.length||
    counts.realGeneratedHLRToOriginalTopoDSProven!==0||
    counts.officialStandardSolidOrDashedLineSigned!==0||
    counts.formalConstructionIntentDAGV5ActionsSigned!==0)
  throw new RangeError('incomplete genuine OCCT HLR to canonical M5 global style gate');
 return frozen({
  schema:'draftai-c1-real-native-hlr-complete-open-interval-final-m5-signoff-gate/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,canonicalOriginalM5SourceInventory,
  allSameRunCanonicalM4M5AndNativeHLRSourceViewsJoined:true,
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
