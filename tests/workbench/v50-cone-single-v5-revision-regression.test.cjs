'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSingleV5Composition:run}=require('../../workbench/cone-single-v5-composition.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
const opts=revision=>({kind:'clipped-ellipse',sourceConfirmed:true,revision,sheetTransform});
test('V5 revision invalidation blocks stale mathematical evidence',()=>{
 const old=run(cone,plane(1),opts(71));
 assert.equal(old.status,'verified-single-v5-composition');
 assert.equal(old.player.canRender(71),true);
 old.player.play(0);
 const advanced=old.player.snapshot(1000);
 assert.ok(advanced.elapsedMs>0);
 const reset=old.player.seekStep(0,1001);
 assert.equal(reset.activeStepIndex,0);
 old.player.invalidate(72,1002);
 assert.equal(old.player.canRender(71),false);
 assert.equal(old.player.snapshot().invalid,true);
 const fresh=run(cone,plane(1.2),opts(72));
 assert.equal(fresh.status,'verified-single-v5-composition');
 assert.equal(fresh.player.canRender(72),true);
 assert.equal(fresh.player.canRender(71),false);
 assert.notDeepEqual(fresh.steps.map(s=>s.actions.map(a=>a.geometry)),
  old.steps.map(s=>s.actions.map(a=>a.geometry)));
 assert.ok(fresh.curveEvidence.every(e=>e.constructionStepId===null));
 assert.equal(fresh.exactConicV5Ready,false);
});
test('timeline is deterministic for same geometry and revision',()=>{
 const a=run(cone,plane(1),opts(73));
 const b=run(cone,plane(1),opts(73));
 assert.deepEqual(a.steps,b.steps);
 assert.deepEqual(a.timing,b.timing);
});
test('rejected new input cannot silently reuse prior timeline',()=>{
 const r=run(cone,plane(1),{...opts(74),sourceConfirmed:false});
 assert.equal(r.status,'not-verified');
 assert.equal(r.timing,null);
 assert.equal(r.player,null);
});
