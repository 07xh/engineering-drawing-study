'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {cylinderSectionStations:stations}=
 require('../../engines/spatial/sections/cylinder-construction-stations.cjs');
const {classifyCylinderSectionVisibility:visibility}=
 require('../../engines/spatial/sections/cylinder-cut-ray-visibility.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS:OBSERVER}=
 require('../../core/projection/conventions.js');
const P=(x,y,z)=>({x,y,z});
const cylinder={baseCenter:P(2,-3,0),radiusMm:5,heightMm:30};
const horizontal={point:P(0,0,15),normal:P(0,0,1)};
test('04 analytic construction stations always share exact first-angle V/H/W for real 3D sources',()=>{
 const r=stations(cylinder,horizontal,{ordinaryDivisions:8});
 assert.equal(r.status,'ready');assert.equal(r.modelGeometryVerified,true);
 assert.equal(r.constructionStepsReady,false);
 assert.equal(r.projectionMode,'coordinate-VHW-only');
 assert.ok(r.stations.length>=8);
 for(const s of r.stations){
  assert.deepEqual(s.projectedPoint,project(s.intersectionMm));
  assert.deepEqual(s.projectedGenerator.a,project(s.auxiliaryGeneratorMm.a));
  assert.deepEqual(s.projectedGenerator.b,project(s.auxiliaryGeneratorMm.b));
  assert.ok(Math.abs(s.intersectionMm.z-15)<1e-8);
  assert.ok(s.planeResidualMm<1e-7);
  assert.ok(s.sideResidualMm<1e-7);
 }
});
test('04 inclined source retains independent extrema and source/mm residual proof boundary',()=>{
 const p={point:P(0,0,15),normal:P(1,0,3)};
 const result=stations(cylinder,p,{ordinaryDivisions:12});
 assert.equal(result.status,'ready');
 assert.equal(result.extremaPresent,true);
 assert.ok(result.stations.some(x=>x.labels.includes('maximum-height')));
 assert.ok(result.stations.some(x=>x.labels.includes('minimum-height')));
 for(const s of result.stations){
  assert.deepEqual(s.projectedPoint,project(s.intersectionMm));
  const n=p.normal,q=s.intersectionMm;
  assert.ok(Math.abs((q.x-p.point.x)*n.x+(q.y-p.point.y)*n.y+
    (q.z-p.point.z)*n.z)<1e-6);
 }
 assert.equal(result.constructionStepsReady,false);
});
test('04 cylinder full section ray results preserve local-only certification and canonical V/H/W',()=>{
 const r=visibility(cylinder,horizontal,{
  retainedHalfspace:'negative',observerDirection:OBSERVER.H,samplesPerTurn:32});
 assert.equal(r.status,'ready');
 assert.equal(r.totalRuns,r.runs.length);
 assert.equal(r.visibilityVerified,r.counts.undetermined===0);
 assert.equal(r.boundaryEndpointVisibilityVerified,false);
 assert.equal(r.standardViewMappingVerified,false);
 assert.equal(r.v5StrokeStyleReady,false);
 assert.equal(r.globallyUnique,null);
 for(const run of r.runs){
  assert.deepEqual(run.projections.from,project(run.from));
  assert.deepEqual(run.projections.through,project(run.through));
  assert.deepEqual(run.projections.to,project(run.to));
  assert.equal(run.endpointVisibilityVerified,false);
 }
});
test('04 genuinely clipped oblique cylinder topology continues through same geometric output chain',()=>{
 const r=visibility(cylinder,{point:P(0,0,2),normal:P(1,0,3)},{
  retainedHalfspace:'positive',observerDirection:OBSERVER.V,
  samplesPerTurn:32});
 assert.equal(r.status,'ready');
 assert.ok(r.totalRuns>0);
 assert.equal(r.standardViewMappingVerified,false);
 assert.equal(r.v5StrokeStyleReady,false);
 for(const run of r.runs)
  assert.deepEqual(run.projections.through,project(run.through));
});
test('04 unsupported near-parallel or stale implied geometry never gains a V5 line-style proof',()=>{
 const result=stations(cylinder,{point:P(0,0,15),normal:P(1,0,1e-12)},
  {ordinaryDivisions:8});
 assert.notEqual(result.status,'ready');
 assert.equal(result.constructionStepsReady,false);
 assert.throws(()=>visibility(cylinder,horizontal,{
  retainedHalfspace:'negative',observerDirection:P(0,0,0),
  samplesPerTurn:32}),/observer/);
});
