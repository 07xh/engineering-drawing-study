'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {proveProjectedJoin}=require('../../core/numeric/projected-join-proof.cjs');
const edge=(edgeId,overrides={})=>({edgeId,vertexId:'vertex1',view:'V',
 projectedEndpoint:{u:2,v:3},openVisibility:'visible',openIntervalCertified:true,...overrides});
const vertex=(overrides={})=>({id:'vertex1',view:'V',projectedPoint:{u:2,v:3},
 visibility:'visible',pointRayCertified:true,...overrides});
const run=(a=edge('edgeA'),b=edge('edgeB'),v=vertex())=>
 proveProjectedJoin({left:a,right:b,vertex:v,view:'V'});
test('same proven 3D vertex with two matching projected endpoints',()=>{
 const r=run();assert.equal(r.status,'local-join-certified');
 assert.equal(r.visibility,'visible');assert.equal(r.officialLineStyleVerified,false);
 assert.equal(Object.isFrozen(r),true);
});
test('two distinct 3D vertices that happen to project to same point are not joined',()=>{
 const r=run(edge('edgeA'),edge('edgeB',{vertexId:'vertex2'}));
 assert.equal(r.status,'undetermined');assert.ok(r.reasons.includes('distinct-source-vertices'));
});
test('unverified vertex point ray cannot certify join',()=>{
 assert.equal(run(edge('edgeA'),edge('edgeB'),vertex({pointRayCertified:false})).status,'undetermined');
});
test('open edge visibility transition at join remains undetermined',()=>{
 const r=run(edge('edgeA'),edge('edgeB',{openVisibility:'hidden'}));
 assert.ok(r.reasons.includes('visibility-transition-at-join'));
});
test('projected endpoint disagreement rejects join',()=>{
 assert.equal(run(edge('edgeA',{projectedEndpoint:{u:2.1,v:3}})).status,'undetermined');
});
test('two aliases of one edge are not independent contour neighbors',()=>{
 assert.equal(run(edge('edgeA'),edge('edgeA')).status,'undetermined');
});
test('hidden join can be locally certified but never becomes official line style',()=>{
 const r=run(edge('edgeA',{openVisibility:'hidden'}),edge('edgeB',{openVisibility:'hidden'}),
 vertex({visibility:'hidden'}));
 assert.equal(r.status,'local-join-certified');assert.equal(r.officialLineStyleVerified,false);
});
test('reject invalid view and invalid tolerance',()=>{
 assert.throws(()=>proveProjectedJoin({left:edge('edgeA'),right:edge('edgeB'),vertex:vertex(),view:'Q'}));
 assert.throws(()=>proveProjectedJoin({left:edge('edgeA'),right:edge('edgeB'),vertex:vertex(),view:'V',toleranceMm:1}));
});
test('degenerate or unproven open intervals cannot be promoted',()=>{
 assert.throws(()=>run(edge('edgeA',{openIntervalCertified:false})));
 assert.equal(run(edge('edgeA',{openVisibility:'undetermined'})).status,'undetermined');
});
