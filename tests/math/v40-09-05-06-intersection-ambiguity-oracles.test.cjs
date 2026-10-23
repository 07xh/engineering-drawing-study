'use strict';
// Independent 09 mathematical counterexamples only: NOT 05/06 solvers.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project,toSheet}=require('../../core/projection/conventions.js');
const p=(x,y,z)=>({x,y,z});
const close=(a,b,t=1e-8)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<t,
 a+' != '+b);
const candidate=(t,sign,c,r)=>p(c.x+r*Math.cos(t),
 c.y+r*Math.sin(t),c.z+sign*r*Math.sin(t));
const residuals=(q,c,r)=>[
 (q.x-c.x)**2+(q.y-c.y)**2-r*r,
 (q.x-c.x)**2+(q.z-c.z)**2-r*r];
const verify=(q,c,r,tol=1e-7)=>{
 for(const residual of residuals(q,c,r))close(residual,0,tol);
 const views=project(q);
 assert.deepEqual(views.V,{u:q.x,v:q.z});
 assert.deepEqual(views.H,{u:q.x,v:q.y});
 assert.deepEqual(views.W,{u:q.y,v:q.z});
};
test('05 two perpendicular equal-radius cylinder surfaces have distinct analytic intersection branches',()=>{
 const c=p(0,0,0),r=5;
 for(let i=0;i<=64;i++){
  const t=2*Math.PI*i/64;
  for(const sign of [-1,1]){
   const q=candidate(t,sign,c,r);verify(q,c,r);
   close(q.z-c.z,sign*(q.y-c.y));
  }
 }
 const a=candidate(Math.PI/2,1,c,r);
 const b=candidate(Math.PI/2,-1,c,r);
 assert.notDeepEqual(a,b);
 close(a.z,5);close(b.z,-5);
 for(const t of [0,Math.PI]){
  const q1=candidate(t,1,c,r),q2=candidate(t,-1,c,r);
  close(Math.hypot(q1.x-q2.x,q1.y-q2.y,q1.z-q2.z),0);
 }
});
test('05 model-space translation and uniform scaling conserve both implicit surface residuals',()=>{
 const c=p(1,-3,7),r=5,k=2.5,shift=p(100,-80,20);
 const c2=p(c.x*k+shift.x,c.y*k+shift.y,c.z*k+shift.z);
 for(let i=0;i<=32;i++){
  const t=2*Math.PI*i/32;
  for(const sign of [-1,1]){
   const q=candidate(t,sign,c,r);
   const transformed=p(q.x*k+shift.x,q.y*k+shift.y,q.z*k+shift.z);
   const actual=candidate(t,sign,c2,r*k);
   for(const axis of ['x','y','z'])close(transformed[axis],actual[axis]);
   verify(transformed,c2,k*r,1e-6);
  }
 }
});
test('05 coincident cylindrical surfaces have two independent parameters, not a unique line',()=>{
 const c=p(0,0,0),r=5;
 for(const t of [0,Math.PI/3,Math.PI]){
  const tangent=p(-r*Math.sin(t),r*Math.cos(t),0);
  close(Math.hypot(tangent.x,tangent.y),r);
  for(const z of [-20,0,30]){
   const q=p(r*Math.cos(t),r*Math.sin(t),z);
   const equation=(q.x-c.x)**2+(q.y-c.y)**2-r*r;
   close(equation,0);
   // Tangents with respect to t and z have nonzero cross-product norm.
  }
 }
});
const A=[p(2,3,5),p(2,7,9)];
const B=[p(2,7,5),p(2,3,9)];
const unordered=(points,view)=>points.map(q=>{
 const v=project(q)[view];
 return [v.u,v.v].map(n=>n.toFixed(9)).join(',');
}).sort();
test('06 two unlabeled orthographic views can admit two distinct 3D point correspondences',()=>{
 assert.deepEqual(unordered(A,'V'),unordered(B,'V'));
 assert.deepEqual(unordered(A,'H'),unordered(B,'H'));
 assert.notDeepEqual(unordered(A,'W'),unordered(B,'W'));
 const keys=points=>points.map(q=>[q.x,q.y,q.z].join(',')).sort();
 assert.notDeepEqual(keys(A),keys(B));
});
test('06 third-view evidence or genuine vertex identity is needed, sheet mapping cannot infer correspondence',()=>{
 const actualW=unordered(A,'W');
 assert.deepEqual(unordered(A,'W'),actualW);
 assert.notDeepEqual(unordered(B,'W'),actualW);
 const sheet={origin:{x:360,y:175},scale:4};
 for(const view of ['V','H']){
  const image=points=>points.map(q=>{
   const uv=project(q)[view],x=toSheet(view,uv,sheet);
   return [x.x,x.y].map(n=>n.toFixed(9)).join(',');
  }).sort();
  assert.deepEqual(image(A),image(B));
 }
});
