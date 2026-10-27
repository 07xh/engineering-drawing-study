'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditM0TrustedDepthPartition}=require('../../core/numeric/m0-trusted-depth-partition.cjs');
const h=(id,n,o)=>({id,normal:n,offsetMm:o});
function cube(id,z0,z1){return {id,halfspaces:[
 h('xmin',{x:-1,y:0,z:0},1),h('xmax',{x:1,y:0,z:0},1),
 h('ymin',{x:0,y:-1,z:0},1),h('ymax',{x:0,y:1,z:0},1),
 h('zmin',{x:0,y:0,z:-1},-z0),h('zmax',{x:0,y:0,z:1},z1)],
 vertices:[-1,1].flatMap(x=>[-1,1].flatMap(y=>[z0,z1].map(z=>({x,y,z}))))};}
const source={id:'edge1',from:{x:-2,y:0,z:-2},to:{x:2,y:0,z:-2}};
const observerDirection={x:0,y:0,z:1};
test('trusted depth partition never promotes pairwise order into full scene',()=>{
 const r=auditM0TrustedDepthPartition({source,
  solids:[cube('front',2,3),cube('back',0,1)],observerDirection});
 assert.equal(r.completeSceneVerified,false);
 assert.ok(r.runs.every(x=>x.depthOrderVerified===false));
});
test('missing extreme vertex cannot enter trusted depth comparison',()=>{
 const a=cube('a',2,3),b=cube('b',0,1);a.vertices.pop();
 const r=auditM0TrustedDepthPartition({source,solids:[a,b],observerDirection});
 assert.equal(r.vertices[0].vertexHullVerified,false);
 assert.equal(r.pairs[0].status,'undetermined');
});
test('equal depth overlap remains unverified',()=>{
 const r=auditM0TrustedDepthPartition({source,
  solids:[cube('a',0,1),cube('b',0,1)],observerDirection});
 assert.equal(r.pairs[0].status,'undetermined');
});
