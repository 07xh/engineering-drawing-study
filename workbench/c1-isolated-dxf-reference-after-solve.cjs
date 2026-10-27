'use strict';
/**
 * C1 independent-answer verification boundary AFTER the real reviewed
 * M3/M0/M5 source proof and sole V5 have already been completed.
 *
 * The original reference DXF may be opened at this point only. Its handles
 * cannot influence vertex matching, convex hull construction, M5 signed
 * line evidence, DAG steps or the existing V5 player.
 *
 * A reference text packet and matching hash fields are NOT enough to
 * independently authenticate an original DWG/DXF, prove point-cloud
 * completeness, or claim a full textbook blind test. The converter, review
 * and answer-isolation obligations remain explicitly separate.
 */
const {auditC1IndependentReferenceLineParity}=
 require('./c1-independent-reference-line-parity.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const HEX=/^[0-9a-f]{64}$/;
function compareIsolatedC1DxfReferenceAfterSolve({
 reviewedSourceResult,isolatedReference
}={}){
 const src=reviewedSourceResult,ref=isolatedReference;
 if(src?.schema!=='draftai-c1-DXF-reviewed-to-original-sole-v5/1'||
    src.reviewedInputWasExplicitlySourceConfirmed!==true||
    src.referenceAnswerWasNeverAConsumerInput!==true||
    src.wholeOriginalTextbookAnswerBlindVerified!==false||
    src.originalTextbookC1DeliveryComplete!==false||
    src.sourceDrawingCompletenessIndependentlyAuthenticated!==false||
    !HEX.test(src.sourceSha256)||!HEX.test(src.convertedDxfSha256)||
    !src.solution?.singleOriginalV5Player||
    !src.solution?.player?.canRender(src.revision)||
    src.solution.revision!==src.revision)
  throw new TypeError('current independently reviewed C1 M3/M5/V5 source proof must already exist');
 if(ref?.schema!=='draftai-c1-isolated-dxf-answer-strokes/1'||
    ref.sourceSha256!==src.sourceSha256||
    ref.convertedDxfSha256!==src.convertedDxfSha256||
    ref.engineeringStylesExplicitlyReviewed!==true||
    ref.wasUsedAsM3Input!==false||
    ref.actualIndependentModelSolverRun!==false||
    ref.textbookBlindSolveAccepted!==false||
    ref.view!==src.solution.sceneResult?.missingView||
    !Array.isArray(ref.referenceStrokes)||
    !ref.referenceStrokes.length||ref.referenceStrokes.length>512)
  throw new RangeError('post-solve reference source identity or two-stage answer isolation invalid');
 const seen=new Set(),styles=new Set([
  'gb-t-4457.4-continuous-wide-visible-outline',
  'gb-t-4457.4-thin-dashed-hidden-edge'
 ]);
 const answerLines=ref.referenceStrokes.map(row=>{
  if(!row||typeof row!=='object'||Array.isArray(row)||
     Object.keys(row).sort().join('|')!==
       ['from','to','standardLineStyle','originalReferenceHandle'].sort().join('|')||
     typeof row.originalReferenceHandle!=='string'||
     !/^[A-Za-z0-9]+$/.test(row.originalReferenceHandle)||
     seen.has(row.originalReferenceHandle)||
     !styles.has(row.standardLineStyle))
   throw new TypeError('isolated actual reference CAD LINE handle and style required');
  seen.add(row.originalReferenceHandle);
  // Strip DXF entity identifiers before the mathematical residual
  // comparator: only paper geometry/styles may cross the answer boundary.
  return {from:{...row.from},to:{...row.to},
   standardLineStyle:row.standardLineStyle};
 });
 const parity=auditC1IndependentReferenceLineParity({
  solved:src.solution,referenceStrokes:answerLines,view:ref.view
 });
 if(parity.revision!==src.revision||
    parity.sourceGeometryId!==src.solution.sceneResult.geometry.id||
    parity.referenceWasNotUsedToSolveGeometry!==true||
    parity.realTextbookBlindTestPassed!==false)
  throw new RangeError('independent answer residual provenance changed');
 return freeze({
  schema:'draftai-c1-isolated-reference-post-solve-acceptance/1',
  revision:src.revision,sourceSha256:src.sourceSha256,
  convertedDxfSha256:src.convertedDxfSha256,
  originalReferenceView:ref.view,
  originalReferenceHandleCount:seen.size,
  status:'post-solve-isolated-reference-geometry-parity-audited',
  parity,
  originalGivenGeometryWasSolvedBeforePrivateReferenceAccess:true,
  privateAnswerHandlesNeverEnteredM3M5OrV5:true,
  exactlyStyledBidirectionalReferenceCoverage:
   parity.everyReferenceLineCoveredBySignedV5Line&&
   parity.everySignedV5LineCoveredByReferenceLine,
  sourceOriginalDWGByteAuthenticationPerformedInThisFunction:false,
  currentFullOriginalGivenGeometryCompletenessIndependentlyEstablished:false,
  realTextbookBlindTestPassed:false,
  completeC1DeliveryAuthorized:false
 });
}
module.exports={compareIsolatedC1DxfReferenceAfterSolve};
