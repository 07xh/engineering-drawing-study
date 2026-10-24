'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyGlobalDepthOrder}=require('../../core/numeric/m0-global-depth-separation.cjs');
const box=(id,z0,z1)=>({id,vertices:[
 ...[z0,z1].flatMap(z=>[-1,1].flatMap(x=>[-1,1].map(y=>({x,y,z}))))]});
const d={x:0,y:0,z:1};
test('strictly separated global slabs certify ordering only',()=>{
 const r=certifyGlobalDepthOrder({front:box('front',3,4),back:box('back',0,1),observerDirection:d});
 assert.equal(r.strictDepthOrderVerified,true);
 assert.equal(r.vertexHullVerified,false);
 assert.equal(r.completeSceneVerified,false);
});
test('overlapping slabs remain unknown despite sampleable nearest depth',()=>{
 const r=certifyGlobalDepthOrder({front:box('front',.5,2),back:box('back',0,1),observerDirection:d});
 assert.equal(r.status,'undetermined');
});
test('equal-depth tie cannot be certified',()=>{
 const r=certifyGlobalDepthOrder({front:box('front',0,1),back:box('back',0,1),observerDirection:d});
 assert.equal(r.strictDepthOrderVerified,false);
});
test('touching slabs cannot be certified as strict ordering',()=>{
 const r=certifyGlobalDepthOrder({front:box('front',1,2),back:box('back',0,1),observerDirection:d});
 assert.equal(r.strictDepthOrderVerified,false);
});
