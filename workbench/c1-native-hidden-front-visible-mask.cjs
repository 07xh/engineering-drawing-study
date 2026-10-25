'use strict';
/**
 * A native HLR hidden sharp PAPER stroke need not have an inward
 * observer ray through solid interior: a farther original edge may
 * project ON TOP OF an independently ray-clear FRONT original edge.
 *
 * Certify a front-source paper mask only if three independent sources
 * all agree across an entire positive parameter interval:
 *  1) current M4 original-source collinear overlap with positive affine
 *     WHOLE-open-interval 3D observer depth ordering,
 *  2) current exact M5 closed ORIGINAL 3D front source observer ray clear,
 *  3) a genuine native OCJS VCompound visible straight stroke, independently
 *     backed by the same original OCCT BRep front source geometry.
 *
 * A gap or mere 2D paper alias is never bridged or made a 3D junction.
 * The output is a local negative hidden-line priority explanation:
 * no OCCT HLR TopoDS history, global feature proof, GB line, Intent or V5.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))frozen(x);Object.freeze(o);
}return o;};
const finite=Number.isFinite;
const distance=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const sourceKey=(g,edge)=>g.id+'::'+[...edge].sort().join('|');
function mappedActualVisibleHLRToHiddenOriginalParameter({
 geometry,view,hiddenOriginalVertexIds,nativeVisible
}={}){
 if(!VIEWS.includes(view)||!geometry?.data?.points||
    !Array.isArray(hiddenOriginalVertexIds)||
    hiddenOriginalVertexIds.length!==2||
    !nativeVisible||nativeVisible.view!==view||
    nativeVisible.occtHLRVisibilityClass!=='visible-sharp'||
    nativeVisible.actualOCCTHLRFlattenedBRepLineVerified!==true||
    nativeVisible.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
    nativeVisible.v5Authorized!==false)
  throw new TypeError('true V/H/W visible native HLR and original 3D source required');
 const [a,b]=hiddenOriginalVertexIds.map(id=>geometry.data.points[id]);
 if(!a||!b)throw new RangeError('missing original hidden source XYZ');
 const from=project(a)[view],to=project(b)[view];
 const du=to.u-from.u,dv=to.v-from.v,length2=du*du+dv*dv;
 if(!finite(length2)||length2<=1e-15)
  throw new RangeError('collapsed original hidden source paper projection');
 const at=p=>{
  if(!p||!finite(p.u)||!finite(p.v))throw new RangeError('native visible HLR 2D endpoint not finite');
  const t=((p.u-from.u)*du+(p.v-from.v)*dv)/length2;
  const represented={u:from.u+t*du,v:from.v+t*dv};
  if(!finite(t)||distance(p,represented)>1e-6||
     t<0||t>1)return null;
  return t;
 };
 const t0=at(nativeVisible.from),t1=at(nativeVisible.to);
 if(t0===null||t1===null||t0===t1)
  return frozen({nativeVisibleOnSameBoundedOriginalPaperLine:false,
   hiddenOriginalSourceParameterRange:null});
 return frozen({
  nativeVisibleOnSameBoundedOriginalPaperLine:true,
  hiddenOriginalSourceParameterRange:[Math.min(t0,t1),Math.max(t0,t1)]
 });
}
function auditC1NativeHiddenFrontVisibleMasks({
 geometry,revision,cad,refinements,m5,sourceDepth,
 exactIntervalCoverage
}={}){
 if(!Number.isSafeInteger(revision)||revision<1||
    !geometry?.data?.points||!Array.isArray(geometry.data.edges)||
    cad?.sourceGeometryId!==geometry.id||cad.revision!==revision||
    cad.hiddenHLROutputFromActualOCCT!==true||
    cad.engineComputedVisibleGeometry!==true||
    cad.v5Authorized!==false||
    m5?.sourceGeometryId!==geometry.id||m5.revision!==revision||
    m5.signedV5ActionCount!==0||
    sourceDepth?.sourceGeometryId!==geometry.id||
    sourceDepth.revision!==revision||
    sourceDepth.engineeringLineStylesSigned!==false||
    sourceDepth.officialV5ActionCount!==0||
    !Array.isArray(sourceDepth.witnesses)||
    !Array.isArray(refinements)||
    typeof exactIntervalCoverage!=='function')
  throw new TypeError('current original source, native OCCT, M4 affine depth and M5 ray required');
 const originals=new Map(geometry.data.edges.map(e=>[sourceKey(geometry,e),e]));
 const m5ByKey=new Map(m5.rows.map(r=>[r.originalPhysicalSourceEdgeId+'@'+r.view,r]));
 if(originals.size!==geometry.data.edges.length||m5ByKey.size!==m5.rows.length)
  throw new RangeError('duplicate original source or M5 physical source ray');
 const counts={
  realHiddenNativeEdgesAudited:0,
  unique3DHiddenCandidateEdgesAudited:0,
  hiddenNativeFullPaperMaskByRealVisibleFrontSource:0,
  hiddenNativePartialPaperMaskOrDepthGapHeld:0,
  realVisibleFrontM5ClosedRayAndM4DepthWitnessCount:0,
  missingValidFrontM5RayOrNativeVisibleHLR:0,
  nativeHiddenWithoutUnique3DSourceHeld:0,
  numberOfUncoveredPositiveHiddenPaperIntervals:0,
  generatedHLRTopoDSAttributionsMade:0,
  GBHiddenLineAndJunctionSignaturesMade:0,V5ActionsMade:0
 };
 const rows=[];let i=0;
 for(const view of VIEWS){
  const hidden=cad.hiddenSharpViews?.[view],visible=cad.views?.[view];
  if(!Array.isArray(hidden)||!Array.isArray(visible))
   throw new RangeError('genuine OCCT visible/hidden first angle HLR output missing');
  for(const native of hidden){
   const refined=refinements[i];
   if(!refined||refined.view!==view||
      refined.projectedFrom.u!==native.from.u||
      refined.projectedFrom.v!==native.from.v||
      refined.projectedTo.u!==native.to.u||
      refined.projectedTo.v!==native.to.v||
      refined.nativeHLRToSourceTopoDSIdentityRecovered!==false||
      refined.signedV5Action!==false||
      native.occtHLRVisibilityClass!=='hidden-sharp'||
      native.actualOCCTHLRFlattenedBRepLineVerified!==true||
      native.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true)
    throw new RangeError('genuine hidden HLR stroke changed after M5 pruning');
   const surviving=refined.remainingPhysicalSourcePossibilities;
   if(!Array.isArray(surviving))throw new RangeError('no native HLR source ledger');
   let proof=null;
   if(surviving.length===1){
    counts.unique3DHiddenCandidateEdgesAudited++;
    const hiddenId=surviving[0].sourceEdgeId,
     actualLift=native.sourceCandidate3DLifts.find(s=>s.sourceEdgeId===hiddenId),
     original=originals.get(hiddenId);
    if(!actualLift||!original||
       actualLift.originalOCCTSourceLineCurveVerified!==true||
       actualLift.actualOriginalOCCTBRepEdge3DEndpointsVerified!==true||
       actualLift.originalXYZReprojectsToHLR!==true||
       actualLift.v5Authorized!==false)
     throw new RangeError('unverified genuine 3D original hidden source candidate');
    const validMaskIntervals=[],frontWitnesses=[];
    for(const witness of sourceDepth.witnesses){
     if(witness.view!==view||
        !witness.exactM4PositivePaperCollinearOverlap||
        !witness.continuousAffineOpenDepthOrderProven||
        witness.signedV5Action!==false||
        witness.standardEngineeringLineStyle!=='undetermined'||
        witness.frontSourceEdgeId===hiddenId)
      continue;
     const hiddenFirst=witness.firstSourceEdgeId===hiddenId;
     const hiddenSecond=witness.secondSourceEdgeId===hiddenId;
     if(!hiddenFirst&&!hiddenSecond)continue;
     const frontId=witness.frontSourceEdgeId;
     if(frontId!==(hiddenFirst?witness.secondSourceEdgeId:witness.firstSourceEdgeId))
      continue;
     const originalFront=originals.get(frontId);
     const frontM5=m5ByKey.get(frontId+'@'+view);
     if(!originalFront||!frontM5||
        frontM5.completeSourceOriginal3DRayClosedIntervalClear!==true||
        frontM5.originalPhysicalCreaseProven!==true||
        frontM5.signedV5Action!==false){
      counts.missingValidFrontM5RayOrNativeVisibleHLR++;
      continue;
     }
     const hiddenM4Range=hiddenFirst?witness.firstParameterRange:
      witness.secondParameterRange;
     if(!Array.isArray(hiddenM4Range)||hiddenM4Range.length!==2||
        !hiddenM4Range.every(finite)||hiddenM4Range[0]<0||
        hiddenM4Range[1]>1||hiddenM4Range[1]<=hiddenM4Range[0])
      throw new RangeError('invalid original M4 source affine depth overlap');
     for(const frontNative of visible){
      if(frontNative.view!==view||
         frontNative.occtHLRVisibilityClass!=='visible-sharp'||
         frontNative.actualOCCTHLRFlattenedBRepLineVerified!==true||
         frontNative.actualOCCTHLRCurveEntireFiniteIntervalIsLine!==true||
         frontNative.v5Authorized!==false)
       throw new RangeError('forged native visible OCCT source');
      const source=frontNative.sourceCandidate3DLifts?.find(s=>
       s.sourceEdgeId===frontId&&
       s.actualOriginalOCCTBRepEdge3DEndpointsVerified===true&&
       s.originalOCCTSourceLineCurveVerified===true&&
       s.originalXYZReprojectsToHLR===true&&s.v5Authorized===false);
      if(!source)continue;
      const projected=mappedActualVisibleHLRToHiddenOriginalParameter({
       geometry,view,hiddenOriginalVertexIds:original,nativeVisible:frontNative
      });
      if(!projected.nativeVisibleOnSameBoundedOriginalPaperLine)continue;
      const [ma,mb]=projected.hiddenOriginalSourceParameterRange;
      const [pa,pb]=hiddenM4Range;
      const start=Math.max(ma,pa),end=Math.min(mb,pb);
      if(start>=end)continue;
      validMaskIntervals.push([start,end]);
      frontWitnesses.push({
       originalFrontSourceEdgeId:frontId,
       realOCCTVisibleFrontSharpStroke:true,
       exactM5FullClosedOriginalFrontRayClear:true,
       independentlyRecomputedOriginalM4WholeAffineFrontDepthOrder:true,
       strictDepthOrderOriginalHiddenSourceParameterRange:
        [...hiddenM4Range],
       visibleFrontNativeActualOriginalSourceCandidate:true,
       hiddenSourceCoveredOriginalParameterRange:[start,end],
       nativeHLRGeneratedTopoDSIdentityCertified:false,
       GBStyleCertified:false,signedV5Action:false
      });
     }
    }
    proof=exactIntervalCoverage(actualLift.originalSourceParameterRange,
     validMaskIntervals);
    if(proof.entireOriginalParameterIntervalCovered)
     counts.hiddenNativeFullPaperMaskByRealVisibleFrontSource++;
    else counts.hiddenNativePartialPaperMaskOrDepthGapHeld++;
    counts.numberOfUncoveredPositiveHiddenPaperIntervals+=
     proof.positiveLengthUncoveredIntervals.length;
    counts.realVisibleFrontM5ClosedRayAndM4DepthWitnessCount+=
     frontWitnesses.length;
    rows.push({
     view,revision,sourceGeometryId:geometry.id,nativeHiddenSharpEdgeOrdinal:i,
     originalHidden3DSourceEdgeId:hiddenId,
     actualHiddenOriginal3DSourceParameterRange:
      [...actualLift.originalSourceParameterRange],
     realNativeVisibleFrontOriginalSourceWitnesses:frontWitnesses,
     wholeHiddenPaperIntervalMaskCoverage:proof,
     entireNativeHiddenPaperStrokeCoveredByPositivelyClearFrontSource:
      proof.entireOriginalParameterIntervalCovered,
     nativeHiddenLineShouldBeDrawnSeparatelyCertified:false,
     originalHLRSourceTopoDSIdentityRecovered:false,
     officialEngineeringLineStyle:'undetermined',
     constructionIntentAuthorized:false,signedV5Action:false
    });
   }else{
    counts.nativeHiddenWithoutUnique3DSourceHeld++;
    rows.push({view,revision,sourceGeometryId:geometry.id,
     nativeHiddenSharpEdgeOrdinal:i,
     originalHidden3DSourceEdgeId:null,
     actualHiddenOriginal3DSourceParameterRange:null,
     realNativeVisibleFrontOriginalSourceWitnesses:[],
     wholeHiddenPaperIntervalMaskCoverage:null,
     entireNativeHiddenPaperStrokeCoveredByPositivelyClearFrontSource:false,
     nativeHiddenLineShouldBeDrawnSeparatelyCertified:false,
     originalHLRSourceTopoDSIdentityRecovered:false,
     officialEngineeringLineStyle:'undetermined',
     constructionIntentAuthorized:false,signedV5Action:false});
   }
   counts.realHiddenNativeEdgesAudited++;i++;
  }
 }
 if(i!==refinements.length||rows.length!==i||
    counts.realHiddenNativeEdgesAudited!==
     counts.unique3DHiddenCandidateEdgesAudited+
      counts.nativeHiddenWithoutUnique3DSourceHeld||
    counts.V5ActionsMade!==0)
  throw new RangeError('incomplete genuine original source hidden/visible paper mask proof');
 return frozen({
  schema:'draftai-c1-ocjs-native-hidden-original-front-visible-3d-mask/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',counts,rows,
  firstAngleTrueOCCTHLRVisibleAndHiddenConsumed:true,
  originalM4AffineDepthAndM5FullClosedClearRayConsumed:true,
  allNativeHLRGeneratedTopoDSLinksProven:false,
  wholeDrawingGBLineTypesAnd3DJunctionsCertified:false,
  authorizedConstructionIntent:false,signedV5ActionCount:0,
  wholeSolidV5Ready:false
 });
}
module.exports={mappedActualVisibleHLRToHiddenOriginalParameter,
 auditC1NativeHiddenFrontVisibleMasks};
