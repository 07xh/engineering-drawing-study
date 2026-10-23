'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {finiteTwoSegmentFillets:solve}=require('../../engines/planar/two-segment-fillet.cjs');
const {twoLineFilletCenters}=require('../../engines/planar/two-line-fillet.cjs');
const close=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,a+' != '+b);
const both=()=>({
 first:{a:{x:-10,y:0},b:{x:10,y:0}},
 second:{a:{x:0,y:-10},b:{x:0,y:10}},
 filletRadius:3
});
const parallel=(first,second)=>({
 first:{a:{x:first[0],y:0},b:{x:first[1],y:0}},
 second:{a:{x:second[0],y:6},b:{x:second[1],y:6}},
 filletRadius:3,firstSide:1,secondSide:-1
});
test('two true finite perpendicular segments retain four distinct centers',()=>{
 const r=solve(both()),orig=twoLineFilletCenters(both());
 assert.equal(r.status,'multiple');
 assert.equal(r.candidateCount,4);
 assert.deepEqual(r.candidates.map(c=>c.id),orig.candidates.map(c=>c.id));
 assert.equal(r.continuousFamilies.length,0);
 assert.equal(r.finiteArcSweepVerified,false);
 assert.equal(r.finiteSourceContactsVerified,true);
 assert.equal(r.directedG1Verified,false);
 for(const c of r.candidates){
  assert.equal(c.sourceContactsOnSegments,true);
  assert.ok(c.maxResidual<1e-7);
  for(const side of ['first','second']){
   const hit=c.contactSegments[side];
   assert.ok(hit.t>=0&&hit.t<=1);
   assert.equal(hit.atEndpoint,false);
  }
 }
});

test('short first finite segment rejects all 4 infinite-line candidate centers',()=>{
 const b=both(),r=solve({...b,first:{a:{x:-2,y:0},b:{x:2,y:0}}});
 assert.equal(r.status,'none');assert.equal(r.candidateCount,0);
 assert.equal(r.solutionCount,0);assert.equal(r.rejectedCandidates.length,4);
 assert.equal(r.finiteSourceContactsVerified,false);
 assert.ok(r.rejectedCandidates.every(x=>!x.firstInRange&&x.secondInRange));
 assert.deepEqual(r.candidates,[]);
});

test('clipping both segment ranges yields exactly one center, no hidden alternative',()=>{
 const b=both(),r=solve({...b,
  first:{a:{x:-5,y:0},b:{x:0,y:0}},
  second:{a:{x:0,y:-5},b:{x:0,y:0}}
 });
 assert.equal(r.status,'unique');assert.equal(r.candidateCount,1);
 assert.deepEqual(r.candidates[0].center,{x:-3,y:-3});
 assert.equal(r.rejectedCandidates.length,3);
 assert.equal(r.continuousDegreesOfFreedom,0);
});

test('exact start endpoint contacts are valid for each source segment',()=>{
 const r=solve({
  first:{a:{x:3,y:0},b:{x:10,y:0}},
  second:{a:{x:0,y:3},b:{x:0,y:10}},
  filletRadius:3
 });
 assert.equal(r.status,'unique');assert.deepEqual(r.candidates[0].center,{x:3,y:3});
 assert.equal(r.candidates[0].contactSegments.first.t,0);
 assert.equal(r.candidates[0].contactSegments.second.t,0);
 assert.equal(r.candidates[0].contactSegments.first.atEndpoint,true);
 assert.equal(r.candidates[0].contactSegments.second.atEndpoint,true);
});

test('exact end endpoint contacts are valid when both segments are reversed',()=>{
 const r=solve({
  first:{a:{x:10,y:0},b:{x:3,y:0}},
  second:{a:{x:0,y:10},b:{x:0,y:3}},
  filletRadius:3
 });
 assert.equal(r.status,'unique');assert.deepEqual(r.candidates[0].center,{x:3,y:3});
 assert.equal(r.candidates[0].contactSegments.first.t,1);
 assert.equal(r.candidates[0].contactSegments.second.t,1);
});

test('true infinite parallel family clipped to overlapping finite offset segments',()=>{
 const p=parallel([-10,10],[-4,4]),r=solve(p);
 assert.equal(twoLineFilletCenters(p).status,'continuous');
 assert.equal(r.status,'continuous');
 assert.equal(r.candidateCount,0);assert.equal(r.solutionCount,null);
 assert.equal(r.continuousDegreesOfFreedom,1);
 assert.equal(r.continuousFamilies.length,1);
 assert.equal(r.finiteSourceContactsVerified,true);
 const f=r.continuousFamilies[0];
 assert.deepEqual(f.centerParameterRange,[6,14]);
 assert.deepEqual(f.start.center,{x:-4,y:3});
 assert.deepEqual(f.end.center,{x:4,y:3});
 assert.deepEqual(f.start.contacts.first,{x:-4,y:0});
 assert.deepEqual(f.end.contacts.second,{x:4,y:6});
 assert.equal(f.start.maxResidual,0);assert.equal(f.end.maxResidual,0);
});

test('parallel infinite offset lines coincide but finite ranges do NOT overlap',()=>{
 const p=parallel([-10,-2],[2,10]),r=solve(p);
 assert.equal(twoLineFilletCenters(p).status,'continuous');
 assert.equal(r.status,'none');assert.equal(r.candidateCount,0);
 assert.equal(r.continuousFamilies.length,0);
 assert.equal(r.rejectedCandidates.length,1);
 assert.equal(r.rejectedCandidates[0].reason,'parallel-offset-overlap-outside-finite-segments');
});

