'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {assessFilletStudentProgress:assess}=require('../../workbench/verified-student-fillet-progress.cjs');
const {constructParallelLine,constructConcentricCircle}=require('../../workbench/verified-ruler-tools.cjs');
const {chooseFiniteTwoSegmentArc}=require('../../engines/planar/directed-two-segment-fillet.cjs');
const {chooseDirectedFillet}=require('../../engines/planar/directed-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../../engines/planar/two-segment-fillet.cjs');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const sheet={origin:{x:360,y:220},scale:8,revision:9};
const segment=()=>({first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10,
 branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'});
const circles=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10,
 firstMode:'external',secondMode:'external',branchId:'center-1',
 direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
const penArc=g=>({revision:9,points:Array.from({length:49},(_,i)=>{
 const v=(g.data.startAngle+(g.data.endAngle-g.data.startAngle)*i/48)*Math.PI/180;
 return {x:360+8*(g.data.center.x+g.data.radius*Math.cos(v)),
 y:220-8*(g.data.center.y+g.data.radius*Math.sin(v))};
})});
function complete(kind,args){
 const raw=kind==='segments'?finiteTwoSegmentFillets(args):circleCircleFilletCenters(args);
 const c=raw.candidates.find(x=>x.id===args.branchId),source=['first','second'];
 const auxiliaries=source.map(sourceId=>({
  ...(kind==='segments'?
   constructParallelLine(args[sourceId],c.sides[sourceId]*args.filletRadius,{revision:9}):
   constructConcentricCircle(args[sourceId],
    raw.auxiliary[sourceId+'Locus'].radius,{revision:9})),sourceId
 }));
 const tangentMarks=source.map(sourceId=>({kind:'tangent-point',sourceId,
  point:{...c.contacts[sourceId]},revision:9}));
 const geometry=(kind==='segments'?chooseFiniteTwoSegmentArc(args):chooseDirectedFillet(args)).geometry;
 return {auxiliaries,centerMark:{...c.center,revision:9},tangentMarks,
  arcStrokes:[penArc(geometry)]};
}
test('real finite segment student completes all four independent supported math stages',()=>{
 const args=segment(),drawing=complete('segments',args),r=assess('segments',args,drawing,
  {...sheet,branchId:args.branchId});
 assert.equal(r.status,'all-supported-stages-verified');assert.equal(r.verifiedCount,4);
 assert.deepEqual(r.stages.map(x=>x.ok),[true,true,true,true]);
 assert.equal(r.fullProblemVerified,false);assert.equal(r.sourceFiniteCircularArcsVerified,false);
 assert.match(r.reason,/未证明完整教材题/);
 assert.equal(r.proofScope,'four-supported-student-fillet-constructions-only');
});
test('actual two-circle student proof also passes, without claiming clipped-circle arc scope',()=>{
 const args=circles(),drawing=complete('circles',args),r=assess('circles',args,drawing,
  {...sheet,branchId:args.branchId});
 assert.equal(r.verifiedCount,4);
 assert.equal(r.verification.arc.status,'correct');
 assert.equal(r.sourceFiniteCircularArcsVerified,false);
});
test('missing student tangency marks leaves 3/4, never implied full success',()=>{
 const args=segment(),drawing=complete('segments',args);drawing.tangentMarks=[];
 const r=assess('segments',args,drawing,{...sheet,branchId:args.branchId});
 assert.equal(r.status,'in-progress');assert.equal(r.verifiedCount,3);
 assert.equal(r.verification.contacts.status,'incomplete');
 assert.equal(r.stages[2].ok,false);
});
test('a wrong branch or missing direction blocks final full-stage grade',()=>{
 const args=circles(),drawing=complete('circles',args);
 const wrong=assess('circles',args,drawing,{...sheet,branchId:'center-2'});
 assert.ok(wrong.verifiedCount<4);
 assert.equal(wrong.fullProblemVerified,false);
 const noDirection={...args,direction:undefined};
 const p=assess('circles',noDirection,drawing,{...sheet,branchId:args.branchId});
 assert.equal(p.stages[3].ok,false);assert.ok(p.verifiedCount<=3);
});
test('one duplicate arc cannot silently be ignored as long as another passes',()=>{
 const args=segment(),drawing=complete('segments',args);
 drawing.arcStrokes.push(drawing.arcStrokes[0]);
 const r=assess('segments',args,drawing,{...sheet,branchId:args.branchId});
 assert.equal(r.verifiedCount,3);
 assert.equal(r.verification.arc.status,'incorrect');
 assert.match(r.verification.arc.reason,/多条连接弧/);
});
test('student center tap is required separately from chosen branch, no auto-perfect center',()=>{
 const args=segment(),drawing=complete('segments',args);
 drawing.centerMark=null;
 const r=assess('segments',args,drawing,{...sheet,branchId:args.branchId});
 assert.equal(r.verifiedCount,3);assert.equal(r.verification.center.status,'incomplete');
});
test('missing chosen candidate branch prevents all four math checks from passing',()=>{
 const args=circles(),drawing=complete('circles',args);
 const r=assess('circles',args,drawing,{...sheet,branchId:''});
 assert.equal(r.verifiedCount,0);assert.equal(r.fullProblemVerified,false);
});
test('changing revision invalidates old student tap; no silent reuse of old work',()=>{
 const args=segment(),drawing=complete('segments',args);
 assert.throws(()=>assess('segments',args,drawing,{...sheet,revision:10,branchId:args.branchId}),/stale/);
});
test('wrong source, old geometry and repeated compass construction fail subset',()=>{
 const args=circles(),drawing=complete('circles',args);
 drawing.tangentMarks[0].sourceId='second';
 drawing.auxiliaries.push({...drawing.auxiliaries[0]});
 const r=assess('circles',args,drawing,{...sheet,branchId:args.branchId});
 assert.equal(r.stages[0].ok,false);assert.equal(r.stages[2].ok,false);
 assert.ok(r.verifiedCount<=2);
});
test('progress module rejects excess arc traces and never modifies student data',()=>{
 const args=segment(),d=complete('segments',args),before=JSON.stringify(d);
 assert.equal(assess('segments',args,d,{...sheet,branchId:args.branchId}).verifiedCount,4);
 assert.equal(JSON.stringify(d),before);
 assert.throws(()=>assess('segments',args,{...d,arcStrokes:Array(65).fill(d.arcStrokes[0])},
  {...sheet,branchId:args.branchId}),/bounded/);
});
