'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1OriginalOcctCurveParameterGapWitness:audit}=
 require('../../workbench/c1-original-occt-curve-parameter-gap-witness.cjs');
const points={A:{x:0,y:0,z:0},C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}};
const geometry={id:'C1SkewTetra',data:{points,edges:[['A','C'],['A','D']]}};
const source=(edge=['A','C'],reverse=false,offset=0)=>{
 const [a,b]=edge.map(id=>points[id]);
 return {sourceEdgeId:'C1SkewTetra::'+edge.join('|'),
  occtSourceCurveParameterRange:[offset,offset+
   Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)],
  occtSourceCurveFirstPoint3D:{...(reverse?b:a)},
  occtSourceCurveLastPoint3D:{...(reverse?a:b)},
  originalOCCTBRepVertexXYZMatched:true,
  occtCurveTypeIndependentlyVerified:true,
  occtSourceCurve3DEndpointsAndMidpointVerified:true,
  occtSourceCurveType:'line'};
};
const run=(view,edge,gaps,record=source(edge))=>audit({
 geometry,view,sourceEdgeId:'C1SkewTetra::'+edge.join('|'),
 originalBRepSource:record,uncoveredIntervals:gaps});
test('three real skew-tetra positive A-end tails map to original native OCCT curve parameters, unsigned',()=>{
 for(const [view,edge,end] of [
  ['H',['A','C'],5.02742501717052e-18],
  ['W',['A','C'],1.1102230246251565e-16],
  ['W',['A','D'],9.431983218054427e-18]]){
  const r=run(view,edge,[[0,end]]);
  assert.equal(r.gapsExamined,1);
  assert.equal(r.originalOcctCurveFirstParameterVertexId,'A');
  assert.equal(r.originalOcctCurveParameterIncreasesWithM0SourceParameter,true);
  assert.equal(r.rows[0].originalM0FromVertexId,'A');
  assert.equal(r.rows[0].exactOriginalOcctCurveParameterGapDirection,1);
  assert.equal(r.rows[0].exactOriginalOcctCurveParameterGapHasPositiveLength,true);
  assert.equal(r.rows[0].generatedHLREdgeToOriginalTopoDSHistoryCertified,false);
  assert.equal(r.rows[0].engineeringLineStyle,'undetermined');
  assert.equal(r.signedV5ActionCount,0);
 }
});
test('BRepAdaptor first/last curve samples, not explorer order, determine reverse source parameter direction',()=>{
 const r=run('W',['A','C'],[[0,0.25],[0.25,1]],
  source(['A','C'],true));
 assert.equal(r.originalOcctCurveFirstParameterVertexId,'C');
 assert.equal(r.originalOcctCurveLastParameterVertexId,'A');
 assert.equal(r.originalOcctCurveParameterIncreasesWithM0SourceParameter,false);
 assert.equal(r.rows[0].exactOriginalOcctCurveParameterGapDirection,-1);
 assert.equal(r.rows[1].originalM0ToVertexId,'C');
 assert.ok(r.rows[0].originalOcctCurveParameterGapRounded[0]>
  r.rows[0].originalOcctCurveParameterGapRounded[1]);
});
test('subnormal positive M0 gap remains exact even if native OCCT parameter addition rounds both ends to same offset',()=>{
 const r=run('H',['A','C'],[[0,Number.MIN_VALUE]],
  source(['A','C'],false,100));
 assert.equal(r.rows[0].exactOriginalOcctCurveParameterGapHasPositiveLength,true);
 assert.equal(r.rows[0].roundedOriginalOcctCurveParameterGapCollapsed,true);
 assert.equal(r.roundedCollapsedButExactPositiveNativeCurveGaps,1);
 assert.equal(r.generatedHLREdgeToOriginalTopoDSHistoryCertified,false);
});
test('forged original BRep source, parameter speed or first/last samples cannot acquire a curve-direction witness',()=>{
 const base=source();
 for(const mutation of [
  {sourceEdgeId:'C1SkewTetra::A|D'},
  {occtSourceCurveType:'circle'},
  {occtSourceCurveParameterRange:[0,1]},
  {occtSourceCurveFirstPoint3D:{x:1,y:2,z:3}},
  {occtSourceCurveLastPoint3D:{...points.A}},
  {occtCurveTypeIndependentlyVerified:false}
 ]){
  assert.throws(()=>run('H',['A','C'],[[0,0.5]],{...base,...mutation}),
   /actual original OCCT|parameters contradict|direction missing/);
 }
});
test('overlap, empty or out-of-range gap endpoints, invalid view and missing source fail closed',()=>{
 for(const gaps of [
  [[0,0]],[[0,1.0000000000000002]],[[0,0.5],[0.49,1]],
  [[NaN,1]],[[-Number.MIN_VALUE,0.5]]])
  assert.throws(()=>run('H',['A','C'],gaps),/ordered positive/);
 assert.throws(()=>run('X',['A','C'],[[0,0.5]]),/reviewed C1/);
 assert.throws(()=>run('H',['B','C'],[[0,0.5]],source(['A','C'])),/original physical/);
});
test('empty native gap inventory is an immutable diagnostic, never a V5 certificate',()=>{
 const r=run('V',['A','C'],[]);
 assert.equal(r.gapsExamined,0);
 assert.equal(r.signedV5ActionCount,0);
 assert.equal(r.constructionIntentAuthorized,false);
 assert.equal(r.globalContinuousVisibilityCertified,false);
 assert.ok(Object.isFrozen(r));
});
