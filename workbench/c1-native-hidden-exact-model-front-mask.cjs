'use strict';
/**
 * Exact represented-binary64 ORIGINAL 3D source endpoint proof for an
 * entire co-projected front/back edge pair in first-angle V/H/W.
 *
 * M4 adaptive 2D numerical overlap can end one ULP before an authentic
 * original vertex. This witness does NOT round its output, widen M4
 * ranges or silently close that gap: it recomputes the original M0
 * endpoint-projection correspondence using exact equality of the
 * two model-space projected original physical vertices, and computes
 * the observer depth order with the shared EXACT dyadic kernel.
 *
 * The native OCCT visible HLR proof is independently required in the
 * consumer: the actual visible BRep segment must cover both model-space
 * front endpoints EXACTLY. A near-coincident native paper endpoint
 * remains an unresolved CAD-to-model gap even if the M0 depth proof
 * is perfect. No new HLR solver or V5 style signer is introduced.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const {dyadic,difference,product,sum,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))freeze(x);Object.freeze(o);
}return o;};
const pEq=(a,b)=>a.u===b.u&&a.v===b.v;
const point3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const xyzEqual=(a,b)=>point3(a)&&point3(b)&&
 a.x===b.x&&a.y===b.y&&a.z===b.z;
// A native HLR point that projects onto an original edge can still lie at a
// different 3D observer depth. Verify the *source parameter* in XYZ as well.
const originalSourcePointAt=(a,b,t)=>({
 x:t===0?a.x:t===1?b.x:a.x+(b.x-a.x)*t,
 y:t===0?a.y:t===1?b.y:a.y+(b.y-a.y)*t,
 z:t===0?a.z:t===1?b.z:a.z+(b.z-a.z)*t
});
const edgeId=(g,e)=>g.id+'::'+[...e].sort().join('|');
function certifyExactFullOriginalFront3DMask({geometry,view,hiddenEdge,frontEdge}={}){
 if(!VIEWS.includes(view)||!geometry?.data?.points||
    !Array.isArray(hiddenEdge)||hiddenEdge.length!==2||
    !Array.isArray(frontEdge)||frontEdge.length!==2)
  throw new TypeError('genuine first-angle original 3D edge pairs required');
 const pts=geometry.data.points;
 const h=hiddenEdge.map(id=>pts[id]),f=frontEdge.map(id=>pts[id]);
 if(![...h,...f].every(point3))
  throw new TypeError('finite true M0 original 3D vertex geometry required');
 const hp=h.map(p=>project(p)[view]),fp=f.map(p=>project(p)[view]);
 const direct=pEq(hp[0],fp[0])&&pEq(hp[1],fp[1]);
 const reversed=pEq(hp[0],fp[1])&&pEq(hp[1],fp[0]);
 if(!direct&&!reversed)
  return freeze({
   status:'undetermined',reason:'original-model-projected-endpoints-not-exactly-coincident',
   exactOriginalProjectionSameWholePaperSegment:false,
   strictObserverFrontDepthAcrossOriginalOpenInterval:false,
   signedV5Action:false
  });
 const ordered=direct?f:[f[1],f[0]],ray=FIRST_ANGLE_OBSERVER_RAYS[view];
 const signedDepth=(front,back)=>{
  let result={n:0n,e:0};
  for(const axis of ['x','y','z']){
   const component=ray[axis];
   if(component!==0)
    result=sum(result,product(difference(dyadic(front[axis]),
     dyadic(back[axis])),dyadic(component)));
  }
  return sign(result);
 };
 const a=signedDepth(ordered[0],h[0]),b=signedDepth(ordered[1],h[1]);
 const strict=a>0&&b>0;
 return freeze({
  status:strict?'exact-original-model-full-front-depth':
   'undetermined',
  reason:strict?'exact-original-model-projected-endpoints-and-dyadic-affine-depth':
   'source-depth-not-strictly-front-at-both-original-3d-endpoints',
  view,hiddenOriginalSourceEdgeId:edgeId(geometry,hiddenEdge),
  frontOriginalSourceEdgeId:edgeId(geometry,frontEdge),
  originalFrontOrientationReversed:!direct,
  sourcePaperEndpointCorrespondence:[
   {...hp[0]},{...hp[1]}],
  exactOriginalProjectionSameWholePaperSegment:true,
  exactDyadicFrontObserverDepthEndpointSigns:[a,b],
  strictObserverFrontDepthAcrossOriginalOpenInterval:strict,
  true3DOriginalVertexBetweenEdgesInferred:false,
  HLRGeneratedTopoDSIdentityProven:false,
  engineeringLineStyleCertified:false,signedV5Action:false
 });
}
function certifyActualOCCTFullFrontOriginalPaperEndpoints({
 geometry,view,frontEdge,nativeVisible
}={}){
 if(!VIEWS.includes(view)||!geometry?.data?.points||
    !Array.isArray(frontEdge)||frontEdge.length!==2||
    nativeVisible?.view!==view||
    nativeVisible?.occtHLRVisibilityClass!=='visible-sharp'||
    nativeVisible.actualOCCTHLRFlattenedBRepLineVerified!==true||
    nativeVisible.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
    nativeVisible.v5Authorized!==false||
    !Array.isArray(nativeVisible.sourceCandidate3DLifts))
  throw new TypeError('genuine OCCT visible HLR sharp BRep and original 3D edge required');
 const originalId=edgeId(geometry,frontEdge),
  frontLift=nativeVisible.sourceCandidate3DLifts.find(l=>
   l.sourceEdgeId===originalId&&
   l.actualOriginalOCCTBRepEdge3DEndpointsVerified===true&&
   l.originalOCCTSourceLineCurveVerified===true&&
   l.originalXYZReprojectsToHLR===true&&l.v5Authorized===false);
 if(!frontLift)return freeze({nativeVisibleOriginalFrontSourceVerified:false,
  nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints:false,
  noClaimOfOcctTopoDSGeneratedEdgeIdentity:true,signedV5Action:false});
 const a=project(geometry.data.points[frontEdge[0]])[view],
  b=project(geometry.data.points[frontEdge[1]])[view];
 const forward=pEq(a,nativeVisible.from)&&pEq(b,nativeVisible.to),
  reverse=pEq(a,nativeVisible.to)&&pEq(b,nativeVisible.from),
  nativeExact=!pEq(a,b)&&(forward||reverse);
 const whole=frontLift.originalSourceParameterRange?.[0]===0&&
  frontLift.originalSourceParameterRange?.[1]===1;
 const first=geometry.data.points[frontEdge[0]],
  last=geometry.data.points[frontEdge[1]];
 const exact3D=whole&&nativeExact&&(
  (forward&&xyzEqual(frontLift.fromCandidate3D,first)&&
   xyzEqual(frontLift.toCandidate3D,last))||
  (reverse&&xyzEqual(frontLift.fromCandidate3D,last)&&
   xyzEqual(frontLift.toCandidate3D,first)));
 return freeze({
  nativeVisibleOriginalFrontSourceVerified:true,
  nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints:
   nativeExact&&whole&&exact3D,
  actualOCCTNativeEndpointsMatchOriginalPaperWithoutTolerance:nativeExact,
  nativeOriginalSourceParameterFullRangeVerified:whole,
  native3DSourceEndpointsIndependentlyMatchOriginalVertices:exact3D,
  noClaimOfOcctTopoDSGeneratedEdgeIdentity:true,
  signedV5Action:false
 });
}
/**
 * Genuine OCCT may split ONE original visible front edge into multiple sharp
 * BRep strokes. Preserve the true source ID and exact original M0 parameter
 * coordinates for EVERY partial interval, then union them without tolerance.
 * No one-segment shortcut, paper-only alias or one-ULP gap is a proof.
 *
 * This is strictly local original-source/OCCT corroboration, not engineering
 * line-style authorization or generated-TopoDS source history.
 */
