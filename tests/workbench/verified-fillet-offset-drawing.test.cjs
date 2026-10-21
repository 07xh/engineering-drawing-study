'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {gradeFilletOffsetLines:grade}=require('../../workbench/verified-fillet-offset-drawing.cjs');
const {chooseFiniteTwoSegmentArc}=require('../../engines/planar/directed-two-segment-fillet.cjs');
const input=()=>({
 first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'
});
const opts={origin:{x:360,y:220},scale:8,revision:7};
const expected=(args=input(),options=opts)=>{
 const result=chooseFiniteTwoSegmentArc(args);
 assert.equal(result.status,'selected');
 return result.steps.filter(s=>s.kind==='offset-line').map(step=>({
  revision:options.revision,
  from:{x:options.origin.x+step.geometry.a.x*options.scale,
   y:options.origin.y-step.geometry.a.y*options.scale},
  to:{x:options.origin.x+step.geometry.b.x*options.scale,
   y:options.origin.y-step.geometry.b.y*options.scale}
 }));
};
test('two actual DA-02 offset construction strokes pass, but never claim entire curved answer',()=>{
 const result=grade(input(),expected(),opts);
 assert.equal(result.status,'correct');assert.equal(result.matchedCount,2);
 assert.equal(result.targetCount,2);assert.equal(result.extraCount,0);
 assert.equal(result.gradeScope,'two-real-offset-lines-only');
 assert.match(result.reason,/最终圆弧仍需分别验证/);
});
test('reverse endpoints and extend collinear offset strokes pass mm geometric checks',()=>{
 const e=expected().map(line=>{
  const dx=line.to.x-line.from.x,dy=line.to.y-line.from.y;
  return {...line,from:{x:line.to.x+dx/5,y:line.to.y+dy/5},
   to:{x:line.from.x-dx/6,y:line.from.y-dy/6}};
 });
 assert.equal(grade(input(),e,opts).status,'correct');
});
test('one correctly constructed offset is a partial proof, not a verified solution',()=>{
 const r=grade(input(),expected().slice(0,1),opts);
 assert.equal(r.status,'partial');assert.equal(r.matchedCount,1);
 assert.equal(r.remainingIds.length,1);
});
test('duplicate offset strokes do not count twice and are reported extra',()=>{
 const e=expected();
 const r=grade(input(),[e[0],{...e[0]}],opts);
 assert.equal(r.status,'partial');assert.equal(r.matchedCount,1);
 assert.equal(r.extraCount,1);
});
test('wrong perpendicular direction fails model-incidence checks even when crossing',()=>{
 const e=expected();
 const invalid={revision:7,from:{x:200,y:140},to:{x:200,y:380}};
 const r=grade(input(),[invalid,e[1]],opts);
 assert.ok(r.matchedCount<2);
 assert.notEqual(r.status,'correct');
});
test('valid-looking screen stroke beyond 1mm tolerance cannot be accepted',()=>{
 const e=expected();
 const bad={...e[0],from:{x:e[0].from.x,y:e[0].from.y+16},
  to:{x:e[0].to.x,y:e[0].to.y+16}};
 const r=grade(input(),[bad,e[1]],opts);
 assert.equal(r.status,'partial');assert.equal(r.matchedCount,1);
});
test('changing only display scale preserves mm-based correctness',()=>{
 const twice={...opts,scale:16};
 assert.equal(grade(input(),expected(input(),twice),twice).status,'correct');
});
test('branch, arc direction, travel and size changes recompute math each call',()=>{
 for(const args of [
  {...input(),branchId:undefined},
  {...input(),direction:undefined},
  {...input(),firstTravel:undefined},
  {...input(),firstTravel:'reverse'},
  {...input(),first:{a:{x:-5,y:0},b:{x:5,y:0}}}
 ]){
  const res=grade(args,expected(),opts);
  assert.equal(res.status,'not-verified');
  assert.equal(res.matchedCount,0);
 }
});
test('stale revision, NaN endpoints or invalid origin/scale fail closed',()=>{
 const e=expected();
 assert.throws(()=>grade(input(),[{...e[0],revision:6}],opts),/stale/);
 assert.throws(()=>grade(input(),[{...e[0],from:{x:NaN,y:2}}],opts),/invalid/);
 assert.throws(()=>grade(input(),e,{...opts,scale:0}),/scale/);
 assert.throws(()=>grade(input(),e,{...opts,origin:{x:Infinity,y:0}}),/origin/);
 assert.throws(()=>grade(input(),e,{...opts,toleranceMm:-1}),/tolerance/);
});
test('no unexpected input mutations; empty drawings cannot produce a pass',()=>{
 const a=input(),e=expected(),prior=JSON.stringify({a,e});
 const r=grade(a,[],opts);
 assert.equal(r.status,'incorrect');assert.equal(r.matchedCount,0);
 grade(a,e,opts);
 assert.equal(JSON.stringify({a,e}),prior);
});
test('continuous, unstable or no solution never produces a drawable target',()=>{
 const base=input();
 for(const bad of [
  {...base,second:{a:{x:-20,y:20},b:{x:20,y:20}},firstSide:1,secondSide:-1},
  {...base,first:{a:{x:-1,y:0},b:{x:1,y:0}}}
 ]){
  const r=grade(bad,[],opts);
  assert.equal(r.status,'not-verified');
  assert.equal(r.targetCount,0);
 }
});
