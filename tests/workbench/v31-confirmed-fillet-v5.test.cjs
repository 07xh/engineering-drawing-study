'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {confirmedFilletTimeline:run}=
 require('../../workbench/v31-confirmed-fillet-v5.cjs');
const {frame}=require('../../workbench/teaching-timeline-v5.js');
const point=(x,y)=>({x,y});
const segment=(x1,y1,x2,y2)=>({a:point(x1,y1),b:point(x2,y2)});
const circle=(x,y,radius)=>({center:point(x,y),radius});
const sheet={origin:point(350,220),scale:5};
const twoSegments=()=>({problem:{
 kind:'two-segments',unit:'mm',revision:4,filletRadius:3,
 geometry:{first:segment(-10,0,10,0),second:segment(0,-10,0,10)}
},selection:{branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'},sheet});
const segCircle=()=>({problem:{
 kind:'segment-circle',unit:'mm',revision:7,filletRadius:3,
 geometry:{segment:segment(-15,0,15,0),circle:circle(0,5,8)},
 options:{side:1}
},selection:{branchId:'candidate-1',direction:'ccw',
 lineTravel:'forward',knownCircleTravel:'cw'},sheet});
const twoCircles=()=>({problem:{
 kind:'two-circles',unit:'mm',revision:8,filletRadius:10,
 geometry:{first:circle(0,0,5),second:circle(20,0,5)},
 options:{firstMode:'external',secondMode:'external'}
},selection:{branchId:'center-1',direction:'cw',
 knownFirstTravel:'ccw',knownSecondTravel:'ccw'},sheet});

test('confirmed finite segments -> real G1 solver -> real V5 timeline, without fixed SVG',()=>{
 const p=run(twoSegments());
 assert.equal(p.status,'ready');assert.equal(p.mathematicallyVerified,true);
 assert.equal(p.selectedBranchId,'s++');assert.equal(p.revision,4);
 assert.equal(p.typedMathEvidence.g1Verified,true);
 assert.equal(p.typedMathEvidence.finishedArcVerified,true);
 assert.equal(p.typedMathEvidence.globallyUnique,null);
 assert.equal(p.steps.length,6);
 assert.equal(p.steps.at(-1).actions[0].kind,'arc');
 assert.equal(frame(p.timing,p.timing.totalMs).done,true);
 assert.ok(p.typedMathEvidence.maxResidualMm<1e-7);
 assert.deepEqual(p.typedMathEvidence.center,point(-3,3));
});
test('finite line-to-circle uses selected contact evidence and not pixel guesses',()=>{
 const p=run(segCircle());
 assert.equal(p.status,'ready');assert.equal(p.selectedBranchId,'candidate-1');
 assert.equal(p.steps.length,5);assert.ok(p.timing.totalMs>0);
 assert.equal(p.typedMathEvidence.unit,'mm');
 assert.equal(p.originalLesson.result.g1Verified,true);
 assert.equal(p.originalLesson.result.sourceArcRangeVerified,true);
 assert.ok(p.typedMathEvidence.maxResidualMm<=1e-7);
});
test('two known circles preserve two solutions and select only explicit G1 branch',()=>{
 const p=run(twoCircles());
 assert.equal(p.status,'ready');assert.equal(p.selectedBranchId,'center-1');
 assert.equal(p.typedMathEvidence.branchCount,2);
 assert.equal(p.typedMathEvidence.solverStatus,'multiple');
 assert.equal(p.typedMathEvidence.globallyUnique,null);
 assert.equal(p.steps.length,4);
 assert.equal(p.steps.at(-1).actions[0].kind,'arc');
});
test('missing branch, direction or source travel cannot emit a verified animation',()=>{
 const base=twoSegments(),noBranch=structuredClone(base);
 delete noBranch.selection.branchId;
 const a=run(noBranch);assert.equal(a.status,'requires-branch');
 assert.deepEqual(a.steps,[]);assert.equal(a.mathematicallyVerified,false);
 const b=structuredClone(base);delete b.selection.direction;
 assert.equal(run(b).status,'requires-direction');
 const c=structuredClone(base);delete c.selection.secondTravel;
 assert.equal(run(c).status,'requires-travel');
 for(const rejected of [a,run(b),run(c)]){
  assert.equal(rejected.timing,null);assert.equal(rejected.steps.length,0);
 }
});
test('G1 direction mismatch blocks math-to-animation, never returns a fake SVG',()=>{
 const b=twoSegments();b.selection.firstTravel='reverse';
 const r=run(b);assert.equal(r.status,'blocked');
 assert.equal(r.mathematicallyVerified,false);
 assert.deepEqual(r.steps,[]);assert.equal(r.timing,null);
 const c=twoCircles();c.selection.knownSecondTravel='cw';
 assert.equal(run(c).status,'blocked');
 const d=segCircle();d.selection.direction='cw';
 assert.equal(run(d).status,'blocked');
});
test('nonexistent branch and invalid source travels are hard errors',()=>{
 const b=twoCircles();b.selection.branchId='fictional-center';
 assert.throws(()=>run(b),/branch/);
 const c=segCircle();c.selection.knownCircleTravel='forward';
 assert.throws(()=>run(c),/knownCircleTravel/);
 const d=twoSegments();d.selection.direction='reverse';
 assert.throws(()=>run(d),/direction/);
 const e=twoSegments();e.selection.hiddenProof=true;
 assert.throws(()=>run(e),/unsupported choice/);
});
test('invalid mm/geometry, malformed selection and pixel annotation fail closed',()=>{
 const b=twoSegments();b.problem.unit='sheet-px';
 assert.throws(()=>run(b),/mm/);
 const c=twoSegments();c.problem.geometry.first=segment(0,0,0,0);
 assert.throws(()=>run(c),/degenerate/);
 const d=twoSegments();d.problem.geometry.first.fakeContact=point(5,3);
 assert.throws(()=>run(d),/unsupported field/);
 assert.throws(()=>run({...twoSegments(),selection:null}),/selection/);
});
test('no geometric answer returns blocked without steps or candidate disclosure as an answer',()=>{
 const b=twoCircles();b.problem.geometry.second=circle(100,0,5);
 const r=run(b);
 assert.equal(r.status,'blocked');
 assert.equal(r.mathematicallyVerified,false);assert.deepEqual(r.steps,[]);
 assert.equal(r.timing,null);
});
test('changing radius+revision recomputes fresh mathematical arc and new timebase',()=>{
 const a=twoSegments(),first=run(a);
 const b=twoSegments();b.problem.filletRadius=4;b.problem.revision=5;
 const changed=run(b);
 assert.equal(changed.status,'ready');assert.equal(changed.revision,5);
 assert.deepEqual(changed.typedMathEvidence.center,point(-4,4));
 assert.notDeepEqual(changed.typedMathEvidence.center,first.typedMathEvidence.center);
 assert.equal(changed.steps.at(-1).actions[0].geometry.radius,20);
 assert.equal(first.steps.at(-1).actions[0].geometry.radius,15);
 assert.equal(first.revision,4);
});
test('sheet changes do not change verified model geometry or mutate input',()=>{
 const b=twoCircles(),snapshot=structuredClone(b);
 const p=run(b),q=run({...b,sheet:{origin:point(100,100),scale:10}});
 assert.deepEqual(b,snapshot);
 assert.deepEqual(p.typedMathEvidence,q.typedMathEvidence);
 assert.equal(q.steps.at(-1).actions[0].geometry.radius,
  2*p.steps.at(-1).actions[0].geometry.radius);
});
