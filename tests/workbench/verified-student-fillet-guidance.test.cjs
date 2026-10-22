'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {assessFilletStudentProgress}=require('../../workbench/verified-student-fillet-progress.cjs');
const {fromProgress}=require('../../workbench/verified-student-fillet-guidance.cjs');
const {constructConcentricCircle}=require('../../workbench/verified-ruler-tools.cjs');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const {chooseDirectedFillet}=require('../../engines/planar/directed-circle-fillet.cjs');
const origin={x:360,y:220},scale=8,revision=17,branchId='center-1';
const args={first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10,
 firstMode:'external',secondMode:'external',branchId,direction:'cw',
 knownFirstTravel:'ccw',knownSecondTravel:'ccw'};
const grade=(a=args,work={},choice=branchId)=>
 assessFilletStudentProgress('circles',a,work,{branchId:choice,revision,origin,scale});
const explain=(g,kind='circles',v=revision)=>fromProgress(g,{kind,revision:v});
const guides=()=>{
 const loci=circleCircleFilletCenters(args).auxiliary;
 return ['first','second'].map(sourceId=>({
  ...constructConcentricCircle(args[sourceId],loci[sourceId+'Locus'].radius,{revision}),
  sourceId}));
};
test('student feedback never supplies an answer for missing branch, only learner actions',()=>{
 const missing={...args};delete missing.branchId;
 const result=explain(grade(missing,{},''));
 assert.equal(result.status,'in-progress');
 assert.equal(result.verifiedCount,0);
 assert.equal(result.stages.length,4);
 assert.equal(result.stages[0].status,'blocked');
 assert.match(result.next,/先自行选定有效.*分支/);
 assert.ok(result.stages.every(x=>!x.verified));
 const serialized=JSON.stringify(result);
 for(const prop of ['snappedPoint','selectedBranch','center.x','circleContact','sourceContactsOnSegments',
  'signedOffsetMm','expectedArc','g1Residual'])
  assert.ok(!serialized.includes(prop),'student output must not disclose expected '+prop);
});
test('first drawn compass locus receives partial evidence, second completes only auxiliary stage',()=>{
 const part=explain(grade(args,{auxiliaries:guides().slice(0,1)}));
 assert.equal(part.verifiedCount,0);assert.equal(part.stages[0].status,'partial');
 assert.match(part.stages[0].detail,/已核验 1 \/ 2/);
 assert.match(part.stages[0].detail,/对象 2/);
 assert.match(part.next,/辅助轨迹/);
 const full=explain(grade(args,{auxiliaries:guides()}));
 assert.equal(full.verifiedCount,1);
 assert.equal(full.stages[0].status,'verified');
 assert.equal(full.stages[1].status,'pending');
 assert.match(full.next,/自行在画纸上点选候选圆心/);
 assert.equal(full.stages[3].verified,false);
});
test('duplicate student compass marks cannot be counted as 2 verified guides',()=>{
 const [a,b]=guides(),feedback=explain(grade(args,{auxiliaries:[a,b,a]}));
 assert.equal(feedback.stages[0].status,'review');
 assert.equal(feedback.verifiedCount,0);
 assert.match(feedback.stages[0].detail,/额外、重复/);
 assert.match(feedback.stages[0].detail,/撤销多余笔迹/);
});
test('a student's wrong center and incomplete contact marks yield precise but non-revealing next steps',()=>{
 const chosen=circleCircleFilletCenters(args).candidates.find(c=>c.id===branchId);
 const wrong=explain(grade(args,{auxiliaries:guides(),
  centerMark:{x:chosen.center.x+1.5,y:chosen.center.y,revision}}));
 assert.equal(wrong.stages[1].status,'review');
 assert.match(wrong.stages[1].detail,/毫米容差/);
 const centerMark={...chosen.center,revision};
 const one={kind:'tangent-point',point:chosen.contacts.first,sourceId:'first',revision};
 const part=explain(grade(args,{auxiliaries:guides(),centerMark,tangentMarks:[one]}));
 assert.equal(part.verifiedCount,2);
 assert.equal(part.stages[1].status,'verified');
 assert.equal(part.stages[2].status,'partial');
 assert.match(part.stages[2].detail,/对象 2/);
 assert.equal(part.stages[3].verified,false);
 const duplicate=explain(grade(args,{auxiliaries:guides(),centerMark,tangentMarks:[one,one]}));
 assert.equal(duplicate.stages[2].status,'review');
 assert.match(duplicate.stages[2].detail,/重复/);
});
test('only fully independently drawn G1 arc yields 4/4; still never claims completed textbook problem',()=>{
 const chosen=circleCircleFilletCenters(args).candidates.find(c=>c.id===branchId);
 const marks=['first','second'].map(sourceId=>({
  kind:'tangent-point',sourceId,point:chosen.contacts[sourceId],revision}));
 const g=chooseDirectedFillet(args).geometry.data;
 const points=Array.from({length:49},(_,i)=>{
  const theta=(g.startAngle+(g.endAngle-g.startAngle)*i/48)*Math.PI/180;
  return {x:origin.x+scale*(g.center.x+g.radius*Math.cos(theta)),
   y:origin.y-scale*(g.center.y+g.radius*Math.sin(theta))};
 });
 const result=explain(grade(args,{auxiliaries:guides(),
  centerMark:{...chosen.center,revision},tangentMarks:marks,
  arcStrokes:[{kind:'arc',points,revision}]}));
 assert.equal(result.status,'supported-complete');
 assert.equal(result.verifiedCount,4);
 assert.equal(result.stages[3].status,'verified');
 assert.match(result.stages[3].detail,/不代表完整教材题/);
 assert.match(result.scope,/不代表整道工程制图习题/);
 assert.doesNotMatch(result.headline,/整题完成|标准答案/);
});
test('stage count contradictions, stale revision and fake global proof reject all feedback',()=>{
 const data=grade();
 assert.equal(explain(data,'circles',revision+1).status,'unverified');
 assert.equal(explain(data,'segments').status,'unverified');
 assert.equal(explain({...data,fullProblemVerified:true}).status,'unverified');
 assert.equal(explain({...data,verifiedCount:4}).status,'unverified');
 assert.equal(explain({...data,stages:[...data.stages].reverse()}).status,'unverified');
 assert.equal(explain({...data,stages:data.stages.map((x,i)=>i?x:{...x,ok:true})}).status,'unverified');
 assert.equal(explain({...data,verification:{...data.verification,auxiliaries:null}}).status,'unverified');
});
test('supported line and mixed classroom types produce safe feedback without fabricated geometry',()=>{
 const mk=kind=>{
  const x=kind==='segments'?{
   first:{a:{x:-20,y:0},b:{x:20,y:0}},
   second:{a:{x:0,y:-20},b:{x:0,y:20}},
   filletRadius:10,branchId:'s++',direction:'ccw',
   firstTravel:'forward',secondTravel:'forward'}:{
   segment:{a:{x:-15,y:0},b:{x:15,y:0}},
   circle:{center:{x:0,y:5},radius:8},
   filletRadius:3,side:1,branchId:'candidate-1',direction:'ccw',
   lineTravel:'forward',knownCircleTravel:'cw'};
  const result=assessFilletStudentProgress(kind,x,{},
   {branchId:x.branchId,revision,origin,scale});
  return fromProgress(result,{kind,revision});
 };
 for(const kind of ['segments','segment-circle']){
  const v=mk(kind);
  assert.equal(v.stages.length,4);
  assert.equal(v.verifiedCount,0);
  assert.match(v.next,/辅助轨迹/);
  assert.match(v.scope,/不代表整道工程制图习题/);
 }
});
