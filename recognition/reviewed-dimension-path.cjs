'use strict';
/**
 * 08: EXISTING OCR -> finite line(s) -> optional V-wing -> circle/arc
 * hypotheses collected for EXPLICIT user review. Not a detection engine.
 * Image-px proximity, even with a V-shaped tip, proves neither arrow
 * semantics, drawing scale, calibrated geometry nor solved constraints.
 */
const {validateOcrDimension}=require('./reviewed-image-dimension-field.cjs');
const {parseNotation}=require('./dimension-notation-candidates.cjs');
const {rankLeaderLineLinks}=require('./dimension-leader-association.cjs');
const {bentLeaderCandidates}=require('./bent-leader-candidates.cjs');
const {rankDimensionLinks}=require('./dimension-notation-candidates.cjs');
const {leaderArrowHint}=require('./arrow-leader-evidence.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const picture=x=>object(x)&&Number.isSafeInteger(x.width)&&
 Number.isSafeInteger(x.height)&&x.width>=24&&x.height>=24&&
 x.width<=10000&&x.height<=10000&&x.width*x.height<=5e7;
const allowedId=(id,prefix)=>typeof id==='string'&&
 new RegExp('^'+prefix+'_[0-9]+$').test(id);
const box=(b,image)=>Array.isArray(b)&&b.length===4&&b.every(finite)&&
 b[0]>=0&&b[1]>=0&&b[2]>0&&b[3]>0&&
 b[0]+b[2]<=image.width&&b[1]+b[3]<=image.height;
const inBounds=(p,image)=>object(p)&&finite(p.x)&&finite(p.y)&&
 p.x>=0&&p.y>=0&&p.x<=image.width&&p.y<=image.height;
const rounded=(a,b)=>Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b));
function validateCollection(lines,curves,arrows,image){
 if(!Array.isArray(lines)||lines.length>40||
    !Array.isArray(curves)||curves.length>50||
    !Array.isArray(arrows)||arrows.length>30)
  throw new TypeError('bounded local line/curve/arrow candidates required');
 const lineIDs=new Set(),curveIDs=new Set();
 for(const line of lines){
  if(!object(line)||line.kind!=='line'||!allowedId(line.id,'line')||
   lineIDs.has(line.id)||line.coordinateSpace!=='original-image-px'||
   !box(line.bbox,image)||!inBounds(line.from,image)||
   !inBounds(line.to,image)||Math.hypot(line.from.x-line.to.x,
    line.from.y-line.to.y)<12||line.confirmed===true)
   throw new TypeError('invalid unconfirmed finite line candidate');
  lineIDs.add(line.id);
 }
 for(const curve of curves){
  if(!object(curve)||!['circle','arc'].includes(curve.kind)||
    !allowedId(curve.id,'curve')||curveIDs.has(curve.id)||
    curve.coordinateSpace!=='original-image-px'||
    !box(curve.bbox,image)||curve.confirmed===true)
   throw new TypeError('invalid unconfirmed curve candidate');
  curveIDs.add(curve.id);
 }
 const seenArrows=new Set();
 for(const arrow of arrows){
  const key=arrow?.shaftCandidateId+'|'+arrow?.endpoint;
  if(!object(arrow)||!lineIDs.has(arrow.shaftCandidateId)||
    !['from','to'].includes(arrow.endpoint)||
    arrow.coordinateSpace!=='original-image-px'||
    arrow.arrowheadVerified!==false||
    arrow.requiresHumanReview!==true||
    !finite(arrow.heuristicScore)||arrow.heuristicScore<0||
    arrow.heuristicScore>1||seenArrows.has(key))
   throw new TypeError('invalid or forged unverified V-wing candidate');
  seenArrows.add(key);
 }
}
function proposeDimensionPaths({dimension,lines=[],curves=[],arrows=[],image}={}){
 if(!picture(image))throw new RangeError('bounded original image dimensions required');
 const d=validateOcrDimension(dimension,image);
 const parsed=parseNotation(d.sourceText);
 if(!parsed||parsed.dimensionKind!==d.dimensionKind||
    !finite(dimension.proposedRadiusValue)||
    !rounded(dimension.proposedRadiusValue,parsed.proposedRadiusValue))
  throw new TypeError('OCR text interpretation must agree with source candidate');
 validateCollection(lines,curves,arrows,image);
 const list=[],seen=new Set();
 function collect(pathKind,links){
  for(const link of links){
   const curve=curves.find(x=>x.id===link.geometryCandidateId);
   if(!curve)continue;
   const pathLines=pathKind==='straight'?[link.leaderCandidateId]:
    pathKind==='bent'?[link.firstLeaderCandidateId,
     link.secondLeaderCandidateId]:[];
   const id='review:'+pathKind+':'+d.id+':'+pathLines.join('+')+
    ':'+curve.id;
   if(seen.has(id))continue;
   seen.add(id);
   const arrow=pathKind==='proximity'?null:leaderArrowHint(link,arrows);
   list.push(Object.freeze({
    id,ocrCandidateId:d.id,curveCandidateId:curve.id,
    curveKind:curve.kind,leaderCandidateIds:Object.freeze(pathLines),
    pathKind,coordinateSpace:'original-image-px',
    sourceImageBox:Object.freeze([...dimension.bbox]),
    sourceCurveBox:Object.freeze([...curve.bbox]),
    endpointErrorPx:pathKind==='proximity'?
      link.separationPx:link.totalEndpointErrorPx,
    arrowHint:arrow?Object.freeze({...arrow}):null,
    arrowheadVerified:false,geometryConfirmed:false,
    labelLinkedToCurveVerified:false,metricGeometryVerified:false,
    requiresHumanReview:true
   }));
  }
 }
 collect('straight',rankLeaderLineLinks(dimension,lines,curves,image));
 collect('bent',bentLeaderCandidates(dimension,lines,curves,image));
 collect('proximity',rankDimensionLinks(dimension,curves,image));
 const priority={straight:0,bent:1,proximity:2};
 list.sort((a,b)=>priority[a.pathKind]-priority[b.pathKind]||
  a.endpointErrorPx-b.endpointErrorPx||a.id.localeCompare(b.id));
 return Object.freeze({
  status:'reviewable-image-paths',ocrCandidateId:d.id,
  proposals:Object.freeze(list),candidateCount:list.length,
  sourceImage:{width:image.width,height:image.height},
  automaticallySelected:false,modelUnitVerified:false,
  solverReady:false,globallyUnique:null
 });
}
/**
 * Regenerates source hypotheses instead of trusting a supplied "verified"
 * client object. User review certifies only the selected source association;
 * it is NOT an automated arrow/line/arc geometry proof.
 */
