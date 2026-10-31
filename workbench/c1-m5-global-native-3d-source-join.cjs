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
  const id=key(klass,ordinal);
  if(globallyGenerated.has(id))
   throw new RangeError('duplicate original 3D source owner of global generated HLR edge');
  globallyGenerated.set(id,row);
 }
 if(globallyGenerated.size!==total)
  throw new RangeError('whole-solid native 3D HLR source does not cover every global ordinal');
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
  generated2DTopoDSHistoryCertified:false,
  globalOpaqueSceneContinuousOcclusionCertified:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0,
  officialV5Authorized:false
 });
}
module.exports={auditC1M5NativeGlobal3DSourceJoin};
