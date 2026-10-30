'use strict';
/**
 * One reviewed convex C1 W-paper positive gap: corroborate the SAME physical
 * M0 source and same-run OCCT original EdgeStatus / native generated 3D
 * source-curve intervals / original CLOSED ray / M4 open co-projected depth.
 *
 * This does not fill a positive 2D paper interval, prove the generated 2D
 * TopoDS history, certify the closed generated paper endpoints or authorize
 * an engineering line/V5. A different opaque solid or a paper-only alias
 * requires the full-scene M5 gate independently.
 */
const {auditC1Native3DSourceScopedIntervals}=
 require('./c1-native-source-scoped-3d-parameter-coverage.cjs');
const {project}=require('../core/projection/conventions.js');
const {dyadic,difference}=require('../core/numeric/binary64-dyadic.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);
  Object.freeze(x);
 }
 return x;
};
const finiteRange=r=>Array.isArray(r)&&r.length===2&&
 r.every(Number.isFinite)&&r[1]>r[0];
const same=(a,b)=>a?.[0]===b?.[0]&&a?.[1]===b?.[1];

function auditC1WNativeClosedPhysicalGap({
 geometry,cad,view,sourceEdgeId,positiveGap,
 originalStatus,global3DSource,m4Depth,
 originalClosedRayClear,openRayClass,exactPaperGap,originalEndpointWitnesses
}={}){
 if(view!=='W')return null;
 if(typeof geometry?.id!=='string'||!geometry.id||
    geometry.kind!=='mesh'||geometry.space!=='model-3d'||
    geometry.unit!=='mm'||!Number.isSafeInteger(cad?.revision)||
    cad.revision<1||!finiteRange(positiveGap)||
    positiveGap[0]<0||positiveGap[1]>1||
    typeof sourceEdgeId!=='string'||!sourceEdgeId.startsWith(geometry.id+'::'))
  throw new TypeError('current closed convex W original source and positive paper gap required');
 const sources=geometry.data?.edges?.filter(e=>
  Array.isArray(e)&&e.length===2&&
  geometry.id+'::'+[...e].sort().join('|')===sourceEdgeId)??[];
 if(sources.length!==1)
  throw new RangeError('W positive gap does not have a unique original M0 physical source');
 // Synthetic M5 fixtures may lack an OCCT run; the explicit held result is
 // never a fabricated positive source proof.
 const curve=cad.originalBRepSourceEdges?.filter(x=>
  x.sourceEdgeId===sourceEdgeId)??[];
 const scoped=cad.nativeSourceScopedSharpOutputByView?.W?.rows?.filter(x=>
  x.originalPhysicalSourceEdgeId===sourceEdgeId)??[];
 if(curve.length===0||scoped.length===0||originalStatus==null||
    global3DSource==null)return freeze({
  schema:'draftai-c1-w-m5-native-closed-original-gap-joint/1',
  view,sourceEdgeId,originalPositivePaperGap:[...positiveGap],
  status:'held-missing-real-native-original-proof',
  exactWholeOriginal3DSourceNativeVisibleCurveProven:false,
  wholeReviewedConvexOriginalClosedSourceRayClear:false,
  coProjectedOriginalSourceOpenFrontmostProven:false,
  generatedPaperGapStrictlyPositiveStillHeld:true,
  generated2DTopoDSHistoryCertified:false,
  globalOpaqueSceneContinuousVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
 if(curve.length!==1||scoped.length!==1)
  throw new RangeError('duplicated native original W BRep source');
 const original=curve[0],src=scoped[0],bounds=original.occtSourceCurveParameterRange;
 if(!finiteRange(bounds)||original.occtSourceCurveType!=='line'||
    original.originalOCCTBRepVertexXYZMatched!==true||
    original.occtSourceCurve3DEndpointsAndMidpointVerified!==true||
    !src.visible3D||!src.hidden3D||
    src.visible3D.nativeSourceFilteredOriginalTopoDSEdge!==true||
    src.hidden3D.nativeSourceFilteredOriginalTopoDSEdge!==true||
    !Array.isArray(src.visible3D.native3DGeneratedCurveIntervals)||
    !Array.isArray(src.hidden3D.native3DGeneratedCurveIntervals))
  throw new RangeError('W gap original native HLR parameter interval evidence incomplete');
 const validClass=(arr)=>arr.every(x=>
  x?.nativeSourceFilterOriginalEdgeId===sourceEdgeId&&
  x.native3DCurveExactlySameAsOriginalAtThreeParameters===true&&
  x.originalGeneratedTopoDSHistoryCertified===false&&
  x.signedV5Action===false&&finiteRange(x.nativeOriginalCurveParameterRange));
 const visible=src.visible3D.native3DGeneratedCurveIntervals;
 const hidden=src.hidden3D.native3DGeneratedCurveIntervals;
 if(!validClass(visible)||!validClass(hidden))
  throw new RangeError('native W original HLR visible/hidden curve has forged parameter history');
 const checked=auditC1Native3DSourceScopedIntervals({
  originalNativeParameterRange:bounds,
  generatedNativeParameterRanges:[...visible,...hidden].map(x=>x.nativeOriginalCurveParameterRange)
 });
 const claimed=src.combinedNative3DSourceParameterPartition;
 if(!same(claimed?.originalNativeParameterRange,bounds)||
    claimed?.schema!==checked.schema||
    claimed.sourceScopedNative3DParameterInventoryCompleteExactlyOnce!==
     checked.sourceScopedNative3DParameterInventoryCompleteExactlyOnce||
    JSON.stringify(claimed.generatedNativeParameterRanges)!==
     JSON.stringify(checked.generatedNativeParameterRanges)||
    JSON.stringify(claimed.positiveLengthUncoveredNativeParameterIntervals)!==
     JSON.stringify(checked.positiveLengthUncoveredNativeParameterIntervals)||
    JSON.stringify(claimed.positiveLengthOverlappingNativeParameterIntervals)!==
     JSON.stringify(checked.positiveLengthOverlappingNativeParameterIntervals))
  throw new RangeError('W original native 3D parameter partition contradicts current OCCT source');
 if(originalStatus.view!=='W'||originalStatus.originalPhysicalSourceEdgeId!==sourceEdgeId||
    !Number.isSafeInteger(originalStatus.nativeHLROriginalEdgeMapIndex)||
    originalStatus.nativeHLROriginalEdgeMapIndex<1||
    originalStatus.generated2DHLREdgeToOriginalSourceHistoryCertified!==false||
    originalStatus.globalContinuousM5OcclusionCertified!==false||
    originalStatus.engineeringLineStyle!=='undetermined'||
    originalStatus.signedV5Action!==false)
  throw new RangeError('W native original EdgeStatus does not bind original source');
 if(global3DSource.view!=='W'||global3DSource.sourceEdgeId!==sourceEdgeId||
    global3DSource.sourceGeometryId!==geometry.id||
    global3DSource.revision!==cad.revision||
    global3DSource.generated2DTopoDSHistoryCertified!==false||
    global3DSource.officialV5Authorized!==false||
    !Array.isArray(global3DSource.claims))
  throw new RangeError('W global native generated 3D HLR source revision mismatch');
 const sameClass=originalStatus.originalSourceClass==='all-visible'&&
  originalStatus.originalEdgeStatusAllVisible===true&&
  originalStatus.originalEdgeStatusAllHidden===false&&
  originalStatus.nativeOriginalVisiblePartCount===1;
 const nativeFullVisible=sameClass&&hidden.length===0&&
  visible.length>0&&checked.sourceScopedNative3DParameterInventoryCompleteExactlyOnce;
 const claimed3D=global3DSource.claims.filter(x=>
  x.actualNativeGlobal3DOriginalSourceEdgeId===sourceEdgeId&&
  x.original3DCurveAndScopedNativeParameterIntervalCorroborated===true&&
  x.hlrClass==='visible-sharp');
 const globalVisible=auditC1Native3DSourceScopedIntervals({
  originalNativeParameterRange:bounds,
  generatedNativeParameterRanges:claimed3D.map(x=>x.originalNativeCurveParameterRange)
 });
 const globalFull=nativeFullVisible&&
  global3DSource.differentOriginal3DSourceClaimsHeld===0&&
  global3DSource.unknownGlobalOrdinalClaimsHeld===0&&
  globalVisible.sourceScopedNative3DParameterInventoryCompleteExactlyOnce;
 // Independently check RECEIVED whole-solid generated 2D sharp-edge
 // paper coordinates against the original M0 vertices. Native 3D source
 // identity is already proved by the separate global3DSource consumer,
 // but never grants identical binary64 paper endpoints or vertex TShape
 // history. Record the exact dyadic displacements without epsilon.
 let paperEndpointAudit=null;
 if(originalEndpointWitnesses!==undefined){
  const matches=global3DSource.claims.filter(x=>
   x.actualNativeGlobal3DOriginalSourceEdgeId===sourceEdgeId&&
   x.original3DCurveAndScopedNativeParameterIntervalCorroborated===true);
  if(!Array.isArray(originalEndpointWitnesses)||
     originalEndpointWitnesses.length!==matches.length||!matches.length)
   throw new RangeError('W original source and generated HLR endpoint ledgers lack bijection');
  const [a,b]=sources[0].map(id=>project(geometry.data.points?.[id])?.W);
  if(![a,b].every(p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v)))
   throw new RangeError('nonfinite original W paper projected physical endpoint');
  const samePaper=(x,y)=>x.u===y.u&&x.v===y.v;
  const seen=new Set(),rows=[];
  for(const claim of matches){
   const cls=claim.hlrClass,ordinal=claim.wholeSolidGeneratedHLREdgeOrdinal;
   const outputs=cls==='visible-sharp'?cad.views?.W:
    cls==='hidden-sharp'?cad.hiddenSharpViews?.W:null;
   if(!Array.isArray(outputs)||!Number.isSafeInteger(ordinal)||
      ordinal<0||ordinal>=outputs.length)
    throw new RangeError('original global W HLR edge ordinal not present');
   const id=cls+'|'+ordinal;
   if(seen.has(id))throw new RangeError('duplicated original W paper claimant');
   seen.add(id);
   const native=outputs[ordinal];
   if(![native?.from,native?.to].every(p=>
      p&&Number.isFinite(p.u)&&Number.isFinite(p.v)))
    throw new RangeError('invalid native generated W paper endpoints');
   const direct=samePaper(native.from,a)&&samePaper(native.to,b);
   const reversed=samePaper(native.from,b)&&samePaper(native.to,a);
   const exact=direct||reversed;
   const witness=originalEndpointWitnesses.filter(x=>
    x.view==='W'&&x.sourceEdgeId===sourceEdgeId&&
    x.hlrClass===cls&&x.wholeSolidGeneratedHLREdgeOrdinal===ordinal);
   if(witness.length!==1||
      witness[0].original3DBRepExactModelVertexEndpoints!==true||
      witness[0].original3DSourceClassComplete!==true||
      witness[0].nativeGenerated3DJunctionIdentityCertified!==false||
      witness[0].globalOpaqueFaceOcclusionCertified!==false||
      witness[0].signedV5Action!==false||
      !Array.isArray(witness[0].originalM0PhysicalVertexIds)||
      [...witness[0].originalM0PhysicalVertexIds].sort().join('|')!==
       [...sources[0]].sort().join('|')||
      witness[0].generatedPaperExactlyReprojectsBothOriginalVertices!==exact)
    throw new RangeError('real generated W paper endpoint differs from original BRep witness');
   // Report both orientations. The native projected segment is UNMODIFIED;
   // dyadic differences capture tiny, nonzero received binary64 offsets.
   const fromRef=direct||(!reversed&&
     Math.hypot(native.from.u-a.u,native.from.v-a.v)<=
      Math.hypot(native.from.u-b.u,native.from.v-b.v))?a:b;
   const toRef=fromRef===a?b:a;
   const delta=(point,ref)=>({
    u:(()=>{const x=difference(dyadic(point.u),dyadic(ref.u));
     return {numerator:String(x.n),powerOfTwo:x.e};})(),
    v:(()=>{const x=difference(dyadic(point.v),dyadic(ref.v));
     return {numerator:String(x.n),powerOfTwo:x.e};})()
   });
   rows.push({hlrClass:cls,wholeSolidGeneratedHLREdgeOrdinal:ordinal,
    originalProjectedPhysicalEndpointIds:[...sources[0]],
    receivedFrom:{...native.from},receivedTo:{...native.to},
    fromDisplacementFromPhysicalSource:delta(native.from,fromRef),
    toDisplacementFromPhysicalSource:delta(native.to,toRef),
    receivedWPaperEndpointsExactlyMatchBothPhysicalOriginalVertices:exact,
    actualGeneratedHLR2DEndpointPhysicalTopoDSIdentityCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false});
  }
  paperEndpointAudit=freeze({
   sourceEdgeId,view:'W',sourceGeometryId:geometry.id,revision:cad.revision,
   exactOriginalProjectedWFrom:{...a},exactOriginalProjectedWTo:{...b},
   nativeGlobalWGeneratedHLREdgesChecked:rows.length,
   nativeGlobalWEdgesWithExactTwoPhysicalPaperEndpoints:
    rows.filter(x=>x.receivedWPaperEndpointsExactlyMatchBothPhysicalOriginalVertices).length,
   nativeGlobalWEdgesWithReceivedBinary64EndpointDrift:
    rows.filter(x=>!x.receivedWPaperEndpointsExactlyMatchBothPhysicalOriginalVertices).length,
   rows,receivedPaperOffsetsDoNotClosePositiveSourceParameterGap:true,
   generated2DTopoDSHistoryCertified:false,
   globalContinuousSceneOcclusionCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 const rayClear=originalClosedRayClear===true&&openRayClass==='visible-sharp';
 const originalFront=m4Depth?.completeOriginalM4SourceDepthPartition===true&&
  m4Depth.everyOpenDepthCutClassified===true&&
  m4Depth.openDepthFrontCuts>0&&m4Depth.openDepthHiddenCuts===0&&
  m4Depth.openDepthHeldCuts===0&&m4Depth.positiveSubpixelCutsHeld===0;
 if(exactPaperGap!=null&&(
    !same(exactPaperGap.originalSourceParameterGap,positiveGap)||
    exactPaperGap.originalPositiveM5GapRemainsUnclosedWithoutGeneratedTopoDSHistory!==true||
    exactPaperGap.sourceGapClosedByNativeEndpointEvidence!==false||
    exactPaperGap.engineeringLineStyle!=='undetermined'||
    exactPaperGap.signedV5Action!==false))
  throw new RangeError('positive W paper residual must remain native-history held');
 // Positive-source physical visibility needs all independent same-source
 // witnesses. Even then, the PAPER residual and V5 gate remain untouched.
 const physicalComplete=globalFull&&rayClear&&originalFront;
 return freeze({
  schema:'draftai-c1-w-m5-native-closed-original-gap-joint/1',
  sourceGeometryId:geometry.id,revision:cad.revision,view,sourceEdgeId,
  originalPositivePaperGap:[...positiveGap],
  originalNativeCurveParameterBounds:[...bounds],
  status:physicalComplete?
   'physical-original-3d-source-closed-ray-complete-paper-held':
   'held-physical-source-proof-incomplete',
  nativeOriginalEdgeStatusAllVisible:sameClass,
  scopedNativeOriginal3DVisibilityParameterComplete:nativeFullVisible,
  globalGeneratedNative3DToOriginalBRepIntervalComplete:globalFull,
  exactWholeOriginal3DSourceNativeVisibleCurveProven:globalFull,
  wholeReviewedConvexOriginalClosedSourceRayClear:rayClear,
  coProjectedOriginalSourceOpenFrontmostProven:originalFront,
  jointOriginalClosedPhysicalSourceVisibilityProven:physicalComplete,
  nativeGlobalGeneratedW2DPaperEndpointDriftEvidence:paperEndpointAudit,
  generatedPaperGapStrictlyPositiveStillHeld:true,
  generated2DTopoDSHistoryCertified:false,
  globalOpaqueSceneContinuousVisibilityCertified:false,
  actualGlobal2DPaperClosedEndpointsCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
module.exports={auditC1WNativeClosedPhysicalGap};
