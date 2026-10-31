'use strict';
/**
 * Bind an unresolved C1 M5 generated-paper claimant to the SAME-RUN
 * whole-solid native GENERATED 3D HLR -> ORIGINAL BRep source-curve ledger.
 *
 * The HLR 3D curve was independently matched with the original 3D curve at
 * three native parameters and a unique whole-solid 2D paper edge. A competing
 * paper alias must NOT inherit that source's geometry or become an M5 line.
 *
 * This is source attribution evidence, not a generated 2D TopoDS ancestry
 * certificate, complete opaque-scene occlusion, GB line type, or V5 authority.
 */
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))freeze(v);
  Object.freeze(o);
 }
 return o;
};
const {auditC1Native3DSourceScopedIntervals}=
 require('./c1-native-source-scoped-3d-parameter-coverage.cjs');
const {project}=require('../core/projection/conventions.js');
const {auditC1Global3D2DPaperPairEnvelope}=
 require('../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
const {auditC1ExactBinary64PaperAffineWitness}=
 require('./c1-exact-binary64-paper-affine.cjs');
const {auditC1ExactTwoAxisGeneratedPaperCoverage}=
 require('./c1-exact-two-axis-generated-paper-coverage.cjs');
const CLASS_COUNTS={'visible-sharp':'views','hidden-sharp':'hiddenSharpViews'};
const key=(klass,ordinal)=>klass+'|'+ordinal;

function auditC1M5NativeGlobal3DSourceJoin({
 geometry,cad,view,sourceEdgeId,generatedClaims
}={}){
 const native=cad?.nativeSourceScopedSharpOutputByView?.[view]
  ?.nativeGlobal3DOriginalSourceEvidence;
 if(native==null)return null;
 if(!['V','H','W'].includes(view)||!geometry?.id||
    !Array.isArray(geometry?.data?.edges)||
    !Number.isSafeInteger(cad?.revision)||cad.revision<1||
    typeof sourceEdgeId!=='string'||!Array.isArray(generatedClaims))
  throw new TypeError('reviewed C1 global 3D source proof requires original geometry and generated claims');
 const originalIds=new Set(geometry.data.edges.map(e=>
  geometry.id+'::'+[...e].sort().join('|')));
 // Use the ACTUAL same-run ORIGINAL BRep curve ledger, rather than trusting
 // the generated 3D row's "already matched" flag or its source ID alone.
 const originalCurves=new Map();
 if(!Array.isArray(cad.originalBRepSourceEdges)||
    cad.originalBRepSourceEdges.length!==originalIds.size)
  throw new RangeError('native global 3D HLR needs complete actual original BRep curve inventory');
 for(const original of cad.originalBRepSourceEdges){
  const range=original?.occtSourceCurveParameterRange,owner=original?.sourceEdgeId;
  if(!originalIds.has(owner)||originalCurves.has(owner)||
     original.occtSourceCurveType!=='line'||
     original.originalOCCTBRepVertexXYZMatched!==true||
     original.occtSourceCurve3DEndpointsAndMidpointVerified!==true||
     !Array.isArray(range)||range.length!==2||
     !range.every(Number.isFinite)||!(range[1]>range[0]))
   throw new RangeError('native global 3D HLR original BRep curve source is incomplete');
  originalCurves.set(owner,range);
 }
 const scopedSources=cad.nativeSourceScopedSharpOutputByView?.[view]?.rows;
 if(!Array.isArray(scopedSources)||scopedSources.length!==originalIds.size)
  throw new RangeError('native global 3D HLR needs full original scoped 3D source inventory');
 const scopedById=new Map();
 for(const scoped of scopedSources){
  const owner=scoped?.originalPhysicalSourceEdgeId;
  if(!originalIds.has(owner)||scopedById.has(owner))
   throw new RangeError('native global 3D HLR scoped source IDs invalid or repeated');
  scopedById.set(owner,scoped);
 }
 // Reconstruct the COMPLETE source-scoped native 3D interval multiset
 // before trusting any whole-solid generated ordinal. One global HLR edge
 // cannot reuse the first scoped native interval while silently dropping a
 // second interval from the same physical source and visibility class.
 // The source-filtered 3D intervals are real OCCT curve parameters, not
 // inverses derived from rounded 2D paper endpoints.
 const scopedIntervalOwners=new Map();
 const native3DSourceParameterCoverageByOriginalSource=[];
 for(const [sourceId,scoped] of scopedById){
  const originalRange=originalCurves.get(sourceId),allRanges=[];
  for(const [klass,groupName] of [
   ['visible-sharp','visible3D'],['hidden-sharp','hidden3D']
  ]){
   const group=scoped[groupName],intervals=group?.native3DGeneratedCurveIntervals;
   if(group?.nativeSourceFilteredOriginalTopoDSEdge!==true||
      !Array.isArray(intervals)||intervals.length>512)
    throw new RangeError('incomplete native source-scoped 3D HLR visibility class');
   for(const emitted of intervals){
    const range=emitted?.nativeOriginalCurveParameterRange;
    if(emitted?.nativeSourceFilterOriginalEdgeId!==sourceId||
       emitted.native3DCurveExactlySameAsOriginalAtThreeParameters!==true||
       emitted.originalGeneratedTopoDSHistoryCertified!==false||
       emitted.signedV5Action!==false||
       !Array.isArray(range)||range.length!==2||
       !range.every(Number.isFinite)||!(range[1]>range[0]))
     throw new RangeError('invalid native source-scoped 3D HLR parameter interval');
    const emissionKey=JSON.stringify([sourceId,klass,...range]);
    if(scopedIntervalOwners.has(emissionKey))
     throw new RangeError('duplicate native source-scoped 3D HLR parameter interval');
    scopedIntervalOwners.set(emissionKey,false);
    allRanges.push(range);
   }
  }
  const proof=auditC1Native3DSourceScopedIntervals({
   originalNativeParameterRange:originalRange,
   generatedNativeParameterRanges:allRanges
  });
  native3DSourceParameterCoverageByOriginalSource.push({
   sourceEdgeId:sourceId,
   originalNativeParameterRange:[...originalRange],
   positiveLengthUncoveredNativeParameterIntervals:
    proof.positiveLengthUncoveredNativeParameterIntervals,
   positiveLengthOverlappingNativeParameterIntervals:
    proof.positiveLengthOverlappingNativeParameterIntervals,
   native3DSourceIntervalsCoverWholeOriginalExactlyOnce:
    proof.sourceScopedNative3DParameterInventoryCompleteExactlyOnce,
   generated2DTopoDSHistoryCertified:false,
   globalContinuousVisibilityCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 // Cross-check actual ORIGINAL TopoDS physical endpoints with M0 before
 // matching 2D generated output. In legacy isolated tests without M0 points,
 // leave this entire additional joint certificate explicitly unavailable.
 // A successful native interval bijection alone does NOT imply paper history.
 const originalPhysicalEndpoints=new Map();
 const physicalModelPresent=geometry.kind==='mesh'&&
  geometry.space==='model-3d'&&geometry.unit==='mm'&&
  geometry.data?.points&&typeof geometry.data.points==='object';
 if(physicalModelPresent){
  const p=geometry.data.points;
  const eq=(a,b)=>a&&b&&['x','y','z'].every(k=>
   Number.isFinite(a[k])&&Number.isFinite(b[k])&&a[k]===b[k]);
  for(const edge of geometry.data.edges){
   if(!Array.isArray(edge)||edge.length!==2||edge[0]===edge[1]||
      !edge.every(id=>typeof id==='string'&&Object.hasOwn(p,id)))
    throw new RangeError('original physical M0 edge endpoints incomplete');
   const id=geometry.id+'::'+[...edge].sort().join('|');
   const original=cad.originalBRepSourceEdges.find(x=>x.sourceEdgeId===id);
   const a=p[edge[0]],b=p[edge[1]];
   if(!original||!(eq(original.fromOCCT3D,a)&&eq(original.toOCCT3D,b)||
                   eq(original.fromOCCT3D,b)&&eq(original.toOCCT3D,a)))
    throw new RangeError('original native BRep physical 3D endpoints contradict current M0');
   originalPhysicalEndpoints.set(id,{sourceFrom3D:{...a},sourceTo3D:{...b}});
  }
  if(originalPhysicalEndpoints.size!==originalIds.size)
   throw new RangeError('original M0/native BRep physical identity inventory incomplete');
 }
 const counts={};
 for(const [klass,collection] of Object.entries(CLASS_COUNTS)){
  const edges=cad?.[collection]?.[view];
  if(!Array.isArray(edges))throw new RangeError('same-run generated HLR ordinal inventory unavailable');
  counts[klass]=edges.length;
 }
 const total=counts['visible-sharp']+counts['hidden-sharp'];
 if(native.schema!=='draftai-c1-global-native-hlr-3d-original-curve-corroboration/1'||
    native.sourceGeometryId!==geometry.id||native.revision!==cad.revision||
    native.view!==view||
    native.allGenerated3DSharpCurvesBoundToOriginalBRepAnd2DPaper!==true||
    native.globalGenerated2DSharpEdges!==total||
    native.globalGenerated3DSharpEdgesWithUniqueOriginalCurve!==total||
    native.generated2DTo3DTopoDSHistoryCertified!==false||
    native.globalContinuousVisibilityCertified!==false||
    native.officialV5Authorized!==false||
    native.signedV5ActionCount!==0||
    !Array.isArray(native.rows)||native.rows.length!==total)
  throw new RangeError('same-run global native 3D HLR source ledger is incomplete or unsigned contract forged');
 // A real OCJS run retains the actual GENERATED 3D edge endpoint XYZ.
 // Reproject those binary64 points onto the same-run whole-solid 2D HLR
 // ordinal. A summary boolean is not enough: M5 rechecks real coordinates.
 // Legacy isolated fixtures without these XYZ points remain unsigned.
 const measured3DInventory=
  native.receivedNativeGenerated3DSourceEndpointsRecordedForEveryGlobal2DOrdinal===true;
 if(native.receivedNativeGenerated3DSourceEndpointsRecordedForEveryGlobal2DOrdinal!==undefined&&
    !measured3DInventory)
  throw new RangeError('invalid real native 3D HLR endpoint inventory flag');
 const measured3D2DPairs=new Map();
 const globallyGenerated=new Map();
 for(const row of native.rows){
  const ordinal=row?.wholeSolidGeneratedHLREdgeOrdinal;
  const klass=row?.hlrClass;
  const interval=row?.originalNativeCurveParameterRange,
   originalInterval=originalCurves.get(row?.originalPhysicalSourceEdgeId),
   scoped=scopedById.get(row?.originalPhysicalSourceEdgeId),
   sourceClass=klass==='visible-sharp'?scoped?.visible3D:scoped?.hidden3D,
   scopedIntervals=sourceClass?.native3DGeneratedCurveIntervals,
   matchingScoped=Array.isArray(scopedIntervals)&&Array.isArray(interval)?
    scopedIntervals.filter(x=>x?.nativeSourceFilterOriginalEdgeId===
      row.originalPhysicalSourceEdgeId&&
      x.native3DCurveExactlySameAsOriginalAtThreeParameters===true&&
      x.originalGeneratedTopoDSHistoryCertified===false&&
      x.signedV5Action===false&&
      Array.isArray(x.nativeOriginalCurveParameterRange)&&
      x.nativeOriginalCurveParameterRange.length===2&&
      x.nativeOriginalCurveParameterRange[0]===interval[0]&&
      x.nativeOriginalCurveParameterRange[1]===interval[1]):[];
  if(!Object.hasOwn(CLASS_COUNTS,klass)||
     row.view!==view||!Number.isSafeInteger(ordinal)||
     ordinal<0||ordinal>=counts[klass]||
     !originalIds.has(row.originalPhysicalSourceEdgeId)||
     !Array.isArray(interval)||interval.length!==2||
     !interval.every(Number.isFinite)||!(interval[1]>interval[0])||
     !Array.isArray(originalInterval)||interval[0]<originalInterval[0]||
     interval[1]>originalInterval[1]||
     sourceClass?.nativeSourceFilteredOriginalTopoDSEdge!==true||
     matchingScoped.length!==1||
     row.globalNative3DHLRCurveEqualsOriginalBRepAtThreeParameters!==true||
     row.global3DAnd2DHLRMeasuredPaperPairUnique!==true||
     typeof row.global3DAnd2DHLRMeasuredPaperPairExactBinary64!=='boolean'||
     typeof row.global3DAnd2DHLRMeasuredPaperPairBoundedSourceScaleULPOnly!=='boolean'||
     // The actual native 3D->generated 2D paper pairing must be exact
     // or one source-scale ULP bounded. A tolerant paper alias is NOT a
     // source proof, and neither branch certifies TopoDS history.
     Number(row.global3DAnd2DHLRMeasuredPaperPairExactBinary64===true)+
     Number(row.global3DAnd2DHLRMeasuredPaperPairBoundedSourceScaleULPOnly===true)!==1||
     row.global3DAndOriginalScoped3DHLRParameterIntervalExact!==true||
     row.globalGenerated2DTo3DTopoDSHistoryCertified!==false||
     row.fullOpaqueSceneContinuousOcclusionCertified!==false||
     row.engineeringLineStyle!=='undetermined'||row.signedV5Action!==false)
   throw new RangeError('invalid native whole-solid HLR original 3D curve identity or source interval');
  const scopedIntervalKey=JSON.stringify([
   row.originalPhysicalSourceEdgeId,klass,...interval
  ]);
  if(scopedIntervalOwners.get(scopedIntervalKey)!==false)
   throw new RangeError('whole-solid native 3D HLR reuses or lacks scoped interval owner');
  scopedIntervalOwners.set(scopedIntervalKey,true);
  const actualFrom=row.nativeGlobalGeneratedHLR3DFrom,
   actualTo=row.nativeGlobalGeneratedHLR3DTo,
   hasActualFrom=Object.hasOwn(row,'nativeGlobalGeneratedHLR3DFrom'),
   hasActualTo=Object.hasOwn(row,'nativeGlobalGeneratedHLR3DTo');
  if(hasActualFrom!==hasActualTo||measured3DInventory!==hasActualFrom)
   throw new RangeError('incomplete same-run measured global native HLR 3D endpoints');
  let measuredPair=null;
  if(measured3DInventory){
   const finite3D=p=>p&&['x','y','z'].every(axis=>
    typeof p[axis]==='number'&&Number.isFinite(p[axis]));
   if(!finite3D(actualFrom)||!finite3D(actualTo))
    throw new RangeError('nonfinite real global native HLR 3D curve endpoint');
   const actualPaper={from:project(actualFrom)[view],to:project(actualTo)[view]};
   const global2D=cad[CLASS_COUNTS[klass]][view][ordinal];
   const verified=auditC1Global3D2DPaperPairEnvelope(actualPaper,global2D);
   if(!verified.compatible||
      verified.exactBinary64Endpoints!==
       row.global3DAnd2DHLRMeasuredPaperPairExactBinary64||
      verified.sourceScaleOneULPBoundedRoundingOnly!==
       row.global3DAnd2DHLRMeasuredPaperPairBoundedSourceScaleULPOnly)
    throw new RangeError('real native generated 3D endpoints contradict global 2D HLR paper or recorded ULP class');
   measuredPair={
    view,hlrClass:klass,globalOrdinal:ordinal,
    sourceEdgeId:row.originalPhysicalSourceEdgeId,
    nativeGenerated3DFrom:{...actualFrom},nativeGenerated3DTo:{...actualTo},
    projectedGenerated3DPaperFrom:{...actualPaper.from},
    projectedGenerated3DPaperTo:{...actualPaper.to},
    receivedGenerated2DPaperFrom:{...global2D.from},
    receivedGenerated2DPaperTo:{...global2D.to},
    exactBinary64PaperEndpoints:verified.exactBinary64Endpoints,
    sourceScaleULPBoundedOnly:verified.sourceScaleOneULPBoundedRoundingOnly,
    generated2DTopoDSHistoryCertified:false,
    globalOpaqueSceneContinuousOcclusionCertified:false,signedV5Action:false
   };
  }
  const id=key(klass,ordinal);
  if(measuredPair)measured3D2DPairs.set(id,measuredPair);
  if(globallyGenerated.has(id))
   throw new RangeError('duplicate original 3D source owner of global generated HLR edge');
  globallyGenerated.set(id,row);
 }
 if(globallyGenerated.size!==total)
  throw new RangeError('whole-solid native 3D HLR source does not cover every global ordinal');
 if([...scopedIntervalOwners.values()].some(consumed=>!consumed))
  throw new RangeError('whole-solid native 3D HLR omitted a source-scoped original parameter interval');
 // Join real same-run whole-solid 3D ORIGINAL curve intervals to the
 // corresponding actual 2D HLR edges by ordinal, then re-check the
 // independent M0 physical projection with exact dyadic arithmetic.
 // OCCT 2D endpoints may drift by a positive ULP; keep those unmodified,
 // and never infer original/generated TopoDS ancestry from a paper pairing.
 const native3DToGenerated2DPaperByOriginalSource=[];
 if(physicalModelPresent)for(const sourceId of originalIds){
  const endpoints=originalPhysicalEndpoints.get(sourceId),parts=[];
  for(const row of native.rows){
   if(row.originalPhysicalSourceEdgeId!==sourceId)continue;
   const keyName=CLASS_COUNTS[row.hlrClass];
   const generated=cad[keyName][view][row.wholeSolidGeneratedHLREdgeOrdinal];
   const from=generated?.from,to=generated?.to;
   if(![from,to].every(p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v))||
      from.u===to.u&&from.v===to.v)
    throw new RangeError('actual whole-solid HLR generated 2D edge is missing or collapsed');
   const originalFrom=project(endpoints.sourceFrom3D)[view],
    originalTo=project(endpoints.sourceTo3D)[view];
   let exactPaperAffine=null;
   if(originalFrom.u!==originalTo.u||originalFrom.v!==originalTo.v)
    exactPaperAffine=auditC1ExactBinary64PaperAffineWitness({
     sourceFrom:originalFrom,sourceTo:originalTo,
     measuredFrom:from,measuredTo:to
    });
   const measured3D=measured3D2DPairs.get(
    key(row.hlrClass,row.wholeSolidGeneratedHLREdgeOrdinal))??null;
   parts.push({
    nativeGenerated3DEndpointTo2DPaperReplayVerified:measured3D!==null,
    original3DSourceCurveProjectedPaperFrom:
     measured3D?.projectedGenerated3DPaperFrom??null,
    original3DSourceCurveProjectedPaperTo:
     measured3D?.projectedGenerated3DPaperTo??null,
    hlrClass:row.hlrClass,
    wholeSolidGeneratedHLREdgeOrdinal:row.wholeSolidGeneratedHLREdgeOrdinal,
    originalNative3DSourceParameterInterval:[...row.originalNativeCurveParameterRange],
    receivedNative2DPaperFrom:{...from},receivedNative2DPaperTo:{...to},
    exactReceivedPaperBothEndpointsOnOriginalSourceLine:
     exactPaperAffine?.bothNativeEndpointsExactlyOnOriginalBinary64PaperLine??null,
    exactReceivedPaperFromCrossProduct:
     exactPaperAffine?.exactBinary64PaperFromCrossProductDyadic??null,
    exactReceivedPaperToCrossProduct:
     exactPaperAffine?.exactBinary64PaperToCrossProductDyadic??null,
    actualGenerated2DTopoDSOriginalSourceParameterHistoryProven:false,
    nativeGenerated2DVertex3DJunctionIdentityCertified:false,
    allOpaqueSceneContinuousOcclusionCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false
   });
  }
  const sourceFrom=project(endpoints.sourceFrom3D)[view],
   sourceTo=project(endpoints.sourceTo3D)[view],
   collapsed=sourceFrom.u===sourceTo.u&&sourceFrom.v===sourceTo.v;
  let exactTwoAxis=null,heldReason=null;
  if(!collapsed){
   try{
    exactTwoAxis=auditC1ExactTwoAxisGeneratedPaperCoverage({
     sourceFrom,sourceTo,
     segments:parts.map(p=>({
      from:p.receivedNative2DPaperFrom,to:p.receivedNative2DPaperTo
     }))
    });
   }catch(error){
    // Positive out-of-domain paper drift is a mathematical hold,
    // NOT an excuse to snap or trim the received HLR endpoints.
    if(!(error instanceof RangeError&&
         /outside exact original source domain/.test(error.message)))
     throw error;
    heldReason='actual-generated-2d-paper-outside-original-exact-source-domain';
   }
  }else heldReason='original-source-collapses-under-this-first-angle-projection';
  // Keep 3D curve projection and RECEIVED generated 2D paper as separate
  // exact two-axis source-coverage witnesses: an actual positive drift in
  // either one is never silently rounded into full source coverage.
  let measured3DTwoAxis=null;
  if(!collapsed&&measured3DInventory){
   try{
    measured3DTwoAxis=auditC1ExactTwoAxisGeneratedPaperCoverage({
     sourceFrom,sourceTo,
     segments:parts.map(p=>({
      from:p.original3DSourceCurveProjectedPaperFrom,
      to:p.original3DSourceCurveProjectedPaperTo
     }))
    });
   }catch(error){
    if(!(error instanceof RangeError&&
       /outside exact original source domain/.test(error.message)))
     throw error;
   }
  }
  const nativeCoverage=native3DSourceParameterCoverageByOriginalSource
   .find(x=>x.sourceEdgeId===sourceId);
  if(!nativeCoverage)
   throw new RangeError('missing whole-solid original 3D native source coverage');
  const native3DComplete=nativeCoverage.native3DSourceIntervalsCoverWholeOriginalExactlyOnce;
  const paperComplete=exactTwoAxis?.strictReceivedTwoAxisPaperCoverageComplete===true;
  native3DToGenerated2DPaperByOriginalSource.push({
   view,sourceEdgeId:sourceId,revision:cad.revision,
   originalProjectedSourceFrom:sourceFrom,originalProjectedSourceTo:sourceTo,
   originalPhysical3DEndpointsVerifiedAgainstNativeBRep:true,
   exactNative3DParameterCoverageCompleteOnce:native3DComplete,
   exactReceived2DTwoAxisPaperCoverageComplete:paperComplete,
   native3DProjectedSourcePaperCoverageReplayed:measured3DTwoAxis!==null,
   native3DProjectedSourcePaperTwoAxisCoverageComplete:
    measured3DTwoAxis?.strictReceivedTwoAxisPaperCoverageComplete??false,
   positiveNative3DProjectedSourcePaperGaps:
    measured3DTwoAxis?.exactTwoAxisQualifiedPaperCoverage
     .exactBinary64PaperPositiveLengthUncoveredIntervals??null,
   native3DGeneratedPaperTransverseDriftEdges:
    measured3DTwoAxis?.transverseDisplacedSegmentsHeld??null,
   positiveNative3DSourceParameterGaps:
    nativeCoverage.positiveLengthUncoveredNativeParameterIntervals,
   positiveNative3DSourceParameterOverlaps:
    nativeCoverage.positiveLengthOverlappingNativeParameterIntervals,
   positiveExactReceived2DPaperGaps:
    exactTwoAxis?.exactTwoAxisQualifiedPaperCoverage
     .exactBinary64PaperPositiveLengthUncoveredIntervals??null,
   transverseGenerated2DPaperDriftEdges:
    parts.filter(p=>p.exactReceivedPaperBothEndpointsOnOriginalSourceLine===false)
     .map(p=>({hlrClass:p.hlrClass,
      ordinal:p.wholeSolidGeneratedHLREdgeOrdinal})),
   heldReason,parts,
   native3DAndReceived2DPaperGeometryBothClosedButNotTopoDSHistory:
    native3DComplete&&paperComplete,
   generated2DTopoDSHistoryCertified:false,
   physicalGenerated3DEndpointJunctionsCertified:false,
   globalOpaqueSceneContinuousOcclusionCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }

 if(!originalIds.has(sourceEdgeId))
  throw new RangeError('held M5 source is not an original reviewed 3D edge');
 let sourceCorroborated=0,differentSource=0,unknownOrdinal=0;
 const claims=[];
 const seen=new Set();
 for(const paper of generatedClaims){
  const klass=paper?.hlrClass,ordinal=paper?.wholeSolidGeneratedHLREdgeOrdinal;
  if(!Object.hasOwn(CLASS_COUNTS,klass)||!Number.isSafeInteger(ordinal)||
     ordinal<0||ordinal>=counts[klass])
   throw new RangeError('held M5 claimant references an invalid global HLR ordinal');
  const id=key(klass,ordinal);
  if(seen.has(id))throw new RangeError('duplicate global HLR source candidate within one M5 obligation');
  seen.add(id);
  const truth=globallyGenerated.get(id);
  const same=truth?.originalPhysicalSourceEdgeId===sourceEdgeId;
  sourceCorroborated+=Number(same);
  differentSource+=Number(!!truth&&!same);
  unknownOrdinal+=Number(!truth);
  claims.push({
   hlrClass:klass,wholeSolidGeneratedHLREdgeOrdinal:ordinal,
   actualNativeGlobal3DOriginalSourceEdgeId:truth?.originalPhysicalSourceEdgeId??null,
   original3DCurveAndScopedNativeParameterIntervalCorroborated:same,
   paperOnlyCandidateActuallyBelongsToDifferent3DSource:!!truth&&!same,
   originalNativeCurveParameterRange:same?[...truth.originalNativeCurveParameterRange]:null,
   sameRunOriginalBRepCurveBoundsAndSourceFilteredNative3DIntervalRechecked:true,
   sameRunNativeGenerated3DCurveReprojectedOntoActual2D:
    measured3D2DPairs.has(id),
   generated2DTopoDSHistoryCertified:false,
   wholeOpaqueSceneContinuousVisibilityCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 return freeze({
  schema:'draftai-c1-m5-global-native-3d-original-source-join/1',
  sourceGeometryId:geometry.id,revision:cad.revision,view,sourceEdgeId,
  globalGeneratedEdgeCount:total,
  globallyUnique3DBRepCurveSources:globallyGenerated.size,
  claimCount:claims.length,sourceCorroboratedClaims:sourceCorroborated,
  differentOriginal3DSourceClaimsHeld:differentSource,
  unknownGlobalOrdinalClaimsHeld:unknownOrdinal,claims,
  sameRunOriginalBRepAndScoped3DParameterInventoryRechecked:true,
  wholeSolidAndScopedNative3DParameterIntervalBijectionVerified:true,
  completeMeasuredNativeGlobal3D2DPaperReplayAvailable:measured3DInventory,
  independentlyReplayedMeasuredGlobal3D2DPaperCount:measured3D2DPairs.size,
  nativeGlobal3DTo2DMeasuredPaperPairs:[...measured3D2DPairs.values()],
  native3DSourceParameterCoverageByOriginalSource,
  wholeSolid3DOriginalSourceToGenerated2DExactPaperJointAvailable:
   physicalModelPresent,
  native3DToGenerated2DPaperByOriginalSource,
  sourceViewsWithNative3DAndExactGenerated2DPaperCoverage:
   native3DToGenerated2DPaperByOriginalSource.filter(x=>
    x.native3DAndReceived2DPaperGeometryBothClosedButNotTopoDSHistory).length,
  sourceViewsWithTransverseGeneratedPaperDrift:
   native3DToGenerated2DPaperByOriginalSource.filter(x=>
    x.transverseGenerated2DPaperDriftEdges.length>0).length,
  originalSourcesWithPositiveNative3DParameterGaps:
   native3DSourceParameterCoverageByOriginalSource.filter(x=>
    x.positiveLengthUncoveredNativeParameterIntervals.length>0).length,
  originalSourcesWithOverlappingNative3DParameters:
   native3DSourceParameterCoverageByOriginalSource.filter(x=>
    x.positiveLengthOverlappingNativeParameterIntervals.length>0).length,
  generated2DTopoDSHistoryCertified:false,
  globalOpaqueSceneContinuousOcclusionCertified:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0,
  officialV5Authorized:false
 });
}
module.exports={auditC1M5NativeGlobal3DSourceJoin};
