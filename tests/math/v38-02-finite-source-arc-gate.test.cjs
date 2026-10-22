'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {normalizeProblem,solveFiniteFillet:solve}=
 require('../../engines/constraints-2d/finite-fillet-gate.cjs');
const {circleCircleFilletCenters:rawTwoCircles}=
 require('../../engines/planar/circle-circle-fillet.cjs');
const {finiteSegmentCircleFillets:rawSegmentCircle}=
 require('../../engines/planar/segment-circle-fillet.cjs');
const first={center:{x:0,y:0},radius:5};
const second={center:{x:20,y:0},radius:5};
const source=(arc)=>({kind:'two-circles',unit:'mm',revision:24,
 geometry:{first:{...first,...(arc!==undefined?{arc}:{})},second},
 filletRadius:10,options:{firstMode:'external',secondMode:'external'}});
const upper={startAngle:0,endAngle:180,direction:'ccw'};
const lower={startAngle:180,endAngle:360,direction:'ccw'};
test('02 reviewed finite first source arc preserves correct old branch ID and explicit candidate scope',()=>{
 const full=solve(source()),cut=solve(source(upper));
 assert.equal(full.status,'multiple');assert.equal(full.candidateCount,2);
 assert.deepEqual(full.candidates.map(x=>x.branchId),['center-1','center-2']);
 assert.equal(cut.status,'unique');assert.deepEqual(cut.candidates.map(x=>x.branchId),['center-2']);
 assert.equal(cut.candidateCount,1);assert.equal(cut.globallyUnique,null);
 assert.equal(cut.directedG1Verified,false);assert.equal(cut.finishedArcVerified,false);
 assert.equal(cut.candidates[0].finiteSourceContactsVerified,true);
});
test('02 complementary finite source arc selects the other real supporting-circle branch',()=>{
 const cut=solve(source(lower));
 assert.deepEqual(cut.candidates.map(x=>x.branchId),['center-1']);
 assert.equal(cut.globallyUnique,null);
});
test('02 same real specialized solver independently enforces finite source membership',()=>{
 const problem=source(upper),typed=normalizeProblem(problem);
 const old=rawTwoCircles({...typed.geometry,filletRadius:typed.filletRadius,
   ...typed.options});
 const next=solve(problem);
 assert.equal(old.status,next.status);
 assert.deepEqual(old.candidates.map(x=>x.id),next.candidates.map(x=>x.branchId));
 assert.equal(old.candidates[0].sourceArcRangeVerified,true);
 assert.equal(old.candidates[0].sourceArcChecks.first,true);
 assert.equal(old.candidates[0].sourceArcChecks.second,true);
 assert.ok(Object.isFrozen(upper)===false);
});
test('02 original finite segment plus finite source circle arc remains valid via common gate',()=>{
 const problem={kind:'segment-circle',unit:'mm',revision:9,
  geometry:{segment:{a:{x:-15,y:0},b:{x:15,y:0}},
   circle:{center:{x:0,y:5},radius:8,
    arc:{startAngle:180,endAngle:360,direction:'ccw'}}},
  filletRadius:3,options:{side:1}};
 const typed=normalizeProblem(problem);
 const sourceResult=rawSegmentCircle({...typed.geometry,
  filletRadius:typed.filletRadius,...typed.options});
 const adapted=solve(problem);
 assert.ok(sourceResult.candidates.length>=1);
 assert.deepEqual(adapted.candidates.map(x=>x.branchId),
  sourceResult.candidates.map(x=>x.id));
 assert.equal(adapted.globallyUnique,null);
 assert.ok(adapted.candidates.every(x=>x.finiteSourceContactsVerified));
});
test('02 malformed finite source arc input fails closed at existing 02 specialist rules',()=>{
 for(const arc of [
  {startAngle:0,endAngle:0,direction:'ccw'},
  {startAngle:0,endAngle:360,direction:'cw'},
  {startAngle:0,endAngle:180,direction:'sideways'},
  {startAngle:NaN,endAngle:180,direction:'ccw'},
  {...upper,sweepDegrees:180},
  null
 ])assert.throws(()=>solve(source(arc)));
 const bad=source({...upper,unreviewed:true});
 assert.throws(()=>solve(bad),/unsupported field/);
});
test('02 injected solver may not forge unverified finite source arc contacts',()=>{
 const fake=()=>({status:'unique',candidateCount:1,candidates:[{
  id:'fake',center:{x:10,y:11},maxResidual:0,
  contacts:{first:{x:1,y:1},second:{x:19,y:1}}
 }]});
 assert.throws(()=>solve(source(upper),{solvers:{'two-circles':fake}}),
  /finite source-circle arc contacts not verified/);
});
test('02 wrong pixel units and stale/invalid revision still reject before real solving',()=>{
 assert.throws(()=>solve({...source(upper),unit:'sheet-px'}),/unit mm/);
 assert.throws(()=>solve({...source(upper),revision:-1}),/revision/);
 const p=source(upper),before=JSON.stringify(p);
 const normalized=normalizeProblem(p);
 assert.deepEqual(normalized.geometry.first.arc,upper);
 assert.equal(JSON.stringify(p),before);
});
