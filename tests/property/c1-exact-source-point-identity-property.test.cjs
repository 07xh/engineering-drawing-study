'use strict';
/**
 * M5 independent property oracle: even a 3D gap much smaller than the
 * consumer's old 1e-7-mm interpolation tolerance is NOT physical identity.
 * Seeded/shrinkable fast-check remains a dev-only CI dependency.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fc=require('fast-check');
const {project}=require('../../core/projection/conventions.js');
const {exactSameReviewedModelPoint:same}=
 require('../../workbench/m5-c1-contour-physical-junction-incidence.cjs');
const point=(x,y,z)=>({x,y,z});
test('C1/M5 near-but-distinct 3D points never become proven physical source joins',()=>{
 let n=0;
 const base=fc.record({x:fc.integer({min:-500,max:500}),
  y:fc.integer({min:-500,max:500}),
  z:fc.integer({min:-500,max:500})});
 fc.assert(fc.property(base,fc.integer({min:25,max:39}),
  fc.constantFrom('x','y','z'),fc.constantFrom(-1,1),
  (p,power,axis,sign)=>{
   const q={...p,[axis]:p[axis]+sign*2**(-power)};
   assert.notEqual(q[axis],p[axis],
    'represented binary64 coordinate must remain distinguishable');
   const distance=Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);
   assert.ok(distance>0&&distance<1e-7,
    'this is an adversarial false-identification under the old tolerance');
   assert.equal(same(p,q),false);
   assert.equal(same(q,p),false);
   assert.equal(same(p,{...p}),true);
   assert.equal(same(q,{...q}),true);
   n++;
  }),{seed:20261025,numRuns:240});
 assert.equal(n,240);
});
test('W paper alias does not confer a spatial join or V5 line proof',()=>{
 const p=point(20,3,7),q=point(20+2**-30,3,7);
 assert.deepEqual(project(p).W,project(q).W);
 assert.equal(same(p,q),false);
 const r=point(1,4,5),t=point(1,4,5);
 assert.equal(same(r,t),true);
 for(const view of ['V','H','W']){
  assert.deepEqual(project(r)[view],project(t)[view]);
 }
});
test('exact model-point equality includes signed zero but refuses invalid inputs',()=>{
 assert.equal(same(point(0,-0,1),point(-0,0,1)),true);
 for(const invalid of [point(NaN,0,0),point(Infinity,0,0),
  point('1',0,0),null,{},[]]){
  assert.throws(()=>same(invalid,point(0,0,0)),TypeError);
  assert.throws(()=>same(point(0,0,0),invalid),TypeError);
 }
});