function certifyActualOCCTVisibleFrontOriginalIntervalUnion({
 geometry,view,frontEdge,nativeVisibleSegments
}={}){
 if(!VIEWS.includes(view)||!geometry?.data?.points||
    !Array.isArray(frontEdge)||frontEdge.length!==2||
    !Array.isArray(nativeVisibleSegments)||nativeVisibleSegments.length>512)
  throw new TypeError('current source front edge and bounded genuine visible OCCT segments required');
 const edge=frontEdge.map(id=>geometry.data.points[id]);
 if(!edge.every(point3))
  throw new TypeError('authentic finite original M0 front vertices required');
 const from=project(edge[0])[view],to=project(edge[1])[view];
 const sourceProjectsToLine=!pEq(from,to);
 const id=edgeId(geometry,frontEdge);
 const interp=(t)=>({
  u:t===0?from.u:t===1?to.u:from.u+(to.u-from.u)*t,
  v:t===0?from.v:t===1?to.v:from.v+(to.v-from.v)*t
 });
 const intervals=[];
 let hasNativeOriginalSource=false,heldDrift=0;
 for(const segment of nativeVisibleSegments){
  if(segment?.view!==view||
     segment.occtHLRVisibilityClass!=='visible-sharp'||
     segment.actualOCCTHLRFlattenedBRepLineVerified!==true||
     segment.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
     segment.v5Authorized!==false||
     !Array.isArray(segment.sourceCandidate3DLifts))
   throw new TypeError('unverified genuine OCCT sharp visible segment');
  const candidates=segment.sourceCandidate3DLifts.filter(l=>
   l.sourceEdgeId===id&&
   l.actualOriginalOCCTBRepEdge3DEndpointsVerified===true&&
   l.originalOCCTSourceLineCurveVerified===true&&
   l.originalXYZReprojectsToHLR===true&&l.v5Authorized===false);
  if(!candidates.length)continue;
  hasNativeOriginalSource=true;
  for(const lift of candidates){
   const range=lift.originalSourceParameterRange;
   if(!Array.isArray(range)||range.length!==2||
      !range.every(Number.isFinite)||range[0]<0||
      range[1]>1||!(range[1]>range[0])){
    heldDrift++;continue;
   }
   const a=interp(range[0]),b=interp(range[1]);
   const xyzA=originalSourcePointAt(edge[0],edge[1],range[0]),
    xyzB=originalSourcePointAt(edge[0],edge[1],range[1]);
   // Exact represented-binary64 matching of both genuine CAD endpoints to
   // the ORIGINAL full source, not a near-equality fit or a pixel overlap.
   const forward=pEq(segment.from,a)&&pEq(segment.to,b);
   const reverse=pEq(segment.from,b)&&pEq(segment.to,a);
   const actual3D=point3(lift.fromCandidate3D)&&point3(lift.toCandidate3D)&&
    pEq(project(lift.fromCandidate3D)[view],segment.from)&&
    pEq(project(lift.toCandidate3D)[view],segment.to);
   const actualOriginal3DParameter=(forward&&
     xyzEqual(lift.fromCandidate3D,xyzA)&&
     xyzEqual(lift.toCandidate3D,xyzB))||
    (reverse&&xyzEqual(lift.fromCandidate3D,xyzB)&&
     xyzEqual(lift.toCandidate3D,xyzA));
   if(sourceProjectsToLine&&actual3D&&actualOriginal3DParameter)
    intervals.push([...range]);
   else heldDrift++;
  }
 }
 const coverage=exactCandidateIntervalCoverage([0,1],intervals);
 return freeze({
  nativeVisibleOriginalFrontSourceVerified:hasNativeOriginalSource,
  nativeVisibleVerifiedOriginalSourceIntervals:coverage.positiveLengthCoveredIntervals,
  nativeVisibleUnprovenOriginalSourceIntervals:coverage.positiveLengthUncoveredIntervals,
  nativeVisibleOriginalFrontWholePaperUnionCertified:
   coverage.entireOriginalParameterIntervalCovered&&
   intervals.length>0,
  // Backward compatible with the older SINGLE native BRep certificate:
  nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints:
   intervals.some(x=>x[0]===0&&x[1]===1),
  actualOCCTNativeEndpointsMatchOriginalPaperWithoutTolerance:
   coverage.entireOriginalParameterIntervalCovered&&intervals.length>0,
  nativeOriginalSourceParameterFullRangeVerified:
   coverage.entireOriginalParameterIntervalCovered&&intervals.length>0,
  genuineNativeSegmentsExamined:nativeVisibleSegments.length,
  exactNativeSubintervalsAccepted:intervals.length,
  mismatchedNativeOriginalEndpointsOrLiftHeld:heldDrift,
  native3DOriginalSourceParameterDepthIndependentlyRecomputed:true,
  originalSourceProjectsToNoncollapsedPaperLine:sourceProjectsToLine,
  noClaimOfOcctTopoDSGeneratedEdgeIdentity:true,
  engineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5Action:false
 });
}

