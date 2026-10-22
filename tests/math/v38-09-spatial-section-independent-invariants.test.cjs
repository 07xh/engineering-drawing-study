'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismPlaneSection}=require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const {intersectCylinderSidePlane}=require('../../engines/spatial/sections/axis-cylinder-plane.cjs');
const p=(x,y,z)=>({x,y,z});
const plane=(point,normal)=>({point,normal});
const pointResidual=(v,q,n)=>{
 const norm=Math.hypot(n.x,n.y,n.z);
 return Math.abs(((v.x-q.x)*n.x+(v.y-q.y)*n.y+(v.z-q.z)*n.z)/norm);
};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const eq=(a,b,tolerance=1e-7)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=tolerance, String(a)+' != '+String(b));
const prism={min:p(0,0,0),max:p(10,10,10)};
const pyramid={base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)};
function independentPerimeter(result,sectionPlane,tol=1e-7){
 assert.equal(result.status,'ready');assert.equal(result.verified,true);
 assert.equal(result.perimeterVerified,true);
 const n=result.vertices.length;
 assert.ok(n>=3);assert.equal(n,result.perimeter.length);
 let length=0;
 for(let i=0;i<n;i++){
  const v=result.vertices[i],w=result.vertices[(i+1)%n],edge=result.perimeter[i];
  assert.equal(edge.fromId,v.id);assert.equal(edge.toId,w.id);
  for(const q of [v.point,w.point])assert.ok(pointResidual(q,sectionPlane.point,sectionPlane.normal)<=tol);
  length+=distance(v.point,w.point);
  for(const [name,expected] of [['V',{u:v.point.x,v:v.point.z}],
   ['H',{u:v.point.x,v:v.point.y}],['W',{u:v.point.y,v:v.point.z}]])
   assert.deepEqual(v.projection[name],expected);
 }
 eq(length,result.perimeterMm,tol*n);
 assert.equal(result.globallyUnique,null);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.v5StepsReady,false);
 assert.equal(result.sectionInteriorVerified,false);
}
test('09 independent plane residual and perimeter oracle for real six-corner prism section',()=>{
 const cut=plane(p(0,0,12),p(1,1,1)),r=prismPlaneSection(prism,cut);
 assert.equal(r.vertices.length,6);
 independentPerimeter(r,cut);
 assert.ok(r.vertices.every(v=>['x','y','z'].every(k=>v.point[k]>=0&&v.point[k]<=10)));
});
test('09 independent plane residual and edge loop for real five-corner pyramid cut',()=>{
 const cut=plane(p(0,0,15),p(1,1,1)),r=pyramidPlaneSection(pyramid,cut);
 assert.equal(r.vertices.length,5);
 independentPerimeter(r,cut);
 assert.equal(new Set(r.perimeter.map(x=>x.sourceFaceId)).size,5);
});
test('09 real cylinder lateral analytic circle points satisfy both underlying equations',()=>{
 const c={baseCenter:p(2,-3,0),radiusMm:5,heightMm:30};
 const cut=plane(p(0,0,15),p(0,0,1));
 const r=intersectCylinderSidePlane(c,cut,{samples:32});
 assert.equal(r.status,'ready');assert.equal(r.analyticCurveVerified,true);
 assert.equal(r.completeLateralIntersection,true);
 assert.equal(r.globallyUnique,null);
 assert.equal(r.points.length,33);
 for(const q of r.points){
  eq(Math.hypot(q.x-c.baseCenter.x,q.y-c.baseCenter.y),5,1e-7);
  eq(q.z,15,1e-7);
  assert.ok(q.z>=0&&q.z<=30);
 }
 assert.equal(r.requiresSolidCapAnalysis,false);
});
test('09 source prism and pyramid mathematical no-section cannot produce verified perimeter',()=>{
 for(const x of [
  prismPlaneSection(prism,plane(p(0,0,100),p(0,0,1))),
  pyramidPlaneSection(pyramid,plane(p(0,0,100),p(0,0,1)))
 ]){
  assert.equal(x.status,'none');assert.equal(x.verified,false);
  assert.equal(x.perimeterVerified,false);
  assert.deepEqual(x.perimeter,[]);assert.equal(x.globallyUnique,null);
 }
});
test('09 actual prism horizontal unit sections have independently known area and perimeter',()=>{
 const cut=plane(p(0,0,5),p(0,0,1)),r=prismPlaneSection(prism,cut);
 independentPerimeter(r,cut);
 eq(r.areaMm2,100);eq(r.perimeterMm,40);
 assert.equal(r.vertices.length,4);
});
test('09 reject zero plane normal and malformed shapes at actual specialist solver boundary',()=>{
 assert.throws(()=>prismPlaneSection(prism,plane(p(0,0,0),p(0,0,0))),/degenerate/);
 assert.throws(()=>pyramidPlaneSection(pyramid,plane(p(0,0,0),p(0,0,0))),/degenerate/);
 assert.throws(()=>intersectCylinderSidePlane(
  {baseCenter:p(0,0,0),radiusMm:0,heightMm:10},plane(p(0,0,5),p(0,0,1))));
});
