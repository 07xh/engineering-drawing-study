'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {constructParallelLine:parallel,constructConcentricCircle:compass,
 snapChosenFilletCenter:snap}=require('../../workbench/verified-ruler-tools.cjs');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../../engines/planar/two-segment-fillet.cjs');
const close=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<=e,a+' != '+b);
const line=()=>({a:{x:-20,y:0},b:{x:20,y:0}});
const circles=()=>({first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},filletRadius:10,
 firstMode:'external',secondMode:'external'});
const segments=()=>({first:line(),
 second:{a:{x:0,y:-20},b:{x:0,y:20}},filletRadius:10});
test('digital parallel ruler creates real signed normal offset, never pixel-scaled line',()=>{
 const c=parallel(line(),10,{revision:3});
 assert.equal(c.tool,'parallel-ruler');
 assert.equal(c.kind,'line');
 assert.equal(c.revision,3);
 assert.equal(c.coordinateSpace,'model-mm');
 close(c.from.x,-20);close(c.from.y,10);
 close(c.to.x,20);close(c.to.y,10);
 close(c.offsetResidualMm,0);
 assert.equal(c.proofScope,'parallel-line-construction-only');
});
test('reversing source orientation and signed offset produces identical geometric locus',()=>{
 const src=line();
 const a=parallel(src,10),b=parallel({a:src.b,b:src.a},-10);
 close(a.from.x,b.to.x);close(a.from.y,b.to.y);
 close(a.to.x,b.from.x);close(a.to.y,b.from.y);
});
test('non-axis-aligned ruler maintains signed perpendicular distance',()=>{
 const result=parallel({a:{x:1,y:2},b:{x:4,y:6}},5);
 close(result.from.x,-3);close(result.from.y,5);
 close(result.to.x,0);close(result.to.y,9);
});
test('concentric compass preserves original known circle center and student-selected radius',()=>{
 const source={center:{x:-3,y:5},radius:6};
 const c=compass(source,16,{revision:5});
 assert.equal(c.kind,'circle');assert.equal(c.coordinateSpace,'model-mm');
 assert.deepEqual(c.center,source.center);assert.equal(c.radius,16);
 assert.equal(c.revision,5);assert.equal(source.radius,6);
 assert.equal(c.proofScope,'concentric-circle-construction-only');
});
test('digital tools reject degenerate lines, blank radii, NaN and stale input revisions',()=>{
 assert.throws(()=>parallel(line(),0),/offset/);
 assert.throws(()=>parallel(line(),Infinity),/offset/);
 assert.throws(()=>parallel({a:{x:1,y:2},b:{x:1,y:2}},3));
 assert.throws(()=>parallel(line(),2,{revision:-1}),/revision/);
 assert.throws(()=>compass({center:{x:0,y:0},radius:3},0),/radius/);
 assert.throws(()=>compass({center:{x:0,y:0},radius:NaN},3));
 assert.throws(()=>compass({center:{x:0,y:0},radius:3},5,{revision:1.5}),/revision/);
});
test('student must select the correct finite two-segment candidate before snapping',()=>{
 const args=segments(),solved=finiteTwoSegmentFillets(args);
 assert.equal(solved.status,'multiple');
 const target=solved.candidates.find(c=>c.id==='s++');
 assert.ok(target);
 const stroke={...target.center,revision:4};
 const r=snap('segments',args,stroke,{branchId:target.id,revision:4});
 assert.equal(r.status,'verified-center');
 assert.equal(r.branchId,'s++');
 assert.deepEqual(r.snappedPoint,target.center);
 close(r.residualMm,0);
 assert.equal(r.arcG1Verified,false);
 assert.equal(r.completeProblemVerified,false);
 assert.equal(r.proofScope,'selected-center-only');
});
test('same drawn candidate without explicit branch stays unresolved',()=>{
 const args=segments(),solved=finiteTwoSegmentFillets(args);
 const stroke={...solved.candidates[0].center,revision:4};
 const r=snap('segments',args,stroke,{revision:4});
 assert.equal(r.status,'branch-required');
 assert.equal(r.snappedPoint,undefined);
});
test('choosing the wrong branch cannot auto-snap to another nearby solution',()=>{
 const args=segments(),solved=finiteTwoSegmentFillets(args);
 const wrong={...solved.candidates[0].center,revision:4};
 const desired=solved.candidates[1].id;
 const r=snap('segments',args,wrong,{branchId:desired,revision:4});
 assert.equal(r.status,'incorrect');
 assert.equal(r.snappedPoint,undefined);
});
test('circle-circle original two center candidates can be individually selected, never inferred',()=>{
 const args=circles(),solved=circleCircleFilletCenters(args);
 assert.equal(solved.status,'multiple');
 for(const c of solved.candidates){
  const r=snap('circles',args,{...c.center,revision:2},
   {branchId:c.id,revision:2});
  assert.equal(r.status,'verified-center');
  assert.equal(r.branchId,c.id);
  assert.equal(r.arcG1Verified,false);
 }
});
test('wrong or out-of-range candidate ID is not a verified center',()=>{
 const args=circles(),candidate=circleCircleFilletCenters(args).candidates[0];
 const r=snap('circles',args,{...candidate.center,revision:2},
  {branchId:'fake',revision:2});
 assert.equal(r.status,'invalid-branch');
 assert.equal(r.snappedPoint,undefined);
});
test('millimetre tolerance is applied to math coordinates and is bounded',()=>{
 const args=circles(),candidate=circleCircleFilletCenters(args).candidates[0];
 const near={x:candidate.center.x+0.4,y:candidate.center.y,revision:2};
 assert.equal(snap('circles',args,near,
  {branchId:candidate.id,revision:2,toleranceMm:0.5}).status,'verified-center');
 assert.equal(snap('circles',args,near,
  {branchId:candidate.id,revision:2,toleranceMm:0.2}).status,'incorrect');
 assert.throws(()=>snap('circles',args,near,
  {branchId:candidate.id,revision:2,toleranceMm:3}),/tolerance/);
});
test('stale drawing cannot be accepted for a new solver input',()=>{
 const args=segments(),c=finiteTwoSegmentFillets(args).candidates[0];
 assert.throws(()=>snap('segments',args,{...c.center,revision:1},
  {branchId:c.id,revision:2}),/stale/);
});
test('no-solution and continuous candidate families fail closed without invented center',()=>{
 const args=segments(),parallelArgs={
  first:{a:{x:-10,y:0},b:{x:10,y:0}},
  second:{a:{x:-4,y:6},b:{x:4,y:6}},filletRadius:3,
  firstSide:1,secondSide:-1
 };
 const result=snap('segments',parallelArgs,{x:0,y:3,revision:4},
  {branchId:'any',revision:4});
 assert.equal(result.status,'not-gradeable');
 assert.equal(result.snappedPoint,undefined);
 const no={...args,first:{a:{x:-2,y:0},b:{x:2,y:0}}};
 const out=snap('segments',no,{x:3,y:3,revision:4},
  {branchId:'s++',revision:4});
 assert.equal(out.status,'not-gradeable');
});
test('inputs are not mutated and scaled geometry can be verified in model units',()=>{
 const args=segments(),orig=JSON.stringify(args);
 const c=finiteTwoSegmentFillets(args).candidates[0];
 snap('segments',args,{...c.center,revision:3},
  {branchId:c.id,revision:3});
 assert.equal(JSON.stringify(args),orig);
 const factor=3,S=p=>({x:p.x*factor,y:p.y*factor});
 const scaled={first:{a:S(args.first.a),b:S(args.first.b)},
  second:{a:S(args.second.a),b:S(args.second.b)},
  filletRadius:args.filletRadius*factor};
 const chosen=finiteTwoSegmentFillets(scaled).candidates.find(x=>x.id===c.id);
 assert.ok(chosen);
 assert.equal(snap('segments',scaled,{...chosen.center,revision:3},
  {branchId:chosen.id,revision:3}).status,'verified-center');
});
