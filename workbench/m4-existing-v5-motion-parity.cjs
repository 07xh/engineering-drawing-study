'use strict';
/**
 * M4 -> existing 07/V5 Motion geometry-parity AUDITOR.
 *
 * Converts current reviewed M4 SOURCE subspans through the ONE signed
 * first-angle V/H/W model-mm -> sheet-px projector and the EXISTING V5
 * Motion.actionShapeAttrs, checking the action at t=0, 1/2, 1 and reverse
 * pixel -> model projection. This creates NO timeline, player, DAG or
 * independently solved geometry, and NEVER upgrades a line style.
 *
 * A source subspan with positive/hidden OPEN math evidence is still drawn
 * only as 'undetermined' until endpoints, scene and canonical spatial
 * ConstructionIntent/DAG are verified by later separate gates.
 */
const {VIEWS,project,toSheet,fromSheet}=
 require('../core/projection/conventions.js');
const Motion=require('./teaching-motion-v5.js');
const {partitionReviewedSourceEdges}=
 require('./scoped-projected-stroke-partition.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const y of Object.values(x))freeze(y);
  Object.freeze(x);
 }return x;
};
const fail=x=>{throw new TypeError('M4 to existing V5 motion parity: '+x);};
const diff=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const empty=(revision,why)=>freeze({
 schema:'draftai-m4-existing-v5-motion-parity/1',revision,
 status:'not-covered',reason:why,sourceSubspanCount:0,
 candidates:[],paperGeometryParityVerified:false,
 canonicalSpatialIntentVerified:false,constructionStepDAGVerified:false,
 fullContourLineStylesVerified:false,sourceEndpointJoinsVerified:false,
 v5Ready:false,createsSecondPlayer:false
});
function auditReviewedM4V5Motion({
 geometry,sceneDepthEvidence,revision,viewTransforms
}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('current source revision required');
 if(!Array.isArray(geometry)||!geometry.length||geometry.length>12||
    !sceneDepthEvidence||
    sceneDepthEvidence.revision!==revision||
    sceneDepthEvidence.status!=='scoped-face-probes-only'||
    sceneDepthEvidence.projectedStrokePartitions?.status!==
      'preview-partition-evidence-only')
  return empty(revision,'not-eligible-for-scoped-paper-parity');
 if(!viewTransforms||typeof viewTransforms!=='object'||
    Array.isArray(viewTransforms)||
    Object.keys(viewTransforms).sort().join(',')!=='H,V,W')
  fail('explicit first-angle V/H/W sheet transforms required');
 for(const view of VIEWS){
  const t=viewTransforms[view];
  if(!t||!t.origin||![t.origin.x,t.origin.y,t.scale].every(finite)||
     t.scale<1e-4||t.scale>1e5||
     Math.abs(t.origin.x)>1e8||Math.abs(t.origin.y)>1e8)
   fail('finite bounded mm->pixel first-angle transform required');
 }
 // Re-evaluate M4 source/observer and crossing proofs before even
 // constructing PRESENTATION candidates. Stale edits cannot carry V5 IDs.
 const proof=partitionReviewedSourceEdges({
  geometry,sceneDepthEvidence,revision});
 if(JSON.stringify(proof)!==
    JSON.stringify(sceneDepthEvidence.projectedStrokePartitions))
  fail('source, source revision, or M4 partition parity changed');
 if(proof.segments.length>3000)fail('bounded source stroke candidate count');
 const candidates=[];
 for(const [i,span] of proof.segments.entries()){
  const view=span.view,transform=viewTransforms[view];
  if(!VIEWS.includes(view)||!transform)
   fail('source span has unsupported view');
  const pa=project(span.fromModelMm)[view],
   pb=project(span.toModelMm)[view];
  if(JSON.stringify(pa)!==JSON.stringify(span.projectedFromModelMm)||
     JSON.stringify(pb)!==JSON.stringify(span.projectedToModelMm))
   fail('source model endpoints do not match independently projected geometry');
  const a=toSheet(view,pa,transform),
   b=toSheet(view,pb,transform);
  if(![a.x,a.y,b.x,b.y].every(finite)||diff(a,b)<=1e-8)
   fail('projected paper stroke is collapsed or under-resolved');
  const ra=fromSheet(view,a,transform),
   rb=fromSheet(view,b,transform);
  if(Math.hypot(ra.u-pa.u,ra.v-pa.v)>1e-7||
     Math.hypot(rb.u-pb.u,rb.v-pb.v)>1e-7)
   fail('V/H/W pixel-to-mm reverse projection mismatch');
  const action={id:'M4SourcePart_'+(i+1)+'_'+view,
   kind:'line',geometry:{from:a,to:b}};
  const start=Motion.actionShapeAttrs(action,0),
   middle=Motion.actionShapeAttrs(action,0.5),
   end=Motion.actionShapeAttrs(action,1);
  if(diff({x:start.x1,y:start.y1},a)>1e-8||
     diff({x:start.x2,y:start.y2},a)>1e-8||
     diff({x:middle.x2,y:middle.y2},{
      x:(a.x+b.x)/2,y:(a.y+b.y)/2})>1e-8||
     diff({x:end.x2,y:end.y2},b)>1e-8)
   fail('existing ONE V5 Motion line progress disagrees with reviewed geometry');
  candidates.push({
   sourceGeometryId:span.sourceGeometryId,
   sourceEdgeId:span.sourceEdgeId,view,
   sourceParameterRange:[...span.sourceParameterRange],
   currentSourceRevision:revision,
   scopedOpenInteriorVisibility:span.openInteriorVisibility,
   sourceEndpointJoins:span.sourceEndpointJoins,
   v5MotionAction:action,
   paperGeometryParityVerified:true,
   existingV5MotionUsed:true,
   sourceEndpointVisibilityVerified:false,
   // Explicitly fail closed: proof of OPEN ray intervals does not
   // authorize line-style paint, full-stroke or final V5 output.
   wholeDrawnStrokeVisibility:'undetermined',
   officialLineStyleVerified:false,canonicalIntentVerified:false,
   constructionStepDAGVerified:false,v5ActionApproved:false
  });
 }
 return freeze({
  schema:'draftai-m4-existing-v5-motion-parity/1',revision,
  status:'existing-motion-presentation-geometry-only',
  reason:null,sourceSubspanCount:candidates.length,
  candidates,paperGeometryParityVerified:true,
  canonicalSpatialIntentVerified:false,constructionStepDAGVerified:false,
  fullContourLineStylesVerified:false,sourceEndpointJoinsVerified:false,
  v5Ready:false,createsSecondPlayer:false
 });
}
module.exports={auditReviewedM4V5Motion};
