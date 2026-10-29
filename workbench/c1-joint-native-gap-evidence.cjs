'use strict';
/**
 * Join two independent, unsigned real-OCCT gap audits without promoting
 * paper adjacency or original curve parameters to generated-edge history.
 * Every positive gap remains unresolved until a separate native history,
 * complete interval and continuous M5 proof exists.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&a.every((v,i)=>Object.is(v,b[i]));
function auditC1JointNativeGapEvidence({curve,adjacency}={}){
 if(!curve||!adjacency||!VIEWS.includes(curve.view)||
    curve.view!==adjacency.view||curve.sourceEdgeId!==adjacency.sourceEdgeId||
    !Array.isArray(curve.rows)||!Array.isArray(adjacency.rows)||
    curve.rows.length!==adjacency.rows.length||curve.rows.length>128||
    curve.gapsExamined!==curve.rows.length||
    curve.generatedHLREdgeToOriginalTopoDSHistoryCertified!==false||
    adjacency.generatedToOriginalTopoDSFullHistoryCertified!==false||
    curve.globalContinuousVisibilityCertified!==false||
    adjacency.globalContinuousVisibilityCertified!==false||
    curve.signedV5ActionCount!==0||adjacency.signedV5ActionCount!==0)
  throw new TypeError('matching unsigned real OCCT curve and generated vertex gap audits required');
 const rows=curve.rows.map((c,i)=>{
  const a=adjacency.rows[i];
  if(c.gapOrdinal!==i||a?.gapOrdinal!==i||
     !same(c.originalM0SourceParameterGap,a.originalSourceParameterGap)||
     c.exactOriginalOcctCurveParameterGapHasPositiveLength!==true||
     c.actualOriginalBRepCurveParametersOnly!==true||
     a.sourceGapClosedByNativeEndpointEvidence!==false||
     a.signedV5Action!==false||c.signedV5Action!==false)
   throw new RangeError('mismatched or already signed original-source gap');
  const atVertex=a.from?.directNativeOriginalVertexIsSameEndpointCount>0;
  const paperInside=a.exactReceivedPaperCollinearCandidateStrictlyInsideGapCount>0;
  const drift=a.exactReceivedPaperOffLineCandidateStrictlyInsideGapCount>0;
  return {
   gapOrdinal:i,view:curve.view,sourceEdgeId:curve.sourceEdgeId,
   originalSourceParameterGap:[...c.originalM0SourceParameterGap],
   exactOriginalOcctCurvePositive:true,
   originalCurveRoundedParameterCollapsed:c.roundedOriginalOcctCurveParameterGapCollapsed===true,
   nativeGeneratedOriginalVertexAtGapStart:atVertex,
   exactCollinearPaperEndpointInsideGap:paperInside,
   transversePaperEndpointInsideGap:drift,
   diagnosis:paperInside?'paper-candidate-without-generated-history':
    drift?'off-line-paper-candidate-without-generated-history':
    atVertex?'original-vertex-adjacent-without-generated-history':
    'no-generated-history-for-positive-source-gap',
   generatedToOriginalTopoDSHistoryProven:false,
   completeOriginalSourceIntervalCoverageProven:false,
   globalContinuousOcclusionProven:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  };
 });
 return freeze({schema:'draftai-c1-joint-real-native-gap-evidence/1',
  view:curve.view,sourceEdgeId:curve.sourceEdgeId,positiveGapCount:rows.length,rows,
  fullOriginalSourceHistoryCertified:false,fullSourceCoverageCertified:false,
  globalContinuousVisibilityCertified:false,formalEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0});
}
module.exports={auditC1JointNativeGapEvidence};
