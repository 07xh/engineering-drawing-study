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

function withRealOriginalPhysicalAndGeneratedPaper(){
 const x=setup();
 x.geometry.kind='mesh';x.geometry.space='model-3d';x.geometry.unit='mm';
 x.geometry.data.points={
  A:{x:0,y:0,z:0},B:{x:12,y:0,z:1},C:{x:0,y:0,z:11}
 };
 const projection=([a,b])=>({
  from:{u:x.geometry.data.points[a].x,v:x.geometry.data.points[a].z},
  to:{u:x.geometry.data.points[b].x,v:x.geometry.data.points[b].z}
 });
 for(const original of x.cad.originalBRepSourceEdges){
  const edge=x.geometry.data.edges.find(e=>
   'g::'+[...e].sort().join('|')===original.sourceEdgeId);
  original.fromOCCT3D={...x.geometry.data.points[edge[0]]};
  original.toOCCT3D={...x.geometry.data.points[edge[1]]};
 }
 const native=x.cad.nativeSourceScopedSharpOutputByView.V
  .nativeGlobal3DOriginalSourceEvidence.rows;
 x.cad.hiddenSharpViews.V=native.map(row=>{
  const edge=x.geometry.data.edges.find(e=>
   'g::'+[...e].sort().join('|')===row.originalPhysicalSourceEdgeId);
  return projection(edge);
 });
 return x;
}

test('same-run original physical endpoints + native interval + exact received 2D HLR jointly close source geometry, not topology',()=>{
 const r=audit(withRealOriginalPhysicalAndGeneratedPaper());
 assert.equal(r.wholeSolid3DOriginalSourceToGenerated2DExactPaperJointAvailable,true);
 assert.equal(r.sourceViewsWithNative3DAndExactGenerated2DPaperCoverage,3);
 assert.equal(r.sourceViewsWithTransverseGeneratedPaperDrift,0);
 assert.equal(r.native3DToGenerated2DPaperByOriginalSource.length,3);
 assert.ok(r.native3DToGenerated2DPaperByOriginalSource.every(x=>
  x.exactNative3DParameterCoverageCompleteOnce===true&&
  x.exactReceived2DTwoAxisPaperCoverageComplete===true&&
  x.generated2DTopoDSHistoryCertified===false&&
  x.physicalGenerated3DEndpointJunctionsCertified===false&&
  x.globalOpaqueSceneContinuousOcclusionCertified===false&&
  x.signedV5Action===false));
});

test('native original physical BRep endpoints cannot impersonate a different M0 3D source',()=>{
 const x=withRealOriginalPhysicalAndGeneratedPaper();
 x.cad.originalBRepSourceEdges[0].fromOCCT3D.z=999;
 assert.throws(()=>audit(x),/original native BRep physical 3D endpoints contradict/);
});

test('real HLR transverse endpoint drift vetoes native 3D complete source paper despite matching source IDs',()=>{
 const x=withRealOriginalPhysicalAndGeneratedPaper();
 const paper=x.cad.hiddenSharpViews.V[2];
 paper.to.v+=Number.EPSILON;
 const r=audit(x),source=r.native3DToGenerated2DPaperByOriginalSource
  .find(s=>s.sourceEdgeId==='g::A|B');
 assert.equal(source.exactNative3DParameterCoverageCompleteOnce,true);
 assert.equal(source.exactReceived2DTwoAxisPaperCoverageComplete,false);
 assert.equal(source.transverseGenerated2DPaperDriftEdges.length,1);
 assert.deepEqual(source.positiveExactReceived2DPaperGaps,[['0','1']]);
 assert.equal(source.generated2DTopoDSHistoryCertified,false);
});

test('actual HLR missing half the exact 2D source cannot borrow complete original 3D native parameters',()=>{
 const x=withRealOriginalPhysicalAndGeneratedPaper();
 x.cad.hiddenSharpViews.V[2].to={u:6,v:0.5};
 const r=audit(x),source=r.native3DToGenerated2DPaperByOriginalSource
  .find(s=>s.sourceEdgeId==='g::A|B');
 assert.equal(source.exactNative3DParameterCoverageCompleteOnce,true);
 assert.equal(source.exactReceived2DTwoAxisPaperCoverageComplete,false);
 assert.deepEqual(source.positiveExactReceived2DPaperGaps,[['1/2','1']]);
});

