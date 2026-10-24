'use strict';
/**
 * Public-proof-scoped M4 spatial ConstructionIntent -> real core
 * ConstructionStep DAG -> EXISTING ONE V5 Motion/Timeline parity audit.
 *
 * No new solver, renderer or player. This bridge does NOT authorize a
 * runtime V5 plan; its source geometry is human-confirmed, NOT a signed
 * M3 construction answer. The proposed independent DAG is presentation
 * evidence-only, with no invented engineering-construction dependencies.
 */
const {SCHEMA,validateSpatialStrokeIntentDAG}=
 require('../core/contracts/spatial-stroke-construction-intent.js');
const {validateConstructionStep}=require('../core/contracts/construction-step.js');
const {auditReviewedM4V5Motion}=
 require('./m4-existing-v5-motion-parity.cjs');
const {project,toSheet,VIEWS}=require('../core/projection/conventions.js');
const Timeline=require('./teaching-timeline-v5.js');
const Motion=require('./teaching-motion-v5.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
 }return x;};
const fail=s=>{throw new TypeError('spatial M4/Intent/DAG/V5 parity: '+s);};
const copy=x=>JSON.parse(JSON.stringify(x));
const empty=(revision,reason)=>freeze({
 schema:'draftai-m4-spatial-construction-dag-v5-audit/1',
 revision,status:'not-covered',reason,intents:[],constructionSteps:[],
 v5CandidateSteps:[],v5ActionBindings:[],presentationTimingAudit:null,
 everyActionHasProofTrace:false,geometricParityVerified:false,
 structuralIntentDAGVerified:false,structuralConstructionStepDAGVerified:false,
 canonicalM3SolveResultVerified:false,approvedConstructionOrderVerified:false,
 closedEndpointJoinsVerified:false,fullContourVisibilityVerified:false,
 officialLineStylesVerified:false,singleV5Ready:false,
 createsSecondPlayer:false
});
function auditSpatialStrokeConstructionDAG({
 geometry,sceneDepthEvidence,revision,viewTransforms,motionParity
}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('current source revision required');
 if(!Array.isArray(geometry)||!geometry.length||geometry.length>12||
    sceneDepthEvidence?.status!=='scoped-face-probes-only'||
    sceneDepthEvidence.revision!==revision||
    sceneDepthEvidence.v5Ready!==false||
    sceneDepthEvidence.officialLineStylesVerified!==false||
    sceneDepthEvidence.constructionIntentReady!==false)
  return empty(revision,'current source is not in reviewed spatial geometry-only scope');
 const actual=auditReviewedM4V5Motion({
  geometry,sceneDepthEvidence,revision,viewTransforms});
 if(actual.status!=='existing-motion-presentation-geometry-only')
  return empty(revision,'current Geometry and existing V5 motion cannot be paired');
 if(!motionParity||
    JSON.stringify(motionParity)!==JSON.stringify(actual))
  fail('caller cannot replace or alter current V5 Motion source candidate proof');
 const count=actual.candidates.length;
 if(count<1||count>300)
  return empty(revision,'existing one-V5 timeline has a hard 300-step bound');
 const intents=[],constructionSteps=[],v5CandidateSteps=[],bindings=[];
 const seen=new Set();
 for(let i=0;i<count;i++){
  const p=actual.candidates[i],id='SpatialStrokeIntent_'+(i+1),
   stepId='SpatialStrokeStep_'+(i+1),
   uv0=project(sceneDepthEvidence.projectedStrokePartitions.segments[i]
    .fromModelMm)[p.view],
   uv1=project(sceneDepthEvidence.projectedStrokePartitions.segments[i]
    .toModelMm)[p.view],
   span=sceneDepthEvidence.projectedStrokePartitions.segments[i];
  if(!VIEWS.includes(p.view)||p.currentSourceRevision!==revision||
     p.sourceGeometryId!==span.sourceGeometryId||
     p.sourceEdgeId!==span.sourceEdgeId||
     JSON.stringify(p.sourceParameterRange)!==
       JSON.stringify(span.sourceParameterRange)||
     p.v5ActionApproved!==false||p.officialLineStyleVerified!==false||
     p.wholeDrawnStrokeVisibility!=='undetermined')
   fail('source-based signed line style or original 3D Geometry mismatch');
  if(seen.has(p.v5MotionAction.id))fail('duplicate single V5 action identity');
  seen.add(p.v5MotionAction.id);
  const fromSheet=toSheet(p.view,uv0,viewTransforms[p.view]),
   toSheetPt=toSheet(p.view,uv1,viewTransforms[p.view]);
  const action=p.v5MotionAction;
  if(action.kind!=='line'||
     JSON.stringify(action.geometry)!==
      JSON.stringify({from:fromSheet,to:toSheetPt}))
   fail('V5 action coordinates do not match independently projected source');
  const intent={
   schema:SCHEMA,id,revision,source:{
    geometryId:p.sourceGeometryId,edgeId:p.sourceEdgeId,
    view:p.view,parameterRange:[...p.sourceParameterRange],unit:'mm'},
   operation:{kind:'project-source-subspan',coordinateSpace:'model-mm-3d',
    fromModelMm:copy(span.fromModelMm),toModelMm:copy(span.toModelMm),
    fromProjectedMm:copy(uv0),toProjectedMm:copy(uv1),
    v5ActionId:action.id},
   dependsOn:[],
   proof:{status:'evidence-only',
    openInteriorVisibility:p.scopedOpenInteriorVisibility,
    wholeStrokeVisibility:'undetermined',sourceReviewRevision:revision,
    sourceEndpointJoinsVerified:false,multiBodyContourVerified:false,
    officialLineStyleVerified:false,constructionOrderVerified:false,
    v5Approved:false}
  };
  intents.push(intent);
  const step={id:stepId,
   explanation:'当前来源的空间线段投影候选；虚实线与端点尚未正式证明。',
   dependsOn:[],
   targetIds:[p.sourceGeometryId],
   actions:[{kind:'line',style:'auxiliary',
    geometry:{x1:uv0.u,y1:uv0.v,x2:uv1.u,y2:uv1.v}}]};
  const validated=validateConstructionStep(step);
  if(!validated.ok)fail('core ConstructionStep invalid: '+validated.errors.join('; '));
  constructionSteps.push(step);
  // No original engineering construction ordering has been proved:
  // independent DAG nodes; presentation schedule is only timing parity.
  v5CandidateSteps.push({id:stepId,dependsOn:[],
   title:'source '+p.sourceEdgeId+' '+p.view,
   role:'auxiliary',
   actions:[copy(action)]});
  bindings.push({intentId:id,constructionStepId:stepId,
   v5ActionId:action.id,sourceGeometryId:p.sourceGeometryId,
   sourceEdgeId:p.sourceEdgeId,view:p.view,
   sourceParameterRange:[...p.sourceParameterRange],
   openInteriorVisibility:p.scopedOpenInteriorVisibility,
   endpointProofsNeeded:true,officialLineStyleVerified:false,
   sourceActionGeometryVerified:true,approved:false});
 }
 const verdict=validateSpatialStrokeIntentDAG(intents);
 if(!verdict.ok)fail('spatial Intent DAG invalid: '+verdict.errors.join('; '));
 const timing=Timeline.compileTimeline(v5CandidateSteps);
 if(timing.segments.length!==count)fail('existing V5 timeline action count mismatch');
 const ids=new Set();
 for(let i=0;i<count;i++){
  const step=v5CandidateSteps[i],block=timing.segments[i],
   action=step.actions[0],bind=bindings[i];
  if(ids.has(block.id)||block.id!==action.id||
     block.stepId!==step.id||block.kind!=='line'||
     bind.v5ActionId!==block.id||bind.constructionStepId!==block.stepId)
   fail('ConstructionStep DAG and existing one-V5 action identity mismatch');
  ids.add(block.id);
  const end=Motion.actionShapeAttrs(action,1);
  if(Math.abs(end.x1-action.geometry.from.x)>1e-8||
     Math.abs(end.y1-action.geometry.from.y)>1e-8||
     Math.abs(end.x2-action.geometry.to.x)>1e-8||
     Math.abs(end.y2-action.geometry.to.y)>1e-8)
   fail('existing V5 complete stroke does not match M4 candidate geometry');
 }
 return freeze({
  schema:'draftai-m4-spatial-construction-dag-v5-audit/1',
  revision,status:'structural-source-action-parity-only',reason:null,
  intents,constructionSteps,v5CandidateSteps,v5ActionBindings:bindings,
  presentationTimingAudit:copy(timing),
  everyActionHasProofTrace:true,geometricParityVerified:true,
  structuralIntentDAGVerified:true,
  structuralConstructionStepDAGVerified:true,
  canonicalM3SolveResultVerified:false,
  approvedConstructionOrderVerified:false,
  closedEndpointJoinsVerified:false,fullContourVisibilityVerified:false,
  officialLineStylesVerified:false,singleV5Ready:false,
  createsSecondPlayer:false
 });
}
module.exports={auditSpatialStrokeConstructionDAG};
