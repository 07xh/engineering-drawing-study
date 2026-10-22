'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {finiteSegmentCircleFillets:solve}=
 require('../../engines/planar/segment-circle-fillet.cjs');
const base=()=>({segment:{a:{x:-15,y:0},b:{x:15,y:0}},
 circle:{center:{x:0,y:5},radius:8},filletRadius:3,side:1});
const angle=(point,center)=>Math.atan2(point.y-center.y,point.x-center.x)*180/Math.PI;
const sector=(centerAngle,halfWidth=12)=>({
 startAngle:centerAngle-halfWidth,endAngle:centerAngle+halfWidth,direction:'ccw'
});
const withArc=(args,arc)=>({...args,circle:{...args.circle,arc}});
const ids=solved=>solved.candidates.map(c=>c.id);
const contactAngle=(args,candidate)=>angle(candidate.circleContact,args.circle.center);
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);

test('backward compatible: full circle permits two finite-segment external centers',()=>{
 const b=base(),r=solve(b);
 assert.equal(r.status,'multiple');
 assert.deepEqual(ids(r),['candidate-1','candidate-2']);
 assert.equal(r.finiteCircleArcCount,0);
 assert.equal(r.finiteCircleArcVerified,false);
 assert.equal(r.directedG1Verified,false);
 assert.ok(r.candidates.every(x=>x.sourceArcRangeVerified));
});
test('a short finite given arc around LEFT contact keeps candidate-1 with its original id',()=>{
 const b=base(),full=solve(b),c=full.candidates[0];
 const r=solve(withArc(b,sector(contactAngle(b,c))));
 assert.equal(r.status,'unique');
 assert.deepEqual(ids(r),['candidate-1']);
 assert.equal(r.finiteCircleArcCount,1);
 assert.equal(r.finiteCircleArcVerified,true);
 assert.equal(r.candidates[0].sourceArcChecks.circle,true);
 assert.equal(r.candidates[0].maxResidual,c.maxResidual);
 assert.deepEqual(r.rejectedCandidates,
  [{id:'candidate-2',reason:'tangent-point-outside-given-circle-arc'}]);
 assert.equal(r.directedG1Verified,false);
 assert.match(r.scope,/finite-circle-arc/);
});
test('a short finite arc around RIGHT contact retains candidate-2 without renumbering',()=>{
 const b=base(),full=solve(b),c=full.candidates[1];
 const r=solve(withArc(b,sector(contactAngle(b,c))));
 assert.equal(r.status,'unique');
 assert.deepEqual(ids(r),['candidate-2']);
 assert.deepEqual(r.rejectedCandidates,
  [{id:'candidate-1',reason:'tangent-point-outside-given-circle-arc'}]);
});
test('valid CCW finite arc spanning 360 to 0 degrees preserves right contact',()=>{
 const b=base(),r=solve(withArc(b,{startAngle:330,endAngle:20,direction:'ccw'}));
 assert.deepEqual(ids(r),['candidate-2']);
 assert.equal(r.finiteCircleArcVerified,true);
});
test('valid clockwise arc spanning zero preserves only right contact',()=>{
 const b=base(),r=solve(withArc(b,{startAngle:20,endAngle:330,direction:'cw'}));
 assert.deepEqual(ids(r),['candidate-2']);
});
test('short finite source sector away from both contacts gives NONE even with two valid infinite solutions',()=>{
 const b=base(),r=solve(withArc(b,{startAngle:65,endAngle:95,direction:'ccw'}));
 assert.equal(r.status,'none');
 assert.equal(r.candidateCount,0);
 assert.equal(r.finiteCircleArcVerified,false);
 assert.equal(r.finiteCircleArcCount,1);
 assert.equal(r.reason,'tangent-contacts-outside-given-circle-arc');
 assert.deepEqual(r.rejectedCandidates.map(x=>x.reason),
  ['tangent-point-outside-given-circle-arc','tangent-point-outside-given-circle-arc']);
});
test('both sources must pass: line extension and finite circle arc boundaries independently exclude candidates',()=>{
 const b=base(),left=solve(b).candidates[0],right=solve(b).candidates[1];
 const onlyLeft={...b,segment:{a:{x:-15,y:0},b:{x:0,y:0}}};
 const r=solve(withArc(onlyLeft,sector(contactAngle(b,right))));
 assert.equal(r.status,'none');assert.equal(r.candidateCount,0);
 assert.deepEqual(r.rejectedCandidates,[
  {id:'candidate-1',reason:'tangent-point-outside-given-circle-arc'},
  {id:'candidate-2',reason:'tangent-point-outside-segment'}
 ]);
 assert.equal(r.finiteCircleArcVerified,false);
 // The original left contact on the *full* circle was legitimate on the segment.
 assert.ok(left.lineContact.x<0&&right.lineContact.x>0);
});
test('contact at endpoint belongs to a finite given arc, but shifted start excludes it',()=>{
 const b=base(),a=contactAngle(b,solve(b).candidates[0]);
 const edge=solve(withArc(b,{startAngle:a,endAngle:a+20,direction:'ccw'}));
 assert.deepEqual(ids(edge),['candidate-1']);
 const outside=solve(withArc(b,{startAngle:a+0.2,endAngle:a+20,direction:'ccw'}));
 assert.equal(outside.status,'none');
});
test('a long source arc is not silently replaced by its shorter complementary arc',()=>{
 const b=base(),r=solve(withArc(b,{startAngle:40,endAngle:380-10,direction:'ccw'}));
 // 40 -> 370 is 330 degrees, includes both contacts at ~190 and ~349 deg.
 assert.deepEqual(ids(r),['candidate-1','candidate-2']);
});
test('malformed source arcs fail before candidate solving even if infinite line has no centers',()=>{
 const b={...base(),circle:{center:{x:0,y:200},radius:8}};
 for(const arc of [
  {startAngle:0,endAngle:0,direction:'ccw'},
  {startAngle:0,endAngle:360,direction:'ccw'},
  {startAngle:12,endAngle:372,direction:'cw'},
  {startAngle:NaN,endAngle:20,direction:'ccw'},
  {startAngle:0,endAngle:20,direction:'left'},
  {startAngle:0,endAngle:20},null,
  {startAngle:'0',endAngle:20,direction:'ccw'}
 ])assert.throws(()=>solve(withArc(b,arc)),String(arc&&JSON.stringify(arc)));
});
test('translation and rotation preserve branch membership when the given arc angles transform',()=>{
 const b=base(),a=contactAngle(b,solve(b).candidates[0]);
 const original=solve(withArc(b,sector(a)));
 const theta=52*Math.PI/180,deg=52;
 const c=Math.cos(theta),s=Math.sin(theta),shift=p=>({
  x:c*p.x-s*p.y+120,y:s*p.x+c*p.y-90
 });
 const rotated={...b,segment:{a:shift(b.segment.a),b:shift(b.segment.b)},
  circle:{center:shift(b.circle.center),radius:8,arc:sector(a+deg)}};
 const transformed=solve(rotated);
 assert.deepEqual(ids(transformed),ids(original));
 near(transformed.candidates[0].center.x,shift(original.candidates[0].center).x);
 near(transformed.candidates[0].center.y,shift(original.candidates[0].center).y);
});
test('source input is immutable; full circles and finite arcs remain deterministic',()=>{
 const b=base(),a=contactAngle(b,solve(b).candidates[0]);
 const input=withArc(b,sector(a)),before=JSON.stringify(input);
 assert.deepEqual(solve(input),solve(input));
 assert.equal(JSON.stringify(input),before);
});
