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
/**
 * Run the actual existing forensic auditors on ONE shared real-WASM input.
 * No pre-fabricated audit reports can be substituted in this entry point.
 */
function auditC1JointNativeGapFromRealHLR({
 geometry,view,sourceEdgeId,originalBRepSource,uncoveredIntervals,
 visibleSegments,hiddenSegments
}={}){
 const {auditC1OriginalOcctCurveParameterGapWitness}=
  require('./c1-original-occt-curve-parameter-gap-witness.cjs');
 const {auditC1NativeGapGeneratedVertexAdjacency}=
  require('./c1-native-gap-generated-vertex-adjacency.cjs');
 const curve=auditC1OriginalOcctCurveParameterGapWitness({
  geometry,view,sourceEdgeId,originalBRepSource,uncoveredIntervals
 });
 const adjacency=auditC1NativeGapGeneratedVertexAdjacency({
  geometry,view,sourceEdgeId,uncoveredIntervals,visibleSegments,hiddenSegments
 });
 return auditC1JointNativeGapEvidence({curve,adjacency});
}
/**
 * Accept one captured WASM diagnostic envelope with all three known positive
 * A-end gaps. Never infer missing sources or synthesize HLR edge records.
 * This remains forensic-only even if every record is present.
 */
function auditC1ThreeNativeGapBatch({geometry,records}={}){
 const expected=[
  ['H','A|C',5.02742501717052e-18],
  ['W','A|C',1.1102230246251565e-16],
  ['W','A|D',9.431983218054427e-18]
 ];
 if(typeof geometry?.id!=='string'||!geometry.id||
    !Array.isArray(records)||records.length!==expected.length)
  throw new TypeError('three actual original-source gap records required');
 const results=expected.map(([view,edge,end])=>{
  const sourceEdgeId=geometry.id+'::'+edge;
  const matches=records.filter(r=>r?.view===view&&r?.sourceEdgeId===sourceEdgeId);
  if(matches.length!==1)throw new RangeError('missing or duplicated native gap record: '+view+' '+edge);
  const r=matches[0];
  if(!same(r.uncoveredIntervals?.[0],[0,end])||
     r.uncoveredIntervals.length!==1||
     !Array.isArray(r.visibleSegments)||!Array.isArray(r.hiddenSegments))
   throw new RangeError('native gap intervals or HLR segments missing: '+view+' '+edge);
  return auditC1JointNativeGapFromRealHLR({...r,geometry});
 });
 if(records.some(r=>!expected.some(([view,edge])=>
    r?.view===view&&r?.sourceEdgeId===geometry.id+'::'+edge)))
  throw new RangeError('unrecognized native source gap record');
 return freeze({schema:'draftai-c1-three-native-gap-batch/1',
  sourceGeometryId:geometry.id,recordsExamined:results.length,results,
  gapsClosed:0,formalEngineeringLineStyleCertified:false,
  constructionIntentAuthorized:false,signedV5ActionCount:0});
}
/**
 * Read-only bridge to computeC1OcjsVisibleSegments' actual returned CAD
 * payload. Caller must independently supply the M5 uncovered source spans.
 * Validating this JS payload does NOT attest that WASM was executed or that
 * any generated edge has a complete original TopoDS history.
 */
function auditC1JointNativeGapFromCad({
 geometry,cad,view,sourceEdgeId,uncoveredIntervals
}={}){
 if(!geometry?.id||!VIEWS.includes(view)||
    cad?.schema!=='draftai-c1-ocjs-real-visible-brep/1'||
    cad.engine!=='opencascade.js'||cad.sourceGeometryId!==geometry.id||
    !Number.isSafeInteger(cad.revision)||cad.revision<1||
    cad.completeSourceTopology3DEndpointCorrespondence!==true||
    cad.actualOCCTCurveTypeIndependentlyVerified!==true||
    cad.actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified!==false||
    cad.lineStyleCertified!==false||cad.v5Authorized!==false||
    !Array.isArray(cad.originalBRepSourceEdges)||
    !Array.isArray(cad.views?.[view])||
    !Array.isArray(cad.hiddenSharpViews?.[view]))
  throw new TypeError('unsigned complete OCJS CAD payload and M0 geometry required');
 const sources=cad.originalBRepSourceEdges.filter(x=>x?.sourceEdgeId===sourceEdgeId);
 if(sources.length!==1)
  throw new RangeError('unique real original OCCT source required in CAD payload');
 return auditC1JointNativeGapFromRealHLR({
  geometry,view,sourceEdgeId,uncoveredIntervals,
  originalBRepSource:sources[0],
  visibleSegments:cad.views[view],hiddenSegments:cad.hiddenSharpViews[view]
 });
}
module.exports={auditC1JointNativeGapEvidence,auditC1JointNativeGapFromRealHLR,
 auditC1ThreeNativeGapBatch,auditC1JointNativeGapFromCad};
