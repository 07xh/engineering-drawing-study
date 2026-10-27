'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const {generateNativeC2FullMathProofPack}=
 require('../../tools/c2_native_m0_m4_m5_proof_pack.cjs');
const source=path.resolve(__dirname,
 '../fixtures/c2-disjoint-two-boxes-positive-native-v5.json');
const hasOCP=spawnSync('python3',['-c','from OCP.BRepAlgoAPI import BRepAlgoAPI_Fuse'],
 {encoding:'utf8',timeout:10000}).status===0;
test('required native CI must include mature original OCCT fused-box edge history',()=>{
 if(process.env.DRAFTAI_REQUIRE_NATIVE_OCCT==='1')
  assert.equal(hasOCP,true);
});
test('disjoint original BRep union signs genuinely positive source-verified M4/M5 intervals into the ONE canonical V5',{
 skip:!hasOCP&&'requires actual native OCP in pinned CI'
},()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-native-visible-union-'));
 try{
  const file=path.join(root,'positive-native-union.json');
  const summary=generateNativeC2FullMathProofPack({
   inputPath:source,outputPath:file});
  assert.equal(summary.actualNativeOpenCascadeRan,true);
  assert.equal(summary.actualGeneratedEdges,24);
  assert.equal(summary.pairViewChecks,828);
  const pack=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(pack.booleanOperation,'union');
  assert.equal(pack.nativeTopology.resultVertexCount,16);
  assert.equal(pack.nativeTopology.allResultNativeVertexIncidenceAccountedFor,true);
  assert.equal(pack.mathM0M4M5.globalPaperEvents.VHWSourceRows,72);
  const proof=pack.sourceCertifiedNativeCanonicalV5;
  assert.equal(proof.schema,
   'draftai-c2-trusted-native-partial-construction-intent-v5/1');
  assert(proof.certifiedVisibleHiddenSourceIntervals.length>0,
   'a separated genuine native union should prove at least one frontmost original M5 source interval');
  assert.equal(proof.certifiedVisibleHiddenSourceIntervals.length,
   summary.officiallySignedNativeSubspanCount);
  assert.equal(proof.intents.length,proof.timeline.segments.length);
  assert.equal(proof.canonicalConstructionIntentDagChecked,true);
  assert.equal(proof.oneExistingV5TimelineRecreated,true);
  assert(proof.certifiedVisibleHiddenSourceIntervals.every(line=>
   proof.steps.some(step=>step.actions.some(a=>
    a.id===line.actionId&&
    a.engineeringLineStyle===line.standardEngineeringLineStyle))));
  assert(proof.unsignedNativePhysicalSourceIntervals.every(x=>!('actionId' in x)));
  assert.equal(proof.otherNonConvexGeneralMeshesCertified,false);
  assert.equal(pack.ConstructionIntentDAGSingleV5FullySigned,false);
  assert.equal(pack.completeEngineeringLineStylesCertified,false);
  assert.equal(pack.realTextbookBlindTestPassed,false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
