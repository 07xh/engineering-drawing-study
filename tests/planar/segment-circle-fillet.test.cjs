'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {finiteSegmentCircleFillets:solve}=require('../../engines/planar/segment-circle-fillet.cjs');
const {normalizedLine}=require('../../engines/planar/offset-tangency.cjs');
const close=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
const input=()=>({
 segment:{a:{x:-15,y:0},b:{x:15,y:0}},
 circle:{center:{x:0,y:5},radius:8},
 filletRadius:3,side:1
});

test('all infinite-line centers accepted only when both contacts lie on segment',()=>{
 const result=solve(input());
 assert.equal(result.status,'multiple');
 assert.equal(result.candidateCount,2);
 assert.equal(result.rejectedCandidates.length,0);
 const span=Math.sqrt(117);
 close(result.candidates[0].center.x,-span);
 close(result.candidates[1].center.x,span);
 for(const c of result.candidates){
  assert.equal(c.lineContactOnSegment,true);
  assert.ok(c.segmentParameter>0&&c.segmentParameter<1);
  close(c.lineContact.y,0);
  close(c.segmentDistanceFromStart,c.lineContact.x+15);
  assert.equal(c.atEndpoint,false);
  assert.ok(c.maxResidual<1e-7);
 }
 assert.equal(result.directedG1Verified,false);
 assert.equal(result.finiteCircleArcVerified,false);
});

test('infinite line has two solutions, but a short finite segment has none',()=>{
 const result=solve({...input(),segment:{a:{x:-10,y:0},b:{x:10,y:0}}});
 assert.equal(result.status,'none');
 assert.equal(result.candidateCount,0);
 assert.equal(result.candidates.length,0);
 assert.equal(result.rejectedCandidates.length,2);
 assert.equal(result.reason,'tangent-contacts-fall-outside-segment');
 assert.equal(result.continuousDegreesOfFreedom,null);
});

test('asymmetric segment admits one valid center without inventing uniqueness outside segment',()=>{
 const result=solve({...input(),segment:{a:{x:-15,y:0},b:{x:0,y:0}}});
 assert.equal(result.status,'unique');
 assert.equal(result.candidateCount,1);
 assert.equal(result.rejectedCandidates.length,1);
 assert.ok(result.candidates[0].center.x<0);
 assert.match(result.uniquenessScope,/finite segment/);
 assert.equal(Object.hasOwn(result,'globallyUnique'),false);
});

test('exact contact at first endpoint is valid for the finite segment',()=>{
 const result=solve({
  segment:{a:{x:0,y:0},b:{x:20,y:0}},
  circle:{center:{x:0,y:14},radius:8},
  filletRadius:3,side:1
 });
 assert.equal(result.status,'unique');
 const c=result.candidates[0];
 close(c.center.x,0);
 close(c.lineContact.x,0);
 assert.equal(c.segmentParameter,0);
 assert.equal(c.atEndpoint,true);
});

test('exact contact at last endpoint is valid for the finite segment',()=>{
 const result=solve({
  segment:{a:{x:-20,y:0},b:{x:0,y:0}},
  circle:{center:{x:0,y:14},radius:8},
  filletRadius:3,side:1
 });
 assert.equal(result.status,'unique');
 const c=result.candidates[0];
 close(c.lineContact.x,0);
 assert.equal(c.segmentParameter,1);
 assert.equal(c.atEndpoint,true);
});

test('reverse line direction and reverse side preserves geometric candidate set',()=>{
 const b=input(),first=solve(b);
 const reversed=solve({...b,segment:{a:b.segment.b,b:b.segment.a},side:-1});
 assert.equal(reversed.status,'multiple');
 const sort=r=>r.candidates.map(c=>c.center.x).sort((a,b)=>a-b);
 for(let i=0;i<2;i++)close(sort(first)[i],sort(reversed)[i]);
});

test('vertical segment and circle use actual oriented normal, not horizontal assumption',()=>{
 const b=input();
 const transformed=solve({...b,
  segment:{a:{x:0,y:-15},b:{x:0,y:15}},
  circle:{center:{x:-5,y:0},radius:8}
 });
 assert.equal(transformed.status,'multiple');
 for(const c of transformed.candidates){
  close(c.center.x,-3);
  close(c.lineContact.x,0);
  assert.ok(c.lineContact.y>=-15&&c.lineContact.y<=15);
 }
});

