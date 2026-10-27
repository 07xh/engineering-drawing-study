'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditM0PartitionBoundaries}=require('../../core/numeric/m0-analytic-boundary-ray-audit.cjs');
const h=(id,n,o)=>({id,normal:n,offsetMm:o});
function cube(id,a,b){return {id,halfspaces:[
 h('xmin',{x:-1,y:0,z:0},-a),h('xmax',{x:1,y:0,z:0},b),
 h('ymin',{x:0,y:-1,z:0},1),h('ymax',{x:0,y:1,z:0},1),
 h('zmin',{x:0,y:0,z:-1},1),h('zmax',{x:0,y:0,z:1},1)]};}
const source={id:'edge1',from:{x:-3,y:0,z:0},to:{x:3,y:0,z:0}};
const observerDirection={x:0,y:0,z:1};
test('analytic partition boundaries get real ray-depth evidence without V5 promotion',()=>{
 const r=auditM0PartitionBoundaries({source,solids:[cube('a',-1,0),cube('b',.2,1)],observerDirection});
 assert.ok(r.boundaries.length>=2);
 assert.ok(r.boundaries.every(x=>x.officialLineStyleVerified===false));
 assert.equal(r.continuousJoinVerified,false);
});
test('coincident depth ties cannot become certified nearest object',()=>{
 const r=auditM0PartitionBoundaries({source,solids:[cube('a',-1,1),cube('b',-1,1)],observerDirection});
 assert.ok(r.boundaries.every(x=>!x.pointRayCertified||x.rayStatus!=='undetermined'));
 assert.equal(r.completeSceneVerified,false);
});
test('ray classification is not a proof of complete scene',()=>{
 const r=auditM0PartitionBoundaries({source,solids:[cube('a',5,6)],observerDirection});
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.v5VerifiedExportReady,false);
});
