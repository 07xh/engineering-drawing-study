'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1M5NativeGlobal3DSourceJoin:audit}=
 require('../../workbench/c1-m5-global-native-3d-source-join.cjs');
function setup(){
 const geometry={id:'g',data:{edges:[['A','B'],['A','C'],['B','C']]}};
 const cad={sourceGeometryId:'g',revision:4,
  views:{V:[]},hiddenSharpViews:{V:[{},{},{}]},
  nativeSourceScopedSharpOutputByView:{V:{
   nativeGlobal3DOriginalSourceEvidence:{
    schema:'draftai-c1-global-native-hlr-3d-original-curve-corroboration/1',
    sourceGeometryId:'g',revision:4,view:'V',
    globalGenerated2DSharpEdges:3,
    globalGenerated3DSharpEdgesWithUniqueOriginalCurve:3,
    allGenerated3DSharpCurvesBoundToOriginalBRepAnd2DPaper:true,
    generated2DTo3DTopoDSHistoryCertified:false,
    globalContinuousVisibilityCertified:false,
    officialV5Authorized:false,signedV5ActionCount:0,
    rows:['g::A|C','g::B|C','g::A|B'].map((source,i)=>({
     view:'V',hlrClass:'hidden-sharp',wholeSolidGeneratedHLREdgeOrdinal:i,
     originalPhysicalSourceEdgeId:source,originalNativeCurveParameterRange:[0,10+i],
     globalNative3DHLRCurveEqualsOriginalBRepAtThreeParameters:true,
     global3DAnd2DHLRMeasuredPaperPairUnique:true,
     global3DAnd2DHLRMeasuredPaperPairExactBinary64:true,
     global3DAnd2DHLRMeasuredPaperPairBoundedSourceScaleULPOnly:false,
     global3DAndOriginalScoped3DHLRParameterIntervalExact:true,
     globalGenerated2DTo3DTopoDSHistoryCertified:false,
     fullOpaqueSceneContinuousOcclusionCertified:false,
     engineeringLineStyle:'undetermined',signedV5Action:false
    }))
   }
  }}
 };
 // Real-source-shaped independent input BRep and filtered 3D class
 // inventories, not a fabricated "already corroborated" summary flag.
 const originals=cad.nativeSourceScopedSharpOutputByView.V
  .nativeGlobal3DOriginalSourceEvidence.rows;
 cad.originalBRepSourceEdges=originals.map(row=>({
  sourceEdgeId:row.originalPhysicalSourceEdgeId,occtSourceCurveType:'line',
  occtSourceCurveParameterRange:[...row.originalNativeCurveParameterRange],
  originalOCCTBRepVertexXYZMatched:true,
  occtSourceCurve3DEndpointsAndMidpointVerified:true
 }));
 cad.nativeSourceScopedSharpOutputByView.V.rows=originals.map(row=>({
  originalPhysicalSourceEdgeId:row.originalPhysicalSourceEdgeId,
  visible3D:{nativeSourceFilteredOriginalTopoDSEdge:true,
   native3DGeneratedCurveIntervals:[]},
  hidden3D:{nativeSourceFilteredOriginalTopoDSEdge:true,
   native3DGeneratedCurveIntervals:[{
    nativeSourceFilterOriginalEdgeId:row.originalPhysicalSourceEdgeId,
    native3DCurveExactlySameAsOriginalAtThreeParameters:true,
    originalGeneratedTopoDSHistoryCertified:false,signedV5Action:false,
    nativeOriginalCurveParameterRange:[...row.originalNativeCurveParameterRange]
   }]}
 }));
 return {geometry,cad,view:'V',sourceEdgeId:'g::A|B',
  generatedClaims:[{hlrClass:'hidden-sharp',wholeSolidGeneratedHLREdgeOrdinal:2}]};
}
test('genuine global native 3D BRep source corroborates correct held HLR ordinal but cannot sign V5',()=>{
 const result=audit(setup());
 assert.equal(result.globallyUnique3DBRepCurveSources,3);
 assert.equal(result.sourceCorroboratedClaims,1);
 assert.equal(result.differentOriginal3DSourceClaimsHeld,0);
 assert.deepEqual(result.claims[0].originalNativeCurveParameterRange,[0,12]);
 assert.equal(result.claims[0].generated2DTopoDSHistoryCertified,false);
 assert.equal(result.officialV5Authorized,false);
 assert.ok(Object.isFrozen(result.claims[0]));
});
test('genuine 2D paper alias from another 3D edge is held as a source contradiction',()=>{
 const x=setup();
 x.generatedClaims[0].wholeSolidGeneratedHLREdgeOrdinal=1;
 const result=audit(x);
 assert.equal(result.sourceCorroboratedClaims,0);
 assert.equal(result.differentOriginal3DSourceClaimsHeld,1);
 assert.equal(result.claims[0].actualNativeGlobal3DOriginalSourceEdgeId,'g::B|C');
 assert.equal(result.claims[0].paperOnlyCandidateActuallyBelongsToDifferent3DSource,true);
 assert.equal(result.officialV5Authorized,false);
});
test('missing native global 3D proof remains absent, never turns paper claims into evidence',()=>{
 const x=setup();
 delete x.cad.nativeSourceScopedSharpOutputByView;
 assert.equal(audit(x),null);
});
test('reject forged global generated 3D ownership, ordinal gaps, stale proof and false history',()=>{
 const modifications=[
  x=>x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence.revision=3,
  x=>x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence.rows[0].originalPhysicalSourceEdgeId='g::FAKE',
  x=>x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence.rows[1].wholeSolidGeneratedHLREdgeOrdinal=0,
  x=>x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence.rows[1].originalNativeCurveParameterRange=[3,3],
  x=>x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence.rows[1].globalGenerated2DTo3DTopoDSHistoryCertified=true,
  x=>x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence.rows[1].global3DAndOriginalScoped3DHLRParameterIntervalExact=false,
  x=>x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence.globalContinuousVisibilityCertified=true,
  x=>x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence.rows.pop(),
  x=>x.generatedClaims.push({...x.generatedClaims[0]}),
  x=>x.generatedClaims[0].wholeSolidGeneratedHLREdgeOrdinal=3
 ];
 for(const modify of modifications){
  const x=setup();modify(x);
  assert.throws(()=>audit(x),/global|source|duplicate|native|incomplete|unsigned|ordinal|invalid|contract/i);
 }
});

