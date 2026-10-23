'use strict';
/**
 * 09: post-review independent mathematical/ConstructionIntent/V5 audit.
 *
 * Input MUST originate from the existing typed M3 gate. This audit does not
 * parse photos, perform OCR, import CAD answers, select a branch, or authorize
 * an independent textbook blind pass. A local input photo + independently
 * confirmed no-answer status is a separate prerequisite not established by
 * synthetic code fixtures or a client-side declaration.
 *
 * The independent residuals use finite segment projection, signed normal
 * distance, source circle radii, and external center separation. They DO
 * NOT call the solver's own residual helper or read a reference answer.
 */
const {normalizeProblem,solveFiniteFillet}=
 require('../engines/constraints-2d/finite-fillet-gate.cjs');
const {confirmedFilletTimeline}=
 require('../workbench/v31-confirmed-fillet-v5.cjs');
const {assertVerifiedArcParity}=
 require('../workbench/verified-v5-arc-parity.cjs');
const Timeline=require('../workbench/teaching-timeline-v5.js');
const Motion=require('../workbench/teaching-motion-v5.js');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const point=x=>x!==null&&typeof x==='object'&&finite(x.x)&&finite(x.y);
const near=(a,b,tol)=>finite(a)&&finite(b)&&Math.abs(a-b)<=tol;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const bad=(status,reason)=>({
 status,reason,independentMathVerified:false,
 constructionStepParityVerified:false,v5FrameVerified:false,
 independentBlindTestPassed:false,globallyUnique:null
});
function independentSegmentCircleResidual(problem,candidate){
 const segment=problem.geometry.segment,circle=problem.geometry.circle;
 const A=segment.a,B=segment.b,P=candidate.contacts.first,
  Q=candidate.contacts.second,O=candidate.center,K=circle.center;
 if(![A,B,P,Q,O,K].every(point))throw new TypeError('finite model-mm geometry required');
 const vx=B.x-A.x,vy=B.y-A.y,len=Math.hypot(vx,vy);
 if(!finite(len)||len<=1e-12)throw new RangeError('degenerate source line');
 const ux=vx/len,uy=vy/len,fillet=problem.filletRadius;
 // Signed side: the source line is explicitly directed A -> B.
 const signedNormal=(vx*(O.y-A.y)-vy*(O.x-A.x))/len;
 const onSegment=((P.x-A.x)*ux+(P.y-A.y)*uy)/len;
 const expectedFoot={x:A.x+ux*((O.x-A.x)*ux+(O.y-A.y)*uy),
  y:A.y+uy*((O.x-A.x)*ux+(O.y-A.y)*uy)};
 const sourceDirection=dist(O,K);
 const expectedCircleContact={
  x:K.x+(O.x-K.x)*(circle.radius/sourceDirection),
  y:K.y+(O.y-K.y)*(circle.radius/sourceDirection)
 };
 const residuals={
  sideMm:Math.abs(signedNormal-(problem.options.side??1)*fillet),
  lineContactMm:dist(P,expectedFoot),
  finiteLineOutsideMm:Math.max(0,-onSegment,onSegment-1)*len,
  sourceCircleRadiusMm:Math.abs(dist(Q,K)-circle.radius),
  filletContactCircleMm:Math.abs(dist(Q,O)-fillet),
  externalCenterSeparationMm:Math.abs(sourceDirection-(circle.radius+fillet)),
  externalContactAlignmentMm:dist(Q,expectedCircleContact)
 };
 const maxMm=Math.max(...Object.values(residuals));
 const toleranceMm=Math.max(1e-7,1e-8*Math.max(len,fillet,circle.radius,sourceDirection));
 return Object.freeze({residuals,maxResidualMm:maxMm,toleranceMm,
  independentPass:maxMm<=toleranceMm});
}
function auditPhotoFilletMathAndV5({problem,selection,sheet,
 sourceClass='unknown',answerReference}={}){
 // There is intentionally no API that can upgrade blind-test success.
 // A textbook image containing marked answers must remain separate.
 if(!['unknown','original-question-unverified',
      'original-no-answer-independently-reviewed',
      'answer-marked-reference','synthetic-fixture'].includes(sourceClass))
  return bad('source-role-invalid','unknown photograph/reference classification');
 if(answerReference!==undefined&&
    (typeof answerReference!=='object'||answerReference===null))
  return bad('answer-isolation-invalid','answer reference must be separate, never a model input');
 let p;
 try{p=normalizeProblem(problem)}
 catch(e){return bad('invalid-m3-input',e.message)}
 if(p.kind!=='segment-circle')
  return bad('unsupported-independent-oracle','independent line-circle oracle implemented first');
 const model=solveFiniteFillet(p);
 if(!['unique','multiple'].includes(model.status))
  return bad('no-discrete-m3-candidate','M3 status '+model.status);
 if(!selection||typeof selection.branchId!=='string'||!selection.branchId)
  return {...bad('branch-selection-required','no automatic branch even when one candidate'),candidateCount:model.candidateCount};
 const candidate=model.candidates.find(x=>x.branchId===selection.branchId);
 if(!candidate)
  return bad('branch-outside-m3-candidates','requested branch not in finite candidates');
 const oracle=independentSegmentCircleResidual(p,candidate);
 if(!oracle.independentPass)
  return {...bad('independent-math-residual-failed','finite geometry disagrees with independent equations'),
   independentOracle:oracle};
 let v5;
 try{v5=confirmedFilletTimeline({problem:p,selection,sheet})}
 catch(e){return {...bad('construction-or-v5-rejected',e.message),independentOracle:oracle}}
 if(v5.status!=='ready'||v5.mathematicallyVerified!==true)
  return {...bad('g1-or-travel-not-verified',v5.reason||v5.status),
   independentOracle:oracle,candidateCount:model.candidateCount};
 const intents=v5.constructionIntentPrototype,steps=v5.steps;
 if(!Array.isArray(intents)||!intents.length||
   !Array.isArray(steps)||intents.length!==steps.length||
   v5.typedMathEvidence?.branchId!==candidate.branchId||
   !near(v5.typedMathEvidence.center.x,candidate.center.x,1e-7)||
   !near(v5.typedMathEvidence.center.y,candidate.center.y,1e-7)||
   v5.typedMathEvidence.g1Verified!==true)
  return {...bad('construction-dag-mismatch','model branch and semantic DAG disagree'),
   independentOracle:oracle};
 const prev=new Set();
 for(let i=0;i<steps.length;i++){
  const step=steps[i],intent=intents[i];
  if(intent.id!==step.id||intent.branchId!==candidate.branchId||
   intent.sourceRevision!==p.revision||
   JSON.stringify(intent.dependsOn)!==JSON.stringify(step.dependsOn)||
   JSON.stringify(intent.outputEntityIds)!==
    JSON.stringify(step.actions.map(a=>a.id))||
   step.dependsOn.some(id=>!prev.has(id)))
   return {...bad('construction-dag-mismatch','revision/dependency/action identity mismatch'),
    independentOracle:oracle};
  prev.add(step.id);
 }
 const last=steps.at(-1).actions.find(a=>a.kind==='arc');
 if(!last||!v5.originalLesson?.result?.arc||
   !sheet||!point(sheet.origin)||!finite(sheet.scale)||sheet.scale<=0)
  return {...bad('no-proven-v5-arc','verified arc and screen transform required'),
   independentOracle:oracle};
 try{assertVerifiedArcParity({
  sourceArc:v5.originalLesson.result.arc,
  contacts:candidate.contacts,sheet,action:last
 })}
 catch(e){return {...bad('v5-projection-parity-failed',e.message),
   independentOracle:oracle}}
 const total=v5.timing?.totalMs;
 let ending;
 try{ending=Timeline.frame(v5.timing,total)}
 catch(e){return {...bad('v5-timing-invalid',e.message),independentOracle:oracle}}
 if(!finite(total)||total<=0||ending.done!==true||
   !Motion.actionShapeAttrs(last,1)?.d?.includes(' A '))
  return {...bad('v5-final-frame-invalid','final drawing must reach the proven arc endpoint'),
   independentOracle:oracle};
 return Object.freeze({
  status:sourceClass==='answer-marked-reference'?'answer-reference-excluded':
   sourceClass==='synthetic-fixture'?'fixture-only-parity-verified':
   'math-and-v5-verified-source-not-blind-certified',
  sourceClass,kind:p.kind,revision:p.revision,
  candidateCount:model.candidateCount,selectedBranchId:candidate.branchId,
  independentOracle:oracle,independentMathVerified:true,
  constructionStepParityVerified:true,v5FrameVerified:true,
  constructionStepCount:steps.length,semanticIntentCount:intents.length,
  singleV5TotalMs:total,
  sourcePhotoIndependentlyVerified:false,
  answerReferenceUsedForSolve:false,
  // Neither this library nor a client claim can independently inspect a
  // photographed textbook image for hidden printed solutions.
  independentBlindTestPassed:false,globallyUnique:null
 });
}
module.exports={independentSegmentCircleResidual,auditPhotoFilletMathAndV5};
