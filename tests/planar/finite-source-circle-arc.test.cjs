'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {circleCircleFilletCenters:solve}=require('../../engines/planar/circle-circle-fillet.cjs');
const {chooseDirectedFillet:choose}=require('../../engines/planar/directed-circle-fillet.cjs');
const {adaptDirectedFillet}=require('../../workbench/verified-teaching-plan.cjs');
const base=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10,
 firstMode:'external',secondMode:'external'});
const arc=(start,end,direction='ccw')=>({startAngle:start,endAngle:end,direction});
const withFirst=(firstArc)=>({...base(),first:{...base().first,arc:firstArc}});
const withSecond=(secondArc)=>({...base(),second:{...base().second,arc:secondArc}});
const ids=r=>r.candidates.map(c=>c.id);
test('backwards compatibility: no arc means two full source circles and original branch IDs',()=>{
 const original=solve(base());
 assert.equal(original.status,'multiple');
 assert.deepEqual(ids(original),['center-1','center-2']);
 assert.equal(original.finiteSourceArcCount,0);
 assert.ok(original.candidates.every(c=>c.sourceArcRangeVerified));
});
test('first arc 300° to 330° selects lower candidate without renumbering',()=>{
 const r=solve(withFirst(arc(300,330)));
 assert.equal(r.status,'unique');
 assert.deepEqual(ids(r),['center-1']);
 assert.equal(r.finiteSourceArcCount,1);
 assert.deepEqual(r.excludedCandidates,[{id:'center-2',invalidSources:['first']}]);
 assert.equal(r.candidates[0].sourceArcRangeVerified,true);
});
test('first arc 30° to 60° selects upper center-2 even if center-1 excluded',()=>{
 const r=solve(withFirst(arc(30,60)));
 assert.equal(r.status,'unique');
 assert.deepEqual(ids(r),['center-2']);
 assert.deepEqual(r.excludedCandidates.map(c=>c.id),['center-1']);
});
test('counterclockwise short arc crosses 0 degrees; only upper contact survives',()=>{
 const r=solve(withFirst(arc(350,80,'ccw')));
 assert.deepEqual(ids(r),['center-2']);
 assert.ok(r.candidates[0].sourceArcChecks.first);
});
test('clockwise short arc crosses 0 degrees; only lower contact survives',()=>{
 const r=solve(withFirst(arc(20,290,'cw')));
 assert.deepEqual(ids(r),['center-1']);
});
test('second source alone filters correctly by its own center and radial contact',()=>{
 const r=solve(withSecond(arc(215,245)));
 assert.deepEqual(ids(r),['center-1']);
 assert.deepEqual(r.excludedCandidates,[{id:'center-2',invalidSources:['second']}]);
});
test('opposing finite arc restrictions exclude every otherwise valid whole-circle center',()=>{
 const b=base();
 b.first.arc=arc(30,60);
 b.second.arc=arc(215,245);
 const r=solve(b);
 assert.equal(r.status,'none');assert.equal(r.candidateCount,0);
 assert.deepEqual(r.candidates,[]);
 assert.equal(r.excludedCandidates.length,2);
 assert.equal(r.finiteSourceArcCount,2);
 assert.match(r.reason,/outside a given finite source arc/);
 const directed=choose({...b,branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
 assert.equal(directed.status,'none');
 assert.equal(directed.geometry,null);assert.equal(directed.g1Verified,false);
 assert.deepEqual(directed.steps,[]);
});
test('two compatible finite arcs preserve a legitimate direction-checked G1 connection',()=>{
 const b=base();
 b.first.arc=arc(300,330);
 b.second.arc=arc(215,245);
 const r=solve(b);
 assert.equal(r.status,'unique');assert.deepEqual(ids(r),['center-1']);
 assert.equal(r.finiteSourceArcCount,2);
 const result=choose({...b,branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
 assert.equal(result.status,'selected');
 assert.equal(result.g1Verified,true);
 assert.equal(result.sourceFiniteArcCount,2);
 assert.equal(result.sourceArcRangeVerified,true);
 assert.equal(result.steps[2].sourceArcRangeVerified,true);
 assert.match(result.steps[2].reason,/给定有限圆弧范围/);
 const teaching=adaptDirectedFillet('circles',{...b,branchId:'center-1',
  direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
 assert.equal(teaching.readiness,'ready');
 assert.equal(teaching.steps.length,4);
});
test('filtered-away center cannot be selected after source arc clipping',()=>{
 const b=withFirst(arc(30,60));
 assert.throws(()=>choose({...b,branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'}),/selected branchId/);
});
test('endpoint contact is accepted as boundary with numerical tolerance, nearby missing sector is not',()=>{
 const b=base(),all=solve(b);
 const c=all.candidates.find(x=>x.id==='center-1');
 const angle=Math.atan2(c.contacts.first.y-b.first.center.y,
  c.contacts.first.x-b.first.center.x)*180/Math.PI;
 const edge=solve(withFirst(arc(angle,angle+20)));
 assert.deepEqual(ids(edge),['center-1']);
 const shifted=solve(withFirst(arc(angle+0.2,angle+20)));
 assert.equal(shifted.status,'none');
});
test('long 330-degree finite arc stays long; must not silently shorten to smaller arc',()=>{
 const r=solve(withFirst(arc(20,350)));
 assert.equal(r.status,'multiple');
 assert.deepEqual(ids(r),['center-1','center-2']);
});
test('invalid arc metadata is rejected even before geometric candidates are searched',()=>{
 for(const bad of [
  arc(0,0),arc(10,370),arc(0,360),arc(350,20,'left'),
  arc(NaN,30),arc(10,Infinity),{},null,
  {startAngle:'0',endAngle:20,direction:'ccw'},
  {startAngle:0,endAngle:20},
 ]){
  assert.throws(()=>solve(withFirst(bad)),String(JSON.stringify(bad)));
 }
});
test('input objects are never mutated while finite source arcs are filtered',()=>{
 const b=base();b.first.arc=arc(350,80);b.second.arc=arc(215,245);
 const before=JSON.stringify(b);
 solve(b);assert.equal(JSON.stringify(b),before);
});
test('rotation and translation preserve selected relative source-sector membership',()=>{
 const b=base();b.first.arc=arc(300,330);b.second.arc=arc(215,245);
 const before=solve(b);
 const rotate=(p,a,tx,ty)=>({x:Math.cos(a)*p.x-Math.sin(a)*p.y+tx,
  y:Math.sin(a)*p.x+Math.cos(a)*p.y+ty});
 const t=45*Math.PI/180;
 const transformed={...b,
  first:{center:rotate(b.first.center,t,30,-25),radius:5,
   arc:arc(345,375)},
  second:{center:rotate(b.second.center,t,30,-25),radius:5,
   arc:arc(260,290)}
 };
 assert.deepEqual(ids(solve(transformed)),ids(before));
});
