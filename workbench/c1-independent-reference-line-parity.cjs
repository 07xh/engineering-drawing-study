'use strict';
/**
 * C1 BLIND REFERENCE STROKE PARITY.
 *
 * Consume independently solved and M5-certified original C1 V5 strokes,
 * THEN compare with separately isolated textbook answer vectors. Never
 * accept a textbook reference as an M3 input or an M5 evidence source.
 *
 * Signed straight drawing stroke coverage is checked in BOTH directions:
 * each reference interval must be covered by current independently signed
 * result lines of the SAME engineering style, and each signed result line
 * must be covered by the reference. Partial overlap, 1-ULP positive gaps,
 * noncollinearity, incorrect hidden/visible style, or an extra line fail.
 *
 * This is geometric reference parity ONLY; original DWG authentication,
 * actual source/answer isolation and Android visual validation are
 * independent obligations and CANNOT be declared passed by this function.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {exactCandidateIntervalCoverage}=
 require('./c1-original-source-interval-coverage.cjs');
const frozen=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const y of Object.values(x))frozen(y);Object.freeze(x);
}return x;};
const STYLES=new Set([
 'gb-t-4457.4-continuous-wide-visible-outline',
 'gb-t-4457.4-thin-dashed-hidden-edge'
]);
const finite=Number.isFinite;
function point(p){
 return p&&typeof p==='object'&&!Array.isArray(p)&&
  Object.keys(p).sort().join(',')==='u,v'&&finite(p.u)&&finite(p.v)&&
  Math.abs(p.u)<=100000&&Math.abs(p.v)<=100000;
}
function normalizeStrokes(rows,label){
 if(!Array.isArray(rows)||rows.length>512)
  throw new TypeError('bounded '+label+' first-angle answer strokes required');
 return rows.map((s,i)=>{
  if(!s||!point(s.from)||!point(s.to)||!STYLES.has(s.standardLineStyle)||
     Math.hypot(s.from.u-s.to.u,s.from.v-s.to.v)<=1e-9)
   throw new TypeError('finite and officially styled '+label+' stroke '+i+' required');
  return {from:{...s.from},to:{...s.to},
   standardLineStyle:s.standardLineStyle};
 });
}
function exactSameStylePaperCoverage(source,lines){
 const a=source.from,b=source.to,
  dx=b.u-a.u,dy=b.v-a.v,len2=dx*dx+dy*dy;
 if(!(len2>1e-18)||!finite(len2))
  throw new RangeError('positive finite C1 source paper line required');
 const len=Math.sqrt(len2),intervals=[];
 const fraction=p=>((p.u-a.u)*dx+(p.v-a.v)*dy)/len2;
 const deviation=p=>Math.abs(dx*(p.v-a.v)-dy*(p.u-a.u))/len;
 for(const other of lines){
  if(other.standardLineStyle!==source.standardLineStyle)continue;
  if(deviation(other.from)>1e-8||deviation(other.to)>1e-8)continue;
  const lo=Math.max(0,Math.min(fraction(other.from),fraction(other.to))),
   hi=Math.min(1,Math.max(fraction(other.from),fraction(other.to)));
  if(hi>lo)intervals.push([lo,hi]);
 }
 const proof=exactCandidateIntervalCoverage([0,1],intervals);
 return {
  source,fullyCovered:proof.entireOriginalParameterIntervalCovered,
  uncoveredIntervals:proof.positiveLengthUncoveredIntervals,
  signedMatchingIntervalCount:intervals.length
 };
}
function auditC1IndependentReferenceLineParity({
 solved,referenceStrokes,view
}={}){
 if(solved?.schema!=='draftai-c1-reviewed-solid-vertex-v5/1'||
    solved?.singleOriginalV5Player!==true||
    !VIEWS.includes(view)||
    view!==solved.sceneResult?.missingView||
    !Array.isArray(solved.certifiedVisibleContourLineBindings)||
    !Array.isArray(solved.certifiedPhysicalLineBindings)||
    solved.revision!==solved.sceneResult?.revision)
  throw new TypeError('current actually solved C1 third-view M3/M5/sole V5 required');
 const refs=normalizeStrokes(referenceStrokes,'reference');
 if(refs.length===0)
  throw new TypeError('nonempty independent reference answer geometry required');
 const predicted=normalizeStrokes([
  ...solved.certifiedVisibleContourLineBindings
   .filter(line=>line.view===view).map(line=>({
    from:line.fromModelMm,to:line.toModelMm,
    standardLineStyle:line.standardLineStyle
   })),
  ...solved.certifiedPhysicalLineBindings
   .filter(line=>line.view===view).map(line=>({
    from:line.fromModelMm,to:line.toModelMm,
    standardLineStyle:line.standardLineStyle
   }))
 ],'officially signed original V5 result');
 const signedActionIds=[
  ...solved.certifiedVisibleContourLineBindings,
  ...solved.certifiedPhysicalLineBindings
 ].filter(line=>line.view===view).map(line=>line.actionId);
 const actualStepActions=new Set((solved.steps||[])
  .flatMap(step=>step.actions||[]).map(action=>action.id));
 if(signedActionIds.length!==new Set(signedActionIds).size||
    signedActionIds.some(id=>!actualStepActions.has(id)))
  throw new RangeError('reference cannot mask a missing original signed V5 action');
 const referenceCovered=refs.map(s=>exactSameStylePaperCoverage(s,predicted));
 const predictedCovered=predicted.map(s=>exactSameStylePaperCoverage(s,refs));
 const parity=referenceCovered.every(row=>row.fullyCovered)&&
  predictedCovered.every(row=>row.fullyCovered)&&
  predicted.length>0;
 const allPhysicalCertified=
  solved.physicalEdgeProof?.allDrawablePhysicalEdgeStylesCertified===true&&
  solved.globalVisibleContourProof?.allThreeViewsGlobalContourCertified===true;
 return frozen({
  schema:'draftai-c1-independent-textbook-reference-line-parity/1',
  sourceGeometryId:solved.sceneResult.geometry?.id,
  revision:solved.revision,view,
  predictedV5LineCount:predicted.length,referenceLineCount:refs.length,
  proofLevel:'exact-binary64-positive-paper-parameter-interval-union',
  everyReferenceLineCoveredBySignedV5Line:referenceCovered.every(x=>x.fullyCovered),
  everySignedV5LineCoveredByReferenceLine:predictedCovered.every(x=>x.fullyCovered),
  independentlyM5SignedCompletePhysicalDrawingAvailable:allPhysicalCertified,
  strictlyStyledThirdViewPaperParityVerified:parity&&allPhysicalCertified,
  referenceCoverage:referenceCovered,predictedCoverage:predictedCovered,
  referenceWasNotUsedToSolveGeometry:true,
  suppliedReferenceOriginalDWGHashAuthenticatedHere:false,
  convertedDXFReferenceHandleIsolationAuthenticatedHere:false,
  realTextbookBlindTestPassed:false,
  completeC1DeliveryAuthorized:false
 });
}
module.exports={auditC1IndependentReferenceLineParity,
 exactSameStylePaperCoverage};