test('negative side computes separately valid candidates on opposite offset side',()=>{
 const result=solve({...input(),side:-1});
 assert.equal(result.status,'multiple');
 for(const c of result.candidates){
  close(c.center.y,-3);
  close(c.lineContact.y,0);
  assert.ok(c.segmentParameter>=0&&c.segmentParameter<=1);
 }
});

test('empty infinite-line candidate set is distinguishable from segment clipping',()=>{
 const r=solve({...input(),
  circle:{center:{x:0,y:100},radius:8},side:-1
 });
 assert.equal(r.status,'none');
 assert.equal(r.reason,'no-infinite-line-solution');
 assert.deepEqual(r.rejectedCandidates,[]);
});

test('translations preserve both filtered center points and contact positions',()=>{
 const b=input(),dx=300,dy=-170;
 const shift=p=>({x:p.x+dx,y:p.y+dy});
 const x=solve(b),y=solve({...b,
  segment:{a:shift(b.segment.a),b:shift(b.segment.b)},
  circle:{center:shift(b.circle.center),radius:b.circle.radius}
 });
 assert.equal(y.candidateCount,x.candidateCount);
 for(let i=0;i<x.candidateCount;i++){
  close(y.candidates[i].center.x,x.candidates[i].center.x+dx);
  close(y.candidates[i].center.y,x.candidates[i].center.y+dy);
  close(y.candidates[i].lineContact.x,x.candidates[i].lineContact.x+dx);
  close(y.candidates[i].segmentParameter,x.candidates[i].segmentParameter);
 }
});

test('uniform scaling changes distances but preserves normalized contact parameters',()=>{
 const b=input(),s=5,scale=p=>({x:p.x*s,y:p.y*s});
 const x=solve(b),y=solve({
  segment:{a:scale(b.segment.a),b:scale(b.segment.b)},
  circle:{center:scale(b.circle.center),radius:b.circle.radius*s},
  filletRadius:b.filletRadius*s,side:b.side
 });
 assert.equal(x.status,y.status);
 for(let i=0;i<x.candidateCount;i++){
  close(x.candidates[i].segmentParameter,y.candidates[i].segmentParameter);
  close(y.candidates[i].center.x,x.candidates[i].center.x*s);
 }
});

test('each retained contact is on the segment and perpendicular to its tangent',()=>{
 const b=input(),line=normalizedLine(b.segment);
 for(const c of solve(b).candidates){
  const v={x:c.center.x-c.lineContact.x,y:c.center.y-c.lineContact.y};
  close(v.x*line.tangent.x+v.y*line.tangent.y,0);
  const contactParameter=((c.lineContact.x-line.a.x)*line.tangent.x+
    (c.lineContact.y-line.a.y)*line.tangent.y)/line.length;
  close(contactParameter,c.segmentParameter);
  assert.ok(contactParameter>=0&&contactParameter<=1);
 }
});

test('invalid segment, circle, radius, side and tolerance fail closed',()=>{
 assert.throws(()=>solve());
 assert.throws(()=>solve({...input(),segment:{a:{x:0,y:0},b:{x:0,y:0}}}));
 assert.throws(()=>solve({...input(),circle:{center:{x:NaN,y:5},radius:8}}));
 assert.throws(()=>solve({...input(),filletRadius:0}));
 assert.throws(()=>solve({...input(),side:0}));
 assert.throws(()=>solve({...input(),epsilon:0}));
 assert.throws(()=>solve({...input(),segment:{
  a:{x:-1e308,y:0},b:{x:1e308,y:0}
 }}));
});

test('inputs never mutate; candidate ids remain those of the underlying mathematics',()=>{
 const b=input(),snapshot=JSON.stringify(b);
 const a=solve(b),c=solve(b);
 assert.deepEqual(a,c);
 assert.equal(JSON.stringify(b),snapshot);
 assert.deepEqual(a.candidates.map(x=>x.id),['candidate-1','candidate-2']);
});
