'use strict';
/**
 * 09 independent oracle tests for the original 02 complete-circle fillet
 * gate. This source does NOT import any unmerged opt-in wrapper.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {solveFiniteFillet}=require('../../engines/constraints-2d/finite-fillet-gate.cjs');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const eq=(a,b,epsilon=1e-7)=>assert.ok(finite(a)&&Math.abs(a-b)<=epsilon,
 String(a)+' ≠ '+String(b));
const sample=(distance=20,dx=0,dy=0,k=1)=>({
 kind:'two-circles',unit:'mm',revision:19,
 geometry:{
  first:{center:{x:dx,y:dy},radius:5*k},
  second:{center:{x:dx+distance*k,y:dy},radius:5*k}
 },
 filletRadius:10*k,options:{firstMode:'external',secondMode:'external'}
});
const solve=p=>solveFiniteFillet(p);
function independentExternalResiduals(problem,result,epsilon=1e-7){
 const {first,second}=problem.geometry,r=problem.filletRadius;
 for(const candidate of result.candidates){
  const p=candidate.center;
  for(const source of [first,second]){
   eq(Math.hypot(p.x-source.center.x,p.y-source.center.y),
    source.radius+r,epsilon);
  }
  for(const [source,contact] of [
   [first,candidate.contacts.first],[second,candidate.contacts.second]
  ]){
   eq(Math.hypot(contact.x-source.center.x,contact.y-source.center.y),
    source.radius,epsilon);
   eq(Math.hypot(contact.x-p.x,contact.y-p.y),r,epsilon);
   const lhs=(p.x-source.center.x)*(contact.y-source.center.y);
   const rhs=(p.y-source.center.y)*(contact.x-source.center.x);
   eq(lhs,rhs,epsilon*Math.max(1,source.radius*r));
  }
  assert.equal(candidate.finiteSourceContactsVerified,true);
  assert.equal(candidate.directedG1Verified,false);
 }
}
test('09 full circles symmetric two-branch intersection has analytical center heights',()=>{
 const input=sample(),out=solve(input);
 assert.equal(out.status,'multiple');assert.equal(out.candidateCount,2);
 assert.deepEqual(out.candidates.map(c=>c.branchId),['center-1','center-2']);
 const h=Math.sqrt(15*15-10*10);
 for(const v of out.candidates){eq(v.center.x,10);eq(Math.abs(v.center.y),h);}
 independentExternalResiduals(input,out);
 assert.equal(out.globallyUnique,null);
 assert.equal(out.finishedArcVerified,false);
});
test('09 double tangent auxiliary center-loci yield one candidate within scoped fixed assumptions',()=>{
 const input=sample(30),out=solve(input);
 assert.equal(out.status,'unique');assert.equal(out.candidateCount,1);
 eq(out.candidates[0].center.x,15);eq(out.candidates[0].center.y,0);
 independentExternalResiduals(input,out);
 assert.equal(out.globallyUnique,null);
 assert.equal(out.directedG1Verified,false);
});
test('09 disjoint and coincident locus families never forge one center',()=>{
 const far=solve(sample(40)),coincident=solve(sample(0));
 assert.equal(far.status,'none');assert.deepEqual(far.candidates,[]);
 assert.equal(far.globallyUnique,null);
 assert.equal(coincident.status,'coincident');
 assert.deepEqual(coincident.candidates,[]);
 assert.equal(coincident.solutionCount,null);
});
test('09 same two branch center geometry survives mm scaling and distant translation',()=>{
 const original=solve(sample()).candidates;
 const originalY=original.map(c=>c.center.y).sort((a,b)=>a-b);
 for(const scale of [0.01,1,100]){
  const input=sample(20,12345,-54321,scale),out=solve(input);
  assert.equal(out.status,'multiple');assert.equal(out.candidateCount,2);
  independentExternalResiduals(input,out,Math.max(1e-7,1e-7*scale));
  const ys=out.candidates.map(c=>(c.center.y+54321)/scale).sort((a,b)=>a-b);
  for(let i=0;i<ys.length;i++)eq(ys[i],originalY[i],1e-5);
 }
});
test('09 typed 02 gate rejects source finite arcs even if specialized 02 solver supports them',()=>{
 const input=sample();
 input.geometry.first.arc={startAngle:0,endAngle:180,direction:'ccw'};
 assert.throws(()=>solve(input),/unsupported field arc/);
});
test('09 malformed model units, source revision and invalid radii remain rejected',()=>{
 const input=sample();
 assert.throws(()=>solve({...input,unit:'original-image-px'}),/unit mm/);
 assert.throws(()=>solve({...input,revision:-1}),/revision/);
 assert.throws(()=>solve({...input,geometry:{
  ...input.geometry,first:{...input.geometry.first,radius:0}}}),/positive/);
});
test('09 old full-circle source solver parity on genuine unconstrained analytical candidates',()=>{
 const input=sample(),source=input.geometry;
 const original=circleCircleFilletCenters({
  first:source.first,second:source.second,filletRadius:input.filletRadius,
  firstMode:'external',secondMode:'external'
 });
 const typed=solve(input);
 assert.equal(original.status,typed.status);
 assert.deepEqual(original.candidates.map(c=>c.id),typed.candidates.map(c=>c.branchId));
 for(let i=0;i<original.candidates.length;i++){
  eq(original.candidates[i].center.x,typed.candidates[i].center.x);
  eq(original.candidates[i].center.y,typed.candidates[i].center.y);
 }
});
