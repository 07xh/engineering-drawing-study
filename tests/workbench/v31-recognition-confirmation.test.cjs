'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prepareConfirmedFillet,sourceIndex}=
 require('../../recognition/confirmed-fillet-draft.cjs');
const {kinds,defaultValues,defaultChoices}=
 require('../../labs/auto-fillet-form.cjs');
const {createConfirmedFilletSession}=
 require('../../workbench/v31-fillet-session.cjs');
const draft=()=>({schema:'draftai-recognition-candidates/0.1',
 image:{width:1200,height:800},
 annotations:[{id:'shape_1',kind:'geometry',bbox:[50,100,400,300],confidence:.75},
  {id:'dim_1',kind:'dimension',bbox:[460,160,120,35],confidence:.93}]});
const review=(kind)=>({
 kind,unit:'mm',userAccepted:true,revision:4,
 fields:Object.fromEntries(Object.entries(defaultValues(kind)).map(([id,value])=>
  [id,{value,sourceId:id==='filletRadius'?'dim_1':'shape_1',confirmed:true}])),
 selection:defaultChoices(kind)
});

test('all three reviewed shape types feed real 02/G1/V5 without OCR faking answer',()=>{
 for(const kind of Object.keys(kinds)){
  const out=prepareConfirmedFillet(draft(),review(kind));
  assert.equal(out.status,'ready-for-math');
  assert.equal(out.input.problem.unit,'mm');
  assert.equal(out.input.problem.revision,4);
  assert.ok(out.fieldSources.filletRadius.bbox[0]>=0);
  const session=createConfirmedFilletSession(out.input,{now:0});
  const actual=session.snapshot(0);
  assert.equal(actual.status,'ready');
  assert.equal(actual.plan.mathematicallyVerified,true);
  assert.ok(actual.plan.steps.some(step=>step.actions.some(a=>a.kind==='arc')));
 }
});
test('OCR candidate by itself cannot produce an approved mathematical problem',()=>{
 for(const incomplete of [undefined,null,{}, {userAccepted:false}]){
  const output=prepareConfirmedFillet(draft(),incomplete);
  assert.equal(output.status,'needs-confirmation');
  assert.equal(output.input,null);
 }
});
test('field-level confirmation and provenance are required, no invented pixel-to-mm values',()=>{
 const s=review('two-segments');
 delete s.fields.a1x;
 let r=prepareConfirmedFillet(draft(),s);
 assert.equal(r.status,'needs-confirmation');assert.ok(r.missing.includes('a1x'));
 s.fields.a1x={value:10,sourceId:'invented',confirmed:true};
 r=prepareConfirmedFillet(draft(),s);assert.equal(r.status,'needs-confirmation');
 s.fields.a1x={value:10,sourceId:'shape_1',confirmed:false};
 r=prepareConfirmedFillet(draft(),s);assert.equal(r.status,'needs-confirmation');
 s.fields.a1x={value:NaN,sourceId:'shape_1',confirmed:true};
 r=prepareConfirmedFillet(draft(),s);assert.equal(r.status,'needs-confirmation');
 s.fields.a1x={value:-10,sourceId:'shape_1',confirmed:true};
 s.unit='px';
 r=prepareConfirmedFillet(draft(),s);assert.equal(r.status,'needs-confirmation');
});
test('invalid geometry cannot become a verified timeline even if reviewed',()=>{
 const r=review('two-segments');
 r.fields.a1x.value=10;r.fields.a1y.value=0;
 const ready=prepareConfirmedFillet(draft(),r);
 assert.equal(ready.status,'ready-for-math');
 const s=createConfirmedFilletSession(ready.input,{now:0});
 const snap=s.snapshot(0);
 assert.equal(snap.status,'invalid-input');
 assert.deepEqual(snap.plan.steps,[]);
 assert.equal(snap.ready,false);
});
test('malformed source boxes, duplicate IDs and image bounds are rejected',()=>{
 const base=draft();
 assert.equal(sourceIndex(base).size,2);
 for(const bad of [
  {...base,image:{width:30000,height:800}},
  {...base,annotations:base.annotations.concat(base.annotations[0])},
  {...base,annotations:[{...base.annotations[0],confidence:2}]},
  {...base,annotations:[{...base.annotations[0],bbox:[1100,0,300,20]}]},
  {...base,annotations:[]},
  {...base,schema:'untrusted/OCR'}]){
  assert.throws(()=>sourceIndex(bad));
 }
});
test('OCR-supplied fake proof never copies to confirmed model output',()=>{
 const s=review('two-circles');
 s.proof={globallyUnique:true,certified:true};
 const candidate=draft();
 candidate.solveResult={status:'unique',globallyUnique:true,solutions:[{x:0,y:0}]};
 const output=prepareConfirmedFillet(candidate,s);
 assert.equal(output.status,'ready-for-math');
 assert.equal(output.input.problem.kind,'two-circles');
 assert.equal(output.input.proof,undefined);
 assert.equal(output.input.problem.proof,undefined);
 assert.equal(output.input.problem.solveResult,undefined);
});
