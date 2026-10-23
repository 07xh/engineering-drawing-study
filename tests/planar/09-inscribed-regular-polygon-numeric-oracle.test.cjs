'use strict';
/**
 * 09 independent mathematical oracle for proposed 02 regular-polygon solver.
 * IMPORTANT: does not trust the solver's own areaErrorMm2, maxResidualMm,
 * analytic proofLevel or verified flag when forming the reference expected area.
 * No textbook answer scan, private attachment or second geometric solver.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {regularPolygonInCircle:solve}=
 require('../../engines/planar/inscribed-regular-polygon.cjs');

function independentlyMeasuredArea(vertices,center){
 let doubled=0;
 for(let i=0;i<vertices.length;i++){
  const v=vertices[i],next=vertices[(i+1)%vertices.length];
  doubled+=(v.x-center.x)*(next.y-center.y)-
   (next.x-center.x)*(v.y-center.y);
 }
 return Math.abs(doubled)/2;
}
const input=(n,r,x=0,y=0)=>({unit:'mm',center:{x,y},radiusMm:r,
 sideCount:n,firstVertexAngleDeg:0,direction:'ccw',revision:29});

test('09 independent oracle: valid ordinary scales preserve physical perimeter and area',()=>{
 for(const n of [3,6]){
  for(const r of [0.001,1,30,40000]){
   const p=solve(input(n,r,14,-7));
   assert.equal(p.status,'ready','ordinary in-range case must remain usable');
   const chord=2*r*Math.sin(Math.PI/n);
   const expectedArea=n*r*r*Math.sin(2*Math.PI/n)/2;
   const measuredArea=independentlyMeasuredArea(p.vertices,{x:14,y:-7});
   const relArea=Math.abs(measuredArea-expectedArea)/expectedArea;
   assert.ok(relArea<=1e-8,'area relative error '+relArea);
   for(const edge of p.edges)
    assert.ok(Math.abs(edge.lengthMm-chord)<=1e-8*Math.max(1,chord));
   assert.equal(p.constructionReady,false);
  }
 }
});

test('09 large coordinate with micrometre circle must not certify inaccurate relative area',()=>{
 // Finite binary64 coordinates near 1e6 have spacing ~1.16e-10 mm.
 // A 1.01e-6 mm circumradius has only ~8700 representable increments.
 // This creates measurable *relative* distortion although absolute error
 // is below the existing blanket 1e-8 mm tolerance.
 const center={x:1e6,y:1e6},r=1.01e-6;
 for(const n of [3,6]){
  const p=solve(input(n,r,center.x,center.y));
  if(p.status==='ready'){
   const area=independentlyMeasuredArea(p.vertices,center);
   const expected=n*r*r*Math.sin(2*Math.PI/n)/2;
   const relativeError=Math.abs(area-expected)/expected;
   assert.ok(relativeError<=1e-8,
    'cannot certify area error '+relativeError+' for '+n+'-gon as mathematically verified');
  }else{
   assert.equal(p.verified,false);
   assert.deepEqual(p.vertices,[]);
   assert.deepEqual(p.edges,[]);
  }
 }
});

test('09 no false full-book or V5 readiness on solver-only calculations',()=>{
 for(const n of [3,6]){
  const r=solve(input(n,30));
  assert.equal(r.constructionReady,false);
  assert.equal(r.proofScope,'selected-circle-and-orientation');
  assert.ok(!('timing' in r),'proposed M3 source must not invent player');
 }
 const unselected=input(6,30);
 delete unselected.firstVertexAngleDeg;
 const result=solve(unselected);
 assert.equal(result.status,'continuous');
 assert.equal(result.solveResult.solutionCount,null);
 assert.equal(result.solveResult.globallyUnique,false);
});
