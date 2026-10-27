'use strict';
/**
 * FULL SCOPED C1 DELIVERY GATE for a user-confirmed CLOSED CONVEX solid.
 *
 * No second solver/player and no trust in caller-supplied proof flags:
 * ALWAYS re-run existing actual C1 M0/M3/M4/M5 -> sole V5 compiler here.
 *
 * An answer can be declared complete in this SPECIFIC one-convex geometry
 * scope only if EVERY original positive 3D physical edge projection is
 * accounted for, with no missing parameter interval, by exactly one of:
 * - an original M5 signed formal visible/hidden edge V5 action;
 * - an original fully signed V/H/W exterior hull action;
 * - a rigorously frontmost-other-original-source suppressing a hidden
 *   duplicated projection (confirmed by the same M5 proof ledger).
 *
 * Positive binary64 gaps are fatal, no tolerance bridge and no guessing.
 * This does not certify OCR, nonconvex, multi-body, C3, native HLR or an
 * independent textbook blind answer comparison.
 */
const {compileReviewedSolidVertexV5}=
 require('./reviewed-solid-vertex-v5.cjs');
const {VIEWS}=require('../core/projection/conventions.js');
const {renderC1ThirdViewSvg}=
 require('./c1-third-view-svg-preview.cjs');
const {certifyWholeProjectedExteriorCoverage}=
 require('./m5-c1-reviewed-convex-physical-edge-strokes.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function compileScopedFullyProvenConvexC1({input,sheetTransform}={}){
 const solved=compileReviewedSolidVertexV5({input,sheetTransform});
 const proof=solved.physicalEdgeProof;
 if(!proof||proof.sourceGeometryId!==solved.sceneResult.geometry.id||
    proof.revision!==input.revision)
  throw new RangeError('source-fresh original convex M0/M5 line proof missing');
 const reasons=[],sourceCoverage=[];
 const contour=solved.globalVisibleContourProof,
  acceptance=solved.m0M3M5PhysicalSourceAcceptance;
 if(contour?.allThreeViewsGlobalContourCertified!==true)
  reasons.push('full-three-view-closed-visible-hull-not-certified');
 if(proof.allDrawablePhysicalEdgeStylesCertified!==true||
    proof.held.length!==0)
  reasons.push('remaining-original-physical-edge-intervals-not-certifiable');
 if(acceptance?.status!=='bounded-original-source-math-acceptance'||
    acceptance.mutuallyContradictoryIntervals!==0)
  reasons.push('original-M0-M3-M4-M5-source-not-mutually-verified');
 const bySource=new Map();
 const add=(view,id,range,status)=>{
  const key=view+'@'+id;
  if(!bySource.has(key))bySource.set(key,[]);
  if(!Array.isArray(range)||range.length!==2||
     !range.every(Number.isFinite)||!(range[0]>=0&&
       range[1]<=1&&range[0]<range[1]))
   throw new RangeError('certified source 3D parameter interval not bounded');
  bySource.get(key).push({range:[...range],status});
 };
 const actualIDs=new Set(
  solved.steps.flatMap(step=>step.actions).map(a=>a.id));
 const signatures=new Set();
 for(const binding of solved.certifiedPhysicalLineBindings){
  if(binding.signedFormalLineV5!==true||
     !actualIDs.has(binding.actionId)||signatures.has(binding.actionId)||
     binding.sourceGeometryId!==proof.sourceGeometryId||
     binding.revision!==input.revision)
   throw new RangeError('physical source interval lacks original signed V5 action');
  signatures.add(binding.actionId);
  add(binding.view,binding.sourceEdgeId,binding.originalParameterRange,
   'original-certified-formal-visible-hidden-V5');
 }
 const signedContourByView=new Map(VIEWS.map(view=>[view,[]]));
 for(const line of solved.certifiedVisibleContourLineBindings){
  if(line.signedFormalLineV5!==true||
     !actualIDs.has(line.actionId)||signatures.has(line.actionId)||
     line.revision!==input.revision)
   throw new RangeError('unsigned or duplicate visible exterior V5 action');
  signatures.add(line.actionId);
  if(!signedContourByView.has(line.view))
   throw new RangeError('unknown original first-angle signed contour view');
  signedContourByView.get(line.view).push({
   projectedFromModelMm:{...line.fromModelMm},
   projectedToModelMm:{...line.toModelMm},
   signedOfficialLineStyle:line.standardLineStyle,
   v5ActionAuthorized:true
  });
 }
 let masked=0,suppressed=0;
 for(const row of proof.ledger){
  if(row.status==='already-certified-exterior'){
   // The frontmost signed contour can originate in ANOTHER physical
   // original 3D edge with exactly the SAME paper support. Same source
   // identity is not necessary; independently recompute complete projected
   // [0,1] coverage from the ACTUAL existing signed V5 contour actions.
   if(!certifyWholeProjectedExteriorCoverage({
    fromModelMm:row.fromModelMm,toModelMm:row.toModelMm,
    certifiedContours:signedContourByView.get(row.view)||[]
   }))
    throw new RangeError('masked source interval lacks complete signed V5 exterior paper support');
   add(row.view,row.sourceEdgeId,row.originalParameterRange,
    'already-visible-global-hull');
   masked++;
  }else if(row.status==='source-hidden-behind-proven-front-original'){
   // Only an independently re-computed M5 full-original-source witness
   // may suppress a genuinely hidden projected duplicate.
   if(proof.allDrawablePhysicalEdgeStylesCertified!==true)
    reasons.push('unsigned-behind-front-source-duplicate');
   add(row.view,row.sourceEdgeId,row.originalParameterRange,
    'suppressed-behind-original-front-source');
   suppressed++;
  }
 }
 for(const line of solved.scopedEdgePreviews){
  if(line.projectionCollapsedToPoint||
     !line.renderedAsPhysicalSourceCandidate)
   continue;
  const list=(bySource.get(line.view+'@'+line.sourceEdgeId)||[])
   .slice().sort((a,b)=>a.range[0]-b.range[0]||
     a.range[1]-b.range[1]);
  let cursor=0,gapCount=0,duplicateCount=0;
  for(const item of list){
   if(item.range[0]>cursor)gapCount++;
   else if(item.range[0]<cursor)duplicateCount++;
   if(item.range[1]>cursor)cursor=item.range[1];
  }
  if(cursor!==1)gapCount++;
  sourceCoverage.push({
   view:line.view,sourceEdgeId:line.sourceEdgeId,
   exactOriginalParameterCoverage:[0,cursor],
   intervalCount:list.length,positiveGapCount:gapCount,
   overlappingCertifiedSourceCount:duplicateCount,
   completeAndNonOverlapping:gapCount===0&&duplicateCount===0
  });
 }
 if(sourceCoverage.length===0)
  reasons.push('no-original-physical-source-edges-audited');
 if(sourceCoverage.some(x=>!x.completeAndNonOverlapping))
  reasons.push('positive-original-3d-source-interval-gaps-or-double-signature');
 if(!solved.singleOriginalV5Player||
    !solved.player?.canRender(input.revision)||
    solved.timeline?.segments?.length!==
     solved.steps.reduce((n,step)=>n+step.actions.length,0))
  throw new RangeError('single genuine V5 replay source parity broken');
 if(solved.sceneResult.missingView!==solved.thirdViewDrawing.view||
    signatures.size!==solved.certifiedVisibleContourLineBindings.length+
     solved.certifiedPhysicalLineBindings.length)
  throw new RangeError('C1 source signed action lineage drifted');
 const scopedReady=reasons.length===0;
 const preview=renderC1ThirdViewSvg(solved.thirdViewDrawing,{
  includeReviewOverlay:false
 });
 const output={
  schema:'draftai-c1-scoped-fully-proven-single-convex-delivery/1',
  revision:input.revision,
  sourceGeometryId:solved.sceneResult.geometry.id,
  missingView:solved.sceneResult.missingView,
  status:scopedReady?
   'all-original-single-convex-physical-edges-certified-in-original-V5':
   'incomplete-original-single-convex-physical-edge-coverage',
  scopedSingleConvexFullyCertified:scopedReady,
  allOriginalPositivePhysicalSourceRangesAccounted:
   sourceCoverage.every(x=>x.completeAndNonOverlapping),
  finalScope:'only-user-confirmed-single-convex-original-source-3d-geometry',
  signedV5ActionCount:signatures.size,
  originalV5TimelineStepCount:solved.steps.length,
  originalV5TimelineActionCount:solved.timeline.segments.length,
  originalV5ReusablePlayer:solved.player,
  originalV5Timeline:solved.timeline,
  firstAngleOfficialThirdViewSvg:scopedReady?preview:null,
  sourceCoverage,alreadyCertifiedHullIntervals:masked,
  suppressedFrontSourceDuplicates:suppressed,
  missingObligations:reasons,
  allThreeViewsGlobalContourCertified:
   contour.allThreeViewsGlobalContourCertified===true,
  fullGenericC1ImagesOrNonconvexVerified:false,
  realTextbookBlindTestPassed:false
 };
 // The original underlying C1 result has conservative false blanket flags;
 // this NEW positive mathematical gate never mutates or re-labels them.
 return freeze(output);
}
module.exports={compileScopedFullyProvenConvexC1};
