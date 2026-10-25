'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {verifyOriginalOcctLinearCurveWitness:verify}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const p=(x,y,z)=>({x,y,z});
const good=()=>({
 sourceEndpoints:[p(2,4,7),p(12,6,9)],
 parameterRange:[-3,17],
 curveSamples:[p(2,4,7),p(7,5,8),p(12,6,9)],
 curveKind:'line'
});
test('actual finite OCCT BRepAdaptor 3D line curve sample geometry is independently checked and unsigned',()=>{
 const r=verify(good());
 assert.equal(r.occtSourceCurveType,'line');
 assert.deepEqual(r.occtSourceCurveParameterRange,[-3,17]);
 assert.equal(r.occtCurveTypeIndependentlyVerified,true);
 assert.equal(r.occtSourceCurve3DEndpointsAndMidpointVerified,true);
 assert.equal(r.generatedHLREdgeTopoDSIdentityMatched,false);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.v5Authorized,false);
});
test('real edge reversed curve orientation retains valid original 3D source endpoints',()=>{
 const g=good();
 g.curveSamples.reverse();
 const r=verify(g);
 assert.equal(r.occtSourceCurve3DEndpointsAndMidpointVerified,true);
});
test('CAD reports a curved BSpline/circle instead of M0 physical straight source: cannot be signed as C1 line',()=>{
 for(const curveKind of ['circle','bspline','unknown',null]){
  assert.throws(()=>verify({...good(),curveKind}),/line curve/);
 }
});
test('forged or shifted curve endpoints cannot match original 3D TopoDS vertices',()=>{
 const g=good();
 g.curveSamples[0]=p(2,4,7.01);
 assert.throws(()=>verify(g),/disagree/);
 const h=good();
 h.curveSamples[2]=p(13,6,9);
 assert.throws(()=>verify(h),/disagree/);
});
test('nonlinear middle point cannot be accepted even if endpoints match',()=>{
 const g=good();
 g.curveSamples[1]=p(7,5,9);
 assert.throws(()=>verify(g),/nonaffine/);
});
test('invalid finite parameter bounds or degenerate source cannot mint a curve witness',()=>{
 const g=good();
 for(const bounds of [[2,2],[3,2],[0,Infinity],[NaN,2]]){
  assert.throws(()=>verify({...g,parameterRange:bounds}),/finite/);
 }
 assert.throws(()=>verify({...g,
  sourceEndpoints:[p(2,4,7),p(2,4,7)],
  curveSamples:[p(2,4,7),p(2,4,7),p(2,4,7)]}),/disagree/);
});
