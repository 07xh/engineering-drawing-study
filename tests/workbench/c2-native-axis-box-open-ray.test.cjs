'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {certifyAxisBoxSourceOpenRay}=
 require('../../core/numeric/axis-box-source-open-ray.cjs');
const b={id:'ReusableBox',type:'box',
 min:[0,0,0],max:[4,4,4]};
const s=(a,z,rev)=>({
 id:'OriginalSource',from:a,to:z
});
const P=(x,y,z)=>({x,y,z});
const ray=(src,view,box=b)=>certifyAxisBoxSourceOpenRay({
 source:src,box,view
});
test('exact first-angle V inward support proves every OPEN source interval hidden',()=>{
 const p=ray(s(P(1,4,1),P(3,4,3)),'V');
 assert.equal(p.status,'certified-strictly-hidden');
 assert.equal(p.constantBoundarySupportCount,1);
 assert.equal(p.everyOriginalSourceInteriorPointStrictlyHidden,true);
 assert.equal(p.nonuniformEndpointDepthMarginWasNeverRequired,true);
 assert.equal(p.sourceEndpointOcclusionOrJoinCertified,false);
});
test('real C2 Boolean seam can be behind another original box without endpoint depth margin',()=>{
 const left={id:'LeftOriginalBox',type:'box',
  min:[0,0,0],max:[3,2,2]};
 const p=ray(s(P(2,2,0),P(2,2,2)),'V',left);
 assert.equal(p.status,'certified-strictly-hidden');
 assert.equal(p.sourceEndpointOcclusionOrJoinCertified,false);
});
test('strictly outward support signs visible even at exact boundary',()=>{
 const p=ray(s(P(1,0,1),P(3,0,3)),'V');
 assert.equal(p.status,'certified-clear');
 assert.equal(p.certifiedOutwardSupportingFace,'y-min');
 const h=ray(s(P(1,1,4),P(3,3,4)),'H');
 assert.equal(h.status,'certified-clear');
 assert.equal(h.certifiedOutwardSupportingFace,'z-max');
 const w=ray(s(P(4,1,1),P(4,3,3)),'W');
 assert.equal(w.status,'certified-clear');
 assert.equal(w.certifiedOutwardSupportingFace,'x-max');
});
test('normal first-angle H/W inward cases use exact ray signs',()=>{
 assert.equal(ray(s(P(1,1,0),P(3,3,0)),'H').status,
  'certified-strictly-hidden');
 assert.equal(ray(s(P(0,1,1),P(0,3,3)),'W').status,
  'certified-strictly-hidden');
});
test('tangent ray on another supporting face cannot be promoted to hidden',()=>{
 const p=ray(s(P(1,4,4),P(3,4,4)),'V');
 assert.equal(p.status,'undetermined');
 assert.equal(p.officialEngineeringLineStyleAuthorized,false);
 assert.equal(p.signedV5ActionCount,0);
});
test('represented-binary64 1-ULP deviation outside support is never snapped to box',()=>{
 const p=ray(s(P(1,4+Number.EPSILON*4,1),
   P(3,4+Number.EPSILON*4,3)),'V');
 assert.equal(p.status,'undetermined');
 assert.equal(p.everyOriginalSourceInteriorPointStrictlyHidden,false);
});
test('stale or forged original bounds, collapsed or invalid source fail closed',()=>{
 assert.throws(()=>ray(s(P(1,1,1),P(1,1,1)),'V'),/positive 3D source/);
 assert.throws(()=>ray(s(P(1,1,1),P(2,2,2)),'X'),/first-angle/);
 assert.throws(()=>ray(s(P(1,1,1),P(2,2,2)),'V',{
  ...b,max:[0,4,4]}),/axis box/);
});
