'use strict';
/**
 * Read-only step explanation view for the ONE existing C1 ConstructionStep
 * DAG / V5 timeline. Never creates or signs geometry, guesses pedagogical
 * steps, or turns a proven point/auxiliary guide into a national-standard line.
 */
const Timeline=require('./teaching-timeline-v5.js');
const STYLE={
 visible:'gb-t-4457.4-continuous-wide-visible-outline',
 hidden:'gb-t-4457.4-thin-dashed-hidden-edge'
};
function inspectC1CanonicalV5Step({solution,revision,frame}={}){
 if(!solution||solution.singleOriginalV5Player!==true||
   !Number.isSafeInteger(revision)||revision<0||
   solution.revision!==revision||
   !solution.player?.canRender(revision)||
   !Array.isArray(solution.steps)||!solution.timeline||
   solution.player.timeline!==solution.timeline||
   !Array.isArray(solution.timeline.steps)||
   !Array.isArray(solution.timeline.segments)||
   solution.steps.length!==solution.timeline.steps.length||
   !frame||frame.invalid!==false||frame.revision!==revision||
   !Number.isInteger(frame.activeStepIndex)||
   !Array.isArray(frame.completedIds)||
   !frame.actionFractions||typeof frame.actionFractions!=='object')
  throw new RangeError('source-current sole V5 frame and true step DAG required');
 const steps=solution.steps,timeline=solution.timeline,
  bindings=[...(solution.certifiedVisibleContourLineBindings||[]),
   ...(solution.certifiedPhysicalLineBindings||[])];
 // Recompute the ENTIRE frame from the sole canonical V5 timeline.
 // A forged completed/future fraction must never reveal a final line before
 // its actual ConstructionStep, even when the active step itself is valid.
 if(!Number.isFinite(frame.elapsedMs)||frame.elapsedMs<0||
    frame.elapsedMs>timeline.totalMs)
  throw new RangeError('V5 frame time is outside canonical timeline');
 const expected=Timeline.frame(timeline,frame.elapsedMs);
 const expectedFractions=expected.actionFractions,
  actualIds=Object.keys(frame.actionFractions),
  expectedIds=Object.keys(expectedFractions);
 if(frame.totalMs!==expected.totalMs||
    frame.ratio!==expected.ratio||frame.done!==expected.done||
    frame.activeStepIndex!==expected.activeStepIndex||
    frame.activeStepId!==expected.activeStepId||
    frame.activeActionId!==expected.activeActionId||
    JSON.stringify(frame.completedIds)!==JSON.stringify(expected.completedIds)||
    actualIds.length!==expectedIds.length||
    expectedIds.some(id=>!Object.hasOwn(frame.actionFractions,id)||
     frame.actionFractions[id]!==expectedFractions[id]))
  throw new RangeError('V5 frame fractions or completed actions contradict canonical DAG timeline');
 const owners=new Map(),seenActions=new Set(),seenSteps=new Set();
 for(const binding of bindings){
  if(!binding||typeof binding.actionId!=='string'||
    owners.has(binding.actionId)||binding.signedFormalLineV5!==true||
    binding.revision!==revision||
    typeof binding.sourceEdgeId!=='string'||!binding.sourceEdgeId||
    !['V','H','W'].includes(binding.view)||
    ![STYLE.visible,STYLE.hidden].includes(binding.standardLineStyle))
   throw new RangeError('missing or duplicated authentic signed source binding');
  owners.set(binding.actionId,binding);
 }
 const options=[];
 for(let i=0;i<steps.length;i++){
  const step=steps[i],block=timeline.steps[i];
  if(!step||typeof step.id!=='string'||!step.id||
    seenSteps.has(step.id)||!Array.isArray(step.actions)||
    !Array.isArray(step.dependsOn)||
    step.dependsOn.some(dep=>!seenSteps.has(dep))||
    !block||block.id!==step.id||block.index!==i||
    block.actions.length!==step.actions.length)
   throw new RangeError('C1 V5 action or DAG dependency changed');
  seenSteps.add(step.id);
  for(let j=0;j<step.actions.length;j++){
   const action=step.actions[j],segment=block.actions[j];
   if(!action||typeof action.id!=='string'||!action.id||
      seenActions.has(action.id)||
      segment.id!==action.id||segment.stepId!==step.id||
      segment.stepIndex!==i)
    throw new RangeError('V5 action does not belong to exact current step');
   const signed=owners.get(action.id);
   // Verify ALL future/current/past actions before painting any frame:
   // an unsigned later step cannot smuggle an engineering line style.
   if(!signed&&action.engineeringLineStyle!==undefined)
    throw new RangeError('unbound engineering line style in V5 step');
   if(signed&&(action.kind!=='line'||(
     action.engineeringLineStyle!==undefined&&
     action.engineeringLineStyle!==signed.standardLineStyle)))
    throw new RangeError('signed source contradicts V5 action geometry or style');
   seenActions.add(action.id);
  }
  options.push({index:i,id:step.id,title:step.title||step.id});
 }
 if(seenActions.size!==timeline.segments.length||
    [...owners.keys()].some(id=>!seenActions.has(id)))
  throw new RangeError('orphan signed source or forged V5 timeline action');
 const index=frame.activeStepIndex;
 if(index<0||index>=steps.length||
   frame.activeStepId!==steps[index].id)
  throw new RangeError('V5 active step and canonical DAG disagree');
 const step=steps[index],
  proofSource=(solution.intents||[]).find(intent=>intent.id===step.id)?.source;
 const actions=step.actions.map(a=>{
  const binding=owners.get(a.id);
  // An engineering line-style claim without its genuine M5 source binding
  // must NEVER get a visible or hidden stamp in the teaching UI.
  if(!binding&&a.engineeringLineStyle!==undefined)
   throw new RangeError('unbound engineering line style in V5 step');
  if(binding&&(a.kind!=='line'||(
    a.engineeringLineStyle!==undefined&&
    a.engineeringLineStyle!==binding.standardLineStyle)))
   throw new RangeError('signed source contradicts V5 action geometry or style');
  const fraction=frame.actionFractions[a.id];
  if(!Number.isFinite(fraction)||fraction<0||fraction>1)
   throw new RangeError('V5 source action fraction is invalid');
  return {
   id:a.id,kind:a.kind,
   progress:fraction,
   status:fraction===1?'completed':fraction>0?'drawing':'pending',
   formalLineCertified:!!binding,
   officialLineStyle:binding?binding.standardLineStyle:null,
   view:binding?.view||null,
   originalSourceEdgeId:binding?.sourceEdgeId||null,
   sourceParameterRange:Array.isArray(binding?.originalParameterRange)?
    [...binding.originalParameterRange]:null
  };
 });
 const explanation=typeof step.explanation==='string'&&step.explanation.trim()?
  step.explanation.trim():null;
 return {
  schema:'draftai-c1-canonical-v5-step-evidence/1',
  revision,stepIndex:index,stepNumber:index+1,totalSteps:steps.length,
  id:step.id,title:typeof step.title==='string'?step.title:step.id,
  explanation,explanationVerifiedAvailable:explanation!==null,
  dependsOn:[...step.dependsOn],
  actions,
  options,
  stepHasDrawActions:actions.length>0,
  stepsCannotBeInventedFromPresentation:true,
  proofScope:typeof proofSource?.proofScope==='string'?
   proofSource.proofScope:null,
  registeredProofSourceSolver:typeof proofSource?.solver==='string'?
   proofSource.solver:null,
  generated2DHLRHistoryNotInferredFromThisView:true,
  singleCanonicalPlayerUsed:true,
  wholeTextbookC1BlindAccepted:false
 };
}
module.exports={inspectC1CanonicalV5Step};
