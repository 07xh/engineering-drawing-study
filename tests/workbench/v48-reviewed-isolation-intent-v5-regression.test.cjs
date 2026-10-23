'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {isolateReviewedProblem,verifySolverIsolation}=
 require('../../workbench/reviewed-problem-math-isolation.cjs');
const {verifiedLiveIntentTimeline}=
 require('../../workbench/verified-live-intent-v1.cjs');
const {validateConstructionIntentDAG}=
 require('../../core/contracts/construction-intent.js');
const P=(x,y)=>({x,y});
const seg=(a,b,c,d)=>({a:P(a,b),b:P(c,d)});
const sheet={origin:P(360,220),scale:8};
const reviewed={id:'line-1',role:'known-condition',reviewed:true,
 unitVerified:'mm',geometry:{type:'line',start:[-20,0],end:[20,0]}};
const source=answer=>({sourceRevision:42,entities:[
 reviewed,{id:'answer',role:'reference-answer',geometry:{x:answer}}]});
const fillet={first:seg(-20,0,20,0),second:seg(0,-20,0,20),
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'};
test('reference-answer mutations leave reviewed input and canonical 02 V5 unchanged',()=>{
 const before=isolateReviewedProblem(source(1));
 const after=isolateReviewedProblem(source(9999));
 assert.equal(verifySolverIsolation(before,after).status,'answer-independent');
 const a=verifiedLiveIntentTimeline('segments',fillet,sheet,42);
 const b=verifiedLiveIntentTimeline('segments',structuredClone(fillet),sheet,42);
 assert.equal(a.status,'ready');
 assert.equal(a.canonicalVerified,true);
 assert.equal(validateConstructionIntentDAG(a.constructionIntents).ok,true);
 assert.deepEqual(a.steps,b.steps);
 assert.deepEqual(a.timing,b.timing);
 assert.ok(a.steps.length>0);
});
test('unreviewed input is rejected before any mathematical routing',()=>{
 const bad=isolateReviewedProblem({sourceRevision:42,entities:[{...reviewed,reviewed:false}]});
 assert.equal(bad.status,'not-verified');
 assert.equal(bad.solverInput,undefined);
});
test('source revisions invalidate reviewed input digest and canonical intent revision',()=>{
 const before=isolateReviewedProblem(source(1));
 const after=isolateReviewedProblem({...source(1),sourceRevision:43});
 assert.equal(verifySolverIsolation(before,after).status,'not-verified');
 const timeline=verifiedLiveIntentTimeline('segments',fillet,sheet,43);
 assert.equal(timeline.status,'ready');
 assert.equal(timeline.canonicalVerified,true);
 assert.ok(timeline.constructionIntents.every(i=>i.source?.revision===43||i.source?.revision===undefined));
});
