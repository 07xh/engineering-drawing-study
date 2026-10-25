'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {verifyOcjsHLRProjectedLineCurveWitness:verify}=
 require('../../engines/spatial/hlr/c1-ocjs-output-curve-witness.cjs');
const pt=(x,y,z=0)=>({x,y,z});
const good=()=>({
 view:'V',projectedEndpoints:[{u:2,v:3},{u:10,v:7}],
 parameterRange:[-2,6],curveKind:'line',
 curveSamples:[pt(2,-3),pt(4,-4),pt(6,-5),pt(8,-6),pt(10,-7)]
});
test('real GeomAbs_Line projected HLR samples bind the whole finite curve to V projection while remaining unsigned',()=>{
 const r=verify(good());
 assert.equal(r.actualOCCTHLRFlattenedBRepLineVerified,true);
 assert.equal(r.actualOCCTHLRCurveEntireFiniteIntervalIsLine,true);
 assert.equal(r.actualOCCTHLRCurveOrientation,'same-as-vertices');
 assert.deepEqual(r.actualOCCTHLRCurveParameterRange,[-2,6]);
 assert.deepEqual(r.actualOCCTHLRCurveSamplesProjectedMm[2],{u:6,v:5});
 assert.equal(r.originalTopoDSSourceForHLREdgeRecovered,false);
 assert.equal(r.formalStandardLineStyle,'undetermined');
 assert.equal(r.v5Authorized,false);
});
test('reversed original HLR vertices agree with measured analytic OCCT curve independently of orientation',()=>{
 const q=good();q.projectedEndpoints.reverse();
 assert.equal(verify(q).actualOCCTHLRCurveOrientation,'reverse-of-vertices');
});
test('same real planar HLR validation applies to H and W without new projection authority',()=>{
 for(const view of ['H','W']){
  const q={...good(),view};
  const r=verify(q);
  assert.equal(r.hlrView,view);
  assert.equal(r.originalTopoDSSourceForHLREdgeRecovered,false);
 }
});
test('endpoints alone cannot hide a non-affine OCCT curve between vertices',()=>{
 for(const index of [1,2,3]){
  const q=good();q.curveSamples[index]={...q.curveSamples[index],
   y:q.curveSamples[index].y+0.02};
  assert.throws(()=>verify(q),/nonaffine/);
 }
});
test('out-of-plane CAD geometry and fake TopoDS endpoints fail closed before M5',()=>{
 const q=good();q.curveSamples[2].z=0.001;
 assert.throws(()=>verify(q),/projection plane/);
 const r=good();r.curveSamples[0].x=2.1;
 assert.throws(()=>verify(r),/endpoints disagree/);
 const s=good();s.curveSamples[4].x=10.1;
 assert.throws(()=>verify(s),/endpoints disagree/);
});
test('nonline, nonfinite, degenerate parameters or invalid first-angle view never gain witness',()=>{
 for(const kind of ['circle','bspline',null]){
  assert.throws(()=>verify({...good(),curveKind:kind}),/line curve witness/);
 }
 for(const parameterRange of [[1,1],[3,2],[NaN,4],[1,Infinity]]){
  assert.throws(()=>verify({...good(),parameterRange}),/line curve witness/);
 }
 assert.throws(()=>verify({...good(),view:'Q'}),/line curve witness/);
 assert.throws(()=>verify({...good(),projectedEndpoints:[
  {u:2,v:3},{u:2,v:3}]}),/collapsed/);
});
