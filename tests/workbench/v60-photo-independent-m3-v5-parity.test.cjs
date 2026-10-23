'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditPhotoFilletMathAndV5:audit,
 independentSegmentCircleResidual:independent}=
 require('../../benchmark/photo-fillet-independent-parity.cjs');
const {solveFiniteFillet}=require('../../engines/constraints-2d/finite-fillet-gate.cjs');
const {confirmedFilletTimeline}=require('../../workbench/v31-confirmed-fillet-v5.cjs');
const sheet={origin:{x:350,y:220},scale:5};
const P=(x,y)=>({x,y});
const base=()=>({kind:'segment-circle',unit:'mm',revision:7,
 geometry:{segment:{a:P(-15,0),b:P(15,0)},
  circle:{center:P(0,5),radius:8}},filletRadius:3,
 options:{side:1}});
const selection=()=>({branchId:'candidate-1',direction:'ccw',
 lineTravel:'forward',knownCircleTravel:'cw'});
test('09 actual existing M3 finite candidate independently satisfies signed side, source circle and BOTH contact distances',()=>{
 const p=base(),result=solveFiniteFillet(p);
 assert.equal(result.status,'multiple');
 const c=result.candidates.find(x=>x.branchId==='candidate-1');
 assert.ok(c);
 const proof=independent(p,c);
 assert.equal(proof.independentPass,true);
 assert.ok(proof.maxResidualMm<=proof.toleranceMm);
 for(const residual of Object.values(proof.residuals))
  assert.ok(Number.isFinite(residual)&&residual<proof.toleranceMm);
});
test('09 reviewed model-mm fixture exercises real 02 M3 → real ConstructionIntent DAG → ONE V5 final arc with independent residuals',()=>{
 const result=audit({problem:base(),selection:selection(),sheet,sourceClass:'synthetic-fixture'});
 assert.equal(result.status,'fixture-only-parity-verified');
 assert.equal(result.independentMathVerified,true);
 assert.equal(result.constructionStepParityVerified,true);
 assert.equal(result.v5FrameVerified,true);
 assert.equal(result.constructionStepCount,result.semanticIntentCount);
 assert.ok(result.constructionStepCount>=5);
 assert.ok(result.singleV5TotalMs>0);
 assert.equal(result.answerReferenceUsedForSolve,false);
 assert.equal(result.sourcePhotoIndependentlyVerified,false);
 assert.equal(result.independentBlindTestPassed,false);
 assert.equal(result.globallyUnique,null);
});
test('09 answer-marked/reference-only photographs remain EXCLUDED even when math and V5 happen to match',()=>{
 const query={problem:base(),selection:selection(),sheet};
 const a=audit({...query,sourceClass:'answer-marked-reference',
  answerReference:{center:P(1,2),label:'red printed answer'}});
 const b=audit({...query,sourceClass:'answer-marked-reference',
  answerReference:{center:P(999,888),label:'answer deliberately mutated'}});
 assert.equal(a.status,'answer-reference-excluded');
 assert.equal(b.status,'answer-reference-excluded');
 assert.equal(a.independentMathVerified,true);
 assert.equal(a.constructionStepParityVerified,true);
 assert.equal(a.v5FrameVerified,true);
 assert.equal(a.independentBlindTestPassed,false);
 assert.equal(b.independentBlindTestPassed,false);
 assert.deepEqual(a.independentOracle,b.independentOracle,
  'changing answer never changes independent math or model residuals');
 assert.equal(a.selectedBranchId,b.selectedBranchId);
});
test('09 even client-labeled no-answer image cannot be self-certified as independent textbook blind pass',()=>{
 for(const sourceClass of ['unknown','original-question-unverified',
  'original-no-answer-independently-reviewed']){
  const q=audit({problem:base(),selection:selection(),sheet,sourceClass});
  assert.equal(q.independentMathVerified,true);
  assert.equal(q.constructionStepParityVerified,true);
  assert.equal(q.independentBlindTestPassed,false);
  assert.equal(q.sourcePhotoIndependentlyVerified,false);
 }
});
test('09 missing branch, wrong branch, missing G1 travel and wrong intended direction do not create V5 evidence',()=>{
 for(const choice of [
  {},{direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'},
  {...selection(),branchId:'not-in-candidates'},
  {...selection(),lineTravel:undefined},
  {...selection(),direction:undefined},
  {...selection(),direction:'cw'}
 ]){
  const q=audit({problem:base(),selection:choice,sheet,
   sourceClass:'synthetic-fixture'});
  assert.equal(q.independentBlindTestPassed,false);
  assert.equal(q.v5FrameVerified,false,String(choice.branchId));
  assert.notEqual(q.status,'fixture-only-parity-verified');
 }
});
test('09 oracle catches mutated center, wrong line contact, bad circle contact and external tangency evidence',()=>{
 const p=base(),real=solveFiniteFillet(p).candidates[0];
 for(const poisoned of [
  {...real,center:{...real.center,x:real.center.x+3}},
  {...real,contacts:{...real.contacts,first:{...real.contacts.first,x:real.contacts.first.x+1}}},
  {...real,contacts:{...real.contacts,second:{...real.contacts.second,y:real.contacts.second.y+1}}},
 ]){
  const q=independent(p,poisoned);
  assert.equal(q.independentPass,false);
  assert.ok(q.maxResidualMm>q.toleranceMm);
 }
});
test('09 changed model mm or signed side cannot reuse a stale selected mathematical branch or old V5',()=>{
 const reference=audit({problem:base(),selection:selection(),sheet,
  sourceClass:'synthetic-fixture'});
 const changedRadius=audit({problem:{...base(),filletRadius:9},
  selection:selection(),sheet,sourceClass:'synthetic-fixture'});
 assert.notDeepEqual(changedRadius.independentOracle,reference.independentOracle);
 const wrongSide=audit({problem:{...base(),options:{side:-1}},
  selection:selection(),sheet,sourceClass:'synthetic-fixture'});
 assert.equal(wrongSide.independentBlindTestPassed,false);
 assert.notDeepEqual(wrongSide.independentOracle,reference.independentOracle);
});
test('09 existing V5 has parity and source-intent DAG proof but cannot self-assert photo input/answer isolation',()=>{
 const timeline=confirmedFilletTimeline({problem:base(),selection:selection(),sheet});
 assert.equal(timeline.status,'ready');
 assert.equal(timeline.typedMathEvidence.g1Verified,true);
 assert.equal(timeline.typedMathEvidence.globallyUnique,null);
 const q=audit({problem:base(),selection:selection(),sheet,
  sourceClass:'synthetic-fixture'});
 assert.equal(q.constructionStepCount,timeline.steps.length);
 assert.equal(q.semanticIntentCount,timeline.constructionIntentPrototype.length);
 assert.equal(q.independentBlindTestPassed,false);
 assert.deepEqual(q.independentOracle.residuals,
  independent(base(),solveFiniteFillet(base()).candidates.find(
   c=>c.branchId===selection().branchId)).residuals);
});
test('09 corrupted screen projection, unsupported source classes and malformed model input fail closed',()=>{
 for(const sheetValue of [{origin:{x:0,y:0},scale:0},null]){
  const q=audit({problem:base(),selection:selection(),sheet:sheetValue});
  assert.equal(q.v5FrameVerified,false);
 }
 for(const sourceClass of ['certified-by-ai','blind-test-passed',null]){
  const q=audit({problem:base(),selection:selection(),sheet,sourceClass});
  assert.equal(q.status,'source-role-invalid');
  assert.equal(q.independentBlindTestPassed,false);
 }
 for(const problem of [{...base(),unit:'px'},{
  ...base(),filletRadius:NaN
 }]){
  const q=audit({problem,selection:selection(),sheet});
  assert.equal(q.status,'invalid-m3-input');
 }
});
test('09 evaluator is not an answer-dependent solver, OCR bridge or V5 player fork',()=>{
 const source=require('node:fs').readFileSync(
  'benchmark/photo-fillet-independent-parity.cjs','utf8');
 for(const text of ['solveFiniteFillet','confirmedFilletTimeline',
  'assertVerifiedArcParity','Timeline.frame','independentSegmentCircleResidual'])
  assert.ok(source.includes(text));
 assert.doesNotMatch(source,/new TextDetector|compileTimeline|createPlayer|fetch\(|XMLHttpRequest|localStorage/);
});
