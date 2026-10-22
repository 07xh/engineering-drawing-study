'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {sectionEvidence}=require('../../core/results/section-evidence.cjs');
const {validateSolveResult}=require('../../core/contracts/solve-result.js');
const {prismPlaneSection}=require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const {intersectCylinderSidePlane}=require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const p=(x,y,z)=>({x,y,z});
const plane=(point,normal)=>({point,normal});
test('real finite prism and pyramid section geometry retains evidence but NEVER gains uniqueness',()=>{
 const data=[
  ['prism',prismPlaneSection({min:p(0,0,0),max:p(10,10,10)},plane(p(0,0,12),p(1,1,1)))],
  ['pyramid',pyramidPlaneSection({base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)},plane(p(0,0,15),p(1,1,1)))]
 ];
 for(const [name,r] of data){
  assert.equal(r.status,'ready');
  const before=JSON.stringify(r);
  const e=sectionEvidence({result:r,solverId:name});
  assert.equal(validateSolveResult(e).ok,true);
  assert.equal(e.status,'undetermined');
  assert.equal(e.geometryVerifiedWithinLegacyScope,true);
  assert.equal(e.maxResidual,r.maxResidualMm);
  assert.equal(e.globallyUnique,null);
  assert.equal(e.proofOfGlobalUniqueness,false);
  assert.equal(e.visibilityVerified,false);
  assert.equal(e.solutionCount,null);
  assert.equal(JSON.stringify(r),before);
 }
});
test('real analytic lateral cylinder section never claims whole-solid or projection proof',()=>{
 const r=intersectCylinderSidePlane({baseCenter:p(0,0,0),radiusMm:5,heightMm:30},
  plane(p(0,0,15),p(1,0,1)),{samples:24});
 assert.equal(r.status,'ready');
 const e=sectionEvidence({result:r,solverId:'cylinder'});
 assert.equal(e.geometryVerifiedWithinLegacyScope,true);
 assert.equal(e.status,'undetermined');
 assert.equal(e.visibilityVerified,false);
});
test('invalid, degenerate, no-intersection and unstable inputs fail closed',()=>{
 const cases=[
  {status:'none',verified:false,modelUnit:'mm'},
  {status:'boundary-degenerate',verified:false,modelUnit:'mm'},
  {status:'undetermined',verified:false,modelUnit:'mm'},
  {status:'clipped',verified:false,modelUnit:'mm'},
 ];
 for(const result of cases){
  const e=sectionEvidence({result,solverId:'legacy'});
  assert.equal(e.geometryVerifiedWithinLegacyScope,false);
  assert.equal(e.maxResidual,null);
  assert.equal(e.status,'undetermined');
 }
 for(const result of [{status:'ready',verified:true},{status:'ready',verified:true,maxResidualMm:NaN},
  {status:'ready',verified:true,maxResidualMm:-1},{status:'ready',verified:true,maxResidualMm:0,globallyUnique:true},
  {status:'ready',verified:true,maxResidualMm:0,modelUnit:'sheet-px'},
  {status:'none',verified:true},{status:'invented',verified:false}]){
  assert.throws(()=>sectionEvidence({result,solverId:'legacy'}));
 }
 assert.throws(()=>sectionEvidence({result:{status:'ready',verified:true,maxResidualMm:0}}),/solverId/);
});
test('bounded immutable evidence and explicit no-proof semantics',()=>{
 const r={status:'two-generators',verified:true,modelUnit:'mm',maxResidualMm:0,reason:'source geometry only'};
 const e=sectionEvidence({result:r,solverId:'source-v1'});
 assert.equal(e.legacyStatus,'two-generators');
 assert.equal(Object.isFrozen(e),true);
 assert.equal(Object.isFrozen(e.diagnostics),true);
 assert.equal(e.proofLevel,'none');
 assert.equal(e.localDegrees,null);
 assert.equal(e.degrees,null);
});
