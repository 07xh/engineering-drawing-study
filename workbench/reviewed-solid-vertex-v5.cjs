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
const {auditReviewedSolidWholeSourceEdges}=
 require('./m5-reviewed-solid-source-edge-ledger.cjs');
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {assertM3ToV5Consistency}=
 require('./m3-v5-consistency-gate.cjs');
const Timeline=require('./teaching-timeline-v5.js');
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
 const wholeSourceEdgeRayEvidence=auditReviewedSolidWholeSourceEdges({
  geometry:sceneResult.geometry,revision:input.revision});
 if(wholeSourceEdgeRayEvidence.signedEdgeV5Ready!==false||
    wholeSourceEdgeRayEvidence.officialLineStylesVerified!==false)
  throw new RangeError('M5 source ray audit may not mint official solid edge actions');
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
 if(intents.length>300||steps.length>300)
  throw new RangeError('excessive point DAG for original V5');
 const timeline=Timeline.compileTimeline(steps);
 assertM3ToV5Consistency({
  revision:input.revision,intents,steps,timing:timeline,sheet:sheetTransform
 });
 const player=Timeline.createPlayer(timeline,{revision:input.revision});
 return frozen({
  schema:'draftai-c1-reviewed-solid-vertex-v5/1',
  revision:input.revision,status:'canonical-vertex-construction-ready',
  sceneResult,wholeSourceEdgeRayEvidence,
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
