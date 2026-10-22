'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createConfirmedFilletSession:createSession}=
 require('../../workbench/v31-fillet-session.cjs');
const P=(x,y)=>({x,y}),S=(a,b,c,d)=>({a:P(a,b),b:P(c,d)});
function input(){
 return {problem:{kind:'two-segments',unit:'mm',revision:3,filletRadius:3,
  geometry:{first:S(-10,0,10,0),second:S(0,-10,0,10)}},
  selection:{branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'},
  sheet:{origin:P(360,220),scale:5}};
}
function current(s){
 if(!s.ready||s.playback?.revision!==s.revision)return false;
 const i=s.playback.activeStepIndex>=0?s.playback.activeStepIndex:0;
 const active=s.plan.steps[i]||s.plan.steps.at(-1);
 const intent=s.plan.constructionIntentPrototype?.[s.plan.steps.indexOf(active)];
 return !!(intent&&intent.sourceRevision===s.revision&&
  intent.branchId===s.plan.selectedBranchId&&intent.id===active.id&&
  typeof intent.evidenceSource==='string'&&intent.evidenceSource.length>0&&
  JSON.stringify(intent.dependsOn)===JSON.stringify(active.dependsOn)&&
  JSON.stringify(intent.outputEntityIds)===
   JSON.stringify(active.actions.map(a=>a.id)));
}
test('F2 existing verified session exposes step reasons only for matching current intent',()=>{
 const session=createSession(input(),{now:0});
 const snap=session.snapshot(0);
 assert.equal(snap.ready,true);
 assert.equal(current(snap),true);
 assert.equal(current(session.seekStep(2,10)),true);
 assert.equal(current(session.seekProgress(1,20)),true);
});
test('revision/branch/step mismatches cannot be called trace-ready; blocked session reveals none',()=>{
 const session=createSession(input(),{now:0});
 const snap=session.snapshot(0);
 assert.equal(current({...snap,revision:snap.revision+1}),false);
 const forged=structuredClone(snap);
 forged.plan.constructionIntentPrototype[0].branchId='different';
 assert.equal(current(forged),false);
 const noBranch=input();delete noBranch.selection.branchId;
 const blocked=session.replace(noBranch,{expectedRevision:3,now:10});
 assert.equal(blocked.ready,false);
 assert.equal(current(blocked),false);
 assert.deepEqual(blocked.plan.steps,[]);
});
test('live workbench includes optional semantic trace and does not reverse-infer from SVG',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 assert.match(html,/<details id="intentDetails" hidden/);
 assert.match(html,/id="intentTrace"/);
 assert.match(entry,/constructionIntentPrototype\?\.\[intentIndex\]/);
 assert.match(entry,/intent\.sourceRevision===snap\.revision/);
 assert.match(entry,/intent\.branchId===result\.selectedBranchId/);
 assert.match(entry,/intent\.outputEntityIds/);
 assert.match(entry,/\$\('intentDetails'\)\.hidden=!traceReady/);
 assert.match(entry,/\$\('intentTrace'\)\.textContent=traceReady/);
 assert.doesNotMatch(entry,/createFakeIntent|guessConstructionIntent/);
});
