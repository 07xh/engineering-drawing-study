'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1RealNativeScoped2D3DClassBinding:audit}=
 require('../../workbench/c1-native-scoped-2d-3d-class-binding.cjs');
const view='V',sourceEdgeId='m::A|B';
const sourceProjectedFrom={u:0,v:0},sourceProjectedTo={u:10,v:0};
const stroke=(klass,from=0,to=10)=>({
 view,hlrClass:klass,originalPhysicalSourceEdgeId:sourceEdgeId,
 from:{u:from,v:0},to:{u:to,v:0},
 engineeringLineStyle:'undetermined',signedV5Action:false
});
const native=(klass,from,to)=>({
 view,sourceEdgeId,native3DHLRClass:klass,
 derivedFromOriginalNative3DCurveNotGeneratedHLRPaper:true,
 originalM0UnitParameterRange:[from,to],
 engineeringLineStyle:'undetermined',signedV5Action:false
});
const make=(v,h,segments)=>audit({
 view,sourceEdgeId,sourceProjectedFrom,sourceProjectedTo,
 scoped2DVisible:v,scoped2DHidden:h,
 nativeOriginal3DM4:{
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/1',
  view,sourceEdgeId,segments,
  M4ProjectedNative3DIntervalsHeldForBinary64Representation:[],
  officialV5Authorized:false
 }
});
test('actual original-source-filtered generated 2D line has exact same-class original 3D curve support',()=>{
 const r=make([stroke('visible-sharp')],[],[native('visible-sharp',0,1)]);
 assert.equal(r.sourceScoped2DClassBoundWithoutRounding,true);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,1);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,true);
 assert.deepEqual(r.rows[0].originalM0ExactRationalPaperInterval,['0','1']);
 assert.equal(r.rows[0].actualGlobalHLRGenerated2DTopoDSHistoryCertified,false);
 assert.equal(r.officialV5Authorized,false);
 assert.ok(Object.isFrozen(r.rows[0]));
});
test('partial original 3D native class coverage cannot sign entire generated 2D HLR segment',()=>{
 const r=make([stroke('visible-sharp')],[],[native('visible-sharp',0,.5)]);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(r.counts.positiveNative3DClassCoverageGapsFor2DEdges,1);
 assert.deepEqual(r.rows[0].exactNative3DSourceClassPositivePaperCoverageGaps,[['1/2','1']]);
 assert.equal(r.globalGenerated2DEdgeToOriginalTopoDSIdentityCertified,false);
});
test('positive one-ULP original native 3D class gap survives rational 2D join',()=>{
 const next=0.5000000000000001;
 const r=make([stroke('visible-sharp')],[],[
  native('visible-sharp',0,.5),native('visible-sharp',next,1)
 ]);
 assert.equal(r.counts.positiveNative3DClassCoverageGapsFor2DEdges,1);
 assert.equal(r.rows[0].exactNative3DSourceClassPositivePaperCoverageGaps.length,1);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
});
test('opposite true native 3D visibility class never authorizes generated 2D paper alias',()=>{
 const r=make([stroke('visible-sharp')],[],[
  native('visible-sharp',0,.5),native('hidden-sharp',.5,1)
 ]);
 assert.equal(r.counts.exactOppositeClassPositiveOverlapEdges,1);
 assert.equal(r.rows[0].exactOppositeNative3DClassPositiveIntervalConflict,true);
 assert.equal(r.rows[0].nativeOriginal3DClassBacksEntireScoped2DGeneratedPaperSegment,false);
});
test('received native generated 2D off original M0 paper line remains held even with all 3D coverage',()=>{
 const w=stroke('visible-sharp');w.to.v=Number.MIN_VALUE;
 const r=make([w],[],[native('visible-sharp',0,1)]);
 assert.equal(r.rows[0].exactOriginalM0PaperAffineCollinearity,false);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,0);
 assert.equal(r.counts.paperDriftOrClassCoverageHeld,1);
});
test('distinct 3D source or invented class / V5 signoff is rejected',()=>{
 for(const modify of [
  x=>{x[0].originalPhysicalSourceEdgeId='m::B|C';},
  x=>{x[0].signedV5Action=true;},
  x=>{x[0].hlrClass='unverified';},
 ]){
  const s=[stroke('visible-sharp')];modify(s);
  assert.throws(()=>make(s,[],[native('visible-sharp',0,1)]),
   /native source-scoped|forged/);
 }
 const fake=native('hidden-sharp',0,1);
 fake.derivedFromOriginalNative3DCurveNotGeneratedHLRPaper=false;
 assert.throws(()=>make([stroke('visible-sharp')],[],[fake]),
  /invalid native 3D M4/);
});
test('hidden generated 2D source-scoped line may be proven class-consistent only as original 3D evidence',()=>{
 const r=make([],[stroke('hidden-sharp')],[native('hidden-sharp',0,1)]);
 assert.equal(r.counts.exactSameClassNative3DBackedEdges,1);
 assert.equal(r.rows[0].hlrClass,'hidden-sharp');
 assert.equal(r.rows[0].entireOpaqueSceneVisibilityCertified,false);
 assert.equal(r.rows[0].engineeringLineStyle,'undetermined');
});
