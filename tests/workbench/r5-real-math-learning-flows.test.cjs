'use strict';
/**
 * R5 regression: REAL mathematical input -> R1 proof -> V5 drawing
 * -> student mathematical grader. No synthetic SVG fixture nor browser CDN.
 * Scope: exact P0 point and selected 02 fillets, not whole textbook/AI/CAD.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {solveProjection}=require('../../engines/projection/point-projection.cjs');
const {chooseFiniteTwoSegmentArc}=require('../../engines/planar/directed-two-segment-fillet.cjs');
const {chooseDirectedFillet}=require('../../engines/planar/directed-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../../engines/planar/two-segment-fillet.cjs');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const {pointTimeline,filletTimeline}=require('../../workbench/verified-plan-v5-bridge.cjs');
const {gradeProjectionDrawing}=require('../../workbench/verified-projection-drawing.cjs');
const {gradeFilletOffsetLines}=require('../../workbench/verified-fillet-offset-drawing.cjs');
const {gradeFilletArcDrawing}=require('../../workbench/verified-fillet-arc-drawing.cjs');
const {gradeStudentAuxiliaries}=require('../../workbench/verified-ruler-steps.cjs');
const {constructParallelLine,constructConcentricCircle,snapChosenFilletCenter}=
 require('../../workbench/verified-ruler-tools.cjs');
const Motion=require('../../workbench/teaching-motion-v5.js');
const sheet={origin:{x:360,y:220},scale:8};
const rev=19;
const segments=()=>({first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10,
 branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'});
const circles=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10,
 firstMode:'external',secondMode:'external',
 branchId:'center-1',direction:'cw',
 knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
const toScreen=p=>({x:sheet.origin.x+sheet.scale*p.x,
 y:sheet.origin.y-sheet.scale*p.y});
function handArc(geometry){
 const g=geometry.data,points=Array.from({length:65},(_,i)=>{
  const angle=(g.startAngle+(g.endAngle-g.startAngle)*i/64)*Math.PI/180;
  return toScreen({x:g.center.x+g.radius*Math.cos(angle),
   y:g.center.y+g.radius*Math.sin(angle)});
 });
 return {revision:rev,points};
}
test('P0/03: point math -> R1/V5 guide actions -> student millimetre grading',()=>{
 const data={knownViews:{V:[15,12],H:[15,10]},
  sheetTransform:{origin:{x:360,y:210},scale:4}};
 const solved=solveProjection(data),plan=pointTimeline(data,rev);
 assert.equal(solved.status,'unique');assert.equal(plan.status,'ready');
 assert.equal(plan.mathematicallyVerified,true);
 assert.equal(plan.revision,rev);
 assert.equal(plan.steps.length,5);
 assert.equal(plan.steps[4].actions[0].kind,'point');
 const strokes=solved.steps.map(s=>({
  from:{...s.from},to:{...s.to},revision:rev
 }));
 const grade=gradeProjectionDrawing(solved.steps,strokes,{scale:4,revision:rev});
 assert.equal(grade.status,'correct');
 assert.equal(grade.matchedCount,4);
 assert.equal(grade.targetCount,4);
 for(let i=0;i<4;i++){
  assert.deepEqual(plan.steps[i].actions[0].geometry.from,solved.steps[i].from);
  assert.deepEqual(plan.steps[i].actions[0].geometry.to,solved.steps[i].to);
 }
});
test('P0/02: finite segment solver, two digital offsets, center snap, V5 and student arc concur',()=>{
 const args=segments(),chosen=chooseFiniteTwoSegmentArc(args),
  plan=filletTimeline('segments',args,sheet,rev);
 assert.equal(chosen.status,'selected');assert.equal(chosen.g1Verified,true);
 assert.equal(chosen.finiteArcSweepVerified,true);
 assert.equal(plan.status,'ready');
 assert.equal(plan.selectedBranchId,args.branchId);
 assert.equal(plan.steps.length,6);
 assert.ok(plan.steps.at(-1).actions[0].geometry.sweepRadians<0);
 const candidate=finiteTwoSegmentFillets(args).candidates.find(c=>c.id===args.branchId);
 const ruler=['first','second'].map(sourceId=>({
  ...constructParallelLine(args[sourceId],
   candidate.sides[sourceId]*args.filletRadius,{revision:rev}),sourceId}));
 const assist=gradeStudentAuxiliaries('segments',args,ruler,{branchId:args.branchId,revision:rev});
 assert.equal(assist.status,'correct');assert.equal(assist.matchedCount,2);
 assert.equal(assist.arcG1Verified,false);
 const chosenCenter=snapChosenFilletCenter('segments',args,
  {...candidate.center,revision:rev},{branchId:args.branchId,revision:rev});
 assert.equal(chosenCenter.status,'verified-center');
 assert.equal(chosenCenter.completeProblemVerified,false);
 const lines=chosen.steps.filter(s=>s.kind==='offset-line').map(s=>({
  from:toScreen(s.geometry.a),to:toScreen(s.geometry.b),revision:rev
 }));
 const byPen=gradeFilletOffsetLines(args,lines,{...sheet,revision:rev});
 assert.equal(byPen.status,'correct');
 const finalArc=gradeFilletArcDrawing(args,handArc(chosen.geometry),
  {kind:'segments',...sheet,revision:rev});
 assert.equal(finalArc.status,'correct');
 const svgShape=Motion.actionShapeAttrs(plan.steps.at(-1).actions[0],1);
 assert.match(svgShape.d,/ A /);
});
test('P0/02: two circles, student concentric compass, chosen center and CW screen conversion',()=>{
 const args=circles(),chosen=chooseDirectedFillet(args),
  plan=filletTimeline('circles',args,sheet,rev);
 assert.equal(chosen.status,'selected');assert.equal(chosen.g1Verified,true);
 assert.equal(plan.status,'ready');assert.equal(plan.steps.length,4);
 const firstCircle=plan.steps[0].actions[0];
 assert.equal(firstCircle.kind,'circle');
 const raw=circleCircleFilletCenters(args);
 const actions=['first','second'].map(sourceId=>({
  ...constructConcentricCircle(args[sourceId],
   raw.auxiliary[sourceId+'Locus'].radius,{revision:rev}),sourceId
 }));
 assert.equal(gradeStudentAuxiliaries('circles',args,actions,
  {branchId:args.branchId,revision:rev}).status,'correct');
 const selected=raw.candidates.find(c=>c.id===args.branchId);
 assert.equal(snapChosenFilletCenter('circles',args,
  {...selected.center,revision:rev},{branchId:args.branchId,revision:rev}).status,
  'verified-center');
 assert.ok(plan.steps.at(-1).actions[0].geometry.sweepRadians>0);
 assert.equal(gradeFilletArcDrawing(args,handArc(chosen.geometry),
  {kind:'circles',...sheet,revision:rev}).status,'correct');
});
test('unselected branch cannot yield verified timeline or selected center',()=>{
 const raw=segments();delete raw.branchId;
 const p=filletTimeline('segments',raw,sheet,rev);
 assert.equal(p.status,'not-verified');assert.deepEqual(p.steps,[]);
 const center=finiteTwoSegmentFillets(raw).candidates[0].center;
 const check=snapChosenFilletCenter('segments',raw,{...center,revision:rev},{revision:rev});
 assert.equal(check.status,'branch-required');
 assert.equal(gradeStudentAuxiliaries('segments',raw,[],
  {revision:rev}).status,'branch-required');
});
test('missing directed G1 keeps student arc unverified even after valid center and two offsets',()=>{
 const args=segments();args.firstTravel='reverse';
 const bad=filletTimeline('segments',args,sheet,rev);
 assert.equal(bad.status,'not-verified');
 assert.equal(gradeFilletArcDrawing(args,null,
  {kind:'segments',...sheet,revision:rev}).status,'not-verified');
});
test('invalidated student input revision always refuses previous constructed artifacts',()=>{
 const args=segments(),chosen=chooseFiniteTwoSegmentArc(args);
 assert.throws(()=>gradeFilletArcDrawing(args,
  {...handArc(chosen.geometry),revision:rev-1},
  {kind:'segments',...sheet,revision:rev}),/stale/);
 assert.throws(()=>gradeStudentAuxiliaries('segments',args,
  [{...constructParallelLine(args.first,10,{revision:rev-1}),sourceId:'first'}],
  {branchId:'s++',revision:rev}),/stale/);
});
