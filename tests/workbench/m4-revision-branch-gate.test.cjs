'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {verifiedLiveIntentTimeline:live}=require('../../workbench/verified-live-intent-v1.cjs');
const P=(x,y)=>({x,y});
const segment=(a,b,c,d)=>({a:P(a,b),b:P(c,d)});
const sheet={origin:P(360,220),scale:8};
const source={first:segment(-20,0,20,0),second:segment(0,-20,0,20),
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'};
test('09 M4 revision change produces fresh canonical intent and does not mutate source',()=>{
 const snapshot=JSON.stringify(source);
 const a=live('segments',structuredClone(source),sheet,100);
 const b=live('segments',structuredClone(source),sheet,101);
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.equal(a.canonicalVerified,true);assert.equal(b.canonicalVerified,true);
 assert.equal(a.revision,100);assert.equal(b.revision,101);
 assert.deepEqual(a.steps,b.steps);
 assert.notDeepEqual(a.constructionIntents,b.constructionIntents);
 assert.equal(JSON.stringify(source),snapshot);
});
test('09 M4 edited branch cannot reuse stale verified timeline',()=>{
 const valid=live('segments',structuredClone(source),sheet,102);
 assert.equal(valid.status,'ready');
 const edited={...source,branchId:'not-a-selected-solver-branch'};
 const result=live('segments',edited,sheet,103);
 assert.notEqual(result.status,'ready');
 assert.deepEqual(result.steps,[]);
 assert.notEqual(result.canonicalVerified,true);
});
test('09 M4 missing traversal direction cannot create a verified drawable timeline',()=>{
 const input={...source};delete input.direction;
 const result=live('segments',input,sheet,104);
 assert.notEqual(result.status,'ready');
 assert.deepEqual(result.steps,[]);
 assert.notEqual(result.canonicalVerified,true);
});
