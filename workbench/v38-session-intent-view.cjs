'use strict';
/**
 * F2 additive read-only intent metadata for the existing V3.1 session.
 * Never changes the mathematical solver, playback state, timeline or drawing.
 * Does not pretend to be canonical ConstructionIntent or proof evidence.
 */
function sessionIntentView(snapshot){
 const blocked={status:'unavailable',revision:snapshot?.revision??null,
  selectedBranchId:null,intents:[],mathematicallyVerified:false};
 if(!snapshot||!Number.isSafeInteger(snapshot.revision)||
  snapshot.revision<0||snapshot.ready!==true||
  snapshot.mathematicallyVerified!==true||
  snapshot.playback?.revision!==snapshot.revision||
  snapshot.plan?.revision!==snapshot.revision||
  snapshot.plan?.status!=='ready'||
  snapshot.plan?.mathematicallyVerified!==true||
  !Array.isArray(snapshot.plan.steps)||!snapshot.plan.steps.length)
  return blocked;
 const seen=new Set(),intents=[];
 for(const step of snapshot.plan.steps){
  if(!step||typeof step.id!=='string'||!step.id||seen.has(step.id)||
   !Array.isArray(step.dependsOn)||step.dependsOn.some(x=>!seen.has(x))||
   !Array.isArray(step.actions)||typeof step.explanation!=='string')
   return blocked;
  seen.add(step.id);
  intents.push(Object.freeze({
   id:step.id,purpose:step.title||step.explanation,
   dependsOn:Object.freeze([...step.dependsOn]),
   outputEntityIds:Object.freeze(step.actions.map(x=>x.id)),
   sourceRevision:snapshot.revision,
   branchId:snapshot.selectedBranchId??null,
   explanation:step.explanation
  }));
 }
 return Object.freeze({
  status:'ready',revision:snapshot.revision,
  selectedBranchId:snapshot.selectedBranchId??null,
  intents:Object.freeze(intents),
  // Reflect session verification only; do not issue an independent proof.
  mathematicallyVerified:true,source:'existing-confirmed-session'
 });
}
module.exports={sessionIntentView};
