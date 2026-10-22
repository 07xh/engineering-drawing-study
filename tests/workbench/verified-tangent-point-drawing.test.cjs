'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {gradeStudentTangentPoints:grade}=require('../../workbench/verified-tangent-point-drawing.cjs');
const {finiteTwoSegmentFillets}=require('../../engines/planar/two-segment-fillet.cjs');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const segments=()=>({first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10});
const circles=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10,
 firstMode:'external',secondMode:'external'});
const get=(kind,args,id)=>(
 kind==='segments'?finiteTwoSegmentFillets(args):circleCircleFilletCenters(args))
 .candidates.find(c=>c.id===id);
const marks=(c,revision=4)=>['first','second'].map(sourceId=>({
 kind:'tangent-point',sourceId,point:{...c.contacts[sourceId]},revision}));
test('two finite segment contact marks pass only source-specific true contact math',()=>{
 const args=segments(),candidate=get('segments',args,'s++');
 const r=grade('segments',args,marks(candidate),{branchId:'s++',revision:4});
 assert.equal(r.status,'correct');assert.equal(r.matchedCount,2);
 assert.equal(r.contactLocationsVerified,true);
 assert.equal(r.arcG1Verified,false);
 assert.equal(r.completeProblemVerified,false);
 assert.equal(r.gradeScope,'two-selected-tangent-points-only');
 assert.equal(r.remainingSources.length,0);
 assert.deepEqual(r.residualsMm,{first:0,second:0});
 assert.match(r.reason,/还需独立验证连接弧/);
});
test('two circles with real computed contact points also pass in mm',()=>{
 const args=circles(),c=get('circles',args,'center-1');
 const r=grade('circles',args,marks(c),{branchId:c.id,revision:4});
 assert.equal(r.status,'correct');assert.equal(r.kind,'circles');
 assert.equal(r.arcG1Verified,false);
});
test('student may locate true tangent contacts before arc direction/G1 is selected',()=>{
 const args=segments(),c=get('segments',args,'s++');
 assert.equal(grade('segments',args,marks(c),{branchId:'s++',revision:4}).status,'correct');
});
test('empty and one point are incomplete/partial rather than fully correct',()=>{
 const args=segments(),c=get('segments',args,'s++');
 assert.equal(grade('segments',args,[],{branchId:'s++',revision:4}).status,'incomplete');
 const r=grade('segments',args,marks(c).slice(0,1),{branchId:'s++',revision:4});
 assert.equal(r.status,'partial');assert.equal(r.matchedCount,1);
 assert.deepEqual(r.remainingSources,['second']);
});
test('duplicated first point can never count as the second tangent point',()=>{
 const args=segments(),c=get('segments',args,'s++'),one=marks(c)[0];
 const r=grade('segments',args,[one,{...one,point:{...one.point}}],
  {branchId:'s++',revision:4});
 assert.equal(r.status,'partial');
 assert.equal(r.matchedCount,1);assert.equal(r.extraCount,1);
});
test('correct coordinates assigned to wrong source do not pass',()=>{
 const args=circles(),c=get('circles',args,'center-1');
 const m=marks(c).map(x=>({...x,sourceId:x.sourceId==='first'?'second':'first'}));
 const r=grade('circles',args,m,{branchId:'center-1',revision:4});
 assert.equal(r.status,'incorrect');assert.equal(r.matchedCount,0);
});
test('wrong candidate branch is not repaired by automatic nearest-point choice',()=>{
 const args=circles(),c=get('circles',args,'center-1');
 const wrong=grade('circles',args,marks(c),{branchId:'center-2',revision:4});
 assert.notEqual(wrong.status,'correct');assert.equal(wrong.contactLocationsVerified,false);
 assert.equal(grade('circles',args,marks(c),{revision:4}).status,'branch-required');
 assert.equal(grade('circles',args,marks(c),{branchId:'not-real',revision:4}).status,'invalid-branch');
});
test('finite segment tangent contact marked on the infinite line extension does not pass',()=>{
 const args=segments(),c=get('segments',args,'s++');
 const m=marks(c);m[0].point.x=29;
 const r=grade('segments',args,m,{branchId:'s++',revision:4});
 assert.equal(r.status,'partial');assert.deepEqual(r.remainingSources,['first']);
});
test('pen tap inside 0.75 mm tolerance passes; a farther tap fails',()=>{
 const args=circles(),c=get('circles',args,'center-1'),m=marks(c);
 m[0].point.x+=.5;
 assert.equal(grade('circles',args,m,{branchId:'center-1',revision:4}).status,'correct');
 assert.equal(grade('circles',args,m,{branchId:'center-1',revision:4,toleranceMm:.2}).status,'partial');
});
test('stale, nonfinite, wrong source and unreasonable tolerance are rejected',()=>{
 const args=segments(),c=get('segments',args,'s++'),m=marks(c);
 assert.throws(()=>grade('segments',args,m,{branchId:'s++',revision:5}),/stale/);
 assert.throws(()=>grade('segments',args,[{...m[0],point:{x:NaN,y:4}}],
  {branchId:'s++',revision:4}),/invalid/);
 assert.throws(()=>grade('segments',args,[{...m[0],sourceId:'third'}],
  {branchId:'s++',revision:4}),/invalid/);
 assert.throws(()=>grade('segments',args,m,{branchId:'s++',revision:4,toleranceMm:3}),/tolerance/);
 assert.throws(()=>grade('segments',args,Array(65).fill(m[0]),
  {branchId:'s++',revision:4}),/bounded/);
});
test('continuous centers and no solutions never produce invented expected tangent points',()=>{
 const args={first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:-20,y:20},b:{x:20,y:20}},filletRadius:10,
 firstSide:1,secondSide:-1};
 const r=grade('segments',args,[],{branchId:'arbitrary',revision:4});
 assert.equal(r.status,'not-gradeable');assert.equal(r.contactLocationsVerified,false);
 const no=circles();no.second.center.x=150;
 assert.equal(grade('circles',no,[],{branchId:'center-1',revision:4}).status,'not-gradeable');
});
test('graded student inputs remain unchanged after independent solver recomputation',()=>{
 const args=circles(),c=get('circles',args,'center-1'),m=marks(c);
 const a=JSON.stringify(args),b=JSON.stringify(m);
 grade('circles',args,m,{branchId:'center-1',revision:4});
 assert.equal(JSON.stringify(args),a);assert.equal(JSON.stringify(m),b);
});
