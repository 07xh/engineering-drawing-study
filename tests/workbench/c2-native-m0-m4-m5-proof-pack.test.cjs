'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {generateNativeC2FullMathProofPack}=require(
 '../../tools/c2_native_m0_m4_m5_proof_pack.cjs');
const manifest=path.resolve(__dirname,
 '../fixtures/c2-l-shape-two-boxes-occt.json');
const hasNativeOCP=spawnSync('python3',['-c','import OCP'],
 {encoding:'utf8',timeout:12000}).status===0;
test('fresh real OCCT can never be silently skipped in required native CI mode',()=>{
 if(process.env.DRAFTAI_REQUIRE_NATIVE_OCCT==='1')
  assert.equal(hasNativeOCP,true,
   'dedicated native proof workflow must install and RUN actual OCP');
});
test('unavailable native executable cannot create forged successful source graph',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c2-native-fail-'));
 const saved=process.env.DRAFTAI_PYTHON;
 try{
  const output=path.join(root,'should-not-exist.json');
  process.env.DRAFTAI_PYTHON=process.execPath;
  assert.throws(()=>generateNativeC2FullMathProofPack({
   inputPath:manifest,outputPath:output
  }),/fresh original OpenCascade BRep execution failed/);
  assert.equal(fs.existsSync(output),false);
 }finally{
  if(saved===undefined)delete process.env.DRAFTAI_PYTHON;
  else process.env.DRAFTAI_PYTHON=saved;
  fs.rmSync(root,{recursive:true,force:true});
 }
});
test('same-run actual 30 native edges and 1305 source pair-view checks become a single proof pack',{
 skip:!hasNativeOCP&&'installed actual OCP native reference required'
},()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c2-native-pack-'));
 try{
  const output=path.join(root,'actual-native-math.json');
  const summary=generateNativeC2FullMathProofPack({
   inputPath:manifest,outputPath:output
  });
  assert.equal(summary.actualGeneratedEdges,30);
  assert.equal(summary.pairViewChecks,1305);
  assert(summary.subspanCount>0);
  assert.equal(summary.actualNativeOpenCascadeRan,true);
  assert.equal(summary.fullySignedV5,false);
  const pack=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(pack.provenance.actualNativeOpenCascadeRanInThisProcessTree,true);
  assert.equal(pack.nativeTopology.resultVertexCount,18);
  assert.equal(pack.nativeTopology.certifiedNativePhysicalCreaseEdgeCount,22);
  assert.equal(pack.nativeTopology.certifiedNativeCoplanarSubdivisionEdgeCount,8);
  assert.equal(pack.mathM0M4M5.globalPaperEvents.VHWSourceRows,90);
  assert.equal(pack.mathM0M4M5.globalPaperEvents.allOfficialEngineeringLinesCertified,false);
  assert.equal(pack.ConstructionIntentDAGSingleV5FullySigned,false);
  assert.equal(pack.realTextbookBlindTestPassed,false);
  assert.throws(()=>generateNativeC2FullMathProofPack({
   inputPath:manifest,outputPath:output
  }),/never overwrite/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
