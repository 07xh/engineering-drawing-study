'use strict';
/** #377 F1 / #372: proof-backed timeline revision and branch invalidation.
 * Independent tests against the existing verified specialist and V5 player.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const Bridge=require('../../workbench/verified-plan-v5-bridge.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const sheet={origin:{x:360,y:220},scale:8};
const input=()=>({
 first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'
});
test('F1 old verified timeline cannot be played after source revision changes',()=>{
 const old=Bridge.filletTimeline('segments',input(),sheet,7);
 assert.equal(old.status,'ready');
 const player=Timeline.createPlayer(old.timing,{revision:old.revision,speed:1});
 assert.equal(player.canRender(7),true);
 player.play(0);
 assert.ok(player.snapshot(200).elapsedMs>0);
 player.invalidate(8,250);
 assert.equal(player.canRender(7),false);
 assert.equal(player.canRender(8),false);
 const changed=input();changed.filletRadius=11;
 const next=Bridge.filletTimeline('segments',changed,sheet,8);
 assert.equal(next.status,'ready');
 assert.equal(next.revision,8);
 assert.equal(player.canRender(next.revision),false,
  'new proof does not revive the invalidated old player');
});
test('F1 a newly unselected branch blocks previously drawable proof',()=>{
 const valid=Bridge.filletTimeline('segments',input(),sheet,1);
 assert.equal(valid.status,'ready');
 const changed=input();delete changed.branchId;
 const blocked=Bridge.filletTimeline('segments',changed,sheet,2);
 assert.equal(blocked.status,'not-verified');
 assert.equal(blocked.mathematicallyVerified,false);
 assert.deepEqual(blocked.steps,[]);
 assert.equal(blocked.timing,undefined);
});
test('F1 source input is not mutated by recomputation or animation compilation',()=>{
 const original=input(),before=JSON.stringify(original);
 const a=Bridge.filletTimeline('segments',original,sheet,4);
 const b=Bridge.filletTimeline('segments',original,sheet,4);
 assert.equal(JSON.stringify(original),before);
 assert.deepEqual(a,b);
});
