'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {classifyConePlane:classify}=require('../../engines/spatial/sections/cone-plane-classifier.cjs');
const P=(x,y,z)=>({x,y,z});
const C=(x=0,y=0,z=0,r=5,h=10)=>({baseCenter:P(x,y,z),radiusMm:r,heightMm:h,modelUnit:'mm'});
const F=(p,n=P(1,0,3))=>({point:p,normal:n,modelUnit:'mm'});
test('M3 automatically routes finite cone full ellipse, circle and clipped ellipse',()=>{
 assert.deepEqual([classify(C(),F(P(0,0,6))).status,classify(C(),F(P(0,0,6))).kind],['ready','full-ellipse']);
 assert.equal(classify(C(),F(P(0,0,6),P(0,0,1))).conicType,'circle');
 assert.deepEqual([classify(C(),F(P(0,0,1))).status,classify(C(),F(P(0,0,1))).kind],['ready','clipped-ellipse']);
});
test('M3 verifies empty finite-solid cuts on apex side, below base and off-axis',()=>{
 for(const plane of [F(P(0,0,12)),F(P(0,0,-2),P(0,0,1)),F(P(12,0,4),P(1,0,0))]){
  const result=classify(C(),plane);
  assert.equal(result.status,'none');
  assert.equal(result.separationVerified,true);
  assert.equal(result.intersectionVerified,false);
 }
});
test('M3 does not misreport an intersecting vertical plane or apex touch as empty',()=>{
 const vertical=classify(C(),F(P(0,0,5),P(1,0,0)));
 assert.equal(vertical.status,'unsupported-conic');
 assert.equal(vertical.verified,false);
 const apex=classify(C(),F(P(0,0,10),P(0,0,1)));
 assert.notEqual(apex.status,'none');
 assert.equal(apex.verified,false);
});
test('M3 classification invariant to signed plane normals, scaling and translation',()=>{
 for(const z of [1,6,12]){
  const first=classify(C(),F(P(0,0,z))),translated=classify(C(100,-80,25,10,20),F(P(100,-80,25+2*z)));
  assert.equal(translated.status,first.status);
  assert.equal(translated.kind,first.kind);
  for(const factor of [2,-3]){
   const other=classify(C(),F(P(0,0,z),P(factor,0,3*factor)));
   assert.equal(other.status,first.status);
   assert.equal(other.kind,first.kind);
  }
 }
});
test('M3 rejects unbounded and forged input rather than claiming no cut',()=>{
 assert.throws(()=>classify({...C(),modelUnit:'px'},F(P(0,0,12))));
 assert.throws(()=>classify(C(),F(P(0,0,12),P(0,0,0))));
 assert.throws(()=>classify(C(),F(P(0,0,6)),{samples:2}));
});
