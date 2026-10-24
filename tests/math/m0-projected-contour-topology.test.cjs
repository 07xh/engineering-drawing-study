'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditProjectedContour}=require('../../core/numeric/projected-contour-topology.cjs');
function scene(){
 const vertices=[0,1,2].map(i=>({id:'v'+i,view:'V',projectedPoint:{u:i,v:i%2},
 visibility:'visible',pointRayCertified:true}));
 const edges=[0,1,2].map(i=>({edgeId:'e'+i,
 start:{vertexId:'v'+i,view:'V',projectedEndpoint:vertices[i].projectedPoint,
 openVisibility:'visible',openIntervalCertified:true},
 end:{vertexId:'v'+((i+1)%3),view:'V',projectedEndpoint:vertices[(i+1)%3].projectedPoint,
 openVisibility:'visible',openIntervalCertified:true}}));
 return {view:'V',edges,vertices};
}
test('all local joins pass without promoting full scene or official style',()=>{
 const r=auditProjectedContour(scene());assert.equal(r.status,'local-topology-certified');
 assert.equal(r.joins.length,3);assert.equal(r.fullContourVerified,false);
 assert.equal(r.v5VerifiedExportReady,false);
});
test('projected coincident but different source vertex refuses join',()=>{
 const s=scene();s.edges[0].end.vertexId='other';
 assert.equal(auditProjectedContour(s).status,'undetermined');
});
test('occlusion transition refuses continuous local join',()=>{
 const s=scene();s.edges[1].start.openVisibility='hidden';
 assert.equal(auditProjectedContour(s).status,'undetermined');
});
test('uncertified intersection vertex refuses join',()=>{
 const s=scene();s.vertices[2].pointRayCertified=false;
 assert.equal(auditProjectedContour(s).status,'undetermined');
});
test('duplicate edge identity rejected',()=>{
 const s=scene();s.edges[1].edgeId='e0';
 assert.throws(()=>auditProjectedContour(s));
});
test('unresolved projected intersection is not inferred from geometry alone',()=>{
 const s=scene();s.edges[0].end.projectedEndpoint={u:99,v:99};
 assert.equal(auditProjectedContour(s).status,'undetermined');
});
