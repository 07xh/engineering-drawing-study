'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chooseDirectedFillet:choose}=require('../../engines/planar/directed-circle-fillet.cjs');
const close=(x,y,e=1e-7)=>assert.ok(Math.abs(x-y)<e,x+' vs '+y);
const base=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10});
test('two centers require explicit branch selection, never first by default',()=>{
 const s=choose({...base(),direction:'cw'});
 assert.equal(s.status,'branch-choice-required');
 assert.deepEqual(s.candidateIds,['center-1','center-2']);
 assert.equal(s.geometry,null);
 assert.deepEqual(s.steps,[]);
});
test('selected center still requires explicit directed arc sweep',()=>{
 const s=choose({...base(),branchId:'center-1'});
 assert.equal(s.status,'direction-required');assert.equal(s.g1Verified,false);
 assert.equal(s.geometry,null);
});
test('clockwise exterior fillet retains model directed math arc and construction proof',()=>{
 const s=choose({...base(),branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
 assert.equal(s.status,'selected');
 assert.equal(s.g1Verified,true);
 assert.equal(s.steps.length,4);
 assert.equal(s.geometry.kind,'arc');
 assert.equal(s.geometry.unit,'mm');
 assert.equal(s.geometry.data.direction,'cw');
 assert.ok(s.geometry.data.endAngle<s.geometry.data.startAngle);
 assert.ok(s.sweepDegrees<0&&s.sweepDegrees>-360);
 close(s.maxTangencyResidual,0);
 close(s.maxG1Mismatch,0);
});
test('counterclockwise exterior fillet requires opposite known-circle directions',()=>{
 const s=choose({...base(),branchId:'center-2',direction:'ccw',
  knownFirstTravel:'cw',knownSecondTravel:'cw'});
 assert.equal(s.status,'selected');assert.equal(s.g1Verified,true);
 assert.ok(s.sweepDegrees>0);
});
test('wrong known-circle travel triggers directional G1 conflict',()=>{
 const s=choose({...base(),branchId:'center-2',direction:'ccw',
  knownFirstTravel:'ccw',knownSecondTravel:'cw'});
 assert.equal(s.status,'direction-conflict');
 assert.equal(s.geometry,null);assert.equal(s.g1Verified,false);
 assert.ok(s.maxG1Mismatch>1);
});
test('without known-circle traversal directions, G1 remains unproven',()=>{
 const s=choose({...base(),branchId:'center-2',direction:'ccw'});
 assert.equal(s.status,'selected');assert.equal(s.g1Verified,false);
 assert.equal(s.maxG1Mismatch,null);
 assert.match(s.steps[3].reason,/不能宣称有向 G1/);
});
test('mixed internal and external tangencies have opposite orientation demands',()=>{
 const input={first:{center:{x:0,y:0},radius:10},
  second:{center:{x:10,y:0},radius:3},filletRadius:2,firstMode:'internal',secondMode:'external'};
 const s=choose({...input,branchId:'center-1',direction:'cw',
  knownFirstTravel:'cw',knownSecondTravel:'ccw'});
 assert.equal(s.status,'selected');assert.equal(s.g1Verified,true);
 close(s.maxG1Mismatch,0);
});
test('unknown branch cannot refer to imaginary center',()=>{
 assert.throws(()=>choose({...base(),branchId:'center-3',direction:'ccw'}));
});
test('no solution and coincident loci do not emit directed arc',()=>{
 const none=choose({...base(),second:{center:{x:100,y:0},radius:5},branchId:'center-1',direction:'cw'});
 assert.equal(none.status,'none');assert.equal(none.geometry,null);
 const same=choose({...base(),second:{center:{x:0,y:0},radius:5},branchId:'center-1',direction:'cw'});
 assert.equal(same.status,'coincident');assert.equal(same.geometry,null);
});
test('degenerate zero arc and invalid orientation never get falsely certified',()=>{
 assert.throws(()=>choose({...base(),branchId:'center-1',direction:'cw',knownFirstTravel:'clockwise'}));
 const r=choose({...base(),branchId:'center-1',direction:'reversed'});
 assert.equal(r.status,'direction-required');assert.equal(r.geometry,null);
});
test('input circle geometry is not mutated by candidate selection',()=>{
 const b=base(),snap=JSON.stringify(b);
 choose({...b,branchId:'center-1',direction:'cw'});
 assert.equal(JSON.stringify(b),snap);
});
