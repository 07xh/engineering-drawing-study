'use strict';
/**
 * Compare arrow-shaped local pixels with the PROPOSED far end of an
 * OCR-to-curve leader stroke. This is evidence linkage, never verified ink
 * topology, a proved arrowhead or a confirmed mathematical dimension.
 */
function leaderArrowHint(leader,arrows){
 if(!leader||!Array.isArray(arrows)||arrows.length>30)return null;
 let id,endpoint;
 if(leader.hypothesis==='unverified-leader-endpoint-to-bbox-outline'){
  id=leader.leaderCandidateId;
  endpoint=leader.orientation==='from-text-to-tip'?'to':
   leader.orientation==='to-text-to-tip'?'from':null;
 }else if(leader.hypothesis==='two-finite-stroke-bent-leader-unverified'){
  id=leader.secondLeaderCandidateId;
  endpoint=leader.finalTipEndpoint;
 }
 if(!/^line_[0-9]+$/.test(id||'')||
  !['from','to'].includes(endpoint))return null;
 const found=arrows.find(a=>a&&a.shaftCandidateId===id&&
  a.endpoint===endpoint&&a.coordinateSpace==='original-image-px'&&
  a.arrowheadVerified===false&&a.requiresHumanReview===true&&
  Number.isFinite(a.heuristicScore)&&a.heuristicScore>=0&&
  a.heuristicScore<=1);
 if(!found)return null;
 return Object.freeze({
  shaftCandidateId:id,endpoint,
  heuristicScore:found.heuristicScore,
  hypothesis:'local-v-wing-pixel-evidence-only',
  arrowheadVerified:false,dimensionConfirmed:false,
  requiresHumanReview:true
 });
}
module.exports={leaderArrowHint};
