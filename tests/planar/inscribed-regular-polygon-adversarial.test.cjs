'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {regularPolygonInCircle:solve}=require('../../engines/planar/inscribed-regular-polygon.cjs');
const base=(sideCount,angle,direction,center={x:0,y:0},radiusMm=30)=>({
 unit:'mm',center,radiusMm,sideCount,firstVertexAngleDeg:angle,
 direction,revision:21
});
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),a+' != '+b);
for(const n of [3,6]){
 test('09 polygon rotation invariance and explicit branch choice n='+n,()=>{
  const a=solve(base(n,0,'ccw')),b=solve(base(n,137,'ccw'));
  assert.equal(a.status,'ready');assert.equal(b.status,'ready');
  near(a.sideLengthMm,b.sideLengthMm);
  near(a.areaMm2,b.areaMm2);
  near(a.perimeterMm,b.perimeterMm);
  assert.notDeepEqual(a.vertices,b.vertices);
  assert.equal(a.solveResult.globallyUnique,true);
  assert.equal(b.solveResult.globallyUnique,true);
  assert.equal(a.constructionReady,false);
 });
 test('09 polygon opposite traversal preserves metric invariants n='+n,()=>{
  const a=solve(base(n,47,'ccw')),b=solve(base(n,47,'cw'));
  assert.equal(a.status,'ready');assert.equal(b.status,'ready');
  near(a.areaMm2,b.areaMm2);near(a.sideLengthMm,b.sideLengthMm);
  assert.equal(a.windingVerified,true);assert.equal(b.windingVerified,true);
  near(a.vertices[0].x,b.vertices[0].x);
  near(a.vertices[0].y,b.vertices[0].y);
 });
 test('09 polygon no orientation never claims global uniqueness n='+n,()=>{
  const raw=base(n,0,'ccw');delete raw.firstVertexAngleDeg;
  const r=solve(raw);
  assert.equal(r.status,'continuous');
  assert.equal(r.verified,false);
  assert.equal(r.solveResult.globallyUnique,false);
  assert.equal(r.solveResult.degrees,1);
  assert.deepEqual(r.vertices,[]);
 });
 test('09 polygon invalid precision must fail closed, not emit V5 n='+n,()=>{
  const cases=[
   base(n,13,'ccw',{x:1e6,y:1e6},1e-6),
   base(n,13,'ccw',{x:1e6,y:-1e6},1e-5)
  ];
  for(const c of cases){
   const result=solve(c);
   assert.notEqual(result.status,'ready');
   assert.equal(result.constructionReady,false);
   assert.notEqual(result.solveResult.globallyUnique,true);
  }
 });
}
