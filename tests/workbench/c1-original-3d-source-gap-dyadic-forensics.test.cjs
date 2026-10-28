'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1Original3DSourceGapDyadicWitness:audit}=
 require('../../workbench/c1-original-3d-source-gap-dyadic-forensics.cjs');
const tetra={id:'C1SkewTetra',data:{points:{
 A:{x:0,y:0,z:0},B:{x:17,y:1,z:3},
 C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}
},edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']]}};
const run=(view,sourceEdgeId,uncoveredIntervals,geometry=tetra)=>
 audit({geometry,view,sourceEdgeId,uncoveredIntervals});
test('real C1 skew-tetra H and W original A-C micro-tails stay positive and unsigned',()=>{
 for(const [view,end] of [['H',5.02742501717052e-18],
                          ['W',1.1102230246251565e-16]]){
  const r=run(view,'C1SkewTetra::A|C',[[0,end]]);
  assert.equal(r.gapsExamined,1);
  assert.equal(r.exact3DPositiveLengthGaps,1);
  assert.equal(r.rows[0].originalSourceFromVertexId,'A');
  assert.equal(r.rows[0].originalSourceToVertexId,null);
  assert.equal(r.rows[0].exactFirstAngleProjectedGapHasPositiveLength,true);
  assert.equal(r.rows[0].exactDyadicOriginal3DGapComponentSigns.x,1);
  assert.equal(r.rows[0].originalGeneratedTopoDSHistoryCertified,false);
  assert.equal(r.rows[0].engineeringLineStyle,'undetermined');
  assert.equal(r.signedV5ActionCount,0);
 }
});
test('real C1 W A-D micro-tail retains original M0 3D source',()=>{
 const r=run('W','C1SkewTetra::A|D',[[0,9.431983218054427e-18]]);
 assert.deepEqual(r.originalSourceVertexIds,['A','D']);
 assert.equal(r.rows[0].exactDyadicProjectedGapComponentSigns.u,1);
 assert.equal(r.rows[0].exactDyadicProjectedGapComponentSigns.v,1);
 assert.equal(r.globalContinuousVisibilityCertified,false);
});
test('a subnormal positive projected gap can collapse to one rounded paper point',()=>{
 const geometry={id:'tiny',data:{points:{
  A:{x:0,y:0,z:0},B:{x:0,y:Number.MIN_VALUE,z:0}
 },edges:[['A','B']]}};
 const r=run('H','tiny::A|B',[[0,0.5]],geometry);
 assert.equal(r.rows[0].exactOriginal3DGapHasPositiveLength,true);
 assert.equal(r.rows[0].exactFirstAngleProjectedGapHasPositiveLength,true);
 assert.equal(r.rows[0].roundedPaperEndpointsCoincide,true);
 assert.equal(r.positiveProjectedGapsHiddenByBinary64Interpolation,1);
});
test('projection can collapse even when original 3D gap is positive',()=>{
 const geometry={id:'depth',data:{points:{
  A:{x:0,y:0,z:0},B:{x:0,y:10,z:0}
 },edges:[['A','B']]}};
 const r=run('V','depth::A|B',[[0,1]],geometry);
 assert.equal(r.rows[0].exactOriginal3DGapHasPositiveLength,true);
 assert.equal(r.rows[0].exactFirstAngleProjectedGapHasPositiveLength,false);
 assert.equal(r.rows[0].originalSourceToVertexId,'B');
});
test('reversed physical edge orientation binds t=0 to the original first vertex',()=>{
 const geometry={id:'reverse',data:{points:{
  A:{x:0,y:0,z:0},B:{x:10,y:2,z:3}
 },edges:[['B','A']]}};
 const r=run('H','reverse::A|B',[[0,0.25],[0.25,1]],geometry);
 assert.equal(r.rows[0].originalSourceFromVertexId,'B');
 assert.equal(r.rows[1].originalSourceToVertexId,'A');
 assert.equal(r.rows[0].exactDyadicOriginal3DGapComponentSigns.x,-1);
 assert.equal(r.gapsExamined,2);
});
test('missing and forged source or overlapping and invalid intervals fail closed',()=>{
 assert.throws(()=>run('H','C1SkewTetra::A|fake',[[0,0.5]]),/original physical/);
 assert.throws(()=>run('bad','C1SkewTetra::A|C',[[0,0.5]]),/reviewed M0/);
 for(const ranges of [[[0,0]],[[0,1.0000000000000002]],
  [[0,0.5],[0.4,1]],[[0,NaN]],[[-Number.MIN_VALUE,0.5]]])
  assert.throws(()=>run('H','C1SkewTetra::A|C',ranges),/positive, ordered/);
 assert.equal(run('H','C1SkewTetra::A|C',[]).gapsExamined,0);
});
