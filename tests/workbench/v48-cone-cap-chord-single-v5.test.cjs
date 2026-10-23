'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneCapChordSingleV5:run}=require('../../workbench/cone-cap-chord-single-v5.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
test('clipped cone cap chord uses existing single V5 and preserves sheet pixels',()=>{
 const r=run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:true,revision:50,sheetTransform});
 assert.equal(r.status,'cap-chord-v5-preview');
 assert.equal(r.steps.length,3);
 assert.ok(r.timing.totalMs>0);
 assert.equal(r.player.snapshot().revision,50);
 assert.ok(r.steps.every(s=>s.actions.every(a=>a.sourceVisibility==='undetermined')));
 assert.equal(r.analyticCurveV5Ready,false);
 assert.equal(r.completeContourV5Ready,false);
});
test('full ellipse has no invented cap chord actions',()=>{
 const r=run(cone,plane(6),{kind:'full-ellipse',sourceConfirmed:true,revision:51,sheetTransform});
 assert.equal(r.status,'cap-chord-v5-preview');
 assert.equal(r.steps.length,0);
 assert.ok(r.curveEvidence.length>=3);
});
test('unconfirmed source cannot start player',()=>{
 const r=run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:false,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.equal(r.player,null);
});
