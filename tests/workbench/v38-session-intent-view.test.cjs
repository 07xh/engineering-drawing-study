'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createConfirmedFilletSession}=require('../../workbench/v31-fillet-session.cjs');
const {sessionIntentView}=require('../../workbench/v38-session-intent-view.cjs');
const seg=(x1,y1,x2,y2)=>({a:{x:x1,y:y1},b:{x:x2,y:y2}});
const input=(radius=3,branchId='s++')=>({
 problem:{kind:'two-segments',unit:'mm',revision:5,filletRadius:radius,
  geometry:{first:seg(-10,0,10,0),second:seg(0,-10,0,10)}},
 selection:{branchId,direction:'ccw',firstTravel:'forward',secondTravel:'forward'},
 sheet:{origin:{x:350,y:200},scale:4}
});
test('F2 read-only intents match verified current V5 session and survive seeking',()=>{
 const session=createConfirmedFilletSession(input(),{now:0});
 const first=sessionIntentView(session.snapshot(0));
 assert.equal(first.status,'ready');
 assert.equal(first.revision,5);
 assert.equal(first.selectedBranchId,'s++');
 assert.ok(first.intents.length>0);
 const seek=sessionIntentView(session.seekStep(2,10));
 assert.deepEqual(seek.intents,first.intents);
 assert.equal(seek.revision,5);
});
test('F2 edits invalidate old revision and produce new intent revision',()=>{
 const session=createConfirmedFilletSession(input(),{now:0});
 const old=sessionIntentView(session.snapshot(0));
 const next=sessionIntentView(session.replace(input(4),{expectedRevision:5,now:10}));
 assert.equal(next.status,'ready');
 assert.equal(next.revision,6);
 assert.ok(next.intents.every(x=>x.sourceRevision===6));
 assert.ok(old.intents.every(x=>x.sourceRevision===5));
});
test('F2 branch deselection fails closed; valid branch recovery creates fresh intents',()=>{
 const session=createConfirmedFilletSession(input(),{now:0});
 const invalid=input();delete invalid.selection.branchId;
 const blocked=sessionIntentView(session.replace(invalid,{expectedRevision:5,now:10}));
 assert.equal(blocked.status,'unavailable');
 assert.deepEqual(blocked.intents,[]);
 const restored=sessionIntentView(session.replace(input(),{expectedRevision:6,now:20}));
 assert.equal(restored.status,'ready');
 assert.equal(restored.revision,7);
});
test('F2 stale or contradictory session snapshots cannot expose intents',()=>{
 const session=createConfirmedFilletSession(input(),{now:0});
 const snap=session.snapshot(0);
 assert.equal(sessionIntentView({...snap,playback:{...snap.playback,revision:4}}).status,'unavailable');
 assert.equal(sessionIntentView({...snap,plan:{...snap.plan,revision:4}}).status,'unavailable');
 assert.equal(sessionIntentView({...snap,ready:false}).status,'unavailable');
});
