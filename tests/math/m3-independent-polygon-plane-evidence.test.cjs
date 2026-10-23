'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditPolygonPlaneResidual:audit}=
 require('../../engines/spatial/sections/independent-polygon-plane-audit.cjs');
const {solveVerifiedSectionEvidence:solve}=
 require('../../engines/spatial/sections/verified-section-evidence.cjs');
const p=(x,y,z)=>({x,y,z});
const vertices=points=>points.map(point=>({point}));
const square=vertices([p(0,0,3),p(10,0,3),p(10,10,3),p(0,10,3)]);
const plane=(z,normal=p(0,0,1))=>({point:p(0,0,z),normal});

test('independent M3 plane invariant accepts real points and scaled/reversed normals',()=>{
 for(const normal of [p(0,0,1),p(0,0,7),p(0,0,-10)]){
  const result=audit(square,plane(3,normal),{
   modelExtentMm:10,claimedMaxResidualMm:0
  });
  assert.equal(result.ok,true);
  assert.equal(result.measuredMaxResidualMm,0);
 }
});

test('false plane and false reported residual are independently rejected',()=>{
 const offset=vertices([p(0,0,3),p(10,0,3),
  p(10,10,3+1e-7),p(0,10,3)]);
 const unreported=audit(offset,plane(3),{
  modelExtentMm:10,claimedMaxResidualMm:0
 });
 assert.equal(unreported.ok,false,
  'a small in-tolerance deviation is NOT an excuse to underreport max residual');
 const reported=audit(offset,plane(3),{
  modelExtentMm:10,claimedMaxResidualMm:2e-7
 });
 assert.equal(reported.ok,true);
 const wrongPlane=audit(square,plane(3.001),{
  modelExtentMm:10,claimedMaxResidualMm:1
 });
 assert.equal(wrongPlane.ok,false,
  'a forged large residual claim cannot widen the independent physical tolerance');
});

test('translation and model scale do not silently alter plane membership',()=>{
 const translate=point=>p(point.x+1e5,point.y-2e5,point.z+3e5);
 const moved=vertices(square.map(v=>translate(v.point)));
 const result=audit(moved,{point:translate(p(0,0,3)),normal:p(0,0,9)},{
  modelExtentMm:10,claimedMaxResidualMm:0
 });
 assert.equal(result.ok,true);
 const bad=vertices(moved.map(v=>({...v.point})));
 bad[0].point.z+=0.01;
 assert.equal(audit(bad,{point:translate(p(0,0,3)),normal:p(0,0,9)},{
  modelExtentMm:10,claimedMaxResidualMm:0.01
 }).ok,false);
});

test('malformed numbers and zero normals cannot enter trusted M3 proof',()=>{
 const valid={modelExtentMm:10,claimedMaxResidualMm:0};
 for(const [vs,pl,opt] of [
  [square,plane(3,p(0,0,0)),valid],
  [square,plane(3),{...valid,modelExtentMm:NaN}],
  [square,plane(3),{...valid,claimedMaxResidualMm:-1}],
  [vertices([p(0,0,3),p(10,0,3),p(Infinity,10,3)]),plane(3),valid]
 ])assert.throws(()=>audit(vs,pl,opt));
});

test('actual prism/pyramid M3 recomputations retain only scope-limited evidence',()=>{
 const inputs=[
  {kind:'rectangular-prism',
   solid:{min:p(0,0,0),max:p(10,10,10)},
   plane:{point:p(0,0,12),normal:p(1,1,1)}},
  {kind:'rectangular-pyramid',
   solid:{base:{minX:0,minY:0,maxX:10,maxY:10,z:0},
    apex:p(5,5,15)},
   plane:{point:p(0,0,15),normal:p(1,1,1)}}
 ];
 for(const item of inputs){
  for(const factor of [1,3,-2]){
   const result=solve({...item,plane:{...item.plane,
    normal:Object.fromEntries(['x','y','z'].map(k=>[k,item.plane.normal[k]*factor]))},
    frame:'model-mm-3d',unit:'mm'});
   assert.equal(result.geometryVerifiedWithinSpecialistScope,true);
   assert.equal(result.sourceProblemConfirmed,false);
   assert.equal(result.visibilityVerified,false);
   assert.equal(result.globallyUnique,null);
  }
 }
});