test('native global source attribution replays ORIGINAL BRep bounds and exact filtered 3D HLR class intervals',()=>{
 const x=setup(),r=audit(x);
 assert.equal(r.sameRunOriginalBRepAndScoped3DParameterInventoryRechecked,true);
 assert.equal(r.claims[0].sameRunOriginalBRepCurveBoundsAndSourceFilteredNative3DIntervalRechecked,true);
 assert.equal(r.claims[0].generated2DTopoDSHistoryCertified,false);
 // A genuine subspan is allowed only when it is present in the actual
 // original source filtered 3D class inventory and stays within BRep.
 const src=x.cad.nativeSourceScopedSharpOutputByView.V;
 const raw=src.nativeGlobal3DOriginalSourceEvidence.rows[2];
 raw.originalNativeCurveParameterRange=[1,12];
 src.rows[2].hidden3D.native3DGeneratedCurveIntervals[0]
  .nativeOriginalCurveParameterRange=[1,12];
 const sub=audit(x);
 assert.deepEqual(sub.claims[0].originalNativeCurveParameterRange,[1,12]);
 assert.equal(sub.officialV5Authorized,false);
});
test('forged original BRep bounds, source identities and native 3D filtered class intervals cannot borrow valid global flags',()=>{
 for(const mutate of [
  x=>{delete x.cad.originalBRepSourceEdges;},
  x=>{x.cad.originalBRepSourceEdges.pop();},
  x=>{x.cad.originalBRepSourceEdges[2].sourceEdgeId='g::A|C';},
  x=>{x.cad.originalBRepSourceEdges[2].occtSourceCurveParameterRange=[0,10];},
  x=>{x.cad.originalBRepSourceEdges[2].occtSourceCurveType='circle';},
  x=>{x.cad.originalBRepSourceEdges[2].originalOCCTBRepVertexXYZMatched=false;},
  x=>{delete x.cad.nativeSourceScopedSharpOutputByView.V.rows;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows.pop();},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[2].originalPhysicalSourceEdgeId='g::A|C';},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[2].hidden3D.nativeSourceFilteredOriginalTopoDSEdge=false;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[2].hidden3D.native3DGeneratedCurveIntervals[0].nativeOriginalCurveParameterRange=[0,11];},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[2].hidden3D.native3DGeneratedCurveIntervals[0].nativeSourceFilterOriginalEdgeId='g::A|C';},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[2].hidden3D.native3DGeneratedCurveIntervals[0].native3DCurveExactlySameAsOriginalAtThreeParameters=false;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[2].hidden3D.native3DGeneratedCurveIntervals.push(
    structuredClone(x.cad.nativeSourceScopedSharpOutputByView.V.rows[2].hidden3D.native3DGeneratedCurveIntervals[0]));},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[2].hidden3D.native3DGeneratedCurveIntervals=[];}
 ]){
  const x=setup();mutate(x);
  assert.throws(()=>audit(x),/original|native|source|invalid|interval|scoped|global|curve|incomplete|class/i);
 }
});

