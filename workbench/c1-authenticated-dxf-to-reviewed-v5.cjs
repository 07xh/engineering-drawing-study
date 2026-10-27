'use strict';
/**
 * C1 trusted conversion result -> human REVIEW -> canonical M3/M5/V5.
 *
 * The ONLY possible geometry input is the independent GIVEN packet from the
 * authenticated source conversion. There is deliberately no reference answer
 * argument or facility to inspect the private answer packet.
 *
 * JSON hashes are provenance CLAIMS until checked against source bytes in the
 * converter; they are never substituted for mathematical/visual human review.
 * Unique vertex matching and polygon topology reuse current M3 + Three
 * QuickHull + M0. Actual strokes reuse the single original
 * ConstructionIntent -> ConstructionStep DAG -> V5 compiler.
 */
const {inferC1UniqueConvexGeometryCandidate}=
 require('./c1-unique-two-view-convex-candidate.cjs');
const {compileReviewedSolidVertexV5}=
 require('./reviewed-solid-vertex-v5.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
const SHA=/^[0-9a-f]{64}$/;
const PAIR=new Set(['HV','HW','VW']);
function validateGivenPacket(packet){
 if(!packet||typeof packet!=='object'||Array.isArray(packet)||
    packet.schema!=='draftai-c1-authenticated-dxf-reviewed-given/1'||
    !SHA.test(packet.sourceSha256)||!SHA.test(packet.convertedDxfSha256)||
    packet.referenceWasNotExportedAsSolverInput!==true||
    packet.sourceIsNotYetConfirmedForProduction!==true||
    packet.originalSourceCompletenessIndependentlyProved!==false||
    packet.sourceImageRecognitionVerified!==false||
    packet.textbookBlindSolveAccepted!==false||
    packet.assumedScope!=='all-extreme-vertices-of-one-closed-convex-opaque-solid')
  throw new TypeError('only unsigned current original DXF given source packet is accepted');
 const expected=[
  'schema','sourceSha256','convertedDxfSha256','views',
  'givenOriginalHandleEndpoints','missingView','assumedScope',
  'humanSelectedFullExtremeVertexSet',
  'originalSourceCompletenessIndependentlyProved',
  'sourceImageRecognitionVerified','referenceWasNotExportedAsSolverInput',
  'sourceIsNotYetConfirmedForProduction','textbookBlindSolveAccepted'
 ];
 if(Object.keys(packet).sort().join('|')!==
      [...expected,...(packet.reviewedCorrespondences===undefined?[]:
       ['reviewedCorrespondences'])].sort().join('|')||
    packet.humanSelectedFullExtremeVertexSet!==true)
  throw new RangeError('unverified or possibly answer-bearing DXF source packet fields');
 const views=packet.views,handles=packet.givenOriginalHandleEndpoints;
 if(!views||typeof views!=='object'||Array.isArray(views)||
    !handles||typeof handles!=='object'||Array.isArray(handles))
  throw new TypeError('current isolated DXF given first-angle point clouds required');
 const pair=Object.keys(views).sort().join('');
 if(!PAIR.has(pair)||Object.keys(handles).sort().join('')!==pair||
    packet.missingView!==['V','H','W'].find(v=>!Object.hasOwn(views,v)))
  throw new RangeError('two known first-angle projections, not an answer view, required');
 for(const view of Object.keys(views)){
  const pts=views[view],sources=handles[view];
  if(!Array.isArray(pts)||!Array.isArray(sources)||pts.length!==sources.length||
     pts.length<4||pts.length>64)
   throw new RangeError('original DXF vertex provenance and current M3 points differ');
  const known=new Set();
  for(let i=0;i<pts.length;i++){
   const p=pts[i],src=sources[i];
   if(!p||typeof p!=='object'||Array.isArray(p)||
      Object.keys(p).sort().join(',')!=='u,v'||
      !['u','v'].every(k=>Number.isFinite(p[k])&&Math.abs(p[k])<=100000)||
      !src||typeof src!=='object'||Array.isArray(src)||
      Object.keys(src).sort().join(',')!=='endpoint,handle'||
      !/^[0-9A-Za-z]+$/.test(src.handle)||
      !['start','end','point'].includes(src.endpoint))
    throw new TypeError('unrecognized original 2D DXF point or handle provenance');
   const unique=src.handle+'|'+src.endpoint;
   if(known.has(unique))
    throw new RangeError('duplicate original CAD endpoint cannot invent two vertices');
   known.add(unique);
  }
 }
 if(packet.reviewedCorrespondences!==undefined){
  const links=packet.reviewedCorrespondences,
   [first,second]=pair.split(''),countA=views[first].length,
   countB=views[second].length;
  if(!Array.isArray(links)||links.length<4||links.length>32)
   throw new RangeError('bounded explicitly reviewed 3D-to-2D source index pairs required');
  const visitedA=new Set(),visitedB=new Set(),keys=new Set();
  for(const row of links){
   if(!row||typeof row!=='object'||Array.isArray(row)||
      Object.keys(row).sort().join(',')!=='firstIndex,secondIndex'||
      !Number.isSafeInteger(row.firstIndex)||
      !Number.isSafeInteger(row.secondIndex)||
      row.firstIndex<0||row.firstIndex>=countA||
      row.secondIndex<0||row.secondIndex>=countB)
    throw new RangeError('reviewed source correspondence must refer to actual two-view point indices');
   const id=row.firstIndex+'|'+row.secondIndex;
   if(keys.has(id))
    throw new RangeError('duplicate reviewed source 3D corner pair');
   keys.add(id);visitedA.add(row.firstIndex);visitedB.add(row.secondIndex);
  }
  if(visitedA.size!==countA||visitedB.size!==countB)
   throw new RangeError('all actual original 2D CAD source vertices require reviewed correspondence');
 }
 return true;
}
async function reconstructC1FromDxfGiven({givenPacket,revision=1,
 geometryId='C1ReviewedDXFCandidate'}={}){
 validateGivenPacket(givenPacket);
 const inferred=await inferC1UniqueConvexGeometryCandidate({
  views:givenPacket.views,revision,geometryId,
  assumedScope:givenPacket.assumedScope,
  reviewedCorrespondences:givenPacket.reviewedCorrespondences??null
 });
 const reviewedPairs=givenPacket.reviewedCorrespondences;
 const expected3DCount=reviewedPairs?.length??
  givenPacket.views[Object.keys(givenPacket.views)[0]].length;
 if(inferred.inferredOriginal3DPointCount!==expected3DCount||
    inferred.source2DVerticesMatchedWithoutManualIds!==
      (reviewedPairs===undefined)||
    inferred.explicitlyReviewedManyToOnePaperProjectionPairs!==
      (reviewedPairs!==undefined)||
    inferred.independentlyValidatedByCurrentM0!==true||
    inferred.signedV5ActionCount!==0)
  throw new RangeError('current unlabeled M3/QuickHull M0 reconstruction incomplete');
 return frozen({
  schema:'draftai-c1-reviewed-DXF-original-candidate/1',
  revision,geometryId,knownViewPair:inferred.knownViewPair,
  provenance:{sourceSha256:givenPacket.sourceSha256,
   convertedDxfSha256:givenPacket.convertedDxfSha256,
   originalGivenHandles:givenPacket.givenOriginalHandleEndpoints},
  inferred,
  humanReviewed:false,sourceConvexCompletenessIndependentlyProved:false,
  officialV5ActionCount:0,realTextbookBlindTestPassed:false
 });
}
async function compileReviewedC1DxfGivenToSoleV5({
 givenPacket,revision=1,geometryId='C1ReviewedDXFCandidate',
 confirmedReview,sheetTransform
}={}){
 validateGivenPacket(givenPacket);
 if(!confirmedReview||typeof confirmedReview!=='object'||
    confirmedReview.sourceSha256!==givenPacket.sourceSha256||
    confirmedReview.convertedDxfSha256!==givenPacket.convertedDxfSha256||
    confirmedReview.confirmedCurrentRevision!==revision||
    confirmedReview.confirmedGeometryId!==geometryId||
    confirmedReview.originalGivenPointSetsChecked!==true||
    confirmedReview.allOriginalExtremeVerticesPresentChecked!==true||
    confirmedReview.closedConvexFaceAndEdgeTopologyReviewed!==true||
    confirmedReview.referenceAnswerWasNotUsedToConfirmTopology!==true||
    confirmedReview.explicitReviewedInputKind!=='human-reviewed-original-candidate')
  throw new TypeError('actual source-specific human confirmed C1 geometry review required');
 const {inferred}=await reconstructC1FromDxfGiven({
  givenPacket,revision,geometryId});
 const input={...inferred.reviewedSolidInputCandidate,
  confirmedBy:'user',topologyConfirmed:true};
 // This is the ONLY already-existing C1 M3/M5/ConstructionIntent/DAG/V5.
 // No answer packet or caller-supplied V5 actions enter this call.
 const solved=compileReviewedSolidVertexV5({input,sheetTransform});
 if(solved.sceneResult?.geometry?.id!==geometryId||
    solved.revision!==revision||
    solved.singleOriginalV5Player!==true||
    solved.m0M3M5PhysicalSourceAcceptance?.status!==
      'bounded-original-source-math-acceptance')
  throw new RangeError('original M0/M3/M5 source and sole V5 proven path unavailable');
 return frozen({
  schema:'draftai-c1-DXF-reviewed-to-original-sole-v5/1',
  revision,sourceSha256:givenPacket.sourceSha256,
  convertedDxfSha256:givenPacket.convertedDxfSha256,
  reviewedInputWasExplicitlySourceConfirmed:true,
  originalGivenPointSetMatchingVerified:true,
  referenceAnswerWasNeverAConsumerInput:true,
  solution:solved,
  wholeOriginalTextbookAnswerBlindVerified:false,
  sourceDrawingCompletenessIndependentlyAuthenticated:false,
  originalTextbookC1DeliveryComplete:false
 });
}
module.exports={validateGivenPacket,reconstructC1FromDxfGiven,
 compileReviewedC1DxfGivenToSoleV5};
