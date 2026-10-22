'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {adaptSectionResult}=require('../../engines/spatial/sections/section-result-adapter.cjs');
const p=(x,y,z)=>({x,y,z});
const good={
 status:'unique',verified:true,perimeterVerified:true,modelUnit:'mm',
 vertices:[{id:'a',point:p(0,0,0)},{id:'b',point:p(1,0,0)},{id:'c',point:p(0,1,0)}],
 perimeter:[{id:'ab',from:p(0,0,0),to:p(1,0,0)},
 {id:'bc',from:p(1,0,0),to:p(0,1,0)},
 {id:'ca',from:p(0,1,0),to:p(0,0,0)}]
};
test('accepts independently verified section geometry but never asserts V5 or visibility',()=>{
 const result=adaptSectionResult('rectangular-prism',good);
 assert.equal(result.status,'unique');
 assert.equal(result.verified,true);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.constructionStepsReady,false);
 assert.equal(result.globallyUnique,null);
});
test('fails closed on nonfinite vertices and strips unsafe geometry',()=>{
 const result=adaptSectionResult('rectangular-prism',{...good,
 vertices:[...good.vertices.slice(0,2),{id:'c',point:p(Infinity,1,0)}]});
 assert.equal(result.status,'undetermined');
 assert.equal(result.verified,false);
 assert.deepEqual(result.vertices,[]);
});
test('never upgrades unsupported or unverified solver result',()=>{
 for(const raw of [{...good,status:'unsupported'},{...good,verified:false}]){
  assert.equal(adaptSectionResult('cylinder',raw).verified,false);
 }
});
test('rejects invalid input and solid type',()=>{
 assert.throws(()=>adaptSectionResult('../bad',good),TypeError);
 assert.throws(()=>adaptSectionResult('prism',null),TypeError);
});
