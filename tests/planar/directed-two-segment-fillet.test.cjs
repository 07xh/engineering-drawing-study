'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {chooseFiniteTwoSegmentArc:choose}=require('../../engines/planar/directed-two-segment-fillet.cjs');
const {finiteTwoSegmentFillets:solve}=require('../../engines/planar/two-segment-fillet.cjs');
const close=(actual,expected,epsilon=1e-8)=>
 assert.ok(Math.abs(actual-expected)<=epsilon,actual+' != '+expected);
const base=()=>({
 first:{a:{x:-10,y:0},b:{x:10,y:0}},
 second:{a:{x:0,y:-10},b:{x:0,y:10}},
 filletRadius:3
});
const selected=(branchId='s++')=>({
 ...base(),branchId,direction:'ccw',firstTravel:'forward',
 secondTravel:'forward'
});
test('strict branch selection: all 4 center branches remain; no default unique answer',()=>{
 const r=choose({...base(),direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'});
 assert.equal(r.status,'branch-choice-required');
 assert.deepEqual(r.candidateIds,['s--','s-+','s+-','s++']);
 assert.equal(r.candidateCount,4);
 assert.equal(r.geometry,null);
 assert.equal(r.g1Verified,false);
 assert.deepEqual(r.steps,[]);
});
test('selected center still requires explicit clockwise/counterclockwise direction',()=>{
 const r=choose({...base(),branchId:'s++'});
 assert.equal(r.status,'direction-required');
 assert.equal(r.selectedId,'s++');
 assert.equal(r.geometry,null);
});
test('strict G1 proof requires both source contour travel directions',()=>{
 const r=choose({...base(),branchId:'s++',direction:'ccw'});
 assert.equal(r.status,'travel-required');assert.equal(r.geometry,null);
 assert.equal(r.g1Verified,false);
 const partial=choose({...base(),branchId:'s++',direction:'ccw',
  firstTravel:'forward'});
 assert.equal(partial.status,'travel-required');
});
test('valid s++ ccw fillet matches directed incoming and departing segment tangents',()=>{
 const s=choose(selected());
 assert.equal(s.status,'selected');
 assert.equal(s.g1Verified,true);
 assert.equal(s.finiteSourceContactsVerified,true);
 assert.equal(s.finiteArcSweepVerified,true);
 assert.equal(s.center.x,-3);assert.equal(s.center.y,3);
 assert.deepEqual(s.contacts.first,{x:-3,y:0});
 assert.deepEqual(s.contacts.second,{x:0,y:3});
 assert.equal(s.geometry.kind,'arc');
 assert.equal(s.geometry.space,'drawing-2d');
 assert.equal(s.geometry.data.direction,'ccw');
 close(s.geometry.data.startAngle,270);
 close(s.geometry.data.endAngle,360);
 close(s.sweepDegrees,90);
 close(s.maxTangencyResidual,0);
 close(s.maxG1Mismatch,0);
 assert.deepEqual(s.trimmedSourceSegments.first.segment,
  {a:{x:-10,y:0},b:{x:-3,y:0}});
 assert.deepEqual(s.trimmedSourceSegments.second.segment,
  {a:{x:0,y:3},b:{x:0,y:10}});
});
test('opposite s+- cw branch is valid only with first reversed and second forward',()=>{
 const s=choose({...base(),branchId:'s+-',direction:'cw',
  firstTravel:'reverse',secondTravel:'forward'});
 assert.equal(s.status,'selected');
 assert.equal(s.g1Verified,true);
 close(s.sweepDegrees,-90);close(s.maxG1Mismatch,0);
 assert.deepEqual(s.contacts.first,{x:3,y:0});
 assert.deepEqual(s.contacts.second,{x:0,y:3});
 assert.deepEqual(s.trimmedSourceSegments.first.segment,
  {a:{x:10,y:0},b:{x:3,y:0}});
});
test('other clockwise/counterclockwise signed-side branches both retain valid G1',()=>{
 const cases=[
  {branchId:'s--',direction:'ccw',firstTravel:'reverse',secondTravel:'reverse',sweep:90},
  {branchId:'s-+',direction:'cw',firstTravel:'forward',secondTravel:'reverse',sweep:-90}
 ];
 for(const sample of cases){
  const s=choose({...base(),...sample});
  assert.equal(s.status,'selected');
  assert.equal(s.g1Verified,true);
  close(s.sweepDegrees,sample.sweep);
  close(s.maxG1Mismatch,0);
 }
});
test('tangent is not enough: invalid first direction rejects the finite arc',()=>{
 const s=choose({...selected(),firstTravel:'reverse'});
 assert.equal(s.status,'direction-conflict');
 assert.equal(s.geometry,null);
 assert.equal(s.g1Verified,false);
 assert.deepEqual(s.steps,[]);
 assert.ok(s.maxG1Mismatch>1.9);
 assert.ok(s.vectorResiduals.first>1.9);
 close(s.vectorResiduals.second,0);
});
test('invalid second direction independently rejects the arc',()=>{
 const s=choose({...selected(),secondTravel:'reverse'});
 assert.equal(s.status,'direction-conflict');
 assert.equal(s.geometry,null);
 assert.ok(s.vectorResiduals.second>1.9);
 close(s.vectorResiduals.first,0);
});
test('invalid arc direction, travel values or imaginary branch fail closed',()=>{
 for(const direction of ['forward','clockwise','',null])
  assert.throws(()=>choose({...selected(),direction}),/direction/);
 for(const firstTravel of ['cw',1,'',null])
  assert.throws(()=>choose({...selected(),firstTravel}),/firstTravel/);
 for(const secondTravel of ['ccw',0,'',null])
  assert.throws(()=>choose({...selected(),secondTravel}),/secondTravel/);
 assert.throws(()=>choose({...selected(),branchId:'s-imaginary'}),/branchId/);
});
test('candidate invalid on short source segment is not offered as valid branch',()=>{
 const p=base();
 const s=choose({...p,first:{a:{x:-2,y:0},b:{x:2,y:0}},
  branchId:'s++',direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'});
 assert.equal(s.status,'none');
 assert.deepEqual(s.candidateIds,[]);
 assert.equal(s.geometry,null);
 assert.equal(s.g1Verified,false);
});
test('a unique clipped candidate may omit branchId but still requires cw and both travels',()=>{
 const b=base();
 const s=choose({...b,
  first:{a:{x:-5,y:0},b:{x:0,y:0}},
  second:{a:{x:0,y:0},b:{x:0,y:5}},
  direction:'ccw',firstTravel:'forward',secondTravel:'forward'});
 assert.equal(s.status,'selected');
 assert.equal(s.selectedId,'s++');
 assert.equal(s.candidateCount,1);
 close(s.sweepDegrees,90);
});
test('zero-length incoming retained source at first endpoint cannot prove G1',()=>{
 const b=base();
 const s=choose({...b,first:{a:{x:-3,y:0},b:{x:10,y:0}},
  ...{branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'}});
 assert.equal(s.status,'zero-source-trim');
 assert.equal(s.geometry,null);
 assert.equal(s.g1Verified,false);
});
test('zero-length outgoing retained source at endpoint cannot prove G1',()=>{
 const b=base();
 const s=choose({...b,second:{a:{x:0,y:-10},b:{x:0,y:3}},
  branchId:'s++',direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'});
 assert.equal(s.status,'zero-source-trim');
 assert.equal(s.geometry,null);
});
test('continuous parallel offset family is reported, not collapsed into arbitrary arc',()=>{
 const b=base();
 const s=choose({...b,
  second:{a:{x:-4,y:6},b:{x:4,y:6}},
  firstSide:1,secondSide:-1,branchId:'s+-',
  direction:'ccw',firstTravel:'forward',secondTravel:'reverse'});
 assert.equal(s.status,'continuous');
 assert.equal(s.geometry,null);assert.equal(s.candidateCount,0);
 assert.equal(s.continuousFamilies.length,1);
 assert.equal(s.g1Verified,false);
});
test('near-parallel unstable case does not claim verified arc',()=>{
 const b=base();
 const s=choose({...b,
  second:{a:{x:-10,y:6},b:{x:10,y:6+2e-8}},
  firstSide:1,secondSide:-1,
  direction:'ccw',firstTravel:'forward',secondTravel:'reverse'});
 assert.equal(s.status,'unstable');
 assert.equal(s.geometry,null);
 assert.equal(s.g1Verified,false);
});
test('construction steps are real offset/center/contact/trim/directed arc math',()=>{
 const s=choose(selected());
 assert.equal(s.status,'selected');
 assert.deepEqual(s.steps.map(x=>x.kind),
  ['offset-line','offset-line','intersection','perpendicular-feet',
   'finite-segment-trim','directed-arc']);
 for(let i=1;i<s.steps.length;i++){
  assert.equal(s.steps[i].dependsOn.length,1);
  assert.equal(s.steps[i].dependsOn[0],s.steps[i-1].id);
 }
 assert.deepEqual(s.steps[s.steps.length-2].sourceSegments.first,
  {a:{x:-10,y:0},b:{x:-3,y:0}});
 close(s.steps[s.steps.length-1].maxG1Mismatch,0);
});
test('translation rotates nothing and preserves arc sweep and G1 residuals',()=>{
 const b=selected(),dx=125,dy=-210,shift=p=>({x:p.x+dx,y:p.y+dy});
 const moved=choose({...b,
  first:{a:shift(b.first.a),b:shift(b.first.b)},
  second:{a:shift(b.second.a),b:shift(b.second.b)}});
 const s=choose(b);
 assert.equal(moved.status,'selected');
 close(moved.geometry.data.center.x,s.geometry.data.center.x+dx);
 close(moved.geometry.data.center.y,s.geometry.data.center.y+dy);
 close(moved.sweepDegrees,s.sweepDegrees);
 close(moved.maxG1Mismatch,s.maxG1Mismatch);
});
test('scaling preserves G1 while multiplying model radii and contacts',()=>{
 const b=selected(),f=6,m=p=>({x:p.x*f,y:p.y*f});
 const v=choose({...b,
  first:{a:m(b.first.a),b:m(b.first.b)},
  second:{a:m(b.second.a),b:m(b.second.b)},
  filletRadius:b.filletRadius*f});
 const s=choose(b);
 assert.equal(v.status,'selected');
 close(v.geometry.data.radius,s.geometry.data.radius*f);
 close(v.sweepDegrees,s.sweepDegrees);
 close(v.contacts.first.x,s.contacts.first.x*f);
 close(v.maxG1Mismatch,0);
});
test('pure math: never mutate caller or underlying finite segment candidates',()=>{
 const b=selected(),snapshot=JSON.stringify(b);
 const original=solve(b);
 const first=choose(b),second=choose(b);
 assert.deepEqual(first,second);
 assert.equal(JSON.stringify(b),snapshot);
 assert.deepEqual(solve(b),original);
});
