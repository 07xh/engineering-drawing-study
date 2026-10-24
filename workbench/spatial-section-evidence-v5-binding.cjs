'use strict';
/**
 * M4/M5 read-only provenance binding: independently audited M3 polygon
 * Geometry -> existing ConstructionStep DAG -> ONE V5 action identity.
 *
 * This does NOT mint canonical 2D ConstructionIntent v1, a new player or
 * a certificate for a complete visible/hidden line. Even when one OPEN
 * 3D edge interior has a scoped ray label, its projected, CLOSED V5
 * segment contains two unproven endpoints: its display style stays
 * "undetermined". Later specialists can reuse this exact edge/action
 * identity mapping after endpoint, occlusion and standard-line proofs.
 */
const Timeline=require('./teaching-timeline-v5.js');
const {VIEWS}=require('../core/projection/conventions.js');
const copy=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  for(const child of Object.values(value))freeze(child);
  Object.freeze(value);
 }
 return value;
};
function fail(reason){
 throw new TypeError('spatial construction evidence binding: '+reason);
}
const states=new Set(['visible','hidden','undetermined']);
function bindScopedSectionEvidenceToV5({preview,visibilityEvidence,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('current nonnegative source revision required');
 if(!preview||preview.status!=='preview-only'||
    preview.revision!==revision||
    preview.visibilityVerified!==false||
    preview.fullSpatialConstructionIntentVerified!==false||
    preview.completeEngineeringDrawingVerified!==false||
    preview.canPromoteToVerifiedResult!==false||
    !Array.isArray(preview.steps)||!preview.steps.length||
    !preview.timing||typeof preview.geometryId!=='string'||
    !preview.geometryId)
  fail('trusted preview-only ConstructionStep/V5 boundary required');
 if(!visibilityEvidence||visibilityEvidence.schema!=='draftai-section-open-edge-visibility/1'||
    visibilityEvidence.revision!==revision||
    visibilityEvidence.geometryId!==preview.geometryId||
    visibilityEvidence.sourceKind!==preview.sourceKind||
    !['unreviewed','open-edge-ray-only','unsupported-proof'].includes(visibilityEvidence.status)||
    visibilityEvidence.endpointVisibilityVerified!==false||
    visibilityEvidence.completeOcclusionVerified!==false||
    visibilityEvidence.standardViewMappingVerified!==false||
    visibilityEvidence.fullLineStylesReady!==false||
    visibilityEvidence.wholeDrawingVerified!==false)
  fail('source/revision/limited visibility proof mismatch');
 if(visibilityEvidence.openEdgeEvidenceAvailable!==
    (visibilityEvidence.status==='open-edge-ray-only')||
    visibilityEvidence.reviewBound===(visibilityEvidence.status==='unreviewed'))
  fail('inconsistent specialist review/proof status');
 if(JSON.stringify(Timeline.compileTimeline(preview.steps))!==
    JSON.stringify(preview.timing))
  fail('ConstructionStep DAG disagrees with the single V5 timeline');
 const data=visibilityEvidence.perView;
 if(!data||typeof data!=='object'||Array.isArray(data)||
    Object.keys(data).sort().join(',')!=='H,V,W')
  fail('exactly three first-angle proof views required');
 const n=data.V?.length;
 if(!Number.isInteger(n)||n<3||n>6||
    !VIEWS.every(v=>Array.isArray(data[v])&&data[v].length===n))
  fail('bounded matched polygon section edges required');
 const stepIds=new Set(),actions=new Map(),byEdge=new Map();
 for(const step of preview.steps){
  if(!step||typeof step.id!=='string'||stepIds.has(step.id)||
     !['guide','result'].includes(step.role)||
     !Array.isArray(step.dependsOn)||
     step.dependsOn.some(id=>!stepIds.has(id))||
     !Array.isArray(step.actions))
   fail('duplicate/forward ConstructionStep or unsupported role');
  stepIds.add(step.id);
  for(const a of step.actions){
   if(!a||typeof a.id!=='string'||actions.has(a.id))
    fail('duplicate/nonexistent V5 action identity');
   actions.set(a.id,{step,action:a});
   if(step.role!=='result')continue;
   if(a.visibility!=='undetermined'||!['line','point'].includes(a.kind))
    fail('unproven full-stroke line style or invalid result action');
   const view=a.id.match(/-(V|H|W)$/)?.[1];
   const edgeId=a.sourceSectionEdgeId;
   if(!view||typeof edgeId!=='string'||
      !/^section-edge-[1-9][0-9]*$/.test(edgeId))
    fail('unbound projected source edge identity');
   const key=edgeId+':'+view;
   if(byEdge.has(key))fail('duplicate projected source edge');
   byEdge.set(key,{step,action:a,view,edgeId});
  }
 }
 if(byEdge.size!==n*VIEWS.length)
  fail('missing V/H/W ConstructionStep result actions');
 const counts={visible:0,hidden:0,undetermined:0},links=[];
 const seenActions=new Set();
 for(let i=0;i<n;i++){
  const edgeId='section-edge-'+(i+1);
  for(const view of VIEWS){
   const e=data[view][i],target=byEdge.get(edgeId+':'+view);
   if(!target||!e||e.index!==i||e.view!==view||
      e.sourceEdgeId!==edgeId||
      e.sourceGeometryId!==preview.geometryId||
      !states.has(e.visibility)||
      e.endpointsVerified!==false||e.standardLineStyleVerified!==false||
      (e.visibility==='undetermined'&&e.proofScope!=='none')||
      (e.visibility!=='undetermined'&&
       (visibilityEvidence.openEdgeEvidenceAvailable!==true||
        e.proofScope!=='single-convex-solid-open-edge-ray')))
    fail('ray evidence cannot be associated with this V5 section action');
   const {step,action}=target;
   if(seenActions.has(action.id))
    fail('one V5 action cannot receive two source edges');
   seenActions.add(action.id);
   if(action.kind==='point'&&action.geometry?.center===undefined)
    fail('collapsed point lacks renderable geometry');
   if(action.kind==='line'&&
      (!action.geometry?.from||!action.geometry?.to))
    fail('result stroke lacks geometric endpoints');
   counts[e.visibility]++;
   links.push({
    sourceGeometryId:preview.geometryId,sourceEdgeId:edgeId,
    view,stepId:step.id,v5ActionId:action.id,
    // For collapsed projections, one 3D open interval becomes ONE point:
    // it cannot inherit a continuous projected stroke verdict.
    openInteriorVisibility:action.kind==='point'?'undetermined':e.visibility,
    sourceOpenInteriorVisibility:e.visibility,
    sourceProofScope:e.proofScope,
    projectedPrimitiveKind:action.kind,
    projectedFullStrokeVisibility:'undetermined',
    endpointsVisibilityVerified:false,
    fullOcclusionVerified:false,officialHiddenLineStyleVerified:false,
    canonicalConstructionIntentVerified:false
   });
  }
 }
 if(!visibilityEvidence.counts||!states.size||
    [...states].some(x=>visibilityEvidence.counts[x]!==counts[x]))
  fail('source visibility proof counts mismatch');
 return freeze({
  schema:'draftai-spatial-v5-evidence-bindings/1',status:'preview-evidence-only',
  revision,sourceKind:preview.sourceKind,
  geometryId:preview.geometryId,
  evidenceStatus:visibilityEvidence.status,
  projection:'first-angle-orthographic',
  bindingCount:links.length,bindings:links,sourceCounts:counts,
  // Every link points to an EXISTING ConstructionStep/V5 action, with no
  // action rewrite, timeline mutation, or unapproved proof promotion.
  mutatesExistingTimeline:false,fullConstructionIntentReady:false,
  endpointsVisibilityVerified:false,completeOcclusionVerified:false,
  officialLineStylesVerified:false,v5VerifiedExportReady:false
 });
}
module.exports={bindScopedSectionEvidenceToV5};
