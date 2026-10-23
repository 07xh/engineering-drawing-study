'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {regularPolygonInCircle:solve}=
 require('../../engines/planar/inscribed-regular-polygon.cjs');
const {validateSolveResult}=
 require('../../core/contracts/solve-result.js');
const close=(a,b,rel=1e-8)=>assert.ok(Number.isFinite(a)&&
 Math.abs(a-b)<=rel*Math.max(1,Math.abs(a),Math.abs(b)),a+' != '+b);
const input=(sideCount,revision=3)=>({unit:'mm',center:{x:0,y:0},
 radiusMm:30,sideCount,firstVertexAngleDeg:90,direction:'ccw',revision});
const witness=o=>assert.equal(validateSolveResult(o.solveResult).ok,true,
 JSON.stringify(validateSolveResult(o.solveResult).errors));
test('02 inscribed equilateral triangle has real length, area, radial and winding proof',()=>{
 const r=solve(input(3));
 assert.equal(r.status,'ready');assert.equal(r.verified,true);
 assert.equal(r.sideCount,3);assert.equal(r.vertices.length,3);
 assert.equal(r.edges.length,3);assert.equal(r.windingVerified,true);
 assert.equal(r.proofScope,'selected-circle-and-orientation');
 close(r.sideLengthMm,30*Math.sqrt(3));close(r.areaMm2,675*Math.sqrt(3));
 assert.ok(r.maxResidualMm<=r.toleranceMm);
 for(const v of r.vertices)close(Math.hypot(v.x,v.y),30);
 assert.deepEqual(r.edges.map(x=>x.toId),['v2','v3','v1']);
 assert.equal(r.constructionReady,false,'not a deployed V5 lesson');
 assert.equal(r.solveResult.status,'unique');
 assert.equal(r.solveResult.globallyUnique,true);
 witness(r);
});
test('02 regular hexagon equals circumradius in chord length; clockwise winding reverses',()=>{
 const a=solve(input(6)),b=solve({...input(6),direction:'cw'});
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 close(a.sideLengthMm,30);close(a.areaMm2,1350*Math.sqrt(3));
 assert.equal(a.edges.length,6);assert.equal(b.edges.length,6);
 assert.equal(a.windingVerified,true);assert.equal(b.windingVerified,true);
 close(a.perimeterMm,180);close(a.areaMm2,b.areaMm2);
 close(a.vertices[0].x,b.vertices[0].x);
 close(a.vertices[0].y,b.vertices[0].y);
 assert.ok(a.vertices[1].x!==b.vertices[1].x);
 witness(a);witness(b);
});
test('02 untranslated and translated, positively scaled canonical geometry agree',()=>{
 for(const n of [3,6]){
  const r=solve(input(n));
  const scaled=solve({...input(n,4),radiusMm:60,
   center:{x:105,y:-212}});
  assert.equal(scaled.status,'ready');
  assert.equal(scaled.revision,4);
  for(let i=0;i<n;i++){
   close(scaled.vertices[i].x,105+2*r.vertices[i].x);
   close(scaled.vertices[i].y,-212+2*r.vertices[i].y);
  }
  close(scaled.sideLengthMm,2*r.sideLengthMm);
  close(scaled.areaMm2,4*r.areaMm2);
  assert.ok(scaled.maxResidualMm<=scaled.toleranceMm);
  witness(scaled);
 }
});
test('unoriented circle is a continuous rotational family, not unique solution',()=>{
 const raw=input(6);delete raw.firstVertexAngleDeg;
 const r=solve(raw);
 assert.equal(r.status,'continuous');
 assert.equal(r.verified,false);
 assert.equal(r.solveResult.status,'continuous');
 assert.equal(r.solveResult.globallyUnique,false);
 assert.equal(r.solveResult.degrees,1);
 assert.equal(r.solveResult.solutionCount,null);
 assert.deepEqual(r.vertices,[]);
 assert.deepEqual(r.edges,[]);
 witness(r);
});
test('missing directed traversal cannot claim a construction-ready solution',()=>{
 const raw=input(3);delete raw.direction;
 const r=solve(raw);
 assert.equal(r.status,'undetermined');
 assert.equal(r.verified,false);
 assert.equal(r.solveResult.globallyUnique,null);
 assert.equal(r.constructionReady,false);
 assert.deepEqual(r.vertices,[]);
 witness(r);
});
test('other unsupported polygon counts never fabricate approximate answers',()=>{
 for(const n of [4,5,7,24]){
  const r=solve(input(n));
  assert.equal(r.status,'unsupported');
  assert.equal(r.solveResult.solutionCount,null);
  assert.equal(r.constructionReady,false);
  assert.deepEqual(r.vertices,[]);
  witness(r);
 }
});
test('malformed, out-of-bounds, ambiguous and fake proof fields fail closed',()=>{
 const cases=[
  {...input(3),unit:'px'},
  {...input(3),radiusMm:0},
  {...input(3),radiusMm:Infinity},
  {...input(3),radiusMm:1e100},
  {...input(3),center:{x:Infinity,y:0}},
  {...input(3),center:{x:1e9,y:0}},
  {...input(3),center:{x:0,y:0,z:7}},
  {...input(3),revision:-1},
  {...input(3),sideCount:3.4},
  {...input(3),direction:'uncertain'},
  {...input(3),firstVertexAngleDeg:360},
  {...input(3),firstVertexAngleDeg:NaN},
  {...input(3),mathVerified:true}
 ];
 for(const item of cases)assert.throws(()=>solve(item),undefined,JSON.stringify(item));
 assert.throws(()=>solve(null));
 assert.throws(()=>solve([]));
});
