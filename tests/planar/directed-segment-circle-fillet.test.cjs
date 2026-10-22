'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chooseDirectedSegmentCircleFillet:choose}=
 require('../../engines/planar/directed-segment-circle-fillet.cjs');
const {finiteSegmentCircleFillets:centers}=
 require('../../engines/planar/segment-circle-fillet.cjs');
const {normalizedLine}=require('../../engines/planar/offset-tangency.cjs');
const basic=()=>({segment:{a:{x:-15,y:0},b:{x:15,y:0}},
 circle:{center:{x:0,y:5},radius:8},filletRadius:3,side:1,
 branchId:'candidate-1',direction:'ccw',
 lineTravel:'forward',knownCircleTravel:'cw'});
const close=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const atAngle=(center,p)=>Math.atan2(p.y-center.y,p.x-center.x)*180/Math.PI;
const sourceSector=(args,which)=>{const c=centers(args).candidates.find(c=>c.id===which);
 const theta=atAngle(args.circle.center,c.circleContact);
 return {startAngle:theta-9,endAngle:theta+9,direction:'ccw'};
};
test('an explicitly selected real center and two source travels prove directed G1',()=>{
 const args=basic(),r=choose(args);
 assert.equal(r.status,'selected');assert.equal(r.g1Verified,true);
 assert.equal(r.selectedId,'candidate-1');
 assert.equal(r.finiteSegmentContactVerified,true);
 assert.equal(r.sourceArcRangeVerified,true);
 assert.equal(r.finiteCircleArcCount,0);
 assert.ok(r.maxG1Mismatch<1e-7);
 assert.ok(r.maxTangencyResidual<1e-7);
 assert.equal(r.steps.length,5);
 assert.deepEqual(r.steps.map(s=>s.id),
  ['offset-line','concentric-locus','center-intersection','contact-points','directed-fillet']);
 assert.equal(r.geometry.kind,'arc');assert.equal(r.geometry.unit,'mm');
 assert.equal(r.geometry.data.direction,'ccw');
 assert.ok(r.sweepDegrees>0&&r.sweepDegrees<360);
 assert.deepEqual(r.contacts.first,centers(args).candidates[0].lineContact);
 assert.deepEqual(r.contacts.second,centers(args).candidates[0].circleContact);
});
test('both physically valid circle centers require explicit choice; never pick first automatically',()=>{
 const args=basic();delete args.branchId;
 const r=choose(args);
 assert.equal(r.status,'branch-choice-required');assert.equal(r.geometry,null);
 assert.deepEqual(r.candidateIds,['candidate-1','candidate-2']);
 assert.deepEqual(r.steps,[]);assert.equal(r.g1Verified,false);
});
test('candidate-2 is also mathematically G1-valid for same source travels',()=>{
 const args={...basic(),branchId:'candidate-2'};
 const r=choose(args);assert.equal(r.status,'selected');
 assert.equal(r.g1Verified,true);assert.equal(r.selectedId,'candidate-2');
 assert.ok(r.sweepDegrees>0&&r.sweepDegrees<360);
 assert.notDeepEqual(r.geometry.data.center,choose(basic()).geometry.data.center);
});
test('selected geometric center alone requires explicit connecting arc sweep direction',()=>{
 const args=basic();delete args.direction;
 const r=choose(args);
 assert.equal(r.status,'direction-required');
 assert.equal(r.geometry,null);assert.deepEqual(r.steps,[]);
});
test('opposite arc direction is NOT valid merely because two contacts satisfy unoriented tangency',()=>{
 const r=choose({...basic(),direction:'cw'});
 assert.equal(r.status,'direction-conflict');assert.equal(r.geometry,null);
 assert.equal(r.g1Verified,false);assert.ok(r.maxG1Mismatch>1);
 assert.ok(r.arcPreview);assert.deepEqual(r.steps,[]);
});
test('changing the source line travel must reject discontinuous G1',()=>{
 const r=choose({...basic(),lineTravel:'reverse'});
 assert.equal(r.status,'direction-conflict');
 assert.equal(r.directionChecks.find(c=>c.source==='segment'),undefined);
 assert.equal(r.g1Verified,false);
});
test('wrong known source circle travel conflicts with the proven fillet tangent',()=>{
 const r=choose({...basic(),knownCircleTravel:'ccw'});
 assert.equal(r.status,'direction-conflict');assert.equal(r.g1Verified,false);
});
test('omitting any one source travel cannot earn a two-ended directed G1 proof',()=>{
 for(const field of ['lineTravel','knownCircleTravel']){
  const args=basic();delete args[field];
  const r=choose(args);
  assert.equal(r.status,'selected');assert.equal(r.g1Verified,false);
  assert.equal(r.maxG1Mismatch,null);
  assert.match(r.steps.at(-1).reason,/无向相切/);
 }
});
test('finite given source circle arc can keep just the right branch and its G1 valid',()=>{
 const b=basic();b.circle.arc=sourceSector(b,'candidate-2');
 b.branchId='candidate-2';
 const r=choose(b);
 assert.equal(r.status,'selected');assert.equal(r.g1Verified,true);
 assert.equal(r.sourceArcRangeVerified,true);
 assert.equal(r.finiteCircleArcCount,1);
 assert.equal(r.selectedId,'candidate-2');
 assert.deepEqual(r.candidateIds,['candidate-2']);
 assert.match(r.steps[3].reason,/给定圆弧内/);
 assert.equal(r.steps[3].sourceArcRangeVerified,true);
});
test('branch filtered by finite source arc cannot be selected as a fake matching answer',()=>{
 const b=basic();b.circle.arc=sourceSector(b,'candidate-2');
 assert.throws(()=>choose(b),/selected branchId/);
});
test('finite arc that excludes all original contacts has no answer and no construction steps',()=>{
 const args=basic();args.circle.arc={startAngle:75,endAngle:85,direction:'ccw'};
 const r=choose(args);
 assert.equal(r.status,'none');assert.equal(r.geometry,null);
 assert.deepEqual(r.candidateIds,[]);assert.deepEqual(r.steps,[]);
 assert.equal(r.g1Verified,false);
});
test('short finite source line cannot accept contacts on its infinite extension',()=>{
 const args=basic();args.segment={a:{x:-2,y:0},b:{x:2,y:0}};
 const r=choose(args);
 assert.equal(r.status,'none');assert.equal(r.geometry,null);
 assert.deepEqual(r.steps,[]);
});
test('every contact satisfies radius, finite-segment parameter and pointwise line perpendicularity',()=>{
 const args=basic(),r=choose(args),line=normalizedLine(args.segment);
 const from={x:r.contacts.first.x-r.center.x,y:r.contacts.first.y-r.center.y};
 const to={x:r.contacts.second.x-r.center.x,y:r.contacts.second.y-r.center.y};
 close(Math.hypot(from.x,from.y),args.filletRadius);
 close(Math.hypot(to.x,to.y),args.filletRadius);
 close(Math.hypot(r.contacts.second.x-args.circle.center.x,
  r.contacts.second.y-args.circle.center.y),args.circle.radius);
 close(from.x*line.tangent.x+from.y*line.tangent.y,0);
 const p=((r.contacts.first.x-line.a.x)*line.tangent.x+
  (r.contacts.first.y-line.a.y)*line.tangent.y)/line.length;
 assert.ok(p>=0&&p<=1);
});
test('rotating and translating finite source geometry preserves G1, selected branch and sweep',()=>{
 const b=basic(),old=choose(b),t=Math.PI/3,theta=60;
 const c=Math.cos(t),s=Math.sin(t),mv=p=>({
  x:c*p.x-s*p.y+120,y:s*p.x+c*p.y-40
 });
 const rotated={...b,segment:{a:mv(b.segment.a),b:mv(b.segment.b)},
  circle:{center:mv(b.circle.center),radius:b.circle.radius}};
 const fresh=choose(rotated);
 assert.equal(fresh.status,'selected');assert.equal(fresh.g1Verified,true);
 assert.equal(fresh.selectedId,old.selectedId);
 close(fresh.sweepDegrees,old.sweepDegrees);
 close(fresh.center.x,mv(old.center).x);
 close(fresh.center.y,mv(old.center).y);
 const originalArc={...b,circle:{...b.circle,arc:sourceSector(b,'candidate-1')}};
 const rotatedArc={...rotated,circle:{...rotated.circle,arc:{
  startAngle:originalArc.circle.arc.startAngle+theta,
  endAngle:originalArc.circle.arc.endAngle+theta,direction:'ccw'}}};
 assert.equal(choose(originalArc).g1Verified,true);
 assert.equal(choose(rotatedArc).g1Verified,true);
});
test('geometry inputs remain immutable and invalid source travels fail closed',()=>{
 const args=basic(),before=JSON.stringify(args);
 assert.deepEqual(choose(args),choose(args));
 assert.equal(JSON.stringify(args),before);
 assert.throws(()=>choose({...args,lineTravel:'around'}),/lineTravel/);
 assert.throws(()=>choose({...args,knownCircleTravel:'forward'}),/knownCircleTravel/);
 assert.throws(()=>choose({...args,branchId:'candidate-99'}),/selected branchId/);
 assert.throws(()=>choose({...args,circle:{...args.circle,arc:{
  startAngle:0,endAngle:360,direction:'ccw'}}}));
});
