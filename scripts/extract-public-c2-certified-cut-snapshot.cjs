'use strict';
/**
 * Deterministic PUBLIC visualization snapshot of the narrow, synthetic
 * rectangular through-hole reference in tests/fixtures/. Upstream native CI
 * MUST freshly execute real OpenCascade BRepAlgoAPI_Cut first, then compare
 * this checked-in snapshot byte-for-byte against that same-run result.
 *
 * Never package private textbook DWG, raw native TopoDS inventories, full
 * M0–M5 math or user files. The snapshot is a signed-only subset and NEVER
 * asserts that the whole C2 engineering drawing has been verified.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const ROOT_KEYS=[
 'schema','status','revision','sourceGeometryHash',
 'certifiedVisibleHiddenSourceIntervals',
 'suppressedNativeBackSourceIntervals',
 'unsignedNativePhysicalSourceIntervals','counts',
 'allNativePhysicalSourcesSignedOrProvenSuppressed',
 'boundedTwoBoxUnionFullFormalV5Certified',
 'actualOriginalBooleanOperation',
 'onlyCertifiedCutNativeOriginalClosedEndpointAndPaperDepthStrokes',
 'entireCutOriginalDrawingSigned',
 'sheetTransform','intents','steps','timeline',
 'canonicalConstructionIntentDagChecked',
 'oneExistingV5TimelineRecreated','realNativeBRepWasExecutedInOriginalRunner',
 'realTextbookBlindTestPassed'
];
function extractPublicC2CutSignedOnlySnapshot(full){
 const partial=full?.sourceCertifiedNativeCanonicalPartialCutV5;
 assert.equal(full?.schema,'draftai-c2-actual-native-occt-m0-m4-m5-full-proof-pack/1');
 assert.equal(full?.booleanOperation,'cut');
 assert.equal(full?.provenance?.actualNativeOpenCascadeRanInThisProcessTree,true);
 assert.equal(full?.provenance?.sourceManifestHadNoReferenceAnswer,true);
 assert.equal(full?.verifiedNativeGeneratedEdges,24);
 assert.equal(full?.continuousM5SubspanCount,64);
 assert.equal(full?.realTextbookBlindTestPassed,false);
 assert.equal(full?.ConstructionIntentDAGSingleV5FullySigned,false);
 assert.equal(full?.completeCutProjectOfficialGBLineStylesAndV5Certified,false);
 assert.equal(full?.completeSubtractiveBooleanM5RayVisibilityCertified,false);
 assert.equal(full?.sourceCertifiedNativeCanonicalV5,null);
 assert.equal(partial?.actualOriginalBooleanOperation,'cut');
 assert.equal(partial?.certifiedVisibleHiddenSourceIntervals?.length,12);
 assert.equal(partial?.suppressedNativeBackSourceIntervals?.length,12);
 assert.equal(partial?.unsignedNativePhysicalSourceIntervals?.length,40);
 assert.equal(partial?.steps?.length,12);
 assert.equal(partial?.intents?.length,12);
 assert.equal(partial?.oneExistingV5TimelineRecreated,true);
 assert.equal(partial?.boundedTwoBoxUnionFullFormalV5Certified,false);
 assert.equal(partial?.entireCutOriginalDrawingSigned,false);
 const selected={};
 for(const k of ROOT_KEYS){
  if(!Object.hasOwn(partial,k))throw new RangeError('missing trusted signed Cut snapshot field '+k);
  selected[k]=partial[k];
 }
 // JSON serialization is deliberate: strip prototypes, avoid executable
 // data, keep exact binary64 numeric values and ordered certified actions.
 const output={
  schema:full.schema,revision:full.revision,
  booleanOperation:'cut',
  sourceCertifiedNativeCanonicalV5:null,
  provenance:{
   actualNativeOpenCascadeRanInThisProcessTree:true,
   sourceManifestHadNoReferenceAnswer:true,
   signedV5ActionCount:12
  },
  completeCutProjectOfficialGBLineStylesAndV5Certified:false,
  ConstructionIntentDAGSingleV5FullySigned:false,
  completeSubtractiveBooleanM5RayVisibilityCertified:false,
  realTextbookBlindTestPassed:false,
  independentlySignedPartialCutV5ActionCount:12,
  sourceCertifiedNativeCanonicalPartialCutV5:selected
 };
 const data=JSON.stringify(output,null,2)+'\n';
 assert.ok(Buffer.byteLength(data,'utf8')<200*1024,
  'only the C2 genuine signed presentation subset may be published');
 assert.equal(data.includes('"nativeTopology"'),false,
  'private raw native 3D inventory must not ship with public example');
 assert.equal(data.includes('"mathM0M4M5"'),false,
  'original exhaustive math witness is CI-only');
 return data;
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(![3,4].includes(args.length)||!['--verify','--write'].includes(args[0])||
    args.length!==3)throw new TypeError('expected --verify|--write fresh-native-pack.json published-example.json');
 const [,source,output]=args;
 const data=extractPublicC2CutSignedOnlySnapshot(JSON.parse(fs.readFileSync(source,'utf8')));
 if(args[0]==='--verify'){
  assert.equal(fs.readFileSync(output,'utf8'),data,
   'reviewed public partial C2 V5 snapshot must match SAME-RUN real OCCT source exactly');
  process.stdout.write('PASS: real OCP Cut V5 snapshot exactly matches published non-private signed-only example\n');
 }else{
  fs.writeFileSync(output,data,{flag:'wx'});
  process.stdout.write('Created public signed-only partial Cut example; run native CI to verify\n');
 }
}
module.exports={extractPublicC2CutSignedOnlySnapshot};