test('native original 3D parameter gap remains held even with perfectly complete 2D HLR paper',()=>{
 const x=withRealOriginalPhysicalAndGeneratedPaper();
 x.cad.nativeSourceScopedSharpOutputByView.V.rows[2].hidden3D
  .native3DGeneratedCurveIntervals[0].nativeOriginalCurveParameterRange=[1,12];
 x.cad.nativeSourceScopedSharpOutputByView.V
  .nativeGlobal3DOriginalSourceEvidence.rows[2].originalNativeCurveParameterRange=[1,12];
 const r=audit(x),source=r.native3DToGenerated2DPaperByOriginalSource
  .find(s=>s.sourceEdgeId==='g::A|B');
 assert.deepEqual(source.positiveNative3DSourceParameterGaps,[[0,1]]);
 assert.equal(source.exactNative3DParameterCoverageCompleteOnce,false);
 assert.equal(source.exactReceived2DTwoAxisPaperCoverageComplete,true);
 assert.equal(source.native3DAndReceived2DPaperGeometryBothClosedButNotTopoDSHistory,false);
});

function withRealMeasured3DSourceTo2DPaper(){
 const x=withRealOriginalPhysicalAndGeneratedPaper();
 const native=x.cad.nativeSourceScopedSharpOutputByView.V
  .nativeGlobal3DOriginalSourceEvidence;
 native.receivedNativeGenerated3DSourceEndpointsRecordedForEveryGlobal2DOrdinal=true;
 for(const row of native.rows){
  const original=x.cad.originalBRepSourceEdges.find(o=>
   o.sourceEdgeId===row.originalPhysicalSourceEdgeId);
  row.nativeGlobalGeneratedHLR3DFrom={...original.fromOCCT3D};
  row.nativeGlobalGeneratedHLR3DTo={...original.toOCCT3D};
 }
 for(const original of x.cad.originalBRepSourceEdges){
  original.occtSourceCurveFirstPoint3D={...original.fromOCCT3D};
  original.occtSourceCurveLastPoint3D={...original.toOCCT3D};
 }
 return x;
}

test('same-run REAL native generated 3D XYZ is independently reprojected to all global 2D HLR ordinals',()=>{
 const r=audit(withRealMeasured3DSourceTo2DPaper());
 assert.equal(r.completeMeasuredNativeGlobal3D2DPaperReplayAvailable,true);
 assert.equal(r.independentlyReplayedMeasuredGlobal3D2DPaperCount,3);
 assert.equal(r.nativeGlobal3DTo2DMeasuredPaperPairs.length,3);
 assert.ok(r.nativeGlobal3DTo2DMeasuredPaperPairs.every(row=>
  row.exactBinary64PaperEndpoints===true&&
  row.sourceScaleULPBoundedOnly===false&&
  row.generated2DTopoDSHistoryCertified===false));
 assert.ok(r.native3DToGenerated2DPaperByOriginalSource.every(row=>
  row.native3DProjectedSourcePaperCoverageReplayed===true&&
  row.native3DProjectedSourcePaperTwoAxisCoverageComplete===true&&
  row.exactReceived2DTwoAxisPaperCoverageComplete===true&&
  row.generated2DTopoDSHistoryCertified===false));
 assert.equal(r.claims[0].sameRunNativeGenerated3DCurveReprojectedOntoActual2D,true);
 assert.equal(r.signedV5ActionCount,0);
});

