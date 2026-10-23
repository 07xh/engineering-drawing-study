'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {kinds,defaultValues,defaultChoices,buildConfirmedInput:make}=
 require('../../labs/auto-fillet-form.cjs');
const {solveFiniteFillet}=require('../../engines/constraints-2d/finite-fillet-gate.cjs');
const {createConfirmedFilletSession:createSession}=
 require('../../workbench/v31-fillet-session.cjs');
const mock=(kind,revision=0)=>make(kind,defaultValues(kind),defaultChoices(kind),revision);

test('all three public form presets pass actual 02 math -> directed G1 -> V5',()=>{
 const expected={'two-segments':'s++','segment-circle':'candidate-1',
  'two-circles':'center-1'};
 for(const kind of Object.keys(kinds)){
  const m=mock(kind,1),raw=solveFiniteFillet(m.problem);
  assert.ok(raw.candidates.some(c=>c.branchId===expected[kind]));
  const session=createSession(m,{now:0,speed:1});
  const snap=session.snapshot(0);
  assert.equal(snap.status,'ready',kind+' '+snap.reason);
  assert.equal(snap.ready,true);
  assert.equal(snap.plan.mathematicallyVerified,true);
  assert.equal(snap.plan.typedMathEvidence.branchId,expected[kind]);
  assert.ok(snap.plan.steps.some(s=>s.actions.some(a=>a.kind==='arc')));
  assert.ok(snap.plan.timing.totalMs>0);
 }
});
test('changing known radius invalidates old playable timeline and returns new geometry',()=>{
 const first=mock('two-segments',3);
 const session=createSession(first,{now:0});
 const original=session.snapshot(0);
 const v=defaultValues('two-segments');v.filletRadius=4;
 const second=make('two-segments',v,defaultChoices('two-segments'),3);
 const out=session.replace(second,{expectedRevision:3,now:1});
 assert.equal(out.status,'ready');
 assert.equal(out.revision,4);
 assert.equal(session.canRender(3),false);
 assert.equal(out.plan.typedMathEvidence.center.x,-4);
 assert.equal(out.plan.typedMathEvidence.center.y,4);
 assert.equal(original.plan.typedMathEvidence.center.x,-3);
 assert.equal(second.problem.revision,3);
});
test('invalid values, missing branch and forbidden image/pixel fields never leak an old answer',()=>{
 const m=mock('two-circles',1),session=createSession(m,{now:0});
 const broken=defaultValues('two-circles');broken.r1=0;
 const next=make('two-circles',broken,defaultChoices('two-circles'),1);
 const fail=session.replace(next,{expectedRevision:1,now:2});
 assert.equal(fail.status,'invalid-input');
 assert.equal(fail.playback,null);
 assert.deepEqual(fail.plan.steps,[]);
 assert.equal(session.canRender(1),false);
 const ambiguous=make('two-circles',defaultValues('two-circles'),
  {...defaultChoices('two-circles'),branchId:''},2);
 const blocked=session.replace(ambiguous,{expectedRevision:2,now:3});
 assert.equal(blocked.status,'requires-branch');
 assert.deepEqual(blocked.plan.steps,[]);
 assert.throws(()=>make('two-segments',{...defaultValues('two-segments'),a1x:NaN},
  defaultChoices('two-segments')),/finite/);
 assert.throws(()=>make('unknown',{},{}),/unsupported/);
 assert.throws(()=>solveFiniteFillet({...m.problem,unit:'sheet-px'}),/mm/);
});
test('public workbench does not pretend to provide AI upload or private storage',()=>{
 const page=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const builder=fs.readFileSync('scripts/build-static.cjs','utf8');
 const home=fs.readFileSync('index.html','utf8');
 assert.match(page,/图片自动识别尚未开放/);
 assert.match(page,/id="problemPhoto"/);
 assert.match(page,/仅本地参照/);
 assert.match(entry,/attachLocalImagePreview/);
 assert.doesNotMatch(entry,/(fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie)/);
 assert.match(builder,/auto-fillet-live-entry.cjs/);
 assert.match(builder,/auto-fillet-live-bundle.js/);
 assert.match(home,/href="labs\/auto-fillet-live.html"/);
 assert.match(entry,/session\.replace\(current/);
 assert.match(entry,/Motion\.updateSvg/);
 assert.match(entry,/session\.canRender\(snap\.revision\)/);
});
