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
const {VIEWS,toSheet}=
 require('../core/projection/conventions.js');
const {CONSTRUCTION_INTENT_VERSION}=
 require('../core/contracts/construction-intent.js');
const {assertM3ToV5Consistency}=
 require('../workbench/m3-v5-consistency-gate.cjs');
const {verifiedTeachingActionToV5}=
 require('../workbench/construction-step-v5-adapter.cjs');
const Timeline=require('../workbench/teaching-timeline-v5.js');

/**
 * This signer is intentionally PRIVATE to the same-process native-run CLI.
 * Its only caller below first executes the ACTUAL OCP BRep producer, then
 * rebuilds the matching original M0/M4/M5 graph and validates it.
 *
 * No third party can pass fabricated "verified" booleans to this signer
 * through an exported API. It reuses the exact one existing V5 timeline,
 * canonical ConstructionIntent DAG, original engineering-style adapter,
 * and first-angle mm-to-sheet transform. No replacement animation engine.
 *
 * A partial drawing may contain genuinely signed visible/hidden subspans;
 * all remaining physical generated BRep edges stay in a separate unsigned
 * inventory, and it is NEVER exported as a complete C2 result.
 */
function signCertifiedNativeC2OpenRaySubspans({math,nativeReport,revision}){
 const graph=math?.globalPaperEvents,raw=nativeReport?.outputEdges;
 if(graph?.schema!=='draftai-c2-native-generated-m4-m5-global-paper-events/1'||
    graph.revision!==revision||!Array.isArray(graph.rows)||
    graph.sourceResultEdgeCount!==raw?.length||
    math.allNativeResultEdgeEndpointIsSameJunctionsReconciled!==true||
    !Number.isSafeInteger(revision)||revision<1)
  throw new RangeError('fresh actual OCCT original M0/M4/M5 scene proof required');
 const byId=new Map(raw.map(e=>[e.finalTopoDSEdgeOrdinal,e]));
 if(byId.size!==raw.length||graph.VHWSourceRows!==3*raw.length)
  throw new RangeError('incomplete native C2 generated BRep source inventory');
 const sheetTransform={origin:{x:320,y:270},scale:12},
  styles={
   'analytic-whole-open-subspan-front-ray-clear':
    'gb-t-4457.4-continuous-wide-visible-outline',
   'analytic-whole-open-subspan-strictly-hidden':
    'gb-t-4457.4-thin-dashed-hidden-edge'
  },signed=[],unsigned=[],noLine=[],intents=[],steps=[],
  styleByIntentId=Object.create(null);
 const source={solver:'tools/c2_native_m0_m4_m5_proof_pack.cjs',
  revision,unit:'mm',
  proofScope:'same-run-native-BRep-M0-M4-M5-two-convex-box-union',
  proofLevel:'analytic',resultId:null,branchId:null,status:'unique',
  evidenceSource:'fresh-real-OCCT-IsSame-continuous-M5-generated-edge'};
 const counts={positiveSignedVisible:0,positiveSignedHidden:0,
  unsignedPhysicalIntervals:0,coplanarNonLines:0,
  collapsedProjectedNativeEdges:0,unverifiedNativeFeatures:0};
 const seen=new Set();
 for(const row of graph.rows){
  const edge=byId.get(row.sourceNativeResultEdgeOrdinal);
  if(!edge||!VIEWS.includes(row.view)||!Array.isArray(row.subspans)||
     JSON.stringify(row.source3DVertexOrdinals)!==
      JSON.stringify(edge.actualNativeTopoDSVertexOrdinals))
   throw new RangeError('native result edge, source IDs and M4 interval junctions differ');
  const rowId=row.view+'@'+row.sourceNativeResultEdgeOrdinal;
  if(seen.has(rowId))throw new RangeError('duplicate C2 source-view row');
  seen.add(rowId);
  const feature=edge.currentNativeResultFeatureStatus;
  if(row.collapsed){
   if(row.subspans.length)throw new RangeError('collapsed native edge has projected strokes');
   counts.collapsedProjectedNativeEdges++;
   noLine.push({view:row.view,
    sourceNativeResultEdgeOrdinal:row.sourceNativeResultEdgeOrdinal,
    reason:'collapsed-first-angle-paper-projection'});
   continue;
  }
  if(row.cuts?.[0]!==0||row.cuts?.at(-1)!==1||
     row.subspans.length!==row.cuts.length-1)
   throw new RangeError('M4 source intervals do not exactly tile full generated edge');
  let cursor=0;
  for(const [k,span] of row.subspans.entries()){
   const range=span.originalGeneratedEdgeParameterRange;
   if(!Array.isArray(range)||range.length!==2||
      range[0]!==cursor||range[1]!==row.cuts[k+1]||
      !(range[1]>range[0]))
    throw new RangeError('M4 positive native interval has actual binary64 gap');
   cursor=range[1];
   const base={view:row.view,
    sourceNativeResultEdgeOrdinal:row.sourceNativeResultEdgeOrdinal,
    sourceOriginalTopoDSVertexOrdinals:[...row.source3DVertexOrdinals],
    originalGeneratedEdgeParameterRange:[...range],
    projectedFromModelMm:{...span.projectedFromModelMm},
    projectedToModelMm:{...span.projectedToModelMm}};
   if(feature==='coplanar-subdivision'){
    if(span.status!=='coplanar-native-subdivision-not-a-line')
     throw new RangeError('native coplanar seam falsely gained a physical source');
    counts.coplanarNonLines++;noLine.push({...base,
     reason:'actual-OCCT-coplanar-nonphysical-subdivision'});
    continue;
   }
   if(feature!=='physical-crease'){
    counts.unverifiedNativeFeatures++;unsigned.push({...base,
     reason:'native-physical-dihedral-not-certified'});
    continue;
   }
   const style=styles[span.status],clear=
    span.status==='analytic-whole-open-subspan-front-ray-clear'&&
    span.continuousAllOpaqueComponentRayClearVerified===true&&
    span.continuousUnionStrictInteriorOcclusionVerified===false,
    hidden=span.status==='analytic-whole-open-subspan-strictly-hidden'&&
    span.continuousUnionStrictInteriorOcclusionVerified===true&&
    span.continuousAllOpaqueComponentRayClearVerified===false;
   if(!style||!(clear||hidden)||span.projectedAliasOrUncertainEventBlocked!==false||
      span.continuousSourceGeometryIsOriginalNativeTopoDSEdge!==true||
      span.nativeActualTopologySourceNotIndependentlyAttestedHere!==true){
    counts.unsignedPhysicalIntervals++;unsigned.push({...base,
     reason:span.status,originalMathEvidenceUnsigned:true});
    continue;
   }
   const from=toSheet(row.view,span.projectedFromModelMm,sheetTransform),
    to=toSheet(row.view,span.projectedToModelMm,sheetTransform);
   if(Math.hypot(to.x-from.x,to.y-from.y)<=1e-8){
    counts.unsignedPhysicalIntervals++;unsigned.push({...base,
     reason:'positive-but-undrawably-short-after-first-angle-transform'});
    continue;
   }
   if(steps.length>=280)
    throw new RangeError('bounded single canonical V5 native source action limit exceeded');
   const id='c2_native_'+row.view+'_'+row.sourceNativeResultEdgeOrdinal+'_'+k,
    actionId='c2_native_action_'+row.view+'_'+row.sourceNativeResultEdgeOrdinal+'_'+k;
   const previous=intents.at(-1)?.id,dependsOn=previous?[previous]:[];
   const op={id:actionId,kind:'line',coordinateSpace:'sheet-px',
    geometry:{from,to}};
   intents.push({schema:CONSTRUCTION_INTENT_VERSION,id,
    purpose:clear?'draw-certified-native-visible-edge':
     'draw-certified-native-hidden-edge',
    role:'result',dependsOn,inputEntityIds:[],outputEntityIds:[actionId],
    operations:[op],source:{...source}});
   steps.push({id,dependsOn,role:'result',
    title:'经 OCCT 与 M5 认证的实体棱线 '+row.view,
    explanation:'真实 TopoDS、完整 M4 参数分割与全连续 M5 射线证明。',
    actions:[verifiedTeachingActionToV5({id:actionId,kind:'line',
     coordinateSpace:'sheet-px',from,to,engineeringLineStyle:style},
     sheetTransform)]});
   styleByIntentId[id]=style;
   signed.push({...base,actionId,standardEngineeringLineStyle:style,
    fullOriginalC2NativeM0M4M5ProofVerifiedInFreshRun:true,
    signedByExistingConstructionIntentDagAndSingleV5:true});
   if(clear)counts.positiveSignedVisible++;
   else counts.positiveSignedHidden++;
  }
  if(cursor!==1)
   throw new RangeError('native generated edge did not close its [0,1] source interval');
 }
 if(seen.size!==graph.VHWSourceRows||
    signed.length!==counts.positiveSignedVisible+counts.positiveSignedHidden||
    graph.continuousM5SubspanCount!==
     signed.length+unsigned.length+noLine.filter(x=>
       x.originalGeneratedEdgeParameterRange).length)
  throw new RangeError('signed and held native generated source ranges not all accounted');
 const timeline=Timeline.compileTimeline(steps);
 if(intents.length){
  assertM3ToV5Consistency({revision,intents,steps,timing:timeline,
   sheet:sheetTransform,styleByIntentId});
  if(!Timeline.createPlayer(timeline,{revision}).canRender(revision))
   throw new RangeError('canonical native C2 V5 cannot replay current revision');
 }
 const full=unsigned.length===0&&signed.length>0;
 return Object.freeze({
  schema:'draftai-c2-trusted-native-partial-construction-intent-v5/1',
  status:full?'all-native-physical-generated-strokes-signed-in-bounded-scope':
   'only-source-certified-native-stroke-subset-signed',
  revision,sourceGeometryHash:nativeReport.canonicalOriginalComponentGeometrySHA256,
  certifiedVisibleHiddenSourceIntervals:signed,
  unsignedNativePhysicalSourceIntervals:unsigned,
  excludedNonphysicalOrCollapsedIntervals:noLine,
  counts,allPositivePhysicalGeneratedIntervalsSigned:full,
  sheetTransform,intents,steps,timeline,
  originalV5PlayerFactory:'workbench/teaching-timeline-v5.js',
  canonicalConstructionIntentDagChecked:true,
  oneExistingV5TimelineRecreated:true,
  realNativeBRepWasExecutedInOriginalRunner:true,
  otherNonConvexGeneralMeshesCertified:false,
  realTextbookBlindTestPassed:false
 });
}

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
 const certifiedV5=signCertifiedNativeC2OpenRaySubspans({
  math,nativeReport,revision:manifest.revision
 });
 const packed={
  schema:'draftai-c2-actual-native-occt-m0-m4-m5-full-proof-pack/1',
  revision:manifest.revision,status:'same-run-native-brep-math-proof-only',
  sourceIds:[...ids],provenance,
  nativeTopology:nativeReport,mathM0M4M5:math,
  sourceCertifiedNativeCanonicalV5:certifiedV5,
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
  officiallySignedNativeSubspanCount:certifiedV5.certifiedVisibleHiddenSourceIntervals.length,
  pendingUnsignedNativeSubspanCount:certifiedV5.unsignedNativePhysicalSourceIntervals.length,
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