function reviewDimensionPath({dimension,lines=[],curves=[],arrows=[],image,
 selectedPathId,sourceEpoch,currentSourceEpoch,expectedRevision,revision,
 reviewedTextValueMm,unitsConfirmed=false,textConfirmed=false,
 pathConfirmed=false,curveConfirmed=false,arrowReviewed=false,
 finalAccepted=false,answerMark='unknown'}={}){
 if(!Number.isSafeInteger(sourceEpoch)||sourceEpoch<0||
   sourceEpoch!==currentSourceEpoch||
   !Number.isSafeInteger(revision)||revision<0||
   revision!==expectedRevision)
  throw new RangeError('stale source image or candidate revision');
 if(!['unknown','contains-answers','no-visible-answers'].includes(answerMark))
  throw new TypeError('explicit answer-marking review state required');
 const found=proposeDimensionPaths({dimension,lines,curves,arrows,image});
 const selected=found.proposals.find(x=>x.id===selectedPathId);
 if(!selected)throw new TypeError('select an existing source-linked path');
 if(textConfirmed!==true||unitsConfirmed!==true||
   pathConfirmed!==true||curveConfirmed!==true||finalAccepted!==true)
  throw new TypeError('text, metric unit, leader/path, curve and final user review required');
 // A V-wing candidate is merely a hint: the reviewer must separately
 // inspect and accept its association, or select a path with no arrow hint.
 if(selected.arrowHint&&arrowReviewed!==true)
  throw new TypeError('candidate V-wing requires separate manual review');
 if(!finite(reviewedTextValueMm)||reviewedTextValueMm<=0||
    reviewedTextValueMm>100000)
  throw new RangeError('positive bounded corrected text value (mm) required');
 const radiusMm=dimension.dimensionKind==='diameter'?
  reviewedTextValueMm/2:reviewedTextValueMm;
 return Object.freeze({
  status:'reviewed-source-association',revision,sourceEpoch,
  selectedPathId:selected.id,dimensionCandidateId:dimension.id,
  curveCandidateId:selected.curveCandidateId,curveKind:selected.curveKind,
  leaderCandidateIds:Object.freeze([...selected.leaderCandidateIds]),
  pathKind:selected.pathKind,
  arrowEvidenceReviewed:!!selected.arrowHint&&arrowReviewed,
  reviewedTextValueMm,dimensionKind:dimension.dimensionKind,
  proposedRadiusMm:radiusMm,unit:'mm',
  originalImageBox:selected.sourceImageBox,
  curveImageBox:selected.sourceCurveBox,
  sourcePixelGeometryOnly:true,
  sourceLinkManuallyAccepted:true,arrowheadMathematicallyProven:false,
  geometryMetricScaleCertified:false,coneBaseIdentityCertified:false,
  mathematicalConstraintReady:false,solveTriggered:false,v5Triggered:false,
  answerMark,
  independentBlindTestPassed:false,
  answerIsolationVerified:false,mathematicalProof:false,
  globallyUnique:null
 });
}
module.exports={proposeDimensionPaths,reviewDimensionPath};
