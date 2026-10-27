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
  assert.equal(summary.signedOnlySvgPath,
   output.replace(/\.json$/,'.signed-only.svg'));
  const svg=fs.readFileSync(summary.signedOnlySvgPath,'utf8');
  assert.match(svg,/data-math-scope="same-run-two-box-native-partial"/);
  assert.match(svg,/data-complete-c2="false"/);
  assert.match(svg,/data-textbook-blind="false"/);
  assert.match(svg,/data-unsigned-native-intervals-excluded="\d+"/);
  assert.match(svg,/data-first-angle-view="V"/);
  assert.match(svg,/data-first-angle-view="H"/);
  assert.match(svg,/data-first-angle-view="W"/);
  assert.doesNotMatch(svg,/data-engineering-line="undetermined"/);
  const pack=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(pack.provenance.actualNativeOpenCascadeRanInThisProcessTree,true);
  assert.equal(pack.nativeTopology.resultVertexCount,18);
  assert.equal(pack.nativeTopology.certifiedNativePhysicalCreaseEdgeCount,22);
  assert.equal(pack.nativeTopology.certifiedNativeCoplanarSubdivisionEdgeCount,8);
  assert.equal(pack.mathM0M4M5.globalPaperEvents.VHWSourceRows,90);
  assert.equal(pack.mathM0M4M5.globalPaperEvents.allOfficialEngineeringLinesCertified,false);
  assert.equal(pack.ConstructionIntentDAGSingleV5FullySigned,false);
  const c2=pack.sourceCertifiedNativeCanonicalV5;
  assert.equal(c2.schema,
   'draftai-c2-trusted-native-partial-construction-intent-v5/1');
  assert.equal(c2.revision,1);
  assert.equal(c2.sourceGeometryHash,
   pack.nativeTopology.canonicalOriginalComponentGeometrySHA256);
  assert(c2.certifiedVisibleHiddenSourceIntervals.length>0,
   'real OCCT physical creases with fully verified open rays must enter existing V5');
  // Exported review sheet cannot invent formal actions for unresolved sources.
  const svgStrokes=[...svg.matchAll(/<line /g)].length;
  assert.equal(svgStrokes,c2.certifiedVisibleHiddenSourceIntervals.length);
  assert.equal(new Set([...svg.matchAll(/data-v5-action="([^"]+)"/g)]
   .map(m=>m[1])).size,svgStrokes);
  assert(c2.certifiedVisibleHiddenSourceIntervals.every(x=>
   svg.includes('data-v5-action="'+x.actionId+'"')));
  assert(c2.unsignedNativePhysicalSourceIntervals.every(x=>
   !('actionId' in x)||!svg.includes('data-v5-action="'+x.actionId+'"')));
  assert.equal(c2.realTextbookBlindTestPassed,false);
  assert.equal(c2.certifiedVisibleHiddenSourceIntervals.length,
   summary.officiallySignedNativeSubspanCount);
  assert.equal(c2.unsignedNativePhysicalSourceIntervals.length,
   summary.pendingUnsignedNativeSubspanCount);
  assert.equal(c2.intents.length,c2.steps.length);
  assert.equal(c2.intents.length,c2.timeline.segments.length);
  assert.equal(c2.canonicalConstructionIntentDagChecked,true);
  assert.equal(c2.oneExistingV5TimelineRecreated,true);
  assert.equal(c2.originalV5PlayerFactory,
   'workbench/teaching-timeline-v5.js');
  assert.equal(c2.otherNonConvexGeneralMeshesCertified,false);
  assert(c2.certifiedVisibleHiddenSourceIntervals.every(row=>
   c2.steps.some(s=>s.actions.some(a=>a.id===row.actionId&&
    a.engineeringLineStyle===row.standardEngineeringLineStyle))));
  assert(c2.unsignedNativePhysicalSourceIntervals.every(row=>
   !('actionId' in row) && row.originalMathEvidenceUnsigned===true ||
   row.reason==='native-physical-dihedral-not-certified'));
  assert.equal(c2.realTextbookBlindTestPassed,false);
  assert.equal(pack.realTextbookBlindTestPassed,false);
  assert.throws(()=>generateNativeC2FullMathProofPack({
   inputPath:manifest,outputPath:output
  }),/never overwrite/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('pre-existing signed-only SVG aborts before native computation without replacing source or prior review',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-c2-native-svg-collision-'));
 try{
  const output=path.join(root,'fresh.json'),oldSvg=path.join(root,'fresh.signed-only.svg');
  fs.writeFileSync(oldSvg,'KEEP EXISTING');
  assert.throws(()=>generateNativeC2FullMathProofPack({
   inputPath:manifest,outputPath:output
  }),/never overwrite/);
  assert.equal(fs.readFileSync(oldSvg,'utf8'),'KEEP EXISTING');
  assert.equal(fs.existsSync(output),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