test('parallel segments meeting only at one offset endpoint yield one center',()=>{
 const p=parallel([-10,0],[0,10]),r=solve(p);
 assert.equal(r.status,'unique');assert.equal(r.candidateCount,1);
 assert.deepEqual(r.candidates[0].center,{x:0,y:3});
 assert.equal(r.candidates[0].contactSegments.first.atEndpoint,true);
 assert.equal(r.candidates[0].contactSegments.second.atEndpoint,true);
 assert.equal(r.candidates[0].sourceContactsOnSegments,true);
 assert.equal(r.continuousFamilies.length,0);
});

test('parallel source lines farther apart than 2r are unsatisfiable',()=>{
 const p=parallel([-10,10],[-10,10]);p.second.a.y=9;p.second.b.y=9;
 const r=solve(p);
 assert.equal(r.status,'none');assert.equal(r.candidateCount,0);
 assert.deepEqual(r.continuousFamilies,[]);
});

test('reversed second parallel segment and side preserves overlap family',()=>{
 const p=parallel([-10,10],[-4,4]);
 const a=solve(p),b=solve({...p,
  second:{a:p.second.b,b:p.second.a},secondSide:1});
 assert.equal(a.status,'continuous');assert.equal(b.status,'continuous');
 assert.deepEqual(a.continuousFamilies[0].start.center,b.continuousFamilies[0].start.center);
 assert.deepEqual(a.continuousFamilies[0].end.center,b.continuousFamilies[0].end.center);
});

test('same infinite source line finite overlap has bounded continuous candidate family',()=>{
 const b=both(),r=solve({first:b.first,
  second:{a:{x:-4,y:0},b:{x:4,y:0}},filletRadius:3,
  firstSide:1,secondSide:1});
 assert.equal(r.status,'continuous');
 assert.equal(r.continuousFamilies.length,1);
 assert.deepEqual(r.continuousFamilies[0].start.center,{x:-4,y:3});
 assert.deepEqual(r.continuousFamilies[0].end.center,{x:4,y:3});
});

test('near-parallel ill-conditioned geometry stays unstable after finite filtering',()=>{
 const p=parallel([-10,10],[-10,10]);
 p.second.b.y+=2e-8;
 const r=solve(p);
 assert.equal(r.status,'unstable');assert.equal(r.solutionCount,null);
 assert.equal(r.candidateCount,0);assert.equal(r.continuousFamilies.length,0);
 assert.equal(r.finiteSourceContactsVerified,false);
});

test('explicit side filtering limits returned tangent branches',()=>{
 const p=both(),r=solve({...p,firstSide:1,secondSide:-1});
 assert.equal(r.status,'unique');assert.equal(r.candidateCount,1);
 assert.deepEqual(r.candidates[0].center,{x:3,y:3});
 assert.equal(r.candidates[0].id,'s+-');
});

test('reversing orientation and both signs preserves the finite geometric centers',()=>{
 const b=both(),a=solve(b);
 const rev=solve({...b,first:{a:b.first.b,b:b.first.a},
  second:{a:b.second.b,b:b.second.a}});
 assert.equal(rev.status,a.status);
 const asort=r=>r.candidates.map(c=>[c.center.x,c.center.y])
  .sort((x,y)=>x[0]-y[0]||x[1]-y[1]);
 assert.deepEqual(asort(a),asort(rev));
});

test('translation moves all accepted centers/contacts with unchanged t parameters',()=>{
 const b=both(),dx=125,dy=-400,shift=p=>({x:p.x+dx,y:p.y+dy});
 const z=solve({...b,
  first:{a:shift(b.first.a),b:shift(b.first.b)},
  second:{a:shift(b.second.a),b:shift(b.second.b)}});
 const original=solve(b);
 assert.equal(z.candidateCount,4);
 for(let i=0;i<4;i++){
  const c=original.candidates[i],d=z.candidates[i];
  close(d.center.x,c.center.x+dx);close(d.center.y,c.center.y+dy);
  close(d.contacts.first.x,c.contacts.first.x+dx);
  close(d.contacts.second.y,c.contacts.second.y+dy);
  close(d.contactSegments.first.t,c.contactSegments.first.t);
  close(d.contactSegments.second.t,c.contactSegments.second.t);
 }
});

test('uniform scale transforms lengths and coordinates, not segment membership',()=>{
 const b=both(),s=4,scale=p=>({x:p.x*s,y:p.y*s});
 const a=solve(b),c=solve({
  first:{a:scale(b.first.a),b:scale(b.first.b)},
  second:{a:scale(b.second.a),b:scale(b.second.b)},
  filletRadius:3*s
 });
 assert.equal(c.candidateCount,4);
 for(let i=0;i<4;i++){
  close(c.candidates[i].center.x,a.candidates[i].center.x*s);
  close(c.candidates[i].center.y,a.candidates[i].center.y*s);
  close(c.candidates[i].contactSegments.first.t,a.candidates[i].contactSegments.first.t);
 }
});

test('invalid radii, degenerate source segments and invalid signs fail closed',()=>{
 assert.throws(()=>solve());
 assert.throws(()=>solve({...both(),filletRadius:0}));
 assert.throws(()=>solve({...both(),firstSide:0}));
 assert.throws(()=>solve({...both(),second:{a:{x:0,y:0},b:{x:0,y:0}}}));
 assert.throws(()=>solve({...both(),first:{a:{x:NaN,y:0},b:{x:10,y:0}}}));
});

test('input values and underlying solver candidate arrays are not mutated',()=>{
 const b=both(),snapshot=JSON.stringify(b);
 const original=twoLineFilletCenters(b);
 const r=solve(b);
 assert.equal(JSON.stringify(b),snapshot);
 assert.deepEqual(twoLineFilletCenters(b),original);
 assert.equal(r.candidates.length,4);
 assert.ok(!Object.hasOwn(r,'globallyUnique'));
});
