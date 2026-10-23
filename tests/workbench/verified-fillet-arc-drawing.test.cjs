'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {gradeFilletArcDrawing:grade}=require('../../workbench/verified-fillet-arc-drawing.cjs');
const {chooseDirectedFillet}=require('../../engines/planar/directed-circle-fillet.cjs');
const {chooseFiniteTwoSegmentArc}=require('../../engines/planar/directed-two-segment-fillet.cjs');
const cfg={origin:{x:360,y:220},scale:8,revision:7};
const segment=()=>({first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'});
const circles=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10,
 firstMode:'external',secondMode:'external',
 branchId:'center-1',direction:'cw',
 knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
const solution=(a,k)=>k==='circles'?chooseDirectedFillet(a):chooseFiniteTwoSegmentArc(a);
const arcStroke=(args,kind,opts=cfg,n=33)=>{
 const selected=solution(args,kind);assert.equal(selected.status,'selected');
 assert.equal(selected.g1Verified,true);
 const {center,radius,startAngle,endAngle}=selected.geometry.data;
 const points=Array.from({length:n},(_,i)=>{
  const t=(startAngle+(endAngle-startAngle)*i/(n-1))*Math.PI/180;
  return {x:opts.origin.x+opts.scale*(center.x+radius*Math.cos(t)),
   y:opts.origin.y-opts.scale*(center.y+radius*Math.sin(t))};
 });
 return {revision:opts.revision,points};
};
test('real two-segment directed fillet student curve passes with verified geometry only',()=>{
 const args=segment(),s=arcStroke(args,'segments'),r=grade(args,s,{...cfg,kind:'segments'});
 assert.equal(r.status,'correct');assert.equal(r.geometryValidated,true);
 assert.equal(r.sourceProofVerified,true);assert.equal(r.sampleCount,33);
 assert.ok(r.maxRadialResidualMm<1e-8);assert.ok(r.sweepResidualDegrees<1e-8);
 assert.equal(r.gradeScope,'single-directed-fillet-arc-only');
 assert.match(r.reason,/不能据此认定全部辅助线/);
});
test('real two-circle external tangent chosen arc also passes but finite source arc claims are excluded',()=>{
 const args=circles(),solved=solution(args,'circles');assert.equal(solved.g1Verified,true);
 const r=grade(args,arcStroke(args,'circles'),{...cfg,kind:'circles'});
 assert.equal(r.status,'correct');assert.equal(r.kind,'circles');
 assert.match(r.reason,/有限已知圆弧范围/);
});
test('straight chord through correct contact endpoints fails the radius-curve check',()=>{
 const args=segment(),s=arcStroke(args,'segments');
 const first=s.points[0],last=s.points.at(-1);
 const points=Array.from({length:33},(_,i)=>({
  x:first.x+(last.x-first.x)*i/32,y:first.y+(last.y-first.y)*i/32
 }));
 const r=grade(args,{revision:7,points},{...cfg,kind:'segments'});
 assert.equal(r.status,'incorrect');assert.ok(r.maxRadialResidualMm>1);
});
test('reverse traversal fails directed sweep despite perfectly circular points',()=>{
 const args=segment(),s=arcStroke(args,'segments');
 const r=grade(args,{...s,points:s.points.slice().reverse()},{...cfg,kind:'segments'});
 assert.equal(r.status,'incorrect');assert.ok(r.backwardMotionDegrees>85);
});
test('drawn curve offset 2 mm fails radial and endpoint checks',()=>{
 const args=segment(),s=arcStroke(args,'segments');
 const wrong={...s,points:s.points.map(p=>({x:p.x+16,y:p.y}))};
 const r=grade(args,wrong,{...cfg,kind:'segments'});
 assert.equal(r.status,'incorrect');assert.ok(r.endpointResidualMm.start>1);
});
test('correct endpoints but a badly off-circle middle point never passes',()=>{
 const args=segment(),s=arcStroke(args,'segments');
 s.points[17]={x:s.points[17].x+32,y:s.points[17].y+20};
 const r=grade(args,s,{...cfg,kind:'segments'});
 assert.equal(r.status,'incorrect');assert.ok(r.maxRadialResidualMm>0.75);
});
test('only two endpoints or 5 points cannot prove curvature',()=>{
 const args=segment();
 for(const count of [2,5,8]){
  const r=grade(args,arcStroke(args,'segments',cfg,count),{...cfg,kind:'segments'});
  assert.equal(r.status,'incorrect',String(count));
 }
});
test('sparse sample angles over 30 degrees fail despite true circle equation',()=>{
 const args=segment(),s=arcStroke(args,'segments',cfg,9);
 const r=grade(args,{...s,points:[...s.points.slice(0,2),...s.points.slice(5)]},
  {...cfg,kind:'segments'});
 assert.equal(r.status,'incorrect');assert.ok(r.largestAngularGapDegrees>30);
});
test('smooth long arc includes crossing the negative-positive angular cut',()=>{
 const args=circles(),s=arcStroke(args,'circles',cfg,65);
 const r=grade(args,s,{...cfg,kind:'circles'});
 assert.equal(r.status,'correct');assert.equal(r.sampleCount,65);
});
test('scaling model drawing pixels does not change answer',()=>{
 const args=segment(),double={...cfg,scale:16};
 const r=grade(args,arcStroke(args,'segments',double),{...double,kind:'segments'});
 assert.equal(r.status,'correct');
});
test('minor pen jitter inside 0.75 mm is accepted while larger jitter fails',()=>{
 const args=segment(),s=arcStroke(args,'segments',cfg,65);
 const jitter={...s,points:s.points.map((p,i)=>({
  x:p.x+Math.sin(i*Math.PI/8)*1.2,y:p.y+Math.sin(i*Math.PI/7)*1.2
 }))};
 const a=grade(args,jitter,{...cfg,kind:'segments'});
 assert.equal(a.status,'correct');
 const bad={...s,points:s.points.map((p,i)=>({
  x:p.x+(i>8&&i<50?16:0),y:p.y
 }))};
 assert.equal(grade(args,bad,{...cfg,kind:'segments'}).status,'incorrect');
});
test('missing branch, missing travel or G1 conflict prevents grading before inspecting strokes',()=>{
 const args=segment(),sample=arcStroke(args,'segments');
 for(const wrong of [
  {...args,branchId:undefined},
  {...args,direction:undefined},
  {...args,secondTravel:undefined},
  {...args,firstTravel:'reverse'}
 ])assert.equal(grade(wrong,sample,{...cfg,kind:'segments'}).status,'not-verified');
 const circle=circles();
 assert.equal(grade({...circle,knownSecondTravel:undefined},arcStroke(circle,'circles'),
  {...cfg,kind:'circles'}).status,'not-verified');
});
test('old revision and NaN samples fail closed even if math remains valid',()=>{
 const args=segment(),s=arcStroke(args,'segments');
 assert.throws(()=>grade(args,{...s,revision:6},{...cfg,kind:'segments'}),/stale/);
 s.points[5]={x:NaN,y:12};
 assert.throws(()=>grade(args,s,{...cfg,kind:'segments'}),/invalid/);
});
test('invalid scale, origin, type, tolerance and sample lengths are rejected',()=>{
 const a=segment(),s=arcStroke(a,'segments');
 assert.throws(()=>grade(a,s,{...cfg,kind:'fiction'}),/kind/);
 assert.throws(()=>grade(a,s,{...cfg,kind:'segments',scale:0}),/scale/);
 assert.throws(()=>grade(a,s,{...cfg,kind:'segments',origin:{x:Infinity,y:1}}),/origin/);
 assert.throws(()=>grade(a,s,{...cfg,kind:'segments',toleranceMm:10}),/tolerance/);
 assert.throws(()=>grade(a,{revision:7,points:Array(801).fill({x:10,y:10})},
  {...cfg,kind:'segments'}),/samples/);
});
test('no stroke is incomplete, not a correct drawing; no inputs are mutated',()=>{
 const a=segment(),s=arcStroke(a,'segments'),before=JSON.stringify({a,s});
 const r=grade(a,null,{...cfg,kind:'segments'});
 assert.equal(r.status,'incomplete');
 grade(a,s,{...cfg,kind:'segments'});
 assert.equal(JSON.stringify({a,s}),before);
});
