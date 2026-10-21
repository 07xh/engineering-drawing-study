'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {twoLineFilletCenters:solve}=require('../../engines/planar/two-line-fillet.cjs');
const {signedDistance,normalizedLine}=require('../../engines/planar/offset-tangency.cjs');
const close=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<=eps,a+' != '+b);
const lines=()=>({
 first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:3
});
const sortCenters=x=>x.candidates.map(c=>c.center)
 .sort((a,b)=>a.x-b.x||a.y-b.y);
test('perpendicular infinite lines return all four signed-side center branches',()=>{
 const out=solve(lines());
 assert.equal(out.status,'multiple');assert.equal(out.candidateCount,4);
 assert.equal(out.solutionCount,4);assert.equal(out.continuousDegreesOfFreedom,0);
 const actual=out.candidates.map(c=>[c.center.x,c.center.y]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 assert.deepEqual(actual,[[-3,-3],[-3,3],[3,-3],[3,3]]);
 assert.deepEqual(out.candidates.map(c=>c.id),['s--','s-+','s+-','s++']);
});
test('each center gives two on-line perpendicular tangent contacts and real steps',()=>{
 const input=lines(),out=solve(input);
 for(const c of out.candidates){
  const [a,b]=[c.contacts.first,c.contacts.second];
  close(Math.abs(signedDistance(c.center,input.first)),3);
  close(Math.abs(signedDistance(c.center,input.second)),3);
  close(signedDistance(a,input.first),0);
  close(signedDistance(b,input.second),0);
  close(Math.hypot(c.center.x-a.x,c.center.y-a.y),3);
  close(Math.hypot(c.center.x-b.x,c.center.y-b.y),3);
  close(c.maxResidual,0);
  assert.deepEqual(c.steps.map(x=>x.kind),
   ['offset-line','offset-line','intersection','perpendicular-feet']);
  assert.equal(c.arcDirection,null);assert.equal(c.arcSweep,null);
 }
 assert.equal(out.directedG1Verified,false);
 assert.equal(out.finiteContactVerified,false);
});
test('explicit two signed sides yield exactly one center with correct contacts',()=>{
 const r=solve({...lines(),firstSide:1,secondSide:1});
 assert.equal(r.status,'unique');assert.equal(r.solutionCount,1);
 assert.deepEqual(r.candidates[0].center,{x:-3,y:3});
 assert.deepEqual(r.candidates[0].contacts.first,{x:-3,y:0});
 assert.deepEqual(r.candidates[0].contacts.second,{x:0,y:3});
 assert.equal(r.candidates[0].id,'s++');
});
test('one fixed signed side leaves two discrete candidates',()=>{
 const r=solve({...lines(),firstSide:1});
 assert.equal(r.status,'multiple');assert.equal(r.candidateCount,2);
 for(const c of r.candidates)close(c.center.y,3);
});
test('two parallel lines spaced 2r have a continuous center family',()=>{
 const b=lines();
 const r=solve({first:b.first,
  second:{a:{x:-20,y:6},b:{x:20,y:6}},filletRadius:3,
  firstSide:1,secondSide:-1});
 assert.equal(r.status,'continuous');assert.equal(r.solutionCount,null);
 assert.equal(r.candidateCount,0);
 assert.equal(r.continuousDegreesOfFreedom,1);
 assert.equal(r.continuousFamilies.length,1);
 assert.equal(r.continuousFamilies[0].id,'s+-');
 assert.equal(r.candidates.length,0);
});
test('parallel lines too far apart have no center for any signed side',()=>{
 const b=lines();
 const r=solve({first:b.first,
  second:{a:{x:-20,y:8},b:{x:20,y:8}},filletRadius:3});
 assert.equal(r.status,'none');assert.equal(r.candidateCount,0);
 assert.equal(r.continuousFamilies.length,0);
 assert.equal(r.rejectedBranches.length,4);
});
test('coincident infinite lines expose two continuous branches, no fake center',()=>{
 const b=lines();
 const r=solve({first:b.first,second:{a:{x:2,y:0},b:{x:12,y:0}},filletRadius:3});
 assert.equal(r.status,'continuous');assert.equal(r.continuousFamilies.length,2);
 assert.equal(r.candidateCount,0);
 assert.deepEqual(r.continuousFamilies.map(c=>c.id),['s--','s++']);
});
test('same geometric line with opposite directions flips the signs',()=>{
 const b=lines(),rev={a:b.first.b,b:b.first.a};
 const r=solve({first:b.first,second:rev,filletRadius:3,firstSide:1,secondSide:-1});
 assert.equal(r.status,'continuous');assert.equal(r.continuousFamilies.length,1);
});
test('parallel offsets with fixed, opposite wrong sides have no solution',()=>{
 const b=lines();
 const r=solve({first:b.first,second:{a:{x:0,y:6},b:{x:10,y:6}},
  filletRadius:3,firstSide:1,secondSide:1});
 assert.equal(r.status,'none');assert.deepEqual(r.candidates,[]);
});
test('near-parallel but distinct lines are unstable rather than giving huge guessed centers',()=>{
 const b=lines();
 const r=solve({first:b.first,
  second:{a:{x:-20,y:6},b:{x:20,y:6+4e-8}},filletRadius:3});
 assert.equal(r.status,'unstable');
 assert.equal(r.solutionCount,null);assert.equal(r.candidateCount,0);
 assert.equal(r.rejectedBranches.length,4);
 assert.match(r.reason,/ill-conditioned/);
});
test('well-separated nonparallel lines return stable candidates with bounded residuals',()=>{
 const b=lines();
 const r=solve({first:b.first,
  second:{a:{x:-20,y:7},b:{x:20,y:7.02}},filletRadius:3,
  firstSide:1,secondSide:-1});
 assert.equal(r.status,'unique');assert.equal(r.candidateCount,1);
 assert.ok(r.candidates[0].maxResidual<1e-6);
 assert.ok(Number.isFinite(r.candidates[0].center.x));
});
test('reversing first line direction and signed side keeps exact center/contact',()=>{
 const b=lines(),x=solve({...b,firstSide:1,secondSide:-1});
 const y=solve({...b,first:{a:b.first.b,b:b.first.a},
  firstSide:-1,secondSide:-1});
 assert.deepEqual(y.candidates[0].center,x.candidates[0].center);
 assert.deepEqual(y.candidates[0].contacts,x.candidates[0].contacts);
});
test('translation retains center and tangent contact geometry',()=>{
 const b=lines(),dx=1000,dy=-280;
 const shift=p=>({x:p.x+dx,y:p.y+dy});
 const first=solve(b),later=solve({...b,
  first:{a:shift(b.first.a),b:shift(b.first.b)},
  second:{a:shift(b.second.a),b:shift(b.second.b)}});
 assert.equal(first.candidateCount,later.candidateCount);
 for(let i=0;i<first.candidateCount;i++){
  for(const key of ['center']){
   close(later.candidates[i][key].x,first.candidates[i][key].x+dx);
   close(later.candidates[i][key].y,first.candidates[i][key].y+dy);
  }
 }
});
test('uniform scaling scales circle radius and all contact points',()=>{
 const b=lines(),factor=7,m=p=>({x:p.x*factor,y:p.y*factor});
 const x=solve(b),y=solve({first:{a:m(b.first.a),b:m(b.first.b)},
  second:{a:m(b.second.a),b:m(b.second.b)},filletRadius:b.filletRadius*factor});
 assert.equal(y.candidateCount,x.candidateCount);
 for(let i=0;i<x.candidateCount;i++){
  close(y.candidates[i].center.x,x.candidates[i].center.x*factor);
  close(y.candidates[i].center.y,x.candidates[i].center.y*factor);
  close(y.candidates[i].contacts.first.x,x.candidates[i].contacts.first.x*factor);
  close(y.candidates[i].contacts.second.y,x.candidates[i].contacts.second.y*factor);
 }
});
test('rotation and translation can change orientation without changing residual proof',()=>{
 const input=lines(),c=Math.cos(.4),s=Math.sin(.4);
 const rot=p=>({x:c*p.x-s*p.y+25,y:s*p.x+c*p.y-14});
 const r=solve({first:{a:rot(input.first.a),b:rot(input.first.b)},
  second:{a:rot(input.second.a),b:rot(input.second.b)},filletRadius:3});
 const src=solve(input);assert.equal(r.status,'multiple');
 for(let i=0;i<4;i++){
  const exp=rot(src.candidates[i].center);
  close(r.candidates[i].center.x,exp.x);
  close(r.candidates[i].center.y,exp.y);
  close(r.candidates[i].maxResidual,0);
 }
});
test('large coordinate 10mm parallel mismatch is not swallowed by relative tolerance',()=>{
 const origin=1e12,base={a:{x:origin,y:origin},b:{x:origin+20,y:origin}};
 const parallel={a:{x:origin,y:origin+16},b:{x:origin+20,y:origin+16}};
 const x=solve({first:base,second:parallel,filletRadius:3});
 assert.equal(x.status,'none');
 assert.equal(x.continuousFamilies.length,0);
});
test('invalid radii, tolerances, signed sides and degenerate lines fail closed',()=>{
 const b=lines();
 for(const value of [0,-3,NaN,Infinity,'3'])
  assert.throws(()=>solve({...b,filletRadius:value}));
 for(const bad of [0,-1,NaN,Infinity])
  assert.throws(()=>solve({...b,epsilon:bad}));
 for(const bad of [0,1e-15,0.2,Infinity])
  assert.throws(()=>solve({...b,angularTolerance:bad}));
 for(const bad of [0,2,'1',null]){
  assert.throws(()=>solve({...b,firstSide:bad}));
  assert.throws(()=>solve({...b,secondSide:bad}));
 }
 assert.throws(()=>solve({...b,first:{a:{x:0,y:0},b:{x:0,y:0}}}));
 assert.throws(()=>solve({...b,second:{a:{x:0,y:NaN},b:{x:1,y:0}}}));
});
test('all candidate branches are stable across repeated runs and inputs stay unmodified',()=>{
 const args=lines(),before=JSON.stringify(args);
 const a=solve(args),b=solve(args);
 assert.deepEqual(a,b);
 assert.equal(JSON.stringify(args),before);
 assert.equal(a.candidateCount,4);
 assert.ok(!Object.hasOwn(a,'globallyUnique'));
});
