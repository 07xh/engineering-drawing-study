'use strict';
/**
 * LAST consumer-facing gate for the SAME V5 player: every reviewed spatial
 * source action must carry independently reproducible Geometry -> M0/M5 ->
 * M4 -> spatial Intent -> core ConstructionStep DAG -> ONE V5 Motion proof.
 *
 * This is a strict withholding authority, NOT a source of new mathematical
 * approval. Today no confirmed mesh-scene input provides the complete M3
 * answer, endpoint joins, global 3D contour and standard stroke semantics:
 * every action must remain undetermined. Never allow a Boolean supplied by
 * an adapter, webpage, browser or user to mint real solid/dashed strokes.
 */
const {auditSpatialStrokeConstructionDAG}=
 require('./spatial-stroke-construction-dag-parity.cjs');
const {inspectSpatialV5Readiness}=
 require('./spatial-v5-evidence-readiness.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
 }return x;};
const fail=s=>{throw new TypeError('spatial V5 per-action signoff: '+s);};
const unavailable=(revision,reason)=>freeze({
 schema:'draftai-spatial-v5-per-action-release-gate/1',revision,
 status:'not-covered',reason,actions:[],actionCount:0,
 blockedCount:0,signedCount:0,
 anyOfficialStyleApproved:false,singleV5Ready:false
});
function inspectSpatialV5ActionRelease({
 geometry,sceneDepthEvidence,revision,viewTransforms,
 motionParity,spatialConstructionDAG
}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('current source revision required');
 if(!Array.isArray(geometry)||!geometry.length||!sceneDepthEvidence||
    sceneDepthEvidence.revision!==revision||
    sceneDepthEvidence.status!=='scoped-face-probes-only')
  return unavailable(revision,'no trusted current reviewed spatial scene');
 const fresh=auditSpatialStrokeConstructionDAG({
  geometry,sceneDepthEvidence,revision,viewTransforms,motionParity});
 if(fresh.status!=='structural-source-action-parity-only')
  return unavailable(revision,'M3 source or spatial intent/action graph not structurally audited');
 if(!spatialConstructionDAG||
    JSON.stringify(spatialConstructionDAG)!==JSON.stringify(fresh))
  fail('spatial ConstructionIntent/DAG/V5 proof chain substituted or outdated');
 const readiness=inspectSpatialV5Readiness({sceneDepthEvidence,revision});
 if(readiness.v5Ready!==false||
    readiness.singleV5TimelineCanBeSigned!==false||
    fresh.singleV5Ready!==false)
  fail('source geometry proof cannot mint final spatial V5 readiness');
 const obligations=readiness.missingEvidence.map(x=>x.id);
 const actions=[];
 for(const [i,b] of fresh.v5ActionBindings.entries()){
  const intent=fresh.intents[i],step=fresh.constructionSteps[i],
   frame=fresh.v5CandidateSteps[i],span=
    sceneDepthEvidence.projectedStrokePartitions.segments[i];
  if(!intent||!step||!frame||!span||
     b.intentId!==intent.id||b.constructionStepId!==step.id||
     b.v5ActionId!==frame.actions[0]?.id||
     b.sourceEdgeId!==span.sourceEdgeId||
     b.openInteriorVisibility!==span.openInteriorVisibility||
     intent.proof.status!=='evidence-only'||
     intent.proof.v5Approved!==false||
     intent.proof.wholeStrokeVisibility!=='undetermined')
   fail('lost or forged spatial source-to-actual-V5 action correspondence');
  // Each missing witness is attributable to the correct ORIGINAL source
  // action. A ray-certified OPEN segment does not prove a closed line, and
  // a paper coordinate match does not prove a physical 3D endpoint join.
  const needed=new Set([
   'm3-independent-solve-result',
   'canonical-spatial-construction-order',
   'complete-source-endpoint-and-projected-join-visibility',
   'global-multibody-depth-sorted-contour',
   'standard-complete-stroke-solid-dashed-proof'
  ]);
  if(span.openInteriorVisibility==='undetermined')
   needed.add('continuous-positive-or-hidden-interior-proof');
  const joins=span.sourceEndpointJoins;
  if(!joins||[joins.from,joins.to].some(v=>
     v!==null&&(v.sourceIncidenceVerified!==true||
       v.projectedEndpointJoinVisibilityVerified!==false||
       v.officialEndpointLineStyleVerified!==false)))
   fail('invalid physical 3D source endpoint evidence');
  if(readiness.missingCount===0)
   fail('source readiness report cannot be silently trusted to lift line style');
  for(const item of obligations)needed.add('scene:'+item);
  actions.push({
   v5ActionId:b.v5ActionId,
   spatialIntentId:b.intentId,
   constructionStepId:b.constructionStepId,
   sourceGeometryId:b.sourceGeometryId,
   sourceEdgeId:b.sourceEdgeId,
   view:b.view,sourceParameterRange:[...b.sourceParameterRange],
   mathematicallyScopedOpenInterior:span.openInteriorVisibility,
   geometryAndMotionParityVerified:true,
   sourceIntentAndDAGStructureVerified:true,
   missingProofs:[...needed],
   authorizedLineStyle:'undetermined',
   officialStyleApproved:false,
   sourceEndpointVisibilityVerified:false,
   existingSingleV5ActionOnly:true,
   actionReleaseStatus:'blocked'
  });
 }
 if(actions.length!==fresh.v5ActionBindings.length||
    new Set(actions.map(x=>x.v5ActionId)).size!==actions.length)
  fail('all V5 actions must be individually accounted for');
 return freeze({
  schema:'draftai-spatial-v5-per-action-release-gate/1',
  revision,status:'all-actions-held-evidence-incomplete',reason:null,
  actions,actionCount:actions.length,blockedCount:actions.length,
  signedCount:0,anyOfficialStyleApproved:false,singleV5Ready:false
 });
}
module.exports={inspectSpatialV5ActionRelease};
