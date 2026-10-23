'use strict';
/**
 * 09 / M4: reject malformed or stale point evidence before publishing V5.
 * Supplements #411; does not alter the proven solver or the single player.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {verifiedLiveIntentTimeline:live}=
 require('../../workbench/verified-live-intent-v1.cjs');
const sheet={origin:{x:360,y:175},scale:4};
const good={knownPoint:{x:15,y:27,z:30},sheetTransform:sheet};
function notDrawable(run){
 try{
  const result=run();
  assert.notEqual(result.status,'ready');
  assert.notEqual(result.canonicalVerified,true);
  assert.deepEqual(result.steps,[]);
 }catch(error){
  assert.ok(error instanceof TypeError||error instanceof RangeError,
   'rejection must be explicit, not a rendering error');
 }
}
test('09 M4 point source edit regenerates verified geometry without mutating source',()=>{
 const before=JSON.stringify(good);
 const a=live('point-projection',structuredClone(good),null,200);
 const edited=structuredClone(good);
 edited.knownPoint.z+=5;
 const b=live('point-projection',edited,null,201);
 assert.equal(a.status,'ready');
 assert.equal(b.status,'ready');
 assert.equal(a.canonicalVerified,true);
 assert.equal(b.canonicalVerified,true);
 assert.notDeepEqual(a.steps,b.steps);
 assert.notDeepEqual(a.constructionIntents,b.constructionIntents);
 assert.equal(JSON.stringify(good),before);
});
test('09 M4 nonfinite or missing spatial coordinate cannot publish V5',()=>{
 for(const z of [NaN,Infinity,-Infinity,undefined]){
  const input=structuredClone(good);
  input.knownPoint.z=z;
  notDrawable(()=>live('point-projection',input,null,202));
 }
});
test('09 M4 invalid revision cannot be treated as fresh verified proof',()=>{
 for(const revision of [-1,NaN,1.5]){
  notDrawable(()=>live('point-projection',structuredClone(good),null,revision));
 }
});
