'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1OriginalCoProjectedDepthOrder}=
 require('../../workbench/c1-original-coproject-depth-order.cjs');
const geometry=()=>({
 id:'CubeOverlap',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{
  A:{x:0,y:0,z:0},B:{x:4,y:0,z:0},C:{x:4,y:3,z:0},
  D:{x:0,y:3,z:0},E:{x:0,y:0,z:5},F:{x:4,y:0,z:5},
  G:{x:4,y:3,z:5},H:{x:0,y:3,z:5}},
  edges:[['A','E'],['D','H'],['A','B']],
  faces:[]
 }
});
const source=(a,b)=>'CubeOverlap::'+[a,b].sort().join('|');
const peer=(a,b,status='single-opaque-solid-whole-open-ray-clear',
 range=[0,1])=>({
 sourceGeometryId:'CubeOverlap',sourceEdgeId:source(a,b),
 view:'V',originalParameterRange:range,status
});
const check=(geom,id,peers,range=[0,1])=>
 auditC1OriginalCoProjectedDepthOrder({
  geometry:geom,view:'V',sourceEdgeId:id,
  originalParameterRange:range,peers
 });
test('same paper interval from independent original 3D edges has strict front order',()=>{
 const a=check(geometry(),source('A','E'),[peer('D','H',
  'single-opaque-solid-whole-open-ray-strictly-hidden')]);
 assert.equal(a.status,'candidate-strictly-front-of-all-aliases');
 assert.equal(a.aliasesExamined,1);
 assert.equal(a.wholeIntervalFrontmostCertified,true);
 assert.deepEqual(a.comparisons[0].depthDifferenceAtEndsMm,[3,3]);
});
test('verified back physical edge is suppressed by actual front-visible source',()=>{
 const a=check(geometry(),source('D','H'),[peer('A','E')]);
 assert.equal(a.status,'suppressed-by-front-original-visible-source');
 assert.equal(a.visibleSourceCoversEntireLine,true);
 assert.equal(a.wholeIntervalFrontmostCertified,false);
});
test('positive partial overlap cannot certify a whole source stroke',()=>{
 const g=geometry();g.data.points.H.z=2;
 const a=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(a.status,'undetermined-coproject-source-order');
 assert.equal(a.comparisons[0].status,
  'partial-or-ambiguous-coproject-overlap');
});
test('affine depth reversal through the middle remains unsigned',()=>{
 const g=geometry();g.data.points.D.y=3;g.data.points.H.y=-3;
 const a=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(a.status,'undetermined-coproject-source-order');
 assert.equal(a.comparisons[0].status,'depth-switch-or-tie');
});
test('front/back ranking uses the first-angle observer ray, not numerical coordinate size',()=>{
 const a=check(geometry(),source('A','E'),[peer('D','H')]);
 assert.equal(a.comparisons[0].depthDifferenceAtEndsMm[0],3);
 const back=check(geometry(),source('D','H'),[peer('A','E',
  'single-opaque-solid-whole-open-ray-strictly-hidden')]);
 assert.equal(back.status,'undetermined-source-behind-unverified-peer');
});
test('forged stale original parameter ranges fail closed',()=>{
 assert.throws(()=>check(geometry(),source('A','E'),[
  peer('D','H',undefined,[0,1.5])
 ]),/forged original peer/);
 assert.throws(()=>check(geometry(),'CubeOverlap::nope',[]),
  /unrecognized original source/);
});

test('exact paper identity never invents a co-projected 3D alias from a near-parallel edge',()=>{
 const g=geometry();
 g.data.points.D.x=1e-10;g.data.points.H.x=1e-10;
 const out=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(out.aliasesExamined,0);
 assert.equal(out.status,'no-positive-projected-source-alias');
 assert.equal(out.engineeringLineStyleSigned,false);
});
test('sub-tolerance positive paper overlap remains an M4 split obligation',()=>{
 const g=geometry();
 g.data.points.D.z=5-1e-10;g.data.points.H.z=8;
 const out=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(out.aliasesExamined,1);
 assert.equal(out.status,'undetermined-coproject-source-order');
 assert.equal(out.wholeIntervalFrontmostCertified,false);
 assert.equal(out.comparisons[0].status,'partial-or-ambiguous-coproject-overlap');
});
test('one-ULP positive overlap at a source endpoint cannot be discarded by floating fractions',()=>{
 const bits=new DataView(new ArrayBuffer(8));
 bits.setFloat64(0,5,false);
 bits.setBigUint64(0,bits.getBigUint64(0,false)-1n,false);
 const g=geometry();
 g.data.points.D.z=bits.getFloat64(0,false);
 g.data.points.H.z=7;
 const out=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(out.aliasesExamined,1);
 assert.equal(out.wholeIntervalFrontmostCertified,false);
 assert.equal(out.status,'undetermined-coproject-source-order');
});

