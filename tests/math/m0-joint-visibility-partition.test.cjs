'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {partitionM0Segment}=require('../../core/numeric/m0-joint-visibility-partition.cjs');
const h=(id,n,o)=>({id,normal:n,offsetMm:o});
function cube(id,a,b){return {id,halfspaces:[
 h('xmin',{x:-1,y:0,z:0},-a),h('xmax',{x:1,y:0,z:0},b),
 h('ymin',{x:0,y:-1,z:0},1),h('ymax',{x:0,y:1,z:0},1),
 h('zmin',{x:0,y:0,z:-1},1),h('zmax',{x:0,y:0,z:1},1)]};}
const source={id:'edge1',from:{x:-3,y:0,z:0},to:{x:3,y:0,z:0}};
const observerDirection={x:0,y:0,z:1};
test('real M0 produces multi-solid hidden open intervals without line-style promotion',()=>{
 const r=partitionM0Segment({source,solids:[cube('a',-1,0),cube('b',.2,1)],observerDirection});
 assert.ok(r.runs.some(x=>x.status==='hidden-within-supplied-solids'));
 assert.equal(r.depthOrderVerified,false);
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
});
test('one solid behind entire source interval does not create fabricated hidden proof',()=>{
 const r=partitionM0Segment({source,solids:[cube('a',5,6)],observerDirection});
 assert.ok(r.runs.every(x=>x.status!=='hidden-within-supplied-solids'));
});
test('overlapping occluders retain both identities, not an invented nearest depth',()=>{
 const r=partitionM0Segment({source,solids:[cube('a',-1,1),cube('b',-.5,.5)],observerDirection});
 assert.ok(r.runs.some(x=>x.occluderIds.length===2));
 assert.ok(r.runs.every(x=>x.depthOrderVerified===false));
});
test('duplicate solid identities rejected',()=>{
 assert.throws(()=>partitionM0Segment({source,solids:[cube('a',-1,0),cube('a',.2,1)],observerDirection}));
});
