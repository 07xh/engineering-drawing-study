'use strict';
/**
 * A LOCAL, USER-EXPORTED evidence record for one selected original photo.
 * This is not an independent source-identity attestation, a network API or
 * an answer-aware math solver. No picture pixels, filename or blob URL.
 *
 * Positive math and V5 evidence is generated only by the existing M3 and
 * independently implemented post-solver auditor. No caller can set
 * "independentBlindTestPassed": true in this schema.
 */
const {validateDraft,draftReadiness}=
 require('../recognition/problem-draft.cjs');
const {reviewDimensionPath}=
 require('../recognition/reviewed-dimension-path.cjs');
const {normalizeProblem,solveFiniteFillet}=
 require('../engines/constraints-2d/finite-fillet-gate.cjs');
const {auditPhotoFilletMathAndV5}=
 require('./photo-fillet-independent-parity.cjs');
const SCHEMA='draftai-private-photo-case/1';
const hex=/^[a-f0-9]{64}$/;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const clone=x=>JSON.parse(JSON.stringify(x));
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const finiteTree=(x,seen=new Set())=>{
 if(typeof x==='number')return Number.isFinite(x);
 if(x===null||typeof x==='string'||typeof x==='boolean')return true;
 if(typeof x!=='object'||seen.has(x))return false;
 seen.add(x);
 const ok=(Array.isArray(x)?x:Object.values(x)).every(v=>finiteTree(v,seen));
 seen.delete(x);return ok;
};
function boundedImage(image){
 if(!plain(image)||!safe(image.width)||!safe(image.height)||
  image.width<32||image.height<32||image.width>10000||
  image.height>10000||image.width*image.height>50000000)
  throw new TypeError('source photo dimensions required');
 return {width:image.width,height:image.height};
}
function boundedCandidates(group){
 if(!plain(group))throw new TypeError('actual local detector candidate groups required');
 const result={};
 for(const [name,max] of [['lines',40],['curves',50],['arrows',30],['ocr',150]]){
  const source=group[name];
  if(!Array.isArray(source)||source.length>max)
   throw new RangeError('invalid bounded '+name+' candidate collection');
  const json=JSON.stringify(source);
  if(json.length>70000||!finiteTree(source))
   throw new RangeError('nonnumeric or oversized original-image candidate evidence');
  result[name]=clone(source);
 }
 return result;
}
function sameProblem(a,b){
 try{
  const left=normalizeProblem(a),right=normalizeProblem(b);
  // Actual V5 sessions increment a rendering revision independently of
  // the OCR/ProblemDraft revision. Geometry, units, modes and target radius
  // MUST still match exactly.
  delete left.revision;delete right.revision;
  return JSON.stringify(left)===JSON.stringify(right);
 }catch(_){return false}
}
function makePrivatePhotoCase({
 photoSha256,image,sourceRole='unknown',detectorCandidates,
 detectorGeneration,reviewedAssociation=null,acceptedDraft=null,
 calibration=null,preparedProblem=null,actualM3=null,
 liveInput=null,liveV5Ready=false
}={}){
 if(typeof photoSha256!=='string'||!hex.test(photoSha256))
  throw new TypeError('original photo SHA-256 required');
 const dimensions=boundedImage(image);
 if(!['unknown','asserted-unmarked-question','answer-marked-reference'].includes(sourceRole))
  throw new TypeError('source must be explicitly tagged, never automatically certified');
 if(!safe(detectorGeneration))
  throw new RangeError('current detector generation required');
 const proposals=boundedCandidates(detectorCandidates);
 const record={
  schema:SCHEMA,
  source:{sha256:photoSha256,image:dimensions,role:sourceRole,
   locallyFingerprintOnly:true,originalNoAnswerIndependentlyVerified:false,
   photoBytesIncluded:false,filenameIncluded:false},
  detection:{generation:detectorGeneration,
   coordinateSpace:'original-image-px',candidates:proposals,
   recognizedGeometryMathematicallyProven:false},
  status:'candidates-captured',review:null,math:null,animation:null,
  sourceCaseClosed:false,
  independentBlindTestPassed:false,acceptedTextbookProblemCount:0,
  answerReferenceIncluded:false,globallyUnique:null
 };
 if(reviewedAssociation===null&&acceptedDraft===null&&preparedProblem===null)
  return record;
 if(!reviewedAssociation||!plain(reviewedAssociation))
  throw new TypeError('review evidence missing for a math-bound source');
 const reviewed=reviewDimensionPath(reviewedAssociation);
 if(reviewed.answerMark==='contains-answers'&&
    sourceRole==='asserted-unmarked-question')
  throw new TypeError('marked-answer source cannot be relabeled as an unmarked original');
 if(!safe(reviewedAssociation.sourceEpoch)||
   reviewedAssociation.sourceEpoch!==reviewedAssociation.currentSourceEpoch||
   reviewed.imageEpoch!==undefined)
  throw new TypeError('stale source review epoch');
 const sourceIDs={
  line:new Set(proposals.lines.map(c=>c.id)),
  curve:new Set(proposals.curves.map(c=>c.id)),
  ocr:new Set(proposals.ocr.map(c=>c.id))
 };
 if(!sourceIDs.ocr.has(reviewed.dimensionCandidateId)||
    !sourceIDs.curve.has(reviewed.curveCandidateId)||
    reviewed.leaderCandidateIds.some(id=>!sourceIDs.line.has(id))||
    JSON.stringify(dimensions)!==JSON.stringify(reviewedAssociation.image))
  throw new TypeError('OCR, leader, circle and file dimensions must match detector evidence');
 record.review={
  sourceEpoch:reviewed.sourceEpoch,sourceRevision:reviewed.revision,
  selectedPathId:reviewed.selectedPathId,
  dimensionCandidateId:reviewed.dimensionCandidateId,
  curveCandidateId:reviewed.curveCandidateId,
  leaderCandidateIds:[...reviewed.leaderCandidateIds],
  answerMark:reviewed.answerMark,
  reviewedTextValueMm:reviewed.reviewedTextValueMm,
  dimensionKind:reviewed.dimensionKind,
  sourceLinkManuallyAccepted:true,
  alternativePathUniquenessCertified:false,
  mathematicallyCertified:false
 };
 record.status='source-association-reviewed';
 if(acceptedDraft===null&&preparedProblem===null)return record;
 if(!acceptedDraft||!calibration||!plain(calibration)||
    calibration.reviewedBy!=='user')
  throw new TypeError('versioned human-reviewed metric draft required');
 const draft=validateDraft(acceptedDraft);
 if(draft.image.width!==dimensions.width||
    draft.image.height!==dimensions.height||
    draft.revision<=reviewed.revision)
  throw new TypeError('current source image/draft revisions disagree');
 const dim=draft.candidates.find(c=>c.kind==='dimension'&&
  c.id===reviewed.dimensionCandidateId);
 if(dim?.reviewStatus!=='confirmed'||dim.dimension?.unit!=='mm'||
    dim.dimension?.refs?.length!==1||
    dim.dimension.refs[0]!==reviewed.curveCandidateId||
    dim.dimension.value!==reviewed.reviewedTextValueMm||
    dim.dimension.kind!==reviewed.dimensionKind||
    !finite(calibration.mmPerPx)||calibration.mmPerPx<=0||
    calibration.revision!==draft.revision)
  throw new TypeError('reviewed dimension/scale must match current ProblemDraft');
 const readiness=draftReadiness(draft);
 record.review.draftRevision=draft.revision;
 record.review.draft=clone(draft);
 record.review.calibration=clone(calibration);
 record.review.draftReadiness=readiness.status;
 record.status=readiness.status==='candidate-reviewed'?
  'metric-draft-reviewed':'draft-has-unreviewed-candidates';
 if(preparedProblem===null)return record;
 if(readiness.status!=='candidate-reviewed')
  throw new TypeError('M3 cannot consume unreviewed draft candidates');
 const p=normalizeProblem(preparedProblem);
 if(p.revision!==draft.revision)
  throw new RangeError('M3 input does not belong to reviewed draft revision');
 if(p.kind!=='segment-circle')
  throw new TypeError('this independent case audit currently handles finite segment-circle only');
 const model=solveFiniteFillet(p);
 if(actualM3&&
   (actualM3.status!==model.status||
    actualM3.candidateCount!==model.candidateCount||
    JSON.stringify(actualM3.candidates?.map(x=>x.branchId))!==
      JSON.stringify(model.candidates.map(x=>x.branchId))))
  throw new TypeError('recorded M3 candidates disagree with live professional solver');
 record.math={
  typedInput:p,status:model.status,candidateCount:model.candidateCount,
  branchIds:model.candidates.map(c=>c.branchId),
  selectedBranchId:null,independentResidualVerified:false
 };
 record.status='m3-solved-requires-branch-and-g1';
 if(liveInput===null||liveV5Ready!==true)return record;
 if(!plain(liveInput)||!sameProblem(p,liveInput.problem))
  throw new RangeError('live V5 input is stale against reviewed photo/M3 model');
 const audited=auditPhotoFilletMathAndV5({
  problem:liveInput.problem,selection:liveInput.selection,
  sheet:liveInput.sheet,
  sourceClass:sourceRole==='answer-marked-reference'?
   'answer-marked-reference':'original-question-unverified'
 });
 record.math.selectedBranchId=audited.selectedBranchId??null;
 record.math.independentResidualVerified=audited.independentMathVerified===true;
 record.math.independentOracle=audited.independentOracle??null;
 record.animation={
  status:audited.status,
  constructionStepParityVerified:audited.constructionStepParityVerified===true,
  v5FrameVerified:audited.v5FrameVerified===true,
  constructionStepCount:audited.constructionStepCount??0,
  sourceV5Revision:liveInput.problem.revision,
  singleV5TotalMs:audited.singleV5TotalMs??null
 };
 record.status=audited.v5FrameVerified===true&&
  audited.constructionStepParityVerified===true&&
  audited.independentMathVerified===true?
  (sourceRole==='answer-marked-reference'?
   'answer-marked-excluded-from-blind':'math-construction-v5-parity-verified-not-blind'):
  'v5-evidence-incomplete';
 return record;
}
module.exports={SCHEMA,makePrivatePhotoCase,sameProblem};
