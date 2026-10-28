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
const {auditC2StrictNativeBehindSignedPaperCoverage}=
 require('../workbench/c2-native-strictly-behind-signed-coverage.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');

/**
 * Same-run AUDIT VISUALIZATION of the already-signed original canonical V5
 * actions. This function is private, never accepts a caller-supplied proof
 * pack and does not certify new math or invent a second drawing engine.
 * Unsigned/paper-alias native ranges have NO stroke in this sheet.
 */
function renderSameRunSignedC2Svg(certified){
 const rows=certified?.certifiedVisibleHiddenSourceIntervals;
 const steps=certified?.steps,blocked=certified?.unsignedNativePhysicalSourceIntervals;
 if(!Array.isArray(rows)||!Array.isArray(steps)||!Array.isArray(blocked)||
    certified.realNativeBRepWasExecutedInOriginalRunner!==true||
    certified.canonicalConstructionIntentDagChecked!==true||
    certified.oneExistingV5TimelineRecreated!==true||
    !Number.isSafeInteger(certified.revision))
  throw new RangeError('fresh canonical signed C2 V5 source required for audit SVG');
 const actions=new Map();
 for(const step of steps)for(const action of step.actions){
  if(actions.has(action.id)||action.kind!=='line')
   throw new RangeError('duplicate or unsupported existing V5 action');
  actions.set(action.id,action);
 }
 if(rows.length!==actions.size||!rows.length)
  throw new RangeError('signed original source / same V5 action mismatch');
 const unsignedIDs=new Set(blocked.map(x=>x.actionId).filter(Boolean));
 const seen=new Set(),views={V:[],H:[],W:[]},coordinates=[];
 for(const row of rows){
  const action=actions.get(row.actionId);
  if(!action||seen.has(row.actionId)||unsignedIDs.has(row.actionId)||
     !Object.hasOwn(views,row.view)||
     row.fullOriginalC2NativeM0M4M5ProofVerifiedInFreshRun!==true||
     row.signedByExistingConstructionIntentDagAndSingleV5!==true||
     action.engineeringLineStyle!==row.standardEngineeringLineStyle)
   throw new RangeError('unverified native interval entered signed visual evidence');
  const attrs=Motion.actionShapeAttrs(action,1);
  if(![attrs.x1,attrs.y1,attrs.x2,attrs.y2].every(Number.isFinite)||
     !Number.isSafeInteger(row.sourceNativeResultEdgeOrdinal)||
     !['gb-t-4457.4-continuous-wide-visible-outline',
       'gb-t-4457.4-thin-dashed-hidden-edge'].includes(action.engineeringLineStyle))
   throw new RangeError('nonfinite/unsigned canonical V5 shape rejected');
  const hidden=action.engineeringLineStyle==='gb-t-4457.4-thin-dashed-hidden-edge';
  views[row.view].push('<line x1="'+attrs.x1+'" y1="'+attrs.y1+
   '" x2="'+attrs.x2+'" y2="'+attrs.y2+'" stroke="#143a63"'+
   ' stroke-width="'+attrs['stroke-width']+'" stroke-dasharray="'+
   attrs['stroke-dasharray']+'" fill="none" data-proof="native-m0-m4-m5"'+
   ' data-view="'+row.view+'" data-source-ordinal="'+
   row.sourceNativeResultEdgeOrdinal+'" data-v5-action="'+row.actionId+
   '" data-engineering-line="'+(hidden?'hidden':'visible')+'"/>');
  coordinates.push([attrs.x1,attrs.y1],[attrs.x2,attrs.y2]);
  seen.add(row.actionId);
 }
 if(coordinates.length!==rows.length*2)
  throw new RangeError('missing signed C2 source geometry');
 const xs=coordinates.map(p=>p[0]),ys=coordinates.map(p=>p[1]);
 const left=Math.min(...xs)-25,top=Math.min(...ys)-72,
  width=Math.max(400,Math.max(...xs)-left+30),
  height=Math.max(220,Math.max(...ys)-top+30);
 const lines=Object.entries(views).map(([view,items])=>
  '<g aria-label="'+view+' original M5 certified strokes"'+
  ' data-first-angle-view="'+view+'">'+items.join('')+'</g>').join('');
 const summary='Signed original M5: '+rows.length+
  '; unsigned original intervals not drawn: '+blocked.length+
  '; original textbook blind answer: NOT VERIFIED';
 return '<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+
  [left,top,width,height].join(' ')+'" role="img"'+
  ' aria-label="C2 native signed-only V H W mathematical audit sheet"'+
  ' data-math-scope="same-run-two-box-native-partial"'+
  ' data-complete-c2="false" data-textbook-blind="false"'+
  ' data-unsigned-native-intervals-excluded="'+blocked.length+'">'+
  '<title>C2 OpenCascade / original V5 signed-only V H W review</title>'+
  '<desc>'+summary+'</desc>'+
  '<rect x="'+left+'" y="'+top+'" width="'+width+'" height="'+height+
  '" fill="white"/><text x="'+(left+16)+'" y="'+(top+30)+
  '" font-size="17" fill="#164c81">C2 | native original signed source only</text>'+
  '<text x="'+(left+16)+'" y="'+(top+50)+
  '" font-size="12" fill="#44566b">'+summary+'</text>'+
  lines+'</svg>\n';
}



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
 const suppression=auditC2StrictNativeBehindSignedPaperCoverage({
  unsigned,m4Rows:graph.rows,signed
 });
 if(suppression.examinedOriginalUnsignedPhysicalIntervals!==unsigned.length||
    suppression.suppressed.length+suppression.held.length!==unsigned.length||
    suppression.supplementaryV5ActionCount!==0)
  throw new RangeError('original native source back-edge suppression drifted');
 const full=signed.length>0&&suppression.held.length===0;
 return Object.freeze({
  schema:'draftai-c2-trusted-native-partial-construction-intent-v5/1',
  status:full?'all-two-axis-box-union-native-physical-sources-signed-or-strictly-suppressed':
   'only-source-certified-native-stroke-subset-signed',
  revision,sourceGeometryHash:nativeReport.canonicalOriginalComponentGeometrySHA256,
  certifiedVisibleHiddenSourceIntervals:signed,
  suppressedNativeBackSourceIntervals:suppression.suppressed,
  unsignedNativePhysicalSourceIntervals:suppression.held,
  excludedNonphysicalOrCollapsedIntervals:noLine,
  suppressionMath:suppression,
  counts:{...counts,
   strictlyBehindSignedForegroundFullySuppressed:suppression.suppressed.length,
   remainingUnsignedPhysicalIntervals:suppression.held.length},
  allPositivePhysicalGeneratedIntervalsSigned:
   full&&suppression.suppressed.length===0,
  allNativePhysicalSourcesSignedOrProvenSuppressed:full,
  boundedTwoBoxUnionFullFormalV5Certified:full,
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
 if(!output.endsWith('.json'))
  throw new TypeError('native proof output must end in .json');
 const signedSheetPath=output.slice(0,-5)+'.signed-only.svg';
 if(input===output||fs.existsSync(output)||fs.existsSync(signedSheetPath))
  throw new RangeError('never overwrite an existing source or a prior native math witness / signed-only review');
 const bytes=fs.readFileSync(input);
 if(bytes.length<25||bytes.length>64*1024)
  throw new RangeError('bounded original two-component CAD source required');
 const manifest=JSON.parse(bytes.toString('utf8'));
 if(manifest.unit!=='mm'||!Number.isSafeInteger(manifest.revision)||
    manifest.revision<1||!Array.isArray(manifest.components)||
    manifest.components.length!==2)
  throw new TypeError('explicit current 2-component model-mm source required');
 const operation=manifest.operation??'union';
 if(!['union','cut'].includes(operation))
  throw new TypeError('current native Boolean source operation unsupported');
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
    (nativeReport.actualNativeBooleanOperation??'union')!==operation||
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
 if(operation==='cut'&&
    (nativeReport.originalSolidDifferenceReviewedAsThroughRectangularBore!==true||
     nativeReport.resultFaceCount<8||
     nativeReport.resultEdgeCount<20||
     nativeReport.resultVertexCount<12||
     math.counts.clear+math.counts.hidden<=0||
     graph.partialSubtractiveCutRaySubspansProven<=0||
     graph.partialSubtractiveCutRaySubspansProven!==
      graph.positiveWholeOpenRayClearSubspans+
      graph.positiveWholeStrictlyHiddenSubspans||
     math.subtractiveCutOriginalEdgeOpenRayProofs!==
      math.counts.clear+math.counts.hidden||
     math.counts.strictFrontMaterialSlabHidden<0||
     math.counts.strictFrontMaterialSlabHidden>math.counts.hidden||
     graph.positivelyProvenCutFrontMaterialSlabSubspans<0||
     graph.positivelyProvenCutFrontMaterialSlabSubspans>
      graph.positiveWholeStrictlyHiddenSubspans||
     math.rows.filter(r=>r.originalOpenSourceFrontStockMaterialSlabWitness!==null&&
      r.originalOpenSourceFrontStockMaterialSlabWitness!==undefined).length!==
      math.counts.strictFrontMaterialSlabHidden||
     graph.rows.reduce((n,r)=>n+r.subspans.filter(s=>
      s.wholeOpenM4SubspanStrictFrontMaterialSlabProven===true).length,0)!==
      graph.positivelyProvenCutFrontMaterialSlabSubspans||
     math.generatedEdgeContinuousM5SubspansRecomputed!==true||
     math.allFirstAngleWholeOriginalGeneratedEdgeRaysAudited!==true||
     graph.rows.some(row=>row.subspans.some(span=>
      span.continuousUnionStrictInteriorOcclusionVerified!==false||
      span.continuousAllOpaqueComponentRayClearVerified!==false||
      span.V5ActionSignedOff!==false||
      span.officialEngineeringLineStyle!=='undetermined'))||
     math.strictSubtractiveBooleanContinuousM5VisibilityProven!==false))
  throw new RangeError('native Cut M0 partial continuous ray proofs may not become a union-style official M5/V5');
 const provenance={
  inputManifestSha256:crypto.createHash('sha256').update(bytes).digest('hex'),
  originalModelBoundsSha256:nativeReport.canonicalOriginalComponentGeometrySHA256,
  actualNativeOpenCascadeRanInThisProcessTree:true,
  sourceManifestHadNoReferenceAnswer:true,
  signedV5ActionCount:0,
  scope:operation==='cut'?
   'one-reviewed-box-minus-through-rectangular-bore-unsigned-m4-reference':
   'two-reviewed-axis-aligned-box-boolean-union-reference'
 };
 // The canonical V5 signer is rigorously valid for UNION only.
 // A subtractive void lacks a proven full-scene continuous M5 order. It
 // MUST NOT even create an empty-but-apparently-valid V5 timeline.
 const certifiedV5=operation==='union'?
  signCertifiedNativeC2OpenRaySubspans({
   math,nativeReport,revision:manifest.revision
  }):null;
 const packed={
  schema:'draftai-c2-actual-native-occt-m0-m4-m5-full-proof-pack/1',
  revision:manifest.revision,status:'same-run-native-brep-math-proof-only',
  booleanOperation:operation,sourceIds:[...ids],provenance,
  nativeTopology:nativeReport,mathM0M4M5:math,
  sourceCertifiedNativeCanonicalV5:certifiedV5,
  subtractiveCutPartialRayEvidence:operation==='cut'?{
   scope:'same-run-real-occt-source-view-open-ray-and-m4-subspan',
   nativeSourceViewClearRayProofs:math.counts.clear,
   nativeSourceViewStrictHiddenRayProofs:math.counts.hidden,
   nativeSourceViewFrontMaterialSlabHiddenProofs:
    math.counts.strictFrontMaterialSlabHidden,
   nativeSourceViewUnresolvedRayCount:math.counts.unresolvedDepth,
   m4SubspanClearRayProofs:graph.positiveWholeOpenRayClearSubspans,
   m4SubspanStrictHiddenRayProofs:graph.positiveWholeStrictlyHiddenSubspans,
   m4SubspanFrontMaterialSlabHiddenProofs:
    graph.positivelyProvenCutFrontMaterialSlabSubspans,
   m4SubspanUnresolvedRayCount:graph.unresolvedSubspans+
    graph.unsignedProjectedAliasSubspans,
   onlyOpenSourceInteriorVerified:true,
   allNativeEdgeEndpointAndGlobalDepthJunctionsCertified:false,
   fullEngineeringLineStyleAndV5Certified:false,
   signedV5ActionCount:0
  }:null,
  verifiedNativeGeneratedEdges:nativeReport.resultEdgeCount,
  actualM4PairwiseSegmentViewChecks:graph.actualM4PairwiseSegmentViewChecks,
  continuousM5SubspanCount:graph.continuousM5SubspanCount,
  source3DAndProjectedEventsRecomputedInSameRun:true,
  completeSubtractiveBooleanM5RayVisibilityCertified:false,
  completeEngineeringLineStylesCertified:
   operation==='union'&&certifiedV5?.allNativePhysicalSourcesSignedOrProvenSuppressed===true,
  ConstructionIntentDAGSingleV5FullySigned:
   operation==='union'&&certifiedV5?.boundedTwoBoxUnionFullFormalV5Certified===true,
  textbookAnswerWasNotAvailableOrUsed:true,
  realTextbookBlindTestPassed:false
 };
 const out=JSON.stringify(packed,null,2)+'\n';
 if(Buffer.byteLength(out,'utf8')>12*1024*1024)
  throw new RangeError('bounded native CAD mathematical witness output exceeded');
 // Only UNION has positive native M5 + canonical V5 authorization.
 // CUT remains unsigned; it must not produce a formally signed SVG.
 const svg=certifiedV5?renderSameRunSignedC2Svg(certifiedV5):null;
 if(svg!==null&&Buffer.byteLength(svg,'utf8')>1024*1024)
  throw new RangeError('signed-only native C2 review SVG exceeds size limit');
 if(svg!==null)fs.writeFileSync(signedSheetPath,svg,{flag:'wx',encoding:'utf8'});
 try{fs.writeFileSync(output,out,{flag:'wx',encoding:'utf8'});}
 catch(err){if(svg!==null)fs.unlinkSync(signedSheetPath);throw err;}
 return Object.freeze({
  schema:packed.schema,outputPath:output,
  signedOnlySvgPath:svg!==null?signedSheetPath:null,status:packed.status,
  actualGeneratedEdges:packed.verifiedNativeGeneratedEdges,
  pairViewChecks:packed.actualM4PairwiseSegmentViewChecks,
  subspanCount:packed.continuousM5SubspanCount,
  cutProvenWholeSourceViewRayCount:
   packed.subtractiveCutPartialRayEvidence===null?0:
   packed.subtractiveCutPartialRayEvidence.nativeSourceViewClearRayProofs+
   packed.subtractiveCutPartialRayEvidence.nativeSourceViewStrictHiddenRayProofs,
  cutProvenOpenM4SubspanRayCount:
   packed.subtractiveCutPartialRayEvidence===null?0:
   packed.subtractiveCutPartialRayEvidence.m4SubspanClearRayProofs+
   packed.subtractiveCutPartialRayEvidence.m4SubspanStrictHiddenRayProofs,
  cutStrictFrontMaterialWholeSourceViewCount:
   packed.subtractiveCutPartialRayEvidence?.nativeSourceViewFrontMaterialSlabHiddenProofs??0,
  cutStrictFrontMaterialM4SubspanCount:
   packed.subtractiveCutPartialRayEvidence?.m4SubspanFrontMaterialSlabHiddenProofs??0,
  officiallySignedNativeSubspanCount:
   certifiedV5?.certifiedVisibleHiddenSourceIntervals.length??0,
  pendingUnsignedNativeSubspanCount:
   certifiedV5?.unsignedNativePhysicalSourceIntervals.length??
   graph.rows.reduce((n,row)=>n+row.subspans.filter(span=>
    span.status!=='coplanar-native-subdivision-not-a-line').length,0),
  provenHiddenDuplicateSuppressionCount:
   certifiedV5?.suppressedNativeBackSourceIntervals.length??0,
  actualNativeOpenCascadeRan:true,
  fullySignedV5:operation==='union'&&
   certifiedV5?.boundedTwoBoxUnionFullFormalV5Certified===true
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
