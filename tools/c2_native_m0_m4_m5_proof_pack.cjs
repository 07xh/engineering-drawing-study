#!/usr/bin/env node
'use strict';
/**
 * C2 actual fresh native OpenCascade BRep -> same source M0 -> every
 * generated-result-edge M4 projected crossing -> M5 continuous open ray.
 *
 * This is NOT an alternate solver or animation engine. It runs the ONE
 * existing python-cadquery OCP native proof generator in the SAME process
 * tree, then recomputes original reviewed geometry and M5 math using the
 * existing shared workbench. Never consumes caller-invented native reports
 * as if those were executable OCP witnesses.
 *
 * Output is an independently reproducible local CAD reference proof pack,
 * not a signed standard engineering line or production V5 export.
 */
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const {originalBoxGeometry,auditC2OcctGeneratedEdgeUnionRays}=
 require('../workbench/c2-native-occt-generated-ray-m5.cjs');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
function generateNativeC2FullMathProofPack({inputPath,outputPath}={}){
 if(typeof inputPath!=='string'||!inputPath||
    typeof outputPath!=='string'||!outputPath)
  throw new TypeError('explicit input manifest and fresh output proof pack paths required');
 const input=path.resolve(inputPath),output=path.resolve(outputPath);
 if(input===output||fs.existsSync(output))
  throw new RangeError('never overwrite an existing source or a prior native math witness');
 const bytes=fs.readFileSync(input);
 if(bytes.length<25||bytes.length>64*1024)
  throw new RangeError('bounded original two-component CAD source required');
 const manifest=JSON.parse(bytes.toString('utf8'));
 if(manifest.unit!=='mm'||!Number.isSafeInteger(manifest.revision)||
    manifest.revision<1||!Array.isArray(manifest.components)||
    manifest.components.length!==2)
  throw new TypeError('explicit current 2-component model-mm source required');
 const ids=new Set();
 for(const component of manifest.components){
  if(ids.has(component.id))
   throw new RangeError('duplicate original CAD component source identity');
  ids.add(component.id);
  verifiedConvexMeshHalfspaces(originalBoxGeometry(component));
 }
 // No shell invocation or editable Python script argument. Only a
 // fixed, audited native reference executable at the current source tree.
 const nativeScript=path.resolve(__dirname,'c2_occt_boolean_history_reference.py');
 const python=process.env.DRAFTAI_PYTHON||'python3';
 const res=cp.spawnSync(python,[nativeScript,input],{
  encoding:'utf8',maxBuffer:8*1024*1024,timeout:120000,
  windowsHide:true
 });
 if(res.error||res.status!==0||!res.stdout)
  throw new RangeError('fresh original OpenCascade BRep execution failed: '+
   String(res.error?.message||res.stderr||res.status).slice(0,400));
 const nativeReport=JSON.parse(res.stdout);
 if(nativeReport.sourceRevision!==manifest.revision||
    nativeReport.allResultNativeVertexIncidenceAccountedFor!==true)
  throw new RangeError('newly executed native BRep did not return a complete original-shape witness');
 const math=auditC2OcctGeneratedEdgeUnionRays({manifest,nativeReport});
 const graph=math.globalPaperEvents;
 if(!math.currentNativeReported3DAndM0SourceCrossChecked||
    !math.allNativeResultEdgeEndpointIsSameJunctionsReconciled||
    graph?.actualM4PairwiseSegmentViewChecks!==
     nativeReport.resultEdgeCount*(nativeReport.resultEdgeCount-1)/2*3||
    graph.VHWSourceRows!==nativeReport.resultEdgeCount*3||
    graph.sourceResultEdgeCount!==nativeReport.resultEdgeCount||
    graph.nativeSourceGenuinenessSignedHere!==false||
    graph.allOfficialEngineeringLinesCertified!==false||
    math.ConstructionIntentAuthorized!==false||
    math.signedV5ActionCount!==0)
  throw new RangeError('single-run original OCCT/M0/M4/M5 provenance or account mismatch');
 const provenance={
  inputManifestSha256:crypto.createHash('sha256').update(bytes).digest('hex'),
  originalModelBoundsSha256:nativeReport.canonicalOriginalComponentGeometrySHA256,
  actualNativeOpenCascadeRanInThisProcessTree:true,
  sourceManifestHadNoReferenceAnswer:true,
  signedV5ActionCount:0,
  scope:'two-reviewed-axis-aligned-box-boolean-union-reference'
 };
 const packed={
  schema:'draftai-c2-actual-native-occt-m0-m4-m5-full-proof-pack/1',
  revision:manifest.revision,status:'same-run-native-brep-math-proof-only',
  sourceIds:[...ids],provenance,
  nativeTopology:nativeReport,mathM0M4M5:math,
  verifiedNativeGeneratedEdges:nativeReport.resultEdgeCount,
  actualM4PairwiseSegmentViewChecks:graph.actualM4PairwiseSegmentViewChecks,
  continuousM5SubspanCount:graph.continuousM5SubspanCount,
  source3DAndProjectedEventsRecomputedInSameRun:true,
  completeEngineeringLineStylesCertified:false,
  ConstructionIntentDAGSingleV5FullySigned:false,
  textbookAnswerWasNotAvailableOrUsed:true,
  realTextbookBlindTestPassed:false
 };
 const out=JSON.stringify(packed,null,2)+'\n';
 if(Buffer.byteLength(out,'utf8')>12*1024*1024)
  throw new RangeError('bounded native CAD mathematical witness output exceeded');
 fs.writeFileSync(output,out,{flag:'wx',encoding:'utf8'});
 return Object.freeze({
  schema:packed.schema,outputPath:output,status:packed.status,
  actualGeneratedEdges:packed.verifiedNativeGeneratedEdges,
  pairViewChecks:packed.actualM4PairwiseSegmentViewChecks,
  subspanCount:packed.continuousM5SubspanCount,
  actualNativeOpenCascadeRan:true,fullySignedV5:false
 });
}
if(require.main===module){
 try{
  const [inputPath,outputPath,...rest]=process.argv.slice(2);
  if(rest.length)throw new TypeError('exactly one source and one new proof-pack path required');
  process.stdout.write(JSON.stringify(generateNativeC2FullMathProofPack({
   inputPath,outputPath
  }))+'\n');
 }catch(err){
  process.stderr.write(JSON.stringify({status:'blocked',
   error:String(err.message),fullOriginalV5Verified:false})+'\n');
  process.exitCode=2;
 }
}
module.exports={generateNativeC2FullMathProofPack};
