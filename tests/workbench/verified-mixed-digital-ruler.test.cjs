'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {constructParallelLine,constructConcentricCircle,snapChosenFilletCenter:snap}=
 require('../../workbench/verified-ruler-tools.cjs');
const {gradeStudentAuxiliaries:grade}=
 require('../../workbench/verified-ruler-steps.cjs');
const {assessFilletStudentProgress:assess}=
 require('../../workbench/verified-student-fillet-progress.cjs');
const {finiteSegmentCircleFillets:solve}=
 require('../../engines/planar/segment-circle-fillet.cjs');
const {chooseDirectedSegmentCircleFillet:directed}=
 require('../../engines/planar/directed-segment-circle-fillet.cjs');
const sheet={origin:{x:360,y:220},scale:8,revision:12};
const args=()=>({segment:{a:{x:-25,y:0},b:{x:25,y:0}},
 circle:{center:{x:0,y:5},radius:8},filletRadius:10,side:1,
 branchId:'candidate-1',direction:'ccw',lineTravel:'forward',
 knownCircleTravel:'cw'});
const candidate=(a=args())=>solve(a).candidates.find(c=>c.id===a.branchId);
function auxiliary(a=args()){
 const solved=solve(a);
 return [
  {...constructParallelLine(a.segment,a.side*a.filletRadius,{revision:12}),sourceId:'first'},
  {...constructConcentricCircle(a.circle,solved.auxiliary.centerLocusRadius,
   {revision:12}),sourceId:'second'}
 ];
}
const contacts=(c)=>[
 {kind:'tangent-point',sourceId:'first',point:{...c.lineContact},revision:12},
 {kind:'tangent-point',sourceId:'second',point:{...c.circleContact},revision:12}
];
function stroke(a=args()){
 const g=directed(a).geometry.data;
 return {revision:12,points:Array.from({length:49},(_,i)=>{
  const theta=(g.startAngle+(g.endAngle-g.startAngle)*i/48)*Math.PI/180;
  return {x:360+8*(g.center.x+g.radius*Math.cos(theta)),
    y:220-8*(g.center.y+g.radius*Math.sin(theta))};
 })};
}
function complete(a=args()){
 const c=candidate(a);
 return {auxiliaries:auxiliary(a),centerMark:{...c.center,revision:12},
  tangentMarks:contacts(c),arcStrokes:[stroke(a)]};
}
test('real mixed fillet independent line offset and concentric circle pass as two model-mm constructions',()=>{
 const a=args(),g=grade('segment-circle',a,auxiliary(a),
  {branchId:a.branchId,revision:12});
 assert.equal(g.status,'correct');assert.equal(g.matchedCount,2);
 assert.equal(g.extraCount,0);assert.equal(g.arcG1Verified,false);
 assert.equal(g.completeProblemVerified,false);
});
test('real mixed center tap requires student branch even when unique candidate remains',()=>{
 const a=args(),c=candidate(a);
 const marked={...c.center,revision:12};
 assert.equal(snap('segment-circle',a,marked,{branchId:c.id,revision:12}).status,'verified-center');
 assert.equal(snap('segment-circle',a,marked,{revision:12}).status,'branch-required');
 assert.equal(snap('segment-circle',a,marked,{branchId:'fake',revision:12}).status,'invalid-branch');
});
test('all four real mixed construction stages pass only as supported scopes, NOT textbook answer',()=>{
 const a=args(),d=complete(a),p=assess('segment-circle',a,d,
  {...sheet,branchId:a.branchId});
 assert.equal(p.status,'all-supported-stages-verified');
 assert.equal(p.verifiedCount,4);
 assert.deepEqual(p.stages.map(s=>s.ok),[true,true,true,true]);
 assert.equal(p.fullProblemVerified,false);
 assert.equal(p.sourceFiniteCircularArcsVerified,false);
});
test('short valid source finite arc preserves real candidate and its range-scoped four-stage check',()=>{
 const a=args();a.circle.arc={startAngle:155,endAngle:175,direction:'ccw'};
 const c=candidate(a);assert.ok(c);
 const p=assess('segment-circle',a,complete(a),{...sheet,branchId:a.branchId});
 assert.equal(p.verifiedCount,4);
 assert.equal(p.finiteSourceArcCount,1);
 assert.equal(p.sourceFiniteCircularArcsVerified,true);
 assert.equal(p.fullProblemVerified,false);
});
test('a clipped finite source arc rejects all old circle-center, guide, contact and curve credit',()=>{
 const a=args(),d=complete(a);
 a.circle.arc={startAngle:45,endAngle:90,direction:'ccw'};
 const p=assess('segment-circle',a,d,{...sheet,branchId:a.branchId});
 assert.equal(p.verifiedCount,0);assert.equal(p.status,'in-progress');
 assert.equal(snap('segment-circle',a,d.centerMark,{branchId:a.branchId,revision:12}).status,
  'not-gradeable');
 assert.equal(grade('segment-circle',a,d.auxiliaries,{branchId:a.branchId,revision:12}).status,
  'not-gradeable');
});
test('wrong signed side and wrong concentric compass radius are independently rejected',()=>{
 const a=args(),d=auxiliary(a);
 d[0]={...constructParallelLine(a.segment,-a.filletRadius,{revision:12}),sourceId:'first'};
 let p=grade('segment-circle',a,d,{branchId:a.branchId,revision:12});
 assert.equal(p.status,'partial');assert.deepEqual(p.remainingSources,['first']);
 d[0]=auxiliary(a)[0];
 d[1]={...constructConcentricCircle(a.circle,a.circle.radius,{revision:12}),sourceId:'second'};
 p=grade('segment-circle',a,d,{branchId:a.branchId,revision:12});
 assert.equal(p.status,'partial');assert.deepEqual(p.remainingSources,['second']);
});
test('duplicate guide cannot fill two source slots',()=>{
 const a=args(),d=auxiliary(a);const result=grade('segment-circle',a,[d[0],d[0]],
  {branchId:a.branchId,revision:12});
 assert.equal(result.matchedCount,1);assert.equal(result.extraCount,1);
 assert.notEqual(result.status,'correct');
});
test('wrong branch and student mark 1.5mm off the real center cannot silently snap',()=>{
 const a=args(),c=candidate(a);
 assert.equal(snap('segment-circle',a,{...c.center,x:c.center.x+1.5,revision:12},
  {branchId:a.branchId,revision:12}).status,'incorrect');
 const p=assess('segment-circle',a,complete(a),{...sheet,branchId:'candidate-2'});
 assert.ok(p.verifiedCount<4);
});
test('old student revision fails closed, not silently reused after radius change',()=>{
 const a=args(),d=complete(a);
 assert.throws(()=>assess('segment-circle',a,d,{...sheet,revision:13,
  branchId:a.branchId}),/stale/);
});
test('missing G1 source travel cannot earn final arc while contacts and ruler remain valid',()=>{
 const a=args(),d=complete(a);delete a.knownCircleTravel;
 const p=assess('segment-circle',a,d,{...sheet,branchId:a.branchId});
 assert.equal(p.stages[3].ok,false);assert.equal(p.verifiedCount,3);
});
test('mathematical grading is deterministic and does not mutate user or solver inputs',()=>{
 const a=args(),d=complete(a),snapshot=JSON.stringify({a,d});
 assert.deepEqual(assess('segment-circle',a,d,{...sheet,branchId:a.branchId}),
  assess('segment-circle',a,d,{...sheet,branchId:a.branchId}));
 assert.equal(JSON.stringify({a,d}),snapshot);
});