test('one-subnormal-unit positive original observer depth establishes strict order without a 1e-7 mm cutoff',()=>{
 const g=geometry();
 g.data.points.D.y=Number.MIN_VALUE;
 g.data.points.H.y=Number.MIN_VALUE;
 const front=check(g,source('A','E'),[peer('D','H',
  'single-opaque-solid-whole-open-ray-strictly-hidden')]);
 assert.equal(front.status,'candidate-strictly-front-of-all-aliases');
 assert.equal(front.wholeIntervalFrontmostCertified,true);
 assert.deepEqual(front.comparisons[0].
  exactBinary64RationalOriginalDepthDifferenceEndSigns,[1,1]);
 assert.equal(front.comparisons[0].strictOriginal3DDepthOrderNoToleranceUsed,true);
 const back=check(g,source('D','H'),[peer('A','E')]);
 assert.equal(back.status,'suppressed-by-front-original-visible-source');
 assert.deepEqual(back.comparisons[0].
  exactBinary64RationalOriginalDepthDifferenceEndSigns,[-1,-1]);
 assert.equal(back.engineeringLineStyleSigned,false);
 assert.equal(back.signedV5ActionCount,0);
});
test('reversed original 3D peer edge preserves strict all-endpoint proof',()=>{
 const g=geometry();g.data.edges[1]=['H','D'];
 const out=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(out.status,'candidate-strictly-front-of-all-aliases');
 assert.deepEqual(out.comparisons[0].exactBinary64RationalOriginalDepthDifferenceEndSigns,[1,1]);
});
test('exact overlapping paper sources at identical depth remain unresolved even with a clear peer',()=>{
 const g=geometry();g.data.points.D.y=0;g.data.points.H.y=0;
 const out=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(out.status,'undetermined-coproject-source-order');
 assert.equal(out.comparisons[0].status,'depth-switch-or-tie');
 assert.deepEqual(out.comparisons[0].exactBinary64RationalOriginalDepthDifferenceEndSigns,[0,0]);
 assert.equal(out.wholeIntervalFrontmostCertified,false);
});
test('large original source coordinates retain strict rational ray sign across rounded paper orientation',()=>{
 const g=geometry(),offset=2**50;
 for(const v of Object.values(g.data.points)){
  v.x+=offset;v.z+=offset;v.y+=offset;
 }
 const out=check(g,source('A','E'),[peer('D','H')]);
 assert.equal(out.status,'candidate-strictly-front-of-all-aliases');
 assert.deepEqual(out.comparisons[0].exactBinary64RationalOriginalDepthDifferenceEndSigns,[1,1]);
});

test('diagonal original M4 cut lies on its exact affine M0 line even when JS projection drifts',()=>{
 const g={id:'RoundedDiagonal',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:{
   A:{x:0,y:0,z:0},B:{x:17,y:0,z:3},
   C:{x:0,y:2,z:0},D:{x:17,y:2,z:3}
  },edges:[['A','B'],['C','D']]}};
 const out=auditC1OriginalCoProjectedDepthOrder({
  geometry:g,view:'V',sourceEdgeId:'RoundedDiagonal::A|B',
  originalParameterRange:[.1,.9],
  peers:[{view:'V',sourceGeometryId:'RoundedDiagonal',
   sourceEdgeId:'RoundedDiagonal::C|D',
   originalParameterRange:[0,1],
   status:'single-opaque-solid-whole-open-ray-strictly-hidden'}]
 });
 assert.equal(out.wholeIntervalFrontmostCertified,true);
 assert.equal(out.status,'candidate-strictly-front-of-all-aliases');
 assert.deepEqual(out.comparisons[0].
  exactBinary64RationalOriginalDepthDifferenceEndSigns,[1,1]);
 assert.equal(out.originalM0AffineSourceAndM4CutParametersComparedExactly,true);
 assert.equal(out.roundedM4PaperInterpolationCannotCreateOrEraseSourceOverlap,true);
 assert.equal(out.engineeringLineStyleSigned,false);
});
test('exact parametric diagonal ordering remains unresolved when other physical source is only a partial alias',()=>{
 const g={id:'PartialDiagonal',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:{
   A:{x:0,y:0,z:0},B:{x:17,y:0,z:3},
   C:{x:8.5,y:2,z:1.5},D:{x:17,y:2,z:3}
  },edges:[['A','B'],['C','D']]}};
 const out=auditC1OriginalCoProjectedDepthOrder({
  geometry:g,view:'V',sourceEdgeId:'PartialDiagonal::A|B',
  originalParameterRange:[.1,.9],
  peers:[{view:'V',sourceGeometryId:'PartialDiagonal',
   sourceEdgeId:'PartialDiagonal::C|D',
   originalParameterRange:[0,1],
   status:'single-opaque-solid-whole-open-ray-clear'}]
 });
 assert.equal(out.wholeIntervalFrontmostCertified,false);
 assert.equal(out.status,'undetermined-coproject-source-order');
 assert.equal(out.comparisons[0].status,'partial-or-ambiguous-coproject-overlap');
 assert.equal(out.comparisons[0].exactOriginalSourceWholePaperOverlapProven,false);
});
