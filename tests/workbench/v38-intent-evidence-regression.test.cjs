'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {confirmedFilletTimeline} = require('../../workbench/v31-confirmed-fillet-v5.cjs');
const P = (x,y) => ({x,y});
const seg = (x1,y1,x2,y2) => ({a:P(x1,y1),b:P(x2,y2)});
const fixtures = [
 {kind:'two-segments',geometry:{first:seg(-10,0,10,0),second:seg(0,-10,0,10)},
  filletRadius:3,selection:{branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'}},
 {kind:'two-circles',geometry:{first:{center:P(0,0),radius:5},second:{center:P(20,0),radius:5}},
  filletRadius:10,options:{firstMode:'external',secondMode:'external'},
  selection:{branchId:'center-1',direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'}},
 {kind:'segment-circle',geometry:{segment:seg(-15,0,15,0),circle:{center:P(0,5),radius:8}},
  filletRadius:3,options:{side:1},
  selection:{branchId:'candidate-1',direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'}}
];
const make = (f, revision, scale) => ({
 problem:{kind:f.kind,unit:'mm',revision,filletRadius:f.filletRadius,
  geometry:structuredClone(f.geometry),...(f.options?{options:structuredClone(f.options)}:{})},
 selection:structuredClone(f.selection),sheet:{origin:P(350,220),scale}
});
for (const fixture of fixtures) {
 test('09 evidence provenance and branch remain tied to real solver: '+fixture.kind,()=>{
  const result=confirmedFilletTimeline(make(fixture,17,5));
  assert.equal(result.status,'ready');
  assert.equal(result.mathematicallyVerified,true);
  assert.equal(result.typedMathEvidence.g1Verified,true);
  assert.equal(result.constructionIntentPrototype.length,result.steps.length);
  for(const [index,intent] of result.constructionIntentPrototype.entries()){
   assert.equal(intent.sourceRevision,17);
   assert.equal(intent.branchId,result.selectedBranchId);
   assert.ok(typeof intent.sourceSolver==='string'&&intent.sourceSolver.length>0);
   assert.ok(typeof intent.evidenceSource==='string'&&intent.evidenceSource.length>0);
   assert.deepEqual(intent.outputEntityIds,result.steps[index].actions.map(a=>a.id));
  }
 });
 test('09 paper-scale invariance and revision invalidation: '+fixture.kind,()=>{
  const a=confirmedFilletTimeline(make(fixture,17,2));
  const b=confirmedFilletTimeline(make(fixture,17,200));
  assert.equal(a.status,'ready');
  assert.equal(b.status,'ready');
  assert.deepEqual(a.typedMathEvidence,b.typedMathEvidence);
  assert.deepEqual(a.constructionIntentPrototype,b.constructionIntentPrototype);
  const next=confirmedFilletTimeline(make(fixture,18,2));
  assert.equal(next.status,'ready');
  assert.ok(next.constructionIntentPrototype.every(x=>x.sourceRevision===18));
  assert.ok(a.constructionIntentPrototype.every(x=>x.sourceRevision===17));
  const unselected=make(fixture,19,2);
  delete unselected.selection.branchId;
  const blocked=confirmedFilletTimeline(unselected);
  assert.notEqual(blocked.status,'ready');
  assert.deepEqual(blocked.steps,[]);
  assert.equal(blocked.constructionIntentPrototype,undefined);
 });
}
