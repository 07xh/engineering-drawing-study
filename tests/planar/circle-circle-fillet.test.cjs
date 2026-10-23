'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {circleCircleFilletCenters:solve}=require('../../engines/planar/circle-circle-fillet.cjs');
const close=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,a+' != '+b);
const base=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10});
test('two external circles produce both mathematical ±sqrt(125) candidates',()=>{
 const r=solve(base());assert.equal(r.status,'multiple');assert.equal(r.candidateCount,2);
 const s=Math.sqrt(125);close(r.candidates[0].center.x,10);close(r.candidates[0].center.y,-s);
 close(r.candidates[1].center.x,10);close(r.candidates[1].center.y,s);
 for(const c of r.candidates){
  close(c.contacts.first.x,10/3);
  close(c.contacts.second.x,50/3);
  close(c.contacts.first.y,c.center.y/3);
  close(c.contacts.second.y,c.center.y/3);
  close(c.maxResidual,0);assert.equal(c.arcDirection,null);
 }
 assert.equal(r.provenArcDirection,false);
 assert.equal(r.continuousDegreesOfFreedom,0);
});
test('single center at auxiliary external tangency',()=>{
 const r=solve({...base(),second:{center:{x:30,y:0},radius:5}});
 assert.equal(r.status,'unique');assert.equal(r.candidateCount,1);
 close(r.candidates[0].center.x,15);close(r.candidates[0].center.y,0);
 close(r.candidates[0].maxResidual,0);
});
test('circles too far apart produce no candidate instead of fake center',()=>{
 const r=solve({...base(),second:{center:{x:50,y:0},radius:5}});
 assert.equal(r.status,'none');assert.deepEqual(r.candidates,[]);
 assert.equal(r.continuousDegreesOfFreedom,null);
});
test('one auxiliary circle strictly inside another without intersection has no center',()=>{
 const r=solve({first:{center:{x:0,y:0},radius:100},
 second:{center:{x:1,y:0},radius:2},filletRadius:5});
 assert.equal(r.status,'none');
});
test('identical center loci are coincident, not a unique solution',()=>{
 const r=solve({...base(),second:{center:{x:0,y:0},radius:5}});
 assert.equal(r.status,'coincident');assert.equal(r.continuousDegreesOfFreedom,1);
 assert.equal(r.candidates.length,0);
});
test('concentric unequal center loci cannot intersect',()=>{
 const r=solve({...base(),second:{center:{x:0,y:0},radius:7}});
 assert.equal(r.status,'none');
});
test('internal mode where known circle encloses fillet yields true contact',()=>{
 const r=solve({first:{center:{x:0,y:0},radius:10},second:{center:{x:10,y:0},radius:3},
  filletRadius:2,firstMode:'internal'});
 assert.equal(r.status,'multiple');
 for(const c of r.candidates){close(c.maxResidual,0);assert.ok(c.contacts.first.x>0);
   close(Math.hypot(c.contacts.first.x,c.contacts.first.y),10);
 }
});
test('internal mode where fillet encloses small known circle yields true contact',()=>{
 const r=solve({first:{center:{x:0,y:0},radius:2},
 second:{center:{x:15,y:0},radius:3},filletRadius:10,firstMode:'internal'});
 assert.equal(r.status,'multiple');
 for(const c of r.candidates){close(c.maxResidual,0);
  const radial={x:c.center.x,y:c.center.y},dot=radial.x*c.contacts.first.x+radial.y*c.contacts.first.y;
  assert.ok(dot<0,'contact faces opposite side when fillet encloses the known circle');
 }
});
test('equal-radius internal tangency remains coincident contact, no fabricated branch',()=>{
 const r=solve({...base(),filletRadius:5,firstMode:'internal'});
 assert.equal(r.status,'coincident');assert.equal(r.candidateCount,0);
});
test('reject negative/zero/missing/NaN radii',()=>{
 for(const bad of [0,-1,NaN,Infinity]){
  assert.throws(()=>solve({...base(),filletRadius:bad}));
  assert.throws(()=>solve({...base(),first:{center:{x:0,y:0},radius:bad}}));
 }
 assert.throws(()=>solve());
});
test('reject unrecognized modes, invalid epsilon and nonscalar positions',()=>{
 assert.throws(()=>solve({...base(),firstMode:'unknown'}));
 assert.throws(()=>solve({...base(),secondMode:'clockwise'}));
 assert.throws(()=>solve({...base(),epsilon:-1}));
 assert.throws(()=>solve({...base(),first:{center:{x:'0',y:0},radius:5}}));
});
test('translation preserves centers and mathematical contacts',()=>{
 const b=base(),dx=100,dy=-35;
 const shifted=c=>({center:{x:c.center.x+dx,y:c.center.y+dy},radius:c.radius});
 const first=solve(b),second=solve({...b,first:shifted(b.first),second:shifted(b.second)});
 for(let i=0;i<2;i++){
  close(second.candidates[i].center.x,first.candidates[i].center.x+dx);
  close(second.candidates[i].center.y,first.candidates[i].center.y+dy);
  for(const key of ['first','second']){
   close(second.candidates[i].contacts[key].x,first.candidates[i].contacts[key].x+dx);
   close(second.candidates[i].contacts[key].y,first.candidates[i].contacts[key].y+dy);
  }
 }
});
test('scaling mm units scales centers and contacts but not number of solutions',()=>{
 const b=base(),scale=3;
 const transform=c=>({center:{x:c.center.x*scale,y:c.center.y*scale},radius:c.radius*scale});
 const a=solve(b),z=solve({first:transform(b.first),second:transform(b.second),filletRadius:b.filletRadius*scale});
 assert.equal(z.status,a.status);
 for(let i=0;i<2;i++){
  close(z.candidates[i].center.x,a.candidates[i].center.x*scale);
  close(z.candidates[i].center.y,a.candidates[i].center.y*scale);
 }
});
test('moving inputs recomputes candidate locations without hidden global state',()=>{
 const b=base(),first=solve(b),second=solve({...b,second:{...b.second,center:{x:15,y:0}}});
 assert.notEqual(first.candidates[0].center.y,second.candidates[0].center.y);
 assert.deepEqual(solve(b).candidates,first.candidates);
});
test('all branches return bounded residuals and do not claim directed G1 arc proof',()=>{
 const b=base();
 for(const angle of [0,.25,.5,1,1.8,2.9]){
  const f={...b,second:{center:{x:20*Math.cos(angle),y:20*Math.sin(angle)},radius:5}};
  const q=solve(f);
  assert.equal(q.candidateCount,2);
  assert.equal(q.provenArcDirection,false);
  for(const c of q.candidates){
   assert.ok(c.maxResidual<1e-7);
   assert.equal(c.unorientedTangentContinuity,true);
   assert.equal(c.arcSweep,null);
  }
 }
});
