'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {compileConfirmedTwoPoint}=require('../../workbench/confirmed-two-point-v5.cjs');
const sheetTransform={origin:{x:360,y:210},scale:3};
const input=()=>({confirmedBy:'user',revision:1,unit:'mm',sheetTransform,points:[
{id:'A',x:15,y:27,z:30},{id:'B',x:30,y:0,z:23}]});
test('two point workbook: canonical steps compile and play with seek/speed',()=>{
 const compiled=compileConfirmedTwoPoint(input());
 assert.equal(compiled.canonicalVerified,true);
 assert.ok(compiled.timeline.segments.length>0);
 assert.equal(compiled.player.canRender(1),true);
 const before=compiled.player.snapshot();
 compiled.player.setSpeed(2,0);
 compiled.player.play(0);
 const middle=compiled.player.snapshot(100);
 assert.ok(middle.elapsedMs>before.elapsedMs);
 compiled.player.pause(100);
 compiled.player.seekStep(0,100);
 assert.equal(compiled.player.snapshot().elapsedMs,0);
 compiled.player.invalidate(2,100);
 assert.equal(compiled.player.canRender(1),false);
});
test('unconfirmed, missing and invalid givens fail closed',()=>{
 const d=input();delete d.confirmedBy;assert.throws(()=>compileConfirmedTwoPoint(d));
 const missing=input();delete missing.points[1].z;assert.throws(()=>compileConfirmedTwoPoint(missing));
 const duplicate=input();duplicate.points[1].id='A';assert.throws(()=>compileConfirmedTwoPoint(duplicate));
 const units=input();units.unit='cm';assert.throws(()=>compileConfirmedTwoPoint(units));
});
