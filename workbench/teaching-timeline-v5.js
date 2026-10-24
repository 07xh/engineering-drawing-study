/* DraftAI 07 V5 - deterministic presentation timeline. NO geometric solving. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DA07TimelineV5=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SPEEDS=Object.freeze([0.25,0.5,0.65,1,1.5,1.7,2,2.5,3,4]);
 const DURATIONS=Object.freeze({line:900,circle:1500,arc:1500,'analytic-curve':1800,point:260,highlight:380,hold:600});
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 /* Signed offset branches from verified 02 math use IDs such as s++-offset1. */
 const validId=id=>typeof id==='string'&&/^[a-zA-Z][\w+\-]{0,79}$/.test(id);
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
 function validateSpeed(speed){
  if(!finite(speed)||speed<0.25||speed>4)throw new RangeError('speed must be in [0.25,4]');
  return speed;
 }
 function time(n,label){
  if(!finite(n)||n<0||n>600000)throw new RangeError(label+' must be finite and in [0,600000]');
  return n;
 }
 function compileTimeline(steps,{durations={},gapMs=180}={}){
  if(!Array.isArray(steps)||steps.length>300)throw new TypeError('timeline needs <=300 ordered steps');
  if(!obj(durations)||Object.entries(durations).some(([key,value])=>!Object.hasOwn(DURATIONS,key)||!finite(value)||value<=0||value>600000))
   throw new TypeError('unsupported or invalid duration override');
  time(gapMs,'gapMs');
  const rules={...DURATIONS,...durations},names=new Set(),actionNames=new Set();
  const blocks=[],segments=[];let cursor=0;
  for(let index=0;index<steps.length;index++){
   const s=steps[index];
   if(!obj(s)||!validId(s.id)||names.has(s.id)||!Array.isArray(s.actions)||s.actions.length>100 ||
      (s.dependsOn!==undefined&&(!Array.isArray(s.dependsOn)||new Set(s.dependsOn).size!==s.dependsOn.length||s.dependsOn.some(id=>!names.has(id)))))
    throw new TypeError('invalid/duplicate step or unmet dependency at step '+index);
   names.add(s.id);
   const startMs=cursor,actions=[];
   for(const a of s.actions){
    if(!obj(a)||!validId(a.id)||actionNames.has(a.id)||!Object.hasOwn(rules,a.kind))
     throw new TypeError('invalid action identifier or kind');
    actionNames.add(a.id);
    const durationMs=a.durationMs===undefined?rules[a.kind]:time(a.durationMs,'durationMs');
    if(durationMs<=0)throw new RangeError('action duration must be positive');
    if(cursor+durationMs>3600000)throw new RangeError('timeline exceeds one hour');
    const segment=Object.freeze({id:a.id,kind:a.kind,stepId:s.id,stepIndex:index,startMs:cursor,endMs:cursor+durationMs,durationMs});
    cursor+=durationMs;segments.push(segment);actions.push(segment);
   }
   const pauseMs=s.gapMs===undefined?gapMs:time(s.gapMs,'step gapMs');
   // Empty explanation-only steps still occupy a nonzero seekable interval.
   const effectivePause=Math.max(s.actions.length===0?Math.max(200,pauseMs):pauseMs,0);
   cursor+=effectivePause;
   if(cursor>3600000)throw new RangeError('timeline exceeds one hour');
   blocks.push(Object.freeze({id:s.id,index,startMs,endMs:cursor,actions:Object.freeze(actions),
    title:typeof s.title==='string'?s.title:s.id}));
  }
  return Object.freeze({totalMs:cursor,steps:Object.freeze(blocks),segments:Object.freeze(segments)});
 }
 function frame(timeline,elapsedMs){
  if(!timeline||!Array.isArray(timeline.steps)||!Array.isArray(timeline.segments)||
     !finite(timeline.totalMs)||timeline.totalMs<0)throw new TypeError('not a timeline');
  if(!finite(elapsedMs))throw new TypeError('elapsed time must be finite');
  const ms=clamp(elapsedMs,0,timeline.totalMs);
  const completedIds=[],fractions=Object.create(null);
  let activeActionId=null,activeStepIndex=-1,activeStepId=null;
  for(const a of timeline.segments){
   const fraction=clamp((ms-a.startMs)/a.durationMs,0,1);
   fractions[a.id]=fraction;
   if(fraction>=1)completedIds.push(a.id);
   else if(fraction>0&&activeActionId===null)activeActionId=a.id;
  }
  for(const s of timeline.steps){
   if(ms>=s.startMs&&ms<s.endMs){activeStepIndex=s.index;activeStepId=s.id;break;}
  }
  if(ms===timeline.totalMs&&timeline.steps.length){
   activeStepIndex=timeline.steps.length-1;activeStepId=timeline.steps.at(-1).id;
  }
  return {elapsedMs:ms,totalMs:timeline.totalMs,ratio:timeline.totalMs?ms/timeline.totalMs:1,
    done:ms>=timeline.totalMs,activeActionId,activeStepIndex,activeStepId,
    completedIds,actionFractions:fractions};
 }
 function createPlayer(timeline,{speed=1,revision=0}={}){
  validateSpeed(speed);
  if(!Number.isSafeInteger(revision)||revision<0)throw new TypeError('nonnegative input revision required');
  frame(timeline,0);
  let elapsed=0,lastNow=null,playing=false,invalid=false,currentSpeed=speed,currentRevision=revision;
  function sync(now){
   if(!finite(now))throw new TypeError('monotonic timestamp must be finite');
   if(lastNow!==null){
    if(now<lastNow)throw new RangeError('clock moved backwards');
    if(playing&&!invalid)elapsed=clamp(elapsed+(now-lastNow)*currentSpeed,0,timeline.totalMs);
   }
   lastNow=now;
   if(elapsed>=timeline.totalMs)playing=false;
  }
  function snapshot(now){
   if(now!==undefined)sync(now);
   return {...frame(timeline,elapsed),playing,invalid,speed:currentSpeed,revision:currentRevision};
  }
  return Object.freeze({
   snapshot,
   play(now){sync(now);if(!invalid&&elapsed<timeline.totalMs)playing=true;return snapshot();},
   pause(now){sync(now);playing=false;return snapshot();},
   setSpeed(rate,now){validateSpeed(rate);sync(now);currentSpeed=rate;return snapshot();},
   seekMs(ms,now){if(!finite(ms))throw new TypeError('invalid seek');sync(now);
    if(!invalid)elapsed=clamp(ms,0,timeline.totalMs);
    if(elapsed>=timeline.totalMs)playing=false;return snapshot();},
   seekProgress(ratio,now){if(!finite(ratio))throw new TypeError('invalid seek ratio');
    return this.seekMs(clamp(ratio,0,1)*timeline.totalMs,now);},
   seekStep(index,now){if(!Number.isInteger(index)||index<0||index>timeline.steps.length)
      throw new RangeError('invalid step index');
    return this.seekMs(index===timeline.steps.length?timeline.totalMs:timeline.steps[index].startMs,now);},
   invalidate(nextRevision,now){if(!Number.isSafeInteger(nextRevision)||nextRevision<=currentRevision)
      throw new RangeError('input revision must increase');
    sync(now);playing=false;invalid=true;elapsed=0;currentRevision=nextRevision;return snapshot();},
   reset(nextRevision,now){if(!Number.isSafeInteger(nextRevision)||nextRevision<currentRevision)
      throw new RangeError('cannot reset to older revision');
    sync(now);playing=false;invalid=false;elapsed=0;currentRevision=nextRevision;return snapshot();},
   canRender(revision){return !invalid&&revision===currentRevision;},
   get timeline(){return timeline;}
  });
 }
 return Object.freeze({SPEEDS,DURATIONS,validateSpeed,compileTimeline,frame,createPlayer});
});
