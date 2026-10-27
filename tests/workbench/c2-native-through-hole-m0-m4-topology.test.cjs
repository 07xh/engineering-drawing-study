'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {generateNativeC2FullMathProofPack}=
 require('../../tools/c2_native_m0_m4_m5_proof_pack.cjs');
const {auditC2OcctGeneratedEdgeUnionRays}=
 require('../../workbench/c2-native-occt-generated-ray-m5.cjs');
const fixture=path.resolve(__dirname,
 '../fixtures/c2-rectangular-through-hole-two-boxes-occt.json');
const native=spawnSync('python3',['-c','from OCP.BRepAlgoAPI import BRepAlgoAPI_Cut'],
 {encoding:'utf8',timeout:12000}).status===0;
const manifest=JSON.parse(fs.readFileSync(fixture,'utf8'));
test('through-hole OCCT execution is REQUIRED in dedicated native-C2 CI, never silently skipped',()=>{
 if(process.env.DRAFTAI_REQUIRE_NATIVE_OCCT==='1')
  assert.equal(native,true,'OCCT cut must be available in required native-C2 CI');
 assert.equal(manifest.operation,'cut');
 assert.equal(manifest.components.length,2);
});
test('real BRepAlgoAPI_Cut: through-hole final source 24 edges, 16 native vertices, full M0/M4 and NO union M5/V5', {
 skip:!native&&'actual OCP available in pinned dedicated native CI'
},()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c2-through-bore-'));
 try{
  const result=path.join(root,'native-box-bore-proof.json');
  const info=generateNativeC2FullMathProofPack({inputPath:fixture,outputPath:result});
  assert.equal(info.actualNativeOpenCascadeRan,true);
  assert.equal(info.actualGeneratedEdges,24);
  assert.equal(info.pairViewChecks,24*23/2*3);
  assert.equal(info.fullySignedV5,false);
  const pack=JSON.parse(fs.readFileSync(result,'utf8'));
  assert.equal(pack.booleanOperation,'cut');
  assert.equal(pack.provenance.actualNativeOpenCascadeRanInThisProcessTree,true);
  assert.equal(pack.provenance.sourceManifestHadNoReferenceAnswer,true);
  const n=pack.nativeTopology,m=pack.mathM0M4M5,g=m.globalPaperEvents;
  assert.equal(n.actualNativeBooleanOperation,'cut');
  assert.equal(n.originalSolidDifferenceReviewedAsThroughRectangularBore,true);
  assert.equal(n.resultFaceCount,10);
  assert.equal(n.resultEdgeCount,24);
  assert.equal(n.resultVertexCount,16);
  assert.equal(n.allFinalGeneratedEdgeEndpointsMappedToSameRunNativeTopoDSVertices,true);
  assert.equal(n.allResultNativeVertexIncidenceAccountedFor,true);
  assert.equal(n.allResultEdgesHaveSameRunActualTopoDSHistorySupport,true);
  assert.equal(m.currentNativeReported3DAndM0SourceCrossChecked,true);
  assert.equal(m.allNativeResultEdgeEndpointIsSameJunctionsReconciled,true);
  assert.equal(m.actualNativeBooleanOperation,'cut');
  assert.equal(m.generatedEdgeContinuousM5SubspansRecomputed,false);
  assert.equal(m.allFirstAngleWholeOriginalGeneratedEdgeRaysAudited,false);
  assert.equal(m.counts.clear,0);
  assert.equal(m.counts.hidden,0);
  assert.equal(g.actualNativeBooleanOperation,'cut');
  assert.equal(g.sourceResultEdgeCount,24);
  assert.equal(g.VHWSourceRows,72);
  assert.equal(g.actualM4PairwiseSegmentViewChecks,828);
  assert(g.continuousM5SubspanCount>0,'real cut source MUST have partitioned projected geometry');
  assert.equal(g.positiveWholeOpenRayClearSubspans,0);
  assert.equal(g.positiveWholeStrictlyHiddenSubspans,0);
  assert.equal(g.allOfficialEngineeringLinesCertified,false);
  assert.equal(g.subtractiveCutM5WholeSceneOcclusionSigned,false);
  assert.equal(pack.completeSubtractiveBooleanM5RayVisibilityCertified,false);
  assert.equal(pack.ConstructionIntentDAGSingleV5FullySigned,false);
  assert.equal(pack.realTextbookBlindTestPassed,false);
  assert.throws(()=>generateNativeC2FullMathProofPack({
   inputPath:fixture,outputPath:result
  }),/never overwrite/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('a forged native through-hole report cannot replay a union or altered original solid',{
 skip:!native&&'actual OCP available in pinned dedicated native CI'
},()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c2-cut-replay-'));
 try{
  const output=path.join(root,'fresh.json');
  generateNativeC2FullMathProofPack({inputPath:fixture,outputPath:output});
  const report=JSON.parse(fs.readFileSync(output,'utf8')).nativeTopology;
  const swapped=structuredClone(manifest);swapped.operation='union';
  assert.throws(()=>auditC2OcctGeneratedEdgeUnionRays({
   manifest:swapped,nativeReport:report
  }),/Cut cannot be consumed|native report Cut/);
  const altered=structuredClone(manifest);
  altered.components[1].min[0]-=.25;
  assert.throws(()=>auditC2OcctGeneratedEdgeUnionRays({
   manifest:altered,nativeReport:report
  }),/box bounds differ|coordinates changed/);
  const falsified=structuredClone(report);
  falsified.actualNativeBooleanOperation='union';
  assert.throws(()=>auditC2OcctGeneratedEdgeUnionRays({
   manifest,nativeReport:falsified
  }),/subtraction evidence missing/);
  const alteredFingerprint=structuredClone(report);
  alteredFingerprint.canonicalOriginalComponentGeometrySHA256='0'.repeat(64);
  assert.throws(()=>auditC2OcctGeneratedEdgeUnionRays({
   manifest,nativeReport:alteredFingerprint
  }),/original through-hole operation/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('partial pockets, non-inset cutter wall, wrong source order are NOT mislabeled as through-hole',()=>{
 const variants=[
  x=>{x.components[1].max[2]=8},
  x=>{x.components[1].min[0]=-5},
  x=>{x.components.reverse()},
  x=>{x.operation='intersection'}
 ];
 for(const adjust of variants){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c2-cut-neg-'));
  try{
   const m=structuredClone(manifest);adjust(m);
   const input=path.join(root,'input.json'),out=path.join(root,'out.json');
   fs.writeFileSync(input,JSON.stringify(m));
   assert.throws(()=>generateNativeC2FullMathProofPack({
    inputPath:input,outputPath:out
   }),/through-hole|native Boolean source operation unsupported|strictly inset|Cut/);
   assert.equal(fs.existsSync(out),false);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
 }
});
