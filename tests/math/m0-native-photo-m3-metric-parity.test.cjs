'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {matchesReviewedMetricInput:matches}=
 require('../../labs/local-reviewed-dimension-draft-ui.cjs');
const P=(x,y)=>({x,y});
const valid=()=>({
 isolation:{status:'reviewed-conditions-isolated',
  m0MetricFrameStatus:'user-reviewed-provisional',
  solverInput:{sourceRevision:7,conditions:[
   {id:'line_1',unit:'mm',geometry:{type:'line',
    start:[20,-50],end:[40,-50]}},
   {id:'curve_1',unit:'mm',geometry:{type:'circle',
    center:[41,-30],radius:8}}
  ]}},
 problem:{kind:'segment-circle',unit:'mm',revision:7,
  geometry:{segment:{a:P(20,-50),b:P(40,-50)},
   circle:{center:P(41,-30),radius:8}}},
 segmentId:'line_1',circleId:'curve_1'
});
test('native reviewed M0 pixel output matches the separately produced real M3 model-mm contract',()=>{
 assert.equal(matches(valid()),true);
});
test('mismatched exact model-mm coordinates and radius reject instead of launching a solve',()=>{
 for(const which of ['ax','by','cx','r']){
  const v=valid();
  if(which==='ax')v.problem.geometry.segment.a.x+=.001;
  if(which==='by')v.problem.geometry.segment.b.y+=1e-8;
  if(which==='cx')v.problem.geometry.circle.center.x+=2;
  if(which==='r')v.problem.geometry.circle.radius+=.01;
  assert.equal(matches(v),false,which);
 }
});
test('changed revision, wrong physical unit, conflicting IDs and insufficient photo review block M0→M3 parity',()=>{
 for(const bad of [
  v=>{v.problem.revision++;},
  v=>{v.problem.unit='px';},
  v=>{v.isolation.m0MetricFrameStatus='unreviewed';},
  v=>{v.isolation.status='not-verified';},
  v=>{v.segmentId=v.circleId;},
  v=>{v.isolation.solverInput.conditions[0].unit='px';},
  v=>{v.problem.kind='two-circles';},
  v=>{v.isolation.solverInput.conditions.push(
   {...v.isolation.solverInput.conditions[0]});}
 ]){
  const x=valid();bad(x);assert.equal(matches(x),false);
 }
});
test('nonfinite, source omissions and forged result booleans never grant geometric parity',()=>{
 for(const bad of [
  v=>{v.problem.geometry.circle.radius=NaN;},
  v=>{v.problem.geometry.segment.a.x=Infinity;},
  v=>{v.isolation.solverInput.conditions[0].geometry.start=[20];},
  v=>{v.isolation.solverInput.conditions.splice(0,1);},
  v=>{v.problem.geometry={};},
  v=>{v.isolation.solverInput=null;},
  v=>{v.isolation=null;}
 ]){
  const x=valid();bad(x);assert.equal(matches(x),false);
 }
 // Caller claiming verification is not a mathematical parity proof.
 const x=valid();x.isolation.sourceRevisionIndependentlyVerified=true;
 x.problem.geometry.circle.center=P(0,0);
 assert.equal(matches(x),false);
});
test('actual public photo UI enforces metric parity before existing M3 solve AND before apply',()=>{
 const code=fs.readFileSync('labs/local-reviewed-dimension-draft-ui.cjs','utf8');
 const verify=code.indexOf("if(!matchesReviewedMetricInput({");
 const solve=code.indexOf("const analytic=solveFiniteFillet(doc.problem)");
 const guard=code.indexOf("function apply()");
 const recheck=code.indexOf("currentIsolation.solverInputHash!==prepared.isolationInputHash");
 assert.ok(verify>=0&&verify<solve,'parity must block native M3 solve');
 assert.ok(recheck>guard,'source and model parity must be repeated before final UI transfer');
 assert.match(code,/sourceCircleId=accepted\.sourceTargetId/);
 assert.doesNotMatch(code,/metricCalibrationMathematicallyProven:true/);
});