test('a one-ULP generated 2D drift is held unless real native 3D pairing class is recomputed',()=>{
 const x=withRealMeasured3DSourceTo2DPaper();
 x.cad.hiddenSharpViews.V[2].to.v=1+Number.EPSILON;
 assert.throws(()=>audit(x),/real native generated 3D endpoints contradict global 2D HLR paper/);
 const row=x.cad.nativeSourceScopedSharpOutputByView.V
  .nativeGlobal3DOriginalSourceEvidence.rows[2];
 row.global3DAnd2DHLRMeasuredPaperPairExactBinary64=false;
 row.global3DAnd2DHLRMeasuredPaperPairBoundedSourceScaleULPOnly=true;
 const r=audit(x),source=r.native3DToGenerated2DPaperByOriginalSource
  .find(t=>t.sourceEdgeId==='g::A|B');
 assert.equal(r.independentlyReplayedMeasuredGlobal3D2DPaperCount,3);
 assert.equal(r.nativeGlobal3DTo2DMeasuredPaperPairs[2].sourceScaleULPBoundedOnly,true);
 assert.equal(source.native3DProjectedSourcePaperTwoAxisCoverageComplete,true);
 assert.equal(source.exactReceived2DTwoAxisPaperCoverageComplete,false);
 assert.equal(source.transverseGenerated2DPaperDriftEdges.length,1);
 assert.equal(r.officialV5Authorized,false);
});

test('real partial native 3D interval and matching partial 2D output retain exact positive paper residual',()=>{
 const x=withRealMeasured3DSourceTo2DPaper();
 const native=x.cad.nativeSourceScopedSharpOutputByView.V;
 const generated=native.nativeGlobal3DOriginalSourceEvidence.rows[2];
 generated.originalNativeCurveParameterRange=[0,6];
 generated.nativeGlobalGeneratedHLR3DTo={x:6,y:0,z:0.5};
 native.rows[2].hidden3D.native3DGeneratedCurveIntervals[0]
  .nativeOriginalCurveParameterRange=[0,6];
 x.cad.hiddenSharpViews.V[2].to={u:6,v:0.5};
 const r=audit(x),source=r.native3DToGenerated2DPaperByOriginalSource
  .find(t=>t.sourceEdgeId==='g::A|B');
 assert.deepEqual(source.positiveNative3DSourceParameterGaps,[[6,12]]);
 assert.deepEqual(source.positiveNative3DProjectedSourcePaperGaps,[['1/2','1']]);
 assert.deepEqual(source.positiveExactReceived2DPaperGaps,[['1/2','1']]);
 assert.equal(source.native3DAndReceived2DPaperGeometryBothClosedButNotTopoDSHistory,false);
 assert.equal(r.officialV5Authorized,false);
});

test('invalid, missing or contradictory measured HLR 3D endpoints and claimed output pairs fail closed',()=>{
 const mutate=[
  x=>{delete x.cad.nativeSourceScopedSharpOutputByView.V
   .nativeGlobal3DOriginalSourceEvidence.rows[2].nativeGlobalGeneratedHLR3DFrom;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V
   .nativeGlobal3DOriginalSourceEvidence.rows[2].nativeGlobalGeneratedHLR3DFrom.x=Infinity;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V
   .nativeGlobal3DOriginalSourceEvidence.rows[2].nativeGlobalGeneratedHLR3DTo.z+=0.5;},
  x=>{x.cad.hiddenSharpViews.V[2].to.v+=0.001;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V
   .nativeGlobal3DOriginalSourceEvidence.rows[2].
    global3DAnd2DHLRMeasuredPaperPairExactBinary64=false;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V
   .nativeGlobal3DOriginalSourceEvidence
    .receivedNativeGenerated3DSourceEndpointsRecordedForEveryGlobal2DOrdinal=false;}
 ];
 for(const change of mutate){
  const x=withRealMeasured3DSourceTo2DPaper();
  change(x);
  assert.throws(()=>audit(x),/native|3D|HLR|paper|endpoints|flag/i);
 }
 const legacy=setup();
 legacy.cad.nativeSourceScopedSharpOutputByView.V
  .nativeGlobal3DOriginalSourceEvidence.rows[0].nativeGlobalGeneratedHLR3DFrom=
   {x:0,y:0,z:0};
 assert.throws(()=>audit(legacy),/incomplete same-run measured global native HLR 3D endpoints/);
});

