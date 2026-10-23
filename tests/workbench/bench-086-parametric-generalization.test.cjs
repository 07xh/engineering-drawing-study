'use strict';
/**
 * #380 / #377: synthetic metamorphic problems, not images from the workbook.
 * The same real 02/03 mathematical specialist and one existing V5 player
 * must continue to work after physical model coordinates are transformed.
 * This is an independent 09 regression preflight, NOT source OCR acceptance.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Bridge=require('../../workbench/verified-plan-v5-bridge.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const {SAMPLES,SHEET,REVISION,inspectPlayback}=
 require('../../benchmark/solver-preflight-086.cjs');

const approx=(a,b,msg)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b)),msg+': '+a+' vs '+b);
const point=(p,s,dx,dy)=>({x:p.x*s+dx,y:p.y*s+dy});
const segment=(v,s,dx,dy)=>({a:point(v.a,s,dx,dy),b:point(v.b,s,dx,dy)});
const circle=(c,s,dx,dy)=>({...c,center:point(c.center,s,dx,dy),radius:c.radius*s});

function transformed(sample,s,dx,dy,dz=0){
 const v=sample.input;
 if(sample.family==='segments')
  return {...v,first:segment(v.first,s,dx,dy),
   second:segment(v.second,s,dx,dy),filletRadius:v.filletRadius*s};
 if(sample.family==='circles')
  return {...v,first:circle(v.first,s,dx,dy),
   second:circle(v.second,s,dx,dy),filletRadius:v.filletRadius*s};
 if(sample.family==='segment-circle')
  return {...v,segment:segment(v.segment,s,dx,dy),
   circle:circle(v.circle,s,dx,dy),filletRadius:v.filletRadius*s};
 if(sample.family==='point-projection'){
  const {V,H}=v.knownViews;
  return {knownViews:{V:[V[0]*s+dx,V[1]*s+dz],
   H:[H[0]*s+dx,H[1]*s+dy]}};
 }
 throw new TypeError('unsupported synthetic family');
}
function solve(sample,input,revision){
 return sample.family==='point-projection'
  ?Bridge.pointTimeline(input,revision)
  :Bridge.filletTimeline(sample.family,input,SHEET,revision);
}

test('#380 every supported family is re-solved under nontrivial model translation',()=>{
 const s=1,dx=17.25,dy=-11.5,dz=8.75;
 for(const sample of SAMPLES){
  const original=solve(sample,sample.input,REVISION);
  const input=transformed(sample,s,dx,dy,dz);
  const updated=solve(sample,input,REVISION+1);
  assert.equal(inspectPlayback(sample,original).passed,true,sample.id);
  // The sampling inspector intentionally compares the selected ID to the
  // original input. Revision is separately asserted against updated data.
  assert.equal(updated.status,'ready',sample.id);
  assert.equal(updated.mathematicallyVerified,true,sample.id);
  assert.equal(updated.revision,REVISION+1,sample.id);
  if(sample.family==='point-projection'){
   const a=original.originalLesson.result.point;
   const b=updated.originalLesson.result.point;
   approx(b.x,a.x+dx,sample.id+' x');
   approx(b.y,a.y+dy,sample.id+' y');
   approx(b.z,a.z+dz,sample.id+' z');
  }else{
   const a=original.originalLesson.result.arc;
   const b=updated.originalLesson.result.arc;
   assert.equal(updated.selectedBranchId,original.selectedBranchId,sample.id);
   approx(b.center.x,a.center.x+dx,sample.id+' center-x');
   approx(b.center.y,a.center.y+dy,sample.id+' center-y');
   approx(b.radius,a.radius,sample.id+' radius');
   assert.equal(b.direction,a.direction,sample.id);
   assert.ok(updated.originalLesson.result.g1Verified,sample.id);
  }
  assert.equal(Timeline.frame(updated.timing,updated.timing.totalMs).done,true,sample.id);
 }
});

test('#380 changing model millimetres by a positive factor preserves solved geometry and proof',()=>{
 const s=2,dx=0,dy=0,dz=0;
 for(const sample of SAMPLES){
  const original=solve(sample,sample.input,REVISION);
  const updated=solve(sample,transformed(sample,s,dx,dy,dz),REVISION+2);
  assert.equal(updated.status,'ready',sample.id);
  assert.equal(updated.mathematicallyVerified,true,sample.id);
  if(sample.family==='point-projection'){
   const a=original.originalLesson.result.point;
   const b=updated.originalLesson.result.point;
   approx(b.x,a.x*s,sample.id+' x');
   approx(b.y,a.y*s,sample.id+' y');
   approx(b.z,a.z*s,sample.id+' z');
  }else{
   const a=original.originalLesson.result.arc;
   const b=updated.originalLesson.result.arc;
   assert.equal(updated.selectedBranchId,original.selectedBranchId,sample.id);
   approx(b.center.x,a.center.x*s,sample.id+' center x');
   approx(b.center.y,a.center.y*s,sample.id+' center y');
   approx(b.radius,a.radius*s,sample.id+' radius');
   assert.equal(b.direction,a.direction,sample.id);
   assert.ok(updated.originalLesson.result.maxG1Mismatch<=1e-7,sample.id);
  }
  assert.deepEqual(updated.steps.map(x=>x.id),original.steps.map(x=>x.id),sample.id);
  assert.equal(Timeline.frame(updated.timing,updated.timing.totalMs).done,true,sample.id);
 }
});

test('#380 transformed cases still reject missing branch or conflicting projection',()=>{
 for(const sample of SAMPLES){
  const input=transformed(sample,1.5,6,-3,4);
  if(sample.family==='point-projection'){
   input.knownViews.H[0]+=1;
   const playback=solve(sample,input,REVISION+3);
   assert.notEqual(playback.status,'ready');
   assert.deepEqual(playback.steps,[]);
  }else{
   delete input.branchId;
   const playback=solve(sample,input,REVISION+3);
   assert.equal(playback.status,'not-verified',sample.id);
   assert.deepEqual(playback.steps,[],sample.id);
  }
 }
});
