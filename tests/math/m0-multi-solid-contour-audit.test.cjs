'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditMultiSolidContour}=require('../../core/numeric/multi-solid-contour-audit.cjs');
function fixture(){
 const vertices=[0,1,2].map(i=>({id:'v'+i,view:'V',
 projectedPoint:{u:i,v:i%2},visibility:'visible',pointRayCertified:true}));
 const edges=[0,1,2].map(i=>({edgeId:'e'+i,
 start:{vertexId:'v'+i,view:'V',projectedEndpoint:vertices[i].projectedPoint,
 openVisibility:'visible',openIntervalCertified:true},
 end:{vertexId:'v'+((i+1)%3),view:'V',
 projectedEndpoint:vertices[(i+1)%3].projectedPoint,
 openVisibility:'visible',openIntervalCertified:true}}));
 const intervals=edges.map(e=>({edgeId:e.edgeId,view:'V',
 continuousDepthVerified:true,allSceneSolidsIncluded:true,solidIds:['a','b'],
 runs:[{from:0,to:1,visibility:'visible',depthOrderVerified:true}]}));
 return {view:'V',edges,vertices,intervals,sceneSolidIds:['a','b']};
}
test('verified supplied-scene depth does not certify complete CAD scene or V5',()=>{
 const r=auditMultiSolidContour(fixture());
 assert.equal(r.status,'supplied-scene-local-proof');
 assert.equal(r.completeSceneVerified,false);assert.equal(r.officialLineStyleVerified,false);
});
test('missing occluder in supplied set refuses proof',()=>{
 const s=fixture();s.intervals[0].solidIds=['a'];
 assert.equal(auditMultiSolidContour(s).status,'undetermined');
});
test('gap in continuous coverage refuses proof',()=>{
 const s=fixture();s.intervals[1].runs[0].from=.1;
 assert.equal(auditMultiSolidContour(s).status,'undetermined');
});
test('hidden middle segment needs its own junction proof',()=>{
 const s=fixture();s.intervals[0].runs=[
 {from:0,to:.25,visibility:'visible',depthOrderVerified:true},
 {from:.25,to:.75,visibility:'hidden',depthOrderVerified:true},
 {from:.75,to:1,visibility:'visible',depthOrderVerified:true}];
 assert.equal(auditMultiSolidContour(s).status,'undetermined');
});
test('unverified depth order is never promoted',()=>{
 const s=fixture();s.intervals[2].runs[0].depthOrderVerified=false;
 assert.equal(auditMultiSolidContour(s).status,'undetermined');
});
test('coincident projected endpoints with distinct source vertex fail',()=>{
 const s=fixture();s.edges[0].end.vertexId='another';
 assert.equal(auditMultiSolidContour(s).status,'undetermined');
});
