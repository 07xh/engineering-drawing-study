'use strict';
/**
 * P0 R1/R2/R3 integration: a clipped GIVEN source arc must be honored in the
 * real 02 solver, the R1 teaching proof, V5 animation and student grading.
 * Tests use genuine analytic candidates, not hand-authored expected centers.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const {finiteSegmentCircleFillets}=require('../../engines/planar/segment-circle-fillet.cjs');
const {adaptDirectedFillet}=require('../../workbench/verified-teaching-plan.cjs');
const {filletTimeline}=require('../../workbench/verified-plan-v5-bridge.cjs');
const {gradeStudentTangentPoints}=require('../../workbench/verified-tangent-point-drawing.cjs');
const {snapChosenFilletCenter}=require('../../workbench/verified-ruler-tools.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const SHEET={origin:{x:360,y:220},scale:8};
const circleArgs=()=>({
 first:{center:{x:0,y:0},radius:5,arc:{startAngle:300,endAngle:330,direction:'ccw'}},
 second:{center:{x:20,y:0},radius:5,arc:{startAngle:215,endAngle:245,direction:'ccw'}},
 filletRadius:10,firstMode:'external',secondMode:'external',
 branchId:'center-1',direction:'cw',
 knownFirstTravel:'ccw',knownSecondTravel:'ccw'
});
const mixedArgs=()=>({
 segment:{a:{x:-15,y:0},b:{x:15,y:0}},
 circle:{center:{x:0,y:5},radius:8},
 filletRadius:3,side:1,branchId:'candidate-1',
 direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'
});
const contactAngle=(circle,p)=>
 Math.atan2(p.y-circle.center.y,p.x-circle.center.x)*180/Math.PI;
const studentMarks=(first,second,revision=5)=>[
 {kind:'tangent-point',sourceId:'first',point:{...first},revision},
 {kind:'tangent-point',sourceId:'second',point:{...second},revision}
];
test('two bounded GIVEN circle arcs produce same selected G1 branch and explicit R1/V5 provenance',()=>{
 const input=circleArgs(),solved=circleCircleFilletCenters(input);
 assert.equal(solved.status,'unique');
 assert.deepEqual(solved.candidates.map(x=>x.id),['center-1']);
 const p=adaptDirectedFillet('circles',input,{revision:5});
 assert.equal(p.readiness,'ready');
 assert.equal(p.result.sourceFiniteArcCount,2);
 assert.equal(p.result.sourceArcRangeVerified,true);
 assert.equal(p.result.sourceBoundsProof,'recomputed-two-source-circle-contact-membership');
 assert.equal(p.stepCount,4);
 assert.equal(p.result.arc.direction,'cw');
 const v=filletTimeline('circles',input,SHEET,5);
 assert.equal(v.status,'ready');assert.equal(v.mathematicallyVerified,true);
 assert.deepEqual(v.sourceBounds,{
  finiteGivenCircleArcCount:2,contactArcMembershipVerified:true,
  finiteSegmentContactVerified:null,
  evidence:'recomputed-two-source-circle-contact-membership'
 });
 assert.equal(v.selectedBranchId,'center-1');
 assert.equal(v.steps.at(-1).actions[0].kind,'arc');
 const d=Motion.actionShapeAttrs(v.steps.at(-1).actions[0],1);
 assert.match(d.d,/ A /);
 const chosen=solved.candidates[0],marks=studentMarks(chosen.contacts.first,chosen.contacts.second);
 const grade=gradeStudentTangentPoints('circles',input,marks,{branchId:'center-1',revision:5});
 assert.equal(grade.status,'correct');assert.equal(grade.contactLocationsVerified,true);
 assert.equal(grade.arcG1Verified,false);assert.equal(grade.completeProblemVerified,false);
});
test('the same circle without a finite sector carries zero clipped-arcs, not a fabricated proof',()=>{
 const a=circleArgs();delete a.first.arc;delete a.second.arc;
 const p=adaptDirectedFillet('circles',a),v=filletTimeline('circles',a,SHEET);
 assert.equal(p.readiness,'ready');assert.equal(p.result.sourceFiniteArcCount,0);
 assert.equal(p.result.sourceArcRangeVerified,true);
 assert.equal(v.sourceBounds.finiteGivenCircleArcCount,0);
 assert.equal(v.sourceBounds.contactArcMembershipVerified,true);
});
test('one finite source arc excludes original selected center, with no fake teaching steps',()=>{
 const a=circleArgs();a.first.arc={startAngle:30,endAngle:60,direction:'ccw'};
 delete a.second.arc;
 const centers=circleCircleFilletCenters(a);
 assert.deepEqual(centers.candidates.map(c=>c.id),['center-2']);
 assert.throws(()=>adaptDirectedFillet('circles',a,{revision:5}),/selected branchId/);
 assert.throws(()=>filletTimeline('circles',a,SHEET,5),/selected branchId/);
 const old={x:-1,y:-1,revision:5};
 assert.equal(snapChosenFilletCenter('circles',a,old,
  {branchId:'center-1',revision:5}).status,'invalid-branch');
 assert.equal(gradeStudentTangentPoints('circles',a,[],{
  branchId:'center-1',revision:5}).status,'invalid-branch');
});
test('incompatible finite given arcs leave no valid center, no V5 frames or student credit',()=>{
 const a=circleArgs();a.first.arc={startAngle:30,endAngle:60,direction:'ccw'};
 const p=adaptDirectedFillet('circles',a,{revision:5}),v=filletTimeline('circles',a,SHEET,5);
 assert.equal(p.readiness,'blocked');assert.equal(p.stepCount,0);
 assert.equal(v.status,'not-verified');assert.equal(v.steps.length,0);
 assert.equal(v.mathematicallyVerified,false);
 assert.equal(circleCircleFilletCenters(a).status,'none');
 assert.equal(gradeStudentTangentPoints('circles',a,[],{
  branchId:'center-1',revision:5}).status,'not-gradeable');
});
test('finite segment plus finite circle arc retains identical source-bound proof in 02/R1/V5',()=>{
 const a=mixedArgs(),raw=finiteSegmentCircleFillets(a);
 const c=raw.candidates.find(x=>x.id==='candidate-1');
 assert.ok(c);
 const angle=contactAngle(a.circle,c.circleContact);
 a.circle.arc={startAngle:angle-9,endAngle:angle+9,direction:'ccw'};
 const filtered=finiteSegmentCircleFillets(a);
 assert.deepEqual(filtered.candidates.map(x=>x.id),['candidate-1']);
 const r=adaptDirectedFillet('segment-circle',a,{revision:5});
 assert.equal(r.readiness,'ready');assert.equal(r.result.sourceFiniteArcCount,1);
 assert.equal(r.result.finiteSegmentContactVerified,true);
 assert.equal(r.result.sourceArcRangeVerified,true);
 const v=filletTimeline('segment-circle',a,SHEET,5);
 assert.equal(v.status,'ready');assert.equal(v.steps.length,5);
 assert.deepEqual(v.sourceBounds,{
  finiteGivenCircleArcCount:1,contactArcMembershipVerified:true,
  finiteSegmentContactVerified:true,evidence:null
 });
 const marks=studentMarks(filtered.candidates[0].lineContact,
  filtered.candidates[0].circleContact);
 const grade=gradeStudentTangentPoints('segment-circle',a,marks,{
  branchId:'candidate-1',revision:5});
 assert.equal(grade.status,'correct');assert.equal(grade.sourceBoundsVerified,true);
 assert.equal(grade.completeProblemVerified,false);
});
test('mixed finite-sector source removes previously valid branch without changing branch identity',()=>{
 const a=mixedArgs(),raw=finiteSegmentCircleFillets(a);
 const other=raw.candidates.find(x=>x.id==='candidate-2');
 assert.ok(other);
 const ang=contactAngle(a.circle,other.circleContact);
 a.circle.arc={startAngle:ang-9,endAngle:ang+9,direction:'ccw'};
 const filtered=finiteSegmentCircleFillets(a);
 assert.deepEqual(filtered.candidates.map(x=>x.id),['candidate-2']);
 assert.throws(()=>filletTimeline('segment-circle',a,SHEET,5),/selected branchId/);
 assert.equal(gradeStudentTangentPoints('segment-circle',a,[],{
  branchId:'candidate-1',revision:5}).status,'invalid-branch');
});
test('a too-short source segment excludes circle-sector contact regardless of perfect circle geometry',()=>{
 const a=mixedArgs(),original=finiteSegmentCircleFillets(a).candidates[0];
 const ang=contactAngle(a.circle,original.circleContact);
 a.circle.arc={startAngle:ang-9,endAngle:ang+9,direction:'ccw'};
 a.segment={a:{x:-2,y:0},b:{x:2,y:0}};
 const g=filletTimeline('segment-circle',a,SHEET,5);
 assert.equal(g.status,'not-verified');assert.deepEqual(g.steps,[]);
 assert.equal(gradeStudentTangentPoints('segment-circle',a,[],{
  branchId:'candidate-1',revision:5}).status,'not-gradeable');
});
test('angle wrap and translation preserve contact proof without exposing full-circle artwork',()=>{
 const a=circleArgs(),original=adaptDirectedFillet('circles',a);
 assert.equal(original.readiness,'ready');
 const shift=p=>({x:p.x+100,y:p.y-70});
 const b={...a,first:{...a.first,center:shift(a.first.center)},
  second:{...a.second,center:shift(a.second.center)}};
 const translated=adaptDirectedFillet('circles',b);
 assert.equal(translated.result.sourceFiniteArcCount,2);
 assert.equal(translated.readiness,'ready');
 assert.equal(translated.result.sourceArcRangeVerified,true);
 assert.equal(translated.result.arc.direction,original.result.arc.direction);
 assert.equal(JSON.stringify(a.first.arc),JSON.stringify(circleArgs().first.arc));
});
