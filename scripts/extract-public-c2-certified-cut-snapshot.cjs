'use strict';
/**
 * Deterministic, presentation-only public C2 Cut example. Never ship raw
 * TopoDS, exhaustive M0-M5 proofs, private textbook exercises or user files.
 * Native CI reexecutes ACTUAL OCP BRepAlgoAPI_Cut and requires exact equality
 * between this small public view and its freshly signed M4/V5 source rows.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
function extractPublicC2CutSignedOnlySnapshot(full){
 const p=full?.sourceCertifiedNativeCanonicalPartialCutV5;
 assert.equal(full?.schema,'draftai-c2-actual-native-occt-m0-m4-m5-full-proof-pack/1');
 assert.equal(full?.booleanOperation,'cut');
 assert.equal(full?.verifiedNativeGeneratedEdges,24);
 assert.equal(full?.continuousM5SubspanCount,64);
 assert.equal(full?.provenance?.actualNativeOpenCascadeRanInThisProcessTree,true);
 assert.equal(full?.provenance?.sourceManifestHadNoReferenceAnswer,true);
 assert.equal(full?.completeCutProjectOfficialGBLineStylesAndV5Certified,false);
 assert.equal(full?.ConstructionIntentDAGSingleV5FullySigned,false);
 assert.equal(full?.realTextbookBlindTestPassed,false);
 assert.equal(p?.actualOriginalBooleanOperation,'cut');
 assert.equal(p?.entireCutOriginalDrawingSigned,false);
 assert.equal(p?.boundedTwoBoxUnionFullFormalV5Certified,false);
 assert.equal(p?.certifiedVisibleHiddenSourceIntervals?.length,12);
 assert.equal(p?.suppressedNativeBackSourceIntervals?.length,12);
 assert.equal(p?.unsignedNativePhysicalSourceIntervals?.length,40);
 assert.equal(p?.steps?.length,12);
 assert.equal(p?.oneExistingV5TimelineRecreated,true);
 const visible=p.certifiedVisibleHiddenSourceIntervals.map((r,i)=>{
  const a=p.steps[i].actions[0];
  assert.equal(a.id,r.actionId);
  assert.equal(a.engineeringLineStyle,r.standardEngineeringLineStyle);
  assert.equal(r.cutVerifiedOriginalTopoDSEndpointsAndClosedM0Rays,true);
  assert.equal(r.cutOriginalM4PaperAliasStrictDepthReverified,true);
  assert.equal(r.completeC2CutResultCertified,false);
  assert.equal(r.signedByExistingConstructionIntentDagAndSingleV5,true);
  return {view:r.view,edge:r.sourceNativeResultEdgeOrdinal,
   range:r.originalGeneratedEdgeParameterRange,
   from:r.projectedFromModelMm,to:r.projectedToModelMm,
   style:r.standardEngineeringLineStyle};
 });
 const output={
  schema:'draftai-public-occt-c2-cut-signed-only-preview/1',
  sourceRevision:p.revision,sourceGeometryHash:p.sourceGeometryHash,
  originalBRepActualOCP:true,completeDrawing:false,
  counts:{signed:12,covered:12,held:40},strokes:visible
 };
 const data=JSON.stringify(output)+'\n';
 assert.ok(Buffer.byteLength(data,'utf8')<15*1024);
 return data;
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.length!==3||!['--verify','--write'].includes(args[0]))
  throw new TypeError('expected --verify|--write fresh-native-pack.json public-preview.json');
 const [,source,output]=args;
 const data=extractPublicC2CutSignedOnlySnapshot(
  JSON.parse(fs.readFileSync(source,'utf8')));
 if(args[0]==='--verify'){
  assert.equal(fs.readFileSync(output,'utf8'),data,
   'published preview must be exactly regenerated from SAME-RUN native OpenCascade');
  process.stdout.write('PASS: fixed public C2 signed-only view identical to freshly run native OCCT\n');
 }else{
  fs.writeFileSync(output,data,{flag:'wx'});
 }
}
module.exports={extractPublicC2CutSignedOnlySnapshot};
