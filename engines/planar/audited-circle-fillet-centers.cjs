'use strict';
/**
 * V3.8 02 opt-in real-consumer integration of the single M2 residual audit.
 * Recompute actual bounded-source 02 fillet candidates, independently
 * recheck their two analytic model-mm center loci, never infer uniqueness,
 * G1 continuity, source-image accuracy or approved V5 construction.
 */
const {normalizeProblem,solveFiniteFillet}=
 require('../constraints-2d/finite-fillet-gate.cjs');
const {auditPlanarCandidates}=require('../../core/verification/planar-candidate-audit.cjs');

function radiusLocus(given,filletRadius,mode){
 const radius=mode==='internal'?
  Math.abs(given.radius-filletRadius):given.radius+filletRadius;
 if(!Number.isFinite(radius))throw new RangeError('nonfinite auxiliary circle radius');
 return radius;
}

function auditRealCircleFilletCenters(problem,{
 expectedRevision,absoluteToleranceMm,relativeTolerance=0,featureScaleMm
}={}){
 const typed=normalizeProblem(problem);
 if(typed.kind!=='two-circles')
  throw new TypeError('this 02 consumer only supports two given circles');
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==typed.revision)
  throw new RangeError('current reviewed problem revision required');
 const solved=solveFiniteFillet(typed);
 // The 02 gate is the sole authority for actual candidate identity, finite
 // source-arc clipping and chosen inner/outer tangency assumptions.
 const first=typed.geometry.first,second=typed.geometry.second;
 const mode1=typed.options.firstMode??'external';
 const mode2=typed.options.secondMode??'external';
 const ra=radiusLocus(first,typed.filletRadius,mode1);
 const rb=radiusLocus(second,typed.filletRadius,mode2);
 const sourceStatus=solved.status;
 // Degenerate zero-radius loci are not full circle equations; don't
 // transmute the professional solver's coincident/none state into a proof.
 if(ra===0||rb===0){
  if(solved.candidates.length)
   throw new RangeError('zero-radius locus cannot certify a discrete fillet branch');
  return Object.freeze({schema:'draftai-audited-real-circle-fillet/1',
   status:'unsupported-degenerate-locus',sourceStatus,sourceRevision:typed.revision,
   candidateCount:0,branchIds:Object.freeze([]),numericEvidence:null,
   suitableForV5:false,independentGlobalProof:false,globallyUnique:null});
 }
 const locus=(id,c,radius)=>({
  id,kind:'circle',frame:'model-mm-2d',unit:'mm',x:c.x,y:c.y,r:radius
 });
 const proof=auditPlanarCandidates({
  primitives:[
   locus('first-center-locus',first.center,ra),
   locus('second-center-locus',second.center,rb)
  ],
  candidates:solved.candidates.map(c=>({id:c.branchId,point:c.center})),
  sourceRevision:typed.revision,
  featureScaleMm,absoluteToleranceMm,relativeTolerance
 });
 const matched=proof.status==='within-declared-tolerances'&&
   ['unique','multiple'].includes(sourceStatus)&&
   solved.candidates.length>0&&solved.candidates.length===proof.candidates.length;
 return Object.freeze({
  schema:'draftai-audited-real-circle-fillet/1',
  status:matched?'candidate-loci-consistent':'not-certified',
  sourceStatus,sourceRevision:typed.revision,
  candidateCount:solved.candidates.length,
  branchIds:Object.freeze(solved.candidates.map(c=>c.branchId)),
  numericEvidence:proof,
  // 02 source-arc membership and center loci alone cannot determine sweep.
  suitableForV5:false,independentGlobalProof:false,globallyUnique:null
 });
}
module.exports={auditRealCircleFilletCenters};
