'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {gradeStudentAuxiliaries:grade}=require('../../workbench/verified-ruler-steps.cjs');
const {constructParallelLine,constructConcentricCircle}=require('../../workbench/verified-ruler-tools.cjs');
const {finiteTwoSegmentFillets}=require('../../engines/planar/two-segment-fillet.cjs');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const S=()=>({first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10});
const C=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10,
 firstMode:'external',secondMode:'external'});
const ruler=(args,id,rev=7)=>{
 const center=finiteTwoSegmentFillets(args).candidates.find(c=>c.id===id);
 assert.ok(center,'valid branch fixture');
 return ['first','second'].map(sourceId=>({
  ...constructParallelLine(args[sourceId],center.sides[sourceId]*args.filletRadius,{revision:rev}),
  sourceId}));
};
const compasses=(args,rev=7)=>{
 const loci=circleCircleFilletCenters(args).auxiliary;
 return ['first','second'].map(sourceId=>({
  ...constructConcentricCircle(args[sourceId],loci[sourceId+'Locus'].radius,{revision:rev}),
  sourceId}));
};
test('two student-chosen real signed offset guide lines are checked against their branch',()=>{
 const args=S();
 const a=ruler(args,'s++');
 const z=grade('segments',args,a,{branchId:'s++',revision:7});
 assert.equal(z.status,'correct');assert.equal(z.matchedCount,2);
 assert.equal(z.extraCount,0);assert.deepEqual(z.remainingSources,[]);
 assert.equal(z.arcG1Verified,false);assert.equal(z.completeProblemVerified,false);
 assert.match(z.reason,/仍须独立确定切点/);
});
test('two exact concentric compass loci are mathematically matched to known circles',()=>{
 const args=C(),a=compasses(args),ids=circleCircleFilletCenters(args).candidates.map(c=>c.id);
 const z=grade('circles',args,a,{branchId:ids[0],revision:7});
 assert.equal(z.status,'correct');assert.equal(z.matchedCount,2);
 assert.equal(z.proofScope,'two-user-constructed-auxiliary-loci-only');
});
test('offset lines selected for wrong signed branch do not pass when their centers differ',()=>{
 const args=S(),correct=ruler(args,'s++');
 const wrong=grade('segments',args,correct,{branchId:'s--',revision:7});
 assert.equal(wrong.status,'incorrect');assert.equal(wrong.matchedCount,0);
});
test('students can submit valid second construction before first',()=>{
 const args=S(),a=ruler(args,'s++').reverse();
 const z=grade('segments',args,a,{branchId:'s++',revision:7});
 assert.equal(z.status,'correct');
});
test('correct one ruler action yields partial proof, never full center or G1',()=>{
 const args=S(),a=ruler(args,'s++');
 const z=grade('segments',args,a.slice(0,1),{branchId:'s++',revision:7});
 assert.equal(z.status,'partial');
 assert.equal(z.matchedCount,1);
 assert.deepEqual(z.remainingSources,['second']);
});
test('duplicate correct first ruler stroke cannot count as second',()=>{
 const args=S(),a=ruler(args,'s++');
 const z=grade('segments',args,[a[0],{...a[0]}],{branchId:'s++',revision:7});
 assert.equal(z.status,'partial');assert.equal(z.matchedCount,1);assert.equal(z.extraCount,1);
});
test('one incorrect extra locus forbids declaring all student construction steps clean',()=>{
 const args=C(),a=compasses(args),center=circleCircleFilletCenters(args).candidates[0];
 const z=grade('circles',args,[...a,{...a[0],radius:200}],
  {branchId:center.id,revision:7});
 assert.equal(z.status,'partial');assert.equal(z.matchedCount,2);
 assert.equal(z.extraCount,1);
});
test('forged parallel line with correct offset metadata but shifted geometry fails',()=>{
 const args=S(),a=ruler(args,'s++');
 const forged={...a[0],from:{...a[0].from,x:a[0].from.x+10}};
 const z=grade('segments',args,[forged,a[1]],{branchId:'s++',revision:7});
 assert.equal(z.status,'partial');assert.equal(z.matchedCount,1);
});
test('reversed line endpoints still mean exact same mathematical guide',()=>{
 const args=S(),a=ruler(args,'s++');
 const r={...a[0],from:a[0].to,to:a[0].from};
 assert.equal(grade('segments',args,[r,a[1]],{branchId:'s++',revision:7}).status,'correct');
});
test('concentric construction must share original mathematical center',()=>{
 const args=C(),a=compasses(args);
 a[0]={...a[0],center:{x:2,y:0}};
 const center=circleCircleFilletCenters(args).candidates[0];
 const z=grade('circles',args,a,{branchId:center.id,revision:7});
 assert.equal(z.status,'partial');assert.equal(z.matchedCount,1);
});
test('wrong compass mode radius fails even when center is correct',()=>{
 const args=C(),a=compasses(args);
 a[1]={...a[1],radius:a[1].radius+1};
 const center=circleCircleFilletCenters(args).candidates[0];
 assert.equal(grade('circles',args,a,{branchId:center.id,revision:7}).status,'partial');
});
test('missing or nonexistent student branch is not auto-inferred',()=>{
 const args=S(),a=ruler(args,'s++');
 assert.equal(grade('segments',args,a,{revision:7}).status,'branch-required');
 assert.equal(grade('segments',args,a,{branchId:'none',revision:7}).status,'invalid-branch');
});
test('continuous and empty solver results cannot be turned into unique auxiliary answers',()=>{
 const parallel={first:{a:{x:-10,y:0},b:{x:10,y:0}},
  second:{a:{x:-4,y:6},b:{x:4,y:6}},
  firstSide:1,secondSide:-1,filletRadius:3};
 const z=grade('segments',parallel,[],{branchId:'s+-',revision:7});
 assert.equal(z.status,'not-gradeable');assert.equal(z.matchedCount,0);
 const no={...S(),first:{a:{x:-2,y:0},b:{x:2,y:0}}};
 assert.equal(grade('segments',no,[],{branchId:'s++',revision:7}).status,'not-gradeable');
});
test('student-created guide cannot survive revised inputs',()=>{
 const args=S(),a=ruler(args,'s++',7);
 assert.throws(()=>grade('segments',args,a,{branchId:'s++',revision:8}),/stale/);
 assert.throws(()=>grade('segments',args,a,{branchId:'s++',revision:-1}),/revision/);
});
test('invalid source, unsupported tool type, too many actions and nonfinite circle blocked',()=>{
 const args=C(),a=compasses(args);
 assert.throws(()=>grade('other',args,a,{revision:7}),/kind/);
 assert.throws(()=>grade('circles',args,[{...a[0],sourceId:'fake'}],{revision:7}),/invalid/);
 assert.throws(()=>grade('circles',args,new Array(65).fill(a[0]),{revision:7}),/bounded/);
 assert.equal(grade('circles',args,[{...a[0],center:{x:NaN,y:1}}],
  {branchId:'center-1',revision:7}).status,'incorrect');
});
test("source geometry and student's chosen tools are never mutated",()=>{
 const args=S(),a=ruler(args,'s++'),prior=JSON.stringify({args,a});
 grade('segments',args,a,{branchId:'s++',revision:7});
 assert.equal(JSON.stringify({args,a}),prior);
});
