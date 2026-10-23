'use strict';
/**
 * F2 opt-in semantic intent projection from an independently recomputed,
 * proof-backed R1 teaching plan. NOT the frozen canonical ConstructionIntent
 * schema; this prototype never certifies a plan or changes any solver.
 * A caller must obtain the plan from verified-teaching-plan's real solvers.
 */
const {verifiedTeachingActionToV5}=require('./construction-step-v5-adapter.cjs');
const {adaptDirectedFillet}=require('./verified-teaching-plan.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=160;
function projectVerifiedPlan(kind,input,sheet,revision=0){
 if(!['circles','segments','segment-circle'].includes(kind))
  throw new TypeError('unsupported specialist kind');
 // Recompute from actual input at the trust boundary; never accept a caller-
 // supplied plan whose proof.verified flag could be forged.
 const plan=adaptDirectedFillet(kind,input,{revision});
 if(!record(plan)||plan.schema!=='draftai-teaching-plan/0.1'||
  plan.readiness!=='ready'||plan.proof?.verified!==true||
  !Number.isSafeInteger(plan.revision)||plan.revision<0||
  !Array.isArray(plan.steps)||!plan.steps.length||plan.steps.length>100)
  return {status:'not-verified',intents:[],steps:[],mathematicallyVerified:false};
 const ids=new Set(),actionIds=new Set(),intents=[],steps=[];
 for(const step of plan.steps){
  if(!record(step)||!validId(step.id)||ids.has(step.id)||
   !Array.isArray(step.dependsOn)||step.dependsOn.some(id=>!ids.has(id))||
   !Array.isArray(step.actions)||!step.actions.length||
   typeof step.explanation!=='string'||!step.explanation.trim())
   throw new TypeError('invalid verified construction dependency');
  const actions=step.actions.map(a=>{
   if(!record(a)||!validId(a.id)||actionIds.has(a.id))
    throw new TypeError('invalid or duplicate construction action');
   actionIds.add(a.id);
   return verifiedTeachingActionToV5(a,sheet);
  });
  const intent=Object.freeze({
   schema:'draftai-r1-intent-projection/0.1',
   id:step.id,purpose:step.rule||step.id,
   // Step dependencies are not geometry entity identifiers.
   inputEntityIds:Object.freeze([]),
   outputEntityIds:Object.freeze(step.actions.map(a=>a.id)),
   dependsOn:Object.freeze([...step.dependsOn]),
   sourceSolver:plan.solver,sourceRevision:plan.revision,
   branchId:plan.result?.selectedBranch??null,
   // Do not fabricate persistent result IDs when solver does not supply one.
   evidenceRef:step.provenance?.solverResultId||plan.result?.resultId||null,
   evidenceSource:step.provenance?.source||plan.solver||null,
   explanation:step.explanation
  });
  intents.push(intent);
  steps.push({id:step.id,dependsOn:[...step.dependsOn],
   title:step.explanation,explanation:step.explanation,
   role:step.role,actions});
  ids.add(step.id);
 }
 const timing=Timeline.compileTimeline(steps);
 return {status:'ready',source:'proof-backed R1 intent projection',
  revision:plan.revision,intents,steps,timing,
  mathematicallyVerified:true,proofScope:plan.proof.scope,
  selectedBranchId:plan.result?.selectedBranch??null};
}
module.exports={projectVerifiedPlan};
