'use strict';
/**
 * One reviewed convex C1 V/H/W original-source positive gap: corroborate the SAME physical
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
const {auditC1M5NativeGlobal3DSourceJoin}=
 require('./c1-m5-global-native-3d-source-join.cjs');
const {project}=require('../core/projection/conventions.js');
const {auditC1ExactTwoAxisGeneratedPaperCoverage}=
 require('./c1-exact-two-axis-generated-paper-coverage.cjs');
const {dyadic,difference,product,sum,sign}=require('../core/numeric/binary64-dyadic.cjs');
const {auditExactBinary64PaperCandidateCoverage}=
 require('./c1-exact-binary64-paper-parameter.cjs');
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
// Audit literal original TopoDS BRep XYZ, not only the producer's
// tolerant nearest-original-edge flag. Swapped orientation is legitimate.
const valid3D=p=>!!p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const eq3D=(a,b)=>valid3D(a)&&valid3D(b)&&
 ['x','y','z'].every(k=>a[k]===b[k]);
const exact3DPair=(a,b,p,q)=>
 (eq3D(a,p)&&eq3D(b,q))||(eq3D(a,q)&&eq3D(b,p));
// The actual native HLR paper edge can be a PARTIAL source interval.
// Pair both received endpoints to both physical source endpoints using
// exact binary64 squared distance, not a single Math.hypot decision.
// Rounded Number distances can overflow or choose the wrong orientation.
const exactPaperDistanceSquared=(p,q)=>{
 const du=difference(dyadic(p.u),dyadic(q.u));
 const dv=difference(dyadic(p.v),dyadic(q.v));
 return sum(product(du,du),product(dv,dv));
};
const exactPhysicalEndpointAssignment=(from,to,a,b)=>{
 const forward=sum(exactPaperDistanceSquared(from,a),exactPaperDistanceSquared(to,b));
 const reverse=sum(exactPaperDistanceSquared(from,b),exactPaperDistanceSquared(to,a));
 return sign(difference(forward,reverse))<=0?[a,b]:[b,a];
};

function auditC1NativeClosedPhysicalGap({
 geometry,cad,view,sourceEdgeId,positiveGap,
 originalStatus,global3DSource,m4Depth,
 originalClosedRayClear,openRayClass,exactPaperGap,originalEndpointWitnesses
}={}){
 if(!['V','H','W'].includes(view))return null;
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
 const scoped=cad.nativeSourceScopedSharpOutputByView?.[view]?.rows?.filter(x=>
  x.originalPhysicalSourceEdgeId===sourceEdgeId)??[];
 if(curve.length===0||scoped.length===0||originalStatus==null||
    global3DSource==null)return freeze({
  schema:(view==='W'?'draftai-c1-w-m5-native-closed-original-gap-joint/1':'draftai-c1-vhw-m5-native-closed-original-gap-joint/1'),
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
 const [m0A,m0B]=sources[0].map(id=>geometry.data.points?.[id]);
 if(!valid3D(m0A)||!valid3D(m0B)||eq3D(m0A,m0B))
  throw new RangeError('original M0 source has no distinct finite 3D endpoints');
 const nativeOriginal3DVerticesExact=exact3DPair(
  original.fromOCCT3D,original.toOCCT3D,m0A,m0B);
 const curveSamplesPresent=valid3D(original.occtSourceCurveFirstPoint3D)&&
  valid3D(original.occtSourceCurveLastPoint3D);
 const nativeOriginal3DCurveEndpointsExact=curveSamplesPresent&&exact3DPair(
  original.occtSourceCurveFirstPoint3D,
  original.occtSourceCurveLastPoint3D,m0A,m0B);
 // Actual BRepAdaptor endpoints may differ in received binary64. Report
 // this separately: a rounded curve sample is NOT a TopoDS vertex identity.
 const exactOriginal3DPhysicalSource={
  sourceEdgeId,view,sourceGeometryId:geometry.id,revision:cad.revision,
  originalM0VertexIds:[...sources[0]],
  nativeOriginalTopoDSVertexCoordinatesChecked:valid3D(original.fromOCCT3D)&&
   valid3D(original.toOCCT3D),
  exactNativeOriginal3DVertexToM0EndpointBijection:nativeOriginal3DVerticesExact,
  nativeOriginalCurveSampleEndpointsChecked:curveSamplesPresent,
  nativeOriginalCurveEndpointSamplesExactlyEqualM0:nativeOriginal3DCurveEndpointsExact,
  rounded3DCurveSamplesCannotReplaceActualOriginalTopoDSVertexIdentity:true,
  generated2DTopoDSEndpointHistoryCertified:false,
  officialV5Authorized:false,signedV5Action:false
 };
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
 if(originalStatus.view!==view||originalStatus.originalPhysicalSourceEdgeId!==sourceEdgeId||
    !Number.isSafeInteger(originalStatus.nativeHLROriginalEdgeMapIndex)||
    originalStatus.nativeHLROriginalEdgeMapIndex<1||
    originalStatus.generated2DHLREdgeToOriginalSourceHistoryCertified!==false||
    originalStatus.globalContinuousM5OcclusionCertified!==false||
    originalStatus.engineeringLineStyle!=='undetermined'||
    originalStatus.signedV5Action!==false)
  throw new RangeError('W native original EdgeStatus does not bind original source');
 if(global3DSource.view!==view||global3DSource.sourceEdgeId!==sourceEdgeId||
    global3DSource.sourceGeometryId!==geometry.id||
    global3DSource.revision!==cad.revision||
    global3DSource.generated2DTopoDSHistoryCertified!==false||
    global3DSource.officialV5Authorized!==false||
    !Array.isArray(global3DSource.claims))
  throw new RangeError('W global native generated 3D HLR source revision mismatch');
 // The caller's M5 source/ordinal summary is NOT a substitute for the
 // actual same-run global 3D HLR source inventory. Re-execute the existing
 // independent native-global-curve/source join with its real CAD inputs and
 // EVERY original candidate ordinal, then require identical output. This
 // prevents a copied or tampered 3D source/class/parameter witness from
 // laundering a W or H paper gap into physical source proof.
 const reconstructedGlobal3DSource=auditC1M5NativeGlobal3DSourceJoin({
  geometry,cad,view,sourceEdgeId,
  generatedClaims:global3DSource.claims.map(claim=>({
   hlrClass:claim.hlrClass,
   wholeSolidGeneratedHLREdgeOrdinal:claim.wholeSolidGeneratedHLREdgeOrdinal
  }))
 });
 if(!reconstructedGlobal3DSource||
    JSON.stringify(reconstructedGlobal3DSource)!==
     JSON.stringify(global3DSource))
  throw new RangeError('current native global generated 3D HLR source provenance does not replay from actual CAD');
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
 // An original all-visible source cannot be declared fully visible if
 // the same-run WHOLE-SOLID 3D HLR ledger also attributes a hidden or
 // uncorroborated generated edge to that physical source. The original
 // source-filtered partition alone does not establish this consistency.
 // The caller's M5 claims are a SUBSET of generated edges, not a
 // guarantee that every global generated HLR edge of this source is here.
 // Independently replay the SAME-RUN whole-solid original-owner inventory;
 // an omitted hidden or second partial generated edge cannot be laundered
 // into a "complete" all-visible physical source certificate.
 const rawGlobalRows=cad.nativeSourceScopedSharpOutputByView[view]
  .nativeGlobal3DOriginalSourceEvidence.rows;
 const rawOwned=rawGlobalRows.filter(x=>
  x.originalPhysicalSourceEdgeId===sourceEdgeId);
 const ownedClaims=global3DSource.claims.filter(x=>
  x.actualNativeGlobal3DOriginalSourceEdgeId===sourceEdgeId);
 const nativeKey=x=>x.hlrClass+'|'+x.wholeSolidGeneratedHLREdgeOrdinal;
 const ownedClaimKeys=new Set(ownedClaims.map(nativeKey));
 const everyNativeOwnedGeneratedEdgeClaimed=rawOwned.length>0&&
  rawOwned.length===ownedClaimKeys.size&&
  rawOwned.every(x=>ownedClaimKeys.has(nativeKey(x)));
 const globalClassConsistent=rawOwned.length>0&&rawOwned.every(x=>
  x.hlrClass==='visible-sharp')&&ownedClaims.every(x=>
  x.original3DCurveAndScopedNativeParameterIntervalCorroborated===true&&
  x.hlrClass==='visible-sharp');
 const globalVisible=auditC1Native3DSourceScopedIntervals({
  originalNativeParameterRange:bounds,
  generatedNativeParameterRanges:claimed3D.map(x=>x.originalNativeCurveParameterRange)
 });
 const globalFull=nativeFullVisible&&globalClassConsistent&&
  everyNativeOwnedGeneratedEdgeClaimed&&
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
  const [a,b]=sources[0].map(id=>project(geometry.data.points?.[id])?.[view]);
  if(![a,b].every(p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v)))
   throw new RangeError('nonfinite original W paper projected physical endpoint');
  const samePaper=(x,y)=>x.u===y.u&&x.v===y.v;
  const seen=new Set(),rows=[];
  // Exact cross product of RECEIVED binary64 coordinates. Distinguish
  // longitudinal HLR endpoint rounding from a genuine transverse paper
  // displacement; neither one may silently close a positive M5 gap.
  const sourceDu=difference(dyadic(b.u),dyadic(a.u));
  const sourceDv=difference(dyadic(b.v),dyadic(a.v));
  const onOriginalLine=p=>sign(difference(
   product(sourceDu,difference(dyadic(p.v),dyadic(a.v))),
   product(sourceDv,difference(dyadic(p.u),dyadic(a.u)))))===0;
  for(const claim of matches){
   const cls=claim.hlrClass,ordinal=claim.wholeSolidGeneratedHLREdgeOrdinal;
   const outputs=cls==='visible-sharp'?cad.views?.[view]:
    cls==='hidden-sharp'?cad.hiddenSharpViews?.[view]:null;
   if(!Array.isArray(outputs)||!Number.isSafeInteger(ordinal)||
      ordinal<0||ordinal>=outputs.length)
    throw new RangeError('original global V/H/W HLR edge ordinal not present');
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
    x.view===view&&x.sourceEdgeId===sourceEdgeId&&
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
   const [fromRef,toRef]=exactPhysicalEndpointAssignment(
    native.from,native.to,a,b);
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
    receivedWPaperEndpointsExactlyOnOriginalProjectedSourceLine:
     onOriginalLine(native.from)&&onOriginalLine(native.to),
    actualGeneratedHLR2DEndpointPhysicalTopoDSIdentityCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false});
  }
  // Reuse the existing exact rational PAPER interval union. It is not
  // the native original 3D parameter partition, and a complete dominant
  // axis alone is insufficient if the received 2D edge is off-line.
  const receivedExactPaperCoverage=auditExactBinary64PaperCandidateCoverage({
   sourceFrom:a,sourceTo:b,
   segments:rows.map(row=>({from:row.receivedFrom,to:row.receivedTo}))
  });
  const twoAxis=auditC1ExactTwoAxisGeneratedPaperCoverage({
   sourceFrom:a,sourceTo:b,
   segments:rows.map(row=>({from:row.receivedFrom,to:row.receivedTo}))
  });
  if(twoAxis.exactlyCollinearGeneratedSegments!==
      rows.filter(r=>r.receivedWPaperEndpointsExactlyOnOriginalProjectedSourceLine).length||
     JSON.stringify(twoAxis.unsafeDominantAxisOnlyCoverage.
      exactBinary64PaperPositiveLengthUncoveredIntervals)!==
     JSON.stringify(receivedExactPaperCoverage.exactBinary64PaperPositiveLengthUncoveredIntervals))
   throw new RangeError('native W exact two-axis paper source proof contradicts whole-solid HLR');
  paperEndpointAudit=freeze({
   sourceEdgeId,view,sourceGeometryId:geometry.id,revision:cad.revision,
   exactOriginalProjectedSourceFrom:{...a},exactOriginalProjectedSourceTo:{...b},
   exactOriginalProjectedWFrom:view==='W'?{...a}:null,
   exactOriginalProjectedWTo:view==='W'?{...b}:null,
   nativeGlobalGeneratedHLREdgesChecked:rows.length,
   nativeGlobalWGeneratedHLREdgesChecked:rows.length,
   nativeGlobalGeneratedEdgesWithExactTwoPhysicalPaperEndpoints:
    rows.filter(x=>x.receivedWPaperEndpointsExactlyMatchBothPhysicalOriginalVertices).length,
   nativeGlobalWEdgesWithExactTwoPhysicalPaperEndpoints:
    rows.filter(x=>x.receivedWPaperEndpointsExactlyMatchBothPhysicalOriginalVertices).length,
   nativeGlobalGeneratedEdgesWithReceivedBinary64EndpointDrift:
    rows.filter(x=>!x.receivedWPaperEndpointsExactlyMatchBothPhysicalOriginalVertices).length,
   nativeGlobalWEdgesWithReceivedBinary64EndpointDrift:
    rows.filter(x=>!x.receivedWPaperEndpointsExactlyMatchBothPhysicalOriginalVertices).length,
   nativeGlobalGeneratedEdgesExactlyCollinearWithOriginalSource:
    rows.filter(x=>x.receivedWPaperEndpointsExactlyOnOriginalProjectedSourceLine).length,
   nativeGlobalWEdgesExactlyCollinearWithOriginalSource:
    rows.filter(x=>x.receivedWPaperEndpointsExactlyOnOriginalProjectedSourceLine).length,
   nativeGlobalGeneratedEdgesWithTransverseBinary64PaperDrift:
    rows.filter(x=>!x.receivedWPaperEndpointsExactlyOnOriginalProjectedSourceLine).length,
   nativeGlobalWEdgesWithTransverseBinary64PaperDrift:
    rows.filter(x=>!x.receivedWPaperEndpointsExactlyOnOriginalProjectedSourceLine).length,
   receivedExactBinary64PaperCandidateCoverage:receivedExactPaperCoverage,
   receivedExactTwoAxisQualifiedPaperCoverage:twoAxis,
   rows,receivedPaperOffsetsDoNotClosePositiveSourceParameterGap:true,
   generated2DTopoDSHistoryCertified:false,
   globalContinuousSceneOcclusionCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 // Jointly replay the NEW same-run original BRep -> native 3D source
 // parameter -> WHOLE-SOLID generated 2D HLR measured paper ledger against
 // this independent M5 endpoint/affine computation. A clean original 3D
 // interval never launders an off-axis paper edge into an engineering line.
 let original3DToActual2DJoint=null;
 if(global3DSource.wholeSolid3DOriginalSourceToGenerated2DExactPaperJointAvailable===true){
  const candidates=global3DSource.native3DToGenerated2DPaperByOriginalSource;
  const joint=candidates?.filter(x=>x.view===view&&
   x.sourceEdgeId===sourceEdgeId&&x.revision===cad.revision)??[];
  if(joint.length!==1||joint[0].originalPhysical3DEndpointsVerifiedAgainstNativeBRep!==true||
     joint[0].generated2DTopoDSHistoryCertified!==false||
     joint[0].globalOpaqueSceneContinuousOcclusionCertified!==false||
     joint[0].signedV5Action!==false)
   throw new RangeError('same-run original native 3D to generated 2D paper source joint invalid');
  const sourceJoint=joint[0];
  if(paperEndpointAudit!==null){
   const rows=paperEndpointAudit.rows;
   if(sourceJoint.parts.length!==rows.length||rows.some(r=>{
    const q=sourceJoint.parts.find(q=>
     q.hlrClass===r.hlrClass&&
     q.wholeSolidGeneratedHLREdgeOrdinal===r.wholeSolidGeneratedHLREdgeOrdinal);
    return !q||q.receivedNative2DPaperFrom.u!==r.receivedFrom.u||
     q.receivedNative2DPaperFrom.v!==r.receivedFrom.v||
     q.receivedNative2DPaperTo.u!==r.receivedTo.u||
     q.receivedNative2DPaperTo.v!==r.receivedTo.v||
     q.exactReceivedPaperBothEndpointsOnOriginalSourceLine!==
      r.receivedWPaperEndpointsExactlyOnOriginalProjectedSourceLine;
   }))
    throw new RangeError('same-run native 3D/2D source joint contradicts M5 paper endpoint and topology inventory');
   const qualified=paperEndpointAudit.receivedExactTwoAxisQualifiedPaperCoverage;
   // Both independent consumers must preserve any actual positive
   // rational paper residual, including A-C tails and A-D drift.
   if(sourceJoint.positiveExactReceived2DPaperGaps!==null&&
      JSON.stringify(sourceJoint.positiveExactReceived2DPaperGaps)!==
       JSON.stringify(qualified.exactTwoAxisQualifiedPaperCoverage
        .exactBinary64PaperPositiveLengthUncoveredIntervals))
    throw new RangeError('same-run source joint contradicts exact two-axis M5 paper gaps');
  }
  original3DToActual2DJoint=sourceJoint;
 }
 // An M4 summary cannot be borrowed from another original source/view
 // or revision. Counts and the unsigned event-cut scope must agree.
 if(m4Depth!=null&&(
    m4Depth.view!==view||m4Depth.sourceEdgeId!==sourceEdgeId||
    m4Depth.sourceGeometryId!==geometry.id||m4Depth.revision!==cad.revision||
    m4Depth.signedV5Action!==false||
    (m4Depth.completeOriginalM4SourceDepthPartition===true&&(
     m4Depth.closedOriginalVerticesAndOpaqueSceneStillUnproven!==true||
     m4Depth.generatedHLRToOriginalTopoDSHistoryCertified!==false||
     !Number.isSafeInteger(m4Depth.openDepthSourceIntervalCount)||
     m4Depth.openDepthSourceIntervalCount<1||
     !Number.isSafeInteger(m4Depth.openDepthCutCount)||
     m4Depth.openDepthCutCount<1||
     !['openDepthFrontCuts','openDepthHiddenCuts','openDepthHeldCuts',
       'positiveSubpixelCutsHeld'].every(k=>
        Number.isSafeInteger(m4Depth[k])&&m4Depth[k]>=0)||
     m4Depth.openDepthCutCount!==m4Depth.openDepthFrontCuts+
      m4Depth.openDepthHiddenCuts+m4Depth.openDepthHeldCuts||
     m4Depth.positiveSubpixelCutsHeld>m4Depth.openDepthHeldCuts||
     m4Depth.everyOpenDepthCutClassified!==(m4Depth.openDepthHeldCuts===0)
    ))))throw new RangeError('stale, foreign or inconsistent original M4 source-depth summary');
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
 // No original 3D physical endpoint ledger means no joint physical proof.
 const physicalComplete=globalFull&&rayClear&&originalFront&&
  nativeOriginal3DVerticesExact&&paperEndpointAudit!==null;
 return freeze({
  schema:(view==='W'?'draftai-c1-w-m5-native-closed-original-gap-joint/1':'draftai-c1-vhw-m5-native-closed-original-gap-joint/1'),
  sourceGeometryId:geometry.id,revision:cad.revision,view,sourceEdgeId,
  originalPositivePaperGap:[...positiveGap],
  originalNativeCurveParameterBounds:[...bounds],
  originalNativeBRepToM0ExactPhysicalVertexEvidence:exactOriginal3DPhysicalSource,
  originalNativeBRepM0PhysicalVertexBijectionCertified:nativeOriginal3DVerticesExact,
  sameRunGlobalGenerated3DHLROriginalSourceAndParameterReplayVerified:true,
  sameRunOriginal3DNativeParameterAndActual2DPaperJoint:
   original3DToActual2DJoint,
  sameRunOriginal3DAnd2DJointIndependentlyRechecked:
   original3DToActual2DJoint!==null&&paperEndpointAudit!==null,
  generated2DTopoDSSourceHistoryCannotBeInferredFromGlobal3DReplay:true,
  status:physicalComplete?
   'physical-original-3d-source-closed-ray-complete-paper-held':
   'held-physical-source-proof-incomplete',
  nativeOriginalEdgeStatusAllVisible:sameClass,
  scopedNativeOriginal3DVisibilityParameterComplete:nativeFullVisible,
  globalGeneratedNative3DToOriginalBRepIntervalComplete:globalFull,
  sameRunWholeSolidNative3DOriginalOwnerRowCount:rawOwned.length,
  heldM5ClaimsCoverEverySameOriginalGlobalGenerated3DEdge:
   everyNativeOwnedGeneratedEdgeClaimed,
  globalGeneratedNative3DClassConsistentWithOriginalAllVisible:globalClassConsistent,
  exactWholeOriginal3DSourceNativeVisibleCurveProven:globalFull,
  wholeReviewedConvexOriginalClosedSourceRayClear:rayClear,
  coProjectedOriginalSourceOpenFrontmostProven:originalFront,
  jointOriginalClosedPhysicalSourceVisibilityProven:physicalComplete,
  nativeGlobalGenerated2DPaperEndpointDriftEvidence:paperEndpointAudit,
  nativeGlobalGeneratedW2DPaperEndpointDriftEvidence:view==='W'?paperEndpointAudit:null,
  generatedPaperGapStrictlyPositiveStillHeld:true,
  generated2DTopoDSHistoryCertified:false,
  globalOpaqueSceneContinuousVisibilityCertified:false,
  actualGlobal2DPaperClosedEndpointsCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
}
// The prior W-only contract remains stable. V/H must use the same exact
// original source audit, with no new solver, clipping or signature guess.
function auditC1WNativeClosedPhysicalGap(args={}){
 return args.view==='W'?auditC1NativeClosedPhysicalGap(args):null;
}
module.exports={auditC1WNativeClosedPhysicalGap,auditC1NativeClosedPhysicalGap};
