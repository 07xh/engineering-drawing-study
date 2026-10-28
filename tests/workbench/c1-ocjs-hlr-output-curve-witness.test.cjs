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
test('native OCCT HLR pcurve is supported only by real planar line samples and has no original 3D authority',()=>{
 const w={...good(),curveIs3D:false};
 const v=verify(w);
 assert.equal(v.actualOCCTHLRCurveBacking,'surface-pcurve');
 assert.equal(v.originalTopoDSSourceForHLREdgeRecovered,false);
 const native=verify({...good(),curveIs3D:true});
 assert.equal(native.actualOCCTHLRCurveBacking,'native-3d');
 assert.throws(()=>verify({...good(),curveIs3D:'false'}),/line curve witness/);
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


test('strict positive subnormal projected HLR segment is not mistaken for a collapsed edge',()=>{
 const q={view:'W',projectedEndpoints:[{u:0,v:0},
  {u:Number.MIN_VALUE,v:0}],parameterRange:[0,1],
  curveKind:'line',curveSamples:[0,0.25,0.5,0.75,1].map(f=>
   pt(Number.MIN_VALUE*f,0))};
 const r=verify(q);
 assert.equal(r.actualOCCTHLRFlattenedBRepLineVerified,true);
 assert.equal(r.actualOCCTHLRCurveOrientation,'same-as-vertices');
 assert.equal(r.formalStandardLineStyle,'undetermined');
 assert.equal(r.v5Authorized,false);
});
test('sub-micrometre fake HLR curve samples cannot pass the old absolute tolerance',()=>{
 const q={view:'H',projectedEndpoints:[{u:0,v:0},{u:1e-10,v:0}],
  parameterRange:[0,1],curveKind:'line',
  curveSamples:[0,0.25,0.5,0.75,1].map(f=>pt(f*1e-10,0))};
 assert.equal(verify(q).actualOCCTHLRFlattenedBRepLineVerified,true);
 const wrongEndpoint={...q,curveSamples:q.curveSamples.map(p=>({...p}))};
 wrongEndpoint.curveSamples[0].x=2e-10;
 assert.throws(()=>verify(wrongEndpoint),/endpoints disagree/);
 const nonaffine={...q,curveSamples:q.curveSamples.map(p=>({...p}))};
 nonaffine.curveSamples[2].y=2e-10;
 assert.throws(()=>verify(nonaffine),/nonaffine/);
});
