'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {gradeStudentTangentPoints:gradeContacts}=
 require('../../workbench/verified-tangent-point-drawing.cjs');
const {gradeFilletArcDrawing:gradeArc}=
 require('../../workbench/verified-fillet-arc-drawing.cjs');
const {finiteSegmentCircleFillets}=require('../../engines/planar/segment-circle-fillet.cjs');
const {chooseDirectedSegmentCircleFillet}=require('../../engines/planar/directed-segment-circle-fillet.cjs');
const sheet={origin:{x:360,y:220},scale:8,revision:12};
const base=()=>({segment:{a:{x:-25,y:0},b:{x:25,y:0}},
 circle:{center:{x:0,y:5},radius:8},filletRadius:10,side:1});
const directed=()=>({...base(),branchId:'candidate-1',direction:'ccw',
 lineTravel:'forward',knownCircleTravel:'cw'});
const marks=(candidate,rev=12)=>[
 {kind:'tangent-point',sourceId:'first',point:{...candidate.lineContact},revision:rev},
 {kind:'tangent-point',sourceId:'second',point:{...candidate.circleContact},revision:rev}
];
function selected(args=directed()){
 const result=chooseDirectedSegmentCircleFillet(args);
 assert.equal(result.status,'selected');assert.equal(result.g1Verified,true);
 return result;
}
function stroke(g,revision=12,count=45){
 return {revision,points:Array.from({length:count},(_,i)=>{
  const theta=(g.data.startAngle+(g.data.endAngle-g.data.startAngle)*i/(count-1))*Math.PI/180;
  return {x:sheet.origin.x+sheet.scale*(g.data.center.x+g.data.radius*Math.cos(theta)),
   y:sheet.origin.y-sheet.scale*(g.data.center.y+g.data.radius*Math.sin(theta))};
 })};
}
const classify=(args,points)=>gradeContacts('segment-circle',args,points,
 {branchId:args.branchId||'candidate-1',revision:12});
