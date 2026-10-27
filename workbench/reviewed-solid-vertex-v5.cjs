'use strict';
/**
 * C1: a single ORIGINAL V5 timeline for independently proven, user-corresponded
 * convex solid VERTEX construction. Every step is a namespace-bound copy of
 * canonical point-projection ConstructionIntent -> Step; no novel solver,
 * stroke-signing authority, V5 player or inferred 3D topology.
 *
 * A vertex marker and its guide lines are signed 03 point constructions;
 * geometry of every SOLID EDGE remains an uncertified preview. The resulting
 * composite timeline cannot certify solid contour/standard line styles.
 */
const {reviewedSolidThirdView}=
 require('./reviewed-multipoint-solid-third-view.cjs');
const {auditC1GlobalVisibleContourProof}=
 require('./m5-c1-global-visible-contour-proof.cjs');
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {assertM3ToV5Consistency}=
 require('./m3-v5-consistency-gate.cjs');
const {verifiedTeachingActionToV5}=
 require('./construction-step-v5-adapter.cjs');
const {CONSTRUCTION_INTENT_VERSION}=
 require('../core/contracts/construction-intent.js');
const Timeline=require('./teaching-timeline-v5.js');
const {renderC1ThirdViewSvg}=require('./c1-third-view-svg-preview.cjs');
const {renderC1ThreeViewSvg}=require('./c1-three-view-svg-sheet.cjs');
const {auditC1ReviewedConvexPhysicalEdgeStrokes}=
 require('./m5-c1-reviewed-convex-physical-edge-strokes.cjs');
