'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cylinderSectionStations:solve}=
 require('../../engines/spatial/sections/cylinder-construction-stations.cjs');
const pt=(x,y,z)=>({x,y,z});
const c=(r=5,h=30,center=pt(0,0,0))=>
 ({baseCenter:center,radiusMm:r,heightMm:h});
const plane=(point,normal)=>({point,normal});
const oblique=()=>plane(pt(0,0,15),pt(1,2,1));
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t,
 String(a)+' != '+String(b));

test('04 station generator returns mathematically checked 3D section points and V/H/W tracks',()=>{
 const result=solve(c(),oblique());
 assert.equal(result.status,'ready');
 assert.equal(result.modelGeometryVerified,true);
 assert.equal(result.constructionStepsReady,false);
 assert.equal(result.globallyUnique,null);
 assert.equal(result.modelUnit,'mm');
 assert.equal(result.supportedCurveKind,'ellipse');
 assert.equal(result.extremaPresent,true);
 assert.ok(result.stations.length>=8&&result.stations.length<=10);
 assert.ok(result.maxResidualMm<=1e-8);
 const labels=result.stations.flatMap(s=>s.labels);
 assert.ok(labels.includes('maximum-height'));
 assert.ok(labels.includes('minimum-height'));
 assert.ok(labels.includes('quadrant'));
 for(const s of result.stations){
  const q=s.intersectionMm;
  near(q.x*q.x+q.y*q.y,25,1e-7);
  near(q.x+2*q.y+q.z,15,1e-7);
  assert.ok(q.z>=0&&q.z<=30);
  assert.deepEqual(s.projectedPoint,{V:{u:q.x,v:q.z},
   H:{u:q.x,v:q.y},W:{u:q.y,v:q.z}});
  assert.deepEqual(s.auxiliaryGeneratorMm.a,
   {x:q.x,y:q.y,z:0});
  assert.deepEqual(s.auxiliaryGeneratorMm.b,
   {x:q.x,y:q.y,z:30});
  near(s.projectedGenerator.a.V.v,0);
  near(s.projectedGenerator.b.V.v,30);
  assert.ok(s.planeResidualMm<1e-8);
  assert.ok(s.sideResidualMm<1e-8);
 }
});
test('04 section height special stations are the actual analytic z extrema',()=>{
 const result=solve(c(),oblique());
 const max=result.stations.find(s=>s.labels.includes('maximum-height'));
 const min=result.stations.find(s=>s.labels.includes('minimum-height'));
 const swing=5*Math.hypot(1,2);
 near(max.intersectionMm.z,15+swing);
 near(min.intersectionMm.z,15-swing);
 near(max.intersectionMm.z,result.sectionZRange.max);
 near(min.intersectionMm.z,result.sectionZRange.min);
});
test('04 a horizontal circle has four quadrant stations but no fake unique height extrema',()=>{
 const result=solve(c(),plane(pt(0,0,10),pt(0,0,1)),{ordinaryDivisions:4});
 assert.equal(result.status,'ready');
 assert.equal(result.supportedCurveKind,'circle');
 assert.equal(result.extremaPresent,false);
 assert.equal(result.stations.length,4);
 for(const s of result.stations){
  assert.deepEqual(s.labels,['quadrant']);
  near(s.intersectionMm.z,10);
 }
});
test('04 parameter sweep stations are sorted by polar angle and no duplicate angular locations',()=>{
 for(const count of [4,8,12,16,24,32]){
  const result=solve(c(),oblique(),{ordinaryDivisions:count});
  assert.equal(result.status,'ready');
  const angles=result.stations.map(x=>x.thetaRadians);
  assert.ok(angles.length>=count&&angles.length<=count+2);
  for(let i=1;i<angles.length;i++)assert.ok(angles[i]-angles[i-1]>1e-9);
  assert.ok(angles.every(theta=>theta>=0&&theta<2*Math.PI));
  assert.equal(new Set(result.stations.map(x=>x.id)).size,result.stations.length);
 }
});
test('04 translated finite cylinder produces translated guides with model projections',()=>{
 const cyl=c(3,16,pt(12,-7,5));
 const result=solve(cyl,plane(pt(12,-7,13),pt(1,0,1)));
 assert.equal(result.status,'ready');
 assert.equal(result.stations.length,8);
 for(const s of result.stations){
  near((s.intersectionMm.x-12)**2+(s.intersectionMm.y+7)**2,9);
  near(s.intersectionMm.x-12+s.intersectionMm.z,13);
  near(s.auxiliaryGeneratorMm.a.z,5);
  near(s.auxiliaryGeneratorMm.b.z,21);
 }
});
test('04 clipped finite side cannot produce verified special points or premature guides',()=>{
 const result=solve(c(),plane(pt(0,0,3),pt(1,0,1)));
 assert.equal(result.status,'blocked');
 assert.equal(result.sourceStatus,'clipped');
 assert.deepEqual(result.stations,[]);
 assert.equal(result.modelGeometryVerified,false);
 assert.equal(result.constructionStepsReady,false);
});
test('04 true vertical section refuses ellipse stations until vertical generator adapter is reviewed',()=>{
 const result=solve(c(),plane(pt(2,0,0),pt(1,0,0)));
 assert.equal(result.status,'blocked');assert.equal(result.sourceStatus,'two-generators');
 assert.deepEqual(result.stations,[]);
});
test('04 near-vertical and no-intersection stay blocked, not a guessed step animation',()=>{
 const nearVertical=solve(c(),plane(pt(0,0,15),pt(1,0,1e-12)));
 assert.equal(nearVertical.status,'blocked');
 assert.equal(nearVertical.sourceStatus,'undetermined');
 const missing=solve(c(),plane(pt(0,0,-8),pt(0,0,1)));
 assert.equal(missing.sourceStatus,'none');
 assert.equal(missing.stations.length,0);
});
test('04 invalid subdivision or missing cylinder geometry fails before proof',()=>{
 const p=oblique();
 for(const ordinaryDivisions of [0,2,5,9,33,NaN,'8',-4])
  assert.throws(()=>solve(c(),p,{ordinaryDivisions}),/ordinaryDivisions/);
 assert.throws(()=>solve(c(0),p),/positive radius/);
 assert.throws(()=>solve(c(),plane(pt(0,0,0),pt(0,0,0))),/degenerate/);
});
test('04 repeated evaluations are deterministic and do not mutate original user inputs',()=>{
 const cylinder=c(),pl=oblique();
 const a=solve(cylinder,pl),b=solve(structuredClone(cylinder),structuredClone(pl));
 assert.deepEqual(a,b);
 assert.deepEqual(cylinder,c());
 assert.deepEqual(pl,oblique());
 assert.doesNotMatch(JSON.stringify(a),/sourceImage|selectedBranch|approvedByUser|globallyUnique:true/);
});