const checkArc=(args,points)=>gradeArc(args,points,{...sheet,kind:'segment-circle'});
test('real bounded line and full-circle candidate yields two independent student contacts',()=>{
 const a=base(),s=finiteSegmentCircleFillets(a),c=s.candidates[0];
 assert.equal(s.status,'multiple');assert.equal(c.sourceArcRangeVerified,true);
 const r=classify({...a,branchId:c.id},marks(c));
 assert.equal(r.status,'correct');assert.equal(r.matchedCount,2);
 assert.equal(r.sourceBoundsVerified,true);assert.equal(r.arcG1Verified,false);
 assert.equal(r.completeProblemVerified,false);
});
test('student tangent marks can be checked before deciding directed arc traversal',()=>{
 const a=base(),c=finiteSegmentCircleFillets(a).candidates[0];
 assert.equal(classify({...a,branchId:c.id},marks(c)).status,'correct');
});
test('true directed mixed hand-drawn arc passes radius, continuous trace, signed sweep and G1',()=>{
 const a=directed(),s=selected(a),r=checkArc(a,stroke(s.geometry));
 assert.equal(r.status,'correct');assert.equal(r.geometryValidated,true);
 assert.equal(r.sourceProofVerified,true);assert.equal(r.sourceBoundsVerified,true);
 assert.match(r.reason,/给定有限圆弧范围/);
});
test('source finite arc keeps only genuine contact and cannot renumber the candidate',()=>{
 const a=directed();
 a.circle.arc={startAngle:155,endAngle:175,direction:'ccw'};
 const c=finiteSegmentCircleFillets(a);
 assert.deepEqual(c.candidates.map(x=>x.id),['candidate-1']);
 assert.equal(classify(a,marks(c.candidates[0])).status,'correct');
 assert.equal(checkArc(a,stroke(selected(a).geometry)).status,'correct');
});
test('source arc clipping to noncontact sector forbids previously correct student points and curve',()=>{
 const a=directed(),old=selected(a),full=finiteSegmentCircleFillets(a);
 a.circle.arc={startAngle:50,endAngle:90,direction:'ccw'};
 const clipped=finiteSegmentCircleFillets(a);
 assert.equal(clipped.status,'none');
 assert.equal(classify(a,marks(full.candidates[0])).status,'not-gradeable');
 const r=checkArc(a,stroke(old.geometry));
 assert.equal(r.status,'not-verified');assert.equal(r.geometryValidated,false);
});
test('two wrong source IDs cannot masquerade as correct contacts',()=>{
 const a=directed(),c=finiteSegmentCircleFillets(a).candidates[0];
 const tapped=marks(c).map(m=>({...m,sourceId:m.sourceId==='first'?'second':'first'}));
 const r=classify(a,tapped);
 assert.equal(r.status,'incorrect');assert.equal(r.matchedCount,0);
});
test('duplicates and missing source do not earn two marks',()=>{
 const a=directed(),c=finiteSegmentCircleFillets(a).candidates[0];
 const once=marks(c)[0],r=classify(a,[once,once]);
 assert.equal(r.status,'partial');assert.equal(r.extraCount,1);
 assert.deepEqual(r.remainingSources,['second']);
});
test('extension of given segment is rejected even when point lies on its infinite support line',()=>{
 const a=directed(),c=finiteSegmentCircleFillets(a).candidates[0],tapped=marks(c);
 tapped[0].point.x=30;
 const r=classify(a,tapped);
 assert.equal(r.status,'partial');assert.deepEqual(r.remainingSources,['first']);
});
test('wrong candidate branch never autosnaps to visually nearest valid contact',()=>{
 const a=directed(),c=finiteSegmentCircleFillets(a).candidates[0];
 a.branchId='candidate-2';
 const r=classify(a,marks(c));assert.notEqual(r.status,'correct');
 assert.equal(gradeContacts('segment-circle',a,marks(c),{revision:12}).status,'branch-required');
});
test('missing original source travels blocks student directed arc despite valid pair of points',()=>{
 const a=directed(),s=selected(a),drawn=stroke(s.geometry);
 delete a.lineTravel;
 const r=checkArc(a,drawn);
 assert.equal(r.status,'not-verified');assert.equal(r.sourceProofVerified,false);
});
test('reversed pen direction cannot earn a correct directed arc',()=>{
 const a=directed(),drawn=stroke(selected(a).geometry);
 const r=checkArc(a,{...drawn,points:drawn.points.slice().reverse()});
 assert.equal(r.status,'incorrect');assert.ok(r.backwardMotionDegrees>0);
});
test('a straight chord between correct contacts is not a circle arc',()=>{
 const a=directed(),s=selected(a);
 const {first,second}=s.contacts;
 const drawn={revision:12,points:Array.from({length:45},(_,i)=>{
  const t=i/44;
  return {x:360+8*(first.x*(1-t)+second.x*t),
   y:220-8*(first.y*(1-t)+second.y*t)};
 })};
 const r=checkArc(a,drawn);assert.equal(r.status,'incorrect');
 assert.ok(r.maxRadialResidualMm>0);
});
test('stale revision, bad point and oversized tolerance fail closed',()=>{
 const a=directed(),c=finiteSegmentCircleFillets(a).candidates[0];
 assert.throws(()=>classify(a,marks(c,11)),/stale/);
 assert.throws(()=>gradeContacts('segment-circle',a,marks(c),
  {branchId:a.branchId,revision:12,toleranceMm:4}),/tolerance/);
 assert.throws(()=>checkArc(a,{...stroke(selected(a).geometry),revision:11}),/stale/);
});
test('no mutation of input mathematics or student pen samples',()=>{
 const a=directed(),c=finiteSegmentCircleFillets(a).candidates[0],
  pts=marks(c),arc=stroke(selected(a).geometry);
 const before=JSON.stringify({a,pts,arc});
 classify(a,pts);checkArc(a,arc);
 assert.equal(JSON.stringify({a,pts,arc}),before);
});