test('M5 consumer rejects forged global 3D-to-2D paper aliases despite source owner, native parameter and old unique flags',()=>{
 for(const mutate of [
  row=>{delete row.global3DAnd2DHLRMeasuredPaperPairExactBinary64;},
  row=>{row.global3DAnd2DHLRMeasuredPaperPairExactBinary64=false;},
  row=>{row.global3DAnd2DHLRMeasuredPaperPairBoundedSourceScaleULPOnly=true;},
  row=>{row.global3DAnd2DHLRMeasuredPaperPairExactBinary64='true';},
  row=>{row.global3DAnd2DHLRMeasuredPaperPairBoundedSourceScaleULPOnly='true';}
 ]){
  const x=setup(),row=x.cad.nativeSourceScopedSharpOutputByView.V
   .nativeGlobal3DOriginalSourceEvidence.rows[2];
  mutate(row);
  assert.throws(()=>audit(x),/invalid native whole-solid HLR/);
 }
 const x=setup(),row=x.cad.nativeSourceScopedSharpOutputByView.V
  .nativeGlobal3DOriginalSourceEvidence.rows[2];
 row.global3DAnd2DHLRMeasuredPaperPairExactBinary64=false;
 row.global3DAnd2DHLRMeasuredPaperPairBoundedSourceScaleULPOnly=true;
 const r=audit(x);
 assert.equal(r.sourceCorroboratedClaims,1);
 assert.equal(r.generated2DTopoDSHistoryCertified,false);
 assert.equal(r.officialV5Authorized,false);
});

test('all real global native 3D intervals bijectively consume source-scoped intervals',()=>{
 const r=audit(setup());
 assert.equal(r.wholeSolidAndScopedNative3DParameterIntervalBijectionVerified,true);
 assert.equal(r.originalSourcesWithPositiveNative3DParameterGaps,0);
 assert.equal(r.originalSourcesWithOverlappingNative3DParameters,0);
 assert.equal(r.native3DSourceParameterCoverageByOriginalSource.length,3);
 assert.ok(r.native3DSourceParameterCoverageByOriginalSource.every(x=>
  x.native3DSourceIntervalsCoverWholeOriginalExactlyOnce===true&&
  x.generated2DTopoDSHistoryCertified===false&&x.signedV5Action===false));
});

test('global native 3D HLR cannot consume one scoped interval and silently drop a second',()=>{
 const x=setup(),scoped=x.cad.nativeSourceScopedSharpOutputByView.V.rows[2]
  .hidden3D.native3DGeneratedCurveIntervals;
 scoped[0].nativeOriginalCurveParameterRange=[0,6];
 scoped.push({...scoped[0],nativeOriginalCurveParameterRange:[6,12]});
 x.cad.nativeSourceScopedSharpOutputByView.V.nativeGlobal3DOriginalSourceEvidence
  .rows[2].originalNativeCurveParameterRange=[0,6];
 assert.throws(()=>audit(x),/omitted a source-scoped original parameter interval/);
});

test('duplicate global native 3D ownership cannot reuse one source parameter interval',()=>{
 const x=setup(),rows=x.cad.nativeSourceScopedSharpOutputByView.V
  .nativeGlobal3DOriginalSourceEvidence.rows;
 rows[1]={...rows[2],wholeSolidGeneratedHLREdgeOrdinal:1};
 assert.throws(()=>audit(x),/reuses or lacks scoped interval owner/);
});

test('real positive-length native source gap stays numerically visible and unsigned',()=>{
 const x=setup(),native=x.cad.nativeSourceScopedSharpOutputByView.V;
 native.rows[2].hidden3D.native3DGeneratedCurveIntervals[0]
  .nativeOriginalCurveParameterRange=[1,12];
 native.nativeGlobal3DOriginalSourceEvidence.rows[2]
  .originalNativeCurveParameterRange=[1,12];
 const r=audit(x);
 assert.equal(r.wholeSolidAndScopedNative3DParameterIntervalBijectionVerified,true);
 assert.equal(r.originalSourcesWithPositiveNative3DParameterGaps,1);
 const source=r.native3DSourceParameterCoverageByOriginalSource
  .find(x=>x.sourceEdgeId==='g::A|B');
 assert.deepEqual(source.positiveLengthUncoveredNativeParameterIntervals,[[0,1]]);
 assert.equal(source.native3DSourceIntervalsCoverWholeOriginalExactlyOnce,false);
 assert.equal(r.signedV5ActionCount,0);
});