test('native global 3D HLR source endpoints replay ORIGINAL BRep native parameter anchors',()=>{
 const r=audit(withRealMeasured3DSourceTo2DPaper());
 assert.equal(r.completeMeasuredNativeGlobal3D2DPaperReplayAvailable,true);
 assert.ok(r.nativeGlobal3DTo2DMeasuredPaperPairs.every(pair=>{
  const proof=pair.measured3DEndpointsAgainstOriginalBRepNativeParameterReplay;
  return proof?.nativeGlobal3DCurveEndpointParameterReplayCompatible===true&&
   proof.endpoints.length===2&&
   proof.endpoints.every(e=>
    e.originalNativeCurveEndpointExact===true&&
    e.sourceScaledUncertifiedRoundoffEnvelopeMm===0&&
    e.generatedToOriginalTopoDSVertexIdentityCertified===false);
 }));
 assert.equal(r.officialV5Authorized,false);
});

test('depth-only 3D HLR edits cannot reuse an unchanged V paper projection and original source label',()=>{
 for(const axis of ['y']){
  for(const side of ['nativeGlobalGeneratedHLR3DFrom','nativeGlobalGeneratedHLR3DTo']){
   const x=withRealMeasured3DSourceTo2DPaper();
   const row=x.cad.nativeSourceScopedSharpOutputByView.V
    .nativeGlobal3DOriginalSourceEvidence.rows[2];
   row[side][axis]+=1;
   // V paper is x/z, so a forged y depth is invisible to any 2D
   // matching or transverse paper error test.
   assert.deepEqual(x.cad.hiddenSharpViews.V[2].to,{u:12,v:1});
   assert.throws(()=>audit(x),/generated global HLR 3D endpoint changes original native BRep curve depth or parameter/);
  }
 }
});

test('partial source t native HLR depth cannot be forged below a fixed 2D projection',()=>{
 const x=withRealMeasured3DSourceTo2DPaper();
 const native=x.cad.nativeSourceScopedSharpOutputByView.V;
 const row=native.nativeGlobal3DOriginalSourceEvidence.rows[2];
 row.originalNativeCurveParameterRange=[0,6];
 row.nativeGlobalGeneratedHLR3DTo={x:6,y:0.001,z:0.5};
 native.rows[2].hidden3D.native3DGeneratedCurveIntervals[0]
  .nativeOriginalCurveParameterRange=[0,6];
 x.cad.hiddenSharpViews.V[2].to={u:6,v:0.5};
 assert.throws(()=>audit(x),/generated global HLR 3D endpoint changes original native BRep curve depth or parameter/);
});

test('native interior source parameter cut is held as bounded computation, not false vertex identity',()=>{
 const x=withRealMeasured3DSourceTo2DPaper();
 const native=x.cad.nativeSourceScopedSharpOutputByView.V;
 const row=native.nativeGlobal3DOriginalSourceEvidence.rows[2];
 row.originalNativeCurveParameterRange=[0,6];
 row.nativeGlobalGeneratedHLR3DTo={x:6,y:0,z:0.5};
 native.rows[2].hidden3D.native3DGeneratedCurveIntervals[0]
  .nativeOriginalCurveParameterRange=[0,6];
 x.cad.hiddenSharpViews.V[2].to={u:6,v:0.5};
 const r=audit(x),pair=r.nativeGlobal3DTo2DMeasuredPaperPairs
  .find(p=>p.sourceEdgeId==='g::A|B');
 const witness=pair.measured3DEndpointsAgainstOriginalBRepNativeParameterReplay;
 assert.equal(witness.endpoints[0].originalNativeCurveEndpointExact,true);
 assert.equal(witness.endpoints[1].interiorNativeCurveWithinSourceScaleRoundoff,true);
 assert.equal(witness.endpoints[1].originalNativeCurveEndpointExact,false);
 assert.equal(witness.endpoints[1].generatedToOriginalTopoDSVertexIdentityCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});
