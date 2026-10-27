'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditContourWithM0Occlusion}=require('../../core/numeric/m0-contour-kernel-binding.cjs');
function cube(id,x0,x1){
 const h=(id,n,o)=>({id,normal:n,offsetMm:o});
 return {id,halfspaces:[
 h('left',{x:-1,y:0,z:0},-x0),h('right',{x:1,y:0,z:0},x1),
 h('bottom',{x:0,y:-1,z:0},1),h('top',{x:0,y:1,z:0},1),
 h('back',{x:0,y:0,z:-1},1),h('front',{x:0,y:0,z:1},1)]};
}
function setup(){
 const vertices=[0,1,2].map(i=>({id:'v'+i,view:'V',
 projectedPoint:{u:i,v:i%2},visibility:'visible',pointRayCertified:true}));
 const edges=[0,1,2].map(i=>({edgeId:'e'+i,
 start:{vertexId:'v'+i,view:'V',projectedEndpoint:vertices[i].projectedPoint,
 openVisibility:'visible',openIntervalCertified:true},
 end:{vertexId:'v'+((i+1)%3),view:'V',
 projectedEndpoint:vertices[(i+1)%3].projectedPoint,
 openVisibility:'visible',openIntervalCertified:true}}));
 const sources=edges.map(e=>({id:e.edgeId,from:{x:-3,y:0,z:0},
 to:{x:3,y:0,z:0}}));
 return {view:'V',edges,vertices,sources,
  solids:[cube('a',-1,0),cube('b',.2,1)],observerDirection:{x:0,y:0,z:1}};
}
test('actual M0 elimination yields witnesses but not invented complete proof',()=>{
 const r=auditContourWithM0Occlusion(setup());
 assert.ok(r.positiveOpenWitnessCount>=2);
 assert.equal(r.gate.status,'undetermined');
 assert.equal(r.completeSceneVerified,false);
 assert.equal(r.officialLineStyleVerified,false);
});
test('source and projected edge identity mismatch rejected',()=>{
 const s=setup();s.sources[0].id='wrong';
 assert.throws(()=>auditContourWithM0Occlusion(s));
});
test('duplicate solid IDs rejected',()=>{
 const s=setup();s.solids[1].id='a';
 assert.throws(()=>auditContourWithM0Occlusion(s));
});
