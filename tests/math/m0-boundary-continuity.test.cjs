'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditM0BoundaryContinuity}=require('../../core/numeric/m0-boundary-continuity.cjs');
const h=(id,n,o)=>({id,normal:n,offsetMm:o});
function cube(id,a,b,z0=-1,z1=1){return {id,halfspaces:[
 h('xmin',{x:-1,y:0,z:0},-a),h('xmax',{x:1,y:0,z:0},b),
 h('ymin',{x:0,y:-1,z:0},1),h('ymax',{x:0,y:1,z:0},1),
 h('zmin',{x:0,y:0,z:-1},-z0),h('zmax',{x:0,y:0,z:1},z1)]};}
const source={id:'edge1',from:{x:-3,y:0,z:0},to:{x:3,y:0,z:0}};
const observerDirection={x:0,y:0,z:1};
test('boundary transitions cannot certify visibility continuity',()=>{
 const r=auditM0BoundaryContinuity({source,solids:[cube('a',-1,0)],observerDirection});
 assert.ok(r.joins.some(x=>!x.localVisibilityContinuous));
 assert.equal(r.officialLineStyleVerified,false);
});
test('two solids at same forward depth never certify nearest depth continuity',()=>{
 const r=auditM0BoundaryContinuity({source,
  solids:[cube('a',-1,1),cube('b',-1,1)],observerDirection});
 assert.equal(r.nearestDepthContinuousVerified,false);
 assert.equal(r.completeSceneVerified,false);
});
test('overlapping solids with distinct depths do not silently prove whole-scene order',()=>{
 const r=auditM0BoundaryContinuity({source,
  solids:[cube('front',-1,1,0.2,1),cube('back',-1,1,0.5,2)],
  observerDirection});
 assert.equal(r.nearestDepthContinuousVerified,false);
 assert.ok(r.joins.every(x=>x.officialLineStyleVerified===false));
});
test('clear ray from omitted solid is never promoted to complete scene',()=>{
 const r=auditM0BoundaryContinuity({source,
  solids:[cube('far',5,6)],observerDirection});
 assert.equal(r.completeSceneVerified,false);
});
