'use strict';
/**
 * DraftAI V3.1 Gate A: revision-safe confirmed geometry session.
 *
 * A controller, not another solver or renderer. Every replacement invalidates
 * the prior timeline *before* recomputing the 02/G1/V5 chain, including invalid
 * or incomplete edits. Old model plans never leak through the current session.
 * No browser APIs, image uploads, persisted data, or external clock.
 */
const {confirmedFilletTimeline} = require('./v31-confirmed-fillet-v5.cjs');
const Timeline = require('./teaching-timeline-v5.js');

const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const clone=x=>structuredClone(x);
const timestamp=x=>{
 if(typeof x!=='number'||!Number.isFinite(x)||x<0)
  throw new TypeError('explicit finite nonnegative monotonic now required');
 return x;
};
const revisionNumber=x=>{
 if(!Number.isSafeInteger(x)||x<0)
  throw new RangeError('revision must be a nonnegative safe integer');
 return x;
};
function createConfirmedFilletSession(initial,{speed=1,now=0}={}){
 timestamp(now);Timeline.validateSpeed(speed);
 if(!isRecord(initial)||!isRecord(initial.problem))
  throw new TypeError('initial confirmed problem is required');
 let revision=revisionNumber(initial.problem.revision??0);
 let lastNow=now,player=null,plan=null;
 let speedValue=speed;

 function safeSolve(input,currentRevision){
  if(!isRecord(input)||!isRecord(input.problem))
   return {status:'invalid-input',revision:currentRevision,
    reason:'confirmed problem is required',steps:[],timing:null,
    mathematicallyVerified:false};
  try{
   const normalizedInput=clone(input);
   normalizedInput.problem.revision=currentRevision;
   const result=confirmedFilletTimeline(normalizedInput);
   if(result.revision!==currentRevision)
    throw new RangeError('solver result revision mismatch');
   return result;
  }catch(e){
   // Malformed edits cannot revive old geometry or produce unverified steps.
   return {status:'invalid-input',revision:currentRevision,
    reason:e instanceof Error?e.message:'recompute failed',
    steps:[],timing:null,mathematicallyVerified:false};
  }
 }
 function install(input){
  plan=safeSolve(input,revision);
  player=plan.status==='ready'&&plan.mathematicallyVerified===true
   ?Timeline.createPlayer(plan.timing,{speed:speedValue,revision})
   :null;
 }
 function nowCheck(nowValue){
  const n=timestamp(nowValue);
  if(n<lastNow)throw new RangeError('monotonic clock moved backwards');
  lastNow=n;return n;
 }
 function canRender(requestRevision){
  return requestRevision===revision&&plan.status==='ready'&&
   player!==null&&player.canRender(revision);
 }
 function snapshot(at=lastNow){
  const n=nowCheck(at);
  return {revision,status:plan.status,
   ready:canRender(revision),reason:plan.reason??null,
   mathematicallyVerified:plan.mathematicallyVerified===true,
   selectedBranchId:plan.selectedBranchId??null,
   // Return copies; a caller cannot mutate internal geometry or timeline.
   plan:clone(plan),
   playback:player?clone(player.snapshot(n)):null};
 }
 function forward(method,value,at){
  const n=nowCheck(at);
  if(player===null)return snapshot(n);
  if(value===undefined)player[method](n);
  else player[method](value,n);
  return snapshot(n);
 }

 install(initial);
 return Object.freeze({
  snapshot,canRender,
  get revision(){return revision;},
  play(at){return forward('play',undefined,at);},
  pause(at){return forward('pause',undefined,at);},
  setSpeed(value,at){
   Timeline.validateSpeed(value);
   const n=nowCheck(at);speedValue=value;
   if(player)player.setSpeed(value,n);
   return snapshot(n);
  },
  seekProgress(ratio,at){return forward('seekProgress',ratio,at);},
  seekStep(index,at){return forward('seekStep',index,at);},
  /**
   * Full updated confirmed input. expectedRevision is a concurrency guard.
   * The revision increments even when the new solve is invalid/ambiguous.
   * The old player's internal invalid flag flips BEFORE solving fresh math.
   */
  replace(next,{expectedRevision,now:at}={}){
   if(expectedRevision!==revision)
    throw new RangeError('stale session revision: replacement rejected');
   const n=nowCheck(at);
   if(revision===Number.MAX_SAFE_INTEGER)
    throw new RangeError('session revision exhausted');
   const newRevision=revision+1;
   if(player)player.invalidate(newRevision,n);
   // New state is established before invoking the solver.
   player=null;
   plan={status:'invalid-input',revision:newRevision,
    reason:'recomputing',steps:[],timing:null,mathematicallyVerified:false};
   revision=newRevision;
   install(next);
   return snapshot(n);
  }
 });
}
module.exports={createConfirmedFilletSession};