/**
 * Positive full original 3D front source proof is a reusable M0 theorem.
 * It can close a numerical M4 paper-parameter gap ONLY when the ACTUAL
 * OCCT native visible segment has exact model-original endpoint agreement.
 */
function auditC1NativeHiddenExactModelFrontMasks({
 geometry,revision,cad,refinements,m5
}={}){
 if(!geometry?.data?.points||!Array.isArray(geometry.data.edges)||
    !Number.isSafeInteger(revision)||revision<1||
    cad?.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||
    cad.actualOCCTHLREdgeToOriginalTopoDSIdentityMatched!==false||
    cad.v5Authorized!==false||
    m5?.sourceGeometryId!==geometry.id||m5.revision!==revision||
    m5.signedV5ActionCount!==0||
    !Array.isArray(refinements)||!Array.isArray(m5.rows))
  throw new TypeError('current reviewed M0 original geometry, real OCCT HLR and exact M5 required');
 const edges=new Map(geometry.data.edges.map(e=>[edgeId(geometry,e),e]));
 const rays=new Map(m5.rows.map(r=>[
  r.originalPhysicalSourceEdgeId+'@'+r.view,r]));
 if(edges.size!==geometry.data.edges.length||rays.size!==m5.rows.length)
  throw new RangeError('duplicate original source edge/view identity');
 let ordinal=0;
 const counts={genuineNativeHiddenSharpStrokes:0,
  uniqueRemaining3DSourcesAudited:0,
  exact3DFullOriginalProjectionAndDepthPairs:0,
  actualNativeVisibleM0OriginalEndpointFullPaperMatches:0,
  exactModelAndNativeFrontWholePaperMaskCertified:0,
  exactM0FrontButNativeEndpointDriftHeld:0,
  noUniqueSourceOrExactFrontDepthProofHeld:0,
  signedGBLineStyles:0,signedV5Actions:0};
 const rows=[];
 for(const view of VIEWS){
  const nativeHidden=cad.hiddenSharpViews?.[view],
   nativeVisible=cad.views?.[view];
  if(!Array.isArray(nativeHidden)||!Array.isArray(nativeVisible))
   throw new RangeError('missing true OCJS V/H/W hidden and visible BRep output');
  for(const hidden of nativeHidden){
   const refinement=refinements[ordinal];
   if(!refinement||refinement.view!==view||
      hidden.occtHLRVisibilityClass!=='hidden-sharp'||
      hidden.actualOCCTHLRFlattenedBRepLineVerified!==true||
      hidden.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
      refinement.projectedFrom.u!==hidden.from.u||
      refinement.projectedFrom.v!==hidden.from.v||
      refinement.projectedTo.u!==hidden.to.u||
      refinement.projectedTo.v!==hidden.to.v||
      refinement.nativeHLRToSourceTopoDSIdentityRecovered!==false||
      refinement.signedV5Action!==false)
    throw new RangeError('stale or forged true OCJS hidden edge and M5 survivor ledger');
   const remaining=refinement.remainingPhysicalSourcePossibilities;
   if(!Array.isArray(remaining))
    throw new TypeError('M5 hidden source candidates required');
   let candidateProofs=[];
   if(remaining.length===1){
    counts.uniqueRemaining3DSourcesAudited++;
    const hiddenId=remaining[0].sourceEdgeId,
     hiddenEdge=edges.get(hiddenId),hiddenLift=
     hidden.sourceCandidate3DLifts?.find(x=>x.sourceEdgeId===hiddenId);
    if(!hiddenEdge||!hiddenLift||
       hiddenLift.originalOCCTSourceLineCurveVerified!==true||
       hiddenLift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       hiddenLift.originalXYZReprojectsToHLR!==true||
       hiddenLift.v5Authorized!==false)
     throw new RangeError('real hidden OCCT original 3D source lift missing');
    // An original model edge may be exactly covered even though OCCT's
    // measured generated HLR endpoint deviates from its reprojected
    // original source by one ULP. Hold such native-vs-model paper drift
    // explicitly; no gap may be repaired by a distance epsilon.
    const hiddenNativeEndpointExact=
     pEq(project(hiddenLift.fromCandidate3D)[view],hidden.from)&&
     pEq(project(hiddenLift.toCandidate3D)[view],hidden.to);
    for(const [frontId,frontEdge] of edges){
     if(frontId===hiddenId)continue;
     const frontRay=rays.get(frontId+'@'+view);
     if(!frontRay||frontRay.completeSourceOriginal3DRayClosedIntervalClear!==true||
        frontRay.originalPhysicalCreaseProven!==true||
        frontRay.signedV5Action!==false)continue;
     const exact=certifyExactFullOriginalFront3DMask({
      geometry,view,hiddenEdge,frontEdge
     });
     if(!exact.strictObserverFrontDepthAcrossOriginalOpenInterval)continue;
     counts.exact3DFullOriginalProjectionAndDepthPairs++;
     const nativeExact=certifyActualOCCTVisibleFrontOriginalIntervalUnion({
      geometry,view,frontEdge,nativeVisibleSegments:nativeVisible
     });
     if(nativeExact.nativeVisibleOriginalFrontWholePaperUnionCertified)
      counts.actualNativeVisibleM0OriginalEndpointFullPaperMatches++;
     else counts.exactM0FrontButNativeEndpointDriftHeld++;
     candidateProofs.push({
      originalHidden3DEdgeId:hiddenId,originalFront3DEdgeId:frontId,
      original3DProjectionAndExactAffineDepthProof:exact,
      nativeVisibleOriginalM0FullEndpointWitness:nativeExact,
      originalNativeHiddenEndpointReprojectionExact:
       hiddenNativeEndpointExact,
      original3DAndNativeFullFrontPaperCoveragePositivelyVerified:
       hiddenNativeEndpointExact&&
       nativeExact.nativeVisibleOriginalFrontWholePaperUnionCertified===true,
      originalNativeHLRSourceTopoDSIdentitiesCertified:false,
      engineeringLineStyleCertified:false,signedV5Action:false
     });
    }
    if(candidateProofs.some(x=>
     x.original3DAndNativeFullFrontPaperCoveragePositivelyVerified))
     counts.exactModelAndNativeFrontWholePaperMaskCertified++;
   }
   if(candidateProofs.length===0)
    counts.noUniqueSourceOrExactFrontDepthProofHeld++;
   rows.push({
    view,sourceGeometryId:geometry.id,revision,
    nativeHiddenSharpEdgeOrdinal:ordinal,
    survivingOriginalSourceCount:remaining.length,
    independentModelExactFullFrontOriginalCandidates:candidateProofs,
    atLeastOneExactOriginalAndNativeFrontFullPaperMask:
     candidateProofs.some(x=>
      x.original3DAndNativeFullFrontPaperCoveragePositivelyVerified),
    actualOCCTGeneratedHLRToOriginalTopoDSIdentityCertified:false,
    finalGBHiddenLineStyleCertified:false,
    constructionIntentAuthorized:false,signedV5Action:false
   });
   counts.genuineNativeHiddenSharpStrokes++;ordinal++;
  }
 }
 if(ordinal!==refinements.length||
    counts.genuineNativeHiddenSharpStrokes!==rows.length||
    counts.signedV5Actions!==0)
  throw new RangeError('native original projected source exact depth proof coverage incomplete');
 return freeze({
  schema:'draftai-c1-ocjs-hidden-native-original-exact-projected-endpoint-front-mask/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  counts,rows,firstAngleExactDyadicOriginal3DObserverDepth:true,
  exactM0ProjectedVertexEqualityNotToleranceSnapped:true,
  realOCCTNativeVisibleSourceEndpointWitnessConsumed:true,
  HLRToOriginalTopoDSIdentityProven:false,
  officialGBLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={certifyExactFullOriginalFront3DMask,
 certifyActualOCCTFullFrontOriginalPaperEndpoints,
 certifyActualOCCTVisibleFrontOriginalIntervalUnion,
 auditC1NativeHiddenExactModelFrontMasks};
