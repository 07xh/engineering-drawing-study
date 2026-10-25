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
const {dyadic,difference,product,sum,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))freeze(x);Object.freeze(o);
}return o;};
const pEq=(a,b)=>a.u===b.u&&a.v===b.v;
const point3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const xyzEqual=(a,b)=>a.x===b.x&&a.y===b.y&&a.z===b.z;
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
 const nativeExact=(pEq(a,nativeVisible.from)&&pEq(b,nativeVisible.to))||
  (pEq(a,nativeVisible.to)&&pEq(b,nativeVisible.from));
 const whole=frontLift.originalSourceParameterRange?.[0]===0&&
  frontLift.originalSourceParameterRange?.[1]===1;
 return freeze({
  nativeVisibleOriginalFrontSourceVerified:true,
  nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints:
   nativeExact&&whole,
  actualOCCTNativeEndpointsMatchOriginalPaperWithoutTolerance:nativeExact,
  nativeOriginalSourceParameterFullRangeVerified:whole,
  noClaimOfOcctTopoDSGeneratedEdgeIdentity:true,
  signedV5Action:false
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
     let nativeExact=null;
     for(const v of nativeVisible){
      const got=certifyActualOCCTFullFrontOriginalPaperEndpoints({
       geometry,view,frontEdge,nativeVisible:v
      });
      if(got.nativeVisibleOriginalFrontSourceVerified&&
         got.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints){
       nativeExact=got;break;
      }
      if(got.nativeVisibleOriginalFrontSourceVerified)
       nativeExact=got;
     }
     if(nativeExact?.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints)
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
       nativeExact?.nativeVisibleSegmentExactlyMatchesBothM0OriginalPaperEndpoints===true,
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
 auditC1NativeHiddenExactModelFrontMasks};
