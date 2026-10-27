'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {certifyAxisBoxSourceOpenRay}=
 require('../../core/numeric/axis-box-source-open-ray.cjs');
const box={id:'GeneralBox',type:'box',min:[0,0,0],max:[10,10,10]};
const edge=(from,to)=>({id:'OriginalEdge',from,to});
const P=(x,y,z)=>({x,y,z});
test('exact represented original box supports whole 3D source OPEN hidden ray',()=>{
 const p=certifyAxisBoxSourceOpenRay({
  source:edge(P(2,10,0),P(8,10,10)),box,view:'V'
 });
 assert.equal(p.status,'certified-strictly-hidden');
 assert.equal(p.everyOriginalSourceInteriorPointStrictlyHidden,true);
 assert.equal(p.sourceEndpointOcclusionOrJoinCertified,false);
 assert.equal(p.officialEngineeringLineStyleAuthorized,false);
});
test('tangent support, outward clear, positive ULP violation remain distinct',()=>{
 const run=(a,b)=>certifyAxisBoxSourceOpenRay({source:edge(a,b),box,view:'V'});
 assert.equal(run(P(2,0,2),P(8,0,8)).status,'certified-clear');
 assert.equal(run(P(2,10,10),P(8,10,10)).status,'undetermined');
 assert.equal(run(P(2,10+2*Number.EPSILON*10,2),
  P(8,10+2*Number.EPSILON*10,8)).status,'undetermined');
});
