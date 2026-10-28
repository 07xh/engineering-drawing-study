'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const {generateNativeC2FullMathProofPack}=
 require('../../tools/c2_native_m0_m4_m5_proof_pack.cjs');
const {auditC2OcctGeneratedEdgeUnionRays}=
 require('../../workbench/c2-native-occt-generated-ray-m5.cjs');
const {auditC2CutNativeJunctionGlobalLineGate}=
 require('../../workbench/c2-cut-native-junction-global-line-gate.cjs');
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
test('real BRepAlgoAPI_Cut: through-hole 24 edges, 16 native vertices, partial positive Cut M5 rays and NO union V5', {
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
  assert.equal(m.generatedEdgeContinuousM5SubspansRecomputed,true);
  assert.equal(m.allFirstAngleWholeOriginalGeneratedEdgeRaysAudited,true);
  assert.ok(m.counts.clear>0,'stock outward source rays must remain clear after subtraction');
  assert.ok(m.subtractiveCutOriginalEdgeOpenRayProofs>0);
  assert.equal(m.subtractiveCutOriginalEdgeOpenRayProofs,
   m.counts.clear+m.counts.hidden);
  assert.ok(m.counts.strictFrontMaterialSlabHidden>=4,
   'actual side-view bore-wall native 3D edges must have strict front material');
  assert.ok(m.rows.some(row=>row.view==='V'&&
   row.originalOpenSourceFrontStockMaterialSlabWitness?.axis==='y'));
  assert.ok(m.rows.some(row=>row.view==='W'&&
   row.originalOpenSourceFrontStockMaterialSlabWitness?.axis==='x'));
  assert.ok(m.rows.filter(row=>row.originalOpenSourceFrontStockMaterialSlabWitness)
   .every(row=>row.verifiedSubtractiveStrictlyHidden===true&&
    row.V5ActionSignedOff===false));
  assert.ok(m.rows.some(row=>row.verifiedSubtractiveFrontRayClear===true));
  assert.ok(m.rows.filter(row=>row.verifiedSubtractiveFrontRayClear||
    row.verifiedSubtractiveStrictlyHidden).every(row=>
   row.officialEngineeringLineStyle==='undetermined'&&
   row.V5ActionSignedOff===false));
  assert.equal(g.actualNativeBooleanOperation,'cut');
  assert.equal(g.sourceResultEdgeCount,24);
  assert.equal(g.VHWSourceRows,72);
  assert.equal(g.actualM4PairwiseSegmentViewChecks,828);
  assert(g.continuousM5SubspanCount>0,'real cut source MUST have partitioned projected geometry');
  assert.ok(g.positiveWholeOpenRayClearSubspans>0);
  assert.equal(g.partialSubtractiveCutRaySubspansProven,
   g.positiveWholeOpenRayClearSubspans+
    g.positiveWholeStrictlyHiddenSubspans);
  assert.ok(g.positivelyProvenCutFrontMaterialSlabSubspans>0,
   'M4 must consume original native through-hole open-ray material slabs');
  assert.ok(g.rows.some(row=>row.subspans.some(span=>
   span.wholeOpenM4SubspanStrictFrontMaterialSlabProven===true&&
   span.originalM0SubtractiveCutOpenSourceRayEvidence?.
    commonFrontSubtractiveMaterialSlab?.axis==='y')));
  assert.ok(g.rows.some(row=>row.subspans.some(span=>
   span.wholeOpenM4SubspanStrictFrontMaterialSlabProven===true&&
   span.originalM0SubtractiveCutOpenSourceRayEvidence?.
    commonFrontSubtractiveMaterialSlab?.axis==='x')));
  assert.ok(g.rows.some(row=>row.subspans.some(span=>
   span.continuousSubtractiveCutOpenRayClearVerified===true)));
  assert.ok(g.rows.every(row=>row.subspans.every(span=>
   span.continuousUnionStrictInteriorOcclusionVerified===false&&
   span.continuousAllOpaqueComponentRayClearVerified===false&&
   span.V5ActionSignedOff===false&&
   span.officialEngineeringLineStyle==='undetermined')));
  assert.equal(g.allOfficialEngineeringLinesCertified,false);
  assert.equal(g.subtractiveCutM5WholeSceneOcclusionSigned,false);
  assert.equal(pack.completeSubtractiveBooleanM5RayVisibilityCertified,false);
  const joint=pack.nativeCutOriginal3DJunctionGlobalM4M5JointGate;
  assert.equal(joint.schema,'draftai-c2-cut-native-m4-m5-joint-original-junction-gate/1');
  assert.equal(joint.sourceRevision,manifest.revision);
  assert.equal(joint.sourceResultEdgeCount,24);
  assert.equal(joint.nativeOriginalResultVertexCount,16);
  assert.equal(joint.counts.totalM4Subspans,64);
  assert.equal(joint.counts.positiveOpenRaySubspans,28);
  assert.equal(joint.counts.nativeGlobalPaperAliasFrontDepthAudited,28);
  assert.equal(joint.counts.positiveOpenRaySubspans,
   joint.positiveSourceIntervals.length);
  assert.equal(info.cutNativeOriginal3DSourceEndpointPairCount,
   joint.counts.exactOriginalNative3DEndpointPairs);
  assert.equal(info.cutNative3DEndpointAndGlobalPaperJointCandidateCount,
   joint.counts.jointOpenRayNativeEndpointAndGlobalPaperCandidates);
  assert.equal(joint.possibleFullJunctionLineReviewCandidates.length,
   joint.counts.jointOpenRayNativeEndpointAndGlobalPaperCandidates);
  assert.ok(joint.positiveSourceIntervals.every(x=>
   x.independentlyNativeSourceOpenRayProof===true&&
   x.nativeFullShared3DVertexIncidenceRechecked===true&&
   x.allCurrentPhysicalCoProjectedSourcesStrictlyBehindOrAbsent===true&&
   x.officialGBEngineeringLineStyle==='undetermined'&&
   x.constructionIntentAuthorized===false&&x.signedV5Action===false));
  assert.equal(joint.globalGBEngineeringLineStylesCertified,false);
  assert.equal(joint.originalNativeConstructionIntentAuthorized,false);
  assert.equal(joint.newUniqueV5Actions,0);
  assert.equal(joint.completeBooleanClosedJunctionVisibilityCertified,false);
  const evidence=pack.subtractiveCutPartialRayEvidence;
  assert.equal(evidence.nativeSourceViewClearRayProofs,m.counts.clear);
  assert.equal(evidence.nativeSourceViewStrictHiddenRayProofs,m.counts.hidden);
  assert.equal(evidence.nativeSourceViewFrontMaterialSlabHiddenProofs,
   m.counts.strictFrontMaterialSlabHidden);
  assert.equal(evidence.m4SubspanClearRayProofs,g.positiveWholeOpenRayClearSubspans);
  assert.equal(evidence.m4SubspanStrictHiddenRayProofs,g.positiveWholeStrictlyHiddenSubspans);
  assert.equal(evidence.m4SubspanFrontMaterialSlabHiddenProofs,
   g.positivelyProvenCutFrontMaterialSlabSubspans);
  assert.equal(info.cutStrictFrontMaterialWholeSourceViewCount,
   m.counts.strictFrontMaterialSlabHidden);
  assert.equal(info.cutStrictFrontMaterialM4SubspanCount,
   g.positivelyProvenCutFrontMaterialSlabSubspans);
  assert.ok(info.cutProvenWholeSourceViewRayCount>16,
   'new M0 strict front material theorem must improve previous 16/72 Cut rays');
  assert.ok(info.cutProvenOpenM4SubspanRayCount>24,
   'new M0 strict material theorem must improve previous 24/64 Cut subspans');
  assert.equal(evidence.onlyOpenSourceInteriorVerified,true);
  assert.equal(evidence.allNativeEdgeEndpointAndGlobalDepthJunctionsCertified,false);
  assert.equal(evidence.fullEngineeringLineStyleAndV5Certified,false);
  assert.equal(evidence.signedV5ActionCount,0);
  assert.equal(info.cutProvenWholeSourceViewRayCount,
   evidence.nativeSourceViewClearRayProofs+evidence.nativeSourceViewStrictHiddenRayProofs);
  assert.equal(info.cutProvenOpenM4SubspanRayCount,
   evidence.m4SubspanClearRayProofs+evidence.m4SubspanStrictHiddenRayProofs);
  assert.ok(info.cutProvenWholeSourceViewRayCount>0);
  assert.ok(info.cutProvenOpenM4SubspanRayCount>0);
  assert.equal(pack.sourceCertifiedNativeCanonicalV5,null,
   'not even an empty officially reusable original V5 may exist for unsigned subtractive rays');
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
  const fullPack=JSON.parse(fs.readFileSync(output,'utf8'));
  const report=fullPack.nativeTopology;
  const jointArgs={math:fullPack.mathM0M4M5,
   nativeReport:report,revision:manifest.revision};
  const valid=auditC2CutNativeJunctionGlobalLineGate(jointArgs);
  assert.equal(valid.counts.positiveOpenRaySubspans,28);
  const forgedVertex=structuredClone(report);
  forgedVertex.resultVertexIncidence[0].real3DModelMm.x+=1;
  assert.throws(()=>auditC2CutNativeJunctionGlobalLineGate({
   ...jointArgs,nativeReport:forgedVertex
  }),/native C2 result edge|original TopoDS physical endpoint/);
  const forgedM4=structuredClone(fullPack.mathM0M4M5);
  const signedRow=forgedM4.globalPaperEvents.rows.find(x=>
   x.subspans.some(s=>s.continuousSubtractiveCutOpenRayClearVerified||
    s.continuousSubtractiveCutStrictHiddenVerified));
  assert.ok(signedRow);
  const positive=signedRow.subspans.find(s=>
   s.continuousSubtractiveCutOpenRayClearVerified||
    s.continuousSubtractiveCutStrictHiddenVerified);
  positive.realOriginalNative3DFrom.x+=0.5;
  assert.throws(()=>auditC2CutNativeJunctionGlobalLineGate({
   ...jointArgs,math:forgedM4
  }),/parametric 3D source/);
  const forgedStyle=structuredClone(fullPack.mathM0M4M5);
  const forgedPos=forgedStyle.globalPaperEvents.rows
   .flatMap(x=>x.subspans).find(s=>
    s.continuousSubtractiveCutOpenRayClearVerified||
    s.continuousSubtractiveCutStrictHiddenVerified);
  forgedPos.officialEngineeringLineStyle='gb-t-4457.4-thin-dashed-hidden-edge';
  assert.throws(()=>auditC2CutNativeJunctionGlobalLineGate({
   ...jointArgs,math:forgedStyle
  }),/parametric 3D source/);
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