const {VIEWS,toSheet}=require('../core/projection/conventions.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const frozen=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))frozen(v);
 Object.freeze(x);
}return x;};
function compileReviewedSolidVertexV5({input,sheetTransform}={}){
 if(!input||input.confirmedBy!=='user'||input.topologyConfirmed!==true||
    !sheetTransform||!sheetTransform.origin||
    !['x','y'].every(k=>finite(sheetTransform.origin[k]))||
    !finite(sheetTransform.scale)||sheetTransform.scale<=0||
    sheetTransform.scale>100)
  throw new TypeError('confirmed millimetre solid and finite shared V5 paper scale required');
 const sceneResult=reviewedSolidThirdView(input); // current 03 / M0 / Scene
 if(sceneResult.status!=='geometry-proven-in-confirmed-convex-scope')
  throw new RangeError('closed convex first-angle source proof unavailable');
 const globalVisibleContourProof=auditC1GlobalVisibleContourProof({
  geometry:sceneResult.geometry,revision:input.revision});
 const {contourCoverage:convexContourSourceCoverage,
  contourPhysicalJunctionIncidence,
  continuousFrontmostSourceRays}=globalVisibleContourProof;
 if(continuousFrontmostSourceRays.v5Ready!==false||
    continuousFrontmostSourceRays.signedV5LineActions!==0||
    continuousFrontmostSourceRays.officialLineStylesVerified!==false)
  throw new RangeError('C1 scoped source-depth and ray witnesses cannot sign strokes');
 if(contourPhysicalJunctionIncidence.completeSolidV5Ready!==false||
    contourPhysicalJunctionIncidence.signedV5EdgeActions!==0)
  throw new RangeError('scoped physical C1 junction cannot sign complete solid strokes');
 const wholeSourceEdgeRayEvidence=convexContourSourceCoverage.edgeLedger;
 if(wholeSourceEdgeRayEvidence.signedEdgeV5Ready!==false||
    wholeSourceEdgeRayEvidence.officialLineStylesVerified!==false)
  throw new RangeError('M5 source ray audit may not mint official solid edge actions');
 // C1 reviewed convex source/scene/M5 reconciliation. This is a presentation
 // consumer of the already-proven single-source evidence, not a line signer.
 // In particular a triangulation diagonal may appear in the canonical mesh
 // projection but must not be advertised as a physical engineering crease.
 const scopedEdgePreviews=[];
 const rows=wholeSourceEdgeRayEvidence.edges;
 const indexed=new Map(rows.map(x=>[x.view+'::'+x.sourceEdgeId,x]));
 if(indexed.size!==rows.length||
    rows.length!==sceneResult.geometry.data.edges.length*VIEWS.length)
  throw new RangeError('C1 source M5 ledger has duplicate or missing projected edges');
 const dist=(p,q)=>Math.hypot(p.u-q.u,p.v-q.v);
 for(const view of VIEWS){
  const projection=sceneResult.projections[view];
  if(projection.kind!=='mesh-projection'||
     projection.edges.length!==sceneResult.geometry.data.edges.length)
   throw new RangeError('C1 canonical scene edge projection unavailable');
  for(const e of projection.edges){
   const edgeId=sceneResult.geometry.id+'::'+[e.fromId,e.toId].sort().join('|');
   const row=indexed.get(view+'::'+edgeId);
   const from=projection.points[e.fromId],to=projection.points[e.toId];
   if(!row||row.sourceGeometryId!==sceneResult.geometry.id||
      row.view!==view||row.sourceEdgeId!==edgeId||
      row.sourceVertexIds[0]!==e.fromId||
      row.sourceVertexIds[1]!==e.toId||
      !from||!to||dist(from,row.projectedFrom)>1e-8||
      dist(to,row.projectedTo)>1e-8)
    throw new RangeError('C1 canonical projected edge and current M5 source differ');
   const collapsed=e.projection.kind==='point';
   if(collapsed!==(row.status==='projected-point-not-an-edge')||
      row.V5LineActionSignedOff!==false||
      row.standardEngineeringLineStyle!=='undetermined'||
      (row.originalCoplanarMeshSubdivisionVerified&&
       row.originalSingleSolidCreaseVerified))
    throw new RangeError('C1 invalid source-edge feature or certification scope');
   scopedEdgePreviews.push({
    sourceGeometryId:sceneResult.geometry.id,sourceEdgeId:edgeId,
    sourceVertexIds:[e.fromId,e.toId],view,revision:input.revision,
    fromModelMm:{...from},toModelMm:{...to},
    projectionCollapsedToPoint:collapsed,
    sourcePhysicalCreaseVerified:row.originalSingleSolidCreaseVerified,
    sourceCoplanarSubdivisionVerified:row.originalCoplanarMeshSubdivisionVerified,
    rayEvidenceStatus:row.status,
    continuousFrontRayClearVerified:row.continuouslyFrontRayClearVerified,
    entireEdgeStrictlyOccludedVerified:row.completeStrictInteriorOcclusionVerified,
    renderedAsPhysicalSourceCandidate:!row.originalCoplanarMeshSubdivisionVerified&&
      row.originalSingleSolidCreaseVerified,
    finalEngineeringLineStyle:'undetermined',officialV5Stroke:false
   });
  }
 }
 if(scopedEdgePreviews.length!==rows.length)
  throw new RangeError('C1 incomplete first-angle edge proof binding');
 const vertexIds=Object.keys(sceneResult.geometry.data.points).sort();
 if(vertexIds.length>16)
  throw new RangeError('at most 16 reviewed vertices for one bounded V5 point timeline');
 const byId=new Map(input.vertices.map(v=>[v.id,v]));
 const intents=[],steps=[],bindings=[];
 let pointActionCount=0;
 for(const [index,id] of vertexIds.entries()){
  const row=byId.get(id),proofPoint=sceneResult.geometry.data.points[id];
  if(!row||!proofPoint)throw new RangeError('source point identity lost');
  const given={knownViews:Object.fromEntries(Object.entries(row.knownViews).map(
   ([view,uv])=>[view,[...uv]])),sheetTransform};
  const computed=solveProjection(given);
  if(computed.status!=='unique'||computed.globallyUnique!==true||
     !computed.point||computed.maxResidual>1e-8||
     ['x','y','z'].some(k=>Math.abs(computed.point[k]-proofPoint[k])>1e-8))
   throw new RangeError('independent 03 point proof and reviewed convex scene disagree');
  const plan=evaluateUnifiedMath({kind:'point-projection',
   input:given,revision:input.revision});
  if(plan.status!=='ready'||plan.canonicalVerified!==true||
     plan.mathematicallyVerified!==true||plan.revision!==input.revision||
     !Array.isArray(plan.constructionIntents)||
     plan.constructionIntents.length!==plan.steps?.length)
   throw new RangeError('point lacks canonical 03 ConstructionIntent / V5 proof');
  const prefix='v'+index+'_';
  const map=x=>prefix+x;
  for(const intent of plan.constructionIntents){
   intents.push({...intent,id:map(intent.id),
    dependsOn:intent.dependsOn.map(map),
    inputEntityIds:intent.inputEntityIds.map(map),
    outputEntityIds:intent.outputEntityIds.map(map),
    operations:intent.operations.map(op=>({...op,id:map(op.id)})),
    source:{...intent.source}});
  }
  for(const step of plan.steps){
   steps.push({...step,id:map(step.id),dependsOn:step.dependsOn.map(map),
    actions:step.actions.map(a=>({...a,id:map(a.id)}))});
   pointActionCount+=step.actions.filter(a=>a.kind==='point').length;
  }
  const third=plan.constructionIntents.filter(i=>i.purpose==='project-proven-third-view');
  if(third.length!==1)throw new RangeError('missing canonical third-view point result Intent');
  const op=third[0].operations[0];
  const missing=sceneResult.missingView;
  const expected=toSheet(missing,sceneResult.projections[missing].points[id],sheetTransform);
  if(op.kind!=='point'||op.coordinateSpace!=='sheet-px'||
     !op.id.endsWith(missing)||!op.geometry?.at||
     Math.hypot(op.geometry.at.x-expected.x,
      op.geometry.at.y-expected.y)>1e-7)
   throw new RangeError('third-view source projection or point action identity mismatch');
  bindings.push({vertexId:id,revision:input.revision,
   pointSourceResultId:computed.resultId??null,
   firstAngleMissingView:missing,finalIntentId:map(third[0].id),
   finalActionId:map(op.id),proven3DPoint:{...computed.point},
   provenThirdSheetPoint:{...expected},
   vertexConstructionVerified:true,
   correspondingEdgeVisibilityVerified:false});
 }
 // Keep the ORIGINAL ONE point Intent DAG and proofs. Only after an entire
 // closed convex silhouette is independently proven in ALL three first-angle
 // views can its visible outer contour join the SAME Intent/Step/V5 stream.
 // Re-identify the trusted recomputed C1 composite specialist as the uniform
 // DAG proof source. Do not forge a point-only proof as a spatial stroke.
 const certifiedVisibleContourLineActionIds=[];
 const certifiedVisibleContourLineBindings=[];
 if(globalVisibleContourProof.allThreeViewsGlobalContourCertified){
  const src={solver:'workbench/reviewed-solid-vertex-v5.cjs',
   revision:input.revision,unit:'mm',
   proofScope:'confirmed-convex-M0-M5-03-points-and-complete-visible-VHW-hull',
   proofLevel:'analytic',resultId:null,branchId:null,status:'unique',
   evidenceSource:'C1-reviewed-03-points-global-visible-convex-hull-proof'};
  // These same original point operations were each recomputed by 03 and
  // checked above; the composite source now binds BOTH independent proofs.
  for(const i of intents)i.source={...src};
  let parent=intents.at(-1)?.id;
  if(!parent)throw new RangeError('missing certified original point DAG');
  for(const v of globalVisibleContourProof.views){
   if(!v.allContourLinesVerified)
    throw new RangeError('mixed signed and unsigned global silhouette ring');
   for(const [idx,line] of v.candidateIntervals.entries()){
    if(line.revision!==input.revision||
       line.sourceGeometryId!==sceneResult.geometry.id||
       line.view!==v.view||
       line.signedOfficialLineStyle!==
        'gb-t-4457.4-continuous-wide-visible-outline'||
       line.v5ActionAuthorized!==true||
       !line.genuineFrontSourceEndpointJoinsVerified||
       !line.continuouslyFrontRayClearVerified||
       !line.locallyCompleteVisibleHullSegmentProven)
     throw new RangeError('missing genuine full-ring C1 visible contour proof');
    const id='c1_hull_'+v.view+'_'+idx,
     actionId='c1_hull_action_'+v.view+'_'+idx,
     from=toSheet(v.view,line.projectedFromModelMm,sheetTransform),
     to=toSheet(v.view,line.projectedToModelMm,sheetTransform);
    const op={id:actionId,kind:'line',coordinateSpace:'sheet-px',
     geometry:{from,to}};
    intents.push({schema:CONSTRUCTION_INTENT_VERSION,id,
     purpose:'draw-certified-single-convex-visible-exterior-contour',
     role:'result',dependsOn:[parent],inputEntityIds:[],
     outputEntityIds:[actionId],operations:[op],source:{...src}});
    steps.push({id,dependsOn:[parent],
     title:'正式可见外轮廓 '+v.view+' 第 '+(idx+1)+' 段',
     explanation:'独立闭合凸体全部纸面轮廓、三维接点和连续无遮挡证据已通过。',
     role:'result',actions:[verifiedTeachingActionToV5({
      id:actionId,kind:'line',coordinateSpace:'sheet-px',from,to
     },sheetTransform)]});
    certifiedVisibleContourLineActionIds.push(actionId);
    certifiedVisibleContourLineBindings.push({
     actionId,revision:input.revision,sourceGeometryId:line.sourceGeometryId,
     sourceEdgeId:line.sourceEdgeId,view:v.view,
     fromModelMm:{...line.projectedFromModelMm},
     toModelMm:{...line.projectedToModelMm},
     fromSheetPx:{...from},toSheetPx:{...to},
     standardLineStyle:'gb-t-4457.4-continuous-wide-visible-outline',
     completeClosedConvexOuterSilhouetteVerified:true,
     signedFormalLineV5:true,hiddenOrInternalFeatureLineAuthorized:false});
    parent=id;
   }
  }
 }
 // Formal signed physical crease subspans MUST come from the ORIGINAL
 // M0/M4/M5 ray theorem; only the already existing V5 accepts those lines.
 // Larger meshes retain their existing contour/point output until they have
 // bounded all-original M4 event coverage (current canonical limit: 40).
 const physicalEdgeProof=sceneResult.geometry.data.edges.length<=40?
  auditC1ReviewedConvexPhysicalEdgeStrokes({
   geometry:sceneResult.geometry,revision:input.revision
  }):null;
 const certifiedPhysicalLineBindings=[];
 const lineStyleByIntentId=Object.create(null);
 if(physicalEdgeProof&&globalVisibleContourProof.allThreeViewsGlobalContourCertified){
  const src=intents[0].source;
  let parent=intents.at(-1)?.id;
  if(!parent)throw new RangeError('missing original C1 proof DAG parent');
  if(physicalEdgeProof.signedCandidates.length+intents.length>300)
   throw new RangeError('source-certified physical line count exceeds sole V5 limit');
  for(const [i,line] of physicalEdgeProof.signedCandidates.entries()){
   if(line.revision!==input.revision||
      line.sourceGeometryId!==sceneResult.geometry.id||
      !VIEWS.includes(line.view)||
      line.sourcePhysicalCreaseVerified!==true||
      line.completeOriginalParameterPartitionVerified!==true||
      line.source3DEndpointInterpolationVerified!==true||
      line.wholeSubspanOpaqueFaceRayOrderVerified!==true||
      line.noPositiveCoProjectedSourceAliasVerified!==true||
      line.V5ActionAlreadyCreated!==false)
    throw new RangeError('unverified original physical source line cannot enter V5');
   const id='c1_edge_'+line.view+'_'+i,
    actionId='c1_edge_action_'+line.view+'_'+i,
    from=toSheet(line.view,line.fromModelMm,sheetTransform),
    to=toSheet(line.view,line.toModelMm,sheetTransform);
   const op={id:actionId,kind:'line',coordinateSpace:'sheet-px',
    geometry:{from,to}};
   intents.push({schema:CONSTRUCTION_INTENT_VERSION,id,
    purpose:'draw-certified-single-convex-physical-crease-'+
      (line.status==='certified-hidden-open-source'?'hidden':'visible'),
    role:'result',dependsOn:[parent],inputEntityIds:[],
    outputEntityIds:[actionId],operations:[op],source:{...src}});
   lineStyleByIntentId[id]=line.officialEngineeringLineStyle;
   steps.push({id,dependsOn:[parent],
    title:'三维实体棱线 '+line.view+' 第 '+(i+1)+' 段',
    explanation:'原始三维棱线、精确参数区间和连续遮挡正向证明成立。',
    role:'result',actions:[verifiedTeachingActionToV5({
     id:actionId,kind:'line',coordinateSpace:'sheet-px',from,to,
     engineeringLineStyle:line.officialEngineeringLineStyle
    },sheetTransform)]});
   certifiedPhysicalLineBindings.push({
    actionId,revision:input.revision,sourceGeometryId:line.sourceGeometryId,
    sourceEdgeId:line.sourceEdgeId,view:line.view,
    originalParameterRange:[...line.originalParameterRange],
    real3DFrom:{...line.real3DFrom},real3DTo:{...line.real3DTo},
    fromModelMm:{...line.fromModelMm},toModelMm:{...line.toModelMm},
    fromSheetPx:{...from},toSheetPx:{...to},
    standardLineStyle:line.officialEngineeringLineStyle,
    exactOriginalSourceFullRayAndPhysicalCreaseVerified:true,
    signedFormalLineV5:true
   });
   parent=id;
  }
 }
 if(intents.length>300||steps.length>300)
  throw new RangeError('excessive unified C1 Intent DAG for original V5');
 // Expose the solved M3 missing view without promoting unsigned M5 creases.
 // The existing ConstructionIntent/DAG/sole V5 remains the only stroke signer.
 const missingView=sceneResult.missingView;
 if(!VIEWS.includes(missingView)||
    sceneResult.thirdView?.representation?.points==null)
  throw new RangeError('canonical M3 third-view geometry missing');
 const signedThirdView=certifiedVisibleContourLineBindings.filter(
  line=>line.view===missingView);
 const signedThirdViewFeatures=certifiedPhysicalLineBindings.filter(
  line=>line.view===missingView);
 const sourceLines=scopedEdgePreviews.filter(line=>
  line.view===missingView&&!line.projectionCollapsedToPoint&&
  line.renderedAsPhysicalSourceCandidate);
 const thirdViewDrawing=frozen({
  schema:'draftai-c1-m3-m5-third-view-drawing/1',
  view:missingView,revision:input.revision,
  geometryId:sceneResult.geometry.id,unit:'mm',
  points:Object.fromEntries(Object.entries(
   sceneResult.thirdView.representation.points).map(([id,p])=>
    [id,{u:p.u,v:p.v}])),
  // Sheet-space coordinates use the exact same first-angle transform as
  // canonical ConstructionIntent/V5; no second paper-coordinate engine.
  sheetPoints:Object.fromEntries(Object.entries(
   sceneResult.thirdView.representation.points).map(([id,p])=>
    [id,toSheet(missingView,p,sheetTransform)])),
  certifiedVisibleContour:signedThirdView.map(line=>({
   sourceEdgeId:line.sourceEdgeId,
   from:{...line.fromModelMm},to:{...line.toModelMm},
   fromSheetPx:toSheet(missingView,line.fromModelMm,sheetTransform),
   toSheetPx:toSheet(missingView,line.toModelMm,sheetTransform),
   standardLineStyle:line.standardLineStyle,v5ActionId:line.actionId
  })),
  certifiedPhysicalFeatures:signedThirdViewFeatures.map(line=>({
   sourceEdgeId:line.sourceEdgeId,
   originalParameterRange:[...line.originalParameterRange],
   fromSheetPx:{...line.fromSheetPx},toSheetPx:{...line.toSheetPx},
   standardLineStyle:line.standardLineStyle,v5ActionId:line.actionId
  })),
  unresolvedPhysicalEdges:sourceLines.map(line=>({
   sourceEdgeId:line.sourceEdgeId,
   from:{...line.fromModelMm},to:{...line.toModelMm},
   fromSheetPx:toSheet(missingView,line.fromModelMm,sheetTransform),
   toSheetPx:toSheet(missingView,line.toModelMm,sheetTransform),
   standardLineStyle:'undetermined',v5ActionId:null,
   // A source edge may be only partly certified. Never silently drop its
   // unresolved remainder on approximate or endpoint-only overlap.
   sourceMayContainCertifiedVisibleSubspans:signedThirdView.some(s=>
    s.sourceEdgeId===line.sourceEdgeId),
   // Preserve the actual whole-source continuous ray verdict for the
   // next M5 interval/junction signer. Neither verdict alone grants a
   // standard visible/hidden line or authorizes a V5 action.
   m5SourceRayEvidence:{
    status:line.rayEvidenceStatus,
    wholeSourceFrontRayClear:line.continuousFrontRayClearVerified,
    wholeSourceStrictlyOccluded:line.entireEdgeStrictlyOccludedVerified,
    physicalCrease:line.sourcePhysicalCreaseVerified,
    coplanarMeshSubdivision:line.sourceCoplanarSubdivisionVerified,
    endpointIds:[...line.sourceVertexIds]
   }
  })),
  // The original full-source M5 verdict is only a necessary precondition.
  // Explicitly enumerate which formal C1 proof obligations remain absent
  // per projected edge; the workbench must not infer a hidden/visible style
  // from an endpoint-only or whole-source ray verdict.
  pendingPhysicalEdgeProofs:sourceLines.map(line=>({
   sourceEdgeId:line.sourceEdgeId,view:missingView,
   sourceVertexIds:[...line.sourceVertexIds],
   sourcePhysicalCreaseVerified:line.sourcePhysicalCreaseVerified,
   continuousFrontRayClearVerified:line.continuousFrontRayClearVerified,
   wholeSourceStrictlyOccludedVerified:line.entireEdgeStrictlyOccludedVerified,
   missingObligations:[
    'exact-native-generated-TopoDS-to-original-source-history',
    'complete-original-source-parameter-interval-partition',
    'all-junctions-authenticated-original-3d-topology',
    'all-opaque-face-continuous-ray-depth-order',
    'official-engineering-visible-hidden-line-style',
    'original-ConstructionIntent-DAG-single-V5-stroke'
   ],
   officialV5StrokeAuthorized:false
  })),
  // Workbench may draw the certified contour as official strokes, while
  // unresolved physical edges remain an explicitly separate review overlay.
  // A partially certified source edge is never hidden by its certified span.
  drawingLayers:{
   officialV5StrokeActionIds:signedThirdView.map(line=>line.actionId),
   reviewOverlaySourceEdgeIds:sourceLines.map(line=>line.sourceEdgeId),
   reviewOverlayStyle:'undetermined',
   reviewOverlayIsOfficialDrawing:false
  },
  certifiedVisibleContourCount:signedThirdView.length,
  unresolvedPhysicalEdgeCount:sourceLines.length,
  hasUnresolvedPhysicalEdges:sourceLines.length>0,
  completeDrawingCertified:false,
  uncertifiedEdgesAreNotV5Actions:true
 });
 // Fail closed if the new third-view drawing payload drifts from the
 // canonical first-angle Scene or the SAME signed Intent/V5 action inventory.
 const drawing=thirdViewDrawing;
 if(Object.keys(drawing.points).length!==vertexIds.length||
    Object.keys(drawing.sheetPoints).length!==vertexIds.length||
    drawing.certifiedVisibleContourCount!==signedThirdView.length||
    drawing.certifiedPhysicalFeatures.length!==signedThirdViewFeatures.length||
    drawing.certifiedPhysicalFeatures.some(edge=>
      !steps.some(step=>step.actions.some(a=>a.id===edge.v5ActionId)))||
    drawing.unresolvedPhysicalEdgeCount!==sourceLines.length||
    drawing.drawingLayers.officialV5StrokeActionIds.length!==
     new Set(drawing.drawingLayers.officialV5StrokeActionIds).size||
    drawing.drawingLayers.officialV5StrokeActionIds.some(id=>
     !steps.some(step=>step.actions.some(action=>action.id===id)))||
    drawing.unresolvedPhysicalEdges.some(edge=>
     edge.standardLineStyle!=='undetermined'||edge.v5ActionId!==null))
  throw new RangeError('C1 third-view result diverged from canonical M3/M5/V5');
 for(const id of vertexIds){
  const expected=sceneResult.projections[missingView].points[id];
  const paper=toSheet(missingView,expected,sheetTransform);
  if(!expected||Math.hypot(drawing.points[id].u-expected.u,
     drawing.points[id].v-expected.v)>1e-8||
     Math.hypot(drawing.sheetPoints[id].x-paper.x,
      drawing.sheetPoints[id].y-paper.y)>1e-8)
   throw new RangeError('C1 third-view paper point differs from M3');
 }
 const threeViewSvgSheet=renderC1ThreeViewSvg({
  schema:'draftai-c1-reviewed-solid-vertex-v5/1',revision:input.revision,
  wholeSolidV5Ready:false,singleOriginalV5Player:true,
  sceneResult,thirdViewDrawing,certifiedVisibleContourLineBindings,
  certifiedPhysicalLineBindings,scopedEdgePreviews
 },{sheetTransform});
 const timeline=Timeline.compileTimeline(steps);
 assertM3ToV5Consistency({
  revision:input.revision,intents,steps,timing:timeline,sheet:sheetTransform,
  styleByIntentId:lineStyleByIntentId
 });
 const player=Timeline.createPlayer(timeline,{revision:input.revision});
 return frozen({
  schema:'draftai-c1-reviewed-solid-vertex-v5/1',
  revision:input.revision,status:'canonical-vertex-construction-ready',
  sceneResult,thirdViewDrawing,threeViewSvgSheet,
  thirdViewSvgPreview:renderC1ThirdViewSvg(thirdViewDrawing),
  wholeSourceEdgeRayEvidence,convexContourSourceCoverage,
  contourPhysicalJunctionIncidence,continuousFrontmostSourceRays,
  globalVisibleContourProof,physicalEdgeProof,scopedEdgePreviews,
  certifiedPhysicalLineBindings,
  certifiedPhysicalLineActionCount:certifiedPhysicalLineBindings.length,
  scopedPhysicalEdgeV5Ready:certifiedPhysicalLineBindings.length>0,
  scopedAllReviewedConvexPhysicalEdgesCertified:
   physicalEdgeProof?.allDrawablePhysicalEdgeStylesCertified===true,
  certifiedVisibleContourLineActionIds,
  certifiedVisibleContourLineBindings,
  certifiedVisibleContourLineActionCount:
   certifiedVisibleContourLineActionIds.length,
  scopedClosedConvexVisibleContourV5Ready:
   certifiedVisibleContourLineActionIds.length>0,
  verifiedLineIntentAndOriginalSingleV5Parity:
   certifiedVisibleContourLineActionIds.length>0,
  vertexBindings:bindings,intents,steps,timeline,player,
  vertexConstructionCount:bindings.length,pointActionCount,
  singleOriginalV5Player:true,certifiedPointConstructionReady:true,
  geometryVerifiedWithinReviewedConvexScope:true,
  officialSolidLineStylesVerified:false,solidBoundaryDAGVerified:false,
  wholeSolidV5Ready:false,completeDrawingExportAllowed:false,
  realTextbookOriginalAccepted:false
 });
}
module.exports={compileReviewedSolidVertexV5};
